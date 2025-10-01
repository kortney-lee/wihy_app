import React, { useState } from 'react';
import './MultiAuthLogin.css';

interface MultiAuthLoginProps {
  className?: string;
}

const MultiAuthLogin: React.FC<MultiAuthLoginProps> = ({ className = '' }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const providers = [
    {
      name: 'Google',
      icon: (
        <svg viewBox="0 0 24 24" className="provider-icon">
          <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      color: '#4285f4'
    },
    {
      name: 'Microsoft',
      icon: (
        <svg viewBox="0 0 24 24" className="provider-icon">
          <path fill="#f25022" d="M1 1h10v10H1z"/>
          <path fill="#00a4ef" d="M13 1h10v10H13z"/>
          <path fill="#7fba00" d="M1 13h10v10H1z"/>
          <path fill="#ffb900" d="M13 13h10v10H13z"/>
        </svg>
      ),
      color: '#00a4ef'
    },
    {
      name: 'Apple',
      icon: (
        <svg viewBox="0 0 24 24" className="provider-icon">
          <path fill="#000" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
      color: '#000'
    },
    {
      name: 'Samsung',
      icon: (
        <svg viewBox="0 0 24 24" className="provider-icon">
          <path fill="#1428a0" d="M22.7 11.02c-.42-.92-1.33-1.57-2.4-1.57-1.07 0-1.98.65-2.4 1.57h-.02c-1.17-1.74-3.11-2.9-5.32-2.9-3.56 0-6.46 2.9-6.46 6.46 0 3.56 2.9 6.46 6.46 6.46 2.21 0 4.15-1.16 5.32-2.9h.02c.42.92 1.33 1.57 2.4 1.57 1.45 0 2.64-1.19 2.64-2.64 0-.33-.06-.65-.18-.94.12-.29.18-.61.18-.94 0-1.45-1.19-2.64-2.64-2.64zm-10.14 6.66c-2.49 0-4.52-2.03-4.52-4.52s2.03-4.52 4.52-4.52c2.49 0 4.52 2.03 4.52 4.52s-2.03 4.52-4.52 4.52z"/>
          <circle fill="#1428a0" cx="12.56" cy="13.16" r="2.5"/>
        </svg>
      ),
      color: '#1428a0'
    },
    {
      name: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" className="provider-icon">
          <path fill="#1877f2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: '#1877f2'
    }
  ];

  const handleProviderLogin = async (providerName: string) => {
    setIsLoading(true);
    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful authentication
      const mockUser = {
        name: `Test User (${providerName})`,
        email: `user@${providerName.toLowerCase()}.com`,
        avatar: `https://ui-avatars.com/api/?name=Test+User&background=random`,
        provider: providerName
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      setShowProviders(false);
      
      console.log(`Authenticated with ${providerName}:`, mockUser);
    } catch (error) {
      console.error(`${providerName} authentication failed:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUser(null);
    console.log('User signed out');
  };

  if (isAuthenticated && user) {
    return (
      <div className={`multi-auth-container ${className}`}>
        <div className="user-dropdown">
          <button className="login-icon authenticated" onClick={() => setShowProviders(!showProviders)}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="profile-image" />
            ) : (
              <div className="profile-initial">{user.name?.charAt(0)}</div>
            )}
          </button>
          
          {showProviders && (
            <div className="user-menu">
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
                <div className="user-provider">via {user.provider}</div>
              </div>
              <div className="user-actions">
                <button onClick={() => console.log('View Profile')}>View Profile</button>
                <button onClick={() => console.log('Settings')}>Settings</button>
                <button onClick={handleSignOut} className="sign-out">Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`multi-auth-container ${className}`}>
      <button className="login-icon" onClick={() => setShowProviders(!showProviders)}>
        {isLoading ? (
          <div className="login-spinner" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </button>

      {showProviders && !isLoading && (
        <div className="providers-popup">
          <div className="providers-header">
            <h3>Sign in to vHealth</h3>
            <button className="close-button" onClick={() => setShowProviders(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="providers-list">
            {providers.map((provider) => (
              <button
                key={provider.name}
                className="provider-button"
                onClick={() => handleProviderLogin(provider.name)}
                style={{ '--provider-color': provider.color } as React.CSSProperties}
              >
                {provider.icon}
                <span>Continue with {provider.name}</span>
              </button>
            ))}
          </div>
          
          <div className="providers-disclaimer">
            Your health data is secure and private. We only use your account for authentication.
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiAuthLogin;