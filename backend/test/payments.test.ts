import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import { createApp } from '../src/app.ts';
import { openDb, type Db } from '../src/db.ts';
import { transactionHmac, type Transaction } from '../src/paymob.ts';
import { seedDemo } from '../src/seed.ts';
import { HMAC_SECRET, fakePaymob, testConfig, transaction } from './helpers.ts';

const RETURN = 'dorosy://payment-return';

let db: Db;
let fake: ReturnType<typeof fakePaymob>;
let app: ReturnType<typeof createApp>;

function setup(opts: { fail?: boolean } = {}) {
  db = openDb(':memory:');
  seedDemo(db);
  fake = fakePaymob(opts);
  app = createApp({ config: testConfig, db, paymob: fake.paymob });
}

const post = (path: string, body: unknown) =>
  app.request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

async function start(invoiceId = 'inv2', method = 'card') {
  const res = await post('/api/payments', { invoiceId, method, returnUrl: RETURN });
  return { res, body: (await res.json()) as { paymentId: string; checkoutUrl: string; error?: string } };
}

function callback(tx: Transaction, hmac = transactionHmac(tx, HMAC_SECRET)) {
  return post(`/paymob/webhook?hmac=${hmac}`, { type: 'TRANSACTION', obj: tx });
}

const paymentStatus = async (id: string) => ((await (await app.request(`/api/payments/${id}`)).json()) as { status: string }).status;

