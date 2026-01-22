# Backend Health Data Sync API Requirements

**Service:** `user.wihy.ai` (User Service)  
**Priority:** High  
**Requested:** 2026-01-22  
**Status:** 📋 Specification

---

## Overview

Mobile apps (iOS/Android) can access device health data from Apple HealthKit and Google Health Connect. This data needs to be synced to the backend so it can be:

1. **Displayed on web dashboard** - Users can view their health metrics from any device
2. **Used by coaches** - Coaches can monitor client health progress
3. **Used for AI personalization** - ML service can use health data for personalized recommendations
4. **Historical tracking** - Store time-series data for trend analysis

---

## Database Schema

### Option A: New `health_metrics` Table (Recommended)

```sql
CREATE TABLE health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Source tracking
    source VARCHAR(50) NOT NULL, -- 'apple_healthkit', 'google_health_connect', 'manual'
    device_type VARCHAR(50),     -- 'iphone', 'android', 'apple_watch', etc.
    
    -- Timestamp (when the data was recorded on device)
    recorded_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Activity Metrics
    steps INTEGER,
    distance_meters DECIMAL(10,2),
    floors_climbed INTEGER,
    active_minutes INTEGER,
    active_calories INTEGER,
    total_calories INTEGER,
    
    -- Exercise
    workouts_completed INTEGER,
    exercise_minutes INTEGER,
    stand_hours INTEGER, -- Apple only
    
    -- Heart & Vitals
    heart_rate_avg INTEGER,
    heart_rate_min INTEGER,
    heart_rate_max INTEGER,
    heart_rate_resting INTEGER,
    heart_rate_variability DECIMAL(5,2), -- HRV in ms
    blood_oxygen_percent DECIMAL(5,2),   -- SpO2
    respiratory_rate DECIMAL(5,2),       -- breaths per minute
    
    -- Body Measurements
    weight_kg DECIMAL(5,2),
    body_fat_percent DECIMAL(5,2),
    bmi DECIMAL(4,2),
    lean_body_mass_kg DECIMAL(5,2),
    
    -- Sleep
    sleep_hours DECIMAL(4,2),
    sleep_deep_hours DECIMAL(4,2),
    sleep_rem_hours DECIMAL(4,2),
    sleep_light_hours DECIMAL(4,2),
    sleep_awake_minutes INTEGER,
    sleep_quality_score INTEGER, -- 0-100
    
    -- Nutrition (from device tracking)
    water_ml INTEGER,
    caffeine_mg INTEGER,
    
    -- Mindfulness
    mindful_minutes INTEGER,
    
    -- Calculated Scores
    health_score INTEGER, -- 0-100, calculated on client
    activity_score INTEGER, -- 0-100
    
    -- Metadata
    timezone VARCHAR(50),
    raw_data JSONB, -- Store complete response for future use
    
    -- Constraints
    UNIQUE(user_id, recorded_at, source),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_health_metrics_user_date ON health_metrics(user_id, recorded_at DESC);
CREATE INDEX idx_health_metrics_source ON health_metrics(source);
CREATE INDEX idx_health_metrics_synced ON health_metrics(synced_at DESC);
```

### Option B: Add to Existing `user_profiles` Table

If you prefer to keep it simple, add a `health_data` JSONB column to user_profiles:

```sql
ALTER TABLE user_profiles 
ADD COLUMN health_data JSONB DEFAULT '{}',
ADD COLUMN health_data_updated_at TIMESTAMPTZ;
```

**Recommendation:** Option A is better for time-series data and historical tracking.

---

## API Endpoints

### 1. Sync Health Data (Mobile → Backend)

**Endpoint:** `POST /api/users/me/health-data`  
**Auth:** JWT Bearer token  
**Purpose:** Mobile app syncs health data from HealthKit/Google Fit

