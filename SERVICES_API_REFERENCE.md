# Services API Reference

> **Base URL:** `https://services.wihy.ai`  
> **Service Files:** `src/services/coachService.ts`, `src/services/familyService.ts`, etc.  
> **Last Updated:** January 10, 2026

---

## Overview

The Services API (`services.wihy.ai`) provides business logic services including coach-client management, family sharing, fitness programs, meal plans, and more. This is separate from the Auth Service which handles identity.

---

## Table of Contents

1. [Coach Service](#coach-service)
2. [Family Service](#family-service)
3. [Fitness Service](#fitness-service)
4. [Meal Service](#meal-service)
5. [Shopping Service](#shopping-service)
6. [Types Reference](#types-reference)

---

## Coach Service

**File:** `src/services/coachService.ts`

### Invitations

#### `sendInvitation(invitation)`
Send coaching invitation to potential client.

```typescript
import { coachService } from '../services';

const result = await coachService.sendInvitation({
  coachId: 'coach_123',
  clientEmail: 'client@example.com',
  clientName: 'John Doe',        // Optional
  message: 'Join my coaching!'   // Optional
});
```

#### `getPendingInvitations(coachId)`
Get all pending invitations sent by coach.

```typescript
const invitations = await coachService.getPendingInvitations('coach_123');
// Returns: CoachInvitation[]
```

#### `acceptInvitation(invitationId, clientId)` / `declineInvitation(invitationId, clientId)`
Accept or decline a coaching invitation (called by client).

```typescript
await coachService.acceptInvitation('inv_123', 'user_456');
await coachService.declineInvitation('inv_123', 'user_456');
```

### Client Management

#### `listClients(coachId, params?)`
Get all clients for a coach with optional filtering.

```typescript
const clients = await coachService.listClients('coach_123', {
  status: 'active',   // Optional: 'active' | 'inactive'
  search: 'john'      // Optional: search by name
});
// Returns: Client[]
```

**Client Type:**
```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  joined_date: string;
  last_active?: string;
  active_meal_programs?: number;
  active_fitness_programs?: number;
}
```

#### `addClient(params)`
Add a client to coach's roster.

```typescript
const result = await coachService.addClient({
  coachId: 'coach_123',
  clientEmail: 'client@example.com',
  notes: 'Referred by Jane'  // Optional
});
// Returns: { success, client_id, relationship_id }
```

#### `removeClient(coachId, clientId)`
Remove client from roster.

```typescript
await coachService.removeClient('coach_123', 'client_456');
```

#### `updateClientStatus(coachId, clientId, status)`
Update client's active/inactive status.

```typescript
await coachService.updateClientStatus('coach_123', 'client_456', 'inactive');
```

### Dashboards & Monitoring

#### `getClientDashboard(coachId, clientId)`
Get comprehensive client progress dashboard.

```typescript
const dashboard = await coachService.getClientDashboard('coach_123', 'client_456');
```

**Returns:**
```typescript
interface ClientDashboard {
  success: boolean;
  client_id: string;
  coach_id: string;
  client: Client;
  active_meal_program: MealProgramAssignment | null;
  active_workout_program: WorkoutProgramAssignment | null;
  fitness_progress: {
    current_program?: string;
    workouts_completed: number;
    adherence_rate: number;
    recent_sessions: any[];
  };
  nutrition_summary: {
    total_meals_logged: number;
    avg_daily_calories: number;
    avg_daily_protein: number;
    avg_daily_carbs: number;
    avg_daily_fat: number;
    daily_average_calories: number;
    goal_compliance_rate: number;
    recent_meals: any[];
  };
  fitness_summary: {
    workouts_completed: number;
    total_minutes: number;
    avg_calories_burned: number;
  };
  period: string;
  generated_at: string;
}
```

#### `getCoachOverview(coachId)`
Get coach dashboard overview with all clients.

```typescript
const overview = await coachService.getCoachOverview('coach_123');
// Returns: CoachOverview
```

**CoachOverview Type:**
```typescript
interface CoachOverview {
  total_clients: number;
  active_clients: number;
  pending_invitations: number;
  clients: Client[];
  recent_activity: any[];
}
```

### Meal Program Assignment

#### `assignMealProgram(params)`
Assign an existing meal program to a client.

```typescript
const result = await coachService.assignMealProgram({
  coachId: 'coach_123',
  clientId: 'client_456',
  programId: 'meal_prog_789',
  startDate: '2026-01-15',      // Optional
  notes: 'Start with Phase 1'   // Optional
});
// Returns: { success, assignment_id }
```

#### `getClientMealPrograms(coachId, clientId)`
Get client's assigned meal programs.

```typescript
const programs = await coachService.getClientMealPrograms('coach_123', 'client_456');
// Returns: MealProgramAssignment[]
```

**MealProgramAssignment Type:**
```typescript
interface MealProgramAssignment {
  assignment_id: string;
  program_id: string;
  program_name: string;
  description: string;
  duration_days: number;
  total_calories_per_day: number;
  start_date: string;
  status: string;
  coach_notes: string | null;
  created_at: string;
  completion_percentage: string;
  adherence_rate: string;
}
```

#### `unassignMealProgram(coachId, clientId, assignmentId)`
Remove meal program from client.

```typescript
await coachService.unassignMealProgram('coach_123', 'client_456', 'assign_789');
```

#### `createMealPlanForClient(params)`
Create and assign a custom meal plan for a client.

```typescript
const result = await coachService.createMealPlanForClient({
  coachId: 'coach_123',
  clientId: 'client_456',
  description: 'High protein muscle building plan',
  duration: 14,  // days
  mealsPerDay: {
    breakfast: true,
    lunch: true,
    dinner: true,
    morningSnack: true,
    eveningSnack: false
  },
  servings: 1,
  dietaryRestrictions: ['gluten-free'],
  dailyCalorieTarget: 2500,
  notes: 'Focus on lean proteins'
});
// Returns: { success, program_id, assignment_id }
```

### Workout Program Assignment

#### `assignFitnessPlan(params)`
Assign workout program to client.

```typescript
const result = await coachService.assignFitnessPlan({
  coachId: 'coach_123',
  clientId: 'client_456',
  programId: 'workout_789',
  startDate: '2026-01-15',
  notes: 'Start light'
});
```

#### `getClientWorkoutPrograms(coachId, clientId)`
Get client's assigned workout programs.

```typescript
const programs = await coachService.getClientWorkoutPrograms('coach_123', 'client_456');
```

#### `createWorkoutPlanForClient(params)`
Create and assign custom workout for client.

```typescript
const result = await coachService.createWorkoutPlanForClient({
  coachId: 'coach_123',
  clientId: 'client_456',
  name: '8-Week Strength Building',
  description: 'Progressive overload program',
  goal: 'STRENGTH',  // HYPERTROPHY | STRENGTH | ENDURANCE | WEIGHT_LOSS
  durationWeeks: 8,
  daysPerWeek: 4,
  equipment: ['barbell', 'dumbbells', 'bench'],
  notes: 'Avoid deep squats (knee injury)'
});
```

### Client Notes

#### `addClientNote(coachId, clientId, content, category?, relatedProgramId?)`
Add a note for a client.

```typescript
const note = await coachService.addClientNote(
  'coach_123',
  'client_456',
  'Client mentioned shoulder pain during bench press',
  'fitness',  // 'progress' | 'nutrition' | 'fitness' | 'health' | 'general'
  'program_789'  // Optional related program
);
```

#### `getClientNotes(coachId, clientId, options?)`
Get notes for a client.

```typescript
const notes = await coachService.getClientNotes('coach_123', 'client_456', {
  category: 'fitness',  // Optional filter
  limit: 10,
  offset: 0
});
// Returns: ClientNote[]
```

#### `updateClientNote(coachId, noteId, updates)`
Update an existing note.

```typescript
await coachService.updateClientNote('coach_123', 'note_789', {
  content: 'Updated note content',
  category: 'health'
});
```

#### `deleteClientNote(coachId, noteId)`
Delete a note.

```typescript
await coachService.deleteClientNote('coach_123', 'note_789');
```

---

## Family Service

**File:** `src/services/familyService.ts`

### Family Management

#### `createFamily(params)`
Create a new family group.

```typescript
import { familyService } from '../services';

const result = await familyService.createFamily({
  name: 'The Smiths',
  creatorId: 'user_123'
});
// Returns: { success, family_id, guardian_code }
```

#### `getFamily(familyId)`
Get family details.

```typescript
const family = await familyService.getFamily('family_123');
// Returns: Family
```

**Family Type:**
```typescript
interface Family {
  id: string;
  name: string;
  created_by: string;
  guardian_code: string;
  created_at: string;
  members: FamilyMember[];
  subscription_plan?: 'family-basic' | 'family-premium';
  max_members: number;
}
```

#### `getFamilyByCode(guardianCode)`
Look up family by guardian code.

```typescript
const family = await familyService.getFamilyByCode('ABC12345');
```

#### `getUserFamily(userId)`
Get family that user belongs to.

```typescript
const family = await familyService.getUserFamily('user_123');
```

#### `updateFamily(familyId, updates)`
Update family settings.

```typescript
await familyService.updateFamily('family_123', { name: 'The Johnsons' });
```

### Guardian Codes

#### `getGuardianCode(familyId)`
Get current guardian invite code.

```typescript
const { code, expires_at } = await familyService.getGuardianCode('family_123');
```

#### `regenerateGuardianCode(familyId)`
Generate new guardian code.

```typescript
const { code } = await familyService.regenerateGuardianCode('family_123');
```

### Member Management

#### `getMembers(familyId)`
Get all family members.

```typescript
const members = await familyService.getMembers('family_123');
// Returns: FamilyMember[]
```

**FamilyMember Type:**
```typescript
interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  role: 'PARENT' | 'GUARDIAN' | 'CHILD' | 'MEMBER';
  joined_at: string;
  avatar_url?: string;
  is_active: boolean;
  age_group?: 'adult' | 'teen' | 'child';
  health_goals?: string[];
  dietary_restrictions?: string[];
}
```

#### `inviteMember(params)`
Invite someone to join family.

```typescript
const result = await familyService.inviteMember({
  familyId: 'family_123',
  inviterId: 'user_123',
  email: 'child@example.com',  // Optional
  role: 'CHILD',
  message: 'Join our family!'  // Optional
});
// Returns: { success, invite_id, invite_code }
```

#### `joinFamily(params)`
Join family using guardian code.

```typescript
const result = await familyService.joinFamily({
  userId: 'user_456',
  guardianCode: 'ABC12345',
  role: 'MEMBER'  // Optional
});
```

#### `acceptInvite(inviteId, userId)` / `declineInvite(inviteId, userId)`
Accept or decline family invitation.

```typescript
await familyService.acceptInvite('invite_123', 'user_456');
await familyService.declineInvite('invite_123', 'user_456');
```

#### `updateMemberRole(familyId, memberId, role)`
Change a member's role.

```typescript
await familyService.updateMemberRole('family_123', 'member_456', 'PARENT');
```

#### `removeMember(familyId, memberId)`
Remove member from family.

```typescript
await familyService.removeMember('family_123', 'member_456');
```

#### `leaveFamily(familyId, userId)`
Leave a family (for non-owner members).

```typescript
await familyService.leaveFamily('family_123', 'user_456');
```

### Sharing - Meal Plans

#### `shareMealPlanWithFamily(params)`
Share a meal plan with family members.

```typescript
const result = await familyService.shareMealPlanWithFamily({
  familyId: 'family_123',
  programId: 'meal_456',
  sharedBy: 'user_123',
  servings: 4,                              // Optional
  permission: 'USE',                        // 'VIEW' | 'USE' | 'EDIT'
  assignToMembers: ['member_1', 'member_2'], // Optional
  notes: 'Family dinners for the week'      // Optional
});
```

#### `getFamilyMealPlans(familyId)`
Get all shared meal plans.

```typescript
const plans = await familyService.getFamilyMealPlans('family_123');
// Returns: FamilyMealPlan[]
```

#### `assignMealPlanToMember(familyId, programId, memberId)`
Assign shared meal plan to specific member.

```typescript
await familyService.assignMealPlanToMember('family_123', 'meal_456', 'member_789');
```

#### `unshareMealPlan(familyId, shareId)`
Remove shared meal plan from family.

```typescript
await familyService.unshareMealPlan('family_123', 'share_456');
```

### Sharing - Workouts

#### `shareWorkoutWithFamily(params)`
Share workout with family.

```typescript
const result = await familyService.shareWorkoutWithFamily({
  familyId: 'family_123',
  programId: 'workout_456',
  sharedBy: 'user_123',
  permission: 'USE',
  assignToMembers: ['member_1'],
  notes: 'Family fitness challenge!'
});
```

#### `getFamilyWorkouts(familyId)`
Get shared workouts.

```typescript
const workouts = await familyService.getFamilyWorkouts('family_123');
```

#### `assignWorkoutToMember(familyId, programId, memberId)`
Assign workout to member.

```typescript
await familyService.assignWorkoutToMember('family_123', 'workout_456', 'member_789');
```

### Sharing - Shopping Lists

#### `shareShoppingListWithFamily(params)`
Share shopping list with family (collaborative).

```typescript
const result = await familyService.shareShoppingListWithFamily({
  familyId: 'family_123',
  listId: 'list_456',
  sharedBy: 'user_123',
  permission: 'EDIT',  // Family can check items
  notes: 'Costco run Saturday'
});
```

#### `getFamilyShoppingLists(familyId)`
Get shared shopping lists.

```typescript
const lists = await familyService.getFamilyShoppingLists('family_123');
```

#### `checkShoppingListItem(familyId, listId, itemId, userId)`
Mark item as checked (any member).

```typescript
await familyService.checkShoppingListItem('family_123', 'list_456', 'item_789', 'user_123');
```

### Sharing - Recipes

#### `shareRecipeWithFamily(params)`
Share a recipe with family.

```typescript
await familyService.shareRecipeWithFamily({
  familyId: 'family_123',
  recipeId: 'recipe_456',
  sharedBy: 'user_123',
  notes: 'Kids love this one!'
});
```

#### `getFamilyRecipes(familyId)`
Get shared recipes.

```typescript
const recipes = await familyService.getFamilyRecipes('family_123');
```

### Family Dashboard

#### `getFamilyDashboard(familyId)`
Get comprehensive family dashboard.

```typescript
const dashboard = await familyService.getFamilyDashboard('family_123');
```

**FamilyDashboard Type:**
```typescript
interface FamilyDashboard {
  family: Family;
  shared_meal_plans: FamilyMealPlan[];
  shared_workouts: FamilyWorkout[];
  shared_shopping_lists: FamilyShoppingList[];
  recent_activity: Array<{
    id: string;
    type: 'meal_logged' | 'workout_completed' | 'item_checked' | 'plan_shared';
    member_name: string;
    description: string;
    timestamp: string;
  }>;
  family_stats: {
    total_meals_logged_today: number;
    total_workouts_completed_week: number;
    active_meal_plans: number;
    active_workout_programs: number;
  };
}
```

#### `getMemberContent(familyId, memberId)`
Get content assigned to a specific member.

```typescript
const content = await familyService.getMemberContent('family_123', 'member_456');
// Returns: { assigned_meal_plans, assigned_workouts, available_shopping_lists }
```

### Parental Controls

#### `setParentalControls(familyId, memberId, controls)`
Set parental controls for a child member.

```typescript
await familyService.setParentalControls('family_123', 'child_456', {
  can_view_nutrition: true,
  can_edit_meals: false,
  can_create_workouts: false,
  daily_calorie_limit: 2000,
  require_approval_for_changes: true
});
```

#### `getParentalControls(familyId, memberId)`
Get parental controls for a member.

```typescript
const controls = await familyService.getParentalControls('family_123', 'child_456');
```

### Family Goals

#### `setFamilyGoal(params)`
Create a family-wide goal.

```typescript
const result = await familyService.setFamilyGoal({
  familyId: 'family_123',
  createdBy: 'user_123',
  type: 'weekly_workouts',  // 'daily_vegetables' | 'water_intake' | 'family_meals'
  target: 12,
  description: 'Exercise together 12 times this week!',
  startDate: '2026-01-06',
  endDate: '2026-01-12'
});
```

#### `getFamilyGoals(familyId)`
Get family goals and progress.

```typescript
const goals = await familyService.getFamilyGoals('family_123');
```

#### `updateGoalProgress(familyId, goalId, memberId, progress)`
Update progress toward a goal.

```typescript
await familyService.updateGoalProgress('family_123', 'goal_456', 'member_789', 2);
```

### Activity Feed

#### `getActivityFeed(familyId, params?)`
Get family activity feed.

```typescript
const activity = await familyService.getActivityFeed('family_123', {
  limit: 20,
  offset: 0,
  type: 'meal_logged'  // Optional filter
});
```

#### `logActivity(familyId, activity)`
Log a family activity (internal use).

```typescript
await familyService.logActivity('family_123', {
  memberId: 'member_456',
  type: 'meal_logged',
  description: 'Logged breakfast',
  details: { meal_id: 'meal_789' }
});
```

---

## Types Reference

### Shared Types

```typescript
// Share permissions
type SharePermission = 'VIEW' | 'USE' | 'EDIT';

// Share types
type ShareType = 'MEAL_PLAN' | 'WORKOUT' | 'SHOPPING_LIST' | 'RECIPE';

// Family roles
type FamilyRole = 'PARENT' | 'GUARDIAN' | 'CHILD' | 'MEMBER';

// Invitation status
type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

// Relationship status
type RelationshipStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'active' | 'inactive';

// Note categories
type NoteCategory = 'progress' | 'nutrition' | 'fitness' | 'health' | 'general';
```

### Coach Types

```typescript
interface CoachInvitation {
  id?: string;
  coachId: string;
  clientEmail: string;
  clientName?: string;
  message?: string;
  status?: InvitationStatus;
  created_at?: string;
  expires_at?: string;
}

interface ClientNote {
  note_id: string;
  coach_id: string;
  client_id: string;
  content: string;
  category: NoteCategory;
  related_program_id?: string;
  created_at: string;
  updated_at: string;
}
```

### Family Types

```typescript
interface FamilyInvite {
  id: string;
  family_id: string;
  inviter_id: string;
  invitee_email?: string;
  invite_code: string;
  role: FamilyRole;
  status: InviteStatus;
  created_at: string;
  expires_at: string;
  message?: string;
}

interface FamilyMealPlan {
  program_id: string;
  name: string;
  description: string;
  shared_by: string;
  shared_at: string;
  servings: number;
  duration_days: number;
  is_active: boolean;
  assigned_to_members?: string[];
}

interface FamilyWorkout {
  program_id: string;
  name: string;
  goal: string;
  shared_by: string;
  shared_at: string;
  duration_weeks: number;
  days_per_week: number;
  assigned_to_members?: string[];
  is_active: boolean;
}

interface FamilyShoppingList {
  list_id: string;
  name: string;
  shared_by: string;
  shared_at: string;
  total_items: number;
  items_checked: number;
  is_active: boolean;
  contributors: string[];
}
```

---

## Error Handling

All services use `fetchWithLogging` which provides:
- Network error handling
- API error status codes
- Detailed logging for debugging

```typescript
try {
  const clients = await coachService.listClients(coachId);
} catch (error) {
  if (error.status === 401) {
    // Handle unauthorized
  } else if (error.status === 404) {
    // Handle not found  
  } else {
    // Handle other errors
  }
}
```

---

## Service Exports

All services are exported from `src/services/index.ts`:

```typescript
// Import services
import { coachService, familyService } from '../services';

// Import types
import type {
  Client,
  ClientDashboard,
  CoachOverview,
  Family,
  FamilyMember,
  FamilyDashboard,
} from '../services';
```

---

## Related Documentation

- [AUTH_SERVICE_REFERENCE.md](./AUTH_SERVICE_REFERENCE.md) - Auth service (auth.wihy.ai)
- [COACH_FAMILY_API_GUIDE.md](./COACH_FAMILY_API_GUIDE.md) - Implementation guide
- [COACH_FAMILY_SHARING_GUIDE.md](./COACH_FAMILY_SHARING_GUIDE.md) - Sharing workflows

---

*Last Updated: January 10, 2026*

---

# Meal Diary & Shopping List - Client Integration Guide

## 🎯 Overview

The Meal Diary system provides a complete meal tracking and shopping list solution for the Wihy mobile app. Users can track their meals, dietary preferences, favorites, and generate shopping lists based on their meal plans.

**Production API Base URL:** `https://services.wihy.ai/api`

**Deployed:** January 10, 2026  
**Status:** ✅ Live and Tested  
**Database:** PostgreSQL on GCP Cloud SQL

---

## 🏗️ Architecture

### Database Tables
- `user_dietary_preferences` - User diet settings and goals
- `user_meal_diary` - Meal history and favorites
- `user_meal_shopping_lists` - Shopping lists
- `user_meal_shopping_list_items` - Individual shopping items

### Services
- `MealDiaryService` - Handles meal CRUD and logging
- `ShoppingListService` - Manages shopping lists and items

---

## 🔐 Authentication

**All endpoints require JWT authentication** except `/api/health` and `/api/docs`.

### Headers Required
```typescript
{
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

---

## 📡 API Endpoints

### Meal Diary Endpoints

#### 1. Get User Meal Diary
```
GET /api/users/:userId/meals/diary
```

**Query Parameters:**
- `limit` (optional) - Number of meals to return (default: 20)
- `offset` (optional) - Pagination offset (default: 0)
- `meal_type` (optional) - Filter by meal type: `breakfast`, `lunch`, `dinner`, `snack`, `pre-workout`, `post-workout`

**Response:**
```json
{
  "success": true,
  "user_id": "user_123",
  "dietary_preferences": {
    "diet_type": "keto",
    "dietary_restrictions": [],
    "allergies": [],
    "calorie_goal": 2000,
    "protein_goal": 150,
    "carb_goal": 50,
    "fat_goal": 150,
    "meals_per_day": 3,
    "cooking_skill_level": "intermediate",
    "max_prep_time_minutes": 30,
    "budget_preference": "moderate"
  },
  "recent_meals": [
    {
      "meal_id": "meal_001",
      "name": "Keto Breakfast Bowl",
      "meal_type": "breakfast",
      "nutrition": {
        "calories": 450,
        "protein": 25,
        "carbs": 12,
        "fat": 35
      },
      "ingredients": ["Eggs", "Avocado", "Bacon", "Spinach"],
      "tags": [],
      "is_favorite": true,
      "times_logged": 1,
      "last_logged": "2026-01-10T18:16:49.784Z",
      "serving_size": 1,
      "preparation_time": 15,
      "cooking_time": 10,
      "image_url": null,
      "source": "user_created"
    }
  ],
  "total_meals": 2,
  "has_more": false
}
```

---

#### 2. Create New Meal
```
POST /api/users/:userId/meals
```

**Request Body:**
```json
{
  "name": "Protein Shake",
  "meal_type": "breakfast",
  "nutrition": {
    "calories": 350,
    "protein": 30,
    "carbs": 25,
    "fat": 12
  },
  "ingredients": [
    { "name": "Whey protein", "amount": 1, "unit": "scoop" },
    { "name": "Banana", "amount": 1, "unit": "medium" },
    { "name": "Almond milk", "amount": 1, "unit": "cup" }
  ],
  "tags": ["high-protein", "quick", "breakfast"],
  "preparation_time": 5,
  "cooking_time": 0,
  "instructions": [
    "Add all ingredients to blender",
    "Blend for 30 seconds",
    "Serve immediately"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "meal": {
    "meal_id": "meal_abc123",
    "user_id": "user_123",
    "name": "Protein Shake",
    "meal_type": "breakfast",
    "nutrition": { "calories": 350, "protein": 30, "carbs": 25, "fat": 12 },
    "ingredients": [...],
    "tags": ["high-protein", "quick", "breakfast"],
    "is_favorite": false,
    "times_logged": 0,
    "created_at": "2026-01-10T18:30:00.000Z"
  }
}
```

---

#### 3. Get Specific Meal
```
GET /api/users/:userId/meals/:mealId
```

**Response:**
```json
{
  "success": true,
  "meal": {
    "meal_id": "meal_001",
    "name": "Keto Breakfast Bowl",
    "meal_type": "breakfast",
    "nutrition": { "calories": 450, "protein": 25, "carbs": 12, "fat": 35 },
    "ingredients": ["Eggs", "Avocado", "Bacon", "Spinach"],
    "is_favorite": true,
    "times_logged": 5,
    "last_logged": "2026-01-10T08:30:00.000Z"
  }
}
```

---

#### 4. Update Meal
```
PATCH /api/users/:userId/meals/:mealId
```

**Request Body (all fields optional):**
```json
{
  "name": "Updated Meal Name",
  "nutrition": { "calories": 400 },
  "tags": ["healthy", "quick"],
  "image_url": "https://storage.wihy.ai/meals/image.jpg"
}
```

---

#### 5. Delete Meal
```
DELETE /api/users/:userId/meals/:mealId
```

**Response:**
```json
{
  "success": true,
  "message": "Meal deleted successfully"
}
```

---

#### 6. Toggle Favorite
```
POST /api/users/:userId/meals/:mealId/favorite
```

Toggles the favorite status of a meal.

**Response:**
```json
{
  "success": true,
  "is_favorite": true,
  "message": "Meal marked as favorite"
}
```

---

#### 7. Log Meal
```
POST /api/users/:userId/meals/:mealId/log
```

Records that the user ate this meal. Increments `times_logged` and updates `last_logged`.

**Response:**
```json
{
  "success": true,
  "times_logged": 6,
  "last_logged": "2026-01-10T19:00:00.000Z"
}
```

---

### Dietary Preferences Endpoints

#### 8. Get Dietary Preferences
```
GET /api/users/:userId/preferences/dietary
```

**Response:**
```json
{
  "success": true,
  "preferences": {
    "user_id": "user_123",
    "diet_type": "keto",
    "dietary_restrictions": ["gluten-free"],
    "allergies": ["peanuts", "shellfish"],
    "calorie_goal": 2000,
    "protein_goal": 150,
    "carb_goal": 50,
    "fat_goal": 150,
    "meals_per_day": 3,
    "preferred_cuisines": ["italian", "mexican"],
    "disliked_ingredients": ["cilantro", "mushrooms"],
    "cooking_skill_level": "intermediate",
    "max_prep_time_minutes": 30,
    "budget_preference": "moderate",
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-10T18:00:00.000Z"
  }
}
```

---

#### 9. Update Dietary Preferences
```
PUT /api/users/:userId/preferences/dietary
```

**Request Body (all fields optional):**
```json
{
  "diet_type": "keto",
  "calorie_goal": 2200,
  "protein_goal": 160,
  "carb_goal": 50,
  "fat_goal": 160,
  "dietary_restrictions": ["gluten-free", "dairy-free"],
  "allergies": ["peanuts"],
  "meals_per_day": 4,
  "preferred_cuisines": ["italian", "japanese"],
  "cooking_skill_level": "advanced",
  "max_prep_time_minutes": 45,
  "budget_preference": "premium"
}
```

**Valid Values:**
- `diet_type`: `none`, `keto`, `paleo`, `vegan`, `vegetarian`, `pescatarian`, `mediterranean`, `low-carb`, `high-protein`
- `cooking_skill_level`: `beginner`, `intermediate`, `advanced`
- `budget_preference`: `budget`, `moderate`, `premium`

---

## 💻 Client Implementation Examples

### React Native / TypeScript

```typescript
// api/mealDiary.ts
import axios from 'axios';

const API_BASE = 'https://services.wihy.ai/api';

export interface Meal {
  meal_id: string;
  name: string;
  meal_type: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  tags: string[];
  is_favorite: boolean;
  times_logged: number;
  last_logged?: string;
  image_url?: string;
}

export interface DietaryPreferences {
  diet_type: string;
  calorie_goal: number;
  protein_goal: number;
  carb_goal: number;
  fat_goal: number;
  // ... other fields
}

class MealDiaryAPI {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get meal diary
  async getMealDiary(userId: string, options?: {
    limit?: number;
    offset?: number;
    meal_type?: string;
  }) {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.meal_type) params.append('meal_type', options.meal_type);

    const response = await axios.get(
      `${API_BASE}/users/${userId}/meals/diary?${params}`,
      { headers: this.headers }
    );
    return response.data;
  }

  // Create meal
  async createMeal(userId: string, mealData: Partial<Meal>) {
    const response = await axios.post(
      `${API_BASE}/users/${userId}/meals`,
      mealData,
      { headers: this.headers }
    );
    return response.data;
  }

  // Toggle favorite
  async toggleFavorite(userId: string, mealId: string) {
    const response = await axios.post(
      `${API_BASE}/users/${userId}/meals/${mealId}/favorite`,
      {},
      { headers: this.headers }
    );
    return response.data;
  }

  // Log meal
  async logMeal(userId: string, mealId: string) {
    const response = await axios.post(
      `${API_BASE}/users/${userId}/meals/${mealId}/log`,
      {},
      { headers: this.headers }
    );
    return response.data;
  }

  // Update dietary preferences
  async updatePreferences(userId: string, preferences: Partial<DietaryPreferences>) {
    const response = await axios.put(
      `${API_BASE}/users/${userId}/preferences/dietary`,
      preferences,
      { headers: this.headers }
    );
    return response.data;
  }

  // Get dietary preferences
  async getPreferences(userId: string) {
    const response = await axios.get(
      `${API_BASE}/users/${userId}/preferences/dietary`,
      { headers: this.headers }
    );
    return response.data;
  }
}

export default MealDiaryAPI;
```

---

### React Native Component Example

```typescript
// screens/MealDiaryScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import MealDiaryAPI, { Meal } from '../api/mealDiary';

export default function MealDiaryScreen() {
  const { user, token } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  const mealAPI = new MealDiaryAPI(token);

  useEffect(() => {
    loadMealDiary();
  }, []);

  const loadMealDiary = async () => {
    try {
      setLoading(true);
      const response = await mealAPI.getMealDiary(user.id, { limit: 20 });
      setMeals(response.recent_meals);
      setPreferences(response.dietary_preferences);
    } catch (error) {
      console.error('Error loading meal diary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (mealId: string) => {
    try {
      const response = await mealAPI.toggleFavorite(user.id, mealId);
      // Update local state
      setMeals(meals.map(meal => 
        meal.meal_id === mealId 
          ? { ...meal, is_favorite: response.is_favorite }
          : meal
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleLogMeal = async (mealId: string) => {
    try {
      const response = await mealAPI.logMeal(user.id, mealId);
      // Update local state
      setMeals(meals.map(meal => 
        meal.meal_id === mealId 
          ? { 
              ...meal, 
              times_logged: response.times_logged,
              last_logged: response.last_logged 
            }
          : meal
      ));
    } catch (error) {
      console.error('Error logging meal:', error);
    }
  };

  const renderMeal = ({ item }: { item: Meal }) => (
    <View style={styles.mealCard}>
      <Text style={styles.mealName}>{item.name}</Text>
      <Text style={styles.mealType}>{item.meal_type}</Text>
      
      <View style={styles.nutrition}>
        <Text>{item.nutrition.calories} cal</Text>
        <Text>P: {item.nutrition.protein}g</Text>
        <Text>C: {item.nutrition.carbs}g</Text>
        <Text>F: {item.nutrition.fat}g</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleToggleFavorite(item.meal_id)}>
          <Text>{item.is_favorite ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => handleLogMeal(item.meal_id)}>
          <Text>Log Meal</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.timesLogged}>
        Logged {item.times_logged} times
      </Text>
    </View>
  );

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      {preferences && (
        <View style={styles.preferencesCard}>
          <Text style={styles.preferencesTitle}>Daily Goals</Text>
          <Text>Diet: {preferences.diet_type}</Text>
          <Text>Calories: {preferences.calorie_goal}</Text>
          <Text>Protein: {preferences.protein_goal}g</Text>
          <Text>Carbs: {preferences.carb_goal}g</Text>
          <Text>Fat: {preferences.fat_goal}g</Text>
        </View>
      )}

      <FlatList
        data={meals}
        keyExtractor={(item) => item.meal_id}
        renderItem={renderMeal}
        onRefresh={loadMealDiary}
        refreshing={loading}
      />
    </View>
  );
}

const styles = {
  container: { flex: 1, padding: 16 },
  preferencesCard: { padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 16 },
  preferencesTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  mealCard: { padding: 16, backgroundColor: 'white', borderRadius: 8, marginBottom: 12 },
  mealName: { fontSize: 16, fontWeight: 'bold' },
  mealType: { color: '#666', marginTop: 4 },
  nutrition: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  timesLogged: { fontSize: 12, color: '#999', marginTop: 8 },
};
```

---

## 🔄 Common Use Cases

### Use Case 1: Load User's Meal History
```typescript
// Load recent meals when user opens Create Meals screen
const loadUserMealHistory = async () => {
  const response = await mealAPI.getMealDiary(userId, { limit: 20 });
  
  // Show dietary preferences
  setDietaryPreferences(response.dietary_preferences);
  
  // Show recent meals
  setRecentMeals(response.recent_meals);
  
  // Filter favorites for quick access
  const favorites = response.recent_meals.filter(m => m.is_favorite);
  setFavoriteMeals(favorites);
};
```

---

### Use Case 2: Create Meal from Food Diary
```typescript
// When user clicks "Save to Meals" from food diary entry
const saveFoodDiaryAsMeal = async (foodDiaryEntry) => {
  const mealData = {
    name: foodDiaryEntry.food_name || "My Meal",
    meal_type: determineMealType(foodDiaryEntry.logged_at), // breakfast/lunch/dinner
    nutrition: {
      calories: foodDiaryEntry.calories,
      protein: foodDiaryEntry.protein,
      carbs: foodDiaryEntry.carbs,
      fat: foodDiaryEntry.fat,
    },
    ingredients: [{ name: foodDiaryEntry.food_name, amount: 1, unit: "serving" }],
    tags: ["food-diary"],
    source: "food_diary",
  };

  const response = await mealAPI.createMeal(userId, mealData);
  console.log('Meal saved:', response.meal.meal_id);
};
```

---

### Use Case 3: Log Meal and Track Nutrition
```typescript
// When user selects a meal to eat
const eatMeal = async (meal: Meal) => {
  // Log the meal
  const response = await mealAPI.logMeal(userId, meal.meal_id);
  
  // Also log to nutrition tracking
  await nutritionAPI.logConsumption({
    user_id: userId,
    food_name: meal.name,
    calories: meal.nutrition.calories,
    protein: meal.nutrition.protein,
    carbs: meal.nutrition.carbs,
    fat: meal.nutrition.fat,
    logged_at: new Date().toISOString(),
  });
  
  // Update UI
  showNotification(`${meal.name} logged! Total times: ${response.times_logged}`);
};
```

---

### Use Case 4: Filter Meals by Type
```typescript
// Load breakfast meals only
const loadBreakfastMeals = async () => {
  const response = await mealAPI.getMealDiary(userId, {
    meal_type: 'breakfast',
    limit: 10,
  });
  setBreakfastMeals(response.recent_meals);
};

// Load pre-workout snacks
const loadPreWorkoutSnacks = async () => {
  const response = await mealAPI.getMealDiary(userId, {
    meal_type: 'pre-workout',
    limit: 5,
  });
  setPreWorkoutSnacks(response.recent_meals);
};
```

---

### Use Case 5: Update User Goals
```typescript
// When user updates their diet preferences
const updateDietGoals = async (newGoals: Partial<DietaryPreferences>) => {
  const response = await mealAPI.updatePreferences(userId, newGoals);
  
  if (response.success) {
    setPreferences(response.preferences);
    showNotification('Diet preferences updated!');
  }
};

// Example: User switches to keto diet
updateDietGoals({
  diet_type: 'keto',
  carb_goal: 50,
  fat_goal: 150,
  protein_goal: 150,
});
```

---

## ⚠️ Error Handling

### Common HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response data |
| 400 | Bad Request | Check request body validation |
| 401 | Unauthorized | Refresh JWT token |
| 404 | Not Found | Meal or user not found |
| 500 | Server Error | Retry or show error message |

### Error Response Format
```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "INVALID_MEAL_TYPE"
}
```

### Example Error Handling
```typescript
try {
  const response = await mealAPI.createMeal(userId, mealData);
  return response.meal;
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired, refresh and retry
    await refreshAuthToken();
    return mealAPI.createMeal(userId, mealData);
  } else if (error.response?.status === 400) {
    // Validation error
    showError(error.response.data.error);
  } else {
    // Network or server error
    showError('Unable to save meal. Please try again.');
  }
}
```

---

## 📊 Data Models

### Meal Object
```typescript
interface Meal {
  meal_id: string;              // Unique identifier
  user_id: string;              // Owner user ID
  name: string;                 // Meal name
  meal_type: MealType;          // breakfast, lunch, dinner, snack, pre-workout, post-workout
  nutrition: {
    calories: number;
    protein: number;            // grams
    carbs: number;             // grams
    fat: number;               // grams
  };
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;              // cup, tbsp, oz, grams, etc.
  }>;
  tags: string[];              // ["high-protein", "quick", "keto"]
  is_favorite: boolean;
  times_logged: number;        // How many times user ate this
  last_logged?: string;        // ISO timestamp
  serving_size: number;        // Default: 1
  preparation_time?: number;   // minutes
  cooking_time?: number;       // minutes
  instructions?: string[];     // Step-by-step instructions
  image_url?: string;          // URL to meal image
  source: string;              // "user_created", "ai_generated", "recipe_import", "food_diary"
  recipe_url?: string;         // Original recipe URL if imported
  created_at: string;          // ISO timestamp
  updated_at: string;          // ISO timestamp
}
```

### Dietary Preferences Object
```typescript
interface DietaryPreferences {
  user_id: string;
  diet_type: 'none' | 'keto' | 'paleo' | 'vegan' | 'vegetarian' | 
             'pescatarian' | 'mediterranean' | 'low-carb' | 'high-protein';
  dietary_restrictions: string[];  // ["gluten-free", "dairy-free"]
  allergies: string[];             // ["peanuts", "shellfish"]
  calorie_goal: number;
  protein_goal: number;            // grams
  carb_goal: number;               // grams
  fat_goal: number;                // grams
  meals_per_day: number;           // Default: 3
  preferred_cuisines: string[];    // ["italian", "mexican", "japanese"]
  disliked_ingredients: string[];  // ["cilantro", "mushrooms"]
  cooking_skill_level: 'beginner' | 'intermediate' | 'advanced';
  max_prep_time_minutes: number;   // Maximum preparation time
  budget_preference: 'budget' | 'moderate' | 'premium';
  created_at: string;
  updated_at: string;
}
```

---

## 🧪 Testing

### Test Data Available
The production database includes sample data for testing:

**User:** `user_123` (keto diet)
- 2 meals: "Keto Breakfast Bowl", "Grilled Chicken Salad"
- Diet preferences: 2000 cal, 150g protein, 50g carbs, 150g fat

**User:** `test_user` (vegan diet)
- 1 meal: "Vegan Buddha Bowl"
- Diet preferences: 1800 cal, 100g protein, 200g carbs, 60g fat

### Test Script
```bash
# Test production API
node test-production-api.js
```

---

## 🚀 Deployment Status

✅ **Production:** Live at `https://services.wihy.ai`  
✅ **Database:** Migrated and seeded  
✅ **API Endpoints:** All tested and working  
✅ **Sample Data:** Available for testing  

**Deployment Date:** January 10, 2026  
**Last Migration:** `create-meal-diary-tables-v2.sql`

---

## 📞 Support

For questions or issues:
1. Check API response error messages
2. Verify JWT token is valid
3. Review this documentation
4. Contact backend team

---

## 📝 Changelog

### v1.0.0 (January 10, 2026)
- Initial release
- Meal diary CRUD operations
- Dietary preferences management
- Favorite and logging functionality
- Shopping list tables (routes coming soon)
- Full TypeScript/React Native examples
