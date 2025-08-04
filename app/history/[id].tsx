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
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft,
  Calendar,
  Timer,
  Wifi,
  WifiOff,
  Zap,
  Clock,
  PlayCircle,
  StopCircle,
  Heart,
  MessageCircle,
  Phone,
  Video,
  Trash2,
  Crown
} from 'lucide-react-native';

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
  const { id, sessionData } = useLocalSearchParams();
  const [session, setSession] = useState<ConnectionSession | null>(null);
  const [buzzCalls, setBuzzCalls] = useState<BuzzCall[]>([]);
  const [isPremium, setIsPremium] = useState(false);

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

  const loadBuzzCallsForSession = (sessionId: string) => {
    // Mock buzz calls data
    const mockBuzzCalls: BuzzCall[] = [
      {
        id: '1',
        message: 'I\'m hungry :(',
        timestamp: new Date('2024-01-15T15:20:15'),
        sentByUser: true,
      },
      {
        id: '2',
        message: 'Miss you a lot :(',
        timestamp: new Date('2024-01-15T15:45:33'),
        sentByUser: false,
      },
      {
        id: '3',
        message: 'Babe, are you awake?',
        timestamp: new Date('2024-01-15T16:30:22'),
        sentByUser: true,
      },
      {
        id: '4',
        message: 'I\'m hungry :(',
        timestamp: new Date('2024-01-15T17:15:45'),
        sentByUser: false,
      },
      {
        id: '5',
        message: 'Miss you a lot :(',
        timestamp: new Date('2024-01-15T18:00:12'),
        sentByUser: true,
      },
    ];

    setBuzzCalls(mockBuzzCalls);
  };

  const handleDeleteSession = () => {
    if (!isPremium) {
      Alert.alert(
        'Tính Năng Premier',
        'Bạn cần nâng cấp Premier để xóa lịch sử kết nối.',
        [
          { text: 'Để Sau', style: 'cancel' },
          { text: 'Nâng Cấp', onPress: () => console.log('Navigate to premium') },
        ]
      );
      return;
    }

    Alert.alert(
      'Xóa Phiên Kết Nối?',
      'Bạn có chắc muốn xóa phiên kết nối này khỏi lịch sử?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            router.back();
            // In real app, would delete from storage
          },
        },
      ]
    );
  };

  const formatFullDateTime = (date: Date): string => {
    return date.toLocaleString('vi-VN', {
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
    return `${hours} giờ ${minutes} phút ${secs} giây`;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy thông tin phiên kết nối</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.title}>Chi Tiết Phiên</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSession}>
            <View style={styles.deleteButtonContent}>
              <Trash2 size={20} color="#ef4444" strokeWidth={2} />
              {!isPremium && <Crown size={12} color="#f59e0b" strokeWidth={2} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Session Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={styles.roomCodeContainer}>
              <Text style={styles.roomCode}>{session.roomCode}</Text>
              <View style={[
                styles.sessionStatus,
                { backgroundColor: session.isActive ? '#4ade80' : '#666' }
              ]}>
                <Text style={styles.sessionStatusText}>
                  {session.isActive ? 'Đang kết nối' : 'Đã ngắt'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.durationDisplay}>
            <Timer size={32} color="#ff6b9d" strokeWidth={2} />
            <Text style={styles.durationText}>{formatDuration(session.duration)}</Text>
          </View>
        </View>

        {/* Timestamps */}
        <View style={styles.timestampsCard}>
          <Text style={styles.cardTitle}>Thời Gian Kết Nối</Text>
          
          <View style={styles.timestampRow}>
            <View style={styles.timestampIcon}>
              <PlayCircle size={20} color="#4ade80" strokeWidth={2} />
            </View>
            <View style={styles.timestampContent}>
              <Text style={styles.timestampLabel}>Bắt đầu</Text>
              <Text style={styles.timestampValue}>{formatFullDateTime(session.startDate)}</Text>
            </View>
          </View>

          {session.endDate && (
            <View style={styles.timestampRow}>
              <View style={styles.timestampIcon}>
                <StopCircle size={20} color="#ef4444" strokeWidth={2} />
              </View>
              <View style={styles.timestampContent}>
                <Text style={styles.timestampLabel}>Kết thúc</Text>
                <Text style={styles.timestampValue}>{formatFullDateTime(session.endDate)}</Text>
              </View>
            </View>
          )}

          <View style={styles.timestampRow}>
            <View style={styles.timestampIcon}>
              <Clock size={20} color="#f59e0b" strokeWidth={2} />
            </View>
            <View style={styles.timestampContent}>
              <Text style={styles.timestampLabel}>Thời lượng chính xác</Text>
              <Text style={styles.timestampValue}>{formatDuration(session.duration)}</Text>
            </View>
          </View>
        </View>

        {/* Buzz Calls Section */}
        <View style={styles.buzzCallsCard}>
          <View style={styles.buzzCallsHeader}>
            <View style={styles.buzzCallsTitle}>
              <Zap size={20} color="#f59e0b" strokeWidth={2} />
              <Text style={styles.cardTitle}>Buzz Calls</Text>
            </View>
            <View style={styles.buzzCallsCount}>
              <Text style={styles.buzzCallsCountText}>{session.buzzCallsCount}</Text>
            </View>
          </View>
          
          <Text style={styles.buzzCallsDescription}>
            Các tin nhắn nhanh đã gửi trong phiên kết nối này
          </Text>

          {/* Buzz Calls List */}
          <View style={styles.buzzCallsList}>
            {buzzCalls.map((buzzCall) => (
              <View key={buzzCall.id} style={styles.buzzCallItem}>
                <View style={styles.buzzCallContent}>
                  <Text style={styles.buzzCallMessage}>"{buzzCall.message}"</Text>
                  <Text style={styles.buzzCallTime}>
                    {formatTime(buzzCall.timestamp)} • {buzzCall.sentByUser ? 'Bạn gửi' : 'Đối tác gửi'}
                  </Text>
                </View>
                <View style={[
                  styles.buzzCallIndicator,
                  { backgroundColor: buzzCall.sentByUser ? '#ff6b9d' : '#4ade80' }
                ]} />
              </View>
            ))}
          </View>

          {/* Future Buzz Calls Feature Placeholder */}
          <View style={styles.futureBuzzCallsPlaceholder}>
            <Text style={styles.placeholderTitle}>🚀 Tính Năng Sắp Ra Mắt</Text>
            <Text style={styles.placeholderDescription}>
              Buzz Calls - Gửi tin nhắn nhanh với một chạm:
            </Text>
            <View style={styles.placeholderMessages}>
              <Text style={styles.placeholderMessage}>• "I'm hungry :("</Text>
              <Text style={styles.placeholderMessage}>• "Miss you a lot :("</Text>
              <Text style={styles.placeholderMessage}>• "Babe, are you awake?"</Text>
            </View>
          </View>
        </View>

        {/* Session Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Thống Kê Phiên</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MessageCircle size={20} color="#3b82f6" strokeWidth={2} />
              <Text style={styles.statLabel}>Tin nhắn</Text>
              <Text style={styles.statValue}>Đang phát triển</Text>
            </View>
            
            <View style={styles.statItem}>
              <Phone size={20} color="#10b981" strokeWidth={2} />
              <Text style={styles.statLabel}>Cuộc gọi</Text>
              <Text style={styles.statValue}>Đang phát triển</Text>
            </View>
            
            <View style={styles.statItem}>
              <Video size={20} color="#8b5cf6" strokeWidth={2} />
              <Text style={styles.statLabel}>Video call</Text>
              <Text style={styles.statValue}>Đang phát triển</Text>
            </View>
            
            <View style={styles.statItem}>
              <Heart size={20} color="#ff6b9d" strokeWidth={2} />
              <Text style={styles.statLabel}>Reactions</Text>
              <Text style={styles.statValue}>Đang phát triển</Text>
            </View>
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
  roomCode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'monospace',
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
  futureBuzzCallsPlaceholder: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 8,
  },
  placeholderDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  placeholderMessages: {
    gap: 4,
  },
  placeholderMessage: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  statsCard: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
});