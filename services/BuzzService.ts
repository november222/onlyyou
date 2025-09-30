import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform, Alert } from 'react-native';
import TimelineService from './TimelineService';

export type BuzzType = 'ping' | 'love' | 'miss';

export interface BuzzTemplate {
  id: string;
  text: string;
  type: 'default' | 'custom';
  ownerId?: string;
  emoji?: string;
  showInQuickBuzz?: boolean;
}

export interface BuzzEvent {
  id: string;
  buzzId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  note?: string;
}

export interface BuzzResult {
  success: boolean;
  error?: string;
  buzzEvent?: BuzzEvent;
}

class BuzzService {
  private readonly STORAGE_KEY = 'onlyyou_buzz_history';
  private readonly TEMPLATES_KEY = 'onlyyou_buzz_templates';
  private readonly COOLDOWN_KEY = 'onlyyou_buzz_cooldown';
  private readonly COOLDOWN_DURATION = 30000; // 30 seconds
  private readonly API_BASE = 'https://api.onlyyou.app'; // Replace with actual API

  // Default buzz templates for free users
  private readonly DEFAULT_TEMPLATES: BuzzTemplate[] = [
    { id: 'ping', text: 'Ping', type: 'default', emoji: '👋', showInQuickBuzz: true },
    { id: 'love', text: 'Love you', type: 'default', emoji: '❤️', showInQuickBuzz: true },
    { id: 'miss', text: 'Miss you', type: 'default', emoji: '🥺', showInQuickBuzz: true },
    { id: 'default_4', text: 'Good morning', type: 'default', emoji: '🌅', showInQuickBuzz: false },
    { id: 'default_5', text: 'Good night', type: 'default', emoji: '🌙', showInQuickBuzz: false },
  ];

  // Get all buzz templates (default + custom)
  public async getBuzzTemplates(isPremium: boolean = false): Promise<BuzzTemplate[]> {
    try {
      // Always include default templates
      let templates = [...this.DEFAULT_TEMPLATES];

      if (isPremium) {
        // Load custom templates from storage for premium users
        const customTemplates = await this.getCustomTemplates();
        templates = [...templates, ...customTemplates];
      }

      // Filter only templates that should show in quick buzz for main screen
      return templates;
    } catch (error) {
      console.error('Failed to get buzz templates:', error);
      return this.DEFAULT_TEMPLATES;
    }
  }

  // Get templates for quick buzz display (only enabled ones)
  public async getQuickBuzzTemplates(isPremium: boolean = false): Promise<BuzzTemplate[]> {
    try {
      const allTemplates = await this.getBuzzTemplates(isPremium);
      return allTemplates.filter(template => template.showInQuickBuzz);
    } catch (error) {
      console.error('Failed to get quick buzz templates:', error);
      return templates;
    } catch (error) {
      console.error('Failed to get buzz templates:', error);
      return this.DEFAULT_TEMPLATES;
    }
  }

  // Get custom templates from local storage
  private async getCustomTemplates(): Promise<BuzzTemplate[]> {
    try {
      const templatesData = await AsyncStorage.getItem(this.TEMPLATES_KEY);
      if (!templatesData) return [];
      
      return JSON.parse(templatesData);
    } catch (error) {
      console.error('Failed to get custom templates:', error);
      return [];
    }
  }

