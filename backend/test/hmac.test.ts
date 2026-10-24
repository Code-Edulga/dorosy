import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { transactionHmac, verifyTransactionHmac } from '../src/paymob.ts';
import { HMAC_SECRET, transaction } from './helpers.ts';

test('signs the 20 fields in Paymob order with lowercase booleans and no separators', () => {
  const signed =
    '50000' + // amount_cents
    '2026-10-24T17:30:12.371012' + // created_at
    'EGP' + // currency
    'false' + // error_occured
    'false' + // has_parent_transaction
    '192036465' + // id
    '111' + // integration_id
    'true' + // is_3d_secure
    'false' + // is_auth
    'false' + // is_capture
    'false' + // is_refunded
    'true' + // is_standalone_payment
    'false' + // is_voided
    '400000001' + // order.id
    '302852' + // owner
    'false' + // pending
    '2346' + // source_data.pan
    'MasterCard' + // source_data.sub_type
    'card' + // source_data.type
    'true'; // success
  const expected = createHmac('sha512', HMAC_SECRET).update(signed).digest('hex');
  assert.equal(transactionHmac(transaction(), HMAC_SECRET), expected);
});

test('accepts a valid signature in either case', () => {
  const tx = transaction();
  const hmac = transactionHmac(tx, HMAC_SECRET);
  assert.ok(verifyTransactionHmac(tx, hmac, HMAC_SECRET));
  assert.ok(verifyTransactionHmac(tx, hmac.toUpperCase(), HMAC_SECRET));
});

test('rejects tampered fields, the wrong secret and a missing signature', () => {
  const tx = transaction();
  const hmac = transactionHmac(tx, HMAC_SECRET);
  assert.ok(!verifyTransactionHmac({ ...tx, amount_cents: 100 }, hmac, HMAC_SECRET));
  assert.ok(!verifyTransactionHmac({ ...tx, success: false }, hmac, HMAC_SECRET));
  assert.ok(!verifyTransactionHmac(tx, hmac, 'another_secret'));
  assert.ok(!verifyTransactionHmac(tx, undefined, HMAC_SECRET));
  assert.ok(!verifyTransactionHmac(tx, 'abc', HMAC_SECRET));
});
