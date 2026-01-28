# Token Refresh & Session Management Strategy

## Problem Statement

After deployments, users were experiencing 401 errors across all services because:
1. API clients were **not attempting token refresh** on 401 errors
2. Tokens were being immediately cleared without retry
3. No unified session state management across requests

## Solution Implemented

### 1. Token Refresh on 401 (Implemented)

All API clients now follow this flow on 401 errors:

```
401 Error
  ↓
Try Refresh Token
  ↓
  ├─ Success → Retry Original Request
  │              ↓
  │              ├─ Success → Return Data
  │              └─ Fail → Clear Tokens & Logout
  │
  └─ Fail → Clear Tokens & Logout
```

**Files Updated:**
- `userApiClient.ts` - Now refreshes on 401
- `servicesApiClient.ts` - Now refreshes on 401  
- `apiClient.ts` - Already had refresh logic (confirmed)

### 2. Current Token Flow

#### Storage Locations
```typescript
STORAGE_KEYS = {
  SESSION_TOKEN: '@wihy_session_token',    // Primary JWT
  ACCESS_TOKEN: '@wihy_access_token',       // OAuth access token
  REFRESH_TOKEN: '@wihy_refresh_token',     // Long-lived refresh token
  TOKEN_EXPIRY: '@wihy_token_expiry',       // Expiration timestamp
}
```

#### Token Refresh Endpoint
```
POST https://auth.wihy.ai/api/auth/refresh
Headers:
  x-client-id: wihy_native_2025
  Content-Type: application/json
Body:
  { "refreshToken": "<refresh_token>" }

Response:
{
  "success": true,
  "data": {
    "token": "<new_session_token>",
    "refreshToken": "<new_refresh_token>",  // Token rotation
    "expiresIn": 86400  // 24 hours
  }
}
```

## Redis for Session State - Analysis

### Question: "Will calling into Redis work?"

**YES** - Redis can significantly improve session management, but it requires backend changes.

### Current Architecture (Client-Side Only)
```
Mobile App → AsyncStorage (local only)
  ↓
API Request with JWT
  ↓
Backend verifies JWT signature
```

**Problems:**
- No centralized session state
- Can't invalidate sessions server-side
- Tokens persist even after server restart
- No cross-device synchronization

### Recommended Architecture (Redis-Enhanced)

```
Mobile App → AsyncStorage (cache)
  ↓
API Request with JWT
  ↓
Backend → Redis Session Store
  ├─ Validate JWT signature
  ├─ Check Redis for session validity
  ├─ Check expiration
  └─ Check if session was revoked
```

### Redis Implementation Benefits

#### 1. **Session Revocation**
```typescript
// Backend can instantly revoke sessions
await redis.del(`session:${sessionId}`);
await redis.sadd(`revoked_tokens:${userId}`, sessionId);
```

#### 2. **Cross-Device Session Management**
```typescript
// Track all user sessions
await redis.sadd(`user_sessions:${userId}`, sessionId);

// Logout from all devices
const sessions = await redis.smembers(`user_sessions:${userId}`);
await Promise.all(sessions.map(s => redis.del(`session:${s}`)));
```

#### 3. **Deployment-Safe Token Refresh**
```typescript
// Store refresh tokens in Redis with TTL
await redis.setex(
  `refresh_token:${userId}:${tokenId}`,
  604800,  // 7 days
  refreshToken
);

// On deployment, Redis persists sessions
// Mobile apps can refresh seamlessly
```

#### 4. **Rate Limiting & Abuse Prevention**
```typescript
// Track failed refresh attempts
const attempts = await redis.incr(`refresh_attempts:${userId}`);
await redis.expire(`refresh_attempts:${userId}`, 300); // 5 min window

if (attempts > 5) {
  throw new Error('Too many refresh attempts');
}
```

### Redis Schema Recommendation

```typescript
// Session data (30 min TTL, refreshed on activity)
session:{sessionId} → {
  userId: string,
  deviceId: string,
  createdAt: timestamp,
  lastActivity: timestamp,
  ip: string
}

// Refresh tokens (7 day TTL)
refresh_token:{userId}:{tokenId} → {
  token: string,
  sessionId: string,
  expiresAt: timestamp
}

// User sessions index
user_sessions:{userId} → Set[sessionId1, sessionId2, ...]

// Revoked sessions (persist until original expiry)
revoked_sessions → Set[sessionId1, sessionId2, ...]

// Rate limiting
refresh_attempts:{userId} → counter (5 min TTL)
```

### Backend Changes Required

#### 1. Update Auth Service (`auth.wihy.ai`)

