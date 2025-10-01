import React, { useState, useEffect } from 'react';
import { useModal } from '../services/modalService';
import { notificationService } from '../services/notificationService';
import MultiAuthLogin from './MultiAuthLogin';
import NotificationModal from './modals/NotificationModal';
import AccountModal from './modals/AccountModal';

const Icon = {
  Bell: () => (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  User: () => (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
};

const Header: React.FC = () => {
  const modal = useModal();
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const unsubscribeNotifications = notificationService.subscribe(() => {
      setUnreadCount(notificationService.getUnreadCount());
    });
    
    setUnreadCount(notificationService.getUnreadCount());

    return () => {
      unsubscribeNotifications();
    };
  }, []);

  const handleLogoError = () => {
    setLogoError(true);
  };

  return (
    <>
      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          {/* Logo */}
          <div className="header-logo">
            {!logoError ? (
              <img 
                src="/assets/whatishealthylogo.png" 
                alt="What is Healthy?" 
                onError={handleLogoError}
              />
            ) : (
              <h1 style={{ 
                margin: 0, 
                fontSize: '24px', 
                fontWeight: 600, 
                color: '#1f2937',
                fontFamily: 'inherit'
              }}>
                What is Healthy?
              </h1>
            )}
          </div>
          
          <div className="header-right">
            {/* Enhanced Notifications Bell */}
            <button 
              className="header-icon-btn"
              onClick={modal.openNotifications}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              title={`Notifications${unreadCount > 0 ? ` - ${unreadCount} unread` : ''}`}
            >
              <Icon.Bell />
              {unreadCount > 0 && (
                <span className="badge-dot">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* User Authentication */}
            <div className="header-auth-wrapper">
              <MultiAuthLogin />
            </div>
          </div>
        </div>
      </header>

      <NotificationModal 
        isOpen={modal.showNotifications} 
        onClose={modal.closeNotifications} 
      />
      <AccountModal 
        isOpen={modal.showAccount} 
        onClose={modal.closeAccount} 
      />
    </>
  );
};

export default Header;