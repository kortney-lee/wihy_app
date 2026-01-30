import { useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { useTheme } from './ThemeContext';

/**
 * Syncs theme preferences with user authentication state
 * This component bridges AuthContext and ThemeContext
 */
export const ThemeUserSync = () => {
  const { user } = useContext(AuthContext);
  const { setUserId } = useTheme();

  useEffect(() => {
    // Update theme context with current user ID
    setUserId(user?.id || null);
  }, [user?.id, setUserId]);

  return null; // This is a logic-only component
};
