import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';
import * as Application from 'expo-application';

// ============= STORAGE KEYS =============

const STORAGE_KEYS = {
  PROFILE_SETTINGS: '@wihy_profile_settings',
  DEV_SETTINGS: '@wihy_dev_settings',
  ADMIN_SETTINGS: '@wihy_admin_settings',
  PERMISSION_STATES: '@wihy_permission_states',
  SCAN_SETTINGS: '@wihy_scan_settings',
  PRIVACY_SETTINGS: '@wihy_privacy_settings',
  APP_PREFERENCES: '@wihy_app_preferences',
};

// ============= TYPE DEFINITIONS =============

export type UserRole = 'user' | 'premium' | 'family-basic' | 'family-pro' | 'coach' | 'employee' | 'admin';
export type ThemeMode = 'light' | 'dark' | 'system';
export type UnitSystem = 'metric' | 'imperial';
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja';

/** User profile information */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height?: number;
  height_unit?: 'cm' | 'in';
  weight?: number;
  weight_unit?: 'kg' | 'lb';
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  fitness_goal?: 'lose_weight' | 'maintain' | 'gain_muscle' | 'improve_health';
  dietary_restrictions?: string[];
  allergies?: string[];
  medical_conditions?: string[];
  role: UserRole;
  member_since: string;
  last_login?: string;
  profile_completed: boolean;
}

/** App appearance & behavior settings */
export interface AppPreferences {
  theme: ThemeMode;
  language: LanguageCode;
  units: UnitSystem;
  timezone: string;
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  time_format: '12h' | '24h';
  first_day_of_week: 'sunday' | 'monday';
  haptic_feedback: boolean;
  sound_effects: boolean;
  animations_enabled: boolean;
  large_text: boolean;
  high_contrast: boolean;
}

/** Notification settings */
export interface NotificationSettings {
  enabled: boolean;
  meal_reminders: boolean;
  meal_reminder_times: string[]; // ['08:00', '12:00', '18:00']
  water_reminders: boolean;
  water_reminder_interval: number; // minutes
  workout_reminders: boolean;
  workout_reminder_time: string;
  workout_days: number[]; // [1,2,3,4,5] for Mon-Fri
  progress_updates: boolean;
  weekly_summary: boolean;
  coach_messages: boolean;
  family_updates: boolean;
  promotional: boolean;
  silent_hours_enabled: boolean;
  silent_hours_start: string; // '22:00'
  silent_hours_end: string; // '07:00'
}

/** Auto-scan and camera settings */
export interface ScanSettings {
  auto_scan_enabled: boolean;
  auto_scan_delay_ms: number;
  barcode_formats: string[];
  camera_resolution: 'low' | 'medium' | 'high' | 'max';
  flash_mode: 'off' | 'on' | 'auto';
  sound_on_scan: boolean;
  vibrate_on_scan: boolean;
  save_scan_history: boolean;
  scan_history_retention_days: number;
  auto_analyze_photos: boolean;
  compress_images: boolean;
  image_quality: number; // 0.1 to 1.0
  preferred_scanner: 'barcode' | 'label' | 'food' | 'recipe';
}

/** Privacy & data settings */
export interface PrivacySettings {
  analytics_enabled: boolean;
  crash_reports_enabled: boolean;
  personalization_enabled: boolean;
  share_with_coach: boolean;
  share_with_family: boolean;
  public_profile: boolean;
  show_in_leaderboards: boolean;
  allow_data_export: boolean;
  data_retention_months: number;
  location_tracking: boolean;
  ad_tracking: boolean;
}

