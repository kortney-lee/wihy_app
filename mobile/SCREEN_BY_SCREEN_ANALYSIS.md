# WIHY Mobile App - Screen by Screen Analysis

**Created:** January 6, 2026  
**Purpose:** Detailed breakdown of each screen's functionality, backend requirements, and status

---

## 📱 Screen Index

| # | Screen | File | Status | Backend Service |
|---|--------|------|--------|-----------------|
| 1 | Login | `Login.tsx` | ✅ Complete | auth.wihy |
| 2 | Dashboard | `Dashboard.tsx` | ✅ Complete | - |
| 3 | Overview Dashboard | `OverviewDashboard.tsx` | ✅ Complete | services.wihy |
| 4 | Profile | `Profile.tsx` | ⚠️ Partial | auth.wihy |
| 5 | Coach Dashboard | `CoachDashboard.tsx` | ✅ Complete | coaching.wihy |
| 6 | Coach Overview | `CoachOverview.tsx` | ✅ Complete | coaching.wihy |
| 7 | Client Management | `ClientManagement.tsx` | ⚠️ Partial | coaching.wihy |
| 8 | Client Onboarding | `ClientOnboarding.tsx` | ⚠️ Partial | coaching.wihy |
| 9 | Fitness Dashboard | `FitnessDashboard.tsx` | ✅ Complete | fitness.wihy |
| 10 | Workout Execution | `WorkoutExecution.tsx` | ⚠️ Partial | fitness.wihy |
| 11 | Consumption Dashboard | `ConsumptionDashboard.tsx` | ⚠️ Partial | services.wihy |
| 12 | Create Meals | `CreateMeals.tsx` | ✅ Complete | ml.wihy |
| 13 | Meal Details | `MealDetailsScreen.tsx` | ✅ Complete | ml.wihy |
| 14 | Meal Preferences | `MealPreferencesScreen.tsx` | ⚠️ Partial | services.wihy |
| 15 | Nutrition Facts | `NutritionFacts.tsx` | ✅ Complete | ml.wihy |
| 16 | Nutrition Screen | `NutritionScreen.tsx` | ✅ Complete | ml.wihy |
| 17 | My Progress Dashboard | `MyProgressDashboard.tsx` | ⚠️ Partial | services.wihy |
| 18 | Progress Screen | `ProgressScreen.tsx` | ❌ Backend Needed | services.wihy |
| 19 | Camera Screen | `CameraScreen.tsx` | ✅ Complete | ml.wihy |
| 20 | Full Chat | `FullChat.tsx` | ✅ Complete | ml.wihy |
| 21 | Scan History | `ScanHistoryScreen.tsx` | ⚠️ Mock Data | ml.wihy |
| 22 | Health Hub | `HealthHub.tsx` | ✅ Complete | - (native) |
| 23 | Weather Screen | `WeatherScreen.tsx` | ✅ Complete | - (3rd party) |
| 24 | Research Screen | `ResearchScreen.tsx` | ✅ Complete | - (3rd party) |
| 25 | Shopping List | `ShoppingListScreen.tsx` | ⚠️ Partial | services.wihy |
| 26 | Parent Dashboard | `ParentDashboard.tsx` | ❌ Backend Needed | auth.wihy |
| 27 | Family Dashboard | `FamilyDashboardPage.tsx` | ❌ Backend Needed | auth.wihy |
| 28 | Subscription | `SubscriptionScreen.tsx` | ❌ Not Implemented | coaching.wihy |
| 29 | Auth Settings | `AuthSettingsScreen.tsx` | ✅ Complete | auth.wihy |
| 30 | Permissions | `PermissionsScreen.tsx` | ✅ Complete | - (native) |
| 31 | Todo Screen | `TodoScreen.tsx` | ⚠️ Local Only | services.wihy |

**Legend:**
- ✅ Complete = UI + Backend + Service all working
- ⚠️ Partial = UI done, needs backend or integration work
- ❌ Backend Needed = UI exists but backend not implemented

---

## 🔐 AUTHENTICATION SCREENS

### 1. Login Screen
**File:** `src/screens/Login.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** `auth.wihy.ai`

#### Features Working
- [x] Email/password login
- [x] Google OAuth
- [x] Facebook OAuth
- [x] Microsoft OAuth
- [x] Session persistence
- [x] Error handling
- [x] Loading states

#### Backend Endpoints Used
```typescript
POST /api/auth/login              // ✅ Working
POST /api/auth/register           // ✅ Working
POST /api/auth/oauth/google       // ✅ Working
POST /api/auth/oauth/facebook     // ✅ Working
POST /api/auth/oauth/microsoft    // ✅ Working
```

#### No Work Needed
This screen is fully functional.

---

### 2. Auth Settings Screen
**File:** `src/screens/AuthSettingsScreen.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** `auth.wihy.ai`

