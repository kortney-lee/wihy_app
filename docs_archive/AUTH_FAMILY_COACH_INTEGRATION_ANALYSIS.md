# Auth, Family, and Coach Integration Analysis
**Date:** January 19, 2026  
**Status:** Critical Integration Gaps Found

---

## Executive Summary

**FINDING:** Auth system is NOT properly integrated with Family and Coach platforms. Critical data missing from user authentication flow.

### Critical Issues:
1. ❌ **Family data not populated on login/registration**
2. ❌ **Coach data not populated on login/registration**
3. ❌ **Capabilities computed client-side from hardcoded defaults**
4. ❌ **User profile endpoint doesn't return family/coach IDs**
5. ⚠️ **Plan stored locally, not synced from backend**

---

## Current Architecture

### 1. Auth Flow (Login/Registration)

**File:** `mobile/src/services/authService.ts`

#### Login Response Structure:
```typescript
interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    user: UserData;
    token: string;
    refreshToken?: string;
    expiresIn: string;
  };
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role?: 'user' | 'coach' | 'admin';
  provider?: 'local' | 'google' | 'facebook' | 'microsoft' | 'apple';
  // Health fields...
  
  // ❌ MISSING:
  // familyId?: string;
  // familyRole?: 'owner' | 'member';
  // coachId?: string;
  // plan?: string;
  // capabilities?: Capabilities;
}
```

**Problem:** Backend returns only basic user data. Family and coach relationships are NOT included.

---

### 2. User Context (AuthContext)

**File:** `mobile/src/context/AuthContext.tsx`

#### User Interface:
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  
  // Plan-based access control
  plan: 'free' | 'premium' | 'family-basic' | 'family-pro' | 'coach' | ...;
  addOns?: string[];
  capabilities: Capabilities;
  
  // Family info ⚠️ STORED LOCALLY ONLY
  familyId?: string;
  familyRole?: 'owner' | 'member';
  guardianCode?: string;
  
  // Coach info ⚠️ STORED LOCALLY ONLY
  coachId?: string;
  commissionRate?: number;
  
  // Organization info ⚠️ STORED LOCALLY ONLY
  organizationId?: string;
  organizationRole?: 'admin' | 'user' | 'student' | 'employee';
}
```

**Problem:** These fields are populated from local storage, NOT from backend on login.

---

### 3. How Family/Coach Data Gets Set

#### Current Flow (BROKEN):
```typescript
// AuthContext.tsx line 157-206
const convertUserData = async (authUser: UserData): Promise<User> => {
  // Get existing data from local storage
  const storedData = await AsyncStorage.getItem(STORAGE_KEY);
  const existingData = storedData ? JSON.parse(storedData) : null;
  
  // ❌ PROBLEM: Using hardcoded defaults or stale local data
  const plan = existingData?.plan || 'free';
  const addOns = existingData?.addOns || [];
  const capabilities = getPlanCapabilities(plan, addOns);
  
  return {
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    plan,
    addOns,
    capabilities,
    
    // ❌ PROBLEM: These come from local storage, not from server
    familyId: existingData?.familyId,
    familyRole: existingData?.familyRole,
    guardianCode: existingData?.guardianCode,
    coachId: existingData?.coachId,
    commissionRate: existingData?.commissionRate,
  };
};
```

**Issue:** User logs in on new device → No family/coach data because it's not in local storage!

---

### 4. Auth Service Endpoints

**File:** `mobile/src/services/authService.ts` lines 40-95

#### Family Endpoints (EXIST but UNUSED on login):
```typescript
endpoints: {
  // Families
  families: '/api/families',
  familyDetails: '/api/families',
  updateFamily: '/api/families',
  joinFamily: '/api/families/join',
  removeFamilyMember: '/api/families',
  listFamilyMembers: '/api/families',
  guardianCode: '/api/families',
  regenerateCode: '/api/families',
  leaveFamily: '/api/families/leave',
  
  // Coaches
  coaches: '/api/coaches',
  coachDetails: '/api/coaches',
  updateCoach: '/api/coaches',
  addClient: '/api/coaches',
  removeClient: '/api/coaches',
  listClients: '/api/coaches',
  coachRevenue: '/api/coaches',
  connectStripe: '/api/coaches',
  payoutHistory: '/api/coaches',
  
  // User Capabilities
  userCapabilities: '/api/users/me/capabilities',
}
```

**Problem:** These endpoints exist, but are NOT called during login flow to populate user context.

---

### 5. getUserProfile Method

**File:** `mobile/src/services/authService.ts` line 1249

```typescript
async getUserProfile(): Promise<UserProfile | null> {
  const token = await this.getSessionToken();
  if (!token) {
    console.log('[Auth] No session token - cannot get profile');
    return null;
  }

  const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.userProfile}`;
  
  try {
    const response = await fetchWithLogging(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
      provider: data.provider,
      plan: data.plan,
      addOns: data.addOns || [],
      capabilities: data.capabilities,
      
      // ❌ MISSING - Should be returned from backend:
      // familyId: data.familyId,
      // familyRole: data.familyRole,
      // guardianCode: data.guardianCode,
      // coachId: data.coachId,
      // commissionRate: data.commissionRate,
      // organizationId: data.organizationId,
      // organizationRole: data.organizationRole,
    };
  } catch (error) {
    console.error('[Auth] Error fetching user profile:', error);
    return null;
  }
}
```

