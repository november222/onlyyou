import AsyncStorage from '@react-native-async-storage/async-storage';
import TimelineService from './TimelineService';

export type BuzzType = 'ping' | 'love' | 'miss';

export interface BuzzEvent {
  id: string;
  type: BuzzType;
  note?: string;
  timestamp: number;
  userId: string;
}

export interface BuzzResult {
  success: boolean;
  error?: string;
  event?: BuzzEvent;
}

class BuzzService {
  private readonly STORAGE_KEY = 'onlyyou_events';
  private readonly COOLDOWN_KEY = 'onlyyou_buzz_cooldown';
  private readonly COOLDOWN_DURATION = 30000; // 30 seconds

  // Send a buzz with cooldown protection
  public async sendBuzz(type: BuzzType, note?: string): Promise<BuzzResult> {
    try {
      // Check cooldown
      const cooldownCheck = await this.checkCooldown(type);
      if (!cooldownCheck.canSend) {
        return {
          success: false,
          error: `Vui lòng đợi ${Math.ceil(cooldownCheck.remainingTime / 1000)}s trước khi gửi ${type} tiếp theo`,
        };
      }

      // Create buzz event
      const event: BuzzEvent = {
        id: `buzz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        note,
        timestamp: Date.now(),
        userId: 'current_user', // Mock user ID
      };

      // Save event to storage
      await this.saveEvent(event);

      // Add to timeline
      await TimelineService.addEvent({
        id: event.id,
        type: 'buzz',
        timestamp: event.timestamp,
        data: {
          buzzType: event.type,
          note: event.note,
        },
        userId: event.userId,
      });

      // Set cooldown
      await this.setCooldown(type);

      console.log(`Buzz sent: ${type}${note ? ` - ${note}` : ''}`);

      return {
        success: true,
        event,
      };
    } catch (error) {
      console.error('Failed to send buzz:', error);
      return {
        success: false,
        error: 'Không thể gửi buzz. Vui lòng thử lại.',
      };
    }
  }

  // Check if user can send buzz (cooldown)
  private async checkCooldown(type: BuzzType): Promise<{ canSend: boolean; remainingTime: number }> {
    try {
      const cooldownData = await AsyncStorage.getItem(this.COOLDOWN_KEY);
      if (!cooldownData) {
        return { canSend: true, remainingTime: 0 };
      }

      const cooldowns = JSON.parse(cooldownData);
      const lastSent = cooldowns[type];
      
      if (!lastSent) {
        return { canSend: true, remainingTime: 0 };
      }

      const timeSinceLastSent = Date.now() - lastSent;
      const remainingTime = this.COOLDOWN_DURATION - timeSinceLastSent;

      return {
        canSend: remainingTime <= 0,
        remainingTime: Math.max(0, remainingTime),
      };
    } catch (error) {
      console.error('Failed to check cooldown:', error);
      return { canSend: true, remainingTime: 0 };
    }
  }

  // Set cooldown for buzz type
  private async setCooldown(type: BuzzType): Promise<void> {
    try {
      const cooldownData = await AsyncStorage.getItem(this.COOLDOWN_KEY);
      const cooldowns = cooldownData ? JSON.parse(cooldownData) : {};
      
      cooldowns[type] = Date.now();
      
      await AsyncStorage.setItem(this.COOLDOWN_KEY, JSON.stringify(cooldowns));
    } catch (error) {
      console.error('Failed to set cooldown:', error);
    }
  }

  // Save event to storage
  private async saveEvent(event: BuzzEvent): Promise<void> {
    try {
      const eventsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      const events = eventsData ? JSON.parse(eventsData) : [];
      
      events.unshift(event); // Add to beginning (newest first)
      
      // Keep only last 1000 events to prevent storage bloat
      if (events.length > 1000) {
        events.splice(1000);
      }
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save event:', error);
      throw error;
    }
  }

  // Get all buzz events
  public async getBuzzHistory(): Promise<BuzzEvent[]> {
    try {
      const eventsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!eventsData) return [];
      
      const allEvents = JSON.parse(eventsData);
      return allEvents.filter((event: any) => event.type && ['ping', 'love', 'miss'].includes(event.type));
    } catch (error) {
      console.error('Failed to get buzz history:', error);
      return [];
    }
  }

  // Get cooldown status for all buzz types
  public async getCooldownStatus(): Promise<Record<BuzzType, { canSend: boolean; remainingTime: number }>> {
    const types: BuzzType[] = ['ping', 'love', 'miss'];
    const status: Record<BuzzType, { canSend: boolean; remainingTime: number }> = {} as any;
    
    for (const type of types) {
      status[type] = await this.checkCooldown(type);
    }
    
    return status;
  }
}

export default new BuzzService();