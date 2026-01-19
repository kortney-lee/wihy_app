# Coach & Family Sharing - Service Implementation Guide

**Created:** January 2026  
**Purpose:** Document the complete coach-client and family sharing workflows

---

## Overview

WIHY supports three user contexts:
1. **Personal** - Individual user managing their own health
2. **Coach** - Health professionals managing client meal plans and workouts
3. **Family** - Parents/guardians sharing health content with family members

This document explains the service layer implementation for coach and family workflows.

---

## Table of Contents

1. [Coach-Client Workflows](#coach-client-workflows)
   - [Meal Plan Assignment](#coach-meal-plan-assignment)
   - [Workout Plan Assignment](#coach-workout-plan-assignment)
   - [Creating Content for Clients](#creating-content-for-clients)
2. [Family Sharing Workflows](#family-sharing-workflows)
   - [Family Setup](#family-setup)
   - [Sharing Meal Plans](#sharing-meal-plans-with-family)
   - [Sharing Workouts](#sharing-workouts-with-family)
   - [Collaborative Shopping Lists](#collaborative-shopping-lists)
3. [API Reference](#api-reference)
4. [Usage Examples](#usage-examples)

---

## Coach-Client Workflows

### Service: `coachService.ts`

The coach service handles all coach-client relationship management, content assignment, and monitoring.

### Coach Meal Plan Assignment

**Endpoint:** `POST /api/coaches/:coachId/clients/:clientId/meal-program`

```typescript
import { coachService } from '../services';

// Assign existing meal plan to client
const handleAssignMealPlan = async (clientId: string, programId: string) => {
  try {
    const result = await coachService.assignMealProgram({
      coachId: user.coachId,
      clientId,
      programId,
      startDate: '2026-01-15', // Optional, defaults to today
      notes: 'Focus on high protein for muscle building'
    });
    
    if (result.success) {
      Alert.alert('Success', 'Meal plan assigned to client!');
    }
  } catch (error) {
    Alert.alert('Error', 'Could not assign meal plan');
  }
};
```

**Get Client's Assigned Meal Programs:**
```typescript
const mealPrograms = await coachService.getClientMealPrograms(coachId, clientId);
// Returns: [{ assignment_id, program_id, program_name, status, completion_percentage, adherence_rate }]
```

### Coach Workout Plan Assignment

**Endpoint:** `POST /api/fitness/plans`

```typescript
// Assign existing workout plan to client
const handleAssignWorkout = async (clientId: string, programId: string) => {
  const result = await coachService.assignFitnessPlan({
    coachId: user.coachId,
    clientId,
    programId
  });
};
```

### Creating Content for Clients

Coaches can create custom meal plans or workout plans specifically tailored for a client:

**Create Meal Plan for Client:**
```typescript
const result = await coachService.createMealPlanForClient({
  coachId: user.coachId,
  clientId: 'client_123',
  description: 'Low-carb meal plan for weight loss, focusing on lean proteins',
  duration: 14,
  mealsPerDay: { breakfast: true, lunch: true, dinner: true },
  servings: 2,
  dietaryRestrictions: ['gluten-free'],
  dailyCalorieTarget: 1800,
  notes: 'Client has nut allergy'
});
// Result: { success: true, program_id: 'prog_xxx', assignment_id: 'assign_xxx' }
```

**Create Workout Plan for Client:**
```typescript
const result = await coachService.createWorkoutPlanForClient({
  coachId: user.coachId,
  clientId: 'client_123',
  name: '8-Week Strength Building',
  description: 'Progressive overload program',
  goal: 'STRENGTH',
  durationWeeks: 8,
  daysPerWeek: 4,
  equipment: ['barbell', 'dumbbells', 'bench'],
  notes: 'Client has knee injury - avoid deep squats'
});
```

---

## Family Sharing Workflows

### Service: `familyService.ts`

The family service handles family creation, member management, and content sharing among family members.

### Family Setup

**1. Create a Family:**
```typescript
import { familyService } from '../services';

const result = await familyService.createFamily({
  name: 'Smith Family',
  creatorId: user.id
});
// Result: { success: true, family_id: 'fam_xxx', guardian_code: 'WIHY-ABC123' }
```

**2. Members Join via Guardian Code:**
```typescript
// Other family members use the guardian code to join
const result = await familyService.joinFamily({
  userId: newMember.id,
  guardianCode: 'WIHY-ABC123',
  role: 'CHILD' // or 'MEMBER', 'GUARDIAN'
});
```

**3. Or Invite Members Directly:**
```typescript
const invite = await familyService.inviteMember({
  familyId: 'fam_xxx',
  inviterId: user.id,
  email: 'child@example.com',
  role: 'CHILD',
  message: 'Join our family health journey!'
});
```

### Sharing Meal Plans with Family

**Share Meal Plan:**
```typescript
// Parent creates or has a meal plan and wants to share with family
const result = await familyService.shareMealPlanWithFamily({
  familyId: user.familyId,
  programId: 'prog_xxx',
  sharedBy: user.id,
  servings: 4, // Family of 4
  permission: 'USE', // VIEW, USE, or EDIT
  assignToMembers: ['member_1', 'member_2'], // Optional: specific members
  notes: 'This week\'s family meal plan'
});
```

**Get Family's Shared Meal Plans:**
```typescript
const sharedPlans = await familyService.getFamilyMealPlans(familyId);
// Returns: [{ program_id, name, shared_by, servings, is_active, assigned_to_members }]
```

**Assign Meal Plan to Specific Member:**
```typescript
// Assign the family meal plan to a specific child
await familyService.assignMealPlanToMember(familyId, programId, childMemberId);
```

### Sharing Workouts with Family

**Share Workout Plan:**
```typescript
const result = await familyService.shareWorkoutWithFamily({
  familyId: user.familyId,
  programId: 'workout_xxx',
  sharedBy: user.id,
  permission: 'USE',
  assignToMembers: ['teen_member_id'], // e.g., share with teen child
  notes: 'Family fitness challenge - 30 days!'
});
```

**Get Family's Shared Workouts:**
```typescript
const workouts = await familyService.getFamilyWorkouts(familyId);
```

### Collaborative Shopping Lists

**Share Shopping List:**
```typescript
// Share the weekly shopping list so any family member can check items
const result = await familyService.shareShoppingListWithFamily({
  familyId: user.familyId,
  listId: 'list_xxx',
  sharedBy: user.id,
  permission: 'EDIT', // Family members can check items
  notes: 'Costco run this Saturday'
});
```

**Check Item (Any Family Member):**
```typescript
// When a family member picks up an item at the store
await familyService.checkShoppingListItem(familyId, listId, itemId, user.id);
```

---

## API Reference

### coachService Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| `assignMealProgram()` | `POST /api/coaches/:id/clients/:id/meal-program` | Assign meal plan to client |
| `getClientMealPrograms()` | `GET /api/coaches/:id/clients/:id/meal-programs` | Get client's meal plans |
| `unassignMealProgram()` | `DELETE /api/coaches/:id/clients/:id/meal-program/:id` | Remove meal plan |
| `createMealPlanForClient()` | `POST /api/coaches/:id/clients/:id/create-meal-plan` | Create custom meal plan for client |
| `createWorkoutPlanForClient()` | `POST /api/coaches/:id/clients/:id/create-workout-plan` | Create custom workout for client |
| `getClientWorkoutPrograms()` | `GET /api/coaches/:id/clients/:id/workout-programs` | Get client's workout plans |
| `assignFitnessPlan()` | `POST /api/fitness/plans` | Assign workout to client |
| `getClientDashboard()` | `GET /api/fitness/coach/:id/client/:id/dashboard` | Get client progress |

### familyService Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Family Management** | | |
| `createFamily()` | `POST /api/families` | Create new family |
| `getFamily()` | `GET /api/families/:id` | Get family details |
| `joinFamily()` | `POST /api/families/join` | Join via guardian code |
| `getGuardianCode()` | `GET /api/families/:id/guardian-code` | Get invite code |
| **Member Management** | | |
| `getMembers()` | `GET /api/families/:id/members` | List family members |
| `inviteMember()` | `POST /api/families/:id/invite` | Invite member |
| `removeMember()` | `DELETE /api/families/:id/members/:id` | Remove member |
| `updateMemberRole()` | `PUT /api/families/:id/members/:id/role` | Change role |
| **Meal Plan Sharing** | | |
| `shareMealPlanWithFamily()` | `POST /api/families/:id/share/meal-plan` | Share meal plan |
| `getFamilyMealPlans()` | `GET /api/families/:id/meal-plans` | Get shared meal plans |
| `assignMealPlanToMember()` | `POST /api/families/:id/meal-plans/:id/assign` | Assign to member |
| **Workout Sharing** | | |
| `shareWorkoutWithFamily()` | `POST /api/families/:id/share/workout` | Share workout |
| `getFamilyWorkouts()` | `GET /api/families/:id/workouts` | Get shared workouts |
| `assignWorkoutToMember()` | `POST /api/families/:id/workouts/:id/assign` | Assign to member |
| **Shopping List Sharing** | | |
| `shareShoppingListWithFamily()` | `POST /api/families/:id/share/shopping-list` | Share list |
| `getFamilyShoppingLists()` | `GET /api/families/:id/shopping-lists` | Get shared lists |
| `checkShoppingListItem()` | `PUT /api/families/:id/shopping-lists/:id/items/:id/check` | Check item |
| **Parental Controls** | | |
| `setParentalControls()` | `PUT /api/families/:id/members/:id/controls` | Set controls |
| `getParentalControls()` | `GET /api/families/:id/members/:id/controls` | Get controls |
| **Family Goals** | | |
| `setFamilyGoal()` | `POST /api/families/:id/goals` | Create family goal |
| `getFamilyGoals()` | `GET /api/families/:id/goals` | Get goals & progress |

---

## Usage Examples

### Complete Coach Workflow

```typescript
// 1. Coach creates a meal plan
const mealPlan = await mealService.createMealPlanFromDescription({
  description: 'High protein muscle building plan',
  duration: 14,
  mealsPerDay: { breakfast: true, lunch: true, dinner: true },
  dailyCalorieTarget: 2500,
  macrosTarget: { protein: 35, carbs: 40, fat: 25 }
});

// 2. Coach assigns it to client
await coachService.assignMealProgram({
  coachId: coach.id,
  clientId: 'client_123',
  programId: mealPlan.program_id,
  startDate: '2026-01-20',
  notes: 'Start after the holiday weekend'
});

// 3. Coach monitors client progress
const dashboard = await coachService.getClientDashboard(coach.id, 'client_123');
console.log('Adherence:', dashboard.nutrition_summary.goal_compliance_rate);
```

### Complete Family Workflow

```typescript
// 1. Parent creates family
const family = await familyService.createFamily({
  name: 'Johnson Family',
  creatorId: parent.id
});

// 2. Kids join using guardian code
await familyService.joinFamily({
  userId: child.id,
  guardianCode: family.guardian_code,
  role: 'CHILD'
});

// 3. Parent creates meal plan for family
const mealPlan = await mealService.createMealPlanFromDescription({
  description: 'Kid-friendly healthy dinners for 4',
  duration: 7,
  mealsPerDay: { dinner: true },
  servings: 4,
  specialFocus: ['kid_friendly'],
  timePerMeal: 'quick'
});

// 4. Share with family
await familyService.shareMealPlanWithFamily({
  familyId: family.family_id,
  programId: mealPlan.program_id,
  sharedBy: parent.id,
  servings: 4,
  permission: 'USE'
});

// 5. Generate and share shopping list
const shoppingList = await shoppingService.generateFromMealPlan(mealPlan.program_id);
await familyService.shareShoppingListWithFamily({
  familyId: family.family_id,
  listId: shoppingList.list_id,
  sharedBy: parent.id,
  permission: 'EDIT'
});

// 6. Family members can check items
await familyService.checkShoppingListItem(
  family.family_id,
  shoppingList.list_id,
  'item_123',
  child.id // Child checked off an item at the store
);

// 7. Set parental controls for child
await familyService.setParentalControls(family.family_id, child.id, {
  can_view_nutrition: true,
  can_edit_meals: false,
  require_approval_for_changes: true
});

// 8. Set family fitness goal
await familyService.setFamilyGoal({
  familyId: family.family_id,
  createdBy: parent.id,
  type: 'weekly_workouts',
  target: 12, // 12 total family workouts per week
  description: 'Family fitness challenge!'
});
```

---

## Data Flow Diagrams

### Coach → Client Flow

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     COACH       │      │     BACKEND     │      │     CLIENT      │
│   Dashboard     │      │     API         │      │    App View     │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │  1. Create Meal Plan   │                        │
         │───────────────────────>│                        │
         │                        │                        │
         │  2. Assign to Client   │                        │
         │───────────────────────>│                        │
         │                        │  3. Notification       │
         │                        │───────────────────────>│
         │                        │                        │
         │                        │  4. Load Assigned Plan │
         │                        │<───────────────────────│
         │                        │                        │
         │  5. Monitor Progress   │                        │
         │───────────────────────>│  6. Log Meals/Progress │
         │                        │<───────────────────────│
         │<───────────────────────│                        │
         │   Adherence Stats      │                        │
```

### Family Sharing Flow

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     PARENT      │      │     BACKEND     │      │  FAMILY MEMBER  │
│     (Admin)     │      │     API         │      │  (Child/Spouse) │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │  1. Create Family      │                        │
         │───────────────────────>│                        │
         │<───────────────────────│                        │
         │   Guardian Code        │                        │
         │                        │  2. Join with Code     │
         │                        │<───────────────────────│
         │                        │───────────────────────>│
         │                        │   Welcome to Family    │
         │                        │                        │
         │  3. Share Meal Plan    │                        │
         │───────────────────────>│                        │
         │                        │───────────────────────>│
         │                        │   New Plan Available   │
         │                        │                        │
         │  4. Share Shopping List│                        │
         │───────────────────────>│  5. Check Items        │
         │                        │<───────────────────────│
         │<───────────────────────│                        │
         │   Real-time Updates    │                        │
```

---

## Backend Requirements

For these workflows to function, the backend must implement:

### Coach Endpoints (coaching.wihy.ai)
- [ ] `POST /api/coaches/:coachId/clients/:clientId/meal-program`
- [ ] `GET /api/coaches/:coachId/clients/:clientId/meal-programs`
- [ ] `DELETE /api/coaches/:coachId/clients/:clientId/meal-program/:id`
- [ ] `POST /api/coaches/:coachId/clients/:clientId/create-meal-plan`
- [ ] `POST /api/coaches/:coachId/clients/:clientId/create-workout-plan`
- [ ] `GET /api/coaches/:coachId/clients/:clientId/workout-programs`

### Family Endpoints (auth.wihy.ai)
- [ ] `POST /api/families`
- [ ] `GET /api/families/:id`
- [ ] `POST /api/families/join`
- [ ] `GET /api/families/:id/guardian-code`
- [ ] `POST /api/families/:id/invite`
- [ ] `GET /api/families/:id/members`
- [ ] `DELETE /api/families/:id/members/:id`
- [ ] `POST /api/families/:id/share/meal-plan`
- [ ] `POST /api/families/:id/share/workout`
- [ ] `POST /api/families/:id/share/shopping-list`
- [ ] `GET /api/families/:id/meal-plans`
- [ ] `GET /api/families/:id/workouts`
- [ ] `GET /api/families/:id/shopping-lists`
- [ ] `PUT /api/families/:id/shopping-lists/:id/items/:id/check`
- [ ] `PUT /api/families/:id/members/:id/controls`
- [ ] `POST /api/families/:id/goals`

---

## Implementation Status

| Feature | Mobile Service | Backend API | UI Integration |
|---------|---------------|-------------|----------------|
| **Coach - Assign Meal Plan** | ✅ Complete | ⚠️ Pending | ⚠️ Pending |
| **Coach - Create Meal for Client** | ✅ Complete | ⚠️ Pending | ⚠️ Pending |
| **Coach - Assign Workout** | ✅ Complete | ✅ Complete | ✅ Complete |
| **Coach - Create Workout for Client** | ✅ Complete | ⚠️ Pending | ⚠️ Pending |
| **Coach - Monitor Progress** | ✅ Complete | ✅ Complete | ✅ Complete |
| **Family - Create Family** | ✅ Complete | ⚠️ Pending | ⚠️ Pending |
| **Family - Join via Code** | ✅ Complete | ⚠️ Pending | ✅ Partial |
| **Family - Share Meal Plan** | ✅ Complete | ⚠️ Pending | ⚠️ Pending |
| **Family - Share Workout** | ✅ Complete | ⚠️ Pending | ⚠️ Pending |
| **Family - Share Shopping List** | ✅ Complete | ⚠️ Pending | ⚠️ Pending |
| **Family - Parental Controls** | ✅ Complete | ⚠️ Pending | ⚠️ Pending |
| **Family - Family Goals** | ✅ Complete | ⚠️ Pending | ⚠️ Pending |

**Legend:**
- ✅ Complete - Fully implemented and working
- ⚠️ Pending - Service wrapper ready, awaiting backend implementation
- ❌ Not Started - No implementation

---

## Files Modified/Created

1. **`src/services/coachService.ts`** - Added:
   - `assignMealProgram()`
   - `getClientMealPrograms()`
   - `unassignMealProgram()`
   - `createMealPlanForClient()`
   - `createWorkoutPlanForClient()`
   - `getClientWorkoutPrograms()`

2. **`src/services/familyService.ts`** - NEW FILE with complete family sharing API

3. **`src/services/index.ts`** - Added exports for `familyService` and types

4. **`COACH_FAMILY_SHARING_GUIDE.md`** - This documentation file

---

## Next Steps

1. **Backend Team:** Implement the pending API endpoints listed above
2. **Mobile Team:** Wire up UI components to these new service methods
3. **QA Team:** Test coach-client and family workflows end-to-end

---

*Last Updated: January 2026*