#### Features Working
- [x] View current session
- [x] Logout functionality
- [x] Token refresh
- [x] Session info display

#### No Work Needed
This screen is fully functional.

---

## 🏠 MAIN DASHBOARD SCREENS

### 3. Dashboard (Main Container)
**File:** `src/screens/Dashboard.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** None (container only)

#### Features Working
- [x] Tab navigation
- [x] Role-based dashboard switching
- [x] Bottom tab bar

#### No Work Needed
Container component - no backend requirements.

---

### 4. Overview Dashboard
**File:** `src/screens/OverviewDashboard.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** Native health APIs + `services.wihy.ai`

#### Features Working
- [x] Health score display (from HealthKit/Health Connect)
- [x] Steps count (real data)
- [x] Sleep tracking (real data)
- [x] Hydration display
- [x] Quick action cards
- [x] Weather widget integration
- [x] Notification permission handling

#### Backend Endpoints Used
```typescript
// Native APIs - ✅ All Working
healthDataService.getTodayMetrics()    // ✅ iOS + Android
healthDataService.getHealthScore()     // ✅ Calculated
weatherService.getCompleteWeatherData() // ✅ OpenWeatherMap
```

#### Minor Enhancement Opportunities
- [ ] Goals progress indicator (needs services.wihy `/api/goals/active`)
- [ ] Water intake quick-add button (needs services.wihy `/api/consumption/water`)

---

### 5. Profile Screen
**File:** `src/screens/Profile.tsx`  
**Status:** ⚠️ **PARTIAL - NEEDS BACKEND**  
**Backend:** `auth.wihy.ai`

#### Features Working
- [x] Display user info (from session)
- [x] Notification toggle (local)
- [x] Theme toggle (local)
- [x] Logout button

#### Features NOT Working (Need Backend)
- [ ] Edit profile information
- [ ] Upload avatar
- [ ] Save preferences to server
- [ ] Change password
- [ ] Delete account

#### Backend Endpoints NEEDED (auth.wihy)

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/users/profile` | `PUT` | Update name, email, phone, DOB | 🔴 Critical |
| `/api/users/avatar` | `POST` | Upload profile picture | 🟡 Important |
| `/api/users/settings` | `GET` | Get saved preferences | 🔴 Critical |
| `/api/users/preferences` | `PUT` | Save theme, units, language | 🔴 Critical |
| `/api/users/change-password` | `POST` | Change password | 🟡 Important |
| `/api/users/delete-account` | `DELETE` | GDPR compliance | 🟢 Nice-to-have |

#### Request/Response Schemas

**PUT /api/users/profile**
```json
// Request
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-15",
  "gender": "male",
  "height": 180,
  "height_unit": "cm",
  "weight": 75,
  "weight_unit": "kg"
}

// Response
{
  "success": true,
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": "https://...",
    "updated_at": "2026-01-06T12:00:00Z"
  }
}
```

**PUT /api/users/preferences**
```json
// Request
{
  "theme": "dark",
  "language": "en",
  "units": "metric",
  "notifications_enabled": true,
  "meal_reminders": true,
  "workout_reminders": true,
  "water_reminders": false
}

// Response
{
  "success": true,
  "preferences": { ... }
}
```

#### Estimated Work
- Backend: 2 days
- Mobile integration: 4 hours

---

## 👥 COACH SCREENS

### 6. Coach Dashboard
**File:** `src/screens/CoachDashboard.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** `coaching.wihy.ai`

#### Features Working
- [x] Client list display
- [x] Client invitation modal
- [x] Client dashboard data
- [x] Goals extraction
- [x] Nutrition summary
- [x] Fitness plan assignment
- [x] Real-time stats

#### Backend Endpoints Used
```typescript
POST /api/coaching/invitations/send                    // ✅ Working
GET  /api/coaching/relationships/coach/:id/clients     // ✅ Working
GET  /api/coaching/coach/:id/client/:id/dashboard      // ✅ Working
POST /api/fitness/plans                                // ✅ Working
```

#### Enhancement Opportunities
- [ ] Direct messaging (needs coaching.wihy `/api/coaching/messages`)
- [ ] Payment collection (needs coaching.wihy `/api/payments`)

---

### 7. Coach Overview
**File:** `src/screens/CoachOverview.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** `coaching.wihy.ai`

#### Features Working
- [x] Coach stats summary
- [x] Client count
- [x] Active programs
- [x] Quick actions

---

### 8. Client Management
**File:** `src/screens/ClientManagement.tsx`  
**Status:** ⚠️ **PARTIAL**  
**Backend:** `coaching.wihy.ai`

#### Features Working
- [x] View client list
- [x] Client details
- [x] Assign plans

#### Features NOT Working
- [ ] Direct messaging to client
- [ ] Payment history per client
- [ ] Client progress comparison

#### Backend Endpoints NEEDED (coaching.wihy)

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/coaching/messages` | `POST` | Send message | 🟡 Important |
| `/api/coaching/messages/thread` | `GET` | Get conversation | 🟡 Important |
| `/api/payments/history` | `GET` | Client payments | 🟢 Nice-to-have |

---

### 9. Client Onboarding
**File:** `src/screens/ClientOnboarding.tsx`  
**Status:** ⚠️ **PARTIAL**  
**Backend:** `coaching.wihy.ai`

#### Features Working
- [x] Onboarding form UI
- [x] Goal selection
- [x] Preferences collection

#### Features NOT Working
- [ ] Save onboarding data to server
- [ ] Coach notification of new client

---

## 💪 FITNESS SCREENS

### 10. Fitness Dashboard
**File:** `src/screens/FitnessDashboard.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** `fitness.wihy.ai`

#### Features Working
- [x] Daily workout display
- [x] Exercise cards with sets/reps
- [x] Workout phases and levels
- [x] Start workout button
- [x] Session tracking
- [x] RPE feedback
- [x] Workout history

#### Backend Endpoints Used
```typescript
GET  /api/fitness/today/:userId         // ✅ Daily workout
POST /api/fitness/sessions              // ✅ Start session
PUT  /api/fitness/sessions/:id/complete // ✅ End session
POST /api/fitness/feedback              // ✅ Log RPE
GET  /api/fitness/history/:userId       // ✅ Past workouts
```

#### No Major Work Needed
Backend is fully implemented.

---

### 11. Workout Execution
**File:** `src/screens/fitness/WorkoutExecution.tsx`  
**Status:** ⚠️ **PARTIAL - UI ENHANCEMENT NEEDED**  
**Backend:** `fitness.wihy.ai` (✅ Complete)

#### Features Working
- [x] Exercise display
- [x] Set completion tracking
- [x] Basic rest timer

#### UI Enhancements Needed (No Backend)
- [ ] Per-exercise form score input
- [ ] Exercise substitution modal
- [ ] Detailed rest timer with sound
- [ ] Rep count adjustment during set

#### Backend Endpoints Available (Not Used in UI)
```typescript
PUT /api/fitness/sessions/:id/exercise/:exerciseId  // Log individual exercise
// Currently only using session-level completion
```

#### Estimated Work
- Mobile UI: 2 days (no backend needed)

---

## 🍽️ NUTRITION SCREENS

### 12. Consumption Dashboard
**File:** `src/screens/ConsumptionDashboard.tsx`  
**Status:** ⚠️ **PARTIAL - NEEDS BACKEND**  
**Backend:** `services.wihy.ai`

#### Features Working
- [x] Daily calorie display (mock)
- [x] Macro breakdown UI
- [x] Meal cards UI
- [x] Water intake display (mock)

#### Features NOT Working (Need Backend)
- [ ] Log meals to server
- [ ] Save water intake
- [ ] Retrieve daily history
- [ ] Weekly trends

#### Backend Endpoints NEEDED (services.wihy)

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/consumption/log` | `POST` | Log food item | 🔴 Critical |
| `/api/consumption/daily` | `GET` | Get day's meals | 🔴 Critical |
| `/api/consumption/water` | `POST` | Log water | 🔴 Critical |
| `/api/consumption/water/daily` | `GET` | Water progress | 🔴 Critical |
| `/api/consumption/weekly` | `GET` | Weekly summary | 🟡 Important |

#### Request/Response Schemas

**POST /api/consumption/log**
```json
// Request
{
  "user_id": "user_123",
  "name": "Grilled Chicken Salad",
  "meal_type": "lunch",
  "calories": 450,
  "protein": 35,
  "carbs": 25,
  "fat": 18,
  "fiber": 8,
  "time": "2026-01-06T12:30:00Z",
  "source": "manual"
}

// Response
{
  "success": true,
  "log_id": "log_456",
  "daily_totals": {
    "calories": 1250,
    "protein": 85,
    "carbs": 120,
    "fat": 45
  }
}
```

