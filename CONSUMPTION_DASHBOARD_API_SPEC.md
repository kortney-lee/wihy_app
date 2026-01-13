# ConsumptionDashboard - Backend API Specification

**Created:** January 6, 2026  
**Updated:** January 6, 2026 (Confirmation Flow Added)  
**Backend Service:** `services.wihy.ai`  
**Mobile Screen:** `src/screens/ConsumptionDashboard.tsx`  
**Purpose:** Unified consumption tracking with confirmation-based meal logging

---

## 📋 Overview

The ConsumptionDashboard has **4 tabs** with distinct purposes:

| Tab | Purpose | Data Source | User Action |
|-----|---------|-------------|-------------|
| **Nutrition** | Daily totals & progress | Confirmed meals only | View progress |
| **Meals** | Pending meals to confirm | Meal Plans + Shopping List | "Did you eat this?" ✅❌ |
| **Recipes** | Browse all saved recipes | Recipe library from all sources | Select to log |
| **Shopping** | Shopping list items | Shopping lists | Mark as purchased/consumed |

### Key Concept: Confirmation Flow

**Meals are NOT auto-logged.** The flow is:
1. Meals from **meal plans** and **shopping lists** appear as "pending" in **Meals tab**
2. User sees "Did you eat this?" prompt
3. User confirms ✅ → Meal is logged to nutrition totals
4. User skips ❌ → Meal stays available or is dismissed

### Data Sources (Existing APIs We Can Use NOW)

| Source | API Available | Status |
|--------|---------------|--------|
| **Meal Plans** | `mealService.ts` | ✅ Ready |
| **Shopping Lists** | `shoppingService.ts` | ✅ Ready |
| **Recipes** | `mealService.ts` | ✅ Ready |
| **Scanned Foods** | `scanService.ts` | ✅ Ready |
| **Water Logs** | `nutritionService.ts` | ✅ Ready |

---

## 🍽️ TAB 1: NUTRITION (Daily Summary)

Shows **confirmed consumption only** - meals the user has marked as eaten.

### What It Displays
- Circular progress ring (84% daily goal achieved)
- Calorie count (current / target)
- Macro breakdown (P: 98g, C: 156g, F: 67g)
- Water progress

---

## 🥗 TAB 2: MEALS (Pending Confirmation)

Shows meals from **meal plans** and **shopping list** that are scheduled/available for today.

### User Flow
```
┌─────────────────────────────────────────┐
│  Greek Yogurt with Berries        245   │
│  8:00 AM (Breakfast)              cal   │
│  P: 18g  C: 28g  F: 6g                  │
│                                         │
│  Source: Today's Meal Plan              │
│                                         │
│  ┌─────────┐  ┌─────────────┐          │
│  │  ✅ Ate  │  │  ⏭️ Skip    │          │
│  └─────────┘  └─────────────┘          │
└─────────────────────────────────────────┘
```

### Data Sources for Meals Tab

1. **From Meal Plan** (scheduled for today)
   ```typescript
   // Get today's planned meals
   const todayMeals = await mealService.getDayPlan(userId, today);
   // Returns: { breakfast, lunch, dinner, snacks[] }
   ```

2. **From Shopping List** (purchased items available to eat)
   ```typescript
   // Get active shopping list with nutrition
   const shoppingList = await shoppingService.getList(listId);
   // Filter items marked as "purchased" but not "consumed"
   ```

### Pending Meals Response Structure

```json
{
  "pending_meals": [
    {
      "id": "pending_001",
      "name": "Greek Yogurt with Berries",
      "meal_type": "breakfast",
      "scheduled_time": "08:00",
      "source": "meal_plan",
      "source_id": "plan_abc",
      "recipe_id": "recipe_123",
      "nutrition": {
        "calories": 245,
        "protein_g": 18,
        "carbs_g": 28,
        "fat_g": 6
      },
      "status": "pending",
      "can_modify_servings": true,
      "default_servings": 1
    },
    {
      "id": "pending_002", 
      "name": "Chicken Breast",
      "meal_type": "available",
      "source": "shopping_list",
      "source_id": "list_xyz",
      "item_id": "item_456",
      "nutrition": {
        "calories": 165,
        "protein_g": 31,
        "carbs_g": 0,
        "fat_g": 3.6
      },
      "status": "purchased",
      "quantity_available": "2 lbs",
      "servings_available": 8
    }
  ]
}
```

---

## 📖 TAB 3: RECIPES (Browse All)

Shows **all saved recipes** from various sources - user can browse and select to log.

### Data Sources for Recipes Tab

```typescript
// Get user's meal library (custom meals)
const userMeals = await mealService.getUserMeals(userId);

// Get meal templates
const templates = await mealService.getTemplates();

// Get recipes from meal plans
const planRecipes = await mealService.getRecipesFromPlans(userId);

// Get scanned recipes (from recipe scanning)
const scannedRecipes = await scanService.getRecipeHistory(userId);
```

### Recipe Card Actions
- **View Details** → Shows full nutrition, ingredients
- **Log This Meal** → Opens portion selector → Confirms → Logs to Nutrition tab

### Recipes Response Structure

