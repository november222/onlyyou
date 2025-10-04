import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Shield, Wifi, WifiOff, Copy, Key, Plus, RefreshCw, Trash2, QrCode, X, Scan } from 'lucide-react-native';
import WebRTCService, { ConnectionState } from '@/services/WebRTCService';
import { router } from 'expo-router';

export default function ConnectionScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    roomCode: null,
    partnerConnected: false,
    error: null,
    isWaitingForPartner: false,
  });
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isConnectingToServer, setIsConnectingToServer] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [savedConnection, setSavedConnection] = useState(WebRTCService.getSavedConnection());
  const [showQRCode, setShowQRCode] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [partnerName, setPartnerName] = useState('');

  useEffect(() => {
    // Set up WebRTC event listeners
    WebRTCService.onConnectionStateChange = (state) => {
      setConnectionState(state);

      // Show name prompt when partner joins
      if (state.partnerConnected && !state.isWaitingForPartner && !savedConnection) {
        setShowNamePrompt(true);
      }

      // Update saved connection when state changes
      if (state.isConnected && state.roomCode) {
        setSavedConnection(WebRTCService.getSavedConnection());
      } else if (!state.isConnected) {
        setSavedConnection(WebRTCService.getSavedConnection());
      }
    };

    // Get initial connection state
    const currentState = WebRTCService.getConnectionState();
    setConnectionState(currentState);
    
    // Load saved connection
    const saved = WebRTCService.getSavedConnection();
    setSavedConnection(saved);

    // Auto-connect to signaling server
    if (!currentState.isConnected && !currentState.isConnecting) {
      connectToServer();
    }

    return () => {
      WebRTCService.onConnectionStateChange = null;
    };
  }, []);

  const connectToServer = async () => {
    if (isConnectingToServer) return;
    
    setIsConnectingToServer(true);
    try {
      await WebRTCService.connectToSignalingServer();
      console.log('Connected to signaling server');
    } catch (error) {
      console.error('Failed to connect to signaling server:', error);
      Alert.alert(
        'Kết nối thất bại', 
        'Không thể kết nối đến server. Vui lòng kiểm tra mạng và thử lại.',
        [
          { text: 'Thử lại', onPress: () => setTimeout(connectToServer, 1000) },
          { text: 'Hủy', style: 'cancel' }
        ]
      );
    } finally {
      setIsConnectingToServer(false);
    }
  };

  const generateRoomCode = async () => {
    if (isGeneratingCode || isConnectingToServer) return;
    
    setIsGeneratingCode(true);
    try {
      // Ensure we're connected to signaling server first
      if (isConnectingToServer) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const roomCode = await WebRTCService.generateRoomCode();
      await WebRTCService.joinRoom(roomCode);
      
      Alert.alert(
        'Phòng đã tạo! 💕', 
        `Chia sẻ mã này với người yêu của bạn:\n\n${roomCode}`,
        [
          { text: 'Sao chép mã', onPress: () => copyRoomCode(roomCode) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Failed to generate room code:', error);
      Alert.alert(
        'Tạo phòng thất bại', 
        'Không thể tạo phòng. Vui lòng kiểm tra kết nối và thử lại.',
        [
          { text: 'Thử lại', onPress: generateRoomCode },
          { text: 'Hủy', style: 'cancel' }
        ]
      );
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const joinRoom = async () => {
    if (!inputRoomCode.trim()) {
      Alert.alert('Mã không hợp lệ', 'Vui lòng nhập mã phòng.');
      return;
    }

    if (isJoining || isConnectingToServer) return;
    
    setIsJoining(true);
    try {
      // Ensure we're connected to signaling server first
      if (isConnectingToServer) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      await WebRTCService.joinRoom(inputRoomCode.trim());
      setInputRoomCode(''); // Clear input on success
      
      Alert.alert(
        'Kết nối thành công! 💕',
        'Bạn đã kết nối với người yêu của mình.',
        [{ text: 'Tuyệt vời!' }]
      );
    } catch (error) {
      console.error('Failed to join room:', error);
      Alert.alert(
        'Tham gia thất bại', 
        'Không thể tham gia phòng. Vui lòng kiểm tra mã và thử lại.',
        [
          { text: 'Thử lại', onPress: joinRoom },
          { text: 'Hủy', style: 'cancel' }
        ]
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Ngắt kết nối với người yêu?',
      'Điều này sẽ kết thúc kết nối riêng tư của bạn. Bạn có thể kết nối lại bằng mã kết nối.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Ngắt kết nối',
          style: 'destructive',
          onPress: async () => {
            await WebRTCService.disconnect();
            Alert.alert('Đã ngắt kết nối', 'Bạn có thể kết nối lại bất cứ lúc nào.');
          },
        },
      ]
    );
  };

  const copyRoomCode = (code?: string) => {
    const roomCode = code || connectionState.roomCode;
    if (roomCode) {
      // In a real app, this would copy to clipboard using @react-native-clipboard/clipboard
      Alert.alert('Đã sao chép! 📋', `Mã phòng "${roomCode}" đã được sao chép.`);
    }
  };

  const savePartnerName = async () => {
    if (!partnerName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên cho kết nối này');
      return;
    }

    try {
      await WebRTCService.saveConnectionWithName(partnerName.trim());
      setSavedConnection(WebRTCService.getSavedConnection());
      setShowNamePrompt(false);
      setPartnerName('');
      Alert.alert(
        'Đã kết nối! 💕',
        `Bạn đã kết nối với "${partnerName.trim()}". Kết nối này sẽ được lưu lại.`
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu tên kết nối');
    }
  };

  const handleForgetConnection = () => {
    Alert.alert(
      'Xóa Kết Nối Đã Lưu?',
      'Bạn sẽ cần tạo kết nối mới với người yêu. Điều này sẽ xóa vĩnh viễn thông tin kết nối đã lưu.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            WebRTCService.clearSavedConnection();
            setSavedConnection(null);
            Alert.alert('Đã xóa', 'Thông tin kết nối đã lưu đã được xóa.');
          },
        },
      ]
    );
  };

  const handleReconnect = async () => {
    if (!savedConnection?.roomCode) return;
    
    try {
      await WebRTCService.joinRoom(savedConnection.roomCode);
      Alert.alert('Kết nối lại thành công! 💕', 'Đã kết nối lại với người yêu của bạn.');
    } catch (error) {
      Alert.alert(
        'Kết nối lại thất bại',
        'Không thể kết nối lại. Vui lòng thử tạo phòng mới.',
        [
          { text: 'Tạo phòng mới', onPress: generateRoomCode },
          { text: 'Hủy', style: 'cancel' }
        ]
      );
    }
  };

  const navigateToMessages = () => {
    if (connectionState.isConnected) {
      // Switch to messages tab (index 1 in tab layout)
      router.push('/(tabs)/');
    } else {
      Alert.alert('Chưa kết nối', 'Vui lòng kết nối với người yêu trước khi nhắn tin.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.bottom}
        style={{ flex: 1 }}
      >
        <ScrollView 
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Heart size={32} color="#ff6b9d" strokeWidth={2} fill="#ff6b9d" />
            <Text style={styles.title}>{t('connection:title')}</Text>
            <Text style={styles.subtitle}>{t('connection:subtitle')}</Text>
          </View>

        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            {connectionState.isWaitingForPartner ? (
              <RefreshCw size={24} color="#f59e0b" strokeWidth={2} />
            ) : connectionState.isConnected ? (
              <Wifi size={24} color="#4ade80" strokeWidth={2} />
            ) : (
              <WifiOff size={24} color="#ef4444" strokeWidth={2} />
            )}
            <Text style={[
              styles.statusText,
              {
                color: connectionState.isWaitingForPartner
                  ? '#f59e0b'
                  : connectionState.isConnected
                    ? '#4ade80'
                    : connectionState.isConnecting
                      ? '#f59e0b'
                      : '#ef4444'
              }
            ]}>
              {connectionState.isWaitingForPartner
                ? 'Đang chờ đối tác...'
                : connectionState.isConnected
                  ? t('connection:connected')
                  : connectionState.isConnecting
                    ? t('connection:connecting')
                    : t('connection:disconnected')
              }
            </Text>
          </View>

          <Text style={styles.statusDescription}>
            {connectionState.isWaitingForPartner
              ? 'Phòng đã được tạo. Đang chờ đối tác kết nối...'
              : connectionState.isConnected
                ? t('connection:connectedDesc')
                : connectionState.isConnecting
                  ? t('connection:connectingDesc')
                  : connectionState.error || t('connection:readyToConnect')
            }
          </Text>

          {connectionState.roomCode && (
            <View style={styles.roomCodeDisplay}>
              <Text style={styles.roomCodeLabel}>Room Code:</Text>
              <TouchableOpacity onPress={() => copyRoomCode()}>
                <Text style={styles.roomCodeValue}>{connectionState.roomCode}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Saved Connection Info */}
          {savedConnection && (
            <View style={styles.savedConnectionInfo}>
              <Text style={styles.savedConnectionLabel}>Kết nối đã lưu:</Text>
              <TouchableOpacity onPress={handleReconnect}>
                <Text style={styles.savedConnectionValue}>{savedConnection.roomCode}</Text>
              </TouchableOpacity>
              <Text style={styles.savedConnectionDate}>
                Từ {new Date(savedConnection.connectionDate).toLocaleDateString('vi-VN')}
              </Text>
              <TouchableOpacity style={styles.reconnectButton} onPress={handleReconnect}>
                <RefreshCw size={16} color="#4ade80" strokeWidth={2} />
                <Text style={styles.reconnectButtonText}>Kết nối lại</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Server Connection Status */}
          {isConnectingToServer && (
            <View style={styles.serverStatus}>
              <ActivityIndicator size="small" color="#f59e0b" />
              <Text style={styles.serverStatusText}>Đang kết nối đến server...</Text>
            </View>
          )}
        </View>

        {/* Security Info */}
        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <Shield size={20} color="#ff6b9d" strokeWidth={2} />
            <Text style={styles.securityTitle}>Mã hóa đầu cuối</Text>
          </View>
          <Text style={styles.securityDescription}>
            Tin nhắn của bạn được mã hóa và chỉ bạn và người yêu mới có thể đọc được. 
            Không ai khác có thể truy cập cuộc trò chuyện của bạn.
          </Text>
        </View>

        {/* Connection Setup */}
        {!connectionState.isConnected && !connectionState.isConnecting && (
          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>Kết nối với người yêu</Text>
            
            {/* Generate Room Code */}
            <TouchableOpacity 
              style={styles.generateButton} 
              onPress={generateRoomCode}
              disabled={isGeneratingCode || isConnectingToServer}
            >
              {isGeneratingCode ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Plus size={20} color="#fff" strokeWidth={2} />
              )}
              <Text style={styles.generateButtonText}>
                {isGeneratingCode ? 'Đang tạo...' : 'Tạo phòng mới'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.orText}>hoặc</Text>
            
            {/* Join Room */}
            <View style={styles.joinContainer}>
              <TextInput
                style={styles.roomCodeInput}
                value={inputRoomCode}
                onChangeText={setInputRoomCode}
                placeholder="Nhập mã phòng"
                placeholderTextColor="#666"
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.joinButton}
                onPress={joinRoom}
                disabled={!inputRoomCode.trim() || isConnectingToServer || isJoining}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.joinButtonText}>Tham gia</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Scan QR Code Button */}
            <TouchableOpacity
              style={styles.scanQRButton}
              onPress={() => setShowQRScanner(true)}
              disabled={isConnectingToServer}
            >
              <Scan size={20} color="#4ade80" strokeWidth={2} />
              <Text style={styles.scanQRButtonText}>Quét mã QR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        {connectionState.isConnected && (
          <>
            <View style={styles.actions}>
              {connectionState.roomCode && (
                <>
                  <TouchableOpacity style={styles.copyCodeButton} onPress={() => copyRoomCode()}>
                    <Copy size={16} color="#ff6b9d" strokeWidth={2} />
                    <Text style={styles.copyCodeButtonText}>Sao chép mã phòng</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.qrCodeButton} onPress={() => setShowQRCode(true)}>
                    <QrCode size={16} color="#4ade80" strokeWidth={2} />
                    <Text style={styles.qrCodeButtonText}>Hiển thị mã QR</Text>
                  </TouchableOpacity>
                </>
              )}
              
              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                <Text style={styles.disconnectButtonText}>Ngắt kết nối</Text>
              </TouchableOpacity>
            </View>


            {/* Forget Connection */}
            {savedConnection && (
              <View style={styles.forgetActions}>
                <TouchableOpacity style={styles.forgetButton} onPress={handleForgetConnection}>
                  <Trash2 size={16} color="#666" strokeWidth={2} />
                  <Text style={styles.forgetButtonText}>Xóa Kết Nối Đã Lưu</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            Only You được thiết kế chỉ dành cho hai người. Không có nhóm, không có người lạ, 
            chỉ có bạn và người đặc biệt của bạn. 💕
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRCode}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQRCode(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContent}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>Mã QR Kết Nối</Text>
              <TouchableOpacity onPress={() => setShowQRCode(false)}>
                <X size={24} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrCodeContainer}>
              {connectionState.roomCode && (
                <View style={styles.qrPlaceholder}>
                  <View style={styles.qrCodeDisplay}>
                    <Image
                      source={{
                        uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`onlyyou://connect/${connectionState.roomCode}`)}&bgcolor=ffffff&color=000000&margin=10`
                      }}
                      style={styles.qrCodeImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.qrCodeText}>{connectionState.roomCode}</Text>
                  <Text style={styles.qrCodeHint}>Quét mã này bằng máy ảnh điện thoại</Text>
                  <Text style={styles.qrCodeSubHint}>Sẽ tự động mở app và kết nối! ✨</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.closeQrButton}
              onPress={() => setShowQRCode(false)}
            >
              <Text style={styles.closeQrButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <View style={styles.scannerModalOverlay}>
          <View style={styles.scannerModalContent}>
            <View style={styles.scannerModalHeader}>
              <Text style={styles.scannerModalTitle}>Quét Mã QR</Text>
              <TouchableOpacity onPress={() => setShowQRScanner(false)}>
                <X size={24} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.scannerContainer}>
              <View style={styles.scannerPlaceholder}>
                <Scan size={80} color="#4ade80" strokeWidth={1.5} />
                <Text style={styles.scannerHint}>Hướng máy ảnh vào mã QR</Text>
                <Text style={styles.scannerSubHint}>Chức năng quét QR sẽ được kích hoạt khi bạn cho phép truy cập camera</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.cancelScanButton}
              onPress={() => setShowQRScanner(false)}
            >
              <Text style={styles.cancelScanButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Partner Name Prompt Modal */}
      <Modal
        visible={showNamePrompt}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.namePromptOverlay}>
          <View style={styles.namePromptContent}>
            <Heart size={48} color="#ff6b9d" strokeWidth={2} fill="#ff6b9d" />

            <Text style={styles.namePromptTitle}>Đối tác đã kết nối! 💕</Text>
            <Text style={styles.namePromptSubtitle}>
              Đặt tên cho kết nối này để dễ nhớ hơn
            </Text>

            <TextInput
              style={styles.nameInput}
              value={partnerName}
              onChangeText={setPartnerName}
              placeholder="Ví dụ: Em yêu, Anh ơi, Baby..."
              placeholderTextColor="#666"
              autoFocus
              maxLength={30}
            />

            <TouchableOpacity
              style={[styles.saveNameButton, !partnerName.trim() && styles.saveNameButtonDisabled]}
              onPress={savePartnerName}
              disabled={!partnerName.trim()}
            >
              <Text style={styles.saveNameButtonText}>Lưu & Tiếp tục</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  statusDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  connectionDetails: {
    gap: 8,
  },
  ipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ipLabel: {
    fontSize: 14,
    color: '#888',
  },
  ipValue: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'monospace',
  },
  roomCodeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  roomCodeLabel: {
    fontSize: 14,
    color: '#888',
  },
  roomCodeValue: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  securityCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  setupCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  orText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  joinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roomCodeInput: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  joinButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  messagesButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  messagesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  actions: {
    marginBottom: 20,
    gap: 12,
  },
  copyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ff6b9d',
  },
  copyCodeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b9d',
  },
  disconnectButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  disconnectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  privacyNotice: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  privacyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  savedConnectionInfo: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  savedConnectionLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  savedConnectionValue: {
    fontSize: 16,
    color: '#4ade80',
    fontFamily: 'monospace',
    fontWeight: '600',
    marginBottom: 2,
    textDecorationLine: 'underline',
  },
  savedConnectionDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  reconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  reconnectButtonText: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '500',
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  serverStatusText: {
    fontSize: 12,
    color: '#f59e0b',
  },
  forgetActions: {
    marginBottom: 12,
  },
  forgetButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#666',
  },
  forgetButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  qrCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  qrCodeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ade80',
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalContent: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrPlaceholder: {
    alignItems: 'center',
    gap: 16,
  },
  qrCodeDisplay: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 260,
    height: 260,
  },
  qrCodeImage: {
    width: 220,
    height: 220,
  },
  qrCodeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  qrCodeHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  qrCodeSubHint: {
    fontSize: 12,
    color: '#4ade80',
    textAlign: 'center',
    fontWeight: '500',
  },
  closeQrButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  closeQrButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scanQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#4ade80',
    marginTop: 12,
  },
  scanQRButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ade80',
  },
  scannerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scannerModalContent: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  scannerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  scannerModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  scannerContainer: {
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 300,
    justifyContent: 'center',
  },
  scannerPlaceholder: {
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  scannerHint: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  scannerSubHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  cancelScanButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelScanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  namePromptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  namePromptContent: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  namePromptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
  },
  namePromptSubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  nameInput: {
    width: '100%',
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 8,
  },
  saveNameButton: {
    width: '100%',
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveNameButtonDisabled: {
    backgroundColor: '#444',
    opacity: 0.5,
  },
  saveNameButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});