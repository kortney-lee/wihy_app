# services.wihy.ai - Backend Requirements

**Generated:** January 7, 2026  
**Base URL:** `https://services.wihy.ai`  
**Mobile Services:** ✅ Mostly Complete  
**Estimated Work:** 11 days

---

## Overview

The `services.wihy.ai` service handles goals, progress tracking, measurements, reminders, and scan history.

| Category | Endpoints | Est. Days | Mobile Service |
|----------|-----------|-----------|----------------|
| Goals & Milestones | 8 | 3 | ⚠️ `goalsService.ts` (partial) |
| Progress Photos & Measurements | 6 | 4 | ❌ Needs implementation |
| Reminders | 5 | 2 | ✅ `notificationService.ts` |
| Scan History | 4 | 2 | ✅ `scanService.ts` |
| **Total** | **23** | **11** | |

---

## 🔴 Priority 1: Goals & Milestones (3 days)

**Mobile Service:** ⚠️ `goalsService.ts` (needs completion)

### Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/goals` | POST | Create goal | Bearer |
| `/api/goals` | GET | List user goals | Bearer |
| `/api/goals/:id` | GET | Get goal details | Bearer |
| `/api/goals/:id` | PUT | Update goal | Bearer |
| `/api/goals/:id` | DELETE | Delete goal | Bearer |
| `/api/goals/:id/progress` | POST | Log progress | Bearer |
| `/api/goals/:id/complete` | POST | Mark complete | Bearer |
| `/api/goals/active` | GET | Get active goals | Bearer |

### Goal Types
- `weight_loss` - Target weight reduction
- `muscle_gain` - Target weight/muscle increase
- `steps_daily` - Daily step count target
- `calories_daily` - Daily calorie target
- `water_intake` - Daily water intake target
- `sleep_hours` - Nightly sleep target
- `workout_frequency` - Weekly workout count
- `custom` - User-defined goal

### Request/Response Examples

#### POST `/api/goals`
```json
// Request
{
  "user_id": "user_123",
  "type": "weight_loss",
  "title": "Lose 10 lbs",
  "description": "Get to 165 lbs by summer",
  "target_value": 165,
  "current_value": 175,
  "unit": "lbs",
  "target_date": "2026-06-01",
  "category": "health",
  "milestones": [
    { "value": 172, "label": "First 3 lbs" },
    { "value": 168, "label": "Halfway there" },
    { "value": 165, "label": "Goal reached!" }
  ]
}

// Response
{
  "success": true,
  "goal": {
    "id": "goal_789",
    "user_id": "user_123",
    "type": "weight_loss",
    "title": "Lose 10 lbs",
    "description": "Get to 165 lbs by summer",
    "target_value": 165,
    "current_value": 175,
    "unit": "lbs",
    "target_date": "2026-06-01",
    "category": "health",
    "status": "active",
    "progress_percentage": 0,
    "milestones": [...],
    "created_at": "2026-01-07T00:00:00Z"
  }
}
```

#### GET `/api/goals`
```json
// Query: ?user_id=user_123&status=active&category=health
// Response
{
  "success": true,
  "goals": [
    {
      "id": "goal_789",
      "type": "weight_loss",
      "title": "Lose 10 lbs",
      "target_value": 165,
      "current_value": 172,
      "progress_percentage": 30,
      "status": "active",
      "target_date": "2026-06-01"
    }
  ],
  "total": 1
}
```