---

### 6. Capabilities System

**File:** `mobile/src/utils/capabilities.ts`

#### How Capabilities Are Computed:
```typescript
// Line 310
export const getPlanCapabilities = (
  plan: string,
  addOns: string[] = []
): Capabilities => {
  // ❌ PROBLEM: Uses hardcoded plan definitions
  const base = { ...(PLAN_CAPABILITIES[plan] || PLAN_CAPABILITIES.free) };
  
  // Apply add-ons
  if (addOns.includes('ai')) {
    base.wihyAI = true;
  }
  if (addOns.includes('instacart')) {
    base.instacart = true;
  }
  
  return base;
};
```

**Problem:** Capabilities are computed client-side from hardcoded matrix. Should come from backend.

---

## Integration Gaps

### Gap 1: Login/Registration Not Returning Full User Context

**Current Behavior:**
```
User logs in → Backend returns basic UserData
             → Client converts to User with local storage fallback
             → familyId, coachId, plan all from local storage
```

**Expected Behavior:**
```
User logs in → Backend returns FULL user context:
               {
                 id, email, name, plan, addOns,
                 familyId, familyRole, guardianCode,
                 coachId, commissionRate,
                 organizationId, organizationRole,
                 capabilities
               }
             → Client uses backend data as source of truth
             → Local storage only for offline access
```

---

### Gap 2: No Family/Coach Context Refresh

**Problem:**
1. User creates family → familyService creates family
2. familyService returns familyId
3. **BUT:** User context (AuthContext) is not updated!
4. User must restart app or manually update context

**Example:**
```typescript
// FamilyCreation.tsx (hypothetical)
const createFamily = async () => {
  const result = await familyService.createFamily({
    name: 'Smith Family',
    creatorId: user.id
  });
  
  // ❌ PROBLEM: User context not updated with familyId
  // Need to manually call:
  await updateUser({ 
    familyId: result.family_id,
    familyRole: 'owner',
    guardianCode: result.guardian_code 
  });
};
```

---

### Gap 3: Capabilities Not Synced from Backend

**Problem:**
- Plan changes (upgrade/downgrade) happen on backend
- Capabilities computed client-side from outdated plan
- User doesn't see new features until app restart

**Example:**
```
User upgrades from free → premium on web
↓
Backend updates user.plan = 'premium'
↓
Mobile app still shows 'free' because:
  - AuthContext.user.plan is from local storage
  - No sync mechanism to refresh from backend
↓
User can't access premium features until logout/login
```

---

### Gap 4: Multiple Sources of Truth

**Current State:**
- **Backend:** User table has plan, family_id, coach_id, organization_id
- **Client Local Storage:** User object with same fields
- **Client Hardcoded:** PLAN_CAPABILITIES matrix

**Issues:**
1. Data can be out of sync
2. No authoritative source
3. Offline vs. online behavior differs
4. Security risk (client can edit local storage)

---

## How Coach and Family SHOULD Work Together

### Ideal Flow: Coach Creates Family

**Scenario:** Coach wants to invite their own family members

```
1. Coach logs in
   ↓ Backend returns:
   {
     id: 'coach_123',
     plan: 'coach-family',
     coachId: 'coach_123',
     capabilities: { coachPlatform: true, family: true, ... }
   }

2. Coach creates family
   ↓ POST /api/families
   {
     name: 'Coach Smith Family',
     creatorId: 'coach_123'
   }
   ↓ Backend creates family, updates user record:
   UPDATE users SET family_id = 'family_456' WHERE id = 'coach_123'
   ↓ Returns:
   {
     family_id: 'family_456',
     guardian_code: 'WIHY-ABC123'
   }

3. ❌ CURRENT: Client manually updates context
   await updateUser({ familyId: 'family_456', ... })

4. ✅ SHOULD BE: Backend includes in response + auto-refresh
   - Response includes updated user object
   - Client refreshes context automatically
   - OR: Use WebSocket/polling to detect changes
```

