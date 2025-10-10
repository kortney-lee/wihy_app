/* filepath: c:\vHealth\vhealth\client\src\components\shared\components\Header.tsx */
import React, { useState, useRef, useEffect } from 'react';
import MultiAuthLogin from './MultiAuthLogin';
import '../../../styles/VHealthSearch.css';

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
  const searchInputRef = useRef<HTMLTextAreaElement>(null); // Changed to textarea

  // Auto-resize function to match VHealthSearch behavior
  const autoSize = () => {
    const el = searchInputRef.current;
    if (!el) return;
    
    // Reset to default height when empty
    if (!input.trim()) {
      el.style.height = '44px';
      el.style.overflowY = 'hidden';
      return;
    }
    
    // Auto-expand height based on content
    el.style.height = "0";
    const next = el.scrollHeight;
    el.style.height = next + "px";
    
    // Enable scrolling if height exceeds max
    const max = parseFloat(getComputedStyle(el).maxHeight);
    el.style.overflowY = next > max ? "auto" : "hidden";
  };
  
  // Update sizing when input changes
  useEffect(() => {
    autoSize();
  }, [input]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  
  // Clear input and reset size
  const clearInput = () => {
    setInput('');
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.style.height = '44px';
      }
    }, 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && onSearchSubmit) {
      onSearchSubmit(input.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
              <textarea
                ref={searchInputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about health..."
                className="search-input"
                rows={1}
                style={{
                  resize: 'none',
                  overflow: 'hidden',
                  minHeight: '44px',
                  height: 'auto',
                  paddingRight: '100px'
                }}
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
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
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

                {/* Clear button (if there's text) - unchanged */}
                {input && (
                  <button
                    type="button"
                    className="icon-button clear-button"
                    onClick={clearInput}
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