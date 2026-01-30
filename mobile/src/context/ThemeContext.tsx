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
  setUserId: (userId: string | null) => void;
  clearUserTheme: () => Promise<void>;
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

const THEME_STORAGE_KEY_PREFIX = '@wihy_theme_mode';
const GLOBAL_THEME_KEY = '@wihy_theme_mode_global';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [userId, setUserIdState] = useState<string | null>(null);

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

  // Reload theme when user changes
  useEffect(() => {
    loadTheme();
  }, [userId]);

  const loadTheme = async () => {
    try {
      if (!userId) {
        // Not logged in - always use light mode
        setThemeMode('light');
        return;
      }
      
      const storageKey = `${THEME_STORAGE_KEY_PREFIX}_${userId}`;
      const savedTheme = await AsyncStorage.getItem(storageKey);
      if (savedTheme) {
        setThemeMode(savedTheme as ThemeMode);
      } else {
        // Logged in user with no saved preference - use system preference
        const systemTheme = Appearance.getColorScheme() || 'light';
        setThemeMode(systemTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const saveTheme = async (mode: ThemeMode) => {
    try {
      const storageKey = userId ? `${THEME_STORAGE_KEY_PREFIX}_${userId}` : GLOBAL_THEME_KEY;
      await AsyncStorage.setItem(storageKey, mode);
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

  const setUserId = (newUserId: string | null) => {
    setUserIdState(newUserId);
  };

  const clearUserTheme = async () => {
    try {
      if (userId) {
        const storageKey = `${THEME_STORAGE_KEY_PREFIX}_${userId}`;
        await AsyncStorage.removeItem(storageKey);
      }
      // Reset to light mode (default for non-logged-in users)
      setThemeMode('light');
    } catch (error) {
      console.error('Error clearing user theme:', error);
    }
  };

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: themeMode === 'dark',
        toggleTheme,
        setTheme,
        setUserId,
        clearUserTheme,
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
