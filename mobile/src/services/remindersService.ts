/**
 * Reminders Service
 * 
 * Client for Reminders API (services.wihy.ai)
 * Handles health reminders for water, meals, medication, exercise, etc.
 * 
 * Endpoints:
 * - POST   /api/reminders           Create reminder
 * - GET    /api/reminders           List reminders
 * - PUT    /api/reminders/:id       Update reminder
 * - DELETE /api/reminders/:id       Delete reminder
 * - POST   /api/reminders/:id/snooze Snooze reminder
 */

import { servicesApi, CachedApiResponse } from './servicesApiClient';
import { storageService } from './storage/storageService';
import {
  Reminder,
  ReminderType,
  DayOfWeek,
  CreateReminderRequest,
  UpdateReminderRequest,
  ReminderFilters,
  CreateReminderResponse,
  ListRemindersResponse,
  UpdateReminderResponse,
  DeleteReminderResponse,
  SnoozeReminderResponse,
  DAYS_OF_WEEK,
} from '../types/reminders.types';

// ============================================
// CACHE KEYS
// ============================================

const CACHE_KEYS = {
  ALL_REMINDERS: 'reminders_all',
  ENABLED_REMINDERS: 'reminders_enabled',
  REMINDERS_BY_TYPE: (type: string) => `reminders_${type}`,
};

const CACHE_TTL_MINUTES = 10; // Longer TTL for reminders

// ============================================
// REMINDERS SERVICE CLASS
// ============================================

class RemindersService {
  private basePath = '/api/reminders';

  /**
   * Create a new reminder
   */
  async createReminder(data: CreateReminderRequest): Promise<CreateReminderResponse> {
    const response = await servicesApi.post<CreateReminderResponse>(
      this.basePath,
      data
    );

    // Invalidate cache
    await this.invalidateCache();

    return response;
  }

  /**
   * Get all reminders with optional filters
   */
  async getReminders(filters?: ReminderFilters): Promise<CachedApiResponse<ListRemindersResponse>> {
    let cacheKey = CACHE_KEYS.ALL_REMINDERS;
    
    if (filters?.enabled === true) {
      cacheKey = CACHE_KEYS.ENABLED_REMINDERS;
    } else if (filters?.type) {
      cacheKey = CACHE_KEYS.REMINDERS_BY_TYPE(filters.type);
    }

    return servicesApi.getWithCache<ListRemindersResponse>(
      this.basePath,
      cacheKey,
      CACHE_TTL_MINUTES,
      filters
    );
  }

  /**
   * Get only enabled reminders
   */
  async getEnabledReminders(): Promise<CachedApiResponse<ListRemindersResponse>> {
    return this.getReminders({ enabled: true });
  }

  /**
   * Get reminders by type
   */
  async getRemindersByType(type: ReminderType): Promise<CachedApiResponse<ListRemindersResponse>> {
    return this.getReminders({ type });
  }

  /**
   * Update a reminder
   */
  async updateReminder(
    reminderId: string,
    updates: UpdateReminderRequest
  ): Promise<UpdateReminderResponse> {
    const response = await servicesApi.put<UpdateReminderResponse>(
      `${this.basePath}/${reminderId}`,
      updates
    );

    // Invalidate cache
    await this.invalidateCache();

    return response;
  }

  /**
   * Toggle reminder enabled state
   */
  async toggleReminder(reminderId: string, enabled: boolean): Promise<UpdateReminderResponse> {
    return this.updateReminder(reminderId, { enabled });
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId: string): Promise<DeleteReminderResponse> {
    const response = await servicesApi.delete<DeleteReminderResponse>(
      `${this.basePath}/${reminderId}`
    );

    // Invalidate cache
    await this.invalidateCache();

    return response;
  }

  /**
   * Snooze a reminder for specified minutes
   */
  async snoozeReminder(
    reminderId: string,
    duration: number = 10
  ): Promise<SnoozeReminderResponse> {
    const response = await servicesApi.post<SnoozeReminderResponse>(
      `${this.basePath}/${reminderId}/snooze`,
      { duration }
    );

    return response;
  }

  // ==========================================
  // QUICK CREATE HELPERS
  // ==========================================

