import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL and Anon Key must be provided in environment variables.\n' +
    'Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

/**
 * Supabase Client Configuration
 *
 * This client is configured for optimal performance in React Native with:
 * - AsyncStorage for session persistence
 * - Auto-refresh for seamless auth experience
 * - Realtime subscriptions for live updates
 * - Offline-first capabilities via AsyncStorage
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Database Types
 *
 * TypeScript definitions for database tables.
 * These provide type safety and autocomplete for Supabase queries.
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          premium_tier: 'free' | 'monthly' | 'yearly' | 'lifetime';
          premium_expires_at: string | null;
          apple_subscription_id: string | null;
          google_subscription_id: string | null;
          last_seen_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          premium_tier?: 'free' | 'monthly' | 'yearly' | 'lifetime';
          premium_expires_at?: string | null;
          apple_subscription_id?: string | null;
          google_subscription_id?: string | null;
          last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          premium_tier?: 'free' | 'monthly' | 'yearly' | 'lifetime';
          premium_expires_at?: string | null;
          apple_subscription_id?: string | null;
          google_subscription_id?: string | null;
          last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      connections: {
        Row: {
          id: string;
          room_code: string;
          user1_id: string;
          user2_id: string | null;
          user1_name: string;
          user2_name: string;
          status: 'pending' | 'active' | 'ended';
          connection_date: string | null;
          ended_at: string | null;
          total_duration_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_code: string;
          user1_id: string;
          user2_id?: string | null;
          user1_name?: string;
          user2_name?: string;
          status?: 'pending' | 'active' | 'ended';
          connection_date?: string | null;
          ended_at?: string | null;
          total_duration_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_code?: string;
          user1_id?: string;
          user2_id?: string | null;
          user1_name?: string;
          user2_name?: string;
          status?: 'pending' | 'active' | 'ended';
          connection_date?: string | null;
          ended_at?: string | null;
          total_duration_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      shared_photos: {
        Row: {
          id: string;
          connection_id: string;
          uploaded_by: string;
          storage_path: string;
          thumbnail_url: string | null;
          full_url: string | null;
          caption: string | null;
          width: number | null;
          height: number | null;
          file_size_bytes: number;
          mime_type: string;
          is_favorite: boolean;
          favorited_by: string[];
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          connection_id: string;
          uploaded_by: string;
          storage_path: string;
          thumbnail_url?: string | null;
          full_url?: string | null;
          caption?: string | null;
          width?: number | null;
          height?: number | null;
          file_size_bytes?: number;
          mime_type?: string;
          is_favorite?: boolean;
          favorited_by?: string[];
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          connection_id?: string;
          uploaded_by?: string;
          storage_path?: string;
          thumbnail_url?: string | null;
          full_url?: string | null;
          caption?: string | null;
          width?: number | null;
          height?: number | null;
          file_size_bytes?: number;
          mime_type?: string;
          is_favorite?: boolean;
          favorited_by?: string[];
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          connection_id: string;
          created_by: string;
          title: string;
          description: string | null;
          event_date: string;
          event_time: string | null;
          event_type: 'anniversary' | 'date' | 'reminder' | 'birthday' | 'other';
          is_recurring: boolean;
          reminder_enabled: boolean;
          reminder_days_before: number;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          connection_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          event_date: string;
          event_time?: string | null;
          event_type?: 'anniversary' | 'date' | 'reminder' | 'birthday' | 'other';
          is_recurring?: boolean;
          reminder_enabled?: boolean;
          reminder_days_before?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          connection_id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          event_time?: string | null;
          event_type?: 'anniversary' | 'date' | 'reminder' | 'birthday' | 'other';
          is_recurring?: boolean;
          reminder_enabled?: boolean;
          reminder_days_before?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      timeline_events: {
        Row: {
          id: string;
          connection_id: string;
          created_by: string;
          event_type: 'buzz' | 'ping' | 'photo' | 'note' | 'milestone' | 'call';
          title: string;
          description: string | null;
          event_date: string;
          related_photo_id: string | null;
          related_data: any;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          connection_id: string;
          created_by: string;
          event_type: 'buzz' | 'ping' | 'photo' | 'note' | 'milestone' | 'call';
          title: string;
          description?: string | null;
          event_date?: string;
          related_photo_id?: string | null;
          related_data?: any;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          connection_id?: string;
          created_by?: string;
          event_type?: 'buzz' | 'ping' | 'photo' | 'note' | 'milestone' | 'call';
          title?: string;
          description?: string | null;
          event_date?: string;
          related_photo_id?: string | null;
          related_data?: any;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      buzz_templates: {
        Row: {
          id: string;
          connection_id: string;
          created_by: string;
          title: string;
          icon: string;
          color: string;
          message: string | null;
          is_default: boolean;
          is_enabled: boolean;
          usage_count: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          connection_id: string;
          created_by: string;
          title: string;
          icon?: string;
          color?: string;
          message?: string | null;
          is_default?: boolean;
          is_enabled?: boolean;
          usage_count?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          connection_id?: string;
          created_by?: string;
          title?: string;
          icon?: string;
          color?: string;
          message?: string | null;
          is_default?: boolean;
          is_enabled?: boolean;
          usage_count?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      buzz_events: {
        Row: {
          id: string;
          connection_id: string;
          template_id: string | null;
          sent_by: string;
          received_by: string;
          message: string | null;
          is_read: boolean;
          read_at: string | null;
          responded_at: string | null;
          response_type: 'buzz_back' | 'call' | 'message' | 'none' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          connection_id: string;
          template_id?: string | null;
          sent_by: string;
          received_by: string;
          message?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          responded_at?: string | null;
          response_type?: 'buzz_back' | 'call' | 'message' | 'none' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          connection_id?: string;
          template_id?: string | null;
          sent_by?: string;
          received_by?: string;
          message?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          responded_at?: string | null;
          response_type?: 'buzz_back' | 'call' | 'message' | 'none' | null;
          created_at?: string;
        };
      };
      daily_pings: {
        Row: {
          id: string;
          connection_id: string;
          question_id: string;
          question_text: string;
          user1_answer: string | null;
          user1_answered_at: string | null;
          user2_answer: string | null;
          user2_answered_at: string | null;
          ping_date: string;
          is_revealed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          connection_id: string;
          question_id: string;
          question_text: string;
          user1_answer?: string | null;
          user1_answered_at?: string | null;
          user2_answer?: string | null;
          user2_answered_at?: string | null;
          ping_date: string;
          is_revealed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          connection_id?: string;
          question_id?: string;
          question_text?: string;
          user1_answer?: string | null;
          user1_answered_at?: string | null;
          user2_answer?: string | null;
          user2_answered_at?: string | null;
          ping_date?: string;
          is_revealed?: boolean;
          created_at?: string;
        };
      };
    };
    Functions: {
      is_premium: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      verify_premium_access: {
        Args: { user_uuid: string; feature_name: string };
        Returns: boolean;
      };
      user_has_active_connection: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      get_user_connection_id: {
        Args: { user_uuid: string };
        Returns: string | null;
      };
    };
  };
};
