# Backend Meal API Migration Guide

## Overview

The frontend has been updated to support **multi-select for meal types and cuisines** in both **Quick mode** and **Plan mode**, and a new **Saved mode** for reordering previously created meals. This document outlines the required backend API changes to support these functionalities.

## Affected Modes

- **Quick Mode:** Multi-select for meal types (breakfast, lunch, dinner, snack, dessert) AND cuisines
  - **Duration:** 1-5 days max (fast meal generation)
  - **Purpose:** Quick meal ideas and options
- **Plan Mode:** Multi-select for cuisines (american, italian, mexican, asian, mediterranean, indian)
  - **Duration:** 7-30 days (full meal planning)
  - **Purpose:** Comprehensive meal plans with variety
- **Saved Mode:** ⭐ NEW - Reorder previously created meals
  - **Duration:** N/A (uses existing meals)
  - **Purpose:** Quick reordering to Instacart without regeneration
- **Diet Mode:** No changes (uses existing dietary restrictions)
  - **Duration:** 14-30 days (program-based)

## Changes Required

### Existing Endpoint: `POST /api/meals/create-from-text`

**Status:** ✅ IMPLEMENTED (supports mealTypes[], cuisineTypes[], duration 1-5 days for Quick mode)

### New Endpoint: `GET /api/meals/saved/:userId`

**Status:** ✅ IMPLEMENTED (routes/mealRoutes.js lines 2675-2831)

### New Endpoint: `POST /api/meals/reorder`

**Status:** ✅ IMPLEMENTED (routes/mealRoutes.js lines 2833-3071)

---

## 1. Request Interface Changes

### New Fields (Multi-Select Support + Saved Mode)

Add support for **array versions** of existing singular fields and new saved mode fields:

```typescript
interface CreateMealPlanRequest {
  // ... existing fields ...
  
  // ⭐ NEW: Multi-select fields (Quick mode)
  /** Array of meal types for multi-meal generation */
  mealTypes?: ('breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert')[];
  
  /** Array of cuisine types for multi-cuisine generation */
  cuisineTypes?: string[]; // e.g., ['italian', 'mexican', 'asian']
  
  // ⭐ NEW: Saved mode fields
  /** Array of saved meal IDs to reorder (Saved mode only) */
  savedMealIds?: string[];
  
  // 🔄 EXISTING: Keep for backward compatibility
  /** Single meal type (deprecated - use mealTypes) */
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
  
  /** Single cuisine type (deprecated - use cuisineTypes) */
  cuisineType?: string;
}
```

---

## 2. Request Processing Logic

### Priority Order

The backend should check fields in this order:

```javascript
// Pseudocode for backend processing
function getMealTypes(request) {
  // 1. Check for new array field first
  if (request.mealTypes && request.mealTypes.length > 0) {
    return request.mealTypes; // Use array
  }
  
  // 2. Fall back to legacy single field
  if (request.mealType) {
    return [request.mealType]; // Convert to array
  }
  
  // 3. Default
  return ['dinner']; // Default value
}

function getCuisineTypes(request) {
  // 1. Check for new array field first
  if (request.cuisineTypes && request.cuisineTypes.length > 0) {
    return request.cuisineTypes; // Use array
  }
  
  // 2. Fall back to legacy single field
  if (request.cuisineType) {
    return [request.cuisineType]; // Convert to array
  }
  
  // 3. Default
  return null; // No cuisine preference
}
```

---

## 3. Meal Generation Logic

### Current Behavior (Single Selection)

**Quick Mode:**
```
User selects: mealType = 'lunch', cuisineType = 'italian'
Result: Generate 1 meal (Italian lunch)
```

**Plan Mode:**
```
User selects: 7-day plan, cuisineType = 'italian'
Result: Generate 7-day plan with Italian cuisine
```

### New Behavior (Multi-Selection)

#### Quick Mode - Multiple Meal Types
```
User selects: mealTypes = ['breakfast', 'lunch', 'dinner']
             cuisineType = 'italian'
Result: Generate 3 meals (Italian breakfast, Italian lunch, Italian dinner)
```

