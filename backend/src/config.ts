// Environment configuration. Everything Paymob-related stays on the server: the app never sees the secret key
// or the HMAC secret.

export type OnlineMethod = 'card' | 'wallet' | 'kiosk';
export const ONLINE_METHODS: readonly OnlineMethod[] = ['card', 'wallet', 'kiosk'];

export type PaymobConfig = {
  apiBase: string;
  checkoutUrl: string;
  secretKey: string;
  publicKey: string;
  hmacSecret: string;
  integrations: Partial<Record<OnlineMethod, number>>;
  fallbackEmail: string; // Paymob requires an email; parents sign in by phone
};

export type Config = {
  port: number;
  publicUrl: string; // where Paymob reaches this server for the webhook and the browser redirect
  databasePath: string;
  seedDemoData: boolean;
  corsOrigins: string[];
  returnUrlPrefixes: string[]; // app deep links we are willing to redirect to after checkout
  paymob: PaymobConfig;
};

const list = (v: string | undefined) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const missing: string[] = [];
  const need = (key: string) => {
    const v = env[key]?.trim();
    if (!v || v.endsWith('...') || v.includes('your-tunnel')) missing.push(key); // empty or still the .env.example value
    return v ?? '';
  };

  const integrations: PaymobConfig['integrations'] = {};
  for (const m of ONLINE_METHODS) {
    const key = `PAYMOB_INTEGRATION_${m.toUpperCase()}`;
    const raw = env[key]?.trim();
    if (!raw) continue;
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) throw new Error(`${key} must be a numeric Paymob integration ID, got "${raw}"`);
    integrations[m] = id;
  }

  const apiBase = (env.PAYMOB_API_BASE?.trim() || 'https://accept.paymob.com').replace(/\/+$/, '');
  const config: Config = {
    port: Number(env.PORT ?? 4000),
    publicUrl: need('PUBLIC_URL').replace(/\/+$/, ''),
    databasePath: env.DATABASE_PATH?.trim() || 'data/dorosy.db',
    seedDemoData: env.SEED_DEMO_DATA !== 'false',
    corsOrigins: list(env.CORS_ORIGINS ?? 'http://localhost:8081'),
    returnUrlPrefixes: list(env.APP_RETURN_URL_PREFIXES ?? 'dorosy://,exp://,http://localhost:8081/'),
    paymob: {
      apiBase,
      checkoutUrl: env.PAYMOB_CHECKOUT_URL?.trim() || `${apiBase}/unifiedcheckout/`,
      secretKey: need('PAYMOB_SECRET_KEY'),
      publicKey: need('PAYMOB_PUBLIC_KEY'),
      hmacSecret: need('PAYMOB_HMAC_SECRET'),
      integrations,
      fallbackEmail: env.PAYMOB_FALLBACK_EMAIL?.trim() || 'payments@dorosy.app',
    },
  };

  if (missing.length) {
    throw new Error(`Fill in ${missing.join(', ')} in .env (copied from .env.example). See README.md → Set up Paymob.`);
  }
  if (!Object.keys(integrations).length) {
    throw new Error('Set at least one of PAYMOB_INTEGRATION_CARD, PAYMOB_INTEGRATION_WALLET, PAYMOB_INTEGRATION_KIOSK.');
  }
  if (!/^https:\/\//.test(config.publicUrl) && !/^http:\/\/localhost\b/.test(config.publicUrl)) {
    throw new Error('PUBLIC_URL must be an https URL Paymob can reach (use a tunnel such as ngrok in development).');
  }
  return config;
}
