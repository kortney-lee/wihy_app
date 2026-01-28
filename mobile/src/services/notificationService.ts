import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';

const { SchedulableTriggerInputTypes } = Notifications;

/**
 * Push Notification Service
 * 
 * Handles:
 * - Push token registration
 * - Local notification scheduling
 * - Notification permissions
 * - Event handlers
 * - Badge management
 */

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  ios?: {
    status: Notifications.IosAuthorizationStatus;
    allowsAlert: boolean;
    allowsBadge: boolean;
    allowsSound: boolean;
  };
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  trigger: Notifications.NotificationTriggerInput;
}

export interface NotificationHandler {
  onReceived?: (notification: Notifications.Notification) => void;
  onResponseReceived?: (response: Notifications.NotificationResponse) => void;
}

export interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
}

export interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  meal_reminders: boolean;
  workout_reminders: boolean;
  water_reminders: boolean;
  medication_reminders: boolean;
  goal_updates: boolean;
  weekly_summary: boolean;
  coach_messages: boolean;
  community_messages: boolean;
  marketing: boolean;
  quiet_hours?: QuietHours;
}

// Backend reminder types for server-managed reminders
export interface BackendReminder {
  id?: string;
  userId: string;
  type: 'meal' | 'workout' | 'water' | 'medication' | 'weigh_in' | 'custom';
  title: string;
  body: string;
  time: string; // HH:MM format
  days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  enabled: boolean;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendRemindersResponse {
  reminders: BackendReminder[];
  total: number;
}

// Notification inbox types
export interface InboxNotification {
  id: string;
  type: 'goal_progress' | 'meal_reminder' | 'workout_reminder' | 'coach_message' | 'community' | 'system';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

export interface NotificationsInboxResponse {
  notifications: InboxNotification[];
  unread_count: number;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private pushToken: string | null = null;
  private listeners: Notifications.Subscription[] = [];
  private authToken: string | null = null;
  
  // User service base URL for notifications API
  private readonly userApiUrl = API_CONFIG.userUrl || 'https://user.wihy.ai';

  /**
   * Set auth token for API calls
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  /**
   * Initialize notification service
   * Sets up listeners and requests permissions
   */
  async initialize(userId?: string): Promise<void> {
    try {
      const { granted } = await this.requestPermissions();
      
      if (granted && userId) {
        const token = await this.registerForPushNotifications();
        if (token) {
          await this.registerTokenWithBackend(userId, token);
        }
      }
    } catch (error) {
      console.error('[NotificationService] Initialization failed:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      if (!Device.isDevice) {
        console.warn('[NotificationService] Push notifications only work on physical devices');
        return { granted: false, canAskAgain: false };
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (Platform.OS === 'ios') {
        const settings = await Notifications.getPermissionsAsync();
        return {
          granted: finalStatus === 'granted',
          canAskAgain: settings.canAskAgain,
          ios: {
            status: settings.ios?.status || 0,
            allowsAlert: settings.ios?.allowsAlert || false,
            allowsBadge: settings.ios?.allowsBadge || false,
            allowsSound: settings.ios?.allowsSound || false,
          },
        };
      }

      return {
        granted: finalStatus === 'granted',
        canAskAgain: true,
      };
    } catch (error) {
      console.error('[NotificationService] Permission request failed:', error);
      return { granted: false, canAskAgain: false };
    }
  }

  /**
   * Get current permission status without requesting
   */
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    try {
      const settings = await Notifications.getPermissionsAsync();
      
      if (Platform.OS === 'ios') {
        return {
          granted: settings.granted,
          canAskAgain: settings.canAskAgain,
          ios: {
            status: settings.ios?.status || 0,
            allowsAlert: settings.ios?.allowsAlert || false,
            allowsBadge: settings.ios?.allowsBadge || false,
            allowsSound: settings.ios?.allowsSound || false,
          },
        };
      }

      return {
        granted: settings.granted,
        canAskAgain: settings.canAskAgain,
      };
    } catch (error) {
      console.error('[NotificationService] Get permission status failed:', error);
      return { granted: false, canAskAgain: false };
    }
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('[NotificationService] Push tokens only available on physical devices');
        return null;
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: API_CONFIG.expoProjectId || 'your-project-id',
      });

