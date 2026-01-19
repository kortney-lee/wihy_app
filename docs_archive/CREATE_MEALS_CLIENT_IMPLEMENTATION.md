# CreateMeals Screen - Client Implementation Guide

## Overview

The CreateMeals screen (`src/screens/CreateMeals.tsx`) is a comprehensive meal planning interface that allows users to:
- Generate AI-powered meal plans
- Create meals manually
- Scan recipes from photos
- Manage a meal library
- View meal calendars
- Generate shopping lists

**Current Status: Partially Implemented with Mock Data**

---

## Screen Architecture

### View Modes
```typescript
type ViewMode = 'dashboard' | 'create' | 'calendar' | 'library';
```

| Mode | Description | Status |
|------|-------------|--------|
| `dashboard` | Main view with quick actions, today's meals, templates | ✅ Implemented |
| `create` | Manual meal creation form | ✅ Implemented |
| `calendar` | Calendar view of meal plan | ⚠️ Uses mock data |
| `library` | Saved meals library modal | ✅ Implemented |

---

## API Integration Status

### Endpoints Required

| Endpoint | Service | Status | Notes |
|----------|---------|--------|-------|
| `POST /api/meals/plan` | mealService | ⚠️ Partial | `createMealPlanFromDescription()` - API works but response normalization needed |
| `POST /api/meals` | mealService | ✅ Works | `createMeal()` - saves manual meals |
| `GET /api/meals/user/:userId` | mealService | ❌ Mock | Currently using mock-data-muscle-building-meal-plan.json |
| `GET /api/meals/templates` | mealService | ⚠️ Mock | `getTemplates()` - returns QUICK_TEMPLATE_PRESETS |
| `POST /api/meals/scan-recipe` | mealService | ✅ Works | `scanRecipe()` - OCR from photo |
| `POST /api/meal-plans` | mealPlanService | ❌ Unused | Legacy service, not integrated |
| `POST /api/meal-plans/:id/shopping-list` | mealPlanService | ❌ Unused | Called but doesn't connect to real data |
| `GET /api/meals/calendar/:userId` | mealService | ❌ Mock | Using mock-data-calendar-view.json |

---

## Critical Gaps to Fix

### 1. **User ID Handling** 🔴 HIGH PRIORITY

**Problem**: The screen uses `user?.id` from AuthContext, but for dev mode it generates random IDs like `dev-1767726736685` instead of `test_user`.

**Location**: Lines 166-167
```typescript
const { user } = useContext(AuthContext);
const userId = user?.id;
```

**Fix**: Already fixed in AuthContext to use `test_user` for dev mode.

**Impact**: All API calls fail because backend expects consistent userId.

---

### 2. **Dashboard Data Loading** 🔴 HIGH PRIORITY

**Problem**: `loadDashboardData()` uses mock data instead of real API calls.

**Location**: Lines 259-367
```typescript
const loadDashboardData = async () => {
  // Uses mockMealPlan, mockCalendarView, mockShoppingList
  // Should call real API
};
```

**Required API Calls**:
```typescript
// 1. Get user's saved meals
const savedMeals = await mealService.getUserMeals(userId);

// 2. Get active meal plan (if any)
const activePlan = await mealService.getActiveMealPlan(userId);

// 3. Get today's meals from calendar
const todaysMeals = await mealService.getCalendarDay(userId, today);

// 4. Get calendar days for current view
const calendarDays = await mealService.getCalendarDays(userId, startDate, endDate);
```

---

### 3. **AI Meal Plan Generation Response Handling** 🟡 MEDIUM PRIORITY

**Problem**: The API response format doesn't match expected structure, requiring extensive normalization.

**Location**: Lines 415-503 (handleGenerateAIMealPlan)
```typescript
// Current: Manual normalization of every field
const normalizedPlan: MealPlanResponse = {
  success: result.success ?? true,
  program_id: result.program_id || result.id || `plan_${Date.now()}`,
  // ... 50+ lines of normalization
};
```

**Fix Options**:
1. Update backend API to return consistent response format
2. Create a dedicated response transformer utility
3. Document expected response format for backend team

