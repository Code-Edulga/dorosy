// Deletes the local database and seeds the demo invoices again.

import { rmSync } from 'node:fs';
import { openDb } from './db.ts';
import { seedDemo } from './seed.ts';

const path = process.env.DATABASE_PATH?.trim() || 'data/dorosy.db';
for (const suffix of ['', '-wal', '-shm']) rmSync(path + suffix, { force: true });
const db = openDb(path);
seedDemo(db);
db.close();
console.log(`Reset ${path}`);
