import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { createApp } from './app.ts';
import { loadConfig, type Config } from './config.ts';
import { openDb } from './db.ts';
import { createPaymob } from './paymob.ts';
import { seedDemo } from './seed.ts';

let config: Config;
try {
  config = loadConfig();
} catch (err) {
  console.error(`\nCan't start: ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
}
const db = openDb(config.databasePath);
if (config.seedDemoData && seedDemo(db)) console.log('Seeded demo invoices');

const app = new Hono();
app.use(logger());
app.route('/', createApp({ config, db, paymob: createPaymob(config.paymob) }));

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Dorosy API on http://localhost:${info.port}`);
  console.log(`Paymob callbacks: ${config.publicUrl}/paymob/webhook`);
  console.log(`Payment methods: ${Object.keys(config.paymob.integrations).join(', ')}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close();
    db.close();
    process.exit(0);
  });
}
