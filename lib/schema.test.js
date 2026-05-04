import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReceipt, SCHEMA_VERSION } from './schema.js';

test('exports the current schema version', () => {
  assert.equal(SCHEMA_VERSION, 1);
});

test('normalizes legacy receipt shape into v1', () => {
  const payload = JSON.stringify({
    store_name: 'Cafe',
    receipt_items: [
      { product_name: 'Latte', price: 4.5 },
      { product_name: 'Croissant', price: 3.25 },
    ],
  });
  const r = parseReceipt(payload);
  assert.equal(r.schema_version, 1);
  assert.equal(r.merchant.name, 'Cafe');
  assert.equal(r.items.length, 2);
  assert.equal(r.subtotal, 7.75);
  assert.equal(r.total, 7.75);
  assert.ok(r.receipt_id, 'should generate a receipt_id');
  assert.ok(r.purchased_at, 'should default purchased_at');
});

test('preserves valid v1 fields', () => {
  const payload = JSON.stringify({
    schema_version: 1,
    receipt_id: 'fixed-id',
    merchant: { name: 'Shop' },
    items: [{ name: 'Thing', qty: 2, unit_price: 5 }],
    subtotal: 10,
    tax: 0.5,
    total: 10.5,
  });
  const r = parseReceipt(payload);
  assert.equal(r.receipt_id, 'fixed-id');
  assert.equal(r.items[0].qty, 2);
  assert.equal(r.total, 10.5);
});

test('rejects non-JSON QR payloads', () => {
  assert.throws(() => parseReceipt('https://example.com'), /not valid JSON/);
});

test('rejects unsupported schema_version', () => {
  const payload = JSON.stringify({
    schema_version: 99,
    merchant: { name: 'X' },
    items: [{ name: 'a', unit_price: 1 }],
    total: 1,
  });
  assert.throws(() => parseReceipt(payload), /Unsupported schema_version/);
});

test('rejects missing merchant name', () => {
  const payload = JSON.stringify({
    schema_version: 1,
    merchant: {},
    items: [{ name: 'a', unit_price: 1 }],
    total: 1,
  });
  assert.throws(() => parseReceipt(payload), /merchant\.name/);
});

test('rejects empty items array', () => {
  const payload = JSON.stringify({
    schema_version: 1,
    merchant: { name: 'X' },
    items: [],
    total: 0,
  });
  assert.throws(() => parseReceipt(payload), /items must be a non-empty array/);
});

test('rejects items with non-numeric prices', () => {
  const payload = JSON.stringify({
    schema_version: 1,
    merchant: { name: 'X' },
    items: [{ name: 'a', unit_price: 'cheap' }],
    total: 1,
  });
  assert.throws(() => parseReceipt(payload), /unit_price/);
});

test('rejects JSON arrays at the top level', () => {
  assert.throws(() => parseReceipt(JSON.stringify([1, 2, 3])), /must be a JSON object/);
});