      this.pushToken = token;
      
      // Android-specific channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3b82f6',
        });

        await Notifications.setNotificationChannelAsync('health-reminders', {
          name: 'Health Reminders',
          description: 'Reminders for meals, workouts, and hydration',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10b981',
        });

        await Notifications.setNotificationChannelAsync('coach-messages', {
          name: 'Coach Messages',
          description: 'Messages from your coach',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
        });
      }

      console.log('[NotificationService] Push token obtained:', token);
      return token;
    } catch (error) {
      console.error('[NotificationService] Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   * POST /api/notifications/token
   * Backend should store this for sending push notifications
   */
  private async registerTokenWithBackend(userId: string, token: string): Promise<void> {
    try {
      const response = await fetchWithLogging(`${this.userApiUrl}/api/notifications/token`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          token,
          platform: Platform.OS,
          device_id: Device.modelName || 'unknown',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register token with backend');
      }

      console.log('[NotificationService] Token registered with backend');
    } catch (error) {
      console.error('[NotificationService] Backend token registration failed:', error);
      // Don't throw - local notifications will still work
    }
  }

  /**
   * Unregister push token (when user logs out or disables notifications)
   * DELETE /api/notifications/token
   */
  async unregisterPushToken(userId: string): Promise<void> {
    try {
      if (!this.pushToken) return;

      await fetchWithLogging(`${this.userApiUrl}/api/notifications/token`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          token: this.pushToken,
        }),
      });

      this.pushToken = null;
      console.log('[NotificationService] Token unregistered');
    } catch (error) {
      console.error('[NotificationService] Failed to unregister token:', error);
    }
  }

  // ============= NOTIFICATION PREFERENCES (BACKEND) =============

  /**
   * Get notification preferences from backend
   * GET /api/notifications/preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const response = await fetchWithLogging(
        `${this.userApiUrl}/api/notifications/preferences`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get preferences');
      }
      
      return data.data;
    } catch (error) {
      console.error('[NotificationService] Failed to get preferences:', error);
      // Return defaults
      return {
        push_enabled: true,
        email_enabled: true,
        meal_reminders: true,
        workout_reminders: true,
        water_reminders: true,
        medication_reminders: false,
        goal_updates: true,
        weekly_summary: true,
        coach_messages: true,
        community_messages: true,
        marketing: false,
      };
    }
  }

  /**
   * Update notification preferences on backend
   * PUT /api/notifications/preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const response = await fetchWithLogging(
        `${this.userApiUrl}/api/notifications/preferences`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(preferences),
        }
      );
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update preferences');
      }
      
      return data.data;
    } catch (error) {
      console.error('[NotificationService] Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Toggle push notifications
   */
  async togglePushNotifications(userId: string, enabled: boolean): Promise<void> {
    await this.updateNotificationPreferences(userId, { push_enabled: enabled });
  }

  /**
   * Set quiet hours
   */
  async setQuietHours(userId: string, quietHours: QuietHours): Promise<void> {
    await this.updateNotificationPreferences(userId, { quiet_hours: quietHours });
  }

  // ============= BACKEND REMINDERS CRUD =============

  /**
   * Create a reminder on the backend
   * POST /api/notifications/reminders
   */
  async createReminder(
    userId: string,
    reminder: Omit<BackendReminder, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<BackendReminder> {
    try {
      const response = await fetchWithLogging(
        `${this.userApiUrl}/api/notifications/reminders`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            userId,
            type: reminder.type,
            title: reminder.title,
            time: reminder.time,
            days: reminder.days,
            enabled: reminder.enabled,
          }),
        }
      );
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create reminder');
      }
      
      return data.data;
    } catch (error) {
      console.error('[NotificationService] Failed to create reminder:', error);
      throw error;
    }
  }

  /**
   * Get all reminders for a user
   * GET /api/notifications/reminders?userId=xxx
   */
  async getReminders(userId: string): Promise<BackendRemindersResponse> {
    try {
      const response = await fetchWithLogging(
        `${this.userApiUrl}/api/notifications/reminders?userId=${userId}`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get reminders');
      }
      
      return {
        reminders: data.data || [],
        total: data.data?.length || 0,
      };
    } catch (error) {
      console.error('[NotificationService] Failed to get reminders:', error);
      return { reminders: [], total: 0 };
    }
  }

  /**
   * Update a reminder
   * PUT /api/notifications/reminders/:id
   */
  async updateReminder(
    reminderId: string,
    updates: Partial<Omit<BackendReminder, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<BackendReminder> {
    try {
      const response = await fetchWithLogging(
        `${this.userApiUrl}/api/notifications/reminders/${reminderId}`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(updates),
        }
      );
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update reminder');
      }
      
      return data.data;
    } catch (error) {
      console.error('[NotificationService] Failed to update reminder:', error);
      throw error;
    }
  }

  /**
   * Delete a reminder
   * DELETE /api/notifications/reminders/:id
   */
  async deleteReminder(reminderId: string): Promise<void> {
    try {
      const response = await fetchWithLogging(
        `${this.userApiUrl}/api/notifications/reminders/${reminderId}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to delete reminder');
      }
      
      console.log('[NotificationService] Reminder deleted:', reminderId);
    } catch (error) {
      console.error('[NotificationService] Failed to delete reminder:', error);
      throw error;
    }
  }

  /**
   * Toggle a reminder on/off
   * PATCH /api/notifications/reminders/:reminderId/toggle
   */
  async toggleReminder(reminderId: string, enabled: boolean): Promise<BackendReminder> {
    return this.updateReminder(reminderId, { enabled });
  }

  // ============= NOTIFICATION INBOX =============

  /**
   * Get notifications inbox
   * GET /api/notifications
   */
  async getNotifications(options?: {
    unread?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationsInboxResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.unread !== undefined) {
        params.append('unread', String(options.unread));
      }
      if (options?.limit) {
        params.append('limit', String(options.limit));
      }
      if (options?.offset) {
        params.append('offset', String(options.offset));
      }

      const queryString = params.toString();
      const url = `${this.userApiUrl}/api/notifications${queryString ? `?${queryString}` : ''}`;

      const response = await fetchWithLogging(url, {
        headers: this.getAuthHeaders(),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get notifications');
      }

      return {
        notifications: data.data?.notifications || [],
        unread_count: data.data?.unread_count || 0,
      };
    } catch (error) {
      console.error('[NotificationService] Failed to get notifications:', error);
      return { notifications: [], unread_count: 0 };
    }
  }

  /**
   * Mark a notification as read
   * PUT /api/notifications/:id/read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const response = await fetchWithLogging(
        `${this.userApiUrl}/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      console.log('[NotificationService] Notification marked as read:', notificationId);
    } catch (error) {
      console.error('[NotificationService] Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   */
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      const response = await fetchWithLogging(
        `${this.userApiUrl}/api/notifications/read-all`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      console.log('[NotificationService] All notifications marked as read');
    } catch (error) {
      console.error('[NotificationService] Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await fetchWithLogging(
        `${this.userApiUrl}/api/notifications/unread-count`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get unread count');
      }

      return data.unread_count || 0;
    } catch (error) {
      console.error('[NotificationService] Failed to get unread count:', error);
      return 0;
    }
  }

  // ============= LOCAL NOTIFICATIONS =============

  /**
   * Schedule a local notification
   */
  async scheduleNotification(notification: Omit<ScheduledNotification, 'id'>): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: true,
        },
        trigger: notification.trigger,
      });

      console.log('[NotificationService] Notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('[NotificationService] Notification cancelled:', notificationId);
    } catch (error) {
      console.error('[NotificationService] Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[NotificationService] All notifications cancelled');
    } catch (error) {
      console.error('[NotificationService] Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[NotificationService] Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Set up notification event listeners
   */
  setupListeners(handlers: NotificationHandler): void {
    // Clean up existing listeners
    this.removeListeners();

    // Notification received while app is in foreground
    if (handlers.onReceived) {
      const receivedListener = Notifications.addNotificationReceivedListener(handlers.onReceived);
      this.listeners.push(receivedListener);
    }

    // Notification tapped/responded to
    if (handlers.onResponseReceived) {
      const responseListener = Notifications.addNotificationResponseReceivedListener(handlers.onResponseReceived);
      this.listeners.push(responseListener);
    }
  }

  /**
   * Remove all notification listeners
   */
  removeListeners(): void {
    this.listeners.forEach(listener => listener.remove());
    this.listeners = [];
  }

  /**
   * Set badge count (iOS only)
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('[NotificationService] Failed to set badge count:', error);
    }
  }

  /**
   * Clear badge (iOS only)
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Present local notification immediately
   */
  async presentNotification(title: string, body: string, data?: any): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });

      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Failed to present notification:', error);
      throw error;
    }
  }

  // ============= PRESET NOTIFICATION HELPERS =============

  /**
   * Schedule daily meal reminder
   */
  async scheduleMealReminder(mealType: 'breakfast' | 'lunch' | 'dinner', hour: number, minute: number = 0): Promise<string> {
    return this.scheduleNotification({
      title: `Time for ${mealType}! 🍽️`,
      body: `Don't forget to log your ${mealType} to stay on track`,
      data: { type: 'meal-reminder', mealType },
      trigger: {
        type: SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
  }

  /**
   * Schedule daily workout reminder
   */
  async scheduleWorkoutReminder(hour: number, minute: number = 0): Promise<string> {
    return this.scheduleNotification({
      title: 'Workout Time! 💪',
      body: "Time to crush today's workout. Let's get it!",
      data: { type: 'workout-reminder' },
      trigger: {
        type: SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
  }

  /**
   * Schedule hydration reminders (every 2 hours during the day)
   */
  async scheduleHydrationReminders(): Promise<string[]> {
    const reminders: string[] = [];
    
    // 8am, 10am, 12pm, 2pm, 4pm, 6pm, 8pm
    const hours = [8, 10, 12, 14, 16, 18, 20];
    
    for (const hour of hours) {
      const id = await this.scheduleNotification({
        title: 'Stay Hydrated! 💧',
        body: 'Time to drink some water',
        data: { type: 'hydration-reminder' },
        trigger: {
          type: SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute: 0,
          repeats: true,
        },
      });
      reminders.push(id);
    }

    return reminders;
  }

  /**
   * Schedule weekly weigh-in reminder
   */
  async scheduleWeighInReminder(weekday: number = 1, hour: number = 7): Promise<string> {
    // weekday: 1 = Sunday, 2 = Monday, etc.
    return this.scheduleNotification({
      title: 'Weekly Weigh-In 📊',
      body: 'Time to record your weight for this week',
      data: { type: 'weigh-in-reminder' },
      trigger: {
        type: SchedulableTriggerInputTypes.CALENDAR,
        weekday,
        hour,
        minute: 0,
        repeats: true,
      },
    });
  }

  /**
   * Send coach message notification (from backend)
   * This would typically be triggered by backend push
   */
  async notifyCoachMessage(coachName: string, message: string): Promise<string> {
    return this.presentNotification(
      `Message from ${coachName}`,
      message,
      { type: 'coach-message', coachName }
    );
  }

  /**
   * Notify about scan results
   */
  async notifyScanComplete(productName: string, healthScore: number): Promise<string> {
    const emoji = healthScore >= 80 ? '✅' : healthScore >= 60 ? '⚠️' : '❌';
    return this.presentNotification(
      `Scan Complete ${emoji}`,
      `${productName} - Health Score: ${healthScore}`,
      { type: 'scan-complete', productName, healthScore }
    );
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }
}

export const notificationService = new NotificationService();
