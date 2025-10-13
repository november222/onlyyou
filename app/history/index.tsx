import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import type { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Timer,
  Wifi,
  WifiOff,
  Trash2,
  Crown,
  ChevronRight,
  Zap,
  X,
  History,
  Shield,
  Sparkles,
  Heart,
  Camera,
  FileText,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import TimelineService, { Event, EventType } from '@/services/TimelineService';
import WebRTCService from '@/services/WebRTCService';
import { isFeatureEnabled } from '../../config/features';
import PremiumGate from '../../components/PremiumGate';
import { useTheme, useThemeColors } from '@/providers/ThemeProvider';
import { usePremium } from '@/providers/PremiumProvider'; // add this import

interface ConnectionSession {
  id: string;
  startDate: Date;
  endDate: Date | null;
  duration: number;
  roomCode: string;
  isActive: boolean;
  buzzCallsCount: number;
}

type DragContext = {
  startX: number;
};

// Timeline Event Card Component
const TimelineEventCard = ({ event }: { event: Event }) => {
  const { i18n } = useTranslation();
  const formatTime = (timestamp: number) => {
    const lng = i18n.language;
    const locale =
      lng === 'vi'
        ? 'vi-VN'
        : lng === 'en'
        ? 'en-US'
        : lng === 'ko'
        ? 'ko-KR'
        : lng === 'es'
        ? 'es-ES'
        : undefined;
    return new Date(timestamp).toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'buzz':
        return <Zap size={20} color="#f59e0b" strokeWidth={2} />;
      case 'ping':
        return <Sparkles size={20} color="#f472b6" strokeWidth={2} />;
      case 'photo':
        return <Camera size={20} color="#10b981" strokeWidth={2} />;
      case 'note':
        return <FileText size={20} color="#8b5cf6" strokeWidth={2} />;
      default:
        return <Heart size={20} color="#ff6b9d" strokeWidth={2} />;
    }
  };

  const getEventTitle = (event: Event) => {
    switch (event.type) {
      case 'buzz':
        const buzzData = event.data;
        return `Buzz: ${buzzData.buzzType}`;
      case 'ping':
        return 'Daily Ping';
      case 'photo':
        return 'Ảnh mới';
      case 'note':
        return event.data.title || 'Ghi chú';
      default:
        return 'Event';
    }
  };

  const getEventDescription = (event: Event) => {
    switch (event.type) {
      case 'buzz':
        const buzzData = event.data;
        return buzzData.note || `Đã gửi ${buzzData.buzzType}`;
      case 'ping':
        const pingData = event.data;
        return `"${pingData.question}" → "${pingData.answer}"`;
      case 'photo':
        const photoData = event.data;
        return photoData.caption || 'Đã thêm ảnh mới';
      case 'note':
        const noteData = event.data;
        return (
          noteData.content.substring(0, 100) +
          (noteData.content.length > 100 ? '...' : '')
        );
      default:
        return 'Event data';
    }
  };

  return (
    <View style={styles.timelineEventCard}>
      <View style={styles.timelineEventHeader}>
        <View style={styles.timelineEventLeft}>
          <View style={styles.timelineEventIcon}>
            {getEventIcon(event.type)}
          </View>
          <View style={styles.timelineEventInfo}>
            <Text style={styles.timelineEventTitle}>
              {getEventTitle(event)}
            </Text>
            <Text style={styles.timelineEventTime}>
              {formatTime(event.timestamp)}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.timelineEventDescription}>
        {getEventDescription(event)}
      </Text>
    </View>
  );
};

