import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { loadReceipts } from '../lib/storage';
import { formatMoney } from '../components/ReceiptCard';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const monthBuckets = (receipts, count = 6) => {
  const now = new Date();
  const buckets = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTHS[d.getMonth()], total: 0 });
  }
  for (const r of receipts) {
    const d = new Date(r.purchased_at);
    const b = buckets.find((bk) => bk.year === d.getFullYear() && bk.month === d.getMonth());
    if (b) b.total += r.total || 0;
  }
  return buckets;
};

const topMerchants = (receipts, n = 5) => {
  const map = new Map();
  for (const r of receipts) {
    const name = r.merchant?.name || 'Unknown';
    const cur = map.get(name) || { name, total: 0, count: 0 };
    cur.total += r.total || 0;
    cur.count += 1;
    map.set(name, cur);
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, n);
};

const Insights = () => {
  const [receipts, setReceipts] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadReceipts().then((r) => {
        if (!cancelled) setReceipts(r);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const months = useMemo(() => monthBuckets(receipts), [receipts]);
  const merchants = useMemo(() => topMerchants(receipts), [receipts]);
  const peak = Math.max(1, ...months.map((m) => m.total));
  const allTime = receipts.reduce((s, r) => s + (r.total || 0), 0);

  if (receipts.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No data yet</Text>
        <Text style={styles.emptyBody}>Scan a few receipts to see spending trends.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.label}>All-time spend</Text>
        <Text style={styles.bigNumber}>{formatMoney(allTime)}</Text>
        <Text style={styles.sub}>
          {receipts.length} receipt{receipts.length === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Last 6 months</Text>
        <View style={styles.chart}>
          {months.map((m, i) => (
            <View key={i} style={styles.barColumn}>
              <Text style={styles.barValue}>
                {m.total > 0 ? formatMoney(m.total).replace('.00', '') : ''}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height: `${(m.total / peak) * 100}%` }]} />
              </View>
              <Text style={styles.barLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Top merchants</Text>
        {merchants.map((m) => (
          <View key={m.name} style={styles.merchantRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.merchantName}>{m.name}</Text>
              <Text style={styles.merchantMeta}>
                {m.count} visit{m.count === 1 ? '' : 's'}
              </Text>
            </View>
            <Text style={styles.merchantTotal}>{formatMoney(m.total)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f4f5f7' },
  content: { padding: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#f4f5f7' },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  label: { fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  bigNumber: { fontSize: 32, fontWeight: '700', marginTop: 4 },
  sub: { color: '#6b7280', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 160 },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barTrack: { flex: 1, width: '60%', justifyContent: 'flex-end' },
  bar: { backgroundColor: '#111827', borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  barValue: { fontSize: 10, color: '#6b7280', marginBottom: 4 },
  merchantRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  merchantName: { fontSize: 15, fontWeight: '500' },
  merchantMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  merchantTotal: { fontSize: 15, fontWeight: '600' },
});

export default Insights;
