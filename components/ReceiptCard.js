import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export const formatMoney = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

export const formatDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const ReceiptCard = ({ receipt }) => {
  const tags = (receipt.user_metadata?.tags || []).slice(0, 3);
  const a11yLabel = `${receipt.merchant?.name || 'Unknown merchant'}, ${formatMoney(
    receipt.total,
    receipt.currency
  )}, ${formatDate(receipt.purchased_at)}, ${receipt.items.length} item${
    receipt.items.length === 1 ? '' : 's'
  }`;
  return (
    <Link href={`/receipt/${receipt.receipt_id}`} asChild>
      <Pressable
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint="Opens this receipt"
      >
        <View style={styles.row}>
          <Text style={styles.merchant} numberOfLines={1}>
            {receipt.merchant?.name || 'Unknown merchant'}
          </Text>
          <Text style={styles.total}>{formatMoney(receipt.total, receipt.currency)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.meta}>{formatDate(receipt.purchased_at)}</Text>
          <Text style={styles.meta}>
            {receipt.items.length} item{receipt.items.length === 1 ? '' : 's'}
          </Text>
        </View>
        {tags.length > 0 ? (
          <View style={styles.tagRow}>
            {tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  merchant: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  total: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, color: '#666', marginTop: 4 },
  tagRow: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  tag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
    marginTop: 4,
  },
  tagText: { color: '#3730a3', fontSize: 11, fontWeight: '500' },
});

export default ReceiptCard;
