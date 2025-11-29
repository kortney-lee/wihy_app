# WIHY Auth API Integration Guide

## Overview
This guide provides complete setup and usage instructions for the WIHY authentication system integrated with the wihy_auth API.

## Architecture

### Components
1. **authService** (`services/authService.ts`) - Core authentication service
2. **AuthContext** (`contexts/AuthContext.tsx`) - React context for global auth state
3. **MultiAuthLogin** (`components/shared/MultiAuthLogin.tsx`) - UI component for authentication
4. **ProtectedRoute** (`components/auth/ProtectedRoute.tsx`) - Route wrapper for protected pages

### API Integration
- **Base URL**: `http://wihy-auth-api.centralus.azurecontainer.io:5000`
- **Environment Variable**: `REACT_APP_WIHY_AUTH_API_URL`
- **Authentication Methods**: Local (email/password), OAuth2 (Google, Microsoft, Facebook)

---

## Quick Start

### 1. Wrap App with AuthProvider

Update your `App.tsx` or main entry point:

```tsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

### 2. Use MultiAuthLogin Component

Add the login component to your header or navbar:

```tsx
import MultiAuthLogin from './components/shared/MultiAuthLogin';

function Header() {
  return (
    <header>
      <MultiAuthLogin
        position="top-right"
        onUserChange={(user) => console.log('User changed:', user)}
        onSignIn={(user) => console.log('User signed in:', user)}
        onSignOut={() => console.log('User signed out')}
      />
    </header>
  );
}
```

### 3. Protect Routes

Wrap protected routes with `ProtectedRoute`:

```tsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

### 4. Use Auth in Components

Access authentication state and methods:

```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async () => {
    const result = await login('user@example.com', 'password');
    if (result.success) {
      console.log('Logged in successfully!');
    } else {
      console.error('Login failed:', result.error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.name}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

---

## API Reference

### authService Methods

#### Authentication
```typescript
// Register new user
const result = await authService.register({
  email: 'user@example.com',
  password: 'SecurePass123!',
  name: 'John Doe'
});

// Login with email/password
const result = await authService.login('user@example.com', 'password');

// Change password
const result = await authService.changePassword('oldPassword', 'newPassword');

// Logout
await authService.logout();
```

#### OAuth2
```typescript
// Initiate Google OAuth
await authService.initiateOAuth('google');

// Initiate Microsoft OAuth
await authService.initiateOAuth('microsoft');

// Initiate Facebook OAuth
await authService.initiateOAuth('facebook');

// Handle OAuth callback (usually automatic)
await authService.handleOAuthCallback('google', code, state);
```

#### Session Management
```typescript
// Check current session
const session = await authService.checkSession();

// Initialize auth (called automatically on app load)
await authService.initAuth();

// Get current auth state
const state = authService.getState();

// Subscribe to auth state changes
const unsubscribe = authService.subscribe((state) => {
  console.log('Auth state changed:', state);
});
```

#### Health & Discovery
```typescript
// Check API health
const health = await authService.checkHealth();

// Get available auth providers
const providers = await authService.getProviders();
```

### useAuth Hook

```typescript
const {
  // State
  isAuthenticated,  // boolean
  user,            // User | null
  loading,         // boolean
  error,           // string | undefined

  // Actions
  login,           // (email, password) => Promise<{success, error?}>
  register,        // (email, password, name?) => Promise<{success, error?}>
  logout,          // () => Promise<void>
  changePassword,  // (current, new) => Promise<{success, error?}>
  
  // OAuth
  loginWithGoogle,
  loginWithMicrosoft,
  loginWithFacebook,
  
  // Session
  checkSession,
  refreshAuth
} = useAuth();
```

### User Type

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: 'local' | 'google' | 'microsoft' | 'apple' | 'facebook';
  created_at?: string;
  last_login?: string;
}
```

---

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# Authentication API
REACT_APP_WIHY_AUTH_API_URL=http://wihy-auth-api.centralus.azurecontainer.io:5000

# OAuth Client IDs (optional, for custom OAuth implementations)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_MICROSOFT_CLIENT_ID=your-microsoft-client-id
REACT_APP_FACEBOOK_CLIENT_ID=your-facebook-client-id
```

### Production Configuration

For production, update the API URL:

```env
REACT_APP_WIHY_AUTH_API_URL=https://auth.wihy.ai
```

---

## Advanced Usage

### Custom Login UI

```tsx
import { authService } from '../services/authService';

function CustomLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await authService.login(email, password);
    
    if (result.success) {
      // Handle success
      window.location.href = '/dashboard';
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Auth State Persistence

The auth service automatically persists user sessions using localStorage:
- User data: `wihy_auth_user`
- Session token: `wihy_auth_token`

Sessions are validated on app load and expired sessions are cleared automatically.

### Handling OAuth Redirects

OAuth providers redirect users back to your app with a `code` and `state` parameter. The `MultiAuthLogin` component handles this automatically, but you can also handle it manually:

```tsx
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  if (code && state) {
    authService.handleOAuthCallback(state, code, state)
      .then(() => {
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      });
  }
}, []);
```

---

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Session Duration**: Sessions expire after 24 hours by default
3. **Password Requirements**: Minimum 6 characters (configurable on backend)
4. **CSRF Protection**: OAuth flows include state validation
5. **Secure Storage**: Session tokens stored securely with httpOnly cookies

---

## Testing

### Test API Health

```typescript
const health = await authService.checkHealth();
console.log('API Status:', health.status);
console.log('Available Providers:', health.providers);
```

### Test Registration

```typescript
const result = await authService.register({
  email: 'test@example.com',
  password: 'Test123!',
  name: 'Test User'
});
console.log('Registration:', result);
```

### Test Login

```typescript
const result = await authService.login('test@example.com', 'Test123!');
console.log('Login:', result);
console.log('User:', result.user);
```

---

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend has CORS enabled with credentials
2. **Session Not Persisting**: Check that cookies are enabled
3. **OAuth Redirect Issues**: Verify redirect URIs match in OAuth provider settings
4. **API Connection Failed**: Check API_CONFIG.WIHY_AUTH_API_URL is correct

### Debug Logging

Enable debug logging in authService by adding:

```typescript
console.log('Auth State:', authService.getState());
```

---

## Migration from Old Auth

If you have existing authentication code, here's how to migrate:

### Before
```typescript
// Old auth
localStorage.setItem('user', JSON.stringify(user));
```

### After
```typescript
// New auth service
await authService.login(email, password);
```

---

## Support

For issues or questions:
1. Check API health: `http://wihy-auth-api.centralus.azurecontainer.io:5000/api/health`
2. View interactive demo: `http://wihy-auth-api.centralus.azurecontainer.io:5000/`
3. Review API documentation: See API contract in project docs

---

## License

Copyright © 2025 WiHy Health Inc. All rights reserved.
