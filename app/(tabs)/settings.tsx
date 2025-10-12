import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import {
  Bell,
  Moon,
  Shield,
  Trash2,
  Download,
  Upload,
  Info,
  Heart,
  ChevronRight,
  User,
  LogOut,
  UserX,
  TriangleAlert as AlertTriangle,
  Globe,
  X,
  Check,
} from 'lucide-react-native';
import AuthService, { AuthState } from '@/services/AuthService';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { supportedLanguages } from '@/i18n';
import { notificationService } from '@/services/NotificationService';
import { useTheme, useThemeColors } from '@/providers/ThemeProvider';
import { isFeatureEnabled } from '../../config/features';
import { usePrivacy } from '@/providers/PrivacyProvider';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const { theme, mode, setMode, isDark } = useTheme();
  const colors = useThemeColors();
  const [readReceipts, setReadReceipts] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('vi');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(
    AuthService.getAuthState()
  );
  const { t, i18n: i18nInstance } = useTranslation();
  const { isLockEnabled, setLockEnabled } = usePrivacy();

  useEffect(() => {
    // Listen for auth state changes
    AuthService.onAuthStateChange = (state) => {
      setAuthState(state);
    };

    return () => {
      AuthService.onAuthStateChange = null;
    };
  }, []);

  useEffect(() => {
    // Sync selected language with i18n current language
    setSelectedLanguage(i18nInstance.language);

    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      setSelectedLanguage(lng);
    };

    i18nInstance.on('languageChanged', handleLanguageChange);

    return () => {
      i18nInstance.off('languageChanged', handleLanguageChange);
    };
  }, [i18nInstance]);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem('lang', languageCode);
      setSelectedLanguage(languageCode);
      setShowLanguageModal(false);

      const selectedLang = supportedLanguages.find(
        (lang) => lang.code === languageCode
      );
      Alert.alert(
        t('settings:languageChanged'),
        t('settings:languageChangedDesc').replace(
          '{language}',
          selectedLang?.name || ''
        ),
        [{ text: t('common:ok') }]
      );
    } catch (error) {
      Alert.alert(t('common:error'), t('settings:languageChangeFailed'));
    }
  };

  const handleClearMessages = () => {
    Alert.alert(
      t('settings:clearAllConfirmTitle'),
      t('settings:clearAllConfirmDesc'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('settings:clearAllConfirmCTA'),
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              t('settings:messagesClearedTitle'),
              t('settings:messagesClearedDesc')
            ),
        },
      ]
    );
  };

  const handleExportMessages = () => {
    Alert.alert(t('settings:exportedTitle'), t('settings:exportedDesc'));
  };

  const handleBackupMessages = () => {
    Alert.alert(
      t('settings:backupCreatedTitle'),
      t('settings:backupCreatedDesc')
    );
  };

  const handleToggleNotifications = async (value: boolean) => {
    try {
      setNotifications(value);
      if (value) {
        const token = await notificationService.registerForPushNotifications();
        if (!token) {
          Alert.alert(
            t('settings:pushNotifications'),
            t('settings:notificationsPermissionDenied')
          );
        } else {
          Alert.alert(
            t('settings:pushNotifications'),
            t('settings:notificationsEnabled')
          );
          // TODO: Optionally send token to backend (Supabase) for server-side pushes
        }
      } else {
        // Turning off: cancel scheduled local notifications (server preference optional)
        await notificationService.cancelAllNotifications();
      }
    } catch (err) {
      console.error('Failed to toggle notifications:', err);
      Alert.alert(t('common:error'), t('settings:notificationUpdateFailed'));
    }
  };

  const handleSignOut = () => {
    Alert.alert(t('auth:signOut'), t('auth:signOutConfirm'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('auth:signOut'),
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.signOut();
            router.replace('/auth/login');
          } catch (error) {
            Alert.alert(t('common:error'), t('auth:signOutFailed'));
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings:deleteConfirmTitle'),
      t('settings:deleteConfirmDesc'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('common:continue'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('settings:deleteConfirmFinalTitle'),
              t('settings:deleteConfirmFinalDesc'),
              [
                { text: t('common:cancel'), style: 'cancel' },
                {
                  text: t('settings:deletePermanentlyCTA'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await new Promise((resolve) => setTimeout(resolve, 2000));
                      Alert.alert(
                        t('settings:accountDeletedTitle'),
                        t('settings:accountDeletedDesc'),
                        [
                          {
                            text: t('common:ok'),
                            onPress: () => {
                              AuthService.signOut();
                              router.replace('/auth/login');
                            },
                          },
                        ]
                      );
                    } catch (error) {
                      Alert.alert(
                        t('common:error'),
                        t('settings:deleteAccountFailed')
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };
  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    showChevron = false,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>{icon}</View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.settingSubtitle,
                { color: colors.mutedText || colors.text },
              ]}
            >
              {' '}
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showChevron && (
          <ChevronRight
            size={20}
            color={colors.mutedText || colors.text}
            strokeWidth={2}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Heart
            size={24}
            color={theme.primary}
            strokeWidth={2}
            fill={theme.primary}
          />
          <Text style={[styles.title, { color: colors.text }]}>
            {t('settings:title')}
          </Text>
        </View>

        {/* Account Section */}
        {authState.user && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.mutedText || colors.text },
              ]}
            >
              {t('settings:account')}
            </Text>
            <View style={styles.sectionContent}>
              <SettingItem
                icon={<User size={20} color={theme.primary} strokeWidth={2} />}
                title={authState.user.name}
                subtitle={t('settings:signedInAsVia', {
                  email: authState.user.email,
                  provider:
                    authState.user.provider === 'google' ? 'Google' : 'Google',
                })}
              />
              <SettingItem
                icon={<LogOut size={20} color={theme.danger} strokeWidth={2} />}
                title={t('auth:signOut')}
                subtitle={t('auth:signOutDescription')}
                onPress={handleSignOut}
                showChevron
              />
            </View>
          </View>
        )}

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.mutedText || colors.text },
            ]}
          >
            {t('settings:notifications')}
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <SettingItem
              icon={<Bell size={20} color={theme.primary} strokeWidth={2} />}
              title={t('settings:pushNotifications')}
              subtitle={t('settings:pushNotificationsDesc')}
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: colors.border, true: theme.primary }}
                  thumbColor={theme.onPrimary || colors.text}
                />
              }
            />
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.mutedText || colors.text },
            ]}
          >
            {t('settings:appearance')}
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <SettingItem
              icon={<Globe size={20} color={theme.primary} strokeWidth={2} />}
              title={t('settings:language')}
              subtitle={
                supportedLanguages.find(
                  (lang) => lang.code === selectedLanguage
                )?.name || t('settings:viName')
              }
              onPress={() => setShowLanguageModal(true)}
              showChevron
            />
            <SettingItem
              icon={<Moon size={20} color={theme.primary} strokeWidth={2} />}
              title={t('settings:darkMode')}
              subtitle={t('settings:darkModeDesc')}
              rightElement={
                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor: colors.card,
                    borderRadius: 8,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {[
                    { key: 'system', label: t('settings:themeSystem') },
                    { key: 'light', label: t('settings:themeLight') },
                    { key: 'dark', label: t('settings:themeDark') },
                  ].map((opt) => {
                    const selected = mode === (opt.key as any);
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => {
                          if (mode !== (opt.key as any)) {
                            setMode(opt.key as any);
                          }
                        }}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          backgroundColor: selected
                            ? theme.primary
                            : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            color: selected ? '#fff' : colors.text,
                            fontSize: 12,
                            fontWeight: '600',
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              }
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.mutedText || colors.text },
            ]}
          >
            {t('settings:privacy')}
          </Text>
          <View style={styles.sectionContent}>
            {isFeatureEnabled('privacyLock') && (
              <SettingItem
                icon={
                  <Shield size={20} color={theme.primary} strokeWidth={2} />
                }
                title={t('settings:appLock')}
                subtitle={t('settings:appLockDesc')}
                rightElement={
                  <Switch
                    value={isLockEnabled}
                    onValueChange={setLockEnabled}
                    trackColor={{ false: colors.border, true: theme.primary }}
                    thumbColor={theme.onPrimary || colors.text}
                  />
                }
              />
            )}
          </View>
        </View>

        {/* Data & Storage section removed per request */}

        {/* Account Management Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.mutedText || colors.text },
            ]}
          >
            {t('settings:accountManagement')}
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <SettingItem
              icon={<UserX size={20} color={theme.danger} strokeWidth={2} />}
              title={t('settings:deleteAccount')}
              subtitle={t('settings:deleteAccountDesc')}
              onPress={handleDeleteAccount}
              showChevron
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.mutedText || colors.text },
            ]}
          >
            {t('settings:about')}
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <SettingItem
              icon={<Info size={20} color={theme.primary} strokeWidth={2} />}
              title={t('settings:aboutApp')}
              subtitle={t('settings:aboutAppDesc')}
              showChevron
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: colors.mutedText || colors.text },
            ]}
          >
            {t('settings:footerText')}
          </Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View
          style={[styles.languageModal, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.languageHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Text style={[styles.languageTitle, { color: colors.text }]}>
              {t('settings:selectLanguage')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <X
                size={24}
                color={colors.mutedText || colors.text}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.languageList}>
            {supportedLanguages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => handleLanguageChange(language.code)}
              >
                <View style={styles.languageLeft}>
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <Text style={[styles.languageName, { color: colors.text }]}>
                    {language.name}
                  </Text>
                </View>
                {selectedLanguage === language.code && (
                  <Check size={20} color={theme.primary} strokeWidth={2} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',

    marginBottom: 8,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,

    lineHeight: 18,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,

    textAlign: 'center',
    lineHeight: 20,
  },
  languageModal: {
    flex: 1,
  },
  languageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  languageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  languageList: {
    flex: 1,
    padding: 20,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});
