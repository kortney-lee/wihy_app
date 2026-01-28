# Meal Diary & Library Integration Summary

## Overview

This document summarizes the integration between the meal planning system and the user.wihy.ai meal diary/library APIs.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Meal Planning Flow (services.wihy.ai)                     │
│  - Quick Mode (1-5 days)                                   │
│  - Plan Mode (7-30 days)                                   │
│  - Diet Mode (specific nutrition goals)                    │
│  - Saved Mode (reorder previous meals)                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Success Modal Actions                                      │
│  ✅ View Shopping List                                      │
│  ✅ Open Instacart                                          │
│  ✅ View in Calendar                                        │
│  ✅ Save Meal Plan                                          │
│  🆕 Log to Meal Diary (tracks consumption)                  │
│  🆕 Save Recipes to Library (save for reuse)                │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴─────────┐
        ▼                  ▼
┌──────────────┐   ┌───────────────────┐
│ Meal Diary   │   │  Meal Library     │
│ (user.wihy)  │   │  (user.wihy)      │
└──────────────┘   └───────────────────┘
```

## APIs Integrated

### 1. Meal Diary API (user.wihy.ai)
**Purpose:** Track daily meal consumption and nutrition progress

**Endpoints:**
- `GET /api/users/:userId/diary` - Fetch meals by date
- `POST /api/users/:userId/diary` - Log a meal
- `DELETE /api/users/:userId/diary/:logId` - Delete log entry

**Use Cases:**
- Log generated meal plans to track what user plans to eat
- Manual meal logging (individual foods/meals)
- View daily nutrition totals with progress bars
- Track hydration and other consumption metrics

### 2. Meal Library API (user.wihy.ai)
**Purpose:** Store user's recipe collection for reuse

**Endpoints:**
- `GET /api/users/:userId/recipes` - Fetch all recipes
- `POST /api/users/:userId/recipes` - Save a recipe
- `PATCH /api/users/:userId/recipes/:recipeId` - Toggle favorite
- `DELETE /api/users/:userId/recipes/:recipeId` - Delete recipe

**Use Cases:**
- Save generated meals as reusable recipes
- Build personal recipe collection
- Quick access to favorite meals
- Reorder from saved recipes (Saved Mode)

## New Components

### 1. mealDiaryService.ts
**Location:** `mobile/src/services/mealDiaryService.ts`

**Exports:**
- `mealDiaryService` - Diary tracking methods
- `mealLibraryService` - Recipe library methods
- Helper functions: `mealPlanToLogEntry()`, `mealPlanToRecipe()`

**Key Methods:**
```typescript
// Diary
await mealDiaryService.getDiaryByDate(userId, { days: 7 });
await mealDiaryService.logMeal(userId, mealData);
await mealDiaryService.logMultipleMeals(userId, meals);
await mealDiaryService.deleteMealLog(userId, logId);

// Library
await mealLibraryService.getRecipes(userId);
await mealLibraryService.saveRecipe(userId, recipe);
await mealLibraryService.toggleFavorite(userId, recipeId);
await mealLibraryService.deleteRecipe(userId, recipeId);
```

### 2. MealDiaryScreen.tsx
**Location:** `mobile/src/screens/MealDiaryScreen.tsx`

**Features:**
- Daily view of logged meals grouped by meal type
- Nutrition progress bars (calories, protein, carbs)
- Delete individual meal logs
- Filter by 7/14/30 days
- Pull to refresh
- Empty states for days with no logs

**Navigation:** Added to RootStackParamList as `MealDiary`

### 3. LogMealScreen.tsx
**Location:** `mobile/src/screens/LogMealScreen.tsx`

**Features:**
- Quick manual meal logging form
- Meal type selector (breakfast/lunch/dinner/snack)
- Nutrition input fields (calories, protein, carbs, fat)
- Optional fields (brand, serving size)
- Date picker
- Success feedback

**Navigation:** Added to RootStackParamList as `LogMeal`

## Integration Points in CreateMeals.tsx

### 1. Success Modal Buttons
**Location:** After meal plan generation success

**New Actions:**
```tsx
// Log to Meal Diary
handleLogToDiary() → Logs all meals from plan to diary with dates

