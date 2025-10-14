import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useThemeColors } from '@/providers/ThemeProvider';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Calendar,
  Timer,
  Wifi,
  WifiOff,
  Zap,
  Clock,
  CirclePlay as PlayCircle,
  CircleStop as StopCircle,
  Heart,
  Sparkles,
  Phone,
  Video,
  Trash2,
  Crown,
} from 'lucide-react-native';
import WebRTCService from '@/services/WebRTCService';
import { usePremium } from '@/providers/PremiumProvider';

interface ConnectionSession {
  id: string;
  startDate: Date;
  endDate: Date | null;
  duration: number;
  roomCode: string;
  isActive: boolean;
  buzzCallsCount: number;
}

interface BuzzCall {
  id: string;
  message: string;
  timestamp: Date;
  sentByUser: boolean;
}

export default function SessionDetailScreen() {
  const { theme } = useTheme();
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();
  const mutedTextStyle = React.useMemo(() => ({ color: (colors as any).mutedText || (colors as any).text }), [(colors as any).mutedText, (colors as any).text]);
  const { id, sessionData } = useLocalSearchParams();
  const [session, setSession] = useState<ConnectionSession | null>(null);
  const [buzzCalls, setBuzzCalls] = useState<BuzzCall[]>([]);
  const { isPremium } = usePremium();
  const partnerDisplayName = React.useMemo(() => {
    if (!session) return t('history:session');
    const anySession: any = session as any;
    const direct = anySession.partnerName || anySession.displayName || anySession.name;
    if (typeof direct === 'string' && direct.trim()) return direct as string;
    if (typeof anySession.roomCode === 'string') {
      const m = anySession.roomCode.match(/^(.+?)\s*\(/);
      if (m && m[1]) return m[1].trim();
    }
    return t('history:session');
  }, [session, t]);

  useEffect(() => {
    if (sessionData && typeof sessionData === 'string') {
      try {
        const parsedSession = JSON.parse(sessionData);
        // Convert date strings back to Date objects
        parsedSession.startDate = new Date(parsedSession.startDate);
        if (parsedSession.endDate) {
          parsedSession.endDate = new Date(parsedSession.endDate);
        }
        setSession(parsedSession);
        loadBuzzCallsForSession(parsedSession.id);
      } catch (error) {
        console.error('Failed to parse session data:', error);
        router.back();
      }
    }
  }, [sessionData]);

  const loadBuzzCallsForSession = async (sessionId: string) => {
    try {
      const { default: BuzzService } = await import('@/services/BuzzService');
      const all = await BuzzService.getBuzzHistory();
      const start = session?.startDate ? new Date(session.startDate).getTime() : 0;
      const end = session?.endDate ? new Date(session.endDate).getTime() : Date.now();
      const filtered = all.filter(ev => ev.timestamp >= start && ev.timestamp <= end)
        .map(ev => ({ id: ev.id, message: ev.text, timestamp: new Date(ev.timestamp), sentByUser: ev.senderId === 'current_user' }));
      setBuzzCalls(filtered);
    } catch (e) {
      // fallback: keep empty or mock
      setBuzzCalls([]);
    }
  };

  const handleDeleteSession = async () => {
    if (!isPremium) {
      Alert.alert(
        t('history:premiumFeatureTitle'),
        t('history:premiumFeatureDesc'),
        [
          { text: t('common:cancel'), style: 'cancel' },
          {
            text: t('history:upgrade'),
            onPress: () => router.push('/premium'),
          },
        ]
      );
      return;
    }

    Alert.alert(
      t('history:deleteConfirmTitle'),
      t('history:deleteConfirmDesc'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('history:delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await WebRTCService.deleteSessionHistory(session.id);
            } catch (e) {
              console.warn('delete session failed', e);
            }
            router.back();
          },
        },
      ]
    );
  };

  const formatFullDateTime = (date: Date): string => {
    const locale = i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'en' ? 'en-US' : i18n.language === 'ko' ? 'ko-KR' : i18n.language === 'es' ? 'es-ES' : undefined;
    return date.toLocaleString(locale, {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const h = t('history:hoursShort', { defaultValue: 'h' });
    const m = t('history:minutesShort', { defaultValue: 'm' });
    const s = t('history:secondsShort', { defaultValue: 's' });
    return hours + h + ' ' + minutes + m + ' ' + secs + s;
  };

  const formatTime = (date: Date): string => {
    const locale = i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'en' ? 'en-US' : i18n.language === 'ko' ? 'ko-KR' : i18n.language === 'es' ? 'es-ES' : undefined;
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (!session) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.errorText, { color: colors.error || '#ef4444' }]}>
          {t('history:notFound')}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>
            {partnerDisplayName}
          </Text>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteSession}
          >
            <View style={styles.deleteButtonContent}>
              <Trash2
                size={20}
                color={colors.error || '#ef4444'}
                strokeWidth={2}
              />
              {!isPremium && (
                <Crown
                  size={12}
                  color={colors.accent || '#f59e0b'}
                  strokeWidth={2}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Session Overview */}
        <View
          style={[
            styles.overviewCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.overviewHeader}>
            <View style={styles.roomCodeContainer}>
              <View style={styles.roomInfo}>
                <Text
                  style={[styles.roomName, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {partnerDisplayName}
                </Text>
                <Text
                  style={[styles.roomCodeSmall, mutedTextStyle]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {session.roomCode}
                </Text>
              </View>
              <View
                style={[
                  styles.sessionStatus,
                  {
                    backgroundColor: session.isActive
                      ? colors.success || '#4ade80'
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.sessionStatusText, { color: colors.text }]}
                >
                  {session.isActive
                    ? t('history:statusConnected')
                    : t('history:statusDisconnected')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.durationDisplay}>
            <Timer
              size={32}
              color={colors.primary || '#ff6b9d'}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.durationText,
                { color: colors.primary || '#ff6b9d' },
              ]}
            >
              {formatDuration(session.duration)}
            </Text>
          </View>
        </View>

        {/* Timestamps */}
        <View
          style={[
            styles.timestampsCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t('history:timestampsTitle')}
          </Text>

          <View style={styles.timestampRow}>
            <View
              style={[
                styles.timestampIcon,
                { backgroundColor: colors.accent || 'rgba(255,107,157,0.1)' },
              ]}
            >
              <PlayCircle
                size={20}
                color={colors.success || '#4ade80'}
                strokeWidth={2}
              />
            </View>
            <View style={styles.timestampContent}>
              <Text style={[styles.timestampLabel, mutedTextStyle]}>
                {t('history:startLabel')}
              </Text>
              <Text style={[styles.timestampValue, { color: colors.text }]}>
                {formatFullDateTime(session.startDate)}
              </Text>
            </View>
          </View>

          {session.endDate && (
            <View style={styles.timestampRow}>
              <View
                style={[
                  styles.timestampIcon,
                  { backgroundColor: colors.error || 'rgba(239,68,68,0.05)' },
                ]}
              >
                <StopCircle
                  size={20}
                  color={colors.error || '#ef4444'}
                  strokeWidth={2}
                />
              </View>
              <View style={styles.timestampContent}>
                <Text style={[styles.timestampLabel, mutedTextStyle]}>
                  {t('history:endLabel')}
                </Text>
                <Text style={[styles.timestampValue, { color: colors.text }]}>
                  {formatFullDateTime(session.endDate)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.timestampRow}>
            <View
              style={[
                styles.timestampIcon,
                { backgroundColor: colors.warning || 'rgba(245,158,11,0.05)' },
              ]}
            >
              <Clock
                size={20}
                color={colors.warning || '#f59e0b'}
                strokeWidth={2}
              />
            </View>
            <View style={styles.timestampContent}>
              <Text style={[styles.timestampLabel, mutedTextStyle]}>
                {t('history:durationLabel')}
              </Text>
              <Text style={[styles.timestampValue, { color: colors.text }]}>
                {formatDuration(session.duration)}
              </Text>
            </View>
          </View>
        </View>

        {/* Buzz Calls Section */}
        <View
          style={[
            styles.buzzCallsCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.buzzCallsHeader}>
            <View style={styles.buzzCallsTitle}>
              <Zap
                size={20}
                color={colors.warning || '#f59e0b'}
                strokeWidth={2}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('history:buzzCallsTitle')}
              </Text>
            </View>

            <View
              style={[
                styles.buzzCallsCount,
                { backgroundColor: colors.accent || '#f59e0b' },
              ]}
            >
              <Text style={styles.buzzCallsCountText}>
                {buzzCalls.length}
              </Text>
            </View>
          </View>

          <Text style={[styles.buzzCallsDescription, mutedTextStyle]}>
            {t('history:buzzCallsDesc')}
          </Text>

          {/* Buzz Calls List */}
          <View style={styles.buzzCallsList}>
            {buzzCalls.map((buzzCall) => (
              <View
                key={buzzCall.id}
                style={[
                  styles.buzzCallItem,
                  { backgroundColor: colors.surface || colors.card },
                ]}
              >
                <View style={styles.buzzCallContent}>
                  <Text
                    style={[styles.buzzCallMessage, { color: colors.text }]}
                  >
                    "{buzzCall.message}"
                  </Text>
                  <Text style={[styles.buzzCallTime, mutedTextStyle]}>
                    {formatTime(buzzCall.timestamp)} â€¢{' '}
                    {buzzCall.sentByUser
                      ? t('history:youSent')
                      : t('history:partnerSent')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.buzzCallIndicator,
                    {
                      backgroundColor: buzzCall.sentByUser
                        ? colors.primary || '#ff6b9d'
                        : colors.success || '#4ade80',
                    },
                  ]}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  deleteButton: {
    padding: 8,
    marginRight: -8,
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 50,
  },
  overviewCard: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  overviewHeader: {
    width: '100%',
    marginBottom: 20,
  },
  roomCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  roomInfo: {
    alignItems: 'center',
    maxWidth: '70%',
  },
  roomName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'System',
  },
  roomCodeSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: '#aaa',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  sessionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sessionStatusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  durationDisplay: {
    alignItems: 'center',
    gap: 12,
  },
  durationText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ff6b9d',
  },
  timestampsCard: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timestampIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timestampContent: {
    flex: 1,
  },
  timestampLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  timestampValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    lineHeight: 22,
  },
  buzzCallsCard: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  buzzCallsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  buzzCallsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buzzCallsCount: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  buzzCallsCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buzzCallsDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  buzzCallsList: {
    gap: 12,
    marginBottom: 20,
  },
  buzzCallItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 12,
  },
  buzzCallContent: {
    flex: 1,
  },
  buzzCallMessage: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  buzzCallTime: {
    fontSize: 12,
    color: '#888',
  },
  buzzCallIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
});











