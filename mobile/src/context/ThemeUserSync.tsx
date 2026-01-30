import { useEffect, useContext, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { useTheme } from './ThemeContext';
import { Appearance } from 'react-native';

/**
 * Syncs theme preferences with user authentication state
 * This component bridges AuthContext and ThemeContext
 */
export const ThemeUserSync = () => {
  const { user } = useContext(AuthContext);
  const { setUserId, setTheme } = useTheme();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Check if user just signed out (had a user, now doesn't)
    if (previousUserId.current && !user?.id) {
      // User signed out - reset theme to light mode
      setTheme('light');
    }
    
    // Update theme context with current user ID
    setUserId(user?.id || null);
    
    // Track previous user ID for next comparison
    previousUserId.current = user?.id;
  }, [user?.id, setUserId, setTheme]);

  return null; // This is a logic-only component
};
