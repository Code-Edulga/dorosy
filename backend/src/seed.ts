// Demo data with the same invoice IDs and amounts as mobile/src/data/mock.ts, so the app's demo invoices can be
// paid for real against Paymob's test mode. Replace with real invoices once instructors create them in the app.

import type { Db, Invoice } from './db.ts';

export function seedDemo(db: Db, now = new Date()): boolean {
  if (db.countInvoices() > 0) return false;

  const month = (offset: number) =>
    new Date(now.getFullYear(), now.getMonth() + offset, 1).toLocaleString('en', { month: 'long', year: 'numeric' });
  const invoice = (id: string, child: string, course: string, offset: number, egp: number, paidVia?: string): Invoice => ({
    id,
    child_id: child,
    payer_id: 'p1',
    description: `${course} — ${month(offset)}`,
    amount_cents: egp * 100,
    currency: 'EGP',
    status: paidVia ? 'paid' : 'open',
    paid_via: paidVia ?? null,
    paid_at: paidVia ? now.toISOString() : null,
    payment_id: null,
  });

  db.tx(() => {
    db.insertPayer({ id: 'p1', first_name: 'Mona', last_name: 'Abdelrahman', phone: '+201223344556', email: null });
    [
      invoice('inv1', 'k1', 'Grade 12 Physics', 0, 450, 'instapay'),
      invoice('inv2', 'k1', 'Grade 12 Mathematics', 0, 500),
      invoice('inv3', 'k1', 'Grade 12 Physics', 1, 450),
      invoice('inv4', 'k1', 'Grade 12 Physics', -1, 450, 'cash'),
      invoice('inv5', 'k2', 'Grade 11 Physics', 0, 400, 'wallet'),
      invoice('inv6', 'k2', 'Grade 11 Physics', 1, 400),
    ].forEach(db.insertInvoice);
  });
  return true;
}
