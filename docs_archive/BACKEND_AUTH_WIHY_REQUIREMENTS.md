# auth.wihy.ai - Backend Requirements

**Generated:** January 7, 2026  
**Base URL:** `https://auth.wihy.ai`  
**Mobile Services:** ✅ All Complete  
**Estimated Work:** 6 days

---

## Overview

The `auth.wihy.ai` service handles user authentication, profile management, family accounts, and payment processing.

| Category | Endpoints | Est. Days | Mobile Service |
|----------|-----------|-----------|----------------|
| Profile Management | 9 | 2 | ✅ `profileService.ts` |
| Family Accounts | 7 | 4 | ✅ `familyService.ts` |
| Payment Processing | 7 | 10 | ⚠️ `purchaseService.ts` |
| **Total** | **23** | **16** | |

---

## 🔴 Priority 1: Profile Management (2 days)

**Mobile Service:** ✅ `profileService.ts` (1102 lines - COMPLETE)

### Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/users/:userId/profile` | GET | Get user profile | Bearer |
| `/api/users/:userId/profile` | PUT | Update user profile | Bearer |
| `/api/users/:userId/avatar` | POST | Upload avatar (multipart) | Bearer |
| `/api/users/:userId/settings` | GET | Get all settings | Bearer |
| `/api/users/:userId/settings` | PUT | Save settings | Bearer |
| `/api/users/:userId` | DELETE | Delete account (GDPR) | Bearer |
| `/api/users/:userId/export` | POST | Export user data | Bearer |
| `/api/users/:userId/change-password` | POST | Change password | Bearer |
| `/api/users/:userId/2fa` | POST | Toggle 2FA | Bearer |

### Request/Response Examples

#### GET `/api/users/:userId/profile`
```json
// Response
{
  "success": true,
  "profile": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "date_of_birth": "1990-01-15",
    "gender": "male",
    "height_cm": 180,
    "weight_kg": 75.5,
    "avatar_url": "https://storage.wihy.ai/avatars/user_123.jpg",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2026-01-07T00:00:00Z"
  }
}
```

#### PUT `/api/users/:userId/profile`
```json
// Request
{
  "name": "John Doe",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-15",
  "gender": "male",
  "height_cm": 180,
  "weight_kg": 75.5
}

// Response
{
  "success": true,
  "profile": { ... }
}
```

#### POST `/api/users/:userId/avatar`
```
Content-Type: multipart/form-data

avatar: <file>
user_id: user_123
```
```json
// Response
{
  "success": true,
  "avatar_url": "https://storage.wihy.ai/avatars/user_123.jpg"
}
```

#### GET `/api/users/:userId/settings`
```json
// Response
{
  "success": true,
  "settings": {
    "app_preferences": {
      "theme": "system",
      "language": "en",
      "measurement_unit": "imperial",
      "haptic_feedback": true,
      "auto_play_videos": true
    },
    "notifications": {
      "push_enabled": true,
      "email_enabled": true,
      "meal_reminders": true,
      "workout_reminders": true,
      "goal_updates": true,
      "quiet_hours_start": "22:00",
      "quiet_hours_end": "07:00"
    },
    "privacy": {
      "analytics_enabled": true,
      "crash_reports_enabled": true,
      "personalized_ads": false,
      "share_progress_with_coach": true
    },
    "health_integration": {
      "apple_health_enabled": true,
      "google_fit_enabled": false,
      "auto_sync": true,
      "sync_frequency_minutes": 15
    },
    "security": {
      "biometrics_enabled": false,
      "session_timeout_minutes": 30,
      "two_factor_enabled": false
    }
  }
}
```

#### PUT `/api/users/:userId/settings`
```json
// Request (partial update supported)
{
  "app_preferences": {
    "theme": "dark"
  },
  "notifications": {
    "push_enabled": false
  }
}

// Response
{
  "success": true
}
```

#### DELETE `/api/users/:userId`
```json
// Request
{
  "confirmation": "DELETE"
}

// Response
{
  "success": true
}
```

#### POST `/api/users/:userId/export`
```json
// Response
{
  "success": true,
  "download_url": "https://storage.wihy.ai/exports/user_123_2026-01-07.zip",
  "expires_at": "2026-01-14T00:00:00Z"
}
```

