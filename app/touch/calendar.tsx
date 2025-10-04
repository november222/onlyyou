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

  // Date/Time picker state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());

  // Modal view state: 'form' | 'datePicker' | 'timePicker'
  const [modalView, setModalView] = useState<'form' | 'datePicker' | 'timePicker'>('form');

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
    setSelectedDate(new Date());
    setSelectedTime(new Date());
    setModalView('form');
  };

  const formatDate = (dateObj: Date): string => {
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (timeObj: Date): string => {
    const hours = timeObj.getHours().toString().padStart(2, '0');
    const minutes = timeObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const parseDate = (dateStr: string): Date => {
    // Parse DD/MM/YYYY to Date
    const [day, month, year] = dateStr.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const parseTime = (timeStr: string): Date => {
    // Parse HH:MM to Date
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date;
  };

  const handleDateChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selected) {
      setSelectedDate(selected);
      setDate(formatDate(selected));
    }
  };

  const handleTimeChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (selected) {
      setSelectedTime(selected);
      setTime(formatTime(selected));
    }
  };

  const openDatePicker = () => {
    if (date) {
      try {
        setSelectedDate(parseDate(date));
      } catch (e) {
        setSelectedDate(new Date());
      }
    } else {
      setSelectedDate(new Date());
    }
    setModalView('datePicker');
  };

  const openTimePicker = () => {
    if (time) {
      try {
        setSelectedTime(parseTime(time));
      } catch (e) {
        setSelectedTime(new Date());
      }
    } else {
      setSelectedTime(new Date());
    }
    setModalView('timePicker');
  };

  const confirmDatePicker = () => {
    setDate(formatDate(selectedDate));
    setModalView('form');
  };

  const confirmTimePicker = () => {
    setTime(formatTime(selectedTime));
    setModalView('form');
  };

  const handleAddItem = async () => {
    if (!title.trim() || !date.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề và chọn ngày');
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
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề và chọn ngày');
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

    // Parse existing date/time for pickers
    if (item.date) {
      try {
        setSelectedDate(parseDate(item.date));
      } catch (e) {
        setSelectedDate(new Date());
      }
    }

    if (item.time) {
      try {
        setSelectedTime(parseTime(item.time));
      } catch (e) {
        setSelectedTime(new Date());
      }
    }

    setShowAddModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalView('form');
    setShowAddModal(true);
  };

  const formatDateDisplay = (dateString: string) => {
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
          <Text style={styles.itemDetailText}>{formatDateDisplay(item.date)}</Text>
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
        <Text style={styles.dateGroupTitle}>{formatDateDisplay(date)}</Text>
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
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  if (modalView !== 'form') {
                    setModalView('form');
                  } else {
                    setShowAddModal(false);
                  }
                }}
              >
                <ArrowLeft size={24} color="#888" strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {modalView === 'datePicker' ? 'Chọn Ngày' :
                 modalView === 'timePicker' ? 'Chọn Thời Gian' :
                 editingItem ? 'Edit Event' : 'Add Event'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddModal(false)}
              >
                <X size={24} color="#888" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {modalView === 'form' && (
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
                <Text style={styles.formLabel}>Ngày *</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={openDatePicker}
                >
                  <CalendarIcon size={20} color="#ff6b9d" strokeWidth={2} />
                  <Text style={[styles.datePickerText, !date && styles.placeholderText]}>
                    {date || 'Chọn ngày'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.formHint}>Nhấn để chọn ngày từ lịch</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Thời gian (không bắt buộc)</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={openTimePicker}
                >
                  <Clock size={20} color="#4ade80" strokeWidth={2} />
                  <Text style={[styles.datePickerText, !time && styles.placeholderText]}>
                    {time || 'Chọn thời gian'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.formHint}>Nhấn để chọn giờ và phút</Text>
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
            )}

            {modalView === 'datePicker' && (
              <ScrollView style={styles.pickerContent}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity
                    style={styles.calendarNavButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    <Text style={styles.calendarNavText}>←</Text>
                  </TouchableOpacity>

                  <Text style={styles.calendarHeaderText}>
                    Tháng {selectedDate.getMonth() + 1}, {selectedDate.getFullYear()}
                  </Text>

                  <TouchableOpacity
                    style={styles.calendarNavButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    <Text style={styles.calendarNavText}>→</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarWeekdays}>
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                    <View key={day} style={styles.calendarWeekdayCell}>
                      <Text style={styles.calendarWeekdayText}>{day}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {(() => {
                    const year = selectedDate.getFullYear();
                    const month = selectedDate.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const days = [];

                    for (let i = 0; i < firstDay; i++) {
                      days.push(
                        <View key={`empty-${i}`} style={styles.calendarDayCell} />
                      );
                    }

                    for (let day = 1; day <= daysInMonth; day++) {
                      const isSelected = day === selectedDate.getDate();
                      const isToday = day === new Date().getDate() &&
                                      month === new Date().getMonth() &&
                                      year === new Date().getFullYear();

                      days.push(
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.calendarDayCell,
                            isSelected && styles.calendarDaySelected,
                            isToday && !isSelected && styles.calendarDayToday,
                          ]}
                          onPress={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setDate(day);
                            setSelectedDate(newDate);
                          }}
                        >
                          <Text
                            style={[
                              styles.calendarDayText,
                              isSelected && styles.calendarDayTextSelected,
                              isToday && !isSelected && styles.calendarDayTextToday,
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    }

                    return days;
                  })()}
                </View>

                <Text style={styles.datePreview}>
                  {formatDate(selectedDate)}
                </Text>

                <TouchableOpacity
                  style={styles.pickerConfirmButton}
                  onPress={confirmDatePicker}
                >
                  <Text style={styles.pickerConfirmText}>Xác Nhận</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {modalView === 'timePicker' && (
              <View style={styles.pickerContent}>
                <View style={styles.wheelPickerContainer}>
                  <View style={styles.wheelColumn}>
                    <Text style={styles.wheelLabel}>Giờ</Text>
                    <View style={styles.wheelWrapper}>
                      <View style={styles.wheelHighlight} />
                      <ScrollView
                        style={styles.wheelScroll}
                        contentContainerStyle={styles.wheelScrollContent}
                        showsVerticalScrollIndicator={false}
                        snapToInterval={50}
                        decelerationRate="fast"
                        onMomentumScrollEnd={(event) => {
                          const y = event.nativeEvent.contentOffset.y;
                          const index = Math.round(y / 50);
                          const newTime = new Date(selectedTime);
                          newTime.setHours(index);
                          setSelectedTime(newTime);
                        }}
                        ref={(ref) => {
                          if (ref && modalView === 'timePicker') {
                            setTimeout(() => {
                              ref.scrollTo({ y: selectedTime.getHours() * 50, animated: false });
                            }, 100);
                          }
                        }}
                      >
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                          const isSelected = hour === selectedTime.getHours();
                          return (
                            <TouchableOpacity
                              key={hour}
                              style={styles.wheelItem}
                              onPress={() => {
                                const newTime = new Date(selectedTime);
                                newTime.setHours(hour);
                                setSelectedTime(newTime);
                              }}
                            >
                              <Text
                                style={[
                                  styles.wheelItemText,
                                  isSelected && styles.wheelItemTextSelected,
                                ]}
                              >
                                {hour.toString().padStart(2, '0')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>

                  <Text style={styles.wheelSeparator}>:</Text>

                  <View style={styles.wheelColumn}>
                    <Text style={styles.wheelLabel}>Phút</Text>
                    <View style={styles.wheelWrapper}>
                      <View style={styles.wheelHighlight} />
                      <ScrollView
                        style={styles.wheelScroll}
                        contentContainerStyle={styles.wheelScrollContent}
                        showsVerticalScrollIndicator={false}
                        snapToInterval={50}
                        decelerationRate="fast"
                        onMomentumScrollEnd={(event) => {
                          const y = event.nativeEvent.contentOffset.y;
                          const index = Math.round(y / 50);
                          const newTime = new Date(selectedTime);
                          newTime.setMinutes(index * 5);
                          setSelectedTime(newTime);
                        }}
                        ref={(ref) => {
                          if (ref && modalView === 'timePicker') {
                            setTimeout(() => {
                              ref.scrollTo({ y: (selectedTime.getMinutes() / 5) * 50, animated: false });
                            }, 100);
                          }
                        }}
                      >
                        {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => {
                          const isSelected = minute === selectedTime.getMinutes();
                          return (
                            <TouchableOpacity
                              key={minute}
                              style={styles.wheelItem}
                              onPress={() => {
                                const newTime = new Date(selectedTime);
                                newTime.setMinutes(minute);
                                setSelectedTime(newTime);
                              }}
                            >
                              <Text
                                style={[
                                  styles.wheelItemText,
                                  isSelected && styles.wheelItemTextSelected,
                                ]}
                              >
                                {minute.toString().padStart(2, '0')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                </View>

                <Text style={styles.datePreview}>
                  {formatTime(selectedTime)}
                </Text>

                <TouchableOpacity
                  style={styles.pickerConfirmButton}
                  onPress={confirmTimePicker}
                >
                  <Text style={styles.pickerConfirmText}>Xác Nhận</Text>
                </TouchableOpacity>
              </View>
            )}
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  formHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    fontStyle: 'italic',
  },
  datePickerButton: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  datePickerText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  placeholderText: {
    color: '#666',
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
  pickerContent: {
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  calendarNavText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  calendarHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  calendarWeekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  calendarWeekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarDayCell: {
    width: '13%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  calendarDaySelected: {
    backgroundColor: '#ff6b9d',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#fff',
  },
  calendarDayTextSelected: {
    fontWeight: '700',
    color: '#fff',
  },
  calendarDayTextToday: {
    color: '#4ade80',
    fontWeight: '600',
  },
  datePickerGrid: {
    gap: 16,
    marginBottom: 20,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    width: 60,
  },
  datePickerInput: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  wheelPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 30,
  },
  wheelColumn: {
    alignItems: 'center',
    gap: 10,
  },
  wheelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
  },
  wheelWrapper: {
    height: 200,
    width: 100,
    position: 'relative',
  },
  wheelHighlight: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 50,
    marginTop: -25,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#4ade80',
    zIndex: 1,
    pointerEvents: 'none',
  },
  wheelScroll: {
    flex: 1,
  },
  wheelScrollContent: {
    paddingVertical: 75,
  },
  wheelItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#666',
  },
  wheelItemTextSelected: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4ade80',
  },
  wheelSeparator: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4ade80',
    marginTop: 35,
  },
  datePreview: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4ade80',
    textAlign: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  pickerConfirmButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  pickerConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});