#### Quick Mode - Multiple Cuisines
```
User selects: mealType = 'lunch'
             cuisineTypes = ['italian', 'mexican', 'asian']
Result: Generate 3 meals (Italian lunch, Mexican lunch, Asian lunch)
```

#### Quick Mode - Multiple Types AND Multiple Cuisines
```
User selects: mealTypes = ['breakfast', 'lunch']
             cuisineTypes = ['italian', 'mexican']
Result: Generate 4 meals:
  - Italian breakfast
  - Mexican breakfast
  - Italian lunch
  - Mexican lunch
```

#### Plan Mode - Multiple Cuisines (NEW)
```
User selects: 7-day plan
             cuisineTypes = ['italian', 'mexican', 'american']
Result: Generate 7-day meal plan with variety across selected cuisines
  - Days rotate through Italian, Mexican, and American meals
  - Backend decides distribution (e.g., 3 Italian days, 2 Mexican days, 2 American days)
  - OR each day includes variety from selected cuisines
```

### Implementation Strategy

**Option A: Quick Mode - Cartesian Product (Recommended)**
```javascript
function generateQuickMeals(request) {
  const mealTypes = getMealTypes(request);
  const cuisineTypes = getCuisineTypes(request) || [null];
  
  const meals = [];
  
  // Generate all combinations
  for (const mealType of mealTypes) {
    for (const cuisineType of cuisineTypes) {
      const meal = generateSingleMeal({
        ...request,
        mealType,
        cuisineType,
        description: buildDescription(mealType, cuisineType, request)
      });
      meals.push(meal);
    }
  }
  
  return meals;
}
```

**Option B: Plan Mode - Distributed Variety (Recommended)**
```javascript
function generatePlanMeals(request) {
  const cuisineTypes = getCuisineTypes(request);
  const duration = request.duration || 7;
  
  if (cuisineTypes && cuisineTypes.length > 1) {
    // Distribute cuisines across days for variety
    const days = [];
    for (let day = 0; day < duration; day++) {
      const cuisineIndex = day % cuisineTypes.length;
      const cuisine = cuisineTypes[cuisineIndex];
      
      days.push(generateDayMeals({
        ...request,
        cuisineType: cuisine,
        description: buildPlanDescription(cuisine, request)
      }));
    }
    return days;
  } else {
    // Single or no cuisine - standard flow
    return generateStandardPlan(request);
  }
}

function buildPlanDescription(cuisine, request) {
  const baseDescription = request.description || `Create a ${request.duration || 7}-day meal plan`;
  return cuisine 
    ? `${baseDescription} featuring ${cuisine} cuisine`
    : baseDescription;
}
```

---

## 4. Response Format

### Current Response Structure
```json
{
  "success": true,
  "mode": "quick",
  "plan": {
    "days": [
      {
        "day": 1,
        "date": "2024-01-15",
        "meals": [
          {
            "meal_id": "meal_001",
            "meal_type": "lunch",
            "meal_name": "Italian Pasta Salad",
            "calories": 450,
            "protein": 15,
            "carbs": 60,
            "fat": 18
          }
        ]
      }
    ],
    "recipes": [...],
    "summary": {...}
  }
}
```

### New Response (Multi-Selection)

**Same structure, but with multiple meals in `days[0].meals` array:**

```json
{
  "success": true,
  "mode": "quick",
  "plan": {
    "days": [
      {
        "day": 1,
        "date": "2024-01-15",
        "meals": [
          {
            "meal_id": "meal_001",
            "meal_type": "breakfast",
            "meal_name": "Italian Frittata",
            "calories": 350,
            "protein": 20,
            "carbs": 25,
            "fat": 18
          },
          {
            "meal_id": "meal_002",
            "meal_type": "lunch",
            "meal_name": "Italian Pasta Salad",
            "calories": 450,
            "protein": 15,
            "carbs": 60,
            "fat": 18
          },
          {
            "meal_id": "meal_003",
            "meal_type": "dinner",
            "meal_name": "Italian Chicken Piccata",
            "calories": 550,
            "protein": 35,
            "carbs": 40,
            "fat": 25
          }
        ],
        "total_calories": 1350
      }
    ],
    "recipes": [
      { "recipe_id": "recipe_001", "name": "Italian Frittata", ... },
      { "recipe_id": "recipe_002", "name": "Italian Pasta Salad", ... },
      { "recipe_id": "recipe_003", "name": "Italian Chicken Piccata", ... }
    ],
    "summary": {
      "total_meals": 3,
      "meal_types": ["breakfast", "lunch", "dinner"],
      "cuisines": ["italian"],
      "total_calories": 1350
    }
  }
}
```

