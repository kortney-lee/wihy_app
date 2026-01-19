# Backend API Requirements for Coach & Family Platforms
## BDD Approach - Frontend Wired, Backend Needed

**Date:** January 19, 2026  
**Approach:** Behavior-Driven Development  
**Status:** Frontend complete, backend specifications below

---

## Architecture Decision

**RECOMMENDATION: Extend services.wihy.ai**

Add two new route namespaces:
- `/api/coaching/*` - All coach platform endpoints
- `/api/families/*` - All family platform endpoints

**Benefits:**
1. Single codebase, easier to maintain
2. Shared authentication and user context
3. Faster deployment (no new service setup)
4. Can split into microservices later if needed

**Database:** Use existing PostgreSQL instance, add new tables

---

## 1. Coach Platform API Endpoints

### Base URL: `https://services.wihy.ai/api/coaching`

### 1.1 Client Management

#### **GET** `/coaches/:coachId/clients`
Get all clients for a coach with filtering.

**Request:**
```http
GET /api/coaching/coaches/coach_123/clients?status=ACTIVE&search=john
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): `ACTIVE` | `PAUSED` | `ARCHIVED`
- `search` (optional): Search by client name or email

**Response (200):**
```json
{
  "clients": [
    {
      "id": "client_456",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "ACTIVE",
      "joined_date": "2026-01-15T10:00:00Z",
      "last_active": "2h ago",
      "active_meal_programs": 1,
      "active_fitness_programs": 2
    }
  ],
  "total": 1
}
```

**Frontend Usage:** `CoachDashboard.tsx:102`
```typescript
const data = await coachService.listClients(coachId, {
  status: 'ACTIVE',
  search: searchQuery
});
```

---

#### **POST** `/coaches/:coachId/clients`
Add a new client (send invitation).

**Request:**
```http
POST /api/coaching/coaches/coach_123/clients
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientEmail": "newclient@example.com",
  "notes": "Referred by existing client"
}
```

**Response (201):**
```json
{
  "success": true,
  "client_id": "client_789",
  "relationship_id": "rel_abc",
  "invitation_sent": true,
  "message": "Invitation sent to newclient@example.com"
}
```

**Frontend Usage:** `ClientManagement.tsx:203`
```typescript
const result = await coachService.addClient({
  coachId,
  clientEmail: email.trim()
});
```

---

#### **DELETE** `/coaches/:coachId/clients/:clientId`
Remove a client from coach's roster.

**Request:**
```http
DELETE /api/coaching/coaches/coach_123/clients/client_456
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client removed successfully"
}
```

**Frontend Usage:** `coachService.ts:286`
```typescript
await coachService.removeClient(coachId, clientId);
```

---

#### **PUT** `/coaches/:coachId/clients/:clientId/status`
Update client's relationship status.

**Request:**
```http
PUT /api/coaching/coaches/coach_123/clients/client_456/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "PAUSED"
}
```

**Response (200):**
```json
{
  "success": true,
  "new_status": "PAUSED"
}
```

**Frontend Usage:** `ClientManagement.tsx:232`
```typescript
await coachService.updateClientStatus(coachId, client.id, 'PAUSED');
```

---

### 1.2 Client Dashboard & Analytics

#### **GET** `/coaches/:coachId/clients/:clientId/dashboard`
Get comprehensive client dashboard data.

**Request:**
```http
GET /api/coaching/coaches/coach_123/clients/client_456/dashboard
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "client": {
    "id": "client_456",
    "name": "John Doe",
    "email": "john@example.com",
    "joined_date": "2026-01-15",
    "status": "ACTIVE"
  },
  "health_stats": {
    "current_weight": 180,
    "weight_change": -5.2,
    "current_calories": 2100,
    "target_calories": 2000,
    "current_steps": 8500,
    "target_steps": 10000
  },
  "goals": [
    {
      "id": "goal_1",
      "type": "weight_loss",
      "target": "Lose 15 lbs",
      "progress": 34.6,
      "deadline": "2026-03-15"
    }
  ],
  "nutrition_summary": {
    "avg_calories_week": 2050,
    "protein_g": 150,
    "carbs_g": 200,
    "fat_g": 70,
    "diet_type": "High Protein",
    "goal_compliance": 85
  },
  "workout_stats": {
    "workouts_completed_week": 4,
    "workouts_scheduled_week": 5,
    "adherence_rate": 80,
    "current_program": "Strength Training Phase 1",
    "current_week": 3
  },
  "active_programs": {
    "meal_programs": [
      {
        "id": "meal_prog_1",
        "name": "Weight Loss Meal Plan",
        "assigned_date": "2026-01-15",
        "status": "ACTIVE"
      }
    ],
    "workout_programs": [
      {
        "id": "workout_prog_1",
        "name": "Beginner Strength",
        "assigned_date": "2026-01-15",
        "status": "ACTIVE"
      }
    ]
  },
  "recent_activity": [
    {
      "date": "2026-01-19",
      "type": "meal_logged",
      "description": "Logged breakfast"
    },
    {
      "date": "2026-01-18",
      "type": "workout_completed",
      "description": "Completed Upper Body Workout"
    }
  ]
}
```

**Frontend Usage:** `CoachDashboard.tsx:127`
```typescript
const dashboard = await coachService.getClientDashboard(coachId, clientId);
setClientDashboard(dashboard);
```

---

#### **GET** `/coaches/:coachId/overview`
Get coach overview with all clients and stats.

**Request:**
```http
GET /api/coaching/coaches/coach_123/overview
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "total_clients": 15,
  "active_clients": 12,
  "paused_clients": 2,
  "pending_invitations": 3,
  "clients": [
    {
      "id": "client_1",
      "name": "Client One",
      "status": "ACTIVE",
      "active_programs": 2
    }
  ],
  "recent_activity": [
    {
      "client_name": "John Doe",
      "activity": "Completed workout",
      "timestamp": "2026-01-19T14:30:00Z"
    }
  ],
  "revenue_summary": {
    "total_earned": 1250.50,
    "pending_payout": 350.25,
    "last_payout_date": "2026-01-01"
  }
}
```

**Frontend Usage:** `coachService.ts:382`
```typescript
const overview = await coachService.getCoachOverview(coachId);
```

---

### 1.3 Program Assignment

#### **POST** `/coaches/:coachId/clients/:clientId/meal-programs`
Assign meal program to client.

**Request:**
```http
POST /api/coaching/coaches/coach_123/clients/client_456/meal-programs
Authorization: Bearer {token}
Content-Type: application/json

