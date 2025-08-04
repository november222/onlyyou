import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
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
  Zap
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

// Swipeable Session Card Component
const SwipeableSessionCard = ({ 
  item, 
  onDelete, 
  onPress,
  isPremium, 
  formatDuration, 
  formatDateTime 
}: {
  item: ConnectionSession;
  onDelete: () => void;
  onPress: () => void;
  isPremium: boolean;
  formatDuration: (seconds: number) => string;
  formatDateTime: (date: Date) => string;
}) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler({
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
                <Text style={styles.sessionRoomCode}>{item.roomCode}</Text>
                <View style={[
                  styles.sessionStatus,
                  { backgroundColor: item.isActive ? '#4ade80' : '#666' }
                ]}>
                  <Text style={styles.sessionStatusText}>
                    {item.isActive ? 'Đang kết nối' : 'Đã ngắt'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#666" strokeWidth={2} />
            </View>
            
            <View style={styles.sessionDetails}>
              <View style={styles.sessionDetailRow}>
                <View style={styles.sessionDate}>
                  <Calendar size={14} color="#888" strokeWidth={2} />
                  <Text style={styles.sessionDateText}>
                    {formatDateTime(item.startDate)}
                  </Text>
                </View>
                <View style={styles.sessionDuration}>
                  <Timer size={14} color="#ff6b9d" strokeWidth={2} />
                  <Text style={styles.sessionDurationText}>
                    {formatDuration(item.duration)}
                  </Text>
                </View>
              </View>
              
              {item.endDate && (
                <View style={styles.sessionDate}>
                  <WifiOff size={14} color="#888" strokeWidth={2} />
                  <Text style={styles.sessionDateText}>
                    {formatDateTime(item.endDate)}
                  </Text>
                </View>
              )}
              
              {/* Buzz Calls Count */}
              <View style={styles.buzzCallsRow}>
                <Zap size={14} color="#f59e0b" strokeWidth={2} />
                <Text style={styles.buzzCallsText}>
                  {item.buzzCallsCount} buzz calls
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
      
      {/* Delete Button (appears when swiped) */}
      {!item.isActive && (
        <Animated.View style={[styles.deleteButtonContainer, deleteButtonStyle]}>
          <TouchableOpacity
            style={styles.swipeDeleteButton}
            onPress={handleDelete}
          >
            <Trash2 size={20} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

export default function HistoryScreen() {
  const [connectionSessions, setConnectionSessions] = useState<ConnectionSession[]>([]);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadConnectionHistory();
  }, []);

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
      Alert.alert(
        'Tính Năng Premier',
        'Bạn cần nâng cấp Premier để xóa lịch sử kết nối.',
        [
          { text: 'Để Sau', style: 'cancel' },
          { text: 'Nâng Cấp', onPress: () => router.push('/premium') },
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
            setConnectionSessions(prev => prev.filter(session => session.id !== sessionId));
          },
        },
      ]
    );
  };

  const handleSessionPress = (session: ConnectionSession) => {
    if (!isPremium) {
      Alert.alert(
        'Tính Năng Premier',
        'Bạn cần nâng cấp Premier để xem chi tiết phiên kết nối.',
        [
          { text: 'Để Sau', style: 'cancel' },
          { text: 'Nâng Cấp', onPress: () => console.log('Navigate to premium') },
        ]
      );
      return;
    }

    if (session.isActive) {
      Alert.alert('Phiên Đang Hoạt Động', 'Không thể xem chi tiết phiên đang kết nối.');
      return;
    }
    
    router.push({
      pathname: '/history/[id]',
      params: { 
        id: session.id,
        sessionData: JSON.stringify(session)
      }
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
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

  const renderConnectionSession = ({ item }: { item: ConnectionSession }) => (
    <SwipeableSessionCard
      item={item}
      onDelete={() => handleDeleteSession(item.id)}
      onPress={() => handleSessionPress(item)}
      isPremium={isPremium}
      formatDuration={formatDuration}
      formatDateTime={formatDateTime}
    />
  );

  const totalDuration = connectionSessions.reduce((sum, session) => sum + session.duration, 0);
  const totalBuzzCalls = connectionSessions.reduce((sum, session) => sum + session.buzzCallsCount, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Lịch Sử Kết Nối</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{connectionSessions.length}</Text>
            <Text style={styles.summaryLabel}>Tổng phiên</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatDuration(totalDuration)}</Text>
            <Text style={styles.summaryLabel}>Tổng thời gian</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalBuzzCalls}</Text>
            <Text style={styles.summaryLabel}>Buzz calls</Text>
          </View>
        </View>
      </View>

      {/* Sessions List */}
      <FlatList
        data={connectionSessions}
        renderItem={renderConnectionSession}
        keyExtractor={item => item.id}
        style={styles.sessionsList}
        contentContainerStyle={styles.sessionsContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
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
  },
  sessionRoomCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
});