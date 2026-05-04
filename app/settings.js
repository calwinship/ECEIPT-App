import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { clearAll, loadReceipts } from '../lib/storage';
import { SCHEMA_VERSION } from '../lib/schema';

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const Settings = () => {
  const router = useRouter();
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadReceipts().then((r) => {
        if (!cancelled) setCount(r.length);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const onClear = () => {
    Alert.alert(
      'Delete all receipts?',
      'This permanently removes every receipt from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            setCount(0);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>
        <Row label="App version" value={Constants.expoConfig?.version || '1.0.0'} />
        <Row label="Receipt schema" value={`v${SCHEMA_VERSION}`} />
        <Row label="Receipts stored" value={String(count)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <Text style={styles.body}>
          Receipts are stored only on this device. Nothing is uploaded to any server.
        </Text>
      </View>

      <Pressable style={styles.danger} onPress={onClear}>
        <Text style={styles.dangerText}>Delete all receipts</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f4f5f7' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  rowLabel: { color: '#374151' },
  rowValue: { color: '#6b7280' },
  body: { color: '#374151', lineHeight: 20 },
  danger: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#fff' },
  dangerText: { color: '#dc2626', fontWeight: '600' },
});

export default Settings;