{
  "programId": "meal_prog_789",
  "startDate": "2026-01-20",
  "notes": "Focus on protein intake"
}
```

**Response (201):**
```json
{
  "success": true,
  "assignment_id": "assign_123",
  "program_id": "meal_prog_789",
  "notification_sent": true
}
```

**Frontend Usage:** `coachService.ts:408`
```typescript
await coachService.assignMealProgram({
  coachId,
  clientId,
  programId,
  notes: 'Custom meal plan for weight loss'
});
```

---

#### **POST** `/coaches/:coachId/clients/:clientId/workout-programs`
Assign workout program to client.

**Request:**
```http
POST /api/coaching/coaches/coach_123/clients/client_456/workout-programs
Authorization: Bearer {token}
Content-Type: application/json

{
  "programId": "workout_prog_789",
  "startDate": "2026-01-20",
  "notes": "Week 1 - Light intensity"
}
```

**Response (201):**
```json
{
  "success": true,
  "assignment_id": "assign_456",
  "program_id": "workout_prog_789",
  "notification_sent": true
}
```

**Frontend Usage:** `coachService.ts:527`
```typescript
await coachService.assignWorkoutProgram({
  coachId,
  clientId,
  programId,
  notes: '8-week strength program'
});
```

---

#### **GET** `/coaches/:coachId/clients/:clientId/meal-programs`
Get client's assigned meal programs.

**Request:**
```http
GET /api/coaching/coaches/coach_123/clients/client_456/meal-programs
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "programs": [
    {
      "program_id": "meal_prog_1",
      "name": "Weight Loss Plan",
      "goal": "Lose 15 lbs",
      "assigned_date": "2026-01-15",
      "status": "ACTIVE",
      "completion_percentage": 45,
      "meals_completed": 12,
      "adherence_rate": 85
    }
  ]
}
```

**Frontend Usage:** `coachService.ts:483`

---

#### **GET** `/coaches/:coachId/clients/:clientId/workout-programs`
Get client's assigned workout programs.

**Request:**
```http
GET /api/coaching/coaches/coach_123/clients/client_456/workout-programs
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "programs": [
    {
      "program_id": "workout_prog_1",
      "name": "Beginner Strength",
      "goal": "Build foundational strength",
      "assigned_date": "2026-01-15",
      "status": "ACTIVE",
      "completion_percentage": 60,
      "workouts_completed": 12,
      "adherence_rate": 80
    }
  ]
}
```

**Frontend Usage:** `coachService.ts:601`

---

### 1.4 Notes & Communication

#### **POST** `/coaches/:coachId/clients/:clientId/notes`
Add note to client's record.

**Request:**
```http
POST /api/coaching/coaches/coach_123/clients/client_456/notes
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Client mentioned knee pain during squats",
  "category": "injury",
  "is_private": true
}
```

**Response (201):**
```json
{
  "success": true,
  "note_id": "note_789",
  "created_at": "2026-01-19T15:00:00Z"
}
```

**Frontend Usage:** `coachService.ts:653`

---

#### **GET** `/coaches/:coachId/clients/:clientId/notes`
Get all notes for a client.

**Request:**
```http
GET /api/coaching/coaches/coach_123/clients/client_456/notes?category=injury
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "notes": [
    {
      "note_id": "note_789",
      "content": "Client mentioned knee pain",
      "category": "injury",
      "is_private": true,
      "created_at": "2026-01-19T15:00:00Z",
      "created_by": "coach_123"
    }
  ],
  "total": 1
}
```

---

### 1.5 Invitations

#### **POST** `/invitations/send`
Send invitation to potential client.

**Request:**
```http
POST /api/coaching/invitations/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "coachId": "coach_123",
  "clientEmail": "potential@example.com",
  "clientName": "Jane Smith",
  "message": "Join my coaching program!"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "invitation_id": "invite_123",
    "coach_id": "coach_123",
    "client_email": "potential@example.com",
    "client_name": "Jane Smith",
    "message": "Join my coaching program!",
    "status": "pending",
    "expires_at": "2026-01-26T15:00:00Z"
  }
}
```

**Frontend Usage:** `coachService.ts:183`
```typescript
await coachService.sendInvitation({
  coachId,
  clientEmail: email,
  clientName: name,
  message: 'Join my coaching program!'
});
```

---

#### **GET** `/invitations/pending`
Get all pending invitations for a coach.

**Request:**
```http
GET /api/coaching/invitations/pending?coachId=coach_123
Authorization: Bearer {token}
```

**Query Parameters:**
- `coachId` (required): The coach's user ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invitations": [
      {
        "invitation_id": "invite_123",
        "coach_id": "coach_123",
        "client_email": "potential@example.com",
        "client_name": "Jane Smith",
        "message": "Join my coaching program!",
        "status": "pending",
        "created_at": "2026-01-19T15:00:00Z",
        "expires_at": "2026-01-26T15:00:00Z"
      }
    ],
    "total": 1
  }
}
```

