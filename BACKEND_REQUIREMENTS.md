# WIHY Backend Requirements - What's Still Needed

**Generated:** January 7, 2026  
**Project Status:** Mobile Service Layer 100% Complete  
**Remaining Work:** Backend API Implementation Only

---

## Executive Summary

The WIHY mobile app has a **complete mobile service layer** - all services are implemented and ready to consume APIs. The only remaining work is **backend API implementation** on the server side.

| Layer | Status |
|-------|--------|
| Mobile UI/UX | ✅ 95% Complete |
| Mobile Service Layer | ✅ **100% Complete** |
| Backend APIs | ⚠️ 78% Complete |

**Estimated Total Backend Work: ~4 weeks**

---

## 🔴 Priority 1: Critical (Week 1-2)

### 1. Profile Management Backend (2 days)
**Service:** `auth.wihy.ai`  
**Mobile Service:** ✅ `profileService.ts` (1102 lines - COMPLETE)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/:userId/profile` | GET | Get user profile |
| `/api/users/:userId/profile` | PUT | Update user profile |
| `/api/users/:userId/avatar` | POST | Upload avatar (multipart) |
| `/api/users/:userId/settings` | GET | Get all settings |
| `/api/users/:userId/settings` | PUT | Save settings |
| `/api/users/:userId` | DELETE | Delete account (GDPR) |
| `/api/users/:userId/export` | POST | Export user data |
| `/api/users/:userId/change-password` | POST | Change password |
| `/api/users/:userId/2fa` | POST | Toggle 2FA |

**Database Schema Needed:**
```sql
-- users table (extend existing)
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN date_of_birth DATE;
ALTER TABLE users ADD COLUMN gender VARCHAR(20);
ALTER TABLE users ADD COLUMN height_cm DECIMAL(5,2);
ALTER TABLE users ADD COLUMN weight_kg DECIMAL(5,2);
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- user_settings table
CREATE TABLE user_settings (
  user_id VARCHAR(255) PRIMARY KEY,
  app_preferences JSONB,
  notifications JSONB,
  privacy JSONB,
  health_integration JSONB,
  security JSONB,
  updated_at TIMESTAMP
);
```

---

### 2. Goals & Milestones Backend (3 days)
**Service:** `services.wihy.ai`  
**Mobile Service:** ⚠️ Partial (`goalsService.ts` needs completion)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/goals` | POST | Create goal |
| `/api/goals` | GET | List user goals |
| `/api/goals/:id` | GET | Get goal details |
| `/api/goals/:id` | PUT | Update goal |
| `/api/goals/:id` | DELETE | Delete goal |
| `/api/goals/:id/progress` | POST | Log progress |
| `/api/goals/:id/complete` | POST | Mark complete |
| `/api/goals/active` | GET | Get active goals |

**Goal Types:** `weight_loss`, `muscle_gain`, `steps_daily`, `calories_daily`, `water_intake`, `sleep_hours`, `workout_frequency`, `custom`

---

### 3. Progress Photos & Measurements Backend (4 days)
**Service:** `services.wihy.ai`  
**Mobile Service:** ❌ Needs implementation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/progress/photos` | POST | Upload progress photo |
| `/api/progress/photos` | GET | Get photo timeline |
| `/api/progress/photos/:id` | DELETE | Delete photo |
| `/api/measurements` | POST | Log measurement |
| `/api/measurements` | GET | Get measurement history |
| `/api/measurements/latest` | GET | Get latest values |

**Measurement Types:** `weight`, `body_fat`, `waist`, `chest`, `arms`, `thighs`, `hips`

---

## 🟡 Priority 2: Important (Week 2-3)

### 4. Family Accounts Backend (4 days)
**Service:** `auth.wihy.ai`  
**Mobile Service:** ✅ `familyService.ts` (COMPLETE)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/families` | POST | Create family |
| `/api/families/:id` | GET | Get family details |
| `/api/families/:id/invite` | POST | Generate invite code |
| `/api/families/:id/members` | GET | List members |
| `/api/families/:id/members/:memberId` | DELETE | Remove member |
| `/api/families/:id/permissions` | PUT | Update permissions |
| `/api/families/join` | POST | Join family with code |

---

### 5. Reminders Backend (2 days)
**Service:** `services.wihy.ai`  
**Mobile Service:** ✅ `notificationService.ts` (COMPLETE)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reminders` | POST | Create reminder |
| `/api/reminders` | GET | List reminders |
| `/api/reminders/:id` | PUT | Update reminder |
| `/api/reminders/:id` | DELETE | Delete reminder |
| `/api/reminders/:id/snooze` | POST | Snooze reminder |

---

### 6. Scan History Persistence (2 days)
**Service:** `ml.wihy.ai`  
**Mobile Service:** ✅ `scanService.ts` (COMPLETE)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scan/history` | GET | Get scan history |
| `/api/scan/history/:id` | GET | Get scan details |
| `/api/scan/history/:id` | DELETE | Delete scan |
| `/api/scan/analytics` | GET | Get scan analytics |

