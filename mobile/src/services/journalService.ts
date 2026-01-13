/**
 * Journal Service
 * 
 * Client-side service for journaling, notes, and daily reflections.
 * Connects to services.wihy.ai for journal management.
 */

import { servicesApi } from './servicesApiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============= TYPES =============

export type JournalEntryType = 
  | 'daily_reflection' 
  | 'workout_note' 
  | 'meal_note' 
  | 'mood_log' 
  | 'gratitude' 
  | 'goal_reflection'
  | 'progress_note'
  | 'custom';

export type MoodLevel = 1 | 2 | 3 | 4 | 5; // 1 = very low, 5 = very high

export interface JournalEntry {
  id: string;
  userId: string;
  type: JournalEntryType;
  title?: string;
  content: string;
  date: string;
  
  // Mood tracking
  mood?: MoodLevel;
  energy?: MoodLevel;
  stress?: MoodLevel;
  sleep_quality?: MoodLevel;
  
  // Tags and categories
  tags?: string[];
  
  // Linked resources
  linkedResourceId?: string;
  linkedResourceType?: 'workout' | 'meal' | 'goal' | 'scan';
  
  // Media
  images?: string[];
  voiceNoteUrl?: string;
  
  // Privacy
  isPrivate: boolean;
  
  // Metadata
  weather?: string;
  location?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalEntryRequest {
  type: JournalEntryType;
  title?: string;
  content: string;
  date?: string;
  mood?: MoodLevel;
  energy?: MoodLevel;
  stress?: MoodLevel;
  sleep_quality?: MoodLevel;
  tags?: string[];
  linkedResourceId?: string;
  linkedResourceType?: string;
  images?: string[];
  isPrivate?: boolean;
  weather?: string;
  location?: string;
}

export interface UpdateJournalEntryRequest {
  title?: string;
  content?: string;
  mood?: MoodLevel;
  energy?: MoodLevel;
  stress?: MoodLevel;
  sleep_quality?: MoodLevel;
  tags?: string[];
  images?: string[];
  isPrivate?: boolean;
}

export interface JournalSearchOptions {
  query?: string;
  type?: JournalEntryType;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  mood?: MoodLevel;
  limit?: number;
  offset?: number;
}

export interface JournalStats {
  totalEntries: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  averageMood: number;
  averageEnergy: number;
  averageStress: number;
  mostUsedTags: { tag: string; count: number }[];
  streakDays: number;
  longestStreak: number;
}

export interface MoodTrend {
  date: string;
  mood?: MoodLevel;
  energy?: MoodLevel;
  stress?: MoodLevel;
  sleep_quality?: MoodLevel;
  entryCount: number;
}

export interface JournalPrompt {
  id: string;
  category: JournalEntryType;
  prompt: string;
  followUpQuestions?: string[];
}

// ============= CONSTANTS =============

const CACHE_KEY = '@journal_entries';
const PROMPTS_CACHE_KEY = '@journal_prompts';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Default prompts for when API is unavailable
const DEFAULT_PROMPTS: JournalPrompt[] = [
  {
    id: 'p1',
    category: 'daily_reflection',
    prompt: 'What are three things that went well today?',
    followUpQuestions: ['How did you contribute to these successes?', 'How can you repeat this tomorrow?'],
  },
  {
    id: 'p2',
    category: 'gratitude',
    prompt: 'What are you grateful for today?',
    followUpQuestions: ['Why is this meaningful to you?', 'How does this impact your life?'],
  },
  {
    id: 'p3',
    category: 'workout_note',
    prompt: 'How did your body feel during today\'s workout?',
    followUpQuestions: ['Which exercises felt strongest?', 'What would you do differently?'],
  },
  {
    id: 'p4',
    category: 'meal_note',
    prompt: 'How did your food choices make you feel today?',
    followUpQuestions: ['Did you hit your nutrition goals?', 'What was your most satisfying meal?'],
  },
  {
    id: 'p5',
    category: 'goal_reflection',
    prompt: 'What progress did you make toward your goals today?',
    followUpQuestions: ['What obstacles did you overcome?', 'What\'s your next step?'],
  },
];

// ============= SERVICE IMPLEMENTATION =============

class JournalService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  // ==========================================
  // ENTRIES CRUD
  // ==========================================

  /**
   * Create a new journal entry
   * 
   * @param entry - Entry details
   * @returns Created entry
   */
  async createEntry(entry: CreateJournalEntryRequest): Promise<JournalEntry> {
    try {
      const response = await servicesApi.post<{ entry: JournalEntry }>(
        '/api/journal/entries',
        {
          ...entry,
          date: entry.date || new Date().toISOString(),
          isPrivate: entry.isPrivate ?? true,
        }
      );
      
      this.invalidateCache();
      return response.entry;
    } catch (error) {
      console.error('[JournalService] Error creating entry:', error);
      throw error;
    }
  }

