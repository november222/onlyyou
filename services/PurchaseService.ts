import AsyncStorage from '@react-native-async-storage/async-storage';

export type Plan = 'monthly' | 'yearly';

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

class MockPurchase implements IPurchase {
  private subscribers: ((premium: boolean) => void)[] = [];
  private readonly STORAGE_KEY = 'onlyyou_premium';

  async init(): Promise<void> {
    // No-op for mock implementation
  }

  async isPremium(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.STORAGE_KEY);
      return value === '1';
    } catch (error) {
      console.error('Failed to check premium status:', error);
      return false;
    }
  }

  async purchase(plan: Plan): Promise<PurchaseResult> {
    try {
      console.log(`Mock: Purchasing ${plan} plan...`);
      
      // Simulate purchase delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save premium status
      await AsyncStorage.setItem(this.STORAGE_KEY, '1');
      
      // Notify all subscribers
      this.emit(true);
      
      console.log(`Mock: Successfully purchased ${plan} plan`);
      return { success: true };
    } catch (error) {
      console.error('Mock purchase failed:', error);
      return { 
        success: false, 
        error: 'Thanh toán thất bại. Vui lòng thử lại.' 
      };
    }
  }

  async restore(): Promise<PurchaseResult> {
    try {
      console.log('Mock: Restoring purchases...');
      
      // Simulate restore delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isPremium = await this.isPremium();
      
      if (isPremium) {
        // Notify subscribers of current state
        this.emit(true);
        console.log('Mock: Premium subscription restored');
        return { success: true };
      } else {
        console.log('Mock: No premium subscription found');
        return { 
          success: false, 
          error: 'Không tìm thấy gói Premium nào để khôi phục.' 
        };
      }
    } catch (error) {
      console.error('Mock restore failed:', error);
      return { 
        success: false, 
        error: 'Khôi phục thất bại. Vui lòng thử lại.' 
      };
    }
  }

  listen(callback: (premium: boolean) => void): () => void {
    // Add subscriber
    this.subscribers.push(callback);
    
    // Call with current state immediately
    this.isPremium().then(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private emit(premium: boolean): void {
    this.subscribers.forEach(callback => {
      try {
        callback(premium);
      } catch (error) {
        console.error('Error in premium state callback:', error);
      }
    });
  }

  // Debug method to reset premium status
  async resetPremium(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      this.emit(false);
      console.log('Mock: Premium status reset');
    } catch (error) {
      console.error('Failed to reset premium status:', error);
    }
  }
}

export const PurchaseService: IPurchase = new MockPurchase();