#### POST `/api/users/:userId/change-password`
```json
// Request
{
  "current_password": "oldPassword123",
  "new_password": "newPassword456"
}

// Response
{
  "success": true
}
```

#### POST `/api/users/:userId/2fa`
```json
// Request (enable)
{
  "enabled": true
}

// Response
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code_url": "otpauth://totp/WIHY:user@example.com?secret=JBSWY3DPEHPK3PXP"
}

// Request (verify)
{
  "enabled": true,
  "verification_code": "123456"
}

// Response
{
  "success": true
}
```

### Database Schema

```sql
-- Extend existing users table
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN date_of_birth DATE;
ALTER TABLE users ADD COLUMN gender VARCHAR(20);
ALTER TABLE users ADD COLUMN height_cm DECIMAL(5,2);
ALTER TABLE users ADD COLUMN weight_kg DECIMAL(5,2);
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(32);
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;

-- User settings table (JSONB for flexibility)
CREATE TABLE user_settings (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  app_preferences JSONB DEFAULT '{}',
  notifications JSONB DEFAULT '{}',
  privacy JSONB DEFAULT '{}',
  health_integration JSONB DEFAULT '{}',
  security JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

---

## 🟡 Priority 2: Family Accounts (4 days)

**Mobile Service:** ✅ `familyService.ts` (COMPLETE)

### Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/families` | POST | Create family | Bearer |
| `/api/families/:id` | GET | Get family details | Bearer |
| `/api/families/:id/invite` | POST | Generate invite code | Bearer |
| `/api/families/:id/members` | GET | List members | Bearer |
| `/api/families/:id/members/:memberId` | DELETE | Remove member | Bearer |
| `/api/families/:id/permissions` | PUT | Update permissions | Bearer |
| `/api/families/join` | POST | Join family with code | Bearer |

### Request/Response Examples

#### POST `/api/families`
```json
// Request
{
  "name": "Smith Family"
}

// Response
{
  "success": true,
  "family": {
    "id": "family_456",
    "name": "Smith Family",
    "owner_id": "user_123",
    "invite_code": "SMITH2026",
    "created_at": "2026-01-07T00:00:00Z"
  }
}
```

#### GET `/api/families/:id`
```json
// Response
{
  "success": true,
  "family": {
    "id": "family_456",
    "name": "Smith Family",
    "owner_id": "user_123",
    "member_count": 4,
    "created_at": "2026-01-07T00:00:00Z"
  }
}
```

#### POST `/api/families/:id/invite`
```json
// Request
{
  "email": "spouse@example.com",  // Optional
  "role": "adult"  // "adult" | "child" | "viewer"
}

// Response
{
  "success": true,
  "invite_code": "SMITH2026",
  "expires_at": "2026-01-14T00:00:00Z"
}
```

#### GET `/api/families/:id/members`
```json
// Response
{
  "success": true,
  "members": [
    {
      "id": "user_123",
      "name": "John Smith",
      "role": "owner",
      "avatar_url": "...",
      "joined_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "user_456",
      "name": "Jane Smith",
      "role": "adult",
      "avatar_url": "...",
      "joined_at": "2026-01-02T00:00:00Z"
    }
  ]
}
```

#### DELETE `/api/families/:id/members/:memberId`
```json
// Response
{
  "success": true
}
```

#### PUT `/api/families/:id/permissions`
```json
// Request
{
  "member_id": "user_789",
  "permissions": {
    "can_view_meals": true,
    "can_edit_meals": false,
    "can_view_workouts": true,
    "can_view_progress": false,
    "can_manage_shopping": true
  }
}

// Response
{
  "success": true
}
```

#### POST `/api/families/join`
```json
// Request
{
  "invite_code": "SMITH2026"
}

// Response
{
  "success": true,
  "family": {
    "id": "family_456",
    "name": "Smith Family",
    "role": "adult"
  }
}
```

### Database Schema

