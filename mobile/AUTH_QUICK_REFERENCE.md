# Authentication Quick Reference

## 🚀 Import & Setup

```tsx
import { useAuth } from './hooks/useAuth';
import { useApi, useFetch } from './hooks/useApi';
```

---

## 🔐 useAuth Hook

### Basic Properties
```tsx
const {
  user,                  // Current user object or null
  isAuthenticated,       // true/false
  loading,              // true during auth operations
  error                 // Error message or null
} = useAuth();
```

### Login Methods
```tsx
const { login } = useAuth();

await login.google();      // Google OAuth
await login.facebook();    // Facebook OAuth
await login.microsoft();   // Microsoft OAuth
await login.oauth2();      // Generic OAuth2
await login.local(email, password);  // Email/password
```

### Other Methods
```tsx
const { register, logout, clearError } = useAuth();

await register(email, password, name);
await logout();
clearError();  // Clear error state
```

---

## 📡 useApi Hook

### Basic Usage
```tsx
const { loading, error, execute } = useApi();

// Get request
const data = await execute(() => apiGet('/api/endpoint'));

// Post request
const result = await execute(() => apiPost('/api/endpoint', body));
```

### Convenience Methods
```tsx
const { get, post, put, patch, delete: del } = useApi();

const data = await get('/api/user/profile');
const result = await post('/api/goals', { title: 'Exercise' });
await put('/api/goals/1', { title: 'Updated' });
await patch('/api/goals/1', { done: true });
await del('/api/goals/1');
```

---

## 📊 useFetch Hook

### Load Data
```tsx
const { data, loading, error, refetch } = useFetch('/api/endpoint');

if (loading) return <Text>Loading...</Text>;
if (error) return <Text>Error</Text>;

return <Text>{data?.title}</Text>;
```

### Refresh Data
```tsx
const { refetch } = useFetch('/api/data');

return <Button onPress={refetch} title="Refresh" />;
```

---

## 🔧 Common Patterns

### Protected Component
```tsx
const MyComponent = () => {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return <Button onPress={() => login.google()} title="Sign In" />;
  }

  return <View>Content for logged in users</View>;
};
```

### Load User Data
```tsx
const UserData = () => {
  const { data: user, loading } = useFetch('/api/user/profile');

  return loading ? <Text>Loading...</Text> : <Text>{user?.name}</Text>;
};
```

### Create Item
```tsx
const CreateGoal = () => {
  const { post, loading, error } = useApi();

  const handleCreate = async (goal) => {
    try {
      const result = await post('/api/goals', { goal });
      console.log('Created:', result);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return <Button onPress={() => handleCreate('Exercise')} title="Create" />;
};
```

### Handle Errors
```tsx
const LoginForm = () => {
  const { login, error, clearError } = useAuth();

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error]);

  return <Button onPress={() => login.google()} title="Login" />;
};
```

---

## 🌐 Environment URLs

Configure in `src/config/authConfig.ts`:

```typescript
const ENV = {
  dev: {
    AUTH_BASE_URL: 'http://192.168.1.100:5000',
    API_BASE_URL: 'http://192.168.1.100:3000'
  },
  prod: {
    AUTH_BASE_URL: 'https://auth.wihy.ai',
    API_BASE_URL: 'https://api.wihy.ai'
  }
};
```

---

## 🐛 Error Handling

### Check Errors
```tsx
const { error } = useAuth();

if (error) {
  console.error('Auth error:', error);
}
```

### Common Errors
```
SESSION_EXPIRED        - User needs to log in again
INVALID_TOKEN         - Token validation failed
NETWORK_ERROR         - No internet connection
AUTH_SERVICE_DOWN     - Auth service unavailable
```

---

## 💾 Token Management

### Check if Logged In
```tsx
const { isAuthenticated } = useAuth();

if (isAuthenticated) {
  // User is logged in
}
```

### Logout
```tsx
const { logout } = useAuth();

await logout();  // Clears token and returns to login
```

### Get Token (Advanced)
```tsx
import authService from './services/auth/authService';

const token = await authService.getToken();
```

---

## 🔗 Deep Linking (Setup)

### iOS
```xml
<!-- ios/WihyApp/Info.plist -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.wihy.app</string>
    </array>
  </dict>
</array>
```

### Android
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<intent-filter>
  <data android:scheme="com.wihy.app" android:host="auth" android:pathPrefix="/callback" />
</intent-filter>
```

---

## 📝 API Request Examples

### Get User Profile
```tsx
const { get } = useApi();
const profile = await get('/api/user/profile');
// Returns: { id, email, name, ... }
```

### Create Goal
```tsx
const { post } = useApi();
const goal = await post('/api/goals', {
  title: 'Exercise 5x/week',
  duration: 30
});
// Returns: { id, title, duration, created_at, ... }
```

### Update Goal
```tsx
const { put } = useApi();
await put('/api/goals/123', {
  title: 'Exercise 6x/week'
});
```

### Delete Goal
```tsx
const { delete: del } = useApi();
await del('/api/goals/123');
```

---

## 🎯 State Flow

```
App Starts
    ↓
AuthProvider initializes
    ↓
Check stored token
    ↓
Verify token with auth service
    ↓
Set user state or stay logged out
    ↓
Component mounts
    ↓
Use useAuth() to get state
    ↓
User clicks "Sign In with Google"
    ↓
Deep link redirects back with token
    ↓
Token stored
    ↓
useAuth() updates user state
    ↓
App shows home screen
```

---

## ✅ Checklist Before Deploying

- [ ] authConfig.ts has correct URLs
- [ ] Deep linking configured on iOS
- [ ] Deep linking configured on Android
- [ ] AppNavigator shows auth/app conditional
- [ ] Login screens work
- [ ] API requests include token
- [ ] Token persists after restart
- [ ] Logout clears token
- [ ] 401 errors handled

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| useAuth not found | Check import path |
| Token not persisting | Check AsyncStorage setup |
| Deep link not working | Verify scheme matches |
| OAuth redirect loop | Check redirect_uri |
| API returns 401 | Verify token is being sent |

---

## 📚 Full Documentation

- **Quick Start**: QUICK_AUTH_INTEGRATION.md
- **Mobile Setup**: MOBILE_AUTH_IMPLEMENTATION.md
- **Complete Guide**: WIHY_AUTH_CLIENT_IMPLEMENTATION.md
- **Status**: IMPLEMENTATION_STATUS.md

---

**Save this as a reference for common auth patterns!**
