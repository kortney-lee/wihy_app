# Missing Features Breakdown - By Service

**Last Updated:** January 6, 2026  
**Purpose:** Clear separation of backend work between `auth.wihy.ai` and `services.wihy.ai`

---

## 🔐 AUTH.WIHY.AI Endpoints

**Responsibility:** User authentication, profiles, settings, family management  
**Base URL:** `https://auth.wihy.ai/api`  
**Total Missing Endpoints:** 12  
**Estimated Development Time:** 6 days  

### ✅ WORKING Endpoints (8)
```typescript
POST   /auth/register                    // User registration
POST   /auth/login                       // User login
POST   /auth/logout                      // User logout
GET    /auth/session                     // Get current session
POST   /auth/refresh                     // Refresh JWT token
POST   /auth/oauth/google                // Google OAuth
POST   /auth/oauth/facebook              // Facebook OAuth
POST   /auth/oauth/microsoft             // Microsoft OAuth
```

---

### ❌ NEEDS IMPLEMENTATION (12 endpoints)

#### **1. Profile Management (5 endpoints) - 2 days**

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/users/profile` | `PUT` | Update user profile | `{ name, email, phone, date_of_birth, gender, height, weight }` | `{ success, user }` |
| `/users/avatar` | `POST` | Upload profile picture | `FormData: { file }` | `{ success, avatar_url }` |
| `/users/settings` | `GET` | Get user app settings | - | `{ theme, language, units, notifications_enabled }` |
| `/users/preferences` | `PUT` | Update app preferences | `{ theme, language, units, notifications_enabled }` | `{ success, preferences }` |
| `/users/delete-account` | `DELETE` | Delete account (GDPR) | `{ confirmation: "DELETE" }` | `{ success, message }` |

**Mobile Service:** `authService.ts` ✅ Ready  
**UI Screens Using This:**
- ProfileScreen.tsx
- SettingsScreen.tsx
- AuthSettingsScreen.tsx

**Database Schema Needed:**
```typescript
user_profiles {
  user_id: string (PK)
  name: string
  email: string
  phone?: string
  date_of_birth?: date
  gender?: string
  height?: number
  weight?: number
  avatar_url?: string
  created_at: timestamp
  updated_at: timestamp
}

user_settings {
  user_id: string (FK)
  theme: 'light' | 'dark' | 'system'
  language: string (en, es, fr, etc)
  units: 'metric' | 'imperial'
  notifications_enabled: boolean
  updated_at: timestamp
}
```

---

#### **2. Family Accounts (7 endpoints) - 4 days**

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/families` | `POST` | Create family group | `{ name }` | `{ family_id, invite_code }` |
| `/families/:id` | `GET` | Get family details | - | `{ family, members[] }` |
| `/families/:id/invite` | `POST` | Generate invite link | `{ email?, role }` | `{ invite_code, expires_at }` |
| `/families/:id/members` | `GET` | List family members | - | `{ members[] }` |
| `/families/:id/members/:memberId` | `DELETE` | Remove family member | - | `{ success }` |
| `/families/:id/permissions` | `PUT` | Update member permissions | `{ member_id, permissions[] }` | `{ success }` |
| `/families/join` | `POST` | Join family via invite | `{ invite_code }` | `{ family }` |

**Mobile Service:** `authService.ts` ✅ Ready  
**UI Screens Using This:**
- ParentDashboard.tsx
- FamilyDashboardPage.tsx
- FamilySettingsScreen.tsx

**Database Schema Needed:**
```typescript
families {
  family_id: string (PK)
  name: string
  created_by: string (FK users)
  invite_code: string (unique)
  invite_expires_at: timestamp
  created_at: timestamp
  updated_at: timestamp
}

family_members {
  family_id: string (FK families)
  user_id: string (FK users)
  role: 'admin' | 'parent' | 'child' | 'member'
  permissions: string[] (view_health, edit_meals, edit_workouts)
  joined_at: timestamp
  PRIMARY KEY (family_id, user_id)
}
```

---

## 📊 SERVICES.WIHY.AI Endpoints

**Responsibility:** Goals, progress tracking, consumption logging, notifications  
**Base URL:** `https://services.wihy.ai/api`  
**Total Missing Endpoints:** 38  
**Estimated Development Time:** 22 days  

### ✅ WORKING Endpoints (Basic structure exists)
```typescript
// Partially implemented:
POST   /nutrition/log-meal               // Log meals (exists)
GET    /nutrition/daily-summary          // Daily totals (exists)
GET    /nutrition/weekly-trends          // Weekly averages (exists)
POST   /notifications/token              // Register push token (exists)
```

---

### ❌ NEEDS IMPLEMENTATION (38 endpoints)

