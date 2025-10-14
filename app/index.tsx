import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, InteractionManager } from 'react-native';
import { useThemeColors } from '@/providers/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService, { AuthState } from '@/services/AuthService';
import WebRTCService from '@/services/WebRTCService';

export default function IndexScreen() {
  const [isChecking, setIsChecking] = useState(true);
  const colors = useThemeColors();

  useEffect(() => {
    // Wait for auth to be ready, then route accordingly
    const maybeRoute = (auth: AuthState) => {
      if (auth.isLoading) return;
      if (!auth.isAuthenticated) {
        router.replace('/auth/login');
        return;
      }
      try {
        const state = WebRTCService.getConnectionState?.();
        if (state?.isConnected) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(tabs)/connection');
        }
      } catch (e) {
        router.replace('/(tabs)/connection');
      }
    };

    // First check current state
    const current = AuthService.getAuthState();
    if (!current.isLoading) {
      maybeRoute(current);
      return;
    }

    // Subscribe to auth changes
    AuthService.onAuthStateChange = (state) => {
      maybeRoute(state);
    };

    // Cleanup listener on unmount
    return () => {
      if (AuthService.onAuthStateChange) {
        AuthService.onAuthStateChange = null;
      }
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color="#ff6b9d" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
