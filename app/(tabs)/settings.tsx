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
import { Bell, Moon, Shield, Trash2, Download, Upload, Info, Heart, ChevronRight, User, LogOut, UserX, TriangleAlert as AlertTriangle, Globe, X, Check } from 'lucide-react-native';
import AuthService, { AuthState } from '@/services/AuthService';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { supportedLanguages } from '@/i18n';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('vi');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(AuthService.getAuthState());
  const { t, i18n: i18nInstance } = useTranslation();

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
      
      const selectedLang = supportedLanguages.find(lang => lang.code === languageCode);
      Alert.alert(
        t('settings:languageChanged'),
        t('settings:languageChangedDesc', { language: selectedLang?.name }),
        [{ text: t('common:ok') }]
      );
    } catch (error) {
      Alert.alert(t('common:error'), 'Failed to change language');
    }
  };

  const handleClearMessages = () => {
    Alert.alert(
      'Clear All Messages?',
      'This will permanently delete all your messages. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => Alert.alert('Messages Cleared', 'All messages have been deleted.'),
        },
      ]
    );
  };

  const handleExportMessages = () => {
    Alert.alert('Export Messages', 'Your messages have been exported to your device.');
  };

  const handleBackupMessages = () => {
    Alert.alert('Backup Created', 'Your messages have been backed up securely.');
  };

  const handleSignOut = () => {
    Alert.alert(
      t('auth:signOut'),
      t('auth:signOutConfirm'),
      [
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
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xóa Tài Khoản Vĩnh Viễn?',
      'Hành động này sẽ xóa hoàn toàn tài khoản của bạn và tất cả dữ liệu liên quan. Bạn sẽ không thể khôi phục lại.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tiếp Tục',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Xác Nhận Cuối Cùng',
              'Bạn có THỰC SỰ muốn xóa tài khoản vĩnh viễn? Hành động này KHÔNG THỂ hoàn tác.',
              [
                { text: 'Hủy', style: 'cancel' },
                {
                  text: 'Xóa Vĩnh Viễn',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Mock account deletion
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      
                      Alert.alert(
                        'Tài Khoản Đã Được Xóa',
                        'Tài khoản của bạn đã được xóa vĩnh viễn. Cảm ơn bạn đã sử dụng Only You.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              AuthService.signOut();
                              router.replace('/auth/login');
                            },
                          },
                        ]
                      );
                    } catch (error) {
                      Alert.alert('Lỗi', 'Không thể xóa tài khoản. Vui lòng thử lại.');
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
    showChevron = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showChevron && <ChevronRight size={20} color="#666" strokeWidth={2} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Heart size={24} color="#ff6b9d" strokeWidth={2} fill="#ff6b9d" />
          <Text style={styles.title}>{t('settings:title')}</Text>
        </View>

        {/* Account Section */}
        {authState.user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings:account')}</Text>
            <View style={styles.sectionContent}>
              <SettingItem
                icon={<User size={20} color="#ff6b9d" strokeWidth={2} />}
                title={authState.user.name}
                subtitle={`${authState.user.email} • Đăng nhập qua ${authState.user.provider === 'google' ? 'Google' : 'Apple'}`}
              />
              <SettingItem
                icon={<LogOut size={20} color="#ef4444" strokeWidth={2} />}
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
          <Text style={styles.sectionTitle}>{t('settings:notifications')}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Bell size={20} color="#ff6b9d" strokeWidth={2} />}
              title={t('settings:pushNotifications')}
              subtitle={t('settings:pushNotificationsDesc')}
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#333', true: '#ff6b9d' }}
                  thumbColor="#fff"
                />
              }
            />
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings:appearance')}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Globe size={20} color="#ff6b9d" strokeWidth={2} />}
              title={t('settings:language')}
              subtitle={supportedLanguages.find(lang => lang.code === selectedLanguage)?.name || 'Tiếng Việt'}
              onPress={() => setShowLanguageModal(true)}
              showChevron
            />
            <SettingItem
              icon={<Moon size={20} color="#ff6b9d" strokeWidth={2} />}
              title={t('settings:darkMode')}
              subtitle={t('settings:darkModeDesc')}
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#333', true: '#ff6b9d' }}
                  thumbColor="#fff"
                />
              }
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings:privacy')}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Shield size={20} color="#ff6b9d" strokeWidth={2} />}
              title={t('settings:readReceipts')}
              subtitle={t('settings:readReceiptsDesc')}
              rightElement={
                <Switch
                  value={readReceipts}
                  onValueChange={setReadReceipts}
                  trackColor={{ false: '#333', true: '#ff6b9d' }}
                  thumbColor="#fff"
                />
              }
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings:dataStorage')}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Upload size={20} color="#ff6b9d" strokeWidth={2} />}
              title={t('settings:autoBackup')}
              subtitle={t('settings:autoBackupDesc')}
              rightElement={
                <Switch
                  value={autoBackup}
                  onValueChange={setAutoBackup}
                  trackColor={{ false: '#333', true: '#ff6b9d' }}
                  thumbColor="#fff"
                />
              }
            />
            <SettingItem
              icon={<Download size={20} color="#4ade80" strokeWidth={2} />}
              title={t('settings:exportMessages')}
              subtitle={t('settings:exportMessagesDesc')}
              onPress={handleExportMessages}
              showChevron
            />
            <SettingItem
              icon={<Upload size={20} color="#3b82f6" strokeWidth={2} />}
              title={t('settings:createBackup')}
              subtitle={t('settings:createBackupDesc')}
              onPress={handleBackupMessages}
              showChevron
            />
            <SettingItem
              icon={<Trash2 size={20} color="#ef4444" strokeWidth={2} />}
              title={t('settings:clearAllMessages')}
              subtitle={t('settings:clearAllMessagesDesc')}
              onPress={handleClearMessages}
              showChevron
            />
          </View>
        </View>

        {/* Account Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings:accountManagement')}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<UserX size={20} color="#ef4444" strokeWidth={2} />}
              title={t('settings:deleteAccount')}
              subtitle={t('settings:deleteAccountDesc')}
              onPress={handleDeleteAccount}
              showChevron
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings:about')}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Info size={20} color="#ff6b9d" strokeWidth={2} />}
              title={t('settings:aboutApp')}
              subtitle={t('settings:aboutAppDesc')}
              showChevron
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
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
        <View style={styles.languageModal}>
          <View style={styles.languageHeader}>
           <Text style={styles.languageTitle}>{t('settings:selectLanguage')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <X size={24} color="#888" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.languageList}>
            {supportedLanguages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={styles.languageItem}
                onPress={() => handleLanguageChange(language.code)}
              >
                <View style={styles.languageLeft}>
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <Text style={styles.languageName}>{language.name}</Text>
                </View>
                {selectedLanguage === language.code && (
                  <Check size={20} color="#ff6b9d" strokeWidth={2} />
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
    backgroundColor: '#000',
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
    color: '#888',
    marginBottom: 8,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#111',
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
    color: '#888',
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
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  languageModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  languageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
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