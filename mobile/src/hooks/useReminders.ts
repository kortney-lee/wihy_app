/**
 * useReminders Hook
 * 
 * React hook for managing health reminders.
 * Provides data fetching, caching, and state management.
 */

import { useState, useEffect, useCallback } from 'react';
import remindersService from '../services/remindersService';
import {
  Reminder,
  ReminderType,
  DayOfWeek,
  CreateReminderRequest,
  UpdateReminderRequest,
  DAYS_OF_WEEK,
} from '../types/reminders.types';

// ============================================
// TYPES
// ============================================

interface UseRemindersReturn {
  // Data
  reminders: Reminder[];
  enabledReminders: Reminder[];
  todaysReminders: Reminder[];
  nextReminder: Reminder | null;
  
  // State
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isStale: boolean;
  
  // Actions
  fetchReminders: () => Promise<void>;
  createReminder: (data: CreateReminderRequest) => Promise<Reminder>;
  updateReminder: (id: string, updates: UpdateReminderRequest) => Promise<Reminder>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string, enabled: boolean) => Promise<void>;
  snoozeReminder: (id: string, minutes?: number) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  
  // Quick Create
  createWaterReminder: (time: string, days?: DayOfWeek[]) => Promise<Reminder>;
  createMealReminder: (title: string, time: string, days?: DayOfWeek[]) => Promise<Reminder>;
  createMedicationReminder: (name: string, time: string, days?: DayOfWeek[]) => Promise<Reminder>;
  createWeighInReminder: (time?: string, days?: DayOfWeek[]) => Promise<Reminder>;
  
  // Helpers
  formatTime: (time: string) => string;
  formatDays: (days: DayOfWeek[]) => string;
  getTimeUntilReminder: (reminder: Reminder) => string;
  isReminderSnoozed: (reminder: Reminder) => boolean;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useReminders(): UseRemindersReturn {
  // State
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Computed
  const enabledReminders = reminders.filter(r => r.enabled);
  const todaysReminders = remindersService.getTodaysReminders(reminders);
  const nextReminder = remindersService.getNextReminder(reminders);

  // ==========================================
  // ACTIONS
  // ==========================================

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await remindersService.getReminders();
      setReminders(response.data.reminders);
      setIsStale(response.isStale);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  const createReminder = useCallback(async (data: CreateReminderRequest): Promise<Reminder> => {
    setError(null);
    
    try {
      const response = await remindersService.createReminder(data);
      setReminders(prev => [...prev, response.reminder]);
      return response.reminder;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create reminder';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const updateReminder = useCallback(async (
    id: string,
    updates: UpdateReminderRequest
  ): Promise<Reminder> => {
    setError(null);
    
    try {
      const response = await remindersService.updateReminder(id, updates);
      setReminders(prev => prev.map(r => r.id === id ? response.reminder : r));
      return response.reminder;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update reminder';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const deleteReminder = useCallback(async (id: string): Promise<void> => {
    setError(null);
    
    try {
      await remindersService.deleteReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete reminder';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const toggleReminder = useCallback(async (id: string, enabled: boolean): Promise<void> => {
    await updateReminder(id, { enabled });
  }, [updateReminder]);

  const snoozeReminder = useCallback(async (id: string, minutes: number = 10): Promise<void> => {
    setError(null);
    
    try {
      const response = await remindersService.snoozeReminder(id, minutes);
      setReminders(prev => prev.map(r => 
        r.id === id ? { ...r, snoozed_until: response.snoozed_until } : r
      ));
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to snooze reminder';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await fetchReminders();
    setRefreshing(false);
  }, [fetchReminders]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==========================================
  // QUICK CREATE
  // ==========================================

  const createWaterReminder = useCallback(async (
    time: string,
    days: DayOfWeek[] = DAYS_OF_WEEK
  ): Promise<Reminder> => {
    const response = await remindersService.createWaterReminder(time, days);
    setReminders(prev => [...prev, response.reminder]);
    return response.reminder;
  }, []);

  const createMealReminder = useCallback(async (
    title: string,
    time: string,
    days: DayOfWeek[] = DAYS_OF_WEEK
  ): Promise<Reminder> => {
    const response = await remindersService.createMealReminder(title, time, days);
    setReminders(prev => [...prev, response.reminder]);
    return response.reminder;
  }, []);

  const createMedicationReminder = useCallback(async (
    name: string,
    time: string,
    days: DayOfWeek[] = DAYS_OF_WEEK
  ): Promise<Reminder> => {
    const response = await remindersService.createMedicationReminder(name, time, days);
    setReminders(prev => [...prev, response.reminder]);
    return response.reminder;
  }, []);

  const createWeighInReminder = useCallback(async (
    time: string = '07:00',
    days: DayOfWeek[] = ['monday', 'wednesday', 'friday']
  ): Promise<Reminder> => {
    const response = await remindersService.createWeighInReminder(time, days);
    setReminders(prev => [...prev, response.reminder]);
    return response.reminder;
  }, []);

  // ==========================================
  // HELPERS
  // ==========================================

  const formatTime = useCallback((time: string): string => {
    return remindersService.formatTime(time);
  }, []);

  const formatDays = useCallback((days: DayOfWeek[]): string => {
    return remindersService.formatDays(days);
  }, []);

  const getTimeUntilReminder = useCallback((reminder: Reminder): string => {
    const ms = remindersService.getTimeUntilReminder(reminder);
    const minutes = Math.floor(ms / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${remainingMinutes} min`;
  }, []);

  const isReminderSnoozed = useCallback((reminder: Reminder): boolean => {
    return remindersService.isReminderSnoozed(reminder);
  }, []);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchReminders();
  }, []);

  return {
    // Data
    reminders,
    enabledReminders,
    todaysReminders,
    nextReminder,
    
    // State
    loading,
    refreshing,
    error,
    isStale,
    
    // Actions
    fetchReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    snoozeReminder,
    refresh,
    clearError,
    
    // Quick Create
    createWaterReminder,
    createMealReminder,
    createMedicationReminder,
    createWeighInReminder,
    
    // Helpers
    formatTime,
    formatDays,
    getTimeUntilReminder,
    isReminderSnoozed,
  };
}

export default useReminders;
