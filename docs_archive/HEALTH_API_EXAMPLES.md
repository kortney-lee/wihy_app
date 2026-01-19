# Health API Data Examples

This document shows the actual data structures returned from Apple HealthKit and Google Fit APIs.

## Apple HealthKit API Response Examples

### Available Data Types
Apple HealthKit provides access to numerous health data types through `HKQuantityTypeIdentifier`:

```typescript
// Activity & Fitness
- stepCount
- distanceWalkingRunning
- distanceCycling
- activeEnergyBurned
- basalEnergyBurned
- flightsClimbed
- appleExerciseTime
- appleStandTime
- pushCount
- swimmingStrokeCount
- distanceSwimming
- distanceWheelchair

// Body Measurements
- height
- bodyMass (weight)
- bodyMassIndex
- bodyFatPercentage
- leanBodyMass
- waistCircumference

// Vital Signs
- heartRate
- restingHeartRate
- heartRateVariability
- oxygenSaturation
- bodyTemperature
- bloodPressureSystolic
- bloodPressureDiastolic
- respiratoryRate

// Nutrition
- dietaryEnergyConsumed
- dietaryProtein
- dietaryCarbohydrates
- dietaryFiber
- dietarySugar
- dietaryFatTotal
- dietaryFatSaturated
- dietaryCholesterol
- dietarySodium
- dietaryPotassium
- dietaryCalcium
- dietaryIron
- dietaryVitaminA
- dietaryVitaminC
- dietaryVitaminD
- dietaryWater

// Sleep
- sleepAnalysis

// Reproductive Health
- basalBodyTemperature
- cervicalMucusQuality
- menstrualFlow
- ovulationTestResult
- sexualActivity

// Lab Results
- bloodGlucose
- insulinDelivery
```

### Step Count Query Response

```typescript
// Request
const steps = await HealthKit.querySamples(
  HKQuantityTypeIdentifier.stepCount,
  {
    from: new Date('2026-01-01'),
    to: new Date('2026-01-07'),
  }
);

// Response
[
  {
    uuid: "A3B7C9D1-E5F6-4G8H-9I0J-1K2L3M4N5O6P",
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-01-01T23:59:59.999Z",
    quantity: 8432,
    unit: "count",
    metadata: {
      HKMetadataKeyWasUserEntered: false,
      HKWasUserEntered: "0",
    },
    device: {
      name: "iPhone",
      manufacturer: "Apple Inc.",
      model: "iPhone 15 Pro",
      hardwareVersion: "iPhone15,2",
      softwareVersion: "17.2",
    },
    sourceRevision: {
      source: {
        name: "Health",
        bundleIdentifier: "com.apple.Health",
      },
      version: "17.2",
    },
  },
  {
    uuid: "B4C8D0E2-F6G7-5H9I-0J1K-2L3M4N5O6P7Q",
    startDate: "2026-01-02T00:00:00.000Z",
    endDate: "2026-01-02T23:59:59.999Z",
    quantity: 12543,
    unit: "count",
    metadata: {
      HKMetadataKeyWasUserEntered: false,
    },
    device: {
      name: "Apple Watch",
      manufacturer: "Apple Inc.",
      model: "Watch",
      hardwareVersion: "Watch6,4",
      softwareVersion: "10.2",
    },
  },
  // ... more daily samples
]
```

### Heart Rate Query Response

```typescript
// Request
const heartRate = await HealthKit.querySamples(
  HKQuantityTypeIdentifier.heartRate,
  {
    from: new Date('2026-01-01T08:00:00'),
    to: new Date('2026-01-01T09:00:00'),
  }
);

// Response
[
  {
    uuid: "C5D9E1F3-G7H8-6I0J-1K2L-3M4N5O6P7Q8R",
    startDate: "2026-01-01T08:00:23.456Z",
    endDate: "2026-01-01T08:00:23.456Z",
    quantity: 72,
    unit: "count/min",
    metadata: {
      HKMetadataKeyHeartRateMotionContext: 1, // 0=sedentary, 1=active, 2=not set
    },
    device: {
      name: "Apple Watch",
      manufacturer: "Apple Inc.",
      model: "Watch",
      hardwareVersion: "Watch6,4",
      softwareVersion: "10.2",
    },
  },
  {
    uuid: "D6E0F2G4-H8I9-7J1K-2L3M-4N5O6P7Q8R9S",
    startDate: "2026-01-01T08:15:11.234Z",
    endDate: "2026-01-01T08:15:11.234Z",
    quantity: 68,
    unit: "count/min",
    metadata: {
      HKMetadataKeyHeartRateMotionContext: 0,
    },
  },
  // ... more samples (Apple Watch records every 5-10 minutes when worn)
]
```

