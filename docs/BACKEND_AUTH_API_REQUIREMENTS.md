# Backend Auth API Requirements

## ✅ RESOLVED: OAuth Session Verification Working

**Status:** ✅ FIXED - OAuth sign-in now working correctly

**Backend Response (Verified Working):**
```json
{
  "valid": true,
  "success": true,
  "user": {
    "id": "b0130eaf-4882-4258-bbb9-66ecc5b1ebac",
    "email": "kortney@wihy.ai",
    "name": "Kortney",
    "firstName": "Kortney",
    "lastName": "Lee",
    "role": "ADMIN",
    "status": "ACTIVE",
    "plan": "free",
    "planStatus": "active",
    "avatar": "https://..."
  },
  "tokenValid": true
}
```

---

## Role-Based Access Control

### User Roles

```typescript
export type UserRole = 
  | 'user'         // Standard user
  | 'coach'        // Coach with client management
  | 'admin'        // Full system admin
  | 'family-admin'; // Family plan administrator
```

### How Roles Map to Dashboard Access

The frontend uses the `role` field from the backend to determine user access:

| Role from Backend | Normalized | Plan Override | Available Dashboards |
|-------------------|------------|---------------|---------------------|
| `ADMIN` / `admin` | `admin` | `admin` | Personal, Family, Coach, Admin |
| `FAMILY-ADMIN` / `family-admin` | `family-admin` | `family-pro` | Personal, Family |
| `coach` | `coach` | (uses backend `plan`) | Personal, Coach |
| `user` | `user` | (uses backend `plan`) | Based on plan |

### Admin Role Behavior

When `role: "ADMIN"` is returned from the backend:

1. **Role normalized** to lowercase: `ADMIN` → `admin`
2. **Plan overridden** to `admin` (ignores backend `plan: "free"`)
3. **Capabilities computed** with full access:
   - ✅ `meals: true`
   - ✅ `workouts: true`
   - ✅ `family: true` (10 members)
   - ✅ `coachPlatform: true`
   - ✅ `wihyAI: true`
   - ✅ `adminDashboard: true`
   - ✅ All other features enabled

### Key Files

| File | Purpose |
|------|---------|
| [capabilities.ts](../mobile/src/utils/capabilities.ts) | Plan/role → capabilities mapping |
| [AuthContext.tsx](../mobile/src/context/AuthContext.tsx) | Role normalization, plan override |
| [HealthHub.tsx](../mobile/src/screens/HealthHub.tsx) | Dashboard access checks |

### Capability Functions

```typescript
// Check dashboard access
import { hasFamilyAccess, hasCoachAccess, hasAdminAccess } from '../utils/capabilities';

// Returns true for admin users
hasFamilyAccess(user);  // user.capabilities.family
hasCoachAccess(user);   // user.capabilities.coachPlatform  
hasAdminAccess(user);   // user.capabilities.adminDashboard

// Get list of available dashboards
getAvailableDashboards(user);  // ['personal', 'family', 'coach', 'admin']
```

---

## Frontend Implementation (Deployed Jan 2026)

The frontend includes resilience features:
- ✅ **Retry with exponential backoff** (2 retries: 500ms, 1000ms delays)
- ✅ **JWT fallback mode** - If `/api/auth/verify` fails, frontend decodes JWT payload
- ✅ **Client-side expiration check** - Fails fast if token is expired
- ✅ **User-friendly error messages** - Clear messages for different failure types
- ✅ **Role/Status normalization** - Converts `ADMIN` → `admin`, `ACTIVE` → `active`
- ✅ **Skip onboarding on web** - OnboardingFlow only shows on native (iOS/Android)
- ✅ **Initializing state** - Prevents PlansModal from showing during auth load

---

## Backend Response Format (For Reference)

### POST /api/auth/verify
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

### Backend Team (auth.wihy.ai)
- [ ] **Verify JWT_SECRET consistency** - Same key in OAuth callback and /api/auth/verify
- [ ] **Fix /api/auth/verify** - Must return `{ success: true, valid: true, user: {...} }`
- [ ] **Include `plan` in user response** - Default to `"free"` for new users
- [ ] **Include `plan` in JWT payload** - Enables frontend fallback to work correctly
- [ ] **Set reasonable JWT expiration** - At least 1 hour, recommend 7 days
- [ ] **Test with curl** - Verify endpoint responds correctly
- [ ] **Check service logs** - Look for errors during verification

### Testing Commands
```bash
# Test verify endpoint directly
curl -X POST https://auth.wihy.ai/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_JWT_TOKEN_HERE"}'

# Decode JWT to check contents (no verification)
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq .
```

### Frontend (Already Deployed ✅)
- [x] Retry with exponential backoff (2 retries)
- [x] JWT fallback when verify fails
- [x] Client-side expiration check
- [x] User-friendly error messages
- [x] `initializing` state prevents premature UI blocking

---

## Contact

Frontend files:
- `mobile/src/screens/AuthCallbackScreen.tsx`
- `mobile/src/services/authService.ts`
- `mobile/src/context/AuthContext.tsx`

Backend service: `auth.wihy.ai`
