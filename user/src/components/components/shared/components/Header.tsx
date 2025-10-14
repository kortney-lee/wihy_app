/* filepath: c:\vHealth\vhealth\client\src\components\shared\components\Header.tsx */
import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useModal } from '../../../../services/modalService';
import { notificationService } from '../../../../services/notificationService';
import MultiAuthLogin from './MultiAuthLogin';
import ImageUploadModal from '../../ImageUploadModal';
import NotificationModal from '../../../modals/NotificationModal';
import AccountModal from '../../../modals/AccountModal';
import { healthSearchService } from '../../../../services/healthSearchService';
import '../../../../styles/VHealthSearch.css';
import './Header.css';

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
  // ================================
  // STATE MANAGEMENT
  // ================================
  const [input, setInput] = useState(searchQuery);
  const [internalIsListening, setInternalIsListening] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Searching...');
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoError, setLogoError] = useState(false);
  
  const history = useHistory();
  const modal = useModal();
  const searchInputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use internal listening state if onVoiceInput is not provided
  const currentIsListening = onVoiceInput ? isListening : internalIsListening;

  // ================================
  // UTILITY FUNCTIONS
  // ================================

  /**
   * AUTO-SIZE TEXT AREA
   * Dynamically adjusts the height of the search input based on content
   */
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

  /**
   * CLEAR SEARCH INPUT
   * Clears search input and resets its height to default
   */
  const clearInput = () => {
    setInput('');
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.style.height = '44px';
      }
    }, 10);
  };

  /**
   * PROGRESS CALCULATOR
   * Converts loading message text to progress percentage for UI feedback
   */
  const progressFromMessage = (msg: string) => {
    if (msg.includes('Initializing')) return 10;
    if (msg.includes('Checking cache')) return 25;
    if (msg.includes('Analyzing with AI')) return 55;
    if (msg.includes('Processing results')) return 75;
    if (msg.includes('Results ready') || msg.includes('Response ready')) return 95;
    if (msg.includes('Processing image')) return 35;
    if (msg.includes('Checking nutrition')) return 45;
    if (msg.includes('Analyzing nutrition')) return 60;
    if (msg.includes('Processing nutrition')) return 80;
    if (msg.includes('complete')) return 95;
    if (msg.includes('failed')) return 100;
    return 40;
  };

  // ================================
  // SEARCH FUNCTIONALITY
  // ================================

  /**
   * MAIN SEARCH HANDLER
   * Primary search function that handles text-based health queries
   */
  const handleSearch = async (queryParam?: string) => {
    const queryToUse = queryParam || input;
    if (!queryToUse.trim() || isLoading) return;
    
    // If onSearchSubmit is provided, use it instead of internal search
    if (onSearchSubmit) {
      onSearchSubmit(queryToUse.trim());
      return;
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setIsLoading(true);
    setLoadingMessage('Initializing search...');
    
    try {
      // Step 1: Check database cache first
      setLoadingMessage('Checking cache...');
      
      try {
        const response = await fetch(`http://localhost:5000/api/cache/get?q=${encodeURIComponent(queryToUse)}`, { signal });
        
        if (response.ok) {
          const cachedData = await response.json();
          console.log('Using cached results from database');
          setLoadingMessage('Loading cached results...');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setIsLoading(false);
          history.push(`/results?q=${encodeURIComponent(queryToUse)}`);
          return;
        }
      } catch (cacheError: any) {
        if (cacheError.name === 'AbortError') {
          console.log('Cache request was cancelled');
          return;
        }
        console.log('No cache found, proceeding with API call');
      }

      // Step 2: Get fresh results from API
      setLoadingMessage('Analyzing with AI...');
      
      try {
        const searchResults = await healthSearchService.searchHealthInfo(queryToUse, signal);
        
        const isValidResult = searchResults && 
          typeof searchResults === 'object' && 
          searchResults !== null &&
          (searchResults.summary || searchResults.details || Object.keys(searchResults).length > 0);
        
        if (isValidResult) {
          // Step 3: Save to database cache (async, don't wait)
          setLoadingMessage('Caching results...');
          
          fetch('http://localhost:5000/api/cache/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: queryToUse,
              results: searchResults,
              source: 'openai'
            })
          }).catch(err => console.warn('Cache save error:', err));
          
          setLoadingMessage('Results ready!');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setIsLoading(false);
          history.push(`/results?q=${encodeURIComponent(queryToUse)}`);
          return;
        } else {
          throw new Error('Invalid results from API');
        }
        
      } catch (apiError: any) {
        if (apiError.name === 'AbortError') {
          console.log('API request was cancelled');
          return;
        }
        console.error('Health search service failed:', apiError);
        
        setLoadingMessage('No results found. Please try a different search.');
        setTimeout(() => {
          setIsLoading(false);
          setLoadingMessage('Searching...');
        }, 3000);
        return;
      }
        
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Search request was cancelled');
        return;
      }
      
      console.error("Search error:", error);
      setLoadingMessage('Search failed. Please try again.');
      
      setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage('Searching...');
      }, 2000);
    }
  };

  /**
   * SEARCH CANCELLATION HANDLER
   */
  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setLoadingMessage('Searching...');
  };

  /**
   * IMAGE ANALYSIS COMPLETION HANDLER
   */
  const handleAnalysisComplete = async (foodName: string): Promise<void> => {
    if (!foodName || isLoading) {
      setIsUploadModalOpen(false);
      return;
    }

    if (onSearchSubmit) {
      onSearchSubmit(foodName);
      setIsUploadModalOpen(false);
      return;
    }

    // Use internal search logic
    setInput(foodName);
    await handleSearch(foodName);
    setIsUploadModalOpen(false);
  };

  /**
   * VOICE INPUT HANDLER
   */
  const handleVoiceInput = () => {
    if (onVoiceInput) {
      onVoiceInput();
      return;
    }

    // Internal voice input logic
    if (isLoading) return;
    
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setInternalIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setInternalIsListening(false);
      };
      recognition.onerror = () => setInternalIsListening(false);
      recognition.onend = () => setInternalIsListening(false);

      recognitionRef.current = recognition;
    }

    if (!currentIsListening) {
      recognitionRef.current.start();
    } else {
      recognitionRef.current.stop();
      setInternalIsListening(false);
    }
  };

  /**
   * IMAGE UPLOAD HANDLER
   */
  const handleImageUpload = () => {
    if (onImageUpload) {
      onImageUpload();
      return;
    }
    
    // Internal image upload logic
    setIsUploadModalOpen(true);
  };

  // ================================
  // EVENT HANDLERS
  // ================================
  
  // Update sizing when input changes
  useEffect(() => {
    autoSize();
  }, [input]);

  // Notification subscription
  useEffect(() => {
    const unsubscribeNotifications = notificationService.subscribe(() => {
      setUnreadCount(notificationService.getUnreadCount());
    });
    
    setUnreadCount(notificationService.getUnreadCount());

    return () => {
      unsubscribeNotifications();
    };
  }, []);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
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

  const handleLogoError = () => {
    setLogoError(true);
  };

  // ================================
  // LIFECYCLE HOOKS
  // ================================

  /**
   * CLEANUP EFFECT
   * Resets loading state when component unmounts
   */
  useEffect(() => {
    return () => {
      setIsLoading(false);
      setLoadingMessage('Searching...');
    };
  }, []);

  // ================================
  // UI COMPONENTS
  // ================================

  /**
   * LOADING OVERLAY COMPONENT
   * Shows animated loading screen with progress bar during search operations
   */
  const LoadingOverlay: React.FC<{ message: string; progress: number }> = ({ message, progress }) => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        minWidth: '320px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Spinner */}
        <div style={{ margin: '0 auto 24px auto' }}>
          <img 
            src="/assets/whatishealthyspinner.gif" 
            alt="Loading..." 
            style={{
              width: '48px',
              height: '48px',
              objectFit: 'contain'
            }}
          />
        </div>
        
        {/* Title */}
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '24px',
          fontWeight: '600',
          color: '#1f2937'
        }}>
          Loading Content
        </h3>
        
        {/* Subtitle */}
        <p style={{
          margin: '0 0 24px 0',
          fontSize: '16px',
          color: '#6b7280'
        }}>
          Please wait while we process your request...
        </p>
        
        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '12px'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }} />
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '16px'
        }}>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#6b7280'
          }}>
            {progress}% Complete
          </p>
          
          {/* Cancel button */}
          <button
            onClick={handleCancelSearch}
            style={{
              backgroundColor: 'transparent',
              color: '#555',
              border: '1px solid #ccc',
              borderRadius: '16px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const headerClasses = `vhealth-header ${variant} ${className}`.trim();

  return (
    <>
      {/* LOADING OVERLAY - Shows during search operations */}
      {isLoading && (
        <LoadingOverlay 
          message={loadingMessage}
          progress={progressFromMessage(loadingMessage)}
        />
      )}

      <header className={headerClasses}>
        {/* === TOP BAR: Notifications + Login (side-by-side) === */}
        <div className="vhealth-topbar">
          <div className="vhealth-topbar-right">
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

            {showLogin && (
              <div className="header-auth-wrapper">
                <MultiAuthLogin position="inline" />
              </div>
            )}
          </div>
        </div>

        {/* === MAIN BAR: Logo + Search === */}
        <div className="vhealth-mainbar">
          {/* Logo Section */}
          <div className="vhealth-logo-container">
            {!logoError ? (
              <img
                src="/assets/wihylogo.png"
                alt="What is Healthy?"
                className={`vhealth-logo ${variant}-logo`}
                onClick={handleLogoClick}
                onError={handleLogoError}
                style={{ cursor: onLogoClick ? 'pointer' : 'default' }}
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
                    disabled={isLoading}
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

                    <button
                      type="button"
                      className="icon-button"
                      onClick={handleImageUpload}
                      title="Upload image"
                      disabled={isLoading}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                      </svg>
                    </button>

                    <button
                      type="button"
                      className={`icon-button ${currentIsListening ? 'listening' : ''}`}
                      onClick={handleVoiceInput}
                      title={currentIsListening ? 'Stop listening' : 'Start voice input'}
                      disabled={isLoading}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* IMAGE UPLOAD MODAL */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
        title="Upload Image"
        subtitle="Upload Image for Analysis"
      />

      {/* NOTIFICATION AND ACCOUNT MODALS */}
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