#### GET `/api/goals/:id`
```json
// Response
{
  "success": true,
  "goal": {
    "id": "goal_789",
    "user_id": "user_123",
    "type": "weight_loss",
    "title": "Lose 10 lbs",
    "description": "Get to 165 lbs by summer",
    "target_value": 165,
    "current_value": 172,
    "unit": "lbs",
    "target_date": "2026-06-01",
    "category": "health",
    "status": "active",
    "progress_percentage": 30,
    "milestones": [
      { "value": 172, "label": "First 3 lbs", "achieved": true, "achieved_at": "2026-01-05" },
      { "value": 168, "label": "Halfway there", "achieved": false },
      { "value": 165, "label": "Goal reached!", "achieved": false }
    ],
    "progress_history": [
      { "value": 175, "date": "2026-01-01", "notes": "Starting weight" },
      { "value": 173, "date": "2026-01-04", "notes": "Good progress!" },
      { "value": 172, "date": "2026-01-07", "notes": "Hit first milestone" }
    ],
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-07T00:00:00Z"
  }
}
```

#### PUT `/api/goals/:id`
```json
// Request
{
  "title": "Lose 15 lbs",
  "target_value": 160,
  "target_date": "2026-07-01"
}

// Response
{
  "success": true,
  "goal": { ... }
}
```

#### DELETE `/api/goals/:id`
```json
// Response
{
  "success": true
}
```

#### POST `/api/goals/:id/progress`
```json
// Request
{
  "value": 171,
  "date": "2026-01-08",
  "notes": "Feeling great!"
}

// Response
{
  "success": true,
  "progress": {
    "id": "prog_123",
    "goal_id": "goal_789",
    "value": 171,
    "date": "2026-01-08",
    "notes": "Feeling great!",
    "milestone_achieved": null
  },
  "new_percentage": 40
}
```

#### POST `/api/goals/:id/complete`
```json
// Request
{
  "completion_notes": "Finally did it!"
}

// Response
{
  "success": true,
  "goal": {
    "id": "goal_789",
    "status": "completed",
    "completed_at": "2026-06-01T00:00:00Z"
  },
  "achievement": {
    "id": "ach_456",
    "title": "Weight Loss Champion",
    "description": "Lost 10+ lbs",
    "badge_url": "https://..."
  }
}
```

#### GET `/api/goals/active`
```json
// Query: ?user_id=user_123
// Response
{
  "success": true,
  "goals": [
    {
      "id": "goal_789",
      "type": "weight_loss",
      "title": "Lose 10 lbs",
      "progress_percentage": 40,
      "days_remaining": 145
    },
    {
      "id": "goal_790",
      "type": "steps_daily",
      "title": "10,000 steps daily",
      "progress_percentage": 85,
      "streak_days": 12
    }
  ]
}
```

### Database Schema

```sql
-- Goals table
CREATE TABLE goals (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_value DECIMAL(10,2),
  current_value DECIMAL(10,2),
  unit VARCHAR(20),
  target_date DATE,
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'completed', 'abandoned'
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Goal milestones
CREATE TABLE goal_milestones (
  id SERIAL PRIMARY KEY,
  goal_id VARCHAR(255) REFERENCES goals(id) ON DELETE CASCADE,
  value DECIMAL(10,2) NOT NULL,
  label VARCHAR(255),
  achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMP,
  sort_order INTEGER
);

-- Goal progress entries
CREATE TABLE goal_progress (
  id VARCHAR(255) PRIMARY KEY,
  goal_id VARCHAR(255) REFERENCES goals(id) ON DELETE CASCADE,
  value DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_type ON goals(type);
CREATE INDEX idx_goal_progress_goal ON goal_progress(goal_id);
CREATE INDEX idx_goal_progress_date ON goal_progress(date);
```

---

## 🔴 Priority 1: Progress Photos & Measurements (4 days)

**Mobile Service:** ❌ Needs implementation

### Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/progress/photos` | POST | Upload progress photo | Bearer |
| `/api/progress/photos` | GET | Get photo timeline | Bearer |
| `/api/progress/photos/:id` | DELETE | Delete photo | Bearer |
| `/api/measurements` | POST | Log measurement | Bearer |
| `/api/measurements` | GET | Get measurement history | Bearer |
| `/api/measurements/latest` | GET | Get latest values | Bearer |

