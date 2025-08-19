export type EventType = 'buzz' | 'ping' | 'photo' | 'note';

export interface Event {
  id: string;
  type: EventType;
  timestamp: number;
  data: any;
  userId: string;
}

export interface BuzzEventData {
  buzzType: 'ping' | 'love' | 'miss';
  note?: string;
}

export interface PingEventData {
  questionId: string;
  question: string;
  answer: string;
}

export interface PhotoEventData {
  uri: string;
  width: number;
  height: number;
  caption?: string;
}

export interface NoteEventData {
  title?: string;
  content: string;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

class TimelineService {
  private readonly STORAGE_KEY = 'onlyyou_events';

  // Add event to timeline
  public async addEvent(event: Event): Promise<void> {
    try {
      const eventsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      const events = eventsData ? JSON.parse(eventsData) : [];
      
      events.unshift(event); // Add to beginning (newest first)
      
      // Keep only last 1000 events to prevent storage bloat
      if (events.length > 1000) {
        events.splice(1000);
      }
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
      console.log('Timeline event added:', event.type, event.id);
    } catch (error) {
      console.error('Failed to add timeline event:', error);
      throw error;
    }
  }

  // Get all events (newest first)
  public async listEvents(): Promise<Event[]> {
    try {
      const eventsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!eventsData) return [];
      
      const events = JSON.parse(eventsData);
      return events.sort((a: Event, b: Event) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get timeline events:', error);
      return [];
    }
  }

  // Get events by type
  public async getEventsByType(type: EventType): Promise<Event[]> {
    try {
      const allEvents = await this.listEvents();
      return allEvents.filter(event => event.type === type);
    } catch (error) {
      console.error('Failed to get events by type:', error);
      return [];
    }
  }

  // Delete event
  public async deleteEvent(eventId: string): Promise<void> {
    try {
      const eventsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!eventsData) return;
      
      const events = JSON.parse(eventsData);
      const filteredEvents = events.filter((event: Event) => event.id !== eventId);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredEvents));
      console.log('Timeline event deleted:', eventId);
    } catch (error) {
      console.error('Failed to delete timeline event:', error);
      throw error;
    }
  }

  // Clear all events
  public async clearAllEvents(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('All timeline events cleared');
    } catch (error) {
      console.error('Failed to clear timeline events:', error);
      throw error;
    }
  }

  // Get events count
  public async getEventsCount(): Promise<number> {
    try {
      const events = await this.listEvents();
      return events.length;
    } catch (error) {
      console.error('Failed to get events count:', error);
      return 0;
    }
  }

  // Get events for date range
  public async getEventsInRange(startDate: Date, endDate: Date): Promise<Event[]> {
    try {
      const allEvents = await this.listEvents();
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      
      return allEvents.filter(event => 
        event.timestamp >= startTime && event.timestamp <= endTime
      );
    } catch (error) {
      console.error('Failed to get events in range:', error);
      return [];
    }
  }
}

export default new TimelineService();