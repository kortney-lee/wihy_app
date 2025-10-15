export interface Notification {
  id: string;
  title: string;
  text: string;
  time: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: 'health' | 'fitness' | 'nutrition' | 'medication' | 'appointment';
  priority?: 'low' | 'medium' | 'high';
}

// Create a type for creating new notifications
export interface CreateNotificationInput {
  title: string;
  text: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: 'health' | 'fitness' | 'nutrition' | 'medication' | 'appointment';
  priority?: 'low' | 'medium' | 'high';
  time?: string;
  read?: boolean;
}

class NotificationService {
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private notifications: Notification[] = [
    {
      id: '1',
      title: '🎯 Daily Step Goal Achieved!',
      text: "Congratulations! You've crushed your 10,000 step goal for today. Keep up the great work!",
      time: '2 hours ago',
      read: false,
      type: 'success',
      category: 'fitness',
      priority: 'medium'
    },
    {
      id: '2',
      title: '⚖️ Weekly Weight Check-in',
      text: "It's time for your weekly weigh-in. Tracking your progress helps you stay on track with your health goals.",
      time: '1 day ago',
      read: false,
      type: 'info',
      category: 'health',
      priority: 'low'
    },
    {
      id: '3',
      title: '💧 Hydration Reminder',
      text: "You're only 0.7L away from your daily hydration goal! Grab a glass of water to finish strong.",
      time: '3 hours ago',
      read: true,
      type: 'warning',
      category: 'health',
      priority: 'medium'
    },
    {
      id: '4',
      title: '🍎 Nutrition Analysis Complete',
      text: "Your lunch photo has been analyzed. The meal contains 420 calories with balanced macros - great choice!",
      time: '4 hours ago',
      read: false,
      type: 'success',
      category: 'nutrition',
      priority: 'low'
    },
    {
      id: '5',
      title: '🏃‍♂️ Weekly Activity Summary',
      text: "You were active for 6.2 hours this week - that's 24% above your goal! Your consistency is paying off.",
      time: '2 days ago',
      read: true,
      type: 'info',
      category: 'fitness',
      priority: 'low'
    },
    {
      id: '6',
      title: '💊 Medication Reminder',
      text: "Don't forget to take your vitamin D supplement. It's been 2 days since your last dose.",
      time: '5 hours ago',
      read: false,
      type: 'warning',
      category: 'medication',
      priority: 'high'
    },
    {
      id: '7',
      title: '📅 Upcoming Doctor Appointment',
      text: "Reminder: You have a check-up appointment with Dr. Smith tomorrow at 2:00 PM.",
      time: '6 hours ago',
      read: false,
      type: 'info',
      category: 'appointment',
      priority: 'high'
    },
    {
      id: '8',
      title: '🔥 Streak Alert!',
      text: "Amazing! You're on a 7-day streak of meeting your daily activity goals. Don't break it now!",
      time: '1 day ago',
      read: true,
      type: 'success',
      category: 'fitness',
      priority: 'medium'
    },
    {
      id: '9',
      title: '🥗 Meal Planning Suggestion',
      text: "Based on your recent nutrition data, we recommend adding more leafy greens to boost your iron intake.",
      time: '8 hours ago',
      read: false,
      type: 'info',
      category: 'nutrition',
      priority: 'low'
    },
    {
      id: '10',
      title: '❤️ Heart Rate Zone Achievement',
      text: "You spent 45 minutes in your target heart rate zone during today's workout - excellent cardio session!",
      time: '5 hours ago',
      read: true,
      type: 'success',
      category: 'fitness',
      priority: 'medium'
    },
    {
      id: '11',
      title: '😴 Sleep Quality Update',
      text: "Your sleep quality last night was 82% - great improvement from last week's average of 74%!",
      time: '12 hours ago',
      read: false,
      type: 'success',
      category: 'health',
      priority: 'low'
    },
    {
      id: '12',
      title: '🚨 Health Alert',
      text: "Your blood pressure reading from yesterday (145/92) is higher than normal. Consider consulting your doctor.",
      time: '1 day ago',
      read: false,
      type: 'error',
      category: 'health',
      priority: 'high'
    }
  ];

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.notifications); // Immediately call with current notifications
    return () => {
      this.listeners.delete(listener);
    };
  }

  getNotifications(): Notification[] {
    return [...this.notifications].sort((a, b) => {
      // Sort by: unread first, then by priority, then by time
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }
      
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'low'];
      const bPriority = priorityOrder[b.priority || 'low'];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Sort by time (newer first) - you'd want to parse actual timestamps in a real app
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getNotificationsByCategory(category: string): Notification[] {
    return this.notifications.filter(n => n.category === category);
  }

  getNotificationsByType(type: string): Notification[] {
    return this.notifications.filter(n => n.type === type);
  }

  getHighPriorityNotifications(): Notification[] {
    return this.notifications.filter(n => n.priority === 'high' && !n.read);
  }

  markAsRead(id: string): void {
    this.notifications = this.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this.listeners.forEach(listener => listener(this.notifications));
  }

  markAllAsRead(): void {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.listeners.forEach(listener => listener(this.notifications));
  }

  deleteNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Updated addNotification method with better type handling
  addNotification(notification: CreateNotificationInput): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      time: notification.time || 'Just now',
      read: notification.read || false,
      type: notification.type || 'info',
      category: notification.category || 'health',
      priority: notification.priority || 'low'
    };
    this.notifications = [newNotification, ...this.notifications];
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Utility methods for creating specific types of notifications
  addHealthAlert(title: string, text: string): void {
    this.addNotification({
      title: `🚨 ${title}`,
      text,
      type: 'error',
      category: 'health',
      priority: 'high'
    });
  }

  addFitnessAchievement(title: string, text: string): void {
    this.addNotification({
      title: `🎯 ${title}`,
      text,
      type: 'success',
      category: 'fitness',
      priority: 'medium'
    });
  }

  addNutritionInsight(title: string, text: string): void {
    this.addNotification({
      title: `🍎 ${title}`,
      text,
      type: 'info',
      category: 'nutrition',
      priority: 'low'
    });
  }

  addMedicationReminder(title: string, text: string): void {
    this.addNotification({
      title: `💊 ${title}`,
      text,
      type: 'warning',
      category: 'medication',
      priority: 'high'
    });
  }

  addAppointmentReminder(title: string, text: string): void {
    this.addNotification({
      title: `📅 ${title}`,
      text,
      type: 'info',
      category: 'appointment',
      priority: 'high'
    });
  }

  // Simulate real-time notifications (for demo purposes)
  simulateRealTimeNotifications(): void {
    const demoNotifications: CreateNotificationInput[] = [
      {
        title: '💧 Hydration Check',
        text: "You haven't logged water intake in 2 hours. Stay hydrated!",
        type: 'warning',
        category: 'health',
        priority: 'medium'
      },
      {
        title: '👟 Step Goal Progress',
        text: "You're 70% towards your daily step goal. A short walk could get you there!",
        type: 'info',
        category: 'fitness',
        priority: 'low'
      },
      {
        title: '🍽️ Meal Logged Successfully',
        text: "Your dinner has been analyzed: 580 calories, high in protein and fiber.",
        type: 'success',
        category: 'nutrition',
        priority: 'low'
      }
    ];

    // Add a random notification every 30 seconds (for demo)
    setTimeout(() => {
      const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
      this.addNotification(randomNotification);
      
      // Schedule next notification
      if (this.notifications.length < 20) { // Limit to prevent spam
        this.simulateRealTimeNotifications();
      }
    }, 30000);
  }

  // Get statistics about notifications
  getNotificationStats() {
    const total = this.notifications.length;
    const unread = this.getUnreadCount();
    const byType = {
      success: this.notifications.filter(n => n.type === 'success').length,
      info: this.notifications.filter(n => n.type === 'info').length,
      warning: this.notifications.filter(n => n.type === 'warning').length,
      error: this.notifications.filter(n => n.type === 'error').length
    };
    const byCategory = {
      health: this.getNotificationsByCategory('health').length,
      fitness: this.getNotificationsByCategory('fitness').length,
      nutrition: this.getNotificationsByCategory('nutrition').length,
      medication: this.getNotificationsByCategory('medication').length,
      appointment: this.getNotificationsByCategory('appointment').length
    };

    return {
      total,
      unread,
      read: total - unread,
      byType,
      byCategory,
      highPriority: this.getHighPriorityNotifications().length
    };
  }
}

export const notificationService = new NotificationService();

// Auto-start demo notifications in development
if (process.env.NODE_ENV === 'development') {
  // Wait a bit before starting demo notifications
  setTimeout(() => {
    notificationService.simulateRealTimeNotifications();
  }, 10000);
}