**Expected Request Format**:
```typescript
interface CreateMealPlanRequest {
  userId: string;              // Required - 'test_user' for dev
  description: string;         // "Easy family dinners for 4"
  duration: number;            // 7, 14, or 30 days
  mealsPerDay: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  mealVariety: 'balanced' | 'family_friendly' | 'maximum_variety';
  servings: number;            // 1-8
  dietaryRestrictions: string[]; // ['vegetarian', 'gluten_free']
  preferredStores?: string[];  // ['costco', 'trader_joes']
  cookingComplexity: 'beginner' | 'intermediate' | 'advanced';
  timePerMeal: 'quick' | 'moderate' | 'no_preference';
  dailyCalorieTarget: number;  // 2000
  macrosTarget: {
    protein: number;  // 25 (percentage)
    carbs: number;    // 50
    fat: number;      // 25
  };
}
```

---

### 4. **Calendar View Not Connected** 🟡 MEDIUM PRIORITY

**Problem**: Calendar view shows mock data, not real meal plan data.

**Location**: Lines 380-385 (hasMealPlanned function)
```typescript
const hasMealPlanned = (date: Date | null) => {
  if (!date) return false;
  // Mock: has meal planned every other day
  return date.getDate() % 2 === 0;  // ❌ This is fake
};
```

**Fix Required**:
```typescript
const hasMealPlanned = (date: Date | null) => {
  if (!date) return false;
  const dateStr = date.toISOString().split('T')[0];
  return calendarDays.some(day => day.date === dateStr && day.meals.length > 0);
};
```

---

### 5. **Today's Meals Not Interactive** 🟡 MEDIUM PRIORITY

**Problem**: "Today's Meals" section shows meal types but doesn't connect to actual meals.

**Location**: Lines 1178-1210
```typescript
{Object.entries(mealTypeConfig).map(([type, config]) => (
  <TouchableOpacity key={type} style={styles.mealTypeRow}>
    {/* Shows "Tap to add meal" for all - should show actual meal if exists */}
```

**Fix Required**:
```typescript
const getMealForType = (type: string) => {
  return todaysMeals.find(meal => meal.meal_type === type);
};

// In render:
const meal = getMealForType(type);
if (meal) {
  // Show meal name and nutrition
} else {
  // Show "Tap to add meal"
}
```

---

### 6. **Shopping List / Instacart Integration** 🟡 MEDIUM PRIORITY

**Problem**: `handleSubmitToInstacart()` shows "coming soon" alert instead of working.

**Location**: Lines 559-578
```typescript
const handleSubmitToInstacart = async () => {
  // TODO: Integrate with Instacart API
  Alert.alert('Instacart', 'Shopping list has been prepared! Instacart integration coming soon.');
};
```

**Required**:
1. Generate shopping list from accepted meal plan
2. Format items for Instacart API
3. Navigate to Instacart deep link or webview

---

### 7. **Library Meals Loading from Mock** 🟢 LOW PRIORITY

**Problem**: `loadLibraryMeals()` uses mock data.

**Location**: Lines 720-765
```typescript
const loadLibraryMeals = async (searchQuery?: string, filterTag?: string | null) => {
  // Uses mockMealPlan.days.flatMap() - should call API
};
```

**Fix**:
```typescript
const loadLibraryMeals = async (searchQuery?: string, filterTag?: string | null) => {
  const meals = await mealService.getUserMeals(userId, {
    search: searchQuery,
    tag: filterTag,
  });
  setAllMeals(meals);
};
```

---

### 8. **Meal Details Modal Missing Features** 🟢 LOW PRIORITY

