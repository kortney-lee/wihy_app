import React, { useContext, useState } from 'react';
import { Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MultiAuthLogin from '../auth/MultiAuthLogin';

const isWeb = Platform.OS === 'web';

// Load web CSS
if (isWeb) {
  require('../../styles/web-landing.css');
}

type ActiveTab = 'home' | 'health' | 'chat' | 'profile' | 'none';

interface WebTopNavProps {
  activeTab?: ActiveTab;
}

/**
 * Web-only top navigation bar component
 * Renders the consistent header navigation for web platform
 */
export function WebTopNav({ activeTab = 'none' }: WebTopNavProps) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, loading, initializing } = useContext(AuthContext);
  const { isDark } = useTheme();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Only render on web
  if (!isWeb) {
    return null;
  }

  // Determine if we're in a tab screen or stack screen
  // Tab screens: Home, Scan, Chat, Health, Profile
  // Stack screens: CoachSelection, ClientManagement, About, Subscription, Terms, Privacy, B2BPricing
  const isInTabNavigator = ['Home', 'Scan', 'Chat', 'Health', 'Profile'].includes(route.name);
  
  console.log('[WebTopNav] Current route:', route.name, 'isInTabNavigator:', isInTabNavigator);

  // Navigate to a tab screen (inside Main TabNavigator)
  const navigateToTab = (tabName: string) => {
    console.log('[WebTopNav] navigateToTab called with:', tabName, 'isInTabNavigator:', isInTabNavigator);
    try {
      if (isInTabNavigator) {
        // Already in TabNavigator, navigate directly
        navigation.navigate(tabName);
      } else {
        // In stack screen, navigate to Main then to tab
        navigation.navigate('Main', { screen: tabName });
      }
      console.log('[WebTopNav] navigation.navigate succeeded');
    } catch (error) {
      console.error('[WebTopNav] navigation.navigate failed:', error);
    }
  };

  // Navigate to a Stack screen (outside TabNavigator)
  const navigateToStack = (screenName: string) => {
    console.log('[WebTopNav] navigateToStack called with:', screenName, 'isInTabNavigator:', isInTabNavigator);
    try {
      if (isInTabNavigator) {
        // In TabNavigator, use parent navigation to go to stack screens
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate(screenName);
        } else {
          // Fallback if no parent
          navigation.navigate(screenName as any);
        }
      } else {
        // Already in stack, navigate directly
        navigation.navigate(screenName as any);
      }
      console.log('[WebTopNav] navigateToStack succeeded');
    } catch (error) {
      console.error('[WebTopNav] navigateToStack failed:', error);
    }
  };
  
  // Handle health button click - show subscription for non-logged-in users
  const handleHealthPress = () => {
    console.log('[WebTopNav] handleHealthPress called, user:', user?.email, 'loading:', loading, 'initializing:', initializing);
    
    // Don't redirect to subscription if auth is still loading
    if (loading || initializing) {
      console.log('[WebTopNav] Auth still loading, navigating to Health anyway');
      navigateToTab('Health');
      return;
    }
    
    if (!user) {
      // Not logged in - redirect to subscription/plans
      navigateToStack('Subscription');
    } else {
      // Logged in (free or premium) - allow access to Health
      navigateToTab('Health');
    }
  };

  // Handle profile button click
  const handleProfilePress = () => {
    console.log('[WebTopNav] handleProfilePress called, user:', user?.email);
    if (user) {
      navigateToTab('Profile');
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <>
    <nav className="web-top-nav" data-theme={isDark ? 'dark' : 'light'}>
      <div className="web-nav-left">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[WebTopNav] Home button clicked!');
            navigateToTab('Home');
          }} 
          className={`web-nav-item nav-home ${activeTab === 'home' ? 'active' : ''}`} 
          type="button"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span>Home</span>
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[WebTopNav] Health button clicked!');
            handleHealthPress();
          }} 
          className={`web-nav-item nav-health ${activeTab === 'health' ? 'active' : ''}`} 
          type="button"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>Health</span>
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigateToTab('Scan');
          }} 
          className="web-nav-item nav-scan mobile-only" 
          type="button"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
          </svg>
          <span>Scan</span>
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigateToTab('Chat');
          }} 
          className={`web-nav-item nav-chat ${activeTab === 'chat' ? 'active' : ''}`} 
          type="button"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span>Chat</span>
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigateToStack('About');
          }} 
          className="web-nav-item nav-about" 
          type="button"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span>About</span>
        </button>
      </div>
      <div className="web-nav-right">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleProfilePress();
          }} 
          className={`web-nav-item profile ${activeTab === 'profile' ? 'active' : ''}`} 
          type="button"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </button>
      </div>
    </nav>
    <MultiAuthLogin visible={showLoginModal} onClose={() => setShowLoginModal(false)} onSignIn={() => setShowLoginModal(false)} />
    </>
  );
}

interface WebPageWrapperProps {
  children: React.ReactNode;
  activeTab?: ActiveTab;
  className?: string;
}

/**
 * Web page wrapper that includes the top nav and proper spacing
 */
export function WebPageWrapper({ children, activeTab = 'none', className = '' }: WebPageWrapperProps) {
  const { isDark } = useTheme();
  
  if (!isWeb) {
    return <>{children}</>;
  }

  return (
    <div className={`web-page-wrapper ${className}`} data-theme={isDark ? 'dark' : 'light'}>
      <WebTopNav activeTab={activeTab} />
      <div className="web-page-content">
        {children}
      </div>
    </div>
  );
}

export default WebTopNav;
