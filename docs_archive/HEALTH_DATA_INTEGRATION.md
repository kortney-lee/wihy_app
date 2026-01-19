# Health Data Integration

This document explains how health data from Apple HealthKit and Google Fit is integrated into the WiHY Native app's dashboards.

## Overview

The health data integration provides real-time health metrics to users through:
- **OverviewDashboard**: Shows health summary with score, steps, active minutes, and heart rate
- **MyProgressDashboard**: Displays daily/weekly/monthly progress with detailed metrics

## Architecture

### Service Layer

**`src/services/healthDataService.ts`**

Provides a unified interface for accessing health data across iOS and Android platforms.

#### Current Implementation

The current implementation uses **mock data** for demonstration purposes. This is a deliberate design choice because:

1. **Native libraries require hooks**: The `@kingstinct/react-native-healthkit` and `react-native-google-fit` libraries work best with React hooks, not service classes
2. **Permission management**: Health data access requires user permissions which are better handled at the component level
3. **Real-time updates**: Health data changes frequently and benefits from reactive hook-based subscriptions

#### Key Methods

```typescript
// Initialize health service
await healthDataService.initialize();

// Get today's metrics (steps, calories, distance, active minutes, heart rate)
const metrics = await healthDataService.getTodayMetrics();

// Get weekly data with trends
const weeklyData = await healthDataService.getWeeklyData();

// Get calculated health score (0-100)
const score = await healthDataService.getHealthScore();
```

#### Data Types

```typescript
interface HealthMetrics {
  steps: number;
  distance: number; // km
  calories: number;
  activeMinutes: number;
  heartRate?: number;
  sleepHours?: number;
  weight?: number;
  hydration?: number; // liters
}

interface WeeklyHealthData {
  startDate: string;
  endDate: string;
  days: DailyHealthData[];
  averages: {
    steps: number;
    calories: number;
    activeMinutes: number;
  };
  trends: {
    steps: HealthTrend;
    calories: HealthTrend;
    activeMinutes: HealthTrend;
  };
}
```

### Dashboard Integration

#### OverviewDashboard

**Location**: `src/screens/OverviewDashboard.tsx`

Shows 4 key health metrics:
1. **Health Score** (0-100) - Calculated from steps, activity, sleep, and heart rate
2. **Daily Steps** - With trend indicator and status (good/warning/alert)
3. **Active Minutes** - Time spent in moderate-to-vigorous activity
4. **Heart Rate** - Average resting heart rate (if available)

**Features**:
- Automatic status calculation (good: green, warning: orange, alert: red)
- Trend indicators (↑ up, ↓ down, — stable)
- Loading state while fetching data
- Falls back to mock data if health APIs unavailable

**Implementation**:
```typescript
useEffect(() => {
  loadHealthData();
}, []);

const loadHealthData = async () => {
  const initialized = await healthDataService.initialize();
  const [healthScore, todayMetrics, weeklyData] = await Promise.all([
    healthDataService.getHealthScore(),
    healthDataService.getTodayMetrics(),
    healthDataService.getWeeklyData(),
  ]);
  
  // Build health summary cards with real data
  setHealthSummaryData([...]);
};
```

#### MyProgressDashboard

**Location**: `src/screens/MyProgressDashboard.tsx`

Shows period-based progress (Today/Week/Month):

**Today View**:
- Daily Steps (target: 10,000)
- Active Minutes (target: 30)
- Calories Burned (target: 500)
- Distance (target: 8 km)

**Week View**:
- Average Daily Steps
- Average Active Minutes
- Average Calories
- Total Days Active (>5,000 steps)

**Month View**:
- Total Steps (7-day rolling)
- Average Active Minutes
- Total Calories (7-day rolling)
- Active Days Count

**Features**:
- Period switcher (chevrons to navigate between views)
- Progress bars with completion percentage
- Color-coded metrics
- Loading state per period
- Automatic reload when period changes

**Implementation**:
```typescript
useEffect(() => {
  loadProgressData();
}, [selectedPeriod]);

const loadProgressData = async () => {
  if (selectedPeriod === 'today') {
    const todayMetrics = await healthDataService.getTodayMetrics();
    setProgressCards([...]);
  } else if (selectedPeriod === 'week') {
    const weeklyData = await healthDataService.getWeeklyData();
    setProgressCards([...]);
  }
};
```

## Migrating to Real Health Data

To use real Apple HealthKit and Google Fit data instead of mock data:

### 1. Install Dependencies

Already installed in the project:
```bash
npm install @kingstinct/react-native-healthkit react-native-google-fit
```

### 2. Configure Permissions