### Measurement Types
- `weight` - Body weight (lbs/kg)
- `body_fat` - Body fat percentage
- `waist` - Waist circumference
- `chest` - Chest circumference
- `arms` - Arm circumference
- `thighs` - Thigh circumference
- `hips` - Hip circumference

### Photo Types
- `front` - Front view
- `side` - Side view
- `back` - Back view
- `custom` - User-defined

### Request/Response Examples

#### POST `/api/progress/photos`
```
Content-Type: multipart/form-data

file: <image>
user_id: user_123
type: front
date: 2026-01-07
notes: Week 1 progress
```
```json
// Response
{
  "success": true,
  "photo": {
    "id": "photo_123",
    "user_id": "user_123",
    "url": "https://storage.wihy.ai/progress/user_123/photo_123.jpg",
    "thumbnail_url": "https://storage.wihy.ai/progress/user_123/photo_123_thumb.jpg",
    "type": "front",
    "date": "2026-01-07",
    "notes": "Week 1 progress",
    "created_at": "2026-01-07T00:00:00Z"
  }
}
```

#### GET `/api/progress/photos`
```json
// Query: ?user_id=user_123&start_date=2026-01-01&end_date=2026-01-31&type=front
// Response
{
  "success": true,
  "photos": [
    {
      "id": "photo_123",
      "url": "https://...",
      "thumbnail_url": "https://...",
      "type": "front",
      "date": "2026-01-07",
      "notes": "Week 1 progress"
    },
    {
      "id": "photo_124",
      "url": "https://...",
      "thumbnail_url": "https://...",
      "type": "front",
      "date": "2026-01-14",
      "notes": "Week 2 progress"
    }
  ],
  "total": 2
}
```

#### DELETE `/api/progress/photos/:id`
```json
// Response
{
  "success": true
}
```

#### POST `/api/measurements`
```json
// Request
{
  "user_id": "user_123",
  "type": "weight",
  "value": 172.5,
  "unit": "lbs",
  "date": "2026-01-07",
  "notes": "Morning weigh-in"
}

// Response
{
  "success": true,
  "measurement": {
    "id": "meas_456",
    "user_id": "user_123",
    "type": "weight",
    "value": 172.5,
    "unit": "lbs",
    "date": "2026-01-07",
    "notes": "Morning weigh-in",
    "created_at": "2026-01-07T00:00:00Z"
  }
}
```

#### GET `/api/measurements`
```json
// Query: ?user_id=user_123&type=weight&days=30
// Response
{
  "success": true,
  "measurements": [
    { "date": "2026-01-07", "value": 172.5 },
    { "date": "2026-01-06", "value": 173.0 },
    { "date": "2026-01-05", "value": 173.2 }
  ],
  "stats": {
    "min": 172.5,
    "max": 175.0,
    "avg": 173.5,
    "change": -2.5,
    "trend": "decreasing"
  }
}
```

#### GET `/api/measurements/latest`
```json
// Query: ?user_id=user_123
// Response
{
  "success": true,
  "measurements": {
    "weight": { "value": 172.5, "unit": "lbs", "date": "2026-01-07" },
    "body_fat": { "value": 18.5, "unit": "%", "date": "2026-01-01" },
    "waist": { "value": 32, "unit": "in", "date": "2026-01-01" },
    "chest": { "value": 40, "unit": "in", "date": "2026-01-01" },
    "arms": { "value": 14, "unit": "in", "date": "2026-01-01" },
    "thighs": { "value": 22, "unit": "in", "date": "2026-01-01" },
    "hips": { "value": 38, "unit": "in", "date": "2026-01-01" }
  }
}
```

### Database Schema

