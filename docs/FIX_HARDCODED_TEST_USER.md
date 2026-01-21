# Hardcoded test_user Removal & User Session Integration

## Problem Analysis

**Location:** Multiple screens and services are hardcoding `test_user` instead of using actual authenticated user ID

**Current Instances:**

| File | Line | Current Code | Issue |
|------|------|--------------|-------|
| OverviewDashboard.tsx | 91 | `const userId = 'test_user'` | Always uses test_user, ignores AuthContext |
| MyProgressDashboard.tsx | 444 | `const userId = 'test_user'` | Always uses test_user, ignores AuthContext |
| CreateMeals.tsx | 597, 823, 1152 | `userId \|\| 'test_user'` | Fallback to test_user if not provided |
| FitnessDashboard.tsx | 941, 2580, 2711, 2907 | `__DEV__ ? 'test_user' : userId` | Uses test_user in dev mode |
| AuthContext.tsx | 446 | `id: 'test_user'` (DevAuth) | Dev login always creates test_user |
| AuthContext.tsx | 615 | `userId: context.user?.id \|\| 'test_user'` | Fallback for development |

---

## Root Cause

**The issue:** Frontend was written before proper backend auth was implemented. Dev mode defaulted to `test_user` to have consistent test data.

**Why it breaks now:** With real auth working (`/api/auth/verify` returns actual role/plan), API calls go out with:
- ❌ Hardcoded `test_user` as userId
- ✅ Actual auth token with real user ID in JWT

**Result:** Backend sees token for `kortney@wihy.ai` but request is for `test_user` → **500 Internal Server Error** or **Unauthorized**

---

## Solution: Use AuthContext User ID

### Pattern to Follow

**OLD (Hardcoded):**
```typescript
const userId = 'test_user';  // ❌ WRONG
```

**NEW (From AuthContext):**
```typescript
const { user } = useContext(AuthContext);
const userId = user?.id;  // ✅ CORRECT

if (!userId) {
  console.error('User ID not available - not authenticated');
  return;
}
```

---

## Files That Need Fixing

### 1. OverviewDashboard.tsx (Line 91)

**BEFORE:**
```typescript
const loadHealthData = async () => {
  try {
    setIsLoading(true);
    const userId = 'test_user'; // Default for demo; in production, get from AuthContext

    // Fetch data from all services in parallel
    const [healthScore, todayMetrics, weeklyData, mealSummary, todayWorkout, workoutHistory] = await Promise.all([
      initialized ? healthDataService.getHealthScore() : Promise.resolve(0),
      initialized ? healthDataService.getTodayMetrics() : Promise.resolve(null),
      initialized ? healthDataService.getWeeklyData() : Promise.resolve(null),
      nutritionService.getDailySummary(userId).catch(() => null),
      fitnessService.getTodayWorkout(userId).catch(() => null),
      fitnessService.getHistory(userId, 7).catch(() => null),
    ]);
```

**AFTER:**
```typescript
const { user } = useContext(AuthContext);

const loadHealthData = async () => {
  try {
    setIsLoading(true);
    const userId = user?.id;

    if (!userId) {
      console.error('[OverviewDashboard] User ID not available');
      setIsLoading(false);
      return;
    }

    // Fetch data from all services in parallel
    const [healthScore, todayMetrics, weeklyData, mealSummary, todayWorkout, workoutHistory] = await Promise.all([
      initialized ? healthDataService.getHealthScore() : Promise.resolve(0),
      initialized ? healthDataService.getTodayMetrics() : Promise.resolve(null),
      initialized ? healthDataService.getWeeklyData() : Promise.resolve(null),
      nutritionService.getDailySummary(userId).catch(() => null),
      fitnessService.getTodayWorkout(userId).catch(() => null),
      fitnessService.getHistory(userId, 7).catch(() => null),
    ]);
```

**Required Import:**
```typescript
import { AuthContext } from '../context/AuthContext';
```

---

### 2. MyProgressDashboard.tsx (Line 444)

