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
  ScrollView,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Zap,
  X,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import BuzzService, { BuzzTemplate } from '@/services/BuzzService';
import { isFeatureEnabled } from '@/config/features';
import { usePremium } from '@/providers/PremiumProvider';
import WebRTCService from '@/services/WebRTCService';
import { useTheme, useThemeColors } from '@/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';

export default function BuzzCallScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = useThemeColors();
  const mutedTextStyle = React.useMemo(
    () => ({ color: colors.mutedText || colors.text }),
    [colors.mutedText, colors.text]
  );
  const { t, i18n } = useTranslation('touch');
  const [customBuzzTemplates, setCustomBuzzTemplates] = useState<
    BuzzTemplate[]
  >([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BuzzTemplate | null>(
    null
  );
  const [customBuzzText, setCustomBuzzText] = useState('');
  const [customBuzzEmoji, setCustomBuzzEmoji] = useState('💫');
  const [showAllEmojis, setShowAllEmojis] = useState(false);
  const { isPremium } = usePremium();
  const [partnerName, setPartnerName] = useState<string>('My Love');

  useEffect(() => {
    loadCustomBuzzTemplates();
    loadPartnerName();
  }, []);

  const loadPartnerName = () => {
    const savedConnection = WebRTCService.getSavedConnection();
    if (savedConnection?.partnerName) {
      setPartnerName(savedConnection.partnerName);
    }
  };

  const loadCustomBuzzTemplates = async () => {
    try {
      const allTemplates = await BuzzService.getBuzzTemplates(isPremium);
      // Show all templates (both custom and default)
      setCustomBuzzTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load custom buzz templates:', error);
    }
  };

  const openCreateModal = () => {
    if (!isPremium) {
      Alert.alert(
        t('createBuzz.premiumTitle'),
        t('createBuzz.premiumMessage'),
        [
          { text: t('common:cancel'), style: 'cancel' },
          {
            text: t('createBuzz.upgrade'),
            onPress: () => router.push('/premium'),
          },
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
      Alert.alert(t('common:error'), t('createBuzz.errorEmpty'));
      return;
    }

    if (customBuzzText.length > 20) {
      Alert.alert(t('common:error'), t('createBuzz.errorTooLong'));
      return;
    }

    try {
      let result;

      if (editingTemplate) {
        // Update existing template
        result = await BuzzService.updateCustomBuzz(
          editingTemplate.id,
          customBuzzText,
          customBuzzEmoji
        );
      } else {
        // Create new template
        result = await BuzzService.createCustomBuzz(
          customBuzzText,
          customBuzzEmoji,
          isPremium
        );
      }

      if (result.success) {
        Alert.alert(
          t('common:success'),
          editingTemplate ? t('createBuzz.updated') : t('createBuzz.saved')
        );
        setShowCreateModal(false);
        await loadCustomBuzzTemplates();
        BuzzService.notifyBuzzTemplatesChanged();
      } else {
        Alert.alert(
          t('common:error'),
          result.error || t('createBuzz.saveFailed')
        );
      }
    } catch (error) {
      Alert.alert(t('common:error'), t('createBuzz.genericError'));
    }
  };

  const handleDeleteTemplate = (template: BuzzTemplate) => {
    Alert.alert(
      t('createBuzz.deleteTitle'),
      t('createBuzz.deleteMessage', { text: template.text }),
      [
        { text: t('common:cancel'), style: 'cancel' as const },
        {
          text: t('common:delete'),
          style: 'destructive' as const,
          onPress: async () => {
            try {
              const result = await BuzzService.deleteCustomBuzz(template.id);
              if (result.success) {
                loadCustomBuzzTemplates();
              } else {
                Alert.alert(
                  t('common:error'),
                  result.error || t('createBuzz.deleteFailed')
                );
              }
            } catch (e) {
              Alert.alert(t('common:error'), t('createBuzz.genericError'));
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
        await loadCustomBuzzTemplates();
        // Notify other screens to reload
        BuzzService.notifyBuzzTemplatesChanged();
      } else {
        Alert.alert(
          t('common:error'),
          result.error || t('createBuzz.toggleFailed')
        );
      }
    } catch (error) {
      Alert.alert(t('common:error'), t('createBuzz.genericError'));
    }
  };

  // Emoji Selector Component
  const EmojiSelector = () => {
    const allEmojis = [
      '💫',
      '✨',
      '⚡',
      '🔥',
      '💖',
      '🌟',
      '💝',
      '🎉',
      '💕',
      '💗',
      '💓',
      '💘',
      '💞',
      '💌',
      '💋',
      '😘',
      '🥰',
      '😍',
      '🤗',
      '😊',
      '😚',
      '🥺',
      '🤭',
      '😇',
      '🌸',
      '🌺',
      '🌻',
      '🌷',
      '🌹',
      '🦋',
      '🐰',
      '🐱',
      '🍓',
      '🍑',
      '🍯',
      '🧁',
      '🍰',
      '🎂',
      '🍭',
      '🍬',
      '🌙',
      '⭐',
      '☀️',
      '🌈',
      '☁️',
      '❄️',
      '🎀',
      '👑',
    ];

    const basicEmojis = allEmojis.slice(0, 16); // First 2 rows (8 per row)
    const displayEmojis = showAllEmojis ? allEmojis : basicEmojis;

    return (
      <View style={styles.emojiSelectorContainer}>
        <View style={styles.emojiOptions}>
          {displayEmojis.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiOption,
                { backgroundColor: colors.card, borderColor: colors.border },
                customBuzzEmoji === emoji && styles.selectedEmojiOption,
              ]}
              onPress={() => setCustomBuzzEmoji(emoji)}
            >
              <Text style={[styles.emojiOptionText, { color: colors.text }]}>
                {emoji}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Expand/Collapse Button */}
          {!showAllEmojis && (
            <TouchableOpacity
              style={[
                styles.expandEmojiButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setShowAllEmojis(true)}
            >
              <Text style={[styles.expandEmojiText, { color: colors.mutedText || colors.text }]}>
                +
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {showAllEmojis && (
          <TouchableOpacity
            style={[styles.collapseButton, { backgroundColor: colors.card }]}
            onPress={() => setShowAllEmojis(false)}
          >
            <Text style={[styles.collapseButtonText, { color: colors.mutedText || colors.text }]}>
              {t('createBuzz.collapse')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCustomBuzzTemplate = ({ item }: { item: BuzzTemplate }) => (
    <View
      style={[
        styles.customBuzzCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.customBuzzHeader}>
        <View style={styles.customBuzzLeft}>
          <Text style={styles.customBuzzEmoji}>{item.emoji || '💫'}</Text>
          <View style={styles.customBuzzInfo}>
            <View style={styles.customBuzzTextRow}>
              <Text style={[styles.customBuzzText, { color: colors.text }]}>{item.text}</Text>
              {item.type === 'default' && (
                <Text style={styles.defaultBadge}>{t('createBuzz.defaultBadge')}</Text>
              )}
            </View>
            <Text style={[styles.customBuzzMeta, { color: colors.mutedText || colors.text }]}>
              {(() => {
                const ts = parseInt(item.id.split('_')[1]) || Date.now();
                const locale = i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'en' ? 'en-US' : i18n.language === 'ko' ? 'ko-KR' : i18n.language === 'es' ? 'es-ES' : undefined;
                const date = new Date(ts).toLocaleDateString(locale);
                return item.type === 'custom'
                  ? (t('createBuzz.createdOn', { date }) as string)
                  : (t('createBuzz.defaultSystem') as string);
              })()}
            </Text>
          </View>
        </View>

        <View style={styles.customBuzzActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleQuickBuzz(item)}
          >
            {item.showInQuickBuzz ? (
              <Eye size={20} color={theme.success || '#4ade80'} strokeWidth={2} />
            ) : (
              <EyeOff size={20} color={colors.mutedText || colors.text} strokeWidth={2} />
            )}
          </TouchableOpacity>

          {item.type === 'custom' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openEditModal(item)}
              >
                <Edit size={20} color={colors.mutedText || colors.text} strokeWidth={2} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteTemplate(item)}
              >
              <Trash2 size={20} color={theme.danger || '#ef4444'} strokeWidth={2} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={[styles.quickBuzzToggle, { borderTopColor: colors.border }]}>
        <Text style={[styles.quickBuzzToggleLabel, { color: colors.text }]}>
          {t('createBuzz.showInQuickBuzz')}
        </Text>
        <Switch
          value={item.showInQuickBuzz || false}
          onValueChange={() => handleToggleQuickBuzz(item)}
          trackColor={{ false: colors.border as any, true: theme.primary as any }}
          thumbColor={theme.onPrimary || colors.text}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.bottom}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft
              size={24}
              color={theme.onBackground || colors.text}
              strokeWidth={2}
            />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>{t('manageBuzz.title')}</Text>
            <Text style={styles.partnerNameSubtitle}>
              {t('manageBuzz.for', { name: partnerName })}
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Plus size={24} color={theme.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Custom Buzz List */}
        <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('manageBuzz.title')}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.mutedText || colors.text }]}>{t('manageBuzz.desc')}</Text>

          <FlatList
            data={customBuzzTemplates}
            renderItem={renderCustomBuzzTemplate}
            keyExtractor={(item) => item.id}
            style={styles.customBuzzList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Zap size={64} color={colors.mutedText || colors.text} strokeWidth={1} />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {t('createBuzz.emptyTitle')}
                </Text>

                <Text style={[styles.emptySubtext, { color: colors.mutedText || colors.text }]}>
                  {isPremium
                    ? (t('createBuzz.emptyHintFirst') as string)
                    : (t('createBuzz.emptyHintUpgrade') as string)}
                </Text>
                {!isPremium && (
                  <TouchableOpacity
                    style={[styles.upgradeButton, { backgroundColor: theme.secondary }]}
                    onPress={() => router.push('/premium')}
                  >
                    <Text style={[styles.upgradeButtonText, { color: theme.onSecondary || colors.text }]}>
                      {t('createBuzz.upgrade')}
                    </Text>
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={insets.bottom}
            style={[
              styles.customBuzzModal,
              { backgroundColor: theme.background },
            ]}
          >
            <View
              style={[
                styles.customBuzzModalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[styles.customBuzzModalTitle, { color: colors.text }]}
              >
                {editingTemplate
                  ? t('createBuzz.editTitle')
                  : t('createBuzz.createTitle')}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCreateModal(false)}
              >
                <X size={24} color={colors.mutedText || colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.customBuzzModalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.emojiSelector}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  {t('createBuzz.emojiLabel')}
                </Text>
                <EmojiSelector />
              </View>

              <View style={styles.textInputContainer}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  {t('createBuzz.contentLabel')}
                </Text>
                <TextInput
                  style={[
                    styles.customBuzzInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={customBuzzText}
                  onChangeText={setCustomBuzzText}
                  placeholder={t('createBuzz.contentPlaceholder') as string}
                  placeholderTextColor={colors.mutedText || colors.text}
                  maxLength={20}
                />
                <Text style={[styles.charCount, { color: colors.mutedText || colors.text }]}>
                  {customBuzzText.length}/20
                </Text>
              </View>

              <View style={styles.previewContainer}>
                <Text style={[styles.previewLabel, { color: colors.mutedText || colors.text }]}>
                  {t('createBuzz.previewLabel')}
                </Text>
                <View
                  style={[
                    styles.previewBuzz,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={styles.previewEmoji}>{customBuzzEmoji}</Text>
                  <Text style={[styles.previewText, { color: colors.text }]}>
                    {customBuzzText ||
                      (t('createBuzz.previewPlaceholder') as string)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveCustomBuzzButton,
                  { backgroundColor: theme.secondary },
                  !customBuzzText.trim() && styles.saveCustomBuzzButtonDisabled,
                ]}
                onPress={handleSaveCustomBuzz}
                disabled={!customBuzzText.trim()}
              >
                <Zap size={20} color={theme.onSecondary || colors.text} strokeWidth={2} />
                <Text style={[styles.saveCustomBuzzText, { color: theme.onSecondary || colors.text }]}>
                  {editingTemplate
                    ? t('createBuzz.saveUpdate')
                    : t('createBuzz.saveCreate')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
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
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    // color via theme
    marginBottom: 20,
    lineHeight: 20,
  },
  customBuzzList: {
    flex: 1,
  },
  customBuzzCard: {
    // background via theme
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    // border via theme
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
  customBuzzTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  customBuzzText: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultBadge: {
    fontSize: 10,
    color: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  customBuzzMeta: {
    fontSize: 12,
    // color via theme
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
    // border via theme
  },
  quickBuzzToggleLabel: {
    fontSize: 14,
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
    // color via theme
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    // color via theme
    textAlign: 'center',
    marginBottom: 20,
  },
  upgradeButton: {
    // background via theme
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    // color via theme
  },
  customBuzzModal: {
    flex: 1,
  },
  customBuzzModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    // border via theme
  },
  customBuzzModalTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    marginBottom: 12,
  },
  emojiOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiSelectorContainer: {
    marginBottom: 8,
  },
  expandEmojiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#555',
    borderStyle: 'dashed',
  },
  expandEmojiText: {
    fontSize: 24,
    color: '#888',
    fontWeight: '300',
  },
  collapseButton: {
    alignSelf: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 12,
  },
  collapseButtonText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
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
  },
});