---

### Ideal Flow: Family Member Becomes Coach

**Scenario:** Parent with family plan decides to become a coach

```
1. User has family-pro plan
   User context:
   {
     id: 'user_123',
     plan: 'family-pro',
     familyId: 'family_456',
     familyRole: 'owner',
     coachId: null,
     capabilities: { family: true, coachPlatform: false, ... }
   }

2. User upgrades to coach-family plan
   ↓ Stripe webhook → Backend updates:
   UPDATE users SET plan = 'coach-family' WHERE id = 'user_123'
   UPDATE coaches SET coach_id = 'user_123', ... WHERE user_id = 'user_123'

3. ❌ CURRENT: User context still shows 'family-pro'
   - Mobile app has stale data
   - Can't access coach features
   - Must logout/login to refresh

4. ✅ SHOULD BE: Real-time sync
   - Backend pushes update to client
   - Client refreshes capabilities
   - Coach dashboard appears in navigation
   - Seamless transition
```

---

## Required Backend Changes

### 1. Extend Login/Registration Response

**File:** `auth.wihy.ai` backend

#### Current Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbG...",
    "expiresIn": "24h"
  }
}
```

#### Required Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "plan": "coach-family",
      "addOns": ["ai", "instacart"],
      "capabilities": {
        "meals": true,
        "workouts": true,
        "family": true,
        "familyMembers": 5,
        "coachPlatform": true,
        "clientManagement": true,
        "wihyAI": true,
        "instacart": true,
        "progressTracking": "advanced",
        "dataExport": true,
        "apiAccess": true,
        "webhooks": true,
        "communication": "full"
      },
      "familyId": "family_456",
      "familyRole": "owner",
      "guardianCode": "WIHY-ABC123",
      "coachId": "coach_123",
      "commissionRate": 0.15,
      "organizationId": null,
      "organizationRole": null
    },
    "token": "eyJhbG...",
    "expiresIn": "24h"
  }
}
```

---

### 2. Update /api/users/me Endpoint

**Currently Returns:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "plan": "premium"
}
```

**Should Return:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "provider": "google",
  "plan": "coach-family",
  "addOns": ["ai"],
  "capabilities": { ... },
  "familyId": "family_456",
  "familyRole": "owner",
  "guardianCode": "WIHY-ABC123",
  "coachId": "coach_123",
  "commissionRate": 0.15,
  "organizationId": null,
  "organizationRole": null,
  "healthScore": 85,
  "streakDays": 7,
  "memberSince": "2025-12-01"
}
```

---

### 3. Add /api/users/me/capabilities Endpoint

**Purpose:** Get user's current capabilities based on plan + add-ons

**Response:**
```json
{
  "plan": "coach-family",
  "addOns": ["ai"],
  "capabilities": {
    "meals": true,
    "workouts": true,
    "family": true,
    "familyMembers": 5,
    "coachPlatform": true,
    "clientManagement": true,
    "wihyAI": true,
    "instacart": true,
    "progressTracking": "advanced",
    "dataExport": true,
    "apiAccess": true,
    "webhooks": true,
    "adminDashboard": false,
    "usageAnalytics": false,
    "roleManagement": false,
    "whiteLabel": false,
    "communication": "full"
  }
}
```

---

### 4. Backend Database Schema

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  provider VARCHAR(50) DEFAULT 'local',
  role VARCHAR(20) DEFAULT 'user',
  
  -- Subscription
  plan VARCHAR(50) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  -- Family
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  family_role VARCHAR(20), -- 'owner', 'member'
  
  -- Coach
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  commission_rate DECIMAL(5,4),
  
  -- Organization
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  organization_role VARCHAR(20), -- 'admin', 'user', 'student', 'employee'
  
  -- Health
  health_score INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**User Add-ons Table:**
```sql
CREATE TABLE user_addons (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addon_name VARCHAR(50) NOT NULL, -- 'ai', 'instacart'
  activated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, addon_name)
);
```

---

## Required Frontend Changes

### 1. Update AuthContext to Use Backend Data

**File:** `mobile/src/context/AuthContext.tsx`