/** Android permission states */
export interface PermissionStates {
  camera: 'granted' | 'denied' | 'never_ask_again' | 'not_requested';
  microphone: 'granted' | 'denied' | 'never_ask_again' | 'not_requested';
  storage: 'granted' | 'denied' | 'never_ask_again' | 'not_requested';
  media_library: 'granted' | 'denied' | 'never_ask_again' | 'not_requested';
  contacts: 'granted' | 'denied' | 'never_ask_again' | 'not_requested';
  location: 'granted' | 'denied' | 'never_ask_again' | 'not_requested';
  location_background: 'granted' | 'denied' | 'never_ask_again' | 'not_requested';
  notifications: 'granted' | 'denied' | 'never_ask_again' | 'not_requested';
  activity_recognition: 'granted' | 'denied' | 'never_ask_again' | 'not_requested';
  body_sensors: 'granted' | 'denied' | 'never_ask_again' | 'not_requested';
  health_connect: 'granted' | 'denied' | 'never_ask_again' | 'not_requested';
  calendar: 'granted' | 'denied' | 'never_ask_again' | 'not_requested';
  bluetooth: 'granted' | 'denied' | 'never_ask_again' | 'not_requested';
}

/** Developer/debug settings */
export interface DevSettings {
  dev_mode_enabled: boolean;
  show_debug_info: boolean;
  mock_data_enabled: boolean;
  api_logging_enabled: boolean;
  network_inspector_enabled: boolean;
  force_offline_mode: boolean;
  skip_onboarding: boolean;
  clear_cache_on_launch: boolean;
  show_layout_bounds: boolean;
  slow_animations: boolean;
  custom_api_url?: string;
  test_user_id?: string;
  feature_flags: Record<string, boolean>;
}

/** Admin settings (for admin users only) */
export interface AdminSettings {
  admin_mode_enabled: boolean;
  can_impersonate_users: boolean;
  can_view_all_data: boolean;
  can_modify_subscriptions: boolean;
  can_send_broadcasts: boolean;
  can_manage_content: boolean;
  can_access_analytics: boolean;
  bypass_rate_limits: boolean;
  debug_panel_enabled: boolean;
}

/** Health integration settings (Android-specific) */
export interface HealthIntegrationSettings {
  health_connect_enabled: boolean;
  google_fit_enabled: boolean;
  samsung_health_enabled: boolean;
  sync_steps: boolean;
  sync_distance: boolean;
  sync_calories: boolean;
  sync_heart_rate: boolean;
  sync_sleep: boolean;
  sync_weight: boolean;
  sync_blood_pressure: boolean;
  sync_blood_glucose: boolean;
  sync_nutrition: boolean;
  sync_hydration: boolean;
  sync_workouts: boolean;
  sync_frequency: 'realtime' | '15min' | '30min' | '1hour' | 'manual';
  background_sync: boolean;
}

/** Security settings */
export interface SecuritySettings {
  biometric_enabled: boolean;
  biometric_type: 'fingerprint' | 'face' | 'iris' | 'none';
  pin_enabled: boolean;
  pin_length: 4 | 6;
  auto_lock_enabled: boolean;
  auto_lock_timeout: number; // seconds
  require_auth_for_sensitive: boolean;
  two_factor_enabled: boolean;
  trusted_devices: string[];
  login_notifications: boolean;
  session_timeout: number; // minutes
}

/** Complete settings object */
export interface ProfileSettings {
  profile: UserProfile;
  app_preferences: AppPreferences;
  notifications: NotificationSettings;
  scan_settings: ScanSettings;
  privacy: PrivacySettings;
  permissions: PermissionStates;
  health_integration: HealthIntegrationSettings;
  security: SecuritySettings;
  dev_settings?: DevSettings;
  admin_settings?: AdminSettings;
}

/** Device info for Android */
export interface DeviceInfo {
  platform: 'android';
  os_version: string;
  api_level: number;
  device_model: string;
  manufacturer: string;
  app_version: string;
  build_number: string;
  bundle_id: string;
  is_emulator: boolean;
  screen_density: string;
  total_memory: number;
  supported_abis: string[];
}

