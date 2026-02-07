# Mobile OAuth Backend Requirements

## Issue
Mobile OAuth login redirects to the web app (wihy.ai) instead of returning to the mobile app.

## Root Cause
The auth.wihy.ai backend is not respecting the `redirect_uri` parameter sent by the mobile client.

---

## Backend Changes Required for auth.wihy.ai

### 1. Register Mobile Redirect URI

Add `https://auth.wihy.ai/mobile/auth/callback` as an allowed redirect URI for the `wihy_native_2025` client in your OAuth configuration.

```javascript
// Example: allowed redirect URIs for wihy_native_2025 client
const allowedRedirectUris = [
  'wihy://auth/callback',                           // Native deep link
  'https://auth.wihy.ai/mobile/auth/callback',      // Universal Link (preferred)
  'https://wihy.ai/auth/callback',                  // Web callback
];
```

### 2. Create Mobile Callback Endpoint

Create a route at `GET /mobile/auth/callback` that acts as a passthrough:

```
https://auth.wihy.ai/mobile/auth/callback?session_token=xyz&provider=google&state=abc
```

**Important:** This endpoint does NOT need to render anything. The mobile app intercepts this URL via Universal Links (iOS) / App Links (Android) before it loads.

### 3. Update OAuth Flow

When the OAuth provider (Google/Facebook/Microsoft/Apple) redirects back after successful authentication:

**Current behavior (broken):**
```
User clicks "Sign in with Google"
  → Opens: https://auth.wihy.ai/api/auth/google/authorize?redirect_uri=https://auth.wihy.ai/mobile/auth/callback&...
  → Google authenticates user
  → Google redirects to: auth.wihy.ai/api/auth/google/callback
  → Backend redirects to: https://wihy.ai (WRONG - ignores redirect_uri)
```

**Required behavior:**
```
User clicks "Sign in with Google"  
  → Opens: https://auth.wihy.ai/api/auth/google/authorize?redirect_uri=https://auth.wihy.ai/mobile/auth/callback&...
  → Google authenticates user
  → Google redirects to: auth.wihy.ai/api/auth/google/callback
  → Backend checks redirect_uri parameter
  → Backend redirects to: https://auth.wihy.ai/mobile/auth/callback?session_token=JWT&provider=google&state=STATE
  → Mobile app intercepts URL via Universal Links
  → Mobile app extracts session_token and logs user in
```

### 4. Response Format

After OAuth completes successfully, redirect to the client's `redirect_uri` with these query parameters:

```
{redirect_uri}?session_token={JWT}&provider={provider}&state={state}
```

**Example:**
```
https://auth.wihy.ai/mobile/auth/callback?session_token=eyJhbGciOiJIUzI1NiIs...&provider=google&state=abc123
```

**On error:**
```
{redirect_uri}?error={error_code}&error_description={message}&state={state}
```

---

## Mobile App Configuration (Already Done)

The mobile app is already configured to handle these callbacks:

### app.json - Associated Domains
```json
{
  "ios": {
    "associatedDomains": [
      "applinks:auth.wihy.ai",
      "applinks:wihy.ai"
    ]
  }
}
```

### authService.ts - Redirect URI
```typescript
export const AUTH_CONFIG = {
  redirectUri: 'https://auth.wihy.ai/mobile/auth/callback',
  // ...
};
```

### enhancedAuthService.ts - WebBrowser callback
```typescript
const result = await WebBrowser.openAuthSessionAsync(
  authUrl,
  'https://auth.wihy.ai/mobile/auth/callback'
);
```

---

## Testing

1. Open mobile app
2. Tap Camera/Scan
3. See "Sign in to scan products" modal
4. Tap "Continue with Google"
5. Complete Google sign-in
6. **Expected:** App receives callback, user is logged in
7. **Current:** Opens wihy.ai web page instead

---

## Summary

The single key change needed on the backend:

> **Respect the `redirect_uri` parameter** sent by the mobile client and redirect there after OAuth completes, appending `session_token`, `provider`, and `state` as query parameters.