  /**
   * Create a water reminder
   */
  async createWaterReminder(
    time: string,
    days: DayOfWeek[] = DAYS_OF_WEEK
  ): Promise<CreateReminderResponse> {
    return this.createReminder({
      type: 'water',
      title: 'Drink Water',
      message: 'Time to hydrate! Drink 8oz of water.',
      time,
      days,
      enabled: true,
    });
  }

  /**
   * Create a meal reminder
   */
  async createMealReminder(
    title: string,
    time: string,
    days: DayOfWeek[] = DAYS_OF_WEEK
  ): Promise<CreateReminderResponse> {
    return this.createReminder({
      type: 'meal',
      title,
      message: `Time for ${title.toLowerCase()}!`,
      time,
      days,
      enabled: true,
    });
  }

  /**
   * Create a medication reminder
   */
  async createMedicationReminder(
    medicationName: string,
    time: string,
    days: DayOfWeek[] = DAYS_OF_WEEK
  ): Promise<CreateReminderResponse> {
    return this.createReminder({
      type: 'medication',
      title: `Take ${medicationName}`,
      message: `Reminder to take your ${medicationName}`,
      time,
      days,
      enabled: true,
    });
  }

  /**
   * Create a weigh-in reminder
   */
  async createWeighInReminder(
    time: string = '07:00',
    days: DayOfWeek[] = ['monday', 'wednesday', 'friday']
  ): Promise<CreateReminderResponse> {
    return this.createReminder({
      type: 'weigh_in',
      title: 'Time to Weigh In',
      message: 'Track your progress by logging your weight.',
      time,
      days,
      enabled: true,
    });
  }

  // ==========================================
  // SCHEDULING HELPERS
  // ==========================================

  /**
   * Get reminders that should fire today
   */
  getTodaysReminders(reminders: Reminder[]): Reminder[] {
    const today = this.getCurrentDayOfWeek();
    
    return reminders
      .filter(r => r.enabled && r.days.includes(today))
      .sort((a, b) => this.timeToMinutes(a.time) - this.timeToMinutes(b.time));
  }

  /**
   * Get next upcoming reminder
   */
  getNextReminder(reminders: Reminder[]): Reminder | null {
    const todaysReminders = this.getTodaysReminders(reminders);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const upcoming = todaysReminders.find(
      r => this.timeToMinutes(r.time) > currentMinutes
    );

    return upcoming || null;
  }

  /**
   * Calculate time until next reminder
   */
  getTimeUntilReminder(reminder: Reminder): number {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const reminderMinutes = this.timeToMinutes(reminder.time);
    
    if (reminderMinutes > currentMinutes) {
      return (reminderMinutes - currentMinutes) * 60 * 1000; // milliseconds
    }
    
    // Next day
    return ((24 * 60 - currentMinutes) + reminderMinutes) * 60 * 1000;
  }

  /**
   * Check if a reminder is snoozed
   */
  isReminderSnoozed(reminder: Reminder): boolean {
    if (!reminder.snoozed_until) return false;
    return new Date(reminder.snoozed_until) > new Date();
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  private getCurrentDayOfWeek(): DayOfWeek {
    const days: DayOfWeek[] = [
      'sunday', 'monday', 'tuesday', 'wednesday',
      'thursday', 'friday', 'saturday'
    ];
    return days[new Date().getDay()] as DayOfWeek;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Format time for display (12-hour format)
   */
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Format days for display
   */
  formatDays(days: DayOfWeek[]): string {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && 
        !days.includes('saturday') && 
        !days.includes('sunday')) {
      return 'Weekdays';
    }
    if (days.length === 2 && 
        days.includes('saturday') && 
        days.includes('sunday')) {
      return 'Weekends';
    }
    
    const shortDays: Record<DayOfWeek, string> = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    };
    
    return days.map(d => shortDays[d]).join(', ');
  }

  // ==========================================
  // CACHE MANAGEMENT
  // ==========================================

  private async invalidateCache(): Promise<void> {
    await storageService.remove(CACHE_KEYS.ALL_REMINDERS);
    await storageService.remove(CACHE_KEYS.ENABLED_REMINDERS);
    const types: ReminderType[] = ['water', 'meal', 'medication', 'exercise', 'weigh_in', 'custom'];
    for (const type of types) {
      await storageService.remove(CACHE_KEYS.REMINDERS_BY_TYPE(type));
    }
  }
}

// Export singleton
export const remindersService = new RemindersService();

export default remindersService;
