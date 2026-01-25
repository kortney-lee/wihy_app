# WIHY API Implementation Status

**Date**: January 25, 2026  
**Purpose**: Track alignment between WIHY User & Auth API spec and mobile app implementation

---

## ✅ Completed Additions

### 1. Comprehensive API Types (NEW)
**File**: `mobile/src/types/api.ts`

Created complete TypeScript definitions for all API endpoints:

- **Core Types**: ActivityLevel, Gender, GoalType, UserRole, UserStatus, AuthProvider, PlanType, etc.
- **User Types**: User, UserCapabilities, UserSettings, FamilyMember, CoachInfo
- **Auth Types**: RegisterRequest, LoginRequest, AuthResponse, VerifyTokenResponse, etc.
- **Profile Types**: UpdateProfileRequest, ChangePasswordRequest, UploadAvatarRequest
- **Settings Types**: UpdateSettingsRequest, ToggleNotificationsRequest, UpdatePrivacyRequest
- **Shopping Preferences**: BudgetPreference, OrganicPreference, ShoppingPreferences
- **Family Types**: Family, CreateFamilyRequest, JoinFamilyRequest, AddFamilyMemberRequest
- **Coaching Types**: Coach, CoachFilters, CreateCoachRequest, BookingRequest, Review
- **Goals Types**: Goal, CreateGoalRequest, LogGoalProgressRequest, GoalStats
- **Progress Types**: ProgressPhoto, Measurement, PhotoComparison
- **Wellness Types**: WellnessLog, WellnessSummary, WellnessMetricScore
- **Notifications Types**: NotificationPreferences, Reminder, RegisterPushTokenRequest
- **Global Goals Types**: Challenge, Leaderboard, UserRanking
- **Response Types**: ApiResponse, PaginatedResponse, ListResponse

**All types match WIHY API Reference spec exactly.**

---

### 2. Wellness Service (NEW)
**File**: `mobile/src/services/wellnessService.ts`

Complete implementation of wellness tracking endpoints:

#### Endpoints Implemented:
✅ `POST /api/wellness/logs` - Log daily wellness data  
✅ `GET /api/wellness/summary/:userId` - Get wellness summary with scores  
✅ `GET /api/wellness/logs/:userId` - Get all wellness logs  
✅ `DELETE /api/wellness/logs/:userId/:date` - Delete specific log  

#### Helper Methods:
✅ `getLogForDate()` - Get log for specific date  
✅ `updateLog()` - Update wellness log  
✅ `getWellnessTrends()` - Calculate trends over time  
✅ `hasLoggedToday()` - Check if logged today  
✅ `getWellnessStreak()` - Calculate consecutive days streak  

**Features**:
- Full TypeScript types
- Error handling
- Trend calculation
- Streak tracking
- Comprehensive JSDoc

---

### 3. Type Exports (UPDATED)
**File**: `mobile/src/types/index.ts`

- ✅ Export all API types from centralized `api.ts`
- ✅ Maintain backward compatibility with legacy types
- ✅ Clear documentation for migration

---

### 4. Service Exports (UPDATED)
**File**: `mobile/src/services/index.ts`

- ✅ Export `wellnessService` and `WellnessService` class
- ✅ Export all API types with clear namespacing
- ✅ Re-export types from `../types/api` for convenience

---

## 📋 Existing Services (Pre-Implementation)

These services already exist and implement parts of the API spec:

### Auth Service ✅
**File**: `mobile/src/services/authService.ts`  
**Base URL**: `https://auth.wihy.ai`

#### Implemented Endpoints:
- ✅ `POST /api/auth/register` - Register new user
- ✅ `POST /api/auth/login` - Login with email/password
- ✅ `POST /api/auth/verify` - Verify session token
- ✅ `POST /api/auth/refresh` - Refresh token
- ✅ `POST /api/auth/logout` - Logout
- ✅ `POST /api/auth/forgot-password` - Request password reset
- ✅ `POST /api/auth/reset-password` - Complete password reset
- ✅ `GET /api/auth/providers` - List OAuth providers
- ✅ `GET /api/auth/google/authorize` - Google OAuth
- ✅ `GET /api/auth/facebook/authorize` - Facebook OAuth
- ✅ `GET /api/auth/microsoft/authorize` - Microsoft OAuth
- ✅ `GET /api/auth/apple/authorize` - Apple OAuth

**Status**: ✅ **COMPLETE** - Matches API spec

---

### User Service ✅
**File**: `mobile/src/services/userService.ts`  
**Base URL**: `https://user.wihy.ai`

