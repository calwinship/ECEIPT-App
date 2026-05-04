// Pure preference helpers — no React Native or expo imports — so they can
// be tested under plain Node.

export const PREFERENCE_DEFAULTS = Object.freeze({
  return_window_days: 30,
});

export const sanitizePreferences = (value) => {
  const merged = { ...PREFERENCE_DEFAULTS, ...(value || {}) };
  const raw = merged.return_window_days;
  const days = raw === null || raw === undefined || raw === '' ? NaN : Number(raw);
  merged.return_window_days =
    Number.isFinite(days) && days >= 0 && days <= 3650
      ? Math.round(days)
      : PREFERENCE_DEFAULTS.return_window_days;
  return merged;
};
