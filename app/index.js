import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { loadReceipts } from '../lib/storage';
import ReceiptCard, { formatMoney } from '../components/ReceiptCard';

const monthlyTotal = (receipts) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return receipts
    .filter((r) => {
      const d = new Date(r.purchased_at);
      return d.getFullYear() === y && d.getMonth() === m;
    })
    .reduce((sum, r) => sum + (r.total || 0), 0);
};

const Home = () => {
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

  const total = monthlyTotal(receipts);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>This month</Text>
        <Text style={styles.headerTotal}>{formatMoney(total)}</Text>
      </View>

      <FlatList
        data={receipts}
        keyExtractor={(r) => r.receipt_id}
        renderItem={({ item }) => <ReceiptCard receipt={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No receipts yet</Text>
            <Text style={styles.emptyBody}>
              Tap the scan button to add your first receipt.
            </Text>
          </View>
        }
        contentContainerStyle={receipts.length === 0 ? styles.emptyContainer : styles.list}
      />

      <Link href="/scan" asChild>
        <Pressable style={styles.fab}>
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
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerLabel: { fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTotal: { fontSize: 32, fontWeight: '700', marginTop: 4 },
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
