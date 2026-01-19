/**
 * WebNavHeader - Shared navigation header for web pages
 * 
 * Used across all web screens to provide consistent navigation.
 * Handles both tab navigation (inside Main TabNavigator) and
 * stack navigation (root-level screens like About, Subscription).
 */

import React, { useContext, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import MultiAuthLogin from '../auth/MultiAuthLogin';

// Import the web landing CSS
import '../../styles/web-landing.css';

export type ActivePage = 'home' | 'health' | 'scan' | 'chat' | 'about' | 'subscription' | 'profile' | 'terms' | 'privacy' | 'pricing' | 'none';

interface WebNavHeaderProps {
  /** The currently active page for highlighting */
  activePage?: ActivePage;
  /** Optional: Show login modal state (controlled externally) */
  showLoginModal?: boolean;
  /** Optional: Set login modal state (controlled externally) */
  setShowLoginModal?: (show: boolean) => void;
  /** Optional: Whether user is on free plan (affects Health nav behavior) */
  isFreeUser?: boolean;
}

export const WebNavHeader: React.FC<WebNavHeaderProps> = ({
  activePage = 'none',
  showLoginModal: externalShowLogin,
  setShowLoginModal: externalSetShowLogin,
  isFreeUser = true,
}) => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = useContext(AuthContext);
  
  // Internal login modal state (used if not controlled externally)
  const [internalShowLogin, setInternalShowLogin] = useState(false);
  
  // Use external state if provided, otherwise use internal
  const showLogin = externalShowLogin !== undefined ? externalShowLogin : internalShowLogin;
  const setShowLogin = externalSetShowLogin || setInternalShowLogin;

  // Determine if we're in a tab screen or stack screen
  // Tab screens: Home, Scan, Chat, Health, Profile
  // Stack screens: About, Subscription, Terms, Privacy, B2BPricing
  const isInTabNavigator = ['Home', 'Scan', 'Chat', 'Health', 'Profile', 'CoachSelection'].includes(route.name);

  // Navigate to tab screens (inside Main TabNavigator)
  const navigateToTab = (tabName: string) => {
    if (isInTabNavigator) {
      // Already in TabNavigator, navigate directly
      navigation.navigate(tabName);
    } else {
      // In stack screen, navigate to Main then to tab
      navigation.navigate('Main', { screen: tabName });
    }
  };

  // Navigate to stack screens (outside TabNavigator)
  const navigateToStack = (screenName: string) => {
    if (isInTabNavigator) {
      // In TabNavigator, use parent navigation
      navigation.getParent()?.navigate(screenName);
    } else {
      // Already in stack, navigate directly
      navigation.navigate(screenName);
    }
  };

  // Handle Health navigation - free users go to subscription
  const handleHealthClick = () => {
    if (isFreeUser) {
      navigateToStack('Subscription');
    } else {
      navigateToTab('Health');
    }
  };

  // Handle Profile click - show login if not authenticated
  const handleProfileClick = () => {
    if (user) {
      navigateToTab('Profile');
    } else {
      setShowLogin(true);
    }
  };

  return (
    <>
      <nav className="web-top-nav">
        <div className="web-nav-left">
          {/* Home */}
          <button 
            onClick={() => navigateToTab('Home')} 
            className={`web-nav-item nav-home ${activePage === 'home' ? 'active' : ''}`} 
            type="button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span>Home</span>
          </button>

          {/* Health */}
          <button 
            onClick={handleHealthClick} 
            className={`web-nav-item nav-health ${activePage === 'health' || activePage === 'subscription' ? 'active' : ''}`} 
            type="button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>Health</span>
          </button>

          {/* Scan - hidden on mobile via CSS */}
          <button 
            onClick={() => navigateToTab('Scan')} 
            className={`web-nav-item nav-scan mobile-only ${activePage === 'scan' ? 'active' : ''}`} 
            type="button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
            <span>Scan</span>
          </button>

          {/* Chat */}
          <button 
            onClick={() => navigateToTab('Chat')} 
            className={`web-nav-item nav-chat ${activePage === 'chat' ? 'active' : ''}`} 
            type="button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span>Chat</span>
          </button>

          {/* About */}
          <button 
            onClick={() => navigateToStack('About')} 
            className={`web-nav-item nav-about ${activePage === 'about' ? 'active' : ''}`} 
            type="button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span>About</span>
          </button>
        </div>

        <div className="web-nav-right">
          {/* Profile */}
          <button 
            onClick={handleProfileClick} 
            className={`web-nav-item profile ${activePage === 'profile' ? 'active' : ''}`} 
            type="button"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Login Modal - only render if using internal state */}
      {externalShowLogin === undefined && (
        <MultiAuthLogin
          visible={showLogin}
          onClose={() => setShowLogin(false)}
          onSignIn={() => setShowLogin(false)}
        />
      )}
    </>
  );
};

export default WebNavHeader;
