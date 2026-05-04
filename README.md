# ECEIPT App

A digital-receipt app for shoppers. At checkout, the merchant displays a QR code containing the receipt as JSON (see the [QR Code Generator](https://github.com/calwinship/QR-Code-Generator)). The customer opens ECEIPT, scans the code, and the receipt is parsed, validated, and stored locally on the device — no servers involved.

Watch a short demo of the original concept: https://www.youtube.com/shorts/wbuF6r3xPM8

## Features

- **Scan** receipts by QR code with a debounced, QR-only scanner and an explicit camera-permission flow
- **Browse** all stored receipts on the home screen, with search across merchant, item, tag, and note
- **View** itemized receipt details: line items with qty × unit price, subtotal/tax/total, payment method, and a "days left to return" badge for purchases within the 30-day window
- **Tag and annotate** receipts with comma-separated tags and a free-text note, persisted on the device
- **Insights** screen with all-time spend, a 6-month bar chart, and top merchants by total
- **Share** a receipt as plain text or export it as CSV; export every receipt as one CSV from Settings
- **Privacy-first**: receipts never leave the device

## Receipt schema (v1)

The scanner accepts JSON in the v1 shape below. The legacy demo shape (`{ store_name, receipt_items: [{ product_name, price }] }`) is still accepted and normalized to v1 on import.

```json
{
  "schema_version": 1,
  "receipt_id": "uuid",
  "merchant": { "name": "Cafe", "address": "1 Main St", "tax_id": "" },
  "purchased_at": "2026-05-04T14:32:00Z",
  "currency": "USD",
  "items": [
    { "name": "Latte", "qty": 1, "unit_price": 4.50, "tax_rate": 0.0875 }
  ],
  "subtotal": 4.50,
  "tax": 0.39,
  "total": 4.89,
  "payment": { "method": "card", "last4": "1234" }
}
```

## Project layout

```
app/
  _layout.js          Stack navigation
  index.js            Receipts list with search and monthly total
  scan.js             Camera + QR scanner (modal)
  receipt/[id].js     Receipt detail with tags, notes, share, export
  insights.js         Spending dashboard
  settings.js         App info, export all, clear all
components/
  ReceiptCard.js      List-item card with tag chips
lib/
  schema.js           Schema v1 validator and legacy normalizer
  storage.js          File-system-backed receipt store
  export.js           CSV export utilities
  *.test.js           Tests, runnable via `node --test`
```

## Development

```sh
npm install
npm start          # expo start
npm test           # node:test, runs lib/*.test.js
```

The app targets Expo SDK 48; an upgrade to a current LTS is recommended (see `SUGGESTIONS.md`).

## Roadmap

The longer list of suggested improvements lives in [SUGGESTIONS.md](./SUGGESTIONS.md). Highlights still open:

- Expo SDK upgrade and TypeScript migration
- Biometric app-lock (`expo-local-authentication`)
- Proper file-based export via `expo-sharing`
- Backend with optional, end-to-end-encrypted sync
- Merchant-side tools (a tiny POS web page, ESC/POS firmware, Square/Stripe/Shopify plugins)
- NFC fallback to QR
