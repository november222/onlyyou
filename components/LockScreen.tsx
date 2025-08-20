import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Fingerprint, Heart } from 'lucide-react-native';
import { usePrivacy } from '@/providers/PrivacyProvider';

export default function LockScreen() {
  const { authenticate } = usePrivacy();

  const handleUnlock = async () => {
    const success = await authenticate();
    
    if (!success) {
      Alert.alert(
        'Xác thực thất bại',
        'Vui lòng thử lại để mở khóa ứng dụng.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Heart size={64} color="#ff6b9d" strokeWidth={2} fill="#ff6b9d" />
          <Text style={styles.appName}>Only You</Text>
        </View>

        {/* Lock Icon */}
        <View style={styles.lockContainer}>
          <Shield size={80} color="#666" strokeWidth={1.5} />
        </View>

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Ứng dụng đã được khóa</Text>
          <Text style={styles.subtitle}>
            Sử dụng sinh trắc học hoặc mật khẩu để mở khóa
          </Text>
        </View>

        {/* Unlock Button */}
        <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
          <Fingerprint size={24} color="#fff" strokeWidth={2} />
          <Text style={styles.unlockButtonText}>Mở khóa</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  lockContainer: {
    marginBottom: 40,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b9d',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
  },
  unlockButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});