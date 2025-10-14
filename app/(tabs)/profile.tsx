import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Heart,
  Clock,
  Calendar,
  Wifi,
  WifiOff,
  Timer,
  Sparkles,
  TrendingUp,
  History,
  Crown,
  X,
  Shield,
  ChevronRight,
  Zap,
} from 'lucide-react-native';
import WebRTCService, { ConnectionState } from '@/services/WebRTCService';
import { getPartnerInfoFromConnections } from '@/services/ConnectionService';
import { router } from 'expo-router';
import AuthService, { AuthState } from '@/services/AuthService';
import { usePremium } from '@/providers/PremiumProvider';
import {
  getRelationshipStart,
  setRelationshipStart,
  daysBetween,
} from '@/lib/loveDay';
import { useTheme, useThemeColors } from '@/providers/ThemeProvider';

// Helper: convert hex color to rgba with alpha
function hexToRgba(hex: string, alpha: number) {
  try {
    const raw = hex.replace('#', '');
    const isShort = raw.length === 3;
    const r = parseInt(isShort ? raw[0] + raw[0] : raw.slice(0, 2), 16);
    const g = parseInt(isShort ? raw[1] + raw[1] : raw.slice(2, 4), 16);
    const b = parseInt(isShort ? raw[2] + raw[2] : raw.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return hex; // fallback to original if parse fails
  }
}

interface ConnectionSession {
  id: string;
  startDate: Date;
  endDate: Date | null;
  duration: number; // in seconds
  roomCode: string;
  isActive: boolean;
  buzzCallsCount: number;
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const colors = useThemeColors();
  const cardSurfaceStyle = useMemo(
    () => ({ backgroundColor: colors.card, borderColor: colors.border }),
    [colors.card, colors.border]
  );
  const borderOnlyStyle = useMemo(
    () => ({ borderColor: colors.border }),
    [colors.border]
  );
  const mutedTextStyle = useMemo(
    () => ({ color: colors.mutedText || colors.text }),
    [colors.mutedText, colors.text]
  );
  const [currentConnectionStart, setCurrentConnectionStart] =
    useState<Date | null>(null);
  const [totalConnectedTime, setTotalConnectedTime] = useState(0);
  const [totalDisconnectedTime, setTotalDisconnectedTime] = useState(0);
  const [connectionSessions, setConnectionSessions] = useState<
    ConnectionSession[]
  >([]);
  const [currentSessionDuration, setCurrentSessionDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    roomCode: null,
    partnerConnected: false,
    error: null,
    isWaitingForPartner: false,
  });
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPremiumDetailsModal, setShowPremiumDetailsModal] = useState(false);
  const [allConnectionSessions, setAllConnectionSessions] = useState<
    ConnectionSession[]
  >([]);
  const [authState, setAuthState] = useState<AuthState>(
    AuthService.getAuthState()
  );
  // Daily Ping removed

  const [relationshipStartAt, setRelationshipStartAt] = useState<Date | null>(
    null
  );
  const [loveDays, setLoveDays] = useState(0);
  const { isPremium } = usePremium();

  // Mock Premier status - in real app this would come from user data/API
  const isPremierUser = isPremium;

  // Tint for stat icon backgrounds derived from theme.primary
  const primaryTint = useMemo(
    () => hexToRgba(theme.primary as string, isDark ? 0.12 : 0.08),
    [theme.primary, isDark]
  );

  const showPremiumAlert = () => {
    setShowPremiumModal(true);
  };

  const loadSessionHistory = async () => {
    try {
      const history = await WebRTCService.getSessionHistory();
      // Convert to ConnectionSession format
      const sessions: ConnectionSession[] = history.map((session) => ({
        id: session.id,
        startDate: new Date(session.startDate),
        endDate: new Date(session.endDate),
        duration: session.totalDuration,
        roomCode: `${session.partnerName} (${session.roomCode})`,
        isActive: false,
        buzzCallsCount: session.buzzCallsCount,
      }));
      setAllConnectionSessions(sessions);
    } catch (error) {
      console.error('Failed to load session history:', error);
    }
  };

  const HistorySessionCard = ({
    item,
    onPress,
    isPremium,
    formatDuration,
    formatDateTime,
  }: {
    item: ConnectionSession;
    onPress: () => void;
    isPremium: boolean;
    formatDuration: (seconds: number) => string;
    formatDateTime: (date: Date) => string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.historySessionCard, cardSurfaceStyle]}
    >
      <View style={styles.historySessionHeader}>
        <View style={styles.historySessionInfo}>
          <Text
            style={[
              styles.historySessionRoomCode,
              { color: colors.text, flexShrink: 1 },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.roomCode}
          </Text>
          <View
            style={[
              styles.historySessionStatus,
              {
                backgroundColor: item.isActive
                  ? theme.success
                  : colors.mutedText || colors.text,
              },
            ]}
          >
            <Text
              style={[
                styles.historySessionStatusText,
                {
                  color: item.isActive
                    ? theme.onPrimary || colors.background
                    : theme.onCard || colors.text,
                },
              ]}
            >
              {item.isActive
                ? t('connection:connected')
                : t('connection:disconnected')}
            </Text>
          </View>
        </View>
        <ChevronRight
          size={16}
          color={colors.mutedText || colors.text}
          strokeWidth={2}
        />
      </View>

      <View style={styles.historySessionDetails}>
        <View style={styles.historySessionDetailRow}>
          <View style={styles.historySessionDate}>
            <Calendar
              size={14}
              color={colors.mutedText || colors.text}
              strokeWidth={2}
            />
            <Text style={[styles.historySessionDateText, mutedTextStyle]}>
              {formatDateTime(item.startDate)}
            </Text>
          </View>
          <View style={styles.historySessionDuration}>
            <Timer size={14} color={theme.primary} strokeWidth={2} />
            <Text style={[styles.historySessionDurationText, { color: colors.text }]}>
              {formatDuration(item.duration)}
            </Text>
          </View>
        </View>

        {item.endDate && (
          <View style={styles.historySessionDate}>
            <WifiOff
              size={14}
              color={colors.mutedText || colors.text}
              strokeWidth={2}
            />
            <Text style={[styles.historySessionDateText, mutedTextStyle]}>
              {formatDateTime(item.endDate)}
            </Text>
          </View>
        )}

        {/* {t('profile:historyTotalBuzzCalls')} Count */}
        <View style={styles.historyBuzzCallsRow}>
          <Zap size={14} color={theme.secondary} strokeWidth={2} />
          <Text style={[styles.historyBuzzCallsText, mutedTextStyle]}>
            {item.buzzCallsCount} {t('profile:historyTotalBuzzCalls')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHistorySession = ({ item }: { item: ConnectionSession }) => (
    <HistorySessionCard
      item={item}
      onPress={() => handleHistorySessionPress(item)}
      isPremium={isPremium}
      formatDuration={formatDuration}
      formatDateTime={formatDateTime}
    />
  );

  useEffect(() => {
    const currentState = WebRTCService.getConnectionState();
    loadSessionHistory();
    const totalTime = WebRTCService.getTotalConnectedTime();
    setTotalConnectedTime(totalTime);

    // Set connection start time if connected
    if (currentState.isConnected) {
      const savedConnection = WebRTCService.getSavedConnection();
      if (savedConnection?.currentSessionStart) {
        setCurrentConnectionStart(
          new Date(savedConnection.currentSessionStart)
        );
      }
    }

    // Load or initialize relationship start date for L-day
    (async () => {
      try {
        const stored = await getRelationshipStart();
        if (stored) {
          const d = new Date(stored);
          if (!isNaN(d.getTime())) {
            setRelationshipStartAt(d);
            setLoveDays(daysBetween(stored));
          }
        } else {
          const saved = WebRTCService.getSavedConnection();
          if (saved?.connectionDate) {
            await setRelationshipStart(saved.connectionDate);
            const d = new Date(saved.connectionDate);
            setRelationshipStartAt(d);
            setLoveDays(daysBetween(saved.connectionDate));
          }
        }
      } catch {}
    })();

    // Listen for auth state changes
    AuthService.onAuthStateChange = (state) => {
      setAuthState(state);
    };

    // Listen for connection state changes
    WebRTCService.onConnectionStateChange = (state) => {
      setConnectionState(state);

      if (state.isConnected) {
        // Connected - get session start time
        const savedConnection = WebRTCService.getSavedConnection();
        if (savedConnection?.currentSessionStart) {
          setCurrentConnectionStart(
            new Date(savedConnection.currentSessionStart)
          );
        }
        // Initialize L-day start if missing
        if (!relationshipStartAt && savedConnection?.connectionDate) {
          const d = new Date(savedConnection.connectionDate);
          if (!isNaN(d.getTime())) {
            setRelationshipStartAt(d);
            setLoveDays(daysBetween(savedConnection.connectionDate));
          }
        }
      } else {
        // Disconnected - clear session start time
        setCurrentConnectionStart(null);
        // Reload total time after disconnection
        const totalTime = WebRTCService.getTotalConnectedTime();
        setTotalConnectedTime(totalTime);
      }
    };

    // Attempt to fetch partner avatar once on mount if missing
    (async () => {
      try {
        const saved = WebRTCService.getSavedConnection?.();
        if (saved?.roomCode && !saved?.partnerAvatarUrl) {
          const info = await getPartnerInfoFromConnections(saved.roomCode);
          if (info?.partnerAvatarUrl || info?.partnerId) {
            await WebRTCService.updatePartnerProfile({
              partnerId: info.partnerId,
              partnerAvatarUrl: info.partnerAvatarUrl ?? null,
            });
          }
        }
      } catch {}
    })();

    // Real-time timer that updates every second
    const timer = setInterval(() => {
      if (connectionState.isConnected) {
        // Update current session duration from WebRTC service
        const duration = WebRTCService.getCurrentSessionDuration();
        setCurrentSessionDuration(duration);

        // Update total connected time (current total + current session)
        const totalTime = WebRTCService.getTotalConnectedTime();
        setTotalConnectedTime(totalTime + duration);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [connectionState.isConnected]);

  const saveCurrentSession = async () => {
    if (
      currentConnectionStart &&
      connectionState.roomCode &&
      currentSessionDuration > 0
    ) {
      const newSession: ConnectionSession = {
        id: Date.now().toString(),
        startDate: currentConnectionStart,
        endDate: new Date(),
        duration: currentSessionDuration,
        roomCode: connectionState.roomCode,
        isActive: false,
        buzzCallsCount: 0,
      };

      setConnectionSessions((prev) => [newSession, ...prev]);
    }
  };

  const loadConnectionData = async () => {
    // Mock data for demonstration
    const mockSessions: ConnectionSession[] = [
      {
        id: '1',
        startDate: new Date('2024-01-15T14:30:25'),
        endDate: new Date('2024-01-15T18:45:12'),
        duration: 15287, // 4h 14m 47s
        roomCode: 'LOVE01',
        isActive: false,
        buzzCallsCount: 23,
      },
      {
        id: '2',
        startDate: new Date('2024-01-14T09:15:33'),
        endDate: new Date('2024-01-14T17:22:18'),
        duration: 29205, // 8h 6m 45s
        roomCode: 'HEART2',
        isActive: false,
        buzzCallsCount: 45,
      },
      {
        id: '3',
        startDate: new Date('2024-01-13T20:10:15'),
        endDate: new Date('2024-01-14T02:35:42'),
        duration: 23127, // 6h 25m 27s
        roomCode: 'SWEET3',
        isActive: false,
        buzzCallsCount: 18,
      },
      {
        id: '4',
        startDate: new Date('2024-01-12T16:45:08'),
        endDate: new Date('2024-01-12T23:12:55'),
        duration: 23267, // 6h 27m 47s
        roomCode: 'CUTE44',
        isActive: false,
        buzzCallsCount: 31,
      },
      {
        id: '5',
        startDate: new Date('2024-01-11T11:20:42'),
        endDate: new Date('2024-01-11T19:58:33'),
        duration: 31071, // 8h 37m 51s
        roomCode: 'BABY55',
        isActive: false,
        buzzCallsCount: 52,
      },
      {
        id: '6',
        startDate: new Date(Date.now() - 86400000), // 1 day ago
        endDate: null, // Currently active
        duration: 86400, // 1 day so far
        roomCode: 'ABC123',
        isActive: true,
        buzzCallsCount: 0,
      },
    ];

    setConnectionSessions(mockSessions);
    setAllConnectionSessions(mockSessions);

    // Calculate total times
    const totalConnected = mockSessions.reduce(
      (sum, session) => sum + session.duration,
      0
    );
    setTotalConnectedTime(totalConnected);

    // Mock disconnected time (time between sessions)
    setTotalDisconnectedTime(172800); // 2 days total
  };

  const handleHistorySessionPress = (session: ConnectionSession) => {
    if (!isPremium) {
      Alert.alert(
        t('profile:premiumFeatureTitle'),
        t('profile:historyPremiumMessage'),
        [
          { text: t('common:cancel'), style: 'cancel' },
          {
            text: t('profile:upgrade'),
            onPress: () => {
              setShowHistoryModal(false);
              router.push('/premium?openPayment=1');
            },
          },
        ]
      );
    }
    if (!isPremium) {
      setShowHistoryModal(false);
      setShowPremiumModal(true);
      return;
    }

    if (session.isActive) {
      Alert.alert(
        t('profile:activeSessionTitle'),
        t('profile:activeSessionMessage')
      );
      return;
    }

    setShowHistoryModal(false);
    router.push({
      pathname: '/history/[id]',
      params: {
        id: session.id,
        sessionData: JSON.stringify(session),
      },
    });
  };

  const formatDuration = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalHistoryDuration = allConnectionSessions.reduce(
    (sum, session) => sum + session.duration,
    0
  );
  const totalHistoryBuzzCalls = allConnectionSessions.reduce(
    (sum, session) => sum + session.buzzCallsCount,
    0
  );

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Heart
              size={32}
              color={theme.primary}
              strokeWidth={2}
              fill={theme.primary}
            />
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                {authState.user?.name || t('profile:title')}
              </Text>
              {isPremierUser && (
                <View
                  style={[
                    styles.premierBadge,
                    { backgroundColor: theme.secondary },
                  ]}
                >
                  <Crown
                    size={16}
                    color={theme.onSecondary || colors.text}
                    strokeWidth={2}
                    fill={theme.secondary}
                  />
                  <Text
                    style={[
                      styles.premierBadgeText,
                      { color: theme.onSecondary || colors.text },
                    ]}
                  >
                    Premier
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.subtitle, mutedTextStyle]}>
              {t('profile:subtitle')}
            </Text>
          </View>

          

          {/* Love Counter (L-day) */}
          <View style={[styles.loveCounterCard, cardSurfaceStyle]}>
            <View style={styles.loveCounterHeader}>
              {authState.user?.avatar ? (
                <Image source={{ uri: authState.user.avatar }} style={[styles.loveAvatar, { borderColor: colors.border }]} />
              ) : (
                <View style={[styles.loveAvatar, styles.loveAvatarFallback, { borderColor: colors.border }]}>
                  <Text style={styles.loveAvatarInitial}>{(authState.user?.name || 'U').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.loveHeaderCenter}>
                <Sparkles size={24} color={theme.primary} strokeWidth={2} />
              </View>
              {WebRTCService.getSavedConnection?.()?.partnerAvatarUrl ? (
                <Image source={{ uri: WebRTCService.getSavedConnection()?.partnerAvatarUrl as string }} style={[styles.loveAvatar, { borderColor: colors.border }]} />
              ) : (
                <View style={[styles.loveAvatar, styles.loveAvatarFallback, { borderColor: colors.border }]}>
                  <Text style={styles.loveAvatarInitial}>{(WebRTCService.getSavedConnection?.()?.partnerName || '?').charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>

            {relationshipStartAt && (
              <View style={styles.loveCounterContent}>
                <Text
                  style={[styles.loveCounterNumber, { color: colors.text }]}
                >
                  {loveDays}
                </Text>
                <Text style={[styles.loveCounterTitle, { color: colors.text }]}>L-day</Text>
                <Text style={[styles.loveCounterSubtext, mutedTextStyle]}>
                  {t('profile:since')} {formatDate(relationshipStartAt)}
                </Text>
              </View>
            )}
          </View>

          {/* Total Sessions Navigation */}
          <TouchableOpacity
            style={[styles.totalSessionsCard, cardSurfaceStyle]}
            onPress={() => setShowHistoryModal(true)}
          >
            <View style={styles.totalSessionsHeader}>
              <View style={styles.totalSessionsLeft}>
                <History size={24} color={theme.primary} strokeWidth={2} />
                <Text style={[styles.totalSessionsTitle, { color: colors.text }]}>
                  {t('profile:viewAllSessions')}
                </Text>
              </View>
              <ChevronRight
                size={20}
                color={colors.mutedText || colors.text}
                strokeWidth={2}
              />
            </View>
          </TouchableOpacity>

          {/* Album Card */}
          {/* Album Card removed */}

          {/* Current Session Stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, cardSurfaceStyle]}>
              <View style={[styles.statIcon, { backgroundColor: primaryTint }]}>
                {connectionState.isConnected ? (
                  <Wifi size={20} color={theme.success} strokeWidth={2} />
                ) : (
                  <WifiOff size={20} color={theme.danger} strokeWidth={2} />
                )}
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {connectionState.isConnected
                  ? formatDuration(currentSessionDuration)
                  : formatDuration(currentSessionDuration)}
              </Text>
              <Text style={[styles.statLabel, mutedTextStyle]}>
                {connectionState.isConnected
                  ? t('profile:currentlyConnected')
                  : t('profile:lastSession')}
              </Text>
            </View>

            <View style={[styles.statCard, cardSurfaceStyle]}>
              <View style={[styles.statIcon, { backgroundColor: primaryTint }]}>
                <Clock size={20} color={theme.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatDuration(totalConnectedTime)}
              </Text>
              <Text style={[styles.statLabel, mutedTextStyle]}>
                {t('profile:totalConnectedTime')}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, cardSurfaceStyle]}>
              <View style={[styles.statIcon, { backgroundColor: primaryTint }]}>
                <WifiOff size={20} color={theme.danger} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatDuration(totalDisconnectedTime)}
              </Text>
            </View>

            <View style={[styles.statCard, cardSurfaceStyle]}>
              <View style={[styles.statIcon, { backgroundColor: primaryTint }]}>
                <TrendingUp size={20} color={theme.secondary} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{allConnectionSessions.length}</Text>
              <Text style={[styles.statLabel, mutedTextStyle]}>{t('profile:totalSessions')}</Text>
            </View>
          </View>

          {/* Premium Modal */}
          <Modal
            visible={showPremiumModal}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => setShowPremiumModal(false)}
          >
            <SafeAreaView
              style={[
                styles.premiumModal,
                { backgroundColor: colors.background },
              ]}
              edges={['top', 'bottom']}
            >
              <View style={[styles.premiumHeader, { borderColor: colors.border }]}>
                <Text style={styles.premiumTitle}>
                  {t('profile:premiumTitle')}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowPremiumModal(false)}
                >
                  <X
                    size={24}
                    color={colors.mutedText || colors.text}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.premiumScrollView}
                contentContainerStyle={styles.premiumContent}
              >
                <View style={styles.premiumIcon}>
                  <Crown
                    size={48}
                    color={theme.secondary}
                    strokeWidth={2}
                    fill={theme.secondary}
                  />
                </View>

                <Text style={[styles.premiumMainTitle, { color: colors.text }]}>
                  {t('profile:premiumMainTitle')}
                </Text>
                <Text style={[styles.premiumSubtitle, mutedTextStyle]}>
                  {t('profile:premiumSubtitle')}
                </Text>

                <View style={styles.premiumFeatures}>
                  <View style={[styles.premiumFeature, cardSurfaceStyle]}>
                    <History size={20} color={theme.success} strokeWidth={2} />
                    <Text style={styles.premiumFeatureText}>
                      {t('profile:premiumFeature')}
                    </Text>
                  </View>
                  <View style={[styles.premiumFeature, cardSurfaceStyle]}>
                    <Zap size={20} color={theme.success} strokeWidth={2} />
                    <Text style={styles.premiumFeatureText}>
                      {t('profile:premiumFeature')}
                    </Text>
                  </View>
                  <View style={[styles.premiumFeature, cardSurfaceStyle]}>
                    <Shield size={20} color={theme.success} strokeWidth={2} />
                    <Text style={styles.premiumFeatureText}>
                      {t('profile:premiumFeature')}
                    </Text>
                  </View>
                  <View style={[styles.premiumFeature, cardSurfaceStyle]}>
                    <Sparkles size={20} color={theme.success} strokeWidth={2} />
                    <Text style={styles.premiumFeatureText}>
                      {t('profile:premiumFeature')}
                    </Text>
                  </View>
                </View>

                <View style={styles.premiumPricing}>
                  <Text style={styles.premiumPrice}>
                    {t('profile:premiumPriceYear')}
                  </Text>
                  <Text style={styles.premiumPriceSubtext}>
                    {t('profile:premiumPriceMonthSave')}
                  </Text>
                </View>
                <View style={styles.premiumActions}>
                  <TouchableOpacity
                    style={[styles.upgradeButton, { backgroundColor: theme.secondary }]}
                    onPress={() => {
                      setShowPremiumModal(false);
                      router.push('/premium?openPayment=1');
                    }}
                  >
                    <Crown
                      size={20}
                      color={theme.onSecondary || colors.text}
                      strokeWidth={2}
                    />
                    <Text style={[styles.upgradeButtonText, { color: theme.onSecondary || colors.text }]}>
                      {t('profile:upgradeNow')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.laterButton, { borderColor: colors.border }]}
                    onPress={() => setShowPremiumModal(false)}
                  >
                    <Text style={styles.laterButtonText}>
                      {t('profile:later')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>

          {/* History Modal */}
          <Modal
            visible={showHistoryModal}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => setShowHistoryModal(false)}
          >
            <SafeAreaView
              style={[
                styles.historyModal,
                { backgroundColor: colors.background },
              ]}
              edges={['top', 'bottom']}
            >
              {/* Header */}
              <View style={[styles.historyHeader, { borderColor: colors.border }]}>
                <Text style={[styles.historyTitle, { color: colors.text }]}>
                  {t('profile:historyTitle')}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowHistoryModal(false)}
                >
                  <X
                    size={24}
                    color={colors.mutedText || colors.text}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>

              {/* Summary Stats */}
              <View
                style={[
                  styles.historySummaryCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.historySummaryRow}>
                  <View style={styles.historySummaryItem}>
                    <Text style={[styles.historySummaryValue, { color: colors.text }]}>
                      {allConnectionSessions.length}
                    </Text>
                    <Text style={[styles.historySummaryLabel, mutedTextStyle]}>
                      {t('profile:historyTotalSessions')}
                    </Text>
                  </View>
                  <View style={styles.historySummaryItem}>
                    <Text style={[styles.historySummaryValue, { color: colors.text }]}>
                      {formatDuration(totalHistoryDuration)}
                    </Text>
                    <Text style={[styles.historySummaryLabel, mutedTextStyle]}>
                      {t('profile:historyTotalTime')}
                    </Text>
                  </View>
                  <View style={styles.historySummaryItem}>
                    <Text style={[styles.historySummaryValue, { color: colors.text }]}>
                      {totalHistoryBuzzCalls}
                    </Text>
                    <Text style={[styles.historySummaryLabel, mutedTextStyle]}>
                      {t('profile:historyTotalBuzzCalls')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Sessions List */}
              <FlatList
                data={allConnectionSessions}
                renderItem={renderHistorySession}
                keyExtractor={(item) => item.id}
                style={styles.historySessionsList}
                contentContainerStyle={styles.historySessionsContent}
                showsVerticalScrollIndicator={false}
              />
            </SafeAreaView>
          </Modal>

          
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  premierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
  },
  loveCounterCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,

    alignItems: 'center',
  },
  loveCounterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  loveHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loveAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    backgroundColor: '#222',
    overflow: 'hidden',
  },
  loveAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
  },
  loveAvatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  loveCounterTitle: {
    fontSize: 18,
    fontWeight: '600',

    marginLeft: 8,
  },
  loveCounterContent: {
    alignItems: 'center',
  },
  loveCounterNumber: {
    fontSize: 48,
    fontWeight: '700',

    marginBottom: 8,
  },
  loveCounterLabel: {
    fontSize: 16,

    marginBottom: 4,
  },
  loveCounterSubtext: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,

    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',

    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,

    textAlign: 'center',
    lineHeight: 16,
  },
  historySection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historySectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '600',

    marginLeft: 8,
  },
  premiumModal: {
    flex: 1,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  premiumScrollView: {
    flex: 1,
  },
  premiumContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  premiumIcon: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  premiumMainTitle: {
    fontSize: 28,
    fontWeight: '700',

    marginBottom: 8,
    textAlign: 'center',
  },
  premiumSubtitle: {
    fontSize: 16,

    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  premiumFeatures: {
    marginBottom: 32,
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  premiumFeatureText: {
    fontSize: 16,

    marginLeft: 12,
    flex: 1,
  },
  premiumPricing: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  
  
  premiumActions: {
    gap: 12,
    paddingHorizontal: 20,
  },
  upgradeButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  premiumDetailsModal: {
    flex: 1,
  },
  premiumDetailsScrollView: {
    flex: 1,
  },
  premiumDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  premiumDetailsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  heroSection: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 20,
  },
  crownContainer: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  sparkle1: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 15,
    left: 15,
  },
  sparkle3: {
    position: 'absolute',
    top: 30,
    left: 5,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',

    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  heroSubtitle: {
    fontSize: 16,

    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginHorizontal: 20,
  },
  pricingSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  pricingSectionTitle: {
    fontSize: 20,
    fontWeight: '600',

    textAlign: 'center',
    marginBottom: 20,
  },
  pricingCards: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 140,
  },
  pricingCard: {
    flex: 1,

    borderRadius: 16,
    padding: 20,
    borderWidth: 2,

    position: 'relative',
    minHeight: 120,
    justifyContent: 'space-between',
  },
  recommendedCard: {},
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 24,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '600',

    flex: 1,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: '700',

    marginBottom: 4,
  },
  yearlyPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  originalPrice: {
    fontSize: 16,

    textDecorationLine: 'line-through',
  },
  pricingPeriod: {
    fontSize: 14,

    marginBottom: 8,
  },
  savingsText: {
    fontSize: 12,

    fontWeight: '600',
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  featuresSectionTitle: {
    fontSize: 20,
    fontWeight: '600',

    marginBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,

    minHeight: 80,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  featureContent: {
    flex: 1,
    paddingRight: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',

    marginBottom: 4,
    lineHeight: 22,
  },
  featureDescription: {
    fontSize: 14,

    lineHeight: 20,
    flexWrap: 'wrap',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  guaranteeSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  guaranteeTitle: {
    fontSize: 18,
    fontWeight: '600',

    marginTop: 12,
    marginBottom: 8,
  },
  guaranteeDescription: {
    fontSize: 14,

    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSection: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,

    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 40,
  },
  termsText: {
    fontSize: 12,

    textAlign: 'center',
    lineHeight: 16,
    marginTop: 12,
  },
  historyModal: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  historySummaryCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  historySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  historySummaryItem: {
    alignItems: 'center',
  },
  historySummaryValue: {
    fontSize: 18,
    fontWeight: '700',

    marginBottom: 4,
  },
  historySummaryLabel: {
    fontSize: 12,
  },
  historySessionsList: {
    flex: 1,
  },
  historySessionsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historySessionCard: {
    borderRadius: 12,
    borderWidth: 1,

    marginBottom: 12,
    padding: 16,
  },
  historySessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historySessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  historySessionRoomCode: {
    fontSize: 16,
    fontWeight: '600',

    fontFamily: 'monospace',
  },
  historySessionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historySessionStatusText: {
    fontSize: 12,

    fontWeight: '500',
  },
  historySessionDetails: {
    gap: 8,
  },
  historySessionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historySessionDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historySessionDateText: {
    fontSize: 13,
  },
  historySessionDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historySessionDurationText: {
    fontSize: 13,

    fontWeight: '500',
  },
  historyBuzzCallsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyBuzzCallsText: {
    fontSize: 13,

    fontWeight: '500',
  },
  
  totalSessionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  totalSessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalSessionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalSessionsTitle: {
    fontSize: 18,
    fontWeight: '600',

    marginLeft: 12,
  },
  totalSessionsSubtitle: {
    fontSize: 14,
  },
  chevronIcon: {
    marginLeft: 4,
  },
});


