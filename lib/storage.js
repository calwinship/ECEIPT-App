import * as FileSystem from 'expo-file-system';

const FILE = `${FileSystem.documentDirectory}receipts.json`;

const readFile = async () => {
  const info = await FileSystem.getInfoAsync(FILE);
  if (!info.exists) return [];
  try {
    const text = await FileSystem.readAsStringAsync(FILE);
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt file — start over rather than crash. Old data is unrecoverable.
    return [];
  }
};

const writeFile = (receipts) =>
  FileSystem.writeAsStringAsync(FILE, JSON.stringify(receipts));

const withDefaults = (r) => ({
  ...r,
  user_metadata: r.user_metadata ?? { tags: [], note: '' },
});

export const loadReceipts = async () => {
  const list = await readFile();
  return list
    .map(withDefaults)
    .sort((a, b) => (a.purchased_at < b.purchased_at ? 1 : -1));
};

export const saveReceipt = async (receipt) => {
  const list = await readFile();
  // Dedup by receipt_id so a held-up scan doesn't insert twice.
  if (list.some((r) => r.receipt_id === receipt.receipt_id)) return list;
  const next = [withDefaults(receipt), ...list];
  await writeFile(next);
  return next;
};

export const deleteReceipt = async (receiptId) => {
  const list = await readFile();
  const next = list.filter((r) => r.receipt_id !== receiptId);
  await writeFile(next);
  return next;
};

export const findReceipt = async (receiptId) => {
  const list = await readFile();
  const found = list.find((r) => r.receipt_id === receiptId);
  return found ? withDefaults(found) : null;
};

export const updateReceiptMetadata = async (receiptId, metadata) => {
  const list = await readFile();
  const next = list.map((r) =>
    r.receipt_id === receiptId
      ? { ...r, user_metadata: { ...withDefaults(r).user_metadata, ...metadata } }
      : r
  );
  await writeFile(next);
  return next.find((r) => r.receipt_id === receiptId) ?? null;
};

export const clearAll = async () => {
  const info = await FileSystem.getInfoAsync(FILE);
  if (info.exists) await FileSystem.deleteAsync(FILE, { idempotent: true });
};