```sql
-- Families table
CREATE TABLE families (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id VARCHAR(255) REFERENCES users(id),
  invite_code VARCHAR(20) UNIQUE,
  invite_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Family members junction table
CREATE TABLE family_members (
  id SERIAL PRIMARY KEY,
  family_id VARCHAR(255) REFERENCES families(id) ON DELETE CASCADE,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'adult', -- 'owner', 'adult', 'child', 'viewer'
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- Indexes
CREATE INDEX idx_family_members_family ON family_members(family_id);
CREATE INDEX idx_family_members_user ON family_members(user_id);
CREATE INDEX idx_families_invite_code ON families(invite_code);
```

---

## 🟢 Priority 3: Payment Processing (10 days)

**Mobile Service:** ⚠️ `purchaseService.ts` (partial)  
**Third-Party Required:** Stripe Connect

### Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/payments/connect` | POST | Setup Stripe Connect (coach) | Bearer |
| `/api/payments/setup-intent` | POST | Client payment setup | Bearer |
| `/api/payments/charge` | POST | Charge client | Bearer |
| `/api/payments/subscriptions` | POST | Create subscription | Bearer |
| `/api/payments/history` | GET | Payment history | Bearer |
| `/api/coach/earnings` | GET | Coach earnings dashboard | Bearer |
| `/api/payments/refund` | POST | Process refund | Bearer |

### Request/Response Examples

#### POST `/api/payments/connect`
```json
// Request
{
  "coach_id": "coach_123"
}

// Response
{
  "success": true,
  "onboarding_url": "https://connect.stripe.com/setup/..."
}
```

#### POST `/api/payments/setup-intent`
```json
// Request
{
  "client_id": "user_456",
  "coach_id": "coach_123"
}

// Response
{
  "success": true,
  "client_secret": "pi_xxx_secret_xxx"
}
```

#### POST `/api/payments/charge`
```json
// Request
{
  "coach_id": "coach_123",
  "client_id": "user_456",
  "amount": 9900,  // cents
  "currency": "usd",
  "description": "Monthly coaching - January 2026"
}

// Response
{
  "success": true,
  "payment_id": "pay_xxx",
  "status": "succeeded"
}
```

#### GET `/api/payments/history`
```json
// Query: ?user_id=X&role=coach|client&limit=50
// Response
{
  "success": true,
  "payments": [
    {
      "id": "pay_xxx",
      "amount": 9900,
      "currency": "usd",
      "status": "succeeded",
      "description": "Monthly coaching - January 2026",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### GET `/api/coach/earnings`
```json
// Query: ?coach_id=X&period=month
// Response
{
  "success": true,
  "earnings": {
    "total": 49500,
    "pending": 9900,
    "available": 39600,
    "currency": "usd",
    "period": "2026-01"
  },
  "transactions": [...]
}
```

### Database Schema

```sql
-- Stripe Connect accounts for coaches
CREATE TABLE stripe_accounts (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id),
  stripe_account_id VARCHAR(255) UNIQUE,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment records
CREATE TABLE payments (
  id VARCHAR(255) PRIMARY KEY,
  stripe_payment_id VARCHAR(255) UNIQUE,
  coach_id VARCHAR(255) REFERENCES users(id),
  client_id VARCHAR(255) REFERENCES users(id),
  amount INTEGER NOT NULL,  -- cents
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(20),  -- 'pending', 'succeeded', 'failed', 'refunded'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_coach ON payments(coach_id);
CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_status ON payments(status);
```

---

## 🔧 Implementation Notes

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

### Error Responses
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

### Error Codes
| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or expired token |
| `FORBIDDEN` | User lacks permission |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request body |
| `CONFLICT` | Resource already exists |

---

## File Structure

```
auth.wihy.ai/
├── routes/
│   ├── users.ts          # Profile endpoints
│   ├── families.ts       # Family endpoints
│   └── payments.ts       # Payment endpoints
├── models/
│   ├── User.ts
│   ├── UserSettings.ts
│   ├── Family.ts
│   ├── FamilyMember.ts
│   └── Payment.ts
├── services/
│   ├── avatarService.ts  # S3/GCS upload
│   ├── exportService.ts  # Data export
│   └── stripeService.ts  # Stripe integration
└── middleware/
    └── auth.ts           # JWT validation
```

---

*Mobile service layer is complete - just implement these endpoints!*
