# Coach & Family Sharing - Client Implementation Guide

## Overview

This document describes the implementation of Coach-Client and Family Sharing APIs in the WIHY mobile app.

**Base URL:** `https://services.wihy.ai`
**Status:** All endpoints verified working in production ✅

---

## Coach Endpoints

### 1. List Coach's Clients
```typescript
import { coachService } from '../services';

// Get all clients for a coach
const clients = await coachService.listClients(coachId, {
  status: 'active', // Optional: filter by status
  search: 'john'    // Optional: search by name
});
```

**Response:**
```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  joined_date: string;
  active_meal_programs?: number;
  active_fitness_programs?: number;
}
```

### 2. Add New Client
```typescript
const result = await coachService.addClient({
  coachId: 'coach-123',
  clientEmail: 'client@example.com',
  notes: 'New client referred by...' // Optional
});
```

### 3. Remove Client
```typescript
await coachService.removeClient(coachId, clientId);
```

### 4. Update Client Status
```typescript
await coachService.updateClientStatus(coachId, clientId, 'inactive');
```

### 5. Get Client Dashboard
```typescript
const dashboard = await coachService.getClientDashboard(coachId, clientId);

// Response includes:
// - Client info
// - Fitness progress
// - Nutrition summary
```

### 6. Get Coach Overview
```typescript
const overview = await coachService.getCoachOverview(coachId);

// Response includes:
// - Total/active clients count
// - All clients list
// - Recent activity
```

### 7. Assign Meal Program
```typescript
const result = await coachService.assignMealProgram({
  coachId: 'coach-123',
  clientId: 'client-456',
  programId: 'program-789',
  startDate: '2024-01-15', // Optional
  notes: 'Start with Phase 1' // Optional
});
```

### 8. Get Client's Meal Programs
```typescript
const programs = await coachService.getClientMealPrograms(coachId, clientId);
```

### 9. Create Custom Meal Plan for Client
```typescript
const result = await coachService.createMealPlanForClient({
  coachId: 'coach-123',
  clientId: 'client-456',
  description: 'High protein plan for muscle building',
  duration: 14, // days
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
```

### 10. Create Custom Workout Plan for Client
```typescript
const result = await coachService.createWorkoutPlanForClient({
  coachId: 'coach-123',
  clientId: 'client-456',
  name: 'Strength Training Program',
  description: 'Progressive overload for muscle building',
  goal: 'HYPERTROPHY',
  durationWeeks: 8,
  daysPerWeek: 4,
  equipment: ['barbell', 'dumbbells', 'cable machine'],
  notes: 'Start with lighter weights'
});
```

---

## Family Endpoints

### Family Management

#### Create Family
```typescript
import { familyService } from '../services';

const result = await familyService.createFamily({
  name: 'The Johnsons',
  creatorId: 'user-123'
});
// Returns: { success, family_id, guardian_code }
```

#### Get Family Details
```typescript
const family = await familyService.getFamily(familyId);
```

#### Join Family with Guardian Code
```typescript
const result = await familyService.joinFamily({
  userId: 'user-456',
  guardianCode: 'ABCD1234',
  role: 'MEMBER' // Optional: 'PARENT' | 'GUARDIAN' | 'CHILD' | 'MEMBER'
});
```

#### Get Guardian Code
```typescript
const { code, expires_at } = await familyService.getGuardianCode(familyId);
```

#### Regenerate Guardian Code
```typescript
const { code } = await familyService.regenerateGuardianCode(familyId);
```

### Member Management

#### Get Family Members
```typescript
const members = await familyService.getMembers(familyId);
```

#### Invite Member
```typescript
const result = await familyService.inviteMember({
  familyId: 'family-123',
  inviterId: 'user-123',
  email: 'newmember@example.com',
  role: 'CHILD',
  message: 'Join our family!' // Optional
});
```

#### Update Member Role
```typescript
await familyService.updateMemberRole(familyId, memberId, 'PARENT');
```

#### Remove Member
```typescript
await familyService.removeMember(familyId, memberId);
```

#### Leave Family
```typescript
await familyService.leaveFamily(familyId, userId);
```

### Sharing Features

#### Share Meal Plan with Family
```typescript
const result = await familyService.shareMealPlanWithFamily({
  familyId: 'family-123',
  programId: 'program-456',
  sharedBy: 'user-123',
  servings: 4, // Optional: family servings
  permission: 'USE', // 'VIEW' | 'USE' | 'EDIT'
  assignToMembers: ['member-1', 'member-2'], // Optional
  notes: 'Great for weeknight dinners'
});
```

#### Share Workout with Family
```typescript
const result = await familyService.shareWorkoutWithFamily({
  familyId: 'family-123',
  programId: 'workout-456',
  sharedBy: 'user-123',
  permission: 'USE',
  assignToMembers: ['member-1']
});
```

