# Auth Verification Update

**Date**: January 25, 2026  
**Change**: Use `/api/auth/verify` endpoint as authoritative source for user role and plan

---

## What Changed

### Before ❌
- Client-side role normalization (CLIENT → user)
- Client-side plan assignment based on role
- Potential mismatches between backend and frontend

### After ✅
- **Trust verify endpoint response as source of truth**
- Backend handles all role/plan normalization
- Frontend uses authoritative data from `/api/auth/verify`

---

## Verify Endpoint Response

```json
{
  "valid": true,
  "success": true,
  "user": {
    "id": "d20f4ec1-2ff5-4871-bbf1-dedf7f41a6ad",
    "email": "kortney_lee@hotmail.com",
    "name": "Kortney Lee",
    "firstName": "Kortney",
    "lastName": "Lee",
    "avatar": null,
    "role": "user",              // ✅ Authoritative role
    "status": "ACTIVE",          // ✅ Authoritative status
    "emailVerified": true,
    "plan": "free",              // ✅ Authoritative plan
    "subscriptionStatus": null,
    "provider": "microsoft",
    "providerId": "a3cfbbc32d356a68",
    "profileData": {
      "given_name": "Kortney",
      "family_name": "Lee"
    },
    "lastLoginAt": "2026-01-25T23:41:31.171Z",
    "createdAt": "2026-01-22T21:46:22.265Z"
  },
  "tokenValid": true
}
```

---

## Benefits

### 1. Single Source of Truth ✅
- Backend is authoritative for all user data
- No client-side guessing or normalization
- Eliminates CLIENT role mapping issues

### 2. Automatic Updates ✅
- If backend changes role → plan mapping, frontend gets it automatically
- No need to update mobile app when business logic changes
- Backend controls access levels

### 3. Consistent Access Control ✅
- Same role/plan logic across all platforms
- Web, iOS, Android all get same data
- No platform-specific bugs

### 4. Simplified Debugging ✅
```typescript
// Old - many places where role could be wrong
const roleFromServer = authUser.role;
const normalized = roleFromServer?.toLowerCase();
if (normalized === 'client') normalized = 'user';
const plan = mapRoleToPlan(normalized);

// New - trust backend
const role = authUser.role;  // Already correct
const plan = authUser.plan;  // Already correct
```

---

## Implementation

### AuthContext.tsx Changes

**Old Logic**:
```typescript
// Map CLIENT role to user (free plan)
if (normalizedRole === 'client' as any) {
  console.log('[AuthContext] Converting CLIENT role to user (free plan)');
  normalizedRole = 'user';
}

// Role-based plan overrides
const getPlanFromRole = (role, backendPlan) => {
  switch (role) {
    case 'user': return 'free';
    // ... more mappings
  }
};
```

**New Logic**:
```typescript
// ✅ USE VERIFY ENDPOINT AS SOURCE OF TRUTH
console.log('[AuthContext] Processing user data from verify endpoint:', {
  email: authUser.email,
  role: authUser.role,     // Already normalized by backend
  plan: authUser.plan,     // Already correct
  status: authUser.status
});

// Trust backend plan assignment
const backendPlan = authUser.plan || 'free';

// Only map for capability computation (backend already sent correct plan)
const plan = getPlanFromRole(normalizedRole, backendPlan);
```

---

## Auth Flow

### 1. User Logs In
```
User → Mobile App → auth.wihy.ai/api/auth/login
                ← Returns: session_token
```

### 2. Verify Session (App Start)
```
Mobile App → auth.wihy.ai/api/auth/verify (with token)
           ← Returns: {
               valid: true,
               user: {
                 role: "user",    // ✅ Authoritative
                 plan: "free",    // ✅ Authoritative
                 status: "ACTIVE" // ✅ Authoritative
               }
             }
```

### 3. Use Authoritative Data
```typescript
// Mobile app trusts verify response
const user = {
  role: verifyResponse.user.role,  // No mapping needed
  plan: verifyResponse.user.plan,  // No conversion needed
  status: verifyResponse.user.status
};

// Compute capabilities from authoritative plan
const capabilities = getPlanCapabilities(user.plan, user.addOns);
```

---

## Edge Cases Handled

### CLIENT Role (Backend-Specific)
**Before**: Client-side mapping `CLIENT → user → free`  
**After**: Backend sends `role: "user", plan: "free"` - no client mapping needed

### Premium User
**Before**: Client maps `role: "premium" → plan: "premium"`  
**After**: Backend sends `role: "user", plan: "premium"` - accurate representation

### Coach
**Before**: Client maps `role: "coach" → plan: "coach"`  
**After**: Backend sends `role: "coach", plan: "coach"` - consistent

### Family Member
**Before**: Client maps `role: "family-basic" → plan: "family-basic"`  
**After**: Backend sends `role: "user", plan: "family-basic"` with `familyRole: "member"`

---

## Backward Compatibility

### Role Mapping Still Exists
For capability computation, we still have `getPlanFromRole()` but it now:
- **Trusts backend plan for 'user' role** (most common)
- Only overrides for specific roles (admin, coach, etc.)
- Acts as fallback if backend doesn't send plan

### Existing Users
- App start: Calls verify endpoint → gets authoritative data
- Local storage: Updates with new authoritative values
- Seamless migration: No user action needed

---

## Testing

### Test Cases

1. **New User Signup**
   - Verify endpoint returns correct role/plan
   - Mobile app uses authoritative values
   - Capabilities match plan

2. **Existing User Login**
   - Verify endpoint called on app start
   - User data updated with authoritative values
   - Access remains consistent

3. **Plan Upgrade**
   - User upgrades free → premium
   - Next verify call returns new plan
   - Capabilities update automatically

4. **Role Change (Admin)**
   - Admin changes user role in backend
   - Next verify call returns new role
   - Access changes immediately

---

## Debug Logging

The update includes comprehensive logging:

```typescript
console.log('[AuthContext] Processing user data from verify endpoint:', {
  email: authUser.email,
  role: authUser.role,
  plan: authUser.plan,
  status: authUser.status
});

console.log('[AuthContext] User access assignment from verify endpoint:', {
  email: authUser.email,
  roleFromServer: authUser.role,
  planFromServer: authUser.plan,
  normalizedRole,
  finalPlan: plan,
  capabilities: getPlanCapabilities(plan, addOns)
});
```

**Monitor these logs to verify**:
- Verify endpoint returns expected role/plan
- No unexpected role conversions
- Capabilities match plan correctly

---

## Migration Path

### Phase 1: ✅ COMPLETE
- Use verify endpoint as source of truth
- Trust backend role/plan assignment
- Remove CLIENT role client-side mapping

### Phase 2: Future
- Remove client-side role→plan mapping entirely
- Backend sends plan, client uses it directly
- Simplify AuthContext further

### Phase 3: Future
- Consolidate User types (AuthContext → api.ts)
- Single type definition across codebase
- Type-safe API contracts

---

## Summary

**Key Change**: Mobile app now trusts `/api/auth/verify` endpoint as the authoritative source for user role, plan, and status.

**Benefits**:
- ✅ Single source of truth (backend)
- ✅ Eliminates CLIENT role issues
- ✅ Automatic updates when backend logic changes
- ✅ Consistent across all platforms
- ✅ Simplified client code

**Impact**:
- No breaking changes for users
- Automatic migration on next login
- More reliable access control
- Easier to maintain
