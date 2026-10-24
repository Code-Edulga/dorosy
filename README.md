# Dorosy (دروسي)

Private-tutoring management for Egyptian high school students: one Expo app for students, parents and instructors, plus a small backend that takes payments through Paymob.

| Folder | What | Start here |
| --- | --- | --- |
| [`mobile/`](mobile/) | Expo / React Native app for iOS, Android and a web preview | [mobile/README.md](mobile/README.md) |
| [`backend/`](backend/) | Node API: Paymob payment intentions, webhook, invoice status | [backend/README.md](backend/README.md) |

The two folders are separate packages, each with its own `package.json`. Run commands from inside the folder.

## Quick start

The app runs on its own in demo mode, with mock data and payments marked paid locally:

```bash
cd mobile && npm install && npx expo start
```

To take real payments in Paymob test mode:

```bash
cd backend
cp .env.example .env     # Paymob keys, HMAC secret, integration IDs, PUBLIC_URL (a tunnel in development)
npm install && npm run dev

cd ../mobile
echo "EXPO_PUBLIC_API_URL=https://your-tunnel.ngrok-free.app" > .env
npx expo start --clear
```

Then open the app as a parent and go to **Billing**. Pay the overdue invoice by card, mobile wallet or Aman/Masary kiosk. Checkout opens on Paymob's page. When you come back, the invoice moves to Paid once Paymob's webhook reaches the backend.

Requires Node 22.18 or newer. The backend runs its TypeScript directly; the app needs Node 20 or newer.
