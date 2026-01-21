# Service Separation Guide

## Overview

WIHY uses a microservices architecture with dedicated backend services. Each frontend service client corresponds to a specific backend microservice to maintain clean separation of concerns.

## Service Architecture

| Frontend Service | Backend Service | Purpose |
|-----------------|-----------------|---------|
| `authService.ts` | `auth.wihy.ai` | Authentication & authorization (login, register, OAuth) |
| `userService.ts` | `user.wihy.ai` | User management (profile, preferences, subscriptions) |
| `servicesApiClient.ts` | `services.wihy.ai` | Core features (meals, workouts, barcode scanning) |
| `chatService.ts` | `ml.wihy.ai` | AI chat & health questions |
| `paymentService.ts` | `payment.wihy.ai` | Stripe integration & billing |

## When to Use Each Service

### `authService.ts` - Authentication Only

**Use when:**
- Logging in users (`login()`)
- Registering new accounts (`register()`)
- OAuth flows (`googleAuth()`, `appleAuth()`, etc.)
- Token management (`verifySession()`, `refreshAccessToken()`)
- Password reset (`forgotPassword()`, `resetPassword()`)
- Logging out (`logout()`)

**Example:**
```typescript
import { authService } from '../services/authService';

// ✅ Correct - authentication
const result = await authService.login({ email, password });
await authService.logout();
```

**Don't use for:**
- Getting user profile data
- Updating user preferences
- Managing subscriptions
- Health metrics

---

### `userService.ts` - User Management

**Use when:**
- Fetching user profile (`getUserProfile()`)
- Updating profile information (`updateUserProfile()`)
- Managing preferences (`getUserPreferences()`, `updateUserPreferences()`)
- Subscription operations (`updateUserPlan()`, `addAddon()`, `removeAddon()`)
- Health metrics (`updateHealthMetrics()`, `getUserDashboard()`)
- Avatar uploads (`uploadAvatar()`)
- Password changes for local accounts (`changePassword()`)

**Example:**
```typescript
import { userService } from '../services/userService';

// ✅ Correct - user management
const profile = await userService.getUserProfile();
await userService.updateUserPreferences({ darkMode: true });
await userService.updateUserPlan('premium');
```

**Don't use for:**
- Authentication/login
- OAuth flows
- Token management

---

## Migration Pattern

### Old Pattern (Deprecated)
```typescript
// ❌ OLD - Don't do this anymore
import { authService } from '../services/authService';

const profile = await authService.getUserProfile(); // Wrong service!
await authService.updateUserProfile({ name: 'John' }); // Wrong service!
```

### New Pattern (Correct)
```typescript
// ✅ NEW - Use the right services
import { authService } from '../services/authService';
import { userService } from '../services/userService';

// Authentication operations
const loginResult = await authService.login({ email, password });

// User management operations
const profile = await userService.getUserProfile();
await userService.updateUserProfile({ name: 'John' });
```

---

## Code Examples

### Complete Login Flow
```typescript
import { authService } from '../services/authService';
import { userService } from '../services/userService';

// Step 1: Authenticate
const authResult = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});

if (authResult.success) {
  // Step 2: Get full profile
  const profile = await userService.getUserProfile();
  console.log('Logged in as:', profile?.name);
}
```

### Update User Settings
```typescript
import { userService } from '../services/userService';

// Update profile
await userService.updateUserProfile({
  name: 'Jane Doe',
  picture: 'https://example.com/avatar.jpg'
});

// Update preferences
await userService.updateUserPreferences({
  notifications: true,
  darkMode: false,
  analytics: true
});
```

### Subscription Management
```typescript
import { userService } from '../services/userService';

// Upgrade plan
const result = await userService.updateUserPlan('premium');

if (result.success) {
  // Add AI add-on
  await userService.addAddon('ai');
  
  // Get updated profile
  const profile = await userService.getUserProfile();
  console.log('New plan:', profile?.plan);
  console.log('Add-ons:', profile?.addOns);
}
```

---

## API Endpoints Reference

### Auth Service (auth.wihy.ai)
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/register` - Create new account
- `POST /api/auth/verify` - Verify session token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - End session
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Complete reset
- `GET /api/auth/google/authorize` - Google OAuth
- `GET /api/auth/apple/authorize` - Apple OAuth
- `GET /api/auth/microsoft/authorize` - Microsoft OAuth
- `GET /api/auth/facebook/authorize` - Facebook OAuth

### User Service (user.wihy.ai)
- `GET /api/users/me` - Get current user profile
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `PUT /api/users/me` - Update profile
- `POST /api/users/me/avatar` - Upload avatar
- `PUT /api/users/me/password` - Change password
- `GET /api/users/me/preferences` - Get preferences
- `PUT /api/users/me/preferences` - Update preferences
- `PUT /api/users/me/plan` - Update subscription plan
- `POST /api/users/me/addons` - Add subscription add-on
- `DELETE /api/users/me/addons/:addon` - Remove add-on
- `GET /api/users/me/subscription/history` - Get billing history
- `GET /api/users/me/capabilities` - Get plan capabilities
- `PUT /api/users/me/health` - Update health metrics
- `GET /api/users/me/dashboard` - Get user dashboard data

---

## Common Mistakes

### ❌ Wrong: Using authService for user data
```typescript
import { authService } from '../services/authService';

// This method was removed from authService
const profile = await authService.getUserProfile(); // Error!
```

### ✅ Correct: Using userService for user data
```typescript
import { userService } from '../services/userService';

const profile = await userService.getUserProfile(); // Works!
```

---

### ❌ Wrong: Using userService for authentication
```typescript
import { userService } from '../services/userService';

// userService doesn't have login methods
const result = await userService.login({ email, password }); // Error!
```

### ✅ Correct: Using authService for authentication
```typescript
import { authService } from '../services/authService';

const result = await authService.login({ email, password }); // Works!
```

---

## Testing the Services

### Check Current User
```typescript
import { userService } from '../services/userService';

const profile = await userService.getUserProfile();
console.log('User:', profile);
```

### Verify Authentication
```typescript
import { authService } from '../services/authService';

const session = await authService.verifySession();
console.log('Session valid:', session.valid);
console.log('User:', session.user);
```

---

## Backend Requirements

For the service separation to work correctly, ensure the backend implements:

### User Service Endpoints
The backend must add these fields to `GET /api/users/me` response:
- `role` - User role (e.g., 'user', 'coach', 'admin')
- `plan` - Current subscription plan
- `planStatus` - Subscription status
- `addOns` - Array of active add-ons
- `capabilities` - Computed plan capabilities
- `healthScore` - Current health score
- `streakDays` - Current streak count

See [BACKEND_API_REQUIRED_FIXES.md](./BACKEND_API_REQUIRED_FIXES.md) for details.

---

## Related Documentation

- [WIHY API Reference](./WIHY_API_REFERENCE.md) - Complete API documentation
- [API Service Routing Fixes](./API_SERVICE_ROUTING_FIXES.md) - Migration history
- [Backend API Requirements](./BACKEND_API_REQUIRED_FIXES.md) - Backend changes needed

---

## Quick Reference

```typescript
// Authentication → authService
import { authService } from '../services/authService';
authService.login(), .register(), .logout(), .verifySession()

// User Management → userService
import { userService } from '../services/userService';
userService.getUserProfile(), .updateUserProfile(), .updateUserPreferences()

// Always import both if you need both auth AND user operations
import { authService } from '../services/authService';
import { userService } from '../services/userService';
```
