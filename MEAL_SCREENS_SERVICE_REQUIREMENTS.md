# Meal Screens Service Requirements

This document outlines all UI options and data structures used in the meal-related screens to ensure the backend service properly accounts for each option.

---

## 1. Meal Preferences Screen (`MealPreferencesScreen.tsx`)

The preferences screen collects user meal planning preferences to personalize meal suggestions.

### 1.1 Planning Focus Options

The user selects their **primary planning focus**. Only one can be selected.

| ID | Label | Description | Use Case |
|----|-------|-------------|----------|
| `family` | Family Meals | Easy recipes everyone loves, kid-friendly options, batch cooking & leftovers | Families with children, meal prep for the week |
| `quick_easy` | Quick & Easy | Under 30 minutes, simple ingredients, minimal cleanup | Busy professionals, weeknight dinners |
| `budget` | Budget-Friendly | Affordable ingredients, store brand options, meal prep to save money | Cost-conscious users, students |
| `health_fitness` | Health & Fitness | High protein, balanced macros, weight management focus, calorie tracking | Athletes, weight loss, health-conscious users |

**Service Requirement:**
```typescript
type PlanningFocus = 'family' | 'quick_easy' | 'budget' | 'health_fitness';
```

### 1.2 Dietary Needs Options

Users can select **multiple** dietary restrictions/preferences.

| ID | Label | Description |
|----|-------|-------------|
| `vegetarian` | Vegetarian | No meat, may include eggs and dairy |
| `vegan` | Vegan | No animal products whatsoever |
| `gluten_free` | Gluten-Free | No wheat, barley, rye, or gluten-containing ingredients |
| `dairy_free` | Dairy-Free | No milk, cheese, butter, or dairy products |
| `nut_allergy` | Nut Allergy | No tree nuts or peanuts |
| `kid_friendly` | Kid-Friendly | Simple flavors, familiar foods, no spicy ingredients |
| `low_carb` | Low Carb | Reduced carbohydrate content (typically <50g/day) |
| `diabetic_friendly` | Diabetic-Friendly | Low glycemic index, controlled carbs, no added sugars |

**Service Requirement:**
```typescript
type DietaryNeed = 
  | 'vegetarian' 
  | 'vegan' 
  | 'gluten_free' 
  | 'dairy_free' 
  | 'nut_allergy' 
  | 'kid_friendly' 
  | 'low_carb' 
  | 'diabetic_friendly';

// Array of selected needs
dietaryNeeds: DietaryNeed[];
```

### 1.3 Preferred Stores Options

Users can select **multiple** preferred grocery stores.

| ID | Label | Notes |
|----|-------|-------|
| `costco` | Costco | Bulk buying, warehouse club |
| `trader_joes` | Trader Joe's | Specialty items, unique products |
| `whole_foods` | Whole Foods | Organic, premium products |
| `walmart` | Walmart | Budget-friendly, wide selection |
| `kroger` | Kroger | Regional chain, loyalty program |
| `aldi` | Aldi | Discount grocery, store brands |
| `target` | Target | Grocery + general merchandise |
| `safeway` | Safeway | Regional chain, delivery available |

**Service Requirement:**
```typescript
type PreferredStore = 
  | 'costco' 
  | 'trader_joes' 
  | 'whole_foods' 
  | 'walmart' 
  | 'kroger' 
  | 'aldi' 
  | 'target' 
  | 'safeway';

preferredStores: PreferredStore[];
```

### 1.4 Cooking Skill Levels

Users select **one** skill level.

| ID | Label | Description | Recipe Complexity |
|----|-------|-------------|-------------------|
| `beginner` | Beginner | Simple recipes with basic techniques | 5-10 ingredients, no special equipment |
| `intermediate` | Intermediate | Some cooking experience | Moderate techniques, standard equipment |
| `advanced` | Advanced | Complex cooking techniques | Multi-step, specialized equipment, timing-critical |

**Service Requirement:**
```typescript
type CookingSkillLevel = 'beginner' | 'intermediate' | 'advanced';
```

### 1.5 Custom Brands (Optional)