### Sleep Analysis Response

```typescript
// Request
const sleep = await HealthKit.querySamples(
  HKCategoryTypeIdentifier.sleepAnalysis,
  {
    from: new Date('2026-01-01'),
    to: new Date('2026-01-02'),
  }
);

// Response
[
  {
    uuid: "E7F1G3H5-I9J0-8K2L-3M4N-5O6P7Q8R9S0T",
    startDate: "2026-01-01T22:30:00.000Z",
    endDate: "2026-01-01T23:15:00.000Z",
    value: 0, // HKCategoryValueSleepAnalysis: 0=inBed, 1=asleep, 2=awake
    metadata: {
      HKMetadataKeyWasUserEntered: false,
    },
    device: {
      name: "Apple Watch",
      manufacturer: "Apple Inc.",
    },
  },
  {
    uuid: "F8G2H4I6-J0K1-9L3M-4N5O-6P7Q8R9S0T1U",
    startDate: "2026-01-01T23:15:00.000Z",
    endDate: "2026-01-02T06:45:00.000Z",
    value: 1, // asleep
    metadata: {
      HKMetadataKeyWasUserEntered: false,
    },
  },
]
```

### Nutrition Data Response

```typescript
// Request
const calories = await HealthKit.querySamples(
  HKQuantityTypeIdentifier.dietaryEnergyConsumed,
  {
    from: new Date('2026-01-01'),
    to: new Date('2026-01-02'),
  }
);

// Response
[
  {
    uuid: "G9H3I5J7-K1L2-0M4N-5O6P-7Q8R9S0T1U2V",
    startDate: "2026-01-01T07:30:00.000Z",
    endDate: "2026-01-01T07:30:00.000Z",
    quantity: 420,
    unit: "kcal",
    metadata: {
      HKMetadataKeyWasUserEntered: true,
      HKFoodType: "Breakfast - Oatmeal with berries",
    },
    sourceRevision: {
      source: {
        name: "MyFitnessPal",
        bundleIdentifier: "com.myfitnesspal.app",
      },
    },
  },
  {
    uuid: "H0I4J6K8-L2M3-1N5O-6P7Q-8R9S0T1U2V3W",
    startDate: "2026-01-01T12:00:00.000Z",
    endDate: "2026-01-01T12:00:00.000Z",
    quantity: 650,
    unit: "kcal",
    metadata: {
      HKMetadataKeyWasUserEntered: true,
      HKFoodType: "Lunch - Grilled chicken salad",
    },
  },
]
```

### Body Measurements Response

```typescript
// Request
const weight = await HealthKit.querySamples(
  HKQuantityTypeIdentifier.bodyMass,
  {
    from: new Date('2025-12-01'),
    to: new Date('2026-01-01'),
  }
);

// Response
[
  {
    uuid: "I1J5K7L9-M3N4-2O6P-7Q8R-9S0T1U2V3W4X",
    startDate: "2025-12-01T08:00:00.000Z",
    endDate: "2025-12-01T08:00:00.000Z",
    quantity: 75.3,
    unit: "kg",
    metadata: {
      HKMetadataKeyWasUserEntered: true,
    },
    device: {
      name: "Withings Scale",
      manufacturer: "Withings",
      model: "Body+",
    },
  },
  {
    uuid: "J2K6L8M0-N4O5-3P7Q-8R9S-0T1U2V3W4X5Y",
    startDate: "2025-12-15T08:00:00.000Z",
    endDate: "2025-12-15T08:00:00.000Z",
    quantity: 74.8,
    unit: "kg",
    metadata: {
      HKMetadataKeyWasUserEntered: true,
    },
  },
]
```