**POST /api/consumption/water**
```json
// Request
{
  "user_id": "user_123",
  "amount_ml": 250,
  "time": "2026-01-06T14:00:00Z"
}

// Response
{
  "success": true,
  "log_id": "water_789",
  "daily_total_ml": 1500,
  "goal_ml": 2500,
  "percentage": 60
}
```

#### Estimated Work
- Backend: 3 days
- Mobile integration: 4 hours

---

### 13. Create Meals
**File:** `src/screens/CreateMeals.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** `ml.wihy.ai`

#### Features Working
- [x] Manual meal creation
- [x] Recipe scanning (photo)
- [x] Nutrition calculation
- [x] Save to meal library
- [x] Meal templates
- [x] Edit existing meals

#### Backend Endpoints Used
```typescript
POST /api/meals/create         // ✅ Save meal
GET  /api/meals/user/:userId   // ✅ Get library
PUT  /api/meals/:mealId        // ✅ Update meal
DELETE /api/meals/:mealId      // ✅ Delete meal
POST /api/scan/recipe          // ✅ Scan recipe
GET  /api/meals/templates      // ✅ Get templates
```

#### No Work Needed
This screen is fully functional.

---

### 14. Meal Details Screen
**File:** `src/screens/MealDetailsScreen.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** `ml.wihy.ai`

#### Features Working
- [x] Full nutrition display
- [x] Ingredient list
- [x] Serving size adjustment
- [x] Add to meal log

---

### 15. Meal Preferences Screen
**File:** `src/screens/MealPreferencesScreen.tsx`  
**Status:** ⚠️ **PARTIAL**  
**Backend:** `services.wihy.ai`

#### Features Working
- [x] Preference selection UI
- [x] Dietary restrictions
- [x] Allergies input

#### Features NOT Working
- [ ] Save preferences to server
- [ ] Sync across devices

#### Backend Endpoint NEEDED (services.wihy)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/users/meal-preferences` | `PUT` | Save preferences |
| `/api/users/meal-preferences` | `GET` | Get preferences |

---

### 16-17. Nutrition Facts & Nutrition Screen
**Files:** `NutritionFacts.tsx`, `NutritionScreen.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** `ml.wihy.ai`

#### Features Working
- [x] Display scan results
- [x] Nutrition label format
- [x] Health grade calculation

---

## 📊 PROGRESS SCREENS

### 18. My Progress Dashboard
**File:** `src/screens/MyProgressDashboard.tsx`  
**Status:** ⚠️ **PARTIAL**  
**Backend:** `services.wihy.ai`

#### Features Working
- [x] Health data display (from native)
- [x] Weight chart (local data)
- [x] Steps trend
- [x] Sleep pattern

#### Features NOT Working
- [ ] Goals progress tracking
- [ ] Milestone display
- [ ] Achievement badges

#### Backend Endpoints NEEDED (services.wihy)

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/goals/active` | `GET` | Get user's goals | 🔴 Critical |
| `/api/goals/:id/progress` | `GET` | Goal progress | 🔴 Critical |

---

### 19. Progress Screen (Photos & Measurements)
**File:** `src/screens/ProgressScreen.tsx`  
**Status:** ❌ **BACKEND NEEDED**  
**Backend:** `services.wihy.ai`

#### Features in UI (Not Functional)
- [x] Photo upload UI
- [x] Measurement input fields
- [x] Progress timeline view
- [x] Before/after comparison

#### Features NOT Working (Need Backend)
- [ ] Upload progress photos
- [ ] Save body measurements
- [ ] Retrieve photo timeline
- [ ] Calculate trends

#### Backend Endpoints NEEDED (services.wihy)

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/progress/photos` | `POST` | Upload photo | 🔴 Critical |
| `/api/progress/photos` | `GET` | Get timeline | 🔴 Critical |
| `/api/progress/photos/:id` | `DELETE` | Delete photo | 🟡 Important |
| `/api/measurements` | `POST` | Log measurement | 🔴 Critical |
| `/api/measurements` | `GET` | Get history | 🔴 Critical |
| `/api/measurements/latest` | `GET` | Current values | 🔴 Critical |
| `/api/measurements/trends` | `GET` | Calculate change | 🟡 Important |

#### Request/Response Schemas

**POST /api/progress/photos**
```json
// Request (multipart/form-data)
{
  "file": "<binary>",
  "user_id": "user_123",
  "type": "front",  // front, side, back
  "date": "2026-01-06",
  "notes": "Week 4 progress"
}

