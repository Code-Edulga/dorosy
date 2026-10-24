Two independent packages, each with its own `package.json` and `node_modules`. Run commands from inside the folder.

- `mobile/`: Expo / React Native app. Read `mobile/AGENTS.md` before changing it.
- `backend/`: Node API (Hono, `node:sqlite`) that talks to Paymob. Node 22.18+ runs the `.ts` files directly; there is no build step. Relative imports keep their `.ts` extension.

Before declaring work done, run typecheck in each package you touched (`npx tsc --noEmit`), and `npm test` in `backend/`.

Never put Paymob keys or the HMAC secret in `mobile/`. Everything in the app bundle is public, including `EXPO_PUBLIC_` variables. Only the backend's verified webhook may mark an invoice paid.
