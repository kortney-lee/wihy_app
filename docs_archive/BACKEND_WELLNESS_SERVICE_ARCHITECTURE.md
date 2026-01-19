# Backend Wellness Service Architecture

> **Last Updated:** January 6, 2026
>
> **Status:** ✅ IMPLEMENTED
>
> **Purpose:** Complete backend service architecture handling aggregation, calculations, and analytics for the WIHY wellness platform. Integrates nutrition, fitness, health, and behavioral (dopamine) tracking into unified dashboard experiences.

---

## Implementation Status ✅

| Component | Status | File |
|-----------|--------|------|
| WellnessAggregationService | ✅ Complete | `services/wellness/WellnessAggregationService.js` |
| DopamineService | ✅ Complete | `services/wellness/DopamineService.js` |
| InsightsService | ✅ Complete | `services/wellness/InsightsService.js` |
| TrendAnalysisService | ✅ Complete | `services/wellness/TrendAnalysisService.js` |
| PredictiveService | ✅ Complete | `services/wellness/PredictiveService.js` |
| Advanced Wellness Routes | ✅ Complete | `routes/wellnessAdvancedRoutes.js` |
| Server Integration | ✅ Complete | `server.js` |

---

## Overview

## Core Service Classes

### 1. WellnessAggregationService
**Purpose**: Aggregates data from nutrition, fitness, and health services into unified metrics

```typescript
class WellnessAggregationService {
  // Data fetching
  getTodayMetrics(): Promise<TodayMetrics>
  getWeekMetrics(weekStart: Date): Promise<WeekMetrics>
  getMonthMetrics(month: Date): Promise<MonthMetrics>
  getDateRangeMetrics(start: Date, end: Date): Promise<DateRangeMetrics>

  // Wellness score calculations
  calculateWellnessScore(data: WellnessData): number
  calculateNutritionScore(nutritionData: NutritionData): number
  calculateActivityScore(fitnessData: FitnessData): number
  calculateBehaviorScore(behaviorData: BehaviorData): number

  // Aggregated metrics
  getMacroBreakdown(meals: Meal[]): MacroBreakdown
  getWeeklyConsistency(data: WeekData): ConsistencyMetrics
  calculateTrends(dateRange: DateRange): TrendAnalysis
}
```

### 2. DopamineService
**Purpose**: Tracks desire → consume → satisfaction behavioral loops

```typescript
class DopamineService {
  // Desire tracking
  logDesire(desire: DesireLog): Promise<void>
  getDesirePatterns(dateRange: DateRange): Promise<DesirePatterns>
  getCommonCravings(limit: number): Promise<CravingTrend[]>
  getCravingTriggers(): Promise<TriggerAnalysis>

  // Consume tracking
  logConsumption(consumption: ConsumptionLog): Promise<void>
  getConsumptionPatterns(dateRange: DateRange): Promise<ConsumptionPatterns>
  analyzePortionControl(data: ConsumptionData): PortionAnalysis

  // Satisfaction feedback
  logSatisfaction(feedback: SatisfactionFeedback): Promise<void>
  getSatisfactionMetrics(dateRange: DateRange): Promise<SatisfactionMetrics>
  calculateSatisfactionRate(cravingId: string): Promise<number>

  // Loop analysis
  analyzeBehavioralLoop(cycle: BehavioralCycle): LoopAnalysis
  identifyPositiveCycles(): Promise<BehavioralCycle[]>
  identifyNegativeCycles(): Promise<BehavioralCycle[]>
  calculateDopaminScore(): Promise<number>
}
```

### 3. InsightsService
**Purpose**: Generates actionable insights from aggregated wellness data

```typescript
class InsightsService {
  // Nutrition insights
  getNutritionInsights(nutritionData: NutritionData): NutritionInsights
  getMacroBalanceAnalysis(): MacroAnalysis
  getEatingPatterns(): EatingPatternInsights
  getCommonFoods(limit: number): FoodTrend[]
  getMealTimingAnalysis(): MealTimingInsights

  // Activity insights
  getWorkoutInsights(fitnessData: FitnessData): WorkoutInsights
  getBestExerciseTime(): TimeInsight
  getWorkoutTypeBreakdown(): WorkoutTypeAnalysis
  getRecoveryInsights(): RecoveryAnalysis

  // Behavioral insights
  getBehavioralInsights(): BehavioralInsights
  getDesireTriggerAnalysis(): TriggerAnalysis
  getConsumeControlAnalysis(): ConsumeAnalysis
  getSatisfactionAnalysis(): SatisfactionAnalysis

  // Recommendations
  generateRecommendations(data: WellnessData): Recommendation[]
  getPrioritizedActions(): ActionItem[]
}
```

