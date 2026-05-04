import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthOverMonthTrend } from './trends.js';

const now = new Date('2026-05-15T12:00:00Z');

const receipt = (date, total) => ({ purchased_at: date, total });

test('flat when both months are zero', () => {
  const t = monthOverMonthTrend([], now);
  assert.equal(t.direction, 'flat');
  assert.equal(t.label, null);
});

test('first spend when prev is zero and current > 0', () => {
  const t = monthOverMonthTrend([receipt('2026-05-10T00:00:00Z', 50)], now);
  assert.equal(t.direction, 'up');
  assert.match(t.label, /first spend/);
});

test('100% less when current is zero and prev > 0', () => {
  const t = monthOverMonthTrend([receipt('2026-04-10T00:00:00Z', 80)], now);
  assert.equal(t.direction, 'down');
  assert.match(t.label, /100% less/);
});

test('reports up trend with percent change', () => {
  const receipts = [
    receipt('2026-04-10T00:00:00Z', 100),
    receipt('2026-05-10T00:00:00Z', 150),
  ];
  const t = monthOverMonthTrend(receipts, now);
  assert.equal(t.direction, 'up');
  assert.match(t.label, /50% more/);
});

test('reports down trend with percent change', () => {
  const receipts = [
    receipt('2026-04-10T00:00:00Z', 200),
    receipt('2026-05-10T00:00:00Z', 150),
  ];
  const t = monthOverMonthTrend(receipts, now);
  assert.equal(t.direction, 'down');
  assert.match(t.label, /25% less/);
});

test('reports flat when current equals previous', () => {
  const receipts = [
    receipt('2026-04-10T00:00:00Z', 100),
    receipt('2026-05-10T00:00:00Z', 100),
  ];
  const t = monthOverMonthTrend(receipts, now);
  assert.equal(t.direction, 'flat');
  assert.equal(t.label, 'same as last month');
});

test('only counts the relevant months', () => {
  const receipts = [
    receipt('2025-12-10T00:00:00Z', 999),
    receipt('2026-04-10T00:00:00Z', 100),
    receipt('2026-05-10T00:00:00Z', 200),
  ];
  const t = monthOverMonthTrend(receipts, now);
  assert.equal(t.current, 200);
  assert.equal(t.previous, 100);
});

test('handles year boundary (Jan vs prev Dec)', () => {
  const jan = new Date('2026-01-15T12:00:00Z');
  const receipts = [
    receipt('2025-12-10T00:00:00Z', 100),
    receipt('2026-01-10T00:00:00Z', 200),
  ];
  const t = monthOverMonthTrend(receipts, jan);
  assert.equal(t.current, 200);
  assert.equal(t.previous, 100);
  assert.equal(t.direction, 'up');
});

test('ignores receipts with invalid dates', () => {
  const t = monthOverMonthTrend([receipt('not a date', 99)], now);
  assert.equal(t.current, 0);
  assert.equal(t.previous, 0);
});