// Response
{
  "success": true,
  "photo_id": "photo_123",
  "url": "https://storage.wihy.ai/photos/...",
  "thumbnail_url": "https://storage.wihy.ai/thumbs/..."
}
```

**POST /api/measurements**
```json
// Request
{
  "user_id": "user_123",
  "type": "weight",
  "value": 74.5,
  "unit": "kg",
  "date": "2026-01-06"
}

// Response
{
  "success": true,
  "measurement_id": "meas_456",
  "change_from_last": -0.5,
  "change_percentage": -0.67
}
```

#### Estimated Work
- Backend: 4 days
- Mobile integration: 4 hours

---

## 📷 SCANNING SCREENS

### 20. Camera Screen
**File:** `src/screens/CameraScreen.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** `ml.wihy.ai`

#### Features Working
- [x] Barcode scanning
- [x] Food photo capture
- [x] Nutrition label scanning
- [x] Recipe scanning
- [x] Flash toggle
- [x] Camera flip

#### Backend Endpoints Used
```typescript
POST /api/scan/barcode   // ✅ Working
POST /api/scan/food      // ✅ Working
POST /api/scan/label     // ✅ Working
POST /api/scan/recipe    // ✅ Working
```

---

### 21. Full Chat
**File:** `src/screens/FullChat.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** `ml.wihy.ai`

#### Features Working
- [x] Send text messages
- [x] Receive AI responses
- [x] Image attachments
- [x] Context-aware responses
- [x] Quick suggestions

#### Backend Endpoints Used
```typescript
POST /api/ask            // ✅ Working
```

#### Enhancement Opportunity
- [ ] Chat history persistence (needs ml.wihy database)

---

### 22. Scan History Screen
**File:** `src/screens/ScanHistoryScreen.tsx`  
**Status:** ⚠️ **MOCK DATA ONLY**  
**Backend:** `ml.wihy.ai`

#### Features in UI
- [x] List of past scans
- [x] Filter by type
- [x] Search functionality
- [x] Scan detail view

#### Features NOT Working
- [ ] Actual scan history (returns mock data)
- [ ] Delete scan
- [ ] Scan analytics

#### Backend Endpoints NEEDED (ml.wihy)

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/scan/history` | `GET` | Get real history | 🟡 Important |
| `/api/scan/history/:id` | `DELETE` | Delete scan | 🟡 Important |
| `/api/scan/analytics` | `GET` | Usage stats | 🟢 Nice-to-have |

#### Estimated Work
- Backend: 2 days
- Mobile: Already integrated (just needs real data)

---

## 🌤️ THIRD-PARTY SCREENS

### 23. Health Hub
**File:** `src/screens/HealthHub.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** Native APIs (no backend needed)

#### Features Working
- [x] HealthKit data (iOS)
- [x] Health Connect data (Android)
- [x] Google Fit fallback
- [x] All health metrics display
- [x] Permission management

---

### 24. Weather Screen
**File:** `src/screens/WeatherScreen.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** OpenWeatherMap API (3rd party)

#### Features Working
- [x] Current weather
- [x] 7-day forecast
- [x] Air quality index
- [x] UV index
- [x] Health recommendations

---

### 25. Research Screen
**File:** `src/screens/ResearchScreen.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** PubMed API (3rd party)

#### Features Working
- [x] Article search
- [x] Category filtering
- [x] Bookmarking (local)
- [x] Article details

---

## 🛒 SHOPPING SCREENS

### 26. Shopping List Screen
**File:** `src/screens/ShoppingListScreen.tsx`  
**Status:** ⚠️ **PARTIAL**  
**Backend:** `services.wihy.ai`

#### Features Working
- [x] Display shopping list
- [x] Category organization
- [x] Check off items

#### Features NOT Working
- [ ] Generate from meal plan
- [ ] Instacart integration
- [ ] Share list

#### Backend Endpoints Partially Working
```typescript
GET  /api/shopping-lists/:id          // ⚠️ Works
POST /api/shopping-lists/generate     // ⚠️ Needs meal plan ID
POST /api/shopping-lists/:id/instacart // ❌ Placeholder only
```

---

## 👨‍👩‍👧 FAMILY SCREENS

### 27. Parent Dashboard
**File:** `src/screens/ParentDashboard.tsx`  
**Status:** ❌ **BACKEND NEEDED**  
**Backend:** `auth.wihy.ai`

#### Features in UI (Not Functional)
- [x] Family member cards
- [x] Child health overview
- [x] Parental controls UI

#### Features NOT Working
- [ ] Create family
- [ ] Add family members
- [ ] View member data
- [ ] Set permissions

#### Backend Endpoints NEEDED (auth.wihy)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/families` | `POST` | Create family |
| `/api/families/:id` | `GET` | Get family |
| `/api/families/:id/invite` | `POST` | Invite member |
| `/api/families/:id/members` | `GET` | List members |
| `/api/families/join` | `POST` | Join family |

