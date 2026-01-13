import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if we're running in Expo Go (no native modules available)
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import native health modules only when NOT in Expo Go
// These modules require native builds and will crash Expo Go
let GoogleFit: any = null;
let Scopes: any = null;
let HealthConnectModule: any = null;
let HealthKit: any = null;

if (!isExpoGo) {
  // Only import native modules in development builds or standalone apps
  if (Platform.OS === 'android') {
    try {
      const googleFitModule = require('react-native-google-fit');
      GoogleFit = googleFitModule.default;
      Scopes = googleFitModule.Scopes;
    } catch (e) {
      console.warn('Google Fit module not available');
    }
    
    try {
      HealthConnectModule = require('react-native-health-connect');
    } catch (e) {
      console.warn('Health Connect module not available');
    }
  } else if (Platform.OS === 'ios') {
    try {
      HealthKit = require('@kingstinct/react-native-healthkit').default;
    } catch (e) {
      console.warn('HealthKit module not available');
    }
  }
}

/**
 * Health Data Service - Cross-Platform Health Integration
 * 
 * For Android (Priority Order):
 * 1. Health Connect (Android 14+) - Works with Samsung Health, Google Fit, and all health apps
 * 2. Google Fit (Fallback for older Android versions)
 * 
 * For iOS:
 * - HealthKit integration for Apple Health
 * - Full support for steps, distance, calories, heart rate, sleep, weight, and more
 */

// Unified health data types
export interface HealthMetrics {
  steps: number;
  distance: number; // km
  calories: number;
  activeMinutes: number;
  heartRate?: number;
  sleepHours?: number;
  weight?: number;
  hydration?: number; // liters
}

export interface HealthTrend {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DailyHealthData {
  date: string;
  steps: number;
  calories: number;
  activeMinutes: number;
  sleepHours?: number;
  heartRate?: number;
  weight?: number;
}

export interface WeeklyHealthData {
  startDate: string;
  endDate: string;
  days: DailyHealthData[];
  averages: {
    steps: number;
    calories: number;
    activeMinutes: number;
    sleepHours?: number;
    heartRate?: number;
  };
  trends: {
    steps: HealthTrend;
    calories: HealthTrend;
    activeMinutes: HealthTrend;
  };
}

export interface NutritionData {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  water: number; // liters
}

export interface WorkoutData {
  type: string;
  duration: number; // minutes
  calories: number;
  distance?: number; // km
  startDate: string;
  endDate: string;
}

/**
 * Health Data Service
 * 
 * Unified service for accessing iOS HealthKit and Android Health Connect/Google Fit
 * Provides cross-platform health data access with automatic platform detection
 */
class HealthDataService {
  private isInitialized = false;
  private hasPermissions = false;
  private useHealthConnect = false; // Flag to track which API we're using
  private isExpoGo = Constants.appOwnership === 'expo';

