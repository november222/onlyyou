import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Settings, Heart, User } from 'lucide-react-native';
import { router } from 'expo-router';
import AuthService from '@/services/AuthService';
import ProfileScreen from './profile';
import MessagesScreen from './index';
import ConnectionScreen from './connection';
import SettingsScreen from './settings';

const tabs = [
  { key: 'connection', title: 'Connect', icon: Heart, component: ConnectionScreen },
  { key: 'messages', title: 'Touch', icon: MessageCircle, component: MessagesScreen },
  { key: 'profile', title: 'Profile', icon: User, component: ProfileScreen },
  { key: 'settings', title: 'Set', icon: Settings, component: SettingsScreen },
];

export default function TabLayout() {
  const [activeTab, setActiveTab] = useState('connection');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const authState = AuthService.getAuthState();

    if (!authState.isLoading) {
      if (!authState.isAuthenticated) {
        router.replace('/auth/login');
      } else {
        setIsCheckingAuth(false);
      }
    } else {
      const handleAuthChange = (state: typeof authState) => {
        if (!state.isLoading) {
          if (!state.isAuthenticated) {
            router.replace('/auth/login');
          } else {
            setIsCheckingAuth(false);
          }
          AuthService.onAuthStateChange = null;
        }
      };

      AuthService.onAuthStateChange = handleAuthChange;

      return () => {
        AuthService.onAuthStateChange = null;
      };
    }
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      {/* Content */}
      <View style={styles.content}>
        <ActiveComponent />
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavBar}>
        <View style={styles.navContainer}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.navItem, isActive && styles.activeNavItem]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Icon 
                  size={20} 
                  color={isActive ? '#ff6b9d' : '#666'} 
                  strokeWidth={2} 
                />
                <Text style={[
                  styles.navText,
                  { color: isActive ? '#ff6b9d' : '#666' }
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
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNavBar: {
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
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