**Current Features**:
- ✅ View ingredients
- ✅ View instructions
- ✅ Adjust servings
- ❌ Add to today's meals
- ❌ Add to meal plan
- ❌ Edit meal
- ❌ Delete meal
- ❌ Log to consumption

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CreateMeals Screen                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
    ┌───────────┐         ┌───────────┐         ┌───────────┐
    │ Dashboard │         │  Create   │         │  Library  │
    │   View    │         │   Meal    │         │   Modal   │
    └───────────┘         └───────────┘         └───────────┘
          │                      │                      │
          │                      │                      │
          ▼                      ▼                      ▼
    ┌─────────────────────────────────────────────────────────┐
    │                    mealService                          │
    │  - createMealPlanFromDescription()  ← AI Generation     │
    │  - createMeal()                     ← Manual Creation   │
    │  - getUserMeals()                   ← Library (MOCK)    │
    │  - scanRecipe()                     ← Photo OCR         │
    │  - getTemplates()                   ← Templates (MOCK)  │
    └─────────────────────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────┐
    │              Backend API (services.wihy.ai)             │
    │  POST /api/meals/plan                                   │
    │  POST /api/meals                                        │
    │  GET  /api/meals/user/:userId        ❌ NOT CALLED      │
    │  GET  /api/meals/calendar/:userId    ❌ NOT CALLED      │
    └─────────────────────────────────────────────────────────┘
```

---

## State Management

### Key State Variables

```typescript
// View State
const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
const [refreshing, setRefreshing] = useState(false);

// Calendar State
const [selectedDate, setSelectedDate] = useState(new Date());
const [calendarMonth, setCalendarMonth] = useState(new Date());
const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

// Active Meal Plan
const [activeMealPlan, setActiveMealPlan] = useState<MealPlanResponse | null>(null);
const [todaysMeals, setTodaysMeals] = useState<any[]>([]);

// AI Plan Generator Modal
const [showPlanGenerator, setShowPlanGenerator] = useState(false);
const [planModalStep, setPlanModalStep] = useState<'goals' | 'customize' | 'preview' | 'meals'>('goals');
const [planDescription, setPlanDescription] = useState('');
const [planDuration, setPlanDuration] = useState(7);
const [planServings, setPlanServings] = useState(2);
const [selectedDietaryOptions, setSelectedDietaryOptions] = useState<string[]>([]);
const [selectedStores, setSelectedStores] = useState<string[]>([]);
const [selectedMealTypes, setSelectedMealTypes] = useState<Record<string, boolean>>({...});
const [cookingLevel, setCookingLevel] = useState<CookingSkillLevel>('intermediate');
const [timePerMeal, setTimePerMeal] = useState<TimePerMeal>('moderate');
const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
const [generatedPlan, setGeneratedPlan] = useState<MealPlanResponse | null>(null);

// Manual Meal Creation Form
const [mealName, setMealName] = useState('');
const [servingSize, setServingSize] = useState('1');
const [calories, setCalories] = useState('');
const [protein, setProtein] = useState('');
const [carbs, setCarbs] = useState('');
const [fat, setFat] = useState('');
const [selectedTags, setSelectedTags] = useState<string[]>([]);
const [notes, setNotes] = useState('');
const [ingredients, setIngredients] = useState<Ingredient[]>([]);

// Library
const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
const [allMeals, setAllMeals] = useState<SavedMeal[]>([]);
const [librarySearchQuery, setLibrarySearchQuery] = useState('');
const [libraryFilterTag, setLibraryFilterTag] = useState<string | null>(null);
```

---

## User Flows

### Flow 1: Generate AI Meal Plan

```
1. User taps "Create AI Meal Plan" button
   └─> setShowPlanGenerator(true)

2. Step 1 - Goals Selection
   └─> User selects a quick goal (Family Dinners, Meal Prep, etc.)
   └─> handleSelectQuickGoal() applies preset config
   └─> setPlanModalStep('customize')

3. Step 2 - Customize Plan
   └─> User adjusts:
       - Duration (7, 14, 30 days)
       - Servings (1-8)
       - Meal types (breakfast, lunch, dinner)
       - Dietary restrictions
       - Preferred stores
       - Cooking level
       - Time per meal
   └─> User taps "Generate Plan"

4. Step 3 - API Call
   └─> handleGenerateAIMealPlan()
   └─> POST /api/meals/plan with CreateMealPlanRequest
   └─> Response normalized to MealPlanResponse
   └─> setPlanModalStep('preview')