#### **1. Goals & Milestones (8 endpoints) - 3 days**

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/goals` | `POST` | Create new goal | `{ user_id, type, title, target_value, target_date, category }` | `{ goal_id, goal }` |
| `/goals` | `GET` | List user's goals | Query: `?user_id=X&status=active\|completed` | `{ goals[] }` |
| `/goals/:id` | `GET` | Get goal details | - | `{ goal, milestones, progress_history }` |
| `/goals/:id` | `PUT` | Update goal | `{ title?, target_value?, target_date?, status? }` | `{ success, goal }` |
| `/goals/:id` | `DELETE` | Delete goal | - | `{ success }` |
| `/goals/:id/progress` | `POST` | Log progress entry | `{ value, date, notes? }` | `{ success, new_progress }` |
| `/goals/:id/complete` | `POST` | Mark goal as complete | `{ completion_notes?, achievement_unlock? }` | `{ success, achievement? }` |
| `/goals/active` | `GET` | Get active goals only | Query: `?user_id=X` | `{ goals[] }` |

**Goal Types:** `weight_loss`, `muscle_gain`, `steps_daily`, `calories_daily`, `water_intake`, `sleep_hours`, `workout_frequency`, `strength_gain`, `custom`

**Mobile Service:** `goalsService.ts` ✅ Ready  
**UI Screens Using This:**
- GoalsScreen.tsx
- GoalDetailScreen.tsx
- MyProgressDashboard.tsx (goals display)

**Database Schema Needed:**
```typescript
goals {
  goal_id: string (PK)
  user_id: string (FK users)
  type: string (weight_loss, muscle_gain, etc)
  title: string
  target_value: number
  target_date: date
  category: string
  status: 'active' | 'completed' | 'paused' | 'abandoned'
  start_date: timestamp
  created_at: timestamp
  updated_at: timestamp
}

goal_progress {
  progress_id: string (PK)
  goal_id: string (FK goals)
  value: number
  date: date
  notes?: string
  created_at: timestamp
}

milestones {
  milestone_id: string (PK)
  goal_id: string (FK goals)
  title: string
  target_value: number
  achieved: boolean
  achieved_at?: timestamp
}
```

---

#### **2. Progress Tracking & Measurements (7 endpoints) - 4 days**

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/progress/photos` | `POST` | Upload progress photo | `FormData: { file, type, date, notes? }` | `{ photo_id, url }` |
| `/progress/photos` | `GET` | Get photo timeline | Query: `?user_id=X&start_date=&end_date=&limit=50` | `{ photos[] }` |
| `/progress/photos/:id` | `DELETE` | Delete photo | - | `{ success }` |
| `/measurements` | `POST` | Log body measurement | `{ user_id, type, value, date, unit }` | `{ measurement_id }` |
| `/measurements` | `GET` | Get measurement history | Query: `?user_id=X&type=weight\|waist\|chest&days=30` | `{ measurements[] }` |
| `/measurements/latest` | `GET` | Get latest measurements | Query: `?user_id=X` | `{ weight, waist, chest, hips, arms, thighs, neck }` |
| `/measurements/trends` | `GET` | Calculate measurement trends | Query: `?user_id=X&type=weight&period=30d` | `{ trend, change, average, rate }` |

**Measurement Types:** `weight`, `body_fat`, `waist`, `chest`, `hips`, `arms`, `thighs`, `neck`, `biceps`, `calves`

**Mobile Service:** `progressService.ts` ✅ Ready  
**UI Screens Using This:**
- ProgressScreen.tsx
- MyProgressDashboard.tsx (measurements)
- BodyMetricsScreen.tsx

**Database Schema Needed:**
```typescript
progress_photos {
  photo_id: string (PK)
  user_id: string (FK users)
  photo_url: string (S3/Cloud storage)
  type: 'front' | 'side' | 'back' | 'detail'
  date: date
  notes?: string
  created_at: timestamp
}

measurements {
  measurement_id: string (PK)
  user_id: string (FK users)
  type: string (weight, waist, chest, etc)
  value: number
  unit: 'kg' | 'lb' | 'cm' | 'in'
  date: date
  created_at: timestamp
  INDEX (user_id, type, date)
}
```

---

