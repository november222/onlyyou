import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, InteractionManager } from 'react-native';
import { useThemeColors } from '@/providers/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService, { AuthState } from '@/services/AuthService';

export default function IndexScreen() {
  const [isChecking, setIsChecking] = useState(true);
  const colors = useThemeColors();

  useEffect(() => {
    // Bypass auth: always go to tabs for UI/UX work
    const task = InteractionManager.runAfterInteractions(() => {
      router.replace('/(tabs)/profile');
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
