export interface Notification {
  id: string;
  title: string;
  text: string;
  time: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
}

class NotificationService {
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private notifications: Notification[] = [
    {
      id: '1',
      title: 'Daily Step Goal Achieved!',
      text: "You've reached your 10,000 step goal for today.",
      time: '2 hours ago',
      read: false,
      type: 'success'
    },
    {
      id: '2',
      title: 'Weight Update Reminder',
      text: "Don't forget to log your weight for this week.",
      time: '1 day ago',
      read: false,
      type: 'info'
    },
    {
      id: '3',
      title: 'Hydration Goal',
      text: "You're 0.7L away from your daily hydration goal.",
      time: '3 hours ago',
      read: true,
      type: 'warning'
    }
  ];

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
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

  addNotification(notification: Omit<Notification, 'id'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
    };
    this.notifications = [newNotification, ...this.notifications];
    this.listeners.forEach(listener => listener(this.notifications));
  }
}

export const notificationService = new NotificationService();