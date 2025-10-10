import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService, { AuthState } from '@/services/AuthService';

export default function IndexScreen() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const go = async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenIntroVideo');
        const task = InteractionManager.runAfterInteractions(() => {
          if (seen === 'true') {
            router.replace('/(tabs)/profile');
          } else {
            router.replace('/intro');
          }
        });
        return () => task.cancel?.();
      } catch {
        router.replace('/(tabs)/profile');
      }
    };
    go();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ff6b9d" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
