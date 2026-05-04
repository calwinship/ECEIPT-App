import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { deleteReceipt, findReceipt } from '../../lib/storage';
import { formatDate, formatMoney } from '../../components/ReceiptCard';

const ReceiptDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [receipt, setReceipt] = useState(null);
  const [missing, setMissing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      findReceipt(id).then((r) => {
        if (cancelled) return;
        if (!r) setMissing(true);
        else setReceipt(r);
      });
      return () => {
        cancelled = true;
      };
    }, [id])
  );

  const onDelete = () => {
    Alert.alert('Delete receipt?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteReceipt(id);
          router.back();
        },
      },
    ]);
  };

  if (missing) {
    return (
      <View style={styles.center}>
        <Text>Receipt not found.</Text>
      </View>
    );
  }
  if (!receipt) return <View style={styles.center} />;

  const { merchant, items, subtotal, tax, total, currency, payment, purchased_at } = receipt;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.merchant}>{merchant?.name || 'Unknown merchant'}</Text>
        {merchant?.address ? <Text style={styles.address}>{merchant.address}</Text> : null}
        <Text style={styles.date}>{formatDate(purchased_at)}</Text>
        <Text style={styles.total}>{formatMoney(total, currency)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items</Text>
        {items.map((it, i) => (
          <View key={i} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{it.name}</Text>
              {it.qty > 1 ? (
                <Text style={styles.itemMeta}>
                  {it.qty} × {formatMoney(it.unit_price, currency)}
                </Text>
              ) : null}
            </View>
            <Text style={styles.itemPrice}>
              {formatMoney((it.unit_price || 0) * (it.qty || 1), currency)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Subtotal</Text>
          <Text style={styles.totalsValue}>{formatMoney(subtotal, currency)}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Tax</Text>
          <Text style={styles.totalsValue}>{formatMoney(tax, currency)}</Text>
        </View>
        <View style={[styles.totalsRow, styles.totalsRowFinal]}>
          <Text style={styles.totalsLabelFinal}>Total</Text>
          <Text style={styles.totalsValueFinal}>{formatMoney(total, currency)}</Text>
        </View>
        {payment?.method && payment.method !== 'unknown' ? (
          <Text style={styles.payment}>
            Paid by {payment.method}
            {payment.last4 ? ` ending ${payment.last4}` : ''}
          </Text>
        ) : null}
      </View>

      <Pressable style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteText}>Delete receipt</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f4f5f7' },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  merchant: { fontSize: 22, fontWeight: '700' },
  address: { color: '#6b7280', marginTop: 2 },
  date: { color: '#6b7280', marginTop: 8 },
  total: { fontSize: 28, fontWeight: '700', marginTop: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: 8 },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  itemName: { fontSize: 15 },
  itemMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '500' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalsRowFinal: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    marginTop: 6,
    paddingTop: 10,
  },
  totalsLabel: { color: '#6b7280' },
  totalsValue: { color: '#111827' },
  totalsLabelFinal: { fontWeight: '700' },
  totalsValueFinal: { fontWeight: '700' },
  payment: { marginTop: 12, color: '#6b7280', fontSize: 13 },
  deleteBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  deleteText: { color: '#dc2626', fontWeight: '600' },
});

export default ReceiptDetail;
