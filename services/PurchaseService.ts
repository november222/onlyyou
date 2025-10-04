import { supabase } from '@/lib/supabase';
import AuthService from './AuthService';
import { Platform } from 'react-native';

export type Plan = 'monthly' | 'yearly' | 'lifetime';

export interface PurchaseResult {
  success: boolean;
  error?: string;
}

export interface IPurchase {
  init(): Promise<void>;
  isPremium(): Promise<boolean>;
  purchase(plan: Plan): Promise<PurchaseResult>;
  restore(): Promise<PurchaseResult>;
  listen(cb: (premium: boolean) => void): () => void;
}

class SecurePurchaseService implements IPurchase {
  private subscribers: ((premium: boolean) => void)[] = [];
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    AuthService.onAuthStateChange = async (state) => {
      if (state.isAuthenticated && state.user) {
        const premium = await this.isPremium();
        this.emit(premium);
      } else {
        this.emit(false);
      }
    };
  }

  async isPremium(): Promise<boolean> {
    try {
      return await AuthService.isPremium();
    } catch (error) {
      console.error('Failed to check premium status:', error);
      return false;
    }
  }

  async purchase(plan: Plan): Promise<PurchaseResult> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'Vui lòng đăng nhập để mua Premium.',
        };
      }

      console.log(`Initiating ${plan} purchase...`);

      const productId = `com.onlyyou.premium.${plan}`;
      const mockReceipt = `mock_receipt_${Date.now()}`;

      console.log('Verifying purchase with server...');

      const { data, error } = await supabase.functions.invoke('verify-purchase', {
        body: {
          receipt: mockReceipt,
          platform: Platform.OS as 'apple' | 'google',
          productId,
        },
      });

      if (error) {
        console.error('Purchase verification error:', error);
        return {
          success: false,
          error: 'Xác minh thanh toán thất bại. Vui lòng thử lại.',
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Thanh toán thất bại.',
        };
      }

      console.log('Purchase verified successfully');

      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (refreshedUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('premium_tier, premium_expires_at')
          .eq('id', refreshedUser.id)
          .maybeSingle();

        if (profile) {
          const isPremium =
            profile.premium_tier !== 'free' &&
            (!profile.premium_expires_at || new Date(profile.premium_expires_at) > new Date());

          this.emit(isPremium);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Purchase failed:', error);
      return {
        success: false,
        error: error.message || 'Thanh toán thất bại. Vui lòng thử lại.',
      };
    }
  }

  async restore(): Promise<PurchaseResult> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'Vui lòng đăng nhập để khôi phục gói Premium.',
        };
      }

      console.log('Restoring purchases...');

      const { data: profile, error } = await supabase
        .from('users')
        .select('premium_tier, premium_expires_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Restore error:', error);
        return {
          success: false,
          error: 'Khôi phục thất bại. Vui lòng thử lại.',
        };
      }

      if (!profile || profile.premium_tier === 'free') {
        return {
          success: false,
          error: 'Không tìm thấy gói Premium nào để khôi phục.',
        };
      }

      if (profile.premium_expires_at && new Date(profile.premium_expires_at) <= new Date()) {
        return {
          success: false,
          error: 'Gói Premium của bạn đã hết hạn.',
        };
      }

      this.emit(true);
      console.log('Premium subscription restored');

      return { success: true };
    } catch (error: any) {
      console.error('Restore failed:', error);
      return {
        success: false,
        error: error.message || 'Khôi phục thất bại. Vui lòng thử lại.',
      };
    }
  }

  listen(callback: (premium: boolean) => void): () => void {
    this.subscribers.push(callback);

    this.isPremium().then(callback);

    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private emit(premium: boolean): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(premium);
      } catch (error) {
        console.error('Error in premium state callback:', error);
      }
    });
  }
}

export const PurchaseService: IPurchase = new SecurePurchaseService();
