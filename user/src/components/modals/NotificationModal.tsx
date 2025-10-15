import React, { useState, useEffect } from 'react';
import { notificationService, Notification } from '../../services/notificationService';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = notificationService.subscribe(setNotifications);
      return unsubscribe;
    }
  }, [isOpen]);

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleDeleteNotification = (id: string) => {
    notificationService.deleteNotification(id);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="notification-modal" onClick={onClose}>
      <div className="notification-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notification-header">
          <h2 className="notification-title">Notifications</h2>
          <button className="notification-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="notification-controls">
          <span className="notification-count">
            {unreadCount} unread
          </span>
          <button 
            className="mark-all-read-btn"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>
        </div>

        {/* Notification List */}
        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="notification-empty">
              <div className="notification-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h3 className="notification-empty-title">No notifications</h3>
              <p className="notification-empty-text">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="notification-item-header">
                  <h4 className="notification-item-title">
                    {notification.title}
                  </h4>
                  <span className="notification-time">
                    {notification.time}
                  </span>
                </div>
                <p className="notification-item-text">
                  {notification.text}
                </p>
                <div className="notification-actions">
                  {!notification.read && (
                    <button 
                      className="notification-action-btn primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                    >
                      Mark as read
                    </button>
                  )}
                  <button 
                    className="notification-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;