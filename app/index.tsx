import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AuthService, { AuthState } from '@/services/AuthService';

export default function IndexScreen() {
  useEffect(() => {
    // Check authentication status
    const authState = AuthService.getAuthState();
    
    const timer = setTimeout(() => {
      if (authState.isAuthenticated) {
        // User is logged in, go to main app
        router.replace('/(tabs)/profile');
      } else {
        // User not logged in, show login
        router.replace('/auth/login');
      }
    }, 1000);

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