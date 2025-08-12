import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { Bell, Moon, Shield, Trash2, Download, Upload, Info, Heart, ChevronRight, User, LogOut, UserX, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import AuthService, { AuthState } from '@/services/AuthService';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [authState, setAuthState] = useState<AuthState>(AuthService.getAuthState());

  useEffect(() => {
    // Listen for auth state changes
    AuthService.onAuthStateChange = (state) => {
      setAuthState(state);
    };

    return () => {
      AuthService.onAuthStateChange = null;
    };
  }, []);

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
      'Đăng Xuất',
      'Bạn có chắc muốn đăng xuất khỏi ứng dụng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng Xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.signOut();
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
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
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Account Section */}
        {authState.user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tài Khoản</Text>
            <View style={styles.sectionContent}>
              <SettingItem
                icon={<User size={20} color="#ff6b9d" strokeWidth={2} />}
                title={authState.user.name}
                subtitle={`${authState.user.email} • Đăng nhập qua ${authState.user.provider === 'google' ? 'Google' : 'Apple'}`}
              />
              <SettingItem
                icon={<LogOut size={20} color="#ef4444" strokeWidth={2} />}
                title="Đăng Xuất"
                subtitle="Đăng xuất khỏi ứng dụng"
                onPress={handleSignOut}
                showChevron
              />
            </View>
          </View>
        )}

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Bell size={20} color="#ff6b9d" strokeWidth={2} />}
              title="Push Notifications"
              subtitle="Get notified when your partner sends a message"
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
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Moon size={20} color="#ff6b9d" strokeWidth={2} />}
              title="Dark Mode"
              subtitle="Use dark theme for better night viewing"
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
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Shield size={20} color="#ff6b9d" strokeWidth={2} />}
              title="Read Receipts"
              subtitle="Let your partner know when you've read their messages"
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
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Upload size={20} color="#ff6b9d" strokeWidth={2} />}
              title="Auto Backup"
              subtitle="Automatically backup your messages"
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
              title="Export Messages"
              subtitle="Download your conversation history"
              onPress={handleExportMessages}
              showChevron
            />
            <SettingItem
              icon={<Upload size={20} color="#3b82f6" strokeWidth={2} />}
              title="Create Backup"
              subtitle="Manually backup your messages"
              onPress={handleBackupMessages}
              showChevron
            />
            <SettingItem
              icon={<Trash2 size={20} color="#ef4444" strokeWidth={2} />}
              title="Clear All Messages"
              subtitle="Permanently delete all messages"
              onPress={handleClearMessages}
              showChevron
            />
          </View>
        </View>

        {/* Account Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quản Lý Tài Khoản</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<UserX size={20} color="#ef4444" strokeWidth={2} />}
              title="Xóa Tài Khoản Vĩnh Viễn"
              subtitle="Xóa hoàn toàn tài khoản và tất cả dữ liệu"
              onPress={handleDeleteAccount}
              showChevron
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Info size={20} color="#ff6b9d" strokeWidth={2} />}
              title="About Only You"
              subtitle="Version 1.0.0 • Made with ❤️"
              showChevron
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Only You is designed for two people who want complete privacy in their communication.
            Your messages are encrypted and stored only on your devices.
          </Text>
        </View>
      </ScrollView>
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
});