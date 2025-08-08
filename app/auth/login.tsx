import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Heart, Shield, Lock } from 'lucide-react-native';
import AuthService, { AuthState } from '@/services/AuthService';

export default function LoginScreen() {
  const [authState, setAuthState] = useState<AuthState>(AuthService.getAuthState());

  useEffect(() => {
    // Listen for auth state changes
    AuthService.onAuthStateChange = (state) => {
      setAuthState(state);
      
      // Redirect to main app if authenticated
      if (state.isAuthenticated) {
        router.replace('/(tabs)/profile');
      }
    };

    // Check if already authenticated
    if (authState.isAuthenticated) {
      router.replace('/(tabs)/profile');
    }

    return () => {
      AuthService.onAuthStateChange = null;
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await AuthService.signInWithGoogle();
    } catch (error) {
      Alert.alert('Đăng Nhập Thất Bại', (error as Error).message);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await AuthService.signInWithApple();
    } catch (error) {
      Alert.alert('Đăng Nhập Thất Bại', (error as Error).message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Heart size={64} color="#ff6b9d" strokeWidth={1.5} fill="#ff6b9d" />
          </View>
          <Text style={styles.title}>Only You</Text>
          <Text style={styles.subtitle}>Đăng nhập để bắt đầu</Text>
        </View>

        {/* Security Notice */}
        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <Shield size={20} color="#4ade80" strokeWidth={2} />
            <Text style={styles.securityTitle}>Bảo Mật & Riêng Tư</Text>
          </View>
          <Text style={styles.securityDescription}>
            Chúng tôi không lưu trữ tin nhắn hay dữ liệu cá nhân của bạn. 
            Tất cả thông tin được mã hóa end-to-end.
          </Text>
        </View>

        {/* Login Buttons */}
        <View style={styles.loginSection}>
          <Text style={styles.loginTitle}>Chọn phương thức đăng nhập</Text>
          
          {/* Google Sign In */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={authState.isLoading}
          >
            {authState.isLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Image
                  source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                  style={styles.providerIcon}
                />
                <Text style={styles.googleButtonText}>Đăng nhập với Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Apple Sign In */}
          <TouchableOpacity
            style={styles.appleButton}
            onPress={handleAppleSignIn}
            disabled={authState.isLoading}
          >
            {authState.isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.appleIcon}></Text>
                <Text style={styles.appleButtonText}>Đăng nhập với Apple</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Lock size={16} color="#888" strokeWidth={2} />
          <Text style={styles.privacyText}>
            Bằng cách đăng nhập, bạn đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật của chúng tôi.
          </Text>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresPreview}>
          <Text style={styles.featuresTitle}>Tính năng nổi bật</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💕</Text>
              <Text style={styles.featureText}>Tin nhắn mã hóa end-to-end</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📞</Text>
              <Text style={styles.featureText}>Gọi thoại & video chất lượng cao</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔒</Text>
              <Text style={styles.featureText}>Chỉ dành cho 2 người</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  securityCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  securityDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  loginSection: {
    marginBottom: 32,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  appleButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
    gap: 12,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  providerIcon: {
    width: 20,
    height: 20,
  },
  appleIcon: {
    fontSize: 20,
    color: '#fff',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
    gap: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
    flex: 1,
  },
  featuresPreview: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
});
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  securityCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  securityDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  loginSection: {
    marginBottom: 32,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  appleButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
    gap: 12,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  providerIcon: {
    width: 20,
    height: 20,
  },
  appleIcon: {
    fontSize: 20,
    color: '#fff',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
    gap: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
    flex: 1,
  },
  featuresPreview: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
});