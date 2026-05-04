# Suggestions: Making ECEIPT a Useful App

The current code is a working proof-of-concept: open the camera, scan a QR code containing receipt JSON, push the parsed object into in-memory state, and write a single `.txt` file keyed by store name. To turn it into something a real shopper would install and keep using, the app needs durable storage, a coherent navigation flow, real receipt views, and a story for how merchants actually produce these QR codes. The list below is ordered roughly by impact.

## 1. Fix the core data flow first

These are problems in `app/index.js` that block the demo from being useful at all, regardless of new features.

- **Persist receipts across app restarts.** `useState` is wiped on every cold start. Move the canonical store to AsyncStorage (small/simple) or expo-sqlite (queryable). Keep `receipts` in state for rendering, but hydrate from storage on mount and write through on each scan.
- **Stop overwriting files by store name.** `${receipt.store_name}.txt` collides on every visit to the same store. Use a UUID or `${store}_${timestamp}` and store the metadata, not just the raw QR string.
- **Handle scan duplicates.** `onBarCodeScanned` fires repeatedly while a code is in frame — currently every frame appends another copy. Debounce by hash of `data`, or unmount the scanner once a code is recognized and require a button to scan the next one.
- **Validate the payload.** `JSON.parse(data)` will throw on any non-JSON QR code (URLs, vCards, Wi-Fi configs) and crash the screen. Wrap in try/catch, validate against a schema (zod or a manual shape check), and show a friendly "this doesn't look like a receipt" toast.
- **Request camera permission explicitly.** `Camera` will silently render black on iOS if permission was never requested. Use `Camera.useCameraPermissions()` and gate the scanner behind a permission prompt with a clear rationale.
- **Use the `barCodeScannerSettings` filter.** Restrict to QR only (`barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr]`) instead of comparing `type === 256` after the fact — that magic number is platform-dependent and fragile.

## 2. Build the screens a user actually needs

Right now there is one screen that is both the scanner and the list. Split it via `expo-router`:

- `app/index.js` → **Receipts list** (home). Sorted by date, grouped by month, with store name, total, and item count. Tap to drill in.
- `app/scan.js` → **Scanner**, opened from a floating "+" button on the list.
- `app/receipt/[id].js` → **Receipt detail**. Line items, subtotal, tax, total, payment method, store address, a map preview, and a "view raw" toggle.
- `app/settings.js` → permissions, export, account, theme.

## 3. Define a real receipt schema

The current implicit schema is `{ store_name, receipt_items: [{ product_name, price }] }`. That is not enough to be useful for budgeting or returns. Pin down a versioned schema and publish it alongside the QR generator repo so merchants have something to target:

```json
{
  "schema_version": 1,
  "receipt_id": "uuid",
  "merchant": { "name": "...", "address": "...", "tax_id": "..." },
  "purchased_at": "2026-05-04T14:32:00Z",
  "currency": "USD",
  "items": [
    { "name": "...", "qty": 1, "unit_price": 4.99, "tax_rate": 0.0875 }
  ],
  "subtotal": 4.99,
  "tax": 0.43,
  "total": 5.42,
  "payment": { "method": "card", "last4": "1234" }
}
```

Validate on scan, reject older versions politely, and store the raw payload alongside the parsed object so future schema changes can re-parse old receipts.

## 4. Features that make people open the app twice

- **Search and filter.** By store, date range, item name, amount.
- **Spending dashboard.** Monthly totals, category breakdown (auto-categorize merchants), top stores. This is the single biggest reason a normal user would care about digital receipts.
- **Returns helper.** Highlight items still within the merchant's return window (configurable per store).
- **Warranty tracking.** Mark items as warranty-eligible, set expiration, get a notification before it lapses.
- **Export.** CSV/PDF export per receipt or per date range — useful for expense reports, tax season, and shared households.
- **Tagging and notes.** "business expense", "reimbursable", a free-text note per receipt.
- **Sharing.** Send a single receipt to another ECEIPT user, or to email, for splitting expenses.

## 5. Privacy and trust

The pitch ("paper receipts are wasteful") only works if users trust the app with purchase history.

- Receipts never leave the device by default. If you add sync, make it opt-in and end-to-end encrypted.
- App-lock behind biometrics for the receipts list.
- Clear data-export and data-delete buttons in settings.
- Don't request location, contacts, or analytics permissions you don't actually use.

## 6. The merchant side is the real product

A receipt app with no receipts is dead. The QR Generator repo solves this for demos but not for real adoption. Worth thinking about:

- **A tiny POS-side web page** any cashier can open: enter items, hit "show QR", customer scans. Zero integration, works for farmers' markets and small shops.
- **A receipt-printer firmware integration** (ESC/POS printers) that emits a QR alongside or instead of paper.
- **Square/Stripe/Shopify plugins** that emit a QR at checkout from existing POS systems.
- **NFC fallback** as the README already notes — useful when the customer's screen is the merchant-facing one.
- **Email/SMS fallback link** that opens the app via deep link (`acme://receipt?payload=...`) for merchants who can't show a QR.

## 7. Backend, when you're ready

The README lists "build a backend" as future work. Suggest scoping it minimally:

- **Auth:** email magic link or Apple/Google sign-in (don't roll your own passwords).
- **Sync, not source of truth.** Device remains authoritative; backend stores encrypted blobs for cross-device sync and backup.
- **Merchant directory.** Canonical merchant IDs/logos so "Starbucks" on receipt A and "STARBUCKS #4421" on receipt B collapse into one entity in the dashboard.
- **Anonymous price index (very long term).** Aggregated, opt-in price data could be valuable, but only with extreme care around privacy.

## 8. Code-health quick wins

- Delete the commented-out `Home` block at the top of `app/index.js` — it's just noise.
- Pull the receipt rendering into a `<ReceiptCard />` component; the screen file should not own list-item layout.
- Add TypeScript. With a schema as suggested above, types pay for themselves immediately.
- Add ESLint + Prettier and a `lint` npm script.
- Pin Expo SDK to the latest LTS and upgrade — SDK 48 is well past EOL, which means broken installs for new contributors.
- Add at least one test (Jest + React Native Testing Library) around the scan-parse-store path; that's the only logic worth testing right now and it'll catch schema regressions.
- Move `axios` out of dependencies until something actually uses it.

## 9. Suggested first milestone

If you want a single concrete sprint that takes the app from "concept" to "I'd show this to a friend":

1. Persist receipts to expo-sqlite.
2. Split scanner and list into separate routes.
3. Build a real receipt detail screen.
4. Lock down a v1 schema and validate on scan.
5. Add a simple monthly-total widget on the home screen.
6. Ship a TestFlight / internal Android build.

Everything else in this document is downstream of those six.
