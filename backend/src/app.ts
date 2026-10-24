import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import type { Invoice, Payment } from './db.ts';
import { verifyTransactionHmac, type Transaction } from './paymob.ts';
import { ApiError, applyTransaction, startPayment, type Deps } from './payments.ts';

const publicInvoice = (i: Invoice) => ({ id: i.id, status: i.status, paidVia: i.paid_via, paidAt: i.paid_at });
const publicPayment = (p: Payment) => ({
  id: p.id,
  invoiceId: p.invoice_id,
  method: p.method,
  status: p.status,
  billReference: p.bill_reference,
});

export function createApp(deps: Deps) {
  const { config, db } = deps;
  const app = new Hono();

  app.onError((err, c) => {
    if (err instanceof ApiError) return c.json({ error: err.code, message: err.message }, err.status);
    console.error(err);
    return c.json({ error: 'internal', message: 'Something went wrong' }, 500);
  });

  app.get('/health', (c) => c.json({ ok: true }));

  // ---------- Called by the app ----------
  // TODO before production: authenticate the parent and check the invoice belongs to them.

  app.use('/api/*', cors({ origin: config.corsOrigins }));

  app.get('/api/invoices', (c) => {
    const childId = c.req.query('childId');
    if (!childId) throw new ApiError(400, 'invalid_request', 'childId is required');
    return c.json({ invoices: db.invoicesForChild(childId).map(publicInvoice) });
  });

  app.post('/api/payments', async (c) => {
    const body = await c.req.json().catch(() => null);
    return c.json(await startPayment(deps, body), 201);
  });

  app.get('/api/payments/:id', (c) => {
    const p = db.payment(c.req.param('id'));
    if (!p) throw new ApiError(404, 'not_found', 'Payment not found');
    return c.json(publicPayment(p));
  });

  // ---------- Called by Paymob ----------

  // Transaction processed callback. This is the only thing that marks an invoice paid.
  app.post('/paymob/webhook', async (c) => {
    const payload = await c.req.text();
    let body: { type?: string; obj?: Transaction } | null;
    try {
      body = JSON.parse(payload);
    } catch {
      return c.json({ error: 'invalid_json' }, 400);
    }
    if (body?.type !== 'TRANSACTION' || !body.obj) return c.json({ ignored: true }); // e.g. saved-card TOKEN callbacks
    if (!verifyTransactionHmac(body.obj, c.req.query('hmac'), config.paymob.hmacSecret)) {
      console.warn(`[paymob] rejected callback for transaction ${body.obj.id}: HMAC mismatch`);
      return c.json({ error: 'invalid_hmac' }, 401);
    }
    return c.json(applyTransaction(db, body.obj, payload));
  });

  // Transaction response callback: the parent's browser lands here after checkout. Nothing in its query string
  // is trusted; it only sends the parent back into the app, which then asks /api/payments/:id.
  const backToApp = (c: Context, paymentId: string | undefined) => {
    const p = paymentId ? db.payment(paymentId) : undefined;
    if (!p) return c.text('You can close this page and go back to the Dorosy app.', 404);
    const to = new URL(p.return_url);
    to.searchParams.set('payment', p.id);
    return c.redirect(to.toString(), 302);
  };
  app.get('/paymob/return/:id', (c) => backToApp(c, c.req.param('id')));
  // The same, for the response callback set on an integration in Paymob's dashboard. Paymob uses that one
  // instead of our per-payment URL for kiosk payments, and adds merchant_order_id, which is our payment ID.
  app.get('/paymob/return', (c) => backToApp(c, c.req.query('merchant_order_id')));

  return app;
}