```json
{
  "recipes": [
    {
      "id": "recipe_001",
      "name": "Grilled Chicken Salad",
      "source": "user_created",
      "category": "lunch",
      "image_url": "https://...",
      "nutrition": {
        "calories": 387,
        "protein_g": 35,
        "carbs_g": 15,
        "fat_g": 18
      },
      "prep_time_min": 15,
      "tags": ["high-protein", "low-carb"],
      "last_logged": "2026-01-04"
    },
    {
      "id": "recipe_002",
      "name": "Protein Smoothie",
      "source": "scanned_recipe",
      "scan_id": "scan_xyz",
      "nutrition": {
        "calories": 195,
        "protein_g": 25,
        "carbs_g": 12,
        "fat_g": 4
      }
    },
    {
      "id": "recipe_003",
      "name": "Salmon with Quinoa",
      "source": "meal_plan",
      "plan_id": "plan_abc",
      "nutrition": {
        "calories": 565,
        "protein_g": 42,
        "carbs_g": 45,
        "fat_g": 22
      }
    }
  ],
  "categories": ["breakfast", "lunch", "dinner", "snack", "smoothie"],
  "sources": ["user_created", "scanned_recipe", "meal_plan", "template"]
}
```

---

## 🛒 TAB 4: SHOPPING (List Items)

Shows shopping list items with nutritional data. Items can be marked as:
- **Purchased** → Available to eat (appears in Meals tab)
- **Consumed** → Logged to nutrition

### Shopping List with Nutrition

```json
{
  "shopping_list": {
    "id": "list_123",
    "name": "Weekly Groceries",
    "status": "ACTIVE",
    "items": [
      {
        "id": "item_001",
        "name": "Chicken Breast",
        "quantity": "2 lbs",
        "category": "protein",
        "status": "purchased",
        "nutrition_per_serving": {
          "calories": 165,
          "protein_g": 31,
          "carbs_g": 0,
          "fat_g": 3.6
        },
        "servings_total": 8,
        "servings_consumed": 2,
        "servings_remaining": 6
      },
      {
        "id": "item_002",
        "name": "Brown Rice",
        "quantity": "2 lbs",
        "category": "grains",
        "status": "purchased",
        "nutrition_per_serving": {
          "calories": 216,
          "protein_g": 5,
          "carbs_g": 45,
          "fat_g": 1.8
        },
        "servings_total": 12,
        "servings_consumed": 0,
        "servings_remaining": 12
      }
    ],
    "nutrition_potential": {
      "total_calories": 4500,
      "total_protein_g": 320
    }
  }
}
```

---

## 🔄 CONFIRMATION ENDPOINTS (New)

### POST /api/consumption/confirm

**Purpose:** User confirms they ate a pending meal

```json
// Request
{
  "user_id": "user_abc123",
  "pending_meal_id": "pending_001",
  "servings": 1,
  "actual_time": "2026-01-06T08:15:00Z",
  "notes": "Had with coffee"
}

// Response
{
  "success": true,
  "data": {
    "log_id": "log_xyz789",
    "nutrition_logged": {
      "calories": 245,
      "protein_g": 18,
      "carbs_g": 28,
      "fat_g": 6
    },
    "daily_totals": {
      "calories": 1092,
      "protein_pct": 52
    },
    "pending_remaining": 3
  }
}
```

### POST /api/consumption/skip

**Purpose:** User skips/dismisses a pending meal

```json
// Request
{
  "user_id": "user_abc123",
  "pending_meal_id": "pending_001",
  "reason": "not_hungry",  // optional: not_hungry, ate_something_else, postponed
  "reschedule_to": null    // optional: reschedule to later time
}

// Response
{
  "success": true,
  "data": {
    "status": "skipped",
    "pending_remaining": 3
  }
}
```

### POST /api/consumption/log-from-recipe

**Purpose:** User selects a recipe from Recipes tab to log

```json
// Request
{
  "user_id": "user_abc123",
  "recipe_id": "recipe_001",
  "meal_type": "lunch",
  "servings": 1.5,
  "time": "2026-01-06T13:00:00Z"
}

// Response
{
  "success": true,
  "data": {
    "log_id": "log_abc456",
    "nutrition_logged": {
      "calories": 580,
      "protein_g": 52,
      "carbs_g": 22,
      "fat_g": 27
    }
  }
}
```

### POST /api/consumption/log-from-shopping

**Purpose:** User logs consumption from shopping list item

```json
// Request
{
  "user_id": "user_abc123",
  "shopping_list_id": "list_123",
  "item_id": "item_001",
  "servings": 1,
  "meal_type": "dinner",
  "time": "2026-01-06T19:00:00Z"
}

// Response
{
  "success": true,
  "data": {
    "log_id": "log_def789",
    "nutrition_logged": {
      "calories": 165,
      "protein_g": 31
    },
    "item_updated": {
      "servings_consumed": 3,
      "servings_remaining": 5
    }
  }
}
```

---

## 📱 INTERIM SOLUTION (No New Backend)

While waiting for the new `/api/consumption/*` endpoints, we can build the UI using **existing APIs**:

### Meals Tab - Use Existing APIs

```typescript
// ConsumptionDashboard.tsx - Meals Tab

const loadPendingMeals = async () => {
  // 1. Get today's meal plan
  const todayPlan = await mealService.getDayPlan(userId, new Date());
  
  // 2. Get active shopping list
  const shoppingList = await shoppingService.getList(activeListId);
  
  // 3. Combine into pending meals
  const pendingMeals = [
    ...todayPlan.meals.map(meal => ({
      ...meal,
      source: 'meal_plan',
      status: 'pending'
    })),
    ...shoppingList.items
      .filter(item => item.status === 'purchased')
      .map(item => ({
        ...item,
        source: 'shopping_list',
        status: 'available'
      }))
  ];
  
  return pendingMeals;
};
```