**iOS** - Update `Info.plist`:
```xml
<key>NSHealthShareUsageDescription</key>
<string>We need access to your health data to track your fitness progress</string>
<key>NSHealthUpdateUsageDescription</key>
<string>We need access to update your health data</string>
```

**Android** - Update `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION"/>
```

### 3. Add Permission Requests

Update `src/screens/PermissionsScreen.tsx` to request health permissions:

```typescript
import HealthKit, { QuantityTypeIdentifier } from '@kingstinct/react-native-healthkit';

const requestHealthPermissions = async () => {
  if (Platform.OS === 'ios') {
    await HealthKit.requestAuthorization([
      QuantityTypeIdentifier.stepCount,
      QuantityTypeIdentifier.distanceWalkingRunning,
      QuantityTypeIdentifier.activeEnergyBurned,
      QuantityTypeIdentifier.heartRate,
    ]);
  }
};
```

### 4. Use Hooks in Components

Replace service calls with hooks from `@kingstinct/react-native-healthkit`:

```typescript
import { useStatisticsForQuantity } from '@kingstinct/react-native-healthkit';

function HealthDashboard() {
  const steps = useStatisticsForQuantity(
    QuantityTypeIdentifier.stepCount,
    ['cumulativeSum'],
    new Date(new Date().setHours(0, 0, 0, 0)),
    new Date()
  );
  
  const stepCount = steps?.sumQuantity || 0;
  
  return <Text>Steps: {stepCount}</Text>;
}
```

### 5. Implement Caching

Add AsyncStorage caching to reduce battery usage:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const cacheKey = `health_data_${date}`;
const cached = await AsyncStorage.getItem(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// Fetch from health APIs
const data = await fetchHealthData();
await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
```

## Health Score Calculation

The health score (0-100) is calculated from:

1. **Steps** (25% weight): `(steps / 10000) * 100`
2. **Active Minutes** (25% weight): `(activeMinutes / 30) * 100`
3. **Sleep** (25% weight): `(sleepHours / 8) * 100`
4. **Heart Rate** (25% weight): 
   - 100 if 60-100 bpm
   - Reduced score if outside range

Final score = Average of all available metrics

## Status Thresholds

### Steps
- **Good** (green): ≥8,000 steps
- **Warning** (orange): 5,000-7,999 steps
- **Alert** (red): <5,000 steps

### Active Minutes
- **Good** (green): ≥30 minutes
- **Warning** (orange): <30 minutes

### Heart Rate
- **Good** (green): 60-100 bpm
- **Warning** (orange): 40-59 or 101-120 bpm
- **Alert** (red): <40 or >120 bpm

### Health Score
- **Good** (green): ≥75
- **Warning** (orange): 60-74
- **Alert** (red): <60

## Trend Calculation

Trends compare the first half vs second half of the data period:

```typescript
const change = ((current - previous) / previous) * 100;

trend = change > 5 ? 'up' :
        change < -5 ? 'down' :
        'stable';
```

## Testing

### Mock Data
The current implementation provides realistic mock data:
- Steps: 8,000-10,000/day with day-of-week variation
- Calories: 400-550/day
- Active Minutes: 25-45/day
- Heart Rate: 65-85 bpm
- Progress scales with time of day for "today" view

### Real Device Testing
To test with real health data:
1. Run on physical iOS device (HealthKit doesn't work in simulator)
2. Or run on Android device with Google Fit app installed
3. Grant health permissions when prompted
4. Walk around to generate step data
5. Check dashboards update with real metrics

## Known Limitations

1. **Mock Data**: Current implementation uses simulated data
2. **Sleep Data**: Not yet implemented (requires sleep analysis queries)
3. **Hydration**: Manual tracking only (not from health APIs)
4. **Nutrition**: Manual tracking only (not from health APIs)
5. **Historical Data**: Limited to 7 days (can be extended)

## Future Enhancements

- [ ] Real-time health data sync using hooks
- [ ] Background refresh of health metrics
- [ ] Sleep analysis integration
- [ ] Heart rate variability (HRV) tracking
- [ ] Workout session details
- [ ] Custom goal setting per metric
- [ ] Export health data to PDF/CSV
- [ ] Share progress with coach
- [ ] Integration with wearables (Apple Watch, Fitbit)
- [ ] Nutrition tracking from food databases

## References

- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [Google Fit API](https://developers.google.com/fit)
- [@kingstinct/react-native-healthkit](https://github.com/Kingstinct/react-native-healthkit)
- [react-native-google-fit](https://github.com/StasDoskalenko/react-native-google-fit)
- [HEALTH_API_EXAMPLES.md](../HEALTH_API_EXAMPLES.md) - Detailed API response examples