---

## 5. Backward Compatibility

### ✅ Must Support Legacy Requests

Old frontend clients may still send:
```json
{
  "mode": "quick",
  "mealType": "lunch",
  "cuisineType": "italian",
  "description": "Generate a single lunch (italian cuisine)"
}
```

**Backend must handle this correctly** by treating singular fields as single-item arrays internally.

### Migration Timeline

1. **Phase 1 (Current):** Backend accepts both `mealType` and `mealTypes`
2. **Phase 2 (3 months):** Mark `mealType`, `cuisineType` as deprecated in API docs
3. **Phase 3 (6 months):** Consider removing legacy fields (only if all clients updated)

---

## 6. Database Schema Changes

### Meal Plan Table

**No changes required** - existing schema already supports multiple meals per day.

### Tracking Fields (Optional Enhancement)

Consider adding metadata to track multi-selection usage:

```sql
ALTER TABLE meal_plans ADD COLUMN generation_params JSONB;
-- Store original request params for analytics
-- Example: {"mealTypes": ["breakfast", "lunch"], "cuisineTypes": ["italian"]}
```

---

## 7. Frontend Request Example

### Quick Mode

**Before (Single Selection):**
```javascript
const request = {
  mode: 'quick',
  mealType: 'lunch',           // Single value
  cuisineType: 'italian',      // Single value
  duration: 1,
  description: 'Generate a single lunch (italian cuisine)',
  dietaryRestrictions: ['gluten_free', 'dairy_free']
};
```

**After (Multi-Selection):**
```javascript
const request = {
  mode: 'quick',
  mealTypes: ['breakfast', 'lunch', 'dinner'],    // Array
  cuisineTypes: ['italian', 'mexican'],           // Array
  duration: 1,
  description: 'Generate meals: breakfast, lunch, dinner (italian, mexican cuisine)',
  dietaryRestrictions: ['gluten_free', 'dairy_free', 'vegan'] // No limit
};
```

### Plan Mode (NEW)

**Before (Single Cuisine):**
```javascript
const request = {
  mode: 'plan',
  duration: 7,
  cuisineType: 'italian',      // Single value
  description: 'Create a 7-day meal plan',
  servings: 4,
  mealsPerDay: { breakfast: true, lunch: true, dinner: true }
};
```

**After (Multi-Cuisine):**
```javascript
const request = {
  mode: 'plan',
  duration: 7,
  cuisineTypes: ['italian', 'mexican', 'american'],  // Array
  description: 'Create a 7-day meal plan featuring italian, mexican, american cuisines',
  servings: 4,
  mealsPerDay: { breakfast: true, lunch: true, dinner: true }
};
```

---

## 8. API Validation Rules

### Input Validation

```javascript
function validateRequest(request) {
  // Mode-based duration validation
  if (request.mode === 'quick') {
    if (request.duration > 5) {
      throw new Error('Quick mode limited to 5 days maximum');
    }
    if (request.duration < 1) {
      throw new Error('Duration must be at least 1 day');
    }
  } else if (request.mode === 'plan') {
    if (request.duration < 7) {
      throw new Error('Plan mode requires minimum 7 days');
    }
    if (request.duration > 30) {
      throw new Error('Maximum 30 days allowed');
    }
  }
  
  // Check array sizes
  if (request.mealTypes && request.mealTypes.length > 5) {
    throw new Error('Maximum 5 meal types allowed');
  }
  
  if (request.cuisineTypes && request.cuisineTypes.length > 10) {
    throw new Error('Maximum 10 cuisines allowed');
  }
  
  // Validate enum values
  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
  if (request.mealTypes) {
    for (const type of request.mealTypes) {
      if (!validMealTypes.includes(type)) {
        throw new Error(`Invalid meal type: ${type}`);
      }
    }
  }
  
  // Check for conflicting fields
  if (request.mealType && request.mealTypes) {
    console.warn('Both mealType and mealTypes provided, using mealTypes');
  }
}
```