  /**
   * Initialize health data access
   * Tries Health Connect first, falls back to Google Fit
   * Returns mock data in Expo Go since native modules aren't available
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return this.hasPermissions;

    // In Expo Go, we can't use native health modules
    // Return true with mock data support
    if (this.isExpoGo) {
      console.log('[HealthDataService] Running in Expo Go - using mock health data');
      this.isInitialized = true;
      this.hasPermissions = true; // Pretend we have permissions for demo
      return true;
    }

    try {
      if (Platform.OS === 'android') {
        // Check if Health Connect is available
        if (HealthConnectModule) {
          try {
            const healthConnectStatus = await HealthConnectModule.getSdkStatus();
            
            if (healthConnectStatus === HealthConnectModule.SdkAvailabilityStatus?.SDK_AVAILABLE) {
              console.log('[HealthDataService] Health Connect is available');
              this.useHealthConnect = true;
              return await this.initializeHealthConnect();
            }
          } catch (e) {
            console.log('[HealthDataService] Health Connect check failed:', e);
          }
        }
        
        // Fallback to Google Fit
        if (GoogleFit) {
          console.log('[HealthDataService] Using Google Fit');
          this.useHealthConnect = false;
          return await this.initializeGoogleFit();
        }
        
        // No health modules available
        console.log('[HealthDataService] No health modules available on Android');
        this.isInitialized = true;
        this.hasPermissions = false;
        return false;
      } else if (Platform.OS === 'ios') {
        // Initialize HealthKit for iOS
        if (HealthKit) {
          console.log('[HealthDataService] Initializing iOS HealthKit');
          return await this.initializeHealthKit();
        }
        console.log('[HealthDataService] HealthKit not available');
        this.isInitialized = true;
        this.hasPermissions = false;
        return false;
      }
      
      // Platform not supported
      this.isInitialized = true;
      this.hasPermissions = false;
      return false;
    } catch (error) {
      console.error('[HealthDataService] Initialization failed:', error);
      this.isInitialized = true;
      this.hasPermissions = false;
      return false;
    }
  }

  /**
   * Initialize HealthKit (iOS)
   */
  private async initializeHealthKit(): Promise<boolean> {
    try {
      // Request authorization for read permissions
      const success = await HealthKit.requestAuthorization({
        toRead: [
          'HKQuantityTypeIdentifierStepCount',
          'HKQuantityTypeIdentifierDistanceWalkingRunning',
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          'HKQuantityTypeIdentifierHeartRate',
          'HKQuantityTypeIdentifierBodyMass',
          'HKQuantityTypeIdentifierAppleExerciseTime',
          'HKCategoryTypeIdentifierSleepAnalysis',
        ],
      });

      if (success) {
        console.log('[HealthDataService] HealthKit authorized');
        this.isInitialized = true;
        this.hasPermissions = true;
        return true;
      } else {
        console.log('[HealthDataService] HealthKit authorization denied');
        this.isInitialized = true;
        this.hasPermissions = false;
        return false;
      }
    } catch (error) {
      console.error('[HealthDataService] HealthKit init error:', error);
      this.isInitialized = true;
      this.hasPermissions = false;
      return false;
    }
  }

  /**
   * Initialize Health Connect (Android 14+)
   */
  private async initializeHealthConnect(): Promise<boolean> {
    try {
      if (!HealthConnectModule) {
        console.log('[HealthDataService] Health Connect module not available');
        return false;
      }

      // Initialize Health Connect
      const isInitialized = await HealthConnectModule.initialize();
      
      if (!isInitialized) {
        console.log('[HealthDataService] Health Connect initialization failed');
        this.isInitialized = true;
        this.hasPermissions = false;
        return false;
      }

      // Request permissions for all data types
      const permissions = [
        { accessType: 'read' as const, recordType: 'Steps' as const },
        { accessType: 'read' as const, recordType: 'Distance' as const },
        { accessType: 'read' as const, recordType: 'ActiveCaloriesBurned' as const },
        { accessType: 'read' as const, recordType: 'HeartRate' as const },
        { accessType: 'read' as const, recordType: 'Weight' as const },
        { accessType: 'read' as const, recordType: 'SleepSession' as const },
        { accessType: 'read' as const, recordType: 'ExerciseSession' as const },
      ];

      const granted = await HealthConnectModule.requestPermission(permissions);
      
      if (granted) {
        console.log('[HealthDataService] Health Connect permissions granted');
        this.isInitialized = true;
        this.hasPermissions = true;
        return true;
      } else {
        console.log('[HealthDataService] Health Connect permissions denied');
        this.isInitialized = true;
        this.hasPermissions = false;
        return false;
      }
    } catch (error) {
      console.error('[HealthDataService] Health Connect init error:', error);
      this.isInitialized = true;
      this.hasPermissions = false;
      return false;
    }
  }

  /**
   * Initialize Google Fit (fallback for older Android)
   */
  private async initializeGoogleFit(): Promise<boolean> {
    try {
      const options = {
        scopes: [
          Scopes.FITNESS_ACTIVITY_READ,
          Scopes.FITNESS_ACTIVITY_WRITE,
          Scopes.FITNESS_BODY_READ,
          Scopes.FITNESS_LOCATION_READ,
        ],
      };

      const authResult = await GoogleFit.authorize(options);
      
      if (authResult.success) {
        console.log('[HealthDataService] Google Fit authorized successfully');
        this.isInitialized = true;
        this.hasPermissions = true;
        return true;
      } else {
        console.log('[HealthDataService] Google Fit authorization denied');
        this.isInitialized = true;
        this.hasPermissions = false;
        return false;
      }
    } catch (error) {
      console.error('[HealthDataService] Google Fit init error:', error);
      this.isInitialized = true;
      this.hasPermissions = false;
      return false;
    }
  }