**BEFORE:**
```typescript
const loadData = async () => {
  try {
    setLoading(true);
    const userId = 'test_user'; // Default for demo; in production, get from AuthContext
    
    let todayWorkout: any = null;
    // ...
```

**AFTER:**
```typescript
const { user } = useContext(AuthContext);

const loadData = async () => {
  try {
    setLoading(true);
    const userId = user?.id;

    if (!userId) {
      console.error('[MyProgressDashboard] User ID not available');
      setLoading(false);
      return;
    }
    
    let todayWorkout: any = null;
    // ...
```

**Required Import:**
```typescript
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';  // If not already imported
```

---

### 3. CreateMeals.tsx (Lines 596-597, 823, 1152)

**BEFORE (Line 596):**
```typescript
userId: userId || 'test_user',
```

**AFTER:**
```typescript
const { user } = useContext(AuthContext);

// In request body:
userId: user?.id || userId,  // Use actual user ID, fallback to prop if available
```

**Check that userId is correctly passed:**
- From AuthContext: `user?.id` ✅
- From props: `userId` prop (if passed to component)
- Don't fallback to 'test_user'

---

### 4. FitnessDashboard.tsx (Lines 941, 2580, 2711, 2907)

**BEFORE (Line 941):**
```typescript
userId: __DEV__ ? 'test_user' : userId,
```

**AFTER:**
```typescript
const { user } = useContext(AuthContext);

// In request body:
userId: user?.id,  // Always use real user ID, regardless of __DEV__
```

**Key change:** Remove the `__DEV__` ternary - always use real user ID

---

### 5. AuthContext.tsx (Line 446 - DevAuth)

**BEFORE:**
```typescript
const handleDevAuth = async (credentials?: any): Promise<User> => {
  // Dev login for testing
  const devUser: User = {
    id: 'test_user',  // ← HARDCODED
    name: 'Dev User',
    email: 'dev@example.com',
    // ...
  };
  
  return devUser;
};
```

**AFTER:**
```typescript
const handleDevAuth = async (credentials?: any): Promise<User> => {
  // Dev login for testing - generate a unique dev user ID
  const devUserId = `dev-${Date.now()}`;  // OR generate UUID
  const devUser: User = {
    id: devUserId,
    name: 'Dev User',
    email: 'dev@example.com',
    // ...
  };
  
  return devUser;
};
```

**OR (Better):** Remove dev auth and require real login during testing

---

### 6. AuthContext.tsx (Line 615 - Fallback)

**BEFORE:**
```typescript
userId: context.user?.id || 'test_user',
```

**AFTER:**
```typescript
const userId = context.user?.id;

if (!userId) {
  console.error('[Service] User not authenticated');
  // Throw error or return null - don't use test_user
  return;
}

userId: userId,
```

---

## Complete Fix Checklist

### OverviewDashboard.tsx
- [ ] Add `import { useContext } from 'react'` (if needed)
- [ ] Add `import { AuthContext } from '../context/AuthContext'`
- [ ] Get user from context: `const { user } = useContext(AuthContext)`
- [ ] Replace `const userId = 'test_user'` with `const userId = user?.id`
- [ ] Add null check: `if (!userId) { return }`
- [ ] Test: Verify API calls use correct user ID in network requests

### MyProgressDashboard.tsx
- [ ] Add `import { useContext } from 'react'` (if needed)
- [ ] Add `import { AuthContext } from '../context/AuthContext'`
- [ ] Get user from context: `const { user } = useContext(AuthContext)`
- [ ] Replace `const userId = 'test_user'` with `const userId = user?.id`
- [ ] Add null check: `if (!userId) { return }`
- [ ] Test: Verify API calls use correct user ID

### CreateMeals.tsx
- [ ] Add `import { useContext } from 'react'` (if needed)
- [ ] Add `import { AuthContext } from '../context/AuthContext'`
- [ ] Get user from context: `const { user } = useContext(AuthContext)`
- [ ] Replace all `userId || 'test_user'` with `user?.id || userId`
- [ ] Remove 'test_user' fallback entirely
- [ ] Test: Verify meals are saved to correct user

