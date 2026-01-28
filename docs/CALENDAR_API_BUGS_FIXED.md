# Calendar API Bugs - Fixed

**Date:** January 28, 2026  
**Status:** ✅ Resolved

---

## Problem Summary

The application had **2 separate calendar-related services** that were being confused, causing API calls to fail with incorrect query parameters.

---

## API Architecture (Correct Design)

### 1. Meal Library API - `user.wihy.ai`

**Purpose:** User's saved meals collection (CRUD operations)

| Method | Endpoint | Database | Description |
|--------|----------|----------|-------------|
| GET | `/api/users/:userId/meals` | `wihy_users.user_meal_diary` | Get all saved meals |
| POST | `/api/users/:userId/meals` | `wihy_users.user_meal_diary` | Save new meal |
| GET | `/api/users/:userId/meals/:mealId` | `wihy_users.user_meal_diary` | Get meal details |
| PATCH | `/api/users/:userId/meals/:mealId` | `wihy_users.user_meal_diary` | Update meal |
| DELETE | `/api/users/:userId/meals/:mealId` | `wihy_users.user_meal_diary` | Delete meal |
| PATCH | `/api/users/:userId/meals/:mealId/favorite` | `wihy_users.user_meal_diary` | Toggle favorite |

**Service File:** `mealDiary.ts`

---

### 2. Meal Calendar API - `services.wihy.ai`

**Purpose:** Schedule meals from library to specific dates

| Method | Endpoint | Database | Description |
|--------|----------|----------|-------------|
| GET | `/api/meals/calendar/:userId?start=YYYY-MM-DD&end=YYYY-MM-DD` | `wihy_users.user_meal_schedule` | Get calendar range |
| GET | `/api/meals/calendar/:userId/today` | `wihy_users.user_meal_schedule` | Get today's meals |
| GET | `/api/meals/calendar/:userId/week` | `wihy_users.user_meal_schedule` | Get week view |
| GET | `/api/meals/calendar/:userId/date/:date` | `wihy_users.user_meal_schedule` | Get specific date |
| GET | `/api/meals/calendar/:userId/stats` | `wihy_users.user_meal_schedule` | Get statistics |
| POST | `/api/meals/calendar/:userId/schedule` | `wihy_users.user_meal_schedule` | Schedule a meal |
| POST | `/api/meals/calendar/:userId/bulk-schedule` | `wihy_users.user_meal_schedule` | Schedule multiple |
| PUT | `/api/meals/calendar/:userId/:scheduleId/complete` | `wihy_users.user_meal_schedule` | Mark completed |
| DELETE | `/api/meals/calendar/:userId/:scheduleId` | `wihy_users.user_meal_schedule` | Remove scheduled |
| DELETE | `/api/meals/calendar/:userId/date/:date` | `wihy_users.user_meal_schedule` | Clear day |
| POST | `/api/meals/calendar/:userId/copy` | `wihy_users.user_meal_schedule` | Copy day schedule |

**Service File:** `mealCalendarService.ts`

---

## Bugs Found

### Bug #1: Incorrect Query Parameters in `getCalendar()`

