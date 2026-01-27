# Meals API (services.wihy.ai) - Client Guide

**For:** iOS & Android Teams  
**Service:** `services.wihy.ai`  
**Last Updated:** January 27, 2026

---

## Overview

The Meals API on `services.wihy.ai` handles **meal generation, calendar scheduling, and meal programs**. 

> ⚠️ **Note:** User's saved meal library is on `user.wihy.ai` at `/api/users/:userId/meals`. This document covers only `services.wihy.ai` endpoints.

**Base URL:** `https://services.wihy.ai/api/meals`

---

## Client Implementation

### Import the Service

```typescript
import { mealCalendarService } from '../services/mealCalendarService';
// or
import { mealCalendarService } from '../services';
```

---

## Endpoints Summary

| Category | Endpoints | Purpose |
|----------|-----------|---------|
| **Generation** | `/api/meals/create-from-text` | AI-powered meal creation |
| **Calendar** | `/api/meals/calendar/:userId/*` | Schedule meals to dates (11 endpoints) |
| **Templates** | `/api/meals/templates` | Pre-built meal templates |
| **Quick Access** | `/api/meals/breakfast`, `/lunch`, `/dinner` | Meal suggestions by type |
| **Programs** | `/api/meal-programs` | User's meal programs |

---

## 1. Meal Generation

### Generate Meal from Text (AI)

**Endpoint:** `POST /api/meals/create-from-text`

Creates a meal using AI based on preferences. Supports 3 modes:

#### Mode 1: Quick (Single Meal)

```typescript
const meal = await mealCalendarService.createMealFromText({
  mode: 'quick',
  userId: 'b0130eaf-4882-4258-bbb9-66ecc5b1ebac',
  mealType: 'dinner',
  cuisineType: 'mexican',
  dietaryRestrictions: ['vegan'],
  servings: 2,
  timeConstraint: 'quick'  // quick (<15min), moderate (15-30), standard (30-60)
});

console.log(meal.meal?.name); // "Cauliflower Rice Burrito Bowl"
```

**Response:**
```typescript
{
  success: true,
  mode: 'quick',
  meal: {
    id: 'meal_1769534510988_dzxb1m200',
    name: 'Cauliflower Rice Burrito Bowl',
    mealType: 'dinner',
    cuisineType: 'mexican',
    servings: 2,
    prepTime: 10,
    cookTime: 15,
    totalTime: 25,
    ingredients: [
      { name: 'Cauliflower rice', amount: 2, unit: 'cups' },
      { name: 'Black beans', amount: 1, unit: 'cup' }
    ],
    instructions: ['...'],
    nutrition: {
      caloriesPerServing: 550,
      protein: 18,
      carbs: 45,
      fat: 22
    },
    dietaryRestrictions: ['vegan']
  }
}
```

#### Mode 2: Plan (Multi-Day)

```typescript
const plan = await mealCalendarService.createMealFromText({
  mode: 'plan',
  userId: 'uuid',
  duration: 7,  // 3, 7, 14, or 30 days
  mealsPerDay: {
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: false
  },
  servings: 4,
  dietaryRestrictions: ['gluten_free']
});

console.log(`Generated ${plan.meals?.length} meals for ${plan.plan?.duration} days`);
```

#### Mode 3: Diet (Fitness Goals)

```typescript
const diet = await mealCalendarService.createMealFromText({
  mode: 'diet',
  userId: 'uuid',
  duration: 7,
  fitnessGoal: 'weight_loss',  // weight_loss, muscle_gain, maintenance
  activityLevel: 'moderate',
  dailyCalorieTarget: 2000,
  macrosTarget: { protein: 30, carbs: 40, fat: 30 }
});
```

---

## 2. Meal Calendar (11 Endpoints)

Schedule meals from the user's library to specific dates.

### Calendar Queries

#### Get Calendar Range

```typescript
const days = await mealCalendarService.getCalendar(
  userId,
  '2026-01-27',  // startDate
  '2026-02-03'   // endDate
);

days.forEach(day => {
  console.log(`${day.date}: ${day.meals.length} meals, ${day.totals.calories} calories`);
});
```

#### Get Today's Meals

```typescript
const today = await mealCalendarService.getTodaysMeals(userId);

if (today) {
  console.log(`Today's meals: ${today.meals.length}`);
  today.meals.forEach(meal => {
    console.log(`- ${meal.meal_slot}: ${meal.meal.name}`);
  });
}
```

#### Get Week View

```typescript
const weekDays = await mealCalendarService.getWeekView(userId);
// Returns 7 days (Mon-Sun)

weekDays.forEach(day => {
  console.log(`${day.dayName} (${day.date}): ${day.totals.calories} cal`);
});
```

#### Get Specific Date

```typescript
const dateData = await mealCalendarService.getMealsForDate(userId, '2026-01-28');

if (dateData) {
  console.log(`Meals scheduled: ${dateData.meals.length}`);
}
```

#### Get Calendar Stats

```typescript
const stats = await mealCalendarService.getCalendarStats(userId, 30);