```sql
-- Progress photos
CREATE TABLE progress_photos (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  type VARCHAR(20) NOT NULL,  -- 'front', 'side', 'back', 'custom'
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Measurements
CREATE TABLE measurements (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,  -- 'weight', 'body_fat', 'waist', etc.
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_progress_photos_user ON progress_photos(user_id);
CREATE INDEX idx_progress_photos_date ON progress_photos(date);
CREATE INDEX idx_measurements_user ON measurements(user_id);
CREATE INDEX idx_measurements_type ON measurements(type);
CREATE INDEX idx_measurements_date ON measurements(date);
```

---

## 🟡 Priority 2: Reminders Backend (2 days)

**Mobile Service:** ✅ `notificationService.ts` (COMPLETE)

### Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/reminders` | POST | Create reminder | Bearer |
| `/api/reminders` | GET | List reminders | Bearer |
| `/api/reminders/:id` | PUT | Update reminder | Bearer |
| `/api/reminders/:id` | DELETE | Delete reminder | Bearer |
| `/api/reminders/:id/snooze` | POST | Snooze reminder | Bearer |

### Reminder Types
- `meal` - Meal reminder (breakfast, lunch, dinner, snack)
- `water` - Hydration reminder
- `workout` - Exercise reminder
- `medication` - Medicine reminder
- `weigh_in` - Weight tracking reminder
- `custom` - User-defined

### Request/Response Examples

#### POST `/api/reminders`
```json
// Request
{
  "user_id": "user_123",
  "type": "meal",
  "title": "Lunch time!",
  "message": "Don't forget to log your lunch",
  "time": "12:00",
  "days": ["mon", "tue", "wed", "thu", "fri"],
  "enabled": true,
  "sound": "default",
  "vibrate": true
}

// Response
{
  "success": true,
  "reminder": {
    "id": "rem_123",
    "user_id": "user_123",
    "type": "meal",
    "title": "Lunch time!",
    "message": "Don't forget to log your lunch",
    "time": "12:00",
    "days": ["mon", "tue", "wed", "thu", "fri"],
    "enabled": true,
    "sound": "default",
    "vibrate": true,
    "created_at": "2026-01-07T00:00:00Z"
  }
}
```

#### GET `/api/reminders`
```json
// Query: ?user_id=user_123&type=meal&enabled=true
// Response
{
  "success": true,
  "reminders": [
    {
      "id": "rem_123",
      "type": "meal",
      "title": "Lunch time!",
      "time": "12:00",
      "days": ["mon", "tue", "wed", "thu", "fri"],
      "enabled": true,
      "next_trigger": "2026-01-08T12:00:00Z"
    }
  ]
}
```

#### PUT `/api/reminders/:id`
```json
// Request
{
  "time": "12:30",
  "enabled": false
}

// Response
{
  "success": true,
  "reminder": { ... }
}
```

#### DELETE `/api/reminders/:id`
```json
// Response
{
  "success": true
}
```

#### POST `/api/reminders/:id/snooze`
```json
// Request
{
  "minutes": 15
}

// Response
{
  "success": true,
  "next_trigger": "2026-01-07T12:15:00Z"
}
```

### Database Schema

```sql
-- Reminders
CREATE TABLE reminders (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  time TIME NOT NULL,
  days VARCHAR(50)[],  -- ['mon', 'tue', 'wed', ...]
  enabled BOOLEAN DEFAULT TRUE,
  sound VARCHAR(50) DEFAULT 'default',
  vibrate BOOLEAN DEFAULT TRUE,
  snoozed_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reminders_user ON reminders(user_id);
CREATE INDEX idx_reminders_type ON reminders(type);
CREATE INDEX idx_reminders_enabled ON reminders(enabled);
```

---

## 🟡 Priority 2: Scan History Persistence (2 days)

**Mobile Service:** ✅ `scanService.ts` (COMPLETE)

### Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/scan/history` | GET | Get scan history | Bearer |
| `/api/scan/history/:id` | GET | Get scan details | Bearer |
| `/api/scan/history/:id` | DELETE | Delete scan | Bearer |
| `/api/scan/analytics` | GET | Get scan analytics | Bearer |

