# Coach & Family Services - Complete Implementation Guide

> **Last Updated:** January 10, 2026  
> **Base URL:** `https://services.wihy.ai`  
> **Service Files:** `src/services/coachService.ts`, `src/services/familyService.ts`

---

## Table of Contents

1. [Overview](#overview)
2. [Coach Service](#coach-service)
   - [Types](#coach-types)
   - [Invitations](#invitations)
   - [Client Management](#client-management)
   - [Dashboards & Monitoring](#dashboards--monitoring)
   - [Meal Program Assignment](#meal-program-assignment)
   - [Workout Program Assignment](#workout-program-assignment)
   - [Client Notes](#client-notes)
3. [Family Service](#family-service)
   - [Types](#family-types)
   - [Family Management](#family-management)
   - [Guardian Codes](#guardian-codes)
   - [Member Management](#member-management)
   - [Meal Plan Sharing](#meal-plan-sharing)
   - [Workout Sharing](#workout-sharing)
   - [Shopping List Sharing](#shopping-list-sharing)
   - [Recipe Sharing](#recipe-sharing)
   - [Parental Controls](#parental-controls)
   - [Family Goals](#family-goals)
   - [Activity Feed](#activity-feed)
4. [Error Handling](#error-handling)
5. [Service Export Guide](#service-export-guide)
6. [Implementation Status](#implementation-status)

---

## Overview

The WiHY app has two main relationship management services:

| Service | Purpose | Primary Users |
|---------|---------|---------------|
| **Coach Service** | Professional coach-client relationship management | Coaches, Trainers, Nutritionists |
| **Family Service** | Family sharing and parental control features | Parents, Guardians, Family Members |

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)             │
├─────────────────────────────────────────────────────────┤
│  authService          │  coachService   │ familyService │
│  (auth.wihy.ai)       │  (services.wihy.ai)              │
└───────────┬───────────┴────────────┬────────────────────┘
            │                        │
            ▼                        ▼
┌───────────────────┐    ┌────────────────────────────────┐
│   Auth Backend    │    │      Services Backend          │
│  - User identity  │    │  - Coach management            │
│  - Family codes   │    │  - Family sharing              │
│  - Basic coach    │    │  - Programs & assignments      │
└───────────────────┘    └────────────────────────────────┘
```

---

## Coach Service

**File:** `src/services/coachService.ts`

### Coach Types

```typescript
// ============= ENUMS & SIMPLE TYPES =============

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type RelationshipStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'active' | 'inactive';
export type NoteCategory = 'progress' | 'nutrition' | 'fitness' | 'health' | 'general';

// ============= INVITATION TYPES =============

export interface CoachInvitation {
  id?: string;
  coachId: string;
  clientEmail: string;
  clientName?: string;
  message?: string;
  status?: InvitationStatus;
  created_at?: string;
  expires_at?: string;
}

export interface CoachingRelationship {
  id?: string;
  coachId: string;
  clientId: string;
  status: RelationshipStatus;
  started_at?: string;
  ended_at?: string;
}

// ============= CLIENT TYPES =============

/** Raw API response type */
export interface APIClient {
  client_id: string;
  status: string;
  relationship_started: string;
  client_name: string | null;
  client_email: string | null;
  active_meal_programs: string;
  active_fitness_programs: string;
}

/** Normalized client type for UI */
export interface Client {
  id: string;
  name: string;
  email: string;
  status: RelationshipStatus;
  joined_date: string;
  last_active?: string;
  active_meal_programs?: number;
  active_fitness_programs?: number;
}

// ============= PROGRAM TYPES =============

export interface MealProgramAssignment {
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

export interface WorkoutProgramAssignment {
  assignment_id: string;
  program_id: string;
  program_name: string;
  description: string;
  goal: string;
  duration_weeks: number;
  days_per_week: number;
  start_date: string;
  status: string;
  coach_notes: string | null;
  completion_percentage: string;
}

// ============= DASHBOARD TYPES =============

export interface ClientDashboard {
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

export interface CoachOverview {
  total_clients: number;
  active_clients: number;
  pending_invitations: number;
  clients: Client[];
  recent_activity: any[];
}

// ============= CLIENT NOTE TYPES =============

export interface ClientNote {
  note_id: string;
  coach_id: string;
  client_id: string;
  content: string;
  category: NoteCategory;
  related_program_id?: string;
  created_at: string;
  updated_at: string;
}

// ============= PROGRAM CREATION PARAMS =============

export interface CreateMealPlanParams {
  description: string;
  duration?: number;
  mealsPerDay?: {
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
    morningSnack?: boolean;
    eveningSnack?: boolean;
  };
  servings?: number;
  dietaryRestrictions?: string[];
  dailyCalorieTarget?: number;
  macrosTarget?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  notes?: string;
}

export interface CreateWorkoutPlanParams {
  name: string;
  description?: string;
  goal: 'STRENGTH' | 'WEIGHT_LOSS' | 'GENERAL_FITNESS' | 'MUSCLE_BUILDING' | 'HYPERTROPHY' | 'ENDURANCE';
  durationWeeks: number;
  daysPerWeek: number;
  equipment?: string[];
  minutesPerWorkout?: number;
  notes?: string;
}
```

---

### Invitations

#### Send Invitation

```typescript
import { coachService } from '../services';

// Send coaching invitation
const result = await coachService.sendInvitation({
  coachId: 'coach_123',
  clientEmail: 'john@example.com',
  clientName: 'John Doe',      // Optional
  message: 'Welcome to my coaching program!'  // Optional
});

// Response
{
  success: true,
  invitation_id: 'inv_abc123',
  message: 'Invitation sent successfully'
}
```

#### Get Pending Invitations

```typescript
const invitations = await coachService.getPendingInvitations('coach_123');

// Returns: CoachInvitation[]
[
  {
    id: 'inv_123',
    coachId: 'coach_123',
    clientEmail: 'john@example.com',
    status: 'PENDING',
    created_at: '2026-01-10T...',
    expires_at: '2026-01-17T...'
  }
]
```

#### Accept/Decline Invitation (Client Side)

```typescript
// Accept invitation
await coachService.acceptInvitation('inv_123', 'client_456');

// Decline invitation
await coachService.declineInvitation('inv_123', 'client_456');
```

---

### Client Management

#### List All Clients

```typescript
// Get all clients
const clients = await coachService.listClients('coach_123');

// With filtering
const activeClients = await coachService.listClients('coach_123', {
  status: 'active',
  search: 'john'
});

// Returns: Client[]
[
  {
    id: 'client_456',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    joined_date: '2026-01-01',
    active_meal_programs: 1,
    active_fitness_programs: 1
  }
]
```

#### Add Client

```typescript
const result = await coachService.addClient({
  coachId: 'coach_123',
  clientEmail: 'newclient@example.com',
  notes: 'Referred by existing client'  // Optional
});

// Response
{
  success: true,
  client_id: 'client_789',
  relationship_id: 'rel_abc'
}
```

#### Remove Client

```typescript
await coachService.removeClient('coach_123', 'client_456');
```

#### Update Client Status

```typescript
await coachService.updateClientStatus('coach_123', 'client_456', 'inactive');
// Or 'active' to reactivate
```

#### Get Client's Coach (From Client Perspective)

```typescript
const coach = await coachService.getClientCoach('client_456');
```

---

### Dashboards & Monitoring

#### Get Coach Overview

```typescript
const overview = await coachService.getCoachOverview('coach_123');

// Returns: CoachOverview
{
  total_clients: 15,
  active_clients: 12,
  pending_invitations: 3,
  clients: [...],
  recent_activity: [...]
}
```

#### Get Client Dashboard

```typescript
const dashboard = await coachService.getClientDashboard('coach_123', 'client_456');

// Returns: ClientDashboard
{
  success: true,
  client_id: 'client_456',
  coach_id: 'coach_123',
  client: { /* Client details */ },
  active_meal_program: { /* or null */ },
  active_workout_program: { /* or null */ },
  fitness_progress: {
    workouts_completed: 12,
    adherence_rate: 85,
    recent_sessions: [...]
  },
  nutrition_summary: {
    total_meals_logged: 45,
    avg_daily_calories: 2100,
    avg_daily_protein: 140,
    goal_compliance_rate: 78,
    recent_meals: [...]
  },
  period: '7d',
  generated_at: '2026-01-10T...'
}
```

---

### Meal Program Assignment

#### Assign Existing Program

```typescript
const result = await coachService.assignMealProgram({
  coachId: 'coach_123',
  clientId: 'client_456',
  programId: 'meal_prog_789',
  startDate: '2026-01-15',    // Optional, defaults to today
  notes: 'Focus on Phase 1'   // Optional
});
```

#### Create & Assign Custom Meal Plan

```typescript
const result = await coachService.createMealPlanForClient({
  coachId: 'coach_123',
  clientId: 'client_456',
  description: 'High protein cutting plan',
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
  dailyCalorieTarget: 1800,
  notes: 'Competition prep phase 1'
});

// Returns
{
  success: true,
  program_id: 'meal_prog_new',
  assignment_id: 'assign_123'
}
```

#### Get Client's Meal Programs

```typescript
const programs = await coachService.getClientMealPrograms('coach_123', 'client_456');

// Returns
[
  {
    assignment_id: 'assign_123',
    program_id: 'meal_prog_789',
    program_name: 'High Protein Plan',
    assigned_date: '2026-01-10',
    start_date: '2026-01-15',
    status: 'ACTIVE',
    completion_percentage: 45,
    adherence_rate: 82
  }
]
```

#### Unassign Meal Program

```typescript
await coachService.unassignMealProgram('coach_123', 'client_456', 'assign_123');
```

---

### Workout Program Assignment

#### Assign Existing Program

```typescript
const result = await coachService.assignFitnessPlan({
  coachId: 'coach_123',
  clientId: 'client_456',
  programId: 'workout_789',
  startDate: '2026-01-15',
  notes: 'Start with lighter weights'
});
```

#### Create & Assign Custom Workout

```typescript
const result = await coachService.createWorkoutPlanForClient({
  coachId: 'coach_123',
  clientId: 'client_456',
  name: '8-Week Strength Builder',
  description: 'Progressive overload program',
  goal: 'STRENGTH',  // HYPERTROPHY | STRENGTH | ENDURANCE | WEIGHT_LOSS
  durationWeeks: 8,
  daysPerWeek: 4,
  equipment: ['barbell', 'dumbbells', 'bench', 'cables'],
  notes: 'Avoid deep squats due to knee injury'
});
```

#### Get Client's Workout Programs

```typescript
const workouts = await coachService.getClientWorkoutPrograms('coach_123', 'client_456');
```

#### Unassign Workout Program

```typescript
await coachService.unassignFitnessPlan('coach_123', 'client_456', 'assign_789');
```

---

### Client Notes

#### Add Note

```typescript
const note = await coachService.addClientNote(
  'coach_123',
  'client_456',
  'Client reported shoulder discomfort during bench press. Recommended reducing weight.',
  'fitness',  // 'progress' | 'nutrition' | 'fitness' | 'health' | 'general'
  'workout_789'  // Optional: related program ID
);

// Returns: ClientNote
{
  note_id: 'note_123',
  coach_id: 'coach_123',
  client_id: 'client_456',
  content: '...',
  category: 'fitness',
  related_program_id: 'workout_789',
  created_at: '2026-01-10T...',
  updated_at: '2026-01-10T...'
}
```

#### Get Notes

```typescript
// All notes
const notes = await coachService.getClientNotes('coach_123', 'client_456');

// Filtered by category
const fitnessNotes = await coachService.getClientNotes('coach_123', 'client_456', {
  category: 'fitness',
  limit: 10,
  offset: 0
});
```

#### Update Note

```typescript
const updated = await coachService.updateClientNote('coach_123', 'note_123', {
  content: 'Updated note content',
  category: 'health'
});
```

#### Delete Note

```typescript
await coachService.deleteClientNote('coach_123', 'note_123');
```

---

## Family Service

**File:** `src/services/familyService.ts`

### Family Types

```typescript
// ============= ENUMS & SIMPLE TYPES =============

export type FamilyRole = 'PARENT' | 'GUARDIAN' | 'CHILD' | 'MEMBER';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type ShareType = 'MEAL_PLAN' | 'WORKOUT' | 'SHOPPING_LIST' | 'RECIPE';
export type SharePermission = 'VIEW' | 'USE' | 'EDIT';

// ============= MEMBER TYPES =============

export interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  role: FamilyRole;
  joined_at: string;
  avatar_url?: string;
  is_active: boolean;
  age_group?: 'adult' | 'teen' | 'child';
  health_goals?: string[];
  dietary_restrictions?: string[];
}

// ============= FAMILY TYPES =============

export interface Family {
  id: string;
  name: string;
  created_by: string;
  guardian_code: string;
  created_at: string;
  members: FamilyMember[];
  subscription_plan?: 'family-basic' | 'family-premium';
  max_members: number;
}

export interface FamilyInvite {
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

// ============= SHARED ITEM TYPES =============

export interface SharedItem {
  share_id: string;
  item_id: string;
  item_type: ShareType;
  item_name: string;
  shared_by: string;
  shared_by_name: string;
  shared_with_family: boolean;
  shared_with_members?: string[];
  permission: SharePermission;
  shared_at: string;
  expires_at?: string;
  notes?: string;
}

export interface FamilyMealPlan {
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

export interface FamilyWorkout {
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

export interface FamilyShoppingList {
  list_id: string;
  name: string;
  shared_by: string;
  shared_at: string;
  total_items: number;
  items_checked: number;
  is_active: boolean;
  contributors: string[];
}

// ============= DASHBOARD TYPE =============

export interface FamilyDashboard {
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

---

### Family Management

#### Create Family

```typescript
import { familyService } from '../services';

const result = await familyService.createFamily({
  name: 'The Smith Family',
  creatorId: 'user_123'
});

// Response
{
  success: true,
  family_id: 'family_abc',
  guardian_code: 'SMITH2026'
}
```

#### Get Family

```typescript
// By ID
const family = await familyService.getFamily('family_abc');

// By guardian code
const family = await familyService.getFamilyByCode('SMITH2026');

// Get current user's family
const family = await familyService.getUserFamily('user_123');
```

#### Update Family

```typescript
await familyService.updateFamily('family_abc', {
  name: 'The Johnson Family'
});
```

---

### Guardian Codes

Guardian codes allow children or other members to join a family without email invitations.

#### Get Code

```typescript
const { code, expires_at } = await familyService.getGuardianCode('family_abc');
// code: 'SMITH2026'
```

#### Regenerate Code

```typescript
const { code } = await familyService.regenerateGuardianCode('family_abc');
// New code generated
```

---

### Member Management

#### Get Members

```typescript
const members = await familyService.getMembers('family_abc');

// Returns: FamilyMember[]
[
  {
    id: 'user_123',
    name: 'Mom',
    role: 'PARENT',
    age_group: 'adult',
    is_active: true,
    joined_at: '2026-01-01'
  },
  {
    id: 'user_456',
    name: 'Johnny',
    role: 'CHILD',
    age_group: 'teen',
    is_active: true
  }
]
```

#### Invite Member

```typescript
// Invite via email
const result = await familyService.inviteMember({
  familyId: 'family_abc',
  inviterId: 'user_123',
  email: 'grandma@example.com',
  role: 'GUARDIAN',
  message: 'Join our family to track meals together!'
});

// Returns
{
  success: true,
  invite_id: 'inv_789',
  invite_code: 'INVITE123'
}
```

#### Join Family

```typescript
// Join using guardian code
const result = await familyService.joinFamily({
  userId: 'user_789',
  guardianCode: 'SMITH2026',
  role: 'CHILD'  // Optional, defaults to MEMBER
});
```

#### Accept/Decline Invite

```typescript
// Accept
await familyService.acceptInvite('inv_789', 'user_456');

// Decline
await familyService.declineInvite('inv_789', 'user_456');
```

#### Update Member Role

```typescript
await familyService.updateMemberRole('family_abc', 'user_456', 'GUARDIAN');
```

#### Remove Member

```typescript
// Parent removes member
await familyService.removeMember('family_abc', 'user_789');
```

#### Leave Family

```typescript
// Member leaves voluntarily
await familyService.leaveFamily('family_abc', 'user_789');
```

---

### Meal Plan Sharing

#### Share With Family

```typescript
const result = await familyService.shareMealPlanWithFamily({
  familyId: 'family_abc',
  programId: 'meal_123',
  sharedBy: 'user_123',
  servings: 4,                              // Scale for family size
  permission: 'USE',                        // 'VIEW' | 'USE' | 'EDIT'
  assignToMembers: ['user_456', 'user_789'], // Optional specific members
  notes: 'Weekly family dinner plan'        // Optional
});
```

#### Get Family Meal Plans

```typescript
const plans = await familyService.getFamilyMealPlans('family_abc');
```

#### Assign to Specific Member

```typescript
await familyService.assignMealPlanToMember('family_abc', 'meal_123', 'user_456');
```

#### Unshare

```typescript
await familyService.unshareMealPlan('family_abc', 'share_123');
```

---

### Workout Sharing

#### Share Workout

```typescript
const result = await familyService.shareWorkoutWithFamily({
  familyId: 'family_abc',
  programId: 'workout_456',
  sharedBy: 'user_123',
  permission: 'USE',
  assignToMembers: ['user_456'],
  notes: 'Teen fitness challenge!'
});
```

#### Get Family Workouts

```typescript
const workouts = await familyService.getFamilyWorkouts('family_abc');
```

#### Assign to Member

```typescript
await familyService.assignWorkoutToMember('family_abc', 'workout_456', 'user_789');
```

#### Unshare

```typescript
await familyService.unshareWorkout('family_abc', 'share_456');
```

---

### Shopping List Sharing

#### Share List

```typescript
const result = await familyService.shareShoppingListWithFamily({
  familyId: 'family_abc',
  listId: 'list_789',
  sharedBy: 'user_123',
  permission: 'EDIT',  // Family can check items
  notes: 'Costco run Saturday'
});
```

#### Get Family Shopping Lists

```typescript
const lists = await familyService.getFamilyShoppingLists('family_abc');
```

#### Check Item (Any Member)

```typescript
// Anyone in family can check off items
await familyService.checkShoppingListItem(
  'family_abc',
  'list_789',
  'item_123',
  'user_456'  // Who checked it
);
```

---

### Recipe Sharing

#### Share Recipe

```typescript
const result = await familyService.shareRecipeWithFamily({
  familyId: 'family_abc',
  recipeId: 'recipe_123',
  sharedBy: 'user_123',
  notes: 'Grandma\'s famous cookies'
});
```

#### Get Family Recipes

```typescript
const recipes = await familyService.getFamilyRecipes('family_abc');

// Returns
[
  {
    recipe_id: 'recipe_123',
    name: 'Chocolate Chip Cookies',
    shared_by: 'user_123',
    shared_by_name: 'Mom',
    shared_at: '2026-01-10',
    is_favorite: true
  }
]
```

---

### Parental Controls

#### Set Controls

```typescript
await familyService.setParentalControls('family_abc', 'child_user_id', {
  can_view_nutrition: true,
  can_edit_meals: false,
  can_create_workouts: true,
  daily_calorie_limit: 2000,
  require_approval_for_changes: true
});
```

#### Get Controls

```typescript
const controls = await familyService.getParentalControls('family_abc', 'child_user_id');

// Returns
{
  can_view_nutrition: true,
  can_edit_meals: false,
  can_create_workouts: true,
  daily_calorie_limit: 2000,
  require_approval_for_changes: true
}
```

---

### Family Goals

Family-wide goals that everyone contributes to.

#### Set Goal

```typescript
const result = await familyService.setFamilyGoal({
  familyId: 'family_abc',
  createdBy: 'user_123',
  type: 'weekly_workouts',  // 'weekly_workouts' | 'daily_vegetables' | 'water_intake' | 'family_meals'
  target: 20,               // e.g., 20 workouts per week as a family
  description: 'Family fitness challenge!',
  startDate: '2026-01-13',
  endDate: '2026-01-20'
});
```

#### Get Goals

```typescript
const goals = await familyService.getFamilyGoals('family_abc');

// Returns
[
  {
    goal_id: 'goal_123',
    type: 'weekly_workouts',
    target: 20,
    current_progress: 12,
    progress_percentage: 60,
    start_date: '2026-01-13',
    end_date: '2026-01-20',
    is_active: true,
    member_progress: [
      { member_id: 'user_123', member_name: 'Mom', contribution: 5 },
      { member_id: 'user_456', member_name: 'Johnny', contribution: 7 }
    ]
  }
]
```

#### Update Progress

```typescript
await familyService.updateGoalProgress(
  'family_abc',
  'goal_123',
  'user_456',  // Member who completed something
  1            // Amount to add
);
```

---

### Activity Feed

#### Get Activity

```typescript
const activity = await familyService.getActivityFeed('family_abc', {
  limit: 20,
  type: 'workout_completed'  // Optional filter
});

// Returns
[
  {
    id: 'act_123',
    type: 'workout_completed',
    member_id: 'user_456',
    member_name: 'Johnny',
    description: 'Completed "Morning Cardio"',
    timestamp: '2026-01-10T08:30:00Z',
    details: { workout_id: 'w_123', duration_minutes: 30 }
  }
]
```

#### Log Activity (Internal)

```typescript
await familyService.logActivity('family_abc', {
  memberId: 'user_456',
  type: 'meal_logged',
  description: 'Logged breakfast',
  details: { meal_id: 'm_123', calories: 450 }
});
```

#### Get Family Dashboard

```typescript
const dashboard = await familyService.getFamilyDashboard('family_abc');

// Returns comprehensive FamilyDashboard object
```

#### Get Member Content

```typescript
const content = await familyService.getMemberContent('family_abc', 'user_456');

// Returns what's assigned to a specific member
{
  assigned_meal_plans: [...],
  assigned_workouts: [...],
  available_shopping_lists: [...]
}
```

---

## Error Handling

### Standard Error Response

```typescript
interface APIError {
  success: false;
  error: string;
  code?: string;
  details?: any;
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or expired auth token |
| `FORBIDDEN` | User lacks permission |
| `NOT_FOUND` | Resource doesn't exist |
| `VALIDATION_ERROR` | Invalid request data |
| `INVITATION_EXPIRED` | Coach/family invitation expired |
| `MEMBER_LIMIT_REACHED` | Family has max members |
| `ALREADY_MEMBER` | User already in family/coach roster |

### Error Handling Pattern

```typescript
import { coachService } from '../services';

async function inviteClient(coachId: string, email: string) {
  try {
    const result = await coachService.sendInvitation({
      coachId,
      clientEmail: email
    });
    
    if (result.success) {
      return { success: true, invitationId: result.invitation_id };
    } else {
      // API returned success: false
      return { success: false, error: result.message || 'Unknown error' };
    }
  } catch (error) {
    // Network or parsing error
    if (error instanceof TypeError) {
      return { success: false, error: 'Network error. Please check connection.' };
    }
    
    // HTTP error with response
    if (error.response) {
      const status = error.response.status;
      const data = await error.response.json();
      
      switch (status) {
        case 401:
          // Redirect to login
          return { success: false, error: 'Session expired', requiresLogin: true };
        case 403:
          return { success: false, error: 'You do not have permission to perform this action' };
        case 404:
          return { success: false, error: 'Resource not found' };
        case 400:
          return { success: false, error: data.error || 'Invalid request' };
        default:
          return { success: false, error: 'Server error. Please try again.' };
      }
    }
    
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

### React Hook Pattern

```typescript
import { useState, useCallback } from 'react';
import { coachService } from '../services';

function useCoachClients(coachId: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await coachService.listClients(coachId);
      setClients(data);
    } catch (err) {
      setError('Failed to load clients');
      console.error('[useCoachClients]', err);
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  const addClient = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await coachService.addClient({
        coachId,
        clientEmail: email
      });
      
      if (result.success) {
        await fetchClients();  // Refresh list
        return { success: true };
      }
      
      setError(result.message || 'Failed to add client');
      return { success: false, error: result.message };
    } catch (err) {
      const message = 'Failed to add client';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [coachId, fetchClients]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    addClient
  };
}
```

---

## Service Export Guide

### Main Export File

**Location:** `src/services/index.ts`

```typescript
// Service instances
export { coachService } from './coachService';
export { familyService } from './familyService';

// Coach Service Types
export type {
  InvitationStatus,
  RelationshipStatus,
  NoteCategory,
  CoachInvitation,
  CoachingRelationship,
  APIClient,
  Client,
  MealProgramAssignment,
  WorkoutProgramAssignment,
  ClientDashboard,
  CoachOverview,
  ClientNote,
  CreateMealPlanParams,
  CreateWorkoutPlanParams,
} from './coachService';

// Family Service Types
export type {
  FamilyRole,
  InviteStatus,
  ShareType,
  SharePermission,
  FamilyMember,
  Family,
  FamilyInvite,
  SharedItem,
  FamilyMealPlan,
  FamilyWorkout,
  FamilyShoppingList,
  FamilyDashboard,
} from './familyService';
```

### Import Examples

```typescript
// Import service instance
import { coachService, familyService } from '../services';

// Import specific types
import type { Client, ClientDashboard } from '../services/coachService';
import type { Family, FamilyMember } from '../services/familyService';

// Import everything from services
import {
  coachService,
  familyService,
  Client,
  Family,
  FamilyRole
} from '../services';
```

---

## Implementation Status

### ✅ Coach Service - Fully Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Send invitation | ✅ | |
| Get pending invitations | ✅ | |
| Accept/decline invitation | ✅ | |
| List clients | ✅ | With search & filter |
| Add client | ✅ | |
| Remove client | ✅ | |
| Update client status | ✅ | |
| Get coach overview | ✅ | |
| Get client dashboard | ✅ | Comprehensive stats |
| Assign meal program | ✅ | |
| Create meal plan for client | ✅ | |
| Get client meal programs | ✅ | |
| Unassign meal program | ✅ | |
| Assign workout program | ✅ | |
| Create workout for client | ✅ | |
| Get client workouts | ✅ | |
| Unassign workout | ✅ | |
| Add client note | ✅ | With categories |
| Get client notes | ✅ | With filters |
| Update note | ✅ | |
| Delete note | ✅ | |

### ✅ Family Service - Fully Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Create family | ✅ | |
| Get family | ✅ | By ID, code, or user |
| Update family | ✅ | |
| Get guardian code | ✅ | |
| Regenerate guardian code | ✅ | |
| Get members | ✅ | |
| Invite member | ✅ | Email or code |
| Join family | ✅ | Via guardian code |
| Accept/decline invite | ✅ | |
| Update member role | ✅ | |
| Remove member | ✅ | |
| Leave family | ✅ | |
| Share meal plan | ✅ | With permissions |
| Get family meal plans | ✅ | |
| Assign meal to member | ✅ | |
| Unshare meal plan | ✅ | |
| Share workout | ✅ | |
| Get family workouts | ✅ | |
| Assign workout to member | ✅ | |
| Unshare workout | ✅ | |
| Share shopping list | ✅ | |
| Get family shopping lists | ✅ | |
| Check shopping item | ✅ | Collaborative |
| Share recipe | ✅ | |
| Get family recipes | ✅ | |
| Set parental controls | ✅ | |
| Get parental controls | ✅ | |
| Set family goal | ✅ | |
| Get family goals | ✅ | With progress |
| Update goal progress | ✅ | |
| Get activity feed | ✅ | With filters |
| Log activity | ✅ | |
| Get family dashboard | ✅ | |
| Get member content | ✅ | |

### 🔄 Backend Requirements

These endpoints need to exist on `services.wihy.ai`:

```
# Coach Endpoints
POST   /api/coaching/invitations/send
GET    /api/coaching/invitations/pending
POST   /api/coaching/invitations/accept
POST   /api/coaching/invitations/decline
GET    /api/coaches/:coachId/clients
POST   /api/coaches/:coachId/clients
DELETE /api/coaches/:coachId/clients/:clientId
PUT    /api/coaches/:coachId/clients/:clientId/status
GET    /api/coaches/:coachId/overview
GET    /api/coaches/:coachId/clients/:clientId/dashboard
POST   /api/coaches/:coachId/clients/:clientId/meal-program
GET    /api/coaches/:coachId/clients/:clientId/meal-programs
DELETE /api/coaches/:coachId/clients/:clientId/meal-program/:assignmentId
POST   /api/coaches/:coachId/clients/:clientId/create-meal-plan
POST   /api/coaches/:coachId/clients/:clientId/workout-program
GET    /api/coaches/:coachId/clients/:clientId/workout-programs
DELETE /api/coaches/:coachId/clients/:clientId/workout-program/:assignmentId
POST   /api/coaches/:coachId/clients/:clientId/create-workout-plan
POST   /api/coaches/:coachId/clients/:clientId/notes
GET    /api/coaches/:coachId/clients/:clientId/notes
PUT    /api/coaches/:coachId/notes/:noteId
DELETE /api/coaches/:coachId/notes/:noteId

# Family Endpoints
POST   /api/families
GET    /api/families/:familyId
GET    /api/families/by-code/:code
GET    /api/users/:userId/family
PUT    /api/families/:familyId
GET    /api/families/:familyId/guardian-code
POST   /api/families/:familyId/regenerate-code
GET    /api/families/:familyId/members
POST   /api/families/:familyId/invite
POST   /api/families/join
POST   /api/families/invites/:inviteId/accept
POST   /api/families/invites/:inviteId/decline
PUT    /api/families/:familyId/members/:memberId/role
DELETE /api/families/:familyId/members/:memberId
POST   /api/families/:familyId/leave
POST   /api/families/:familyId/share/meal-plan
GET    /api/families/:familyId/meal-plans
DELETE /api/families/:familyId/share/meal-plan/:shareId
POST   /api/families/:familyId/meal-plans/:programId/assign
POST   /api/families/:familyId/share/workout
GET    /api/families/:familyId/workouts
DELETE /api/families/:familyId/share/workout/:shareId
POST   /api/families/:familyId/workouts/:programId/assign
POST   /api/families/:familyId/share/shopping-list
GET    /api/families/:familyId/shopping-lists
PUT    /api/families/:familyId/shopping-lists/:listId/items/:itemId/check
POST   /api/families/:familyId/share/recipe
GET    /api/families/:familyId/recipes
GET    /api/families/:familyId/dashboard
GET    /api/families/:familyId/members/:memberId/content
PUT    /api/families/:familyId/members/:memberId/controls
GET    /api/families/:familyId/members/:memberId/controls
GET    /api/families/:familyId/activity
POST   /api/families/:familyId/activity
POST   /api/families/:familyId/goals
GET    /api/families/:familyId/goals
PUT    /api/families/:familyId/goals/:goalId/progress
```

---

## Quick Reference Card

### Coach Service

```typescript
// Service import
import { coachService } from '../services';

// Core operations
coachService.sendInvitation(invitation)
coachService.listClients(coachId, filters?)
coachService.addClient({ coachId, clientEmail })
coachService.removeClient(coachId, clientId)
coachService.getCoachOverview(coachId)
coachService.getClientDashboard(coachId, clientId)

// Programs
coachService.assignMealProgram({ coachId, clientId, programId })
coachService.createMealPlanForClient(params)
coachService.assignFitnessPlan({ coachId, clientId, programId })
coachService.createWorkoutPlanForClient(params)

// Notes
coachService.addClientNote(coachId, clientId, content, category?)
coachService.getClientNotes(coachId, clientId, options?)
```

### Family Service

```typescript
// Service import
import { familyService } from '../services';

// Family management
familyService.createFamily({ name, creatorId })
familyService.getFamily(familyId)
familyService.getUserFamily(userId)
familyService.regenerateGuardianCode(familyId)

// Members
familyService.getMembers(familyId)
familyService.inviteMember({ familyId, inviterId, email?, role })
familyService.joinFamily({ userId, guardianCode })
familyService.removeMember(familyId, memberId)

// Sharing
familyService.shareMealPlanWithFamily(params)
familyService.shareWorkoutWithFamily(params)
familyService.shareShoppingListWithFamily(params)
familyService.shareRecipeWithFamily(params)

// Parental controls
familyService.setParentalControls(familyId, memberId, controls)
familyService.getParentalControls(familyId, memberId)

// Goals & Activity
familyService.setFamilyGoal(params)
familyService.getFamilyGoals(familyId)
familyService.getActivityFeed(familyId, filters?)
familyService.getFamilyDashboard(familyId)
```

---

*Document generated January 10, 2026*
