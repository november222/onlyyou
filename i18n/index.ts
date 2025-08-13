import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supported languages configuration
export const supportedLanguages = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

// Extract language codes for i18next
const supportedLngs = supportedLanguages.map(lang => lang.code);

// Initialize i18next with dynamic resource loading
const initI18n = async () => {
  await i18n
    .use(resourcesToBackend((language: string, namespace: string) => {
      // Dynamic import of JSON files
      return import(`./locales/${language}/${namespace}.json`);
    }))
    .use(initReactI18next)
    .init({
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