### Statistics Query (Aggregated Data)

```typescript
// Request - Get daily step count statistics
const stats = await HealthKit.queryStatistics(
  HKQuantityTypeIdentifier.stepCount,
  {
    from: new Date('2026-01-01'),
    to: new Date('2026-01-07'),
    interval: 'day',
  }
);

// Response
{
  averageQuantity: 9876,
  minimumQuantity: 5432,
  maximumQuantity: 14321,
  sumQuantity: 69132,
  mostRecentQuantity: 11234,
  mostRecentDate: "2026-01-07T23:59:59.999Z",
  duration: 604800, // seconds (7 days)
}
```

---

## Google Fit API Response Examples

### Available Data Types

```typescript
// Activity
Scopes.FITNESS_ACTIVITY_READ
Scopes.FITNESS_ACTIVITY_WRITE
- com.google.step_count.delta
- com.google.distance.delta
- com.google.calories.expended
- com.google.active_minutes
- com.google.activity.segment

// Body
Scopes.FITNESS_BODY_READ
Scopes.FITNESS_BODY_WRITE
- com.google.weight
- com.google.height
- com.google.body.fat.percentage
- com.google.body.temperature

// Nutrition
Scopes.FITNESS_NUTRITION_READ
Scopes.FITNESS_NUTRITION_WRITE
- com.google.calories.consumed
- com.google.nutrition
- com.google.hydration

// Sleep
Scopes.FITNESS_SLEEP_READ
Scopes.FITNESS_SLEEP_WRITE
- com.google.sleep.segment

// Location
Scopes.FITNESS_LOCATION_READ
Scopes.FITNESS_LOCATION_WRITE
- com.google.location.sample

// Heart Rate
Scopes.FITNESS_HEART_RATE_READ
- com.google.heart_rate.bpm

// Blood Pressure
Scopes.FITNESS_BLOOD_PRESSURE_READ
- com.google.blood_pressure

// Blood Glucose
Scopes.FITNESS_BLOOD_GLUCOSE_READ
- com.google.blood_glucose

// Oxygen Saturation
Scopes.FITNESS_OXYGEN_SATURATION_READ
- com.google.oxygen_saturation
```

### Daily Steps Response

```typescript
// Request
const steps = await GoogleFit.getDailySteps({
  startDate: new Date('2026-01-01').toISOString(),
  endDate: new Date('2026-01-07').toISOString(),
});

// Response
[
  {
    source: "com.google.android.gms:estimated_steps",
    steps: [
      {
        date: "2026-01-01",
        value: 8432,
      },
      {
        date: "2026-01-02",
        value: 12543,
      },
      {
        date: "2026-01-03",
        value: 9876,
      },
      {
        date: "2026-01-04",
        value: 7234,
      },
      {
        date: "2026-01-05",
        value: 11098,
      },
      {
        date: "2026-01-06",
        value: 10321,
      },
      {
        date: "2026-01-07",
        value: 9628,
      },
    ],
  },
  {
    source: "com.xiaomi.hm.health", // Data from Mi Fit app
    steps: [
      {
        date: "2026-01-01",
        value: 8450,
      },
      // ... more daily steps
    ],
  },
]
```

### Activity Samples (Detailed Data Points)

```typescript
// Request
const activities = await GoogleFit.getActivitySamples({
  startDate: new Date('2026-01-01T00:00:00').toISOString(),
  endDate: new Date('2026-01-01T23:59:59').toISOString(),
});

// Response
{
  activities: [
    {
      activityName: "walking",
      start: "2026-01-01T08:00:00.000Z",
      end: "2026-01-01T08:30:00.000Z",
      calories: 120,
      distance: 2.4, // km
      steps: 3200,
      device: "Xiaomi Mi Band 6",
      sourceName: "com.xiaomi.hm.health",
    },
    {
      activityName: "running",
      start: "2026-01-01T17:00:00.000Z",
      end: "2026-01-01T17:45:00.000Z",
      calories: 380,
      distance: 6.5, // km
      steps: 8500,
      device: "Phone GPS",
      sourceName: "com.google.android.gms:merge_step_deltas",
    },
    {
      activityName: "cycling",
      start: "2026-01-01T10:00:00.000Z",
      end: "2026-01-01T11:15:00.000Z",
      calories: 450,
      distance: 15.2, // km
      device: "Strava",
      sourceName: "com.strava",
    },
  ],
}
```

