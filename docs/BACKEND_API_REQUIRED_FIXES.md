# Backend API Endpoint Comparison & Required Fixes

## Current State: Two Endpoints, Mismatched Data

### Endpoint 1: GET `/api/users/me` (User Profile)
**Current Response (INCOMPLETE):**
```json
{
    "success": true,
    "user": {
        "id": "b0130eaf-4882-4258-bbb9-66ecc5b1ebac",
        "email": "kortney@wihy.ai",
        "name": "Kortney",
        "firstName": "Kortney",
        "lastName": "Lee",
        "status": "ACTIVE",
        "provider": "google",
        "profile_data": {
            "is_developer": true
        },
        "email_verified": true,
        "last_login_at": "2026-01-20T21:45:35.496Z",
        "created_at": "2026-01-05T18:18:34.471Z"
    }
}
```

**Problem:** Missing 7 critical fields for plan switching to work

---

### Endpoint 2: POST `/api/auth/verify` (Access Verification)
**Current Response (COMPLETE):**
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
        "role": "ADMIN",              // ← Present
        "status": "ACTIVE",
        "plan": "free",               // ← Present
        "planStatus": "active",       // ← Present
        "avatar": "https://..."
    }
}
```

**Good:** Has role and plan, but only used on auth (not accessible to profile screen)

---

## What the Frontend Needs

### TypeScript Interfaces (Source of Truth)

**UserData** (from `/api/auth/verify`):
```typescript
export interface UserData {
  id: string;
  email: string;
  name: string;
  role?: 'user' | 'premium' | 'family-basic' | 'family-pro' | 'coach' | 'employee' | 'admin' | string;
  status?: 'active' | 'inactive' | 'suspended' | 'pending' | string;
  provider?: 'local' | 'google' | 'facebook' | 'microsoft' | 'apple';
  avatar?: string | null;
  profile_data?: any;
  
  // CRITICAL FOR PLAN SWITCHING:
  plan?: string;                    // 'free', 'premium', 'family-basic', etc.
  planStatus?: 'active' | 'trial' | 'expired' | 'cancelled';
  addOns?: string[];                // ['ai', 'instacart']
  capabilities?: Capabilities;      // Computed from plan + addOns
  
  // CRITICAL FOR DEVELOPER ACCESS:
  // (profile_data.is_developer OR role === 'admin')
  
  // Additional fields needed:
  healthScore?: number;
  streakDays?: number;
  memberSince?: string;
  
  // Family/Coach/Organization:
  familyId?: string | null;
  familyRole?: 'owner' | 'guardian' | 'member' | 'child' | null;
  coachId?: string | null;
  organizationId?: string | null;
}
```

**UserProfile** (from `/api/users/me` - currently incomplete):
```typescript
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'local' | 'google' | 'facebook' | 'microsoft';
  
  // CURRENTLY MISSING - MUST ADD:
  plan: string;                     // ← MISSING
  addOns?: string[];                // ← MISSING
  role?: string;                    // ← MISSING
  status?: string;                  // ← MISSING
  capabilities: UserCapabilities;   // ← MISSING
  
  // Already present (good):
  familyId?: string;
  familyRole?: string;
  guardianCode?: string;
  organizationId?: string;
  organizationRole?: string;
  coachId?: string;
  commissionRate?: number;
  healthScore?: number;
  streakDays?: number;
  memberSince?: string;
  preferences?: UserPreferences;
}
```

---

## Exact Changes Required (Backend)

### GET `/api/users/me` Response

**Before (Current - INCOMPLETE):**
```json
{
    "success": true,
    "user": {
        "id": "b0130eaf-4882-4258-bbb9-66ecc5b1ebac",
        "email": "kortney@wihy.ai",
        "name": "Kortney",
        "firstName": "Kortney",
        "lastName": "Lee",
        "status": "ACTIVE",
        "provider": "google",
        "profile_data": {
            "is_developer": true
        },
        "email_verified": true,
        "last_login_at": "2026-01-20T21:45:35.496Z",
        "created_at": "2026-01-05T18:18:34.471Z"
    }
}
```

**After (Fixed - Add 7 fields):**
```json
{
    "success": true,
    "user": {
        "id": "b0130eaf-4882-4258-bbb9-66ecc5b1ebac",
        "email": "kortney@wihy.ai",
        "name": "Kortney",
        "firstName": "Kortney",
        "lastName": "Lee",
        "status": "ACTIVE",
        "provider": "google",
        
        "role": "ADMIN",                    // ← ADD (from users table)
        "plan": "free",                    // ← ADD (from subscription table)
        "planStatus": "active",            // ← ADD (from subscription table)
        "addOns": ["ai", "instacart"],     // ← ADD (from addons table, can be empty [])
        
        "profile_data": {
            "is_developer": true,
            "capabilities": {              // ← ADD (computed from plan + addOns)
                "meals": true,
                "workouts": true,
                "family": true,
                "coachPlatform": true,
                "wihyAI": true,
                "instacart": true,
                "adminDashboard": true,
                "usageAnalytics": true,
                "roleManagement": true,
                "whiteLabel": true
            }
        },
        
        "email_verified": true,
        "last_login_at": "2026-01-20T21:45:35.496Z",
        "created_at": "2026-01-05T18:18:34.471Z"
    }
}
```

---

## Why These Fields Matter

### 1. **role** (User's access tier)
**Used by:**
- `AuthContext.convertUserData()` - Determines plan override
- `DevPlanSwitcher` - Shows only if role === 'admin'
- Plan switching logic

**How it works:**
```typescript
// In AuthContext
const normalizedRole = authUser.role?.toLowerCase().replace('_', '-');
const plan = getPlanFromRole(normalizedRole, authUser.plan);

