import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all JSON files statically for Metro bundler
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enSettings from './locales/en/settings.json';
import enHistory from './locales/en/history.json';
import enOnboarding from './locales/en/onboarding.json';

import viCommon from './locales/vi/common.json';
import viAuth from './locales/vi/auth.json';
import viSettings from './locales/vi/settings.json';
import viHistory from './locales/vi/history.json';
import viOnboarding from './locales/vi/onboarding.json';

import koCommon from './locales/ko/common.json';
import koAuth from './locales/ko/auth.json';
import koSettings from './locales/ko/settings.json';
import koHistory from './locales/ko/history.json';
import koOnboarding from './locales/ko/onboarding.json';

import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esSettings from './locales/es/settings.json';
import esHistory from './locales/es/history.json';
import esOnboarding from './locales/es/onboarding.json';

// Supported languages configuration
export const supportedLanguages = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

// Extract language codes for i18next
const supportedLngs = supportedLanguages.map(lang => lang.code);

// Static resource mapping for Metro bundler
const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    settings: enSettings,
    history: enHistory,
    onboarding: enOnboarding,
  },
  vi: {
    common: viCommon,
    auth: viAuth,
    settings: viSettings,
    history: viHistory,
    onboarding: viOnboarding,
  },
  ko: {
    common: koCommon,
    auth: koAuth,
    settings: koSettings,
    history: koHistory,
    onboarding: koOnboarding,
  },
  es: {
    common: esCommon,
    auth: esAuth,
    settings: esSettings,
    history: esHistory,
    onboarding: esOnboarding,
  },
};

// Initialize i18next
const initI18n = async () => {
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      supportedLngs,
      ns: ['common', 'auth', 'settings', 'history', 'onboarding'],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
};

// Initialize language from storage or device locale
export const initLanguage = async () => {
  try {
    // Try to get saved language
    const savedLanguage = await AsyncStorage.getItem('lang');
    
    if (savedLanguage && supportedLngs.includes(savedLanguage)) {
      await i18n.changeLanguage(savedLanguage);
      return savedLanguage;
    }
    
    // Fallback to device locale
    const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
    const languageToUse = supportedLngs.includes(deviceLanguage) ? deviceLanguage : 'en';
    
    await i18n.changeLanguage(languageToUse);
    await AsyncStorage.setItem('lang', languageToUse);
    
    return languageToUse;
  } catch (error) {
    console.error('Failed to initialize language:', error);
    await i18n.changeLanguage('en');
    return 'en';
  }
};

// Initialize i18n
initI18n();

export default i18n;