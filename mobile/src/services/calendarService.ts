/**
 * Calendar Service
 * 
 * Client-side service for calendar events, scheduling workouts, meals, and reminders.
 * Connects to services.wihy.ai for calendar management.
 */

import { servicesApi } from './servicesApiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============= TYPES =============

export type EventType = 
  | 'workout' 
  | 'meal' 
  | 'water_reminder' 
  | 'medication' 
  | 'appointment' 
  | 'coaching_session'
  | 'weigh_in'
  | 'custom';

export type EventStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled' | 'rescheduled';

export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  startTime: string;
  endTime?: string;
  allDay: boolean;
  location?: string;
  color?: string;
  icon?: string;
  
  // Linked resources
  linkedResourceId?: string;
  linkedResourceType?: 'workout_program' | 'meal_plan' | 'coach' | 'recipe';
  
  // Recurrence
  isRecurring: boolean;
  recurrence?: {
    pattern: RecurrencePattern;
    interval: number;
    daysOfWeek?: number[]; // 0-6, Sunday-Saturday
    endDate?: string;
    occurrences?: number;
  };
  parentEventId?: string;
  
  // Reminders
  reminders?: EventReminder[];
  
  // Metadata
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface EventReminder {
  id: string;
  minutesBefore: number;
  type: 'notification' | 'email' | 'sms';
  enabled: boolean;
}

export interface CalendarDay {
  date: string;
  events: CalendarEvent[];
  hasWorkout: boolean;
  hasMeal: boolean;
  completedCount: number;
  totalCount: number;
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
  summary: {
    totalEvents: number;
    completedEvents: number;
    missedEvents: number;
    workoutDays: number;
    mealPlanDays: number;
  };
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  type: EventType;
  startTime: string;
  endTime?: string;
  allDay?: boolean;
  location?: string;
  color?: string;
  linkedResourceId?: string;
  linkedResourceType?: string;
  isRecurring?: boolean;
  recurrence?: CalendarEvent['recurrence'];
  reminders?: Omit<EventReminder, 'id'>[];
  metadata?: Record<string, any>;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: EventStatus;
  location?: string;
  reminders?: Omit<EventReminder, 'id'>[];
  metadata?: Record<string, any>;
}

export interface GetEventsOptions {
  startDate: string;
  endDate: string;
  types?: EventType[];
  status?: EventStatus[];
  linkedResourceId?: string;
}

// ============= CONSTANTS =============

const CACHE_KEY = '@calendar_events';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// ============= SERVICE IMPLEMENTATION =============