Free-text field for preferred brands, comma-separated.

**Examples:** "Kirkland Signature, Organic Valley, Nature's Own, Store brands"

**Service Requirement:**
```typescript
preferredBrands: string[]; // Parsed from comma-separated input
```

### 1.6 Complete Preferences Interface

```typescript
interface MealPlanningPreferences {
  userId: string;
  planningFocus: PlanningFocus;
  dietaryNeeds: DietaryNeed[];
  preferredStores: PreferredStore[];
  preferredBrands: string[];
  cookingSkillLevel: CookingSkillLevel;
}
```

### 1.7 Service Endpoints Required

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /users/{userId}/meal-preferences` | GET | Retrieve existing preferences |
| `POST /users/{userId}/meal-preferences` | POST | Save/update preferences |

---

## 2. Meal Details Screen (`MealDetailsScreen.tsx`)

The meal details screen displays comprehensive information about a single meal/recipe.

### 2.1 Core Meal Detail Interface

```typescript
interface MealDetail {
  meal_id: string;
  name: string;
  description?: string;
  nutrition: NutritionInfo;
  ingredients: Ingredient[];
  instructions?: Instruction[];
  tags: string[];
  notes?: string;
  preparation_time?: number;  // in minutes
  cooking_time?: number;      // in minutes
  servings: number;
  is_favorite: boolean;
  cost_per_serving?: number;  // in USD
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisine?: string;           // e.g., "Italian", "Mexican", "Asian"
  meal_type?: string;         // e.g., "breakfast", "lunch", "dinner", "snack"
  image_url?: string;
  variations?: Variation[];
  tips?: string[];
  storage?: string;           // Storage instructions
  reheating?: string;         // Reheating instructions
}
```

### 2.2 Nutrition Information

All values are per serving.

```typescript
interface NutritionInfo {
  calories: number;
  protein: number;   // grams
  carbs: number;     // grams
  fat: number;       // grams
  fiber?: number;    // grams
  sodium?: number;   // milligrams
}
```

**UI Features:**
- Displays macro breakdown with progress bars
- Calculates percentages for visual representation
- Adjusts values based on servings multiplier

### 2.3 Ingredients

```typescript
interface Ingredient {
  name: string;
  amount: number;
  unit: string;        // e.g., "cup", "tbsp", "oz", "g"
  notes?: string;      // e.g., "diced", "room temperature"
  category?: string;   // e.g., "produce", "dairy", "protein", "pantry"
}
```

**UI Features:**
- Servings adjuster (1-20 servings)
- Dynamic ingredient amount calculation based on servings
- Category grouping for shopping list generation

**Servings Calculation:**
```typescript
const getAdjustedAmount = (originalAmount: number): number => {
  const ratio = selectedServings / originalServings;
  const adjusted = originalAmount * ratio;
  return Math.round(adjusted * 100) / 100;
};
```

### 2.4 Cooking Instructions

```typescript
interface Instruction {
  step: number;
  title?: string;       // Optional step title
  text: string;         // Main instruction text
  duration?: string;    // e.g., "5 min", "15 minutes"
  timer?: boolean;      // If true, show timer button
  temperature?: string; // e.g., "350°F", "180°C"
}
```

**UI Features:**
- Step-by-step numbered display
- Cooking mode (full-screen step navigation)
- Timer button for steps with duration
- Temperature indicators

### 2.5 Recipe Variations

```typescript
interface Variation {
  name: string;     // e.g., "Low-Carb Version"
  changes: string;  // Description of what to change
}
```

### 2.6 Difficulty Levels

| Value | Color | Description |
|-------|-------|-------------|
| `easy` | Green (#22c55e) | Simple recipes, beginner-friendly |
| `medium` | Yellow (#f59e0b) | Moderate complexity |
| `hard` | Red (#ef4444) | Advanced techniques required |

### 2.7 Service Endpoints Required

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /meals/{mealId}` | GET | Get full meal details |
| `POST /meals/{mealId}/favorite` | POST | Toggle favorite status |
| `POST /shopping-lists` | POST | Create shopping list from ingredients |

