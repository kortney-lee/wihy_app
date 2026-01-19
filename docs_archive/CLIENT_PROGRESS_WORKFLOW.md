# Client Progress Workflow - Coach View

## Overview

This document describes the workflow for coaches to view and manage their clients' progress within the WIHY Health App. When a coach clicks on a client in the Coach Dashboard, they are navigated to a comprehensive Client Progress screen that displays detailed fitness, nutrition, and health metrics.

## User Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COACH DASHBOARD                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        Client List                                    │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  👤 John Smith                                          →      │  │   │
│  │  │     john@email.com                                              │  │   │
│  │  │     Goals: Weight Loss, Build Muscle                            │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  👤 Sarah Johnson                                       →      │  │   │
│  │  │     sarah@email.com                                             │  │   │
│  │  │     Goals: Eat Healthier                                        │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (Click on client card)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLIENT PROGRESS SCREEN                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  ← Back            John Smith                    💬 📊 🔧           │   │
│  │                   john@email.com                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [Overview] [Fitness] [Nutrition] [Body] [Notes]                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         STATS OVERVIEW                                │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │  │ Adherence   │ │ Streak      │ │ Compliance  │ │ Workouts    │    │   │
│  │  │    85%      │ │  12 days    │ │    92%      │ │    24       │    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     CURRENT PROGRAMS                                  │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  🏋️ Strength Training Program           Week 3 of 8           │  │   │
│  │  │  ████████████░░░░░░░░░░░░░░░░░░░░░░░░  37.5%                   │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  🥗 Mediterranean Diet Plan              Day 21 of 30          │  │   │
│  │  │  ██████████████████████████░░░░░░░░░░  70%                     │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      ACTION BUTTONS                                   │   │
│  │  [Assign Meal Plan]  [Assign Workout]  [Send Message]                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Navigation Structure

### Route Configuration

```typescript
// src/types/navigation.ts
export type RootStackParamList = {
  // ... other routes
  ClientProgress: { 
    clientId: string; 
    clientName?: string;
  };
};
```

### Navigation from Coach Dashboard

```typescript
// src/screens/CoachDashboard.tsx
const handleClientPress = (client: Client) => {
  navigation.navigate('ClientProgress', {
    clientId: client.id,
    clientName: client.name,
  });
};
```

## Screen Architecture

### ClientProgressScreen Component

**Location:** `src/screens/ClientProgressScreen.tsx`

**Props:**
```typescript
interface Props {
  route: {
    params: {
      clientId: string;
      clientName?: string;
    };
  };
}
```

**State:**
```typescript
interface ClientProgressData {
  client: {
    id: string;
    name: string;
    email: string;
    goals: string[];
    diet_type: string;
    avatar?: string;
    joined_date: string;
  };
  fitness: {
    current_program?: string;
    program_progress?: number;
    workouts_completed: number;
    adherence_rate: number;
    streak_days: number;
    recent_sessions: Array<{
      id: string;
      name: string;
      date: string;
      duration: number;
      calories_burned: number;
    }>;
    weekly_workouts: number[];
  };
  nutrition: {
    current_meal_plan?: string;
    meal_plan_progress?: number;
    daily_average_calories: number;
    goal_compliance_rate: number;
    macros_average: {
      protein: number;
      carbs: number;
      fat: number;
    };
    hydration_average: number;
    recent_meals: Array<{
      id: string;
      name: string;
      date: string;
      calories: number;
      meal_type: string;
    }>;
  };
  body_metrics?: {
    current_weight: number;
    goal_weight: number;
    weight_history: Array<{ date: string; value: number }>;
    body_fat_percentage?: number;
    muscle_mass?: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    earned_date: string;
    icon: string;
  }>;
  coach_notes: Array<{
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
  }>;
}
```

### Tab Structure

| Tab | Description | Data Sources |
|-----|-------------|--------------|
| **Overview** | Summary stats, current programs, recent activity | All services |
| **Fitness** | Workout history, program progress, charts | `fitnessService` |
| **Nutrition** | Meal tracking, macros, hydration | `nutritionService` |
| **Health** | Platform-specific health data (iOS/Android) | `healthDataService` |
| **Body** | Weight, measurements, body composition | `fitnessService` |
| **Notes** | Coach notes and observations | `coachService` |

## Platform-Specific Health Integration

### Overview

