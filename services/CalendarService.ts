import AsyncStorage from '@react-native-async-storage/async-storage';
import { rateLimiter, RATE_LIMITS } from './RateLimiter';

export interface CalItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  time?: string; // HH:MM format
  note?: string;
  timestamp: number;
  userId: string;
}

export interface CalResult {
  success: boolean;
  error?: string;
  item?: CalItem;
}

class CalendarService {
  private readonly STORAGE_KEY = 'onlyyou_calendar';

  // Add calendar item
  public async addItem(title: string, date: string, time?: string, note?: string): Promise<CalResult> {
    try {
      const rateLimitCheck = rateLimiter.canPerformAction('calendar_add', RATE_LIMITS.CALENDAR_ADD);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: rateLimitCheck.reason || 'Vui lÃ²ng Ä‘á»£i trÆ°á»›c khi thÃªm sá»± kiá»‡n tiáº¿p theo',
        };
      }

      if (!title.trim()) {
        return {
          success: false,
          error: 'Title is required',
        };
      }

      if (!date.trim()) {
        return {
          success: false,
          error: 'Date is required',
        };
      }

      const item: CalItem = {
        id: `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: title.trim(),
        date: this.normalizeDate(date.trim()),
        time: time?.trim(),
        note: note?.trim(),
        timestamp: Date.now(),
        userId: 'current_user',
      };

      await this.saveItem(item);

      rateLimiter.recordAction('calendar_add');

      console.log('Calendar item added:', item.title, item.date);

      return {
        success: true,
        item,
      };
    } catch (error) {
      console.error('Failed to add calendar item:', error);
      return {
        success: false,
        error: 'KhÃ´ng thá»ƒ thÃªm sá»± kiá»‡n. Vui lÃ²ng thá»­ láº¡i.',
      };
    }
  }

  // Get all calendar items (newest first)
  public async listItems(): Promise<CalItem[]> {
    try {
      const itemsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!itemsData) return [];
      
      const items = JSON.parse(itemsData);
      return items.sort((a: CalItem, b: CalItem) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get calendar items:', error);
      return [];
    }
  }

  // Get items grouped by date
  public async getItemsByDate(): Promise<Record<string, CalItem[]>> {
    try {
      const items = await this.listItems();
      const grouped: Record<string, CalItem[]> = {};
      
      items.forEach(item => {
        if (!grouped[item.date]) {
          grouped[item.date] = [];
        }
        grouped[item.date].push(item);
      });
      
      // Sort items within each date by time
      Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => {
          if (!a.time && !b.time) return 0;
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
        });
      });
      
      return grouped;
    } catch (error) {
      console.error('Failed to get items by date:', error);
      return {};
    }
  }

  // Update calendar item
  public async updateItem(id: string, updates: Partial<Omit<CalItem, 'id' | 'timestamp' | 'userId'>>): Promise<CalResult> {
    try {
      const itemsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!itemsData) {
        return {
          success: false,
          error: 'Item not found',
        };
      }
      
      const items = JSON.parse(itemsData);
      const itemIndex = items.findIndex((item: CalItem) => item.id === id);
      
      if (itemIndex === -1) {
        return {
          success: false,
          error: 'Item not found',
        };
      }
      
      const next: any = { ...items[itemIndex], ...updates };\n      if (updates.date) {\n        next.date = this.normalizeDate(updates.date);\n      }\n      items[itemIndex] = next;
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      
      console.log('Calendar item updated:', id);
      
      return {
        success: true,
        item: items[itemIndex],
      };
    } catch (error) {
      console.error('Failed to update calendar item:', error);
      return {
        success: false,
        error: 'KhÃ´ng thá»ƒ cáº­p nháº­t sá»± kiá»‡n. Vui lÃ²ng thá»­ láº¡i.',
      };
    }
  }

  // Delete calendar item
  public async deleteItem(id: string): Promise<CalResult> {
    try {
      const rateLimitCheck = rateLimiter.canPerformAction('calendar_delete', RATE_LIMITS.CALENDAR_DELETE);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: rateLimitCheck.reason || 'Vui lÃ²ng Ä‘á»£i trÆ°á»›c khi xÃ³a tiáº¿p',
        };
      }

      const itemsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!itemsData) {
        return {
          success: false,
          error: 'Item not found',
        };
      }

      const items = JSON.parse(itemsData);
      const filteredItems = items.filter((item: CalItem) => item.id !== id);

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredItems));

      rateLimiter.recordAction('calendar_delete');

      console.log('Calendar item deleted:', id);
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('Failed to delete calendar item:', error);
      return {
        success: false,
        error: 'KhÃ´ng thá»ƒ xÃ³a sá»± kiá»‡n. Vui lÃ²ng thá»­ láº¡i.',
      };
    }
  }

  // Private: Save item to storage
  private async saveItem(item: CalItem): Promise<void> {
    try {
      const itemsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      const items = itemsData ? JSON.parse(itemsData) : [];
      
      items.unshift(item); // Add to beginning (newest first)
      
      // Keep only last 1000 items to prevent storage bloat
      if (items.length > 1000) {
        items.splice(1000);
      }
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save calendar item:', error);
      throw error;
    }
  }

  // Clear all items
  public async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('All calendar items cleared');
    } catch (error) {
      console.error('Failed to clear calendar items:', error);
      throw error;
    }
  }
}

  // Normalize date input to YYYY-MM-DD if possible\n  private normalizeDate(input: string): string {\n    try {\n      if (/^\\d{4}-\\d{2}-\\d{2}$/.test(input)) return input;\n      const m = input.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);\n      if (m) {\n        const d = m[1].padStart(2, '0');\n        const mo = m[2].padStart(2, '0');\n        const y = m[3];\n        return ${y}--;\n      }\n      const dt = new Date(input);\n      if (!isNaN(dt.getTime())) {\n        const y = dt.getFullYear();\n        const mo = String(dt.getMonth() + 1).padStart(2, '0');\n        const d = String(dt.getDate()).padStart(2, '0');\n        return ${y}--;\n      }\n      return input;\n    } catch {\n      return input;\n    }\n  }\n}\n\nexport default new CalendarService();
