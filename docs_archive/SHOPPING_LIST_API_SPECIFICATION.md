# Shopping List API Specification

## Overview

The mobile app requires shopping list endpoints to persist and manage shopping lists generated from meal plans. This enables users to:
- View shopping lists across sessions and devices
- Check off items as they shop
- Generate Instacart links from shopping lists
- Share lists with family members

## Required Endpoints

### 1. Get User's Shopping Lists

**Endpoint:** `GET /api/shopping-lists`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User's ID |
| limit | number | No | Max results (default: 10) |
| status | string | No | Filter: 'active', 'completed', 'all' |

**Response:**
```json
{
  "success": true,
  "lists": [
    {
      "list_id": "sl_abc123",
      "name": "Muscle Building Plan - Week 1",
      "created_at": "2026-01-08T10:30:00Z",
      "updated_at": "2026-01-08T14:20:00Z",
      "status": "active",
      "meal_plan_id": "mp_xyz789",
      "total_items": 24,
      "checked_items": 5,
      "estimated_total_cost": 85.50,
      "items_by_category": {
        "Proteins": [
          {
            "id": "item_001",
            "name": "Chicken Breast",
            "quantity": 2,
            "unit": "lbs",
            "category": "Proteins",
            "checked": false,
            "estimated_price": 12.99
          }
        ],
        "Produce": [...],
        "Dairy": [...],
        "Grains": [...],
        "Pantry": [...],
        "Other": [...]
      }
    }
  ],
  "total_count": 3
}
```

---

### 2. Get Single Shopping List

**Endpoint:** `GET /api/shopping-lists/:listId`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| listId | string | Shopping list ID |

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "list": {
    "list_id": "sl_abc123",
    "name": "Muscle Building Plan - Week 1",
    "created_at": "2026-01-08T10:30:00Z",
    "updated_at": "2026-01-08T14:20:00Z",
    "status": "active",
    "user_id": "user_123",
    "meal_plan_id": "mp_xyz789",
    "duration_days": 7,
    "total_items": 24,
    "checked_items": 5,
    "estimated_total_cost": 85.50,
    "instacart_url": null,
    "items": [
      {
        "id": "item_001",
        "name": "Chicken Breast",
        "quantity": 2,
        "unit": "lbs",
        "category": "Proteins",
        "checked": false,
        "brand_suggestion": "Perdue",
        "store_suggestion": "Costco",
        "estimated_price": 12.99,
        "notes": ""
      },
      {
        "id": "item_002",
        "name": "Eggs",
        "quantity": 24,
        "unit": "count",
        "category": "Proteins",
        "checked": true,
        "estimated_price": 6.99
      }
    ],
    "items_by_category": {
      "Proteins": [...],
      "Produce": [...],
      "Dairy": [...],
      "Grains": [...],
      "Pantry": [...],
      "Other": [...]
    }
  }
}
```

---

### 3. Create Shopping List

**Endpoint:** `POST /api/shopping-lists`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user_123",
  "name": "Muscle Building Plan - Week 1",
  "mealPlanId": "mp_xyz789",
  "items": [
    {
      "name": "Chicken Breast",
      "quantity": 2,
      "unit": "lbs",
      "category": "Proteins"
    },
    {
      "name": "Broccoli",
      "quantity": 3,
      "unit": "heads",
      "category": "Produce"
    },
    {
      "name": "Greek Yogurt",
      "quantity": 32,
      "unit": "oz",
      "category": "Dairy"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "list": {
    "list_id": "sl_abc123",
    "name": "Muscle Building Plan - Week 1",
    "created_at": "2026-01-08T10:30:00Z",
    "status": "active",
    "total_items": 24,
    "items_by_category": {...}
  }
}
```

---

### 4. Generate Shopping List from Meal Plan

**Endpoint:** `POST /api/meal-programs/:programId/shopping-list`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| programId | string | Meal program/plan ID |

**Request Body:**
```json
{
  "startDay": 1,
  "endDay": 7,
  "servings": 1,
  "consolidateIngredients": true,
  "preferredStores": ["Costco", "Whole Foods"]
}
```

**Response:**
```json
{
  "success": true,
  "list": {
    "list_id": "sl_generated_001",
    "name": "Shopping List - High Protein Diet (Days 1-7)",
    "meal_plan_id": "mp_xyz789",
    "total_items": 32,
    "estimated_total_cost": 95.00,
    "items_by_category": {
      "Proteins": [
        {
          "id": "item_001",
          "name": "Chicken Breast",
          "quantity": 4,
          "unit": "lbs",
          "category": "Proteins",
          "checked": false,
          "source_meals": ["Day 1 Lunch", "Day 2 Dinner", "Day 4 Lunch"],
          "estimated_price": 25.99
        }
      ],
      "Produce": [...],
      "Dairy": [...],
      "Grains": [...],
      "Pantry": [...],
      "Other": [...]
    }
  }
}
```

---

### 5. Update Shopping List (Check Items)

**Endpoint:** `PUT /api/shopping-lists/:listId`

