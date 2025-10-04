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
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Calendar as CalendarIcon, Clock, Edit, Trash2, X } from 'lucide-react-native';
import CalendarService, { CalItem } from '@/services/CalendarService';
import { isFeatureEnabled } from '@/config/features';
import WebRTCService from '@/services/WebRTCService';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<CalItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<Record<string, CalItem[]>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CalItem | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [partnerName, setPartnerName] = useState<string>('My Love');

  useEffect(() => {
    loadCalendarItems();
    loadPartnerName();
  }, []);

  const loadPartnerName = () => {
    const savedConnection = WebRTCService.getSavedConnection();
    if (savedConnection?.partnerName) {
      setPartnerName(savedConnection.partnerName);
    }
  };

  const loadCalendarItems = async () => {
    if (!isFeatureEnabled('calendar')) return;
    
    try {
      const allItems = await CalendarService.listItems();
      const grouped = await CalendarService.getItemsByDate();
      setItems(allItems);
      setGroupedItems(grouped);
    } catch (error) {
      console.error('Failed to load calendar items:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDate('');
    setTime('');
    setNote('');
    setEditingItem(null);
  };

  const handleAddItem = async () => {
    if (!title.trim() || !date.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề và ngày');
      return;
    }

    try {
      const result = await CalendarService.addItem(title, date, time, note);
      
      if (result.success) {
        Alert.alert('Thành công! 📅', 'Sự kiện đã được thêm vào lịch');
        resetForm();
        setShowAddModal(false);
        loadCalendarItems();
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể thêm sự kiện');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !title.trim() || !date.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề và ngày');
      return;
    }

    try {
      const result = await CalendarService.updateItem(editingItem.id, {
        title,
        date,
        time,
        note,
      });
      
      if (result.success) {
        Alert.alert('Thành công! ✏️', 'Sự kiện đã được cập nhật');
        resetForm();
        setShowAddModal(false);
        loadCalendarItems();
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể cập nhật sự kiện');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleDeleteItem = (item: CalItem) => {
    Alert.alert(
      'Xóa sự kiện?',
      `Bạn có chắc muốn xóa "${item.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await CalendarService.deleteItem(item.id);
              if (result.success) {
                loadCalendarItems();
              } else {
                Alert.alert('Lỗi', result.error || 'Không thể xóa sự kiện');
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (item: CalItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDate(item.date);
    setTime(item.time || '');
    setNote(item.note || '');
    setShowAddModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const renderCalendarItem = ({ item }: { item: CalItem }) => (
    <View style={styles.calendarItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Edit size={16} color="#888" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteItem(item)}
          >
            <Trash2 size={16} color="#ef4444" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.itemDetails}>
        {item.time && (
          <View style={styles.itemDetail}>
            <Clock size={14} color="#888" strokeWidth={2} />
            <Text style={styles.itemDetailText}>{item.time}</Text>
          </View>
        )}
        <View style={styles.itemDetail}>
          <CalendarIcon size={14} color="#888" strokeWidth={2} />
          <Text style={styles.itemDetailText}>{formatDate(item.date)}</Text>
        </View>
      </View>
      
      {item.note && (
        <Text style={styles.itemNote}>"{item.note}"</Text>
      )}
    </View>
  );

  const renderDateGroup = ({ item }: { item: [string, CalItem[]] }) => {
    const [date, dateItems] = item;
    
    return (
      <View style={styles.dateGroup}>
        <Text style={styles.dateGroupTitle}>{formatDate(date)}</Text>
        {dateItems.map(calItem => (
          <View key={calItem.id}>
            {renderCalendarItem({ item: calItem })}
          </View>
        ))}
      </View>
    );
  };

  const groupedItemsArray = Object.entries(groupedItems).sort(([a], [b]) => b.localeCompare(a));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.partnerNameSubtitle}>Với {partnerName} 💕</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={24} color="#ff6b9d" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Calendar Items */}
      <FlatList
        data={groupedItemsArray}
        renderItem={renderDateGroup}
        keyExtractor={([date]) => date}
        style={styles.calendarList}
        contentContainerStyle={styles.calendarContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CalendarIcon size={64} color="#333" strokeWidth={1} />
            <Text style={styles.emptyText}>No events yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first event</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.bottom}
          style={{ flex: 1 }}
        >
          <View style={styles.addModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Event' : 'Add Event'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddModal(false)}
              >
                <X size={24} color="#888" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Event title"
                  placeholderTextColor="#666"
                  maxLength={100}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date *</Text>
                <TextInput
                  style={styles.formInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#666"
                  maxLength={10}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Time (optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:MM"
                  placeholderTextColor="#666"
                  maxLength={5}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Note (optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Additional notes"
                  placeholderTextColor="#666"
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
              </View>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={editingItem ? handleEditItem : handleAddItem}
              >
                <CalendarIcon size={20} color="#fff" strokeWidth={2} />
                <Text style={styles.saveButtonText}>
                  {editingItem ? 'Update Event' : 'Add Event'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  partnerNameSubtitle: {
    fontSize: 12,
    color: '#ff6b9d',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
    marginRight: -8,
  },
  calendarList: {
    flex: 1,
  },
  calendarContent: {
    padding: 20,
    paddingTop: 10,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b9d',
    marginBottom: 12,
  },
  calendarItem: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  itemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemDetailText: {
    fontSize: 14,
    color: '#888',
  },
  itemNote: {
    fontSize: 14,
    color: '#ccc',
    fontStyle: 'italic',
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
  },
  addModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});