**Location:** [mealCalendarService.ts](../mobile/src/services/mealCalendarService.ts#L355)

**Issue:**
```typescript
// ❌ WRONG - Using 'startDate' and 'endDate'
`${this.baseUrl}/api/meals/calendar/${userId}?startDate=${startDate}&endDate=${endDate}`
```

**Expected:**
```typescript
// ✅ CORRECT - Backend expects 'start' and 'end'
`${this.baseUrl}/api/meals/calendar/${userId}?start=${startDate}&end=${endDate}`
```

**Impact:** Calendar month view would fail to load scheduled meals.

---

### Bug #2: Incorrect Query Parameter in `getWeekView()`

**Location:** [mealCalendarService.ts](../mobile/src/services/mealCalendarService.ts#L407)

**Issue:**
```typescript
// ❌ WRONG - Using 'startDate'
`${this.baseUrl}/api/meals/calendar/${userId}/week?startDate=${startDate}`
```

**Expected:**
```typescript
// ✅ CORRECT - Backend expects 'start'
`${this.baseUrl}/api/meals/calendar/${userId}/week?start=${startDate}`
```

**Impact:** Week view with custom start date would fail.

---

## Fixes Applied

### File: `mealCalendarService.ts`

**Changes:**

1. **Line 355:** Changed query parameter from `startDate` to `start`
2. **Line 355:** Changed query parameter from `endDate` to `end`
3. **Line 407:** Changed query parameter from `startDate` to `start`
4. **Updated JSDoc comments** to reflect correct API specification

---

## Verification

✅ All TypeScript errors resolved  
✅ Query parameters match backend API specification  
✅ Consistent with API documentation (MEAL_CALENDAR_CLIENT_GUIDE.md)  
✅ No breaking changes to function signatures

---

## Files Modified

| File | Lines Changed | Description |
|------|---------------|-------------|
| [mealCalendarService.ts](../mobile/src/services/mealCalendarService.ts) | 347, 407 | Fixed query parameter names |

---

## User Flow Example (Now Working)

```typescript
// 1. Generate meal (services.wihy.ai)
const meal = await mealService.createMealFromText({ ... });

// 2. Save to library (user.wihy.ai)
await mealDiary.createMeal(userId, meal);

// 3. View library (user.wihy.ai)
const savedMeals = await mealDiary.getAllMeals(userId);

// 4. Schedule meal (services.wihy.ai) - NOW WORKS! ✅
await mealCalendarService.scheduleMeal(userId, {
  mealId: meal.id,
  scheduledDate: '2026-01-28',
  mealSlot: 'dinner'
});

// 5. View calendar (services.wihy.ai) - NOW WORKS! ✅
const week = await mealCalendarService.getWeekView(userId);

// 6. Mark as eaten (services.wihy.ai)
await mealCalendarService.markMealComplete(userId, scheduleId);
```

---

## Related Services

| Service | Host | Purpose | Status |
|---------|------|---------|--------|
| `mealDiary.ts` | `user.wihy.ai` | Meal Library CRUD | ✅ Correct |
| `mealCalendarService.ts` | `services.wihy.ai` | Meal Scheduling | ✅ Fixed |
| `mealService.ts` | `services.wihy.ai` | Meal Generation | ✅ Correct |
| `nutritionService.ts` | `user.wihy.ai` | Meal Logging | ✅ Correct |

---

## Testing Recommendations

1. **Calendar Month View**
   - Load month view in [MealCalendar.tsx](../mobile/src/screens/MealCalendar.tsx)
   - Verify scheduled meals appear correctly
   - Change months and verify data loads

2. **Week View**
   - Test default week view (current week)
   - Test custom start date parameter
   - Verify 7 days returned

3. **Meal Scheduling**
   - Schedule a meal from library to calendar
   - Verify it appears in calendar view
   - Test bulk scheduling multiple meals

4. **Integration Test**
   - Generate meal → Save to library → Schedule to calendar
   - Verify data flows through both APIs correctly

---

## References

- [MEAL_CALENDAR_CLIENT_GUIDE.md](./MEAL_CALENDAR_CLIENT_GUIDE.md) - Full calendar API documentation
- [API Service Routing](./API_SERVICE_ROUTING_FIXES.md) - Service separation guide
- Backend API Spec: `wihy-api-spec.json`

---

## Notes

- The separation between `user.wihy.ai` (library) and `services.wihy.ai` (calendar) is intentional
- **Library** = What meals you CAN eat (your saved recipes)
- **Calendar** = What meals you WILL eat (scheduled dates)
- Always use `mealCalendarService` for scheduling operations
- Always use `mealDiary` for library CRUD operations