**Frontend Usage:** `coachService.ts:197`
```typescript
const invitations = await coachService.getPendingInvitations(coachId);
```

---

#### **POST** `/invitations/accept`
Accept coach invitation (called by client).

**Request:**
```http
POST /api/coaching/invitations/accept
Authorization: Bearer {token}
Content-Type: application/json

{
  "invitationId": "invite_123",
  "clientId": "user_789"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invitation_id": "invite_123",
    "coach_id": "coach_123",
    "client_id": "user_789",
    "relationship_id": "rel_456",
    "status": "accepted"
  }
}
```

**Frontend Usage:** `coachService.ts:212`
```typescript
await coachService.acceptInvitation(invitationId, clientId);
```

---

#### **POST** `/invitations/decline`
Decline coach invitation (called by client).

**Request:**
```http
POST /api/coaching/invitations/decline
Authorization: Bearer {token}
Content-Type: application/json

{
  "invitationId": "invite_123",
  "reason": "Not interested at this time"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invitation_id": "invite_123",
    "status": "declined",
    "reason": "Not interested at this time"
  }
}
```

**Frontend Usage:** `coachService.ts:225`
```typescript
await coachService.declineInvitation(invitationId, reason);
```

---

### 1.6 Revenue & Analytics

#### **GET** `/coaches/:coachId/revenue`
Get coach revenue analytics.