// ============= DEFAULT VALUES =============

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  theme: 'system',
  language: 'en',
  units: 'metric',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  date_format: 'MM/DD/YYYY',
  time_format: '12h',
  first_day_of_week: 'sunday',
  haptic_feedback: true,
  sound_effects: true,
  animations_enabled: true,
  large_text: false,
  high_contrast: false,
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  meal_reminders: true,
  meal_reminder_times: ['08:00', '12:00', '18:00'],
  water_reminders: true,
  water_reminder_interval: 60,
  workout_reminders: true,
  workout_reminder_time: '07:00',
  workout_days: [1, 2, 3, 4, 5],
  progress_updates: true,
  weekly_summary: true,
  coach_messages: true,
  family_updates: true,
  promotional: false,
  silent_hours_enabled: true,
  silent_hours_start: '22:00',
  silent_hours_end: '07:00',
};

export const DEFAULT_SCAN_SETTINGS: ScanSettings = {
  auto_scan_enabled: false,
  auto_scan_delay_ms: 500,
  barcode_formats: ['QR_CODE', 'EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'CODE_128', 'CODE_39'],
  camera_resolution: 'high',
  flash_mode: 'auto',
  sound_on_scan: true,
  vibrate_on_scan: true,
  save_scan_history: true,
  scan_history_retention_days: 90,
  auto_analyze_photos: true,
  compress_images: true,
  image_quality: 0.8,
  preferred_scanner: 'barcode',
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  analytics_enabled: true,
  crash_reports_enabled: true,
  personalization_enabled: true,
  share_with_coach: false,
  share_with_family: false,
  public_profile: false,
  show_in_leaderboards: false,
  allow_data_export: true,
  data_retention_months: 24,
  location_tracking: false,
  ad_tracking: false,
};

export const DEFAULT_PERMISSION_STATES: PermissionStates = {
  camera: 'not_requested',
  microphone: 'not_requested',
  storage: 'not_requested',
  media_library: 'not_requested',
  contacts: 'not_requested',
  location: 'not_requested',
  location_background: 'not_requested',
  notifications: 'not_requested',
  activity_recognition: 'not_requested',
  body_sensors: 'not_requested',
  health_connect: 'not_requested',
  calendar: 'not_requested',
  bluetooth: 'not_requested',
};

export const DEFAULT_HEALTH_INTEGRATION: HealthIntegrationSettings = {
  health_connect_enabled: false,
  google_fit_enabled: false,
  samsung_health_enabled: false,
  sync_steps: true,
  sync_distance: true,
  sync_calories: true,
  sync_heart_rate: true,
  sync_sleep: true,
  sync_weight: true,
  sync_blood_pressure: false,
  sync_blood_glucose: false,
  sync_nutrition: true,
  sync_hydration: true,
  sync_workouts: true,
  sync_frequency: '15min',
  background_sync: true,
};

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  biometric_enabled: false,
  biometric_type: 'none',
  pin_enabled: false,
  pin_length: 4,
  auto_lock_enabled: false,
  auto_lock_timeout: 300,
  require_auth_for_sensitive: false,
  two_factor_enabled: false,
  trusted_devices: [],
  login_notifications: true,
  session_timeout: 30,
};

export const DEFAULT_DEV_SETTINGS: DevSettings = {
  dev_mode_enabled: __DEV__,
  show_debug_info: __DEV__,
  mock_data_enabled: false,
  api_logging_enabled: __DEV__,
  network_inspector_enabled: false,
  force_offline_mode: false,
  skip_onboarding: false,
  clear_cache_on_launch: false,
  show_layout_bounds: false,
  slow_animations: false,
  feature_flags: {},
};

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  admin_mode_enabled: false,
  can_impersonate_users: false,
  can_view_all_data: false,
  can_modify_subscriptions: false,
  can_send_broadcasts: false,
  can_manage_content: false,
  can_access_analytics: false,
  bypass_rate_limits: false,
  debug_panel_enabled: false,
};

// ============= SERVICE CLASS =============