---

## 🟢 Priority 3: Enhancements (Week 3-4)

### 7. Coach-Client Messaging (5 days)
**Service:** `coaching.wihy.ai`  
**Mobile Service:** ❌ Needs implementation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/coaching/messages` | POST | Send message |
| `/api/coaching/messages/thread` | GET | Get message thread |
| `/api/coaching/messages/:id/read` | PUT | Mark as read |
| `/api/coaching/messages/unread` | GET | Get unread count |
| `/api/coaching/messages/attach` | POST | Upload attachment |

---

### 8. Payment Processing (2 weeks)
**Service:** `auth.wihy.ai` + Stripe  
**Mobile Service:** ⚠️ `purchaseService.ts` (partial)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/connect` | POST | Setup Stripe Connect |
| `/api/payments/setup-intent` | POST | Client payment setup |
| `/api/payments/charge` | POST | Charge client |
| `/api/payments/subscriptions` | POST | Create subscription |
| `/api/payments/history` | GET | Payment history |
| `/api/coach/earnings` | GET | Coach earnings dashboard |
| `/api/payments/refund` | POST | Process refund |

**Third-Party Required:** Stripe Connect

---

## 📊 Summary by Backend Service

| Backend Service | Base URL | Endpoints Needed | Est. Days |
|----------------|----------|------------------|-----------|
| **auth.wihy.ai** | `https://auth.wihy.ai` | 16 | 6 |
| **services.wihy.ai** | `https://services.wihy.ai` | 22 | 9 |
| **ml.wihy.ai** | `https://ml.wihy.ai` | 4 | 2 |
| **coaching.wihy.ai** | `https://coaching.wihy.ai` | 5 | 5 |
| **Total** | | **47 endpoints** | **~22 days** |

---

## ✅ Already Complete (No Backend Work Needed)

These features have both mobile service AND backend fully implemented:

| Feature | Mobile Service | Backend |
|---------|---------------|---------|
| Authentication (OAuth) | `authService.ts` | ✅ Working |
| Fitness/Workouts | `fitnessService.ts` | ✅ 36 endpoints |
| Nutrition Tracking | `nutritionService.ts` | ✅ 7 endpoints |
| Meal Programs | `mealService.ts` | ✅ 9 endpoints |
| Shopping Lists | `shoppingService.ts` | ✅ 7 endpoints |
| Coach Platform | `coachService.ts` | ✅ 12 endpoints |
| Research Hub | `researchService.ts` | ✅ PubMed API |
| Weather/Health | `weatherService.ts` | ✅ OpenWeatherMap |
| Health Data | `healthDataService.ts` | ✅ HealthKit/Health Connect |
| Chat/AI | `chatService.ts` | ✅ ML API |
| Scanning | `scanService.ts` | ✅ ML API |

---

## 🚀 Quick Start for Backend Team

### Environment Setup
```bash
# Backend services structure
auth.wihy.ai/
├── routes/
│   ├── users.ts      # Profile endpoints (NEW)
│   ├── families.ts   # Family endpoints (NEW)
│   └── payments.ts   # Payment endpoints (NEW)
└── models/
    ├── UserSettings.ts
    ├── Family.ts
    └── Payment.ts

services.wihy.ai/
├── routes/
│   ├── goals.ts      # Goals endpoints (NEW)
│   ├── progress.ts   # Progress/photos (NEW)
│   └── reminders.ts  # Reminders (NEW)
└── models/
    ├── Goal.ts
    ├── ProgressPhoto.ts
    └── Reminder.ts
```

### API Response Format
All endpoints should return:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Or on error:
```json
{
  "success": false,
  "data": null,
  "error": "Error message here"
}
```

---

## Timeline Recommendation

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1** | Profile + Goals | User can update profile, create/track goals |
| **Week 2** | Progress + Family | Photo uploads, measurements, family accounts |
| **Week 3** | Messaging + Reminders | Coach-client chat, reminder persistence |
| **Week 4** | Payments + Polish | Stripe integration, bug fixes, testing |

**Total Estimated Effort:** 4 weeks (1 backend developer)

---

*This document was auto-generated from MISSING_FEATURES_ANALYSIS.md*  
*Mobile services are ready - just need backend endpoints!*
