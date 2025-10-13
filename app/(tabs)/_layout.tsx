import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme, useThemeColors } from '@/providers/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Settings, Heart, User } from 'lucide-react-native';
import { router } from 'expo-router';
import AuthService from '@/services/AuthService';
import WebRTCService from '@/services/WebRTCService';
import ProfileScreen from './profile';
import MessagesScreen from './index';
import ConnectionScreen from './connection';
import SettingsScreen from './settings';

const tabs = [
  { key: 'connection', title: 'Connect', icon: Heart, component: ConnectionScreen },
  { key: 'messages', title: 'Touch', icon: Sparkles, component: MessagesScreen },
  { key: 'profile', title: 'Profile', icon: User, component: ProfileScreen },
  { key: 'settings', title: 'Set', icon: Settings, component: SettingsScreen },
];

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState('profile');
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  useEffect(() => {
    // Bypass auth: initialize services without gating
    WebRTCService.init().catch(() => {});
  }, []);

  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b9d" />
      </View>
    );
  }

  const ActiveComponent = tabs.find(tab => tab.key === activeTab)?.component || ProfileScreen;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>

      {/* Content */}
      <View style={styles.content}>
        <ActiveComponent />
      </View>

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNavBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={styles.navContainer}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.navItem,
                  isActive && { backgroundColor: isDark ? 'rgba(255, 107, 157, 0.12)' : 'rgba(255, 107, 157, 0.08)' }
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Icon 
                  size={20} 
                  color={isActive ? theme.primary : (colors.mutedText || colors.text)} 
                  strokeWidth={2} 
                />
                <Text style={[
                  styles.navText,
                  { color: isActive ? theme.primary : (colors.mutedText || colors.text) }
                ]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNavBar: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  activeNavItem: {
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});