class ProfileService {
  private baseUrl: string;
  private cachedSettings: Partial<ProfileSettings> | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.userUrl || 'https://user.wihy.ai';
  }

  // ============= PROFILE CRUD =============

  /**
   * Get user profile from server
   * GET /api/profile/:userId
   */
  async getProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/profile/${userId}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get profile');
      }
      
      return data.profile;
    } catch (error) {
      console.error('[ProfileService] Error getting profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * PUT /api/profile/:userId
   */
  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/profile/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      return data.profile;
    } catch (error) {
      console.error('[ProfileService] Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Upload avatar image
   * POST /api/profile/:userId/avatar
   */
  async uploadAvatar(
    userId: string,
    imageUri: string
  ): Promise<{ avatar_url: string }> {
    try {
      const formData = new FormData();
      
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
      formData.append('user_id', userId);

      const response = await fetchWithLogging(
        `${this.baseUrl}/api/profile/${userId}/avatar`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to upload avatar');
      }
      
      return { avatar_url: data.avatar_url };
    } catch (error) {
      console.error('[ProfileService] Error uploading avatar:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   * DELETE /api/users/:userId
   */
  async deleteAccount(userId: string, confirmation: string): Promise<void> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/users/${userId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmation }),
        }
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete account');
      }
      
      // Clear all local data
      await this.clearAllLocalData();
    } catch (error) {
      console.error('[ProfileService] Error deleting account:', error);
      throw error;
    }
  }

  // ============= SETTINGS MANAGEMENT =============

  /**
   * Get all settings (server + local)
   */
  async getAllSettings(userId: string): Promise<ProfileSettings> {
    try {
      // Try to get from server first
      const serverSettings = await this.getServerSettings(userId);
      
      // Merge with local settings (local overrides for dev/admin)
      const localDev = await this.getLocalDevSettings();
      const localAdmin = await this.getLocalAdminSettings();
      const localSettings = await this.getLocalSettings();
      
      // Merge server settings with local defaults
      const settings: ProfileSettings = {
        profile: serverSettings.profile || localSettings.profile,
        app_preferences: serverSettings.app_preferences || localSettings.app_preferences,
        notifications: serverSettings.notifications || localSettings.notifications,
        scan_settings: serverSettings.scan_settings || localSettings.scan_settings,
        privacy: serverSettings.privacy || localSettings.privacy,
        permissions: serverSettings.permissions || localSettings.permissions,
        health_integration: serverSettings.health_integration || localSettings.health_integration,
        security: serverSettings.security || localSettings.security,
        dev_settings: localDev,
        admin_settings: localAdmin,
      };
      
      this.cachedSettings = settings;
      return settings;
    } catch (error) {
      // Fall back to local settings if server unavailable
      console.warn('[ProfileService] Using local settings fallback:', error);
      return this.getLocalSettings();
    }
  }

  /**
   * Get settings from server
   * GET /api/users/:userId/settings
   */
  async getServerSettings(userId: string): Promise<Partial<ProfileSettings>> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/users/${userId}/settings`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get settings');
      }
      
      return data.settings;
    } catch (error) {
      console.error('[ProfileService] Error getting server settings:', error);
      throw error;
    }
  }

  /**
   * Save settings to server
   * PUT /api/users/:userId/settings
   */
  async saveServerSettings(
    userId: string,
    settings: Partial<ProfileSettings>
  ): Promise<void> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/users/${userId}/settings`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        }
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('[ProfileService] Error saving server settings:', error);
      throw error;
    }
  }

  // ============= LOCAL SETTINGS (AsyncStorage) =============

  /**
   * Get all local settings
   */
  async getLocalSettings(): Promise<ProfileSettings> {
    try {
      const [
        appPrefs,
        notifications,
        scanSettings,
        privacy,
        permissions,
        health,
        security,
        devSettings,
        adminSettings,
      ] = await Promise.all([
        this.getLocalAppPreferences(),
        this.getLocalNotificationSettings(),
        this.getLocalScanSettings(),
        this.getLocalPrivacySettings(),
        this.getLocalPermissionStates(),
        this.getLocalHealthIntegration(),
        this.getLocalSecuritySettings(),
        this.getLocalDevSettings(),
        this.getLocalAdminSettings(),
      ]);

      return {
        profile: {} as UserProfile, // Will be populated from server
        app_preferences: appPrefs,
        notifications,
        scan_settings: scanSettings,
        privacy,
        permissions,
        health_integration: health,
        security,
        dev_settings: devSettings,
        admin_settings: adminSettings,
      };
    } catch (error) {
      console.error('[ProfileService] Error getting local settings:', error);
      throw error;
    }
  }

  // App Preferences
  async getLocalAppPreferences(): Promise<AppPreferences> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.APP_PREFERENCES);
      return stored ? { ...DEFAULT_APP_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_APP_PREFERENCES;
    } catch {
      return DEFAULT_APP_PREFERENCES;
    }
  }

  async saveLocalAppPreferences(prefs: Partial<AppPreferences>): Promise<void> {
    const current = await this.getLocalAppPreferences();
    await AsyncStorage.setItem(
      STORAGE_KEYS.APP_PREFERENCES,
      JSON.stringify({ ...current, ...prefs })
    );
  }

  // Notification Settings
  async getLocalNotificationSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_SETTINGS + '_notifications');
      return stored ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) } : DEFAULT_NOTIFICATION_SETTINGS;
    } catch {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  async saveLocalNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    const current = await this.getLocalNotificationSettings();
    await AsyncStorage.setItem(
      STORAGE_KEYS.PROFILE_SETTINGS + '_notifications',
      JSON.stringify({ ...current, ...settings })
    );
  }

  // Scan Settings
  async getLocalScanSettings(): Promise<ScanSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_SETTINGS);
      return stored ? { ...DEFAULT_SCAN_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SCAN_SETTINGS;
    } catch {
      return DEFAULT_SCAN_SETTINGS;
    }
  }

  async saveLocalScanSettings(settings: Partial<ScanSettings>): Promise<void> {
    const current = await this.getLocalScanSettings();
    await AsyncStorage.setItem(
      STORAGE_KEYS.SCAN_SETTINGS,
      JSON.stringify({ ...current, ...settings })
    );
  }

  // Privacy Settings
  async getLocalPrivacySettings(): Promise<PrivacySettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_SETTINGS);
      return stored ? { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(stored) } : DEFAULT_PRIVACY_SETTINGS;
    } catch {
      return DEFAULT_PRIVACY_SETTINGS;
    }
  }

  async saveLocalPrivacySettings(settings: Partial<PrivacySettings>): Promise<void> {
    const current = await this.getLocalPrivacySettings();
    await AsyncStorage.setItem(
      STORAGE_KEYS.PRIVACY_SETTINGS,
      JSON.stringify({ ...current, ...settings })
    );
  }

  // Permission States
  async getLocalPermissionStates(): Promise<PermissionStates> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSION_STATES);
      return stored ? { ...DEFAULT_PERMISSION_STATES, ...JSON.parse(stored) } : DEFAULT_PERMISSION_STATES;
    } catch {
      return DEFAULT_PERMISSION_STATES;
    }
  }

  async saveLocalPermissionStates(states: Partial<PermissionStates>): Promise<void> {
    const current = await this.getLocalPermissionStates();
    await AsyncStorage.setItem(
      STORAGE_KEYS.PERMISSION_STATES,
      JSON.stringify({ ...current, ...states })
    );
  }

  // Health Integration
  async getLocalHealthIntegration(): Promise<HealthIntegrationSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_SETTINGS + '_health');
      return stored ? { ...DEFAULT_HEALTH_INTEGRATION, ...JSON.parse(stored) } : DEFAULT_HEALTH_INTEGRATION;
    } catch {
      return DEFAULT_HEALTH_INTEGRATION;
    }
  }

  async saveLocalHealthIntegration(settings: Partial<HealthIntegrationSettings>): Promise<void> {
    const current = await this.getLocalHealthIntegration();
    await AsyncStorage.setItem(
      STORAGE_KEYS.PROFILE_SETTINGS + '_health',
      JSON.stringify({ ...current, ...settings })
    );
  }

  // Security Settings
  async getLocalSecuritySettings(): Promise<SecuritySettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_SETTINGS + '_security');
      return stored ? { ...DEFAULT_SECURITY_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SECURITY_SETTINGS;
    } catch {
      return DEFAULT_SECURITY_SETTINGS;
    }
  }

  async saveLocalSecuritySettings(settings: Partial<SecuritySettings>): Promise<void> {
    const current = await this.getLocalSecuritySettings();
    await AsyncStorage.setItem(
      STORAGE_KEYS.PROFILE_SETTINGS + '_security',
      JSON.stringify({ ...current, ...settings })
    );
  }

  // Dev Settings
  async getLocalDevSettings(): Promise<DevSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DEV_SETTINGS);
      return stored ? { ...DEFAULT_DEV_SETTINGS, ...JSON.parse(stored) } : DEFAULT_DEV_SETTINGS;
    } catch {
      return DEFAULT_DEV_SETTINGS;
    }
  }

  async saveLocalDevSettings(settings: Partial<DevSettings>): Promise<void> {
    const current = await this.getLocalDevSettings();
    await AsyncStorage.setItem(
      STORAGE_KEYS.DEV_SETTINGS,
      JSON.stringify({ ...current, ...settings })
    );
  }

  // Admin Settings
  async getLocalAdminSettings(): Promise<AdminSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_SETTINGS);
      return stored ? { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(stored) } : DEFAULT_ADMIN_SETTINGS;
    } catch {
      return DEFAULT_ADMIN_SETTINGS;
    }
  }

  async saveLocalAdminSettings(settings: Partial<AdminSettings>): Promise<void> {
    const current = await this.getLocalAdminSettings();
    await AsyncStorage.setItem(
      STORAGE_KEYS.ADMIN_SETTINGS,
      JSON.stringify({ ...current, ...settings })
    );
  }

  // ============= ANDROID PERMISSIONS =============

  /**
   * Check and request Android permission
   */
  async checkAndroidPermission(
    permission: string
  ): Promise<'granted' | 'denied' | 'never_ask_again'> {
    if (Platform.OS !== 'android') {
      return 'granted';
    }

    try {
      const result = await PermissionsAndroid.check(permission as any);
      if (result) {
        return 'granted';
      }

      const requestResult = await PermissionsAndroid.request(permission as any);
      
      switch (requestResult) {
        case PermissionsAndroid.RESULTS.GRANTED:
          return 'granted';
        case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
          return 'never_ask_again';
        default:
          return 'denied';
      }
    } catch (error) {
      console.error('[ProfileService] Permission error:', error);
      return 'denied';
    }
  }

  /**
   * Check all Android permissions
   */
  async checkAllPermissions(): Promise<PermissionStates> {
    if (Platform.OS !== 'android') {
      return DEFAULT_PERMISSION_STATES;
    }

    const states: PermissionStates = { ...DEFAULT_PERMISSION_STATES };

    const permissionMap: Partial<Record<keyof PermissionStates, string>> = {
      camera: PermissionsAndroid.PERMISSIONS.CAMERA,
      microphone: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      storage: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      contacts: PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      location: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      location_background: PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      calendar: PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
      bluetooth: PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    };

    // Check Android 13+ permissions
    if (Platform.Version >= 33) {
      (permissionMap as any).notifications = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      (permissionMap as any).media_library = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
    }

    // Check Android 10+ activity recognition
    if (Platform.Version >= 29) {
      (permissionMap as any).activity_recognition = PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION;
    }

    // Check Android 9+ body sensors
    if (Platform.Version >= 28) {
      (permissionMap as any).body_sensors = PermissionsAndroid.PERMISSIONS.BODY_SENSORS;
    }

    for (const [key, permission] of Object.entries(permissionMap)) {
      if (permission) {
        try {
          const granted = await PermissionsAndroid.check(permission as any);
          states[key as keyof PermissionStates] = granted ? 'granted' : 'denied';
        } catch {
          states[key as keyof PermissionStates] = 'not_requested';
        }
      }
    }

    // Save states
    await this.saveLocalPermissionStates(states);
    
    return states;
  }

  /**
   * Request multiple Android permissions
   */
  async requestMultiplePermissions(
    permissions: (keyof PermissionStates)[]
  ): Promise<Partial<PermissionStates>> {
    if (Platform.OS !== 'android') {
      return {};
    }

    const permissionMap: Record<string, string> = {
      camera: PermissionsAndroid.PERMISSIONS.CAMERA,
      microphone: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      storage: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      contacts: PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      location: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      calendar: PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
    };

    const androidPermissions = permissions
      .map(p => permissionMap[p])
      .filter(Boolean);

    try {
      const results = await PermissionsAndroid.requestMultiple(androidPermissions as any);
      
      const states: Partial<PermissionStates> = {};
      for (const perm of permissions) {
        const androidPerm = permissionMap[perm];
        if (androidPerm && results[androidPerm]) {
          states[perm] = results[androidPerm] === PermissionsAndroid.RESULTS.GRANTED
            ? 'granted'
            : results[androidPerm] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
            ? 'never_ask_again'
            : 'denied';
        }
      }

      await this.saveLocalPermissionStates(states);
      return states;
    } catch (error) {
      console.error('[ProfileService] Error requesting permissions:', error);
      return {};
    }
  }

  // ============= DEVICE INFO =============

  /**
   * Get Android device information
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    if (Platform.OS !== 'android') {
      throw new Error('This method is only available on Android');
    }

    return {
      platform: 'android',
      os_version: Platform.Version.toString(),
      api_level: Platform.Version as number,
      device_model: 'Unknown', // Would need expo-device
      manufacturer: 'Unknown',
      app_version: Application.nativeApplicationVersion || '1.0.0',
      build_number: Application.nativeBuildVersion || '1',
      bundle_id: Application.applicationId || 'ai.wihy.health',
      is_emulator: false, // Would need expo-device
      screen_density: 'Unknown',
      total_memory: 0,
      supported_abis: [],
    };
  }

  // ============= DATA MANAGEMENT =============

  /**
   * Export all user data
   * GET /api/users/:userId/export
   */
  async exportUserData(userId: string): Promise<{ download_url: string }> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/users/${userId}/export`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to export data');
      }
      
      return { download_url: data.download_url };
    } catch (error) {
      console.error('[ProfileService] Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Clear all local data
   */
  async clearAllLocalData(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      this.cachedSettings = null;
    } catch (error) {
      console.error('[ProfileService] Error clearing local data:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    try {
      // Clear cached settings
      this.cachedSettings = null;
      
      // Clear any temporary data
      const cacheKeys = [
        '@wihy_cache_',
        '@wihy_temp_',
      ];
      
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(key => 
        cacheKeys.some(prefix => key.startsWith(prefix))
      );
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
    } catch (error) {
      console.error('[ProfileService] Error clearing cache:', error);
      throw error;
    }
  }

  // ============= PASSWORD & SECURITY =============

  /**
   * Change password
   * POST /api/users/:userId/change-password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/users/${userId}/change-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('[ProfileService] Error changing password:', error);
      throw error;
    }
  }

  /**
   * Enable/disable two-factor authentication
   * POST /api/users/:userId/2fa
   */
  async toggleTwoFactor(
    userId: string,
    enabled: boolean,
    verificationCode?: string
  ): Promise<{ secret?: string; qr_code_url?: string }> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/users/${userId}/2fa`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enabled,
            verification_code: verificationCode,
          }),
        }
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update 2FA');
      }
      
      return data;
    } catch (error) {
      console.error('[ProfileService] Error toggling 2FA:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();
