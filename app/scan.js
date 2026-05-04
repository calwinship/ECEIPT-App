import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { parseReceipt } from '../lib/schema';
import { saveReceipt } from '../lib/storage';

const ScanScreen = () => {
  const router = useRouter();
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const handledRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const onBarCodeScanned = async ({ data }) => {
    if (handledRef.current || !scanning) return;
    handledRef.current = true;
    setScanning(false);

    try {
      const receipt = parseReceipt(data);
      await saveReceipt(receipt);
      router.replace(`/receipt/${receipt.receipt_id}`);
    } catch (e) {
      Alert.alert('Could not read receipt', e.message ?? 'Unknown error', [
        {
          text: 'Try again',
          onPress: () => {
            handledRef.current = false;
            setScanning(true);
          },
        },
        { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
      ]);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Loading camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.body}>
          ECEIPT needs the camera to scan receipt QR codes. Receipts stay on your device.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant access</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        onBarCodeScanned={scanning ? onBarCodeScanned : undefined}
        barCodeScannerSettings={{ barCodeTypes: ['qr'] }}
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Point at a receipt QR code</Text>
      </View>
      <Pressable style={styles.cancel} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  body: { fontSize: 14, color: '#4b5563', textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#111827', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: '#2563eb' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  hint: { color: '#fff', marginTop: 16, fontSize: 14 },
  cancel: {
    position: 'absolute',
    top: 48,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  cancelText: { color: '#fff', fontWeight: '500' },
});

export default ScanScreen;