---

## 9. Performance Considerations

### Rate Limiting

Multi-selection can generate many meals in one request:
- 5 meal types × 10 cuisines = **50 meals**
- Each meal may call AI service
- Consider implementing:
  - Maximum combination limit (e.g., 20 meals per request)
  - Batch processing for large requests
  - Async job queue for > 10 meals

### Response Time

```javascript
// Example: If generating 4 meals
// - Old: 1 AI call (~3-5 seconds)
// - New: 4 AI calls (~12-20 seconds)

// Optimization: Parallel generation
async function generateMealsParallel(combinations) {
  const promises = combinations.map(combo => 
    generateSingleMealAsync(combo)
  );
  return await Promise.all(promises); // Run in parallel
}
```

---

## 10. Testing Checklist

### Unit Tests

- [ ] **Quick Mode:** Single meal type + single cuisine (backward compatibility)
- [ ] **Quick Mode:** Multiple meal types, no cuisine
- [ ] **Quick Mode:** Single meal type, multiple cuisines
- [ ] **Quick Mode:** Multiple meal types + multiple cuisines
- [ ] **Quick Mode:** Empty mealTypes array (should default to 'dinner')
- [ ] **Quick Mode:** Invalid meal type in array (should reject)
- [ ] **Quick Mode:** Duration validation (1-5 days, reject > 5)
- [ ] **Plan Mode:** Single cuisine (backward compatibility)
- [ ] **Plan Mode:** Multiple cuisines (should distribute across days)
- [ ] **Plan Mode:** No cuisine (should work as before)
- [ ] **Plan Mode:** 3 cuisines × 7 days (should rotate cuisines)
- [ ] **Plan Mode:** Duration validation (7-30 days, reject < 7)
- [ ] Maximum limits (5 meal types, 10 cuisines)

### Integration Tests

- [ ] **Quick mode:** with `mealTypes` array
- [ ] **Quick mode:** with `cuisineTypes` array
- [ ] **Quick mode:** with both arrays
- [ ] **Quick mode:** Verify all meals returned in single day
- [ ] **Plan mode:** with `cuisineTypes` array
- [ ] **Plan mode:** Verify cuisines distributed across multiple days
- [ ] **Plan mode:** Verify each day has proper meal structure
- [ ] Verify recipes array includes all generated recipes
- [ ] Legacy request still works (single mealType/cuisineType)
- [ ] Backward compatibility for Plan mode with single cuisineType

### Load Tests

- [ ] 5 meal types × 6 cuisines = 30 meals in one request
- [ ] Response time < 60 seconds
- [ ] Memory usage acceptable
- [ ] Concurrent requests don't cause race conditions

---

## 11. Deployment Steps

### Pre-Deployment

1. **Update TypeScript interfaces** in backend codebase
   ```typescript
   // In your backend types file
   interface CreateMealPlanRequest {
     // Add new fields
     mealTypes?: string[];
     cuisineTypes?: string[];
     
     // Keep existing (mark as deprecated)
     /** @deprecated Use mealTypes instead */
     mealType?: string;
     /** @deprecated Use cuisineTypes instead */
     cuisineType?: string;
   }
   ```

2. **Update API validation logic** to accept both formats

3. **Update meal generation logic** to handle arrays

4. **Add logging** to track usage of new vs. old fields
   ```javascript
   if (request.mealTypes) {
     logger.info('Using new mealTypes array', { count: request.mealTypes.length });
   } else if (request.mealType) {
     logger.info('Using legacy mealType field');
   }
   ```

### Deployment

1. Deploy backend changes (backward compatible)
2. Test legacy requests still work
3. Frontend is already deployed with multi-select UI
4. Monitor error rates and response times

### Post-Deployment

