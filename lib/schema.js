// Receipt schema v1 — accept both the legacy demo shape
// ({ store_name, receipt_items: [{ product_name, price }] }) and the
// canonical v1 shape, normalize to v1 internally.

const CURRENT_VERSION = 1;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);

const randomId = () => {
  // RFC4122-ish v4 without external deps; fine for local-only IDs.
  return 'rxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
};

const sumItems = (items) =>
  items.reduce((acc, it) => acc + (it.unit_price || 0) * (it.qty || 1), 0);

// Convert the legacy `{ store_name, receipt_items: [{ product_name, price }] }`
// shape into v1.
const fromLegacy = (raw) => {
  const items = (raw.receipt_items || []).map((it) => ({
    name: String(it.product_name ?? ''),
    qty: 1,
    unit_price: Number(it.price) || 0,
    tax_rate: 0,
  }));
  const subtotal = sumItems(items);
  return {
    schema_version: CURRENT_VERSION,
    receipt_id: randomId(),
    merchant: { name: String(raw.store_name ?? 'Unknown'), address: '', tax_id: '' },
    purchased_at: new Date().toISOString(),
    currency: 'USD',
    items,
    subtotal,
    tax: 0,
    total: subtotal,
    payment: { method: 'unknown', last4: '' },
    _raw: raw,
  };
};

const validateV1 = (r) => {
  if (!isObject(r.merchant) || typeof r.merchant.name !== 'string') {
    return 'merchant.name is required';
  }
  if (!Array.isArray(r.items) || r.items.length === 0) {
    return 'items must be a non-empty array';
  }
  for (const it of r.items) {
    if (!isObject(it) || typeof it.name !== 'string') return 'item.name is required';
    if (!isFiniteNumber(it.unit_price)) return 'item.unit_price must be a number';
  }
  if (!isFiniteNumber(r.total)) return 'total must be a number';
  return null;
};

// Public: parse a raw QR payload string into a normalized v1 receipt, or
// throw with a human-readable message.
export const parseReceipt = (payload) => {
  let raw;
  try {
    raw = JSON.parse(payload);
  } catch (e) {
    throw new Error('QR code is not valid JSON');
  }
  if (!isObject(raw)) throw new Error('QR payload must be a JSON object');

  const isLegacy =
    'store_name' in raw && Array.isArray(raw.receipt_items) && !raw.schema_version;
  const normalized = isLegacy ? fromLegacy(raw) : { ...raw };

  if (normalized.schema_version !== CURRENT_VERSION) {
    throw new Error(`Unsupported schema_version: ${normalized.schema_version}`);
  }
  if (!normalized.receipt_id) normalized.receipt_id = randomId();
  if (!normalized.purchased_at) normalized.purchased_at = new Date().toISOString();
  if (!normalized.currency) normalized.currency = 'USD';

  const err = validateV1(normalized);
  if (err) throw new Error(err);

  return normalized;
};

export const SCHEMA_VERSION = CURRENT_VERSION;