  /**
   * Check if health data permissions are granted
   */
  async hasHealthPermissions(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.hasPermissions;
  }

  /**
   * Get today's health metrics
   * Uses Health Connect if available (Android), otherwise Google Fit (Android) or HealthKit (iOS)
   */
  async getTodayMetrics(): Promise<HealthMetrics> {
    try {
      // Return mock data in Expo Go
      if (this.isExpoGo) {
        return this.getMockTodayMetrics();
      }

      // Check if we have permissions
      if (!this.hasPermissions) {
        throw new Error('No health permissions granted');
      }

      if (Platform.OS === 'android') {
        if (this.useHealthConnect) {
          return await this.getTodayMetricsHealthConnect();
        } else {
          return await this.getTodayMetricsAndroid();
        }
      } else if (Platform.OS === 'ios') {
        return await this.getTodayMetricsHealthKit();
      }
      
      throw new Error('Unsupported platform');
    } catch (error) {
      console.error('[HealthDataService] Error fetching today metrics:', error);
      // Return mock data as fallback
      return this.getMockTodayMetrics();
    }
  }

  /**
   * Get mock health metrics for Expo Go or fallback
   */
  private getMockTodayMetrics(): HealthMetrics {
    return {
      steps: 7823,
      distance: 5.2,
      calories: 1847,
      activeMinutes: 45,
      heartRate: 72,
      sleepHours: 7.5,
      weight: 70.5,
      hydration: 2.1,
    };
  }

  /**
   * Get today's metrics from Health Connect
   */
  private async getTodayMetricsHealthConnect(): Promise<HealthMetrics> {
    if (!HealthConnectModule) {
      return this.getMockTodayMetrics();
    }

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();

    try {
      // Get steps
      let steps = 0;
      try {
        const stepsResult = await HealthConnectModule.readRecords('Steps', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });
        if (stepsResult.records && stepsResult.records.length > 0) {
          steps = stepsResult.records.reduce((total: number, record: any) => total + (record.count || 0), 0);
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch steps:', err);
      }

      // Get distance
      let distance = 0;
      try {
        const distanceResult = await HealthConnectModule.readRecords('Distance', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });
        if (distanceResult.records && distanceResult.records.length > 0) {
          distance = distanceResult.records.reduce((total: number, record: any) => {
            const meters = record.distance?.inMeters || 0;
            return total + meters;
          }, 0) / 1000; // Convert to km
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch distance:', err);
      }

      // Get calories
      let calories = 0;
      try {
        const caloriesResult = await HealthConnectModule.readRecords('ActiveCaloriesBurned', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });
        if (caloriesResult.records && caloriesResult.records.length > 0) {
          calories = caloriesResult.records.reduce((total: number, record: any) => {
            const kcal = record.energy?.inKilocalories || 0;
            return total + kcal;
          }, 0);
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch calories:', err);
      }

      // Get active minutes from exercise sessions
      let activeMinutes = 0;
      try {
        const exerciseResult = await HealthConnectModule.readRecords('ExerciseSession', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });
        if (exerciseResult.records && exerciseResult.records.length > 0) {
          activeMinutes = exerciseResult.records.reduce((total: number, record: any) => {
            const start = new Date(record.startTime).getTime();
            const end = new Date(record.endTime).getTime();
            const minutes = (end - start) / 60000;
            return total + minutes;
          }, 0);
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch exercise:', err);
      }

      // Get heart rate
      let heartRate = undefined;
      try {
        const heartRateResult = await HealthConnectModule.readRecords('HeartRate', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });
        if (heartRateResult.records && heartRateResult.records.length > 0) {
          const samples = heartRateResult.records.flatMap((record: any) => record.samples || []);
          if (samples.length > 0) {
            const avgBpm = samples.reduce((total: number, sample: any) => total + (sample.beatsPerMinute || 0), 0) / samples.length;
            heartRate = Math.round(avgBpm);
          }
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch heart rate:', err);
      }

      // Get sleep hours
      let sleepHours = undefined;
      try {
        const sleepResult = await HealthConnectModule.readRecords('SleepSession', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });
        if (sleepResult.records && sleepResult.records.length > 0) {
          const totalSleepMinutes = sleepResult.records.reduce((total: number, record: any) => {
            const start = new Date(record.startTime).getTime();
            const end = new Date(record.endTime).getTime();
            const minutes = (end - start) / 60000;
            return total + minutes;
          }, 0);
          sleepHours = totalSleepMinutes / 60;
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch sleep:', err);
      }

      // Get weight
      let weight = undefined;
      try {
        const weightResult = await HealthConnectModule.readRecords('Weight', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });
        if (weightResult.records && weightResult.records.length > 0) {
          const latestWeight = weightResult.records[weightResult.records.length - 1];
          weight = (latestWeight as any).weight?.inKilograms;
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch weight:', err);
      }

      return {
        steps: Math.round(steps),
        distance: Number(distance.toFixed(2)),
        calories: Math.round(calories),
        activeMinutes: Math.round(activeMinutes),
        heartRate,
        sleepHours: sleepHours ? Number(sleepHours.toFixed(1)) : undefined,
        weight: weight ? Number(weight.toFixed(1)) : undefined,
        hydration: undefined, // Not available in Health Connect standard
      };
    } catch (error) {
      console.error('[HealthDataService] Error fetching Health Connect metrics:', error);
      throw error;
    }
  }

