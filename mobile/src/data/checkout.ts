// Paymob checkout. The backend creates a payment intention, the parent finishes on Paymob's hosted page in an
// in-app browser, and Paymob's signed webhook to the backend is what marks the invoice paid. The redirect back
// into the app only tells us to go and ask.

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { api, type OnlineMethod, type RemotePayment } from './api';

/** Route the backend sends the browser back to: src/app/payment-return.tsx. */
export const RETURN_PATH = 'payment-return';

export type CheckoutResult = { payment: RemotePayment; returned: boolean };

export async function payOnline(invoiceId: string, method: OnlineMethod, onOpen?: () => void): Promise<CheckoutResult> {
  const returnUrl = Linking.createURL(RETURN_PATH);
  const { paymentId, checkoutUrl } = await api.startPayment(invoiceId, method, returnUrl);
  onOpen?.();
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);
  const returned = result.type === 'success';
  // Closing the page early is normal for kiosk payments, where the reference number is all the parent needs,
  // so check either way, just not for as long.
  return { payment: await followPayment(paymentId, returned ? 8 : 2), returned };
}

/** Polls until Paymob's webhook has reached the backend, or gives up and returns the last state seen. */
export async function followPayment(paymentId: string, tries = 8): Promise<RemotePayment> {
  let p = await api.payment(paymentId);
  for (let i = 1; i < tries && p.status === 'created'; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    p = await api.payment(paymentId);
  }
  return p;
}
