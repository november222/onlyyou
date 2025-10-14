import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform, Alert } from 'react-native';
import TimelineService from './TimelineService';
import { rateLimiter, RATE_LIMITS } from './RateLimiter';

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
  private readonly API_BASE = 'https://api.onlyyou.app'; // Replace with actual API

  // Event callback for buzz templates changes
  public onBuzzTemplatesChanged: (() => void) | null = null;

  // Default buzz templates for free users
  private readonly DEFAULT_TEMPLATES: BuzzTemplate[] = [
    { id: 'default_1', text: 'I\'m hungry :(', type: 'default', emoji: 'ðŸ½ï¸', showInQuickBuzz: true },
    { id: 'default_2', text: 'Miss you a lot :(', type: 'default', emoji: 'ðŸ¥º', showInQuickBuzz: true },
    { id: 'default_3', text: 'Babe, are you awake?', type: 'default', emoji: 'ðŸ˜´', showInQuickBuzz: true },
    { id: 'default_4', text: 'Thinking of you', type: 'default', emoji: 'ðŸ’­', showInQuickBuzz: true },
    { id: 'default_5', text: 'Love you so much! ðŸ’•', type: 'default', emoji: 'ðŸ’•', showInQuickBuzz: true },
  ];

  // Get all buzz templates (default + custom)
  public async getBuzzTemplates(isPremium: boolean = false): Promise<BuzzTemplate[]> {
    try {
      // Load default templates with saved visibility state
      const defaultTemplates = await this.getDefaultTemplatesWithState();

      if (isPremium) {
        // Load custom templates from storage for premium users
        const customTemplates = await this.getCustomTemplates();
        return [...customTemplates, ...defaultTemplates];
      }

      return defaultTemplates;
    } catch (error) {
      console.error('Failed to get buzz templates:', error);
      return this.DEFAULT_TEMPLATES.map(t => ({ ...t, emoji: this.resolveEmoji(t.id, t.emoji) }));
    }
  }

  // Get default templates with saved visibility state
  private async getDefaultTemplatesWithState(): Promise<BuzzTemplate[]> {
    try {
      const savedState = await AsyncStorage.getItem('onlyyou_default_buzz_state');
      if (!savedState) {
        return this.DEFAULT_TEMPLATES.map(t => ({ ...t, emoji: this.resolveEmoji(t.id, t.emoji) }));
      }

      const stateMap: Record<string, boolean> = JSON.parse(savedState);
      return this.DEFAULT_TEMPLATES.map(template => ({
        ...template,
        emoji: this.resolveEmoji(template.id, template.emoji),
        showInQuickBuzz: stateMap[template.id] !== undefined
          ? stateMap[template.id]
          : template.showInQuickBuzz,
      }));
    } catch (error) {
      console.error('Failed to load default templates state:', error);
      return this.DEFAULT_TEMPLATES.map(t => ({ ...t, emoji: this.resolveEmoji(t.id, t.emoji) }));
    }
  }

  // Normalize broken emoji encodings for default templates
  private resolveEmoji(id: string, emoji?: string): string {
    switch (id) {
      case "default_1":
        return "🍔";
      case "default_2":
        return "🥺";
      case "default_3":
        return "🌙";
      case "default_4":
        return "💭";
      case "default_5":
        return "❤️";
      default:
        return emoji || "✨";
    }
  }


  // Get templates for quick buzz display (only enabled ones)
  public async getQuickBuzzTemplates(isPremium: boolean = false): Promise<BuzzTemplate[]> {
    try {
      const allTemplates = await this.getBuzzTemplates(isPremium);
      const enabled = allTemplates.filter(template => template.showInQuickBuzz);

      // Sort so that newer custom templates appear first (leftmost/top)
      const parseCustomTimestamp = (id: string): number => {
        const m = /^custom_(\d+)_/.exec(id);
        return m ? parseInt(m[1], 10) : 0;
      };

      const customs = enabled
        .filter(t => t.type === 'custom')
        .sort((a, b) => parseCustomTimestamp(b.id) - parseCustomTimestamp(a.id));

      const defaults = enabled.filter(t => t.type !== 'custom');

      return [...customs, ...defaults];
    } catch (error) {
      console.error('Failed to get quick buzz templates:', error);
      return this.DEFAULT_TEMPLATES
        .map(t => ({ ...t, emoji: this.resolveEmoji(t.id, t.emoji) }))
        .filter(template => template.showInQuickBuzz);
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
        emoji: emoji || 'ðŸ’«',
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
        const savedState = await AsyncStorage.getItem('onlyyou_default_buzz_state');
        const stateMap: Record<string, boolean> = savedState ? JSON.parse(savedState) : {};

        // Find current state
        const defaultTemplate = this.DEFAULT_TEMPLATES.find(t => t.id === templateId);
        const currentState = stateMap[templateId] !== undefined
          ? stateMap[templateId]
          : defaultTemplate?.showInQuickBuzz ?? true;

        // Toggle state
        stateMap[templateId] = !currentState;

        // Save updated state
        await AsyncStorage.setItem('onlyyou_default_buzz_state', JSON.stringify(stateMap));
        console.log('Toggled quick buzz for default template:', templateId, 'to', !currentState);

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
      const rateLimitCheck = rateLimiter.canPerformAction('buzz_send', RATE_LIMITS.BUZZ);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: rateLimitCheck.reason || 'Vui lÃ²ng Ä‘á»£i trÆ°á»›c khi gá»­i buzz tiáº¿p theo',
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

      const recordResult = rateLimiter.recordAction('buzz_send', RATE_LIMITS.BUZZ);

      // TODO: Send via WebSocket/API
      // await this.apiSendBuzz(buzzEvent);
      // this.socketSendBuzz(buzzEvent);

      console.log(`Buzz sent: ${template.text}`);

      if (recordResult.isSpamWarning) {
        console.warn('âš ï¸ Spam detected: 10 minute penalty applied');
      }

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

  // Get current cooldown status (deprecated - use RateLimiter directly)
  public async getCooldownStatus(): Promise<{ canSend: boolean; remainingTime: number }> {
    const rateLimitCheck = rateLimiter.canPerformAction('buzz_send', RATE_LIMITS.BUZZ);
    return {
      canSend: rateLimitCheck.allowed,
      remainingTime: rateLimitCheck.waitTime ? rateLimitCheck.waitTime * 1000 : 0,
    };
  }

  // Notify listeners that buzz templates have changed
  public notifyBuzzTemplatesChanged(): void {
    if (this.onBuzzTemplatesChanged) {
      this.onBuzzTemplatesChanged();
    }
  }

  // TODO: API methods for server communication
  // private async apiSendBuzz(buzzEvent: BuzzEvent): Promise<void> { ... }
  // private async apiCreateCustomBuzz(template: BuzzTemplate): Promise<void> { ... }
  // private async apiGetBuzzTemplates(): Promise<BuzzTemplate[]> { ... }
}

export default new BuzzService();