1. Monitor logs for any validation errors
2. Check response times for multi-selection requests
3. Verify all combinations generate correctly
4. Update API documentation with new fields

---

## 12. API Documentation Update

### OpenAPI/Swagger Example

```yaml
paths:
  /api/meals/create-from-text:
    post:
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                mode:
                  type: string
                  enum: [quick, plan, diet]
                  
                # New multi-select fields
                mealTypes:
                  type: array
                  items:
                    type: string
                    enum: [breakfast, lunch, dinner, snack, dessert]
                  description: "Array of meal types to generate (Quick mode)"
                  example: ["breakfast", "lunch", "dinner"]
                  
                cuisineTypes:
                  type: array
                  items:
                    type: string
                  description: "Array of cuisines to generate"
                  example: ["italian", "mexican", "asian"]
                  
                # Legacy fields (deprecated)
                mealType:
                  type: string
                  enum: [breakfast, lunch, dinner, snack, dessert]
                  deprecated: true
                  description: "DEPRECATED: Use mealTypes array instead"
                  
                cuisineType:
                  type: string
                  deprecated: true
                  description: "DEPRECATED: Use cuisineTypes array instead"
```

---

## 13. Known Issues & Edge Cases

### Edge Case 1: Empty Arrays
```javascript
// If user deselects all options
request.mealTypes = [];
request.cuisineTypes = [];

// Backend should:
// - Fall back to defaults
// - OR return validation error
```

### Edge Case 2: Duplicate Values
```javascript
request.mealTypes = ['lunch', 'lunch', 'dinner'];

// Backend should:
// - Deduplicate automatically
// - OR return validation error
```

### Edge Case 3: Conflicting Modes
```javascript
request.mode = 'plan'; // 7-day plan
request.mealTypes = ['lunch']; // Quick mode feature

// Backend should:
// - Ignore mealTypes in plan mode
// - OR return validation error
```

---

## 14. Rollback Plan

If issues occur after deployment:

1. **Quick Fix:** Update frontend to send only singular fields
   ```javascript
   // Temporary rollback in frontend
   request.mealType = params.mealTypes[0]; // Use first selection only
   request.cuisineType = params.cuisineTypes[0];
   ```

2. **Database:** No schema changes required, so no rollback needed

3. **Backend:** Revert to previous version if major issues

---

## 10. Saved Mode - Reorder Previously Created Meals

### Overview

**Saved mode** is a ✅ **IMPLEMENTED** feature that allows users to quickly reorder previously created meals to Instacart without regenerating them. This provides a faster workflow for repeat customers.

### Backend Implementation (COMPLETE)

#### ✅ IMPLEMENTED: `GET /api/meals/saved/:userId`

**Location:** `routes/mealRoutes.js` (lines 2675-2831)  
**Purpose:** Fetch a user's saved/recent meal plans for reordering  
**Authentication:** Required (`Authorization: Bearer <token>`)

**Request:**
```http
GET /api/meals/saved/:userId
Query Parameters:
  - limit?: number (default: 20, max: 50)
  - offset?: number (default: 0)
  - sortBy?: 'created_at' | 'last_ordered' (default: 'created_at')
  - order?: 'desc' | 'asc' (default: 'desc')
```

**Response:**
```typescript
interface SavedMealsResponse {
  success: boolean;
  meals: SavedMealPlan[];
  total: number;
  hasMore: boolean;
  pagination: {
    limit: number;
    offset: number;
    returned: number;
  };
}

interface SavedMealPlan {
  id: string;
  userId: string;
  name: string; // e.g., "Italian Week Plan"
  displayTitle: string; // "Jan 27, 2026 - Italian Week Plan"
  description: string;
  mode: 'quick' | 'plan' | 'diet';
  
  // Meal details
  meals: {
    id: string;
    name: string;
    mealType: string;
    cuisineType: string;
    imageUrl?: string | null;
    servings: number;
  }[];
  
  // Metadata
  totalMeals: number;
  duration: number; // days
  createdAt: string; // ISO 8601
  lastOrderedAt?: string; // ISO 8601
  orderCount: number; // how many times reordered
  
  // Shopping info
  estimatedCost?: number | null;
  ingredientCount?: number;
}
```

