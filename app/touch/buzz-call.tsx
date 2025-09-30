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
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Zap, X, Edit, Trash2, Plus, Eye, EyeOff } from 'lucide-react-native';
import BuzzService, { BuzzTemplate } from '@/services/BuzzService';
import { isFeatureEnabled } from '@/config/features';
import { usePremium } from '@/providers/PremiumProvider';

export default function BuzzCallScreen() {
  const insets = useSafeAreaInsets();
  const [customBuzzTemplates, setCustomBuzzTemplates] = useState<BuzzTemplate[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BuzzTemplate | null>(null);
  const [customBuzzText, setCustomBuzzText] = useState('');
  const [customBuzzEmoji, setCustomBuzzEmoji] = useState('💫');
  const { isPremium } = usePremium();

  useEffect(() => {
    loadCustomBuzzTemplates();
  }, []);

  const loadCustomBuzzTemplates = async () => {
    try {
      const allTemplates = await BuzzService.getBuzzTemplates(isPremium);
      const customOnly = allTemplates.filter(template => template.type === 'custom');
      setCustomBuzzTemplates(customOnly);
    } catch (error) {
      console.error('Failed to load custom buzz templates:', error);
    }
  };

  const openCreateModal = () => {
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
    
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (template: BuzzTemplate) => {
    setEditingTemplate(template);
    setCustomBuzzText(template.text);
    setCustomBuzzEmoji(template.emoji || '💫');
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setCustomBuzzText('');
    setCustomBuzzEmoji('💫');
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
      let result;
      
      if (editingTemplate) {
        // Update existing template
        result = await BuzzService.updateCustomBuzz(editingTemplate.id, customBuzzText, customBuzzEmoji);
      } else {
        // Create new template
        result = await BuzzService.createCustomBuzz(customBuzzText, customBuzzEmoji, isPremium);
      }
      
      if (result.success) {
        Alert.alert(
          'Thành công! ✨', 
          editingTemplate ? 'Buzz đã được cập nhật' : 'Buzz tùy chỉnh đã được tạo'
        );
        setShowCreateModal(false);
        loadCustomBuzzTemplates();
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể lưu buzz tùy chỉnh');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleDeleteTemplate = (template: BuzzTemplate) => {
    Alert.alert(
      'Xóa Buzz?',
      `Bạn có chắc muốn xóa buzz "${template.text}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await BuzzService.deleteCustomBuzz(template.id);
              if (result.success) {
                loadCustomBuzzTemplates();
              } else {
                Alert.alert('Lỗi', result.error || 'Không thể xóa buzz');
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const handleToggleQuickBuzz = async (template: BuzzTemplate) => {
    try {
      const result = await BuzzService.toggleQuickBuzzVisibility(template.id);
      if (result.success) {
        loadCustomBuzzTemplates();
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể cập nhật hiển thị');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const renderCustomBuzzTemplate = ({ item }: { item: BuzzTemplate }) => (
    <View style={styles.customBuzzCard}>
      <View style={styles.customBuzzHeader}>
        <View style={styles.customBuzzLeft}>
          <Text style={styles.customBuzzEmoji}>{item.emoji || '💫'}</Text>
          <View style={styles.customBuzzInfo}>
            <Text style={styles.customBuzzText}>{item.text}</Text>
            <Text style={styles.customBuzzMeta}>
              Tạo {new Date(parseInt(item.id.split('_')[1]) || Date.now()).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>
        
        <View style={styles.customBuzzActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleQuickBuzz(item)}
          >
            {item.showInQuickBuzz ? (
              <Eye size={20} color="#4ade80" strokeWidth={2} />
            ) : (
              <EyeOff size={20} color="#666" strokeWidth={2} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Edit size={20} color="#888" strokeWidth={2} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteTemplate(item)}
          >
            <Trash2 size={20} color="#ef4444" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.quickBuzzToggle}>
        <Text style={styles.quickBuzzToggleLabel}>
          Hiển thị trong Quick Buzz
        </Text>
        <Switch
          value={item.showInQuickBuzz || false}
          onValueChange={() => handleToggleQuickBuzz(item)}
          trackColor={{ false: '#333', true: '#ff6b9d' }}
          thumbColor="#fff"
        />
      </View>
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
          <Text style={styles.title}>Quản Lý Buzz</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Plus size={24} color="#ff6b9d" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Custom Buzz List */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Buzz Tùy Chỉnh Của Bạn</Text>
          <Text style={styles.sectionSubtitle}>
            Tạo và quản lý các buzz cá nhân. Chọn buzz nào hiển thị trong Quick Buzz.
          </Text>
          
          <FlatList
            data={customBuzzTemplates}
            renderItem={renderCustomBuzzTemplate}
            keyExtractor={item => item.id}
            style={styles.customBuzzList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Zap size={64} color="#333" strokeWidth={1} />
                <Text style={styles.emptyText}>Chưa có buzz tùy chỉnh</Text>
                <Text style={styles.emptySubtext}>
                  {isPremium 
                    ? 'Tap + để tạo buzz đầu tiên'
                    : 'Nâng cấp Premium để tạo buzz tùy chỉnh'
                  }
                </Text>
                {!isPremium && (
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => router.push('/premium')}
                  >
                    <Text style={styles.upgradeButtonText}>Nâng Cấp Premium 👑</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </View>

        {/* Create/Edit Custom Buzz Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.customBuzzModal}>
            <View style={styles.customBuzzModalHeader}>
              <Text style={styles.customBuzzModalTitle}>
                {editingTemplate ? 'Chỉnh Sửa Buzz' : 'Tạo Buzz Tùy Chỉnh'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCreateModal(false)}
              >
                <X size={24} color="#888" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.customBuzzModalContent}>
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
                <Text style={styles.saveCustomBuzzText}>
                  {editingTemplate ? 'Cập Nhật Buzz' : 'Lưu Buzz Tùy Chỉnh'}
                </Text>
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
  addButton: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    lineHeight: 20,
  },
  customBuzzList: {
    flex: 1,
  },
  customBuzzCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  customBuzzHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customBuzzLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customBuzzEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  customBuzzInfo: {
    flex: 1,
  },
  customBuzzText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  customBuzzMeta: {
    fontSize: 12,
    color: '#888',
  },
  customBuzzActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  quickBuzzToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  quickBuzzToggleLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  customBuzzModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  customBuzzModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  customBuzzModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  customBuzzModalContent: {
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