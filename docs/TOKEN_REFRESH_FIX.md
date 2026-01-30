# Token Refresh Fix

## Problem

Users staying logged in were being logged out when their JWT tokens expired because:

1. **Wrong method name called**: `apiLogger.ts` was calling `authService.refreshToken()` but the actual method is `authService.refreshAccessToken()`
2. **No automatic refresh**: Auto-refresh wasn't being enabled when users logged in
3. **No proactive refresh**: Tokens were only refreshed reactively (after 401 errors), not proactively before expiration

## Solution

### 1. Fixed API Logger Token Refresh

**File**: `mobile/src/utils/apiLogger.ts`

**Change**: Updated `refreshTokenSynchronized()` to call the correct method name:

```typescript
// BEFORE (WRONG - method doesn't exist)
const result = await authService.refreshToken?.();

// AFTER (CORRECT - actual method name)
const result = await authService.refreshAccessToken();
if (result && result.access_token) {
  console.log('[refreshTokenSynchronized] Token refreshed successfully');
  return true;
}
```

### 2. Enabled Auto-Refresh on Login

**File**: `mobile/src/context/AuthContext.tsx`

**Change**: Start auto token refresh after successful sign-in:

```typescript
const normalizedUser = normalizeUser(userData);
setUser(normalizedUser);
await saveUserData(normalizedUser);

// Enable automatic token refresh to keep user logged in
console.log('[AuthContext] Starting auto token refresh...');
await enhancedAuthService.startAutoTokenRefresh();

return normalizedUser;
```

### 3. Enabled Auto-Refresh on App Start

**File**: `mobile/src/context/AuthContext.tsx`

**Change**: Start auto token refresh when loading existing user session:

```typescript
if (sessionValid.valid && sessionValid.user) {
  const userData = await convertUserData(sessionValid.user);
  setUser(userData);
  
  // Start auto token refresh for existing session
  console.log('[AuthContext] Starting auto token refresh for existing session');
  await enhancedAuthService.startAutoTokenRefresh();
}
```

## How Token Refresh Works

### 1. Proactive Refresh (Prevents Expiration)

The `enhancedAuthService.startAutoTokenRefresh()` method:
- Checks token expiration every 5 minutes
- Refreshes tokens that will expire within 10 minutes
- Runs in the background automatically
- Prevents users from being logged out unexpectedly

```typescript
// In enhancedAuthService.ts
const REFRESH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

this.refreshInterval = setInterval(async () => {
  await this.checkAndRefreshToken();
}, REFRESH_CHECK_INTERVAL);
```

### 2. Reactive Refresh (Handles 401 Errors)

The `apiLogger.ts` automatically refreshes tokens on 401 responses:
- Detects 401 Unauthorized errors
- Calls `refreshAccessToken()` to get new token
- Retries the original request with new token
- Falls back to forcing re-login if refresh fails

```typescript
if (response.status === 401 && requiresBearerToken(url)) {
  console.log('[fetchWithLogging] Attempting token refresh after 401...');
  const refreshed = await refreshTokenSynchronized();
  
  if (refreshed) {
    // Retry with new token
    const newToken = await getStoredToken();
    // ... retry logic
  }
}
```

### 3. Refresh Token API

The `authService.refreshAccessToken()` method:
- Gets refresh token from AsyncStorage
- Calls `POST /api/auth/refresh` endpoint
- Stores new access token and refresh token
- Updates token expiry time
- Supports token rotation (new refresh token in response)

```typescript
const response = await fetchWithLogging(
  `${this.baseUrl}/api/auth/refresh`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }
);

// Store new tokens
await this.storeSessionToken(newToken);
if (newRefreshToken) {
  await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
}
```

## Token Storage

Tokens are stored in AsyncStorage:

| Key | Purpose |
|-----|---------|
| `@wihy_access_token` | JWT access token for API calls |
| `@wihy_refresh_token` | Refresh token for getting new access tokens |
| `@wihy_session_token` | Session token (legacy, same as access token) |
| `@wihy_token_expiry` | Timestamp when token expires |
| `@wihy_auto_refresh_enabled` | Flag indicating if auto-refresh is active |

## Testing

### Verify Auto-Refresh is Working

1. **Check console logs after login**:
   ```
   [AuthContext] Starting auto token refresh...
   === STARTING AUTO TOKEN REFRESH ===
   Auto token refresh started (checks every 5 minutes)
   ```

2. **Check token freshness**:
   ```
   Token is fresh, expires in: 1439 minutes
   ```

3. **Wait for refresh (or manually expire token)**:
   ```
   === AUTO TOKEN REFRESH ===
   Token expired or expiring soon, refreshing...
   === REFRESH TOKEN API CALL ===
   Token refreshed successfully
   ```

### Manual Testing

```typescript
// In React DevTools console or debug screen:

// Check if auto-refresh is enabled
const enabled = await enhancedAuthService.isAutoRefreshEnabled();
console.log('Auto-refresh enabled:', enabled); // Should be true

// Manually trigger refresh
const result = await authService.refreshAccessToken();
console.log('Refresh result:', result);

// Check token expiry
const expiryStr = await AsyncStorage.getItem('@wihy_token_expiry');
const expiry = new Date(parseInt(expiryStr));
console.log('Token expires:', expiry);
```

## Cleanup on Logout

Auto-refresh is properly stopped when user logs out:

```typescript
const signOut = async (): Promise<void> => {
  // Clean up enhanced auth features (stops auto-refresh)
  await enhancedAuthService.cleanup();
  
  // Logout from auth service
  await authService.logout();
  
  // Clear local storage
  await AsyncStorage.removeItem(STORAGE_KEY);
  
  setUser(null);
};
```

## Important Notes

1. **Refresh token must be obtained during login**: The backend must return a `refreshToken` in the login/register response
2. **Token rotation**: Backend may return a new refresh token with each refresh (recommended for security)
3. **Refresh token expiry**: If refresh token expires, user must re-authenticate
4. **Network errors**: If refresh fails due to network issues, retry logic will attempt again at next interval
5. **Background refresh**: Works even when app is in foreground; for background app states, consider using background tasks

## Backend Requirements

The auth service backend must support:

1. **POST /api/auth/login** - Returns `accessToken` and `refreshToken`
2. **POST /api/auth/refresh** - Accepts `refreshToken`, returns new `accessToken` (and optionally new `refreshToken`)
3. **JWT expiry**: Tokens should have reasonable expiry (e.g., 24 hours for access, 7-30 days for refresh)

Example login response:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGc...",
    "refreshToken": "refresh_abc123...",
    "expiresIn": "24h"
  }
}
```

Example refresh response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "refreshToken": "refresh_xyz789...",  // New refresh token (rotation)
    "expiresIn": "24h"
  }
}
```

## Files Modified

1. `mobile/src/utils/apiLogger.ts` - Fixed method name in reactive refresh
2. `mobile/src/context/AuthContext.tsx` - Added proactive auto-refresh on login and app start
3. `mobile/src/screens/CoachProfileSetup.tsx` - Added debug logging (unrelated to token refresh)

## Status

✅ **FIXED** - Token refresh now works correctly with both proactive (background) and reactive (401 response) strategies.

Users will no longer be unexpectedly logged out when tokens expire!