  // Create custom buzz template (premium only)
  public async createCustomBuzz(text: string, emoji?: string, isPremium: boolean = false): Promise<BuzzResult> {
    try {
      if (!isPremium) {
        return {
          success: false,
          error: 'Custom buzz messages require premium subscription',
        };
      }

      if (!text.trim()) {
        return {
          success: false,
          error: 'Buzz text cannot be empty',
        };
      }

      if (text.length > 50) {
        return {
          success: false,
          error: 'Buzz text must be 20 characters or less',
        };
      }

      const customTemplate: BuzzTemplate = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: text.trim(),
        type: 'custom',
        ownerId: 'current_user', // Replace with actual user ID
        emoji: emoji || '💫',
        showInQuickBuzz: false, // Default to not showing in quick buzz
      };

      // Save to local storage
      await this.saveCustomTemplate(customTemplate);

      // TODO: API call to save on server
      // await this.apiCreateCustomBuzz(customTemplate);

      console.log('Custom buzz template created:', customTemplate.text);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Failed to create custom buzz:', error);
      return {
        success: false,
        error: 'Failed to create custom buzz. Please try again.',
      };
    }
  }

  // Update custom buzz template
  public async updateCustomBuzz(templateId: string, text: string, emoji?: string): Promise<BuzzResult> {
    try {
      if (!text.trim()) {
        return {
          success: false,
          error: 'Buzz text cannot be empty',
        };
      }

      if (text.length > 20) {
        return {
          success: false,
          error: 'Buzz text must be 20 characters or less',
        };
      }

      const templatesData = await AsyncStorage.getItem(this.TEMPLATES_KEY);
      if (!templatesData) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      const templates = JSON.parse(templatesData);
      const templateIndex = templates.findIndex((t: BuzzTemplate) => t.id === templateId);
      
      if (templateIndex === -1) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      templates[templateIndex].text = text.trim();
      if (emoji) {
        templates[templateIndex].emoji = emoji;
      }

      await AsyncStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));

      console.log('Custom buzz template updated:', templateId);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Failed to update custom buzz:', error);
      return {
        success: false,
        error: 'Failed to update custom buzz. Please try again.',
      };
    }
  }

  // Delete custom buzz template
  public async deleteCustomBuzz(templateId: string): Promise<BuzzResult> {
    try {
      const templatesData = await AsyncStorage.getItem(this.TEMPLATES_KEY);
      if (!templatesData) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      const templates = JSON.parse(templatesData);
      const filteredTemplates = templates.filter((t: BuzzTemplate) => t.id !== templateId);
      
      await AsyncStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(filteredTemplates));

      console.log('Custom buzz template deleted:', templateId);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Failed to delete custom buzz:', error);
      return {
        success: false,
        error: 'Failed to delete custom buzz. Please try again.',
      };
    }
  }

  // Toggle quick buzz visibility
  public async toggleQuickBuzzVisibility(templateId: string): Promise<BuzzResult> {
    try {
      // Handle default templates
      if (templateId.startsWith('default_') || ['ping', 'love', 'miss'].includes(templateId)) {
        // For default templates, we need to update the local state
        // In a real app, this would be saved to user preferences
        console.log('Toggle quick buzz for default template:', templateId);
        return { success: true };
      }

      // Handle custom templates
      const templatesData = await AsyncStorage.getItem(this.TEMPLATES_KEY);
      if (!templatesData) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      const templates = JSON.parse(templatesData);
      const templateIndex = templates.findIndex((t: BuzzTemplate) => t.id === templateId);
      
      if (templateIndex === -1) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      templates[templateIndex].showInQuickBuzz = !templates[templateIndex].showInQuickBuzz;
      
      await AsyncStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));

      console.log('Quick buzz visibility toggled:', templateId, templates[templateIndex].showInQuickBuzz);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Failed to toggle quick buzz visibility:', error);
      return {
        success: false,
        error: 'Failed to update visibility. Please try again.',
      };
    }
  }

  // Save custom template to local storage
  private async saveCustomTemplate(template: BuzzTemplate): Promise<void> {
    try {
      const templatesData = await AsyncStorage.getItem(this.TEMPLATES_KEY);
      const templates = templatesData ? JSON.parse(templatesData) : [];
      
      templates.push(template);
      
      // Keep only last 20 custom templates to prevent storage bloat
      if (templates.length > 20) {
        templates.splice(0, templates.length - 20);
      }
      
      await AsyncStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save custom template:', error);
      throw error;
    }
  }

  // Send buzz using template
  public async sendBuzz(templateId: string, note?: string, receiverId: string = 'partner_user'): Promise<BuzzResult> {
    try {
      // Check cooldown
      const cooldownCheck = await this.checkCooldown();
      if (!cooldownCheck.canSend) {
        return {
          success: false,
          error: `Please wait ${Math.ceil(cooldownCheck.remainingTime / 1000)}s before sending another buzz`,
        };
      }

      // Find template
      const templates = await this.getBuzzTemplates(true); // Get all templates
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        return {
          success: false,
          error: 'Buzz template not found',
        };
      }

      // Create buzz event
      const buzzEvent: BuzzEvent = {
        id: `buzz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        buzzId: templateId,
        senderId: 'current_user', // Replace with actual user ID
        receiverId,
        text: template.text,
        timestamp: Date.now(),
        note,
      };

      // Save event to storage
      await this.saveBuzzEvent(buzzEvent);

      // Add to timeline
      await TimelineService.addEvent({
        id: buzzEvent.id,
        type: 'buzz',
        timestamp: buzzEvent.timestamp,
        data: {
          buzzId: templateId,
          text: template.text,
          emoji: template.emoji,
          note,
        },
        userId: buzzEvent.senderId,
      });

      // Set cooldown
      await this.setCooldown();

      // TODO: Send via WebSocket/API
      // await this.apiSendBuzz(buzzEvent);
      // this.socketSendBuzz(buzzEvent);

      console.log(`Buzz sent: ${template.text}`);

      return {
        success: true,
        buzzEvent,
      };
    } catch (error) {
      console.error('Failed to send buzz:', error);
      return {
        success: false,
        error: 'Failed to send buzz. Please try again.',
      };
    }
  }

  // Check cooldown for any buzz
  private async checkCooldown(): Promise<{ canSend: boolean; remainingTime: number }> {
    try {
      const cooldownData = await AsyncStorage.getItem(this.COOLDOWN_KEY);
      if (!cooldownData) {
        return { canSend: true, remainingTime: 0 };
      }

      const lastSent = parseInt(cooldownData);
      
      if (!lastSent || isNaN(lastSent)) {
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

  // Set cooldown for buzz sending
  private async setCooldown(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.COOLDOWN_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to set cooldown:', error);
    }
  }

  // Save buzz event to storage
  private async saveBuzzEvent(event: BuzzEvent): Promise<void> {
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

  // Get buzz history
  public async getBuzzHistory(limit?: number): Promise<BuzzEvent[]> {
    try {
      const eventsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!eventsData) return [];
      
      const events = JSON.parse(eventsData);
      const sortedEvents = events.sort((a: BuzzEvent, b: BuzzEvent) => b.timestamp - a.timestamp);
      
      return limit ? sortedEvents.slice(0, limit) : sortedEvents;
    } catch (error) {
      console.error('Failed to get buzz history:', error);
      return [];
    }
  }

  // Get current cooldown status
  public async getCooldownStatus(): Promise<{ canSend: boolean; remainingTime: number }> {
    return await this.checkCooldown();
  }

  // TODO: API methods for server communication
  // private async apiSendBuzz(buzzEvent: BuzzEvent): Promise<void> { ... }
  // private async apiCreateCustomBuzz(template: BuzzTemplate): Promise<void> { ... }
  // private async apiGetBuzzTemplates(): Promise<BuzzTemplate[]> { ... }
}

export default new BuzzService();