**File: `/api/auth/refresh` endpoint**
```typescript
async function refreshToken(req, res) {
  const { refreshToken } = req.body;
  
  // 1. Verify refresh token signature
  const payload = jwt.verify(refreshToken, JWT_SECRET);
  
  // 2. Check Redis for validity
  const stored = await redis.get(`refresh_token:${payload.userId}:${payload.tokenId}`);
  if (!stored || stored !== refreshToken) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
  
  // 3. Check if session was revoked
  const revoked = await redis.sismember('revoked_sessions', payload.sessionId);
  if (revoked) {
    return res.status(401).json({ error: 'Session revoked' });
  }
  
  // 4. Generate new tokens
  const newSessionToken = jwt.sign({ userId: payload.userId, sessionId: payload.sessionId }, JWT_SECRET, { expiresIn: '24h' });
  const newRefreshToken = jwt.sign({ userId: payload.userId, tokenId: uuidv4(), sessionId: payload.sessionId }, JWT_SECRET, { expiresIn: '7d' });
  
  // 5. Store new refresh token (token rotation)
  await redis.setex(`refresh_token:${payload.userId}:${newTokenId}`, 604800, newRefreshToken);
  
  // 6. Delete old refresh token
  await redis.del(`refresh_token:${payload.userId}:${payload.tokenId}`);
  
  // 7. Update session activity
  await redis.setex(`session:${payload.sessionId}`, 1800, JSON.stringify({
    userId: payload.userId,
    lastActivity: Date.now()
  }));
  
  res.json({
    success: true,
    data: {
      token: newSessionToken,
      refreshToken: newRefreshToken,
      expiresIn: 86400
    }
  });
}
```

#### 2. Add Session Cleanup Job

```typescript
// Run every hour
async function cleanExpiredSessions() {
  const sessions = await redis.keys('session:*');
  
  for (const key of sessions) {
    const session = await redis.get(key);
    if (session) {
      const data = JSON.parse(session);
      const inactiveDuration = Date.now() - data.lastActivity;
      
      // Auto-expire if inactive for 7 days
      if (inactiveDuration > 7 * 24 * 60 * 60 * 1000) {
        await redis.del(key);
        await redis.srem(`user_sessions:${data.userId}`, data.sessionId);
      }
    }
  }
}
```

### Client-Side Changes (Minimal)

The mobile app changes are **already complete**. The Redis changes are purely backend.

Additional optimization (optional):
```typescript
// In authService.ts - add retry with exponential backoff
async refreshAccessToken(retryCount = 0): Promise<TokenResponse | null> {
  try {
    // ... existing refresh logic ...
  } catch (error) {
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.refreshAccessToken(retryCount + 1);
    }
    return null;
  }
}
```

## Testing Checklist

### Before Deployment
- [ ] Test token refresh on 401 (all API clients)
- [ ] Test with expired token
- [ ] Test with invalid refresh token
- [ ] Test multiple simultaneous 401s (race condition)
- [ ] Test after app restart

### After Backend Redis Integration
- [ ] Test session revocation (logout from one device affects another)
- [ ] Test token refresh during deployment
- [ ] Test rate limiting (5 failed refreshes = block)
- [ ] Monitor Redis memory usage
- [ ] Set up Redis backup/persistence

## Monitoring Recommendations

### Metrics to Track
1. **Token refresh success rate**
   - Target: >99% for valid refresh tokens
2. **401 error rate**
   - Should decrease significantly after this fix
3. **Redis session count**
   - Monitor for memory leaks
4. **Failed refresh attempts**
   - Alert on unusual spikes (potential attack)

### Logging
```typescript
// Add to auth service
logger.info('token_refresh', {
  userId,
  success: true/false,
  reason: 'expired' | 'revoked' | 'invalid',
  clientVersion: req.headers['x-app-version'],
  platform: 'ios' | 'android' | 'web'
});
```

## Migration Plan

### Phase 1: Client-Side Improvements (✅ COMPLETE)
- Add token refresh to userApiClient
- Add token refresh to servicesApiClient
- Verify apiClient refresh logic

### Phase 2: Backend Redis Integration (RECOMMENDED)
1. Set up Redis cluster (or use managed Redis)
2. Update `/api/auth/refresh` endpoint
3. Add session storage on login
4. Add cleanup jobs
5. Deploy with gradual rollout

### Phase 3: Advanced Features (OPTIONAL)
- Cross-device session management UI
- "Logout from all devices" button
- Session activity log
- Suspicious activity detection

## Summary

**Immediate Fix (✅ Done):**
- All API clients now attempt token refresh on 401
- Users won't get logged out unnecessarily after deployments

**Recommended Enhancement (Backend):**
- Integrate Redis for centralized session state
- Enables session revocation, cross-device management
- Improves security and user experience
- Requires backend deployment

The Redis integration is **highly recommended** but not required for the immediate 401 fix.
