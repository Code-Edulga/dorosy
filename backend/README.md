# Dorosy backend

Takes payments for Dorosy invoices through [Paymob](https://paymob.com) (Egypt). The app never holds a Paymob key. It asks this server to start a payment, and this server is the only thing that can mark an invoice paid.

Node 22.18 or newer runs the TypeScript directly, so there is no build step. It uses [Hono](https://hono.dev) for HTTP and Node's built-in `node:sqlite` for storage.

## How a payment works

```
app ──POST /api/payments──▶ backend ──create intention──▶ Paymob
app ◀── checkoutUrl ─────── backend
app opens checkoutUrl in an in-app browser; the parent pays on Paymob's page
Paymob ──POST /paymob/webhook?hmac=…──▶ backend   checks HMAC and amount, marks the invoice paid
Paymob ──browser to /paymob/return/:id──▶ backend ──302──▶ dorosy://payment-return?payment=…
app ──GET /api/payments/:id──▶ backend            shows paid / pending / failed
```

- The amount always comes from the invoice in the database, never from the app.
- Only the webhook changes payment state, after its HMAC-SHA512 signature checks out. The browser redirect carries no weight: it only brings the parent back into the app.
- Webhooks are idempotent. Paymob retries, and a replayed callback changes nothing.
- A kiosk payment (Aman or Masary) comes back as `pending` with a reference number. It turns `paid` when Paymob sends the second callback after the parent pays in cash.
- If a second payment succeeds for an invoice that is already paid, it is recorded with a "refund this payment" note and logged. Nothing refunds it automatically.

## Set up Paymob

1. In the [Paymob dashboard](https://accept.paymob.com), switch on **Test Mode**.
2. **Settings → API Keys**: copy the secret key and the public key.
3. **Settings → Account Info**: copy the HMAC secret.
4. **Developers → Payment Integrations**: copy the integration ID for each method you want: card, mobile wallet, kiosk.
5. `cp .env.example .env` and fill those in.

`PUBLIC_URL` must be an HTTPS address Paymob can reach. Locally, run a tunnel:

```bash
ngrok http 4000          # or: cloudflared tunnel --url http://localhost:4000
```

Then paste the tunnel URL into `PUBLIC_URL`. The server sends Paymob its webhook and redirect URLs with every payment. Set them on each integration too (**Developers → Payment Integrations → Edit**), because kiosk payments ignore the per-payment redirect:

- Transaction processed callback: `<PUBLIC_URL>/paymob/webhook`
- Transaction response callback: `<PUBLIC_URL>/paymob/return`

A free ngrok address changes every time ngrok restarts. If yours does, update `PUBLIC_URL` and these two fields, or claim ngrok's free static domain.

## Run it

```bash
npm install
npm run dev              # http://localhost:4000, restarts on change
npm test                 # HMAC and payment flow, against a fake Paymob
npm run typecheck
npm run db:reset         # wipe data/dorosy.db and seed the demo invoices again
```

On first start it seeds the demo invoices from `mobile/src/data/mock.ts`: same IDs, same amounts. Point the app at this server (`EXPO_PUBLIC_API_URL` in `mobile/.env`) and the overdue invoice can be paid end to end in test mode.

For test cards and wallet numbers, see Paymob's test credentials (developers.paymob.com → Need Help → Test Credentials). The "Unified checkout redirection" request in Paymob's [Postman collection](https://github.com/PaymobAccept/API-Postman-Collections) lists them too.

## API

| Method | Path | Called by | |
| --- | --- | --- | --- |
| `POST` | `/api/payments` | app | `{ invoiceId, method: "card" \| "wallet" \| "kiosk", returnUrl }` → `201 { paymentId, checkoutUrl }` |
| `GET` | `/api/payments/:id` | app | `{ id, invoiceId, method, status, billReference }`, where status is `created`, `pending`, `paid` or `failed` |
| `GET` | `/api/invoices?childId=` | app | `{ invoices: [{ id, status, paidVia, paidAt }] }` |
| `POST` | `/paymob/webhook` | Paymob | transaction processed callback |
| `GET` | `/paymob/return/:id` | parent's browser | redirects to the app's `returnUrl` |
| `GET` | `/health` | | `{ ok: true }` |

Errors come back as `{ error, message }`. The codes are `invalid_request`, `invalid_return_url`, `method_unavailable`, `not_found`, `already_paid` and `paymob_unavailable`.

## Files

```
src/
  index.ts      starts the server
  app.ts        routes
  payments.ts   starting a payment, applying Paymob callbacks
  paymob.ts     Intention API client, checkout URL, callback HMAC
  db.ts         SQLite schema and queries
  seed.ts       demo payer and invoices
  config.ts     environment variables
test/           node:test, run with npm test
```

## Before production

- **Authentication.** The `/api/*` routes trust whoever calls them. Add the parent's session, and check the invoice belongs to them, once real sign-in exists.
- **Real invoices.** Instructors' courses and enrolments should create invoices here instead of the seed.
- **Refunds and voids.** Their callbacks are stored in `paymob_callbacks` but don't change anything yet.
- **Database.** SQLite is fine for one server process. Use Postgres before running more than one.
- **Reconciliation.** If a webhook never arrives, the payment stays `created`. A periodic check against Paymob's transaction inquiry API would close that gap.
