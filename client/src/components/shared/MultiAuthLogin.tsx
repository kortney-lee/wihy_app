import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { authService, User } from '../../services/authService';
import './MultiAuthLogin.css';

// Re-export User type for external use
export type { User };

export interface AuthProvider {
  name: string;
  id: 'google' | 'microsoft' | 'apple' | 'facebook' | 'samsung' | 'email' | 'local';
  icon: React.ReactNode;
  color: string;
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
  title = 'Log in or sign up to WIHY',
  disclaimer = 'Smarter insights start here.'
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [showProviders, setShowProviders] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Email form state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [emailData, setEmailData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

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
      color: '#4285F4'
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
      color: '#0078D4'
    },
    {
      name: 'Facebook',
      id: 'facebook',
      icon: (
        <svg viewBox="0 0 24 24" className="provider-icon">
          <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: '#1877F2'
    },
    {
      name: 'Apple',
      id: 'apple',
      icon: (
        <svg viewBox="0 0 24 24" className="provider-icon">
          <path fill="#000" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
      color: '#000'
    },
    {
      name: 'email',
      id: 'email',
      icon: (
        <svg viewBox="0 0 24 24" className="provider-icon">
          <path fill="#5f6368" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      ),
      color: '#5f6368'
    }
  ];

  const authProviders = customProviders || defaultAuthProviders;

  useEffect(() => {
    // Subscribe to auth service state changes
    const unsubscribe = authService.subscribe((state) => {
      if (state.user && state.user !== user) {
        setUser(state.user);
        onUserChange?.(state.user);
        if (state.user && !user) {
          onSignIn?.(state.user);
        }
      } else if (!state.user && user) {
        setUser(null);
        onUserChange?.(null);
      }
      setLoading(state.loading);
    });

    // Get initial state
    const initialState = authService.getState();
    if (initialState.user) {
      setUser(initialState.user);
      onUserChange?.(initialState.user);
    }

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state && !user) {
      handleOAuthCallback(code, state);
    }

    return () => {
      unsubscribe();
    };
  }, []); // Only run once on mount

  // Manage body class for modal state
  useEffect(() => {
    if (showProviders || showDropdown || showEmailForm) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showProviders, showDropdown, showEmailForm]);

