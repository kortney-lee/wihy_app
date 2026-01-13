import React, { useContext, useState } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
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
  const { user } = useContext(AuthContext);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Check if user is on free plan
  const isFreeUser = !user || user.plan === 'free';

  // Only render on web
  if (!isWeb) {
    return null;
  }
  
  // Handle health button click - show subscription for free users
  const handleHealthPress = () => {
    if (isFreeUser) {
      navigation.navigate('Subscription');
    } else {
      navigation.navigate('Health');
    }
  };

  // Handle profile button click
  const handleProfilePress = () => {
    if (user) {
      navigation.navigate('Profile');
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <>
    <nav className="web-top-nav">
      <div className="web-nav-left">
        <button 
          onClick={() => navigation.navigate('Main')} 
          className={`web-nav-item nav-home ${activeTab === 'home' ? 'active' : ''}`} 
          type="button"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span>Home</span>
        </button>
        <button 
          onClick={handleHealthPress} 
          className={`web-nav-item nav-health ${activeTab === 'health' ? 'active' : ''}`} 
          type="button"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>Health</span>
        </button>
        <button 
          onClick={() => navigation.navigate('Scan')} 
          className="web-nav-item nav-scan mobile-only" 
          type="button"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
          </svg>
          <span>Scan</span>
        </button>
        <button 
          onClick={() => navigation.navigate('Chat')} 
          className={`web-nav-item nav-chat ${activeTab === 'chat' ? 'active' : ''}`} 
          type="button"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span>Chat</span>
        </button>
        <button 
          onClick={() => navigation.navigate('About' as any)} 
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
          onClick={handleProfilePress} 
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
  if (!isWeb) {
    return <>{children}</>;
  }

  return (
    <div className={`web-page-wrapper ${className}`}>
      <WebTopNav activeTab={activeTab} />
      <div className="web-page-content">
        {children}
      </div>
    </div>
  );
}

export default WebTopNav;