if (stats) {
  console.log(`Completion rate: ${stats.completionRate}%`);
  console.log(`Streak: ${stats.streakDays} days`);
  console.log(`Avg daily calories: ${stats.averageDailyCalories}`);
}
```

### Schedule Operations

#### Schedule a Single Meal

```typescript
const scheduled = await mealCalendarService.scheduleMeal(userId, {
  mealId: 'meal_1769534510988_dzxb1m200',
  scheduledDate: '2026-01-28',
  mealSlot: 'dinner',  // breakfast, lunch, dinner, snack, pre-workout, post-workout
  servings: 2,
  notes: 'Pack for work'
});

console.log(`Scheduled meal ID: ${scheduled?.schedule_id}`);
```

#### Bulk Schedule (Week Planning)

```typescript
const schedules = await mealCalendarService.bulkScheduleMeals(userId, {
  schedules: [
    { mealId: 'meal_b1', scheduledDate: '2026-01-28', mealSlot: 'breakfast' },
    { mealId: 'meal_l1', scheduledDate: '2026-01-28', mealSlot: 'lunch' },
    { mealId: 'meal_d1', scheduledDate: '2026-01-28', mealSlot: 'dinner' }
  ]
});

console.log(`Scheduled ${schedules.length} meals`);
```

#### Mark Meal as Completed

```typescript
const updated = await mealCalendarService.markMealComplete(
  userId,
  scheduleId,
  'Delicious!' // optional notes
);

if (updated?.is_completed) {
  console.log(`Meal completed at ${updated.completed_at}`);
}
```

#### Remove Scheduled Meal

```typescript
const success = await mealCalendarService.removeScheduledMeal(userId, scheduleId);

if (success) {
  console.log('Meal removed from schedule');
}
```

#### Clear Entire Day

```typescript
const cleared = await mealCalendarService.clearDay(userId, '2026-01-28');

if (cleared) {
  console.log('All meals cleared for the day');
}
```

#### Copy Day to Another Day

```typescript
const copiedMeals = await mealCalendarService.copyDay(
  userId,
  '2026-01-27', // sourceDate
  '2026-02-03'  // targetDate
);

console.log(`Copied ${copiedMeals.length} meals`);
```

---

## 3. Meal Templates & Suggestions

### Get Meal Templates

```typescript
// All templates
const templates = await mealCalendarService.getMealTemplates();

// Filter by meal type
const breakfastTemplates = await mealCalendarService.getMealTemplates('breakfast');

// Filter by cuisine
const mexicanTemplates = await mealCalendarService.getMealTemplates(undefined, 'mexican');
```

### Get Breakfast/Lunch/Dinner Suggestions

```typescript
const breakfasts = await mealCalendarService.getBreakfastSuggestions(5);
const lunches = await mealCalendarService.getLunchSuggestions(5);
const dinners = await mealCalendarService.getDinnerSuggestions(5);

console.log(`Got ${breakfasts.length + lunches.length + dinners.length} suggestions`);
```

### Get Complete Day Plan

```typescript
const dayPlan = await mealCalendarService.getDayPlan(userId, ['vegan']);

if (dayPlan) {
  console.log(`Breakfast: ${dayPlan.breakfast.name}`);
  console.log(`Lunch: ${dayPlan.lunch.name}`);
  console.log(`Dinner: ${dayPlan.dinner.name}`);
  console.log(`Daily totals: ${dayPlan.totals.caloriesPerServing} cal`);
}
```

---

## 4. Meal Programs

### Get User's Meal Programs

```typescript
const programs = await mealCalendarService.getMealPrograms(userId);

programs.forEach(program => {
  console.log(`${program.name}: ${program.duration} days, ${program.totalMeals} meals`);
});
```

### Get Active Meal Plan

```typescript
const activePlan = await mealCalendarService.getActiveMealPlan(userId);

if (activePlan) {
  console.log(`Active plan: ${activePlan.name}`);
  console.log(`Day ${activePlan.currentDay} of ${activePlan.totalDays}`);
  console.log(`${activePlan.meals.length} meals in plan`);
}
```

---

## Complete User Flow Example

```typescript
import { mealCalendarService } from '../services';

