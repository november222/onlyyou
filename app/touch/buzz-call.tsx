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
import BuzzService, { BuzzEvent, BuzzTemplate } from '@/services/BuzzService';
import { isFeatureEnabled } from '@/config/features';

export default function BuzzCallScreen() {
  const insets = useSafeAreaInsets();
  const [recentBuzz, setRecentBuzz] = useState<BuzzEvent[]>([]);
  const [buzzCooldown, setBuzzCooldown] = useState<{ canSend: boolean; remainingTime: number }>({
    canSend: true,
    remainingTime: 0,
  });
  const [buzzTemplates, setBuzzTemplates] = useState<BuzzTemplate[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCustomBuzzModal, setShowCustomBuzzModal] = useState(false);
  const [selectedBuzzTemplateId, setSelectedBuzzTemplateId] = useState<string>('ping');
  const [noteText, setNoteText] = useState('');
  const [customBuzzText, setCustomBuzzText] = useState('');
  const [customBuzzEmoji, setCustomBuzzEmoji] = useState('💫');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadRecentBuzz();
    loadBuzzCooldown();
    loadBuzzTemplates();
    checkPremiumStatus();
    
    // Update cooldowns every second
    const cooldownTimer = setInterval(loadBuzzCooldown, 1000);
    return () => clearInterval(cooldownTimer);
  }, []);

  const loadRecentBuzz = async () => {
    try {
      const recent = await BuzzService.getBuzzHistory(10);
      setRecentBuzz(recent);
    } catch (error) {
      console.error('Failed to load recent buzz:', error);
    }
  };

  const loadBuzzCooldown = async () => {
    if (isFeatureEnabled('buzz')) {
      const status = await BuzzService.getCooldownStatus();
      setBuzzCooldown(status);
    }
  };

  const checkPremiumStatus = async () => {
    // Mock premium check - replace with actual premium service
    setIsPremium(false); // Set to true to test premium features
  };

  const loadBuzzTemplates = async () => {
    try {
      const templates = await BuzzService.getBuzzTemplates(isPremium);
      setBuzzTemplates(templates);
    } catch (error) {
      console.error('Failed to load buzz templates:', error);
    }
  };

  const sendBuzz = async (templateId: string, note?: string) => {
    if (!isFeatureEnabled('buzz')) return;
    
    const result = await BuzzService.sendBuzz(templateId, note);
    
    if (result.success) {
      const template = buzzTemplates.find(t => t.id === templateId);
      Alert.alert('Buzz Sent! 💕', `Đã gửi ${template?.text || 'buzz'} đến người yêu của bạn`);
      loadBuzzCooldown();
      loadRecentBuzz();
      setShowNoteModal(false);
      setNoteText('');
    } else {
      Alert.alert('Không thể gửi', result.error || 'Vui lòng thử lại');
    }
  };

  const handleBuzzPress = (templateId: string) => {
    setSelectedBuzzTemplateId(templateId);
    setShowNoteModal(true);
  };

  const handleCreateCustomBuzz = () => {
    if (!isPremium) {
      Alert.alert(
        'Tính Năng Premium 👑',
        'Tạo buzz tùy chỉnh là tính năng dành cho người dùng Premium.',
        [
          { text: 'Để Sau', style: 'cancel' },
          { text: 'Nâng Cấp', onPress: () => router.push('/premium') },
        ]
      );
      return;
    }
    
    setCustomBuzzText('');
    setCustomBuzzEmoji('💫');
    setShowCustomBuzzModal(true);
  };

  const handleSaveCustomBuzz = async () => {
    if (!customBuzzText.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung buzz');
      return;
    }

    if (customBuzzText.length > 20) {
      Alert.alert('Lỗi', 'Buzz tùy chỉnh không được quá 20 ký tự');
      return;
    }

    try {
      const result = await BuzzService.createCustomBuzz(customBuzzText, customBuzzEmoji, isPremium);
      
      if (result.success) {
        Alert.alert('Thành công! ✨', 'Buzz tùy chỉnh đã được tạo');
        setShowCustomBuzzModal(false);
        loadBuzzTemplates(); // Refresh templates
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tạo buzz tùy chỉnh');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const renderBuzzEvent = ({ item }: { item: BuzzEvent }) => (
    <View style={styles.buzzEventCard}>
      <View style={styles.buzzEventHeader}>
        {(() => {
          const template = buzzTemplates.find(t => t.id === item.buzzId);
          return (
            <Text style={styles.buzzEventType}>
              {template?.emoji || '💫'} {template?.text || item.text}
            </Text>
          );
        })()}
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
          {/* Create Custom Buzz Button */}
          <TouchableOpacity style={styles.customBuzzButton} onPress={handleCreateCustomBuzz}>
            <Zap size={24} color="#fff" strokeWidth={2} />
            <Text style={styles.customBuzzText}>Tạo Buzz Tùy Chỉnh</Text>
            {!isPremium && <Text style={styles.premiumBadge}>👑</Text>}
          </TouchableOpacity>

          {/* Buzz Buttons */}
          <View style={styles.buzzSection}>
            <Text style={styles.sectionTitle}>Quick Buzz</Text>
            <View style={styles.buzzButtons}>
              <TouchableOpacity
                style={[styles.buzzButton, !buzzCooldown.canSend && styles.buzzButtonDisabled]}
                onPress={() => handleBuzzPress('ping')}
                disabled={!buzzCooldown.canSend}
              >
                <Text style={styles.buzzButtonIcon}>👋</Text>
                <Text style={styles.buzzButtonText}>Ping</Text>
                {!buzzCooldown.canSend && (
                  <Text style={styles.buzzCooldown}>{Math.ceil(buzzCooldown.remainingTime / 1000)}s</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.buzzButton, !buzzCooldown.canSend && styles.buzzButtonDisabled]}
                onPress={() => handleBuzzPress('love')}
                disabled={!buzzCooldown.canSend}
              >
                <Text style={styles.buzzButtonIcon}>❤️</Text>
                <Text style={styles.buzzButtonText}>Love</Text>
                {!buzzCooldown.canSend && (
                  <Text style={styles.buzzCooldown}>{Math.ceil(buzzCooldown.remainingTime / 1000)}s</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.buzzButton, !buzzCooldown.canSend && styles.buzzButtonDisabled]}
                onPress={() => handleBuzzPress('miss')}
                disabled={!buzzCooldown.canSend}
              >
                <Text style={styles.buzzButtonIcon}>🥺</Text>
                <Text style={styles.buzzButtonText}>Miss</Text>
                {!buzzCooldown.canSend && (
                  <Text style={styles.buzzCooldown}>{Math.ceil(buzzCooldown.remainingTime / 1000)}s</Text>
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
                Add Note to {(() => {
                  const template = buzzTemplates.find(t => t.id === selectedBuzzTemplateId);
                  return `${template?.emoji || '💫'} ${template?.text || selectedBuzzTemplateId}`;
                })()}
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
                  onPress={() => sendBuzz(selectedBuzzTemplateId, noteText.trim() || undefined)}
                >
                  <Zap size={20} color="#fff" strokeWidth={2} />
                  <Text style={styles.sendBuzzText}>Send Buzz</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Custom Buzz Modal */}
        <Modal
          visible={showCustomBuzzModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCustomBuzzModal(false)}
        >
          <View style={styles.customBuzzModal}>
            <View style={styles.customBuzzHeader}>
              <Text style={styles.customBuzzTitle}>Tạo Buzz Tùy Chỉnh</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCustomBuzzModal(false)}
              >
                <X size={24} color="#888" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.customBuzzContent}>
              <View style={styles.emojiSelector}>
                <Text style={styles.formLabel}>Chọn Emoji:</Text>
                <View style={styles.emojiOptions}>
                  {['💫', '✨', '⚡', '🔥', '💖', '🌟', '💝', '🎉'].map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiOption,
                        customBuzzEmoji === emoji && styles.selectedEmojiOption
                      ]}
                      onPress={() => setCustomBuzzEmoji(emoji)}
                    >
                      <Text style={styles.emojiOptionText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.textInputContainer}>
                <Text style={styles.formLabel}>Nội dung Buzz:</Text>
                <TextInput
                  style={styles.customBuzzInput}
                  value={customBuzzText}
                  onChangeText={setCustomBuzzText}
                  placeholder="Nhập nội dung buzz (tối đa 20 ký tự)"
                  placeholderTextColor="#666"
                  maxLength={20}
                />
                <Text style={styles.charCount}>
                  {customBuzzText.length}/20 ký tự
                </Text>
              </View>
              
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Xem trước:</Text>
                <View style={styles.previewBuzz}>
                  <Text style={styles.previewEmoji}>{customBuzzEmoji}</Text>
                  <Text style={styles.previewText}>
                    {customBuzzText || 'Nội dung buzz...'}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.saveCustomBuzzButton,
                  !customBuzzText.trim() && styles.saveCustomBuzzButtonDisabled
                ]}
                onPress={handleSaveCustomBuzz}
                disabled={!customBuzzText.trim()}
              >
                <Zap size={20} color="#fff" strokeWidth={2} />
                <Text style={styles.saveCustomBuzzText}>Lưu Buzz Tùy Chỉnh</Text>
              </TouchableOpacity>
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
  customBuzzButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
    position: 'relative',
  },
  customBuzzText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
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
  customBuzzModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  customBuzzHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  customBuzzTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  customBuzzContent: {
    flex: 1,
    padding: 20,
  },
  emojiSelector: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  emojiOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  selectedEmojiOption: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  emojiOptionText: {
    fontSize: 24,
  },
  textInputContainer: {
    marginBottom: 24,
  },
  customBuzzInput: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  previewContainer: {
    marginBottom: 32,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  previewBuzz: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    gap: 12,
  },
  previewEmoji: {
    fontSize: 24,
  },
  previewText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  saveCustomBuzzButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveCustomBuzzButtonDisabled: {
    opacity: 0.5,
  },
  saveCustomBuzzText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});