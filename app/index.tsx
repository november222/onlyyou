import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService, { AuthState } from '@/services/AuthService';

export default function IndexScreen() {
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        // Check if this is the first launch
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        
        if (!hasSeenOnboarding) {
          // First time user - show onboarding
          router.replace('/onboarding');
          return;
        }
        
        // Not first time - check authentication status
        const authState = AuthService.getAuthState();
        
        if (authState.isAuthenticated) {
          // User is logged in, go to main app
          router.replace('/(tabs)/profile');
        } else {
          // User not logged in, show login
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
        // Fallback to login screen
        router.replace('/auth/login');
      }
    };

    const timer = setTimeout(checkFirstLaunch, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ff6b9d" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});