### Recipes Tab - Use Existing APIs

```typescript
// ConsumptionDashboard.tsx - Recipes Tab

const loadAllRecipes = async () => {
  // 1. Get user's custom meals
  const userMeals = await mealService.getUserMeals(userId);
  
  // 2. Get templates
  const templates = await mealService.getTemplates();
  
  // 3. Get scan history (food photos become recipes)
  const scanHistory = await scanService.getScanHistory(userId, { type: 'recipe' });
  
  // Combine all sources
  return [
    ...userMeals.map(m => ({ ...m, source: 'user_created' })),
    ...templates.map(t => ({ ...t, source: 'template' })),
    ...scanHistory.map(s => ({ ...s, source: 'scanned' }))
  ];
};
```

### Confirmation - Use Local State + Existing Nutrition API

```typescript
// When user confirms a meal
const confirmMeal = async (meal: PendingMeal, servings: number) => {
  // Use existing nutritionService to log
  await nutritionService.logMeal({
    userId,
    mealType: meal.meal_type,
    foodName: meal.name,
    calories: meal.nutrition.calories * servings,
    protein_g: meal.nutrition.protein_g * servings,
    carbs_g: meal.nutrition.carbs_g * servings,
    fat_g: meal.nutrition.fat_g * servings,
  });
  
  // Remove from pending list (local state)
  setPendingMeals(prev => prev.filter(m => m.id !== meal.id));
  
  // Refresh daily summary
  await loadDailySummary();
};
```

---

---

## 🎯 Primary Endpoint: GET /api/consumption/dashboard

### Purpose
Returns comprehensive daily/weekly consumption data with full micro & macro nutrient breakdown, aggregated from all input sources.

### Request

```
GET /api/consumption/dashboard
```

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `user_id` | string | ✅ Yes | User identifier | `user_abc123` |
| `date` | string | No | Specific date (YYYY-MM-DD), defaults to today | `2026-01-06` |
| `period` | string | No | `day`, `week`, `month` | `day` |
| `include_sources` | boolean | No | Include source breakdown | `true` |
| `include_trends` | boolean | No | Include comparison to previous period | `true` |

### Response Schema