#### ✅ IMPLEMENTED: `POST /api/meals/reorder`

**Location:** `routes/mealRoutes.js` (lines 2833-3071)  
**Purpose:** Reorder saved meals to Instacart  
**Authentication:** Required (`Authorization: Bearer <token>`)

**Request:**
```typescript
interface ReorderMealsRequest {
  userId: string;
  savedMealIds: string[]; // IDs from saved meals list
  servings?: number; // Optional: adjust servings
  preferredStores?: string[];
}
```

**Response:**
```typescript
interface ReorderMealsResponse {
  success: boolean;
  shoppingListId: string;
  instacartUrl?: string; // Instacart cart URL or fallback message
  meals: {
    id: string;
    name: string;
  }[];
  totalIngredients: number;
  estimatedCost: number;
  message?: string; // "Shopping list created and sent to Instacart"
}
```

**Example Response:**
```json
{
  "success": true,
  "shoppingListId": "list_1738012900000_user_123",
  "instacartUrl": "https://customers.dev.instacart.tools/store/shopping_lists/9263130",
  "meals": [
    { "id": "meal_001", "name": "Italian Breakfast" },
    { "id": "meal_002", "name": "Pasta Lunch" }
  ],
  "totalIngredients": 42,
  "estimatedCost": 0,
  "message": "Shopping list created and sent to Instacart"
}
```

### Frontend Integration

**User Flow:**
1. User selects "Saved" mode in ModeToggle
2. Frontend calls `GET /api/meals/saved/:userId` to fetch recent meals
3. User browses saved meal plans
4. User selects one or more saved plans to reorder
5. User clicks "Reorder to Instacart"
6. Frontend calls `POST /api/meals/reorder` with `savedMealIds`
7. Backend returns shopping list/Instacart link
8. User is redirected to shopping list or Instacart

**Example Frontend Request:**
```typescript
// Fetch saved meals
const response = await fetch(`/api/meals/saved/${userId}?limit=20&sortBy=last_ordered`);
const { meals } = await response.json();

// Reorder selected meals
const reorderResponse = await fetch('/api/meals/reorder', {
  method: 'POST',
  body: JSON.stringify({
    userId,
    savedMealIds: ['meal_123', 'meal_456'],
    servings: 4,
    preferredStores: ['whole_foods'],
  }),
});
```

### Database Considerations

**Existing Tables:**
- Meals are already being saved with `_meta.meals_auto_saved: true` in Plan/Diet modes
- Need to ensure Quick mode meals are also saved for future reordering

**Required Indexes:**
```sql
CREATE INDEX idx_meals_user_created ON meals(user_id, created_at DESC);
CREATE INDEX idx_meals_user_ordered ON meals(user_id, last_ordered_at DESC);
```

### Validation Rules

**Saved Meals Endpoint:**
- ✅ User must be authenticated
- ✅ `limit` must be between 1-50
- ✅ `offset` must be non-negative
- ✅ Only return meals owned by the requesting user

**Reorder Endpoint:**
- ✅ `savedMealIds` array must not be empty
- ✅ All meal IDs must belong to the requesting user
- ✅ `servings` must be between 1-12 if provided
- ✅ Meals must still exist (not deleted)

### Error Handling

**Saved Meals Endpoint:**
```json
// 404 - User has no saved meals
{
  "success": false,
  "message": "No saved meals found. Create some meals first!"
}

// 401 - Unauthorized
{
  "success": false,
  "error": "Authentication required"
}
```

**Reorder Endpoint:**
```json
// 404 - Meal not found
{
  "success": false,
  "error": "No meal programs found with provided IDs",
  "code": "NOT_FOUND"
}

// 403 - Not authorized to access meals
{
  "success": false,
  "error": "You do not have permission to access one or more meal programs",
  "invalidIds": ["plan_999"],
  "code": "FORBIDDEN"
}
```

### Testing Checklist

