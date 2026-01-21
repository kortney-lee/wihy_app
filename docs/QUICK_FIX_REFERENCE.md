# Quick Reference: Hardcoded test_user Fixes

## 6 Critical Files to Fix

### 1️⃣ OverviewDashboard.tsx (Line ~91)

```typescript
// REMOVE THIS:
const userId = 'test_user';

// ADD THIS:
const { user } = useContext(AuthContext);
const userId = user?.id;
if (!userId) return;
```

**Import to add:**
```typescript
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
```

---

### 2️⃣ MyProgressDashboard.tsx (Line ~444)

```typescript
// REMOVE THIS:
const userId = 'test_user';

// ADD THIS:
const { user } = useContext(AuthContext);
const userId = user?.id;
if (!userId) return;
```

**Import to add:**
```typescript
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
```

---

### 3️⃣ CreateMeals.tsx (Lines ~596, ~823, ~1152)

```typescript
// REMOVE THIS:
userId: userId || 'test_user',

// ADD THIS:
userId: user?.id || userId,
```

**Add context at top of component:**
```typescript
const { user } = useContext(AuthContext);
```

**Import to add:**
```typescript
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
```

---

### 4️⃣ FitnessDashboard.tsx (Lines ~941, ~2580, ~2711, ~2907)

```typescript
// REMOVE THIS (all 4 places):
userId: __DEV__ ? 'test_user' : userId,

// ADD THIS:
userId: user?.id,
```

**Add context at top of component:**
```typescript
const { user } = useContext(AuthContext);
```

**Import to add:**
```typescript
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
```

---

### 5️⃣ AuthContext.tsx (Line ~446 - handleDevAuth)

```typescript
// REMOVE THIS:
const handleDevAuth = async (credentials?: any): Promise<User> => {
  const devUser: User = {
    id: 'test_user',  // ← HARDCODED
    // ...
  };
  return devUser;
};

// REPLACE WITH (generate unique ID):
const handleDevAuth = async (credentials?: any): Promise<User> => {
  const devUser: User = {
    id: `dev-user-${Date.now()}`,  // ← UNIQUE EACH TIME
    // ...
  };
  return devUser;
};
```

---

### 6️⃣ AuthContext.tsx (Line ~615 - verifySession fallback)

```typescript
// REMOVE THIS:
userId: context.user?.id || 'test_user',

// REPLACE WITH:
const userId = context.user?.id;
if (!userId) {
  console.error('[Service] User not authenticated');
  return;
}
userId: userId,
```

---

## Testing Checklist

After making fixes:

- [ ] Open DevTools Network tab
- [ ] Login with real credentials (kortney@wihy.ai)
- [ ] Navigate to Overview Dashboard
- [ ] Check API requests in Network tab:
  - [ ] Requests include correct user ID (UUID, not "test_user")
  - [ ] Status 200 OK (not 401/403/500)
- [ ] Check MyProgress Dashboard:
  - [ ] Workouts display for correct user
  - [ ] No "test_user" in request URLs
- [ ] Check Fitness Dashboard:
  - [ ] Programs save to correct user
  - [ ] No "test_user" in API calls
- [ ] Check Create Meals:
  - [ ] Meals save to correct user
  - [ ] No "test_user" in requests

---

## Key Points

✅ **DO:**
- Use `user?.id` from AuthContext
- Check if userId exists before calling API
- Log error if user not authenticated
- Pass real user ID in all API requests

❌ **DON'T:**
- Use hardcoded 'test_user'
- Use `__DEV__ ? 'test_user' : userId` conditional
- Fallback to 'test_user' if userId missing
- Make API calls without userId

---

## Verification Commands

In browser console after login:

```javascript
// Check if user has ID
console.log(document.querySelector('[data-user-id]')?.dataset.userId);

// Or check auth token
const token = localStorage.getItem('session_token');
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log('User ID from token:', decoded.sub);
```

In network requests, search for:
- ✅ Should find: `b0130eaf-4882-4258-bbb9-66ecc5b1ebac` (real UUID)
- ❌ Should NOT find: `test_user`
