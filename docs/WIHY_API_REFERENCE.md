# WIHY User & Auth API Reference

Complete API documentation for WIHY client applications (iOS, Android, Web).

---

## Table of Contents

1. [Service Overview](#service-overview)
2. [Authentication Flow](#authentication-flow)
3. [Auth Service Endpoints](#auth-service-endpoints)
4. [User Service Endpoints](#user-service-endpoints)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Client Code Examples](#client-code-examples)

---

## Service Overview

WIHY uses separate microservices for authentication and user data:

| Service | Base URL | Purpose |
|---------|----------|---------|
| **Auth Service** | `https://auth.wihy.ai` | Authentication, sessions, password reset |
| **User Service** | `https://user.wihy.ai` | User profiles, preferences, settings |

### Key Differences

| Concern | Auth Service | User Service |
|---------|--------------|--------------|
| Login/Register | ✅ | ❌ |
| Token Validation | ✅ | ❌ |
| Password Reset | ✅ | ✅ (change password) |
| Full Profile Data | ❌ | ✅ |
| User Preferences | ❌ | ✅ |
| Family/Coach Context | ❌ | ✅ |

---

## Authentication Flow

### 1. Register New User
```
POST https://auth.wihy.ai/api/auth/register
     ↓
Returns: session_token, refresh_token, minimal user data
     ↓
GET https://user.wihy.ai/api/users/me (with token)
     ↓
Returns: Full user profile with capabilities
```

### 2. Login Existing User
```
POST https://auth.wihy.ai/api/auth/login
     ↓
Returns: session_token, refresh_token, user context
     ↓
Store tokens in secure storage
```

### 3. Subsequent API Calls
```
All requests to user.wihy.ai:
Authorization: Bearer <session_token>
```

### 4. Token Refresh
```
POST https://auth.wihy.ai/api/auth/refresh
     ↓
Returns: new session_token
```

---

## Auth Service Endpoints

Base URL: `https://auth.wihy.ai`

---

### POST `/api/auth/register`

Register a new user account with email and password.

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "terms_accepted": true,
  "date_of_birth": "1990-01-15",
  "gender": "male",
  "height": 180,
  "weight": 75,
  "activity_level": "moderate",
  "goals": ["weight_loss", "improve_health"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ✅ | Valid email address |
| `password` | string | ✅ | Minimum 8 characters |
| `name` | string | ❌ | Display name (defaults to email prefix) |
| `terms_accepted` | boolean | ✅ | Must be `true` |
| `date_of_birth` | string | ❌ | Format: YYYY-MM-DD |
| `gender` | string | ❌ | `male`, `female`, `other`, `prefer_not_to_say` |
| `height` | number | ❌ | Height in cm |
| `weight` | number | ❌ | Weight in kg |
| `activity_level` | string | ❌ | See [Activity Levels](#activity-level-values) |
| `goals` | string[] | ❌ | See [Goal Values](#goal-values) |

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CLIENT",
      "createdAt": "2026-01-20T10:00:00.000Z",
      "plan": "free",
      "planStatus": "active",
      "familyId": null,
      "familyName": null,
      "familyRole": null,
      "guardianCode": null,
      "coachId": null,
      "coachName": null,
      "isCoach": false,
      "clientCount": 0,
      "capabilities": {
        "maxProfiles": 1,
        "canScan": true,
        "canTrackMeals": true,
        "canAccessRecipes": false,
        "canManageFamily": false,
        "dailyScanLimit": 10
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

**Error Responses:**

```json
// 400 - Validation Error
{
  "success": false,
  "error": "Email and password are required"
}

// 400 - Terms not accepted
{
  "success": false,
  "error": "You must accept the terms and conditions"
}

// 400 - Weak password
{
  "success": false,
  "error": "Password must be at least 8 characters"
}

// 409 - Email exists
{
  "success": false,
  "error": "An account with this email already exists"
}
```

---

### POST `/api/auth/login`

Login with email and password.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "remember_me": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ✅ | User's email |
| `password` | string | ✅ | User's password |
| `remember_me` | boolean | ❌ | Extend session to 7 days (default: 24h) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CLIENT",
      "dateOfBirth": "1990-01-15",
      "gender": "male",
      "height": 180,
      "weight": 75,
      "activityLevel": "moderate",
      "goals": ["weight_loss", "improve_health"],
      "avatar": "https://storage.wihy.ai/avatars/user123.jpg",
      "emailVerified": true,
      "lastLogin": "2026-01-19T08:30:00.000Z",
      "settings": {
        "notificationsEnabled": true,
        "privacyLevel": "private",
        "unitsMetric": true
      },
      "plan": "family_basic",
      "planStatus": "active",
      "planExpiresAt": "2027-01-20T00:00:00.000Z",
      "cancelAtPeriodEnd": false,
      "familyId": "family-uuid-here",
      "familyName": "Doe Family",
      "familyRole": "owner",
      "guardianCode": "ABC123",
      "coachId": null,
      "coachName": null,
      "isCoach": false,
      "clientCount": 0,
      "capabilities": {
        "maxProfiles": 5,
        "canScan": true,
        "canTrackMeals": true,
        "canAccessRecipes": true,
        "canManageFamily": true,
        "dailyScanLimit": 50
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

**Error Responses:**

```json
// 400 - Missing credentials
{
  "success": false,
  "error": "Email and password are required"
}

// 401 - Invalid credentials
{
  "success": false,
  "error": "Invalid email or password"
}

// 403 - Account inactive
{
  "success": false,
  "error": "Account is not active"
}

// 423 - Account locked
{
  "success": false,
  "error": "Account locked. Try again in 15 minutes."
}
```

---

### POST `/api/auth/verify`

Verify a session token is valid. Used for token validation only.

**Request:**
```http
POST /api/auth/verify
Authorization: Bearer <session_token>
```

Or:

```http
POST /api/auth/verify
Content-Type: application/json

{
  "token": "<session_token>"
}
```

**Success Response (200):**
```json
{
  "valid": true,
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "CLIENT",
    "status": "ACTIVE"
  },
  "tokenValid": true
}
```

**Error Response:**
```json
{
  "valid": false,
  "success": false,
  "error": "Invalid or expired token"
}
```

> **Note:** This returns minimal user data. For full profile, use `GET /api/users/me` on the User Service.

---

### POST `/api/auth/refresh`

Refresh an expired session token using the refresh token.

**Request:**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

**Error Responses:**

```json
// 400 - Missing token
{
  "success": false,
  "error": "Refresh token required"
}

// 401 - Invalid/expired token
{
  "success": false,
  "error": "Invalid or expired refresh token"
}

// 401 - User inactive
{
  "success": false,
  "error": "User not found or inactive"
}
```

---

### POST `/api/auth/logout`

Logout and invalidate the current session.

**Request:**
```http
POST /api/auth/logout
Cookie: session_token=<token>
```

Or:

```http
POST /api/auth/logout
X-Session-Token: <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET `/api/auth/me`

Get current authenticated user's basic auth info.

**Request:**
```http
GET /api/auth/me
Authorization: Bearer <session_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CLIENT",
    "status": "ACTIVE",
    "emailVerified": true,
    "createdAt": "2026-01-05T00:00:00.000Z"
  }
}
```

> **Note:** This returns minimal data. For full profile with family, plan, capabilities, use `GET /api/users/me` on the User Service.

**Error Responses:**

```json
// 401 - Unauthorized
{
  "success": false,
  "error": "Unauthorized"
}

// 401 - Invalid token
{
  "success": false,
  "error": "Invalid token"
}

// 404 - User not found
{
  "success": false,
  "error": "User not found"
}
```

---

### POST `/api/auth/forgot-password`

Request a password reset email.

**Request:**
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with this email exists, a password reset link has been sent"
}
```

> **Note:** Always returns success to prevent email enumeration attacks.

---

### POST `/api/auth/reset-password`

Complete password reset with token from email.

**Request:**
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123resettoken",
  "newPassword": "newsecurepassword456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password."
}
```

**Error Responses:**

```json
// 400 - Missing fields
{
  "success": false,
  "error": "Token and new password are required"
}

// 400 - Weak password
{
  "success": false,
  "error": "Password must be at least 8 characters"
}

// 400 - Invalid token
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

---

### GET `/api/auth/session`

Get current session information.

**Request:**
```http
GET /api/auth/session
Cookie: session_token=<token>
```

Or:

```http
GET /api/auth/session
X-Session-Token: <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com"
    },
    "expiresAt": "2026-01-21T10:00:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid or expired session"
}
```

---

### GET `/api/auth/providers`

List available OAuth providers.

**Request:**
```http
GET /api/auth/providers
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "oauth": ["google", "facebook", "apple", "microsoft"]
  }
}
```

---

## User Service Endpoints

Base URL: `https://user.wihy.ai`

All endpoints require authentication unless noted.

---

### GET `/api/users/me`

Get current authenticated user's complete profile with plan, family, coach context, and capabilities.

**Request:**
```http
GET /api/users/me
Authorization: Bearer <session_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CLIENT",
    "status": "ACTIVE",
    "provider": "google",
    "avatar": "https://storage.wihy.ai/avatars/user123.jpg",
    
    "profile": {},
    "profile_data": {},
    
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "height": 180,
    "weight": 75,
    "activityLevel": "moderate",
    "timezone": "America/New_York",
    "goals": ["weight_loss", "muscle_gain"],
    
    "healthScore": 85,
    "dayStreak": 42,
    "streakDays": 42,
    "scansCount": 156,
    "memberSince": "January 2026",
    
    "emailVerified": true,
    "email_verified": true,
    "lastLogin": "2026-01-20T10:00:00.000Z",
    "last_login_at": "2026-01-20T10:00:00.000Z",
    "createdAt": "2026-01-05T00:00:00.000Z",
    "created_at": "2026-01-05T00:00:00.000Z",
    
    "settings": {
      "notificationsEnabled": true,
      "privacyLevel": "private",
      "unitsMetric": true
    },
    
    "plan": "family_basic",
    "planStatus": "active",
    "planExpiresAt": "2027-01-20T00:00:00.000Z",
    "cancelAtPeriodEnd": false,
    "addOns": ["ai"],
    
    "familyId": "family-uuid-here",
    "familyName": "Doe Family",
    "familyRole": "owner",
    "guardianCode": "ABC123",
    "familyMembers": [
      {
        "id": "member-uuid-1",
        "name": "Jane Doe",
        "role": "adult",
        "avatar": null
      },
      {
        "id": "member-uuid-2",
        "name": "Jimmy Doe",
        "role": "child",
        "avatar": null
      }
    ],
    
    "coachId": null,
    "coachName": null,
    "isCoach": false,
    "clientCount": 0,
    "clients": [],
    
    "capabilities": {
      "maxProfiles": 5,
      "canScan": true,
      "canTrackMeals": true,
      "canAccessRecipes": true,
      "canManageFamily": true,
      "dailyScanLimit": 50
    }
  }
}
```

**Error Responses:**

```json
// 401 - No token
{
  "success": false,
  "error": "Unauthorized"
}

// 404 - User not found
{
  "success": false,
  "error": "User not found"
}
```

---

### GET `/api/users/:id`

Get user by ID.

**Request:**
```http
GET /api/users/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CLIENT",
    "status": "ACTIVE",
    "provider": "google",
    "avatar": "https://storage.wihy.ai/avatars/user123.jpg",
    "profile": {},
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "height": 180,
    "weight": 75,
    "activityLevel": "moderate",
    "timezone": "America/New_York",
    "goals": ["weight_loss", "muscle_gain"],
    "healthScore": 85,
    "dayStreak": 42,
    "scansCount": 156,
    "plan": "family_basic",
    "planStatus": "active",
    "planExpiresAt": "2027-01-20T00:00:00.000Z",
    "emailVerified": true,
    "lastLogin": "2026-01-20T10:00:00.000Z",
    "createdAt": "2026-01-05T00:00:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### GET `/api/users/email/:email`

Get user by email address.

**Request:**
```http
GET /api/users/email/user@example.com
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CLIENT",
    "status": "ACTIVE",
    "provider": "google",
    "avatar": "https://storage.wihy.ai/avatars/user123.jpg",
    "profile": {},
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "height": 180,
    "weight": 75,
    "activityLevel": "moderate",
    "goals": ["weight_loss"],
    "healthScore": 85,
    "dayStreak": 42,
    "scansCount": 156,
    "plan": "free",
    "planStatus": "active",
    "planExpiresAt": null,
    "emailVerified": true,
    "lastLogin": "2026-01-20T10:00:00.000Z",
    "createdAt": "2026-01-05T00:00:00.000Z"
  }
}
```

---

### GET `/api/users` (Admin)

List all users with pagination and filtering.

**Request:**
```http
GET /api/users?page=1&limit=20&status=ACTIVE&plan=free&search=john
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `status` | string | Filter by status: `ACTIVE`, `SUSPENDED`, `DELETED` |
| `plan` | string | Filter by plan: `free`, `starter`, `premium`, etc. |
| `search` | string | Search in email or name |

**Success Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CLIENT",
      "status": "ACTIVE",
      "provider": "google",
      "plan": "free",
      "subscription_status": "active",
      "email_verified": true,
      "last_login_at": "2026-01-20T10:00:00.000Z",
      "created_at": "2026-01-05T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### PUT `/api/users/:id`

Update user (basic fields only).

**Request:**
```http
PUT /api/users/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "John Smith",
  "profile_data": {
    "height": 182,
    "weight": 78
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Smith",
    "profile_data": {
      "height": 182,
      "weight": 78
    }
  }
}
```

---

### DELETE `/api/users/:id`

Delete user (soft delete by default).

**Request:**
```http
DELETE /api/users/550e8400-e29b-41d4-a716-446655440000
```

**Hard Delete (permanent):**
```http
DELETE /api/users/550e8400-e29b-41d4-a716-446655440000?hard=true
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted"
}
```

---

### GET `/api/profile/:userId`

Get user profile with full details.

**Request:**
```http
GET /api/profile/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CLIENT",
    "status": "ACTIVE",
    "provider": "google",
    "avatar": "https://storage.wihy.ai/avatars/user123.jpg",
    "profile_data": {},
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "height": 180,
    "weight": 75,
    "activityLevel": "moderate",
    "timezone": "America/New_York",
    "goals": ["weight_loss", "muscle_gain"],
    "healthScore": 85,
    "dayStreak": 42,
    "streakDays": 42,
    "scansCount": 156,
    "memberSince": "January 2026",
    "plan": "family_basic",
    "planStatus": "active",
    "planExpiresAt": "2027-01-20T00:00:00.000Z",
    "addOns": ["ai"],
    "emailVerified": true,
    "lastLogin": "2026-01-20T10:00:00.000Z",
    "createdAt": "2026-01-05T00:00:00.000Z",
    "settings": {
      "notificationsEnabled": true,
      "privacyLevel": "private",
      "unitsMetric": true,
      "theme": "system",
      "language": "en",
      "timezone": "UTC"
    }
  }
}
```

---

### PUT `/api/profile/:userId`

Update user profile. All fields are optional - only provided fields are updated.

**Request:**
```http
PUT /api/profile/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "newemail@example.com",
  "avatar": "https://example.com/avatar.jpg",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "height": 180,
  "weight": 75,
  "activityLevel": "moderate",
  "timezone": "America/New_York",
  "goals": ["weight_loss", "muscle_gain"],
  "healthScore": 85,
  "dayStreak": 42,
  "scansCount": 156
}
```

**Supported Field Names (accepts both formats):**

| camelCase | snake_case | Type | Description |
|-----------|------------|------|-------------|
| `name` | `name` | string | Full display name |
| `firstName` | `first_name` | string | First name |
| `lastName` | `last_name` | string | Last name |
| `email` | `email` | string | Email (validates uniqueness) |
| `avatar` | `avatar` | string | Avatar URL |
| `dateOfBirth` | `date_of_birth` | string | YYYY-MM-DD format |
| `gender` | `gender` | string | See [Gender Values](#gender-values) |
| `height` | `height` | number | Height in cm |
| `weight` | `weight` | number | Weight in kg |
| `activityLevel` | `activity_level` | string | See [Activity Levels](#activity-level-values) |
| `timezone` | `timezone` | string | IANA timezone |
| `goals` | `goals` | string[] | See [Goal Values](#goal-values) |
| `healthScore` | `health_score` | number | 0-100 |
| `dayStreak` | `day_streak` | number | Consecutive days |
| `scansCount` | `scans_count` | number | Total scans |
| `isDeveloper` | `is_developer` | boolean | Developer flag |

**Success Response (200):**
```json
{
  "success": true,
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newemail@example.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CLIENT",
    "status": "ACTIVE",
    "provider": "google",
    "avatar": "https://example.com/avatar.jpg",
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "height": 180,
    "weight": 75,
    "activityLevel": "moderate",
    "timezone": "America/New_York",
    "goals": ["weight_loss", "muscle_gain"],
    "healthScore": 85,
    "dayStreak": 42,
    "scansCount": 156,
    "plan": "family_basic",
    "planStatus": "active",
    "planExpiresAt": "2027-01-20T00:00:00.000Z",
    "emailVerified": true,
    "lastLogin": "2026-01-20T10:00:00.000Z",
    "createdAt": "2026-01-05T00:00:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 - Email in use
{
  "success": false,
  "error": "Email already in use by another account"
}

// 400 - No fields
{
  "success": false,
  "error": "No fields to update"
}

// 404 - Not found
{
  "success": false,
  "error": "User not found"
}
```

---

### POST `/api/profile/:userId/avatar`

Upload user avatar (URL or base64).

**Request (URL):**
```http
POST /api/profile/550e8400-e29b-41d4-a716-446655440000/avatar
Content-Type: application/json
Authorization: Bearer <token>

{
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Request (Base64):**
```http
POST /api/profile/550e8400-e29b-41d4-a716-446655440000/avatar
Content-Type: application/json
Authorization: Bearer <token>

{
  "avatarBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Avatar URL or base64 data required"
}
```

---

### POST `/api/profile/:userId/change-password`

Change password for local (email/password) accounts.

**Request:**
```http
POST /api/profile/550e8400-e29b-41d4-a716-446655440000/change-password
Content-Type: application/json
Authorization: Bearer <token>

{
  "currentPassword": "oldpassword123",
  "newPassword": "newsecurepassword456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**

```json
// 400 - Missing fields
{
  "success": false,
  "error": "Current password and new password are required"
}

// 400 - Weak password
{
  "success": false,
  "error": "New password must be at least 8 characters"
}

// 401 - Wrong password
{
  "success": false,
  "error": "Current password is incorrect"
}

// 404 - Not local account
{
  "success": false,
  "error": "User not found or not a local account"
}
```

---

### GET `/api/users/:id/preferences`

Get user preferences/settings.

**Request:**
```http
GET /api/users/550e8400-e29b-41d4-a716-446655440000/preferences
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "preferences": {
    "notifications_enabled": true,
    "privacy_level": "private",
    "units_metric": true,
    "theme": "system",
    "language": "en",
    "timezone": "UTC",
    "updated_at": "2026-01-20T10:00:00.000Z"
  }
}
```

---

### PUT `/api/users/:id/preferences`

Update user preferences/settings.

**Request:**
```http
PUT /api/users/550e8400-e29b-41d4-a716-446655440000/preferences
Content-Type: application/json
Authorization: Bearer <token>

{
  "notifications_enabled": true,
  "privacy_level": "friends",
  "units_metric": false,
  "theme": "dark",
  "language": "es",
  "timezone": "America/Los_Angeles"
}
```

| Field | Type | Values |
|-------|------|--------|
| `notifications_enabled` | boolean | `true`, `false` |
| `privacy_level` | string | `private`, `friends`, `public` |
| `units_metric` | boolean | `true` (metric), `false` (imperial) |
| `theme` | string | `system`, `light`, `dark` |
| `language` | string | ISO language code (`en`, `es`, etc.) |
| `timezone` | string | IANA timezone |

**Success Response (200):**
```json
{
  "success": true,
  "preferences": {
    "notifications_enabled": true,
    "privacy_level": "friends",
    "units_metric": false,
    "theme": "dark",
    "language": "es",
    "timezone": "America/Los_Angeles",
    "updated_at": "2026-01-20T10:30:00.000Z"
  }
}
```

---

### GET `/api/users/:id/permissions`

Get user permissions based on plan.

**Request:**
```http
GET /api/users/550e8400-e29b-41d4-a716-446655440000/permissions
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "permissions": {
    "max_sessions": -1,
    "ai_conversations": 500,
    "export_data": true,
    "priority_support": true,
    "custom_branding": false,
    "plan": "premium",
    "is_active": true,
    "role": "CLIENT"
  }
}
```

**Permission Levels by Plan:**

| Plan | max_sessions | ai_conversations | export_data | priority_support |
|------|--------------|------------------|-------------|------------------|
| free | 3 | 10 | ❌ | ❌ |
| starter | 10 | 50 | ✅ | ❌ |
| premium | unlimited | 500 | ✅ | ✅ |
| pro | unlimited | unlimited | ✅ | ✅ |

---

### GET `/api/users/:id/dashboard`

Get user dashboard summary.

**Request:**
```http
GET /api/users/550e8400-e29b-41d4-a716-446655440000/dashboard
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "dashboard": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "plan": "premium",
      "subscription_status": "active"
    },
    "stats": {
      "member_since": "2026-01-05T00:00:00.000Z",
      "last_login": "2026-01-20T10:00:00.000Z",
      "days_active": 15
    },
    "quick_actions": [
      { "label": "View Profile", "path": "/profile" },
      { "label": "Manage Subscription", "path": "/subscription" },
      { "label": "Settings", "path": "/settings" }
    ]
  }
}
```

---

### GET `/api/users/:id/ghl-status`

Get user's GoHighLevel sync status.

**Request:**
```http
GET /api/users/550e8400-e29b-41d4-a716-446655440000/ghl-status
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "ghlContactId": "ghl-contact-id-here",
  "ghlLocationId": "ghl-location-id-here",
  "synced": true
}
```

**Not Synced Response:**
```json
{
  "success": true,
  "ghlContactId": null,
  "ghlLocationId": null,
  "synced": false
}
```

---

## Data Models

### Activity Level Values

| Value | Description |
|-------|-------------|
| `sedentary` | Little to no exercise |
| `light` | Light exercise 1-3 days/week |
| `moderate` | Moderate exercise 3-5 days/week |
| `active` | Hard exercise 6-7 days/week |
| `very_active` | Very hard exercise, physical job |

### Goal Values

| Value | Description |
|-------|-------------|
| `weight_loss` | Lose weight |
| `muscle_gain` | Build muscle |
| `maintain` | Maintain current weight |
| `improve_health` | General health improvement |
| `increase_energy` | More energy |
| `better_sleep` | Improve sleep quality |

### Gender Values

| Value | Description |
|-------|-------------|
| `male` | Male |
| `female` | Female |
| `other` | Other |
| `prefer_not_to_say` | Prefer not to say |

### Role Values

| Value | Description |
|-------|-------------|
| `CLIENT` | Regular user |
| `COACH` | Coach with client management |
| `ADMIN` | System administrator |
| `EMPLOYEE` | Internal employee |

### Status Values

| Value | Description |
|-------|-------------|
| `ACTIVE` | Active account |
| `SUSPENDED` | Temporarily suspended |
| `DELETED` | Soft deleted |

### Plan Values

| Value | Description |
|-------|-------------|
| `free` | Free tier |
| `starter` | Starter plan |
| `premium` | Premium plan |
| `pro` | Professional plan |
| `family_basic` | Family basic plan |
| `family_premium` | Family premium plan |
| `enterprise` | Enterprise plan |

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (registration) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (account inactive) |
| 404 | Not Found |
| 409 | Conflict (email exists) |
| 423 | Locked (too many failed attempts) |
| 500 | Internal Server Error |

---

## Client Code Examples

### TypeScript/React Native

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_URL = 'https://auth.wihy.ai';
const USER_URL = 'https://user.wihy.ai';

// Token storage
async function storeTokens(token: string, refreshToken: string) {
  await AsyncStorage.multiSet([
    ['session_token', token],
    ['refresh_token', refreshToken],
  ]);
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('session_token');
}

// API helper
async function api(url: string, options: RequestInit = {}) {
  const token = await getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  return response.json();
}

// Auth functions
async function register(data: {
  email: string;
  password: string;
  name: string;
  terms_accepted: boolean;
}) {
  const result = await api(`${AUTH_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (result.success) {
    await storeTokens(result.data.token, result.data.refreshToken);
  }
  
  return result;
}

async function login(email: string, password: string, rememberMe = false) {
  const result = await api(`${AUTH_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password, remember_me: rememberMe }),
  });
  
  if (result.success) {
    await storeTokens(result.data.token, result.data.refreshToken);
  }
  
  return result;
}

async function logout() {
  await api(`${AUTH_URL}/api/auth/logout`, { method: 'POST' });
  await AsyncStorage.multiRemove(['session_token', 'refresh_token']);
}

// User functions
async function getCurrentUser() {
  return api(`${USER_URL}/api/users/me`);
}

async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  return api(`${USER_URL}/api/profile/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

async function updatePreferences(userId: string, preferences: UserPreferences) {
  return api(`${USER_URL}/api/users/${userId}/preferences`, {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
}

// Usage examples
async function onLogin() {
  const result = await login('user@example.com', 'password123');
  if (result.success) {
    console.log('Welcome', result.data.user.name);
    
    // Get full profile
    const profile = await getCurrentUser();
    console.log('Family:', profile.user.familyName);
    console.log('Plan:', profile.user.plan);
  }
}

async function onUpdateWeight(userId: string, newWeight: number) {
  const result = await updateProfile(userId, { weight: newWeight });
  if (result.success) {
    console.log('Weight updated to', result.profile.weight);
  }
}
```

### Swift (iOS)

```swift
import Foundation

class WIHYClient {
    static let authURL = "https://auth.wihy.ai"
    static let userURL = "https://user.wihy.ai"
    
    static var token: String? {
        get { UserDefaults.standard.string(forKey: "session_token") }
        set { UserDefaults.standard.set(newValue, forKey: "session_token") }
    }
    
    static func login(email: String, password: String) async throws -> LoginResponse {
        var request = URLRequest(url: URL(string: "\(authURL)/api/auth/login")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode([
            "email": email,
            "password": password
        ])
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(LoginResponse.self, from: data)
        
        if response.success {
            token = response.data?.token
        }
        
        return response
    }
    
    static func getCurrentUser() async throws -> UserResponse {
        var request = URLRequest(url: URL(string: "\(userURL)/api/users/me")!)
        request.setValue("Bearer \(token ?? "")", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(UserResponse.self, from: data)
    }
    
    static func updateProfile(userId: String, updates: [String: Any]) async throws -> ProfileResponse {
        var request = URLRequest(url: URL(string: "\(userURL)/api/profile/\(userId)")!)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token ?? "")", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: updates)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(ProfileResponse.self, from: data)
    }
}
```

---

## Health Checks

Both services expose health endpoints:

```http
GET https://auth.wihy.ai/health
GET https://user.wihy.ai/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "auth-service"
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/auth/login` | 5 attempts per 15 minutes per IP |
| `/api/auth/register` | 3 per hour per IP |
| `/api/auth/forgot-password` | 3 per hour per email |
| All other endpoints | 100 per minute per user |

---

## Important Notes

1. **Token Storage:** Store tokens securely (Keychain on iOS, EncryptedSharedPreferences on Android)

2. **Token Refresh:** Implement automatic token refresh when receiving 401 responses

3. **Stats Updates:** `healthScore`, `dayStreak`, and `scansCount` are typically updated by the sync service, not directly by users

4. **Email Changes:** Changing email validates uniqueness and may require re-verification

5. **Name Auto-Composition:** When updating `firstName` or `lastName`, the `name` field is automatically composed

6. **OAuth Accounts:** Password-related endpoints only work for `provider: 'local'` accounts

7. **Separation of Concerns:**
   - Use `auth.wihy.ai` for authentication (login, register, token validation)
   - Use `user.wihy.ai` for profile data (user details, preferences, settings)