  const handleOAuthCallback = async (code: string, state: string) => {
    setLoading(true);
    try {
      const provider = state as 'google' | 'microsoft' | 'facebook';
      
      // Use the new auth service to handle OAuth callback
      const result = await authService.handleOAuthCallback(provider, code, state);
      
      if (result.success && result.user) {
        setUser(result.user);
        onUserChange?.(result.user);
        onSignIn?.(result.user);
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      safeLog('OAuth callback error', error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderColor = (provider: string): string => {
    const providerObj = authProviders.find(p => p.id === provider);
    return providerObj?.color || '#666';
  };

  const handleProviderLogin = async (provider: AuthProvider) => {
    // Handle email provider differently - show email form
    if (provider.id === 'email') {
      setShowProviders(false);
      setShowEmailForm(true);
      setEmailMode('signin');
      return;
    }

    // Use auth service for OAuth providers
    try {
      if (provider.id === 'google') {
        await authService.initiateOAuth('google');
      } else if (provider.id === 'microsoft') {
        await authService.initiateOAuth('microsoft');
      } else if (provider.id === 'facebook') {
        await authService.initiateOAuth('facebook');
      } else if (provider.id === 'apple') {
        await authService.initiateOAuth('apple');
      } else if (provider.id === 'samsung') {
        await authService.initiateOAuth('samsung');
      }
    } catch (error) {
      safeLog('OAuth initiation error', error);
      setEmailError('Failed to initiate authentication. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.logout();
      setUser(null);
      setShowDropdown(false);
      setShowProviders(false);
      setShowEmailForm(false);
      onUserChange?.(null);
      onSignOut?.();
    } catch (error) {
      safeLog('Sign out error', error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailLoading(true);

    try {
      // Basic validation
      if (!emailData.email || !emailData.password) {
        throw new Error('Email and password are required');
      }

      if (emailMode === 'signup') {
        if (emailData.password !== emailData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (!emailData.name) {
          throw new Error('Name is required');
        }

        // Register new user
        const result = await authService.register({
          email: emailData.email,
          password: emailData.password,
          name: emailData.name
        });

        if (!result.success) {
          throw new Error(result.error || 'Registration failed');
        }

        // After successful registration, log them in
        const loginResult = await authService.login(emailData.email, emailData.password);
        
        if (!loginResult.success) {
          throw new Error(loginResult.error || 'Login failed after registration');
        }

        const newUser = loginResult.user!;
        setUser(newUser);
        onUserChange?.(newUser);
        onSignIn?.(newUser);
      } else {
        // Sign in existing user
        const result = await authService.login(emailData.email, emailData.password);

        if (!result.success) {
          throw new Error(result.error || 'Login failed');
        }

        const loggedInUser = result.user!;
        setUser(loggedInUser);
        onUserChange?.(loggedInUser);
        onSignIn?.(loggedInUser);
      }
      
      setShowEmailForm(false);
      setEmailData({ email: '', password: '', confirmPassword: '', name: '' });
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setEmailLoading(false);
    }
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

      {/* Provider Selection Popup - Render via portal to avoid container conflicts */}
      {!user && showProviders && createPortal(
        <>
          <div 
            className="auth-overlay" 
            onClick={() => {
              setShowProviders(false);
              setShowDropdown(false);
            }}
          ></div>
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
            <div style={{ 
              padding: '0 20px 16px 20px', 
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              <p style={{ margin: '0 0 12px 0', fontStyle: 'italic' }}>
                (pronounced "why")
              </p>
              <p style={{ margin: '0 0 12px 0' }}>
                You can scan foods for free or ask general questions anytime.
              </p>
              <p style={{ margin: '0' }}>
                To save your history, track your progress, and share your goals, you'll need to create an account.
              </p>
            </div>
            <div className="providers-list">
              {authProviders.filter(provider => provider.id !== 'email').map((provider) => (
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
            
            <div style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                margin: '8px 0',
                color: '#6b7280',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                <span style={{ margin: '0 16px' }}>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
              </div>
              
              <input
                type="email"
                placeholder="Email address"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  border: '1px solid #dadce0',
                  borderRadius: '24px',
                  fontSize: '14px',
                  outline: 'none',
                  marginBottom: '12px',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#dadce0';
                }}
              />
              
              <button
                onClick={() => {
                  setShowProviders(false);
                  setShowEmailForm(true);
                  setEmailMode('signin');
                }}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                }}
              >
                Continue
              </button>
            </div>
            
            <p className="providers-disclaimer">
              {disclaimer}
            </p>
          </div>
        </>,
        document.body
      )}

      {/* User Dropdown - Render via portal */}
      {user && showDropdown && createPortal(
        <>
          <div 
            className="auth-overlay" 
            onClick={() => {
              setShowProviders(false);
              setShowDropdown(false);
            }}
          ></div>
          <div className="user-dropdown" style={{ 
            position: 'fixed',
            top: '60px',
            right: '20px',
            zIndex: 10001
          }}>
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
        </>,
        document.body
      )}

      {/* Email Form - Render via portal */}
      {!user && showEmailForm && createPortal(
        <>
          <div 
            className="auth-overlay" 
            onClick={() => {
              setShowEmailForm(false);
              setShowProviders(false);
            }}
          ></div>
          <div className="providers-popup">
            <div className="providers-header">
              <button 
                className="close-button"
                onClick={() => {
                  setShowEmailForm(false);
                  setShowProviders(true);
                }}
                style={{ marginRight: 'auto' }}
              >
                ←
              </button>
              <h3>{emailMode === 'signin' ? 'Sign in with email' : 'Create account'}</h3>
              <button 
                className="close-button"
                onClick={() => setShowEmailForm(false)}
              >
                ×
              </button>
            </div>
            <div className="providers-list">
              <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {emailMode === 'signup' && (
                  <input
                    type="text"
                    placeholder="Full name"
                    value={emailData.name}
                    onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                    className="provider-button"
                    style={{ textAlign: 'left', border: '1px solid #dadce0' }}
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="Email address"
                  value={emailData.email}
                  onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                  className="provider-button"
                  style={{ textAlign: 'left', border: '1px solid #dadce0' }}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={emailData.password}
                  onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                  className="provider-button"
                  style={{ textAlign: 'left', border: '1px solid #dadce0' }}
                  required
                />
                {emailMode === 'signup' && (
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={emailData.confirmPassword}
                    onChange={(e) => setEmailData({ ...emailData, confirmPassword: e.target.value })}
                    className="provider-button"
                    style={{ textAlign: 'left', border: '1px solid #dadce0' }}
                    required
                  />
                )}
                
                {emailError && (
                  <div style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>
                    {emailError}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="provider-button"
                  style={{ 
                    backgroundColor: '#1f2937', 
                    color: 'white', 
                    border: '1px solid #1f2937',
                    fontWeight: '600'
                  }}
                >
                  {emailLoading ? 'Please wait...' : emailMode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
                
                <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                  {emailMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#3b82f6', 
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {emailMode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>,
        document.body
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