// role: 'ADMIN' → normalizedRole: 'admin' → plan: 'admin'
// role: 'EMPLOYEE' → normalizedRole: 'employee' → plan: 'coach-family'
```

### 2. **plan** (Current subscription tier)
**Used by:**
- `hasFamilyAccess()` - Checks if user can see family dashboard
- `hasCoachAccess()` - Checks if user can see coach dashboard
- Profile screen - Shows correct subscription tier
- Paywall logic - Determines which features to gate

**Example:**
```typescript
// In capabilities.ts
export const hasFamilyAccess = (user: User | null): boolean => {
  return Boolean(user?.capabilities?.family);
};

// Which depends on:
const capabilities = getPlanCapabilities(user.plan, user.addOns);
// plan: 'free' → family: false
// plan: 'family-pro' → family: true
```

### 3. **planStatus** (Subscription status)
**Used by:**
- Checking if subscription is active vs expired
- Payment flow - Determines if user needs to renew
- Feature access - Blocks access if trial expired

### 4. **addOns** (Optional feature list)
**Used by:**
- AI Coach feature access
- Instacart integration
- Feature availability detection

**Example:**
```typescript
// If plan is 'premium' but no addOns, AI not available
// If plan is 'premium' and addOns includes 'ai', AI is available
const hasAI = user.capabilities.wihyAI;
```

### 5. **capabilities** (Computed access control)
**Used by:**
- Every component that checks feature access
- Dashboard visibility (personal, family, coach, admin)
- Feature gates and paywalls

**Computed from:**
```typescript
const capabilities = getPlanCapabilities(
  plan,      // e.g., 'admin', 'family-pro', 'free'
  addOns     // e.g., ['ai', 'instacart']
);
```

### 6. **profile_data.is_developer** (Developer flag)
**Used by:**
- `DevPlanSwitcher` visibility check
- Dev tool access
- Feature flags for testing

**Check:**
```typescript
const canUseDevTools = __DEV__ || 
    user?.isDeveloper || 
    user?.profile_data?.is_developer || 
    user?.role === 'admin';
```

### 7. **healthScore, streakDays, memberSince**
**Used by:**
- Profile header display (on native app)
- User stats dashboard
- Gamification UI

---

## How Frontend Uses These Endpoints

### Flow 1: Initial Auth
```
User logs in
    ↓
/api/auth/verify (POST)
    ↓
Backend returns: role, plan, planStatus, addOns
    ↓
convertUserData() computes capabilities
    ↓
AuthContext.user has plan/role/capabilities
    ↓
Profile screen loads, uses user context
```

### Flow 2: User Opens Profile (Currently Broken)
```
Profile screen mounts
    ↓
Calls getUserProfile() → /api/users/me (GET)
    ↓
✅ Backend returns role, plan, planStatus, addOns
    ↓
Uses these to determine subscription status
    ↓
Can properly show "Upgrade to Premium" or "Family Plan active"
    ↓
DevPlanSwitcher can read user.isDeveloper from profile_data
```

---

## Integration Points in Frontend Code

### Profile.tsx
```typescript
// Line 228: Checks plan to determine dev mode
const isDevMode = __DEV__ || user?.plan === 'corporate-enterprise' || user?.plan === 'workplace-plus';

// Uses:
// - user.plan (NOT AVAILABLE - /api/users/me missing it)
// - user.capabilities (NOT AVAILABLE - /api/users/me missing it)
```

### AuthContext.tsx
```typescript
// Line 188-204: Determines plan from role
const normalizedRole = roleFromServer?.toLowerCase().replace('_', '-');
const plan = getPlanFromRole(normalizedRole, authUser.plan);
const capabilities = getPlanCapabilities(plan, addOns);

// Uses:
// - authUser.role (AVAILABLE from /api/auth/verify, MISSING from /api/users/me)
// - authUser.plan (AVAILABLE from /api/auth/verify, MISSING from /api/users/me)
// - authUser.addOns (NOT AVAILABLE from either)
// - authUser.capabilities (NOT AVAILABLE from either)
```

### HealthHub.tsx & Dashboards
```typescript
// Line 55-56: Checks feature access
const canAccessFamily = hasFamilyAccess(user);
const canAccessCoach = hasCoachAccess(user);

