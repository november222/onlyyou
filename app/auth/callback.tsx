import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AuthService from '@/services/AuthService';

export default function AuthCallbackScreen() {
  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { supabase } = await import('@/lib/supabase');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session error:', error);
            router.replace('/auth/login');
            return;
          }

          await new Promise(resolve => setTimeout(resolve, 500));
          router.replace('/(tabs)/profile');
        } else {
          router.replace('/auth/login');
        }
      }
    } catch (error) {
      console.error('Callback error:', error);
      router.replace('/auth/login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ff6b9d" />
      <Text style={styles.text}>Đang xử lý đăng nhập...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: '#fff',
  },
});
