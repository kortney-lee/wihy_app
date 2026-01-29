import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { hasFamilyAccess, hasCoachAccess } from '../utils/capabilities';
import { WebPageWrapper } from '../components/shared';
import DashboardPage from './DashboardPage';
import CoachDashboardPage from './CoachDashboardPage';
import FamilyDashboardPage from './FamilyDashboardPage';

const isWeb = Platform.OS === 'web';

export type DashboardContext = 'personal' | 'family' | 'coach';

/**
 * Main Health Hub
 * Combines Personal, Family, and Coach dashboards
 * Context switching is now done via tiles within each dashboard
 */
export default function HealthHub() {
  const navigation = useNavigation<BottomTabNavigationProp<any>>();
  const isFocused = useIsFocused();
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [currentContext, setCurrentContext] = useState<DashboardContext>('personal');
  const [showMenu, setShowMenu] = useState(false);

  // Reset context when user plan changes (dev mode switcher)
  useEffect(() => {
    setCurrentContext('personal');
    setShowMenu(false);
  }, [user?.plan]);

  // Listen for Health tab presses when already on Health tab
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e: any) => {
      // Only prevent default and show menu if we're already on this tab
      if (isFocused) {
        e.preventDefault();
        setShowMenu(true);
      }
      // If not focused, let normal navigation happen (don't prevent default)
    });

    return unsubscribe;
  }, [navigation, isFocused]);

  // Handler for context switching from within dashboards
  const handleContextChange = (context: DashboardContext) => {
    setCurrentContext(context);
  };

  const renderDashboard = () => {
    // Determine available contexts based on user plan
    const canAccessFamily = hasFamilyAccess(user);
    const canAccessCoach = hasCoachAccess(user);

    switch (currentContext) {
      case 'personal':
        return (
          <DashboardPage 
            showMenuFromHealthTab={showMenu} 
            onMenuClose={() => setShowMenu(false)}
            onContextChange={handleContextChange}
            canAccessFamily={canAccessFamily}
            canAccessCoach={canAccessCoach}
          />
        );
      case 'family':
        return (
          <FamilyDashboardPage 
            showMenuFromHealthTab={showMenu} 
            onMenuClose={() => setShowMenu(false)}
            onContextChange={handleContextChange}
          />
        );
      case 'coach':
        return (
          <CoachDashboardPage 
            showMenuFromHealthTab={showMenu} 
            onMenuClose={() => setShowMenu(false)}
            onContextChange={handleContextChange}
          />
        );
      default:
        return (
          <DashboardPage 
            showMenuFromHealthTab={showMenu} 
            onMenuClose={() => setShowMenu(false)}
            onContextChange={handleContextChange}
            canAccessFamily={canAccessFamily}
            canAccessCoach={canAccessCoach}
          />
        );
    }
  };

  return (
    <WebPageWrapper activeTab="health">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderDashboard()}
      </View>
    </WebPageWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#ffffff', // Now using theme.colors.surface dynamically
  },
});
