import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PurchaseService } from '@/services/PurchaseService';

interface PremiumContextType {
  isPremium: boolean;
  setIsPremium: (premium: boolean) => void;
  isLoading: boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

interface PremiumProviderProps {
  children: ReactNode;
}

export function PremiumProvider({ children }: PremiumProviderProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializePremium = async () => {
      try {
        // Initialize purchase service
        await PurchaseService.init();
        
        // Get initial premium status
        const initialPremium = await PurchaseService.isPremium();
        setIsPremium(initialPremium);
        
        // Listen for premium status changes
        unsubscribe = PurchaseService.listen((premium) => {
          setIsPremium(premium);
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize premium status:', error);
        setIsLoading(false);
      }
    };

    initializePremium();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, setIsPremium, isLoading }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextType {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}