### 4. TrendAnalysisService
**Purpose**: Historical analysis and trend calculation

```typescript
class TrendAnalysisService {
  // Time-series analysis
  getCalorieTrend(dateRange: DateRange): CalorieTrend
  getMacroTrends(dateRange: DateRange): MacroTrends
  getWorkoutTrend(dateRange: DateRange): WorkoutTrend
  getWeightTrend(dateRange: DateRange): WeightTrend

  // Dopamine trends
  getDesireTrend(dateRange: DateRange): DesireTrend
  getConsumeTrend(dateRange: DateRange): ConsumeTrend
  getSatisfactionTrend(dateRange: DateRange): SatisfactionTrend
  getBehavioralCycleTrend(dateRange: DateRange): CycleTrend

  // Comparisons
  compareWeeks(week1: Date, week2: Date): ComparisonResult
  compareMonths(month1: Date, month2: Date): ComparisonResult
  calculateMonthOverMonthChange(): ChangeMetrics
  calculateWeekOverWeekChange(): ChangeMetrics

  // Volatility & consistency
  calculateConsistency(data: DataPoints[]): number
  calculateVolatility(data: DataPoints[]): number
  identifyOutliers(data: DataPoints[]): Outlier[]
}
```

### 5. PredictiveService
**Purpose**: ML-based forecasting and recommendations

```typescript
class PredictiveService {
  // Forecasting
  forecastCalories(daysAhead: number): CaloriesForecast
  forecastWeight(daysAhead: number): WeightForecast
  forecastWorkoutCompletion(dateRange: DateRange): CompletionForecast

  // Behavioral prediction
  predictDesireTiming(): TimingPrediction[]
  predictCravingOccurrence(): CravingPrediction[]
  predictSuccessRate(behavior: BehaviorType): number
  recommendCravingAlternative(craving: CravingData): AlternativeRecommendation

  // Goal achievement
  calculateWeeksToGoal(goal: Goal): number
  probabilityOfGoalCompletion(): number
  recommendedActionsForGoal(goal: Goal): ActionItem[]

  // Optimal timing
  findBestWorkoutTime(): TimeWindow
  findBestMealTimes(): TimeWindow[]
  findBestRecoveryTime(): TimeWindow
}
```

---

## Data Models

### TodayMetrics
```typescript
interface TodayMetrics {
  // Nutrition
  caloriesConsumed: number
  caloriesGoal: number
  caloriesRemaining: number
  macros: {
    protein: { consumed: number; goal: number }
    carbs: { consumed: number; goal: number }
    fats: { consumed: number; goal: number }
  }
  water: { consumed: number; goal: number }
  meals: Meal[]
  
  // Activity
  workoutCompleted: boolean
  workoutDuration: number
  workoutType: string
  workoutPercentComplete: number
  
  // Dopamine/Behavior
  cravingsLogged: number
  cravingsResisted: number
  satisfactionAverage: number
  moodSnapshots: MoodLog[]
  
  // Status
  onTrack: boolean
  nextAction: ActionItem
}
```

### WeekMetrics
```typescript
interface WeekMetrics {
  // Nutrition weekly
  calorieAverage: number
  calorieGoal: number
  weeklyTotal: number
  macroAverages: MacroBreakdown
  dayByDay: {
    date: Date
    calories: number
    macros: MacroBreakdown
    complete: boolean
  }[]
  
  // Activity weekly
  workoutsCompleted: number
  workoutsTarget: number
  totalDuration: number
  consistencyPercentage: number
  typeBreakdown: {
    strength: number
    cardio: number
    flexibility: number
  }
  
  // Dopamine weekly
  cravingPatterns: CravingPattern[]
  consumeControl: {
    portionAverage: number
    consistencyScore: number
    foodBalance: { healthy: number; treats: number; neutral: number }
  }
  satisfactionMetrics: {
    postMealMood: MoodDistribution
    cravingSatisfactionRate: number
    energyAfterEating: EnergyDistribution
  }
  
  // Trends
  comparisonToLastWeek: ComparisonMetrics
}
```