The Client Progress screen includes a dedicated **Health** tab that displays device health data from:
- **iOS**: Apple HealthKit (Apple Health app)
- **Android**: Health Connect (Samsung Health, Google Fit, etc.)

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PLATFORM-SPECIFIC HEALTH DATA                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────────┐ │
│  │        iOS              │    │              Android                     │ │
│  │                         │    │                                         │ │
│  │   Apple HealthKit       │    │   Health Connect (Android 14+)          │ │
│  │   ─────────────────     │    │   ───────────────────────────           │ │
│  │   • Apple Health app    │    │   • Samsung Health                      │ │
│  │   • Apple Watch data    │    │   • Google Fit                          │ │
│  │   • Steps, Heart Rate   │    │   • Fitbit                              │ │
│  │   • Sleep, Weight       │    │   • All Health Connect apps             │ │
│  │   • Active Energy       │    │                                         │ │
│  │                         │    │   Google Fit (Fallback for older)       │ │
│  │                         │    │   ─────────────────────────────         │ │
│  │                         │    │   • For Android < 14                    │ │
│  └─────────────────────────┘    └─────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### DeviceHealthData Interface

```typescript
interface DeviceHealthData {
  platform: 'ios' | 'android';
  source: string; // 'Apple Health' | 'Health Connect' | 'Google Fit'
  isAvailable: boolean;
  hasPermissions: boolean;
  todayMetrics?: HealthMetrics;
  weeklyData?: WeeklyHealthData;
  healthScore?: number;
  lastSynced?: string;
}

interface HealthMetrics {
  steps: number;
  distance: number;        // km
  calories: number;
  activeMinutes: number;
  heartRate?: number;      // bpm
  sleepHours?: number;
  weight?: number;         // kg
  hydration?: number;      // liters
}
```

### Health Tab Features