**Request:**
```http
GET /api/coaching/coaches/coach_123/revenue?period=month
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "total_earned": 1250.50,
  "pending_payout": 350.25,
  "last_payout": {
    "amount": 900.25,
    "date": "2026-01-01",
    "status": "PAID"
  },
  "breakdown": {
    "client_subscriptions": 1000.00,
    "program_sales": 250.50
  },
  "commission_rate": 0.01,
  "clients_contributing": 12
}
```

---

---

## 2. Family Platform API Endpoints

### Base URL: `https://services.wihy.ai/api/families`

### 2.1 Family Management

#### **POST** `/families`
Create a new family.

**Request:**
```http
POST /api/families
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Johnson Family",
  "creatorId": "user_123"
}
```

**Response (201):**
```json
{
  "success": true,
  "family_id": "family_456",
  "guardian_code": "WIHY-ABC123",
  "created_at": "2026-01-19T15:00:00Z"
}
```

**Frontend Usage:** `familyService.ts:130`
```typescript
const result = await familyService.createFamily({
  name: 'Smith Family',
  creatorId: user.id
});
```

---

#### **GET** `/families/:familyId`
Get family details.

**Request:**
```http
GET /api/families/family_456
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "family_456",
  "name": "Johnson Family",
  "created_by": "user_123",
  "guardian_code": "WIHY-ABC123",
  "created_at": "2026-01-19T15:00:00Z",
  "members": [
    {
      "id": "member_1",
      "name": "John Johnson",
      "email": "john@example.com",
      "role": "PARENT",
      "joined_at": "2026-01-19T15:00:00Z",
      "is_active": true
    }
  ],
  "subscription_plan": "family-pro",
  "max_members": 5
}
```

**Frontend Usage:** `familyService.ts:159`

---

#### **GET** `/families/by-code/:code`
Get family by guardian code.

**Request:**
```http
GET /api/families/by-code/WIHY-ABC123
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "family_456",
  "name": "Johnson Family",
  "created_by": "user_123",
  "guardian_code": "WIHY-ABC123",
  "max_members": 5,
  "current_members": 3,
  "can_join": true
}
```

**Frontend Usage:** `familyService.ts:177`

---

#### **GET** `/users/:userId/family`
Get user's family.

**Request:**
```http
GET /api/families/users/user_123/family
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "family_456",
  "name": "Johnson Family",
  "role": "PARENT",
  "guardian_code": "WIHY-ABC123",
  "members": [...]
}
```

**Frontend Usage:** `familyService.ts:195`

---

#### **POST** `/families/:familyId/regenerate-code`
Regenerate guardian code.

**Request:**
```http
POST /api/families/family_456/regenerate-code
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "guardian_code": "WIHY-XYZ789",
  "old_code_invalidated": true
}
```

**Frontend Usage:** `familyService.ts:215`

---

### 2.2 Member Management

#### **GET** `/families/:familyId/members`
Get all family members.

**Request:**
```http
GET /api/families/family_456/members
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "members": [
    {
      "id": "member_1",
      "name": "John Johnson",
      "email": "john@example.com",
      "role": "PARENT",
      "joined_at": "2026-01-19",
      "is_active": true,
      "age_group": "adult",
      "health_goals": ["weight_loss"],
      "dietary_restrictions": ["vegetarian"]
    }
  ],
  "total": 1,
  "max_members": 5
}
```

**Frontend Usage:** `familyService.ts:234`

---

#### **POST** `/families/:familyId/members/invite`
Invite member to family.

**Request:**
```http
POST /api/families/family_456/members/invite
Authorization: Bearer {token}
Content-Type: application/json

{
  "inviterId": "user_123",
  "email": "child@example.com",
  "role": "CHILD",
  "message": "Join our family!"
}
```