### 2.8 Shopping List Generation

When user clicks "Add to Shopping List":

```typescript
interface ShoppingListRequest {
  userId: string;
  name: string;  // e.g., "Shopping List - Chicken Stir Fry"
  items: ShoppingListItem[];
}

interface ShoppingListItem {
  name: string;
  quantity: number;   // Adjusted for servings
  unit: string;
  category?: string;
  checked: boolean;   // Always false initially
}
```

---

## 3. Meal Plan Details Screen (`MealPlanDetails.tsx`)

Currently a placeholder screen that will display meal plan information.

### 3.1 Route Parameters

```typescript
interface MealPlanDetailsParams {
  planId: string;
  planName: string;
}
```

### 3.2 Planned Features

The screen indicates these features are coming:

- Daily meal schedule
- Recipe details & instructions
- Nutritional information
- Shopping list integration

### 3.3 Navigation Actions

| Action | Destination | Parameters |
|--------|-------------|------------|
| View Shopping List | `CreateMeals` | `{ showShoppingList: true }` |
| Back to Chat | Previous screen | None |

---

## 4. Service API Summary

### 4.1 Preferences API

```typescript
// Save/Update Preferences
POST /api/meal-preferences
Body: MealPlanningPreferences

// Get Preferences
GET /api/users/{userId}/meal-preferences
Response: MealPlanningPreferences | null
```

### 4.2 Meals API

```typescript
// Get Meal Details
GET /api/meals/{mealId}
Response: MealDetail

// Toggle Favorite
POST /api/meals/{mealId}/favorite
Body: { userId: string, isFavorite: boolean }

// Get User's Favorite Meals
GET /api/users/{userId}/favorite-meals
Response: MealDetail[]
```

### 4.3 Shopping List API

```typescript
// Create Shopping List
POST /api/shopping-lists
Body: ShoppingListRequest
Response: {
  id: string;
  total_items: number;
  items_by_category: Record<string, ShoppingListItem[]>;
}
```

---

## 5. Validation Rules

### 5.1 Preferences Validation

| Field | Required | Validation |
|-------|----------|------------|
| `planningFocus` | Yes | Must be one of the valid PlanningFocus values |
| `dietaryNeeds` | No | Array of valid DietaryNeed values |
| `preferredStores` | No | Array of valid PreferredStore values |
| `preferredBrands` | No | Array of non-empty strings |
| `cookingSkillLevel` | No | Defaults to 'beginner' if not provided |

### 5.2 Meal Details Validation

| Field | Required | Validation |
|-------|----------|------------|
| `meal_id` | Yes | Non-empty string |
| `name` | Yes | Non-empty string |
| `nutrition` | Yes | All numeric values ≥ 0 |
| `ingredients` | Yes | At least 1 ingredient |
| `servings` | Yes | Integer ≥ 1 |
| `difficulty` | No | One of: 'easy', 'medium', 'hard' |

### 5.3 Servings Range

- Minimum: 1
- Maximum: 20
- Default: Recipe's original servings value

---

## 6. Error Handling

The service should handle these error scenarios:

| Scenario | Expected Response |
|----------|-------------------|
| Preferences not found | Return null or empty object (not error) |
| Meal not found | 404 with message |
| Invalid dietary need value | 400 with validation error |
| Invalid planning focus | 400 with validation error |
| Unauthorized user | 401 with auth error |
| Shopping list creation failed | 500 with retry guidance |

---

## 7. Localization Considerations

The following strings should be localizable:

- Planning focus labels and descriptions
- Dietary need labels
- Store names (some may vary by region)
- Cooking skill level labels and descriptions
- Difficulty level labels
- Unit names (cup, tbsp, oz, g, etc.)
- Error messages

---

## 8. Future Extensibility

The service should be designed to easily add:

- New planning focus options
- Additional dietary restrictions (halal, kosher, etc.)
- More grocery stores (regional variations)
- International unit conversions
- Meal rating system
- Recipe scaling beyond 20 servings
- Nutritional goal tracking integration
