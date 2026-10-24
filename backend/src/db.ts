// SQLite through Node's built-in node:sqlite. Calls are synchronous, so a handler's reads and writes never
// interleave with another request's. Move to Postgres before running more than one server process.

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

export type PaymentStatus = 'created' | 'pending' | 'paid' | 'failed';

export type Payer = { id: string; first_name: string; last_name: string; phone: string; email: string | null };

export type Invoice = {
  id: string;
  child_id: string;
  payer_id: string;
  description: string;
  amount_cents: number;
  currency: string;
  status: 'open' | 'paid';
  paid_via: string | null;
  paid_at: string | null;
  payment_id: string | null;
};

export type Payment = {
  id: string; // ours; sent to Paymob as special_reference
  invoice_id: string;
  method: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  return_url: string;
  intention_id: string | null;
  paymob_order_id: number | null;
  transaction_id: number | null;
  bill_reference: string | null; // kiosk payments
  note: string | null;
  created_at: string;
  updated_at: string;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS payers (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT
);
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  payer_id TEXT NOT NULL REFERENCES payers(id),
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'EGP',
  status TEXT NOT NULL CHECK (status IN ('open', 'paid')),
  paid_via TEXT,
  paid_at TEXT,
  payment_id TEXT
);
CREATE INDEX IF NOT EXISTS invoices_child ON invoices(child_id);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  method TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created', 'pending', 'paid', 'failed')),
  return_url TEXT NOT NULL,
  intention_id TEXT,
  paymob_order_id INTEGER,
  transaction_id INTEGER,
  bill_reference TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS payments_order ON payments(paymob_order_id);
CREATE TABLE IF NOT EXISTS paymob_callbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER,
  payment_id TEXT,
  outcome TEXT NOT NULL,
  payload TEXT NOT NULL,
  received_at TEXT NOT NULL
);
`;

const UPDATABLE = ['status', 'intention_id', 'paymob_order_id', 'transaction_id', 'bill_reference', 'note'] as const;
type PaymentUpdate = Partial<Pick<Payment, (typeof UPDATABLE)[number]>>;

export type Db = ReturnType<typeof openDb>;

export function openDb(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);

  const one = <T>(sql: string) => {
    const st = db.prepare(sql);
    return (...p: SQLInputValue[]) => st.get(...p) as T | undefined;
  };
  const many = <T>(sql: string) => {
    const st = db.prepare(sql);
    return (...p: SQLInputValue[]) => st.all(...p) as T[];
  };
  const now = () => new Date().toISOString();

  return {
    payer: one<Payer>('SELECT * FROM payers WHERE id = ?'),
    invoice: one<Invoice>('SELECT * FROM invoices WHERE id = ?'),
    invoicesForChild: many<Invoice>('SELECT * FROM invoices WHERE child_id = ? ORDER BY id'),
    payment: one<Payment>('SELECT * FROM payments WHERE id = ?'),
    paymentByOrder: one<Payment>('SELECT * FROM payments WHERE paymob_order_id = ?'),
    countInvoices: () => (db.prepare('SELECT COUNT(*) AS n FROM invoices').get() as { n: number }).n,

    insertPayer(p: Payer) {
      db.prepare('INSERT INTO payers (id, first_name, last_name, phone, email) VALUES (?, ?, ?, ?, ?)').run(
        p.id,
        p.first_name,
        p.last_name,
        p.phone,
        p.email,
      );
    },

    insertInvoice(i: Invoice) {
      db.prepare(
        `INSERT INTO invoices (id, child_id, payer_id, description, amount_cents, currency, status, paid_via, paid_at, payment_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(i.id, i.child_id, i.payer_id, i.description, i.amount_cents, i.currency, i.status, i.paid_via, i.paid_at, i.payment_id);
    },

    insertPayment(p: Pick<Payment, 'id' | 'invoice_id' | 'method' | 'amount_cents' | 'currency' | 'return_url'>) {
      const t = now();
      db.prepare(
        `INSERT INTO payments (id, invoice_id, method, amount_cents, currency, status, return_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'created', ?, ?, ?)`,
      ).run(p.id, p.invoice_id, p.method, p.amount_cents, p.currency, p.return_url, t, t);
    },

    updatePayment(id: string, fields: PaymentUpdate) {
      const cols = UPDATABLE.filter((c) => c in fields);
      if (!cols.length) return;
      const values = cols.map((c) => fields[c] ?? null);
      db.prepare(`UPDATE payments SET ${cols.map((c) => `${c} = ?`).join(', ')}, updated_at = ? WHERE id = ?`).run(
        ...values,
        now(),
        id,
      );
    },

    markInvoicePaid(id: string, paymentId: string, method: string) {
      db.prepare(`UPDATE invoices SET status = 'paid', paid_via = ?, paid_at = ?, payment_id = ? WHERE id = ? AND status = 'open'`).run(
        method,
        now(),
        paymentId,
        id,
      );
    },

    logCallback(c: { transaction_id: number | null; payment_id: string | null; outcome: string; payload: string }) {
      db.prepare('INSERT INTO paymob_callbacks (transaction_id, payment_id, outcome, payload, received_at) VALUES (?, ?, ?, ?, ?)').run(
        c.transaction_id,
        c.payment_id,
        c.outcome,
        c.payload,
        now(),
      );
    },

    /** Runs fn inside BEGIN/COMMIT. fn must be synchronous. */
    tx<T>(fn: () => T): T {
      db.exec('BEGIN IMMEDIATE');
      try {
        const out = fn();
        db.exec('COMMIT');
        return out;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },

    close: () => db.close(),
  };
}
