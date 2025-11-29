// ============================================================
// WIHY AUTH API - USAGE EXAMPLES
// ============================================================
// Comprehensive examples for using the wihy_auth API integration

import React from 'react';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

// ============================================================
// EXAMPLE 1: Basic Login Flow
// ============================================================

export const Example1_BasicLogin = () => {
  const handleLogin = async () => {
    try {
      const result = await authService.login(
        'user@example.com',
        'SecurePassword123!'
      );

      if (result.success) {
        console.log('✅ Login successful!');
        console.log('User:', result.user);
        console.log('Session Token:', result.session_token);
      } else {
        console.error('❌ Login failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
    }
  };

  return <button onClick={handleLogin}>Login</button>;
};

// ============================================================
// EXAMPLE 2: Registration with Validation
// ============================================================

export const Example2_Registration = () => {
  const handleRegister = async (email: string, password: string, name: string) => {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Register user
      const result = await authService.register({
        email,
        password,
        name
      });

      if (result.success) {
        console.log('✅ Registration successful!');
        console.log('User ID:', result.user_id);
        
        // Automatically log in after registration
        const loginResult = await authService.login(email, password);
        if (loginResult.success) {
          console.log('✅ Auto-login successful!');
        }
      } else {
        console.error('❌ Registration failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
    }
  };

  return (
    <button onClick={() => handleRegister('new@example.com', 'Pass123!', 'New User')}>
      Register
    </button>
  );
};

// ============================================================
// EXAMPLE 3: Using Auth Context Hook
// ============================================================

export const Example3_UseAuthHook = () => {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    login, 
    logout 
  } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div>
        <h3>Welcome, {user.name}!</h3>
        <p>Email: {user.email}</p>
        <p>Provider: {user.provider}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div>
      <h3>Please log in</h3>
      <button onClick={() => login('user@example.com', 'password')}>
        Login
      </button>
    </div>
  );
};

// ============================================================
// EXAMPLE 4: OAuth2 Integration
// ============================================================

export const Example4_OAuthLogin = () => {
  const { loginWithGoogle, loginWithMicrosoft, loginWithFacebook } = useAuth();

  return (
    <div>
      <h3>Login with:</h3>
      <button onClick={loginWithGoogle}>Google</button>
      <button onClick={loginWithMicrosoft}>Microsoft</button>
      <button onClick={loginWithFacebook}>Facebook</button>
    </div>
  );
};

// ============================================================
// EXAMPLE 5: Password Change
// ============================================================

export const Example5_ChangePassword = () => {
  const { changePassword } = useAuth();

  const handlePasswordChange = async () => {
    try {
      const result = await changePassword(
        'CurrentPassword123!',
        'NewSecurePassword456!'
      );

      if (result.success) {
        console.log('✅ Password changed successfully!');
        alert('Password updated!');
      } else {
        console.error('❌ Password change failed:', result.error);
        alert('Failed to change password: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  return <button onClick={handlePasswordChange}>Change Password</button>;
};

// ============================================================
// EXAMPLE 6: Session Management
// ============================================================

export const Example6_SessionManagement = () => {
  const { checkSession, refreshAuth } = useAuth();

  const handleCheckSession = async () => {
    try {
      await checkSession();
      const state = authService.getState();
      console.log('Current session:', state);
    } catch (error) {
      console.error('Session check failed:', error);
    }
  };

  const handleRefreshAuth = async () => {
    try {
      await refreshAuth();
      console.log('Auth refreshed');
    } catch (error) {
      console.error('Auth refresh failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleCheckSession}>Check Session</button>
      <button onClick={handleRefreshAuth}>Refresh Auth</button>
    </div>
  );
};

// ============================================================
// EXAMPLE 7: Protected Content
// ============================================================

export const Example7_ProtectedContent = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in to view this content.</div>;
  }

  return (
    <div>
      <h2>Protected Content</h2>
      <p>Welcome, {user?.name}! This content is only visible to authenticated users.</p>
    </div>
  );
};

// ============================================================
// EXAMPLE 8: API Health Check
// ============================================================

export const Example8_HealthCheck = () => {
  const handleHealthCheck = async () => {
    try {
      const health = await authService.checkHealth();
      console.log('🏥 API Health:', health);
      console.log('Status:', health.status);
      console.log('Timestamp:', health.timestamp);
      console.log('Available Providers:', health.providers);
    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  };

  return <button onClick={handleHealthCheck}>Check API Health</button>;
};

// ============================================================
// EXAMPLE 9: Auth State Subscription
// ============================================================

export const Example9_AuthSubscription = () => {
  React.useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((state) => {
      console.log('🔔 Auth state changed:', {
        isAuthenticated: state.isAuthenticated,
        user: state.user?.name,
        loading: state.loading,
        error: state.error
      });
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return <div>Check console for auth state changes</div>;
};

// ============================================================
// EXAMPLE 10: Complete Login Form
// ============================================================

export const Example10_CompleteLoginForm = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        console.log('✅ Login successful!');
        // Redirect or update UI
        window.location.href = '/dashboard';
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ color: 'red', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </label>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </label>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

// ============================================================
// EXAMPLE 11: User Profile Display
// ============================================================

export const Example11_UserProfile = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <div>No user logged in</div>;
  }

  return (
    <div style={{ 
      border: '1px solid #e5e7eb', 
      borderRadius: '8px', 
      padding: '16px',
      maxWidth: '400px'
    }}>
      <h3 style={{ marginTop: 0 }}>User Profile</h3>
      
      {user.picture && (
        <img 
          src={user.picture} 
          alt={user.name}
          style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%',
            marginBottom: '16px'
          }}
        />
      )}
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Name:</strong> {user.name}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Email:</strong> {user.email}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Provider:</strong> {user.provider}
      </div>
      
      {user.created_at && (
        <div style={{ marginBottom: '8px' }}>
          <strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}
        </div>
      )}
      
      {user.last_login && (
        <div style={{ marginBottom: '8px' }}>
          <strong>Last Login:</strong> {new Date(user.last_login).toLocaleString()}
        </div>
      )}
    </div>
  );
};

// ============================================================
// EXAMPLE 12: Error Handling
// ============================================================

export const Example12_ErrorHandling = () => {
  const handleLoginWithErrorHandling = async () => {
    try {
      const result = await authService.login('user@example.com', 'wrongpassword');

      if (!result.success) {
        // Handle specific error types
        if (result.error?.includes('Invalid credentials')) {
          alert('Incorrect email or password. Please try again.');
        } else if (result.error?.includes('User not found')) {
          alert('No account found with this email. Please register first.');
        } else if (result.error?.includes('Account locked')) {
          alert('Your account has been locked. Please contact support.');
        } else {
          alert('Login failed: ' + result.error);
        }
      }
    } catch (error) {
      // Handle network or unexpected errors
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          alert('Network error. Please check your connection.');
        } else {
          alert('An unexpected error occurred: ' + error.message);
        }
      }
    }
  };

  return <button onClick={handleLoginWithErrorHandling}>Login with Error Handling</button>;
};

// ============================================================
// Export all examples
// ============================================================

export const AllExamples = {
  Example1_BasicLogin,
  Example2_Registration,
  Example3_UseAuthHook,
  Example4_OAuthLogin,
  Example5_ChangePassword,
  Example6_SessionManagement,
  Example7_ProtectedContent,
  Example8_HealthCheck,
  Example9_AuthSubscription,
  Example10_CompleteLoginForm,
  Example11_UserProfile,
  Example12_ErrorHandling
};
