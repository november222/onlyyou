import { useEffect } from 'react';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import AuthService from '@/services/AuthService';
import { I18nextProvider } from 'react-i18next';
import i18n, { initLanguage } from '@/i18n';
import { PremiumProvider } from '@/providers/PremiumProvider';
import { PrivacyProvider, usePrivacy } from '@/providers/PrivacyProvider';
import LockScreen from '@/components/LockScreen';
import { isFeatureEnabled } from '@/config/features';

// Only import crypto polyfill on native platforms
if (Platform.OS !== 'web') {
  require('react-native-get-random-values');
}

function AppContent() {
  const { isLocked, isLoading } = usePrivacy();

  if (isLoading) {
    return null; // Or loading screen
  }

  if (isLocked && isFeatureEnabled('privacyLock')) {
    return <LockScreen />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, header: () => null }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" backgroundColor="#000" translucent={false} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Initialize auth service
    AuthService.getAuthState();
    
    // Initialize language
    initLanguage();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
        <PremiumProvider>
          <PrivacyProvider>
            <AppContent />
          </PrivacyProvider>
        </PremiumProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}