```json
{
  "success": true,
  "data": {
    "summary": {
      "date": "2026-01-06",
      "period": "day",
      "last_updated": "2026-01-06T14:32:00Z"
    },
    
    "goals": {
      "calories": 2200,
      "protein_g": 150,
      "carbs_g": 220,
      "fat_g": 73,
      "fiber_g": 30,
      "sugar_g": 50,
      "water_ml": 2500,
      "sodium_mg": 2300,
      "saturated_fat_g": 20
    },
    
    "totals": {
      "calories": 1847,
      "protein_g": 98,
      "carbs_g": 156,
      "fat_g": 67,
      "fiber_g": 22,
      "sugar_g": 38,
      "saturated_fat_g": 15,
      "trans_fat_g": 0.5,
      "cholesterol_mg": 280,
      "sodium_mg": 1850,
      "potassium_mg": 2100,
      "calcium_mg": 450,
      "iron_mg": 12,
      "vitamin_a_mcg": 650,
      "vitamin_c_mg": 75,
      "vitamin_d_mcg": 8,
      "vitamin_b12_mcg": 3.2,
      "magnesium_mg": 280,
      "zinc_mg": 9
    },
    
    "progress": {
      "calories_pct": 84,
      "protein_pct": 65,
      "carbs_pct": 71,
      "fat_pct": 92,
      "fiber_pct": 73,
      "water_pct": 60,
      "overall_score": 78
    },
    
    "water": {
      "total_ml": 1500,
      "goal_ml": 2500,
      "glasses": 6,
      "glasses_goal": 10,
      "progress_pct": 60,
      "logs": [
        { "time": "08:15", "amount_ml": 250 },
        { "time": "10:30", "amount_ml": 350 },
        { "time": "12:45", "amount_ml": 250 },
        { "time": "14:00", "amount_ml": 250 },
        { "time": "16:30", "amount_ml": 200 },
        { "time": "18:00", "amount_ml": 200 }
      ]
    },
    
    "meals": [
      {
        "id": "meal_001",
        "meal_type": "breakfast",
        "name": "Greek Yogurt with Berries",
        "time": "08:00",
        "logged_at": "2026-01-06T08:05:00Z",
        "source": "manual",
        "source_id": null,
        "servings": 1,
        "nutrition": {
          "calories": 245,
          "protein_g": 18,
          "carbs_g": 28,
          "fat_g": 6,
          "fiber_g": 4,
          "sugar_g": 18,
          "saturated_fat_g": 2,
          "sodium_mg": 85,
          "calcium_mg": 200
        },
        "verified": true,
        "photo_url": null
      },
      {
        "id": "meal_002",
        "meal_type": "lunch",
        "name": "Grilled Chicken Salad",
        "time": "13:00",
        "logged_at": "2026-01-06T13:10:00Z",
        "source": "scan_food_photo",
        "source_id": "scan_xyz789",
        "servings": 1,
        "nutrition": {
          "calories": 387,
          "protein_g": 35,
          "carbs_g": 15,
          "fat_g": 18,
          "fiber_g": 6,
          "sugar_g": 4,
          "saturated_fat_g": 4,
          "sodium_mg": 520,
          "potassium_mg": 680
        },
        "verified": true,
        "photo_url": "https://storage.wihy.ai/scans/abc123.jpg",
        "confidence_score": 0.92
      },
      {
        "id": "meal_003",
        "meal_type": "snack",
        "name": "KIND Protein Bar",
        "time": "15:30",
        "logged_at": "2026-01-06T15:32:00Z",
        "source": "scan_barcode",
        "source_id": "scan_bar456",
        "barcode": "602652171093",
        "servings": 1,
        "nutrition": {
          "calories": 250,
          "protein_g": 12,
          "carbs_g": 18,
          "fat_g": 17,
          "fiber_g": 5,
          "sugar_g": 8,
          "saturated_fat_g": 4,
          "sodium_mg": 125
        },
        "verified": true,
        "brand": "KIND",
        "health_score": 72,
        "nova_group": 3
      },
      {
        "id": "meal_004",
        "meal_type": "dinner",
        "name": "Salmon with Quinoa",
        "time": "19:00",
        "logged_at": "2026-01-06T19:15:00Z",
        "source": "meal_plan",
        "source_id": "plan_meal_123",
        "meal_plan_id": "plan_abc",
        "recipe_id": "recipe_456",
        "servings": 1,
        "nutrition": {
          "calories": 565,
          "protein_g": 42,
          "carbs_g": 45,
          "fat_g": 22,
          "fiber_g": 7,
          "sugar_g": 3,
          "saturated_fat_g": 4,
          "sodium_mg": 420,
          "omega_3_g": 2.5
        },
        "verified": true,
        "prep_time_min": 25,
        "cook_time_min": 20
      }
    ],
    
    "by_meal_type": {
      "breakfast": {
        "count": 1,
        "calories": 245,
        "protein_g": 18,
        "carbs_g": 28,
        "fat_g": 6
      },
      "lunch": {
        "count": 1,
        "calories": 387,
        "protein_g": 35,
        "carbs_g": 15,
        "fat_g": 18
      },
      "dinner": {
        "count": 1,
        "calories": 565,
        "protein_g": 42,
        "carbs_g": 45,
        "fat_g": 22
      },
      "snack": {
        "count": 1,
        "calories": 250,
        "protein_g": 12,
        "carbs_g": 18,
        "fat_g": 17
      }
    },
    
    "by_source": {
      "manual": {
        "count": 1,
        "calories": 245,
        "percentage": 13
      },
      "scan_barcode": {
        "count": 1,
        "calories": 250,
        "percentage": 14
      },
      "scan_food_photo": {
        "count": 1,
        "calories": 387,
        "percentage": 21
      },
      "scan_label": {
        "count": 0,
        "calories": 0,
        "percentage": 0
      },
      "meal_plan": {
        "count": 1,
        "calories": 565,
        "percentage": 31
      },
      "shopping_list": {
        "count": 0,
        "calories": 0,
        "percentage": 0
      }
    },
    
    "trends": {
      "vs_yesterday": {
        "calories_diff": -153,
        "calories_pct_change": -8,
        "protein_diff": +12,
        "protein_pct_change": +14
      },
      "vs_week_avg": {
        "calories_diff": +47,
        "calories_pct_change": +3,
        "protein_diff": -5,
        "protein_pct_change": -5
      },
      "streak": {
        "days_on_track": 4,
        "type": "calories_goal"
      }
    },
    
    "recommendations": [
      {
        "type": "protein",
        "message": "You're 52g short on protein. Consider adding a protein shake or chicken breast.",
        "priority": "high"
      },
      {
        "type": "water",
        "message": "Drink 4 more glasses to hit your hydration goal.",
        "priority": "medium"
      },
      {
        "type": "fiber",
        "message": "Add more vegetables to increase fiber intake.",
        "priority": "low"
      }
    ],
    
    "shopping_list_nutrition": {
      "active_list_id": "list_123",
      "items_with_nutrition": [
        {
          "item_name": "Chicken Breast",
          "quantity": "2 lbs",
          "category": "protein",
          "per_serving": {
            "calories": 165,
            "protein_g": 31,
            "carbs_g": 0,
            "fat_g": 3.6
          },
          "total_servings": 8
        },
        {
          "item_name": "Brown Rice",
          "quantity": "2 lbs",
          "category": "grains",
          "per_serving": {
            "calories": 216,
            "protein_g": 5,
            "carbs_g": 45,
            "fat_g": 1.8
          },
          "total_servings": 12
        },
        {
          "item_name": "Broccoli",
          "quantity": "2 heads",
          "category": "produce",
          "per_serving": {
            "calories": 55,
            "protein_g": 3.7,
            "carbs_g": 11,
            "fat_g": 0.6,
            "fiber_g": 5.1
          },
          "total_servings": 6
        }
      ],
      "weekly_nutrition_potential": {
        "calories": 4500,
        "protein_g": 320,
        "carbs_g": 450,
        "fat_g": 120
      }
    }
  }
}
```

---

## 🔄 Supporting Endpoints

### POST /api/consumption/log

**Purpose:** Log a new food/meal consumption from any source