**Request Body (partial update):**
```json
{
  "items": [
    {
      "id": "item_001",
      "checked": true
    },
    {
      "id": "item_002",
      "checked": true
    }
  ]
}
```

**Or full update:**
```json
{
  "name": "Updated List Name",
  "status": "completed",
  "items": [...]
}
```

**Response:**
```json
{
  "success": true,
  "list": {
    "list_id": "sl_abc123",
    "updated_at": "2026-01-08T15:30:00Z",
    "total_items": 24,
    "checked_items": 12,
    "status": "active"
  }
}
```

---

### 6. Delete Shopping List

**Endpoint:** `DELETE /api/shopping-lists/:listId`

**Response:**
```json
{
  "success": true,
  "message": "Shopping list deleted"
}
```

---

### 7. Send to Instacart

**Endpoint:** `POST /api/shopping-lists/:listId/instacart`

**Request Body:**
```json
{
  "preferences": {
    "storeType": "grocery",
    "preferOrganic": false,
    "budget": "moderate",
    "substitutionPreference": "allow"
  }
}
```

**Response:**
```json
{
  "success": true,
  "cart_url": "https://instacart.com/cart/abc123...",
  "expires_at": "2026-01-08T22:30:00Z",
  "estimated_total": 89.99,
  "items_matched": 22,
  "items_not_found": 2,
  "substitutions": [
    {
      "original": "Organic Free-Range Eggs",
      "substituted": "Cage-Free Eggs",
      "price_difference": -2.00
    }
  ]
}
```

---

## Data Models

### ShoppingList
```typescript
interface ShoppingList {
  list_id: string;
  user_id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  meal_plan_id?: string;
  created_at: string;
  updated_at: string;
  total_items: number;
  checked_items: number;
  estimated_total_cost?: number;
  instacart_url?: string;
  items: ShoppingListItem[];
  items_by_category: Record<string, ShoppingListItem[]>;
}
```

### ShoppingListItem
```typescript
interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'Proteins' | 'Produce' | 'Dairy' | 'Grains' | 'Pantry' | 'Other';
  checked: boolean;
  brand_suggestion?: string;
  store_suggestion?: string;
  estimated_price?: number;
  notes?: string;
  source_meals?: string[];  // Which meals this ingredient is for
}
```

### Category Mapping
Items should be categorized based on these rules:

| Category | Keywords/Examples |
|----------|-------------------|
| Proteins | chicken, beef, fish, salmon, eggs, tofu, tempeh, turkey, pork, shrimp |
| Produce | vegetables, fruits, broccoli, spinach, apple, banana, lettuce, tomato |
| Dairy | milk, cheese, yogurt, butter, cream, cottage cheese |
| Grains | rice, bread, pasta, oats, quinoa, tortilla, cereal |
| Pantry | oil, spices, salt, pepper, vinegar, soy sauce, honey, nuts, seeds |
| Other | Everything else |

---

## Error Responses

All endpoints should return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| NOT_FOUND | 404 | Shopping list not found |
| UNAUTHORIZED | 401 | Invalid or missing auth token |
| FORBIDDEN | 403 | User doesn't own this list |
| VALIDATION_ERROR | 400 | Invalid request body |
| MEAL_PLAN_NOT_FOUND | 404 | Referenced meal plan doesn't exist |

---

## Integration Notes

### Mobile App Flow
1. User creates meal plan via `POST /api/meals/plan`
2. App calls `POST /api/meal-programs/:programId/shopping-list` to generate list
3. List is persisted and user can access via `GET /api/shopping-lists?userId=`
4. User checks items via `PUT /api/shopping-lists/:listId`
5. User can export to Instacart via `POST /api/shopping-lists/:listId/instacart`

### Ingredient Consolidation
When generating from meal plans, consolidate duplicate ingredients:
- "2 chicken breasts" (Day 1) + "1 lb chicken" (Day 3) = "2 lbs chicken breast"
- Handle unit conversions where possible
- Group by ingredient name, sum quantities

### Family Plan Support
For family plans, shopping lists should be shareable:
- Add `family_id` field to ShoppingList
- Allow family members to view/edit shared lists
- Track who checked off which items

---

## Priority

**High Priority (MVP):**
1. `GET /api/shopping-lists?userId=` - List user's shopping lists
2. `POST /api/shopping-lists` - Create shopping list
3. `GET /api/shopping-lists/:listId` - Get single list
4. `PUT /api/shopping-lists/:listId` - Update/check items

**Medium Priority:**
5. `POST /api/meal-programs/:programId/shopping-list` - Generate from plan
6. `DELETE /api/shopping-lists/:listId` - Delete list

**Lower Priority:**
7. `POST /api/shopping-lists/:listId/instacart` - Instacart integration

---

## Questions for Backend Team

1. Should shopping lists be automatically created when a meal plan is accepted?
2. How long should shopping lists be retained? (30 days? Forever?)
3. Should we support sharing lists outside of family plans?
4. Do we need real-time sync (WebSocket) for family members editing same list?
