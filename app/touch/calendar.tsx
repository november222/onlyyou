import React, { useState, useEffect, useMemo } from 'react';
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
import { useTheme, useThemeColors } from '@/providers/ThemeProvider';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Calendar as CalendarIcon, Clock, Edit, Trash2, X } from 'lucide-react-native';
import CalendarService, { CalItem } from '@/services/CalendarService';
import { isFeatureEnabled } from '@/config/features';
import WebRTCService from '@/services/WebRTCService';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTranslation('touch');
  const colors = useThemeColors();
  // Localized weekday labels for calendar header
  const weekdayLabels = t('calendarModal.weekdays', { returnObjects: true }) as string[];
  // Theme-aware styles for light/dark modes
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
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
      color: theme.text,
    },
    partnerNameSubtitle: {
      fontSize: 12,
      color: theme.primary,
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
      color: theme.primary,
      marginBottom: 12,
    },
    calendarItem: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    calendarItemPast: {
      opacity: 0.6,
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
      color: theme.onCard || theme.text,
      flex: 1,
    },
    itemTitlePast: {
      color: colors.mutedText || theme.mutedText || theme.text,
      textDecorationLine: 'line-through',
    },
    itemActions: {
      flexDirection: 'row',
      gap: 8,
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
      color: colors.mutedText || theme.mutedText || theme.text,
    },
    itemDetailTextPast: {
      color: colors.mutedText || theme.mutedText || theme.text,
    },
    itemNote: {
      fontSize: 14,
      color: theme.onCard || theme.text,
      fontStyle: 'italic',
    },
    itemNotePast: {
      color: colors.mutedText || theme.mutedText || theme.text,
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
      color: colors.mutedText || theme.mutedText || theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.mutedText || theme.mutedText || theme.text,
    },
    addModal: {
      flex: 1,
      backgroundColor: theme.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
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
      color: theme.text,
      marginBottom: 8,
    },
    formInput: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      color: theme.onCard || theme.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    formHint: {
      fontSize: 12,
      color: colors.mutedText || theme.mutedText || theme.text,
      marginTop: 6,
      fontStyle: 'italic',
    },
    datePickerButton: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    datePickerText: {
      fontSize: 16,
      color: theme.text,
      flex: 1,
    },
    placeholderText: {
      color: colors.mutedText || theme.mutedText || theme.text,
    },
    formTextArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    saveButton: {
      backgroundColor: theme.primary,
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
      color: theme.onPrimary || '#fff',
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
      backgroundColor: theme.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    calendarNavText: {
      fontSize: 24,
      color: theme.text,
      fontWeight: '600',
    },
    calendarHeaderText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
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
      color: colors.mutedText || theme.mutedText || theme.text,
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
      backgroundColor: theme.card,
    },
    calendarDaySelected: {
      backgroundColor: theme.primary,
    },
    calendarDayToday: {
      borderWidth: 2,
      borderColor: theme.success || '#4ade80',
    },
    calendarDayText: {
      fontSize: 16,
      color: theme.onCard || theme.text,
    },
    calendarDayTextSelected: {
      fontWeight: '700',
      color: theme.onPrimary || '#fff',
    },
    calendarDayTextToday: {
      color: theme.success || '#4ade80',
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
      color: theme.text,
      width: 60,
    },
    datePickerInput: {
      flex: 1,
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 12,
      color: theme.onCard || theme.text,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      borderWidth: 1,
      borderColor: theme.border,
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
      color: colors.mutedText || theme.mutedText || theme.text,
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
      borderColor: theme.success || '#4ade80',
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
      color: colors.mutedText || theme.mutedText || theme.text,
    },
    wheelItemTextSelected: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.success || '#4ade80',
    },
    wheelSeparator: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.success || '#4ade80',
      marginTop: 35,
    },
    datePreview: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.success || '#4ade80',
      textAlign: 'center',
      marginBottom: 20,
      padding: 16,
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pickerConfirmButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    pickerConfirmText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.onPrimary || '#fff',
    },
  }), [theme, colors]);
  const [items, setItems] = useState<CalItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<Record<string, CalItem[]>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CalItem | null>(null);

  // Form state
  const [title, setTitle] = useState(');
  const [date, setDate] = useState(');
  const [time, setTime] = useState(');
  const [note, setNote] = useState(');
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
    setTitle(');
    setDate(');
    setTime(');
    setNote(');
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
      Alert.alert('Lá»—i', 'Vui lÃ²ng nháº­p tiÃªu Ä‘á» vÃ  chá»n ngÃ y');
      return;
    }

    try {
      const result = await CalendarService.addItem(title, date, time, note);

      if (result.success) {
        Alert.alert('ThÃ nh cÃ´ng! ðŸ“…', 'Sá»± kiá»‡n Ä‘Ã£ Ä‘Æ°á»£c thÃªm vÃ o lá»‹ch');
        resetForm();
        setShowAddModal(false);
        loadCalendarItems();
      } else {
        Alert.alert('Lá»—i', result.error || 'KhÃ´ng thá»ƒ thÃªm sá»± kiá»‡n');
      }
    } catch (error) {
      Alert.alert('Lá»—i', 'CÃ³ lá»—i xáº£y ra. Vui lÃ²ng thá»­ láº¡i.');
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !title.trim() || !date.trim()) {
      Alert.alert('Lá»—i', 'Vui lÃ²ng nháº­p tiÃªu Ä‘á» vÃ  chá»n ngÃ y');
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
        Alert.alert('ThÃ nh cÃ´ng! âœï¸', 'Sá»± kiá»‡n Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t');
        resetForm();
        setShowAddModal(false);
        loadCalendarItems();
      } else {
        Alert.alert('Lá»—i', result.error || 'KhÃ´ng thá»ƒ cáº­p nháº­t sá»± kiá»‡n');
      }
    } catch (error) {
      Alert.alert('Lá»—i', 'CÃ³ lá»—i xáº£y ra. Vui lÃ²ng thá»­ láº¡i.');
    }
  };

  const handleDeleteItem = (item: CalItem) => {
    Alert.alert(
      'XÃ³a sá»± kiá»‡n?',
      `Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a "${item.title}"?`,
      [
        { text: 'Há»§y', style: 'cancel' },
        {
          text: 'XÃ³a',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await CalendarService.deleteItem(item.id);
              if (result.success) {
                loadCalendarItems();
              } else {
                Alert.alert('Lá»—i', result.error || 'KhÃ´ng thá»ƒ xÃ³a sá»± kiá»‡n');
              }
            } catch (error) {
              Alert.alert('Lá»—i', 'CÃ³ lá»—i xáº£y ra. Vui lÃ²ng thá»­ láº¡i.');
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
    setTime(item.time || ');
    setNote(item.note || ');

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
      const date = parseDate(dateString);
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

  const isEventPast = (dateStr: string, timeStr?: string): boolean => {
    try {
      const eventDate = parseDate(dateStr);

      if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes));
      } else {
        eventDate.setHours(23, 59, 59);
      }

      return eventDate.getTime() < new Date().getTime();
    } catch {
      return false;
    }
  };

  const renderCalendarItem = ({ item }: { item: CalItem }) => {
    const isPast = isEventPast(item.date, item.time);

    return (
      <View style={[styles.calendarItem, isPast && styles.calendarItemPast]}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, isPast && styles.itemTitlePast]}>{item.title}</Text>
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openEditModal(item)}
            >
              <Edit size={16} color={isPast ? "#555" : "#888"} strokeWidth={2} />
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
              <Clock size={14} color={isPast ? "#555" : "#888"} strokeWidth={2} />
              <Text style={[styles.itemDetailText, isPast && styles.itemDetailTextPast]}>{item.time}</Text>
            </View>
          )}
          <View style={styles.itemDetail}>
            <CalendarIcon size={14} color={isPast ? "#555" : "#888"} strokeWidth={2} />
            <Text style={[styles.itemDetailText, isPast && styles.itemDetailTextPast]}>{formatDateDisplay(item.date)}</Text>
          </View>
        </View>

        {item.note && (
          <Text style={[styles.itemNote, isPast && styles.itemNotePast]}>"{item.note}"</Text>
        )}
      </View>
    );
  };

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

  const groupedItemsArray = Object.entries(groupedItems).sort(([dateA], [dateB]) => {
    const a = parseDate(dateA);
    const b = parseDate(dateB);
    return a.getTime() - b.getTime();
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.onBackground || colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('common:calendar')}</Text>
          <Text style={styles.partnerNameSubtitle}>Vá»›i {partnerName} ðŸ’•</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={24} color={theme.primary} strokeWidth={2} />
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
            <CalendarIcon size={64} color={colors.border || colors.mutedText || colors.text} strokeWidth={1} />
            <Text style={styles.emptyText}>{t('touch:calendarEmptyTitle')}</Text>
            <Text style={styles.emptySubtext}>{t('touch:calendarEmptyHint')}</Text>
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
                <ArrowLeft size={24} color={colors.mutedText || colors.text} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {modalView === 'datePicker' ? t('calendarModal.pickDateTitle') :
                 modalView === 'timePicker' ? t('calendarModal.pickTimeTitle') :
                 editingItem ? t('common:editEvent') : t('common:addEvent')}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddModal(false)}
              >
                <X size={24} color={colors.mutedText || colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {modalView === 'form' && (
              <ScrollView
                style={styles.modalContent}
                keyboardShouldPersistTaps="handled"
              >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('calendarModal.titleLabel')} ({title.length}/20)</Text>
                <TextInput
                  style={styles.formInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t('calendarModal.titlePlaceholder')}
                  placeholderTextColor={colors.mutedText || colors.text}
                  maxLength={20}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>NgÃ y *</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={openDatePicker}
                >
                  <CalendarIcon size={20} color={theme.primary} strokeWidth={2} />
                  <Text style={[styles.datePickerText, !date && styles.placeholderText]}>
                    {date || t('calendarModal.datePlaceholder')}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.formHint}>{t('calendarModal.dateHint')}</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Thá»i gian (khÃ´ng báº¯t buá»™c)</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={openTimePicker}
                >
                  <Clock size={20} color={theme.success || '#4ade80'} strokeWidth={2} />
                  <Text style={[styles.datePickerText, !time && styles.placeholderText]}>
                    {time || t('calendarModal.timePlaceholder')}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.formHint}>{t('calendarModal.timeHint')}</Text>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('calendarModal.noteLabel')} ({note.length}/120)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={note}
                  onChangeText={setNote}
                  placeholder={t('calendarModal.notePlaceholder')}
                  placeholderTextColor={colors.mutedText || colors.text}
                  multiline
                  maxLength={120}
                  textAlignVertical="top"
                />
              </View>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={editingItem ? handleEditItem : handleAddItem}
              >
                <CalendarIcon size={20} color={theme.onBackground || colors.text} strokeWidth={2} />
                <Text style={styles.saveButtonText}>
                  {editingItem ? t('common:editEvent') : t('common:addEvent')}
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
                    <Text style={styles.calendarNavText}>â†</Text>
                  </TouchableOpacity>

                  <Text style={styles.calendarHeaderText}>
                    {t('calendarModal.monthHeader', {
                      month: selectedDate.getMonth() + 1,
                      year: selectedDate.getFullYear(),
                    })}
                  </Text>

                  <TouchableOpacity
                    style={styles.calendarNavButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    <Text style={styles.calendarNavText}>â†’</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarWeekdays}>
                  {weekdayLabels.map((day) => (
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
                  <Text style={styles.pickerConfirmText}>{t('common:confirm')}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {modalView === 'timePicker' && (
              <View style={styles.pickerContent}>
                <View style={styles.wheelPickerContainer}>
                  <View style={styles.wheelColumn}>
                    <Text style={styles.wheelLabel}>Giá»</Text>
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
                    <Text style={styles.wheelLabel}>PhÃºt</Text>
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
                          newTime.setMinutes(index);
                          setSelectedTime(newTime);
                        }}
                        ref={(ref) => {
                          if (ref && modalView === 'timePicker') {
                            setTimeout(() => {
                              ref.scrollTo({ y: selectedTime.getMinutes() * 50, animated: false });
                            }, 100);
                          }
                        }}
                      >
                        {Array.from({ length: 60 }, (_, i) => i).map((minute) => {
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
                  <Text style={styles.pickerConfirmText}>{t('common:confirm')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}





