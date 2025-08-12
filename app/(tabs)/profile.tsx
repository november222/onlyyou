import React, { useState, useEffect } from 'react';
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
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Heart, 
  Clock, 
  Calendar, 
  Wifi, 
  WifiOff, 
  Timer,
  Users,
  Sparkles,
  TrendingUp,
  History,
  Trash2,
  Crown,
  X,
  Shield,
  ChevronRight,
  Zap
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebRTCService, { ConnectionState } from '@/services/WebRTCService';
import { router } from 'expo-router';

interface ConnectionSession {
  id: string;
  startDate: Date;
  endDate: Date | null;
  duration: number; // in seconds
  roomCode: string;
  isActive: boolean;
}

// Swipeable Session Card Component
const SwipeableSessionCard = ({ 
  item, 
  currentSessionDuration, 
  onDelete, 
  isPremium, 
  formatDuration, 
  formatDateTime 
}: {
  item: ConnectionSession;
  currentSessionDuration: number;
  onDelete: () => void;
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
            <View style={styles.sessionRight}>
              <View style={styles.sessionDuration}>
                <Timer size={16} color="#ff6b9d" strokeWidth={2} />
                <Text style={styles.sessionDurationText}>
                  {formatDuration(item.isActive ? currentSessionDuration : item.duration)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.sessionDetails}>
            <View style={styles.sessionDate}>
              <Calendar size={14} color="#888" strokeWidth={2} />
              <Text style={styles.sessionDateText}>
                Bắt đầu: {formatDateTime(item.startDate)}
              </Text>
            </View>
            {item.endDate && (
              <View style={styles.sessionDate}>
                <WifiOff size={14} color="#888" strokeWidth={2} />
                <Text style={styles.sessionDateText}>
                  Kết thúc: {formatDateTime(item.endDate)}
                </Text>
              </View>
            )}
          </View>
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

export default function ProfileScreen() {
  const [currentConnectionStart, setCurrentConnectionStart] = useState<Date | null>(new Date(Date.now() - 86400000)); // Mock: started 1 day ago
  const [totalConnectedTime, setTotalConnectedTime] = useState(0);
  const [totalDisconnectedTime, setTotalDisconnectedTime] = useState(0);
  const [connectionSessions, setConnectionSessions] = useState<ConnectionSession[]>([]);
  const [currentSessionDuration, setCurrentSessionDuration] = useState(86400); // Mock: 1 day
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    roomCode: null,
    partnerConnected: false,
    error: null,
  });
  const [realTimeTimer, setRealTimeTimer] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [allConnectionSessions, setAllConnectionSessions] = useState<ConnectionSession[]>([]);

  const showPremiumAlert = () => {
    setShowPremiumModal(true);
  };
  useEffect(() => {
    // Get current connection state
    const currentState = WebRTCService.getConnectionState();
    setConnectionState(currentState);
    
    // Listen for connection state changes
    WebRTCService.onConnectionStateChange = (state) => {
      setConnectionState(state);
      
      // Reset timer when connection state changes
      if (state.isConnected && !connectionState.isConnected) {
        // Just connected - start new timer
        setRealTimeTimer(0);
        setCurrentConnectionStart(new Date());
      } else if (!state.isConnected && connectionState.isConnected) {
        // Just disconnected - save session
        saveCurrentSession();
      }
    };

    loadConnectionData();
    
    // Real-time timer that updates every second
    const timer = setInterval(() => {
      if (connectionState.isConnected) {
        setRealTimeTimer(prev => prev + 1);
        
        // Also update current session duration for display
        if (currentConnectionStart) {
          const now = new Date();
          const duration = Math.floor((now.getTime() - currentConnectionStart.getTime()) / 1000);
          setCurrentSessionDuration(duration);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [connectionState.isConnected, currentConnectionStart]);

  const saveCurrentSession = async () => {
    if (currentConnectionStart && connectionState.roomCode) {
      const newSession: ConnectionSession = {
        id: Date.now().toString(),
        startDate: currentConnectionStart,
        endDate: new Date(),
        duration: realTimeTimer,
        roomCode: connectionState.roomCode,
        isActive: false,
      };
      
      setConnectionSessions(prev => [newSession, ...prev]);
      setTotalConnectedTime(prev => prev + realTimeTimer);
      setRealTimeTimer(0);
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
    const totalConnected = mockSessions.reduce((sum, session) => sum + session.duration, 0);
    setTotalConnectedTime(totalConnected);
    
    // Mock disconnected time (time between sessions)
    setTotalDisconnectedTime(172800); // 2 days total
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!isPremium) {
      showPremiumAlert();
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
            Alert.alert('Đã Xóa', 'Phiên kết nối đã được xóa khỏi lịch sử.');
          },
        },
      ]
    );
  };

  const handleClearAllHistory = () => {
    if (!isPremium) {
      showPremiumAlert();
      return;
    }

    Alert.alert(
      'Xóa Toàn Bộ Lịch Sử?',
      'Bạn có chắc muốn xóa toàn bộ lịch sử kết nối? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa Tất Cả',
          style: 'destructive',
          onPress: () => {
            setConnectionSessions([]);
            setTotalConnectedTime(0);
            setTotalDisconnectedTime(0);
            Alert.alert('Đã Xóa', 'Toàn bộ lịch sử kết nối đã được xóa.');
          },
        },
      ]
    );
  };

  const handleUpgradeToPremium = () => {
    Alert.alert(
      'Nâng Cấp Premier',
      'Tính năng này yêu cầu gói Premier. Bạn có muốn nâng cấp không?',
      [
        { text: 'Để Sau', style: 'cancel' },
        {
          text: 'Nâng Cấp',
          onPress: () => {
            // Mock upgrade - in real app this would integrate with payment
            setIsPremium(true);
            setShowPremiumModal(false);
            Alert.alert('Chúc Mừng!', 'Bạn đã nâng cấp thành công lên gói Premier! 🎉');
          },
        },
      ]
    );
  };

  const handleHistorySessionPress = (session: ConnectionSession) => {
    if (!isPremium) {
      setShowHistoryModal(false);
      setShowPremiumModal(true);
      return;
    }

    if (session.isActive) {
      Alert.alert('Phiên Đang Hoạt Động', 'Không thể xem chi tiết phiên đang kết nối.');
      return;
    }
    
    setShowHistoryModal(false);
    router.push({
      pathname: '/history/[id]',
      params: { 
        id: session.id,
        sessionData: JSON.stringify(session)
      }
    });
  };

  const handleDeleteHistorySession = (sessionId: string) => {
    if (!isPremium) {
      setShowHistoryModal(false);
      setShowPremiumModal(true);
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
            setAllConnectionSessions(prev => prev.filter(session => session.id !== sessionId));
            setConnectionSessions(prev => prev.filter(session => session.id !== sessionId));
          },
        },
      ]
    );
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

  const renderConnectionSession = ({ item }: { item: ConnectionSession }) => (
    <SwipeableSessionCard
      item={item}
      currentSessionDuration={currentSessionDuration}
      onDelete={() => handleDeleteSession(item.id)}
      isPremium={isPremium}
      formatDuration={formatDuration}
      formatDateTime={formatDateTime}
    />
  );

  return (
    <>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Heart size={32} color="#ff6b9d" strokeWidth={2} fill="#ff6b9d" />
            <Text style={styles.title}>Trang Cá Nhân</Text>
            <Text style={styles.subtitle}>Thống kê kết nối của bạn</Text>
          </View>

          {/* Love Counter */}
          <View style={styles.loveCounterCard}>
            <View style={styles.loveCounterHeader}>
              <Sparkles size={24} color="#ff6b9d" strokeWidth={2} />
              <Text style={styles.loveCounterTitle}>Đếm Ngày Yêu Nhau</Text>
            </View>
            
            {currentConnectionStart && (
              <View style={styles.loveCounterContent}>
                <Text style={styles.loveCounterNumber}>
                  {Math.floor((Date.now() - currentConnectionStart.getTime()) / (1000 * 60 * 60 * 24))}
                </Text>
                <Text style={styles.loveCounterLabel}>ngày đã kết nối</Text>
                <Text style={styles.loveCounterSubtext}>
                  Từ {formatDate(currentConnectionStart)}
                </Text>
              </View>
            )}
          </View>

          {/* Total Sessions Navigation */}
          <TouchableOpacity 
            style={styles.totalSessionsCard}
            onPress={() => router.push('/history')}
          >
            <View style={styles.totalSessionsHeader}>
              <View style={styles.totalSessionsLeft}>
                <History size={24} color="#ff6b9d" strokeWidth={2} />
                <Text style={styles.totalSessionsTitle}>Xem Tất Cả Phiên Kết Nối</Text>
              </View>
              <ChevronRight size={20} color="#666" strokeWidth={2} />
            </View>
          </TouchableOpacity>

          {/* Current Session Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                {connectionState.isConnected ? (
                  <Wifi size={20} color="#4ade80" strokeWidth={2} />
                ) : (
                  <WifiOff size={20} color="#ef4444" strokeWidth={2} />
                )}
              </View>
              <Text style={styles.statValue}>
                {connectionState.isConnected 
                  ? formatDuration(realTimeTimer) 
                  : formatDuration(currentSessionDuration)
                }
              </Text>
              <Text style={styles.statLabel}>
                {connectionState.isConnected ? 'Đang kết nối' : 'Phiên gần nhất'}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Clock size={20} color="#3b82f6" strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>
                {formatDuration(totalConnectedTime)}
              </Text>
              <Text style={styles.statLabel}>Tổng thời gian kết nối</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <WifiOff size={20} color="#ef4444" strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>
                {formatDuration(totalDisconnectedTime)}
              </Text>
              <Text style={styles.statLabel}>Thời gian ngắt kết nối</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <TrendingUp size={20} color="#f59e0b" strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>
                {connectionSessions.length}
              </Text>
              <Text style={styles.statLabel}>Tổng số phiên</Text>
            </View>
          </View>

          {/* Premium Modal */}
          <Modal
            visible={showPremiumModal}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => setShowPremiumModal(false)}
          >
            <SafeAreaView style={styles.premiumModal} edges={['top', 'bottom']}>
              <View style={styles.premiumHeader}>
                <Text style={styles.premiumTitle}>Nâng Cấp Premier</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowPremiumModal(false)}
                >
                  <X size={24} color="#888" strokeWidth={2} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.premiumScrollView} contentContainerStyle={styles.premiumContent}>
                <View style={styles.premiumIcon}>
                  <Crown size={48} color="#f59e0b" strokeWidth={2} fill="#f59e0b" />
                </View>
                
                <Text style={styles.premiumMainTitle}>Only You Premier</Text>
                <Text style={styles.premiumSubtitle}>
                  Mở khóa tất cả tính năng premium và trải nghiệm yêu xa hoàn hảo
                </Text>
                
                <View style={styles.premiumFeatures}>
                  <View style={styles.premiumFeature}>
                    <History size={20} color="#4ade80" strokeWidth={2} />
                    <Text style={styles.premiumFeatureText}>Xem chi tiết lịch sử kết nối</Text>
                  </View>
                  <View style={styles.premiumFeature}>
                    <Trash2 size={20} color="#4ade80" strokeWidth={2} />
                    <Text style={styles.premiumFeatureText}>Quản lý và xóa lịch sử</Text>
                  </View>
                  <View style={styles.premiumFeature}>
                    <Zap size={20} color="#4ade80" strokeWidth={2} />
                    <Text style={styles.premiumFeatureText}>Buzz Calls nâng cao</Text>
                  </View>
                  <View style={styles.premiumFeature}>
                    <Shield size={20} color="#4ade80" strokeWidth={2} />
                    <Text style={styles.premiumFeatureText}>Bảo mật nâng cao</Text>
                  </View>
                  <View style={styles.premiumFeature}>
                    <Sparkles size={20} color="#4ade80" strokeWidth={2} />
                    <Text style={styles.premiumFeatureText}>Giao diện và theme độc quyền</Text>
                  </View>
                </View>
                
                <View style={styles.premiumPricing}>
                  <Text style={styles.premiumPrice}>₫399,000/năm</Text>
                  <Text style={styles.premiumPriceSubtext}>Hoặc ₫49,000/tháng • Tiết kiệm 32%</Text>
                </View>
                
                <View style={styles.premiumActions}>
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => {
                      setShowPremiumModal(false);
                      router.push('/premium');
                    }}
                  >
                    <Crown size={20} color="#fff" strokeWidth={2} />
                    <Text style={styles.upgradeButtonText}>Xem Chi Tiết Gói</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.laterButton}
                    onPress={() => setShowPremiumModal(false)}
                  >
                    <Text style={styles.laterButtonText}>Để Sau</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>

          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>
              "Yêu không phải là nhìn vào mắt nhau, mà là cùng nhau nhìn về một hướng."
            </Text>
            <Text style={styles.quoteAuthor}>- Antoine de Saint-Exupéry</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </>
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
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  loveCounterCard: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  loveCounterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  loveCounterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  loveCounterContent: {
    alignItems: 'center',
  },
  loveCounterNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ff6b9d',
    marginBottom: 8,
  },
  loveCounterLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  loveCounterSubtext: {
    fontSize: 14,
    color: '#888',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
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
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
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
    color: '#fff',
    marginLeft: 8,
  },
  clearAllContainer: {
    // Container for the clear all button
  },
  clearAllButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearAllContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ef4444',
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
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
  sessionRight: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionDurationText: {
    fontSize: 14,
    color: '#ff6b9d',
    fontWeight: '500',
  },
  sessionDetails: {
    gap: 8,
  },
  sessionDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionDateText: {
    fontSize: 14,
    color: '#888',
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
    color: '#fff',
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
    color: '#fff',
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
    color: '#fff',
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
  quoteCard: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#ff6b9d',
    fontWeight: '500',
  },
  totalSessionsCard: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
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
    color: '#fff',
    marginLeft: 12,
  },
  totalSessionsSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  chevronIcon: {
    marginLeft: 4,
  },
});