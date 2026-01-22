import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';

// ============= TYPES =============

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type RelationshipStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'active' | 'inactive';

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

// API Response Types
export interface APIClient {
  client_id: string;
  status: string;
  relationship_started: string;
  client_name: string | null;
  client_email: string | null;
  active_meal_programs: string;
  active_fitness_programs: string;
}

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

/** Client note categories */
export type NoteCategory = 'progress' | 'nutrition' | 'fitness' | 'health' | 'general';

/** Coach note for a client */
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

export interface CoachOverview {
  total_clients: number;
  active_clients: number;
  pending_invitations: number;
  clients: Client[];
  recent_activity: any[];
}

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

// ============= SERVICE =============

class CoachService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  // ============= INVITATIONS =============

  /**
   * Send coach invitation to a client
   */
  async sendInvitation(invitation: CoachInvitation): Promise<any> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaching/invitations/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invitation),
      }
    );
    return response.json();
  }

  /**
   * Get pending invitations for a coach
   */
  async getPendingInvitations(coachId: string): Promise<CoachInvitation[]> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaching/invitations/pending?coachId=${coachId}`
    );
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Accept coach invitation (called by client)
   */
  async acceptInvitation(invitationId: string, clientId: string): Promise<any> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaching/invitations/accept`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, clientId }),
      }
    );
    return response.json();
  }

  /**
   * Decline coach invitation (called by client)
   */
  async declineInvitation(invitationId: string, clientId: string): Promise<any> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaching/invitations/decline`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, clientId }),
      }
    );
    return response.json();
  }

  // ============= CLIENT MANAGEMENT =============

  /**
   * List all clients for a coach
   * GET /api/coaches/:coachId/clients
   * 
   * Returns list of clients with their status, active programs, and relationship info.
   */
  async listClients(
    coachId: string,
    params?: {
      search?: string;
      status?: RelationshipStatus;
    }
  ): Promise<Client[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/clients${queryString}`
    );
    const data = await response.json();
    
    // Transform API response to Client interface
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((client: APIClient) => ({
        id: client.client_id,
        name: client.client_name || 'Unknown',
        email: client.client_email || '',
        status: client.status as RelationshipStatus,
        joined_date: client.relationship_started,
        active_meal_programs: parseInt(client.active_meal_programs) || 0,
        active_fitness_programs: parseInt(client.active_fitness_programs) || 0,
      }));
    }
    return [];
  }

  /**
   * Add a new client
   * POST /api/coaches/:coachId/clients
   * 
   * Adds a client to the coach's roster. Can be used to:
   * - Add existing user by email
   * - Send invitation to new user
   */
  async addClient(params: {
    coachId: string;
    clientEmail: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    client_id?: string;
    relationship_id?: string;
    message?: string;
  }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${params.coachId}/clients`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_email: params.clientEmail,
          notes: params.notes,
        }),
      }
    );
    return response.json();
  }

  /**
   * Remove a client from coach's roster
   * DELETE /api/coaches/:coachId/clients/:clientId
   */
  async removeClient(
    coachId: string,
    clientId: string
  ): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/clients/${clientId}`,
      { method: 'DELETE' }
    );
    return response.json();
  }

  /**
   * Update client relationship status (active/inactive)
   * PUT /api/coaches/:coachId/clients/:clientId/status
   */
  async updateClientStatus(
    coachId: string,
    clientId: string,
    status: 'active' | 'inactive'
  ): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/clients/${clientId}/status`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }
    );
    return response.json();
  }

  /**
   * Get client's coach (called by client)
   */
  async getClientCoach(clientId: string): Promise<any> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaching/relationships/client/${clientId}/coach`
    );
    const data = await response.json();
    return data.data;
  }

  // ============= DASHBOARDS & MONITORING =============

  /**
   * Get detailed client progress dashboard
   * GET /api/coaches/:coachId/clients/:clientId/dashboard
   * 
   * Returns comprehensive client dashboard with:
   * - Fitness progress and workout completion
   * - Nutrition summary and meal adherence
   * - Recent activity and trends
   */
  async getClientDashboard(
    coachId: string,
    clientId: string
  ): Promise<ClientDashboard> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/clients/${clientId}/dashboard`
    );
    const data = await response.json();
    return data.data;
  }

  /**
   * Get coach overview with all clients
   */
  async getCoachOverview(coachId: string): Promise<CoachOverview> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/overview`
    );
    const data = await response.json();
    return data.data;
  }

  // ============= MEAL PROGRAM ASSIGNMENT =============

  /**
   * Assign meal program to client
   * POST /api/coaches/:coachId/clients/:clientId/meal-program
   * 
   * Use cases:
   * - Coach creates a meal plan and assigns to client
   * - Reassigning a different meal plan to client
   * - Client receives notification of new meal plan
   */
  async assignMealProgram(params: {
    coachId: string;
    clientId: string;
    programId: string;
    startDate?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    assignment_id?: string;
    message?: string;
  }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${params.coachId}/clients/${params.clientId}/meal-program`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: params.programId,
          start_date: params.startDate || new Date().toISOString().split('T')[0],
          notes: params.notes,
        }),
      }
    );
    return response.json();
  }

  /**
   * Get client's assigned meal programs
   * GET /api/coaches/:coachId/clients/:clientId/meal-programs
   */
  async getClientMealPrograms(
    coachId: string,
    clientId: string
  ): Promise<Array<{
    assignment_id: string;
    program_id: string;
    program_name: string;
    assigned_date: string;
    start_date: string;
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    completion_percentage: number;
    adherence_rate: number;
  }>> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/clients/${clientId}/meal-programs`
    );
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Remove/unassign meal program from client
   * DELETE /api/coaches/:coachId/clients/:clientId/meal-program/:assignmentId
   */
  async unassignMealProgram(
    coachId: string,
    clientId: string,
    assignmentId: string
  ): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/clients/${clientId}/meal-program/${assignmentId}`,
      { method: 'DELETE' }
    );
    return response.json();
  }

  /**
   * Create meal plan specifically for a client
   * POST /api/coaches/:coachId/clients/:clientId/create-meal-plan
   * 
   * Creates a custom meal plan based on client's preferences and goals,
   * then automatically assigns it to the client.
   */
  async createMealPlanForClient(params: {
    coachId: string;
    clientId: string;
    description: string;
    duration: number;
    mealsPerDay: {
      breakfast: boolean;
      lunch: boolean;
      dinner: boolean;
      morningSnack?: boolean;
      eveningSnack?: boolean;
    };
    servings?: number;
    dietaryRestrictions?: string[];
    specialFocus?: string[];
    dailyCalorieTarget?: number;
    notes?: string;
  }): Promise<{
    success: boolean;
    program_id?: string;
    assignment_id?: string;
    message?: string;
  }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${params.coachId}/clients/${params.clientId}/create-meal-plan`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: params.description,
          duration: params.duration,
          meals_per_day: params.mealsPerDay,
          servings: params.servings || 1,
          dietary_restrictions: params.dietaryRestrictions,
          special_focus: params.specialFocus,
          daily_calorie_target: params.dailyCalorieTarget,
          notes: params.notes,
        }),
      }
    );
    return response.json();
  }

  /**
   * Create workout plan specifically for a client
   * POST /api/coaches/:coachId/clients/:clientId/create-workout-plan
   * 
   * Creates a custom workout plan based on client's profile and goals,
   * then automatically assigns it to the client.
   */
  async createWorkoutPlanForClient(params: {
    coachId: string;
    clientId: string;
    name: string;
    description?: string;
    goal: 'HYPERTROPHY' | 'STRENGTH' | 'ENDURANCE' | 'WEIGHT_LOSS';
    durationWeeks: number;
    daysPerWeek: number;
    equipment?: string[];
    notes?: string;
  }): Promise<{
    success: boolean;
    program_id?: string;
    message?: string;
  }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${params.coachId}/clients/${params.clientId}/create-workout-plan`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: params.name,
          description: params.description,
          goal: params.goal,
          duration_weeks: params.durationWeeks,
          days_per_week: params.daysPerWeek,
          equipment: params.equipment,
          notes: params.notes,
        }),
      }
    );
    return response.json();
  }

  /**
   * Assign an existing fitness/workout program to a client
   * POST /api/coaches/:coachId/clients/:clientId/workout-program
   * 
   * Used to assign a pre-existing program from the library or a previously created program
   */
  async assignFitnessPlan(params: {
    coachId: string;
    clientId: string;
    programId: string;
    startDate?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    assignment_id?: string;
    message?: string;
  }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${params.coachId}/clients/${params.clientId}/workout-program`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: params.programId,
          start_date: params.startDate || new Date().toISOString().split('T')[0],
          notes: params.notes,
        }),
      }
    );
    return response.json();
  }

  /**
   * Remove/unassign workout program from client
   * DELETE /api/coaches/:coachId/clients/:clientId/workout-program/:assignmentId
   */
  async unassignFitnessPlan(
    coachId: string,
    clientId: string,
    assignmentId: string
  ): Promise<{ success: boolean; message?: string }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/clients/${clientId}/workout-program/${assignmentId}`,
      { method: 'DELETE' }
    );
    return response.json();
  }

  /**
   * Get client's assigned workout plans
   * GET /api/coaches/:coachId/clients/:clientId/workout-programs
   */
  async getClientWorkoutPrograms(
    coachId: string,
    clientId: string
  ): Promise<Array<{
    program_id: string;
    name: string;
    goal: string;
    assigned_date: string;
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    completion_percentage: number;
    workouts_completed: number;
    adherence_rate: number;
  }>> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/clients/${clientId}/workout-programs`
    );
    const data = await response.json();
    return data.data || [];
  }

  // ============= CLIENT NOTES =============

  /**
   * Add a note for a client
   * POST /api/coaches/:coachId/clients/:clientId/notes
   * 
   * Creates a new note for tracking client progress, observations, or instructions
   */
  async addClientNote(
    coachId: string,
    clientId: string,
    content: string,
    category: NoteCategory = 'general',
    relatedProgramId?: string
  ): Promise<ClientNote> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/clients/${clientId}/notes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          category,
          related_program_id: relatedProgramId,
        }),
      }
    );
    const data = await response.json();
    return data.data;
  }

  /**
   * Get client notes with optional filtering
   * GET /api/coaches/:coachId/clients/:clientId/notes
   * 
   * Returns notes for a client, optionally filtered by category
   */
  async getClientNotes(
    coachId: string,
    clientId: string,
    options?: {
      category?: NoteCategory;
      limit?: number;
      offset?: number;
    }
  ): Promise<ClientNote[]> {
    const params = new URLSearchParams();
    
    if (options?.category) params.append('category', options.category);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/clients/${clientId}/notes${queryString}`
    );
    const data = await response.json();
    return data.data?.notes || [];
  }

  /**
   * Update a client note
   * PUT /api/coaches/:coachId/notes/:noteId
   */
  async updateClientNote(
    coachId: string,
    noteId: string,
    updates: { content?: string; category?: NoteCategory }
  ): Promise<ClientNote> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/notes/${noteId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );
    const data = await response.json();
    return data.data;
  }

  /**
   * Delete a client note
   * DELETE /api/coaches/:coachId/notes/:noteId
   */
  async deleteClientNote(coachId: string, noteId: string): Promise<void> {
    await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/notes/${noteId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Get coach public profile (for CoachDetailPage)
   * GET /api/coaches/:coachId/profile
   */
  async getCoachProfile(coachId: string): Promise<any> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/coaches/${coachId}/profile`,
      { method: 'GET' }
    );
    const data = await response.json();
    return data.data || data;
  }
}

export const coachService = new CoachService();