5. Step 4 - Preview & Accept
   └─> User reviews generated meals
   └─> User taps "Accept Plan"
   └─> handleAcceptGeneratedPlan()
   └─> setActiveMealPlan(generatedPlan)
   └─> setShowMealPlanSuccess(true)

6. Step 5 - Shopping List (Optional)
   └─> User taps "Send to Instacart"
   └─> handleSubmitToInstacart() ← NOT IMPLEMENTED
```

### Flow 2: Create Manual Meal

```
1. User taps "Create Meal" quick action
   └─> setViewMode('create')

2. User fills form:
   - Meal name (required)
   - Serving size
   - Nutrition (calories, protein, carbs, fat)
   - Ingredients (optional)
   - Tags (optional)
   - Notes (optional)

3. User taps "Save Meal"
   └─> handleSaveMeal()
   └─> POST /api/meals with mealService.createMeal()
   └─> Alert success
   └─> resetForm() or stay on page
```

### Flow 3: Scan Recipe

```
1. User taps "Scan Recipe" quick action
   └─> handleScanRecipe()

2. Camera opens
   └─> ImagePicker.launchCameraAsync()

3. User takes photo of recipe

4. API processes image
   └─> mealService.scanRecipe(uri, userId)
   └─> Returns extracted: name, nutrition, ingredients, instructions

5. Form auto-populates
   └─> setMealName(scannedRecipe.meal_name)
   └─> setCalories, setProtein, etc.
   └─> setIngredients(scannedIngredients)

6. User reviews/edits and saves
```

---

## Component Structure

```
CreateMeals (main component)
├── renderDashboard()
│   ├── GradientDashboardHeader
│   ├── Create AI Meal Plan Button
│   ├── renderDayPicker()
│   ├── Quick Actions Grid
│   ├── Today's Meals Section
│   ├── Quick Templates Section
│   ├── Recent Meals Section
│   └── Meal Planning & Shopping Section
│
├── renderCreateMealForm()
│   ├── Basic Information Section
│   ├── Nutrition Facts Section
│   ├── Ingredients Section
│   ├── Tags Section
│   ├── Notes Section
│   └── Action Buttons
│
├── renderLibraryModal()
│   ├── Header with search
│   ├── Filter tags
│   ├── Meals list
│   └── Meal cards with actions
│
├── renderPlanGeneratorModal()
│   ├── Step 1: Goals Selection
│   ├── Step 2: Customize Options
│   ├── Step 3: Preview Generated Plan
│   └── Step 4: Meals List
│
├── renderMealDetailsModal()
│   ├── Meal header with nutrition
│   ├── Servings adjuster
│   ├── Ingredients tab
│   ├── Instructions tab
│   └── Action buttons
│
└── renderMealPlanSuccessModal()
    ├── Success message
    ├── Plan summary
    └── Instacart button
