import React from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Crown } from 'lucide-react-native';
import { router } from 'expo-router';
import { usePremium } from '@/providers/PremiumProvider';

interface PremiumGateProps {
  children: React.ReactNode;
  feature: string;
  style?: any;
}

export default function PremiumGate({ children, feature, style }: PremiumGateProps) {
  const { isPremium } = usePremium();

  const handlePress = () => {
    if (!isPremium) {
      Alert.alert(
        'Tính Năng Premier 👑',
        `${feature} là tính năng Premier. Nâng cấp để mở khóa!`,
        [
          { text: 'Để Sau', style: 'cancel' },
          { 
            text: 'Nâng Cấp', 
            onPress: () => router.push('/premium?openPayment=1')
          },
        ]
      );
      return;
    }
  };

  if (!isPremium) {
    return (
      <TouchableOpacity style={[style, styles.gateContainer]} onPress={handlePress}>
        {children}
        <Crown size={16} color="#f59e0b" strokeWidth={2} style={styles.crownIcon} />
      </TouchableOpacity>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  gateContainer: {
    position: 'relative',
  },
  crownIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 2,
  },
});