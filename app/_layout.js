import { Stack } from 'expo-router';

const Layout = () => (
  <Stack>
    <Stack.Screen name="index" options={{ title: 'Receipts' }} />
    <Stack.Screen name="scan" options={{ title: 'Scan receipt', presentation: 'modal' }} />
    <Stack.Screen name="receipt/[id]" options={{ title: 'Receipt' }} />
  </Stack>
);

export default Layout;
