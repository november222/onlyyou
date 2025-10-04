import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface BuzzNotification {
  title: string;
  body: string;
  data?: {
    type: 'buzz';
    emoji?: string;
    senderId?: string;
    senderName?: string;
  };
}

class NotificationService {
  private static instance: NotificationService;
  private PUSH_TOKEN_KEY = '@onlyyou_push_token';

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'web') {
      console.log('Push notifications not supported on web');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      const tokenData = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();

      const token = tokenData.data;
      await AsyncStorage.setItem(this.PUSH_TOKEN_KEY, token);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      console.log('Push token:', token);
      return token;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  }

  async sendLocalBuzzNotification(buzz: BuzzNotification): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('Local notifications not supported on web');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: buzz.title,
          body: buzz.body,
          data: buzz.data || {},
          sound: true,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null,
      });

      console.log('Local notification sent');
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  async scheduleTestBuzzNotification(delaySeconds: number = 5): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('Scheduled notifications not supported on web');
      return;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💕 Buzz từ Touch!',
          body: 'I miss you 🥺',
          data: {
            type: 'buzz',
            emoji: '💕',
            senderId: 'test-partner',
            senderName: 'Touch',
          },
          sound: true,
          vibrate: [0, 250, 250, 250],
        },
        trigger: {
          seconds: delaySeconds,
        },
      });

      console.log(`Test notification scheduled in ${delaySeconds}s, ID:`, notificationId);
    } catch (error) {
      console.error('Failed to schedule test notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  async getPushToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.PUSH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const notificationService = NotificationService.getInstance();
