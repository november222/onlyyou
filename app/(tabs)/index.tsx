import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Lock, Heart, Phone, Video, Wifi, WifiOff } from 'lucide-react-native';
import WebRTCService, { WebRTCMessage, ConnectionState } from '../../services/WebRTCService';
import CallScreen from '../../components/CallScreen';
import { isFeatureEnabled } from '../../config/features';
import BuzzService, { BuzzType } from '@/services/BuzzService';

export default function MessagesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<WebRTCMessage[]>([]);
  const [inputText, setInputText] = useState('');
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
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Set up WebRTC event listeners
    WebRTCService.onConnectionStateChange = (state) => {
      setConnectionState(state);
    };

    WebRTCService.onMessageReceived = (message) => {
      setMessages(prev => [...prev, message]);
    };

    // Load buzz cooldown status
    loadBuzzCooldowns();
    
    // Update cooldowns every second
    const cooldownTimer = setInterval(loadBuzzCooldowns, 1000);
    return () => {
      WebRTCService.onConnectionStateChange = null;
      WebRTCService.onMessageReceived = null;
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
    
    const result = await BuzzService.sendBuzz(type);
    
    if (result.success) {
      Alert.alert('Buzz Sent! 💕', `Đã gửi ${type} đến người yêu của bạn`);
      loadBuzzCooldowns(); // Refresh cooldown status
    } else {
      Alert.alert('Không thể gửi', result.error || 'Vui lòng thử lại');
    }
  };

  const sendMessage = () => {
    if (inputText.trim() === '') return;
    
    if (!connectionState.isConnected) {
      Alert.alert(t('messages:notConnected'), t('messages:pleaseConnect'));
      return;
    }

    const message = WebRTCService.sendMessage(inputText.trim());
    if (message) {
      setMessages(prev => [...prev, message]);
      setInputText('');
    } else {
      Alert.alert('Send Failed', 'Unable to send message. Please check your connection.');
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

  const renderMessage = ({ item }: { item: WebRTCMessage }) => (
    <View style={[
      styles.messageContainer,
      item.isOwn ? styles.ownMessage : styles.partnerMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.isOwn ? styles.ownBubble : styles.partnerBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.isOwn ? styles.ownMessageText : styles.partnerMessageText
        ]}>
          {item.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            item.isOwn ? styles.ownTimestamp : styles.partnerTimestamp
          ]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {item.isOwn && (
            <Text style={styles.messageStatus}>💕</Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.statusDot,
              { backgroundColor: connectionState.isConnected ? '#4ade80' : '#ef4444' }
            ]} />
            <Text style={styles.headerTitle}>My Love</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={startVoiceCall} disabled={!connectionState.isConnected}>
              <Phone 
                size={20} 
                color={connectionState.isConnected ? "#ff6b9d" : "#666"} 
                strokeWidth={2} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={startVideoCall} disabled={!connectionState.isConnected}>
              <Video 
                size={20} 
                color={connectionState.isConnected ? "#ff6b9d" : "#666"} 
                strokeWidth={2} 
              />
            </TouchableOpacity>
            <Lock size={20} color="#ff6b9d" strokeWidth={2} />
            {connectionState.isConnected ? (
              <Wifi size={20} color="#4ade80" strokeWidth={2} />
            ) : (
              <WifiOff size={20} color="#ef4444" strokeWidth={2} />
            )}
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          {connectionState.isConnected 
            ? t('messages:connectedEncrypted')
            : connectionState.isConnecting 
              ? t('messages:connecting')
              : connectionState.error || t('messages:notConnected')
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

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.bottom}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('messages:typeMessage')}
            placeholderTextColor="#666"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { opacity: inputText.trim() ? 1 : 0.5 }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Send size={20} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Call Modal */}
      <Modal
        visible={isInCall}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <CallScreen onEndCall={endCall} isVideoCall={isVideoCall} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
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
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 16,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  partnerMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ownBubble: {
    backgroundColor: '#ff6b9d',
    borderBottomRightRadius: 6,
  },
  partnerBubble: {
    backgroundColor: '#333',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#fff',
  },
  partnerMessageText: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  partnerTimestamp: {
    color: '#888',
  },
  messageStatus: {
    fontSize: 12,
    marginLeft: 8,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#111',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    backgroundColor: '#ff6b9d',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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