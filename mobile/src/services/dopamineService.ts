/**
 * WIHY Dopamine & Behavioral Tracking Service
 * 
 * Implements the four-quadrant presence model for behavioral analysis:
 * - Present + Connected: Healthy regulation, mindful presence
 * - Present + Distracted: Physically present but disconnected
 * - Absent + Numb: Withdrawal, comfort seeking
 * - Absent + Restless: High dopamine-seeking behavior
 * 
 * Production Service URL: https://services.wihy.ai
 * API Version: v1
 */

import { API_CONFIG, getDefaultUserContext } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import { WIHYError, WIHYErrorCode, createErrorFromResponse } from './errors';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type PresenceLevel = 'present' | 'absent';
export type ConnectionLevel = 'connected' | 'distracted';
export type QuadrantName = 'present_connected' | 'present_distracted' | 'absent_numb' | 'absent_restless';
export type DeviceType = 'phone' | 'tablet' | 'computer' | 'tv';
export type AppCategory = 'social_media' | 'gaming' | 'productivity' | 'streaming' | 'food_apps' | 'communication' | 'health' | 'other';
export type InteractionIntensity = 'passive' | 'moderate' | 'high';
export type EatingContext = 'eating' | 'working' | 'socializing' | 'alone' | 'commuting' | 'relaxing';
export type TriggerType = 'notification' | 'craving' | 'boredom' | 'stress' | 'habit' | 'social' | 'other';
export type DistractionSource = 'phone' | 'food' | 'fantasy' | 'social_media' | 'work' | 'tv' | 'other';
export type ResistanceLevel = 'none' | 'low' | 'moderate' | 'high';
export type EatingState = 'mindful' | 'distracted' | 'emotional' | 'bored' | 'stressed';
export type TimePeriod = 'daily' | 'weekly' | 'monthly';
export type HealthIndicator = 'healthy' | 'moderate' | 'needs_attention' | 'critical';

/**
 * Presence State Assessment Request
 */
export interface PresenceStateAssessment {
  userId: string;
  presenceLevel: PresenceLevel;
  connectionLevel: ConnectionLevel;
  physicalPresenceScore: number;      // 1-10
  emotionalAvailabilityScore: number; // 1-10
  intimacyPrioritizationScore: number; // 1-10
  routineVsPursuitScore: number;      // 1-10
  currentActivity?: string;
  socialContext?: string;
  stressLevel: number;                // 1-10
  energyLevel: number;                // 1-10
  recentFoodIntake?: boolean;
  currentScreenTimeMinutes?: number;
  dopamineSeekingActive?: boolean;
  selfReported?: boolean;
}

/**
 * Presence State Assessment Result
 */
export interface PresenceStateResult {
  success: boolean;
  currentQuadrant: QuadrantName;
  insights: QuadrantInsights;
  aiConfidence: number;
  nextAssessmentRecommended: string;
  error?: string;
}

export interface QuadrantInsights {
  description: string;
  recommendations: string[];
  dopamineStatus: string;
}

/**
 * Screen Time Log
 */
export interface ScreenTimeLog {
  userId: string;
  deviceType: DeviceType;
  appCategory: AppCategory;
  appName?: string;
  screenTimeMinutes: number;
  interactionIntensity: InteractionIntensity;
  context?: EatingContext;
  emotionalStateBefore?: string;
  emotionalStateAfter?: string;
  dopamineSeekingBehavior?: boolean;
}

/**
 * Distraction Pattern Log
 */
export interface DistractionPattern {
  userId: string;
  triggerType: TriggerType;
  distractionSource: DistractionSource;
  durationMinutes?: number;
  resistanceLevel: ResistanceLevel;
  contextBefore?: string;
  foodRelated?: boolean;
  screenRelated?: boolean;
  socialContext?: string;
  recoveryMethod?: string;
}

/**
 * Food Intake Behavioral Log
 */
export interface FoodIntakeBehavioral {
  userId: string;
  foodLogId?: number;
  eatingState: EatingState;
  presenceQuadrant: QuadrantName;
  screenTimeDuringEating?: boolean;
  screenDeviceType?: DeviceType;
  hungerLevel: number;          // 1-10
  stressLevel: number;          // 1-10
  attentionToFood: number;      // 1-10
  satisfactionLevel: number;    // 1-10
  impulseEating?: boolean;
  cravingDriven?: boolean;
  comfortSeeking?: boolean;
  dopamineFoodType?: boolean;
  eatingAlone?: boolean;
  eatingWithOthers?: boolean;
}

/**
 * Dopamine Pie Chart Data
 */
