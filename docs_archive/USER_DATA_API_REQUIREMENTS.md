# Create Meals Screen - User Data API Requirements

## Overview

The Create Meals screen currently uses hardcoded mock data. This document outlines the 2 APIs needed to make the "Recent Meals" and "Shopping Lists" sections work with real user data based on `user_id`.

---

## API 1: User Meal Diary (Recent Meals + Preferences)

### Endpoint
```
GET /api/users/{user_id}/meals/diary
```

### Purpose
Returns the user's logged/saved meals AND their dietary preferences for display in the "Recent Meals" section and for AI-powered meal suggestions.

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Max meals to return (default: 10) |
| offset | number | No | Pagination offset (default: 0) |
| meal_type | string | No | Filter: breakfast, lunch, dinner, snack |

### Response
```json
{
  "success": true,
  "user_id": "user_123",
  "dietary_preferences": {
    "diet_type": "keto",
    "dietary_restrictions": ["gluten-free", "dairy-free"],
    "allergies": ["peanuts", "shellfish"],
    "calorie_goal": 2000,
    "protein_goal": 150,
    "carb_goal": 50,
    "fat_goal": 130,
    "meals_per_day": 3,
    "preferred_cuisines": ["italian", "mexican", "asian"],
    "disliked_ingredients": ["cilantro", "olives"],
    "cooking_skill_level": "intermediate",
    "max_prep_time_minutes": 30,
    "budget_preference": "moderate"
  },
  "recent_meals": [
    {
      "meal_id": "meal_abc123",
      "name": "Protein-Packed Scramble with Toast",
      "meal_type": "breakfast",
      "nutrition": {
        "calories": 480,
        "protein": 38,
        "carbs": 32,
        "fat": 22
      },
      "ingredients": [
        { "name": "Eggs", "amount": 3, "unit": "large" },
        { "name": "Whole wheat toast", "amount": 2, "unit": "slices" }
      ],
      "tags": ["high-protein", "breakfast", "quick"],
      "is_favorite": true,
      "times_logged": 5,
      "last_logged": "2026-01-09T08:30:00Z",
      "created_at": "2025-12-15T10:00:00Z",
      "serving_size": 1,
      "preparation_time": 10,
      "cooking_time": 8,
      "instructions": ["Scramble eggs", "Toast bread", "Serve"],
      "image_url": "https://cdn.wihy.com/meals/scramble.jpg"
    },
    {
      "meal_id": "meal_def456",
      "name": "Grilled Chicken & Rice Power Bowl",
      "meal_type": "lunch",
      "nutrition": {
        "calories": 620,
        "protein": 52,
        "carbs": 45,
        "fat": 18
      },
      "ingredients": [
        { "name": "Chicken breast", "amount": 6, "unit": "oz" },
        { "name": "Brown rice", "amount": 1, "unit": "cup" },
        { "name": "Broccoli", "amount": 1, "unit": "cup" }
      ],
      "tags": ["high-protein", "lunch", "meal-prep"],
      "is_favorite": false,
      "times_logged": 3,
      "last_logged": "2026-01-08T12:15:00Z",
      "created_at": "2025-11-20T14:00:00Z"
    }
  ],
  "total_meals": 45,
  "has_more": true
}
```

### What This Enables
- **Recent Meals section**: Display user's actual logged meals (not hardcoded)
- **View Library**: Full paginated list of all saved meals
- **AI Meal Suggestions**: Use `dietary_preferences` for personalized recommendations
- **Meal Plan Generation**: Respect user's restrictions, allergies, and goals

---

## API 2: User Shopping Lists

### Endpoint
```
GET /api/users/{user_id}/shopping/lists
```

### Purpose
Returns the user's saved shopping lists with items and check status.

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter: "active", "completed", "all" (default: "active") |
| limit | number | No | Max lists to return (default: 5) |

### Response
```json
{
  "success": true,
  "user_id": "user_123",
  "shopping_lists": [
    {
      "list_id": "list_xyz789",
      "name": "Week of Jan 6-12",
      "status": "active",
      "created_at": "2026-01-06T12:00:00Z",
      "updated_at": "2026-01-09T15:30:00Z",
      "associated_meal_plan_id": "plan_456",
      "store_preference": "whole_foods",
      "estimated_total": 85.50,
      "total_items": 32,
      "checked_items": 8,
      "items": [
        {
          "item_id": "item_001",
          "name": "Chicken breast",
          "quantity": 2,
          "unit": "lbs",
          "category": "protein",
          "is_checked": false,
          "estimated_price": 12.99,
          "notes": "boneless, skinless",
          "aisle": "Meat & Seafood"
        },
        {
          "item_id": "item_002",
          "name": "Brown rice",
          "quantity": 1,
          "unit": "bag",
          "category": "grains",
          "is_checked": true,
          "estimated_price": 4.99,
          "aisle": "Rice & Grains"
        },
        {
          "item_id": "item_003",
          "name": "Broccoli",
          "quantity": 2,
          "unit": "heads",
          "category": "produce",
          "is_checked": false,
          "estimated_price": 3.99,
          "aisle": "Produce"
        }
      ],
      "categories_summary": {
        "protein": 5,
        "produce": 12,
        "dairy": 3,
        "grains": 4,
        "pantry": 6,
        "frozen": 2
      }
    }
  ],
  "total_lists": 3
}
```

