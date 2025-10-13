import React from 'react';
import { useTheme, useThemeColors } from '@/providers/ThemeProvider';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Fingerprint, Heart } from 'lucide-react-native';
import { usePrivacy } from '@/providers/PrivacyProvider';

export default function LockScreen() {
  const { authenticate } = usePrivacy();
  const { theme } = useTheme();
  const colors = useThemeColors();

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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors?.background }]}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Heart
            size={64}
            color={theme?.primary || '#ff6b9d'}
            strokeWidth={2}
            fill={theme?.primary || '#ff6b9d'}
          />
          <Text style={[styles.appName, { color: colors?.text }]}>
            Only You
          </Text>
        </View>

        {/* Lock Icon */}
        <View style={styles.lockContainer}>
          <Shield
            size={80}
            color={colors?.mutedText || colors?.text || '#666'}
            strokeWidth={1.5}
          />
        </View>

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={[styles.title, { color: colors?.text }]}>
            Ứng dụng đã được khóa
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors?.mutedText || colors?.text },
            ]}
          >
            Sử dụng sinh trắc học hoặc mật khẩu để mở khóa
          </Text>
        </View>

        {/* Unlock Button */}
        <TouchableOpacity
          style={[
            styles.unlockButton,
            { backgroundColor: theme?.primary || '#ff6b9d' },
          ]}
          onPress={handleUnlock}
        >
          <Fingerprint
            size={24}
            color={theme?.onPrimary || colors?.text || '#fff'}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.unlockButtonText,
              { color: theme?.onPrimary || colors?.text || '#fff' },
            ]}
          >
            Mở khóa
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
  },
  unlockButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
