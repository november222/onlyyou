import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Shield, Wifi, WifiOff, Copy, Key, Plus } from 'lucide-react-native';
import WebRTCService, { ConnectionState } from '@/services/WebRTCService';

export default function ConnectionScreen() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    roomCode: null,
    partnerConnected: false,
    error: null,
  });
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isConnectingToServer, setIsConnectingToServer] = useState(false);
  const [savedConnection, setSavedConnection] = useState(WebRTCService.getSavedConnection());

  useEffect(() => {
    // Set up WebRTC event listeners
    WebRTCService.onConnectionStateChange = (state) => {
      setConnectionState(state);
    };

    // Connect to signaling server on component mount
    connectToServer();

    return () => {
      WebRTCService.onConnectionStateChange = null;
    };
  }, []);

  const connectToServer = async () => {
    setIsConnectingToServer(true);
    try {
      await WebRTCService.connectToSignalingServer();
    } catch (error) {
      Alert.alert('Connection Failed', 'Unable to connect to server. Please try again.');
    } finally {
      setIsConnectingToServer(false);
    }
  };

  const generateRoomCode = async () => {
    setIsGeneratingCode(true);
    try {
      const roomCode = await WebRTCService.generateRoomCode();
      await WebRTCService.joinRoom(roomCode);
      Alert.alert(
        'Room Created!', 
        `Share this code with your partner: ${roomCode}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Failed', 'Unable to create room. Please try again.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const joinRoom = async () => {
    if (!inputRoomCode.trim()) {
      Alert.alert('Invalid Code', 'Please enter a room code.');
      return;
    }

    try {
      await WebRTCService.joinRoom(inputRoomCode.trim());
    } catch (error) {
      Alert.alert('Join Failed', 'Unable to join room. Please check the code and try again.');
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect from Partner?',
      'This will end your private connection. You can reconnect using your connection key.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => WebRTCService.disconnect(),
        },
      ]
    );
  };

  const copyRoomCode = () => {
    // In a real app, this would copy to clipboard
    Alert.alert('Copied!', 'Room code copied to clipboard.');
  };

  const simulateNetworkIssue = () => {
    WebRTCService.simulateNetworkIssue();
    Alert.alert('Network Issue Simulated', 'Connection will attempt to reconnect...');
  };

  const handleForgetConnection = () => {
    Alert.alert(
      'Xóa Kết Nối Đã Lưu?',
      'Bạn sẽ cần tạo kết nối mới với đối tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            WebRTCService.clearSavedConnection();
            setSavedConnection(null);
          },
        },
      ]
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Heart size={32} color="#ff6b9d" strokeWidth={2} fill="#ff6b9d" />
          <Text style={styles.title}>Only You</Text>
          <Text style={styles.subtitle}>Private Connection</Text>
        </View>

        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            {connectionState.isConnected ? (
              <Wifi size={24} color="#4ade80" strokeWidth={2} />
            ) : (
              <WifiOff size={24} color="#ef4444" strokeWidth={2} />
            )}
            <Text style={[
              styles.statusText,
              { color: connectionState.isConnected ? '#4ade80' : '#ef4444' }
            ]}>
              {connectionState.isConnected 
                ? 'Connected' 
                : connectionState.isConnecting 
                  ? 'Connecting...' 
                  : 'Disconnected'
              }
            </Text>
          </View>
          
          <Text style={styles.statusDescription}>
            {connectionState.isConnected 
              ? 'You are securely connected to your partner'
              : connectionState.isConnecting
                ? 'Establishing secure connection...'
                : connectionState.error || 'Ready to connect to your partner'
            }
          </Text>

          {connectionState.roomCode && (
            <View style={styles.roomCodeDisplay}>
              <Text style={styles.roomCodeLabel}>Room Code:</Text>
              <Text style={styles.roomCodeValue}>{connectionState.roomCode}</Text>
            </View>
          )}

          {/* Saved Connection Info */}
          {savedConnection && (
            <View style={styles.savedConnectionInfo}>
              <Text style={styles.savedConnectionLabel}>Kết nối đã lưu:</Text>
              <Text style={styles.savedConnectionValue}>{savedConnection.roomCode}</Text>
              <Text style={styles.savedConnectionDate}>
                Từ {new Date(savedConnection.connectionDate).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          )}
        </View>

        {/* Security Info */}
        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <Shield size={20} color="#ff6b9d" strokeWidth={2} />
            <Text style={styles.securityTitle}>End-to-End Encrypted</Text>
          </View>
          <Text style={styles.securityDescription}>
            Your messages are encrypted and can only be read by you and your partner. 
            No one else can access your conversation.
          </Text>
        </View>

        {/* Connection Setup */}
        {!connectionState.isConnected && !connectionState.isConnecting && (
          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>Connect to Your Partner</Text>
            
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
                {isGeneratingCode ? 'Creating...' : 'Create New Room'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.orText}>or</Text>
            
            {/* Join Room */}
            <View style={styles.joinContainer}>
              <TextInput
                style={styles.roomCodeInput}
                value={inputRoomCode}
                onChangeText={setInputRoomCode}
                placeholder="Enter room code"
                placeholderTextColor="#666"
                autoCapitalize="characters"
                maxLength={6}
              />
              <TouchableOpacity 
                style={styles.joinButton} 
                onPress={joinRoom}
                disabled={!inputRoomCode.trim() || isConnectingToServer}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {connectionState.isConnected && (
          <>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              </TouchableOpacity>
              
              {connectionState.roomCode && (
                <TouchableOpacity style={styles.copyCodeButton} onPress={copyRoomCode}>
                  <Copy size={16} color="#ff6b9d" strokeWidth={2} />
                  <Text style={styles.copyCodeButtonText}>Copy Room Code</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Debug Actions */}
            <View style={styles.debugActions}>
              <TouchableOpacity style={styles.debugButton} onPress={simulateNetworkIssue}>
                <Text style={styles.debugButtonText}>Mô Phỏng Mất Mạng</Text>
              </TouchableOpacity>
            </View>

            {/* Forget Connection */}
            {savedConnection && (
              <View style={styles.forgetActions}>
                <TouchableOpacity style={styles.forgetButton} onPress={handleForgetConnection}>
                  <Text style={styles.forgetButtonText}>Xóa Kết Nối Đã Lưu</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            Only You is designed for two people only. No groups, no strangers, 
            just you and your special person. 💕
          </Text>
        </View>
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
  },
  joinButtonText: {
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
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  copyCodeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  },
  savedConnectionDate: {
    fontSize: 12,
    color: '#888',
  },
  debugActions: {
    marginBottom: 12,
  },
  debugButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  forgetActions: {
    marginBottom: 12,
  },
  forgetButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
  },
  forgetButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});