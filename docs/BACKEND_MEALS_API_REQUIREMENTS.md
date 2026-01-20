# Backend Meals API Requirements

## Overview

The frontend app (`mealService.ts`) expects various meal endpoints at `services.wihy.ai/api/meals/*`. While the route prefix is registered, several specific endpoints are returning **404 Not Found** or not fully implemented.

**Current Status:** ⚠️ Partially implemented  
**Priority:** 🔴 HIGH (blocking meal library, saved meals, meal plans)

---

## 🚨 Known Issues to Fix

### Issue 1: Templates Endpoint Returns Wrong Format

**Endpoint:** `GET /api/meals/templates`

**Current Response (WRONG):**
```json
{
  "success": true,
  "meal": {
    "id": "templates",
    "name": "Sample Meal",
    "meal_type": "lunch",
    "nutrition": {...},
    "ingredients": [...],
    "user_id": "user_123",
    "created_at": "2026-01-20T17:19:02.836Z"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "templates": [
    {
      "template_id": "tmpl_001",
      "name": "Quick Oatmeal Bowl",
      "description": "Hearty oatmeal with fresh berries",
      "category": "breakfast",
      "nutrition": { "calories": 350, "protein": 12, "carbs": 55, "fat": 8 },
      "ingredients": [
        { "name": "Rolled Oats", "amount": 1, "unit": "cup" },
        { "name": "Mixed Berries", "amount": 0.5, "unit": "cup" }
      ],
      "tags": ["vegetarian", "quick", "high-fiber"],
      "preparation_time": 5,
      "cooking_time": 5,
      "servings": 1
    },
    {
      "template_id": "tmpl_002",
      "name": "Grilled Chicken Salad",
      "description": "Protein-rich salad with grilled chicken",
      "category": "lunch",
      ...
    }
  ]
}
```

**Problem:** The endpoint is returning a single `meal` object instead of a `templates` array. This causes `Cannot read property 'length' of undefined` errors in the frontend.

**Fix Required:** Return an array of template objects under the `templates` key.

---

### Issue 2: Create Meal Required Fields

**Endpoint:** `POST /api/meals/create`

**Current Behavior:** Returns 400 error if `meal_type` is missing

**Required Fields:**
- `user_id` ✅
- `name` ✅  
- `meal_type` ✅ (must be: `breakfast`, `lunch`, `dinner`, or `snack`)

**Optional Fields:**
- `nutrition` - Backend should calculate from ingredients if not provided
- `ingredients`
- `tags`
- `notes`
- `serving_size`
- `preparation_time`
- `cooking_time`

---

## Currently Working Endpoints

These endpoints appear to be working:

| Endpoint | Status |
|----------|--------|
| `POST /api/meals/create-from-text` | ✅ Working (AI meal generation) |

---

## Required Endpoints

### 1. Get User's Saved Meals

```
GET /api/meals/user/{userId}
GET /api/meals/user/{userId}?tags=breakfast&search=chicken&sort=created_at&order=desc&limit=20&offset=0
```

**Purpose:** Get all meals saved by a user (Meal Library)

**Query Parameters:**
- `tags` (optional): Filter by meal type/tags (breakfast, lunch, dinner, snack)
- `search` (optional): Search by name or ingredients
- `sort` (optional): `created_at` | `name` | `calories` | `times_logged`
- `order` (optional): `asc` | `desc`
- `limit` (optional): Results per page (default: 20)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "success": true,
  "meals": [
    {
      "meal_id": "meal_123",
      "user_id": "user_456",
      "name": "Grilled Chicken Salad",
      "description": "Healthy grilled chicken with mixed greens",
      "nutrition": {
        "calories": 450,
        "protein": 35,
        "carbs": 25,
        "fat": 22,
        "fiber": 8
      },
      "ingredients": [
        { "name": "Chicken Breast", "amount": 6, "unit": "oz" },
        { "name": "Mixed Greens", "amount": 2, "unit": "cups" }
      ],
      "instructions": ["Grill chicken...", "Toss with greens..."],
      "tags": ["lunch", "high-protein", "low-carb"],
      "is_favorite": true,
      "times_logged": 12,
      "serving_size": 1,
      "preparation_time": 15,
      "cooking_time": 20,
      "image_url": "https://storage.wihy.ai/meals/meal_123.jpg",
      "created_at": "2026-01-15T00:00:00Z",
      "updated_at": "2026-01-20T00:00:00Z"
    }
  ],
  "total_count": 45,
  "filtered_count": 12,
  "pagination": {
    "has_more": true,
    "offset": 0,
    "limit": 20
  }
}
```

---

### 2. Get Today's Meals

```
GET /api/meals/today/{userId}
```

**Purpose:** Get meals logged/scheduled for today

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-20",
    "meals": [...],
    "by_meal_type": {
      "breakfast": { "meals": [...], "total_calories": 450 },
      "lunch": { "meals": [...], "total_calories": 650 },
      "dinner": { "meals": [...], "total_calories": 800 },
      "snack": { "meals": [...], "total_calories": 200 }
    },
    "totals": {
      "calories": 2100,
      "protein_g": 120,
      "carbs_g": 180,
      "fat_g": 75
    },
    "meal_count": 4
  }
}
```

