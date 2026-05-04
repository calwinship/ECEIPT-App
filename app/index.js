import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { loadReceipts } from '../lib/storage';
import { monthOverMonthTrend } from '../lib/trends';
import ReceiptCard, { formatMoney } from '../components/ReceiptCard';

const matches = (receipt, query) => {
  if (!query) return true;
  const q = query.toLowerCase();
  if ((receipt.merchant?.name || '').toLowerCase().includes(q)) return true;
  if ((receipt.user_metadata?.note || '').toLowerCase().includes(q)) return true;
  if ((receipt.user_metadata?.tags || []).some((t) => t.toLowerCase().includes(q))) return true;
  return (receipt.items || []).some((it) => (it.name || '').toLowerCase().includes(q));
};

const Home = () => {
  const [receipts, setReceipts] = useState([]);
  const [query, setQuery] = useState('');

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

  const filtered = useMemo(() => receipts.filter((r) => matches(r, query)), [receipts, query]);
  const trend = useMemo(() => monthOverMonthTrend(receipts), [receipts]);
  const trendColor =
    trend.direction === 'up' ? '#b91c1c' : trend.direction === 'down' ? '#15803d' : '#6b7280';
  const trendArrow = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerLabel}>This month</Text>
            <Text style={styles.headerTotal}>{formatMoney(trend.current)}</Text>
            {trend.label ? (
              <Text style={[styles.trendLabel, { color: trendColor }]}>
                {trendArrow} {trend.label}
              </Text>
            ) : null}
          </View>
          <View style={styles.headerActions}>
            <Link href="/insights" asChild>
              <Pressable
                style={styles.headerBtn}
                accessibilityRole="link"
                accessibilityLabel="Open insights"
              >
                <Text style={styles.headerBtnText}>Insights</Text>
              </Pressable>
            </Link>
            <Link href="/settings" asChild>
              <Pressable
                style={styles.headerBtn}
                accessibilityRole="link"
                accessibilityLabel="Open settings"
              >
                <Text style={styles.headerBtnText}>Settings</Text>
              </Pressable>
            </Link>
          </View>
        </View>
        <TextInput
          style={styles.search}
          placeholder="Search merchant, item, tag…"
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          accessibilityLabel="Search receipts"
          accessibilityHint="Filters receipts by merchant, item, tag, or note"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.receipt_id}
        renderItem={({ item }) => <ReceiptCard receipt={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {query ? 'No matches' : 'No receipts yet'}
            </Text>
            <Text style={styles.emptyBody}>
              {query
                ? 'Try a different search term.'
                : 'Tap the scan button to add your first receipt.'}
            </Text>
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
        keyboardShouldPersistTaps="handled"
      />

      <Link href="/scan" asChild>
        <Pressable
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Scan a new receipt"
          accessibilityHint="Opens the camera to scan a QR code"
        >
          <Text style={styles.fabIcon}>＋</Text>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5f7' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginLeft: 8,
  },
  headerBtnText: { color: '#111827', fontWeight: '500', fontSize: 13 },
  headerLabel: { fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTotal: { fontSize: 32, fontWeight: '700', marginTop: 4 },
  trendLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  search: {
    marginTop: 16,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
  },
  list: { paddingTop: 12, paddingBottom: 96 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabIcon: { color: '#fff', fontSize: 30, lineHeight: 32 },
});

export default Home;