#### iOS (Apple Health)
- **Data Source**: Apple HealthKit
- **Color Theme**: Pink gradient (#ff2d55)
- **Supported Metrics**:
  - Steps, Distance, Active Calories
  - Heart Rate (from Apple Watch)
  - Sleep Analysis
  - Body Weight
  - Exercise Time

#### Android (Health Connect / Google Fit)
- **Primary**: Health Connect (Android 14+)
- **Fallback**: Google Fit (older versions)
- **Color Theme**: Blue-Green gradient (#4285F4, #34a853)
- **Supported Metrics**:
  - Steps, Distance, Calories Burned
  - Heart Rate
  - Sleep Sessions
  - Weight
  - Exercise Sessions

### Permission Handling

```typescript
// Load device health data with permission handling
const loadDeviceHealthData = useCallback(async () => {
  try {
    setHealthDataLoading(true);
    
    // Initialize health service (requests permissions if needed)
    const hasPermissions = await healthDataService.initialize();
    
    if (!hasPermissions) {
      // Show permission request UI
      setDeviceHealthData({
        platform: Platform.OS,
        source: Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect',
        isAvailable: true,
        hasPermissions: false,
      });
      return;
    }
    
    // Fetch health data
    const [todayMetrics, weeklyData, healthScore] = await Promise.all([
      healthDataService.getTodayMetrics(),
      healthDataService.getWeeklyData(),
      healthDataService.getHealthScore(),
    ]);
    
    setDeviceHealthData({
      platform,
      source,
      isAvailable: true,
      hasPermissions: true,
      todayMetrics,
      weeklyData,
      healthScore,
      lastSynced: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error loading device health data:', err);
  } finally {
    setHealthDataLoading(false);
  }
}, []);
```

### Health Tab UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HEALTH TAB (iOS Example)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 🍎 Apple Health                                        Health Score   │  │
│  │ Last synced: 2:45 PM                                      [  85  ]   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  TODAY'S ACTIVITY                                                           │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │ 🚶 Steps      │ │ 📍 Distance   │ │ 🔥 Calories   │ │ ⏱️ Active     │   │
│  │    8,234      │ │   5.2 km      │ │    1,847      │ │   45 min      │   │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │
│                                                                              │
│  VITALS                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ ❤️ Heart Rate        │ 🌙 Sleep        │ ⚖️ Weight    │ 💧 Hydration │  │
│  │    72 bpm            │   7.5 hrs       │   70.5 kg    │   2.1 L      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  WEEKLY SUMMARY                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Avg Steps: 7,823  │  Avg Calories: 1,950  │  Avg Active: 42 min       │  │
│  │ ────────────────────────────────────────────────────────────────────  │  │
│  │ 📈 +12% steps this week  │  📉 -5% calories                           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│                      [🔄 Refresh Health Data]                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## API Integration

### Services Used

1. **coachService** - Core client management
   - `getClientDashboard(coachId, clientId)` - Basic dashboard data
   - `getClientMealPrograms(coachId, clientId)` - Assigned meal programs
   - `getClientWorkoutPrograms(coachId, clientId)` - Assigned workout programs
   - `assignMealProgram()` - Assign new meal plan
   - `createWorkoutPlanForClient()` - Create custom workout

2. **fitnessService** - Fitness data
   - `getWorkoutHistory(userId)` - Workout sessions
   - `getProgressMetrics(userId)` - Progress tracking
   - `getUserMetrics(userId)` - Body measurements

3. **nutritionService** - Nutrition data
   - `getMealHistory(userId)` - Logged meals
   - `getNutritionSummary(userId)` - Daily averages

4. **healthDataService** - Platform-specific health data (NEW)
   - `initialize()` - Initialize and request permissions
   - `getTodayMetrics()` - Today's steps, calories, heart rate, etc.
   - `getWeeklyData()` - 7-day health summary with trends
   - `getHealthScore()` - Calculated health score (0-100)
   - Platform detection: iOS (HealthKit) vs Android (Health Connect/Google Fit)

### Data Loading Pattern

```typescript
const loadProgressData = async () => {
  setLoading(true);
  try {
    // Parallel API calls for performance
    const [
      dashboardData,
      mealPrograms,
      workoutPrograms,
      workoutHistory,
      mealHistory,
    ] = await Promise.all([
      coachService.getClientDashboard(coachId, clientId),
      coachService.getClientMealPrograms(coachId, clientId),
      coachService.getClientWorkoutPrograms(coachId, clientId),
      fitnessService.getWorkoutHistory(clientId),
      nutritionService.getMealHistory(clientId, { limit: 10 }),
    ]);

    setProgressData({
      client: dashboardData.client,
      fitness: { /* merge data */ },
      nutrition: { /* merge data */ },
      // ...
    });
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
};
```

## UI Components

### Stats Grid

Displays key metrics in a 2x2 grid with gradient cards:

```
┌─────────────────┐ ┌─────────────────┐
│ 🎯 Adherence    │ │ 🔥 Streak       │
│     85%         │ │   12 days       │
│ (cyan gradient) │ │ (orange grad)   │
└─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐
│ ✓ Compliance    │ │ 💪 Workouts     │
│     92%         │ │     24          │
│ (emerald grad)  │ │ (purple grad)   │
└─────────────────┘ └─────────────────┘
```

### Program Progress Card

Shows active programs with visual progress:

```typescript
<View style={styles.programCard}>
  <View style={styles.programHeader}>
    <Ionicons name="barbell" size={20} color="#6366f1" />
    <Text style={styles.programName}>{program.name}</Text>
    <Text style={styles.programWeek}>Week {current} of {total}</Text>
  </View>
  <View style={styles.progressBarContainer}>
    <View style={[styles.progressBar, { width: `${progress}%` }]} />
  </View>
  <Text style={styles.progressPercent}>{progress}%</Text>
</View>
```

### Macros Visualization

Circular progress indicators for daily macros:

```
        Protein         Carbs           Fat
        ┌───┐          ┌───┐          ┌───┐
       │85g │         │220g│         │65g │
       │    │         │    │         │    │
        └───┘          └───┘          └───┘
        /150g          /300g          /80g
```

### Weekly Workout Chart

Bar chart showing workouts per day:

```
   │
 4 │                    ████
 3 │       ████         ████ ████
 2 │ ████  ████  ████        ████
 1 │ ████  ████  ████  ████  ████
   └─────────────────────────────
     Mon  Tue   Wed   Thu   Fri
```

## Coach Actions

### Assign Meal Plan

```typescript
const handleAssignMealPlan = () => {
  Alert.prompt(
    'Assign Meal Plan',
    'Enter meal program ID:',
    async (programId) => {
      if (!programId) return;
      
      try {
        await coachService.assignMealProgram({
          coachId,
          clientId,
          programId,
          startDate: new Date().toISOString(),
        });
        Alert.alert('Success', 'Meal plan assigned');
        await loadProgressData();
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    }
  );
};
```

### Assign Workout Plan

```typescript
const handleAssignWorkout = () => {
  Alert.prompt(
    'Assign Workout',
    'Enter workout program ID:',
    async (programId) => {
      if (!programId) return;
      
      try {
        await coachService.assignFitnessPlan({
          coachId,
          clientId,
          programId,
        });
        Alert.alert('Success', 'Workout plan assigned');
        await loadProgressData();
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    }
  );
};
```

### Add Coach Note

```typescript
const handleAddNote = () => {
  Alert.prompt(
    'Add Note',
    'Enter your observation:',
    async (content) => {
      if (!content) return;
      
      try {
        // API call to save note
        await coachService.addClientNote({
          coachId,
          clientId,
          content,
        });
        Alert.alert('Success', 'Note saved');
        await loadProgressData();
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    }
  );
};
```

## File Structure

```
src/
├── screens/
│   ├── CoachDashboard.tsx        # Client list with navigation
│   └── ClientProgressScreen.tsx  # Detailed progress view
├── services/
│   ├── coachService.ts          # Coach-client APIs
│   ├── fitnessService.ts        # Fitness data APIs
│   └── nutritionService.ts      # Nutrition data APIs
├── types/
│   └── navigation.ts            # Route definitions
└── navigation/
    └── AppNavigator.tsx         # Route registration
```

## Error Handling

### Loading States

- Show skeleton loaders while data fetches
- Pull-to-refresh support
- Retry button on failure

### Error Messages

```typescript
const handleError = (error: Error) => {
  const messages: Record<string, string> = {
    'NETWORK_ERROR': 'Check your internet connection',
    'UNAUTHORIZED': 'Please sign in again',
    'CLIENT_NOT_FOUND': 'Client no longer exists',
    'ACCESS_DENIED': 'You do not have access to this client',
  };
  
  Alert.alert(
    'Error',
    messages[error.code] || error.message
  );
};
```

## Testing

### Unit Tests

```typescript
describe('ClientProgressScreen', () => {
  it('loads client data on mount', async () => {
    const { getByTestId } = render(
      <ClientProgressScreen route={{ params: { clientId: '123' } }} />
    );
    
    await waitFor(() => {
      expect(getByTestId('stats-grid')).toBeTruthy();
    });
  });

  it('shows loading state initially', () => {
    const { getByTestId } = render(
      <ClientProgressScreen route={{ params: { clientId: '123' } }} />
    );
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('navigates back on header button press', () => {
    const mockGoBack = jest.fn();
    const { getByTestId } = render(
      <ClientProgressScreen 
        route={{ params: { clientId: '123' } }}
        navigation={{ goBack: mockGoBack }}
      />
    );
    
    fireEvent.press(getByTestId('back-button'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
describe('Coach → Client Progress Flow', () => {
  it('navigates from client list to progress screen', async () => {
    const { getByText, findByText } = render(<AppNavigator />);
    
    // Navigate to coach dashboard
    fireEvent.press(getByText('Coach Dashboard'));
    
    // Click on a client
    const clientCard = await findByText('John Smith');
    fireEvent.press(clientCard);
    
    // Verify progress screen loads
    expect(await findByText('Client Progress')).toBeTruthy();
    expect(await findByText('Overview')).toBeTruthy();
  });
});
```

## Performance Considerations

1. **Parallel Data Loading**: All API calls made concurrently
2. **Data Caching**: Consider implementing SWR pattern
3. **Lazy Tab Loading**: Only load tab data when selected
4. **Image Optimization**: Use cached avatars
5. **Pagination**: Limit recent items, load more on scroll

## Future Enhancements

- [ ] Real-time progress updates via WebSocket
- [ ] Push notifications for milestone achievements
- [ ] Export progress reports as PDF
- [ ] Comparison view (this week vs last week)
- [ ] Video consultation scheduling
- [ ] In-app messaging integration
- [ ] Custom goal setting UI
- [ ] Photo progress gallery

## Related Documentation

- [Coach Service API](./SERVICE_INTEGRATION_SUMMARY.md)
- [Family Sharing Guide](./COACH_FAMILY_SHARING_GUIDE.md)
- [Create Meals Implementation](./CREATE_MEALS_CLIENT_IMPLEMENTATION.md)
- [Mobile Implementation Guide](./MOBILE_IMPLEMENTATION_GUIDE.md)