#### Implemented Endpoints:
- ✅ `GET /api/users/me` - Get current user profile
- ✅ `GET /api/users/:id` - Get user by ID
- ✅ `GET /api/users/email/:email` - Get user by email
- ✅ `PUT /api/users/:id` - Update user
- ✅ `DELETE /api/users/:id` - Delete user
- ✅ `GET /api/users/:id/preferences` - Get preferences
- ✅ `PUT /api/users/:id/preferences` - Update preferences
- ✅ `GET /api/users/:id/permissions` - Get permissions
- ✅ `GET /api/users/:id/dashboard` - Get dashboard

**Status**: ✅ **COMPLETE** for basic user operations

---

### User API Client ✅
**File**: `mobile/src/services/userApiClient.ts`  
**Base URL**: `https://user.wihy.ai`

HTTP client with:
- ✅ JWT authentication
- ✅ Automatic token handling
- ✅ Timeout support (30s)
- ✅ Offline detection
- ✅ Caching support
- ✅ Error handling with 401 auto-logout

**Status**: ✅ **COMPLETE** - Ready for use

---

### Shopping Preferences Service ✅
**File**: `mobile/src/services/shoppingPreferencesService.ts`  
**Base URL**: `https://user.wihy.ai`

#### Implemented Endpoints:
- ✅ `GET /api/users/shopping-preferences/:userId`
- ✅ `POST /api/users/shopping-preferences`
- ✅ `DELETE /api/users/shopping-preferences/:userId`

**Status**: ✅ **COMPLETE** - Matches API spec

---

### Family Service ⚠️
**File**: `mobile/src/services/familyService.ts`  
**Base URL**: `https://user.wihy.ai` (assumed)

#### Implementation Status:
- ⚠️ **PARTIAL** - Has family types and some endpoints
- ❓ Needs review to ensure alignment with API spec
- ❓ Check endpoint paths match spec

**Endpoints to Verify**:
- `GET /api/family` - Get current user's family
- `POST /api/family` - Create family
- `POST /api/family/join` - Join family
- `POST /api/family/members` - Add member
- `DELETE /api/family/members/:memberId` - Remove member
- `PUT /api/family` - Update family
- `DELETE /api/family` - Delete family
- `POST /api/family/regenerate-code` - Regenerate code
- `POST /api/family/leave` - Leave family

---

### Coach Service ⚠️
**File**: `mobile/src/services/coachService.ts`  
**Base URL**: Unknown (needs review)

**Status**: ⚠️ **NEEDS REVIEW** - Verify alignment with spec

**Endpoints to Implement/Verify**:
- `POST /api/coaches` - Create coach profile
- `GET /api/coaches/discover` - Search coaches
- `GET /api/coaches/:coachId/profile` - Get coach profile
- `PUT /api/coaches/:coachId/profile` - Update profile
- `GET /api/coaches/:coachId/overview` - Dashboard overview
- `GET /api/coaches/:coachId/clients` - List clients
- `POST /api/coaches/:coachId/clients` - Add client
- `DELETE /api/coaches/:coachId/clients/:clientId` - Remove client
- `PUT /api/coaches/:coachId/clients/:clientId/status` - Update status
- `POST /api/coaches/:coachId/book` - Book session
- `GET /api/coaches/:coachId/reviews` - Get reviews
- `POST /api/coaches/:coachId/reviews` - Submit review
- `GET /api/coaches/:coachId/availability` - Get availability

---

### Goals Service ⚠️
**File**: `mobile/src/services/goalsService.ts`  
**Base URL**: `https://services.wihy.ai` (different from spec!)

**Status**: ⚠️ **NEEDS UPDATE** - Using wrong base URL

**API Spec Says**: `https://user.wihy.ai/api/goals`  
**Current Implementation**: `https://services.wihy.ai` (?)

**Endpoints to Verify/Update**:
- `POST /api/goals` - Create goal
- `GET /api/goals` - List goals
- `GET /api/goals/active` - Get active goals
- `GET /api/goals/stats` - Get statistics
- `GET /api/goals/:id` - Get goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/progress` - Log progress
- `POST /api/goals/:id/complete` - Mark complete

---

### Progress Service ⚠️
**File**: `mobile/src/services/progressTrackingService.ts`  
**Base URL**: Unknown (needs review)

**Status**: ⚠️ **NEEDS REVIEW** - Verify alignment with spec

**Endpoints to Implement/Verify**:
- `POST /api/progress/photos` - Upload photo
- `GET /api/progress/photos` - Get photo timeline
- `GET /api/progress/photos/comparison` - Get before/after
- `DELETE /api/progress/photos/:id` - Delete photo
- `POST /api/progress/measurements` - Log measurement

---

### Notification Service ⚠️
**File**: `mobile/src/services/notificationService.ts`  
**Base URL**: Unknown (needs review)

**Status**: ⚠️ **NEEDS REVIEW** - Verify alignment with spec

**Endpoints to Implement/Verify**:
- `POST /api/notifications/token` - Register push token
- `DELETE /api/notifications/token` - Deactivate token
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences
- `POST /api/notifications/reminders` - Create reminder
- `GET /api/notifications/reminders` - List reminders
- `PUT /api/notifications/reminders/:id` - Update reminder
- `DELETE /api/notifications/reminders/:id` - Delete reminder

---

## ❌ Missing Services

These services are in the API spec but not yet implemented:

### Global Goals Service ❌
**File**: Does not exist  
**Base URL**: `https://user.wihy.ai`