```json
// Request
{
  "user_id": "user_abc123",
  "meal_type": "lunch",
  "name": "Custom Chicken Bowl",
  "source": "manual",
  "source_id": null,
  "servings": 1.5,
  "time": "2026-01-06T12:30:00Z",
  "nutrition": {
    "calories": 450,
    "protein_g": 35,
    "carbs_g": 40,
    "fat_g": 15,
    "fiber_g": 6,
    "sugar_g": 5,
    "sodium_mg": 650
  },
  "photo_url": null,
  "notes": "Homemade with extra veggies"
}

// Response
{
  "success": true,
  "data": {
    "log_id": "log_xyz789",
    "daily_totals": {
      "calories": 1250,
      "protein_g": 85,
      "carbs_g": 120,
      "fat_g": 45
    },
    "progress": {
      "calories_pct": 57,
      "protein_pct": 57
    }
  }
}
```

**Source Types:**
- `manual` - User typed in manually
- `scan_barcode` - Scanned product barcode
- `scan_food_photo` - AI analyzed food photo
- `scan_label` - OCR from nutrition label
- `meal_plan` - From assigned meal plan
- `shopping_list` - From shopping list item
- `recipe` - From saved recipe

---

### POST /api/consumption/log-from-scan

**Purpose:** Log consumption directly from a completed scan

```json
// Request
{
  "user_id": "user_abc123",
  "scan_id": "scan_xyz789",
  "meal_type": "snack",
  "servings": 1,
  "time": "2026-01-06T15:30:00Z"
}

// Response
{
  "success": true,
  "data": {
    "log_id": "log_abc123",
    "nutrition_logged": {
      "calories": 250,
      "protein_g": 12,
      "carbs_g": 18,
      "fat_g": 17
    }
  }
}
```

---

### POST /api/consumption/log-from-meal-plan

**Purpose:** Mark a meal plan item as consumed

```json
// Request
{
  "user_id": "user_abc123",
  "meal_plan_id": "plan_abc",
  "meal_id": "meal_xyz",
  "servings": 1,
  "time": "2026-01-06T19:00:00Z",
  "notes": "Made with modifications"
}

// Response
{
  "success": true,
  "data": {
    "log_id": "log_plan123",
    "nutrition_logged": {
      "calories": 565,
      "protein_g": 42,
      "carbs_g": 45,
      "fat_g": 22
    }
  }
}
```

---

### POST /api/consumption/water

**Purpose:** Log water intake

```json
// Request
{
  "user_id": "user_abc123",
  "amount_ml": 250,
  "time": "2026-01-06T14:00:00Z",
  "container_type": "glass"
}

// Response  
{
  "success": true,
  "data": {
    "log_id": "water_789",
    "daily_total_ml": 1750,
    "goal_ml": 2500,
    "progress_pct": 70,
    "glasses_remaining": 3
  }
}
```

---

### GET /api/consumption/history

**Purpose:** Get detailed consumption history with filters

```
GET /api/consumption/history?user_id=X&start_date=2026-01-01&end_date=2026-01-06&meal_type=lunch&source=scan_barcode
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | ✅ Yes | User ID |
| `start_date` | string | No | Start date (YYYY-MM-DD) |
| `end_date` | string | No | End date (YYYY-MM-DD) |
| `meal_type` | string | No | Filter by meal type |
| `source` | string | No | Filter by source |
| `limit` | number | No | Max results (default 50) |
| `offset` | number | No | Pagination offset |

---

### DELETE /api/consumption/:log_id

**Purpose:** Delete a logged consumption entry

```
DELETE /api/consumption/log_xyz789?user_id=user_abc123
```

---

### PUT /api/consumption/:log_id

**Purpose:** Update a logged entry (change servings, time, etc.)

```json
// Request
{
  "user_id": "user_abc123",
  "servings": 2,
  "time": "2026-01-06T13:00:00Z",
  "notes": "Updated portion size"
}

// Response
{
  "success": true,
  "data": {
    "log_id": "log_xyz789",
    "updated_nutrition": {
      "calories": 500,
      "protein_g": 40
    }
  }
}
```

---

### GET /api/consumption/weekly-summary

**Purpose:** Get 7-day overview with daily breakdowns

```
GET /api/consumption/weekly-summary?user_id=X
```

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-12-30",
      "end": "2026-01-05"
    },
    "averages": {
      "calories": 1920,
      "protein_g": 105,
      "carbs_g": 180,
      "fat_g": 70,
      "water_ml": 2100
    },
    "goals_hit": {
      "calories": 5,
      "protein": 4,
      "water": 6
    },
    "days": [
      {
        "date": "2026-01-05",
        "day_name": "Sunday",
        "calories": 1847,
        "protein_g": 98,
        "carbs_g": 156,
        "fat_g": 67,
        "water_ml": 2200,
        "meals_logged": 4,
        "on_track": true
      },
      // ... 6 more days
    ],
    "top_foods": [
      { "name": "Grilled Chicken", "count": 5, "avg_calories": 280 },
      { "name": "Greek Yogurt", "count": 4, "avg_calories": 150 },
      { "name": "Brown Rice", "count": 3, "avg_calories": 220 }
    ],
    "sources_breakdown": {
      "manual": { "count": 12, "pct": 40 },
      "scan_barcode": { "count": 8, "pct": 27 },
      "scan_food_photo": { "count": 5, "pct": 17 },
      "meal_plan": { "count": 5, "pct": 16 }
    }
  }
}
```

---

## 📊 Micronutrient Tracking