**Saved Meals Endpoint:**
- [ ] Returns user's saved meals in correct order
- [ ] Pagination works correctly
- [ ] Sorting by created_at and last_ordered_at works
- [ ] Respects user authentication
- [ ] Handles users with no saved meals gracefully
- [ ] Limits work correctly (max 50)

**Reorder Endpoint:**
- [ ] Successfully generates shopping list from saved meals
- [ ] Validates meal ownership
- [ ] Handles non-existent meal IDs
- [ ] Updates last_ordered_at timestamp
- [ ] Increments order_count
- [ ] Respects servings adjustment
- [ ] Generates correct Instacart URL

### Performance Considerations

**Caching:**
- Cache saved meals list for 5 minutes (frequently accessed)
- Invalidate cache when new meals are created

**Database Optimization:**
- Use pagination to avoid large result sets
- Index on (user_id, created_at) for fast sorting
- Consider denormalizing total_meals count

**Response Size:**
- Include meal thumbnails (not full images)
- Limit description length to 200 characters
- Use lazy loading for additional meal details

---

## Summary

### Backend Implementation Status

1. ✅ **IMPLEMENTED** - `mealTypes?: string[]` in CreateMealPlanRequest interface
2. ✅ **IMPLEMENTED** - `cuisineTypes?: string[]` in CreateMealPlanRequest interface
3. ✅ **IMPLEMENTED** - Quick mode duration support (1, 3, 5 days)
4. ✅ **IMPLEMENTED** - `GET /api/meals/saved/:userId` endpoint (lines 2675-2831)
5. ✅ **IMPLEMENTED** - `POST /api/meals/reorder` endpoint (lines 2833-3071)
6. ✅ **IMPLEMENTED** - Request parsing with array priority, fallback to singular
7. ✅ **IMPLEMENTED** - Meal generation logic for array combinations
8. ✅ **IMPLEMENTED** - Multiple meals returned in response
9. ✅ **IMPLEMENTED** - Validation for array sizes and duration limits
10. ✅ **IMPLEMENTED** - Backward compatibility maintained
11. ✅ **IMPLEMENTED** - Meal programs saved to database
12. ✅ **IMPLEMENTED** - Shopping list generation with Instacart integration
13. ✅ **IMPLEMENTED** - Reorder tracking (last_ordered_at, order_count)

### Testing Status

- ✅ Array handling implemented
- ✅ Multi-selection scenarios supported
- ✅ Saved meals endpoint functional
- ✅ Reorder workflow operational
- ⚠️ Load tests recommended for large combinations
- ✅ Backward compatibility verified

### Implementation Timeline (COMPLETE)

- ✅ **Backend Development:** Complete (all endpoints live)
- ✅ **Saved Mode Frontend:** Complete (UI deployed)
- ⚠️ **Testing:** Recommended - load testing for multi-select limits
- ✅ **Deployment:** Live on services.wihy.ai
- 🔄 **Monitoring:** Ongoing (track usage and performance)

---

## Questions?

Contact the frontend team for clarification on:
- Expected response format for edge cases
- UI behavior when > 20 meals generated
- Dietary restriction combinations
- Performance requirements

---

**Document Version:** 2.0  
**Last Updated:** January 27, 2026  
**Status:** ✅ IMPLEMENTED - All features live in production  
**Author:** Wihy Development Team

---

## Quick Reference Links

- **API Documentation:** See [MEAL_CREATION_ROUTES.md](MEAL_CREATION_ROUTES.md) for complete route reference
- **Backend Location:** `routes/mealRoutes.js`
  - Lines 75-250: `/api/meals/create-from-text` (Quick/Plan/Diet modes)
  - Lines 2675-2831: `/api/meals/saved/:userId` (Saved mode)
  - Lines 2833-3071: `/api/meals/reorder` (Instacart reorder)
- **Frontend Components:**
  - `ModeToggle.tsx` - 4-mode selector (Quick, Plan, Saved, Diet)
  - `GoalSelectionMeals.tsx` - Mode-specific forms
  - `DurationSelector.tsx` - Mode-aware duration (Quick: 1-5, Plan: 7-30)
- **Test User:** test.free@wihy.ai (User ID: b0130eaf-4882-4258-bbb9-66ecc5b1ebac)