### Supporting Endpoints (for full functionality)

#### Update Item Check Status
```
PATCH /api/shopping/lists/{list_id}/items/{item_id}
Body: { "is_checked": true }
```

#### Save Shopping List
```
POST /api/users/{user_id}/shopping/lists
Body: { full list object }
```

---

## Database Tables Needed

### 1. user_dietary_preferences
```sql
CREATE TABLE user_dietary_preferences (
  user_id VARCHAR(50) PRIMARY KEY,
  diet_type VARCHAR(30) DEFAULT 'none',
  dietary_restrictions JSONB DEFAULT '[]',
  allergies JSONB DEFAULT '[]',
  calorie_goal INT,
  protein_goal INT,
  carb_goal INT,
  fat_goal INT,
  meals_per_day INT DEFAULT 3,
  preferred_cuisines JSONB DEFAULT '[]',
  disliked_ingredients JSONB DEFAULT '[]',
  cooking_skill_level VARCHAR(20) DEFAULT 'intermediate',
  max_prep_time_minutes INT,
  budget_preference VARCHAR(20) DEFAULT 'moderate',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. user_meal_diary
```sql
CREATE TABLE user_meal_diary (
  meal_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  meal_type VARCHAR(20),
  nutrition JSONB NOT NULL,
  ingredients JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  is_favorite BOOLEAN DEFAULT FALSE,
  times_logged INT DEFAULT 1,
  last_logged TIMESTAMP,
  serving_size INT DEFAULT 1,
  preparation_time INT,
  cooking_time INT,
  instructions JSONB DEFAULT '[]',
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. user_shopping_lists
```sql
CREATE TABLE user_shopping_lists (
  list_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  associated_meal_plan_id VARCHAR(50),
  store_preference VARCHAR(50),
  estimated_total DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. shopping_list_items
```sql
CREATE TABLE shopping_list_items (
  item_id VARCHAR(50) PRIMARY KEY,
  list_id VARCHAR(50) NOT NULL REFERENCES user_shopping_lists(list_id),
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2),
  unit VARCHAR(30),
  category VARCHAR(50),
  is_checked BOOLEAN DEFAULT FALSE,
  estimated_price DECIMAL(10, 2),
  notes TEXT,
  aisle VARCHAR(100)
);
```

---

## Current vs. Required State

| Feature | Current Implementation | What's Needed |
|---------|----------------------|---------------|
| Recent Meals | Hardcoded from `mock-data-muscle-building-meal-plan.json` | API 1: `GET /api/users/{user_id}/meals/diary` |
| User Preferences | Not implemented | Included in API 1 response |
| Shopping Lists | Local AsyncStorage only | API 2: `GET /api/users/{user_id}/shopping/lists` |
| List Item Sync | Not synced | `PATCH /api/shopping/lists/{list_id}/items/{item_id}` |

---

## Client Changes Needed

Once APIs are ready, update `CreateMeals.tsx`:

```typescript
// Replace mock data loading with API calls
const loadUserData = async () => {
  const token = await authService.getAccessToken();
  
  // Load meal diary + preferences
  const diaryResponse = await fetch(
    `${API_BASE}/api/users/${userId}/meals/diary?limit=10`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const diary = await diaryResponse.json();
  
  setSavedMeals(diary.recent_meals);
  setUserPreferences(diary.dietary_preferences);
  
  // Load shopping lists
  const listsResponse = await fetch(
    `${API_BASE}/api/users/${userId}/shopping/lists?status=active`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const lists = await listsResponse.json();
  
  setShoppingLists(lists.shopping_lists);
};
```

---

## Summary

**2 APIs needed:**

1. **`GET /api/users/{user_id}/meals/diary`** - Returns recent meals + dietary preferences
2. **`GET /api/users/{user_id}/shopping/lists`** - Returns saved shopping lists with items

These will replace the hardcoded mock data and enable personalized, persistent user data across devices.