### Full Nutrient List to Track

**Macronutrients:**
| Nutrient | Unit | RDI (Adult) | Priority |
|----------|------|-------------|----------|
| Calories | kcal | Varies | 🔴 Critical |
| Protein | g | 50-60g | 🔴 Critical |
| Carbohydrates | g | 250-300g | 🔴 Critical |
| Fat | g | 65-80g | 🔴 Critical |
| Fiber | g | 25-30g | 🔴 Critical |
| Sugar | g | <50g | 🔴 Critical |
| Saturated Fat | g | <20g | 🟡 Important |
| Trans Fat | g | <2g | 🟡 Important |
| Cholesterol | mg | <300mg | 🟡 Important |

**Minerals:**
| Nutrient | Unit | RDI (Adult) | Priority |
|----------|------|-------------|----------|
| Sodium | mg | <2300mg | 🔴 Critical |
| Potassium | mg | 4700mg | 🟡 Important |
| Calcium | mg | 1000mg | 🟡 Important |
| Iron | mg | 18mg | 🟡 Important |
| Magnesium | mg | 400mg | 🟢 Nice-to-have |
| Zinc | mg | 11mg | 🟢 Nice-to-have |
| Phosphorus | mg | 700mg | 🟢 Nice-to-have |

**Vitamins:**
| Nutrient | Unit | RDI (Adult) | Priority |
|----------|------|-------------|----------|
| Vitamin A | mcg | 900mcg | 🟡 Important |
| Vitamin C | mg | 90mg | 🟡 Important |
| Vitamin D | mcg | 20mcg | 🟡 Important |
| Vitamin E | mg | 15mg | 🟢 Nice-to-have |
| Vitamin K | mcg | 120mcg | 🟢 Nice-to-have |
| Vitamin B12 | mcg | 2.4mcg | 🟡 Important |
| Folate | mcg | 400mcg | 🟢 Nice-to-have |

**Special (for fitness users):**
| Nutrient | Unit | Notes | Priority |
|----------|------|-------|----------|
| Omega-3 | g | EPA + DHA | 🟢 Nice-to-have |
| Caffeine | mg | Pre-workout | 🟢 Nice-to-have |
| Creatine | g | Supplementation | 🟢 Nice-to-have |

---

## 🗄️ Database Schema

### Table: `consumption_logs`

```sql
CREATE TABLE consumption_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  
  -- Meal Info
  name VARCHAR(255) NOT NULL,
  meal_type VARCHAR(20) NOT NULL, -- breakfast, lunch, dinner, snack
  servings DECIMAL(4,2) DEFAULT 1.0,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE, -- actual eating time if different
  
  -- Source Tracking
  source VARCHAR(30) NOT NULL, -- manual, scan_barcode, scan_food_photo, scan_label, meal_plan, shopping_list, recipe
  source_id VARCHAR(100), -- foreign key to source record
  barcode VARCHAR(50),
  scan_id VARCHAR(100),
  meal_plan_id VARCHAR(100),
  recipe_id VARCHAR(100),
  
  -- Macros (per serving * servings)
  calories INTEGER NOT NULL,
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  fiber_g DECIMAL(6,2),
  sugar_g DECIMAL(6,2),
  
  -- Additional Macros
  saturated_fat_g DECIMAL(6,2),
  trans_fat_g DECIMAL(6,2),
  cholesterol_mg DECIMAL(6,2),
  
  -- Minerals
  sodium_mg DECIMAL(8,2),
  potassium_mg DECIMAL(8,2),
  calcium_mg DECIMAL(8,2),
  iron_mg DECIMAL(6,2),
  magnesium_mg DECIMAL(6,2),
  zinc_mg DECIMAL(6,2),
  
  -- Vitamins
  vitamin_a_mcg DECIMAL(8,2),
  vitamin_c_mg DECIMAL(6,2),
  vitamin_d_mcg DECIMAL(6,2),
  vitamin_b12_mcg DECIMAL(6,2),
  
  -- Metadata
  photo_url TEXT,
  notes TEXT,
  brand VARCHAR(100),
  health_score INTEGER,
  nova_group INTEGER,
  confidence_score DECIMAL(3,2),
  verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  INDEX idx_user_date (user_id, logged_at),
  INDEX idx_source (source, source_id),
  INDEX idx_meal_type (meal_type)
);
```

### Table: `water_logs`

```sql
CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL,
  container_type VARCHAR(20), -- glass, bottle, cup
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_user_date (user_id, logged_at)
);
```

### Table: `nutrition_goals`

```sql
CREATE TABLE nutrition_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) UNIQUE NOT NULL,
  
  -- Main Goals
  daily_calories INTEGER DEFAULT 2000,
  protein_g INTEGER DEFAULT 150,
  carbs_g INTEGER DEFAULT 200,
  fat_g INTEGER DEFAULT 65,
  fiber_g INTEGER DEFAULT 30,
  sugar_g INTEGER DEFAULT 50,
  water_ml INTEGER DEFAULT 2500,
  
  -- Additional Goals
  sodium_mg INTEGER DEFAULT 2300,
  saturated_fat_g INTEGER DEFAULT 20,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔗 Integration Points

### From Scan Service (ml.wihy)
When a scan is completed, the response includes nutrition data that can be logged:

```typescript
// After successful scan, user can log to consumption
const scanResult = await scanService.scanBarcode(barcode);

