// Only import crypto polyfill on native platforms - MUST be first
if (require('react-native').Platform.OS !== 'web') {
  require('react-native-get-random-values');
}

import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { Platform, AppState, Alert, Linking } from 'react-native';
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
        <Stack.Screen name="intro" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      {/* Edge-to-edge: avoid backgroundColor/translucent warnings */}
      <StatusBar style="light" />
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
        await initLanguage();

        // Only initialize WebRTC after user is authenticated
        const authState = AuthService.getAuthState();
        if (authState.isAuthenticated) {
          await WebRTCService.init();
        }

        // Handle app state changes for connection timer
        const handleAppStateChange = (nextAppState: string) => {
          WebRTCService.handleAppStateChange(nextAppState);
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // Handle deep links
        const handleDeepLink = async (event: { url: string }) => {
          const url = event.url;
          console.log('Deep link received:', url);

          // Parse deep link: onlyyou://connect/ROOMCODE or https://onlyyou.app/connect/ROOMCODE
          const connectMatch = url.match(/(?:onlyyou:\/\/|https:\/\/onlyyou\.app\/)connect\/([A-Z0-9-]+)/i);

          if (connectMatch && connectMatch[1]) {
            const roomCode = connectMatch[1];
            console.log('Extracted room code:', roomCode);

            // Try to join the room
            try {
              // Require authentication before joining via deep link
              if (false && !AuthService.isAuthenticated()) {
                Alert.alert(
                  'Yêu cầu đăng nhập',
                  'Vui lòng đăng nhập trước khi kết nối phòng.',
                  [{ text: 'OK' }]
                );
                return;
              }
              await WebRTCService.connectToSignalingServer();
              await WebRTCService.joinRoom(roomCode);

              Alert.alert(
                'Kết nối thành công! 💕',
                `Đã tự động kết nối với người yêu qua mã: ${roomCode}`,
                [{ text: 'Tuyệt vời!' }]
              );
            } catch (error) {
              console.error('Failed to join room from deep link:', error);
              Alert.alert(
                'Kết nối thất bại',
                `Không thể tự động kết nối. Vui lòng nhập mã thủ công: ${roomCode}`,
                [{ text: 'OK' }]
              );
            }
          }
        };

        // Listen for deep links when app is already open
        const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

        // Check if app was opened via deep link
        Linking.getInitialURL().then((url) => {
          if (url) {
            handleDeepLink({ url });
          }
        });

        return () => {
          subscription?.remove();
          linkingSubscription?.remove();
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
