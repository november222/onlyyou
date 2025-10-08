import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  premiumTier: 'free' | 'monthly' | 'yearly' | 'lifetime';
  premiumExpiresAt?: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: true,
  };

  public onAuthStateChange: ((state: AuthState) => void) | null = null;

  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);

      if (event === 'SIGNED_IN' && session) {
        await this.handleSessionChange(session);
      } else if (event === 'SIGNED_OUT') {
        this.updateAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        await this.handleSessionChange(session);
      }
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await this.handleSessionChange(session);
    } else {
      this.updateAuthState({ isLoading: false });
    }
  }

  private async handleSessionChange(session: Session): Promise<void> {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch user profile:', error);
        this.updateAuthState({ isLoading: false });
        return;
      }

      if (profile) {
        const user: User = {
          id: profile.id,
          email: profile.email,
          name: profile.full_name || profile.email,
          avatar: profile.avatar_url || undefined,
          premiumTier: profile.premium_tier,
          premiumExpiresAt: profile.premium_expires_at,
        };

        this.updateAuthState({
          isAuthenticated: true,
          user,
          isLoading: false,
        });
      } else {
        // Fallback: create a profile row if it does not exist
        try {
          const { data: created, error: insertError } = await supabase
            .from('users')
            .insert({
              id: session.user.id,
              email: (session.user as any).email || '',
              full_name:
                ((session.user as any).user_metadata?.full_name as string) ||
                ((session.user as any).email as string) ||
                'User',
              avatar_url:
                ((session.user as any).user_metadata?.avatar_url as string) || null,
              premium_tier: 'free',
              premium_expires_at: null,
            })
            .select('*')
            .maybeSingle();

          if (insertError || !created) {
            console.error('Failed to create user profile:', insertError);
            this.updateAuthState({ isLoading: false });
            return;
          }

          const user: User = {
            id: created.id,
            email: created.email,
            name: created.full_name || created.email,
            avatar: created.avatar_url || undefined,
            premiumTier: created.premium_tier,
            premiumExpiresAt: created.premium_expires_at,
          };

          this.updateAuthState({
            isAuthenticated: true,
            user,
            isLoading: false,
          });
        } catch (createErr) {
          console.error('Error creating profile row:', createErr);
          this.updateAuthState({ isLoading: false });
        }
      }
    } catch (error) {
      console.error('Error handling session change:', error);
      this.updateAuthState({ isLoading: false });
    }
  }

  private updateAuthState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates };
    this.onAuthStateChange?.(this.authState);
  }

  private extractOAuthTokens(url: string): { accessToken: string; refreshToken: string } | null {
    try {
      const parsedUrl = new URL(url);
      let accessToken = parsedUrl.searchParams.get('access_token');
      let refreshToken = parsedUrl.searchParams.get('refresh_token');

      if ((!accessToken || !refreshToken) && parsedUrl.hash) {
        const hash = parsedUrl.hash.startsWith('#') ? parsedUrl.hash.slice(1) : parsedUrl.hash;
        const hashParams = new URLSearchParams(hash);
        accessToken = accessToken || hashParams.get('access_token');
        refreshToken = refreshToken || hashParams.get('refresh_token');
      }

      if (accessToken && refreshToken) {
        return { accessToken, refreshToken };
      }
    } catch (error) {
      console.error('Failed to parse OAuth callback URL:', error);
    }

    return null;
  }

  public async signInWithEmail(email: string, password: string): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        await this.handleSessionChange(data.session);
      }
    } catch (error: any) {
      console.error('Email sign in failed:', error);
      this.updateAuthState({ isLoading: false });

      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Email hoặc mật khẩu không đúng.');
      } else if (error.message?.includes('Email not confirmed')) {
        throw new Error('Vui lòng xác nhận email trước khi đăng nhập.');
      } else {
        throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    }
  }

  public async signUpWithEmail(email: string, password: string, name: string): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        await this.handleSessionChange(data.session);
      } else {
        this.updateAuthState({ isLoading: false });
      }
    } catch (error: any) {
      console.error('Email sign up failed:', error);
      this.updateAuthState({ isLoading: false });

      if (error.message?.includes('already registered')) {
        throw new Error('Email này đã được đăng ký.');
      } else if (error.message?.includes('Password')) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
      } else {
        throw new Error('Đăng ký thất bại. Vui lòng thử lại.');
      }
    }
  }

  public async signOut(): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true });

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      this.updateAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });

      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out failed:', error);
      this.updateAuthState({ isLoading: false });
      throw new Error('Đăng xuất thất bại. Vui lòng thử lại.');
    }
  }

  public async updateProfile(updates: { name?: string; avatar?: string }): Promise<void> {
    try {
      if (!this.authState.user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('users')
        .update({
          full_name: updates.name,
          avatar_url: updates.avatar,
        })
        .eq('id', this.authState.user.id);

      if (error) {
        throw error;
      }

      this.updateAuthState({
        user: this.authState.user
          ? {
              ...this.authState.user,
              name: updates.name || this.authState.user.name,
              avatar: updates.avatar || this.authState.user.avatar,
            }
          : null,
      });
    } catch (error) {
      console.error('Update profile failed:', error);
      throw new Error('Cập nhật profile thất bại. Vui lòng thử lại.');
    }
  }

  public async signInWithGoogle(): Promise<boolean> {
    let success = false;

    try {
      this.updateAuthState({ isLoading: true });

      let redirectUrl = 'onlyyou://auth/callback';

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.location) {
          redirectUrl = `${window.location.protocol}//${window.location.host}/auth/callback`;
        }
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        throw error;
      }

      if (Platform.OS === 'web') {
        success = true;
        this.updateAuthState({ isLoading: false });
        return true;
      }

      if (!data?.url) {
        throw new Error('Khong nhan duoc URL xac thuc Google.');
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'onlyyou://auth/callback'
      );

      if (result.type !== 'success' || !result.url) {
        if (result.type === 'dismiss' || result.type === 'cancel') {
          throw new Error('Dang nhap Google da bi huy.');
        }

        throw new Error('Dang nhap Google khong hoan tat.');
      }

      const tokens = this.extractOAuthTokens(result.url);

      if (!tokens) {
        throw new Error('Khong the doc thong tin dang nhap Google.');
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      if (sessionError) {
        throw sessionError;
      }

      if (!sessionData.session) {
        throw new Error('Khong tao duoc phien dang nhap Google.');
      }

      await this.handleSessionChange(sessionData.session);
      success = true;
      return true;
    } catch (error: any) {
      console.error('Google sign in failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Dang nhap Google that bai. Vui long thu lai.');
    } finally {
      if (!success) {
        this.updateAuthState({ isLoading: false });
      }
    }
  }

  public async signInWithApple(): Promise<boolean> {
    let success = false;

    try {
      this.updateAuthState({ isLoading: true });

      let redirectUrl = 'onlyyou://auth/callback';

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.location) {
          redirectUrl = `${window.location.protocol}//${window.location.host}/auth/callback`;
        }
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        throw error;
      }

      if (Platform.OS === 'web') {
        success = true;
        this.updateAuthState({ isLoading: false });
        return true;
      }

      if (!data?.url) {
        throw new Error('Khong nhan duoc URL xac thuc Apple.');
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'onlyyou://auth/callback'
      );

      if (result.type !== 'success' || !result.url) {
        if (result.type === 'dismiss' || result.type === 'cancel') {
          throw new Error('Dang nhap Apple da bi huy.');
        }

        throw new Error('Dang nhap Apple khong hoan tat.');
      }

      const tokens = this.extractOAuthTokens(result.url);

      if (!tokens) {
        throw new Error('Khong the doc thong tin dang nhap Apple.');
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      if (sessionError) {
        throw sessionError;
      }

      if (!sessionData.session) {
        throw new Error('Khong tao duoc phien dang nhap Apple.');
      }

      await this.handleSessionChange(sessionData.session);
      success = true;
      return true;
    } catch (error: any) {
      console.error('Apple sign in failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Dang nhap Apple that bai. Vui long thu lai.');
    } finally {
      if (!success) {
        this.updateAuthState({ isLoading: false });
      }
    }
  }

  public async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'onlyyou://reset-password',
      });

      if (error) {
        throw error;
      }

      console.log('Password reset email sent');
    } catch (error) {
      console.error('Password reset failed:', error);
      throw new Error('Gửi email đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    }
  }

  public getAuthState(): AuthState {
    return this.authState;
  }

  public getCurrentUser(): User | null {
    return this.authState.user;
  }

  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  public async isPremium(): Promise<boolean> {
    if (!this.authState.user) return false;

    const tier = this.authState.user.premiumTier;
    if (tier === 'free') return false;

    if (this.authState.user.premiumExpiresAt) {
      return new Date(this.authState.user.premiumExpiresAt) > new Date();
    }

    return true;
  }
}

export default new AuthService();

