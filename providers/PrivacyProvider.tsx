import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacyContextType {
  isLockEnabled: boolean;
  setLockEnabled: (enabled: boolean) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  authenticate: () => Promise<boolean>;
  isLoading: boolean;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

interface PrivacyProviderProps {
  children: ReactNode;
}

export function PrivacyProvider({ children }: PrivacyProviderProps) {
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLockSettings();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const loadLockSettings = async () => {
    try {
      const lockEnabled = await AsyncStorage.getItem('onlyyou_lock');
      const enabled = lockEnabled === '1';
      setIsLockEnabled(enabled);
      
      // If lock is enabled, lock the app on startup
      if (enabled) {
        setIsLocked(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load lock settings:', error);
      setIsLoading(false);
    }
  };

  const setLockEnabled = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('onlyyou_lock', enabled ? '1' : '0');
      setIsLockEnabled(enabled);
      
      if (!enabled) {
        setIsLocked(false);
      }
    } catch (error) {
      console.error('Failed to save lock settings:', error);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App is going to background, lock if enabled
      if (isLockEnabled) {
        setIsLocked(true);
      }
    }
  };

  const authenticate = async (): Promise<boolean> => {
    try {
      // Check if biometric authentication is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        // Fallback to no authentication if biometrics not available
        console.log('Biometric authentication not available, unlocking');
        setIsLocked(false);
        return true;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Xác thực để mở Only You',
        cancelLabel: 'Hủy',
        fallbackLabel: 'Sử dụng mật khẩu',
      });

      if (result.success) {
        setIsLocked(false);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  };

  return (
    <PrivacyContext.Provider value={{
      isLockEnabled,
      setLockEnabled,
      isLocked,
      setIsLocked,
      authenticate,
      isLoading,
    }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy(): PrivacyContextType {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}