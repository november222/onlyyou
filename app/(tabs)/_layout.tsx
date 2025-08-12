import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Settings, Heart, User } from 'lucide-react-native';
import ProfileScreen from './profile';
import MessagesScreen from './index';
import ConnectionScreen from './connection';
import SettingsScreen from './settings';

const tabs = [
  { key: 'profile', title: 'Profile', icon: User, component: ProfileScreen },
  { key: 'messages', title: 'Messages', icon: MessageCircle, component: MessagesScreen },
  { key: 'connection', title: 'Connection', icon: Heart, component: ConnectionScreen },
  { key: 'settings', title: 'Settings', icon: Settings, component: SettingsScreen },
];

export default function TabLayout() {
  const [activeTab, setActiveTab] = useState('profile');

  const ActiveComponent = tabs.find(tab => tab.key === activeTab)?.component || ProfileScreen;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Navigation Bar */}
      <View style={styles.topNavBar}>
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

      {/* Content */}
      <View style={styles.content}>
        <ActiveComponent />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topNavBar: {
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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