```typescript
const convertUserData = async (authUser: UserData): Promise<User> => {
  // ✅ NEW: Use backend data as source of truth
  // Only fallback to local storage for offline mode
  const storedData = await AsyncStorage.getItem(STORAGE_KEY);
  const existingData = storedData ? JSON.parse(storedData) : null;
  
  // Use backend data first, then local storage as fallback
  const plan = authUser.plan || existingData?.plan || 'free';
  const addOns = authUser.addOns || existingData?.addOns || [];
  
  // ✅ NEW: Use capabilities from backend if available
  const capabilities = authUser.capabilities 
    ? authUser.capabilities 
    : getPlanCapabilities(plan, addOns);
  
  return {
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    plan,
    addOns,
    capabilities,
    
    // ✅ NEW: Use backend data for relationships
    familyId: authUser.familyId || existingData?.familyId,
    familyRole: authUser.familyRole || existingData?.familyRole,
    guardianCode: authUser.guardianCode || existingData?.guardianCode,
    coachId: authUser.coachId || existingData?.coachId,
    commissionRate: authUser.commissionRate || existingData?.commissionRate,
    organizationId: authUser.organizationId || existingData?.organizationId,
    organizationRole: authUser.organizationRole || existingData?.organizationRole,
  };
};
```

---

### 2. Add Context Refresh Method

**File:** `mobile/src/context/AuthContext.tsx`

```typescript
const refreshUserContext = async (): Promise<void> => {
  if (!user) return;
  
  try {
    // Fetch fresh data from backend
    const profile = await authService.getUserProfile();
    
    if (profile) {
      // Update user context with fresh data
      const updatedUser: User = {
        ...user,
        plan: profile.plan,
        addOns: profile.addOns || [],
        capabilities: profile.capabilities,
        familyId: profile.familyId,
        familyRole: profile.familyRole,
        guardianCode: profile.guardianCode,
        coachId: profile.coachId,
        commissionRate: profile.commissionRate,
        organizationId: profile.organizationId,
        organizationRole: profile.organizationRole,
      };
      
      setUser(updatedUser);
      await saveUserData(updatedUser);
    }
  } catch (error) {
    console.error('[AuthContext] Failed to refresh user context:', error);
  }
};

// Expose in context
return (
  <AuthContext.Provider value={{
    user,
    loading,
    signIn,
    signOut,
    updateUser,
    refreshUserContext, // ✅ NEW
  }}>
    {children}
  </AuthContext.Provider>
);
```

---

### 3. Update Family Service to Refresh Context

**File:** `mobile/src/services/familyService.ts`

```typescript
import { AuthContext } from '../context/AuthContext';

async createFamily(data: CreateFamilyRequest): Promise<CreateFamilyResponse> {
  const result = await this.post('/families', data);
  
  // ✅ NEW: Trigger context refresh after creating family
  // This ensures familyId, familyRole, guardianCode are updated
  if (result.success && this.authContext) {
    await this.authContext.refreshUserContext();
  }
  
  return result;
}

async joinFamily(data: JoinFamilyRequest): Promise<JoinFamilyResponse> {
  const result = await this.post('/families/join', data);
  
  // ✅ NEW: Trigger context refresh after joining family
  if (result.success && this.authContext) {
    await this.authContext.refreshUserContext();
  }
  
  return result;
}
```

---

### 4. Update Coach Service to Refresh Context

**File:** `mobile/src/services/coachService.ts`

```typescript
async becomeCoach(data: BecomeCoachRequest): Promise<BecomeCoachResponse> {
  const result = await this.post('/coaches', data);
  
  // ✅ NEW: Trigger context refresh after becoming coach
  if (result.success && this.authContext) {
    await this.authContext.refreshUserContext();
  }
  
  return result;
}
```

---

## Implementation Roadmap

### Phase 1: Backend Updates (3-5 days)

**Priority: CRITICAL**

1. ✅ Update `users` table schema
   - Add `family_id`, `family_role`, `coach_id`, `commission_rate`, `organization_id`, `organization_role`
   
2. ✅ Create `user_addons` table
   - Track active add-ons per user
   
3. ✅ Update login endpoint (`POST /api/auth/login`)
   - Return full user context including relationships
   
4. ✅ Update registration endpoint (`POST /api/auth/register`)
   - Return full user context
   
5. ✅ Update user profile endpoint (`GET /api/users/me`)
   - Return all user fields including relationships
   
6. ✅ Create capabilities endpoint (`GET /api/users/me/capabilities`)
   - Compute capabilities server-side based on plan + add-ons
   
7. ✅ Update family endpoints to modify user record
   - `POST /api/families` → Update creator's family_id, family_role
   - `POST /api/families/join` → Update joiner's family_id, family_role
   - `DELETE /api/families/:id/members/:memberId` → Clear member's family_id
   
8. ✅ Update coach endpoints to modify user record
   - `POST /api/coaches` → Create coach record, update user's coach_id

