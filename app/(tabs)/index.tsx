import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Wifi, WifiOff } from 'lucide-react-native';
import { router } from 'expo-router';
import WebRTCService, { WebRTCMessage, ConnectionState } from '../../services/WebRTCService';
import CallScreen from '../../components/CallScreen';
import { isFeatureEnabled } from '../../config/features';
import BuzzService, { BuzzTemplate } from '@/services/BuzzService';
import { usePremium } from '@/providers/PremiumProvider';
import { rateLimiter, RATE_LIMITS } from '@/services/RateLimiter';
import * as Haptics from 'expo-haptics';
import { notificationService } from '@/services/NotificationService';

export default function TouchScreen() {
  const { t } = useTranslation();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    roomCode: null,
    partnerConnected: false,
    error: null,
    isWaitingForPartner: false,
  });
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [buzzCooldown, setBuzzCooldown] = useState<{ canSend: boolean; remainingTime: number }>({
    canSend: true,
    remainingTime: 0,
  });
  const [buzzTemplates, setBuzzTemplates] = useState<BuzzTemplate[]>([]);
  const { isPremium } = usePremium();
  const [partnerName, setPartnerName] = useState<string>('Touch');

  // Remove unused refs and state
  useEffect(() => {
    // Set up WebRTC event listeners
    WebRTCService.onConnectionStateChange = (state) => {
      setConnectionState(state);
    };

    // Set up BuzzService event listener
    BuzzService.onBuzzTemplatesChanged = () => {
      loadBuzzTemplates();
    };

    // Load partner name
    loadPartnerName();

    // Load buzz cooldown status
    loadBuzzCooldown();
    loadBuzzTemplates();

    // Update cooldowns every second
    const cooldownTimer = setInterval(loadBuzzCooldown, 1000);

    // Get initial connection state
    const currentState = WebRTCService.getConnectionState();
    setConnectionState(currentState);

    // Setup notification listeners
    if (Platform.OS !== 'web') {
      notificationService.registerForPushNotifications();

      const notificationListener = notificationService.addNotificationReceivedListener(
        (notification) => {
          console.log('Notification received:', notification);
        }
      );

      const responseListener = notificationService.addNotificationResponseReceivedListener(
        (response) => {
          console.log('Notification clicked:', response);
          const { type } = response.notification.request.content.data;
          if (type === 'buzz') {
            Alert.alert('Opening Buzz', 'Navigate to buzz screen here');
          }
        }
      );

      return () => {
        WebRTCService.onConnectionStateChange = null;
        BuzzService.onBuzzTemplatesChanged = null;
        clearInterval(cooldownTimer);
        notificationListener.remove();
        responseListener.remove();
      };
    }

    return () => {
      WebRTCService.onConnectionStateChange = null;
      BuzzService.onBuzzTemplatesChanged = null;
      clearInterval(cooldownTimer);
    };
  }, []);

  const loadPartnerName = () => {
    const savedConnection = WebRTCService.getSavedConnection();
    if (savedConnection?.partnerName) {
      setPartnerName(savedConnection.partnerName);
    }
  };

  const loadBuzzCooldown = async () => {
    if (isFeatureEnabled('buzz')) {
      const rateLimitCheck = rateLimiter.canPerformAction('buzz_send', RATE_LIMITS.BUZZ);
      setBuzzCooldown({
        canSend: rateLimitCheck.allowed,
        remainingTime: rateLimitCheck.waitTime ? rateLimitCheck.waitTime * 1000 : 0,
      });
    }
  };

  const loadBuzzTemplates = async () => {
    if (isFeatureEnabled('buzz')) {
      const templates = await BuzzService.getQuickBuzzTemplates(isPremium);
      setBuzzTemplates(templates);
    }
  };

  const sendBuzz = async (templateId: string) => {
    if (!isFeatureEnabled('buzz')) return;

    if (!connectionState.isConnected) {
      Alert.alert('Not Connected', 'Please connect with your partner before sending buzz');
      return;
    }

    const recentCount = rateLimiter.getActionCount('buzz_send', 10 * 60 * 1000);

    if (recentCount >= 8 && recentCount < 10) {
      Alert.alert(
        '⚠️ Cảnh Báo Spam',
        `Bạn đã gửi ${recentCount}/10 buzz trong 10 phút. Nếu gửi đủ 10 lần, bạn sẽ bị khóa 10 phút!`,
        [{ text: 'Đã Hiểu' }]
      );
    }

    const result = await BuzzService.sendBuzz(templateId);

    if (result.success) {
      const template = buzzTemplates.find(t => t.id === templateId);
      Alert.alert('Buzz Sent! 💕', `Sent "${template?.text}" to your partner`);
      loadBuzzCooldown();
    } else {
      Alert.alert('Cannot Send', result.error || 'Please try again');
    }
  };


  const startVoiceCall = async () => {
    if (!connectionState.isConnected) {
      Alert.alert(t('messages:notConnected'), t('messages:pleaseConnect'));
      return;
    }
    
    if (isFeatureEnabled('simpleCallLink')) {
      // Use system calling instead of WebRTC
      Alert.alert(
        'Gọi Điện Thoại',
        'Mở ứng dụng gọi điện của hệ thống?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Gọi',
            onPress: () => {
              const phoneNumber = '+1234567890'; // Mock partner number
              const url = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
              Linking.openURL(url).catch(() => {
                Alert.alert('Lỗi', 'Không thể mở ứng dụng gọi điện');
              });
            },
          },
        ]
      );
    } else {
      setIsVideoCall(false);
      setIsInCall(true);
    }
  };

  const startVideoCall = async () => {
    if (!connectionState.isConnected) {
      Alert.alert(t('messages:notConnected'), t('messages:pleaseConnect'));
      return;
    }
    
    if (isFeatureEnabled('simpleCallLink')) {
      // Use FaceTime for iOS, fallback to regular call for Android
      Alert.alert(
        'Video Call',
        Platform.OS === 'ios' ? 'Mở FaceTime?' : 'Mở ứng dụng gọi điện?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: Platform.OS === 'ios' ? 'FaceTime' : 'Gọi',
            onPress: () => {
              const phoneNumber = '+1234567890'; // Mock partner number
              let url: string;
              
              if (Platform.OS === 'ios') {
                url = `facetime:${phoneNumber}`;
              } else {
                url = `tel:${phoneNumber}`;
              }
              
              Linking.openURL(url).catch(() => {
                Alert.alert('Lỗi', 'Không thể mở ứng dụng gọi');
              });
            },
          },
        ]
      );
    } else {
      setIsVideoCall(true);
      setIsInCall(true);
    }
  };

  const endCall = () => {
    setIsInCall(false);
    setIsVideoCall(false);
  };

  const getPartnerDisplayName = () => {
    if (connectionState.isConnected && connectionState.roomCode) {
      return `Room: ${connectionState.roomCode}`;
    }
    return 'Chưa kết nối';
  };
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.statusDot,
              { backgroundColor: connectionState.isConnected ? '#4ade80' : '#ef4444' }
            ]} />
            <View style={styles.connectionInfo}>
              <Text style={styles.headerTitle}>{partnerName}</Text>
              <Text style={styles.partnerName}>{getPartnerDisplayName()}</Text>
            </View>
          </View>
          <View style={styles.connectionStatusIcon}>
            {connectionState.isConnected ? (
              <Wifi size={20} color="#4ade80" strokeWidth={2} />
            ) : (
              <WifiOff size={20} color="#ef4444" strokeWidth={2} />
            )}
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          {connectionState.isConnected 
            ? 'Đã kết nối • Mã hóa đầu cuối'
            : connectionState.isConnecting 
              ? 'Đang kết nối...'
              : connectionState.error || 'Kết nối để sử dụng tính năng touch'
          }
        </Text>
      </View>

      {/* Buzz Buttons */}
      {isFeatureEnabled('buzz') && (
        <View style={styles.buzzContainer}>
          <Text style={styles.buzzTitle}>Quick Buzz 💕</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.buzzButtons}
          >
            {buzzTemplates.slice(0, isPremium ? buzzTemplates.length : 5).map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[styles.buzzButton, !buzzCooldown.canSend && styles.buzzButtonDisabled]}
                onPress={() => sendBuzz(template.id)}
                disabled={!buzzCooldown.canSend}
              >
                <Text style={styles.buzzButtonText}>{template.emoji || '💫'}</Text>
                <Text style={styles.buzzButtonLabel} numberOfLines={2}>
                  {template.text}
                </Text>
                {template.type === 'custom' && (
                  <Text style={styles.customBadge}>Custom</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          {!buzzCooldown.canSend && (
            <Text style={styles.cooldownMessage}>
              {buzzCooldown.remainingTime > 60000
                ? `⚠️ Đã bị khóa do spam! Chờ ${Math.floor(buzzCooldown.remainingTime / 60000)} phút ${Math.ceil((buzzCooldown.remainingTime % 60000) / 1000)} giây`
                : `Chờ ${Math.ceil(buzzCooldown.remainingTime / 1000)} giây trước khi gửi buzz tiếp`}
            </Text>
          )}
        </View>
      )}

      {/* Touch Navigation */}
      <View style={styles.touchNavigation}>
        <Text style={styles.touchTitle}>Touch Interface</Text>
        <Text style={styles.touchSubtitle}>
          {connectionState.isConnected 
            ? 'Chọn cách tương tác với người yêu' 
            : 'Kết nối để mở khóa các tính năng'
          }
        </Text>
        
        <View style={styles.touchButtons}>
          <TouchableOpacity
            style={[
              styles.touchButton,
              (!connectionState.isConnected || !isPremium) && styles.touchButtonDisabled
            ]}
            onPress={() => {
              if (!isPremium) {
                Alert.alert(
                  'Tính Năng Premium 👑',
                  'Buzz Call là tính năng dành cho người dùng Premium.',
                  [
                    { text: 'Để Sau', style: 'cancel' },
                    { text: 'Nâng Cấp', onPress: () => router.push('/premium') },
                  ]
                );
              } else {
                router.push('/touch/buzz-call');
              }
            }}
            disabled={!connectionState.isConnected}
          >
            <Text style={styles.touchButtonIcon}>⚡</Text>
            <Text style={styles.touchButtonText}>Buzz Call</Text>
            {!isPremium && <Text style={styles.touchButtonPremiumBadge}>👑 Premium</Text>}
            {!connectionState.isConnected && <Text style={styles.touchButtonDisabledText}>Cần kết nối</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.touchButton,
              (!connectionState.isConnected || !isPremium) && styles.touchButtonDisabled
            ]}
            onPress={() => {
              if (!isPremium) {
                Alert.alert(
                  'Tính Năng Premium 👑',
                  'Calendar là tính năng dành cho người dùng Premium.',
                  [
                    { text: 'Để Sau', style: 'cancel' },
                    { text: 'Nâng Cấp', onPress: () => router.push('/premium') },
                  ]
                );
              } else {
                router.push('/touch/calendar');
              }
            }}
            disabled={!connectionState.isConnected}
          >
            <Text style={styles.touchButtonIcon}>📅</Text>
            <Text style={styles.touchButtonText}>Calendar</Text>
            {!isPremium && <Text style={styles.touchButtonPremiumBadge}>👑 Premium</Text>}
            {!connectionState.isConnected && <Text style={styles.touchButtonDisabledText}>Cần kết nối</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.touchButton,
              (!connectionState.isConnected || !isPremium) && styles.touchButtonDisabled
            ]}
            onPress={() => {
              if (!isPremium) {
                Alert.alert(
                  'Tính Năng Premium 👑',
                  'Gallery là tính năng dành cho người dùng Premium.',
                  [
                    { text: 'Để Sau', style: 'cancel' },
                    { text: 'Nâng Cấp', onPress: () => router.push('/premium') },
                  ]
                );
              } else {
                router.push('/touch/shared-gallery');
              }
            }}
            disabled={!connectionState.isConnected}
          >
            <Text style={styles.touchButtonIcon}>📸</Text>
            <Text style={styles.touchButtonText}>Gallery</Text>
            {!isPremium && <Text style={styles.touchButtonPremiumBadge}>👑 Premium</Text>}
            {!connectionState.isConnected && <Text style={styles.touchButtonDisabledText}>Cần kết nối</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Call Modal */}
      <Modal
        visible={isInCall}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <CallScreen onEndCall={endCall} isVideoCall={isVideoCall} />
      </Modal>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionInfo: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  partnerName: {
    fontSize: 12,
    color: '#888',
  },
  connectionStatusIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginLeft: 16,
  },
  touchNavigation: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  touchSubtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
    textAlign: 'center',
  },
  touchButtons: {
    width: '100%',
    gap: 20,
  },
  touchButton: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  touchButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#0a0a0a',
  },
  touchButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  touchButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  touchButtonDisabledText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  touchButtonPremiumBadge: {
    fontSize: 11,
    color: '#f59e0b',
    marginTop: 4,
    fontWeight: '600',
  },
  buzzContainer: {
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  buzzTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b9d',
    marginBottom: 12,
    textAlign: 'center',
  },
  buzzButtons: {
    paddingHorizontal: 10,
    gap: 12,
  },
  buzzButton: {
    alignItems: 'center', 
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    minWidth: 80,
    maxWidth: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.2)',
    position: 'relative',
  },
  buzzButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#333',
  },
  buzzButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  buzzButtonLabel: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 4,
  },
  customBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 8,
    color: '#fff',
    fontWeight: '600',
  },
  buzzCooldownText: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  cooldownMessage: {
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 8,
  },
});