// Swipeable Session Card Component
const SwipeableSessionCard = ({ item, onDelete, onPress, isPremium }: any) => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    DragContext
  >({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      // Only allow swipe left (negative values)
      const newTranslateX = context.startX + event.translationX;
      translateX.value = Math.min(0, Math.max(-80, newTranslateX));
    },
    onEnd: (event) => {
      if (event.translationX < -40) {
        // Swipe threshold reached - show delete button
        translateX.value = withSpring(-80);
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const deleteButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: translateX.value < -20 ? 1 : 0,
    };
  });

  const handleDelete = () => {
    // Animate out then delete
    opacity.value = withSpring(0);
    translateX.value = withSpring(-200);
    setTimeout(() => {
      runOnJS(onDelete)();
    }, 300);
  };

  return (
    <View style={styles.swipeContainer}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.sessionCard, animatedStyle]}>
          <TouchableOpacity onPress={onPress} style={styles.sessionCardContent}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionInfo}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[styles.sessionTitle, { color: colors.text }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {(item as any).name ||
                      (item as any).partnerName ||
                      item.roomCode}
                  </Text>

                  <Text
                    style={[styles.sessionSubtitle, { color: colors.muted }]}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {item.roomCode}
                  </Text>
                </View>

                <View
                  style={[
                    styles.sessionStatus,
                    {
                      backgroundColor: item.isActive
                        ? colors.success || '#4ade80'
                        : colors.border || '#666',
                    },
                  ]}
                >
                  <Text
                    style={[styles.sessionStatusText, { color: colors.text }]}
                  >
                    {item.isActive
                      ? t('history:statusConnected')
                      : t('history:statusDisconnected')}
                  </Text>
                </View>
              </View>

              <ChevronRight
                size={16}
                color={colors.muted || '#666'}
                strokeWidth={2}
              />
            </View>

            {/* Keep footer/meta if exists */}
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

export default function HistoryScreen() {
  const { theme } = useTheme();
  const colors = useThemeColors();
  const [connectionSessions, setConnectionSessions] = useState<
    ConnectionSession[]
  >([]);
  const [timelineEvents, setTimelineEvents] = useState<Event[]>([]);
  const { isPremium } = usePremium(); // use provider value
  const [activeTab, setActiveTab] = useState<'sessions' | 'timeline'>(
    'sessions'
  );
  const { t, i18n } = useTranslation();

  useEffect(() => {
    loadConnectionHistory();
    if (isFeatureEnabled('timeline')) {
      loadTimelineEvents();
    }
  }, []);

  useEffect(() => {
    // initial load
    (async () => {
      const saved = await WebRTCService.getSavedConnections();
      setConnectionSessions(saved);
    })();

    // subscribe updates
    WebRTCService.onSavedConnectionsChanged = (list) => {
      setConnectionSessions(list);
    };

    return () => {
      WebRTCService.onSavedConnectionsChanged = null;
    };
  }, []);

  const loadTimelineEvents = async () => {
    try {
      const events = await TimelineService.listEvents();
      setTimelineEvents(events);
    } catch (error) {
      console.error('Failed to load timeline events:', error);
    }
  };

  const loadConnectionHistory = () => {
    // Mock data with buzz calls count
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
    ];

    setConnectionSessions(mockSessions);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }

    Alert.alert(t('history:deleteSession'), t('history:deleteSessionDesc'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          setConnectionSessions((prev) =>
            prev.filter((session) => session.id !== sessionId)
          );
        },
      },
    ]);
  };

  const handleSessionPress = (session: ConnectionSession) => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }

    if (session.isActive) {
      Alert.alert(t('history.activeSession'), t('history.activeSessionDesc'));
      return;
    }

    router.push({
      pathname: '/history/[id]',
      params: {
        id: session.id,
        sessionData: JSON.stringify(session),
      },
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatDateTime = (date: Date): string => {
    const lng = i18n.language;
    const locale =
      lng === 'vi'
        ? 'vi-VN'
        : lng === 'en'
        ? 'en-US'
        : lng === 'ko'
        ? 'ko-KR'
        : lng === 'es'
        ? 'es-ES'
        : undefined;
    return date.toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderConnectionSession = ({ item }: { item: any }) => {
    const { t } = useTranslation();
    const colors = useThemeColors();

    return (
      <TouchableOpacity
        onPress={() => handleSessionPress(item)}
        style={styles.sessionCardTouchable}
      >
        <View style={styles.sessionCardRow}>
          <View style={styles.sessionLeft}>{/* avatar/icon if any */}</View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[styles.sessionTitle, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name || item.partnerName || item.roomCode}
            </Text>

            <Text
              style={[styles.sessionSubtitle, { color: colors.muted }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {item.roomCode}
            </Text>
          </View>

          <View style={styles.sessionRight}>
            <Text style={[styles.sessionStatusText, { color: colors.text }]}>
              {item.isActive
                ? t('history:statusConnected')
                : t('history:statusDisconnected')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTimelineEvent = ({ item }: { item: Event }) => (
    <TimelineEventCard event={item} />
  );

  const totalDuration = connectionSessions.reduce(
    (sum, session) => sum + session.duration,
    0
  );
  const totalBuzzCalls = connectionSessions.reduce(
    (sum, session) => sum + session.buzzCallsCount,
    0
  );

  return (
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('history:title')}
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Tab Navigation */}
        {isFeatureEnabled('timeline') && (
          <View style={styles.tabNavigation}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                { borderColor: colors.border, backgroundColor: colors.card },
                activeTab === 'sessions' && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab('sessions')}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  { color: colors.text },
                  activeTab === 'sessions' && styles.activeTabButtonText,
                ]}
              >
                {t('history:sessions')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                { borderColor: colors.border, backgroundColor: colors.card },
                activeTab === 'timeline' && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab('timeline')}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  { color: colors.text },
                  activeTab === 'timeline' && styles.activeTabButtonText,
                ]}
              >
                {t('history:timeline')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Stats */}
        {activeTab === 'sessions' && (
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {connectionSessions.length}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedText || colors.text }]}>
                  {t('history:totalSessions')}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {formatDuration(totalDuration)}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedText || colors.text }]}>
                  {t('history:totalTime')}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{totalBuzzCalls}</Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedText || colors.text }]}>
                  {t('history:buzzCalls')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'timeline' && (
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{timelineEvents.length}</Text>
                <Text style={styles.summaryLabel}>Tổng sự kiện</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {timelineEvents.filter((e) => e.type === 'buzz').length}
                </Text>
                <Text style={styles.summaryLabel}>Buzz</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {timelineEvents.filter((e) => e.type === 'ping').length}
                </Text>
                <Text style={styles.summaryLabel}>Ping</Text>
              </View>
            </View>
          </View>
        )}

        {/* Content Lists */}
        {activeTab === 'sessions' ? (
          <FlatList
            data={connectionSessions}
            renderItem={renderConnectionSession}
            keyExtractor={(item) => item.id}
            style={styles.sessionsList}
            contentContainerStyle={styles.sessionsContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={timelineEvents}
            renderItem={renderTimelineEvent}
            keyExtractor={(item) => item.id}
            style={styles.sessionsList}
            contentContainerStyle={styles.sessionsContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  tabNavigation: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#ff6b9d',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff6b9d',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
  },
  sessionsList: {
    flex: 1,
  },
  sessionsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timelineEventCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
    padding: 16,
  },
  timelineEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineEventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timelineEventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineEventInfo: {
    flex: 1,
  },
  timelineEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  timelineEventTime: {
    fontSize: 12,
    color: '#888',
  },
  timelineEventDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  sessionCardContent: {
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  sessionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionStatusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  sessionDetails: {
    gap: 8,
  },
  sessionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionDateText: {
    fontSize: 13,
    color: '#888',
  },
  sessionDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionDurationText: {
    fontSize: 13,
    color: '#ff6b9d',
    fontWeight: '500',
  },
  buzzCallsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buzzCallsText: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '500',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteButton: {
    backgroundColor: '#ef4444',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
    color: '#888',
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
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
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
  premiumPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 4,
  },
  premiumPriceSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  premiumActions: {
    gap: 12,
    paddingHorizontal: 20,
  },
  upgradeButton: {
    backgroundColor: '#f59e0b',
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
    color: '#fff',
  },
  laterButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  sessionCardTouchable: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sessionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionLeft: {
    marginRight: 12,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  sessionRight: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
});