#### **3. Consumption Logging - Enhanced (7 endpoints) - 3 days**

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/consumption/log` | `POST` | Log food/drink entry | `{ user_id, item_type, name, calories, macros, time, meal_type, photo? }` | `{ log_id }` |
| `/consumption/daily` | `GET` | Get daily totals | Query: `?user_id=X&date=YYYY-MM-DD` | `{ totals, meals[], water, summary }` |
| `/consumption/weekly` | `GET` | Get weekly summary | Query: `?user_id=X&week_start=YYYY-MM-DD` | `{ daily_averages, trends }` |
| `/consumption/history` | `GET` | Get consumption history | Query: `?user_id=X&days=30&limit=50` | `{ entries[] }` |
| `/consumption/water` | `POST` | Log water intake | `{ user_id, amount_ml, time }` | `{ log_id, daily_total }` |
| `/consumption/water/daily` | `GET` | Get daily water total | Query: `?user_id=X&date=YYYY-MM-DD` | `{ total_ml, goal_ml, percentage }` |
| `/consumption/:id` | `DELETE` | Delete log entry | - | `{ success }` |

**Meal Types:** `breakfast`, `lunch`, `dinner`, `snack`, `smoothie`, `drink`

**Mobile Service:** `nutritionService.ts` ✅ Ready  
**UI Screens Using This:**
- ConsumptionDashboard.tsx
- MyProgressDashboard.tsx (nutrition tracking)
- MealLoggerScreen.tsx

**Database Schema Needed:**
```typescript
consumption_logs {
  log_id: string (PK)
  user_id: string (FK users)
  item_type: 'food' | 'drink' | 'supplement'
  name: string
  calories: number
  macros: {
    protein: number
    carbs: number
    fats: number
  }
  meal_type: string (breakfast, lunch, dinner, snack)
  time: timestamp
  photo_url?: string
  serving_size?: string
  notes?: string
  created_at: timestamp
  INDEX (user_id, created_at DESC)
}

water_logs {
  water_id: string (PK)
  user_id: string (FK users)
  amount_ml: number
  time: timestamp
  created_at: timestamp
}
```

---

#### **4. Notifications & Reminders (8 endpoints) - 3 days**

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/notifications/token` | `POST` | Register push token | `{ user_id, token, platform: 'ios\|android' }` | `{ success }` |
| `/notifications/preferences` | `GET` | Get notification settings | Query: `?user_id=X` | `{ preferences }` |
| `/notifications/preferences` | `PUT` | Update notification prefs | `{ meal_reminders, workout_reminders, water_reminders, marketing }` | `{ success }` |
| `/reminders` | `POST` | Create reminder | `{ user_id, type, time, days[], message, enabled }` | `{ reminder_id }` |
| `/reminders` | `GET` | List user reminders | Query: `?user_id=X&enabled=true` | `{ reminders[] }` |
| `/reminders/:id` | `PUT` | Update reminder | `{ time?, days?, enabled?, message? }` | `{ success }` |
| `/reminders/:id` | `DELETE` | Delete reminder | - | `{ success }` |
| `/notifications/send` | `POST` | Send notification (internal) | `{ user_id, title, body, data?, image? }` | `{ success }` |

**Reminder Types:** `meal`, `water`, `workout`, `medication`, `sleep`, `weigh_in`, `custom`

**Mobile Service:** `notificationService.ts` ✅ Ready  
**UI Screens Using This:**
- NotificationSettingsScreen.tsx
- RemindersScreen.tsx
- Profile.tsx (notification preferences)

**Database Schema Needed:**
```typescript
push_tokens {
  token_id: string (PK)
  user_id: string (FK users)
  token: string
  platform: 'ios' | 'android'
  active: boolean
  created_at: timestamp
  updated_at: timestamp
}

notification_preferences {
  user_id: string (PK, FK users)
  meal_reminders_enabled: boolean
  meal_reminder_time?: time
  water_reminders_enabled: boolean
  water_reminder_frequency?: number (minutes)
  workout_reminders_enabled: boolean
  workout_reminder_time?: time
  medication_reminders_enabled: boolean
  sleep_reminders_enabled: boolean
  marketing_emails: boolean
  updated_at: timestamp
}

reminders {
  reminder_id: string (PK)
  user_id: string (FK users)
  type: string (meal, water, workout, etc)
  title: string
  message: string
  time: time
  days: string[] (Mon, Tue, Wed...)
  enabled: boolean
  last_triggered?: timestamp
  created_at: timestamp
  updated_at: timestamp
  INDEX (user_id, enabled, time)
}
```

---

#### **5. Consumption Data Enhancement (8 endpoints) - 3 days** 

