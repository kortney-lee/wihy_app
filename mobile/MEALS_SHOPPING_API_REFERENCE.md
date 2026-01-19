# Meals, Shopping & Instacart - Complete API Reference

> **Base URL**: `https://services.wihy.ai`  
> **Last Updated**: January 2026  
> **Service Files**: `mealService.ts`, `instacartService.ts`, `shoppingService.ts`, `mealPlanService.ts`

This document provides a complete reference for all meal planning, shopping, and Instacart APIs. It maps user journeys to API calls, ensuring all screens work end-to-end.

---

## Table of Contents

1. [User Journeys](#1-user-journeys)
2. [Meal Plan Creation](#2-meal-plan-creation)
3. [Meal Plan Management](#3-meal-plan-management)
4. [Individual Meals (Save, Edit, Delete)](#4-individual-meals-save-edit-delete)
5. [Meal Templates & Recipe Library](#5-meal-templates--recipe-library)
6. [Shopping Lists](#6-shopping-lists)
7. [Instacart Integration](#7-instacart-integration)
8. [User Preferences](#8-user-preferences)
9. [Nutrition Tracking](#9-nutrition-tracking)
10. [Health & Dietary Support](#10-health--dietary-support)
11. [Reference Libraries](#11-reference-libraries)
12. [Screen-to-API Mapping](#12-screen-to-api-mapping)
13. [Complete API Index](#13-complete-api-index)

---

## 1. User Journeys

### Journey 1: Create AI Meal Plan → Shop on Instacart
```
User selects dietary preferences → AI generates 7-day meal plan → User reviews meals
→ Generates shopping list → Sends to Instacart → Groceries delivered
```

**Screens**: `CreateMeals.tsx` → `ShoppingListScreen.tsx`  
**APIs Used**:
1. `GET getDiets()` - Load dietary options
2. `POST /api/meals/create-from-text` - Generate AI meal plan
3. `POST /api/meal-programs/{id}/shopping-list` - Generate shopping list
4. `POST /api/shopping-lists/{id}/instacart` - Create Instacart link

### Journey 2: Save Custom Meal → Add to Library → Reuse Later
```
User enters meal details → Adds ingredients → Saves to library
→ Later browses library → Adds meal to today's log
```

**Screens**: `CreateMeals.tsx` (manual mode) → `ConsumptionDashboard.tsx`  
**APIs Used**:
1. `POST /api/meals/create` - Save custom meal
2. `GET /api/meals/user/{userId}` - Browse saved meals
3. `POST /api/nutrition-tracking/log-meal` - Log consumed meal

### Journey 3: Browse Templates → Create Meal Plan
```
User browses recipe templates → Selects favorites → Generates meal plan from templates
```

**Screens**: `CreateMeals.tsx` (library view) → `ConsumptionDashboard.tsx`  
**APIs Used**:
1. `GET /api/meals/templates` - Browse templates
2. `POST /api/meal-programs` - Create meal plan from selections

### Journey 4: View Meal Plan → Follow Daily Schedule → Mark Eaten
```
User opens consumption dashboard → Views today's meals → Marks meal as eaten
→ Nutrition tracking updates automatically
```

**Screens**: `ConsumptionDashboard.tsx`  
**APIs Used**:
1. `GET /api/meal-programs?userId={userId}` - Get user's plans
2. `GET /api/meal-programs/{id}/days/{day}` - Get day's meals
3. `POST /api/meal-programs/{id}/days/{day}/meals/{mealId}/eaten` - Mark eaten

### Journey 5: View Meal Details → Adjust Servings → Create Shopping List
```
User taps meal → Views recipe details → Adjusts servings → Creates shopping list for single meal
```

**Screens**: `ConsumptionDashboard.tsx` → `MealDetailsScreen.tsx` → `ShoppingListScreen.tsx`  
**APIs Used**:
1. `GET /api/meals/{mealId}` - Get meal details
2. `POST /api/shopping-lists` - Create shopping list from meal

### Journey 6: Set Dietary Preferences → Personalized Recommendations
```
User sets dietary restrictions → Sets food exclusions → All future meal suggestions respect preferences
```

**Screens**: `MealPreferencesScreen.tsx`  
**APIs Used**:
1. `POST /api/users/meal-preferences` - Save dietary preferences
2. `PUT /api/users/{userId}/food-preferences` - Save food exclusions
3. `GET /api/meals/common-exclusions` - Show common exclusion suggestions

---

## 2. Meal Plan Creation

### `POST /api/meals/create-from-text`
**Service Method**: `mealService.createMealPlanFromDescription(request)`  
**Used By**: `CreateMeals.tsx` → `GoalSelectionMeals.tsx`  
**Purpose**: AI-powered meal plan generation with 3-mode architecture

#### Request - CreateMealPlanRequest

```typescript
{
  // === CORE FIELDS (always sent) ===
  mode: 'quick' | 'plan' | 'diet';   // REQUIRED - determines endpoint routing
  userId: string;                     // User ID or 'test_user'
  description: string;                // Natural language request
  duration: number;                   // Days (1 for quick, 7-30 for plan/diet)
  servings: number;                   // Number of servings (1-12)
  mealsPerDay: {                      // Which meals to generate
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snack?: boolean;
  };
  mealVariety: 'balanced' | 'family_friendly' | 'batch_cooking' | 'high_protein';
  dietaryRestrictions: string[];      // ['vegetarian', 'keto', 'gluten_free', ...]
  cookingComplexity: 'beginner' | 'intermediate' | 'advanced';
  timePerMeal: 'quick' | 'moderate' | 'no_preference';
  dailyCalorieTarget: number;         // Default: 2000
  macrosTarget: {                     // Percentage targets
    protein: number;                  // Default: 25
    carbs: number;                    // Default: 50
    fat: number;                      // Default: 25
  };

  // === QUICK MODE FIELDS (mode === 'quick') ===
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
  cuisineType?: 'american' | 'italian' | 'mexican' | 'asian' | 'mediterranean' | 'indian';
  timeConstraint?: 'quick' | 'moderate' | 'standard' | 'slow';
  // Description auto-built: "Generate a single dinner (italian cuisine) that is vegetarian, keto, quick prep time"

  // === PLAN MODE FIELDS (mode === 'plan') ===
  preferredStores?: string[];         // ['costco', 'trader_joes', 'walmart', 'whole_foods', 'kroger', 'aldi']
  // Description from user input or template

  // === DIET PROGRAM MODE FIELDS (mode === 'diet') ===
  fitnessGoal?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'energy' | 'gut_health' | 'anti_inflammatory';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  
  // === OPTIONAL PERSONALIZATION ===
  food_exclusions?: string[];         // Foods to never include
  favorite_foods?: string[];          // Foods to include more often
  ingredient_substitutions?: Record<string, string>;  // Auto-replace ingredients
  postal_code?: string;               // For shopping integration
  store_preference?: string;          // Preferred store for shopping
}
```

#### Dietary Restrictions Available (select up to 3 in Quick mode)

| Category | Options |
|----------|---------|
| Plant/Animal Based | `vegetarian`, `vegan`, `pescatarian` |
| Macros Focused | `keto`, `low_carb`, `high_protein` |
| Ancestral/Regional | `paleo`, `mediterranean` |
| Elimination | `whole30`, `carnivore` |
| Medical | `gluten_free`, `low_sodium`, `diabetic_friendly`, `fodmap_low`, `anti_inflammatory` |
| Timing | `intermittent_fasting` |
| Spiritual | `daniel_fast` |

#### Response - MealPlanResponse (Actual API Format)

```typescript
{
  success: boolean;
  mode: 'quick' | 'plan' | 'diet';
  timestamp: string;                    // ISO timestamp
  
  plan: {
    success: boolean;
    planType: 'meals';
    mealPlanId: string;                 // "meal_plan_1768850722808_test_user"
    originalRequest: string;            // User's description
    
    parsedRequest: {
      proteinSources: string;           // "High-Protein Variety"
      daysRequested: number;
      focus: string;                    // "General Health"
    };
    
    summary: {
      duration_days: number;
      total_meals: number;
      avg_calories_per_day: number;
      avg_protein_per_day: number;
      avg_carbs_per_day: number;
      avg_fat_per_day: number;
      total_calories_for_period: number;
      nutrition_per_day: {
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
      };
    };
    
    plan: {
      duration_days: number;
      total_meals: number;
      totalRecipes: number;
      recipes: Recipe[];                // One recipe per day
    };
    
    recommendedSnacks: Snack[];
    novaGuidance: NovaGuidance;
    intuitiveEating: IntuitiveEatingGuide;
    fastingGuidance: FastingGuide;
    seasoningLibrary: SeasoningLibrary;
  };
}

// Recipe structure
interface Recipe {
  id: string;                           // "recipe_1768850722808_0"
  name: string;                         // "Mediterranean Herb-Crusted Chicken"
  day: number;                          // 1-7
  novaRating: number;                   // 1-4 (NOVA food classification)
  flavorProfile: string;                // "Mediterranean, bright, herbaceous"
  seasonings: string[];                 // ["herbes de provence", "smoked paprika"]
  ingredients: string[];                // Full ingredient list with amounts
  instructions: string[];               // Step-by-step cooking instructions
  nutritionInfo: {
    calories: string;                   // "520"
    protein: string;                    // "52g"
    carbs: string;                      // "42g"
    fat: string;                        // "14g"
  };
  chefTips: string[];                   // Professional cooking tips
}

// Snack recommendation
interface Snack {
  name: string;
  novaRating: number;
  eatWhen: string;                      // "When genuinely hungry, hunger scale 3-4"
  calories: string;
}
```

#### ⚠️ Backend Issues to Fix (as of Jan 2026)

| Field Sent | Expected Behavior | Actual Behavior | Priority |
|------------|-------------------|-----------------|----------|
| `mealsPerDay: {breakfast: true, lunch: true, dinner: true}` | 21 meals (3/day × 7 days) | 7 meals (1/day) | 🔴 Critical |
| `dailyCalorieTarget: 2000` | ~2000 cal/day | ~495 cal/day | 🔴 Critical |
| `servings: 6` | 6 servings per recipe | Not reflected | 🟡 Medium |
| `dietaryRestrictions: ['paleo', 'low_carb']` | Exclude grains, limit carbs | Includes rice, pasta, grains | 🔴 Critical |
| Response structure | `days[].meals[]` | `plan.plan.recipes[]` | 🟡 Medium |

**Example**: Request with `breakfast: true, lunch: true, dinner: true` for 7 days should return:
```json
{
  "days": [
    { "day": 1, "meals": [
      { "meal_type": "breakfast", "name": "..." },
      { "meal_type": "lunch", "name": "..." },
      { "meal_type": "dinner", "name": "..." }
    ]},
    // ... 6 more days
  ],
  "summary": { "total_meals": 21, "avg_calories_per_day": 2000 }
}
```

**Frontend Workaround**: The `CreateMeals.tsx` normalizes responses to handle both formats.
```

### `POST /api/meal-programs`
**Service Method**: `mealService.createEnhancedMealPlan(request)`  
**Purpose**: Create structured meal program with full shopping integration

---

## 3. Meal Plan Management

### List User's Meal Plans
```
GET /api/meal-programs?userId={userId}
```
**Service Method**: `mealService.getUserMealPlans(userId)`  
**Used By**: `ConsumptionDashboard.tsx`

### Get Single Meal Plan
```
GET /api/meal-programs/{programId}
```
**Service Method**: `mealService.getProgram(programId)`

### Update Meal Plan
```
PUT /api/meal-programs/{programId}
```
**Service Method**: `mealService.updateProgram(programId, updates)`

### Delete Meal Plan
```
DELETE /api/meal-programs/{programId}
```
**Service Method**: `mealService.deleteMealPlan(programId)`

### Get Meal Plan Calendar View
```
GET /api/meal-programs/{programId}/calendar?startDate=2026-01-19&endDate=2026-01-26
```
**Service Method**: `mealService.getMealPlanCalendar(programId, options)`

### Get All Days in Plan
```
GET /api/meal-programs/{programId}/days
```
**Service Method**: `mealService.getMealPlanDays(programId, options)`

### Get Single Day's Meals
```
GET /api/meal-programs/{programId}/days/{dayNumber}
```
**Service Method**: `mealService.getMealPlanDay(programId, dayNumber)`  
**Used By**: `ConsumptionDashboard.tsx`

### Mark Meal as Eaten
```
POST /api/meal-programs/{programId}/days/{dayNumber}/meals/{mealId}/eaten
```
**Service Method**: `mealService.markMealAsEaten(programId, dayNumber, mealId)`  
**Purpose**: Updates consumption tracking, nutrition dashboard

---

## 4. Individual Meals (Save, Edit, Delete)

### Save Custom Meal (Manual Entry)
```
POST /api/meals/create
```
**Service Method**: `mealService.createMeal(userId, mealData)`  
**Used By**: `CreateMeals.tsx` (handleSaveMeal function)  
**Purpose**: User manually creates and saves a meal to their library

```typescript
// Request
{
  user_id: string;
  name: string;                      // "Grandma's Chicken Soup"
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients: [{
    name: string;
    amount: number;
    unit: string;
  }];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  tags?: string[];                   // ['high-protein', 'comfort-food']
  notes?: string;
  serving_size?: number;
  preparation_time?: number;
  cooking_time?: number;
  instructions?: string[];
}

// Response
{
  success: boolean;
  meal: {
    meal_id: string;
    created_at: string;
    ...
  }
}
```

### Get User's Saved Meals (My Library)
```
GET /api/meals/user/{userId}?limit=50&meal_type=lunch&tags=high-protein
```
**Service Method**: `mealService.getUserMeals(userId, filters)`  
**Used By**: `ConsumptionDashboard.tsx`, `CreateMeals.tsx` (library view)  
**Purpose**: Browse user's saved meal library

### Get Single Meal Details
```
GET /api/meals/{mealId}
```
**Service Method**: `mealService.getMeal(mealId)`  
**Used By**: `MealDetailsScreen.tsx`

### Update Existing Meal
```
PUT /api/meals/{mealId}
```
**Service Method**: `mealService.updateMeal(mealId, updates, userId)`

### Delete Meal from Library
```
DELETE /api/meals/{mealId}
```
**Service Method**: `mealService.deleteMeal(mealId, userId)`

### Toggle Meal Favorite
**Service Method**: `mealService.toggleFavorite(mealId, userId, currentStatus)`  
**Purpose**: Add/remove from favorites for quick access

---

## 5. Meal Templates & Recipe Library

### Browse Templates (Pre-made Recipes)
```
GET /api/meals/templates?category=breakfast&tags=quick,healthy&limit=20
```
**Service Method**: `mealService.getTemplates(options)`  
**Used By**: `CreateMeals.tsx`, `ConsumptionDashboard.tsx`, `IntegrationTestScreen.tsx`

### Get Single Template
```
GET /api/meals/templates/{templateId}
```
**Service Method**: `mealService.getTemplate(templateId)`

### Search Recipes
```
GET /api/recipes/search?q=chicken&limit=5&diet=keto
```
**Service Method**: `mealService.searchRecipes(params)`  
**Used By**: `IntegrationTestScreen.tsx`

### Get Recipe Details
```
GET /api/recipes/{recipeId}
```
**Service Method**: `mealService.getRecipe(recipeId)`

### Create New Recipe (Admin/Coach)
```
POST /api/recipes
```
**Service Method**: `mealService.createRecipe(recipe)`

### Scan Recipe from Image
```
POST /api/scan/recipe
```
**Service Method**: `mealService.scanRecipe(imageUri, userId)`  
**Purpose**: ML-powered recipe extraction from photos of recipes, cookbooks, etc.

---

## 6. Shopping Lists

### Create Shopping List
```
POST /api/shopping-lists
```
**Service Method**: `mealService.createShoppingList(options)`  
**Used By**: `MealDetailsScreen.tsx`

```typescript
{
  userId: string;
  mealIds?: string[];      // Create from specific meals
  programId?: string;      // Create from meal plan
  items?: ShoppingItem[];  // Manual items
}
```

### Generate Shopping List from Meal Plan
```
POST /api/meal-programs/{programId}/shopping-list
```
**Service Method**: `mealService.generateShoppingListFromPlan(programId, options)`  
**Used By**: `CreateMeals.tsx`

```typescript
{
  days?: number[];              // Which days to include (e.g., [1,2,3,4,5])
  servings?: number;            // Override servings
  aggregateIngredients?: boolean; // Combine duplicate ingredients
}
```

### Get User's Shopping Lists
```
GET /api/shopping-lists?userId={userId}
```
**Service Method**: `mealService.getUserShoppingLists(userId, options)`

### Get Single Shopping List
```
GET /api/shopping-lists/{listId}
```
**Service Method**: `mealService.getShoppingList(listId)`

### Update Shopping List (Check Items, Add Notes)
```
PUT /api/shopping-lists/{listId}
```
**Service Method**: `mealService.updateShoppingList(listId, updates)`

```typescript
{
  items?: [{
    id: string;
    checked?: boolean;
    notes?: string;
  }];
  status?: 'active' | 'completed';
}
```

### Delete Shopping List
```
DELETE /api/shopping-lists/{listId}
```
**Service Method**: `mealService.deleteShoppingList(listId)`

### Setup Shopping Preferences for Plan
```
POST /api/meal-programs/{programId}/shopping-setup
```
**Service Method**: `mealService.enhanceMealPlanShopping(programId, preferences)`  
**Purpose**: Configure preferred stores, brands, budget for a meal plan

---

## 7. Instacart Integration

### Get Nearby Retailers
```
GET /api/instacart/shopping-options?postalCode=90210
```
**Service Method**: `instacartService.getShoppingOptions(postalCode)`

```typescript
// Response
{
  location: { postalCode: string; countryCode: string };
  retailers: {
    all: Retailer[];
    byCategory: {
      organic?: Retailer[];
      budget?: Retailer[];
      premium?: Retailer[];
    };
  };
  recommendation: {
    closest?: Retailer;
    organic?: Retailer;
    budget?: Retailer;
  };
}
```

### Create Instacart Link from Meal Plan
```
POST /api/instacart/meal-plan/recipe
```
**Service Method**: `instacartService.createInstacartLinkFromMealPlan(mealPlanId)`  
**Used By**: `ShoppingListScreen.tsx`

```typescript
// Request
{ mealPlanId: number }

// Response
{
  productsLinkUrl: string;    // Opens Instacart with pre-filled cart
  ingredientCount: number;
  mealCount: number;
}
```

### Create Instacart Link from Single Meal
```
POST /api/instacart/meal/recipe
```
**Service Method**: `instacartService.createInstacartLinkFromMeal(mealId)`

### Send Shopping List to Instacart
```
POST /api/shopping-lists/{listId}/instacart
```
**Service Method**: `mealService.sendToInstacart(listId, options)`  
**Used By**: `CreateMeals.tsx`

```typescript
// Request
{
  postalCode?: string;
  retailer?: string;    // Preferred retailer
}

// Response
{
  url: string;          // Instacart cart URL
  itemCount: number;
}
```

### Get Available Stores by Location
```
GET /api/stores?postal_code=90210
```
**Service Method**: `mealService.getAvailableStores(postalCode)`

---

## 8. User Preferences

### Meal Planning Preferences

#### Save Meal Preferences
```
POST /api/users/meal-preferences
```
**Service Method**: `mealService.saveMealPreferences(preferences)`  
**Used By**: `MealPreferencesScreen.tsx`

```typescript
{
  userId: string;
  dietary_restrictions: string[];    // ['vegetarian', 'gluten_free']
  calorie_target: number;
  macro_targets: {
    protein_percent: number;
    carbs_percent: number;
    fat_percent: number;
  };
  meal_times: {
    breakfast: string;   // "07:30"
    lunch: string;
    dinner: string;
  };
  cooking_skill: 'beginner' | 'intermediate' | 'advanced';
  time_constraints: 'quick' | 'moderate' | 'no_preference';
}
```

#### Get Meal Preferences
```
GET /api/users/meal-preferences?userId={userId}
```
**Service Method**: `mealService.getMealPreferences(userId)`  
**Used By**: `MealPreferencesScreen.tsx`

### Shopping Preferences

#### Save Shopping Preferences
```
POST /api/users/shopping-preferences
```
**Service Method**: `mealService.saveShoppingPreferences(userId, preferences)`

#### Get Shopping Preferences
```
GET /api/users/shopping-preferences/{userId}
```
**Service Method**: `mealService.getShoppingPreferences(userId)`

### Food Exclusions (Dislikes/Allergies)

#### Get User's Food Preferences
```
GET /api/users/{userId}/food-preferences
```
**Service Method**: `mealService.getUserFoodPreferences(userId)`

#### Save Food Preferences
```
PUT /api/users/{userId}/food-preferences
```
**Service Method**: `mealService.saveUserFoodPreferences(userId, preferences)`

```typescript
{
  food_exclusions: string[];           // ['mushrooms', 'olives']
  favorite_foods: string[];            // ['chicken', 'rice']
  cuisine_preferences: string[];       // ['italian', 'mexican']
  cuisine_exclusions: string[];        // ['indian']
  texture_dislikes: string[];          // ['mushy', 'slimy']
  spice_tolerance: 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot';
  ingredient_substitutions: {          // Auto-replace in recipes
    'butter': 'olive oil',
    'milk': 'oat milk'
  };
}
```

#### Add Single Food Exclusion
```
POST /api/users/{userId}/food-preferences/exclusions
```
**Service Method**: `mealService.addFoodExclusion(userId, food)`

#### Remove Food Exclusion
```
DELETE /api/users/{userId}/food-preferences/exclusions/{food}
```
**Service Method**: `mealService.removeFoodExclusion(userId, food)`

#### Get Common Exclusions (Suggestions)
```
GET /api/meals/common-exclusions
```
**Service Method**: `mealService.getCommonExclusions()`

```typescript
// Response - helps users quickly select common dislikes
{
  categories: {
    dairy: ['cottage cheese', 'blue cheese', 'feta'],
    proteins: ['liver', 'sardines', 'anchovies', 'tofu'],
    vegetables: ['brussels sprouts', 'beets', 'okra'],
    seafood: ['oysters', 'mussels', 'squid'],
    textures: ['mushy', 'slimy', 'rubbery'],
    flavors: ['bitter', 'fishy', 'licorice']
  };
  most_common: ['mushrooms', 'olives', 'cilantro', 'liver', 'brussels sprouts'];
}
```

---

## 9. Nutrition Tracking

### Calculate Nutrition from Ingredients
```
POST /api/meals/calculate-nutrition
```
**Service Method**: `mealService.calculateNutrition(ingredients)`  
**Purpose**: Auto-calculate macros when user enters ingredients manually

```typescript
// Request
{
  ingredients: [{
    item: string;        // "chicken breast"
    amount: string;      // "8 oz"
  }]
}

// Response
{
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  ingredients_breakdown: [...];  // Per-ingredient nutrition
}
```

### Log Meal Consumption
```
POST /api/nutrition-tracking/log-meal
```
**Service Method**: `mealService.logMeal(userId, mealData)`  
**Purpose**: Track what user actually ate for nutrition dashboard

```typescript
{
  user_id: string;
  meal_id?: string;          // If logging existing meal
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  consumed_at: string;       // ISO timestamp
  servings: number;
  nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  notes?: string;
}
```

---

## 10. Health & Dietary Support

### Get Health Conditions for Meal Filtering
```
GET /api/meals/conditions
```
**Service Method**: `mealService.getHealthConditions()`  
**Purpose**: List conditions like diabetes, heart disease, IBS for filtered meal suggestions

### Get Meals for Specific Condition
```
GET /api/meals/for-condition?condition=diabetes&meal_type=lunch
```
**Service Method**: `mealService.getMealsForCondition(condition, options)`

### Get Full Day Plan for Conditions
```
GET /api/meals/day-plan?conditions=diabetes,low_sodium
```
**Service Method**: `mealService.getDayPlanForConditions(conditions)`  
**Purpose**: Complete day's meals optimized for health conditions

### Meal Type Quick Access

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/meals/breakfast?conditions=...` | `getBreakfastMeals()` | Get breakfast options |
| `GET /api/meals/lunch?conditions=...` | `getLunchMeals()` | Get lunch options |
| `GET /api/meals/dinner?conditions=...` | `getDinnerMeals()` | Get dinner options |
| `GET /api/meals/snacks?count=4&type=healthy` | `getSnacks()` | Get snack options |
| `GET /api/meals/soups?count=4&type=comfort` | `getSoups()` | Get soup recipes |

---

## 11. Reference Libraries

### Get Diet Options (Built-in)
**Service Method**: `mealService.getDiets()`  
**Purpose**: Returns 18 diet types with icons, descriptions, categories  
**Note**: Uses local data, no API call

```typescript
// Returns
[
  { id: 'keto', label: 'Ketogenic', icon: 'flame-outline', type: 'macronutrient', description: '...' },
  { id: 'mediterranean', label: 'Mediterranean', icon: 'boat-outline', type: 'regional', description: '...' },
  // ...18 total options
]
```

### NOVA Food Classification Guide
```
GET /api/meals/nova-guide
```
**Service Method**: `mealService.getNovaGuide()`  
**Purpose**: Explain NOVA food processing levels (1-4) for education

### Intuitive Eating Guide
```
GET /api/meals/intuitive-eating
```
**Service Method**: `mealService.getIntuitiveEatingGuide()`  
**Purpose**: 10 principles of intuitive eating for health education

### Fasting Protocols
```
GET /api/meals/fasting-protocols?protocol=16_8
```
**Service Method**: `mealService.getFastingProtocols(protocol?)`  
**Purpose**: Information on intermittent fasting schedules (16:8, 18:6, OMAD, etc.)

### Seasoning Library
```
GET /api/meals/seasoning-library
```
**Service Method**: `mealService.getSeasoningLibrary()`  
**Purpose**: Database of seasonings, spices, herbs for manual meal creation

### Seasoning Recommendations by Protein
```
GET /api/meals/seasoning-recommendations?protein=chicken
```
**Service Method**: `mealService.getSeasoningRecommendations(protein)`  
**Purpose**: Suggest seasonings that pair well with specific proteins

---

## 12. Screen-to-API Mapping

### CreateMeals.tsx
| User Action | API Endpoint | Method |
|-------------|--------------|--------|
| Load diet options | *(built-in)* | `getDiets()` |
| Generate AI meal plan | `POST /api/meals/create-from-text` | `createMealPlanFromDescription()` |
| **Save manual meal** | `POST /api/meals/create` | `createMeal()` |
| Browse templates | `GET /api/meals/templates` | `getTemplates()` |
| Generate shopping list | `POST /api/meal-programs/{id}/shopping-list` | `generateShoppingListFromPlan()` |
| Send to Instacart | `POST /api/shopping-lists/{id}/instacart` | `sendToInstacart()` |

### ConsumptionDashboard.tsx
| User Action | API Endpoint | Method |
|-------------|--------------|--------|
| Load user's meal plans | `GET /api/meal-programs?userId=` | `getUserMealPlans()` |
| Get today's meals | `GET /api/meal-programs/{id}/days/{day}` | `getMealPlanDay()` |
| Browse my saved meals | `GET /api/meals/user/{userId}` | `getUserMeals()` |
| Browse templates | `GET /api/meals/templates` | `getTemplates()` |
| Mark meal eaten | `POST .../meals/{mealId}/eaten` | `markMealAsEaten()` |
| Log custom meal | `POST /api/nutrition-tracking/log-meal` | `logMeal()` |

### MealPreferencesScreen.tsx
| User Action | API Endpoint | Method |
|-------------|--------------|--------|
| Load preferences | `GET /api/users/meal-preferences` | `getMealPreferences()` |
| Save preferences | `POST /api/users/meal-preferences` | `saveMealPreferences()` |
| Get exclusion suggestions | `GET /api/meals/common-exclusions` | `getCommonExclusions()` |

### MealDetailsScreen.tsx
| User Action | API Endpoint | Method |
|-------------|--------------|--------|
| Load meal details | `GET /api/meals/{mealId}` | `getMeal()` |
| Create shopping list | `POST /api/shopping-lists` | `createShoppingList()` |
| Toggle favorite | - | `toggleFavorite()` |

### ShoppingListScreen.tsx
| User Action | API Endpoint | Method |
|-------------|--------------|--------|
| Create Instacart link | `POST /api/instacart/meal-plan/recipe` | `createInstacartLinkFromMealPlan()` |
| Get nearby stores | `GET /api/instacart/shopping-options` | `getShoppingOptions()` |

---

## 13. Complete API Index

### ✅ Core APIs (18 endpoints - actively used)

| Endpoint | Method | Screen |
|----------|--------|--------|
| `POST /api/meals/create-from-text` | `createMealPlanFromDescription()` | CreateMeals |
| `POST /api/meals/create` | `createMeal()` | CreateMeals |
| `GET /api/meals/user/{userId}` | `getUserMeals()` | ConsumptionDashboard |
| `GET /api/meals/templates` | `getTemplates()` | CreateMeals, ConsumptionDashboard |
| `GET /api/meal-programs?userId=` | `getUserMealPlans()` | ConsumptionDashboard |
| `GET /api/meal-programs/{id}/days/{day}` | `getMealPlanDay()` | ConsumptionDashboard |
| `POST /api/meal-programs/{id}/shopping-list` | `generateShoppingListFromPlan()` | CreateMeals |
| `POST /api/shopping-lists/{id}/instacart` | `sendToInstacart()` | CreateMeals |
| `POST /api/shopping-lists` | `createShoppingList()` | MealDetailsScreen |
| `POST /api/instacart/meal-plan/recipe` | `createInstacartLinkFromMealPlan()` | ShoppingListScreen |
| `GET /api/users/meal-preferences` | `getMealPreferences()` | MealPreferencesScreen |
| `POST /api/users/meal-preferences` | `saveMealPreferences()` | MealPreferencesScreen |
| `GET /api/recipes/search` | `searchRecipes()` | IntegrationTestScreen |
| `GET /api/meal-programs` | `listPrograms()` | IntegrationTestScreen |

### 📋 Supporting APIs (46+ endpoints - available for use)

**Meal Management:**
- `GET /api/meals/{mealId}` - Get meal details
- `PUT /api/meals/{mealId}` - Update meal
- `DELETE /api/meals/{mealId}` - Delete meal
- `POST /api/meal-programs` - Create meal program
- `PUT /api/meal-programs/{id}` - Update program
- `DELETE /api/meal-programs/{id}` - Delete program
- `GET /api/meal-programs/{id}/calendar` - Calendar view
- `POST .../meals/{id}/eaten` - Mark meal eaten

**Shopping:**
- `GET /api/shopping-lists?userId=` - User's lists
- `GET /api/shopping-lists/{id}` - Single list
- `PUT /api/shopping-lists/{id}` - Update list
- `DELETE /api/shopping-lists/{id}` - Delete list
- `GET /api/stores?postal_code=` - Available stores
- `GET /api/instacart/shopping-options` - Nearby retailers
- `POST /api/instacart/meal/recipe` - Single meal to Instacart

**Preferences:**
- `POST /api/users/shopping-preferences` - Save shopping prefs
- `GET /api/users/shopping-preferences/{id}` - Get shopping prefs
- `GET /api/users/{id}/food-preferences` - Get food prefs
- `PUT /api/users/{id}/food-preferences` - Save food prefs
- `POST .../exclusions` - Add exclusion
- `DELETE .../exclusions/{food}` - Remove exclusion

**Health & Nutrition:**
- `POST /api/meals/calculate-nutrition` - Calculate macros
- `POST /api/nutrition-tracking/log-meal` - Log consumption
- `GET /api/meals/conditions` - Health conditions
- `GET /api/meals/for-condition` - Meals for condition
- `GET /api/meals/day-plan` - Day plan for conditions
- `GET /api/meals/breakfast|lunch|dinner|snacks|soups` - By type

**Reference:**
- `GET /api/meals/common-exclusions` - Common dislikes
- `GET /api/meals/nova-guide` - NOVA classification
- `GET /api/meals/intuitive-eating` - Eating principles
- `GET /api/meals/fasting-protocols` - Fasting info
- `GET /api/meals/seasoning-library` - Spice database
- `GET /api/meals/seasoning-recommendations` - Pairing suggestions

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│  MEAL PLANNING QUICK REFERENCE                              │
├─────────────────────────────────────────────────────────────┤
│  CREATE MEAL PLAN:                                          │
│    POST /api/meals/create-from-text                         │
│                                                             │
│  SAVE CUSTOM MEAL:                                          │
│    POST /api/meals/create                                   │
│                                                             │
│  BROWSE MY MEALS:                                           │
│    GET /api/meals/user/{userId}                             │
│                                                             │
│  GET SHOPPING LIST:                                         │
│    POST /api/meal-programs/{id}/shopping-list               │
│                                                             │
│  SEND TO INSTACART:                                         │
│    POST /api/shopping-lists/{id}/instacart                  │
└─────────────────────────────────────────────────────────────┘
```

---

*Generated from mealService.ts, instacartService.ts, and screen analysis - January 2026*
