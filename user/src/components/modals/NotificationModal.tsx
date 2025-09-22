import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { notificationService, Notification } from '../../services/notificationService';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    setNotifications(notificationService.getNotifications());
    return unsubscribe;
  }, []);

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notifications" maxWidth="420px">
      <div className="notification-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span className="text-sm text-gray-600">
            {notificationService.getUnreadCount()} unread
          </span>
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        </div>
        
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            onClick={() => !notification.read && handleMarkAsRead(notification.id)}
          >
            {!notification.read && <div className="notification-dot"></div>}
            <div>
              <p className="notification-title">{notification.title}</p>
              <p className="notification-text">{notification.text}</p>
              <span className="notification-time">{notification.time}</span>
            </div>
          </div>
        ))}
        
        {notifications.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No notifications yet
          </div>
        )}
      </div>
    </Modal>
  );
};

export default NotificationModal;