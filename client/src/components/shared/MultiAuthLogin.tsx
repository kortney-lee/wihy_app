import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { authService, User } from '../../services/authService';

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
    if (!user) {
      setShowProviders(!showProviders);
    }
    // For authenticated users, do nothing - UserPreference handles account management
  };

  return (
    <div className={`${position === 'top-right' ? 'block' : 'relative inline-block'} ${className}`}>
      {/* Main Login Button */}
      <button 
        className="border-none cursor-pointer !pointer-events-auto p-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm text-blue-600 relative disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={handleLoginClick}
        disabled={loading}
        aria-label={user ? 'User identity' : 'Sign in'}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        ) : user ? null : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        )}
      </button>

      {/* Provider Selection Popup - Render via portal to avoid container conflicts */}
      {!user && showProviders && createPortal(
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[10000] backdrop-blur-sm"
            onClick={() => {
              setShowProviders(false);
              setShowDropdown(false);
            }}
          ></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10001] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15),0_8px_25px_rgba(0,0,0,0.1)] w-[380px] max-w-[90vw] max-h-[90vh] border border-black/5 pointer-events-auto animate-[modalSlideIn_0.3s_cubic-bezier(0.16,1,0.3,1)] max-[600px]:!w-[calc(100vw-32px)] max-[600px]:!right-4 max-[600px]:!left-4 max-[600px]:!fixed max-[600px]:!top-20 max-[600px]:!translate-x-0 max-[600px]:!translate-y-0 max-[600px]:!max-h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-center items-center p-4 text-center relative flex-shrink-0">
              <h3 className="m-0 text-lg font-medium text-[#202124]">{title}</h3>
              <button 
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                onClick={() => setShowProviders(false)}
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            
            <div className="px-5 pb-4 text-center text-gray-600 text-sm leading-relaxed">
              <p className="m-0 mb-3 italic">
                (pronounced "why") BETA – Your AI-powered nutrition assistant.
              </p>
              <p className="m-0 mb-3">
                You can scan foods for free or ask general questions anytime.
              </p>
              <p className="m-0">
                To save your history, track your progress, and share your goals, you'll need to create an account.
              </p>
            </div>
            
            <div className="px-5 py-4 text-center">
              <input
                type="email"
                placeholder="Email address"
                value={emailData.email}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                className="w-full px-[18px] py-[14px] border border-[#dadce0] rounded-full text-sm outline-none mb-3 box-border focus:border-blue-500"
              />
              
              <button
                onClick={() => {
                  setShowProviders(false);
                  setShowEmailForm(true);
                  setEmailMode('signup');
                }}
                className="w-full px-[18px] py-[14px] bg-gray-800 text-white border-none rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-gray-700"
              >
                Continue
              </button>
            </div>

            <div className="px-5 py-3 text-center">
              <p className="text-xs text-gray-500 mb-2">
                We're working hard to bring you a seamless authentication experience. 
                <strong> Other providers coming soon.</strong>
              </p>
              <p className="text-xs text-gray-400">
                In the meantime, you can continue using WiHY (Beta) to scan foods and ask health questions for free.
              </p>
            </div>
            
            <p className="px-5 pb-2 text-xs text-slate-600 text-center m-0 leading-snug max-[600px]:pb-2">
              {disclaimer}
            </p>
            <p className="px-5 pb-4 text-xs text-gray-400 text-center m-0 leading-snug max-[600px]:pb-5">
              Visit <a href="https://wihy.ai/about" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">WihY</a> <a href="https://wihy.ai/about" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">wihy.ai/about</a> for more details
            </p>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Email Form - Render via portal */}
      {!user && showEmailForm && createPortal(
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[10000] backdrop-blur-sm"
            onClick={() => {
              setShowEmailForm(false);
              setShowProviders(false);
            }}
          ></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10001] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15),0_8px_25px_rgba(0,0,0,0.1)] w-[380px] max-w-[90vw] max-h-[90vh] border border-black/5 pointer-events-auto animate-[modalSlideIn_0.3s_cubic-bezier(0.16,1,0.3,1)] max-[600px]:!w-[calc(100vw-32px)] max-[600px]:!right-4 max-[600px]:!left-4 max-[600px]:!fixed max-[600px]:!top-20 max-[600px]:!translate-x-0 max-[600px]:!translate-y-0 max-[600px]:!max-h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 relative flex-shrink-0">
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-gray-600 hover:bg-gray-100 transition-colors duration-200 flex-shrink-0"
                onClick={() => {
                  setShowEmailForm(false);
                  setShowProviders(true);
                }}
                aria-label="Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="flex-1 text-center m-0 text-lg font-medium text-[#202124] whitespace-nowrap px-2">{emailMode === 'signin' ? 'Sign in with email' : 'Create account'}</h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-gray-600 hover:bg-gray-100 transition-colors duration-200 flex-shrink-0"
                onClick={() => setShowEmailForm(false)}
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="px-5 py-4 flex flex-col gap-3">
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                {emailMode === 'signup' && (
                  <input
                    type="text"
                    placeholder="Full name"
                    value={emailData.name}
                    onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                    className="flex items-center justify-center gap-3 px-[18px] py-[14px] border border-[#dadce0] rounded-full bg-white cursor-pointer transition-all duration-200 text-sm font-medium text-slate-700 w-full text-left"
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="Email address"
                  value={emailData.email}
                  onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                  className="flex items-center justify-center gap-3 px-[18px] py-[14px] border border-[#dadce0] rounded-full bg-white cursor-pointer transition-all duration-200 text-sm font-medium text-slate-700 w-full text-left"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={emailData.password}
                  onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                  className="flex items-center justify-center gap-3 px-[18px] py-[14px] border border-[#dadce0] rounded-full bg-white cursor-pointer transition-all duration-200 text-sm font-medium text-slate-700 w-full text-left"
                  required
                />
                {emailMode === 'signup' && (
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={emailData.confirmPassword}
                    onChange={(e) => setEmailData({ ...emailData, confirmPassword: e.target.value })}
                    className="flex items-center justify-center gap-3 px-[18px] py-[14px] border border-[#dadce0] rounded-full bg-white cursor-pointer transition-all duration-200 text-sm font-medium text-slate-700 w-full text-left"
                    required
                  />
                )}
                
                {emailError && (
                  <div className="text-red-500 text-sm text-center">
                    {emailError}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="flex items-center justify-center gap-3 px-[18px] py-[14px] border border-gray-800 rounded-full bg-gray-800 text-white cursor-pointer transition-all duration-200 text-sm font-semibold w-full text-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {emailLoading ? 'Please wait...' : emailMode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
                
                <div className="text-center text-sm text-gray-600">
                  {emailMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
                    className="bg-transparent border-none text-blue-500 cursor-pointer underline"
                  >
                    {emailMode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </div>
              </form>
            </div>
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