**Response (201):**
```json
{
  "success": true,
  "invite_id": "invite_789",
  "invite_code": "WIHY-ABC123",
  "expires_at": "2026-01-26T15:00:00Z"
}
```

**Frontend Usage:** `familyService.ts:254`

---

#### **POST** `/families/join`
Join family with guardian code.

**Request:**
```http
POST /api/families/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user_789",
  "guardianCode": "WIHY-ABC123",
  "role": "CHILD"
}
```

**Response (200):**
```json
{
  "success": true,
  "family_id": "family_456",
  "family_name": "Johnson Family",
  "your_role": "CHILD"
}
```

**Frontend Usage:** `familyService.ts:280`

---

#### **DELETE** `/families/:familyId/members/:memberId`
Remove member from family.

**Request:**
```http
DELETE /api/families/family_456/members/member_789
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Member removed from family"
}
```

**Frontend Usage:** `familyService.ts:308`

---

#### **PUT** `/families/:familyId/members/:memberId/role`
Update member's role.

**Request:**
```http
PUT /api/families/family_456/members/member_789/role
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "GUARDIAN"
}
```

**Response (200):**
```json
{
  "success": true,
  "new_role": "GUARDIAN"
}
```

**Frontend Usage:** `familyService.ts:328`

---

### 2.3 Sharing Features

#### **POST** `/families/:familyId/share/meal-plan`
Share meal plan with family.

**Request:**
```http
POST /api/families/family_456/share/meal-plan
Authorization: Bearer {token}
Content-Type: application/json

{
  "programId": "meal_prog_123",
  "sharedBy": "user_123",
  "servings": 4,
  "permission": "USE"
}
```

**Response (201):**
```json
{
  "success": true,
  "share_id": "share_789",
  "notification_sent": true,
  "members_notified": 3
}
```

**Frontend Usage:** `familyService.ts:536`

---

#### **POST** `/families/:familyId/share/workout`
Share workout with family.

**Request:**
```http
POST /api/families/family_456/share/workout
Authorization: Bearer {token}
Content-Type: application/json

{
  "workoutId": "workout_123",
  "sharedBy": "user_123",
  "permission": "USE"
}
```

**Response (201):**
```json
{
  "success": true,
  "share_id": "share_890",
  "notification_sent": true
}
```

**Frontend Usage:** `familyService.ts:568`

---

#### **POST** `/families/:familyId/share/shopping-list`
Share shopping list with family.

**Request:**
```http
POST /api/families/family_456/share/shopping-list
Authorization: Bearer {token}
Content-Type: application/json

{
  "listId": "list_123",
  "sharedBy": "user_123",
  "permission": "EDIT"
}
```

**Response (201):**
```json
{
  "success": true,
  "share_id": "share_901"
}
```

**Frontend Usage:** `familyService.ts:598`

---

#### **GET** `/families/:familyId/recipes`
Get family's shared recipes.

**Request:**
```http
GET /api/families/family_456/recipes
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "recipes": [
    {
      "recipe_id": "recipe_1",
      "name": "Healthy Pasta",
      "shared_by": "user_123",
      "shared_by_name": "John",
      "shared_at": "2026-01-19",
      "is_favorite": true
    }
  ]
}
```

**Frontend Usage:** `familyService.ts:644`

---

### 2.4 Family Dashboard

#### **GET** `/families/:familyId/dashboard`
Get comprehensive family dashboard.

**Request:**
```http
GET /api/families/family_456/dashboard
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "family": {
    "id": "family_456",
    "name": "Johnson Family",
    "members": [...]
  },
  "shared_meal_plans": [
    {
      "program_id": "meal_prog_1",
      "name": "Family Meal Plan",
      "shared_by": "John",
      "shared_at": "2026-01-15",
      "permission": "USE"
    }
  ],
  "shared_workouts": [
    {
      "workout_id": "workout_1",
      "name": "Family Workout",
      "shared_by": "Sarah",
      "shared_at": "2026-01-18"
    }
  ],
  "shared_shopping_lists": [
    {
      "list_id": "list_1",
      "name": "Grocery List",
      "shared_by": "John",
      "total_items": 15,
      "items_checked": 8,
      "is_active": true
    }
  ],
  "recent_activity": [
    {
      "id": "activity_1",
      "type": "meal_logged",
      "member_name": "Emma",
      "description": "Logged breakfast",
      "timestamp": "2026-01-19T08:00:00Z"
    }
  ],
  "family_stats": {
    "total_meals_logged_today": 8,
    "total_workouts_completed_week": 12,
    "active_meal_plans": 2,
    "active_workout_programs": 3
  }
}
```