### Heart Rate Samples

```typescript
// Request
const heartRate = await GoogleFit.getHeartRateSamples({
  startDate: new Date('2026-01-01T08:00:00').toISOString(),
  endDate: new Date('2026-01-01T09:00:00').toISOString(),
});

// Response
{
  heartRateSamples: [
    {
      value: 72,
      startDate: "2026-01-01T08:00:00.000Z",
      endDate: "2026-01-01T08:00:00.000Z",
      device: "Wear OS Watch",
      sourceName: "com.google.android.apps.fitness",
    },
    {
      value: 68,
      startDate: "2026-01-01T08:15:00.000Z",
      endDate: "2026-01-01T08:15:00.000Z",
      device: "Wear OS Watch",
      sourceName: "com.google.android.apps.fitness",
    },
    {
      value: 75,
      startDate: "2026-01-01T08:30:00.000Z",
      endDate: "2026-01-01T08:30:00.000Z",
      device: "Wear OS Watch",
      sourceName: "com.google.android.apps.fitness",
    },
    // ... more samples
  ],
}
```

### Sleep Sessions

```typescript
// Request
const sleep = await GoogleFit.getSleepSamples({
  startDate: new Date('2026-01-01').toISOString(),
  endDate: new Date('2026-01-02').toISOString(),
});

// Response
{
  sleep: [
    {
      startDate: "2026-01-01T22:30:00.000Z",
      endDate: "2026-01-02T06:45:00.000Z",
      sleepStages: [
        {
          stage: 1, // 1=awake, 2=light, 3=deep, 4=REM
          startDate: "2026-01-01T22:30:00.000Z",
          endDate: "2026-01-01T23:00:00.000Z",
        },
        {
          stage: 2, // light sleep
          startDate: "2026-01-01T23:00:00.000Z",
          endDate: "2026-01-02T00:30:00.000Z",
        },
        {
          stage: 3, // deep sleep
          startDate: "2026-01-02T00:30:00.000Z",
          endDate: "2026-01-02T02:00:00.000Z",
        },
        {
          stage: 4, // REM
          startDate: "2026-01-02T02:00:00.000Z",
          endDate: "2026-01-02T03:30:00.000Z",
        },
        {
          stage: 2, // light sleep
          startDate: "2026-01-02T03:30:00.000Z",
          endDate: "2026-01-02T06:30:00.000Z",
        },
        {
          stage: 1, // awake
          startDate: "2026-01-02T06:30:00.000Z",
          endDate: "2026-01-02T06:45:00.000Z",
        },
      ],
      device: "Xiaomi Mi Band 6",
      sourceName: "com.xiaomi.hm.health",
    },
  ],
}
```

### Weight Samples

```typescript
// Request
const weight = await GoogleFit.getWeightSamples({
  startDate: new Date('2025-12-01').toISOString(),
  endDate: new Date('2026-01-01').toISOString(),
});

// Response
{
  weight: [
    {
      value: 75.3,
      startDate: "2025-12-01T08:00:00.000Z",
      endDate: "2025-12-01T08:00:00.000Z",
      device: "Withings Scale",
      sourceName: "com.withings.wiscale2",
    },
    {
      value: 74.8,
      startDate: "2025-12-15T08:00:00.000Z",
      endDate: "2025-12-15T08:00:00.000Z",
      device: "Withings Scale",
      sourceName: "com.withings.wiscale2",
    },
  ],
}
```

### Nutrition Data

