import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';

// ============= TYPES =============

export type FamilyRole = 'PARENT' | 'GUARDIAN' | 'CHILD' | 'MEMBER';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type ShareType = 'MEAL_PLAN' | 'WORKOUT' | 'SHOPPING_LIST' | 'RECIPE';
export type SharePermission = 'VIEW' | 'USE' | 'EDIT';

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

// ============= SERVICE =============

class FamilyService {
  private baseUrl: string;

  constructor() {
    // Family endpoints go to User Service (user.wihy.ai) per API Reference
    this.baseUrl = API_CONFIG.userUrl;
  }

  // ============= FAMILY MANAGEMENT =============

  /**
   * Create a new family
   * POST /api/families
   */
  async createFamily(params: {
    name: string;
    creatorId: string;
  }): Promise<{
    success: boolean;
    family_id?: string;
    guardian_code?: string;
    message?: string;
  }> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/families`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: params.name,
        created_by: params.creatorId,
      }),
    });
    return response.json();
  }

  /**
   * Get family details
   * GET /api/families/:familyId
   */
  async getFamily(familyId: string): Promise<Family> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/families/${familyId}`);
    const data = await response.json();
    return data.data;
  }

  /**
   * Get family by guardian code
   * GET /api/families/by-code/:code
   */
  async getFamilyByCode(guardianCode: string): Promise<Family | null> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/by-code/${guardianCode}`
    );
    const data = await response.json();
    return data.data || null;
  }

  /**
   * Get user's family
   * GET /api/users/:userId/family
   */
  async getUserFamily(userId: string): Promise<Family | null> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/users/${userId}/family`);
    const data = await response.json();
    return data.data || null;
  }

  /**
   * Update family settings
   * PUT /api/families/:familyId
   */
  async updateFamily(
    familyId: string,
    updates: {
      name?: string;
    }
  ): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/families/${familyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.json();
  }

  /**
   * Get guardian code for family
   * GET /api/families/:familyId/guardian-code
   */
  async getGuardianCode(familyId: string): Promise<{ code: string; expires_at?: string }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/guardian-code`
    );
    const data = await response.json();
    return data.data;
  }

  /**
   * Regenerate guardian code
   * POST /api/families/:familyId/regenerate-code
   */
  async regenerateGuardianCode(familyId: string): Promise<{ code: string }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/regenerate-code`,
      { method: 'POST' }
    );
    const data = await response.json();
    return data.data;
  }

  // ============= MEMBER MANAGEMENT =============

  /**
   * Get family members
   * GET /api/families/:familyId/members
   */
  async getMembers(familyId: string): Promise<FamilyMember[]> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/families/${familyId}/members`);
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Invite member to family
   * POST /api/families/:familyId/invite
   */
  async inviteMember(params: {
    familyId: string;
    inviterId: string;
    email?: string;
    role: FamilyRole;
    message?: string;
  }): Promise<{
    success: boolean;
    invite_id?: string;
    invite_code?: string;
    message?: string;
  }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${params.familyId}/invite`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviter_id: params.inviterId,
          email: params.email,
          role: params.role,
          message: params.message,
        }),
      }
    );
    return response.json();
  }

  /**
   * Join family using guardian code
   * POST /api/families/join
   */
  async joinFamily(params: {
    userId: string;
    guardianCode: string;
    role?: FamilyRole;
  }): Promise<{
    success: boolean;
    family_id?: string;
    message?: string;
  }> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/families/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: params.userId,
        guardian_code: params.guardianCode,
        role: params.role || 'MEMBER',
      }),
    });
    return response.json();
  }

  /**
   * Accept family invitation
   * POST /api/families/invites/:inviteId/accept
   */
  async acceptInvite(inviteId: string, userId: string): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/invites/${inviteId}/accept`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      }
    );
    return response.json();
  }

  /**
   * Decline family invitation
   * POST /api/families/invites/:inviteId/decline
   */
  async declineInvite(inviteId: string, userId: string): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/invites/${inviteId}/decline`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      }
    );
    return response.json();
  }

  /**
   * Update member role
   * PUT /api/families/:familyId/members/:memberId/role
   */
  async updateMemberRole(
    familyId: string,
    memberId: string,
    role: FamilyRole
  ): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/members/${memberId}/role`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      }
    );
    return response.json();
  }

  /**
   * Remove member from family
   * DELETE /api/families/:familyId/members/:memberId
   */
  async removeMember(familyId: string, memberId: string): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/members/${memberId}`,
      { method: 'DELETE' }
    );
    return response.json();
  }

  /**
   * Leave family (for member)
   * POST /api/families/:familyId/leave
   */
  async leaveFamily(familyId: string, userId: string): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/leave`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      }
    );
    return response.json();
  }

  // ============= MEAL PLAN SHARING =============

  /**
   * Share meal plan with family
   * POST /api/families/:familyId/share/meal-plan
   * 
   * Use cases:
   * - Parent creates meal plan and shares with whole family
   * - Share meal plan with specific family members
   * - Set servings for family size
   */
  async shareMealPlanWithFamily(params: {
    familyId: string;
    programId: string;
    sharedBy: string;
    servings?: number;
    permission?: SharePermission;
    assignToMembers?: string[];
    notes?: string;
  }): Promise<{
    success: boolean;
    share_id?: string;
    message?: string;
  }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${params.familyId}/share/meal-plan`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: params.programId,
          shared_by: params.sharedBy,
          servings: params.servings,
          permission: params.permission || 'USE',
          assign_to_members: params.assignToMembers,
          notes: params.notes,
        }),
      }
    );
    return response.json();
  }

  /**
   * Get family's shared meal plans
   * GET /api/families/:familyId/meal-plans
   */
  async getFamilyMealPlans(familyId: string): Promise<FamilyMealPlan[]> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/meal-plans`
    );
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Unshare meal plan from family
   * DELETE /api/families/:familyId/share/meal-plan/:shareId
   */
  async unshareMealPlan(familyId: string, shareId: string): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/share/meal-plan/${shareId}`,
      { method: 'DELETE' }
    );
    return response.json();
  }

  /**
   * Assign shared meal plan to specific member
   * POST /api/families/:familyId/meal-plans/:programId/assign
   */
  async assignMealPlanToMember(
    familyId: string,
    programId: string,
    memberId: string
  ): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/meal-plans/${programId}/assign`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId }),
      }
    );
    return response.json();
  }

  // ============= WORKOUT SHARING =============

  /**
   * Share workout plan with family
   * POST /api/families/:familyId/share/workout
   * 
   * Use cases:
   * - Parent creates workout plan and shares with kids
   * - Share family fitness challenge
   * - Track family workout progress together
   */
  async shareWorkoutWithFamily(params: {
    familyId: string;
    programId: string;
    sharedBy: string;
    permission?: SharePermission;
    assignToMembers?: string[];
    notes?: string;
  }): Promise<{
    success: boolean;
    share_id?: string;
    message?: string;
  }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${params.familyId}/share/workout`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: params.programId,
          shared_by: params.sharedBy,
          permission: params.permission || 'USE',
          assign_to_members: params.assignToMembers,
          notes: params.notes,
        }),
      }
    );
    return response.json();
  }

  /**
   * Get family's shared workout plans
   * GET /api/families/:familyId/workouts
   */
  async getFamilyWorkouts(familyId: string): Promise<FamilyWorkout[]> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/workouts`
    );
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Unshare workout from family
   * DELETE /api/families/:familyId/share/workout/:shareId
   */
  async unshareWorkout(familyId: string, shareId: string): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/share/workout/${shareId}`,
      { method: 'DELETE' }
    );
    return response.json();
  }

  /**
   * Assign shared workout to specific member
   * POST /api/families/:familyId/workouts/:programId/assign
   */
  async assignWorkoutToMember(
    familyId: string,
    programId: string,
    memberId: string
  ): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/workouts/${programId}/assign`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId }),
      }
    );
    return response.json();
  }

  // ============= SHOPPING LIST SHARING =============

  /**
   * Share shopping list with family
   * POST /api/families/:familyId/share/shopping-list
   * 
   * Use cases:
   * - Share weekly grocery list with family
   * - Collaborative shopping list that family members can check items on
   * - Generate list from shared meal plan
   */
  async shareShoppingListWithFamily(params: {
    familyId: string;
    listId: string;
    sharedBy: string;
    permission?: SharePermission;
    notes?: string;
  }): Promise<{
    success: boolean;
    share_id?: string;
    message?: string;
  }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${params.familyId}/share/shopping-list`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          list_id: params.listId,
          shared_by: params.sharedBy,
          permission: params.permission || 'EDIT',
          notes: params.notes,
        }),
      }
    );
    return response.json();
  }

  /**
   * Get family's shared shopping lists
   * GET /api/families/:familyId/shopping-lists
   */
  async getFamilyShoppingLists(familyId: string): Promise<FamilyShoppingList[]> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/shopping-lists`
    );
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Check item on shared shopping list (any family member can do this)
   * PUT /api/families/:familyId/shopping-lists/:listId/items/:itemId/check
   */
  async checkShoppingListItem(
    familyId: string,
    listId: string,
    itemId: string,
    userId: string
  ): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/shopping-lists/${listId}/items/${itemId}/check`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checked_by: userId,
          checked: true,
        }),
      }
    );
    return response.json();
  }

  // ============= RECIPE SHARING =============

  /**
   * Share recipe with family
   * POST /api/families/:familyId/share/recipe
   */
  async shareRecipeWithFamily(params: {
    familyId: string;
    recipeId: string;
    sharedBy: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    share_id?: string;
    message?: string;
  }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${params.familyId}/share/recipe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_id: params.recipeId,
          shared_by: params.sharedBy,
          notes: params.notes,
        }),
      }
    );
    return response.json();
  }

  /**
   * Get family's shared recipes
   * GET /api/families/:familyId/recipes
   */
  async getFamilyRecipes(familyId: string): Promise<Array<{
    recipe_id: string;
    name: string;
    shared_by: string;
    shared_by_name: string;
    shared_at: string;
    is_favorite: boolean;
  }>> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/recipes`
    );
    const data = await response.json();
    return data.data || [];
  }

  // ============= FAMILY DASHBOARD =============

  /**
   * Get family dashboard with all shared items and activity
   * GET /api/families/:familyId/dashboard
   */
  async getFamilyDashboard(familyId: string): Promise<FamilyDashboard> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/dashboard`
    );
    const data = await response.json();
    return data.data;
  }

  /**
   * Get member's view of family content
   * GET /api/families/:familyId/members/:memberId/content
   */
  async getMemberContent(
    familyId: string,
    memberId: string
  ): Promise<{
    assigned_meal_plans: FamilyMealPlan[];
    assigned_workouts: FamilyWorkout[];
    available_shopping_lists: FamilyShoppingList[];
  }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/members/${memberId}/content`
    );
    const data = await response.json();
    return data.data;
  }

  // ============= PARENTAL CONTROLS =============

  /**
   * Set parental controls for a child member
   * PUT /api/families/:familyId/members/:memberId/controls
   */
  async setParentalControls(
    familyId: string,
    memberId: string,
    controls: {
      can_view_nutrition?: boolean;
      can_edit_meals?: boolean;
      can_create_workouts?: boolean;
      daily_calorie_limit?: number;
      require_approval_for_changes?: boolean;
    }
  ): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/members/${memberId}/controls`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(controls),
      }
    );
    return response.json();
  }

  /**
   * Get parental controls for a member
   * GET /api/families/:familyId/members/:memberId/controls
   */
  async getParentalControls(
    familyId: string,
    memberId: string
  ): Promise<{
    can_view_nutrition: boolean;
    can_edit_meals: boolean;
    can_create_workouts: boolean;
    daily_calorie_limit?: number;
    require_approval_for_changes: boolean;
  }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/members/${memberId}/controls`
    );
    const data = await response.json();
    return data.data;
  }

  // ============= FAMILY ACTIVITY =============

  /**
   * Get family activity feed
   * GET /api/families/:familyId/activity
   */
  async getActivityFeed(
    familyId: string,
    params?: {
      limit?: number;
      offset?: number;
      type?: 'meal_logged' | 'workout_completed' | 'item_checked' | 'plan_shared';
    }
  ): Promise<Array<{
    id: string;
    type: string;
    member_id: string;
    member_name: string;
    description: string;
    timestamp: string;
    details?: any;
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.type) queryParams.append('type', params.type);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/activity${queryString}`
    );
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Log family activity (for internal use)
   * POST /api/families/:familyId/activity
   */
  async logActivity(
    familyId: string,
    activity: {
      memberId: string;
      type: 'meal_logged' | 'workout_completed' | 'item_checked' | 'plan_shared';
      description: string;
      details?: any;
    }
  ): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/activity`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: activity.memberId,
          type: activity.type,
          description: activity.description,
          details: activity.details,
        }),
      }
    );
    return response.json();
  }

  // ============= FAMILY GOALS =============

  /**
   * Set family-wide goal
   * POST /api/families/:familyId/goals
   */
  async setFamilyGoal(params: {
    familyId: string;
    createdBy: string;
    type: 'weekly_workouts' | 'daily_vegetables' | 'water_intake' | 'family_meals';
    target: number;
    description?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    goal_id?: string;
  }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${params.familyId}/goals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          created_by: params.createdBy,
          type: params.type,
          target: params.target,
          description: params.description,
          start_date: params.startDate,
          end_date: params.endDate,
        }),
      }
    );
    return response.json();
  }

  /**
   * Get family goals and progress
   * GET /api/families/:familyId/goals
   */
  async getFamilyGoals(familyId: string): Promise<Array<{
    goal_id: string;
    type: string;
    target: number;
    current_progress: number;
    progress_percentage: number;
    start_date: string;
    end_date?: string;
    is_active: boolean;
    member_progress: Array<{
      member_id: string;
      member_name: string;
      contribution: number;
    }>;
  }>> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/goals`
    );
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Update goal progress for a member
   * PUT /api/families/:familyId/goals/:goalId/progress
   */
  async updateGoalProgress(
    familyId: string,
    goalId: string,
    memberId: string,
    progress: number
  ): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/families/${familyId}/goals/${goalId}/progress`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          progress,
        }),
      }
    );
    return response.json();
  }
}

export const familyService = new FamilyService();