**Frontend Usage:** `ParentDashboard.tsx:124`
```typescript
const dashboardData = await familyService.getFamilyDashboard(userFamily.id);
```

---

### 2.5 Parental Controls

#### **PUT** `/families/:familyId/members/:memberId/controls`
Set parental controls.

**Request:**
```http
PUT /api/families/family_456/members/member_789/controls
Authorization: Bearer {token}
Content-Type: application/json

{
  "can_view_nutrition": true,
  "can_edit_meals": false,
  "can_create_workouts": false,
  "daily_calorie_limit": 1800,
  "require_approval_for_changes": true
}
```

**Response (200):**
```json
{
  "success": true,
  "controls_updated": true
}
```

**Frontend Usage:** `familyService.ts:702`

---

#### **GET** `/families/:familyId/members/:memberId/controls`
Get parental controls.

**Request:**
```http
GET /api/families/family_456/members/member_789/controls
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "can_view_nutrition": true,
  "can_edit_meals": false,
  "can_create_workouts": false,
  "daily_calorie_limit": 1800,
  "require_approval_for_changes": true
}
```

**Frontend Usage:** `familyService.ts:731`

---

### 2.6 Family Goals

#### **POST** `/families/:familyId/goals`
Set family goal.

**Request:**
```http
POST /api/families/family_456/goals
Authorization: Bearer {token}
Content-Type: application/json

{
  "goalType": "total_steps",
  "targetValue": 50000,
  "period": "week",
  "createdBy": "user_123"
}
```

**Response (201):**
```json
{
  "success": true,
  "goal_id": "goal_123",
  "starts_at": "2026-01-19",
  "ends_at": "2026-01-26"
}
```

**Frontend Usage:** `familyService.ts:759`

---

#### **GET** `/families/:familyId/goals`
Get family goals.

**Request:**
```http
GET /api/families/family_456/goals?status=active
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "goals": [
    {
      "goal_id": "goal_123",
      "goal_type": "total_steps",
      "target_value": 50000,
      "current_value": 32500,
      "progress": 65,
      "period": "week",
      "created_by": "user_123",
      "status": "ACTIVE",
      "ends_at": "2026-01-26"
    }
  ]
}
```

**Frontend Usage:** `familyService.ts:787`

---

### 2.7 Activity Feed

#### **GET** `/families/:familyId/activity`
Get family activity feed.

**Request:**
```http
GET /api/families/family_456/activity?limit=20&type=meal_logged
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "activities": [
    {
      "id": "activity_1",
      "member_id": "member_1",
      "member_name": "Emma",
      "type": "meal_logged",
      "description": "Logged breakfast",
      "details": {
        "meal_name": "Oatmeal with berries",
        "calories": 350
      },
      "timestamp": "2026-01-19T08:00:00Z"
    }
  ],
  "total": 1,
  "has_more": false
}
```

**Frontend Usage:** `familyService.ts:815`

---

---

## 3. Database Schema

### 3.1 Coaching Tables

```sql
-- Coaching relationships
CREATE TABLE coaching_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id),
  client_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, ARCHIVED
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(coach_id, client_id)
);

-- Coach invitations
CREATE TABLE coach_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id),
  client_email VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, DECLINED, EXPIRED
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  responded_at TIMESTAMP,
  UNIQUE(coach_id, client_email, status)
);

-- Program assignments
CREATE TABLE coach_program_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id),
  client_id UUID NOT NULL REFERENCES users(id),
  program_type VARCHAR(20) NOT NULL, -- MEAL, WORKOUT
  program_id UUID NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Client notes
CREATE TABLE coach_client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id),
  client_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  category VARCHAR(50), -- injury, progress, nutrition, general
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Coach revenue tracking
CREATE TABLE coach_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id),
  client_id UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- subscription, program_sale
  transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PAID, FAILED
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_coaching_relationships_coach ON coaching_relationships(coach_id);
CREATE INDEX idx_coaching_relationships_client ON coaching_relationships(client_id);
CREATE INDEX idx_coach_invitations_coach ON coach_invitations(coach_id);
CREATE INDEX idx_coach_invitations_email ON coach_invitations(client_email);
CREATE INDEX idx_program_assignments_coach_client ON coach_program_assignments(coach_id, client_id);
CREATE INDEX idx_client_notes_coach_client ON coach_client_notes(coach_id, client_id);
CREATE INDEX idx_revenue_coach ON coach_revenue(coach_id);
```