export interface DopaminePieChartData {
  success: boolean;
  timePeriod: TimePeriod;
  data: PieChartDetails;
  error?: string;
}

export interface PieChartDetails {
  quadrantDetails: Record<QuadrantName, QuadrantDetail>;
  chartConfig: ChartConfig;
  dominantQuadrant: QuadrantName;
  healthIndicator: HealthIndicator;
}

export interface QuadrantDetail {
  percentage: number;
  color: string;
  description: string;
}

export interface ChartConfig {
  type: string;
  responsive: boolean;
  showLabels: boolean;
  showPercentages: boolean;
  animation: boolean;
}

/**
 * Dopamine Analysis Summary
 */
export interface DopamineAnalysis {
  success: boolean;
  analysisPeriodDays: number;
  dopamineRegulationScore: number;
  screenTimeSummary: ScreenTimeSummary;
  eatingBehaviorSummary: EatingBehaviorSummary;
  presenceStateDistribution: Record<QuadrantName, QuadrantCount>;
  recommendations: string[];
  error?: string;
}

export interface ScreenTimeSummary {
  totalMinutes: number;
  dailyAverage: number;
  dopamineSeekingEpisodes: number;
}

export interface EatingBehaviorSummary {
  mindfulEatingInstances: number;
  distractedEatingInstances: number;
  mindfulEatingRatio: number;
  averageAttentionToFood: number;
  averageSatisfaction: number;
}

export interface QuadrantCount {
  count: number;
  percentage: number;
}

/**
 * Pie Chart Simulation Parameters
 */
export interface PieChartSimulationParams {
  screenTimeHours?: number;
  mindfulEatingRatio?: number;
  dopamineSeekingEpisodes?: number;
  physicalPresenceScore?: number;
  stressLevel?: number;
}

// ==========================================
// DOPAMINE SERVICE CLASS
// ==========================================

class DopamineService {
  private userId: string;

  constructor(userId?: string) {
    this.userId = userId || getDefaultUserContext().userId;
  }