  /**
   * Get a specific journal entry
   * 
   * @param entryId - Entry ID
   * @returns Entry details
   */
  async getEntry(entryId: string): Promise<JournalEntry | null> {
    try {
      const response = await servicesApi.get<{ entry: JournalEntry }>(
        `/api/journal/entries/${entryId}`
      );
      return response.entry || null;
    } catch (error) {
      console.error('[JournalService] Error fetching entry:', error);
      return null;
    }
  }

  /**
   * Get journal entries with optional filtering
   * 
   * @param options - Search/filter options
   * @returns List of entries
   */
  async getEntries(options?: JournalSearchOptions): Promise<JournalEntry[]> {
    try {
      const params = new URLSearchParams();
      
      if (options?.query) params.append('query', options.query);
      if (options?.type) params.append('type', options.type);
      if (options?.tags?.length) params.append('tags', options.tags.join(','));
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);
      if (options?.mood) params.append('mood', options.mood.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const response = await servicesApi.get<{ entries: JournalEntry[] }>(
        `/api/journal/entries${queryString}`
      );
      
      return response.entries || [];
    } catch (error) {
      console.error('[JournalService] Error fetching entries:', error);
      return this.getCachedEntries();
    }
  }

  /**
   * Update an existing journal entry
   * 
   * @param entryId - Entry ID
   * @param updates - Fields to update
   * @returns Updated entry
   */
  async updateEntry(entryId: string, updates: UpdateJournalEntryRequest): Promise<JournalEntry> {
    try {
      const response = await servicesApi.put<{ entry: JournalEntry }>(
        `/api/journal/entries/${entryId}`,
        updates
      );
      
      this.invalidateCache();
      return response.entry;
    } catch (error) {
      console.error('[JournalService] Error updating entry:', error);
      throw error;
    }
  }

  /**
   * Delete a journal entry
   * 
   * @param entryId - Entry ID
   */
  async deleteEntry(entryId: string): Promise<void> {
    try {
      await servicesApi.delete(`/api/journal/entries/${entryId}`);
      this.invalidateCache();
    } catch (error) {
      console.error('[JournalService] Error deleting entry:', error);
      throw error;
    }
  }

  // ==========================================
  // QUICK ENTRIES
  // ==========================================

  /**
   * Create a quick mood log
   * 
   * @param mood - Mood level (1-5)
   * @param energy - Energy level (1-5)
   * @param notes - Optional notes
   */
  async logMood(mood: MoodLevel, energy?: MoodLevel, notes?: string): Promise<JournalEntry> {
    return this.createEntry({
      type: 'mood_log',
      content: notes || '',
      mood,
      energy,
    });
  }

  /**
   * Create a gratitude entry
   * 
   * @param gratitudes - List of things to be grateful for
   */
  async logGratitude(gratitudes: string[]): Promise<JournalEntry> {
    return this.createEntry({
      type: 'gratitude',
      title: 'Daily Gratitude',
      content: gratitudes.map((g, i) => `${i + 1}. ${g}`).join('\n'),
      tags: ['gratitude', 'daily'],
    });
  }

  /**
   * Add a workout note
   * 
   * @param workoutId - Linked workout ID
   * @param content - Note content
   * @param difficulty - Perceived difficulty (1-5)
   */
  async addWorkoutNote(
    workoutId: string,
    content: string,
    difficulty?: MoodLevel
  ): Promise<JournalEntry> {
    return this.createEntry({
      type: 'workout_note',
      content,
      linkedResourceId: workoutId,
      linkedResourceType: 'workout',
      energy: difficulty,
      tags: ['workout'],
    });
  }

  /**
   * Add a meal note
   * 
   * @param mealId - Linked meal ID
   * @param content - Note content
   * @param satisfaction - Satisfaction level (1-5)
   */
  async addMealNote(
    mealId: string,
    content: string,
    satisfaction?: MoodLevel
  ): Promise<JournalEntry> {
    return this.createEntry({
      type: 'meal_note',
      content,
      linkedResourceId: mealId,
      linkedResourceType: 'meal',
      mood: satisfaction,
      tags: ['meal', 'nutrition'],
    });
  }

  // ==========================================
  // DAILY VIEWS
  // ==========================================

  /**
   * Get entries for a specific date
   * 
   * @param date - Date (YYYY-MM-DD)
   * @returns Entries for the date
   */
  async getEntriesForDate(date: string): Promise<JournalEntry[]> {
    return this.getEntries({
      startDate: date,
      endDate: date,
    });
  }

  /**
   * Get today's entries
   * 
   * @returns Today's entries
   */
  async getTodayEntries(): Promise<JournalEntry[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getEntriesForDate(today);
  }

  /**
   * Check if user has journaled today
   * 
   * @returns Whether user has made an entry today
   */
  async hasJournaledToday(): Promise<boolean> {
    const entries = await this.getTodayEntries();
    return entries.length > 0;
  }

  // ==========================================
  // SEARCH
  // ==========================================