**Endpoints Needed**:
- `GET /api/global-goals/stats` - Get global stats
- `GET /api/global-goals/ranking/:goalId` - Get user ranking
- `GET /api/global-goals/leaderboard/:goalId` - Get leaderboard
- `GET /api/global-goals/challenges` - Get active challenges

**Priority**: Low - Nice to have feature

---

### Profile Service Updates ❌
**File**: `mobile/src/services/profileService.ts` exists but may need updates

**Endpoints to Add**:
- `POST /api/profile/:userId/avatar` - Upload avatar
- `POST /api/profile/:userId/change-password` - Change password

---

### Settings Service ❌
**File**: Does not exist as separate service

**Endpoints Needed**:
- `GET /api/settings/:userId` - Get settings
- `PUT /api/settings/:userId` - Update settings
- `PATCH /api/settings/:userId/notifications` - Toggle notifications
- `PATCH /api/settings/:userId/privacy` - Update privacy

**Note**: May be implemented in userService or profileService

---

## 🔧 Recommended Actions

### High Priority

1. **Review Family Service** ⚠️
   - Verify endpoints match `/api/family` paths
   - Ensure using `https://user.wihy.ai` base URL
   - Test all family operations

2. **Update Goals Service** ⚠️
   - Change base URL from `services.wihy.ai` to `user.wihy.ai`
   - Verify endpoint paths match `/api/goals`
   - Update types to match api.ts definitions

3. **Review Coach Service** ⚠️
   - Verify all coaching endpoints
   - Ensure using `https://user.wihy.ai/api/coaches`
   - Add missing endpoints (discover, book, reviews)

4. **Review Progress Service** ⚠️
   - Verify using `https://user.wihy.ai/api/progress`
   - Ensure photo upload works
   - Add measurements endpoint

5. **Review Notification Service** ⚠️
   - Verify using `https://user.wihy.ai/api/notifications`
   - Ensure push token registration works
   - Add reminders endpoints

### Medium Priority

6. **Create Settings Service** (if not in userService)
   - Implement `/api/settings/*` endpoints
   - Handle notifications toggle
   - Handle privacy updates

7. **Update Profile Service**
   - Add avatar upload endpoint
   - Add change password endpoint

### Low Priority

8. **Create Global Goals Service**
   - Implement `/api/global-goals/*` endpoints
   - Add leaderboard functionality
   - Add challenges

9. **Consolidate User Type**
   - Consider migrating AuthContext to use `User` from `api.ts`
   - Would provide better type safety
   - Large refactor - needs careful planning

---

## 📝 Type System

### Current State
- ✅ **api.ts**: Complete, matches API spec exactly
- ✅ **index.ts**: Exports all API types
- ⚠️ **AuthContext.tsx**: Has its own User interface (not using api.ts)
- ⚠️ **Various services**: May have local type definitions

### Recommendation
- Use types from `../types/api` for new code
- Gradually migrate existing code to use centralized types
- Keep AuthContext.User for now to avoid breaking changes

---

## 🎯 Summary

### What We Added Today ✅
1. **types/api.ts** - Complete API type definitions (700+ lines)
2. **services/wellnessService.ts** - Full wellness tracking (350+ lines)
3. **Updated exports** - All types and services properly exported

### What Already Exists ✅
- authService (complete)
- userService (basic operations)
- userApiClient (HTTP client)
- shoppingPreferencesService (complete)
- familyService (partial)
- coachService (needs review)
- goalsService (needs update)
- progressService (needs review)
- notificationService (needs review)

### What Needs Work ⚠️
- Verify 5 existing services align with API spec
- Update base URLs where needed
- Add missing endpoints to existing services

### What's Missing ❌
- Global Goals service (low priority)
- Settings service (may exist in userService)
- Some profile endpoints

---

## 🚀 Next Steps

1. **Immediate** (Today):
   - ✅ Created comprehensive API types
   - ✅ Created wellness service
   - ✅ Updated exports

2. **Short Term** (This Week):
   - Review and update existing services
   - Verify base URLs
   - Test all endpoints

3. **Medium Term** (Next Sprint):
   - Add missing endpoints
   - Create missing services
   - Comprehensive testing

4. **Long Term** (Future):
   - Consolidate type definitions
   - Migrate to centralized types
   - Full API coverage

---

**Status**: Mobile app now has comprehensive types matching the WIHY API spec, a complete wellness service, and a clear roadmap for aligning existing services.