### MonthMetrics
```typescript
interface MonthMetrics {
  // Long-term nutrition
  dailyAverage: number
  monthlyTotal: number
  dailyTarget: number
  percentageOfGoal: number
  macroEvolution: {
    protein: { start: number; current: number; trend: 'up' | 'down' | 'stable' }
    carbs: { start: number; current: number; trend: 'up' | 'down' | 'stable' }
    fats: { start: number; current: number; trend: 'up' | 'down' | 'stable' }
  }
  
  // Body metrics
  weight: { start: number; current: number; change: number; trend: number }
  
  // Activity monthly
  daysActive: number
  workoutsCompleted: number
  totalDuration: number
  consistencyPercentage: number
  bestWeek: WeekData
  
  // Dopamine evolution
  desireManagement: {
    cravingsPerWeekThen: number
    cravingsPerWeekNow: number
    improvementPercent: number
  }
  consumeControl: {
    portionConsistency: number
    mindfulnessScore: number
    foodQualityImprovement: number
  }
  satisfactionGrowth: {
    happinessAfterEating: number
    guiltReduction: number
    craveSuccessImprovement: number
  }
  
  // Achievements
  achievements: Achievement[]
  streaks: StreakData[]
  milestones: Milestone[]
}
```

### DesireLog
```typescript
interface DesireLog {
  timestamp: Date
  hungerLevel: number // 1-10
  cravingType: string // 'pizza', 'sweets', 'salty', 'healthy', etc
  mood: 'happy' | 'stressed' | 'bored' | 'tired'
  motivationType: 'hunger' | 'habit' | 'emotion' | 'social'
  intensity: number // 1-10
  notes?: string
}
```

### ConsumptionLog
```typescript
interface ConsumptionLog {
  desireLogId?: string // Links to desire that triggered this
  mealId: string // The actual meal logged
  timestamp: Date
  quantity: number
  portionSize: 'small' | 'medium' | 'large' | 'custom'
  paceOfEating: 'slow' | 'medium' | 'fast'
  mindfulnessLevel: number // 1-10
  notes?: string
}
```

### SatisfactionFeedback
```typescript
interface SatisfactionFeedback {
  consumptionLogId: string
  satisfactionScore: number // 1-10
  moodAfter: 'happy' | 'neutral' | 'guilty' | 'energized' | 'crashed'
  cravingSatisfied: boolean
  wouldChooseAgain: boolean
  notes?: string
  timestamp: Date
}
```

### DopamineScore
```typescript
interface DopamineScore {
  desireAwareness: number // Knows what triggers eating (0-100)
  consumeControl: number // Portion control and mindfulness (0-100)
  satisfactionAlignment: number // Meals match desires (0-100)
  overall: number // Weighted average (0-100)
}
```

---

## API Endpoints

### Dashboard Data Endpoints

#### `/api/wellness/today`
- **Method**: GET
- **Response**: TodayMetrics
- **Cache**: 5 minutes
- **Description**: All data needed for Today tab on My Progress

#### `/api/wellness/week`
- **Method**: GET
- **Query**: ?weekStart=YYYY-MM-DD
- **Response**: WeekMetrics
- **Cache**: 1 hour
- **Description**: Weekly aggregated data

#### `/api/wellness/month`
- **Method**: GET
- **Query**: ?month=YYYY-MM
- **Response**: MonthMetrics
- **Cache**: 2 hours
- **Description**: Monthly trends and achievements

#### `/api/health-overview/summary`
- **Method**: GET
- **Response**: HealthOverviewSummary (contains wellness score, nutrition summary, activity summary, hydration, dopamine loop)
- **Description**: Summary tab data

#### `/api/health-overview/insights`
- **Method**: GET
- **Response**: HealthInsights (nutrition insights, workout insights, behavioral insights, recommendations)
- **Description**: Insights tab data

#### `/api/health-overview/wellness`
- **Method**: GET
- **Response**: WellnessStatus (all dimensions: nutrition, activity, behavior, sleep, hydration, stress/mood)
- **Description**: Wellness tab data

#### `/api/health-overview/trends`
- **Method**: GET
- **Query**: ?period=week|month|quarter|year
- **Response**: TrendCharts (calories, macros, workouts, weight, dopamine patterns)
- **Description**: Trends tab with all charts

#### `/api/health-overview/predictive`
- **Method**: GET
- **Response**: PredictiveData (forecasts, behavior predictions, goal projections, optimal timings)
- **Description**: Predictive tab with ML insights

### Dopamine Tracking Endpoints