---

### 3. Get Active Meal Plan

```
GET /api/meals/active-plan/{userId}
```

**Purpose:** Get user's currently active meal plan

**Response:**
```json
{
  "success": true,
  "data": {
    "has_active_plan": true,
    "plan": {
      "program_id": "plan_789",
      "name": "7-Day Weight Loss Plan",
      "description": "Low-calorie balanced meals",
      "duration_days": 7,
      "start_date": "2026-01-20",
      "end_date": "2026-01-27",
      "days": [
        {
          "day_number": 1,
          "date": "2026-01-20",
          "meals": [...]
        }
      ],
      "summary": {
        "total_meals": 21,
        "avg_calories_per_day": 1800
      }
    }
  }
}
```

---

### 4. Get Meal Calendar

```
GET /api/meals/calendar/{userId}?start=2026-01-20&end=2026-01-27
```

**Purpose:** Get meals scheduled for a date range (calendar view)

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_456",
    "start_date": "2026-01-20",
    "end_date": "2026-01-27",
    "days": [
      {
        "date": "2026-01-20",
        "day_name": "Monday",
        "meals": [
          {
            "meal_id": "meal_123",
            "meal_type": "breakfast",
            "name": "Oatmeal with Berries",
            "scheduled_time": "08:00",
            "calories": 350,
            "logged": true
          }
        ],
        "total_calories": 1850,
        "has_breakfast": true,
        "has_lunch": true,
        "has_dinner": true
      }
    ]
  }
}
```

---

### 5. Create/Save a Meal

```
POST /api/meals/create
```

**Purpose:** Save a new meal to user's library

**Request Body:**
```json
{
  "user_id": "user_456",
  "name": "Grilled Chicken Salad",
  "description": "Healthy grilled chicken with mixed greens",
  "nutrition": {
    "calories": 450,
    "protein": 35,
    "carbs": 25,
    "fat": 22
  },
  "ingredients": [
    { "name": "Chicken Breast", "amount": 6, "unit": "oz" }
  ],
  "instructions": ["Grill chicken...", "Toss with greens..."],
  "tags": ["lunch", "high-protein"],
  "serving_size": 1,
  "preparation_time": 15,
  "cooking_time": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meal_id": "meal_new123",
    "created_at": "2026-01-20T16:00:00Z"
  }
}
```

---

### 6. Get Meal by ID

```
GET /api/meals/{mealId}
```

**Purpose:** Get details of a specific meal

**Response:**
```json
{
  "success": true,
  "data": {
    "meal_id": "meal_123",
    "name": "Grilled Chicken Salad",
    "nutrition": {...},
    "ingredients": [...],
    "instructions": [...],
    ...
  }
}
```

---

### 7. Update Meal

```
PUT /api/meals/{mealId}
```

**Purpose:** Update an existing meal

**Request Body:** Same as create, but partial updates allowed

---

### 8. Delete Meal

```
DELETE /api/meals/{mealId}
```

**Purpose:** Delete a meal from user's library

---

### 9. Calculate Nutrition

```
POST /api/meals/calculate-nutrition
```

**Purpose:** Calculate nutrition from ingredients list

**Request Body:**
```json
{
  "ingredients": [
    { "name": "Chicken Breast", "amount": 6, "unit": "oz" },
    { "name": "Olive Oil", "amount": 1, "unit": "tbsp" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "calories": 320,
    "protein": 42,
    "carbs": 0,
    "fat": 16,
    "fiber": 0,
    "sodium": 150
  }
}
```

---

### 10. Get Meal Templates

```
GET /api/meals/templates
GET /api/meals/templates?category=breakfast&dietary=vegetarian
```

**Purpose:** Get pre-made meal templates for quick selection

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "template_id": "tmpl_001",
        "name": "Quick Oatmeal Bowl",
        "category": "breakfast",
        "dietary": ["vegetarian"],
        "nutrition": {...},
        "ingredients": [...],
        "prep_time": 5
      }
    ]
  }
}
```

---

### 11. Get Template by ID

```
GET /api/meals/templates/{templateId}
```

---

### 12. Get Health Conditions for Meal Planning

```
GET /api/meals/conditions
```

**Purpose:** Get list of health conditions for meal customization

**Response:**
```json
{
  "success": true,
  "data": {
    "conditions": [
      { "id": "diabetes", "name": "Diabetes", "dietary_notes": "Low glycemic..." },
      { "id": "heart_disease", "name": "Heart Disease", "dietary_notes": "Low sodium..." },
      { "id": "celiac", "name": "Celiac Disease", "dietary_notes": "Gluten-free..." }
    ]
  }
}
```

---

### 13. Get Meals for Condition

```
GET /api/meals/for-condition?condition=diabetes&meal_type=lunch
```

**Purpose:** Get meals suitable for a specific health condition

---

### 14. Get Day Plan

```
GET /api/meals/day-plan?conditions=diabetes,heart&calories=1800
```

**Purpose:** Get a full day of meals for specific conditions/goals

---

### 15. Get Breakfast Meals

```
GET /api/meals/breakfast
GET /api/meals/breakfast?conditions=diabetes
```

---

### 16. Get Lunch Meals

```
GET /api/meals/lunch
GET /api/meals/lunch?conditions=diabetes
```

---

### 17. Get Dinner Meals

```
GET /api/meals/dinner
GET /api/meals/dinner?conditions=diabetes
```

---

### 18. Get Snacks

```
GET /api/meals/snacks?count=3&type=sweet
```

---

### 19. Get Common Exclusions

```
GET /api/meals/common-exclusions
```

**Purpose:** Get common food exclusions/allergies

**Response:**
```json
{
  "success": true,
  "data": {
    "exclusions": [
      { "id": "gluten", "name": "Gluten" },
      { "id": "dairy", "name": "Dairy" },
      { "id": "nuts", "name": "Tree Nuts" },
      { "id": "shellfish", "name": "Shellfish" }
    ]
  }
}
```

---

## Meal Plans Endpoints

### 20. Get User's Meal Plans

```
GET /api/meal-programs
GET /api/meal-programs?userId={userId}
```

**Purpose:** Get all saved meal plans for a user

**Response:**
```json
{
  "success": true,
  "programs": [
    {
      "program_id": "plan_789",
      "name": "7-Day Weight Loss Plan",
      "description": "Low-calorie balanced meals",
      "duration_days": 7,
      "created_at": "2026-01-15T00:00:00Z",
      "is_active": true,
      "completion_percentage": 42
    }
  ]
}
```

---

### 21. Get Meal Plan Details

```
GET /api/meal-programs/{programId}
```

**Purpose:** Get full details of a specific meal plan

---

### 22. Save/Create Meal Plan

```
POST /api/meal-programs
```

**Purpose:** Save a generated meal plan to user's library

**Request Body:**
```json
{
  "user_id": "user_456",
  "name": "My Custom Plan",
  "description": "7-day balanced eating plan",
  "duration_days": 7,
  "days": [
    {
      "day_number": 1,
      "meals": [...]
    }
  ]
}
```

---

### 23. Activate Meal Plan

```
PUT /api/meal-programs/{programId}/activate
```

**Purpose:** Set a meal plan as the active plan

---

### 24. Delete Meal Plan

```
DELETE /api/meal-programs/{programId}
```

---

## Database Schema

### saved_meals table
```sql
CREATE TABLE saved_meals (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  nutrition JSONB, -- {calories, protein, carbs, fat, fiber, sodium}
  ingredients JSONB, -- [{name, amount, unit}]
  instructions JSONB, -- ["Step 1...", "Step 2..."]
  tags JSONB DEFAULT '[]', -- ["breakfast", "high-protein"]
  is_favorite BOOLEAN DEFAULT false,
  times_logged INT DEFAULT 0,
  serving_size INT DEFAULT 1,
  preparation_time INT, -- minutes
  cooking_time INT, -- minutes
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_saved_meals_user ON saved_meals(user_id);
CREATE INDEX idx_saved_meals_tags ON saved_meals USING GIN(tags);
CREATE INDEX idx_saved_meals_name ON saved_meals(name);
```

### meal_programs table
```sql
CREATE TABLE meal_programs (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_days INT DEFAULT 7,
  is_active BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  days JSONB, -- Full meal plan structure
  summary JSONB, -- {total_meals, avg_calories_per_day}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meal_programs_user ON meal_programs(user_id);
CREATE INDEX idx_meal_programs_active ON meal_programs(is_active);
```

### meal_logs table
```sql
CREATE TABLE meal_logs (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id),
  meal_id VARCHAR(50) REFERENCES saved_meals(id),
  meal_type VARCHAR(20), -- breakfast, lunch, dinner, snack
  logged_date DATE NOT NULL,
  logged_time TIME,
  servings DECIMAL(4,2) DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, logged_date);
CREATE INDEX idx_meal_logs_meal ON meal_logs(meal_id);
```

### meal_templates table
```sql
CREATE TABLE meal_templates (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- breakfast, lunch, dinner, snack
  dietary JSONB DEFAULT '[]', -- ["vegetarian", "gluten-free"]
  nutrition JSONB,
  ingredients JSONB,
  instructions JSONB,
  prep_time INT,
  cook_time INT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meal_templates_category ON meal_templates(category);
CREATE INDEX idx_meal_templates_dietary ON meal_templates USING GIN(dietary);
```

---

## Error Response Format

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `MEAL_NOT_FOUND` - Meal ID doesn't exist
- `PLAN_NOT_FOUND` - Meal plan ID doesn't exist
- `USER_NOT_FOUND` - User ID doesn't exist
- `INVALID_INGREDIENTS` - Invalid ingredient format
- `UNAUTHORIZED` - Not authorized for this action

---

## Testing

```bash
# Test get user's meals
curl -X GET "https://services.wihy.ai/api/meals/user/user_123" \
  -H "X-Client-ID: wihy_services_test" \
  -H "X-Client-Secret: [secret]"

# Test get today's meals
curl -X GET "https://services.wihy.ai/api/meals/today/user_123" \
  -H "X-Client-ID: wihy_services_test" \
  -H "X-Client-Secret: [secret]"

# Test get active meal plan
curl -X GET "https://services.wihy.ai/api/meals/active-plan/user_123" \
  -H "X-Client-ID: wihy_services_test" \
  -H "X-Client-Secret: [secret]"

# Test get meal calendar
curl -X GET "https://services.wihy.ai/api/meals/calendar/user_123?start=2026-01-20&end=2026-01-27" \
  -H "X-Client-ID: wihy_services_test" \
  -H "X-Client-Secret: [secret]"

# Test save meal
curl -X POST "https://services.wihy.ai/api/meals/create" \
  -H "X-Client-ID: wihy_services_test" \
  -H "X-Client-Secret: [secret]" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_123", "name": "Test Meal", "nutrition": {"calories": 500}}'
```

---

## Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/meals/user/{userId}` | GET | Get user's saved meals |
| `/api/meals/today/{userId}` | GET | Get today's meals |
| `/api/meals/active-plan/{userId}` | GET | Get active meal plan |
| `/api/meals/calendar/{userId}` | GET | Get meal calendar |
| `/api/meals/create` | POST | Save a new meal |
| `/api/meals/{mealId}` | GET | Get meal details |
| `/api/meals/{mealId}` | PUT | Update meal |
| `/api/meals/{mealId}` | DELETE | Delete meal |
| `/api/meals/calculate-nutrition` | POST | Calculate nutrition |
| `/api/meals/templates` | GET | Get meal templates |
| `/api/meals/templates/{id}` | GET | Get template details |
| `/api/meals/conditions` | GET | Get health conditions |
| `/api/meals/for-condition` | GET | Get meals for condition |
| `/api/meals/day-plan` | GET | Get full day plan |
| `/api/meals/breakfast` | GET | Get breakfast meals |
| `/api/meals/lunch` | GET | Get lunch meals |
| `/api/meals/dinner` | GET | Get dinner meals |
| `/api/meals/snacks` | GET | Get snacks |
| `/api/meals/common-exclusions` | GET | Get food exclusions |
| `/api/meal-programs` | GET | Get user's meal plans |
| `/api/meal-programs/{id}` | GET | Get meal plan details |
| `/api/meal-programs` | POST | Save meal plan |
| `/api/meal-programs/{id}/activate` | PUT | Activate meal plan |
| `/api/meal-programs/{id}` | DELETE | Delete meal plan |

---

## Contact

Frontend service file: `mobile/src/services/mealService.ts`

Related screens:
- `CreateMeals.tsx` - Meal planning and library
- `ConsumptionDashboard.tsx` - Daily meal tracking
