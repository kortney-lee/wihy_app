import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { authService, AuthState } from '../../services/authService';

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <circle cx="12" cy="16" r="1"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const HelpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <circle cx="12" cy="17" r="1"/>
  </svg>
);

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    onClose();
  };

  if (authState.isAuthenticated) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Account" maxWidth="320px">
        <div className="account-content">
          <div className="user-info">
            <div className="avatar large">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21a8 8 0 1 0-16 0"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <p className="user-name">{authState.user?.name}</p>
              <p className="user-email">{authState.user?.email}</p>
            </div>
          </div>

          <div className="account-menu">
            <button className="account-menu-item">
              <LockIcon />
              <span>Privacy Settings</span>
            </button>
            <button className="account-menu-item">
              <HelpIcon />
              <span>Help</span>
            </button>
            <button className="account-menu-item" onClick={handleSignOut}>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account" maxWidth="320px">
      <div className="account-content">
        <div className="account-buttons">
          <button 
            className="btn btn--primary btn--full"
            onClick={() => setShowSignIn(true)}
          >
            Sign In
          </button>
          <button className="btn btn--secondary btn--full">
            Create Account
          </button>
        </div>
        
        <div className="account-menu">
          <button className="account-menu-item">
            <LockIcon />
            <span>Privacy Settings</span>
          </button>
          <button className="account-menu-item">
            <HelpIcon />
            <span>Help</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AccountModal;