```typescript
// Request
const nutrition = await GoogleFit.getDailyNutritionSamples({
  startDate: new Date('2026-01-01').toISOString(),
  endDate: new Date('2026-01-02').toISOString(),
});

// Response
{
  nutrients: [
    {
      date: "2026-01-01",
      nutrients: {
        calories: 2150,
        protein: 85.5, // grams
        carbs: 245.3, // grams
        fat: 72.1, // grams
        fiber: 28.4, // grams
        sugar: 45.2, // grams
        sodium: 2100, // mg
      },
      meals: [
        {
          name: "Breakfast",
          time: "2026-01-01T07:30:00.000Z",
          calories: 420,
          protein: 15.2,
          carbs: 68.5,
          fat: 12.3,
        },
        {
          name: "Lunch",
          time: "2026-01-01T12:00:00.000Z",
          calories: 650,
          protein: 32.8,
          carbs: 78.4,
          fat: 25.6,
        },
        {
          name: "Dinner",
          time: "2026-01-01T18:30:00.000Z",
          calories: 780,
          protein: 28.5,
          carbs: 82.1,
          fat: 28.9,
        },
        {
          name: "Snacks",
          time: "2026-01-01T15:00:00.000Z",
          calories: 300,
          protein: 9.0,
          carbs: 16.3,
          fat: 5.3,
        },
      ],
      sourceName: "MyFitnessPal",
    },
  ],
}
```

### Aggregated Data (Statistics)

```typescript
// Request
const aggregated = await GoogleFit.getAggregatedData({
  startDate: new Date('2026-01-01').toISOString(),
  endDate: new Date('2026-01-07').toISOString(),
  bucketSize: 1,
  bucketUnit: 'day',
  dataTypeName: 'com.google.step_count.delta',
});

// Response
{
  buckets: [
    {
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-01-01T23:59:59.999Z",
      dataset: [
        {
          dataTypeName: "com.google.step_count.delta",
          point: [
            {
              value: 8432,
              startDate: "2026-01-01T00:00:00.000Z",
              endDate: "2026-01-01T23:59:59.999Z",
            },
          ],
        },
      ],
    },
    {
      startDate: "2026-01-02T00:00:00.000Z",
      endDate: "2026-01-02T23:59:59.999Z",
      dataset: [
        {
          dataTypeName: "com.google.step_count.delta",
          point: [
            {
              value: 12543,
              startDate: "2026-01-02T00:00:00.000Z",
              endDate: "2026-01-02T23:59:59.999Z",
            },
          ],
        },
      ],
    },
    // ... more daily buckets
  ],
}
```

---

## Key Differences

### Data Structure
- **Apple HealthKit**: Returns individual samples with rich metadata including device info, source app, and UUIDs
- **Google Fit**: Returns aggregated data organized by source, often combining multiple data sources

### Permissions
- **Apple HealthKit**: Doesn't reveal if permission was granted (privacy protection)
- **Google Fit**: Returns explicit success/failure for permission requests

### Data Sources
- **Apple HealthKit**: Clearly identifies source app and device for each sample
- **Google Fit**: May merge data from multiple sources, provides source name per reading

### Time Resolution
- **Apple HealthKit**: Can have very high-frequency samples (e.g., heart rate every few minutes)
- **Google Fit**: Often provides daily aggregates, but detailed samples available via specific queries

### Units
- **Apple HealthKit**: Uses standard units (kg, count/min, kcal)
- **Google Fit**: Similar units but may require conversion in some cases

---

## Usage in WiHY App

For the health dashboard, we should:

1. **Normalize Data**: Create a unified interface that works with both APIs
2. **Handle Multiple Sources**: Google Fit often has multiple data sources - take the most accurate
3. **Aggregate Smartly**: Combine high-frequency data into meaningful daily/weekly summaries
4. **Cache Data**: Health data queries can be slow, especially for large date ranges
5. **Respect Privacy**: Only request permissions for data types we actually use

Example unified interface:

```typescript
interface HealthData {
  steps: DailyMetric[];
  heartRate: TimeSeries[];
  sleep: SleepSession[];
  weight: Measurement[];
  calories: DailyMetric[];
  activeMinutes: DailyMetric[];
}

interface DailyMetric {
  date: string;
  value: number;
  unit: string;
  source: string;
}

interface TimeSeries {
  timestamp: string;
  value: number;
  unit: string;
  context?: string; // active, resting, etc.
}

interface SleepSession {
  startDate: string;
  endDate: string;
  duration: number; // minutes
  stages?: SleepStage[];
  quality?: number; // 0-100 score
}

interface Measurement {
  date: string;
  value: number;
  unit: string;
}
```
