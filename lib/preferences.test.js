import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePreferences, PREFERENCE_DEFAULTS } from './preferences-schema.js';

test('returns defaults for empty input', () => {
  assert.deepEqual(sanitizePreferences(), PREFERENCE_DEFAULTS);
  assert.deepEqual(sanitizePreferences(null), PREFERENCE_DEFAULTS);
  assert.deepEqual(sanitizePreferences({}), PREFERENCE_DEFAULTS);
});

test('preserves a valid return_window_days', () => {
  assert.equal(sanitizePreferences({ return_window_days: 14 }).return_window_days, 14);
  assert.equal(sanitizePreferences({ return_window_days: 0 }).return_window_days, 0);
  assert.equal(sanitizePreferences({ return_window_days: 3650 }).return_window_days, 3650);
});

test('rounds non-integer return_window_days', () => {
  assert.equal(sanitizePreferences({ return_window_days: 14.7 }).return_window_days, 15);
});

test('falls back to default for invalid return_window_days', () => {
  const cases = [-1, 3651, NaN, 'thirty', null, undefined];
  for (const v of cases) {
    assert.equal(
      sanitizePreferences({ return_window_days: v }).return_window_days,
      PREFERENCE_DEFAULTS.return_window_days
    );
  }
});

test('does not mutate the defaults object', () => {
  const result = sanitizePreferences({ return_window_days: 7 });
  assert.equal(PREFERENCE_DEFAULTS.return_window_days, 30);
  result.return_window_days = 999;
  assert.equal(PREFERENCE_DEFAULTS.return_window_days, 30);
});