---

### 3.2 Family Tables

```sql
-- Families
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  guardian_code VARCHAR(20) UNIQUE NOT NULL,
  subscription_plan VARCHAR(50), -- family-basic, family-pro
  max_members INT DEFAULT 5,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Family members
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(20) NOT NULL, -- PARENT, GUARDIAN, CHILD, MEMBER
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  age_group VARCHAR(20), -- adult, teen, child
  UNIQUE(family_id, user_id)
);

-- Family invitations
CREATE TABLE family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id),
  invitee_email VARCHAR(255),
  invite_code VARCHAR(20) NOT NULL,
  role VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, DECLINED, EXPIRED
  message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  responded_at TIMESTAMP
);

-- Shared content
CREATE TABLE family_shared_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id),
  share_type VARCHAR(50) NOT NULL, -- MEAL_PLAN, WORKOUT, SHOPPING_LIST, RECIPE
  item_id UUID NOT NULL,
  permission VARCHAR(20) DEFAULT 'VIEW', -- VIEW, USE, EDIT
  shared_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Parental controls
CREATE TABLE family_parental_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES users(id),
  can_view_nutrition BOOLEAN DEFAULT TRUE,
  can_edit_meals BOOLEAN DEFAULT FALSE,
  can_create_workouts BOOLEAN DEFAULT FALSE,
  daily_calorie_limit INT,
  require_approval_for_changes BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(family_id, member_id)
);

-- Family goals
CREATE TABLE family_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  goal_type VARCHAR(50) NOT NULL, -- total_steps, total_calories, etc.
  target_value INT NOT NULL,
  current_value INT DEFAULT 0,
  period VARCHAR(20) NOT NULL, -- day, week, month
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, FAILED
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Family activity log
CREATE TABLE family_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES users(id),
  activity_type VARCHAR(50) NOT NULL, -- meal_logged, workout_completed, etc.
  description TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_families_creator ON families(created_by);
CREATE INDEX idx_families_guardian_code ON families(guardian_code);
CREATE INDEX idx_family_members_family ON family_members(family_id);
CREATE INDEX idx_family_members_user ON family_members(user_id);
CREATE INDEX idx_family_invitations_family ON family_invitations(family_id);
CREATE INDEX idx_family_shared_content_family ON family_shared_content(family_id);
CREATE INDEX idx_family_goals_family ON family_goals(family_id);
CREATE INDEX idx_family_activity_family_time ON family_activity_log(family_id, created_at DESC);
```

---

## 4. Implementation Checklist

### Phase 1: Database Setup (2 days)
- [ ] Create all coaching tables
- [ ] Create all family tables
- [ ] Add indexes for performance
- [ ] Setup foreign key constraints
- [ ] Create migration scripts
- [ ] Test database schema locally

### Phase 2: Backend - Coaching Endpoints (5 days)
- [x] `/coaches/:id/clients` (GET, POST)
- [x] `/coaches/:id/clients/:clientId` (DELETE)
- [x] `/coaches/:id/clients/:clientId/status` (PUT)
- [x] `/coaches/:id/clients/:clientId/dashboard` (GET)
- [x] `/coaches/:id/overview` (GET)
- [x] `/coaches/:id/clients/:clientId/meal-programs` (GET, POST)
- [x] `/coaches/:id/clients/:clientId/workout-programs` (GET, POST)
- [x] `/coaches/:id/clients/:clientId/notes` (GET, POST)
- [x] `/invitations/send` (POST)
- [x] `/invitations/pending` (GET)
- [x] `/invitations/accept` (POST)
- [x] `/invitations/decline` (POST)
- [x] `/coaches/:id/revenue` (GET)