// Depends on:
// user.capabilities.family
// user.capabilities.coachPlatform
```

---

## Testing the Fix

### Before Fix
```bash
# Profile screen loads, but:
# ❌ user.plan is undefined
# ❌ user.role is undefined
# ❌ user.capabilities is undefined
# ❌ Dashboards don't switch based on plan
# ❌ Can't tell what subscription user has
```

### After Fix
```bash
# Profile screen loads:
# ✅ user.plan = "free" (from /api/users/me)
# ✅ user.role = "ADMIN" (from /api/users/me)
# ✅ user.capabilities = {...} (from /api/users/me)
# ✅ Dashboards switch based on plan
# ✅ Shows correct subscription tier
# ✅ DevPlanSwitcher visible (isDeveloper from profile_data)
```

---

## Backend Implementation Checklist

### GET `/api/users/me` Response

- [ ] **Add role field**
  ```sql
  SELECT role FROM users WHERE id = user_id
  ```

- [ ] **Add plan field**
  ```sql
  SELECT plan FROM subscriptions WHERE user_id = user_id AND active = true
  ```

- [ ] **Add planStatus field**
  ```sql
  SELECT status FROM subscriptions WHERE user_id = user_id AND active = true
  ```

- [ ] **Add addOns field**
  ```sql
  SELECT array_agg(addon_type) FROM user_addons WHERE user_id = user_id AND active = true
  ```

- [ ] **Add profile_data.capabilities** (computed)
  ```typescript
  // Compute using same logic as /api/auth/verify
  capabilities = computeCapabilities(plan, addOns)
  ```

- [ ] **Keep existing fields**
  - email_verified
  - last_login_at
  - created_at
  - profile_data.is_developer

### POST `/api/auth/verify` Response (Keep as-is)
- Already correct ✅

---

## Response Mapping

### Database to API

| Backend Field | API Field | Endpoint | Example Value |
|---------------|-----------|----------|---|
| users.role | user.role | Both | "ADMIN" |
| subscriptions.plan | user.plan | Both | "free" |
| subscriptions.status | user.planStatus | Both | "active" |
| user_addons.addon_type (array) | user.addOns | Both | ["ai", "instacart"] |
| (computed) | profile_data.capabilities | Both | {meals: true, ...} |
| profile_data.is_developer | profile_data.is_developer | Both | true |
| users.health_score | user.healthScore | /api/users/me | 85 |
| users.streak_days | user.streakDays | /api/users/me | 42 |
| users.created_at | user.memberSince | /api/users/me | "January 2024" |

---

## Code Changes Needed (Frontend) - After Backend Fix

### authService.ts - convertUserData() Logic
Already ready once backend returns the data:

```typescript
const role = authUser.role?.toLowerCase().replace('_', '-');
const plan = getPlanFromRole(role, authUser.plan);
const capabilities = getPlanCapabilities(plan, authUser.addOns || []);
```

### Profile.tsx - Plan Display
Will automatically work:

```typescript
// Can now check user.plan from /api/users/me
if (user?.plan === 'free') {
  // Show upgrade prompt
}
```

### HealthHub.tsx - Dashboard Access
Will automatically work:

```typescript
// Can now check user.capabilities
const canAccessFamily = hasFamilyAccess(user);  // reads user.capabilities.family
```

---

## Summary: What Backend Must Fix

### Single Fix Needed:
**GET `/api/users/me` must return the same user data as POST `/api/auth/verify`**

### Currently Returns (8 fields):
- id, email, name, firstName, lastName, status, provider, profile_data.is_developer

### Must Also Return (7 more fields):
- **role** - User's tier (ADMIN, EMPLOYEE, COACH, FAMILY-PRO, FAMILY-BASIC, PREMIUM, USER)
- **plan** - Subscription tier (admin, coach-family, coach, family-pro, family-basic, premium, free)
- **planStatus** - Subscription status (active, trial, expired, cancelled)
- **addOns** - Array of active addons (["ai"], ["instacart"], ["ai", "instacart"], etc.)
- **profile_data.capabilities** - Computed from plan + addOns (see /api/auth/verify for format)
- **healthScore** - User's health score (0-100)
- **streakDays** - Current streak days (number)

### Result:
Once backend returns these fields from `/api/users/me`, the frontend will automatically:
1. ✅ Show correct subscription tier
2. ✅ Display accessible dashboards (personal, family, coach, admin)
3. ✅ Enable/disable features based on plan
4. ✅ Show DevPlanSwitcher for developers
5. ✅ Switch behavior when user changes plan

All frontend code already handles this correctly - it just needs the data from the backend!