class CalendarService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  // ==========================================
  // EVENTS CRUD
  // ==========================================

  /**
   * Create a new calendar event
   * 
   * @param event - Event details
   * @returns Created event
   */
  async createEvent(event: CreateEventRequest): Promise<CalendarEvent> {
    try {
      const response = await servicesApi.post<{ event: CalendarEvent }>(
        '/api/calendar/events',
        event
      );
      
      // Invalidate cache
      this.invalidateCache();
      
      return response.event;
    } catch (error) {
      console.error('[CalendarService] Error creating event:', error);
      throw error;
    }
  }

  /**
   * Get a specific event by ID
   * 
   * @param eventId - Event ID
   * @returns Event details
   */
  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      const response = await servicesApi.get<{ event: CalendarEvent }>(
        `/api/calendar/events/${eventId}`
      );
      return response.event || null;
    } catch (error) {
      console.error('[CalendarService] Error fetching event:', error);
      return null;
    }
  }

  /**
   * Get events within a date range
   * 
   * @param options - Query options
   * @returns List of events
   */
  async getEvents(options: GetEventsOptions): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams();
      params.append('startDate', options.startDate);
      params.append('endDate', options.endDate);
      
      if (options.types?.length) {
        params.append('types', options.types.join(','));
      }
      if (options.status?.length) {
        params.append('status', options.status.join(','));
      }
      if (options.linkedResourceId) {
        params.append('linkedResourceId', options.linkedResourceId);
      }

      const response = await servicesApi.get<{ events: CalendarEvent[] }>(
        `/api/calendar/events?${params.toString()}`
      );
      
      return response.events || [];
    } catch (error) {
      console.error('[CalendarService] Error fetching events:', error);
      return [];
    }
  }

  /**
   * Update an existing event
   * 
   * @param eventId - Event ID
   * @param updates - Fields to update
   * @returns Updated event
   */
  async updateEvent(eventId: string, updates: UpdateEventRequest): Promise<CalendarEvent> {
    try {
      const response = await servicesApi.put<{ event: CalendarEvent }>(
        `/api/calendar/events/${eventId}`,
        updates
      );
      
      this.invalidateCache();
      return response.event;
    } catch (error) {
      console.error('[CalendarService] Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete an event
   * 
   * @param eventId - Event ID
   * @param deleteRecurring - If recurring, delete all future occurrences
   */
  async deleteEvent(eventId: string, deleteRecurring: boolean = false): Promise<void> {
    try {
      await servicesApi.delete(
        `/api/calendar/events/${eventId}?deleteRecurring=${deleteRecurring}`
      );
      this.invalidateCache();
    } catch (error) {
      console.error('[CalendarService] Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Mark an event as completed
   * 
   * @param eventId - Event ID
   * @param notes - Optional completion notes
   * @returns Updated event
   */
  async completeEvent(eventId: string, notes?: string): Promise<CalendarEvent> {
    return this.updateEvent(eventId, { 
      status: 'completed',
      metadata: notes ? { completionNotes: notes } : undefined,
    });
  }

  /**
   * Mark an event as missed
   * 
   * @param eventId - Event ID
   * @param reason - Optional reason
   */
  async markEventMissed(eventId: string, reason?: string): Promise<CalendarEvent> {
    return this.updateEvent(eventId, {
      status: 'missed',
      metadata: reason ? { missedReason: reason } : undefined,
    });
  }

  /**
   * Reschedule an event
   * 
   * @param eventId - Event ID
   * @param newStartTime - New start time
   * @param newEndTime - Optional new end time
   */
  async rescheduleEvent(
    eventId: string,
    newStartTime: string,
    newEndTime?: string
  ): Promise<CalendarEvent> {
    return this.updateEvent(eventId, {
      startTime: newStartTime,
      endTime: newEndTime,
      status: 'rescheduled',
    });
  }

  // ==========================================
  // CALENDAR VIEWS
  // ==========================================

  /**
   * Get calendar data for a specific month
   * 
   * @param year - Year
   * @param month - Month (1-12)
   * @returns Month calendar with daily summaries
   */
  async getMonthCalendar(year: number, month: number): Promise<CalendarMonth> {
    try {
      const response = await servicesApi.get<CalendarMonth>(
        `/api/calendar/month?year=${year}&month=${month}`
      );
      return response;
    } catch (error) {
      console.error('[CalendarService] Error fetching month calendar:', error);
      
      // Return empty month structure
      return {
        year,
        month,
        days: [],
        summary: {
          totalEvents: 0,
          completedEvents: 0,
          missedEvents: 0,
          workoutDays: 0,
          mealPlanDays: 0,
        },
      };
    }
  }

  /**
   * Get calendar data for a specific week
   * 
   * @param startDate - Start date of the week
   * @returns Array of 7 CalendarDay objects
   */
  async getWeekCalendar(startDate: string): Promise<CalendarDay[]> {
    try {
      const response = await servicesApi.get<{ days: CalendarDay[] }>(
        `/api/calendar/week?startDate=${startDate}`
      );
      return response.days || [];
    } catch (error) {
      console.error('[CalendarService] Error fetching week calendar:', error);
      return [];
    }
  }

  /**
   * Get today's events
   * 
   * @returns Today's events
   */
  async getTodayEvents(): Promise<CalendarEvent[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getEvents({
      startDate: today,
      endDate: today,
    });
  }

  /**
   * Get upcoming events
   * 
   * @param days - Number of days to look ahead
   * @param limit - Max number of events
   * @returns Upcoming events
   */
  async getUpcomingEvents(days: number = 7, limit: number = 20): Promise<CalendarEvent[]> {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    try {
      const response = await servicesApi.get<{ events: CalendarEvent[] }>(
        `/api/calendar/upcoming?days=${days}&limit=${limit}`
      );
      return response.events || [];
    } catch (error) {
      console.error('[CalendarService] Error fetching upcoming events:', error);
      return [];
    }
  }

  // ==========================================
  // SCHEDULING HELPERS
  // ==========================================

  /**
   * Schedule a workout from a program
   * 
   * @param programId - Workout program ID
   * @param workoutId - Specific workout ID
   * @param scheduledTime - When to schedule
   * @returns Created event
   */
  async scheduleWorkout(
    programId: string,
    workoutId: string,
    scheduledTime: string
  ): Promise<CalendarEvent> {
    return this.createEvent({
      title: 'Workout',
      type: 'workout',
      startTime: scheduledTime,
      linkedResourceId: workoutId,
      linkedResourceType: 'workout_program',
      reminders: [
        { minutesBefore: 30, type: 'notification', enabled: true },
      ],
      metadata: { programId },
    });
  }

  /**
   * Schedule a meal plan
   * 
   * @param mealPlanId - Meal plan ID
   * @param startDate - Start date
   * @param duration - Duration in days
   * @returns Created events
   */
  async scheduleMealPlan(
    mealPlanId: string,
    startDate: string,
    duration: number
  ): Promise<CalendarEvent[]> {
    try {
      const response = await servicesApi.post<{ events: CalendarEvent[] }>(
        '/api/calendar/schedule-meal-plan',
        { mealPlanId, startDate, duration }
      );
      
      this.invalidateCache();
      return response.events || [];
    } catch (error) {
      console.error('[CalendarService] Error scheduling meal plan:', error);
      throw error;
    }
  }

  /**
   * Schedule a coaching session
   * 
   * @param coachId - Coach user ID
   * @param scheduledTime - Session time
   * @param duration - Duration in minutes
   * @param notes - Optional notes
   */
  async scheduleCoachingSession(
    coachId: string,
    scheduledTime: string,
    duration: number = 60,
    notes?: string
  ): Promise<CalendarEvent> {
    const endTime = new Date(new Date(scheduledTime).getTime() + duration * 60000).toISOString();
    
    return this.createEvent({
      title: 'Coaching Session',
      type: 'coaching_session',
      startTime: scheduledTime,
      endTime,
      linkedResourceId: coachId,
      linkedResourceType: 'coach',
      description: notes,
      reminders: [
        { minutesBefore: 60, type: 'notification', enabled: true },
        { minutesBefore: 15, type: 'notification', enabled: true },
      ],
    });
  }

  /**
   * Schedule a weigh-in reminder
   * 
   * @param time - Time for weigh-in (HH:MM)
   * @param daysOfWeek - Days to remind (0-6)
   */
  async scheduleWeighInReminder(
    time: string,
    daysOfWeek: number[] = [0] // Default: Sunday
  ): Promise<CalendarEvent> {
    const [hours, minutes] = time.split(':');
    const startTime = new Date();
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return this.createEvent({
      title: 'Weekly Weigh-In',
      type: 'weigh_in',
      startTime: startTime.toISOString(),
      allDay: false,
      isRecurring: true,
      recurrence: {
        pattern: 'weekly',
        interval: 1,
        daysOfWeek,
      },
      reminders: [
        { minutesBefore: 0, type: 'notification', enabled: true },
      ],
    });
  }

  // ==========================================
  // RECURRING EVENTS
  // ==========================================

  /**
   * Update all future occurrences of a recurring event
   * 
   * @param parentEventId - Parent recurring event ID
   * @param updates - Fields to update
   */
  async updateRecurringSeries(
    parentEventId: string,
    updates: UpdateEventRequest
  ): Promise<void> {
    try {
      await servicesApi.put(
        `/api/calendar/events/${parentEventId}/series`,
        updates
      );
      this.invalidateCache();
    } catch (error) {
      console.error('[CalendarService] Error updating recurring series:', error);
      throw error;
    }
  }

  /**
   * Stop a recurring event from a specific date
   * 
   * @param parentEventId - Parent recurring event ID
   * @param stopDate - Date to stop recurrence
   */
  async stopRecurrence(parentEventId: string, stopDate: string): Promise<void> {
    try {
      await servicesApi.put(
        `/api/calendar/events/${parentEventId}/stop-recurrence`,
        { stopDate }
      );
      this.invalidateCache();
    } catch (error) {
      console.error('[CalendarService] Error stopping recurrence:', error);
      throw error;
    }
  }

  // ==========================================
  // SYNC & EXPORT
  // ==========================================

  /**
   * Sync with device calendar (requires native permissions)
   * 
   * @param calendarId - Device calendar ID
   * @param direction - Sync direction
   */
  async syncWithDeviceCalendar(
    calendarId: string,
    direction: 'import' | 'export' | 'both' = 'export'
  ): Promise<{ synced: number; errors: string[] }> {
    try {
      const response = await servicesApi.post(
        '/api/calendar/sync-device',
        { calendarId, direction }
      );
      return response as any;
    } catch (error) {
      console.error('[CalendarService] Error syncing with device:', error);
      throw error;
    }
  }

  /**
   * Export calendar to iCal format
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @returns iCal file URL
   */
  async exportToICal(startDate: string, endDate: string): Promise<string> {
    try {
      const response = await servicesApi.get<{ url: string }>(
        `/api/calendar/export?startDate=${startDate}&endDate=${endDate}&format=ical`
      );
      return response.url;
    } catch (error) {
      console.error('[CalendarService] Error exporting calendar:', error);
      throw error;
    }
  }

  // ==========================================
  // CACHE HELPERS
  // ==========================================

  private invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Clear all cached calendar data
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('[CalendarService] Error clearing cache:', error);
    }
  }
}

export const calendarService = new CalendarService();

export default calendarService;