  /**
   * Get today's metrics from Google Fit (Android)
   */
  private async getTodayMetricsAndroid(): Promise<HealthMetrics> {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();

    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    try {
      // Get daily steps
      const stepsData = await GoogleFit.getDailyStepCountSamples(options);
      let steps = 0;
      if (stepsData && stepsData.length > 0) {
        const googleFitData = stepsData.find((source: any) => 
          source.source === 'com.google.android.gms:estimated_steps' ||
          source.source === 'com.google.android.gms:merge_step_deltas'
        );
        if (googleFitData && googleFitData.steps && googleFitData.steps.length > 0) {
          steps = googleFitData.steps[0].value || 0;
        }
      }

      // Get distance
      const distanceData = await GoogleFit.getDailyDistanceSamples(options);
      let distance = 0;
      if (distanceData && distanceData.length > 0) {
        distance = distanceData[0].distance || 0;
        distance = distance / 1000; // Convert meters to km
      }

      // Get calories
      const caloriesData = await GoogleFit.getDailyCalorieSamples(options);
      let calories = 0;
      if (caloriesData && caloriesData.length > 0) {
        calories = caloriesData[0].calorie || 0;
      }

      // Calculate active minutes from activities
      let activeMinutes = 0;
      try {
        const activities = await GoogleFit.getActivitySamples(options);
        if (activities && activities.length > 0) {
          activeMinutes = activities.reduce((total: number, activity: any) => {
            const duration = (new Date(activity.end).getTime() - new Date(activity.start).getTime()) / 60000;
            return total + duration;
          }, 0);
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch activities:', err);
      }

      // Get heart rate
      let heartRate = 0;
      try {
        const heartRateData = await GoogleFit.getHeartRateSamples(options);
        if (heartRateData && heartRateData.length > 0) {
          const values = heartRateData.map((hr: any) => hr.value);
          heartRate = Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length);
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch heart rate:', err);
      }

      // Get weight
      let weight = 0;
      try {
        const weightData = await GoogleFit.getWeightSamples(options);
        if (weightData && weightData.length > 0) {
          weight = weightData[weightData.length - 1].value || 0;
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch weight:', err);
      }

      return {
        steps: Math.round(steps),
        distance: Number(distance.toFixed(2)),
        calories: Math.round(calories),
        activeMinutes: Math.round(activeMinutes),
        heartRate: heartRate > 0 ? heartRate : undefined,
        sleepHours: undefined, // Google Fit doesn't provide sleep data easily
        weight: weight > 0 ? weight : undefined,
        hydration: undefined, // Not available in Google Fit
      };
    } catch (error) {
      console.error('[HealthDataService] Error fetching Android metrics:', error);
      throw error;
    }
  }

  /**
   * Get today's metrics from HealthKit (iOS)
   */
  private async getTodayMetricsHealthKit(): Promise<HealthMetrics> {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();

    try {
      // Get steps
      let steps = 0;
      try {
        const stepsResult = await HealthKit.queryQuantitySamples(
          'HKQuantityTypeIdentifierStepCount',
          {
            filter: {
              date: {
                startDate,
                endDate,
              },
            },
            limit: 0, // 0 means fetch all samples
          }
        );
        if (stepsResult && stepsResult.length > 0) {
          steps = stepsResult.reduce((total: number, sample: any) => total + (sample.quantity || 0), 0);
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch steps:', err);
      }

      // Get distance (in meters, convert to km)
      let distance = 0;
      try {
        const distanceResult = await HealthKit.queryQuantitySamples(
          'HKQuantityTypeIdentifierDistanceWalkingRunning',
          {
            filter: {
              date: {
                startDate,
                endDate,
              },
            },
            limit: 0,
          }
        );
        if (distanceResult && distanceResult.length > 0) {
          const meters = distanceResult.reduce((total: number, sample: any) => total + (sample.quantity || 0), 0);
          distance = meters / 1000;
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch distance:', err);
      }

      // Get active calories
      let calories = 0;
      try {
        const caloriesResult = await HealthKit.queryQuantitySamples(
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          {
            filter: {
              date: {
                startDate,
                endDate,
              },
            },
            limit: 0,
          }
        );
        if (caloriesResult && caloriesResult.length > 0) {
          calories = caloriesResult.reduce((total: number, sample: any) => total + (sample.quantity || 0), 0);
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch calories:', err);
      }

      // Get active minutes (Apple Exercise Time in minutes)
      let activeMinutes = 0;
      try {
        const exerciseResult = await HealthKit.queryQuantitySamples(
          'HKQuantityTypeIdentifierAppleExerciseTime',
          {
            filter: {
              date: {
                startDate,
                endDate,
              },
            },
            limit: 0,
          }
        );
        if (exerciseResult && exerciseResult.length > 0) {
          activeMinutes = exerciseResult.reduce((total: number, sample: any) => total + (sample.quantity || 0), 0);
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch active minutes:', err);
      }

      // Get most recent heart rate
      let heartRate = 0;
      try {
        const heartRateResult = await HealthKit.queryQuantitySamples(
          'HKQuantityTypeIdentifierHeartRate',
          {
            filter: {
              date: {
                startDate,
                endDate,
              },
            },
            limit: 1,
          }
        );
        if (heartRateResult && heartRateResult.length > 0) {
          heartRate = Math.round(heartRateResult[0].quantity || 0);
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch heart rate:', err);
      }

      // Get most recent weight (in kg)
      let weight = 0;
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const weightResult = await HealthKit.queryQuantitySamples(
          'HKQuantityTypeIdentifierBodyMass',
          {
            filter: {
              date: {
                startDate: thirtyDaysAgo,
                endDate,
              },
            },
            limit: 1,
          }
        );
        if (weightResult && weightResult.length > 0) {
          weight = weightResult[0].quantity || 0;
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch weight:', err);
      }

      // Get sleep data (in hours)
      let sleepHours = 0;
      try {
        const sleepResult = await HealthKit.queryCategorySamples(
          'HKCategoryTypeIdentifierSleepAnalysis',
          {
            filter: {
              date: {
                startDate,
                endDate,
              },
            },
            limit: 0,
          }
        );
        if (sleepResult && sleepResult.length > 0) {
          // Calculate total sleep duration in hours
          const totalSleepMinutes = sleepResult.reduce((total: number, sample: any) => {
            if (sample.value === 0 || sample.value === 1) { // In bed or asleep
              const start = new Date(sample.startDate).getTime();
              const end = new Date(sample.endDate).getTime();
              const minutes = (end - start) / (1000 * 60);
              return total + minutes;
            }
            return total;
          }, 0);
          sleepHours = totalSleepMinutes / 60;
        }
      } catch (err) {
        console.log('[HealthDataService] Could not fetch sleep:', err);
      }

      return {
        steps: Math.round(steps),
        distance: Number(distance.toFixed(2)),
        calories: Math.round(calories),
        activeMinutes: Math.round(activeMinutes),
        heartRate: heartRate > 0 ? heartRate : undefined,
        sleepHours: sleepHours > 0 ? Number(sleepHours.toFixed(1)) : undefined,
        weight: weight > 0 ? Number(weight.toFixed(1)) : undefined,
        hydration: undefined, // Not easily available in HealthKit
      };
    } catch (error) {
      console.error('[HealthDataService] Error fetching iOS metrics:', error);
      throw error;
    }
  }

  /**
   * Log nutrition data
   * 
   * TODO: Implement real HealthKit/Health Connect logging
   */
  async logNutrition(data: NutritionData): Promise<boolean> {
    try {
      console.log('[HealthDataService] Nutrition logged (mock):', data);
      // TODO: Real implementation
      // if (Platform.OS === 'ios') {
      //   await HealthKit.saveQuantitySample('dietaryEnergyConsumed', ...);
      // } else if (Platform.OS === 'android') {
      //   await HealthConnect.writeNutrition(...);
      // }
      return true;
    } catch (error) {
      console.error('[HealthDataService] Error logging nutrition:', error);
      return false;
    }
  }

  /**
   * Log workout
   * 
   * TODO: Implement real HealthKit/Health Connect logging
   */
  async logWorkout(workout: WorkoutData): Promise<boolean> {
    try {
      console.log('[HealthDataService] Workout logged (mock):', workout);
      // TODO: Real implementation
      // if (Platform.OS === 'ios') {
      //   await HealthKit.saveWorkout(...);
      // } else if (Platform.OS === 'android') {
      //   await HealthConnect.writeWorkout(...);
      // }
      return true;
    } catch (error) {
      console.error('[HealthDataService] Error logging workout:', error);
      return false;
    }
  }

  // Helper methods

  private calculateTrend(previous: number, current: number): HealthTrend {
    const change = Math.round(((current - previous) / previous) * 100);
    let trend: 'up' | 'down' | 'stable' = 'stable';
    
    if (Math.abs(change) > 5) {
      trend = change > 0 ? 'up' : 'down';
    }

    return {
      current,
      previous,
      change,
      trend,
    };
  }

  /**
   * Get weekly health data
   * TODO: Implement real queries - for now returns mock data
   */
  async getWeeklyData(): Promise<WeeklyHealthData | null> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);

      // Generate mock daily data with some variation
      const days: DailyHealthData[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const baseSteps = isWeekend ? 6000 : 9000;
        
        days.push({
          date: date.toISOString().split('T')[0],
          steps: Math.round(baseSteps + Math.random() * 3000),
          calories: Math.round(400 + Math.random() * 150),
          activeMinutes: Math.round(25 + Math.random() * 20),
          heartRate: Math.round(68 + Math.random() * 15),
        });
      }

      // Calculate averages
      const averages = {
        steps: Math.round(days.reduce((sum, d) => sum + d.steps, 0) / days.length),
        calories: Math.round(days.reduce((sum, d) => sum + d.calories, 0) / days.length),
        activeMinutes: Math.round(
          days.reduce((sum, d) => sum + d.activeMinutes, 0) / days.length
        ),
      };

      // Calculate trends (first half vs second half)
      const midPoint = Math.floor(days.length / 2);
      const firstHalf = days.slice(0, midPoint);
      const secondHalf = days.slice(midPoint);

      const trends = {
        steps: this.calculateTrend(
          firstHalf.reduce((sum, d) => sum + d.steps, 0) / firstHalf.length,
          secondHalf.reduce((sum, d) => sum + d.steps, 0) / secondHalf.length
        ),
        calories: this.calculateTrend(
          firstHalf.reduce((sum, d) => sum + d.calories, 0) / firstHalf.length,
          secondHalf.reduce((sum, d) => sum + d.calories, 0) / secondHalf.length
        ),
        activeMinutes: this.calculateTrend(
          firstHalf.reduce((sum, d) => sum + d.activeMinutes, 0) / firstHalf.length,
          secondHalf.reduce((sum, d) => sum + d.activeMinutes, 0) / secondHalf.length
        ),
      };

      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days,
        averages,
        trends,
      };
    } catch (error) {
      console.error('[HealthDataService] Error getting weekly data:', error);
      return null;
    }
  }

  /**
   * Get health score (0-100)
   * 
   * Calculates a composite health score based on multiple metrics:
   * - Steps (target: 10,000/day)
   * - Active minutes (target: 30/day)
   * - Sleep (target: 8 hours)
   * - Heart rate (optimal: 60-100 bpm)
   */
  async getHealthScore(): Promise<number> {
    try {
      const metrics = await this.getTodayMetrics();
      if (!metrics) return 75; // Default score

      let score = 0;
      let factors = 0;

      // Steps (target: 10,000)
      if (metrics.steps > 0) {
        score += Math.min((metrics.steps / 10000) * 100, 100);
        factors++;
      }

      // Active minutes (target: 30)
      if (metrics.activeMinutes > 0) {
        score += Math.min((metrics.activeMinutes / 30) * 100, 100);
        factors++;
      }

      // Sleep (target: 8 hours)
      if (metrics.sleepHours) {
        score += Math.min((metrics.sleepHours / 8) * 100, 100);
        factors++;
      }

      // Heart rate (optimal range: 60-100 bpm)
      if (metrics.heartRate) {
        if (metrics.heartRate >= 60 && metrics.heartRate <= 100) {
          score += 100;
        } else if (metrics.heartRate < 60) {
          score += Math.max(0, 100 - (60 - metrics.heartRate) * 2);
        } else {
          score += Math.max(0, 100 - (metrics.heartRate - 100) * 2);
        }
        factors++;
      }

      return factors > 0 ? Math.round(score / factors) : 75;
    } catch (error) {
      console.error('[HealthDataService] Error calculating health score:', error);
      return 75;
    }
  }

  // Mock data methods (fallback when no permissions or errors)

  private getMockMetrics(): HealthMetrics {
    // Simulate some variation based on current time
    const hour = new Date().getHours();
    const dayProgress = Math.max(0.1, hour / 24); // Minimum 10% to show some data
    
    return {
      steps: Math.round(10000 * dayProgress + Math.random() * 1000),
      distance: Math.round((8 * dayProgress + Math.random() * 2) * 100) / 100,
      calories: Math.round(500 * dayProgress + Math.random() * 100),
      activeMinutes: Math.round(60 * dayProgress + Math.random() * 15),
      heartRate: Math.round(65 + Math.random() * 15),
      sleepHours: hour < 12 ? Math.round((7 + Math.random()) * 10) / 10 : undefined,
      weight: Math.round((70 + Math.random() * 10) * 10) / 10,
      hydration: Math.round((2 * dayProgress + Math.random() * 0.5) * 10) / 10,
    };
  }

  private async getDailyData(date: Date): Promise<DailyHealthData> {
    // Mock daily data - in production, query actual health data for this date
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    return {
      date: date.toISOString().split('T')[0],
      steps: Math.round((isWeekend ? 6000 : 9000) + Math.random() * 3000),
      calories: Math.round(400 + Math.random() * 150),
      activeMinutes: Math.round((isWeekend ? 20 : 30) + Math.random() * 20),
      heartRate: Math.round(68 + Math.random() * 15),
      sleepHours: Math.round((7 + Math.random()) * 10) / 10,
      weight: Math.round((70 + Math.random() * 2) * 10) / 10,
    };
  }

  /**
   * Format number with commas
   */
  formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

export const healthDataService = new HealthDataService();
