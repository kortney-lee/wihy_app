# Auth Service API Reference

> **Base URL:** `https://auth.wihy.ai`  
> **Client File:** `src/services/authService.ts`  
> **Last Updated:** January 10, 2026

---

## Overview

The Auth Service (`auth.wihy.ai`) handles all authentication, user management, and identity-related operations. This is separate from the Services API (`services.wihy.ai`) which handles business logic.

### Architecture

```
┌─────────────────────────────────────────────┐
│           Mobile App (React Native)          │
├─────────────────────────────────────────────┤
│              authService.ts                  │
│  - Authentication (Local + OAuth)            │
│  - User Profile Management                   │
│  - Plans & Subscriptions                     │
│  - Family Management                         │
│  - Coach Management                          │
│  - Organizations                             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│        Auth Backend (auth.wihy.ai)           │
│  - User identity & sessions                  │
│  - OAuth2 server                             │
│  - Plan management                           │
│  - Family/Coach/Org relationships            │
└─────────────────────────────────────────────┘
```

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Profile Management](#user-profile-management)
3. [Plans & Subscriptions](#plans--subscriptions)
4. [Family Management](#family-management)
5. [Coach Management](#coach-management)
6. [Organization Management](#organization-management)
7. [Types Reference](#types-reference)
8. [Endpoints Table](#endpoints-table)
9. [Backend Implementation Checklist](#backend-implementation-checklist)

---

## Authentication

### Local Login

```typescript
import { authService } from '../services/authService';

const result = await authService.loginLocal(
  'user@example.com',
  'password123',
  'wihy://auth/callback',  // Optional redirect URI
  'state-token'            // Optional state for CSRF protection
);

// Response
{
  success: true,
  session_token: 'eyJhbGc...',
  user: {
    email: 'user@example.com',
    name: 'John Doe',
    provider: 'local',
    id: 'user_123'
  }
}
```

### Local Registration

```typescript
const result = await authService.registerLocal(
  'user@example.com',
  'password123',
  'John Doe',
  {
    redirectUri: 'wihy://auth/callback',
    state: 'register-state'
  }
);

// Response
{
  success: true,
  session_token: 'eyJhbGc...',
  user: { ... }
}
```

### OAuth Login

```typescript
// Returns URL to redirect user to
const googleUrl = authService.getGoogleAuthUrl('random-state-123');
// => https://auth.wihy.ai/api/auth/google/authorize?client_id=wihy_native_2025&redirect_uri=wihy://auth/callback&state=random-state-123

const facebookUrl = authService.getFacebookAuthUrl('state-456');
const microsoftUrl = authService.getMicrosoftAuthUrl('state-789');
```

### Session Management

```typescript
// Get current session token
const token = await authService.getSessionToken();

// Verify session is valid
const isValid = await authService.verifySession();

// Store session token (e.g., from OAuth callback)
await authService.storeSessionToken('eyJhbGc...');

// Logout
await authService.logout();
```

---

## User Profile Management

### Get Current User Profile

```typescript
const profile = await authService.getUserProfile();

// Returns: UserProfile
{
  id: 'user_123',
  email: 'user@example.com',
  name: 'John Doe',
  picture: 'https://...',
  provider: 'google',
  plan: 'pro',
  addOns: ['family', 'ai-unlimited'],
  capabilities: {
    meals: true,
    workouts: true,
    family: true,
    coachPlatform: false,
    wihyAI: true,
    instacart: true,
    adminDashboard: false,
    usageAnalytics: true,
    roleManagement: false,
    whiteLabel: false
  },
  familyId: 'family_abc',
  familyRole: 'guardian',
  guardianCode: 'SMITH2026',
  coachId: null,
  healthScore: 85,
  streakDays: 12,
  memberSince: '2025-06-15'
}
```

### Update Profile

```typescript
const result = await authService.updateProfile({
  name: 'John Smith',
  picture: 'https://new-avatar.jpg'
});
```

### Update Preferences

```typescript
await authService.updatePreferences({
  notifications: true,
  biometrics: true,
  darkMode: false,
  analytics: true,
  autoScan: true
});
```

### Get User Capabilities

```typescript
const capabilities = await authService.getUserCapabilities();

// Returns: UserCapabilities
{
  meals: true,
  workouts: true,
  family: true,
  coachPlatform: false,
  wihyAI: true,
  instacart: true,
  adminDashboard: false,
  usageAnalytics: true,
  roleManagement: false,
  whiteLabel: false
}
```

---

## Plans & Subscriptions

### Get All Plans

```typescript
const plans = await authService.getPlans();

// Returns: PlanDetails[]
[
  {
    name: 'free',
    displayName: 'Free',
    price: 0,
    interval: 'month',
    description: 'Basic health tracking',
    features: ['Meal logging', 'Basic analytics'],
    capabilities: { meals: true, workouts: false, ... }
  },
  {
    name: 'pro',
    displayName: 'Pro',
    price: 9.99,
    interval: 'month',
    description: 'Full health suite',
    features: ['All Free features', 'AI recommendations', ...],
    capabilities: { meals: true, workouts: true, wihyAI: true, ... }
  }
]
```

### Get Plan Details

```typescript
const plan = await authService.getPlanDetails('pro');
```

### Update User Plan

```typescript
const result = await authService.updatePlan('pro');

// Response
{
  success: true,
  message: 'Plan updated to pro',
  capabilities: { ... }
}
```

### Manage Add-ons

```typescript
// Add an add-on
await authService.addAddon('family');

// Remove an add-on
await authService.removeAddon('family');
```

### Get Subscription History

```typescript
const history = await authService.getSubscriptionHistory();

// Returns
[
  {
    plan: 'pro',
    startedAt: '2025-06-15',
    endedAt: null,
    status: 'active'
  },
  {
    plan: 'free',
    startedAt: '2025-01-01',
    endedAt: '2025-06-14',
    status: 'completed'
  }
]
```

---

## Family Management

### Create Family

```typescript
const result = await authService.createFamily('The Smiths', 'family-basic');

// Response
{
  success: true,
  data: {
    id: 'family_abc123',
    ownerId: 'user_123',
    name: 'The Smiths',
    plan: 'family-basic',
    memberLimit: 6,
    memberCount: 1,
    guardianCode: 'SMITH2026',
    createdAt: '2026-01-10T...'
  }
}
```

### Get Family

```typescript
const family = await authService.getFamily('family_abc123');

// Returns: Family
{
  id: 'family_abc123',
  ownerId: 'user_123',
  name: 'The Smiths',
  plan: 'family-basic',
  memberLimit: 6,
  memberCount: 4,
  guardianCode: 'SMITH2026',
  createdAt: '2026-01-10T...'
}
```

### Update Family

```typescript
await authService.updateFamily('family_abc123', {
  name: 'The Johnson Family'
});
```

### Get Guardian Code

```typescript
const result = await authService.getGuardianCode('family_abc123');

// Returns
{
  guardianCode: 'SMITH2026'
}
```

### Regenerate Guardian Code

```typescript
const result = await authService.regenerateGuardianCode('family_abc123');

// Returns
{
  guardianCode: 'NEWCODE99'
}
```

### Join Family (Child/Member)

```typescript
const result = await authService.joinFamily('SMITH2026');

// Response
{
  success: true,
  data: {
    id: 'family_abc123',
    name: 'The Smiths',
    ...
  }
}
```

### Leave Family

```typescript
const result = await authService.leaveFamily();

// Response
{
  success: true,
  message: 'Left family successfully'
}
```

### List Family Members

```typescript
const result = await authService.listFamilyMembers('family_abc123');

// Returns
{
  familyId: 'family_abc123',
  members: [
    {
      userId: 'user_123',
      name: 'Dad',
      email: 'dad@example.com',
      role: 'guardian',
      healthScore: 85,
      streakDays: 12,
      joinedAt: '2026-01-10'
    },
    {
      userId: 'user_456',
      name: 'Johnny',
      role: 'child',
      healthScore: 92,
      streakDays: 5,
      joinedAt: '2026-01-11'
    }
  ],
  totalCount: 2
}
```

### Remove Family Member

```typescript
const result = await authService.removeFamilyMember('family_abc123', 'user_456');

// Response
{
  success: true,
  message: 'Member removed from family'
}
```

---

## Coach Management

### Create Coach Profile

```typescript
const result = await authService.createCoach('coach_basic', 0.10);

// Response
{
  success: true,
  data: {
    id: 'coach_xyz',
    userId: 'user_123',
    plan: 'coach_basic',
    commissionRate: 0.10,
    totalRevenue: 0,
    clientCount: 0,
    isVerified: false,
    createdAt: '2026-01-10T...'
  }
}
```

### Get Coach Profile

```typescript
const coach = await authService.getCoach('coach_xyz');

// Returns: Coach
{
  id: 'coach_xyz',
  userId: 'user_123',
  name: 'Coach John',
  email: 'john@example.com',
  plan: 'coach_pro',
  commissionRate: 0.15,
  totalRevenue: 5420.00,
  clientCount: 12,
  stripeConnectAccountId: 'acct_123',
  isVerified: true,
  createdAt: '2025-03-15'
}
```

### Update Coach Profile

```typescript
await authService.updateCoach('coach_xyz', {
  commissionRate: 0.12,
  plan: 'coach_pro'
});
```

### List Coach Clients

```typescript
const result = await authService.listCoachClients('coach_xyz');

// Returns
{
  coachId: 'coach_xyz',
  clients: [
    {
      clientId: 'user_abc',
      name: 'Client 1',
      email: 'client1@example.com',
      plan: 'pro',
      healthScore: 78,
      startedAt: '2025-06-01',
      isActive: true
    },
    {
      clientId: 'user_def',
      name: 'Client 2',
      startedAt: '2025-08-15',
      isActive: true
    }
  ],
  totalCount: 2
}
```

### Add Coach Client

```typescript
const result = await authService.addCoachClient(
  'coach_xyz',
  'user_newclient',
  'Referred from Instagram'  // Optional notes
);

// Response
{
  success: true,
  data: {
    clientId: 'user_newclient',
    startedAt: '2026-01-10',
    isActive: true
  }
}
```

### Remove Coach Client

```typescript
const result = await authService.removeCoachClient('coach_xyz', 'user_abc');

// Response
{
  success: true,
  message: 'Client removed from roster'
}
```

### Get Coach Revenue

```typescript
const revenue = await authService.getCoachRevenue('coach_xyz');

// Returns
{
  coachId: 'coach_xyz',
  totalRevenue: 5420.00,
  pendingPayout: 542.00,
  lastPayout: {
    amount: 480.00,
    date: '2026-01-01',
    status: 'completed'
  },
  monthlyBreakdown: [
    { month: '2026-01', revenue: 620.00 },
    { month: '2025-12', revenue: 580.00 }
  ]
}
```

### Connect Stripe Account

```typescript
const result = await authService.connectStripeAccount('coach_xyz', 'acct_stripe_123');

// Response
{
  success: true,
  data: {
    stripeConnectAccountId: 'acct_stripe_123',
    isVerified: true
  }
}
```

### Get Payout History

```typescript
const payouts = await authService.getCoachPayouts('coach_xyz');

// Returns
[
  {
    id: 'payout_123',
    amount: 480.00,
    status: 'completed',
    initiatedAt: '2026-01-01',
    completedAt: '2026-01-03'
  },
  {
    id: 'payout_122',
    amount: 520.00,
    status: 'completed',
    initiatedAt: '2025-12-01',
    completedAt: '2025-12-03'
  }
]
```

---

## Organization Management

### Create Organization

```typescript
const result = await authService.createOrganization({
  name: 'FitCorp Inc',
  type: 'corporate',
  plan: 'enterprise',
  contactEmail: 'admin@fitcorp.com',
  billingEmail: 'billing@fitcorp.com',
  licenseCount: 100
});

// Response
{
  success: true,
  data: {
    id: 'org_fitcorp',
    name: 'FitCorp Inc',
    type: 'corporate',
    plan: 'enterprise',
    licenseCount: 100,
    activeUsers: 0,
    isActive: true,
    createdAt: '2026-01-10'
  }
}
```

### Get Organization

```typescript
const org = await authService.getOrganization('org_fitcorp');

// Returns: Organization
{
  id: 'org_fitcorp',
  name: 'FitCorp Inc',
  type: 'corporate',
  plan: 'enterprise',
  licenseCount: 100,
  activeUsers: 45,
  contactEmail: 'admin@fitcorp.com',
  billingEmail: 'billing@fitcorp.com',
  whiteLabelConfig: {
    logo: 'https://fitcorp.com/logo.png',
    primaryColor: '#FF5500',
    appName: 'FitCorp Wellness'
  },
  isActive: true,
  createdAt: '2026-01-10'
}
```

### Update Organization

```typescript
await authService.updateOrganization('org_fitcorp', {
  name: 'FitCorp Health',
  licenseCount: 150
});
```

### Add Organization Member

```typescript
const result = await authService.addOrganizationMember(
  'org_fitcorp',
  'newuser@fitcorp.com',
  'member'  // 'admin' | 'member'
);
```

### Remove Organization Member

```typescript
await authService.removeOrganizationMember('org_fitcorp', 'user_123');
```

### Get Organization Members

```typescript
const members = await authService.getOrganizationMembers('org_fitcorp');

// Returns: OrganizationMember[]
[
  {
    userId: 'user_123',
    email: 'admin@fitcorp.com',
    name: 'Admin User',
    role: 'admin',
    joinedAt: '2026-01-10',
    isActive: true
  },
  ...
]
```

### Get Organization Analytics

```typescript
const analytics = await authService.getOrganizationAnalytics('org_fitcorp');
```

### Get Organization Billing

```typescript
const billing = await authService.getOrganizationBilling('org_fitcorp');
```

---

## Types Reference

### Core Types

```typescript
// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User Profile
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'local' | 'google' | 'facebook' | 'microsoft';
  plan: string;
  addOns?: string[];
  capabilities: UserCapabilities;
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

// User Capabilities
export interface UserCapabilities {
  meals: boolean;
  workouts: boolean;
  family: boolean;
  coachPlatform: boolean;
  wihyAI: boolean;
  instacart: boolean;
  adminDashboard: boolean;
  usageAnalytics: boolean;
  roleManagement: boolean;
  whiteLabel: boolean;
}

// User Preferences
export interface UserPreferences {
  notifications: boolean;
  biometrics: boolean;
  darkMode: boolean;
  analytics: boolean;
  autoScan: boolean;
}
```

### Family Types

```typescript
export interface Family {
  id: string;
  ownerId: string;
  name: string;
  plan: string;
  memberLimit: number;
  memberCount?: number;
  guardianCode: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FamilyMember {
  userId: string;
  name?: string;
  email?: string;
  role: string;  // 'guardian' | 'child' | 'member'
  healthScore?: number;
  streakDays?: number;
  joinedAt: string;
}
```

### Coach Types

```typescript
export interface Coach {
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
  updatedAt?: string;
}

export interface CoachClient {
  clientId: string;
  name?: string;
  email?: string;
  plan?: string;
  healthScore?: number;
  startedAt: string;
  isActive: boolean;
}
```

### Organization Types

```typescript
export interface Organization {
  id: string;
  name: string;
  type: string;
  plan: string;
  licenseCount: number;
  activeUsers: number;
  contactEmail: string;
  contactPhone?: string;
  billingEmail: string;
  whiteLabelConfig?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    appName?: string;
  };
  customDomain?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface OrganizationMember {
  userId: string;
  email?: string;
  name?: string;
  role: string;  // 'admin' | 'member'
  joinedAt: string;
  isActive: boolean;
}
```

### Plan Types

```typescript
export interface PlanDetails {
  name: string;
  displayName: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  capabilities: UserCapabilities;
  limits?: {
    familyMembers?: number;
    requestsPerHour?: number;
    aiMessagesPerDay?: number;
  };
}
```

---

## Endpoints Table

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/local/login` | Login with email/password |
| POST | `/api/auth/local/register` | Register new account |
| GET | `/api/auth/google/authorize` | Start Google OAuth |
| GET | `/api/auth/facebook/authorize` | Start Facebook OAuth |
| GET | `/api/auth/microsoft/authorize` | Start Microsoft OAuth |
| POST | `/api/auth/verify` | Verify session token |
| POST | `/api/auth/logout` | Logout and invalidate token |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update profile |
| PUT | `/api/users/me/preferences` | Update preferences |
| PUT | `/api/users/me/plan` | Change subscription plan |
| POST | `/api/users/me/addons` | Add subscription add-on |
| DELETE | `/api/users/me/addons` | Remove subscription add-on |
| GET | `/api/users/me/capabilities` | Get feature capabilities |
| GET | `/api/users/me/subscriptions` | Get subscription history |

### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plans` | List all available plans |
| GET | `/api/plans/:id` | Get specific plan details |

### Family

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/families` | Create new family |
| GET | `/api/families/:id` | Get family details |
| PUT | `/api/families/:id` | Update family |
| GET | `/api/families/:id/guardian-code` | Get guardian invite code |
| POST | `/api/families/:id/regenerate-code` | Generate new guardian code |
| POST | `/api/families/join` | Join family with code |
| POST | `/api/families/leave` | Leave current family |
| GET | `/api/families/:id/members` | List family members |
| DELETE | `/api/families/:id/members/:userId` | Remove family member |

### Coach

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coaches` | Create coach profile |
| GET | `/api/coaches/:id` | Get coach details |
| PUT | `/api/coaches/:id` | Update coach profile |
| GET | `/api/coaches/:id/clients` | List coach clients |
| POST | `/api/coaches/:id/clients` | Add client to roster |
| DELETE | `/api/coaches/:id/clients/:clientId` | Remove client |
| GET | `/api/coaches/:id/revenue` | Get revenue summary |
| POST | `/api/coaches/:id/connect-stripe` | Connect Stripe account |
| GET | `/api/coaches/:id/payouts` | Get payout history |

### Organization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/organizations` | Create organization |
| GET | `/api/organizations/:id` | Get organization details |
| PUT | `/api/organizations/:id` | Update organization |
| GET | `/api/organizations/:id/members` | List members |
| POST | `/api/organizations/:id/members` | Add member |
| DELETE | `/api/organizations/:id/members/:userId` | Remove member |
| GET | `/api/organizations/:id/analytics` | Get usage analytics |
| GET | `/api/organizations/:id/billing` | Get billing info |

---

## Backend Implementation Checklist

### ✅ Authentication
- [x] POST `/api/auth/local/login`
- [x] POST `/api/auth/local/register`
- [x] GET `/api/auth/google/authorize`
- [x] GET `/api/auth/facebook/authorize`
- [x] GET `/api/auth/microsoft/authorize`
- [x] POST `/api/auth/verify`
- [x] POST `/api/auth/logout`
- [x] GET `/api/health`

### ⚠️ User Management
- [ ] GET `/api/users/me`
- [ ] PUT `/api/users/me`
- [ ] PUT `/api/users/me/preferences`
- [ ] PUT `/api/users/me/plan`
- [ ] POST `/api/users/me/addons`
- [ ] DELETE `/api/users/me/addons`
- [ ] GET `/api/users/me/capabilities`
- [ ] GET `/api/users/me/subscriptions`

### ⚠️ Plans
- [ ] GET `/api/plans`
- [ ] GET `/api/plans/:id`

### ⚠️ Family
- [ ] POST `/api/families`
- [ ] GET `/api/families/:id`
- [ ] PUT `/api/families/:id`
- [ ] GET `/api/families/:id/guardian-code`
- [ ] POST `/api/families/:id/regenerate-code`
- [ ] POST `/api/families/join`
- [ ] POST `/api/families/leave`
- [ ] GET `/api/families/:id/members`
- [ ] DELETE `/api/families/:id/members/:userId`

### ⚠️ Coach
- [ ] POST `/api/coaches`
- [ ] GET `/api/coaches/:id`
- [ ] PUT `/api/coaches/:id`
- [ ] GET `/api/coaches/:id/clients`
- [ ] POST `/api/coaches/:id/clients`
- [ ] DELETE `/api/coaches/:id/clients/:clientId`
- [ ] GET `/api/coaches/:id/revenue`
- [ ] POST `/api/coaches/:id/connect-stripe`
- [ ] GET `/api/coaches/:id/payouts`

### ⚠️ Organization
- [ ] POST `/api/organizations`
- [ ] GET `/api/organizations/:id`
- [ ] PUT `/api/organizations/:id`
- [ ] GET `/api/organizations/:id/members`
- [ ] POST `/api/organizations/:id/members`
- [ ] DELETE `/api/organizations/:id/members/:userId`
- [ ] GET `/api/organizations/:id/analytics`
- [ ] GET `/api/organizations/:id/billing`

---

## Field Naming Convention

The client normalizes both camelCase and snake_case responses:

| Backend (snake_case) | Client (camelCase) |
|----------------------|--------------------|
| `guardian_code` | `guardianCode` |
| `member_limit` | `memberLimit` |
| `member_count` | `memberCount` |
| `owner_id` | `ownerId` |
| `created_by` | `ownerId` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `user_id` | `userId` |
| `joined_at` | `joinedAt` |
| `health_score` | `healthScore` |
| `streak_days` | `streakDays` |
| `client_id` | `clientId` |
| `started_at` | `startedAt` |
| `is_active` | `isActive` |

---

## Import Guide

```typescript
// Import service instance
import { authService } from '../services/authService';

// Import types
import type {
  UserProfile,
  UserCapabilities,
  Family,
  FamilyMember,
  Coach,
  CoachClient,
  Organization,
  OrganizationMember,
  PlanDetails,
  ApiResponse,
} from '../services/authService';
```

---

*Document generated January 10, 2026*