*These enhancements support dopamine/behavior tracking*

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/dopamine/desire` | `POST` | Log a craving/desire | `{ user_id, craving_type, intensity, mood, trigger, timestamp }` | `{ log_id }` |
| `/dopamine/desire-patterns` | `GET` | Get craving patterns | Query: `?user_id=X&period=week\|month` | `{ patterns, triggers, common_cravings[] }` |
| `/dopamine/consumption` | `POST` | Log consumption with desire link | `{ user_id, desire_log_id?, meal_id, satisfaction_score }` | `{ log_id }` |
| `/dopamine/satisfaction` | `POST` | Log satisfaction feedback | `{ consumption_log_id, score, mood_after, notes }` | `{ feedback_id, insights }` |
| `/dopamine/loop-analysis` | `GET` | Analyze desire→consume→satisfaction | Query: `?user_id=X&period=week\|month` | `{ positive_cycles, negative_cycles, learning[] }` |
| `/dopamine/score` | `GET` | Get dopamine/behavior score | Query: `?user_id=X` | `{ score, components }` |
| `/consumption/macro-breakdown` | `GET` | Get macro ratios over time | Query: `?user_id=X&period=week\|month` | `{ protein%, carbs%, fats%, trends }` |
| `/consumption/insights` | `GET` | Get consumption insights | Query: `?user_id=X` | `{ eating_patterns, triggers, recommendations }` |

**Mobile Service:** `dopamineService.ts` 🆕 (Needs creation)  
**UI Screens Using This:**
- MyProgressDashboard.tsx (all tabs)
- OverviewDashboard.tsx (dopamine cards)
- InsightsScreen.tsx

**Database Schema Needed:**
```typescript
desire_logs {
  desire_id: string (PK)
  user_id: string (FK users)
  craving_type: string
  intensity: number (1-10)
  mood: string
  trigger: string
  timestamp: timestamp
  created_at: timestamp
}

consumption_with_desire {
  log_id: string (PK)
  user_id: string (FK users)
  desire_log_id?: string (FK desire_logs)
  meal_id: string
  timestamp: timestamp
}

satisfaction_feedback {
  feedback_id: string (PK)
  consumption_log_id: string (FK consumption_logs)
  score: number (1-10)
  mood_after: string
  notes?: string
  created_at: timestamp
}
```

---

## 📊 Summary by Service

### AUTH.WIHY.AI
```
Profile Management:        5 endpoints (2 days)
Family Accounts:           7 endpoints (4 days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                    12 endpoints (6 days)
```

### SERVICES.WIHY.AI
```
Goals & Milestones:        8 endpoints (3 days)
Progress & Measurements:   7 endpoints (4 days)
Consumption Logging:       7 endpoints (3 days)
Notifications & Reminders: 8 endpoints (3 days)
Dopamine/Behavior:         8 endpoints (3 days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                    38 endpoints (16 days)
```

---

## 🎯 Implementation Phases

### **Phase 1: MVP - Core Features (13 days)**

**AUTH (4 days)**
- Profile Management (2 days)
- Family Accounts (2 days)

**SERVICES (9 days)**
- Goals & Milestones (3 days)
- Progress Tracking (4 days)
- Notifications & Reminders (2 days)

### **Phase 2: Enhanced Features (8 days)**

**AUTH (2 days)**
- Family Accounts finalization (2 days)

**SERVICES (6 days)**
- Consumption Logging (3 days)
- Dopamine/Behavior tracking (3 days)

---

## 🚀 Recommended Implementation Order

### Week 1 (AUTH - 3-4 days)
1. ✅ **Profile Management** (2 days)
   - Start: user_profiles table
   - Update endpoints, avatar upload, settings

2. ⬜ **Family Accounts Phase 1** (1-2 days)
   - Create family, get families, list members

### Week 1-2 (SERVICES - 3-4 days)
3. ✅ **Goals & Milestones** (3 days)
   - CRUD operations, progress logging

4. ✅ **Notifications Setup** (1 day)
   - Push token registration, preferences

### Week 2-3 (SERVICES - 5-6 days)
5. ✅ **Progress Tracking** (4 days)
   - Photo upload, measurements, trends

6. ✅ **Consumption Logging** (2 days)
   - Basic meal/water logging

### Week 3-4 (SERVICES - 4-5 days)
7. ✅ **Family Accounts Phase 2** (2 days)
   - Permissions, member management

8. ✅ **Dopamine/Behavior** (2-3 days)
   - Desire tracking, satisfaction, loop analysis

---

## 📱 Mobile Service Status

All services have wrapper implementations ready:

```typescript
✅ authService.ts          - Profile & Family methods ready
✅ goalsService.ts         - Goals CRUD ready
✅ progressService.ts      - Photos & measurements ready
✅ nutritionService.ts     - Meal & water logging ready
✅ notificationService.ts  - Push & reminders ready
🆕 dopamineService.ts      - NEEDS CREATION (mirror nutritionService pattern)
```

---

## 📋 Database Migration Path

1. **Phase 1:** Create auth tables (users, families, family_members, settings)
2. **Phase 2:** Create services tables (goals, measurements, consumption)
3. **Phase 3:** Create behavior tables (desire, satisfaction, loops)
4. **Phase 4:** Add indices and optimize queries

---

**Total MVP Time: 2 weeks (13 days)**  
**Total Feature Complete: 3 weeks (21 days)**

Both services can be developed in parallel!
