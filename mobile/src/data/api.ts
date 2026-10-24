// Dorosy backend (../backend). Payments go through it so the Paymob secret key never ships in the app.
// Without EXPO_PUBLIC_API_URL the app stays in demo mode and marks invoices paid locally.

import type { PayMethod } from './types';

const BASE = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

export const apiEnabled = !!BASE;

export type OnlineMethod = Extract<PayMethod, 'card' | 'wallet' | 'kiosk'>;
export const isOnlineMethod = (m: PayMethod): m is OnlineMethod => m === 'card' || m === 'wallet' || m === 'kiosk';

export type RemotePayment = {
  id: string;
  invoiceId: string;
  method: OnlineMethod;
  status: 'created' | 'pending' | 'paid' | 'failed';
  billReference: string | null;
};

export type RemoteInvoice = { id: string; status: 'open' | 'paid'; paidVia: PayMethod | null; paidAt: string | null };

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BASE) throw new ApiError(0, 'not_configured', 'EXPO_PUBLIC_API_URL is not set');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(`${BASE}${path}`, { ...init, signal: ctrl.signal });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, body.error ?? 'http_error', body.message ?? `HTTP ${res.status}`);
    return body as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, 'network', err instanceof Error ? err.message : String(err));
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  startPayment: (invoiceId: string, method: OnlineMethod, returnUrl: string) =>
    call<{ paymentId: string; checkoutUrl: string }>('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, method, returnUrl }),
    }),
  payment: (id: string) => call<RemotePayment>(`/api/payments/${encodeURIComponent(id)}`),
  invoices: (childId: string) =>
    call<{ invoices: RemoteInvoice[] }>(`/api/invoices?childId=${encodeURIComponent(childId)}`).then((r) => r.invoices),
};