---

### Phase 2: Frontend Updates (2-3 days)

**Priority: HIGH**

1. ✅ Update `UserData` interface in `authService.ts`
   - Add family, coach, organization fields
   
2. ✅ Update `convertUserData` in `AuthContext.tsx`
   - Use backend data as source of truth
   - Fallback to local storage only for offline mode
   
3. ✅ Add `refreshUserContext` method to AuthContext
   - Call `authService.getUserProfile()`
   - Update user state
   
4. ✅ Update `familyService` to trigger context refresh
   - After creating family
   - After joining family
   - After leaving family
   
5. ✅ Update `coachService` to trigger context refresh
   - After becoming coach
   - After updating coach profile
   
6. ✅ Add periodic context refresh
   - Check for updates every 5 minutes when app is active
   - Refresh on app resume from background

---

### Phase 3: Testing (2 days)

**Priority: HIGH**

1. ✅ Test multi-device sync
   - Login on device A
   - Create family on device A
   - Login on device B → Should see family
   
2. ✅ Test role transitions
   - Start as free user
   - Upgrade to family-pro
   - Verify capabilities update
   
3. ✅ Test coach + family combo
   - Create coach account
   - Upgrade to coach-family
   - Create family
   - Invite clients
   - Verify both coach and family features work
   
4. ✅ Test offline behavior
   - Login with internet
   - Go offline
   - Verify app works with cached data
   - Go online
   - Verify context refreshes

---

### Phase 4: Real-time Sync (Optional, 3-5 days)

**Priority: MEDIUM**

Implement WebSocket or Server-Sent Events for real-time updates:

```typescript
// WebSocket connection
const ws = new WebSocket('wss://auth.wihy.ai/ws');

ws.on('user_updated', (data) => {
  // User profile changed (plan upgrade, family joined, etc.)
  refreshUserContext();
});

ws.on('capabilities_changed', (data) => {
  // Capabilities updated (add-on purchased, plan changed)
  refreshUserContext();
});
```

---

## Security Considerations

### 1. Authorization Checks

**Backend MUST verify:**
- User can only access their own family data
- User can only manage their own clients (if coach)
- User can only access features in their plan's capabilities

```typescript
// Backend middleware
function requireFamilyAccess(req, res, next) {
  const { familyId } = req.params;
  const user = req.user;
  
  // Check if user is member of this family
  if (user.family_id !== familyId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Check if user's plan includes family features
  const capabilities = computeCapabilities(user.plan, user.addOns);
  if (!capabilities.family) {
    return res.status(403).json({ error: 'Family features not available' });
  }
  
  next();
}
```

---

### 2. Client-Side Capabilities Check

**Frontend MUST check before rendering:**
- Hide family navigation if `!user.capabilities.family`
- Hide coach navigation if `!user.capabilities.coachPlatform`
- Show upgrade prompts for locked features

```typescript
// Example: AppNavigator.tsx
{user?.capabilities.family && (
  <Tab.Screen name="FamilyDashboard" component={FamilyDashboardPage} />
)}

{user?.capabilities.coachPlatform && (
  <Tab.Screen name="CoachDashboard" component={CoachDashboard} />
)}
```

---

## Success Criteria

✅ **Auth Integration Complete When:**

1. User logs in on new device → Sees all family/coach data immediately
2. User creates family → Context updates without app restart
3. User upgrades plan → New features appear immediately
4. User joins family on web → Mobile app reflects change within 5 minutes
5. Capabilities always match backend plan (no client-side override possible)
6. Offline mode works with last-synced data
7. Multi-device experiences are consistent

---

## Conclusion

**Current State:** Auth, Family, and Coach are **NOT INTEGRATED**. They exist as separate silos:
- Auth manages login/logout
- Family service manages families (but doesn't update auth context)
- Coach service manages clients (but doesn't update auth context)
- Capabilities are computed client-side from stale data

**Required State:** Auth, Family, and Coach must be **FULLY INTEGRATED**:
- Login returns complete user context (family, coach, organization)
- Family/coach operations update user record in database
- Frontend auto-refreshes context after relationship changes
- Backend is source of truth for all user data
- Real-time or periodic sync keeps clients up-to-date

**Blocking Launch:** YES - Without this integration:
- Users can't access family features after creating family
- Coaches can't access coach features after signing up
- Plan upgrades don't grant new features
- Multi-device experience is broken

**Recommendation:** Implement Phase 1 (Backend) and Phase 2 (Frontend) before launch. Phase 3 (Testing) is mandatory. Phase 4 (Real-time) can be post-launch enhancement.
