import { Stack } from 'expo-router/stack';

export default function TouchLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, header: () => null }}>
      <Stack.Screen name="buzz-call" options={{ headerShown: false }} />
      <Stack.Screen name="calendar" options={{ headerShown: false }} />
      <Stack.Screen name="shared-gallery" options={{ headerShown: false }} />
    </Stack>
  );
}