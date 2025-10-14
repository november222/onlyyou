import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/providers/ThemeProvider';
import { router } from 'expo-router';
import AuthService from '@/services/AuthService';

export default function AuthCallbackScreen() {
  const colors = useThemeColors();
  const { theme } = useTheme();
  const { t } = require("react-i18next").useTranslation();
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
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session error:', error);
            router.replace('/auth/login');
            return;
          }

          if (data.session) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const authState = AuthService.getAuthState();
            if (authState.isAuthenticated) {
              router.replace('/(tabs)/connection');
            } else {
              router.replace('/auth/login');
            }
          } else {
            router.replace('/auth/login');
          }
        } else {
          router.replace('/auth/login');
        }
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Callback error:', error);
      router.replace('/auth/login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.text, { color: colors.text }]}>{t('auth:processing')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
    gap: 16,
  },
  text: {
    fontSize: 16,
  },
});
