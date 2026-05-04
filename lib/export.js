// CSV export. Single-receipt CSV is one row per line item with the receipt
// header repeated for spreadsheet-friendliness. All-receipts CSV is one row
// per (receipt, item) pair so users can pivot/sum in their tool of choice.

const COLUMNS = [
  'receipt_id',
  'purchased_at',
  'merchant_name',
  'merchant_address',
  'currency',
  'item_name',
  'item_qty',
  'item_unit_price',
  'item_line_total',
  'subtotal',
  'tax',
  'total',
  'payment_method',
  'payment_last4',
  'tags',
  'note',
];

const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const rowsForReceipt = (r) => {
  const meta = r.user_metadata || { tags: [], note: '' };
  const tags = (meta.tags || []).join(', ');
  const note = meta.note || '';
  return (r.items || []).map((it) => ({
    receipt_id: r.receipt_id,
    purchased_at: r.purchased_at,
    merchant_name: r.merchant?.name ?? '',
    merchant_address: r.merchant?.address ?? '',
    currency: r.currency ?? '',
    item_name: it.name,
    item_qty: it.qty ?? 1,
    item_unit_price: it.unit_price ?? 0,
    item_line_total: (it.unit_price ?? 0) * (it.qty ?? 1),
    subtotal: r.subtotal ?? '',
    tax: r.tax ?? '',
    total: r.total ?? '',
    payment_method: r.payment?.method ?? '',
    payment_last4: r.payment?.last4 ?? '',
    tags,
    note,
  }));
};

const toCSV = (rows) => {
  const header = COLUMNS.join(',');
  const body = rows.map((row) => COLUMNS.map((c) => escapeCell(row[c])).join(','));
  return [header, ...body].join('\n');
};

export const receiptToCSV = (receipt) => toCSV(rowsForReceipt(receipt));

export const receiptsToCSV = (receipts) =>
  toCSV(receipts.flatMap((r) => rowsForReceipt(r)));

export const CSV_COLUMNS = COLUMNS;