**Request:**
```json
{
  "source": "apple_healthkit",
  "deviceType": "iphone",
  "timezone": "America/New_York",
  "recordedAt": "2026-01-22T00:00:00Z",
  "metrics": {
    "steps": 8432,
    "distanceMeters": 6540.5,
    "floorsClimbed": 12,
    "activeMinutes": 45,
    "activeCalories": 320,
    "totalCalories": 2150,
    
    "workoutsCompleted": 1,
    "exerciseMinutes": 30,
    "standHours": 10,
    
    "heartRateAvg": 72,
    "heartRateMin": 58,
    "heartRateMax": 145,
    "heartRateResting": 62,
    "heartRateVariability": 45.2,
    "bloodOxygenPercent": 98.5,
    "respiratoryRate": 14.5,
    
    "weightKg": 75.5,
    "bodyFatPercent": 18.5,
    "bmi": 24.2,
    
    "sleepHours": 7.5,
    "sleepDeepHours": 1.8,
    "sleepRemHours": 2.1,
    "sleepLightHours": 3.2,
    "sleepAwakeMinutes": 24,
    "sleepQualityScore": 82,
    
    "waterMl": 2400,
    "caffeineMg": 200,
    
    "mindfulMinutes": 15,
    
    "healthScore": 78,
    "activityScore": 85
  },
  "rawData": { /* optional: full HealthKit response */ }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Health data synced successfully",
  "data": {
    "id": "uuid",
    "recordedAt": "2026-01-22T00:00:00Z",
    "syncedAt": "2026-01-22T15:30:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid metrics format",
  "details": ["steps must be a positive integer"]
}
```

---

### 2. Batch Sync Health Data (Multiple Days)

**Endpoint:** `POST /api/users/me/health-data/batch`  
**Auth:** JWT Bearer token  
**Purpose:** Sync multiple days of data at once (initial sync or catch-up)

**Request:**
```json
{
  "source": "apple_healthkit",
  "deviceType": "iphone",
  "timezone": "America/New_York",
  "records": [
    {
      "recordedAt": "2026-01-20T00:00:00Z",
      "metrics": { "steps": 9200, "activeMinutes": 52, ... }
    },
    {
      "recordedAt": "2026-01-21T00:00:00Z",
      "metrics": { "steps": 7800, "activeMinutes": 38, ... }
    },
    {
      "recordedAt": "2026-01-22T00:00:00Z",
      "metrics": { "steps": 8432, "activeMinutes": 45, ... }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Synced 3 records",
  "data": {
    "synced": 3,
    "skipped": 0,
    "errors": []
  }
}
```

---

### 3. Get Health Data (Web/Dashboard)

**Endpoint:** `GET /api/users/me/health-data`  
**Auth:** JWT Bearer token  
**Purpose:** Web dashboard fetches user's synced health data

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `startDate` | ISO date | 7 days ago | Start of date range |
| `endDate` | ISO date | today | End of date range |
| `granularity` | string | `daily` | `daily`, `weekly`, `monthly` |
| `metrics` | string[] | all | Specific metrics to return |

