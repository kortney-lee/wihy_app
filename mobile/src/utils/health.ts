// Apple HealthKit and Google Fit integration using native SDKs.
import { Platform } from 'react-native';

// Conditional imports for native modules (not available on web)
let HealthKit: any;
let HKQuantityTypeIdentifier: any;
let GoogleFit: any;
let Scopes: any;

if (Platform.OS === 'ios') {
  const healthKit = require('@kingstinct/react-native-healthkit');
  HealthKit = healthKit.default;
  HKQuantityTypeIdentifier = healthKit.HKQuantityTypeIdentifier;
}

if (Platform.OS === 'android') {
  GoogleFit = require('react-native-google-fit').default;
  Scopes = require('react-native-google-fit').Scopes;
}

export type HealthPermission = {
  read: string[];
  write?: string[];
};

export type HealthPermissionResult = {
  granted: boolean;
  missing: string[];
};

// Apple HealthKit permissions
export const requestAppleHealthPermissions = async (
  permission: HealthPermission,
): Promise<HealthPermissionResult> => {
  if (Platform.OS !== 'ios') {
    return { granted: false, missing: ['iOS only'] };
  }

  try {
    const readPermissions = permission.read.map((p) => p as HKQuantityTypeIdentifier);
    const writePermissions = (permission.write || []).map((p) => p as HKQuantityTypeIdentifier);

    await HealthKit.requestAuthorization(readPermissions, writePermissions);

    // HealthKit doesn't return explicit grant status for privacy reasons
    // We assume success if no error is thrown
    return { granted: true, missing: [] };
  } catch (error) {
    console.error('HealthKit permission error:', error);
    return { granted: false, missing: [...permission.read, ...(permission.write || [])] };
  }
};

// Google Fit permissions
export const requestGoogleFitPermissions = async (
  scopes: string[],
): Promise<HealthPermissionResult> => {
  if (Platform.OS !== 'android') {
    return { granted: false, missing: ['Android only'] };
  }

  try {
    const options = {
      scopes: scopes.length > 0 ? scopes : [
        Scopes.FITNESS_ACTIVITY_READ,
        Scopes.FITNESS_ACTIVITY_WRITE,
        Scopes.FITNESS_BODY_READ,
        Scopes.FITNESS_BODY_WRITE,
      ],
    };

    const authResult = await GoogleFit.authorize(options);

    if (authResult.success) {
      return { granted: true, missing: [] };
    } else {
      return { granted: false, missing: scopes };
    }
  } catch (error) {
    console.error('Google Fit permission error:', error);
    return { granted: false, missing: scopes };
  }
};

// Fetch Apple Health samples (example: step count)
export const fetchAppleHealthSamples = async () => {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Health is only available on iOS.');
  }

  try {
    const isAvailable = await HealthKit.isHealthDataAvailable();
    if (!isAvailable) {
      throw new Error('HealthKit is not available on this device.');
    }

    // Example: fetch step count for the last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const steps = await HealthKit.querySamples(
      HKQuantityTypeIdentifier.stepCount,
      {
        from: startDate,
        to: endDate,
      },
    );

    return steps;
  } catch (error) {
    console.error('Error fetching Apple Health data:', error);
    throw error;
  }
};

// Fetch Google Fit data (example: daily steps)
export const fetchGoogleFitData = async () => {
  if (Platform.OS !== 'android') {
    throw new Error('Google Fit is only available on Android.');
  }

  try {
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    };

    const steps = await GoogleFit.getDailySteps(options);
    return steps;
  } catch (error) {
    console.error('Error fetching Google Fit data:', error);
    throw error;
  }
};

