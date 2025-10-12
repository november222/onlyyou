import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName, Text as RNText, TextInput as RNTextInput } from 'react-native';
import { darkTheme, lightTheme, Theme } from '@/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  theme: Theme;
  // Backwards-compat fields for existing screens
  colors: Theme;
}

const THEME_KEY = '@onlyyou_theme_mode';

// lightTheme and darkTheme come from theme.ts

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => sub.remove();
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_KEY, newMode).catch(() => {});
  };

  const isDark = useMemo(() => {
    return mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  }, [mode, systemScheme]);

  const theme = isDark ? darkTheme : lightTheme;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, isDark, theme, colors: theme }),
    [mode, isDark, theme]
  );

  // Set sensible defaults for text components
  useEffect(() => {
    const textStyle = { color: theme.text } as any;
    (RNText as any).defaultProps = (RNText as any).defaultProps || {};
    (RNText as any).defaultProps.style = Array.isArray((RNText as any).defaultProps.style)
      ? [...(RNText as any).defaultProps.style, textStyle]
      : { ...((RNText as any).defaultProps.style || {}), ...textStyle };

    (RNTextInput as any).defaultProps = (RNTextInput as any).defaultProps || {};
    (RNTextInput as any).defaultProps.placeholderTextColor = isDark ? '#999' : '#666';
    (RNTextInput as any).defaultProps.style = Array.isArray((RNTextInput as any).defaultProps.style)
      ? [...(RNTextInput as any).defaultProps.style, textStyle]
      : { ...((RNTextInput as any).defaultProps.style || {}), ...textStyle };
  }, [theme.text, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// New unified hook
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return { theme: ctx.theme, mode: ctx.mode, setMode: ctx.setMode, isDark: ctx.isDark };
}

// Backwards-compat: existing usage
export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return { mode: ctx.mode, setMode: ctx.setMode, isDark: ctx.isDark };
}

export function useThemeColors() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeColors must be used within ThemeProvider');
  return ctx.colors;
}
