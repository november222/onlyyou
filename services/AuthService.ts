import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'apple';
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
    isLoading: false,
  };

  // Event callbacks
  public onAuthStateChange: ((state: AuthState) => void) | null = null;

  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    await this.loadStoredAuth();
  }

  private async loadStoredAuth(): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true });
      
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        this.updateAuthState({
          isAuthenticated: true,
          user,
          isLoading: false,
        });
      } else {
        this.updateAuthState({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      this.updateAuthState({ isLoading: false });
    }
  }

  private updateAuthState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates };
    this.onAuthStateChange?.(this.authState);
  }

  public async signInWithGoogle(): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true });
      
      // Mock Google Sign In
      console.log('Mock: Signing in with Google...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockUser: User = {
        id: 'google_123456789',
        email: 'user@gmail.com',
        name: 'John Doe',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
        provider: 'google',
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      
      this.updateAuthState({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
      });
      
      console.log('Mock: Google sign in successful');
    } catch (error) {
      console.error('Google sign in failed:', error);
      this.updateAuthState({ isLoading: false });
      throw new Error('Đăng nhập Google thất bại. Vui lòng thử lại.');
    }
  }

  public async signInWithApple(): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true });
      
      // Mock Apple Sign In
      console.log('Mock: Signing in with Apple...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockUser: User = {
        id: 'apple_987654321',
        email: 'user@privaterelay.appleid.com',
        name: 'Apple User',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
        provider: 'apple',
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      
      this.updateAuthState({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
      });
      
      console.log('Mock: Apple sign in successful');
    } catch (error) {
      console.error('Apple sign in failed:', error);
      this.updateAuthState({ isLoading: false });
      throw new Error('Đăng nhập Apple thất bại. Vui lòng thử lại.');
    }
  }

  public async signOut(): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true });
      
      console.log('Mock: Signing out...');
      
      // Clear stored user data
      await AsyncStorage.removeItem('user');
      
      this.updateAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
      
      console.log('Mock: Sign out successful');
    } catch (error) {
      console.error('Sign out failed:', error);
      this.updateAuthState({ isLoading: false });
      throw new Error('Đăng xuất thất bại. Vui lòng thử lại.');
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
}

export default new AuthService();