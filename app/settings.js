import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { clearAll, loadReceipts } from '../lib/storage';
import { SCHEMA_VERSION } from '../lib/schema';
import { receiptsToCSV } from '../lib/export';
import { loadPreferences, savePreferences, PREFERENCE_DEFAULTS } from '../lib/preferences';
import { sanitizePreferences } from '../lib/preferences-schema';

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const Settings = () => {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [returnDays, setReturnDays] = useState(String(PREFERENCE_DEFAULTS.return_window_days));

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([loadReceipts(), loadPreferences()]).then(([r, p]) => {
        if (cancelled) return;
        setCount(r.length);
        setReturnDays(String(p.return_window_days));
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const persistReturnDays = async () => {
    const sanitized = sanitizePreferences({ return_window_days: returnDays });
    await savePreferences({ return_window_days: sanitized.return_window_days });
    setReturnDays(String(sanitized.return_window_days));
  };

  const onExportAll = async () => {
    const all = await loadReceipts();
    if (all.length === 0) {
      Alert.alert('Nothing to export', 'You have no receipts yet.');
      return;
    }
    try {
      await Share.share({
        message: receiptsToCSV(all),
        title: 'eceipt-export.csv',
      });
    } catch {
      // ignore
    }
  };

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
        <Text style={styles.sectionTitle}>Returns</Text>
        <Text style={styles.body}>
          The "days left to return" badge appears on receipts purchased within this window.
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={returnDays}
            onChangeText={setReturnDays}
            onBlur={persistReturnDays}
            keyboardType="number-pad"
            maxLength={4}
            accessibilityLabel="Return window in days"
          />
          <Text style={styles.inputSuffix}>days</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <Text style={styles.body}>
          Receipts are stored only on this device. Nothing is uploaded to any server.
        </Text>
      </View>

      <Pressable
        style={styles.action}
        onPress={onExportAll}
        accessibilityRole="button"
        accessibilityLabel="Export all receipts as CSV"
      >
        <Text style={styles.actionText}>Export all as CSV</Text>
      </Pressable>

      <Pressable
        style={styles.danger}
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel="Delete all receipts"
        accessibilityHint="Permanently removes every receipt from this device"
      >
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
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  input: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    width: 100,
    textAlign: 'center',
  },
  inputSuffix: { marginLeft: 10, color: '#374151' },
  action: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#111827',
    marginBottom: 8,
  },
  actionText: { color: '#fff', fontWeight: '600' },
  danger: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#fff' },
  dangerText: { color: '#dc2626', fontWeight: '600' },
});

export default Settings;
