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
import enProfile from './locales/en/profile.json';
import enConnection from './locales/en/connection.json';
import enMessages from './locales/en/messages.json';
import enTouch from './locales/en/touch.json';

import viCommon from './locales/vi/common.json';
import viAuth from './locales/vi/auth.json';
import viSettings from './locales/vi/settings.json';
import viHistory from './locales/vi/history.json';
import viOnboarding from './locales/vi/onboarding.json';
import viProfile from './locales/vi/profile.json';
import viConnection from './locales/vi/connection.json';
import viMessages from './locales/vi/messages.json';
import viTouch from './locales/vi/touch.json';

import koCommon from './locales/ko/common.json';
import koAuth from './locales/ko/auth.json';
import koSettings from './locales/ko/settings.json';
import koHistory from './locales/ko/history.json';
import koOnboarding from './locales/ko/onboarding.json';
import koProfile from './locales/ko/profile.json';
import koConnection from './locales/ko/connection.json';
import koMessages from './locales/ko/messages.json';
import koTouch from './locales/ko/touch.json';

import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esSettings from './locales/es/settings.json';
import esHistory from './locales/es/history.json';
import esOnboarding from './locales/es/onboarding.json';
import esProfile from './locales/es/profile.json';
import esConnection from './locales/es/connection.json';
import esMessages from './locales/es/messages.json';
import esTouch from './locales/es/touch.json';

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
    profile: enProfile,
    connection: enConnection,
    messages: enMessages,
    touch: enTouch,
  },
  vi: {
    common: viCommon,
    auth: viAuth,
    settings: viSettings,
    history: viHistory,
    onboarding: viOnboarding,
    profile: viProfile,
    connection: viConnection,
    messages: viMessages,
    touch: viTouch,
  },
  ko: {
    common: koCommon,
    auth: koAuth,
    settings: koSettings,
    history: koHistory,
    onboarding: koOnboarding,
    profile: koProfile,
    connection: koConnection,
    messages: koMessages,
    touch: koTouch,
  },
  es: {
    common: esCommon,
    auth: esAuth,
    settings: esSettings,
    history: esHistory,
    onboarding: esOnboarding,
    profile: esProfile,
    connection: esConnection,
    messages: esMessages,
    touch: esTouch,
  },
};

// Initialize i18next synchronously
i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs,
    lng: 'en',
    ns: ['common', 'auth', 'settings', 'history', 'onboarding', 'profile', 'connection', 'messages', 'touch'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

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


export default i18n;