### Request/Response Examples

#### GET `/api/scan/history`
```json
// Query: ?user_id=user_123&limit=50&offset=0&type=barcode
// Response
{
  "success": true,
  "scans": [
    {
      "id": "scan_123",
      "type": "barcode",
      "product_name": "Greek Yogurt",
      "brand": "Chobani",
      "health_score": 85,
      "calories": 120,
      "thumbnail_url": "https://...",
      "scanned_at": "2026-01-07T10:30:00Z"
    }
  ],
  "total": 142,
  "has_more": true
}
```

#### GET `/api/scan/history/:id`
```json
// Response
{
  "success": true,
  "scan": {
    "id": "scan_123",
    "type": "barcode",
    "barcode": "012345678901",
    "product_name": "Greek Yogurt",
    "brand": "Chobani",
    "health_score": 85,
    "image_url": "https://...",
    "nutrition": {
      "calories": 120,
      "protein": 15,
      "carbs": 8,
      "fat": 3,
      "fiber": 0,
      "sugar": 6
    },
    "ingredients": ["..."],
    "allergens": ["milk"],
    "health_alerts": [],
    "scanned_at": "2026-01-07T10:30:00Z"
  }
}
```

#### DELETE `/api/scan/history/:id`
```json
// Response
{
  "success": true
}
```

#### GET `/api/scan/analytics`
```json
// Query: ?user_id=user_123&days=30
// Response
{
  "success": true,
  "analytics": {
    "total_scans": 142,
    "scans_this_week": 23,
    "most_scanned": [
      { "product": "Greek Yogurt", "count": 12 },
      { "product": "Almonds", "count": 8 }
    ],
    "health_score_avg": 78,
    "health_score_trend": "improving",
    "category_breakdown": {
      "dairy": 25,
      "snacks": 40,
      "produce": 30,
      "beverages": 15,
      "other": 32
    },
    "scans_by_day": [
      { "date": "2026-01-07", "count": 5 },
      { "date": "2026-01-06", "count": 3 }
    ]
  }
}
```

### Database Schema

```sql
-- Scan history
CREATE TABLE scan_history (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,  -- 'barcode', 'photo', 'label'
  barcode VARCHAR(50),
  product_name VARCHAR(255),
  brand VARCHAR(255),
  health_score INTEGER,
  image_url TEXT,
  thumbnail_url TEXT,
  nutrition JSONB,
  ingredients TEXT[],
  allergens TEXT[],
  health_alerts JSONB,
  raw_response JSONB,  -- Store full ML API response
  scanned_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scan_history_user ON scan_history(user_id);
CREATE INDEX idx_scan_history_type ON scan_history(type);
CREATE INDEX idx_scan_history_date ON scan_history(scanned_at);
CREATE INDEX idx_scan_history_barcode ON scan_history(barcode);
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

### Image Storage
- Use S3 or Google Cloud Storage for photo uploads
- Generate thumbnails (200x200) for list views
- Apply compression for mobile optimization
- Set appropriate cache headers

---

## File Structure

```
services.wihy.ai/
├── routes/
│   ├── goals.ts          # Goals endpoints
│   ├── progress.ts       # Progress photos
│   ├── measurements.ts   # Body measurements
│   ├── reminders.ts      # Reminder system
│   └── scans.ts          # Scan history
├── models/
│   ├── Goal.ts
│   ├── GoalMilestone.ts
│   ├── GoalProgress.ts
│   ├── ProgressPhoto.ts
│   ├── Measurement.ts
│   ├── Reminder.ts
│   └── ScanHistory.ts
├── services/
│   ├── imageService.ts   # Photo processing
│   ├── statsService.ts   # Analytics calculations
│   └── notifyService.ts  # Push notification triggers
└── middleware/
    └── auth.ts           # JWT validation
```

---

*Mobile service layer ready - just implement these endpoints!*
