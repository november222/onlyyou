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
  buzzCallsCount: number;
}

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
  const [showPremiumDetailsModal, setShowPremiumDetailsModal] = useState(false);
  const [allConnectionSessions, setAllConnectionSessions] = useState<ConnectionSession[]>([]);

  const showPremiumAlert = () => {
    setShowPremiumModal(true);
  };

  const HistorySessionCard = ({ 
    item, 
    onPress,
    isPremium, 
    formatDuration, 
    formatDateTime 
  }: {
    item: ConnectionSession;
    onPress: () => void;
    isPremium: boolean;
    formatDuration: (seconds: number) => string;
    formatDateTime: (date: Date) => string;
  }) => (
    <TouchableOpacity onPress={onPress} style={styles.historySessionCard}>
      <View style={styles.historySessionHeader}>
        <View style={styles.historySessionInfo}>
          <Text style={styles.historySessionRoomCode}>{item.roomCode}</Text>
          <View style={[
            styles.historySessionStatus,
            { backgroundColor: item.isActive ? '#4ade80' : '#666' }
          ]}>
            <Text style={styles.historySessionStatusText}>
              {item.isActive ? 'Đang kết nối' : 'Đã ngắt'}
            </Text>
          </View>
        </View>
        <ChevronRight size={16} color="#666" strokeWidth={2} />
      </View>
      
      <View style={styles.historySessionDetails}>
        <View style={styles.historySessionDetailRow}>
          <View style={styles.historySessionDate}>
            <Calendar size={14} color="#888" strokeWidth={2} />
            <Text style={styles.historySessionDateText}>
              {formatDateTime(item.startDate)}
            </Text>
          </View>
          <View style={styles.historySessionDuration}>
            <Timer size={14} color="#ff6b9d" strokeWidth={2} />
            <Text style={styles.historySessionDurationText}>
              {formatDuration(item.duration)}
            </Text>
          </View>
        </View>
        
        {item.endDate && (
          <View style={styles.historySessionDate}>
            <WifiOff size={14} color="#888" strokeWidth={2} />
            <Text style={styles.historySessionDateText}>
              {formatDateTime(item.endDate)}
            </Text>
          </View>
        )}
        
        {/* Buzz Calls Count */}
        <View style={styles.historyBuzzCallsRow}>
          <Zap size={14} color="#f59e0b" strokeWidth={2} />
          <Text style={styles.historyBuzzCallsText}>
            {item.buzzCallsCount} buzz calls
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

  const totalHistoryDuration = allConnectionSessions.reduce((sum, session) => sum + session.duration, 0);
  const totalHistoryBuzzCalls = allConnectionSessions.reduce((sum, session) => sum + session.buzzCallsCount, 0);

  return (
    <>
      <View style={styles.container}>
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
            onPress={() => setShowHistoryModal(true)}
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
                      setTimeout(() => setShowPremiumDetailsModal(true), 100);
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

          {/* History Modal */}
          <Modal
            visible={showHistoryModal}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => setShowHistoryModal(false)}
          >
            <SafeAreaView style={styles.historyModal} edges={['top', 'bottom']}>
              {/* Header */}
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Lịch Sử Kết Nối</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowHistoryModal(false)}
                >
                  <X size={24} color="#888" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Summary Stats */}
              <View style={styles.historySummaryCard}>
                <View style={styles.historySummaryRow}>
                  <View style={styles.historySummaryItem}>
                    <Text style={styles.historySummaryValue}>{allConnectionSessions.length}</Text>
                    <Text style={styles.historySummaryLabel}>Tổng phiên</Text>
                  </View>
                  <View style={styles.historySummaryItem}>
                    <Text style={styles.historySummaryValue}>{formatDuration(totalHistoryDuration)}</Text>
                    <Text style={styles.historySummaryLabel}>Tổng thời gian</Text>
                  </View>
                  <View style={styles.historySummaryItem}>
                    <Text style={styles.historySummaryValue}>{totalHistoryBuzzCalls}</Text>
                    <Text style={styles.historySummaryLabel}>Buzz calls</Text>
                  </View>
                </View>
              </View>

              {/* Sessions List */}
              <FlatList
                data={allConnectionSessions}
                renderItem={renderHistorySession}
                keyExtractor={item => item.id}
                style={styles.historySessionsList}
                contentContainerStyle={styles.historySessionsContent}
                showsVerticalScrollIndicator={false}
              />
            </SafeAreaView>
          </Modal>

          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>
              "Yêu không phải là nhìn vào mắt nhau, mà là cùng nhau nhìn về một hướng."
            </Text>
            <Text style={styles.quoteAuthor}>- Antoine de Saint-Exupéry</Text>
          </View>

        </ScrollView>
      </View>
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
  premiumDetailsModal: {
    flex: 1,
    backgroundColor: '#000',
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
    color: '#fff',
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
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#888',
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
    color: '#fff',
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
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#333',
    position: 'relative',
    minHeight: 120,
    justifyContent: 'space-between',
  },
  recommendedCard: {
    borderColor: '#f59e0b',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#f59e0b',
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
    color: '#fff',
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
    color: '#fff',
    flex: 1,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f59e0b',
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
    color: '#666',
    textDecorationLine: 'line-through',
  },
  pricingPeriod: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 12,
    color: '#4ade80',
    fontWeight: '600',
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  featuresSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
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
    color: '#fff',
    marginBottom: 4,
    lineHeight: 22,
  },
  featureDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  guaranteeSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  guaranteeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ade80',
    marginTop: 12,
    marginBottom: 8,
  },
  guaranteeDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSection: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#111',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 40,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 12,
  },
  historyModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  historySummaryCard: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
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
    color: '#ff6b9d',
    marginBottom: 4,
  },
  historySummaryLabel: {
    fontSize: 12,
    color: '#888',
  },
  historySessionsList: {
    flex: 1,
  },
  historySessionsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historySessionCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
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
  },
  historySessionRoomCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'monospace',
  },
  historySessionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historySessionStatusText: {
    fontSize: 12,
    color: '#fff',
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
    color: '#888',
  },
  historySessionDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historySessionDurationText: {
    fontSize: 13,
    color: '#ff6b9d',
    fontWeight: '500',
  },
  historyBuzzCallsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyBuzzCallsText: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '500',
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