**Example:** `GET /api/users/me/health-data?startDate=2026-01-15&endDate=2026-01-22&granularity=daily`

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "dateRange": {
      "start": "2026-01-15",
      "end": "2026-01-22"
    },
    "latestSync": "2026-01-22T15:30:00Z",
    "source": "apple_healthkit",
    "records": [
      {
        "date": "2026-01-22",
        "steps": 8432,
        "distanceMeters": 6540.5,
        "activeMinutes": 45,
        "activeCalories": 320,
        "heartRateAvg": 72,
        "heartRateResting": 62,
        "sleepHours": 7.5,
        "sleepQualityScore": 82,
        "healthScore": 78
      },
      {
        "date": "2026-01-21",
        "steps": 7800,
        "distanceMeters": 5890.2,
        "activeMinutes": 38,
        ...
      }
    ],
    "summary": {
      "avgSteps": 8116,
      "avgActiveMinutes": 41,
      "avgSleepHours": 7.2,
      "avgHealthScore": 75,
      "totalActiveCalories": 2240,
      "trend": {
        "steps": "up",      // +5% or more
        "activity": "stable", // within ±5%
        "sleep": "down"      // -5% or more
      }
    }
  }
}
```

---

### 4. Get Health Data for Family Member (Coach/Guardian)

**Endpoint:** `GET /api/users/:userId/health-data`  
**Auth:** JWT Bearer token + family/coach permission check  
**Purpose:** Coaches and guardians can view family member health data

**Same query params and response as endpoint #3**

**Permission Check:**
- User must be coach of target user, OR
- User must be guardian of target user (family member)
- Otherwise return 403 Forbidden

---

### 5. Get Latest Health Summary

**Endpoint:** `GET /api/users/me/health-data/latest`  
**Auth:** JWT Bearer token  
**Purpose:** Quick endpoint for dashboard widgets

**Response:**
```json
{
  "success": true,
  "data": {
    "lastSync": "2026-01-22T15:30:00Z",
    "source": "apple_healthkit",
    "today": {
      "steps": 8432,
      "stepsGoal": 10000,
      "stepsPercent": 84,
      "activeMinutes": 45,
      "activeMinutesGoal": 30,
      "activeMinutesPercent": 150,
      "calories": 320,
      "heartRate": 72,
      "healthScore": 78
    },
    "streaks": {
      "stepsGoal": 5,      // Days in a row hitting step goal
      "activityGoal": 12,  // Days in a row hitting activity goal
      "sleepGoal": 3       // Days in a row hitting sleep goal
    }
  }
}
```

---

### 6. Delete Health Data

**Endpoint:** `DELETE /api/users/me/health-data`  
**Auth:** JWT Bearer token  
**Purpose:** GDPR compliance - user can delete their health data

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | ISO date | No | Delete from this date |
| `endDate` | ISO date | No | Delete until this date |
| `all` | boolean | No | Delete ALL health data |

**Example:** `DELETE /api/users/me/health-data?all=true`

**Response:**
```json
{
  "success": true,
  "message": "Deleted 365 health records",
  "data": {
    "deletedCount": 365
  }
}
```

---

## Available Metrics from Mobile SDKs

### Apple HealthKit (iOS)

| Metric | HealthKit Identifier | Unit |
|--------|---------------------|------|
| Steps | `HKQuantityTypeIdentifierStepCount` | count |
| Distance | `HKQuantityTypeIdentifierDistanceWalkingRunning` | meters |
| Floors Climbed | `HKQuantityTypeIdentifierFlightsClimbed` | count |
| Active Energy | `HKQuantityTypeIdentifierActiveEnergyBurned` | kcal |
| Basal Energy | `HKQuantityTypeIdentifierBasalEnergyBurned` | kcal |
| Exercise Time | `HKQuantityTypeIdentifierAppleExerciseTime` | minutes |
| Stand Hours | `HKQuantityTypeIdentifierAppleStandTime` | hours |
| Heart Rate | `HKQuantityTypeIdentifierHeartRate` | bpm |
| Resting HR | `HKQuantityTypeIdentifierRestingHeartRate` | bpm |
| HRV | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | ms |
| Blood Oxygen | `HKQuantityTypeIdentifierOxygenSaturation` | % |
| Respiratory Rate | `HKQuantityTypeIdentifierRespiratoryRate` | breaths/min |
| Weight | `HKQuantityTypeIdentifierBodyMass` | kg |
| Body Fat | `HKQuantityTypeIdentifierBodyFatPercentage` | % |
| BMI | `HKQuantityTypeIdentifierBodyMassIndex` | - |
| Sleep Analysis | `HKCategoryTypeIdentifierSleepAnalysis` | hours |
| Water | `HKQuantityTypeIdentifierDietaryWater` | ml |
| Caffeine | `HKQuantityTypeIdentifierDietaryCaffeine` | mg |
| Mindful Minutes | `HKCategoryTypeIdentifierMindfulSession` | minutes |
| Workouts | `HKWorkoutType` | count |

### Google Health Connect (Android)

| Metric | Health Connect Type | Unit |
|--------|---------------------|------|
| Steps | `StepsRecord` | count |
| Distance | `DistanceRecord` | meters |
| Floors | `FloorsClimbedRecord` | count |
| Active Calories | `ActiveCaloriesBurnedRecord` | kcal |
| Total Calories | `TotalCaloriesBurnedRecord` | kcal |
| Exercise Session | `ExerciseSessionRecord` | minutes |
| Heart Rate | `HeartRateRecord` | bpm |
| Resting HR | `RestingHeartRateRecord` | bpm |
| HRV | `HeartRateVariabilityRmssdRecord` | ms |
| Blood Oxygen | `OxygenSaturationRecord` | % |
| Respiratory Rate | `RespiratoryRateRecord` | breaths/min |
| Weight | `WeightRecord` | kg |
| Body Fat | `BodyFatRecord` | % |
| Sleep Session | `SleepSessionRecord` | hours |
| Hydration | `HydrationRecord` | ml |

---

## Sync Strategy

### When to Sync

1. **App foreground** - Sync when app comes to foreground
2. **Manual pull-to-refresh** - User triggers sync
3. **Background refresh** (iOS) - Every 15-30 minutes if enabled
4. **After workout** - Sync immediately when workout completes

### Sync Logic (Mobile Client)

```typescript
async function syncHealthData() {
  // 1. Get last sync timestamp from storage
  const lastSync = await AsyncStorage.getItem('lastHealthSync');
  
  // 2. Fetch data from HealthKit/Google Fit since last sync
  const startDate = lastSync ? new Date(lastSync) : subDays(new Date(), 7);
  const endDate = new Date();
  
  // 3. Aggregate daily metrics
  const dailyMetrics = await aggregateDailyMetrics(startDate, endDate);
  
  // 4. POST to backend
  const response = await fetch('https://user.wihy.ai/api/users/me/health-data/batch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: Platform.OS === 'ios' ? 'apple_healthkit' : 'google_health_connect',
      deviceType: Platform.OS,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      records: dailyMetrics
    })
  });
  
  // 5. Update last sync timestamp
  if (response.ok) {
    await AsyncStorage.setItem('lastHealthSync', endDate.toISOString());
  }
}
```

---

## Privacy & Compliance

### HIPAA Considerations

1. **Encryption at rest** - Health data must be encrypted in database
2. **Encryption in transit** - HTTPS only, TLS 1.3
3. **Access logging** - Log all access to health data
4. **Minimum necessary** - Only sync data user has permitted
5. **Right to delete** - Implement DELETE endpoint

### User Consent

Mobile app must:
1. Request health data permissions explicitly
2. Explain why data is being collected
3. Allow user to revoke sync at any time
4. Provide data export functionality

### Data Retention

- Default: Keep 2 years of health data
- User can request deletion at any time
- Coach access expires when coaching relationship ends

---

## Implementation Checklist

### Backend (user.wihy.ai)

- [ ] Create `health_metrics` table with migration
- [ ] Implement `POST /api/users/me/health-data` endpoint
- [ ] Implement `POST /api/users/me/health-data/batch` endpoint
- [ ] Implement `GET /api/users/me/health-data` endpoint
- [ ] Implement `GET /api/users/:userId/health-data` with permission check
- [ ] Implement `GET /api/users/me/health-data/latest` endpoint
- [ ] Implement `DELETE /api/users/me/health-data` endpoint
- [ ] Add indexes for performance
- [ ] Add rate limiting (max 100 syncs/hour per user)
- [ ] Add request validation with Zod/Joi
- [ ] Add audit logging for health data access
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update API documentation

### Mobile (this repo)

- [ ] Create `healthSyncService.ts` 
- [ ] Implement sync logic with deduplication
- [ ] Add background sync (iOS Background App Refresh)
- [ ] Add sync status indicator in UI
- [ ] Handle sync errors gracefully
- [ ] Add manual sync button
- [ ] Store last sync timestamp
- [ ] Test on real devices

### Web Dashboard

- [ ] Create health data visualization components
- [ ] Add health metrics to user dashboard
- [ ] Add date range picker for historical data
- [ ] Add export to CSV/PDF
- [ ] Coach view for client health data

---

## Questions for Backend Team

1. **Storage preference:** New table vs JSONB column?
2. **Aggregation:** Should backend aggregate hourly→daily, or receive pre-aggregated?
3. **Real-time:** WebSocket for live updates, or polling?
4. **Rate limits:** What's reasonable for sync frequency?
5. **Retention:** How long to keep historical data?

---

## Contact

- **Frontend:** @kortney-lee
- **Backend:** TBD
- **Last Updated:** 2026-01-22
