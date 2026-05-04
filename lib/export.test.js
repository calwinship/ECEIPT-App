import { test } from 'node:test';
import assert from 'node:assert/strict';
import { receiptToCSV, receiptsToCSV, CSV_COLUMNS } from './export.js';

const sample = {
  schema_version: 1,
  receipt_id: 'r1',
  purchased_at: '2026-05-01T10:00:00Z',
  merchant: { name: 'Cafe', address: '1 Main St' },
  currency: 'USD',
  items: [
    { name: 'Latte', qty: 1, unit_price: 4.5 },
    { name: 'Bagel, plain', qty: 2, unit_price: 3 },
  ],
  subtotal: 10.5,
  tax: 0.84,
  total: 11.34,
  payment: { method: 'card', last4: '1234' },
  user_metadata: { tags: ['business'], note: 'team meeting' },
};

test('CSV header matches the documented column list', () => {
  const csv = receiptToCSV(sample);
  const headerLine = csv.split('\n')[0];
  assert.equal(headerLine, CSV_COLUMNS.join(','));
});

test('one row per line item', () => {
  const csv = receiptToCSV(sample);
  const lines = csv.split('\n');
  assert.equal(lines.length, 1 + sample.items.length); // header + items
});

test('quotes cells with commas', () => {
  const csv = receiptToCSV(sample);
  assert.match(csv, /"Bagel, plain"/);
});

test('escapes embedded double quotes', () => {
  const r = {
    ...sample,
    user_metadata: { tags: [], note: 'said "hello"' },
  };
  const csv = receiptToCSV(r);
  assert.match(csv, /"said ""hello"""/);
});

test('computes line totals from qty * unit_price', () => {
  const csv = receiptToCSV(sample);
  // Bagel row: 2 * 3 = 6
  const bagelRow = csv.split('\n').find((l) => l.includes('Bagel'));
  assert.ok(bagelRow.includes(',6,'));
});

test('joins tags with comma-space and quotes the cell', () => {
  const r = {
    ...sample,
    user_metadata: { tags: ['business', 'reimbursable'], note: '' },
  };
  const csv = receiptToCSV(r);
  assert.match(csv, /"business, reimbursable"/);
});

test('all-receipts export concatenates rows', () => {
  const csv = receiptsToCSV([sample, { ...sample, receipt_id: 'r2' }]);
  const lines = csv.split('\n');
  // header + 2 receipts × 2 items
  assert.equal(lines.length, 1 + 2 * sample.items.length);
});

test('handles missing optional fields gracefully', () => {
  const minimal = {
    schema_version: 1,
    receipt_id: 'r3',
    purchased_at: '2026-05-01T10:00:00Z',
    merchant: { name: 'X' },
    currency: 'USD',
    items: [{ name: 'a', qty: 1, unit_price: 1 }],
    subtotal: 1,
    tax: 0,
    total: 1,
  };
  const csv = receiptToCSV(minimal);
  assert.ok(csv.includes(',X,'));
  // Missing payment / metadata should serialize to empty cells, not "undefined"
  assert.ok(!csv.includes('undefined'));
});
