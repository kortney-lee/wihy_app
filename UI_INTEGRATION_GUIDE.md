# UI Integration Guide - Service Implementation

**Date:** January 2, 2026  
**Status:** Service Layer Complete - Ready for UI Integration

---

## 🎯 What's Needed from Services

All services are **already implemented and ready to use**. Here's exactly what each screen needs to do:

---

## 1. FitnessDashboard.tsx Integration

### Current State
- Uses **mock data** (`defaultData` object in file)
- No real API calls
- Static exercise list

### What to Change

**Import the service:**
```typescript
import { fitnessService, DailyWorkout, WorkoutSession } from '@/services';
```

**Add state for real data:**
```typescript
const [workout, setWorkout] = useState<DailyWorkout | null>(null);
const [session, setSession] = useState<WorkoutSession | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**Load today's workout on mount:**
```typescript
useEffect(() => {
  loadTodayWorkout();
}, []);

const loadTodayWorkout = async () => {
  try {
    setLoading(true);
    setError(null);
    const userId = 'user_123'; // Get from auth context
    const data = await fitnessService.getTodayWorkout(userId);
    setWorkout(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load workout');
    Alert.alert('Error', 'Could not load today\'s workout');
  } finally {
    setLoading(false);
  }
};
```

**Start workout session:**
```typescript
const handleStartWorkout = async () => {
  if (!workout) return;
  
  try {
    const newSession = await fitnessService.startSession({
      userId: 'user_123',
      workoutId: workout.workout_id,
    });
    setSession(newSession);
    // Navigate to active workout screen or show timer
  } catch (err) {
    Alert.alert('Error', 'Could not start workout session');
  }
};
```

**Log exercise performance:**
```typescript
const handleLogExercise = async (exerciseId: string, setData: {
  setNumber: number;
  repsCompleted: number;
  weightUsed?: number;
  formScore?: number;
}) => {
  if (!session) return;
  
  try {
    await fitnessService.logExercise(session.id, exerciseId, setData);
    // Update UI to show logged set
  } catch (err) {
    Alert.alert('Error', 'Could not log exercise');
  }
};
```

**Complete workout:**
```typescript
const handleCompleteWorkout = async (rpe: number, feltPain: boolean) => {
  if (!session) return;
  
  try {
    await fitnessService.completeSession(session.id, {
      rpe,
      felt_pain: feltPain,
      overall_notes: 'Great workout!',
    });
    
    setSession(null);
    Alert.alert('Success', 'Workout completed!');
    loadTodayWorkout(); // Refresh for next workout
  } catch (err) {
    Alert.alert('Error', 'Could not complete workout');
  }
};
```

### Data Mapping

**From API Response → UI:**
```typescript
// API gives you:
{
  workout_id: "workout_123",
  date: "2026-01-02",
  phase: "Foundation Building",
  level: "Intermediate",
  exercises: [
    {
      exercise_id: "ex_001",
      name: "Barbell Squat",
      muscle_group: "Legs",
      sets: 4,
      reps: "8-10",
      intensity: "RPE 7-8",
      rest_sec: 120
    }
  ],
  stretches: [...],
  estimated_duration_min: 45
}

// Map to UI format:
const exerciseRows = workout.exercises.map(ex => ({
  meta: {
    id: ex.exercise_id,
    name: ex.name,
    equipment: ex.equipment || 'Bodyweight',
    muscleLoad: { [ex.muscle_group]: 100 }
  },
  prescription: {
    sets: ex.sets,
    intensityLabel: ex.intensity,
    duration: `${ex.reps} reps`,
    rest: `${ex.rest_sec}s`
  }
}));
```

### Services Available

```typescript
// All methods ready to use:
fitnessService.getTodayWorkout(userId)           // Get daily workout
fitnessService.startSession({...})                // Start session
fitnessService.logExercise(sessionId, exId, {...})// Log set
fitnessService.completeSession(sessionId, {...})  // Complete workout
fitnessService.cancelSession(sessionId)           // Cancel session
fitnessService.getHistory(userId)                 // Get workout history
fitnessService.getExercises({ muscle_group })     // Browse exercises
fitnessService.getStretches({ target_muscle })    // Browse stretches
```

---

## 2. ConsumptionDashboard.tsx Integration

### Current State
- Uses **mock data** (`nutritionGoals`, `todaysMeals` objects)
- No persistence
- Static meal list

### What to Change

**Import the service:**
```typescript
import { nutritionService, DailySummary, MealLog } from '@/services';
```

**Add state:**
```typescript
const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
const [loading, setLoading] = useState(true);
```

**Load daily summary on mount:**
```typescript
useEffect(() => {
  loadDailySummary();
}, []);

const loadDailySummary = async () => {
  try {
    setLoading(true);
    const userId = 'user_123'; // Get from auth context
    const data = await nutritionService.getDailySummary(userId);
    setDailySummary(data);
  } catch (err) {
    Alert.alert('Error', 'Could not load nutrition data');
  } finally {
    setLoading(false);
  }
};
```

**Log a meal:**
```typescript
const handleLogMeal = async (meal: {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}) => {
  try {
    await nutritionService.logMeal({
      userId: 'user_123',
      ...meal,
    });
    
    // Refresh summary
    await loadDailySummary();
    
    Alert.alert('Success', 'Meal logged!');
  } catch (err) {
    Alert.alert('Error', 'Could not log meal');
  }
};
```

**Log water:**
```typescript
const handleLogWater = async (amountMl: number) => {
  try {
    await nutritionService.logWater({
      userId: 'user_123',
      amountMl,
    });
    
    await loadDailySummary();
  } catch (err) {
    Alert.alert('Error', 'Could not log water');
  }
};
```

**Update goals:**
```typescript
const handleUpdateGoals = async (goals: {
  daily_calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  water_ml?: number;
}) => {
  try {
    await nutritionService.updateGoals({
      userId: 'user_123',
      ...goals,
    });
    
    await loadDailySummary();
    Alert.alert('Success', 'Goals updated!');
  } catch (err) {
    Alert.alert('Error', 'Could not update goals');
  }
};
```

### Data Mapping

**From API Response → UI:**
```typescript
// API gives you:
{
  date: "2026-01-02",
  totals: { calories: 1847, protein_g: 98, carbs_g: 156, fat_g: 67 },
  goals: { calories: 2200, protein_g: 120, carbs_g: 200, fat_g: 85 },
  progress: { calories: 84, protein_g: 82, carbs_g: 78, fat_g: 79 },
  water_ml: 1800,
  water_goal_ml: 2000,
  meals: [...]
}

// Map to UI format:
const nutritionGoals = {
  calories: { current: summary.totals.calories, target: summary.goals.calories },
  protein: { current: summary.totals.protein_g, target: summary.goals.protein_g },
  carbs: { current: summary.totals.carbs_g, target: summary.goals.carbs_g },
  fat: { current: summary.totals.fat_g, target: summary.goals.fat_g },
  water: { current: summary.water_ml / 250, target: summary.water_goal_ml / 250 } // glasses
};
```

### Services Available

```typescript
nutritionService.logMeal({...})                    // Log meal
nutritionService.getDailySummary(userId, date)     // Get daily data
nutritionService.getWeeklyTrends(userId)           // Get trends
nutritionService.logWater({...})                   // Log water
nutritionService.updateGoals({...})                // Update goals
nutritionService.getGoals(userId)                  // Get current goals
nutritionService.getHistory(userId, {...})         // Get meal history
```

---

## 3. CoachDashboard.tsx Integration

### Current State
- Uses **mock client array** in state
- No real API calls
- Static client list

### What to Change

**Import the service:**
```typescript
import { coachService, Client, ClientDashboard } from '@/services';
```

**Add state:**
```typescript
const [clients, setClients] = useState<Client[]>([]);
const [selectedClientDashboard, setSelectedClientDashboard] = useState<ClientDashboard | null>(null);
const [loading, setLoading] = useState(true);
```

**Load clients on mount:**
```typescript
useEffect(() => {
  loadClients();
}, []);

const loadClients = async () => {
  try {
    setLoading(true);
    const coachId = 'coach_123'; // Get from auth context
    const data = await coachService.listClients(coachId);
    setClients(data);
  } catch (err) {
    Alert.alert('Error', 'Could not load clients');
  } finally {
    setLoading(false);
  }
};
```

**Search clients:**
```typescript
const handleSearch = async (query: string) => {
  if (!query.trim()) {
    await loadClients();
    return;
  }
  
  try {
    const coachId = 'coach_123';
    const results = await coachService.listClients(coachId, {
      search: query,
      status: 'ACTIVE',
    });
    setClients(results);
  } catch (err) {
    Alert.alert('Error', 'Search failed');
  }
};
```

**Select client and load dashboard:**
```typescript
const handleSelectClient = async (client: Client) => {
  setSelectedClient(client);
  
  try {
    const coachId = 'coach_123';
    const dashboard = await coachService.getClientDashboard(coachId, client.id);
    setSelectedClientDashboard(dashboard);
  } catch (err) {
    Alert.alert('Error', 'Could not load client details');
  }
};
```

**Send invitation:**
```typescript
const handleSendInvitation = async (email: string, name: string) => {
  try {
    await coachService.sendInvitation({
      coachId: 'coach_123',
      clientEmail: email,
      clientName: name,
      message: 'Let me help you reach your health goals!',
    });
    
    Alert.alert('Success', 'Invitation sent!');
  } catch (err) {
    Alert.alert('Error', 'Could not send invitation');
  }
};
```

**Assign meal program:**
```typescript
const handleAssignMealProgram = async (clientId: string, programId: string) => {
  try {
    // Note: This endpoint is missing from current API
    // Would need: POST /api/coaches/:coachId/clients/:clientId/meal-program
    // For now, can use mealService to assign
    Alert.alert('Info', 'Meal assignment endpoint coming soon');
  } catch (err) {
    Alert.alert('Error', 'Could not assign meal program');
  }
};
```

**Assign workout plan:**
```typescript
const handleAssignWorkoutPlan = async (clientId: string, programId: string) => {
  try {
    await coachService.assignFitnessPlan({
      coachId: 'coach_123',
      clientId,
      programId,
    });
    
    Alert.alert('Success', 'Workout plan assigned!');
  } catch (err) {
    Alert.alert('Error', 'Could not assign plan');
  }
};
```

### Data Mapping

**From API Response → UI:**
```typescript
// API gives you:
{
  client: {
    id: "client_123",
    name: "Sarah Johnson",
    email: "sarah@email.com",
    status: "ACTIVE",
    joined_date: "2025-12-01"
  },
  fitness_progress: {
    current_program: "8-Week Strength",
    workouts_completed: 24,
    adherence_rate: 85,
    recent_sessions: [...]
  },
  nutrition_summary: {
    daily_average_calories: 1850,
    goal_compliance_rate: 92,
    recent_meals: [...]
  }
}

// Map to UI format:
const clientForUI = {
  id: dashboard.client.id,
  name: dashboard.client.name,
  email: dashboard.client.email,
  goals: ['Weight Loss', 'Better Sleep'], // Extract from program
  diet: 'Keto', // Would need to fetch from meal program
  lastActive: dashboard.client.last_active || 'Recently',
};
```

### Services Available

```typescript
coachService.listClients(coachId, { search, status })  // List clients
coachService.getClientDashboard(coachId, clientId)     // Get client details
coachService.sendInvitation({...})                     // Send invitation
coachService.getPendingInvitations(coachId)            // Get invitations
coachService.assignFitnessPlan({...})                  // Assign workout plan
coachService.verifyAccess(coachId, clientId)           // Check access
coachService.updateRelationshipStatus(relId, status)   // Update status
coachService.getCoachOverview(coachId)                 // Get all clients overview
```

---

## 4. CreateMeals.tsx Integration

### Current State
- Likely uses mock recipe data
- No real meal program creation

### What to Add

**Import the service:**
```typescript
import { mealService, Recipe, MealProgram } from '@/services';
```

**Search recipes:**
```typescript
const handleSearchRecipes = async (query: string, diet?: 'keto' | 'paleo') => {
  try {
    const recipes = await mealService.searchRecipes({ q: query, diet, limit: 20 });
    setRecipes(recipes);
  } catch (err) {
    Alert.alert('Error', 'Could not search recipes');
  }
};
```

**Create meal program:**
```typescript
const handleCreateProgram = async (program: {
  name: string;
  diet_type: 'keto' | 'paleo' | 'vegan';
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}) => {
  try {
    const result = await mealService.createProgram({
      ...program,
      created_by: 'coach_123',
    });
    
    Alert.alert('Success', 'Meal program created!');
    return result;
  } catch (err) {
    Alert.alert('Error', 'Could not create program');
  }
};
```

**Calculate nutrition:**
```typescript
const handleCalculateNutrition = async (ingredients: Array<{
  item: string;
  amount: string;
}>) => {
  try {
    const nutrition = await mealService.calculateNutrition(ingredients);
    return nutrition; // { total_calories, total_protein_g, ... }
  } catch (err) {
    Alert.alert('Error', 'Could not calculate nutrition');
  }
};
```

### Services Available

```typescript
mealService.searchRecipes({ q, diet, limit })      // Search recipes
mealService.getRecipe(recipeId)                    // Get recipe details
mealService.createRecipe({...})                    // Create custom recipe
mealService.listPrograms({ diet, limit })          // List programs
mealService.createProgram({...})                   // Create program
mealService.updateProgram(id, {...})               // Update program
mealService.calculateNutrition(ingredients)        // Calculate nutrition
```

---

## 5. Shopping List Integration (CoachDashboard Shopping Tab)

### What to Add

**Import the service:**
```typescript
import { shoppingService, ShoppingList } from '@/services';
```

**Generate from meal plan:**
```typescript
const handleGenerateShoppingList = async (mealProgramId: string, clientId: string) => {
  try {
    const list = await shoppingService.generateFromMealPlan({
      userId: clientId,
      mealProgramId,
      days: 7,
      servings: 2,
    });
    
    setShoppingList(list);
    Alert.alert('Success', 'Shopping list generated!');
  } catch (err) {
    Alert.alert('Error', 'Could not generate list');
  }
};
```

**Get categorized list:**
```typescript
const handleGetCategorizedList = async (listId: string) => {
  try {
    const categorized = await shoppingService.getByCategory(listId);
    // categorized = { protein: [...], produce: [...], dairy: [...] }
    return categorized;
  } catch (err) {
    Alert.alert('Error', 'Could not load list');
  }
};
```

**Send to Instacart:**
```typescript
const handleSendToInstacart = async (listId: string, userId: string) => {
  try {
    const result = await shoppingService.sendToInstacart(listId, userId);
    
    if (result.success && result.orderId) {
      Alert.alert('Success', `Order created: ${result.orderId}`);
    } else if (result.alternative) {
      Alert.alert(
        'Instacart Not Configured',
        result.alternative.message,
        [
          { text: 'Download PDF', onPress: () => openURL(result.alternative.downloadUrl) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  } catch (err) {
    Alert.alert('Error', 'Could not send to Instacart');
  }
};
```

### Services Available

```typescript
shoppingService.createList({...})                  // Create list
shoppingService.getList(listId)                    // Get list
shoppingService.updateList(listId, {...})          // Update list
shoppingService.generateFromMealPlan({...})        // Generate from meal plan
shoppingService.getByCategory(listId)              // Get categorized
shoppingService.sendToInstacart(listId, userId)    // Send to Instacart
shoppingService.syncInstacartOrder(...)            // Sync order status
```

---

## 🔧 Common Patterns

### 1. Authentication Context

**Create auth context to get userId:**
```typescript
// src/context/AuthContext.tsx
const { userId, isCoach } = useAuth();

// Then use in screens:
const data = await fitnessService.getTodayWorkout(userId);
```

### 2. Error Handling

**Standard pattern:**
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const loadData = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await service.method();
    setState(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(message);
    Alert.alert('Error', message);
  } finally {
    setLoading(false);
  }
};
```

### 3. Loading States

**Show loading UI:**
```typescript
if (loading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text>Loading workout...</Text>
    </View>
  );
}
```

### 4. Pull to Refresh

**Add refresh control:**
```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await loadData();
  setRefreshing(false);
};

// In ScrollView:
<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
```

---

## 📋 Implementation Checklist

### FitnessDashboard.tsx
- [ ] Import fitnessService
- [ ] Add state for workout, session, loading, error
- [ ] Add useEffect to load today's workout
- [ ] Replace mock data with API data
- [ ] Wire up "Start Workout" button to startSession()
- [ ] Wire up exercise logging to logExercise()
- [ ] Wire up "Complete" button to completeSession()
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add pull-to-refresh

### ConsumptionDashboard.tsx
- [ ] Import nutritionService
- [ ] Add state for dailySummary, loading, error
- [ ] Add useEffect to load daily summary
- [ ] Replace mock nutritionGoals with API data
- [ ] Replace mock todaysMeals with API data
- [ ] Wire up meal logging to logMeal()
- [ ] Wire up water logging to logWater()
- [ ] Wire up goal updates to updateGoals()
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add pull-to-refresh

### CoachDashboard.tsx
- [ ] Import coachService
- [ ] Add state for clients, selectedClientDashboard, loading
- [ ] Add useEffect to load clients
- [ ] Replace mock clients array with API data
- [ ] Wire up search to listClients() with search param
- [ ] Wire up client selection to getClientDashboard()
- [ ] Wire up invitation sending to sendInvitation()
- [ ] Wire up plan assignment to assignFitnessPlan()
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add pull-to-refresh

### CreateMeals.tsx
- [ ] Import mealService
- [ ] Wire up recipe search to searchRecipes()
- [ ] Wire up program creation to createProgram()
- [ ] Wire up nutrition calculation to calculateNutrition()
- [ ] Add error handling
- [ ] Add loading states

### Shopping List Feature
- [ ] Import shoppingService
- [ ] Wire up list generation to generateFromMealPlan()
- [ ] Wire up category view to getByCategory()
- [ ] Wire up Instacart button to sendToInstacart()
- [ ] Add error handling
- [ ] Handle Instacart placeholder response

---

## 🚀 Getting Started

**Priority Order:**

1. **FitnessDashboard.tsx** (2-3 hours)
   - Most complex, highest user value
   - Start here to establish patterns

2. **ConsumptionDashboard.tsx** (2 hours)
   - Similar patterns to Fitness
   - High user value

3. **CoachDashboard.tsx** (3-4 hours)
   - More complex with client management
   - Multiple tabs to wire up

4. **CreateMeals.tsx** (2 hours)
   - Recipe search and program creation

5. **Shopping Lists** (1 hour)
   - Generation and Instacart integration

**Total: ~10-12 hours of focused development**

---

## 💡 Tips

1. **Start Small**: Get one API call working first (e.g., getTodayWorkout)
2. **Test Incrementally**: Test each service method before moving to next
3. **Use Console Logs**: Log API responses to verify data structure
4. **Handle Errors**: Always add try/catch and user-friendly error messages
5. **Loading States**: Show spinners while data loads
6. **Type Safety**: Let TypeScript guide you with auto-complete
7. **Pull to Refresh**: Users expect to refresh data
8. **Optimistic Updates**: Update UI immediately, sync with API in background

---

**Status:** All services ready. Start integrating! 🎉

