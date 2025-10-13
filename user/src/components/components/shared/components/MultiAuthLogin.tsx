import React, { useState, useEffect, useCallback } from 'react';
import './MultiAuthLogin.css';

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: 'google' | 'microsoft' | 'apple' | 'facebook';
}

export interface AuthProvider {
  name: string;
  id: 'google' | 'microsoft' | 'apple' | 'facebook';
  icon: React.ReactNode; // Changed from JSX.Element
  color: string;
  clientId: string;
  authUrl: string;
}

interface MultiAuthLoginProps {
  position?: 'top-right' | 'inline';
  className?: string;
  onUserChange?: (user: User | null) => void;
  onSignIn?: (user: User) => void;
  onSignOut?: () => void;
  customProviders?: AuthProvider[];
  storageKey?: string;
  title?: string;
  disclaimer?: string;
}

const MultiAuthLogin: React.FC<MultiAuthLoginProps> = ({
  position = 'top-right',
  className = '',
  onUserChange,
  onSignIn,
  onSignOut,
  customProviders,
  storageKey = 'vhealth_user',
  title = 'Sign in to vHealth',
  disclaimer = 'Your health data is secure and private. We only use your account for authentication.'
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [showProviders, setShowProviders] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Default authentication providers configuration
  const defaultAuthProviders: AuthProvider[] = [
    {
      name: 'Google',
      id: 'google',
      icon: (
        <svg viewBox="0 0 24 24" className="provider-icon">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      color: '#4285F4',
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id',
      authUrl: 'https://accounts.google.com/oauth/authorize'
    },
    {
      name: 'Microsoft',
      id: 'microsoft',
      icon: (
        <svg viewBox="0 0 24 24" className="provider-icon">
          <path fill="#F25022" d="M1 1h10v10H1z"/>
          <path fill="#00A4EF" d="M13 1h10v10H13z"/>
          <path fill="#7FBA00" d="M1 13h10v10H1z"/>
          <path fill="#FFB900" d="M13 13h10v10H13z"/>
        </svg>
      ),
      color: '#0078D4',
      clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID || 'your-microsoft-client-id',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
    },
    {
      name: 'Apple',
      id: 'apple',
      icon: (
        <svg viewBox="0 0 24 24" className="provider-icon">
          <path fill="#000" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
      color: '#000',
      clientId: process.env.REACT_APP_APPLE_CLIENT_ID || 'your-apple-client-id',
      authUrl: 'https://appleid.apple.com/auth/authorize'
    },
    {
      name: 'Facebook',
      id: 'facebook',
      icon: (
        <svg viewBox="0 0 24 24" className="provider-icon">
          <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: '#1877F2',
      clientId: process.env.REACT_APP_FACEBOOK_CLIENT_ID || 'your-facebook-client-id',
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth'
    }
  ];

  const authProviders = customProviders || defaultAuthProviders;

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem(storageKey);
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // IMPORTANT: Wrap this in a conditional to prevent excessive logging
        if (!user) {
          onUserChange?.(parsedUser);
        }
      } catch (error) {
        safeLog('Error parsing saved user', error);
        localStorage.removeItem(storageKey);
      }
    }

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state && !user) {
      handleOAuthCallback(code, state);
    }
  }, [storageKey]); // Remove onUserChange from dependencies

  const handleOAuthCallback = async (code: string, state: string) => {
    setLoading(true);
    try {
      const provider = state as 'google' | 'microsoft' | 'apple' | 'facebook';
      
      // TODO: Replace with actual API call to your backend
      // const response = await fetch('/api/auth/oauth/callback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ code, state, provider })
      // });
      // const userData = await response.json();
      
      // For demo purposes, simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: `${provider}-123456`,
        name: `User from ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
        email: `user@${provider === 'microsoft' ? 'outlook.com' : provider}.com`,
        picture: `https://via.placeholder.com/40/${getProviderColor(provider).replace('#', '')}/ffffff?text=${provider.charAt(0).toUpperCase()}`,
        provider
      };

      setUser(mockUser);
      localStorage.setItem(storageKey, JSON.stringify(mockUser));
      onUserChange?.(mockUser);
      onSignIn?.(mockUser);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      // console.error('OAuth callback error:', error);
      safeLog('OAuth callback error', error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderColor = (provider: string): string => {
    const providerObj = authProviders.find(p => p.id === provider);
    return providerObj?.color || '#666';
  };

  const handleProviderLogin = (provider: AuthProvider) => {
    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: window.location.origin,
      response_type: 'code',
      scope: getProviderScopes(provider.id),
      state: provider.id,
      ...(provider.id === 'microsoft' && { response_mode: 'query' }),
      ...(provider.id === 'apple' && { response_mode: 'form_post' })
    });

    const authUrl = `${provider.authUrl}?${params.toString()}`;
    window.location.href = authUrl;
  };

  const getProviderScopes = (providerId: string): string => {
    const scopes = {
      google: 'openid profile email',
      microsoft: 'openid profile email',
      apple: 'name email',
      facebook: 'email public_profile'
    };
    return scopes[providerId as keyof typeof scopes] || 'profile email';
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem(storageKey);
    setShowDropdown(false);
    setShowProviders(false);
    onUserChange?.(null);
    onSignOut?.();
  };

  const handleLoginClick = () => {
    if (user) {
      setShowDropdown(!showDropdown);
    } else {
      setShowProviders(!showProviders);
    }
  };

  return (
    <div className={`multi-auth-container ${position} ${className}`}>
      {/* Main Login Button */}
      <button 
        className={`login-icon ${user ? 'authenticated' : ''}`}
        onClick={handleLoginClick}
        disabled={loading}
        aria-label={user ? 'User menu' : 'Sign in'}
      >
        {loading ? (
          <div className="login-spinner"></div>
        ) : user ? (
          user.picture ? (
            <img 
              src={user.picture} 
              alt="Profile" 
              className="profile-image"
            />
          ) : (
            <div 
              className="profile-initial"
              style={{ backgroundColor: getProviderColor(user.provider) }}
            >
              {user.name?.charAt(0) || 'U'}
            </div>
          )
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        )}
      </button>

      {/* Provider Selection Popup */}
      {!user && showProviders && (
        <div className="providers-popup">
          <div className="providers-header">
            <h3>{title}</h3>
            <button 
              className="close-button"
              onClick={() => setShowProviders(false)}
            >
              ×
            </button>
          </div>
          <div className="providers-list">
            {authProviders.map((provider) => (
              <button
                key={provider.id}
                className="provider-button"
                onClick={() => handleProviderLogin(provider)}
                style={{ '--provider-color': provider.color } as React.CSSProperties}
              >
                {provider.icon}
                <span>Continue with {provider.name}</span>
              </button>
            ))}
          </div>
          <p className="providers-disclaimer">
            {disclaimer}
          </p>
        </div>
      )}

      {/* User Dropdown */}
      {user && showDropdown && (
        <div className="user-dropdown">
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
            <div className="user-provider">
              Signed in with {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}
            </div>
          </div>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item" onClick={handleSignOut}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="dropdown-icon">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            Sign Out
          </button>
        </div>
      )}

      {/* Overlay */}
      {(showProviders || showDropdown) && (
        <div 
          className="auth-overlay" 
          onClick={() => {
            setShowProviders(false);
            setShowDropdown(false);
          }}
        ></div>
      )}
    </div>
  );
};

export default MultiAuthLogin;

// Add this helper function at the top of your file
const safeLog = (message: string, data?: any) => {
  if (data === undefined) {
    console.log(message);
    return;
  }
  
  try {
    if (typeof data === 'object' && data !== null) {
      console.log(message, JSON.stringify(data));
    } else {
      console.log(message, data);
    }
  } catch (error) {
    console.log(message, '(Object could not be stringified)');
  }
};