```

---

## Required Backend API Updates

### 1. GET /api/meals/user/:userId

**Purpose**: Fetch user's saved meals for library view.

**Request**:
```http
GET /api/meals/user/test_user?search=chicken&tag=dinner&limit=50
```

**Response**:
```json
{
  "success": true,
  "data": {
    "meals": [
      {
        "meal_id": "meal_123",
        "user_id": "test_user",
        "name": "Grilled Chicken Salad",
        "nutrition": {
          "calories": 450,
          "protein": 35,
          "carbs": 20,
          "fat": 25
        },
        "ingredients": [...],
        "tags": ["dinner", "high_protein"],
        "is_favorite": true,
        "times_logged": 5,
        "created_at": "2026-01-01T00:00:00Z"
      }
    ],
    "total": 25
  }
}
```

### 2. GET /api/meals/calendar/:userId

**Purpose**: Fetch calendar data for date range.

**Request**:
```http
GET /api/meals/calendar/test_user?start=2026-01-01&end=2026-01-14
```

**Response**:
```json
{
  "success": true,
  "data": {
    "calendar_days": [
      {
        "date": "2026-01-06",
        "day_name": "Monday",
        "has_meals": true,
        "meals": [
          {
            "meal_id": "meal_123",
            "meal_type": "breakfast",
            "meal_name": "Oatmeal with Berries",
            "nutrition_per_serving": {
              "calories": 350,
              "protein": 12,
              "carbs": 55,
              "fat": 8
            }
          }
        ],
        "daily_macros_per_person": {
          "calories": 2100,
          "protein": 140,
          "carbs": 220,
          "fat": 75
        }
      }
    ]
  }
}
```

### 3. POST /api/meals/plan (Fix Response Format)

**Current Issue**: Response format varies, requiring extensive client normalization.

**Expected Response**:
```json
{
  "success": true,
  "program_id": "plan_abc123",
  "name": "7-Day Family Meal Plan",
  "description": "Easy family dinners for 4",
  "duration_days": 7,
  "servings": 4,
  "created_at": "2026-01-06T12:00:00Z",
  "days": [
    {
      "date": "2026-01-06",
      "day_number": 1,
      "day_name": "Monday",
      "meals": [
        {
          "meal_id": "meal_001",
          "meal_type": "dinner",
          "meal_name": "Grilled Chicken with Vegetables",
          "description": "Simple weeknight dinner",
          "calories": 550,
          "protein": 42,
          "carbs": 35,
          "fat": 25,
          "servings": 4,
          "prep_time_min": 15,
          "cook_time_min": 30,
          "ingredients": [
            { "name": "chicken breast", "amount": 1.5, "unit": "lbs" }
          ],
          "instructions": [
            "Preheat oven to 400°F",
            "Season chicken with salt and pepper"
          ]
        }
      ],
      "total_calories": 2100,
      "total_protein": 140,
      "total_carbs": 220,
      "total_fat": 75,
      "has_breakfast": true,
      "has_lunch": true,
      "has_dinner": true,
      "has_snacks": false
    }
  ],
  "summary": {
    "total_meals": 21,
    "avg_calories_per_day": 2100,
    "avg_protein_per_day": 140,
    "shopping_list_available": true
  },
  "preferences_used": {
    "stores": ["costco"],
    "dietary_restrictions": [],
    "cooking_skill": "intermediate",
    "meal_variety": "family_friendly"
  }
}
```

---

## Integration with Consumption Dashboard

The CreateMeals screen should integrate with the new **consumptionService** for:

1. **Logging meals from library** → `consumptionService.logFromRecipe()`
2. **Logging meals from meal plan** → `consumptionService.confirmPendingMeal()`
3. **Viewing consumption for a day** → Link to Nutrition Dashboard

---

## Testing Checklist

### Manual Testing

- [ ] Dashboard loads without errors
- [ ] Quick actions all navigate correctly
- [ ] AI meal plan generation completes
- [ ] Generated plan displays correctly
- [ ] Accept plan saves to state
- [ ] Manual meal creation saves
- [ ] Recipe scan extracts data
- [ ] Library search filters work
- [ ] Meal details modal shows all info
- [ ] Calendar navigation works
- [ ] Refresh pulls new data

### API Testing

- [ ] `POST /api/meals/plan` returns valid response
- [ ] `POST /api/meals` creates meal successfully
- [ ] `POST /api/meals/scan-recipe` extracts recipe from image
- [ ] All endpoints use `test_user` in dev mode

---

## Coach & Family Workflows

> **See [COACH_FAMILY_SHARING_GUIDE.md](COACH_FAMILY_SHARING_GUIDE.md) for complete documentation**

### Coach Creating Meals for Clients

Coaches can create and assign meal plans to their clients using the `coachService`:

```typescript
import { coachService, mealService } from '../services';

// Option 1: Assign existing meal plan
await coachService.assignMealProgram({
  coachId: user.coachId,
  clientId: selectedClient.id,
  programId: existingPlanId,
  startDate: '2026-01-20',
  notes: 'High protein for muscle building goals'
});

