// Only import crypto polyfill on native platforms - MUST be first
if (require('react-native').Platform.OS !== 'web') {
  require('react-native-get-random-values');
}

import { useEffect } from 'react';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { Platform, AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import AuthService from '@/services/AuthService';
import WebRTCService from '@/services/WebRTCService';
import { I18nextProvider } from 'react-i18next';
import i18n, { initLanguage } from '@/i18n';
import { PremiumProvider } from '@/providers/PremiumProvider';
import { PrivacyProvider, usePrivacy } from '@/providers/PrivacyProvider';
import LockScreen from '@/components/LockScreen';
import { isFeatureEnabled } from '@/config/features';


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
        <Stack.Screen name="auth" options={{ headerShown: false }} />
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
    initializeServices().catch((error) => {
      console.error('Service initialization failed:', error);
    });
    
    async function initializeServices() {
      try {
        // Initialize services in sequence
        await AuthService.init();
        await WebRTCService.init();
        await initLanguage();
        
        // Handle app state changes for connection timer
        const handleAppStateChange = (nextAppState: string) => {
          WebRTCService.handleAppStateChange(nextAppState);
        };
        
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        
        return () => {
          subscription?.remove();
        };
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    }
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
