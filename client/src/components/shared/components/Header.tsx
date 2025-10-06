/* filepath: c:\vHealth\vhealth\client\src\components\shared\components\Header.tsx */
import React, { useState, useRef } from 'react';
import MultiAuthLogin from './MultiAuthLogin';

interface HeaderProps {
  searchQuery?: string;
  onSearchSubmit?: (query: string) => void;
  onVoiceInput?: () => void;
  onImageUpload?: () => void;
  onLogoClick?: () => void;
  isListening?: boolean;
  showSearchInput?: boolean;
  variant?: 'landing' | 'results';
  className?: string;
  showLogin?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  searchQuery = '',
  onSearchSubmit,
  onVoiceInput,
  onImageUpload,
  onLogoClick,
  isListening = false,
  showSearchInput = true,
  variant = 'landing',
  className = '',
  showLogin = true
}) => {
  const [input, setInput] = useState(searchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && onSearchSubmit) {
      onSearchSubmit(input.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    }
  };

  const headerClasses = `vhealth-header ${variant} ${className}`.trim();

  return (
    <header className={headerClasses}>
      {/* Logo Section */}
      <div className="vhealth-logo-container">
        <img
          src="/assets/wihylogo.png"
          alt="What is Healthy?"
          className={`vhealth-logo ${variant}-logo`}
          onClick={handleLogoClick}
          style={{ cursor: onLogoClick ? 'pointer' : 'default' }}
        />
      </div>

      {/* Search Input Section */}
      {showSearchInput && (
        <div className="vhealth-search-section">
          <form className="vhealth-search-form" onSubmit={handleSubmit}>
            <div className="search-input-container">
              <input
                ref={searchInputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything about health..."
                className="search-input"
              />
              
              <div className="search-icons">
                {/* Camera/Upload Icon */}
                {onImageUpload && (
                  <button
                    type="button"
                    className="icon-button"
                    onClick={onImageUpload}
                    title="Upload image"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM7.5 9l4-2.5V9L7.5 9zm5 7.5V14l4 2.5-4 2.5zm5-7.5L13.5 6.5v3L17.5 9z"/>
                    </svg>
                  </button>
                )}

                {/* Voice Icon */}
                {onVoiceInput && (
                  <button
                    type="button"
                    className={`icon-button ${isListening ? 'listening' : ''}`}
                    onClick={onVoiceInput}
                    title="Voice search"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                    </svg>
                  </button>
                )}

                {/* Clear button (if there's text) */}
                {input && (
                  <button
                    type="button"
                    className="icon-button clear-button"
                    onClick={() => setInput('')}
                    title="Clear"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* User Login Section */}
      {showLogin && (
        <div className="vhealth-user-section">
          <MultiAuthLogin />
        </div>
      )}
    </header>
  );
};

export default Header;