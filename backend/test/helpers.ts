import type { Config } from '../src/config.ts';
import type { IntentionRequest, Paymob, Transaction } from '../src/paymob.ts';

export const HMAC_SECRET = 'test_hmac_secret';

export const testConfig: Config = {
  port: 0,
  publicUrl: 'https://api.example.test',
  databasePath: ':memory:',
  seedDemoData: true,
  corsOrigins: ['http://localhost:8081'],
  returnUrlPrefixes: ['dorosy://', 'exp://'],
  paymob: {
    apiBase: 'https://accept.paymob.com',
    checkoutUrl: 'https://accept.paymob.com/unifiedcheckout/',
    secretKey: 'egy_sk_test_x',
    publicKey: 'egy_pk_test_x',
    hmacSecret: HMAC_SECRET,
    integrations: { card: 111, kiosk: 333 },
    fallbackEmail: 'payments@dorosy.app',
  },
};

/** Records intention requests and answers like Paymob's test mode. */
export function fakePaymob(opts: { fail?: boolean } = {}) {
  const calls: IntentionRequest[] = [];
  let order = 400000000;
  const paymob: Paymob = {
    async createIntention(body) {
      calls.push(body);
      if (opts.fail) throw new Error('Paymob 401: invalid secret key');
      return { id: `pi_test_${calls.length}`, client_secret: `egy_csk_test_${calls.length}`, intention_order_id: ++order, status: 'intended' };
    },
    checkoutUrl: (secret) => `https://accept.paymob.com/unifiedcheckout/?publicKey=egy_pk_test_x&clientSecret=${secret}`,
  };
  return { paymob, calls, lastOrderId: () => order };
}

/** A card sale as Paymob sends it in the processed callback's `obj`. */
export function transaction(over: Partial<Transaction> = {}): Transaction {
  return {
    id: 192036465,
    pending: false,
    amount_cents: 50000,
    success: true,
    is_auth: false,
    is_capture: false,
    is_standalone_payment: true,
    is_voided: false,
    is_refunded: false,
    is_3d_secure: true,
    integration_id: 111,
    has_parent_transaction: false,
    order: { id: 400000001, merchant_order_id: null },
    created_at: '2026-10-24T17:30:12.371012',
    currency: 'EGP',
    source_data: { pan: '2346', type: 'card', sub_type: 'MasterCard' },
    error_occured: false,
    owner: 302852,
    data: { message: 'Approved' },
    ...over,
  };
}
