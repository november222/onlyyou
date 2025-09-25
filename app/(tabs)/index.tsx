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
import BuzzService, { BuzzType } from '@/services/BuzzService';

export default function TouchScreen() {
  const { t } = useTranslation();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    roomCode: null,
    partnerConnected: false,
    error: null,
  });
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [buzzCooldowns, setBuzzCooldowns] = useState<Record<BuzzType, { canSend: boolean; remainingTime: number }>>({
    ping: { canSend: true, remainingTime: 0 },
    love: { canSend: true, remainingTime: 0 },
    miss: { canSend: true, remainingTime: 0 },
  });

  // Remove unused refs and state
  useEffect(() => {
    // Set up WebRTC event listeners
    WebRTCService.onConnectionStateChange = (state) => {
      setConnectionState(state);
    };

    // Load buzz cooldown status
    loadBuzzCooldowns();
    
    // Update cooldowns every second
    const cooldownTimer = setInterval(loadBuzzCooldowns, 1000);
    
    // Get initial connection state
    const currentState = WebRTCService.getConnectionState();
    setConnectionState(currentState);
    
    return () => {
      WebRTCService.onConnectionStateChange = null;
      clearInterval(cooldownTimer);
    };
  }, []);

  const loadBuzzCooldowns = async () => {
    if (isFeatureEnabled('buzz')) {
      const status = await BuzzService.getCooldownStatus();
      setBuzzCooldowns(status);
    }
  };

  const sendBuzz = async (type: BuzzType) => {
    if (!isFeatureEnabled('buzz')) return;
    
    if (!connectionState.isConnected) {
      Alert.alert('Chưa kết nối', 'Vui lòng kết nối với người yêu trước khi gửi buzz');
      return;
    }
    
    const result = await BuzzService.sendBuzz(type);
    
    if (result.success) {
      Alert.alert('Buzz Sent! 💕', `Đã gửi ${type} đến người yêu của bạn`);
      loadBuzzCooldowns(); // Refresh cooldown status
    } else {
      Alert.alert('Không thể gửi', result.error || 'Vui lòng thử lại');
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
              <Text style={styles.headerTitle}>Touch</Text>
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
          <View style={styles.buzzButtons}>
            <TouchableOpacity
              style={[styles.buzzButton, !buzzCooldowns.ping.canSend && styles.buzzButtonDisabled]}
              onPress={() => sendBuzz('ping')}
              disabled={!buzzCooldowns.ping.canSend}
            >
              <Text style={styles.buzzButtonText}>👋</Text>
              <Text style={styles.buzzButtonLabel}>Ping</Text>
              {!buzzCooldowns.ping.canSend && (
                <Text style={styles.buzzCooldown}>{Math.ceil(buzzCooldowns.ping.remainingTime / 1000)}s</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.buzzButton, !buzzCooldowns.love.canSend && styles.buzzButtonDisabled]}
              onPress={() => sendBuzz('love')}
              disabled={!buzzCooldowns.love.canSend}
            >
              <Text style={styles.buzzButtonText}>❤️</Text>
              <Text style={styles.buzzButtonLabel}>Love</Text>
              {!buzzCooldowns.love.canSend && (
                <Text style={styles.buzzCooldown}>{Math.ceil(buzzCooldowns.love.remainingTime / 1000)}s</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.buzzButton, !buzzCooldowns.miss.canSend && styles.buzzButtonDisabled]}
              onPress={() => sendBuzz('miss')}
              disabled={!buzzCooldowns.miss.canSend}
            >
              <Text style={styles.buzzButtonText}>🥺</Text>
              <Text style={styles.buzzButtonLabel}>Miss</Text>
              {!buzzCooldowns.miss.canSend && (
                <Text style={styles.buzzCooldown}>{Math.ceil(buzzCooldowns.miss.remainingTime / 1000)}s</Text>
              )}
            </TouchableOpacity>
          </View>
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
            style={[styles.touchButton, !connectionState.isConnected && styles.touchButtonDisabled]}
            onPress={() => router.push('/touch/buzz-call')}
            disabled={!connectionState.isConnected}
          >
            <Text style={styles.touchButtonIcon}>⚡</Text>
            <Text style={styles.touchButtonText}>Buzz Call</Text>
            {!connectionState.isConnected && <Text style={styles.touchButtonDisabledText}>Cần kết nối</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.touchButton, !connectionState.isConnected && styles.touchButtonDisabled]}
            onPress={() => router.push('/touch/calendar')}
            disabled={!connectionState.isConnected}
          >
            <Text style={styles.touchButtonIcon}>📅</Text>
            <Text style={styles.touchButtonText}>Calendar</Text>
            {!connectionState.isConnected && <Text style={styles.touchButtonDisabledText}>Cần kết nối</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.touchButton, !connectionState.isConnected && styles.touchButtonDisabled]}
            onPress={() => router.push('/touch/shared-gallery')}
            disabled={!connectionState.isConnected}
          >
            <Text style={styles.touchButtonIcon}>📸</Text>
            <Text style={styles.touchButtonText}>Gallery</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  buzzButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    minWidth: 60,
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
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  buzzCooldown: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
});