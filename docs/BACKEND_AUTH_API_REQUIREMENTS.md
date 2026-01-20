# Backend Auth API Requirements

## 🚨 CRITICAL ISSUE: OAuth Callback Session Verification Failed

**Status:** ❌ BLOCKING - Users cannot sign in via OAuth

**Error Observed:**
```
URL: https://wihy.ai/auth/callback?session_token=eyJhb...
Message: "Sign in failed - Session verification failed"
```

**Screenshot:** User sees red X with "Session verification failed" and "Redirecting to home..."

---

## Issue Analysis

### What's Happening

1. User clicks "Sign in with Google" (or other OAuth provider)
2. Backend successfully completes OAuth flow with provider
3. Backend generates JWT `session_token` 
4. Backend redirects to: `https://wihy.ai/auth/callback?session_token=eyJhb...`
5. Frontend receives the token and calls:
   ```
   POST https://auth.wihy.ai/api/auth/verify
   Body: { "token": "eyJhb..." }
   ```
6. **Backend returns `{ success: false, valid: false }`** ← THE PROBLEM
7. Frontend shows "Session verification failed"

### Root Cause Possibilities

1. **JWT Signing Key Mismatch**
   - The key used to sign the session_token during OAuth callback differs from the key used in `/api/auth/verify`
   - Check: `JWT_SECRET` or `AUTH_SECRET` environment variable is the same across all services

2. **Token Not Stored in Database**
   - OAuth flow generates a JWT but doesn't store a corresponding session record
   - `/api/auth/verify` checks database for session but finds none

3. **Token Already Expired**
   - JWT `exp` claim is set to a very short duration
   - By the time user lands on callback page and verify is called, token is expired

4. **Wrong Token Format Expected**
   - Backend `/api/auth/verify` expects `access_token` but receives `session_token`
   - Or expects different JWT claims structure

5. **Service Not Deployed/Running**
   - The auth service `/api/auth/verify` is not responding correctly

---

## Expected Flow (Fix Required)

### OAuth Callback (Backend)
```javascript
// After successful OAuth with provider
app.get('/auth/:provider/callback', async (req, res) => {
  // 1. Exchange code for provider tokens
  const { access_token } = await exchangeCodeForTokens(req.query.code);
  
  // 2. Get user info from provider
  const providerUser = await getProviderUserInfo(access_token);
  
  // 3. Find or create user in database
  const user = await findOrCreateUser({
    email: providerUser.email,
    provider: req.params.provider,
    providerId: providerUser.id,
  });
  
  // 4. Create session in database (IMPORTANT!)
  const session = await createSession({
    userId: user.id,
    provider: req.params.provider,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
  
  // 5. Generate JWT that references the session
  const sessionToken = jwt.sign(
    {
      sub: user.id,
      sessionId: session.id,  // Link to database session
      email: user.email,
      provider: req.params.provider,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    },
    process.env.JWT_SECRET
  );
  
  // 6. Redirect to frontend with token
  const callbackUrl = `https://wihy.ai/auth/callback?session_token=${sessionToken}&provider=${req.params.provider}`;
  res.redirect(callbackUrl);
});
```

### Verify Endpoint (Backend)
```javascript
// POST /api/auth/verify
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.json({ success: false, valid: false, error: 'No token provided' });
    }
    
    // 1. Verify JWT signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 2. (Optional) Check session still exists in database
    if (decoded.sessionId) {
      const session = await getSession(decoded.sessionId);
      if (!session || session.revokedAt) {
        return res.json({ success: false, valid: false, error: 'Session revoked' });
      }
    }
    
    // 3. Get fresh user data
    const user = await getUserById(decoded.sub);
    
    if (!user) {
      return res.json({ success: false, valid: false, error: 'User not found' });
    }
    
    // 4. Return success with user data
    return res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.plan || 'free',
        avatar: user.avatar,
        provider: decoded.provider,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.json({ success: false, valid: false, error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.json({ success: false, valid: false, error: 'Invalid token' });
    }
    console.error('Verify error:', error);
    return res.json({ success: false, valid: false, error: 'Verification failed' });
  }
});
```

---

## Debugging Steps

### 1. Check JWT Token Contents
Decode the JWT from the URL (don't verify, just decode):
```javascript
// In browser console with token from URL
const token = "eyJhb...";
const [header, payload, signature] = token.split('.');
console.log(JSON.parse(atob(payload)));
```

Check:
- `sub` (user ID) - is it valid?
- `exp` (expiration) - is it in the future?
- `sessionId` - does this session exist in database?

### 2. Test Verify Endpoint Directly
```bash
curl -X POST https://auth.wihy.ai/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJhb..."}'
```

Check response - does it include an error message?

### 3. Check Environment Variables
On the auth server, verify:
```bash
echo $JWT_SECRET  # Must match across all services
echo $AUTH_SECRET # If using separate auth secret
```

### 4. Check Database Sessions
```sql
SELECT * FROM sessions 
WHERE user_id = '<user_id_from_token>' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## Frontend Code Reference

**File:** `mobile/src/screens/AuthCallbackScreen.tsx`

```typescript
// Line 111-114: Token is received and stored
await authService.storeSessionToken(params.session_token);

// Line 117: Session verification call
const session = await authService.verifySession();

// Line 119-186: If session.valid is false, error is thrown
if (session.valid && session.user) {
  // Success path
} else {
  throw new Error('Session verification failed');  // ← This is what user sees
}
```

**File:** `mobile/src/services/authService.ts`

```typescript
// Line 1027-1082: verifySession() implementation
async verifySession(): Promise<{ valid: boolean; user?: UserData }> {
  const sessionToken = await this.getSessionToken();
  
  // POST to https://auth.wihy.ai/api/auth/verify
  const response = await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({ token: sessionToken }),
  });
  
  // Returns { valid: false } if backend rejects the token
}
```

---

## Quick Fix Checklist

- [ ] Ensure `JWT_SECRET` is identical across OAuth callback service and verify service
- [ ] Ensure JWT `exp` claim is at least 1 hour in the future
- [ ] Ensure session is created in database during OAuth callback
- [ ] Ensure `/api/auth/verify` endpoint is deployed and running
- [ ] Test with `curl` to see actual error message from verify endpoint
- [ ] Check auth service logs for errors during verification

---

## Contact

Frontend files:
- `mobile/src/screens/AuthCallbackScreen.tsx`
- `mobile/src/services/authService.ts`
- `mobile/src/context/AuthContext.tsx`

Backend service: `auth.wihy.ai`