// Log to consumption
await consumptionService.logFromScan({
  user_id: userId,
  scan_id: scanResult.scan_id,
  meal_type: 'snack',
  servings: 1
});
```

### From Meal Plan Service
When user marks a meal plan item as eaten:

```typescript
// Get today's planned meal
const plannedMeal = await mealService.getTodaysMeals(userId);

// Log as consumed
await consumptionService.logFromMealPlan({
  user_id: userId,
  meal_plan_id: plannedMeal.plan_id,
  meal_id: plannedMeal.meals[0].meal_id,
  servings: 1
});
```

### From Shopping List
When user marks shopping list item as "consumed":

```typescript
// Get shopping list item with nutrition
const item = shoppingList.items[0];

// Log consumption
await consumptionService.log({
  user_id: userId,
  name: item.item_name,
  source: 'shopping_list',
  source_id: item.id,
  nutrition: item.nutrition
});
```

---

## 📱 Mobile Service Updates Needed

### New: `consumptionService.ts`

```typescript
import { API_CONFIG } from './config';

export interface ConsumptionDashboardData {
  summary: { date: string; period: string; last_updated: string };
  goals: NutritionGoals;
  totals: NutritionTotals;
  progress: NutritionProgress;
  water: WaterData;
  meals: ConsumptionMeal[];
  by_meal_type: MealTypeBreakdown;
  by_source: SourceBreakdown;
  trends: TrendsData;
  recommendations: Recommendation[];
  shopping_list_nutrition?: ShoppingListNutrition;
}