// Save to Recipe Library  
handleSaveToLibrary() → Saves unique recipes to library for reuse
```

**User Flow:**
1. User generates meal plan (Quick/Plan/Diet mode)
2. Success modal shows with stats
3. User can:
   - Log entire plan to diary (track consumption schedule)
   - Save recipes to library (reuse in future)
   - View shopping list
   - Open Instacart
   - View in calendar

### 2. Library View Integration
**Location:** `loadLibraryMeals()` function

**Updated to:**
- Use `mealLibraryService.getRecipes()` instead of legacy API
- Map recipe format to SavedMeal format
- Client-side filtering for search and tags
- Refresh after saving new recipes

## Data Flow

### Logging Meals to Diary
```
Generated Meal Plan
  └─> For each day (0 to N):
       └─> For each meal in day:
            └─> Convert to LogMealRequest
                 - Calculate log date (today + dayIndex)
                 - Extract nutrition data
                 - Set meal type
            └─> POST to /api/users/:userId/diary
```

### Saving Recipes to Library
```
Generated Meal Plan
  └─> Extract unique meals (by name):
       └─> For each unique meal:
            └─> Convert to SavedRecipe
                 - Map nutrition format
                 - Extract ingredients
                 - Set meal type from timing
            └─> POST to /api/users/:userId/recipes
```

## User Scenarios

### Scenario 1: Plan & Track
1. User generates 7-day meal plan
2. Clicks "Log to Meal Diary" → All 7 days logged
3. Each day, user sees what they planned to eat
4. User can mark meals as consumed or adjust

### Scenario 2: Save Favorites
1. User generates meal plan with great recipes
2. Clicks "Save Recipes to Library" → Unique recipes saved
3. Later, user opens Meal Library
4. Sees saved recipes, can favorite them
5. Can use Saved Mode to reorder favorites

### Scenario 3: Manual Tracking
1. User ate something not in their plan
2. Navigates to Meal Diary
3. Clicks "+" to log meal
4. Fills in nutrition info
5. Meal added to today's log

## Testing Checklist

- [ ] Generate Quick mode plan → Log to diary → Check MealDiaryScreen shows all meals
- [ ] Generate Plan mode → Save to library → Check library modal shows saved recipes
- [ ] Navigate to MealDiaryScreen → View daily logs with progress bars
- [ ] Delete a diary log → Verify it's removed
- [ ] Navigate to LogMealScreen → Manually log a meal → Verify it appears in diary
- [ ] Save recipes → Open library → Verify they appear
- [ ] Toggle favorite on recipe → Verify state persists
- [ ] Filter library by meal type → Verify filtering works
- [ ] Search library → Verify search works

## Next Steps

1. **Add navigation routes** - Register MealDiaryScreen and LogMealScreen in app navigator
2. **Add diary access** - Add "View Diary" button to dashboard or health tab
3. **Sync with calendar** - Link calendar view with diary entries
4. **Nutrition insights** - Add weekly/monthly nutrition summaries
5. **Smart suggestions** - Suggest recipes based on diary patterns

## Files Modified

- ✅ `mobile/src/services/mealDiaryService.ts` (NEW - 450 lines)
- ✅ `mobile/src/screens/MealDiaryScreen.tsx` (NEW - 520 lines)
- ✅ `mobile/src/screens/LogMealScreen.tsx` (NEW - 350 lines)
- ✅ `mobile/src/screens/CreateMeals.tsx` (Modified - added buttons & handlers)
- ✅ `mobile/src/types/navigation.ts` (Modified - added route types)

## API Dependencies

- `user.wihy.ai` - Meal diary and library endpoints
- `services.wihy.ai` - Meal planning and generation
- AsyncStorage - Auth token storage
- React Navigation - Screen routing