// Option 2: Create custom plan directly for client
await coachService.createMealPlanForClient({
  coachId: user.coachId,
  clientId: selectedClient.id,
  description: 'Low-carb meal plan for weight loss',
  duration: 14,
  mealsPerDay: { breakfast: true, lunch: true, dinner: true },
  servings: 2,
  dietaryRestrictions: ['gluten-free'],
  dailyCalorieTarget: 1800
});
```

**Available Coach Methods:**
- `coachService.assignMealProgram()` - Assign existing meal plan to client
- `coachService.getClientMealPrograms()` - Get client's assigned meal plans
- `coachService.unassignMealProgram()` - Remove meal plan from client
- `coachService.createMealPlanForClient()` - Create custom meal plan for client

### Family Sharing Meals

Parents can share meal plans with family members using the `familyService`:

```typescript
import { familyService, mealService } from '../services';

// 1. Parent creates meal plan
const mealPlan = await mealService.createMealPlanFromDescription({
  description: 'Kid-friendly healthy dinners for 4',
  duration: 7,
  mealsPerDay: { dinner: true },
  servings: 4,
  specialFocus: ['kid_friendly']
});

// 2. Share with family
await familyService.shareMealPlanWithFamily({
  familyId: user.familyId,
  programId: mealPlan.program_id,
  sharedBy: user.id,
  servings: 4,
  permission: 'USE',
  notes: 'This week\'s family dinner plan'
});

// 3. Get family's shared meal plans
const familyPlans = await familyService.getFamilyMealPlans(user.familyId);
```

**Available Family Methods:**
- `familyService.shareMealPlanWithFamily()` - Share meal plan with family
- `familyService.getFamilyMealPlans()` - Get family's shared meal plans
- `familyService.unshareMealPlan()` - Remove shared meal plan
- `familyService.assignMealPlanToMember()` - Assign to specific family member
- `familyService.shareShoppingListWithFamily()` - Share shopping list for collaborative checking

### Data Flow for Multi-User Contexts

```
┌─────────────────────────────────────────────────────────────────┐
│                    CreateMeals Screen                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   Personal    │  │    Coach      │  │    Family     │       │
│  │   Context     │  │    Context    │  │    Context    │       │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
│          │                  │                  │                │
│          ▼                  ▼                  ▼                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ mealService   │  │ coachService  │  │ familyService │       │
│  │ getUserMeals()│  │ createMealFor │  │ shareMealPlan │       │
│  │ createMeal()  │  │   Client()    │  │  WithFamily() │       │
│  └───────────────┘  │ assignMealPlan│  │ getFamilyMeal │       │
│                     │   ()          │  │   Plans()     │       │
│                     └───────────────┘  └───────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Priority Implementation Order

1. **🔴 Fix userId** - Ensure `test_user` used in dev (DONE in AuthContext)
2. **🔴 Replace mock data** - Implement real API calls in `loadDashboardData()`
3. **🟡 Standardize API response** - Work with backend to fix response format
4. **🟡 Connect calendar** - Real data instead of mock `hasMealPlanned()`
5. **🟡 Today's meals interactivity** - Show actual meals, add to day
6. **🟡 Coach context** - Add client selector for coach users
7. **🟡 Family context** - Add share button for family users
8. **🟢 Instacart integration** - Shopping list → Instacart
9. **🟢 Meal actions** - Edit, delete, log from details modal

---

## File Dependencies

```
src/screens/CreateMeals.tsx
├── src/services/mealService.ts
│   ├── createMealPlanFromDescription()
│   ├── createMeal()
│   ├── scanRecipe()
│   └── getTemplates()
├── src/services/coachService.ts (NEW - for coach workflow)
│   ├── assignMealProgram()
│   ├── createMealPlanForClient()
│   └── getClientMealPrograms()
├── src/services/familyService.ts (NEW - for family sharing)
│   ├── shareMealPlanWithFamily()
│   ├── getFamilyMealPlans()
│   └── shareShoppingListWithFamily()
├── src/services/mealPlanService.ts (legacy - minimize use)
│   ├── createMealPlan()
│   └── generateShoppingList()
├── src/context/AuthContext.tsx
│   └── user.id → userId
│   └── user.coachId → for coach context
│   └── user.familyId → for family context
├── mock-data-muscle-building-meal-plan.json ← TO BE REMOVED
├── mock-data-calendar-view.json ← TO BE REMOVED
└── mock-data-shopping-list.json ← TO BE REMOVED
```