#### `POST /api/dopamine/desire`
- **Request**: DesireLog
- **Response**: { id: string; timestamp: Date }
- **Description**: Log a craving/desire

#### `GET /api/dopamine/desire-patterns`
- **Query**: ?dateRange=week|month
- **Response**: DesirePatterns
- **Description**: Get desire triggers and patterns

#### `POST /api/dopamine/consumption`
- **Request**: ConsumptionLog
- **Response**: { id: string; timestamp: Date }
- **Description**: Log what was consumed

#### `POST /api/dopamine/satisfaction`
- **Request**: SatisfactionFeedback
- **Response**: { feedback_id: string; insights: string }
- **Description**: Log how satisfied after consumption

#### `GET /api/dopamine/loop-analysis`
- **Query**: ?dateRange=week|month
- **Response**: BehavioralLoopAnalysis
- **Description**: Analyze desire → consume → satisfaction cycles

#### `GET /api/dopamine/score`
- **Response**: DopamineScore
- **Description**: Get overall dopamine/behavior management score

### Analytics Endpoints

#### `GET /api/analytics/wellness-score`
- **Query**: ?period=today|week|month
- **Response**: { score: number; components: { nutrition: number; activity: number; behavior: number } }

#### `GET /api/analytics/consistency`
- **Query**: ?metric=calories|water|workouts&dateRange=week|month
- **Response**: { consistency: number; daysOnTrack: number; daysOff: number }

#### `GET /api/analytics/macro-balance`
- **Response**: { protein: number; carbs: number; fats: number; balance: 'good'|'poor' }

---

## Calculation Methods

### Wellness Score Calculation
```typescript
function calculateWellnessScore(
  nutritionScore: number,      // 0-100
  activityScore: number,        // 0-100
  behaviorScore: number         // 0-100 (dopamine/satisfaction)
): number {
  // Weighted average
  return (
    nutritionScore * 0.40 +     // 40% - Macro balance, meal variety, hydration
    activityScore * 0.35 +      // 35% - Workout frequency, duration, consistency
    behaviorScore * 0.25        // 25% - Desire awareness, consume control, satisfaction
  );
}
```

### Nutrition Score Calculation
```typescript
function calculateNutritionScore(nutritionData: NutritionData): number {
  const calorieScore = calculateAccuracy(nutritionData.calories, nutritionData.calorieGoal);
  const proteinScore = calculateAccuracy(nutritionData.protein, nutritionData.proteinGoal);
  const macroBalance = calculateMacroBalance(nutritionData.macros);
  const hydrationScore = (nutritionData.water / nutritionData.waterGoal) * 100;

  return (
    calorieScore * 0.4 +
    proteinScore * 0.25 +
    macroBalance * 0.2 +
    Math.min(hydrationScore, 100) * 0.15
  );
}
```

### Activity Score Calculation
```typescript
function calculateActivityScore(fitnessData: FitnessData): number {
  const frequencyScore = (fitnessData.workoutsCompleted / fitnessData.workoutTarget) * 100;
  const consistencyScore = fitnessData.consistencyPercentage;
  const durationScore = calculateDurationAdequacy(fitnessData.totalDuration);
  const typeScore = calculateTypeVariety(fitnessData.workoutTypes);

  return (
    frequencyScore * 0.35 +
    consistencyScore * 0.35 +
    durationScore * 0.2 +
    typeScore * 0.1
  );
}
```

### Dopamine/Behavior Score Calculation
```typescript
function calculateBehaviorScore(behaviorData: BehaviorData): number {
  const desireAwareness = (behaviorData.triggersIdentified / behaviorData.totalDesires) * 100;
  const consumeControl = calculatePortionControl(behaviorData.consumptionData);
  const satisfactionRate = (behaviorData.satisfiedCravings / behaviorData.totalCravings) * 100;
  const positiveLoops = (behaviorData.positiveCycles / behaviorData.totalCycles) * 100;

  return (
    desireAwareness * 0.25 +
    consumeControl * 0.3 +
    satisfactionRate * 0.25 +
    positiveLoops * 0.2
  );
}
```

### Consistency Score Calculation
```typescript
function calculateConsistency(entries: LogEntry[]): number {
  const totalDays = getDaysBetween(entries[0].date, entries[entries.length - 1].date);
  const daysWithEntries = getUniqueDays(entries).length;
  return (daysWithEntries / totalDays) * 100;
}
```

