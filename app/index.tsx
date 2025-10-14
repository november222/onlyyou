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
    const task = InteractionManager.runAfterInteractions(() => {
      try {
        const state = WebRTCService.getConnectionState?.();
        if (state?.isConnected) {
          router.replace('/(tabs)'); // Touch screen (tabs index)
        } else {
          router.replace('/(tabs)/connection');
        }
      } catch (e) {
        router.replace('/(tabs)/connection');
      }
    });
    return () => task.cancel?.();
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
