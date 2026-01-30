import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from './Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { dashboardTheme } from '../../theme/dashboardTheme';
import { notificationService } from '../../services';

export interface NotificationSummary {
  unreadMessages: number;
  pendingReminders: number;
  upcomingReminders: number;
  totalUnread: number;
}

interface NotificationTileProps {
  userId?: string;
  onPress?: () => void;
  onViewMessages?: () => void;
  onViewReminders?: () => void;
  compact?: boolean;
  style?: any;
}

/**
 * NotificationTile - Dashboard tile showing notification summary
 * 
 * Displays:
 * - Unread message count
 * - Pending/upcoming reminders
 * - Quick access to notifications
 */
export const NotificationTile: React.FC<NotificationTileProps> = ({
  userId,
  onPress,
  onViewMessages,
  onViewReminders,
  compact = false,
  style,
}) => {
  const { theme } = useTheme();
  const [summary, setSummary] = useState<NotificationSummary>({
    unreadMessages: 0,
    pendingReminders: 0,
    upcomingReminders: 0,
    totalUnread: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Pulse animation for new notifications
  useEffect(() => {
    if (summary.totalUnread > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [summary.totalUnread, pulseAnim]);

  const loadNotificationSummary = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      // Load reminders (messaging unread count endpoint removed - not available)
      let pendingReminders = 0;
      let upcomingReminders = 0;
      try {
        const remindersResponse = await notificationService.getReminders(userId);
        const enabledReminders = remindersResponse.reminders.filter(r => r.enabled);
        upcomingReminders = enabledReminders.length;
        
        // Count reminders scheduled for today
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
        
        pendingReminders = enabledReminders.filter(reminder => {
          if (!reminder.days.includes(currentDay as any)) return false;
          const [reminderHour, reminderMinute] = reminder.time.split(':').map(Number);
          // Reminder is pending if it's later today
          return reminderHour > currentHour || 
                 (reminderHour === currentHour && reminderMinute > currentMinute);
        }).length;
      } catch (e) {
        console.log('[NotificationTile] Reminders not available');
      }

      // Get scheduled local notifications count
      let scheduledNotifications = 0;
      try {
        const scheduled = await notificationService.getScheduledNotifications();
        scheduledNotifications = scheduled.length;
      } catch (e) {
        console.log('[NotificationTile] Local notifications not available');
      }

      setSummary({
        unreadMessages: 0,
        pendingReminders,
        upcomingReminders: upcomingReminders + scheduledNotifications,
        totalUnread: pendingReminders,
      });
    } catch (error) {
      console.error('[NotificationTile] Failed to load summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNotificationSummary();
    
    // Refresh every 60 seconds
    const interval = setInterval(loadNotificationSummary, 60000);
    return () => clearInterval(interval);
  }, [loadNotificationSummary]);

  const hasNotifications = summary.totalUnread > 0;

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Animated.View style={[
          styles.compactIconContainer,
          hasNotifications && { transform: [{ scale: pulseAnim }] }
        ]}>
          <Ionicons 
            name="notifications" 
            size={24} 
            color={hasNotifications ? theme.colors.primary : theme.colors.textSecondary} 
          />
          {hasNotifications && (
            <View style={styles.compactBadge}>
              <Text style={styles.compactBadgeText}>
                {summary.totalUnread > 99 ? '99+' : summary.totalUnread}
              </Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <Animated.View style={[
            styles.iconContainer,
            hasNotifications && { transform: [{ scale: pulseAnim }] }
          ]}>
            <Ionicons 
              name="notifications" 
              size={28} 
              color={theme.colors.primary} 
            />
          </Animated.View>
          {hasNotifications && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {summary.totalUnread > 99 ? '99+' : summary.totalUnread}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {isLoading ? 'Loading...' : 
             hasNotifications ? `${summary.totalUnread} new` : 'All caught up!'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>

      {!isLoading && (
        <View style={styles.statsContainer}>
          {/* Messages */}
          <TouchableOpacity 
            style={styles.statItem}
            onPress={onViewMessages}
            activeOpacity={0.7}
          >
            <View style={[styles.statIcon, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="chatbubble" size={16} color="#3b82f6" />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{summary.unreadMessages}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Messages</Text>
            </View>
          </TouchableOpacity>

          {/* Today's Reminders */}
          <TouchableOpacity 
            style={styles.statItem}
            onPress={onViewReminders}
            activeOpacity={0.7}
          >
            <View style={[styles.statIcon, { backgroundColor: '#f5970620' }]}>
              <Ionicons name="alarm" size={16} color="#f59706" />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{summary.pendingReminders}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Today</Text>
            </View>
          </TouchableOpacity>

          {/* Scheduled */}
          <TouchableOpacity 
            style={styles.statItem}
            onPress={onViewReminders}
            activeOpacity={0.7}
          >
            <View style={[styles.statIcon, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="calendar" size={16} color="#10b981" />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{summary.upcomingReminders}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Scheduled</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: dashboardTheme.borderRadius.lg,
    padding: dashboardTheme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'relative',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: dashboardTheme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: dashboardTheme.colors.error,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: dashboardTheme.colors.surface,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  titleContainer: {
    flex: 1,
    marginLeft: dashboardTheme.spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: dashboardTheme.colors.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: dashboardTheme.spacing.md,
    paddingTop: dashboardTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.colors.border,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    marginLeft: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: dashboardTheme.colors.textSecondary,
  },
  // Compact styles
  compactContainer: {
    position: 'relative',
    padding: 8,
  },
  compactIconContainer: {
    position: 'relative',
  },
  compactBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: dashboardTheme.colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  compactBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default NotificationTile;