---

### 28. Family Dashboard Page
**File:** `src/screens/FamilyDashboardPage.tsx`  
**Status:** ❌ **BACKEND NEEDED**  
**Backend:** `auth.wihy.ai`

Same as Parent Dashboard - needs family backend.

---

## 💳 SUBSCRIPTION SCREENS

### 29. Subscription Screen
**File:** `src/screens/SubscriptionScreen.tsx`  
**Status:** ❌ **NOT IMPLEMENTED**  
**Backend:** `coaching.wihy.ai`

#### Current State
- UI exists but commented out
- Requires native build for IAP

#### Backend Endpoints NEEDED (coaching.wihy)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/subscriptions/plans` | `GET` | Available plans |
| `/api/subscriptions/create` | `POST` | Start subscription |
| `/api/subscriptions/status` | `GET` | Check status |
| `/api/subscriptions/cancel` | `POST` | Cancel subscription |

---

## ⚙️ SETTINGS SCREENS

### 30. Permissions Screen
**File:** `src/screens/PermissionsScreen.tsx`  
**Status:** ✅ **COMPLETE**  
**Backend:** None (native permissions)

#### Features Working
- [x] Camera permission
- [x] Location permission
- [x] Health permission
- [x] Notification permission
- [x] Status display

---

### 31. Todo Screen
**File:** `src/screens/TodoScreen.tsx`  
**Status:** ⚠️ **LOCAL ONLY**  
**Backend:** `services.wihy.ai`

#### Features Working
- [x] Add todos (local)
- [x] Complete todos (local)
- [x] Delete todos (local)

#### Features NOT Working
- [ ] Sync to server
- [ ] Share with coach

---

## 📋 SUMMARY BY PRIORITY

### 🔴 CRITICAL - Screens Blocking MVP

| Screen | Missing | Backend | Days |
|--------|---------|---------|------|
| Profile | Edit profile, preferences | auth.wihy | 2 |
| Consumption Dashboard | Meal/water logging | services.wihy | 3 |
| Progress Screen | Photos, measurements | services.wihy | 4 |
| My Progress Dashboard | Goals tracking | services.wihy | 2 |

**Total Critical:** 11 days backend work

### 🟡 IMPORTANT - Post-MVP Features

| Screen | Missing | Backend | Days |
|--------|---------|---------|------|
| Client Management | Messaging | coaching.wihy | 3 |
| Scan History | Real data persistence | ml.wihy | 2 |
| Meal Preferences | Server sync | services.wihy | 1 |
| Workout Execution | UI enhancements | - | 2 (UI only) |

**Total Important:** 8 days

### 🟢 NICE-TO-HAVE - Phase 2

| Screen | Missing | Backend | Days |
|--------|---------|---------|------|
| Parent Dashboard | Family system | auth.wihy | 4 |
| Family Dashboard | Family system | auth.wihy | (included above) |
| Subscription | IAP + backend | coaching.wihy | 10 |
| Shopping List | Instacart API | 3rd party | 3 |

**Total Nice-to-have:** 17 days

---

## 🚀 RECOMMENDED SCREEN IMPLEMENTATION ORDER

### Week 1: Profile & Progress
1. **Profile Screen** - Enable editing (2 days backend)
2. **Progress Screen** - Photos & measurements (4 days backend)

### Week 2: Consumption & Goals
3. **Consumption Dashboard** - Meal logging (3 days backend)
4. **My Progress Dashboard** - Goals integration (2 days backend)

### Week 3: History & Messaging
5. **Scan History** - Real persistence (2 days backend)
6. **Client Management** - Messaging (3 days backend)

### Week 4+: Family & Payments
7. **Family screens** - Full implementation (4 days)
8. **Subscription** - IAP integration (10 days)

---

**Total Backend Work:** ~30 days for full screen functionality
**MVP Backend Work:** ~11 days (Critical screens only)
