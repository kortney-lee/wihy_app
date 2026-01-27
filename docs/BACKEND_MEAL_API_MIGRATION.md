# Backend Meal API Migration Guide

## Overview

The frontend has been updated to support **multi-select for meal types and cuisines**, allowing users to select multiple options simultaneously instead of being limited to a single choice. This document outlines the required backend API changes to support this new functionality.

## Changes Required

### API Endpoint: `POST /api/meals/create-from-text`

**Status:** ⚠️ REQUIRES UPDATE

---

## 1. Request Interface Changes

### New Fields (Multi-Select Support)

Add support for **array versions** of existing singular fields:

```typescript
interface CreateMealPlanRequest {
  // ... existing fields ...
  
  // ⭐ NEW: Multi-select fields (Quick mode)
  /** Array of meal types for multi-meal generation */
  mealTypes?: ('breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert')[];
  
  /** Array of cuisine types for multi-cuisine generation */
  cuisineTypes?: string[]; // e.g., ['italian', 'mexican', 'asian']
  
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
```
User selects: mealType = 'lunch', cuisineType = 'italian'
Result: Generate 1 meal (Italian lunch)
```

### New Behavior (Multi-Selection)

#### Example 1: Multiple Meal Types
```
User selects: mealTypes = ['breakfast', 'lunch', 'dinner']
             cuisineType = 'italian'
Result: Generate 3 meals (Italian breakfast, Italian lunch, Italian dinner)
```

#### Example 2: Multiple Cuisines
```
User selects: mealType = 'lunch'
             cuisineTypes = ['italian', 'mexican', 'asian']
Result: Generate 3 meals (Italian lunch, Mexican lunch, Asian lunch)
```

#### Example 3: Multiple Types AND Multiple Cuisines
```
User selects: mealTypes = ['breakfast', 'lunch']
             cuisineTypes = ['italian', 'mexican']
Result: Generate 4 meals:
  - Italian breakfast
  - Mexican breakfast
  - Italian lunch
  - Mexican lunch
```

### Implementation Strategy

**Option A: Cartesian Product (Recommended)**
```javascript
function generateMeals(request) {
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

function buildDescription(mealType, cuisineType, request) {
  const dietaryPart = (request.dietaryRestrictions && request.dietaryRestrictions.length > 0)
    ? ` that is ${request.dietaryRestrictions.join(', ')}`
    : '';
  
  const cuisinePart = cuisineType ? ` (${cuisineType} cuisine)` : '';
  const timePart = request.timeConstraint ? `, ${request.timeConstraint} prep time` : '';
  
  return `Generate a single ${mealType}${cuisinePart}${dietaryPart}${timePart}`;
}
```

**Option B: Sequential Generation**
```javascript
function generateMeals(request) {
  const mealTypes = getMealTypes(request);
  const cuisineTypes = getCuisineTypes(request);
  
  if (cuisineTypes && cuisineTypes.length > 0) {
    // Multiple cuisines specified
    return generateMultiCuisineMeals(request, mealTypes, cuisineTypes);
  } else {
    // Single or no cuisine
    return generateMultiTypeMeals(request, mealTypes);
  }
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

### Before (Single Selection)
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

### After (Multi-Selection)
```javascript
const request = {
  mode: 'quick',
  mealTypes: ['breakfast', 'lunch', 'dinner'],    // Array
  cuisineTypes: ['italian', 'mexican'],           // Array
  duration: 1,
  description: 'Generate meals for selected types and cuisines',
  dietaryRestrictions: ['gluten_free', 'dairy_free', 'vegan'] // No limit
};
```

---

## 8. API Validation Rules

### Input Validation

```javascript
function validateRequest(request) {
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

- [ ] Single meal type + single cuisine (backward compatibility)
- [ ] Multiple meal types, no cuisine
- [ ] Single meal type, multiple cuisines
- [ ] Multiple meal types + multiple cuisines
- [ ] Empty mealTypes array (should default to 'dinner')
- [ ] Invalid meal type in array (should reject)
- [ ] Maximum limits (5 meal types, 10 cuisines)

### Integration Tests

- [ ] Quick mode with `mealTypes` array
- [ ] Quick mode with `cuisineTypes` array
- [ ] Quick mode with both arrays
- [ ] Verify all meals returned in single day
- [ ] Verify recipes array includes all generated recipes
- [ ] Legacy request still works (single mealType/cuisineType)

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

## Summary

### Required Backend Changes

1. ✅ Add `mealTypes?: string[]` to CreateMealPlanRequest interface
2. ✅ Add `cuisineTypes?: string[]` to CreateMealPlanRequest interface
3. ✅ Update request parsing to check arrays first, fall back to singular fields
4. ✅ Update meal generation logic to handle array combinations
5. ✅ Return multiple meals in `days[0].meals` array
6. ✅ Add validation for array sizes (max 5 types, 10 cuisines)
7. ✅ Keep backward compatibility for legacy singular fields
8. ✅ Add logging for usage tracking

### Testing Required

- Unit tests for array handling
- Integration tests for multi-selection scenarios
- Load tests for large combinations
- Backward compatibility verification

### Timeline Estimate

- **Backend Development:** 2-3 days
- **Testing:** 1-2 days
- **Deployment:** 1 day
- **Monitoring:** 1 week

---

## Questions?

Contact the frontend team for clarification on:
- Expected response format for edge cases
- UI behavior when > 20 meals generated
- Dietary restriction combinations
- Performance requirements

---

**Document Version:** 1.0  
**Last Updated:** {{ current_date }}  
**Author:** Wihy Development Team
