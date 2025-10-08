import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Heart } from 'lucide-react-native';
import AuthService from '@/services/AuthService';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingApple, setIsLoadingApple] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoadingGoogle(true);
    try {
      const success = await AuthService.signInWithGoogle();
      if (success && AuthService.isAuthenticated()) {
        router.replace('/(tabs)/profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dang nhap that bai');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setIsLoadingApple(true);
    try {
      const success = await AuthService.signInWithApple();
      if (success && AuthService.isAuthenticated()) {
        router.replace('/(tabs)/profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dang nhap that bai');
    } finally {
      setIsLoadingApple(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: '' }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Heart size={64} color="#ff6b9d" strokeWidth={2} fill="#ff6b9d" />
            <Text style={styles.title}>{t('auth:title')}</Text>
            <Text style={styles.subtitle}>{t('auth:subtitle')}</Text>
          </View>

          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[styles.googleButton, isLoadingGoogle && styles.disabledButton]}
              onPress={handleGoogleSignIn}
              disabled={isLoadingGoogle}
            >
              {isLoadingGoogle ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <View style={styles.googleIcon}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={styles.buttonText}>Tiếp tục với Google</Text>
                </>
              )}
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth:termsText')}</Text>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonSection: {
    gap: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  googleIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#4285f4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
