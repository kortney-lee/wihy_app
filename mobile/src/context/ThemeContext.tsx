import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark';

interface Theme {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    card: string;
  };
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#e0f2fe', // Light blue
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    primary: '#3b82f6',
    card: '#ffffff',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#000000', // Black
    surface: '#000000', // Black - user wants entire screen black
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    border: '#374151',
    primary: '#60a5fa',
    card: '#111827',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@wihy_theme_mode';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  useEffect(() => {
    // Load saved theme preference
    loadTheme();
    
    // Listen to system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) {
        setThemeMode(colorScheme as ThemeMode);
      }
    });

    return () => subscription.remove();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemeMode(savedTheme as ThemeMode);
      } else {
        // Use system preference
        const systemTheme = Appearance.getColorScheme() || 'light';
        setThemeMode(systemTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const saveTheme = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    saveTheme(newMode);
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveTheme(mode);
  };

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: themeMode === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
