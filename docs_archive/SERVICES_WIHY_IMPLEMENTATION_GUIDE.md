# services.wihy.ai - Implementation Guide

**Last Updated:** January 7, 2026  
**Base URL:** `https://services.wihy.ai`  
**Status:** ✅ Production Ready

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication](#authentication)
3. [Goals & Milestones API](#goals--milestones-api)
4. [Progress Tracking API](#progress-tracking-api)
5. [Reminders API](#reminders-api)
6. [Scan History API](#scan-history-api)
7. [Combined Programs API](#combined-programs-api)
8. [Database Schema](#database-schema)
9. [Image Storage](#image-storage)
10. [Error Handling](#error-handling)
11. [Client Integration Examples](#client-integration-examples)

---

## Architecture Overview

### Tech Stack
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (136.115.54.187:5432/wihy_services)
- **Image Storage:** Google Cloud Storage (GCS)
- **Authentication:** JWT Bearer Tokens

### Service Layer Architecture
```
Client (Mobile/Web)
    ↓
JWT Authentication Middleware
    ↓
Express Routes (goalsRoutes.js, progressRoutes.js, etc.)
    ↓
Service Layer (GoalsService, ProgressTrackingService, etc.)
    ↓
Database Service (PostgreSQL)
    ↓
Google Cloud Storage (for images)
```

### Key Services
- **GoalsService** - Goal tracking, milestones, progress logging
- **ProgressTrackingService** - Body measurements, progress photos
- **NotificationService** - Reminders, push notifications
- **CombinedProgramService** - Unified fitness + meal programs
- **DatabaseService** - Centralized database access
- **UnifiedStorageService** - Google Cloud Storage for images

---

## Authentication

### Headers Required
All API requests require JWT authentication:

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### User ID Extraction
The JWT token contains the user ID, which is automatically extracted by middleware:
```javascript
// server.js middleware extracts userId from token
req.userId = decoded.userId;
```

---

## Goals & Milestones API

### Base Endpoint
`/api/goals`

### 1. Create Goal

**POST** `/api/goals`

```json
{
  "type": "weight_loss",
  "title": "Lose 20 pounds",
  "target_value": 180,
  "current_value": 200,
  "unit": "lbs",
  "target_date": "2026-06-01",
  "milestones": [
    { "value": 195, "label": "First 5 lbs" },
    { "value": 190, "label": "Halfway there" },
    { "value": 185, "label": "Almost done" },
    { "value": 180, "label": "Goal achieved!" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "goal": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "test_user",
    "type": "weight_loss",
    "title": "Lose 20 pounds",
    "target_value": 180,
    "current_value": 200,
    "unit": "lbs",
    "status": "active",
    "progress_percentage": 0,
    "target_date": "2026-06-01T00:00:00.000Z",
    "created_at": "2026-01-07T10:30:00.000Z"
  },
  "milestones": [
    {
      "id": "milestone-uuid-1",
      "goal_id": "550e8400-e29b-41d4-a716-446655440000",
      "value": 195,
      "label": "First 5 lbs",
      "achieved": false
    }
    // ... more milestones
  ]
}
```

### 2. List Goals

**GET** `/api/goals?status=active&type=weight_loss`

Query Parameters:
- `status` - Filter by status: `active`, `completed`, `paused`
- `type` - Filter by type: `weight_loss`, `muscle_gain`, `nutrition`, etc.

**Response:**
```json
{
  "success": true,
  "goals": [
    {
      "id": "goal-uuid",
      "title": "Lose 20 pounds",
      "current_value": 195,
      "target_value": 180,
      "progress_percentage": 25,
      "status": "active"
    }
  ],
  "count": 1
}
```

### 3. Get Goal Details

**GET** `/api/goals/:id`

**Response:**
```json
{
  "success": true,
  "goal": {
    "id": "goal-uuid",
    "title": "Lose 20 pounds",
    "current_value": 195,
    "target_value": 180,
    "progress_percentage": 25
  },
  "milestones": [
    {
      "id": "milestone-uuid",
      "value": 195,
      "label": "First 5 lbs",
      "achieved": true,
      "achieved_at": "2026-01-15T10:00:00.000Z"
    }
  ],
  "progress_history": [
    {
      "id": "progress-uuid",
      "value": 195,
      "date": "2026-01-15",
      "notes": "Feeling great!"
    }
  ]
}
```

### 4. Log Progress

**POST** `/api/goals/:id/progress`

```json
{
  "value": 195,
  "date": "2026-01-15",
  "notes": "Feeling energized after first week!"
}
```

**Response:**
```json
{
  "success": true,
  "progress": {
    "id": "progress-uuid",
    "goal_id": "goal-uuid",
    "value": 195,
    "date": "2026-01-15",
    "notes": "Feeling energized after first week!"
  },
  "milestones_achieved": [
    {
      "id": "milestone-uuid",
      "label": "First 5 lbs",
      "value": 195
    }
  ],
  "goal_updated": {
    "current_value": 195,
    "progress_percentage": 25
  }
}
```

### 5. Update Goal

**PUT** `/api/goals/:id`

```json
{
  "title": "Lose 25 pounds",
  "target_value": 175,
  "status": "active"
}
```

### 6. Complete Goal

**POST** `/api/goals/:id/complete`

```json
{
  "notes": "Achieved my goal!"
}
```

### 7. Delete Goal

**DELETE** `/api/goals/:id`

### 8. Get Active Goals

**GET** `/api/goals/active`

Returns all active goals for the authenticated user.

---

## Progress Tracking API

### Base Endpoint
`/api/progress` and `/api/measurements`

### 1. Upload Progress Photo

**POST** `/api/progress/photos`

**Important:** Images must be uploaded to Google Cloud Storage first, then URL stored in database.

```json
{
  "image_url": "https://storage.googleapis.com/wihy-scan-images/progress-photos/user123/photo-uuid.jpg",
  "thumbnail_url": "https://storage.googleapis.com/wihy-scan-images/progress-photos/user123/thumb-photo-uuid.jpg",
  "type": "front",
  "date": "2026-01-15",
  "notes": "Week 2 progress"
}
```

**Response:**
```json
{
  "success": true,
  "photo": {
    "id": "photo-uuid",
    "user_id": "test_user",
    "url": "https://storage.googleapis.com/wihy-scan-images/...",
    "thumbnail_url": "https://storage.googleapis.com/wihy-scan-images/...",
    "type": "front",
    "taken_at": "2026-01-15T00:00:00.000Z"
  }
}
```

### 2. Get Photo Timeline

**GET** `/api/progress/photos?type=front&limit=10`

Query Parameters:
- `type` - Filter by photo type: `front`, `side`, `back`
- `limit` - Number of photos to return (default: 20)
- `start_date` - Filter from date (YYYY-MM-DD)
- `end_date` - Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "photos": [
    {
      "id": "photo-uuid",
      "url": "https://...",
      "thumbnail_url": "https://...",
      "type": "front",
      "taken_at": "2026-01-15T00:00:00.000Z"
    }
  ],
  "count": 5
}
```

### 3. Delete Progress Photo

**DELETE** `/api/progress/photos/:id`

### 4. Log Measurement

**POST** `/api/measurements`

```json
{
  "type": "weight",
  "value": 195,
  "unit": "lbs",
  "date": "2026-01-15",
  "notes": "Morning weight"
}
```

**Supported Measurement Types:**
- `weight`
- `body_fat_percentage`
- `waist`
- `chest`
- `hips`
- `bicep`
- `thigh`
- `neck`

**Response:**
```json
{
  "success": true,
  "measurement": {
    "id": "measurement-uuid",
    "user_id": "test_user",
    "type": "weight",
    "value": 195,
    "unit": "lbs",
    "recorded_at": "2026-01-15T00:00:00.000Z"
  }
}
```

### 5. Get Measurement History

**GET** `/api/measurements?type=weight&limit=30`

Query Parameters:
- `type` - Measurement type
- `limit` - Number of records (default: 30)
- `start_date` - Filter from date
- `end_date` - Filter to date

**Response:**
```json
{
  "success": true,
  "measurements": [
    {
      "id": "uuid",
      "type": "weight",
      "value": 195,
      "unit": "lbs",
      "recorded_at": "2026-01-15T10:00:00.000Z"
    }
  ],
  "count": 10,
  "stats": {
    "latest": 195,
    "oldest": 200,
    "change": -5,
    "average": 197.5
  }
}
```

### 6. Get Latest Measurements

**GET** `/api/measurements/latest`

Returns the most recent measurement for each type.

**Response:**
```json
{
  "success": true,
  "latest": {
    "weight": {
      "value": 195,
      "unit": "lbs",
      "recorded_at": "2026-01-15T10:00:00.000Z"
    },
    "body_fat_percentage": {
      "value": 22,
      "unit": "%",
      "recorded_at": "2026-01-14T10:00:00.000Z"
    }
  }
}
```

---

## Reminders API

### Base Endpoint
`/api/reminders`

### 1. Create Reminder

**POST** `/api/reminders`

```json
{
  "type": "water",
  "title": "Drink water",
  "message": "Time to hydrate! Drink 8oz of water",
  "time": "09:00",
  "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "enabled": true
}
```

**Reminder Types:**
- `water` - Hydration reminders
- `meal` - Meal time reminders
- `medication` - Medication reminders
- `exercise` - Workout reminders
- `weigh_in` - Weight tracking reminders
- `custom` - Custom reminders

**Response:**
```json
{
  "success": true,
  "reminder": {
    "id": "reminder-uuid",
    "user_id": "test_user",
    "type": "water",
    "title": "Drink water",
    "message": "Time to hydrate!",
    "time": "09:00",
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "enabled": true,
    "created_at": "2026-01-07T10:00:00.000Z"
  }
}
```

### 2. List Reminders

**GET** `/api/reminders?type=water&enabled=true`

Query Parameters:
- `type` - Filter by reminder type
- `enabled` - Filter by enabled status (true/false)

**Response:**
```json
{
  "success": true,
  "reminders": [
    {
      "id": "reminder-uuid",
      "type": "water",
      "title": "Drink water",
      "time": "09:00",
      "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
      "enabled": true
    }
  ],
  "count": 5
}
```

### 3. Update Reminder

**PUT** `/api/reminders/:id`

```json
{
  "time": "10:00",
  "enabled": false
}
```

### 4. Delete Reminder

**DELETE** `/api/reminders/:id`

### 5. Snooze Reminder

**POST** `/api/reminders/:id/snooze`

```json
{
  "duration": 15
}
```

Snoozes the reminder for specified minutes (default: 10).

---

## Scan History API

### Base Endpoint
`/api/scan`

### 1. Get Scan History

**GET** `/api/scan/history?limit=50&includeImages=true`

Query Parameters:
- `userId` - User ID (auto-extracted from JWT)
- `limit` - Max results (default: 50)
- `includeImages` - Include image URLs (default: true)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "scans": [
    {
      "id": 12345,
      "user_id": "test_user",
      "scan_type": "barcode",
      "product_name": "Nature Valley Granola Bar",
      "barcode": "016000275270",
      "health_score": 65,
      "nova_classification": 3,
      "nutrition_grade": "C",
      "image_url": "https://storage.googleapis.com/wihy-scan-images/...",
      "scan_timestamp": "2026-01-07T10:30:00.000Z",
      "metadata": {
        "confidence_score": 0.95,
        "data_source": "openfoodfacts"
      }
    }
  ],
  "timestamp": "2026-01-07T11:00:00.000Z"
}
```

### 2. Scan Types
- `barcode` - Barcode scanning
- `photo` - Food photo analysis
- `pill` - Pill identification
- `label` - Nutrition label scanning
- `prescription` - Prescription scanning

### 3. Image Storage Flow
```
1. Client captures image
2. Upload to Google Cloud Storage → get URL
3. POST /api/scan with image URL
4. Scan analysis performed
5. Results + image URL saved to scan_history
6. Client retrieves history with image URLs
```

---

## Combined Programs API

### Base Endpoint
`/api/programs/combined`

### Overview
The Combined Programs API unifies fitness workouts with meal plans into integrated health programs. It provides goal-based auto-configuration, calorie sync between workouts and meals, and coordinated progress tracking.

### Supported Goals
- `weight_loss` - Caloric deficit with high protein
- `muscle_gain` - Caloric surplus with strength focus
- `body_recomposition` - Simultaneous fat loss + muscle gain
- `maintenance` - Balanced calorie in/out
- `athletic_performance` - Sport-specific training + nutrition
- `general_health` - Overall wellness approach

### 1. Create Combined Program

**POST** `/api/programs/combined`

```json
{
  "goal": "weight_loss",
  "duration": 28,
  "user_profile": {
    "age": 35,
    "weight": 180,
    "height": 70,
    "gender": "male",
    "activity_level": "moderate"
  },
  "fitness_overrides": {
    "days_per_week": 4,
    "workout_type": "hiit",
    "duration": 45,
    "equipment": ["dumbbells", "resistance_bands"]
  },
  "meal_overrides": {
    "dietary_restrictions": ["gluten_free"],
    "meal_variety": "balanced",
    "cooking_level": "intermediate"
  },
  "sync_options": {
    "calorie_adjustment": true,
    "post_workout_meals": true,
    "rest_day_nutrition": true,
    "meal_timing": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "program": {
    "id": "combined-uuid",
    "goal": "weight_loss",
    "status": "active",
    "fitness": {
      "mode": "routine",
      "program_id": "fitness-uuid",
      "days_per_week": 4,
      "workout_schedule": [
        {
          "day": "Monday",
          "day_number": 1,
          "type": "hiit",
          "duration": 45,
          "estimated_calories": 350,
          "is_rest": false
        },
        {
          "day": "Tuesday",
          "day_number": 2,
          "type": "rest",
          "is_rest": true
        }
      ],
      "total_weekly_calories": 1400
    },
    "meals": {
      "mode": "plan",
      "program_id": "meal-plan-uuid",
      "workout_day_calories": 1800,
      "rest_day_calories": 1500,
      "protein_target": 150
    },
    "sync": {
      "calorie_adjustment": true,
      "post_workout_meals": true,
      "rest_day_nutrition": true,
      "meal_timing": true
    },
    "synced_days": [
      {
        "date": "2026-01-07",
        "day_number": 2,
        "day_name": "Tuesday",
        "is_workout_day": true,
        "workout_calories": 350,
        "base_calories": 1800,
        "adjusted_calories": 1975,
        "meals": [...],
        "post_workout_meal": {
          "name": "Protein Shake + Banana",
          "calories": 280,
          "protein": 35,
          "carbs": 40
        },
        "total_protein": 150,
        "total_carbs": 180,
        "total_fat": 60
      }
    ],
    "duration": 28,
    "start_date": "2026-01-07T00:00:00.000Z",
    "end_date": "2026-02-04T00:00:00.000Z",
    "progress": {
      "current_day": 1,
      "workouts_completed": 0,
      "workouts_scheduled": 16,
      "meals_logged": 0,
      "meals_planned": 84,
      "compliance_rate": 0
    },
    "created_at": "2026-01-07T10:00:00.000Z"
  }
}
```

### 2. List Combined Programs

**GET** `/api/programs/combined?status=active`

Query Parameters:
- `status` - Filter by status: `active`, `completed`, `paused`
- `goal` - Filter by goal type

**Response:**
```json
{
  "success": true,
  "programs": [
    {
      "id": "combined-uuid",
      "goal": "weight_loss",
      "status": "active",
      "duration": 28,
      "progress": {
        "current_day": 7,
        "compliance_rate": 85
      },
      "start_date": "2026-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 3. Get Combined Program Details

**GET** `/api/programs/combined/:id`

**Response:**
```json
{
  "success": true,
  "program": {
    "id": "combined-uuid",
    "goal": "weight_loss",
    "status": "active",
    "fitness": { ... },
    "meals": { ... },
    "sync": { ... },
    "synced_days": [ ... ],
    "progress": { ... }
  },
  "dashboard": {
    "today": {
      "workout": {
        "scheduled": { "type": "hiit", "duration": 45 },
        "completed": false,
        "calories_burned": 0
      },
      "meals": {
        "planned": [...],
        "calories_target": 1800,
        "calories_logged": 650,
        "calories_remaining": 1150,
        "protein_target": 150,
        "protein_logged": 45
      },
      "net_calories": 650,
      "is_workout_day": true
    },
    "this_week": {
      "workouts_completed": 2,
      "workouts_remaining": 2,
      "avg_calorie_balance": -200,
      "avg_protein_intake": 142
    },
    "recommendations": [
      {
        "icon": "fitness",
        "text": "Today is a HIIT day - don't forget to exercise!",
        "color": "#f97316"
      },
      {
        "icon": "restaurant",
        "text": "You still have 1150 calories to eat today",
        "color": "#8b5cf6"
      }
    ]
  }
}
```

### 4. Update Combined Program

**PUT** `/api/programs/combined/:id`

```json
{
  "status": "paused",
  "fitness_overrides": {
    "days_per_week": 3
  }
}
```

### 5. Delete Combined Program

**DELETE** `/api/programs/combined/:id`

### 6. Log Workout Completion

**POST** `/api/programs/combined/:id/workout`

```json
{
  "workout_day": 1,
  "duration": 48,
  "calories_burned": 380,
  "completed_at": "2026-01-07T18:30:00.000Z",
  "notes": "Felt strong today!"
}
```

**Response:**
```json
{
  "success": true,
  "workout_log": {
    "id": "log-uuid",
    "program_id": "combined-uuid",
    "workout_day": 1,
    "duration": 48,
    "calories_burned": 380
  },
  "post_workout_meal": {
    "timing": "within 30-60 minutes",
    "target_protein": 35,
    "target_carbs": 40,
    "suggestions": [
      { "name": "Protein Shake + Banana", "calories": 280, "protein": 35 },
      { "name": "Greek Yogurt Parfait", "calories": 320, "protein": 28 }
    ]
  },
  "progress_updated": {
    "workouts_completed": 1,
    "compliance_rate": 6
  }
}
```

### 7. Get Post-Workout Meal Suggestions

**POST** `/api/programs/combined/:id/post-workout-meal`

```json
{
  "workout_type": "strength",
  "duration": 60,
  "calories_burned": 400,
  "muscles_worked": ["chest", "triceps", "shoulders"]
}
```

**Response:**
```json
{
  "success": true,
  "workout": {
    "type": "strength",
    "duration": 60,
    "calories_burned": 400,
    "muscles_worked": ["chest", "triceps", "shoulders"]
  },
  "post_workout_meal": {
    "timing": "within 30-60 minutes",
    "target_protein": 40,
    "target_carbs": 50,
    "suggestions": [
      {
        "name": "Grilled Chicken + Rice",
        "calories": 450,
        "protein": 42,
        "carbs": 55,
        "fat": 8
      },
      {
        "name": "Salmon + Sweet Potato",
        "calories": 480,
        "protein": 38,
        "carbs": 45,
        "fat": 18
      }
    ]
  }
}
```

### 8. Get Dashboard View

**GET** `/api/programs/combined/:id/dashboard`

Returns the unified dashboard view with today's schedule, progress, and recommendations.

### 9. Get Available Goals

**GET** `/api/programs/combined/goals`

**Response:**
```json
{
  "success": true,
  "goals": [
    {
      "id": "weight_loss",
      "label": "Weight Loss",
      "description": "Caloric deficit with high protein to preserve muscle",
      "icon": "trending-down-outline"
    },
    {
      "id": "muscle_gain",
      "label": "Muscle Gain",
      "description": "Caloric surplus with strength training focus",
      "icon": "fitness-outline"
    },
    {
      "id": "body_recomposition",
      "label": "Body Recomp",
      "description": "Lose fat and build muscle simultaneously",
      "icon": "body-outline"
    },
    {
      "id": "maintenance",
      "label": "Maintenance",
      "description": "Maintain current weight with balanced nutrition",
      "icon": "shield-checkmark-outline"
    },
    {
      "id": "athletic_performance",
      "label": "Athletic Performance",
      "description": "Sport-specific training with performance nutrition",
      "icon": "trophy-outline"
    },
    {
      "id": "general_health",
      "label": "General Health",
      "description": "Balanced approach for overall wellness",
      "icon": "heart-outline"
    }
  ]
}
```

### 10. Preview Program Configuration

**POST** `/api/programs/combined/preview`

Preview the auto-configured settings before creating.

```json
{
  "goal": "muscle_gain",
  "user_profile": {
    "age": 28,
    "weight": 165,
    "height": 72,
    "gender": "male",
    "activity_level": "active"
  }
}
```

**Response:**
```json
{
  "success": true,
  "config": {
    "goal": "muscle_gain",
    "fitness": {
      "mode": "routine",
      "workout_type": "strength",
      "days_per_week": 5,
      "duration": 60,
      "intensity": "high"
    },
    "meals": {
      "mode": "plan",
      "workout_day_calories": 2800,
      "rest_day_calories": 2400,
      "protein_target": 180,
      "fitness_goal": "muscle_gain",
      "suggested_diets": ["high_protein", "balanced"]
    },
    "sync": {
      "calorie_adjustment": true,
      "post_workout_meals": true,
      "rest_day_nutrition": true,
      "meal_timing": true
    }
  }
}
```

---

## Database Schema

### Goals Table
```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0,
  unit VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  progress_percentage INTEGER DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_type ON goals(type);
```

### Goal Milestones Table
```sql
CREATE TABLE goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  value DECIMAL(10,2) NOT NULL,
  label VARCHAR(255),
  achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_milestones_goal_id ON goal_milestones(goal_id);
```

### Goal Progress Table
```sql
CREATE TABLE goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  value DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_progress_goal_id ON goal_progress(goal_id);
CREATE INDEX idx_progress_date ON goal_progress(date);
```

### Progress Photos Table
```sql
CREATE TABLE progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  type VARCHAR(20),
  taken_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photos_user_id ON progress_photos(user_id);
CREATE INDEX idx_photos_type ON progress_photos(type);
CREATE INDEX idx_photos_taken_at ON progress_photos(taken_at);
```

### Measurements Table
```sql
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20),
  recorded_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_measurements_user_id ON measurements(user_id);
CREATE INDEX idx_measurements_type ON measurements(type);
CREATE INDEX idx_measurements_recorded_at ON measurements(recorded_at);
```

### Reminders Table
```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  time TIME NOT NULL,
  days VARCHAR(20)[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  snoozed_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_type ON reminders(type);
CREATE INDEX idx_reminders_enabled ON reminders(enabled);
```

### Scan History Table
```sql
CREATE TABLE scan_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  scan_type VARCHAR(50) NOT NULL,
  scan_input TEXT,
  scan_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  product_name VARCHAR(500),
  barcode VARCHAR(100),
  health_score INTEGER,
  nova_classification INTEGER,
  nutrition_grade VARCHAR(10),
  image_url TEXT,
  image_blob_name VARCHAR(500),
  medication_name VARCHAR(500),
  rxcui VARCHAR(50),
  ndc VARCHAR(50),
  detected_claims JSONB,
  greenwashing_score INTEGER,
  metadata JSONB
);

CREATE INDEX idx_scan_user_id ON scan_history(user_id);
CREATE INDEX idx_scan_type ON scan_history(scan_type);
CREATE INDEX idx_scan_timestamp ON scan_history(scan_timestamp);
CREATE INDEX idx_scan_barcode ON scan_history(barcode);
```

### Combined Programs Table
```sql
CREATE TABLE combined_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  goal VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  duration INTEGER NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  fitness_config JSONB NOT NULL,
  meals_config JSONB NOT NULL,
  sync_config JSONB NOT NULL,
  fitness_program_id VARCHAR(255),
  meal_program_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_combined_user_id ON combined_programs(user_id);
CREATE INDEX idx_combined_status ON combined_programs(status);
CREATE INDEX idx_combined_goal ON combined_programs(goal);
```

### Combined Program Days Table
```sql
CREATE TABLE combined_program_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES combined_programs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  is_workout_day BOOLEAN DEFAULT false,
  workout_calories INTEGER DEFAULT 0,
  base_calories INTEGER NOT NULL,
  adjusted_calories INTEGER NOT NULL,
  meals_data JSONB,
  post_workout_meal JSONB,
  total_protein INTEGER,
  total_carbs INTEGER,
  total_fat INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_combined_days_program ON combined_program_days(program_id);
CREATE INDEX idx_combined_days_date ON combined_program_days(date);
```

### Combined Program Progress Table
```sql
CREATE TABLE combined_program_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES combined_programs(id) ON DELETE CASCADE,
  current_day INTEGER DEFAULT 1,
  workouts_completed INTEGER DEFAULT 0,
  workouts_scheduled INTEGER DEFAULT 0,
  meals_logged INTEGER DEFAULT 0,
  meals_planned INTEGER DEFAULT 0,
  compliance_rate DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_combined_progress_program ON combined_program_progress(program_id);
```

### Combined Workout Logs Table
```sql
CREATE TABLE combined_workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES combined_programs(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  workout_day INTEGER NOT NULL,
  duration INTEGER,
  calories_burned INTEGER,
  completed_at TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_combined_workout_logs_program ON combined_workout_logs(program_id);
CREATE INDEX idx_combined_workout_logs_user ON combined_workout_logs(user_id);
```

---

## Image Storage

### Google Cloud Storage Integration

#### Configuration
```javascript
// Environment variables
USE_GCP=true
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GCS_BUCKET_NAME=wihy-scan-images
```

#### Upload Flow (Server-Side)
```javascript
const UnifiedStorageService = require('./services/core/UnifiedStorageService');
const storage = new UnifiedStorageService();

// Upload image buffer to GCS
const result = await storage.uploadImage(
  imageBuffer,
  'photo.jpg',
  'user123'
);

console.log(result.imageUrl); // https://storage.googleapis.com/wihy-scan-images/...
console.log(result.blobName); // users/user123/photo_timestamp.jpg
console.log(result.storage);   // 'gcs'
```

#### Direct Client Upload (Signed URLs)
```javascript
// 1. Request signed upload URL from server
GET /api/scan/upload-url?extension=jpg

Response:
{
  "uploadUrl": "https://storage.googleapis.com/wihy-scan-images/temp/user123/upload_1234567890_abc123.jpg?X-Goog-Algorithm=...",
  "blobName": "temp/user123/upload_1234567890_abc123.jpg",
  "expiresAt": "2026-01-07T11:00:00.000Z"
}

// 2. Client uploads directly to GCS
PUT uploadUrl
Content-Type: image/jpeg
Body: [image binary data]

// 3. Confirm upload and trigger analysis
POST /api/scan/analyze-upload
{
  "blobName": "temp/user123/upload_1234567890_abc123.jpg"
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Missing or invalid parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Example Error Handling (Client)
```javascript
try {
  const response = await fetch('/api/goals', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(goalData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('Goal creation failed:', error.message);
  throw error;
}
```

---

## Client Integration Examples

### React Native (Mobile)

#### goalsService.ts
```typescript
import axios from 'axios';

const API_BASE_URL = 'https://services.wihy.ai';

class GoalsService {
  private getHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async createGoal(token: string, goalData: any) {
    const response = await axios.post(
      `${API_BASE_URL}/api/goals`,
      goalData,
      { headers: this.getHeaders(token) }
    );
    return response.data;
  }

  async getGoals(token: string, filters?: { status?: string; type?: string }) {
    const params = new URLSearchParams(filters);
    const response = await axios.get(
      `${API_BASE_URL}/api/goals?${params}`,
      { headers: this.getHeaders(token) }
    );
    return response.data;
  }

  async logProgress(token: string, goalId: string, progress: any) {
    const response = await axios.post(
      `${API_BASE_URL}/api/goals/${goalId}/progress`,
      progress,
      { headers: this.getHeaders(token) }
    );
    return response.data;
  }
}

export default new GoalsService();
```

#### progressService.ts
```typescript
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

class ProgressService {
  async uploadProgressPhoto(token: string, photoUri: string, type: string) {
    // 1. Get signed upload URL from server
    const uploadUrlResponse = await axios.get(
      `${API_BASE_URL}/api/scan/upload-url?extension=jpg`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const { uploadUrl, blobName } = uploadUrlResponse.data;

    // 2. Upload image directly to Google Cloud Storage
    await FileSystem.uploadAsync(uploadUrl, photoUri, {
      httpMethod: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' }
    });

    // 3. Save to progress photos
    const imageUrl = uploadUrl.split('?')[0]; // Remove signature params
    const response = await axios.post(
      `${API_BASE_URL}/api/progress/photos`,
      {
        image_url: imageUrl,
        type: type,
        date: new Date().toISOString().split('T')[0]
      },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    return response.data;
  }

  async getPhotoTimeline(token: string, type?: string) {
    const params = type ? `?type=${type}` : '';
    const response = await axios.get(
      `${API_BASE_URL}/api/progress/photos${params}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    return response.data;
  }
}

export default new ProgressService();
```

### Web (React)

#### useGoals.ts Hook
```typescript
import { useState, useEffect } from 'react';
import goalsService from './services/goalsService';

export const useGoals = (token: string) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGoals = async (filters?: any) => {
    setLoading(true);
    try {
      const data = await goalsService.getGoals(token, filters);
      setGoals(data.goals);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: any) => {
    try {
      const result = await goalsService.createGoal(token, goalData);
      setGoals([...goals, result.goal]);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (token) {
      fetchGoals();
    }
  }, [token]);

  return {
    goals,
    loading,
    error,
    fetchGoals,
    createGoal
  };
};
```

---

## Testing

### Run Test Suite
```bash
node test-services-wihy-ai.js
```

### Manual API Testing (cURL)

#### Create Goal
```bash
curl -X POST https://services.wihy.ai/api/goals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weight_loss",
    "title": "Lose 20 pounds",
    "target_value": 180,
    "current_value": 200,
    "unit": "lbs"
  }'
```

#### Get Scan History
```bash
curl -X GET "https://services.wihy.ai/api/scan/history?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Log Progress
```bash
curl -X POST https://services.wihy.ai/api/goals/GOAL_ID/progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": 195,
    "date": "2026-01-15",
    "notes": "First week done!"
  }'
```

#### Create Reminder
```bash
curl -X POST https://services.wihy.ai/api/reminders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "water",
    "title": "Drink water",
    "message": "Time to hydrate!",
    "time": "09:00",
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "enabled": true
  }'
```

---

## Best Practices

### 1. Always Use JWT Authentication
Never expose endpoints without authentication in production.

### 2. Upload Images to Cloud Storage First
Don't send base64 images in JSON - use Google Cloud Storage URLs.

### 3. Handle Errors Gracefully
Wrap all API calls in try-catch blocks and show user-friendly messages.

### 4. Cache Aggressively
Cache goal lists, measurement history locally to reduce API calls.

### 5. Batch Requests
When possible, use endpoints that return multiple resources (e.g., goal with milestones and progress).

### 6. Use Pagination
Always specify `limit` parameter for list endpoints to avoid large responses.

### 7. Store Object Names
Keep the `image_blob_name` (GCS object path) for deletion operations.

### 8. Use Optimistic Updates
Update UI immediately, then sync with server in background.

---

## Related Documentation

- [BACKEND_SERVICES_WIHY_REQUIREMENTS.md](./BACKEND_SERVICES_WIHY_REQUIREMENTS.md) - Endpoint specifications
- [SERVICES_LAYER_ARCHITECTURE.md](./SERVICES_LAYER_ARCHITECTURE.md) - Mobile service architecture
- [BACKEND_AUTH_WIHY_REQUIREMENTS.md](./BACKEND_AUTH_WIHY_REQUIREMENTS.md) - Auth service endpoints

---

## Support

For issues or questions:
- **Email:** support@wihy.ai
- **GitHub:** [wihy_services repository]
- **Documentation:** This guide + API_SPECIFICATION.md

---

*Last Updated: January 7, 2026*
