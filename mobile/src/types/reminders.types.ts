/**
 * Reminders Types
 * 
 * Type definitions for the Reminders API (services.wihy.ai)
 */

// ============================================
// REMINDER TYPES
// ============================================

export type ReminderType =
  | 'water'
  | 'meal'
  | 'medication'
  | 'exercise'
  | 'weigh_in'
  | 'custom';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface Reminder {
  id: string;
  user_id: string;
  type: ReminderType;
  title: string;
  message?: string;
  time: string; // HH:MM format
  days: DayOfWeek[];
  enabled: boolean;
  created_at: string;
  updated_at?: string;
  last_triggered_at?: string;
  snoozed_until?: string;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateReminderRequest {
  type: ReminderType;
  title: string;
  message?: string;
  time: string; // HH:MM format
  days: DayOfWeek[];
  enabled?: boolean;
}

export interface UpdateReminderRequest {
  type?: ReminderType;
  title?: string;
  message?: string;
  time?: string;
  days?: DayOfWeek[];
  enabled?: boolean;
}

export interface ReminderFilters {
  type?: ReminderType;
  enabled?: boolean;
}

export interface SnoozeReminderRequest {
  duration: number; // minutes
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface CreateReminderResponse {
  success: boolean;
  reminder: Reminder;
}

export interface ListRemindersResponse {
  success: boolean;
  reminders: Reminder[];
  count: number;
}

export interface UpdateReminderResponse {
  success: boolean;
  reminder: Reminder;
}

export interface DeleteReminderResponse {
  success: boolean;
}

export interface SnoozeReminderResponse {
  success: boolean;
  reminder: Reminder;
  snoozed_until: string;
}

// ============================================
// HELPER TYPES
// ============================================

export interface ReminderSchedule {
  reminder: Reminder;
  nextTrigger: Date;
  isActive: boolean;
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const REMINDER_TYPES: { value: ReminderType; label: string }[] = [
  { value: 'water', label: 'Hydration' },
  { value: 'meal', label: 'Meal Time' },
  { value: 'medication', label: 'Medication' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'weigh_in', label: 'Weigh In' },
  { value: 'custom', label: 'Custom' },
];
