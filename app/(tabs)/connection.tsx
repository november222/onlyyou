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
  NativeModules,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemeColors } from '@/providers/ThemeProvider';
import { Heart, Shield, Wifi, WifiOff, Copy, Key, Plus, RefreshCw, Trash2, QrCode, X, Scan } from 'lucide-react-native';
import WebRTCService, { ConnectionState } from '@/services/WebRTCService';
import AuthService from '@/services/AuthService';
import { router } from 'expo-router';
// Lazy-load barcode scanner to avoid native module errors without rebuild
import * as Linking from 'expo-linking';

export default function ConnectionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = useThemeColors();
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
  const [hasQRPermission, setHasQRPermission] = useState<null | boolean>(null);
  const [hasRequestedQRPermission, setHasRequestedQRPermission] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [ScannerComp, setScannerComp] = useState<null | React.ComponentType<any>>(null);

  useEffect(() => {
    // Set up WebRTC event listeners
    WebRTCService.onConnectionStateChange = (state) => {
      setConnectionState(state);

      // Update saved connection when state changes
      const currentSaved = WebRTCService.getSavedConnection();
      setSavedConnection(currentSaved);

      // Show name prompt when partner joins AND no saved connection exists
      if (state.partnerConnected && !state.isWaitingForPartner && !currentSaved) {
        setShowNamePrompt(true);
      }
    };

    // Get initial connection state
    const currentState = WebRTCService.getConnectionState();
    setConnectionState(currentState);

    // Load saved connection
    const saved = WebRTCService.getSavedConnection();
    setSavedConnection(saved);

    // Auto-connect to signaling server (only when authenticated)
    if (
      AuthService.isAuthenticated() &&
      !currentState.isConnected &&
      !currentState.isConnecting
    ) {
      connectToServer();
    }

    return () => {
      WebRTCService.onConnectionStateChange = null;
    };
  }, []);

  // Request camera permission when opening the scanner (guarded + lazy import)
  useEffect(() => {
    let cancelled = false;
    const ensurePermission = async () => {
      if (showQRScanner) {
        const hasNative = !!(NativeModules as any)?.ExpoBarCodeScanner;
        if (!hasNative) {
          // No native module available – show guidance UI instead of importing
          setScannerComp(null);
          setHasQRPermission(false);
          setHasRequestedQRPermission(true);
          return;
        }
        try {
          const mod = await import('expo-barcode-scanner');
          if (cancelled) return;
          setScannerComp(() => mod.BarCodeScanner);
          const { status } = await mod.BarCodeScanner.requestPermissionsAsync();
          if (!cancelled) {
            setHasQRPermission(status === 'granted');
            setHasRequestedQRPermission(true);
          }
        } catch (e) {
          if (!cancelled) {
            setScannerComp(null);
            setHasQRPermission(false);
            setHasRequestedQRPermission(true);
          }
        }
      } else {
        // reset state when modal closes
        setQrScanned(false);
        setHasRequestedQRPermission(false);
        setHasQRPermission(null);
        setScannerComp(null);
      }
    };
    ensurePermission();
    return () => {
      cancelled = true;
    };
  }, [showQRScanner]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (qrScanned) return;
    setQrScanned(true);
    try {
      let code = '';
      if (typeof data === 'string') {
        if (data.startsWith('onlyyou://')) {
          const parsed = Linking.parse(data);
          // expecting scheme onlyyou://connect/<ROOMCODE>
          if (parsed?.path) {
            const parts = parsed.path.split('/');
            code = parts[parts.length - 1] || '';
          }
        } else {
          code = data;
        }
      }

      code = (code || '').trim();
      if (!code) {
        throw new Error('QR does not contain a room code.');
      }

      // Reflect code in input UI
      setInputRoomCode(code);

      // Attempt to join room
      await WebRTCService.joinRoom(code);
      setShowQRScanner(false);
      Alert.alert(t('common:success'), t('connection:qrScanSuccess'));
    } catch (err) {
      console.error('QR scan failed:', err);
      Alert.alert(t('connection:qrScanFailedTitle'), t('connection:qrScanFailed'));
      // allow re-scan
      setQrScanned(false);
    }
  };

  const connectToServer = async () => {
    if (isConnectingToServer) return;
    
    setIsConnectingToServer(true);
    try {
      await WebRTCService.connectToSignalingServer();
      console.log('Connected to signaling server');
    } catch (error) {
      console.error('Failed to connect to signaling server:', error);
      Alert.alert(
        t('connection:serverConnectFailedTitle'), 
        t('connection:serverConnectFailed'),
        [
          { text: t('connection:retry'), onPress: () => setTimeout(connectToServer, 1000) },
          { text: t('common:cancel'), style: 'cancel' }
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
        t('connection:roomCreatedTitle'), 
        t('connection:roomCreatedMessage', { code: roomCode }),
        [
          { text: t('connection:copyCode'), onPress: () => copyRoomCode(roomCode) },
          { text: t('common:ok') }
        ]
      );
    } catch (error) {
      console.error('Failed to generate room code:', error);
      Alert.alert(
        t('connection:createRoomFailedTitle'), 
        t('connection:createRoomFailed'),
        [
          { text: t('connection:retry'), onPress: generateRoomCode },
          { text: t('common:cancel'), style: 'cancel' }
        ]
      );
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const joinRoom = async () => {
    if (!inputRoomCode.trim()) {
      Alert.alert(t('connection:invalidCodeTitle'), t('connection:enterRoomCode'));
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
        t('connection:joinSuccessTitle'),
        t('connection:joinSuccessMessage'),
        [{ text: t('connection:awesome') }]
      );
    } catch (error) {
      console.error('Failed to join room:', error);
      const errorMessage = (error as Error)?.message || 'Unable to join room';

      if (errorMessage.toLowerCase().includes('invalid')) {
        Alert.alert(
          t('connection:roomInvalidTitle'),
          t('connection:roomInvalidMessage'),
          [{ text: t('common:ok') }]
        );
      } else {
        Alert.alert(
          t('connection:joinFailedTitle'),
          errorMessage,
          [
            { text: t('connection:retry'), onPress: joinRoom },
            { text: t('common:cancel'), style: 'cancel' }
          ]
        );
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleDisconnect = () => {
    if (!savedConnection) {
      // If not saved, prevent disconnect
      Alert.alert(
        t('connection:cantDisconnectTitle'),
        t('connection:cantDisconnectMessage')
      );
      return;
    }

    Alert.alert(
      t('connection:disconnectConfirmTitle'),
      t('connection:disconnectConfirmMessage', { name: savedConnection.partnerName }),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('connection:disconnect'),
          style: 'destructive',
          onPress: async () => {
            await WebRTCService.disconnect();
            Alert.alert(
              t('connection:disconnectedTitle'),
              t('connection:disconnectedMessage')
            );
          },
        },
      ]
    );
  };

  const copyRoomCode = (code?: string) => {
    const roomCode = code || connectionState.roomCode;
    if (roomCode) {
      // In a real app, this would copy to clipboard using @react-native-clipboard/clipboard
      Alert.alert(t('connection:copiedTitle'), t('connection:copiedRoomCode', { code: roomCode }));
    }
  };

  const savePartnerName = async () => {
    if (!partnerName.trim()) {
      Alert.alert(t('common:error'), t('connection:enterPartnerName'));
      return;
    }

    try {
      await WebRTCService.saveConnectionWithName(partnerName.trim());
      setSavedConnection(WebRTCService.getSavedConnection());
      setShowNamePrompt(false);
      setPartnerName('');
      Alert.alert(
        t('connection:connectedTitle'),
        t('connection:connectedWithMessage', { name: partnerName.trim() })
      );
    } catch (error) {
      Alert.alert(t('common:error'), t('connection:saveNameFailed'));
    }
  };

  const handleForgetConnection = () => {
    Alert.alert(
      t('connection:forgetConfirmTitle'),
      t('connection:forgetConfirmMessage'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('common:delete'),
          style: 'destructive',
          onPress: () => {
            WebRTCService.clearSavedConnection();
            setSavedConnection(null);
            Alert.alert(t('connection:deletedTitle'), t('connection:deletedMessage'));
          },
        },
      ]
    );
  };

  const handleEndSession = async () => {
    if (!savedConnection) return;

    Alert.alert(
      t('connection:endSessionConfirmTitle'),
      t('connection:endSessionConfirmMessage', { name: savedConnection.partnerName }),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('connection:endSessionButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              await WebRTCService.endSessionAndSaveHistory();
              setSavedConnection(null);
              Alert.alert(
                t('connection:endSessionSuccessTitle'),
                t('connection:endSessionSuccessMessage')
              );
            } catch (error) {
              Alert.alert(t('common:error'), t('connection:endSessionFailedMessage'));
            }
          },
        },
      ]
    );
  };

  const handleReconnect = async () => {
    if (!savedConnection?.roomCode) return;

    try {
      await WebRTCService.joinRoom(savedConnection.roomCode, true); // isReconnecting = true
      Alert.alert(t('connection:reconnectSuccessTitle'), t('connection:reconnectSuccessMessage'));
    } catch (error) {
      Alert.alert(
        t('connection:reconnectFailedTitle'),
        t('connection:reconnectFailedMessage'),
        [{ text: t('common:ok') }]
      );
    }
  };

  const navigateToMessages = () => {
    if (connectionState.isConnected) {
      // Switch to messages tab (index 1 in tab layout)
      router.push('/(tabs)/');
    } else {
      Alert.alert(t('messages:notConnected'), t('messages:pleaseConnect'));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
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
            <Heart size={32} color={theme.primary} strokeWidth={2} fill={theme.primary} />
            <Text style={[styles.title, { color: colors.text }]}>{t('connection:title')}</Text>
            <Text style={[styles.subtitle, { color: (colors.mutedText || colors.text) }]}>{t('connection:subtitle')}</Text>
          </View>

        {/* Connection Status */}
        <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statusHeader}>
            {connectionState.isWaitingForPartner ? (
              <RefreshCw size={24} color={theme.secondary} strokeWidth={2} />
            ) : connectionState.isConnected ? (
              <Wifi size={24} color={theme.success} strokeWidth={2} />
            ) : (
              <WifiOff size={24} color={theme.danger} strokeWidth={2} />
            )}
            <Text style={[
              styles.statusText,
              {
                color: connectionState.isWaitingForPartner
                  ? (theme.secondary)
                  : connectionState.isConnected
                    ? theme.success
                    : connectionState.isConnecting
                      ? (theme.secondary)
                      : theme.danger
              }
            ]}>
              {connectionState.isWaitingForPartner
                ? t('connection:waitingForPartnerStatus')
                : connectionState.isConnected
                  ? t('connection:connected')
                  : connectionState.isConnecting
                    ? t('connection:connecting')
                    : t('connection:disconnected')
              }
            </Text>
          </View>

          <Text style={[styles.statusDescription, { color: colors.text }]}>
            {connectionState.isWaitingForPartner && savedConnection
              ? t('connection:waitingDescWithName', { name: savedConnection.partnerName })
              : connectionState.isWaitingForPartner
                ? t('connection:roomCreatedWaiting')
                : connectionState.isConnected
                  ? t('connection:connectedDesc')
                  : connectionState.isConnecting
                    ? t('connection:connectingDesc')
                    : (typeof connectionState.error === 'string' ? connectionState.error : null) || t('connection:readyToConnect')
            }
          </Text>

          {connectionState.roomCode && (
            <View style={styles.roomCodeDisplay}>
              <Text style={styles.roomCodeLabel}>{t('connection:roomCode')}:</Text>
              <TouchableOpacity onPress={() => copyRoomCode()}>
                <Text style={styles.roomCodeValue}>{connectionState.roomCode}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Saved Connection Info */}
          {savedConnection && !connectionState.isConnected && (
            <View style={styles.savedConnectionInfo}>
              <Text style={styles.savedConnectionLabel}>{t('connection:savedConnectionWith')}:</Text>
              <Text style={styles.savedPartnerName}>{savedConnection.partnerName} 💕</Text>
              <TouchableOpacity onPress={() => copyRoomCode(savedConnection.roomCode)}>
                <Text style={styles.savedConnectionValue}>{savedConnection.roomCode}</Text>
              </TouchableOpacity>
              <Text style={styles.savedConnectionDate}>
                {t('connection:sinceDate', { date: new Date(savedConnection.connectionDate).toLocaleDateString('vi-VN') })}
              </Text>

              {connectionState.isWaitingForPartner && (
                <View style={styles.waitingNotice}>
                  <RefreshCw size={16} color={theme.secondary} strokeWidth={2} />
                  <Text style={styles.waitingNoticeText}>
                    {t('connection:partnerWaiting', { name: savedConnection.partnerName })}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={[styles.reconnectButton, { }]} onPress={handleReconnect}>
                <RefreshCw size={16} color={theme.success} strokeWidth={2} />
                <Text style={styles.reconnectButtonText}>{t('connection:reconnect')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.endSessionButton, { borderColor: theme.danger }]} onPress={handleEndSession}>
                <Text style={[styles.endSessionButtonText, { color: theme.danger }]}>{t('connection:endSessionButton')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Server Connection Status */}
          {isConnectingToServer && (
            <View style={styles.serverStatus}>
              <ActivityIndicator size="small" color={theme.secondary} />
              <Text style={styles.serverStatusText}>{t('connection:connectingServer')}</Text>
            </View>
          )}
        </View>

        {/* Security Info */}
        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <Shield size={20} color={theme.primary} strokeWidth={2} />
            <Text style={styles.securityTitle}>{t('connection:endToEndTitle')}</Text>
          </View>
          <Text style={styles.securityDescription}>
            {t('connection:endToEndDesc')}
          </Text>
        </View>

        {/* Connection Setup */}
        {!connectionState.isConnected && !connectionState.isConnecting && !savedConnection && (
          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>{t('connection:setupTitle')}</Text>

            {/* Generate Room Code */}
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: theme.primary }]}
              onPress={generateRoomCode}
              disabled={isGeneratingCode || isConnectingToServer}
            >
              {isGeneratingCode ? (
                <ActivityIndicator size="small" color={theme.onPrimary || colors.text} />
              ) : (
                <Plus size={20} color={theme.onPrimary || colors.text} strokeWidth={2} />
              )}
              <Text style={[styles.generateButtonText, { color: (theme.onPrimary || colors.text) }]}>
                {isGeneratingCode ? t('connection:creating') : t('connection:createNewRoom')}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.orText}>{t('connection:or')}</Text>
            
            {/* Join Room */}
            <View style={styles.joinContainer}>
              <TextInput
                style={[styles.roomCodeInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={inputRoomCode}
                onChangeText={setInputRoomCode}
                placeholder={t('connection:enterRoomCode')}
                placeholderTextColor={colors.mutedText || colors.text}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.joinButton, { backgroundColor: theme.primary }]}
                onPress={joinRoom}
                disabled={!inputRoomCode.trim() || isConnectingToServer || isJoining}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color={theme.onPrimary || colors.text} />
                ) : (
                  <Text style={[styles.joinButtonText, { color: (theme.onPrimary || colors.text) }]}>{t('connection:join')}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Scan QR Code Button */}
            <TouchableOpacity
              style={[styles.scanQRButton, { borderColor: colors.border }]}
              onPress={() => setShowQRScanner(true)}
              disabled={isConnectingToServer}
            >
              <Scan size={20} color={theme.success} strokeWidth={2} />
              <Text style={[styles.scanQRButtonText, { color: colors.text }]}>{t('connection:scanQRCode')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        {connectionState.isConnected && (
          <>
            <View style={styles.actions}>
              {connectionState.roomCode && (
                <>
                  <TouchableOpacity style={[styles.copyCodeButton, { borderColor: colors.border }]} onPress={() => copyRoomCode()}>
                    <Copy size={16} color={theme.primary} strokeWidth={2} />
                    <Text style={[styles.copyCodeButtonText, { color: colors.text }]}>{t('connection:copyRoomCode')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.qrCodeButton, { borderColor: theme.success }]} onPress={() => setShowQRCode(true)}>
                    <QrCode size={16} color={theme.success} strokeWidth={2} />
                    <Text style={[styles.qrCodeButtonText, { color: theme.success }]}>{t('connection:showQRCode')}</Text>
                  </TouchableOpacity>
                </>
              )}
              
              <TouchableOpacity style={[styles.disconnectButton, { borderColor: theme.danger }]} onPress={handleDisconnect}>
                <Text style={[styles.disconnectButtonText, { color: theme.danger }]}>{t('connection:disconnect')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            {t('connection:privacyBlurb')}
          </Text>
        </View>

        {/* Onboarding shortcut */}
        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
          <TouchableOpacity style={styles.onboardingButton} onPress={() => router.push('/onboarding')}>
            <Text style={styles.onboardingButtonText}>{t('connection:viewOnboarding')}</Text>
          </TouchableOpacity>
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
        <View style={[styles.qrModalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.qrModalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>{t('connection:qrModalTitle')}</Text>
              <TouchableOpacity onPress={() => setShowQRCode(false)}>
                <X size={24} color={colors.text} strokeWidth={2} />
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
                  <Text style={styles.qrCodeHint}>{t('connection:qrCodeHint')}</Text>
                  <Text style={styles.qrCodeSubHint}>{t('connection:qrCodeSubHint')}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.closeQrButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowQRCode(false)}
            >
              <Text style={[styles.closeQrButtonText, { color: (theme.onPrimary || colors.text) }]}>{t('common:close')}</Text>
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
        <View style={[styles.scannerModalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.scannerModalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.scannerModalHeader}>
              <Text style={styles.scannerModalTitle}>{t('connection:scanQrTitle')}</Text>
              <TouchableOpacity onPress={() => setShowQRScanner(false)}>
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.scannerContainer}>
              <View style={styles.scannerPlaceholder}>
                <Scan size={80} color={theme.success} strokeWidth={1.5} />
                <Text style={styles.scannerHint}>{t('connection:scannerPointHint')}</Text>
                <Text style={styles.scannerSubHint}>{t('connection:scannerNeedCamera')}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.cancelScanButton, { borderColor: colors.border }]}
              onPress={() => setShowQRScanner(false)}
            >
              <Text style={[styles.cancelScanButtonText, { color: colors.text }]}>{t('common:cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Overlay (functional) */}
      {showQRScanner && (
        hasQRPermission === true ? (
          <View style={styles.fullscreenScannerOverlay}>
            <View style={styles.scannerModalHeader}>
              <Text style={styles.scannerModalTitle}>{t('connection:scanQrTitle')}</Text>
              <TouchableOpacity onPress={() => setShowQRScanner(false)}>
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {ScannerComp ? (
              <ScannerComp
                style={styles.fullscreenScanner}
                onBarCodeScanned={qrScanned ? undefined : handleBarCodeScanned}
              />
            ) : (
              <View style={styles.scannerPlaceholder}>
                <ActivityIndicator size="large" color={theme.onPrimary || colors.text} />
                <Text style={styles.scannerHint}>{t('connection:loadingCameraModule')}</Text>
              </View>
            )}
          </View>
        ) : hasQRPermission === false ? (
          <View style={styles.fullscreenScannerOverlay}>
            <View style={styles.scannerPlaceholder}>
              <Scan size={80} color={theme.secondary} strokeWidth={1.5} />
              <Text style={styles.scannerHint}>{t('connection:scannerNeedCamera')}</Text>
              <TouchableOpacity style={[styles.openSettingsButton, { backgroundColor: theme.primary }]} onPress={() => Linking.openSettings()}>
                <Text style={[styles.openSettingsText, { color: (theme.onPrimary || colors.text) }]}>{t('connection:openSettings')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelScanButton, { borderColor: colors.border }]} onPress={() => setShowQRScanner(false)}>
                <Text style={[styles.cancelScanButtonText, { color: colors.text }]}>{t('common:close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null
      )}

      {/* Partner Name Prompt Modal */}
      <Modal
        visible={showNamePrompt}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={[styles.namePromptOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.namePromptContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Heart size={48} color={theme.primary} strokeWidth={2} fill={theme.primary} />

            <Text style={styles.namePromptTitle}>{t('connection:namePromptTitle')}</Text>
            <Text style={styles.namePromptSubtitle}>
              {t('connection:namePromptSubtitle')}
            </Text>

            <TextInput
              style={styles.nameInput}
              value={partnerName}
              onChangeText={setPartnerName}
              placeholder={t('connection:namePromptPlaceholder')}
              placeholderTextColor={colors.mutedText || colors.text}
              autoFocus
              maxLength={30}
            />

            <TouchableOpacity
              style={[styles.saveNameButton, !partnerName.trim() && styles.saveNameButtonDisabled]}
              onPress={savePartnerName}
              disabled={!partnerName.trim()}
            >
              <Text style={styles.saveNameButtonText}>{t('connection:saveAndContinue')}</Text>
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
    
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    
    marginTop: 4,
  },
  statusCard: {
    
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    
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
    
  },
  ipValue: {
    fontSize: 14,
    
    fontFamily: 'monospace',
  },
  roomCodeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  roomCodeLabel: {
    fontSize: 14,
    
  },
  roomCodeValue: {
    fontSize: 16,
    
    fontFamily: 'monospace',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  securityCard: {
    
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    
    marginLeft: 8,
  },
  securityDescription: {
    fontSize: 14,
    
    lineHeight: 20,
  },
  setupCard: {
    
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '600',
    
    marginBottom: 12,
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    
  },
  orText: {
    fontSize: 14,
    
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
    // background color via theme
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    // text/border colors via theme
    },
  joinButton: {

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
    
  },
  messagesButton: {

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

  },
  copyCodeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    
  },
  disconnectButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,

  },
  disconnectButtonText: {
    fontSize: 16,
    fontWeight: '600',

  },
  privacyNotice: {
    
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    
  },
  privacyText: {
    fontSize: 14,
    
    textAlign: 'center',
    lineHeight: 20,
  },
  savedConnectionInfo: {
    
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  savedConnectionLabel: {
    fontSize: 12,
    
    marginBottom: 4,
  },
  savedPartnerName: {
    fontSize: 18,
    
    fontWeight: '700',
    marginBottom: 8,
  },
  savedConnectionValue: {
    fontSize: 16,
    
    fontFamily: 'monospace',
    fontWeight: '600',
    marginBottom: 2,
    textDecorationLine: 'underline',
  },
  savedConnectionDate: {
    fontSize: 12,
    
    marginBottom: 8,
  },
  waitingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,

  },
  waitingNoticeText: {
    fontSize: 13,
    
    fontWeight: '600',
    flex: 1,
  },
  reconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    marginBottom: 12,
  },
  reconnectButtonText: {
    fontSize: 14,
    
    fontWeight: '500',
  },
  endSessionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,

    alignItems: 'center',
    marginTop: 4,
  },
  endSessionButtonText: {
    fontSize: 13,
    
    fontWeight: '500',
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    
  },
  serverStatusText: {
    fontSize: 12,
    
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

  },
  forgetButtonText: {
    
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

  },
  qrCodeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    
  },
  onboardingButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    
    backgroundColor: 'transparent',
  },
  onboardingButtonText: {
    fontSize: 14,
    
    fontWeight: '600',
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalContent: {
    
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    
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
    
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  qrCodeHint: {
    fontSize: 14,
    
    textAlign: 'center',
  },
  qrCodeSubHint: {
    fontSize: 12,
    
    textAlign: 'center',
    fontWeight: '500',
  },
  closeQrButton: {

    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  closeQrButtonText: {
    fontSize: 16,
    fontWeight: '600',
    
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

    marginTop: 12,
  },
  scanQRButtonText: {
    fontSize: 16,
    fontWeight: '600',
    
  },
  scannerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scannerModalContent: {
    
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    
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
    
    textAlign: 'center',
    fontWeight: '500',
  },
  scannerSubHint: {
    fontSize: 14,
    
    textAlign: 'center',
    lineHeight: 20,
  },
  openSettingsButton: {

    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  openSettingsText: {
    fontSize: 16,
    fontWeight: '600',
    
  },
  cancelScanButton: {
    
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelScanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    
  },
  namePromptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  namePromptContent: {
    
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    
  },
  namePromptTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  namePromptSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  nameInput: {
    width: '100%',
    // background color via theme
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    // text/border via theme
    marginTop: 8,
  },
  saveNameButton: {
    width: '100%',

    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveNameButtonDisabled: {
    
    opacity: 0.5,
  },
  saveNameButtonText: {
    fontSize: 16,
    fontWeight: '600',
    
  },
  fullscreenScannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.96)',
    justifyContent: 'flex-start',
    padding: 16,
  },
  fullscreenScanner: {
    width: '100%',
    height: 360,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    
  },
});




