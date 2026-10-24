// Paymob Egypt: Intention API, Unified Checkout and transaction-callback HMAC.
// Reference: Paymob's official "Intention APIs" Postman collection (github.com/PaymobAccept/API-Postman-Collections)
// and developers.paymob.com → Webhook callbacks and HMAC → HMAC Transaction Callback.

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymobConfig } from './config.ts';

export type IntentionRequest = {
  amount: number; // cents; must equal the sum of item amounts
  currency: string;
  payment_methods: number[]; // integration IDs
  items: { name: string; amount: number; description?: string; quantity: number }[];
  billing_data: { first_name: string; last_name: string; email: string; phone_number: string };
  special_reference: string; // returned in callbacks as order.merchant_order_id
  notification_url: string; // transaction processed callback (server to server)
  redirection_url: string; // where the parent's browser goes afterwards (cards and wallets)
  extras?: Record<string, string | number>;
};

export type IntentionResponse = {
  id: string;
  client_secret: string;
  intention_order_id: number;
  status: string;
};

/** The `obj` of a TRANSACTION processed callback. Only the fields we read or sign are typed. */
export type Transaction = {
  id: number;
  amount_cents: number;
  currency: string;
  created_at: string;
  success: boolean;
  pending: boolean;
  error_occured: boolean;
  has_parent_transaction: boolean;
  integration_id: number;
  is_3d_secure: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_refunded: boolean;
  is_standalone_payment: boolean;
  is_voided: boolean;
  owner: number;
  order: { id: number; merchant_order_id?: string | null };
  source_data?: { pan?: string | null; sub_type?: string | null; type?: string | null };
  data?: { message?: string; bill_reference?: string | number | null };
};

export type Paymob = {
  createIntention(body: IntentionRequest): Promise<IntentionResponse>;
  checkoutUrl(clientSecret: string): string;
};

export class PaymobError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function createPaymob(cfg: PaymobConfig): Paymob {
  return {
    async createIntention(body) {
      const res = await fetch(`${cfg.apiBase}/v1/intention/`, {
        method: 'POST',
        headers: { Authorization: `Token ${cfg.secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      const text = await res.text();
      if (!res.ok) throw new PaymobError(res.status, `Paymob ${res.status}: ${text.slice(0, 500)}`);
      const data = JSON.parse(text) as IntentionResponse;
      if (!data.client_secret) throw new PaymobError(res.status, 'Paymob response had no client_secret');
      return data;
    },
    checkoutUrl(clientSecret) {
      const url = new URL(cfg.checkoutUrl);
      url.searchParams.set('publicKey', cfg.publicKey);
      url.searchParams.set('clientSecret', clientSecret);
      return url.toString();
    },
  };
}

// ---------- Callback signature ----------

/** Fields Paymob signs, in order. Values are concatenated with no separator and hashed with HMAC-SHA512. */
const HMAC_FIELDS = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
] as const;

const at = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((v, k) => (v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined), obj);

// Booleans become "true"/"false" and numbers their digits, which is what String() gives; missing values sign as "".
const text = (v: unknown) => (v === null || v === undefined ? '' : String(v));

export function transactionHmac(tx: Transaction, secret: string): string {
  const signed = HMAC_FIELDS.map((f) => text(at(tx, f))).join('');
  return createHmac('sha512', secret).update(signed).digest('hex');
}

export function verifyTransactionHmac(tx: Transaction, received: string | undefined, secret: string): boolean {
  if (!received) return false;
  const expected = Buffer.from(transactionHmac(tx, secret));
  const got = Buffer.from(received.trim().toLowerCase());
  return expected.length === got.length && timingSafeEqual(expected, got);
}
