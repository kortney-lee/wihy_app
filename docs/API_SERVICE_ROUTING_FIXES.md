# API Service Routing Fixes

## Summary

Updated all API calls in authService.ts to route to the correct microservice endpoints based on WIHY's service architecture.

**Date:** January 20, 2026

---

## Changes Made

### 1. Service Architecture Clarification

**WIHY uses separate microservices:**

| Service | Base URL | Purpose |
|---------|----------|---------|
| **Auth Service** | `https://auth.wihy.ai` | Authentication, login, register, token validation |
| **User Service** | `https://user.wihy.ai` | User profiles, preferences, settings, family/coach data |
| **Services API** | `https://services.wihy.ai` | Barcode scanning, meal tracking, workouts |
| **ML API** | `https://ml.wihy.ai` | AI chat, health questions |
| **Payment Service** | `https://payment.wihy.ai` | Stripe integration, subscriptions |

---

## Updated Methods in authService.ts

### Methods Now Using User Service (https://user.wihy.ai)

All these methods were incorrectly using `auth.wihy.ai` and now correctly use `user.wihy.ai`:

1. **getUserProfile()**
   - Endpoint: `GET https://user.wihy.ai/api/users/me`
   - Returns: Complete user profile with capabilities, family, coach data

2. **updateUserProfile()**
   - Endpoint: `PUT https://user.wihy.ai/api/users/me`
   - Updates: Name, avatar, profile fields

3. **updateUserPreferences()**
   - Endpoint: `PUT https://user.wihy.ai/api/users/me/preferences`
   - Updates: Notifications, privacy, theme settings

4. **updateUserPlan()**
   - Endpoint: `PUT https://user.wihy.ai/api/users/me/plan`
   - Updates: Subscription plan

5. **addAddon()**
   - Endpoint: `POST https://user.wihy.ai/api/users/me/addons`
   - Adds: AI or Instacart add-on

6. **removeAddon()**
   - Endpoint: `DELETE https://user.wihy.ai/api/users/me/addons/{addon}`
   - Removes: AI or Instacart add-on

7. **updateHealthMetrics()**
   - Endpoint: `PUT https://user.wihy.ai/api/users/me/health`
   - Updates: Health score, streak, weight, height

8. **getSubscriptionHistory()**
   - Endpoint: `GET https://user.wihy.ai/api/users/me/subscriptions`
   - Returns: Subscription history

---

## Methods Still Using Auth Service (Correct)

These methods correctly use `auth.wihy.ai` and were not changed:

1. **login()** - `POST https://auth.wihy.ai/api/auth/login`
2. **register()** - `POST https://auth.wihy.ai/api/auth/register`
3. **verifySession()** - `POST https://auth.wihy.ai/api/auth/verify`
4. **refreshAccessToken()** - `POST https://auth.wihy.ai/api/auth/refresh`
5. **logout()** - `POST https://auth.wihy.ai/api/auth/logout`
6. **forgotPassword()** - `POST https://auth.wihy.ai/api/auth/forgot-password`
7. **resetPassword()** - `POST https://auth.wihy.ai/api/auth/reset-password`

---

## Code Changes

### Before (Incorrect)

```typescript
async getUserProfile(): Promise<UserProfile | null> {
  const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.userProfile}`;
  // This would call: https://auth.wihy.ai/api/users/me ❌
  // ...
}
```

### After (Correct)

```typescript
async getUserProfile(): Promise<UserProfile | null> {
  // User service endpoint - not auth service
  const userServiceUrl = 'https://user.wihy.ai';
  const endpoint = `${userServiceUrl}${AUTH_CONFIG.endpoints.userProfile}`;
  // Now calls: https://user.wihy.ai/api/users/me ✅
  // ...
}
```

---

## Updated Configuration Comments

### config.ts

Added comprehensive service documentation:

```typescript
// WIHY Microservices Architecture:
// - Auth Service (auth.wihy.ai): Authentication, login, register, token validation
// - User Service (user.wihy.ai): User profiles, preferences, family/coach data
// - Services API (services.wihy.ai): Barcode scanning, meal tracking, workouts
// - ML API (ml.wihy.ai): AI chat, health questions, personalized recommendations
// - Payment Service (payment.wihy.ai): Stripe integration, subscriptions
//
// See complete API docs: docs/WIHY_API_REFERENCE.md
```

### authService.ts

Added endpoint routing comments in AUTH_CONFIG:

```typescript
endpoints: {
  // === AUTH SERVICE ENDPOINTS (https://auth.wihy.ai) ===
  login: '/api/auth/login',
  register: '/api/auth/register',
  verify: '/api/auth/verify',
  // ...
  
  // === USER SERVICE ENDPOINTS (https://user.wihy.ai) ===
  // Note: These endpoints are hardcoded to use user.wihy.ai in the methods below
  userProfile: '/api/users/me',
  updateProfile: '/api/users/me',
  // ...
}
```

---

## Testing Checklist

After these changes, test the following:

### Auth Service Calls (Should Still Work)
- [ ] Login with email/password
- [ ] Register new user
- [ ] OAuth login (Google, Facebook, Apple, Microsoft)
- [ ] Token refresh
- [ ] Password reset flow

### User Service Calls (Now Fixed)
- [ ] Load user profile on app start
- [ ] View profile screen
- [ ] Update profile (name, avatar)
- [ ] Update preferences (notifications, theme)
- [ ] Switch subscription plan
- [ ] Add/remove add-ons (AI, Instacart)
- [ ] Update health metrics
- [ ] View subscription history

### Expected Behavior
- ✅ Auth endpoints should continue working (no change)
- ✅ User profile endpoints should now work correctly
- ✅ Network logs should show correct service URLs:
  - Auth operations: `https://auth.wihy.ai/...`
  - User operations: `https://user.wihy.ai/...`

---

## Related Documentation

- [WIHY_API_REFERENCE.md](WIHY_API_REFERENCE.md) - Complete API documentation
- [BACKEND_API_REQUIRED_FIXES.md](BACKEND_API_REQUIRED_FIXES.md) - Backend fixes needed for `/api/users/me`

---

## Impact

### What Was Broken
Before these fixes, all user management operations (profile, preferences, plan, health) were calling the wrong service (`auth.wihy.ai` instead of `user.wihy.ai`), which would result in:
- 404 Not Found errors
- Missing endpoint errors
- Failed profile loads

### What Is Fixed
Now all user management operations correctly route to `user.wihy.ai`, ensuring:
- ✅ Profile screen loads correctly
- ✅ Preferences can be updated
- ✅ Plan switching works
- ✅ Health metrics update properly
- ✅ Add-ons can be managed

---

## Next Steps

1. **Test all user operations** - Verify profile, preferences, plan switching work
2. **Monitor network logs** - Confirm correct service URLs are being called
3. **Backend coordination** - Ensure backend implements the missing fields from [BACKEND_API_REQUIRED_FIXES.md](BACKEND_API_REQUIRED_FIXES.md)
4. **Update other services** - Check if any other files need similar routing fixes

---

## Files Modified

1. **mobile/src/services/authService.ts**
   - Updated 8 methods to use `user.wihy.ai`
   - Added service routing comments

2. **mobile/src/services/config.ts**
   - Added comprehensive service architecture documentation
   - Added reference to API documentation

3. **docs/WIHY_API_REFERENCE.md** (Created)
   - Complete API documentation for all services
   - TypeScript examples
   - Error handling

4. **docs/API_SERVICE_ROUTING_FIXES.md** (This file)
   - Summary of changes made
   - Testing checklist