  /**
   * Search journal entries
   * 
   * @param query - Search query
   * @param options - Additional options
   * @returns Matching entries
   */
  async searchEntries(query: string, options?: Omit<JournalSearchOptions, 'query'>): Promise<JournalEntry[]> {
    return this.getEntries({ query, ...options });
  }

  /**
   * Get entries by tag
   * 
   * @param tag - Tag to search for
   * @returns Entries with the tag
   */
  async getEntriesByTag(tag: string): Promise<JournalEntry[]> {
    return this.getEntries({ tags: [tag] });
  }

  /**
   * Get all unique tags
   * 
   * @returns List of tags with usage counts
   */
  async getAllTags(): Promise<{ tag: string; count: number }[]> {
    try {
      const response = await servicesApi.get<{ tags: { tag: string; count: number }[] }>(
        '/api/journal/tags'
      );
      return response.tags || [];
    } catch (error) {
      console.error('[JournalService] Error fetching tags:', error);
      return [];
    }
  }

  // ==========================================
  // STATS & INSIGHTS
  // ==========================================

  /**
   * Get journal statistics
   * 
   * @returns Journal stats
   */
  async getStats(): Promise<JournalStats> {
    try {
      const response = await servicesApi.get<JournalStats>('/api/journal/stats');
      return response;
    } catch (error) {
      console.error('[JournalService] Error fetching stats:', error);
      return {
        totalEntries: 0,
        entriesThisWeek: 0,
        entriesThisMonth: 0,
        averageMood: 0,
        averageEnergy: 0,
        averageStress: 0,
        mostUsedTags: [],
        streakDays: 0,
        longestStreak: 0,
      };
    }
  }

  /**
   * Get mood trends over time
   * 
   * @param days - Number of days to analyze
   * @returns Daily mood trends
   */
  async getMoodTrends(days: number = 30): Promise<MoodTrend[]> {
    try {
      const response = await servicesApi.get<{ trends: MoodTrend[] }>(
        `/api/journal/mood-trends?days=${days}`
      );
      return response.trends || [];
    } catch (error) {
      console.error('[JournalService] Error fetching mood trends:', error);
      return [];
    }
  }

  /**
   * Get correlations between mood and activities
   * 
   * @returns Correlation insights
   */
  async getMoodCorrelations(): Promise<{
    workoutDays: { averageMood: number; count: number };
    restDays: { averageMood: number; count: number };
    highProteinDays: { averageMood: number; count: number };
    goodSleepDays: { averageMood: number; count: number };
  }> {
    try {
      const response = await servicesApi.get('/api/journal/correlations');
      return response as any;
    } catch (error) {
      console.error('[JournalService] Error fetching correlations:', error);
      return {
        workoutDays: { averageMood: 0, count: 0 },
        restDays: { averageMood: 0, count: 0 },
        highProteinDays: { averageMood: 0, count: 0 },
        goodSleepDays: { averageMood: 0, count: 0 },
      };
    }
  }

  // ==========================================
  // PROMPTS
  // ==========================================

  /**
   * Get journal prompts
   * 
   * @param category - Optional category filter
   * @returns List of prompts
   */
  async getPrompts(category?: JournalEntryType): Promise<JournalPrompt[]> {
    try {
      const endpoint = category 
        ? `/api/journal/prompts?category=${category}`
        : '/api/journal/prompts';
        
      const response = await servicesApi.get<{ prompts: JournalPrompt[] }>(endpoint);
      return response.prompts || DEFAULT_PROMPTS;
    } catch (error) {
      console.error('[JournalService] Error fetching prompts:', error);
      return category 
        ? DEFAULT_PROMPTS.filter(p => p.category === category)
        : DEFAULT_PROMPTS;
    }
  }

  /**
   * Get a random prompt for today
   * 
   * @param category - Optional category
   * @returns Random prompt
   */
  async getDailyPrompt(category?: JournalEntryType): Promise<JournalPrompt> {
    const prompts = await this.getPrompts(category);
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return prompts[dayOfYear % prompts.length];
  }

  // ==========================================
  // EXPORT
  // ==========================================

  /**
   * Export journal entries
   * 
   * @param format - Export format
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Download URL
   */
  async exportEntries(
    format: 'pdf' | 'txt' | 'json' = 'pdf',
    startDate?: string,
    endDate?: string
  ): Promise<string> {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await servicesApi.get<{ url: string }>(
        `/api/journal/export?${params.toString()}`
      );
      return response.url;
    } catch (error) {
      console.error('[JournalService] Error exporting entries:', error);
      throw error;
    }
  }

  // ==========================================
  // CACHE HELPERS
  // ==========================================

  private invalidateCache(): void {
    this.cache.clear();
  }

  private async getCachedEntries(): Promise<JournalEntry[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear all cached journal data
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    try {
      await AsyncStorage.multiRemove([CACHE_KEY, PROMPTS_CACHE_KEY]);
    } catch (error) {
      console.error('[JournalService] Error clearing cache:', error);
    }
  }
}

export const journalService = new JournalService();

export default journalService;
