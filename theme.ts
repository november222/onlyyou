export type Theme = {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  card: string;
  border: string;
  onBackground?: string;
  onCard?: string;
  onPrimary?: string;
  onSecondary?: string;
  mutedText?: string;
  success?: string;
  danger?: string;
};

export const lightTheme: Theme = {
  background: '#ffffff',
  text: '#111111',
  primary: '#ff6b9d',
  secondary: '#f59e0b',
  card: '#f8f8f8',
  border: '#e6e6e6',
  onBackground: '#111111',
  onCard: '#111111',
  onPrimary: '#ffffff',
  onSecondary: '#ffffff',
  mutedText: '#666666',
  success: '#4ade80',
  danger: '#ef4444',
};

export const darkTheme: Theme = {
  background: '#0f0f12',
  text: '#f5f5f6',
  primary: '#ff6b9d',
  secondary: '#f59e0b',
  card: '#16161a',
  border: '#26262b',
  onBackground: '#f5f5f6',
  onCard: '#f5f5f6',
  onPrimary: '#ffffff',
  onSecondary: '#111111',
  mutedText: '#888888',
  success: '#4ade80',
  danger: '#ef4444',
};