async function weeklyMealPlanning(userId: string) {
  // 1. Generate a week of meals
  console.log('Generating meal plan...');
  const plan = await mealCalendarService.createMealFromText({
    mode: 'plan',
    userId,
    duration: 7,
    mealsPerDay: {
      breakfast: true,
      lunch: true,
      dinner: true,
      snack: false
    },
    servings: 2,
    dietaryRestrictions: ['gluten_free']
  });

  if (!plan.meals) {
    throw new Error('Failed to generate meal plan');
  }

  // 2. Schedule all meals for the week
  console.log('Scheduling meals...');
  const today = new Date();
  const scheduleRequests = plan.meals.map((meal, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() + Math.floor(index / 3));
    const mealSlots: MealSlot[] = ['breakfast', 'lunch', 'dinner'];
    
    return {
      mealId: meal.id,
      scheduledDate: date.toISOString().split('T')[0],
      mealSlot: mealSlots[index % 3],
      servings: 2
    };
  });

  const scheduled = await mealCalendarService.bulkScheduleMeals(userId, {
    schedules: scheduleRequests
  });

  console.log(`✅ Scheduled ${scheduled.length} meals`);

  // 3. View the week
  const weekView = await mealCalendarService.getWeekView(userId);
  
  weekView.forEach(day => {
    console.log(`\n${day.dayName} (${day.date}):`);
    day.meals.forEach(meal => {
      console.log(`  ${meal.meal_slot}: ${meal.meal.name} - ${meal.meal.nutrition.calories} cal`);
    });
    console.log(`  Total: ${day.totals.calories} calories`);
  });

  // 4. Mark today's breakfast as complete
  const todaysMeals = await mealCalendarService.getTodaysMeals(userId);
  if (todaysMeals?.meals.length) {
    const breakfastEntry = todaysMeals.meals.find(m => m.meal_slot === 'breakfast');
    if (breakfastEntry) {
      await mealCalendarService.markMealComplete(
        userId,
        breakfastEntry.schedule_id,
        'Great start to the day!'
      );
      console.log('\n✅ Breakfast marked complete');
    }
  }

  // 5. Get stats
  const stats = await mealCalendarService.getCalendarStats(userId);
  if (stats) {
    console.log(`\n📊 Stats:`);
    console.log(`  Completion rate: ${stats.completionRate.toFixed(1)}%`);
    console.log(`  Streak: ${stats.streakDays} days`);
    console.log(`  Avg calories: ${stats.averageDailyCalories} cal/day`);
  }
}

// Run the example
weeklyMealPlanning('your-user-id').catch(console.error);
```

---

## Data Models

### GeneratedMeal

```typescript
interface GeneratedMeal {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  cuisineType: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  ingredients: {
    name: string;
    amount: number;
    unit: string;
  }[];
  instructions: string[];
  nutrition: {
    caloriesPerServing: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  dietaryRestrictions: string[];
  tags: string[];
}
```

### ScheduleEntry

```typescript
interface ScheduleEntry {
  schedule_id: number;
  meal_id: string;
  user_id: string;
  scheduled_date: string;  // YYYY-MM-DD
  meal_slot: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout';
  servings: number;
  notes?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
```

### CalendarDay

```typescript
interface CalendarDay {
  date: string;
  dayName?: string;
  meals: {
    schedule_id: number;
    meal_id: string;
    meal_slot: string;
    servings: number;
    is_completed: boolean;
    meal: {
      name: string;
      nutrition: { 
        calories: number; 
        protein: number; 
        carbs: number; 
        fat: number; 
      };
    };
  }[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}
```

---

## Error Handling

```typescript
try {
  const scheduled = await mealCalendarService.scheduleMeal(userId, {
    mealId: 'meal_123',
    scheduledDate: '2026-01-28',
    mealSlot: 'dinner'
  });
} catch (error: any) {
  if (error.message?.includes('already scheduled')) {
    showError('A meal is already scheduled for this time slot');
  } else if (error.message?.includes('not found')) {
    showError('This meal no longer exists');
  } else if (error.message?.includes('Invalid date')) {
    showError('Please use YYYY-MM-DD format');
  } else {
    showError('Failed to schedule meal. Please try again.');
  }
}
```

---

## Test Credentials

**User ID:** `b0130eaf-4882-4258-bbb9-66ecc5b1ebac`

**Test Meal IDs:**
- `meal_1769534510988_dzxb1m200`
- `meal_1769534510991_1eqcxiwv4`
- `meal_1769534510994_53gp5ebnv`

---

## Related Documentation

- **Meal Library (user.wihy.ai):** See `MEAL_DIARY_API_GUIDE.md`
- **Route Separation:** `MEALS_AND_CALENDAR_ROUTE_SEPARATION.md`
- **Service Integration:** `SERVICE_SEPARATION_GUIDE.md`

---

## All 14 Calendar Endpoints

| Method | Endpoint | Service Method |
|--------|----------|----------------|
| GET | `/calendar/:userId` | `getCalendar(userId, startDate, endDate)` |
| GET | `/calendar/:userId/today` | `getTodaysMeals(userId)` |
| GET | `/calendar/:userId/week` | `getWeekView(userId, startDate?)` |
| GET | `/calendar/:userId/date/:date` | `getMealsForDate(userId, date)` |
| GET | `/calendar/:userId/stats` | `getCalendarStats(userId, period)` |
| POST | `/calendar/:userId/schedule` | `scheduleMeal(userId, request)` |
| POST | `/calendar/:userId/bulk-schedule` | `bulkScheduleMeals(userId, request)` |
| PUT | `/calendar/:userId/:id/complete` | `markMealComplete(userId, scheduleId, notes)` |
| DELETE | `/calendar/:userId/:id` | `removeScheduledMeal(userId, scheduleId)` |
| DELETE | `/calendar/:userId/date/:date` | `clearDay(userId, date)` |
| POST | `/calendar/:userId/copy` | `copyDay(userId, sourceDate, targetDate)` |
| GET | `/templates` | `getMealTemplates(mealType?, cuisine?)` |
| GET | `/day-plan` | `getDayPlan(userId, restrictions?)` |
| GET | `/active-plan/:userId` | `getActiveMealPlan(userId)` |
