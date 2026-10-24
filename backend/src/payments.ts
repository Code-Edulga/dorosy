// Payment lifecycle. A payment is one attempt to settle one invoice through Paymob:
//   created  intention made, parent sent to checkout
//   pending  Paymob reported a payment in progress (a kiosk reference was issued but not paid yet)
//   paid     Paymob's signed callback confirmed it and the invoice is paid. Final.
//   failed   declined, or the intention could not be created. A later callback on the same order can still pay it.

import { randomUUID } from 'node:crypto';
import { ONLINE_METHODS, type Config, type OnlineMethod } from './config.ts';
import type { Db, Payment } from './db.ts';
import type { Paymob, Transaction } from './paymob.ts';

export type Deps = { config: Config; db: Db; paymob: Paymob };

export class ApiError extends Error {
  status: 400 | 404 | 409 | 502;
  code: string;
  constructor(status: ApiError['status'], code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function startPayment({ config, db, paymob }: Deps, input: unknown) {
  const { invoiceId, method, returnUrl } = (input ?? {}) as Record<string, unknown>;
  if (typeof invoiceId !== 'string' || !invoiceId) throw new ApiError(400, 'invalid_request', 'invoiceId is required');
  if (!ONLINE_METHODS.includes(method as OnlineMethod)) {
    throw new ApiError(400, 'invalid_request', `method must be one of: ${ONLINE_METHODS.join(', ')}`);
  }
  if (typeof returnUrl !== 'string' || returnUrl.length > 500 || !config.returnUrlPrefixes.some((p) => returnUrl.startsWith(p))) {
    throw new ApiError(400, 'invalid_return_url', 'returnUrl is not an allowed app link');
  }
  const m = method as OnlineMethod;
  const integrationId = config.paymob.integrations[m];
  if (!integrationId) throw new ApiError(400, 'method_unavailable', `${m} payments are not enabled`);

  // The amount always comes from our invoice, never from the app.
  const invoice = db.invoice(invoiceId);
  if (!invoice) throw new ApiError(404, 'not_found', 'Invoice not found');
  if (invoice.status === 'paid') throw new ApiError(409, 'already_paid', 'Invoice is already paid');
  const payer = db.payer(invoice.payer_id);
  if (!payer) throw new Error(`Invoice ${invoice.id} has no payer ${invoice.payer_id}`);

  const id = `pay_${randomUUID().replaceAll('-', '')}`;
  db.insertPayment({ id, invoice_id: invoice.id, method: m, amount_cents: invoice.amount_cents, currency: invoice.currency, return_url: returnUrl });

  try {
    const intention = await paymob.createIntention({
      amount: invoice.amount_cents,
      currency: invoice.currency,
      payment_methods: [integrationId],
      items: [{ name: invoice.description.slice(0, 50), amount: invoice.amount_cents, quantity: 1 }],
      billing_data: {
        first_name: payer.first_name,
        last_name: payer.last_name,
        email: payer.email ?? config.paymob.fallbackEmail,
        phone_number: payer.phone,
      },
      special_reference: id,
      notification_url: `${config.publicUrl}/paymob/webhook`,
      redirection_url: `${config.publicUrl}/paymob/return/${id}`,
      extras: { invoice_id: invoice.id },
    });
    db.updatePayment(id, { intention_id: intention.id, paymob_order_id: intention.intention_order_id });
    return { paymentId: id, checkoutUrl: paymob.checkoutUrl(intention.client_secret) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    db.updatePayment(id, { status: 'failed', note: message.slice(0, 500) });
    console.error(`[payments] could not create a Paymob intention for ${id}: ${message}`);
    throw new ApiError(502, 'paymob_unavailable', 'Could not start the payment with Paymob');
  }
}

export type Outcome = 'paid' | 'pending' | 'failed' | 'duplicate' | 'amount_mismatch' | 'already_paid' | 'ignored' | 'unknown_payment';

/** Applies a verified TRANSACTION callback. Safe to call again with the same callback: Paymob retries. */
export function applyTransaction(db: Db, tx: Transaction, payload: string): { outcome: Outcome; paymentId?: string } {
  return db.tx(() => {
    const ref = tx.order?.merchant_order_id;
    const payment = (ref ? db.payment(ref) : undefined) ?? (tx.order?.id ? db.paymentByOrder(tx.order.id) : undefined);
    const outcome = payment ? decide(db, payment, tx) : 'unknown_payment';
    db.logCallback({ transaction_id: tx.id ?? null, payment_id: payment?.id ?? null, outcome, payload });
    return { outcome, paymentId: payment?.id };
  });
}

function decide(db: Db, payment: Payment, tx: Transaction): Outcome {
  if (payment.status === 'paid') return 'already_paid';
  // Refunds, voids and captures arrive as child transactions. They're not handled yet; paymob_callbacks keeps them.
  if (tx.has_parent_transaction || tx.is_refunded || tx.is_voided) return 'ignored';

  if (tx.success && !tx.pending) {
    if (tx.amount_cents !== payment.amount_cents || tx.currency !== payment.currency) {
      const note = `Paid ${tx.amount_cents} ${tx.currency}, expected ${payment.amount_cents} ${payment.currency}`;
      console.warn(`[payments] ${payment.id}: ${note}`);
      db.updatePayment(payment.id, { status: 'failed', transaction_id: tx.id, note });
      return 'amount_mismatch';
    }
    const invoice = db.invoice(payment.invoice_id);
    if (invoice?.status === 'paid') {
      const note = `Invoice was already paid by ${invoice.payment_id}; refund this payment`;
      console.warn(`[payments] ${payment.id}: ${note}`);
      db.updatePayment(payment.id, { status: 'paid', transaction_id: tx.id, note });
      return 'duplicate';
    }
    db.updatePayment(payment.id, { status: 'paid', transaction_id: tx.id });
    db.markInvoicePaid(payment.invoice_id, payment.id, payment.method);
    return 'paid';
  }

  if (tx.pending) {
    const ref = tx.data?.bill_reference;
    db.updatePayment(payment.id, {
      status: 'pending',
      transaction_id: tx.id,
      bill_reference: ref === null || ref === undefined ? payment.bill_reference : String(ref),
    });
    return 'pending';
  }

  db.updatePayment(payment.id, { status: 'failed', transaction_id: tx.id, note: tx.data?.message?.slice(0, 500) ?? null });
  return 'failed';
}
