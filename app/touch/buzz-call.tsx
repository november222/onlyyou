import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Phone, Zap, Heart, MessageCircle, X } from 'lucide-react-native';
import BuzzService, { BuzzType, BuzzEvent } from '@/services/BuzzService';
import { isFeatureEnabled } from '@/config/features';

export default function BuzzCallScreen() {
  const insets = useSafeAreaInsets();
  const [recentBuzz, setRecentBuzz] = useState<BuzzEvent[]>([]);
  const [buzzCooldowns, setBuzzCooldowns] = useState<Record<BuzzType, { canSend: boolean; remainingTime: number }>>({
    ping: { canSend: true, remainingTime: 0 },
    love: { canSend: true, remainingTime: 0 },
    miss: { canSend: true, remainingTime: 0 },
  });
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedBuzzType, setSelectedBuzzType] = useState<BuzzType>('ping');
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    loadRecentBuzz();
    loadBuzzCooldowns();
    
    // Update cooldowns every second
    const cooldownTimer = setInterval(loadBuzzCooldowns, 1000);
    return () => clearInterval(cooldownTimer);
  }, []);

  const loadRecentBuzz = async () => {
    try {
      const recent = await BuzzService.listRecentBuzz(10);
      setRecentBuzz(recent);
    } catch (error) {
      console.error('Failed to load recent buzz:', error);
    }
  };

  const loadBuzzCooldowns = async () => {
    if (isFeatureEnabled('buzz')) {
      const status = await BuzzService.getCooldownStatus();
      setBuzzCooldowns(status);
    }
  };

  const sendBuzz = async (type: BuzzType, note?: string) => {
    if (!isFeatureEnabled('buzz')) return;
    
    const result = await BuzzService.sendBuzz(type, note);
    
    if (result.success) {
      Alert.alert('Buzz Sent! 💕', `Đã gửi ${type} đến người yêu của bạn`);
      loadBuzzCooldowns();
      loadRecentBuzz();
      setShowNoteModal(false);
      setNoteText('');
    } else {
      Alert.alert('Không thể gửi', result.error || 'Vui lòng thử lại');
    }
  };

  const handleBuzzPress = (type: BuzzType) => {
    setSelectedBuzzType(type);
    setShowNoteModal(true);
  };

  const handleSystemCall = async () => {
    try {
      await BuzzService.makeSystemCall();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể mở ứng dụng gọi điện');
    }
  };

  const renderBuzzEvent = ({ item }: { item: BuzzEvent }) => (
    <View style={styles.buzzEventCard}>
      <View style={styles.buzzEventHeader}>
        <Text style={styles.buzzEventType}>
          {item.type === 'ping' ? '👋' : item.type === 'love' ? '❤️' : '🥺'} {item.type}
        </Text>
        <Text style={styles.buzzEventTime}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {item.note && (
        <Text style={styles.buzzEventNote}>"{item.note}"</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.bottom}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.title}>Buzz Call</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* System Call Button */}
          <TouchableOpacity style={styles.systemCallButton} onPress={handleSystemCall}>
            <Phone size={24} color="#fff" strokeWidth={2} />
            <Text style={styles.systemCallText}>Gọi Hệ Thống</Text>
          </TouchableOpacity>

          {/* Buzz Buttons */}
          <View style={styles.buzzSection}>
            <Text style={styles.sectionTitle}>Quick Buzz</Text>
            <View style={styles.buzzButtons}>
              <TouchableOpacity
                style={[styles.buzzButton, !buzzCooldowns.ping.canSend && styles.buzzButtonDisabled]}
                onPress={() => handleBuzzPress('ping')}
                disabled={!buzzCooldowns.ping.canSend}
              >
                <Text style={styles.buzzButtonIcon}>👋</Text>
                <Text style={styles.buzzButtonText}>Ping</Text>
                {!buzzCooldowns.ping.canSend && (
                  <Text style={styles.buzzCooldown}>{Math.ceil(buzzCooldowns.ping.remainingTime / 1000)}s</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.buzzButton, !buzzCooldowns.love.canSend && styles.buzzButtonDisabled]}
                onPress={() => handleBuzzPress('love')}
                disabled={!buzzCooldowns.love.canSend}
              >
                <Text style={styles.buzzButtonIcon}>❤️</Text>
                <Text style={styles.buzzButtonText}>Love</Text>
                {!buzzCooldowns.love.canSend && (
                  <Text style={styles.buzzCooldown}>{Math.ceil(buzzCooldowns.love.remainingTime / 1000)}s</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.buzzButton, !buzzCooldowns.miss.canSend && styles.buzzButtonDisabled]}
                onPress={() => handleBuzzPress('miss')}
                disabled={!buzzCooldowns.miss.canSend}
              >
                <Text style={styles.buzzButtonIcon}>🥺</Text>
                <Text style={styles.buzzButtonText}>Miss</Text>
                {!buzzCooldowns.miss.canSend && (
                  <Text style={styles.buzzCooldown}>{Math.ceil(buzzCooldowns.miss.remainingTime / 1000)}s</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Buzz */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Buzz</Text>
            <FlatList
              data={recentBuzz}
              renderItem={renderBuzzEvent}
              keyExtractor={item => item.id}
              style={styles.recentList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No recent buzz calls</Text>
              }
            />
          </View>
        </View>

        {/* Note Modal */}
        <Modal
          visible={showNoteModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowNoteModal(false)}
        >
          <View style={styles.noteModal}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>
                Add Note to {selectedBuzzType === 'ping' ? '👋' : selectedBuzzType === 'love' ? '❤️' : '🥺'} {selectedBuzzType}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowNoteModal(false)}
              >
                <X size={24} color="#888" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.noteContent}>
              <TextInput
                style={styles.noteInput}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Add a personal note (optional)"
                placeholderTextColor="#666"
                multiline
                maxLength={200}
              />
              
              <View style={styles.noteActions}>
                <TouchableOpacity
                  style={styles.sendBuzzButton}
                  onPress={() => sendBuzz(selectedBuzzType, noteText.trim() || undefined)}
                >
                  <Zap size={20} color="#fff" strokeWidth={2} />
                  <Text style={styles.sendBuzzText}>Send Buzz</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  systemCallButton: {
    backgroundColor: '#4ade80',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  systemCallText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  buzzSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  buzzButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  buzzButton: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  buzzButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#333',
  },
  buzzButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  buzzButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  buzzCooldown: {
    fontSize: 12,
    color: '#888',
  },
  recentSection: {
    flex: 1,
  },
  recentList: {
    flex: 1,
  },
  buzzEventCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  buzzEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  buzzEventType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buzzEventTime: {
    fontSize: 12,
    color: '#888',
  },
  buzzEventNote: {
    fontSize: 14,
    color: '#ccc',
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  noteModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  noteContent: {
    flex: 1,
    padding: 20,
  },
  noteInput: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  noteActions: {
    alignItems: 'center',
  },
  sendBuzzButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 200,
  },
  sendBuzzText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});