### Macro Balance Score
```typescript
function calculateMacroBalance(macros: MacroBreakdown): number {
  const proteinPercent = (macros.protein / macros.total) * 100;
  const carbPercent = (macros.carbs / macros.total) * 100;
  const fatPercent = (macros.fats / macros.total) * 100;

  // Target ranges (protein: 25-35%, carbs: 45-55%, fats: 20-30%)
  const proteinScore = calculateAccuracy(proteinPercent, 30, 5);
  const carbScore = calculateAccuracy(carbPercent, 50, 5);
  const fatScore = calculateAccuracy(fatPercent, 25, 5);

  return (proteinScore + carbScore + fatScore) / 3;
}
```

---

## Integration Points

### With Nutrition Service
- Get meals, calories, macros, water intake
- Calculate nutrient breakdowns
- Identify eating patterns and meal timing

### With Fitness Service
- Get workouts, duration, type
- Calculate activity consistency
- Identify best exercise times
- Track recovery patterns

### With Health Service (Optional)
- Get health tracker data if available
- Device steps, active minutes, heart rate
- Sleep, weight, other metrics
- Fall back gracefully if unavailable

### With Dopamine Service
- Track desire, consumption, satisfaction
- Analyze behavioral loops
- Identify triggers and patterns
- Predict future cravings

---

## Performance Considerations

---

## Performance Considerations

### Caching Strategy

| Data Type | Cache Duration | Reason |
|-----------|----------------|--------|
| Today's metrics | 5 minutes | Frequently updated |
| Weekly metrics | 1 hour | Slower updates |
| Monthly metrics | 2 hours | Very slow updates |
| Desire/satisfaction logs | Real-time | User feedback |

### Database Optimization
- Index by userId + timestamp
- Aggregate tables for historical data
- Denormalize common calculations
- Archive old data (>1 year)

### API Response Optimization
- Return only requested fields
- Paginate large datasets
- Compress trend data
- Lazy load detailed breakdowns

---

## Error Handling

### Graceful Degradation

| If Service Fails | Show Instead |
|------------------|--------------|
| Fitness service | Nutrition + behavior data |
| Nutrition service | Fitness + behavior data |
| Health service | Other services (it's optional) |
| Behavior service | Nutrition + fitness |

### Fallback Strategies
- Use cached data if service unavailable
- Use last known good values
- Show "data unavailable" instead of errors
- Queue requests for retry

---

## Implementation Roadmap

### Phase 1: Core Services (Foundation)
- [x] WellnessAggregationService
- [x] DopamineService (desire/consume/satisfaction tracking)
- [x] InsightsService
- [x] TrendAnalysisService

### Phase 2: API Endpoints (Integration)
- [x] `/api/wellness/today`
- [x] `/api/wellness/week`
- [x] `/api/wellness/month`
- [x] `/api/health-overview/*` endpoints
- [x] `/api/dopamine/*` endpoints
- [x] `/api/analytics/*` endpoints

### Phase 3: Calculations (Analytics Engine)
- [x] Wellness score calculation
- [x] Nutrition score calculation
- [x] Activity score calculation
- [x] Behavior/Dopamine score calculation

### Phase 4: Predictive Features (AI/ML)
- [x] PredictiveService
- [x] ML model integration
- [x] Forecasting endpoints

---

## Future Enhancements

1. **ML Model Integration**
   - Predict user behavior patterns
   - Recommend optimal meal times
   - Forecast goal achievement

2. **Social Features**
   - Compare with community averages
   - Share achievements
   - Get peer recommendations

3. **Wearable Integration**
   - Apple Health, Google Fit
   - Real-time activity sync
   - Sleep and heart rate data

4. **Advanced Analytics**
   - Correlation analysis (mood vs eating)
   - Clustering similar users
   - Anomaly detection

5. **Gamification**
   - Leaderboards
   - Challenges
   - Badge progression

---

## Related Documentation

- [HEALTH_OVERVIEW_SPEC.md](HEALTH_OVERVIEW_SPEC.md) - Health Overview dashboard specification
- [MY_PROGRESS_SPEC.md](MY_PROGRESS_SPEC.md) - My Progress dashboard specification
- [CLIENT_IMPLEMENTATION_GUIDE.md](CLIENT_IMPLEMENTATION_GUIDE.md) - Client implementation guide
- [API_ENDPOINTS_REFERENCE.md](API_ENDPOINTS_REFERENCE.md) - Complete API reference