  /**
   * Set the user ID for API calls
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get current user ID
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * Make an authenticated request to the Dopamine API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'WIHY-Mobile/2.0.1',
      'X-Client-Version': '2.0.1',
      'X-Platform': 'react-native',
      ...options.headers,
    };

    try {
      const response = await fetchWithLogging(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw createErrorFromResponse(response.status, errorText);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof WIHYError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('Network')) {
        throw new WIHYError(WIHYErrorCode.NETWORK_ERROR, 'Network connection error');
      }
      
      throw new WIHYError(WIHYErrorCode.SERVER_ERROR, (error as Error).message);
    }
  }

  // ==========================================
  // PRESENCE STATE ASSESSMENT
  // ==========================================

  /**
   * Assess presence state using the four-quadrant model
   * @param assessment - The presence state assessment data
   * @returns Presence state result with quadrant and insights
   */
  async assessPresenceState(
    assessment: Omit<PresenceStateAssessment, 'userId'>
  ): Promise<PresenceStateResult> {
    console.log('[DopamineService] Assessing presence state...');

    try {
      const requestBody: PresenceStateAssessment = {
        ...assessment,
        userId: this.userId,
      };

      const result = await this.makeRequest<{ success: boolean; data: PresenceStateResult }>(
        '/api/wellness/dopamine/presence-state',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      console.log(`[DopamineService] Presence state assessed: ${result.data?.currentQuadrant}`);

      return {
        success: true,
        ...result.data,
      };
    } catch (error) {
      console.error('[DopamineService] Presence state assessment failed:', error);
      return {
        success: false,
        currentQuadrant: 'present_connected',
        insights: {
          description: 'Unable to assess presence state',
          recommendations: [],
          dopamineStatus: 'unknown',
        },
        aiConfidence: 0,
        nextAssessmentRecommended: '',
        error: (error as WIHYError).message || 'Failed to assess presence state',
      };
    }
  }

  // ==========================================
  // SCREEN TIME LOGGING
  // ==========================================

  /**
   * Log screen time data
   * @param screenTime - Screen time log data
   * @returns Success status and logged record
   */
  async logScreenTime(
    screenTime: Omit<ScreenTimeLog, 'userId'>
  ): Promise<{ success: boolean; id?: number; error?: string }> {
    console.log('[DopamineService] Logging screen time...');

    try {
      const requestBody: ScreenTimeLog = {
        ...screenTime,
        userId: this.userId,
      };

      const result = await this.makeRequest<{ success: boolean; id: number }>(
        '/api/wellness/dopamine/screen-time',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      console.log('[DopamineService] Screen time logged successfully');

      return {
        success: true,
        id: result.id,
      };
    } catch (error) {
      console.error('[DopamineService] Failed to log screen time:', error);
      return {
        success: false,
        error: (error as WIHYError).message || 'Failed to log screen time',
      };
    }
  }

  // ==========================================
  // DISTRACTION LOGGING
  // ==========================================

  /**
   * Log a distraction pattern
   * @param distraction - Distraction pattern data
   * @returns Success status and logged record
   */
  async logDistraction(
    distraction: Omit<DistractionPattern, 'userId'>
  ): Promise<{ success: boolean; id?: number; error?: string }> {
    console.log('[DopamineService] Logging distraction pattern...');

    try {
      const requestBody: DistractionPattern = {
        ...distraction,
        userId: this.userId,
      };

      const result = await this.makeRequest<{ success: boolean; id: number }>(
        '/api/wellness/dopamine/distraction',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      console.log('[DopamineService] Distraction logged successfully');

      return {
        success: true,
        id: result.id,
      };
    } catch (error) {
      console.error('[DopamineService] Failed to log distraction:', error);
      return {
        success: false,
        error: (error as WIHYError).message || 'Failed to log distraction',
      };
    }
  }

  // ==========================================
  // FOOD BEHAVIORAL LOGGING
  // ==========================================

  /**
   * Log behavioral food intake data
   * @param foodIntake - Food intake behavioral data
   * @returns Success status and logged record
   */
  async logFoodBehavioral(
    foodIntake: Omit<FoodIntakeBehavioral, 'userId'>
  ): Promise<{ success: boolean; id?: number; error?: string }> {
    console.log('[DopamineService] Logging food behavioral data...');

    try {
      const requestBody: FoodIntakeBehavioral = {
        ...foodIntake,
        userId: this.userId,
      };

      const result = await this.makeRequest<{ success: boolean; id: number }>(
        '/api/wellness/dopamine/food-behavioral',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      console.log('[DopamineService] Food behavioral data logged successfully');

      return {
        success: true,
        id: result.id,
      };
    } catch (error) {
      console.error('[DopamineService] Failed to log food behavioral:', error);
      return {
        success: false,
        error: (error as WIHYError).message || 'Failed to log food behavioral data',
      };
    }
  }

  // ==========================================
  // PIE CHART DATA
  // ==========================================

  /**
   * Get dopamine pie chart data
   * @param timePeriod - Time period for the chart
   * @returns Pie chart data with quadrant distribution
   */
  async getPieChartData(
    timePeriod: TimePeriod = 'daily'
  ): Promise<DopaminePieChartData> {
    console.log(`[DopamineService] Getting pie chart data for ${timePeriod}...`);

    try {
      const params = new URLSearchParams({
        userId: this.userId,
        timePeriod,
      });

      const result = await this.makeRequest<DopaminePieChartData>(
        `/api/wellness/dopamine/pie-chart?${params}`,
        {
          method: 'GET',
        }
      );

      console.log(`[DopamineService] Pie chart data retrieved, dominant: ${result.data?.dominantQuadrant}`);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('[DopamineService] Failed to get pie chart data:', error);
      return {
        success: false,
        timePeriod,
        data: {
          quadrantDetails: {
            present_connected: { percentage: 25, color: '#4CAF50', description: 'Healthy regulation' },
            present_distracted: { percentage: 25, color: '#FFC107', description: 'Physically present but disconnected' },
            absent_numb: { percentage: 25, color: '#9E9E9E', description: 'Withdrawal, comfort seeking' },
            absent_restless: { percentage: 25, color: '#F44336', description: 'High dopamine-seeking' },
          },
          chartConfig: {
            type: 'pie',
            responsive: true,
            showLabels: true,
            showPercentages: true,
            animation: true,
          },
          dominantQuadrant: 'present_connected',
          healthIndicator: 'moderate',
        },
        error: (error as WIHYError).message || 'Failed to get pie chart data',
      };
    }
  }

  // ==========================================
  // COMPREHENSIVE ANALYSIS
  // ==========================================

  /**
   * Get comprehensive dopamine analysis
   * @param days - Number of days to analyze
   * @returns Comprehensive analysis with scores and recommendations
   */
  async getAnalysis(days: number = 7): Promise<DopamineAnalysis> {
    console.log(`[DopamineService] Getting analysis for ${days} days...`);

    try {
      const params = new URLSearchParams({
        userId: this.userId,
        days: days.toString(),
      });

      const result = await this.makeRequest<{ success: boolean; data: DopamineAnalysis }>(
        `/api/wellness/dopamine/analysis?${params}`,
        {
          method: 'GET',
        }
      );

      console.log(`[DopamineService] Analysis retrieved, score: ${result.data?.dopamineRegulationScore}`);

      return {
        success: true,
        ...result.data,
      };
    } catch (error) {
      console.error('[DopamineService] Failed to get analysis:', error);
      return {
        success: false,
        analysisPeriodDays: days,
        dopamineRegulationScore: 0,
        screenTimeSummary: {
          totalMinutes: 0,
          dailyAverage: 0,
          dopamineSeekingEpisodes: 0,
        },
        eatingBehaviorSummary: {
          mindfulEatingInstances: 0,
          distractedEatingInstances: 0,
          mindfulEatingRatio: 0,
          averageAttentionToFood: 0,
          averageSatisfaction: 0,
        },
        presenceStateDistribution: {
          present_connected: { count: 0, percentage: 0 },
          present_distracted: { count: 0, percentage: 0 },
          absent_numb: { count: 0, percentage: 0 },
          absent_restless: { count: 0, percentage: 0 },
        },
        recommendations: [],
        error: (error as WIHYError).message || 'Failed to get analysis',
      };
    }
  }

  // ==========================================
  // PIE CHART SIMULATION
  // ==========================================

  /**
   * Simulate pie chart based on parameters
   * @param params - Simulation parameters
   * @returns Simulated pie chart data
   */
  async simulatePieChart(
    params: PieChartSimulationParams = {}
  ): Promise<DopaminePieChartData> {
    console.log('[DopamineService] Simulating pie chart...');

    const {
      screenTimeHours = 4.0,
      mindfulEatingRatio = 0.5,
      dopamineSeekingEpisodes = 3,
      physicalPresenceScore = 5.0,
      stressLevel = 5.0,
    } = params;

    try {
      const requestBody = {
        screenTimeHours,
        mindfulEatingRatio,
        dopamineSeekingEpisodes,
        physicalPresenceScore,
        stressLevel,
      };

      const result = await this.makeRequest<DopaminePieChartData>(
        '/api/wellness/dopamine/simulate-pie-chart',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      console.log('[DopamineService] Simulation completed');

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('[DopamineService] Failed to simulate pie chart:', error);
      return {
        success: false,
        timePeriod: 'daily',
        data: {
          quadrantDetails: {
            present_connected: { percentage: 25, color: '#4CAF50', description: 'Healthy regulation' },
            present_distracted: { percentage: 25, color: '#FFC107', description: 'Physically present but disconnected' },
            absent_numb: { percentage: 25, color: '#9E9E9E', description: 'Withdrawal, comfort seeking' },
            absent_restless: { percentage: 25, color: '#F44336', description: 'High dopamine-seeking' },
          },
          chartConfig: {
            type: 'pie',
            responsive: true,
            showLabels: true,
            showPercentages: true,
            animation: true,
          },
          dominantQuadrant: 'present_connected',
          healthIndicator: 'moderate',
        },
        error: (error as WIHYError).message || 'Failed to simulate pie chart',
      };
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Get quadrant description
   */
  getQuadrantDescription(quadrant: QuadrantName): string {
    const descriptions: Record<QuadrantName, string> = {
      present_connected: 'You are fully present and connected. This is the optimal state for meaningful interactions and mindful living.',
      present_distracted: 'You are physically present but mentally distracted. Try to reduce screen time and engage more fully.',
      absent_numb: 'You may be withdrawing or seeking comfort. Consider gentle activities to reconnect with yourself.',
      absent_restless: 'You are actively seeking stimulation. Try grounding exercises or mindful activities.',
    };
    return descriptions[quadrant];
  }

  /**
   * Get quadrant color
   */
  getQuadrantColor(quadrant: QuadrantName): string {
    const colors: Record<QuadrantName, string> = {
      present_connected: '#4CAF50',  // Green
      present_distracted: '#FFC107', // Amber
      absent_numb: '#9E9E9E',        // Grey
      absent_restless: '#F44336',    // Red
    };
    return colors[quadrant];
  }

  /**
   * Calculate recommended next assessment time based on current state
   */
  getRecommendedAssessmentInterval(quadrant: QuadrantName): number {
    // Returns interval in minutes
    const intervals: Record<QuadrantName, number> = {
      present_connected: 240, // 4 hours - stable state
      present_distracted: 60, // 1 hour - needs attention
      absent_numb: 120,       // 2 hours - moderate concern
      absent_restless: 30,    // 30 min - needs frequent check
    };
    return intervals[quadrant];
  }
}

// Export singleton instance
export const dopamineService = new DopamineService();

// Export class for instantiation with custom userId
export { DopamineService };
