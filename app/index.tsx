import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService, { AuthState } from '@/services/AuthService';

export default function IndexScreen() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndNavigate = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

        if (!hasSeenOnboarding) {
          if (isMounted) router.replace('/onboarding');
          return;
        }

        const handleAuthStateChange = (authState: AuthState) => {
          if (!isMounted) return;

          if (!authState.isLoading) {
            AuthService.onAuthStateChange = null;

            if (authState.isAuthenticated) {
              router.replace('/(tabs)/profile');
            } else {
              router.replace('/auth/login');
            }
          }
        };

        const authState = AuthService.getAuthState();

        if (authState.isLoading) {
          AuthService.onAuthStateChange = handleAuthStateChange;
        } else {
          handleAuthStateChange(authState);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (isMounted) router.replace('/auth/login');
      }
    };

    checkAuthAndNavigate();

    return () => {
      isMounted = false;
      AuthService.onAuthStateChange = null;
    };
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
