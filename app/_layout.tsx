import { useEffect } from 'react';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import AuthService from '@/services/AuthService';

// Only import crypto polyfill on native platforms
if (Platform.OS !== 'web') {
  require('react-native-get-random-values');
}

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Initialize auth service
    AuthService.getAuthState();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <>
        <Stack>
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </>
    </GestureHandlerRootView>
  );
}
