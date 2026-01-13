# Auth Service API Reference

> **Base URL:** `https://auth.wihy.ai`  
> **Service File:** `src/services/authService.ts`  
> **Last Updated:** January 10, 2026

---

## Overview

The Auth Service (`authService.ts`) handles all authentication, user management, family, and coach functionality through the `auth.wihy.ai` backend. This is the primary service for user identity, subscriptions, and relationship management.

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Profile](#user-profile)
3. [Plans & Subscriptions](#plans--subscriptions)
4. [Family Management](#family-management)
5. [Coach Management](#coach-management)
6. [Organizations](#organizations)
7. [Types Reference](#types-reference)

---

## Authentication

### Local Authentication

#### `loginLocal(email, password)`
Authenticate user with email and password.

```typescript
const result = await authService.loginLocal('user@example.com', 'password123');
// Returns: { success: true, user: User, token: string }
```

#### `registerLocal(email, password, name, options?)`
Register new user account.

```typescript
const result = await authService.registerLocal(
  'user@example.com',
  'password123',
  'John Doe',
  { plan: 'premium', referralCode: 'ABC123' }
);
```

### OAuth Authentication

#### `loginWithGoogle()`, `loginWithFacebook()`, `loginWithMicrosoft()`
Initiate OAuth flow with respective provider.

```typescript
await authService.loginWithGoogle();
// Opens browser for OAuth, returns via deep link
```

### Session Management

#### `getSessionToken()` / `setSessionToken(token)`
Get/set current session token.

```typescript
const token = await authService.getSessionToken();
await authService.setSessionToken('new_token');
```

#### `validateSession()`
Verify current session is valid.

```typescript
const isValid = await authService.validateSession();
```

#### `logout()`
End current session and clear tokens.

```typescript
await authService.logout();
```

---

## User Profile

### `getUserProfile()`
Get current user's profile.

```typescript
const profile = await authService.getUserProfile();
// Returns: UserProfile
```

**Response Type:**
```typescript
interface UserProfile {
  id: string;
  email: string;
  name?: string;
  plan: string;
  capabilities?: UserCapabilities;
  familyId?: string;
  coachId?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt?: string;
}
```

### `updateUserProfile(updates)`
Update user profile fields.

```typescript
const result = await authService.updateUserProfile({
  name: 'Jane Doe',
  avatar: 'https://example.com/avatar.jpg'
});
```

### `updateUserPlan(plan)`
Change user's subscription plan.

```typescript
const result = await authService.updateUserPlan('family-premium');
```

### `addUserAddon(addon)` / `removeUserAddon(addon)`
Add or remove subscription add-ons.

```typescript
await authService.addUserAddon('wihy_ai');
await authService.removeUserAddon('instacart_pro');
```

### `getUserCapabilities()`
Get user's feature capabilities based on plan.

```typescript
const caps = await authService.getUserCapabilities();
// Returns: { meals: true, wihyAI: false, family: true, ... }
```

---

## Plans & Subscriptions

### `getPlans()`
List all available subscription plans.

```typescript
const plans = await authService.getPlans();
// Returns: Plan[]
```

### `getPlanDetails(planId)`
Get detailed information about a specific plan.

```typescript
const plan = await authService.getPlanDetails('family-premium');
```

### `getSubscriptionHistory()`
Get user's subscription history.

```typescript
const history = await authService.getSubscriptionHistory();
```

---

## Family Management

### Creating & Managing Families

#### `createFamily(name, plan)`
Create a new family group.

```typescript
const result = await authService.createFamily('The Smiths', 'family-basic');
// Returns: { success: true, data: Family }
```

**Request Body (sent to API):**
```json
{
  "name": "The Smiths",
  "plan": "family-basic"
}
```

**Expected API Response:**
```json
{
  "family": {
    "id": "family_123",
    "ownerId": "user_456",      // OR "owner_id" (snake_case)
    "name": "The Smiths",
    "plan": "family-basic",
    "memberLimit": 6,            // OR "max_members" / "member_limit"
    "memberCount": 1,            // OR "member_count"
    "guardianCode": "ABC12345",  // OR "guardian_code"
    "createdAt": "2026-01-10T..."  // OR "created_at"
  }
}
```

> ⚠️ **Note:** The client normalizes both camelCase and snake_case responses.

**Response Type:**
```typescript
interface Family {
  id: string;
  ownerId: string;
  name: string;
  plan: string;
  memberLimit: number;
  memberCount?: number;
  guardianCode: string;
  createdAt: string;
}
```

#### `getFamily(familyId)`
Get family details.

```typescript
const family = await authService.getFamily('family_123');
```

#### `updateFamily(familyId, updates)`
Update family settings.

```typescript
await authService.updateFamily('family_123', { name: 'The Johnsons' });
```

### Guardian Codes

#### `getGuardianCode(familyId)`
Get the current guardian invite code.

```typescript
const code = await authService.getGuardianCode('family_123');
// Returns: { guardianCode: 'ABC12345' } OR { guardian_code: 'ABC12345' }
```

#### `regenerateGuardianCode(familyId)`
Generate a new guardian code (invalidates old one).

```typescript
const result = await authService.regenerateGuardianCode('family_123');
// Returns: { success: true, data: { guardianCode: 'XYZ98765' } }
// OR: { success: true, data: { guardian_code: 'XYZ98765' } }
```

### Family Membership

#### `joinFamily(guardianCode)`
Join an existing family using guardian code.

```typescript
const result = await authService.joinFamily('ABC12345');
// Returns: { success: true, data: Family }
```

**Request Body:**
```json
{
  "guardianCode": "ABC12345"
}
```

#### `leaveFamily(familyId)`
Leave current family.

```typescript
await authService.leaveFamily('family_123');
```

#### `listFamilyMembers(familyId)`
Get all members of a family.

```typescript
const members = await authService.listFamilyMembers('family_123');
// Returns: { members: FamilyMember[] }
```

**Expected API Response:**
```json
{
  "members": [
    {
      "userId": "user_123",         // OR "user_id" / "id"
      "name": "John Smith",
      "email": "john@example.com",
      "role": "guardian",           // OR "GUARDIAN"
      "healthScore": 85,            // OR "health_score"
      "streakDays": 7,              // OR "streak_days"
      "joinedAt": "2026-01-01T..."  // OR "joined_at"
    }
  ]
}
```

**FamilyMember Type:**
```typescript
interface FamilyMember {
  userId: string;
  name?: string;
  email?: string;
  role: string;  // 'guardian' | 'member'
  healthScore?: number;
  streakDays?: number;
  joinedAt: string;
}
```

#### `removeFamilyMember(familyId, userId)`
Remove a member from the family (guardian only).

```typescript
await authService.removeFamilyMember('family_123', 'user_456');
```

---

## Coach Management

### Becoming a Coach

#### `createCoach(plan, commissionRate)`
Create a coach profile for current user.

```typescript
const result = await authService.createCoach('coach_basic', 0.1); // 10% commission
// Returns: { success: true, data: Coach }
```

**Coach Type:**
```typescript
interface Coach {
  id: string;
  userId: string;
  name?: string;
  email?: string;
  plan: string;
  commissionRate: number;
  totalRevenue: number;
  clientCount: number;
  stripeConnectAccountId?: string;
  isVerified: boolean;
  createdAt: string;
}
```

#### `getCoach(coachId)`
Get coach profile details.

```typescript
const coach = await authService.getCoach('coach_123');
```

#### `updateCoach(coachId, updates)`
Update coach profile.

```typescript
await authService.updateCoach('coach_123', {
  name: 'Coach John',
  commissionRate: 0.15
});
```

### Client Management

#### `addCoachClient(coachId, clientId, notes?)`
Add a client to coach's roster.

```typescript
const result = await authService.addCoachClient(
  'coach_123',
  'user_456',
  'New client from referral'
);
```

#### `listCoachClients(coachId)`
Get all clients for a coach.

```typescript
const clients = await authService.listCoachClients('coach_123');
// Returns: { clients: CoachClient[] }
```

**CoachClient Type:**
```typescript
interface CoachClient {
  clientId: string;
  name?: string;
  email?: string;
  plan?: string;
  healthScore?: number;
  startedAt: string;
  isActive: boolean;
}
```

#### `removeCoachClient(coachId, clientId)`
Remove a client from coach's roster.

```typescript
await authService.removeCoachClient('coach_123', 'user_456');
```

### Revenue & Payouts

#### `getCoachRevenue(coachId)`
Get revenue summary for coach.

```typescript
const revenue = await authService.getCoachRevenue('coach_123');
// Returns: { totalRevenue, pendingPayout, lastPayoutDate, ... }
```

#### `connectStripeAccount(coachId)`
Initiate Stripe Connect onboarding.

```typescript
const { url } = await authService.connectStripeAccount('coach_123');
// Redirect user to url for Stripe onboarding
```

#### `getPayoutHistory(coachId)`
Get historical payout records.

```typescript
const history = await authService.getPayoutHistory('coach_123');
```

---

## Organizations

### `createOrganization(name, plan)`
Create a new organization.

```typescript
const result = await authService.createOrganization('Acme Health', 'enterprise');
```

### `getOrganization(orgId)`
Get organization details.

```typescript
const org = await authService.getOrganization('org_123');
```

### `addOrganizationMember(orgId, email, role)`
Invite member to organization.

```typescript
await authService.addOrganizationMember('org_123', 'user@example.com', 'admin');
```

### `removeOrganizationMember(orgId, userId)`
Remove member from organization.

```typescript
await authService.removeOrganizationMember('org_123', 'user_456');
```

---

## Types Reference

### Core Types

```typescript
// API Response wrapper
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User capabilities based on plan
interface UserCapabilities {
  meals: boolean;
  fitness: boolean;
  research: boolean;
  wihyAI: boolean;
  instacart: boolean;
  family: boolean;
  coachPlatform: boolean;
}

// Available plans
type PlanType = 
  | 'free'
  | 'premium'
  | 'family-basic'
  | 'family-premium'
  | 'coach'
  | 'coach-family'
  | 'enterprise';

// Available add-ons
type AddonType = 
  | 'wihy_ai'
  | 'instacart_pro';
```

### Authentication Types

```typescript
interface AuthResult {
  success: boolean;
  user?: UserProfile;
  token?: string;
  error?: string;
}

interface HealthCheckResponse {
  status: string;
  encryption: string;
  timestamp: string;
  providers: {
    local: boolean;
    oauth: string[];
    oauth2: boolean;
  };
}
```

---

## Endpoints Reference

| Category | Method | Endpoint |
|----------|--------|----------|
| **Auth** | POST | `/api/auth/local/login` |
| | POST | `/api/auth/local/register` |
| | GET | `/api/auth/google/authorize` |
| | GET | `/api/auth/facebook/authorize` |
| | GET | `/api/auth/microsoft/authorize` |
| | POST | `/api/auth/verify` |
| | POST | `/api/auth/logout` |
| **User** | GET | `/api/users/me` |
| | PUT | `/api/users/me` |
| | PUT | `/api/users/me/plan` |
| | POST | `/api/users/me/addons` |
| | DELETE | `/api/users/me/addons` |
| | GET | `/api/users/me/capabilities` |
| **Plans** | GET | `/api/plans` |
| | GET | `/api/plans/:id` |
| **Family** | POST | `/api/families` |
| | GET | `/api/families/:id` |
| | PUT | `/api/families/:id` |
| | POST | `/api/families/join` |
| | POST | `/api/families/leave` |
| | GET | `/api/families/:id/members` |
| | DELETE | `/api/families/:id/members/:userId` |
| | GET | `/api/families/:id/guardian-code` |
| | POST | `/api/families/:id/regenerate-code` |
| **Coach** | POST | `/api/coaches` |
| | GET | `/api/coaches/:id` |
| | PUT | `/api/coaches/:id` |
| | GET | `/api/coaches/:id/clients` |
| | POST | `/api/coaches/:id/clients` |
| | DELETE | `/api/coaches/:id/clients/:clientId` |
| | GET | `/api/coaches/:id/revenue` |
| | POST | `/api/coaches/:id/connect-stripe` |
| | GET | `/api/coaches/:id/payouts` |
| **Org** | POST | `/api/organizations` |
| | GET | `/api/organizations/:id` |
| | PUT | `/api/organizations/:id` |
| | POST | `/api/organizations/:id/members` |
| | DELETE | `/api/organizations/:id/members/:userId` |

---

## Backend Implementation Requirements

> **Important:** The backend must implement these endpoints with the exact request/response formats documented above.

### Family Endpoints Checklist

| Endpoint | Method | Request Body | Response |
|----------|--------|--------------|----------|
| `/api/families` | POST | `{ name, plan }` | `{ family: Family }` |
| `/api/families/:id` | GET | - | `Family` |
| `/api/families/:id` | PUT | `{ name? }` | `{ family: Family }` |
| `/api/families/:id/guardian-code` | GET | - | `{ guardianCode }` or `{ guardian_code }` |
| `/api/families/:id/regenerate-code` | POST | - | `{ guardianCode }` or `{ guardian_code }` |
| `/api/families/join` | POST | `{ guardianCode }` | `{ family: Family }` |
| `/api/families/:id/members` | GET | - | `{ members: FamilyMember[] }` |
| `/api/families/:id/members/:userId` | DELETE | - | `{ success: true }` |
| `/api/families/leave` | POST | `{ familyId }` | `{ success: true }` |

### Coach Endpoints Checklist

| Endpoint | Method | Request Body | Response |
|----------|--------|--------------|----------|
| `/api/coaches` | POST | `{ plan, commissionRate }` | `{ coach: Coach }` |
| `/api/coaches/:id` | GET | - | `Coach` |
| `/api/coaches/:id` | PUT | `{ plan?, commissionRate? }` | `{ coach: Coach }` |
| `/api/coaches/:id/clients` | GET | - | `{ clients: CoachClient[] }` |
| `/api/coaches/:id/clients` | POST | `{ clientId }` | `{ success, relationship }` |
| `/api/coaches/:id/clients/:clientId` | DELETE | - | `{ success: true }` |
| `/api/coaches/:id/revenue` | GET | - | `{ total, pending, history }` |

### Field Name Convention

The client normalizes both **camelCase** and **snake_case** responses. Backend can use either:

| Client Field | Accepted API Fields |
|--------------|---------------------|
| `guardianCode` | `guardianCode`, `guardian_code` |
| `memberLimit` | `memberLimit`, `max_members`, `member_limit` |
| `memberCount` | `memberCount`, `member_count` |
| `ownerId` | `ownerId`, `owner_id`, `created_by` |
| `createdAt` | `createdAt`, `created_at` |
| `userId` | `userId`, `user_id`, `id` |
| `joinedAt` | `joinedAt`, `joined_at` |
| `healthScore` | `healthScore`, `health_score` |
| `streakDays` | `streakDays`, `streak_days` |

---

All methods return `ApiResponse<T>` with `success: boolean`:

```typescript
const result = await authService.createFamily('Test', 'family-basic');

if (result.success) {
  console.log('Family created:', result.data);
} else {
  console.error('Error:', result.error, result.message);
}
```

Common error codes:
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (duplicate email, already member of family, etc.)
- `422` - Validation error

---

## Usage in Components

```typescript
import { authService, Family, FamilyMember, Coach, CoachClient } from '../services/authService';

// In a component
const [family, setFamily] = useState<Family | null>(null);
const [members, setMembers] = useState<FamilyMember[]>([]);

useEffect(() => {
  const loadFamily = async () => {
    const profile = await authService.getUserProfile();
    if (profile?.familyId) {
      const familyData = await authService.getFamily(profile.familyId);
      setFamily(familyData);
      
      const membersData = await authService.listFamilyMembers(profile.familyId);
      if (membersData) {
        setMembers(membersData.members);
      }
    }
  };
  loadFamily();
}, []);
```

---

## Related Documentation

- [SERVICES_API_REFERENCE.md](./SERVICES_API_REFERENCE.md) - Services layer API (services.wihy.ai)
- [COACH_FAMILY_API_GUIDE.md](./COACH_FAMILY_API_GUIDE.md) - Coach & Family API implementation guide
- [COACH_DASHBOARD_ARCHITECTURE.md](./COACH_DASHBOARD_ARCHITECTURE.md) - Dashboard architecture overview

---

*Last Updated: January 10, 2026*
