import React, { useState, useEffect } from 'react';
import { useModal } from '../services/modalService';
import { notificationService } from '../services/notificationService';
import { authService, AuthState } from '../services/authService';
import NotificationModal from './modals/NotificationModal';
import AccountModal from './modals/AccountModal';

const Icon = {
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5"/>
      <path d="M9 17a3 3 0 0 0 6 0"/>
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21a8 8 0 1 0-16 0"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
};

const Header: React.FC = () => {
  const modal = useModal();
  const [unreadCount, setUnreadCount] = useState(0);
  const [authState, setAuthState] = useState<AuthState>(authService.getState());

  useEffect(() => {
    const unsubscribeNotifications = notificationService.subscribe(() => {
      setUnreadCount(notificationService.getUnreadCount());
    });
    
    const unsubscribeAuth = authService.subscribe(setAuthState);
    
    setUnreadCount(notificationService.getUnreadCount());
    authService.checkAuth();

    return () => {
      unsubscribeNotifications();
      unsubscribeAuth();
    };
  }, []);

  return (
    <>
      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <div>
            <img 
              src="/assets/293a2ef6-826c-4ec9-9b26-c2abf3bb894f.png" 
              alt="vHealth Logo" 
              style={{ 
                height: '40px', 
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
          <div className="header-right">
            <button 
              className="header-icon-btn"
              onClick={modal.openNotifications}
              style={{ position: 'relative' }}
            >
              <Icon.Bell />
              {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
            </button>
            <button 
              className="header-user-btn"
              onClick={modal.openAccount}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <div className="avatar">
                <Icon.User />
              </div>
              <span style={{ fontWeight: 600, color: '#334155' }}>
                {authState.user?.name || 'User'}
              </span>
            </button>
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