#### Share Shopping List
```typescript
const result = await familyService.shareShoppingListWithFamily({
  familyId: 'family-123',
  listId: 'list-456',
  sharedBy: 'user-123',
  permission: 'EDIT' // Allow family to check items
});
```

#### Share Recipe
```typescript
const result = await familyService.shareRecipeWithFamily({
  familyId: 'family-123',
  recipeId: 'recipe-456',
  sharedBy: 'user-123'
});
```

### Parental Controls

#### Set Parental Controls
```typescript
await familyService.setParentalControls(familyId, childMemberId, {
  can_view_nutrition: true,
  can_edit_meals: false,
  can_create_workouts: false,
  daily_calorie_limit: 2000,
  require_approval_for_changes: true
});
```

#### Get Parental Controls
```typescript
const controls = await familyService.getParentalControls(familyId, memberId);
```

### Family Goals

#### Set Family Goal
```typescript
const result = await familyService.setFamilyGoal({
  familyId: 'family-123',
  createdBy: 'user-123',
  type: 'weekly_workouts', // 'daily_vegetables' | 'water_intake' | 'family_meals'
  target: 5,
  description: 'Exercise together 5 times this week',
  startDate: '2024-01-01',
  endDate: '2024-01-07'
});
```

#### Get Family Goals
```typescript
const goals = await familyService.getFamilyGoals(familyId);
```

#### Update Goal Progress
```typescript
await familyService.updateGoalProgress(familyId, goalId, memberId, 2);
```

### Dashboard & Activity

#### Get Family Dashboard
```typescript
const dashboard = await familyService.getFamilyDashboard(familyId);

// Returns:
// - Family info
// - Shared meal plans
// - Shared workouts
// - Shared shopping lists
// - Recent activity
// - Family stats
```

#### Get Activity Feed
```typescript
const activity = await familyService.getActivityFeed(familyId, {
  limit: 20,
  offset: 0,
  type: 'meal_logged' // Optional filter
});
```

---

## TypeScript Types

### Coach Types
```typescript
import type {
  Client,
  ClientDashboard,
  CoachOverview,
  CoachInvitation,
  RelationshipStatus,
  MealProgramAssignment,
  WorkoutProgramAssignment,
} from '../services';
```

### Family Types
```typescript
import type {
  Family,
  FamilyMember,
  FamilyRole,
  FamilyInvite,
  SharedItem,
  ShareType,
  SharePermission,
  FamilyMealPlan,
  FamilyWorkout,
  FamilyShoppingList,
  FamilyDashboard,
} from '../services';
```

---

## Usage Examples

### Coach Dashboard Screen
```typescript
import { coachService, type Client, type ClientDashboard } from '../services';

function CoachDashboard({ coachId }: { coachId: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientDashboard | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const data = await coachService.listClients(coachId, { status: 'active' });
    setClients(data);
  };

  const viewClientDetails = async (clientId: string) => {
    const dashboard = await coachService.getClientDashboard(coachId, clientId);
    setSelectedClient(dashboard);
  };

  const createPlanForClient = async (clientId: string) => {
    await coachService.createMealPlanForClient({
      coachId,
      clientId,
      description: 'Weight loss meal plan',
      duration: 14,
      mealsPerDay: { breakfast: true, lunch: true, dinner: true },
      dailyCalorieTarget: 1800,
    });
  };

  // ... render
}
```

### Family Sharing Screen
```typescript
import { familyService, type Family, type FamilyMember } from '../services';

function FamilyScreen({ userId }: { userId: string }) {
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);

  useEffect(() => {
    loadFamily();
  }, []);

  const loadFamily = async () => {
    const familyData = await familyService.getUserFamily(userId);
    if (familyData) {
      setFamily(familyData);
      const memberList = await familyService.getMembers(familyData.id);
      setMembers(memberList);
    }
  };

  const shareMealPlan = async (programId: string) => {
    if (!family) return;
    await familyService.shareMealPlanWithFamily({
      familyId: family.id,
      programId,
      sharedBy: userId,
      servings: members.length,
      permission: 'USE',
    });
  };

  const joinWithCode = async (code: string) => {
    const result = await familyService.joinFamily({
      userId,
      guardianCode: code,
    });
    if (result.success) {
      loadFamily();
    }
  };

  // ... render
}
```

---

## Error Handling

Both services use the standard `fetchWithLogging` utility which handles:
- Network errors
- API errors with proper status codes
- Automatic retry for transient failures
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

## File Locations

- **Coach Service:** [src/services/coachService.ts](src/services/coachService.ts)
- **Family Service:** [src/services/familyService.ts](src/services/familyService.ts)
- **Service Exports:** [src/services/index.ts](src/services/index.ts)