### FitnessDashboard.tsx
- [ ] Add `import { useContext } from 'react'` (if needed)
- [ ] Add `import { AuthContext } from '../context/AuthContext'`
- [ ] Get user from context: `const { user } = useContext(AuthContext)`
- [ ] Replace all `__DEV__ ? 'test_user' : userId` with `user?.id`
- [ ] Remove `__DEV__` ternary - always use real user ID
- [ ] Test: Verify workouts are saved to correct user

### AuthContext.tsx
- [ ] Review `handleDevAuth` function
- [ ] Either remove dev auth or generate unique dev user ID
- [ ] Replace all `'test_user'` fallbacks with proper error handling
- [ ] Add logging: `console.error('User not authenticated')`
- [ ] Test: Dev login should fail if no auth available

---

## Testing After Fix

### Test 1: Verify API Requests Use Real User ID
1. Open DevTools (Network tab)
2. Login with real credentials (e.g., Kortney admin account)
3. Navigate to Overview Dashboard
4. Check network requests:
   - ✅ Should include user's actual ID (UUID from JWT)
   - ❌ Should NOT include `test_user`
5. Check response status:
   - ✅ Should be 200 OK
   - ❌ Should NOT be 401/403/500 errors

### Test 2: Verify User Data Matches
1. Open profile screen
2. Check health data, meals, workouts
3. Verify all data is associated with logged-in user
4. Check another user's data should not appear

### Test 3: Dev Mode (if still using dev auth)
1. Generate new dev user ID on each dev login
2. Verify separate dev accounts don't share data
3. Confirm each dev session has unique user ID

---

## Why This Matters

### Before Fix (Current State)
```
User logs in as: kortney@wihy.ai (JWT token valid for this user)
API request made for: test_user
Backend sees: Token for user A, but request is for user B
Result: ❌ 401 Unauthorized or ❌ 500 Internal Server Error
```

### After Fix (Correct State)
```
User logs in as: kortney@wihy.ai (JWT token valid for this user)
API request made for: b0130eaf-4882-4258-bbb9-66ecc5b1ebac (Kortney's actual ID)
Backend sees: Token for user A, request for user A ✅
Result: ✅ 200 OK with correct data
```

---

## Implementation Order

1. **First:** Fix OverviewDashboard.tsx (most used dashboard)
2. **Second:** Fix MyProgressDashboard.tsx
3. **Third:** Fix FitnessDashboard.tsx
4. **Fourth:** Fix CreateMeals.tsx
5. **Fifth:** Fix AuthContext.tsx dev auth
6. **Finally:** Test all flows end-to-end

---

## Code Examples

### Complete Pattern

```typescript
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fitnessService } from '../services/fitnessService';

export default function MyScreen() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [user?.id]);  // Re-load when user changes

  const loadData = async () => {
    try {
      // ✅ Get user ID from context
      const userId = user?.id;
      
      // ✅ Validate before API call
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      // ✅ Use real user ID in API calls
      const workout = await fitnessService.getTodayWorkout(userId);
      setData(workout);
    } catch (err) {
      setError(err.message);
    }
  };

  // ... render component
}
```

### Error Handling Pattern

```typescript
if (!user) {
  return <ErrorMessage message="Please log in to continue" />;
}

const userId = user.id;

if (!userId) {
  console.error('[Component] User ID missing from auth context');
  return <ErrorMessage message="User session invalid" />;
}

// Now safe to make API calls with userId
```

---

## Summary

**What's wrong:** 
- API calls hardcode `test_user` instead of using authenticated user ID

**Why it fails:**
- Backend validates JWT token (correct user) but sees request for `test_user` → mismatch

**Solution:**
- Replace all `'test_user'` with `user?.id` from AuthContext

**Impact:**
- ✅ API calls now use correct user ID
- ✅ Data belongs to logged-in user
- ✅ No more 401/403/500 errors on API calls
- ✅ Plan switching works correctly
- ✅ All dashboards access user's real data