class ConsumptionService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = 'https://services.wihy.ai';
  }
  
  // Main dashboard endpoint
  async getDashboard(
    userId: string, 
    options?: { date?: string; period?: string; includeTrends?: boolean }
  ): Promise<ConsumptionDashboardData> {
    const params = new URLSearchParams({ user_id: userId });
    if (options?.date) params.append('date', options.date);
    if (options?.period) params.append('period', options.period);
    if (options?.includeTrends) params.append('include_trends', 'true');
    
    const response = await fetch(`${this.baseUrl}/api/consumption/dashboard?${params}`);
    const data = await response.json();
    return data.data;
  }
  
  // Log new consumption
  async log(entry: ConsumptionLogEntry): Promise<LogResponse> {
    const response = await fetch(`${this.baseUrl}/api/consumption/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    return response.json();
  }
  
  // Log from completed scan
  async logFromScan(params: { 
    user_id: string; 
    scan_id: string; 
    meal_type: string; 
    servings: number 
  }): Promise<LogResponse> {
    const response = await fetch(`${this.baseUrl}/api/consumption/log-from-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  }
  
  // Log water
  async logWater(params: { user_id: string; amount_ml: number }): Promise<WaterLogResponse> {
    const response = await fetch(`${this.baseUrl}/api/consumption/water`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  }
  
  // Delete entry
  async delete(logId: string, userId: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/consumption/${logId}?user_id=${userId}`, {
      method: 'DELETE'
    });
  }
  
  // Get history
  async getHistory(userId: string, options?: HistoryOptions): Promise<ConsumptionHistory> {
    const params = new URLSearchParams({ user_id: userId });
    // ... build params
    const response = await fetch(`${this.baseUrl}/api/consumption/history?${params}`);
    return response.json();
  }
  
  // Weekly summary
  async getWeeklySummary(userId: string): Promise<WeeklySummary> {
    const response = await fetch(`${this.baseUrl}/api/consumption/weekly-summary?user_id=${userId}`);
    const data = await response.json();
    return data.data;
  }
}

export const consumptionService = new ConsumptionService();
```

---

## ✅ Implementation Checklist

### 🚀 PHASE 1: BUILD NOW (No Backend Needed) - 2 days

Using **existing APIs** we can build the full UI with confirmation flow:

| Task | API Used | Time |
|------|----------|------|
| Meals Tab - Show pending meals | `mealService.getDayPlan()` | 4 hrs |
| Meals Tab - Show shopping items | `shoppingService.getList()` | 2 hrs |
| Recipes Tab - Show all recipes | `mealService.getUserMeals()` + `getTemplates()` | 3 hrs |
| Confirmation modal | Local state | 2 hrs |
| Log confirmed meal | `nutritionService.logMeal()` | 2 hrs |
| Nutrition Tab - Show totals | `nutritionService.getDailySummary()` | Already done |
| Shopping Tab | `shoppingService.getList()` | Already done |

**Total Phase 1: ~2 days (no backend changes)**

### 🔧 PHASE 2: Backend Enhancements - 5 days

| Task | New Endpoint | Time |
|------|--------------|------|
| Pending meals aggregation | `GET /api/consumption/pending` | 1 day |
| Confirm meal | `POST /api/consumption/confirm` | 0.5 day |
| Skip meal | `POST /api/consumption/skip` | 0.5 day |
| Log from recipe | `POST /api/consumption/log-from-recipe` | 0.5 day |
| Log from shopping | `POST /api/consumption/log-from-shopping` | 0.5 day |
| Unified dashboard | `GET /api/consumption/dashboard` | 1 day |
| Weekly summary | `GET /api/consumption/weekly-summary` | 1 day |

**Total Phase 2: ~5 days backend**

---

## 📊 Summary - What Can We Do NOW

### ✅ Works Today (Existing APIs)

| Feature | How |
|---------|-----|
| Show today's meal plan meals | `mealService.getDayPlan(userId, date)` |
| Show shopping list items | `shoppingService.getList(listId)` |
| Show user's saved recipes | `mealService.getUserMeals(userId)` |
| Show recipe templates | `mealService.getTemplates()` |
| Log a meal (after confirm) | `nutritionService.logMeal(meal)` |
| Show daily nutrition totals | `nutritionService.getDailySummary(userId)` |
| Log water intake | `nutritionService.logWater(water)` |
| Refresh data | Pull-to-refresh existing calls |

### ❌ Needs New Backend

| Feature | Why |
|---------|-----|
| Unified pending meals list | Needs aggregation across sources |
| Track "skipped" meals | Needs new status field |
| Servings consumed from shopping | Needs item-level tracking |
| Weekly trends & analytics | Needs aggregation queries |
| Source tracking on logs | Needs schema update |

---

## 🎯 Recommended Next Steps

### This Week (No Backend)
1. **Update ConsumptionDashboard.tsx** to implement confirmation flow
2. **Add Meals tab** showing meal plan + shopping items
3. **Add Recipes tab** showing all saved recipes
4. **Add confirmation modal** with portion selector
5. **Wire confirm → nutritionService.logMeal()**

### Next Sprint (With Backend)
1. Implement `POST /api/consumption/confirm`
2. Implement `POST /api/consumption/skip`
3. Implement `GET /api/consumption/pending`
4. Add source tracking to consumption logs
5. Build weekly analytics

---

## 📱 UI Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   CONSUMPTION DASHBOARD                      │
├─────────────────────────────────────────────────────────────┤
│  [Nutrition]  [Meals]  [Recipes]  [Shopping]                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  NUTRITION TAB (Default)                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         🍽️ 84% daily goal achieved                   │   │
│  │                                                      │   │
│  │            1847 / 2200 cal                           │   │
│  │                                                      │   │
│  │    P: 98g    C: 156g    F: 67g                      │   │
│  │    ███░░░    ████░░░    █████░░                      │   │
│  │    65%       71%        92%                          │   │
│  │                                                      │   │
│  │    💧 Water: 6/8 glasses                             │   │
│  │    ████████░░░░░░                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MEALS TAB (Confirmation Flow)                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📋 Today's Meals - 3 pending                        │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ 🌅 Breakfast (8:00 AM)                      │    │   │
│  │  │ Greek Yogurt with Berries          245 cal │    │   │
│  │  │ P: 18g  C: 28g  F: 6g                      │    │   │
│  │  │ 📍 From: Today's Meal Plan                 │    │   │
│  │  │                                            │    │   │
│  │  │  [✅ I Ate This]  [⏭️ Skip]  [✏️ Modify]   │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ 🍗 Available from Shopping                  │    │   │
│  │  │ Chicken Breast (6 servings left)   165 cal │    │   │
│  │  │ P: 31g  C: 0g  F: 4g                       │    │   │
│  │  │                                            │    │   │
│  │  │  [✅ Log Portion]  [📋 View Item]          │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RECIPES TAB (Browse & Log)                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔍 Search recipes...                                │   │
│  │                                                      │   │
│  │  [All] [My Meals] [Templates] [Scanned]             │   │
│  │                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐                 │   │
│  │  │ 🥗           │  │ 🍳           │                 │   │
│  │  │ Chicken      │  │ Protein      │                 │   │
│  │  │ Salad        │  │ Smoothie     │                 │   │
│  │  │ 387 cal      │  │ 195 cal      │                 │   │
│  │  │ [+ Log]      │  │ [+ Log]      │                 │   │
│  │  └──────────────┘  └──────────────┘                 │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

CONFIRMATION MODAL (when user taps "I Ate This" or "+ Log")
┌─────────────────────────────────────────────────────────────┐
│                    Log This Meal                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Greek Yogurt with Berries                                  │
│                                                             │
│  Meal Type:  [Breakfast ▼]                                  │
│                                                             │
│  Servings:   [ - ]  1.0  [ + ]                             │
│                                                             │
│  Time:       [8:15 AM ▼]                                    │
│                                                             │
│  ─────────────────────────────────────────                  │
│  Nutrition (1 serving):                                     │
│  Calories: 245    Protein: 18g                              │
│  Carbs: 28g       Fat: 6g                                   │
│  ─────────────────────────────────────────                  │
│                                                             │
│  [Cancel]                    [✅ Confirm & Log]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Endpoint Summary

| Endpoint | Method | Purpose | Priority | Phase |
|----------|--------|---------|----------|-------|
| `nutritionService.logMeal()` | POST | Log confirmed meal | ✅ Exists | Now |
| `mealService.getDayPlan()` | GET | Get today's meals | ✅ Exists | Now |
| `shoppingService.getList()` | GET | Get shopping items | ✅ Exists | Now |
| `mealService.getUserMeals()` | GET | Get saved recipes | ✅ Exists | Now |
| `/api/consumption/confirm` | POST | Confirm pending meal | 🔴 New | Phase 2 |
| `/api/consumption/skip` | POST | Skip pending meal | 🟡 New | Phase 2 |
| `/api/consumption/pending` | GET | Aggregated pending | 🟡 New | Phase 2 |
| `/api/consumption/dashboard` | GET | Unified dashboard | 🟡 New | Phase 2 |

**Can build 80% of UI NOW with existing APIs!**