describe('payments', () => {
  beforeEach(() => setup());

  test('creates a Paymob intention from the invoice, not from the app', async () => {
    const { res, body } = await start();
    assert.equal(res.status, 201);
    assert.match(body.checkoutUrl, /clientSecret=egy_csk_test_1/);
    const sent = fake.calls[0];
    assert.equal(sent.amount, 50000);
    assert.deepEqual(sent.payment_methods, [111]);
    assert.equal(sent.items.reduce((a, i) => a + i.amount, 0), sent.amount);
    assert.equal(sent.special_reference, body.paymentId);
    assert.equal(sent.notification_url, 'https://api.example.test/paymob/webhook');
    assert.equal(sent.billing_data.email, 'payments@dorosy.app');
    assert.equal(await paymentStatus(body.paymentId), 'created');
  });

  test('a signed success callback pays the invoice, and a replay changes nothing', async () => {
    const { body } = await start();
    const tx = transaction({ order: { id: fake.lastOrderId(), merchant_order_id: body.paymentId } });

    const first = await callback(tx);
    assert.equal(first.status, 200);
    assert.deepEqual(await first.json(), { outcome: 'paid', paymentId: body.paymentId });
    assert.equal(await paymentStatus(body.paymentId), 'paid');
    assert.equal(db.invoice('inv2')?.status, 'paid');
    assert.equal(db.invoice('inv2')?.paid_via, 'card');

    const replay = await callback(tx);
    assert.equal(((await replay.json()) as { outcome: string }).outcome, 'already_paid');

    const invoices = (await (await app.request('/api/invoices?childId=k1')).json()) as { invoices: { id: string; status: string }[] };
    assert.equal(invoices.invoices.find((i) => i.id === 'inv2')?.status, 'paid');
  });

  test('finds the payment by Paymob order ID when merchant_order_id is missing', async () => {
    const { body } = await start();
    const res = await callback(transaction({ order: { id: fake.lastOrderId() } }));
    assert.equal(((await res.json()) as { outcome: string }).outcome, 'paid');
    assert.equal(await paymentStatus(body.paymentId), 'paid');
  });

  test('rejects a callback with a bad signature', async () => {
    const { body } = await start();
    const tx = transaction({ order: { id: fake.lastOrderId(), merchant_order_id: body.paymentId } });
    const forged = transactionHmac({ ...tx, amount_cents: 1 }, HMAC_SECRET);
    assert.equal((await callback(tx, forged)).status, 401);
    assert.equal((await post('/paymob/webhook', { type: 'TRANSACTION', obj: tx })).status, 401);
    assert.equal(db.invoice('inv2')?.status, 'open');
  });

  test('does not pay when the amount differs from the invoice', async () => {
    const { body } = await start();
    const tx = transaction({ amount_cents: 100, order: { id: fake.lastOrderId(), merchant_order_id: body.paymentId } });
    assert.equal(((await (await callback(tx)).json()) as { outcome: string }).outcome, 'amount_mismatch');
    assert.equal(db.invoice('inv2')?.status, 'open');
  });

  test('a kiosk payment stays pending with its reference until Paymob confirms it', async () => {
    const { body } = await start('inv2', 'kiosk');
    const order = { id: fake.lastOrderId(), merchant_order_id: body.paymentId };
    const pending = transaction({ success: false, pending: true, integration_id: 333, order, data: { bill_reference: 7012345 } });
    await callback(pending);
    const p = (await (await app.request(`/api/payments/${body.paymentId}`)).json()) as { status: string; billReference: string };
    assert.equal(p.status, 'pending');
    assert.equal(p.billReference, '7012345');
    assert.equal(db.invoice('inv2')?.status, 'open');

    await callback({ ...pending, success: true, pending: false });
    assert.equal(db.invoice('inv2')?.status, 'paid');
    assert.equal(db.invoice('inv2')?.paid_via, 'kiosk');
  });

  test('a declined card marks the attempt failed and leaves the invoice open', async () => {
    const { body } = await start();
    const tx = transaction({ success: false, order: { id: fake.lastOrderId(), merchant_order_id: body.paymentId } });
    await callback(tx);
    assert.equal(await paymentStatus(body.paymentId), 'failed');
    assert.equal(db.invoice('inv2')?.status, 'open');
  });

  test('ignores refunds and other child transactions', async () => {
    const { body } = await start();
    const tx = transaction({ has_parent_transaction: true, is_refunded: true, order: { id: fake.lastOrderId(), merchant_order_id: body.paymentId } });
    assert.equal(((await (await callback(tx)).json()) as { outcome: string }).outcome, 'ignored');
    assert.equal(db.invoice('inv2')?.status, 'open');
  });

  test('flags a second successful payment for the same invoice for refund', async () => {
    const a = await start();
    const orderA = fake.lastOrderId();
    const b = await start();
    const orderB = fake.lastOrderId();
    await callback(transaction({ order: { id: orderA, merchant_order_id: a.body.paymentId } }));
    const res = await callback(transaction({ id: 192036466, order: { id: orderB, merchant_order_id: b.body.paymentId } }));
    assert.equal(((await res.json()) as { outcome: string }).outcome, 'duplicate');
    assert.match(db.payment(b.body.paymentId)?.note ?? '', /refund/);
    assert.equal(db.invoice('inv2')?.payment_id, a.body.paymentId);
  });

  test('sends the browser back into the app after checkout', async () => {
    const { body } = await start();
    const res = await app.request(`/paymob/return/${body.paymentId}?success=true&hmac=whatever`);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), `${RETURN}?payment=${body.paymentId}`);
    assert.equal(await paymentStatus(body.paymentId), 'created'); // the redirect itself proves nothing
  });

  test('the dashboard response callback finds the payment from merchant_order_id', async () => {
    const { body } = await start('inv2', 'kiosk');
    const res = await app.request(`/paymob/return?id=192036465&pending=true&merchant_order_id=${body.paymentId}&hmac=x`);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), `${RETURN}?payment=${body.paymentId}`);
    assert.equal((await app.request('/paymob/return?merchant_order_id=someone-else')).status, 404);
  });

  test('validates requests', async () => {
    assert.equal((await post('/api/payments', { invoiceId: 'inv2', method: 'card', returnUrl: 'https://evil.example' })).status, 400);
    assert.equal((await start('inv2', 'bitcoin')).res.status, 400);
    assert.equal((await start('inv2', 'wallet')).body.error, 'method_unavailable');
    assert.equal((await start('nope')).res.status, 404);
    assert.equal((await start('inv1')).res.status, 409);
    assert.equal(fake.calls.length, 0);
  });
});

describe('when Paymob is down', () => {
  beforeEach(() => setup({ fail: true }));

  test('returns 502 and records the failed attempt', async () => {
    const { res } = await start();
    assert.equal(res.status, 502);
    assert.equal(db.invoice('inv2')?.status, 'open');
  });
});