### Phase 3: Backend - Family Endpoints (5 days)
- [x] `/families` (POST)
- [x] `/families/:id` (GET)
- [x] `/families/by-code/:code` (GET)
- [x] `/users/:userId/family` (GET)
- [x] `/families/:id/regenerate-code` (POST)
- [x] `/families/:id/members` (GET, POST, DELETE)
- [x] `/families/:id/members/:id/role` (PUT)
- [x] `/families/join` (POST)
- [x] `/families/:id/share/meal-plan` (POST)
- [x] `/families/:id/share/workout` (POST)
- [x] `/families/:id/share/shopping-list` (POST)
- [x] `/families/:id/recipes` (GET)
- [x] `/families/:id/dashboard` (GET)
- [x] `/families/:id/members/:id/controls` (GET, PUT)
- [x] `/families/:id/goals` (GET, POST)
- [x] `/families/:id/activity` (GET)

### Phase 4: Testing (3 days)
- [ ] Unit tests for all endpoints
- [ ] Integration tests for workflows
- [ ] Test coach→client flow end-to-end
- [ ] Test family creation and sharing flow
- [ ] Load testing for performance
- [ ] Security testing (auth, permissions)

### Phase 5: Deployment (2 days)
- [ ] Deploy database migrations to production
- [ ] Deploy backend to services.wihy.ai
- [ ] Update API documentation
- [ ] Configure monitoring and alerts
- [ ] Smoke test in production

### Phase 6: Frontend Verification (1 day)
- [ ] Test CoachDashboard with real data
- [ ] Test ClientManagement with real data
- [ ] Test FamilyDashboardPage with real data
- [ ] Test ParentDashboard with real data
- [ ] Verify all error handling
- [ ] Test on all platforms (iOS, Android, Web)

---

## 5. Authorization & Permissions

### Coaching Endpoints
- Coach can only access their own clients
- Client can only see their own coach
- Admin can see all relationships

**Middleware:**
```typescript
async function requireCoachAccess(req, res, next) {
  const { coachId } = req.params;
  const userId = req.user.id;
  
  // Check if user is the coach OR an admin
  if (userId !== coachId && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Verify user has coach capability
  if (!req.user.capabilities?.coachPlatform) {
    return res.status(403).json({ error: 'Coach platform access required' });
  }
  
  next();
}
```

### Family Endpoints
- Family members can only access their own family
- Only PARENT/GUARDIAN can invite/remove members
- Only PARENT/GUARDIAN can set parental controls

**Middleware:**
```typescript
async function requireFamilyAccess(req, res, next) {
  const { familyId } = req.params;
  const userId = req.user.id;
  
  // Check if user is a member of this family
  const member = await FamilyMember.findOne({
    where: { family_id: familyId, user_id: userId, is_active: true }
  });
  
  if (!member && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  req.familyRole = member?.role;
  next();
}

async function requireParentRole(req, res, next) {
  if (!['PARENT', 'GUARDIAN'].includes(req.familyRole) && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Parent/Guardian access required' });
  }
  next();
}
```

---

## 6. Implementation Status

✅ **Phase 2 & 3 Complete** - All coaching and family endpoints implemented!

**Routes Mounted:**
- `/api/coaching/coaches/*` - Coach client management (coachRoutes.js)
- `/api/coaching/invitations/*` - Invitation management (coachingRoutes.js)
- `/api/families/*` - Family platform (familyRoutes.js)

**What's Ready:**
- ✅ All 13 coaching endpoints implemented
- ✅ All 16 family endpoints implemented  
- ✅ Revenue analytics endpoint
- ✅ User family lookup endpoint
- ✅ CoachService.js with getCoachRevenue()
- ✅ FamilyService.js with getUserFamily()

**Next Steps:**

1. **Database Migration** (Phase 1) - Run migration scripts to create tables
2. **Testing** (Phase 4) - Unit tests, integration tests, end-to-end flows
3. **Deployment** (Phase 5) - Deploy to production with monitoring
4. **Frontend Verification** (Phase 6) - Test with real API on all platforms

**Note:** Database tables from schema section need to be created before endpoints will work with real data.
