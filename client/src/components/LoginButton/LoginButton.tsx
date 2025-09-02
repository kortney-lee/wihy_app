// src/components/LoginButton/LoginButton.tsx
import React, { useState, useEffect, useRef } from 'react';
import './LoginButton.css';

interface LoginButtonProps {
  position?: 'top-right' | 'inline';
  onLogin?: () => void;
  className?: string;
}

const LoginButton: React.FC<LoginButtonProps> = ({ 
  position = 'top-right',
  onLogin,
  className = ''
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showDropdown && 
          buttonRef.current && 
          dropdownRef.current &&
          !buttonRef.current.contains(event.target as Node) && 
          !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);
  
  const handleLoginClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Add this line
    if (onLogin) {
      onLogin();
    } else {
      setShowDropdown(!showDropdown);
    }
  };
  
  const handleActionClick = (action: string) => {
    console.log(`${action} clicked`);
    setShowDropdown(false);
    // Implement actual actions here
  };
  
  return (
    <div className={`login-button-container ${position} ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className="login-icon"
        onClick={handleLoginClick}
        aria-label="User Login"
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </button>
      
      {showDropdown && (
        <div 
          ref={dropdownRef}
          className="login-dropdown" 
          role="menu"
          aria-orientation="vertical"
        >
          <div className="login-dropdown-header">
            <h3>Account</h3>
            <button 
              onClick={() => setShowDropdown(false)}
              className="close-dropdown"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          <div className="login-dropdown-content">
            <button 
              className="login-action-button"
              onClick={() => handleActionClick('sign-in')}
            >
              Sign In
            </button>
            <button 
              className="login-action-button secondary"
              onClick={() => handleActionClick('create-account')}
            >
              Create Account
            </button>
            <hr />
            <div className="login-options">
              <button 
                className="login-option"
                onClick={() => handleActionClick('privacy')}
              >
                <span className="option-icon">🔒</span>
                <span>Privacy Settings</span>
              </button>
              <button 
                className="login-option"
                onClick={() => handleActionClick('help')}
              >
                <span className="option-icon">❓</span>
                <span>Help</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginButton;