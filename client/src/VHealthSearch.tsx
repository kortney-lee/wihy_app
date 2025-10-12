import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/VHealthSearch.css';
import ImageUploadModal from './components/ImageUploadModal';
import MultiAuthLogin from './components/shared/components/MultiAuthLogin';
import { healthSearchService } from './services/healthSearchService';
import { searchCache } from './services/searchCache';
import { foodAnalysisService } from './components/foodAnalysisService';
import HealthNewsFeed from './components/HealthNewsFeed';

const VHealthSearch: React.FC = () => {
  // ================================
  // STATE MANAGEMENT
  // ================================
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Searching...');
  const [showFeelingHealthyContent, setShowFeelingHealthyContent] = useState(false);
  
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ================================
  // UTILITY FUNCTIONS
  // ================================

  /**
   * PROGRESS CALCULATOR
   * Converts loading message text to progress percentage for UI feedback
   * @param msg - The current loading message
   * @returns Progress percentage (0-100)
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

    if (msg.includes('failed')) return 100; // will close shortly
    return 40; // default midpoint
  };

  /**
   * AUTO-SIZE TEXT AREA
   * Dynamically adjusts the height of the search input based on content
   */
  const autoSize = () => {
    const el = document.querySelector('.search-input') as HTMLTextAreaElement;
    if (!el) return;
    
    // Reset to default height when empty
    if (!searchQuery.trim()) {
      el.style.height = '44px'; // Default height
      el.style.overflowY = 'hidden';
      return;
    }
    
    // Otherwise handle auto-sizing as before
    el.style.height = "auto";
    const next = el.scrollHeight;
    el.style.height = next + "px";
    
    // Check if we've hit max height
    const max = parseFloat(getComputedStyle(el).maxHeight);
    el.style.overflowY = next > max ? "auto" : "hidden";
  };
  
  /**
   * CLEAR SEARCH INPUT
   * Clears search input and resets its height to default
   */
  const handleClearSearch = () => {
    setSearchQuery('');
    // Force a reset after state update
    setTimeout(() => {
      const el = document.querySelector('.search-input') as HTMLTextAreaElement;
      if (el) el.style.height = '44px';
    }, 10);
  };

  // ================================
  // AUTHENTICATION HANDLERS
  // ================================

  /**
   * USER CHANGE HANDLER
   * Handles when user authentication state changes
   * @param user - User object from auth service
   */
  const handleUserChange = (user: any) => {
    console.log('User changed:', user);
  };

  /**
   * SIGN IN HANDLER
   * Handles successful user sign-in
   * @param user - Authenticated user object
   */
  const handleSignIn = (user: any) => {
    console.log('User signed in:', user);
  };

  /**
   * SIGN OUT HANDLER
   * Handles user sign-out action
   */
  const handleSignOut = () => {
    console.log('User signed out');
  };

  // ================================
  // MAIN SEARCH FUNCTIONALITY
  // ================================

  /**
   * MAIN SEARCH HANDLER
   * Primary search function that handles text-based health queries
   * Flow: Check cache → API call → Save to cache → Navigate to results
   * Uses 4-step fallback strategy for reliability
   */
  const handleSearch = async (queryParam?: string) => {
    const queryToUse = queryParam || searchQuery;
    if (!queryToUse.trim() || isLoading) return;
    
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
          // Pass the cached data via navigation state
          navigate(`/results?q=${encodeURIComponent(queryToUse)}`, {
            state: {
              results: cachedData.results,
              dataSource: cachedData.source || 'cache',
              fromSearch: true
            }
          });
          return;
        }
      } catch (cacheError) {
        // Handle AbortError specifically
        if (cacheError.name === 'AbortError') {
          console.log('Cache request was cancelled');
          return; // Exit early
        }
        console.log('No cache found, proceeding with API call');
      }

      // Step 2: Get fresh results from API
      setLoadingMessage('Analyzing with AI...');
      console.log('Getting fresh results for:', queryToUse);
      
      try {
        // Pass signal to healthSearchService
        const searchResults = await healthSearchService.searchHealthInfo(queryToUse, signal);
        console.log('Health search results received:', searchResults);
        
        const isValidResult = searchResults && 
          typeof searchResults === 'object' && 
          searchResults !== null &&
          (searchResults.summary || searchResults.details || Object.keys(searchResults).length > 0);
        
        if (isValidResult) {
          console.log('Valid results confirmed');
          
          // Step 3: Save to database cache (async, don't wait)
          setLoadingMessage('Caching results...');
          
          fetch('http://localhost:5000/api/cache/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: queryToUse,
              results: searchResults,
              source: 'openai'
            })
          }).then(response => {
            if (response.ok) {
              console.log('Results saved to database cache');
            } else {
              console.warn('Failed to save to cache');
            }
          }).catch(err => {
            console.warn('Cache save error:', err);
          });
          
          setLoadingMessage('Results ready!');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setIsLoading(false);
          console.log('Navigating to results page with data');
          
          // Pass the fresh results via navigation state
          navigate(`/results?q=${encodeURIComponent(queryToUse)}`, {
            state: {
              results: searchResults,
              dataSource: 'openai',
              fromSearch: true
            }
          });
          return;
        } else {
          throw new Error('Invalid results from API');
        }
        
      } catch (apiError) {
        // Handle AbortError specifically
        if (apiError.name === 'AbortError') {
          console.log('API request was cancelled');
          return; // Exit early
        }
        console.error('Health search service failed:', apiError);
        
        // Step 4: Try similar results as fallback
        setLoadingMessage('Searching for similar results...');
        
        try {
          const similarResponse = await fetch(`http://localhost:5000/api/cache/similar?q=${encodeURIComponent(queryToUse)}`);
          
          if (similarResponse.ok) {
            const similarResults = await similarResponse.json();
            
            if (similarResults.length > 0) {
              console.log('Using similar cached results');
              setLoadingMessage('Loading similar results...');
              await new Promise(resolve => setTimeout(resolve, 300));
              
              setIsLoading(false);
              // Pass similar results via navigation state
              navigate(`/results?q=${encodeURIComponent(queryToUse)}`, {
                state: {
                  results: similarResults[0].results,
                  dataSource: 'similar',
                  fromSearch: true
                }
              });
              return;
            }
          }
        } catch (similarError) {
          console.warn('Similar results search failed:', similarError);
        }
        
        setLoadingMessage('No results found. Please try a different search.');
        setTimeout(() => {
          setIsLoading(false);
          setLoadingMessage('Searching...');
        }, 3000);
        return;
      }
        
    } catch (error) {
      // Handle AbortError specifically
      if (error.name === 'AbortError') {
        console.log('Search request was cancelled');
        return; // Exit early
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
   * Cancels in-progress search requests and resets loading state
   * Called when user clicks the cancel button in loading overlay
   */
  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setLoadingMessage('Searching...');
  };

  // ================================
  // IMAGE ANALYSIS FUNCTIONALITY
  // ================================

  /**
   * IMAGE ANALYSIS COMPLETION HANDLER
   * Processes results from image upload and food recognition
   * Triggered when ImageUploadModal completes food detection
   * @param foodName - The detected food name from image analysis
   */
  const handleAnalysisComplete = async (foodName: string): Promise<void> => {
    if (!foodName || isLoading) {
      setIsUploadModalOpen(false);
      return;
    }

    // Create abort controller for this request too
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setIsLoading(true);
    setLoadingMessage('Processing image analysis...');
    
    try {
      console.log("Image analysis completed, food detected:", foodName);
      setSearchQuery(foodName);
      
      // Step 1: Check database cache for nutrition data
      setLoadingMessage('Checking nutrition database...');
      
      try {
        const response = await fetch(`http://localhost:5000/api/cache/get?q=${encodeURIComponent(foodName)}`);
        
        if (response.ok) {
          const cachedData = await response.json();
          console.log('Using cached nutrition data');
          setLoadingMessage('Loading cached nutrition data...');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setIsLoading(false);
          // Pass the cached data via navigation state
          navigate(`/results?q=${encodeURIComponent(foodName)}`, {
            state: {
              results: cachedData.results,
              dataSource: cachedData.source || 'cache',
              fromSearch: true
            }
          });
          return;
        }
      } catch (cacheError) {
        console.log('No cached nutrition data found');
      }
      
      // Step 2: Get fresh nutrition data
      setLoadingMessage('Analyzing nutrition content...');
      
      try {
        const nutritionResults = await healthSearchService.searchHealthInfo(foodName, signal);
        
        const isValidResult = nutritionResults && 
          typeof nutritionResults === 'object' && 
          nutritionResults !== null &&
          (nutritionResults.summary || nutritionResults.details || Object.keys(nutritionResults).length > 0);
        
        if (isValidResult) {
          // Step 3: Save to database cache (async, don't wait)
          setLoadingMessage('Caching nutrition data...');
          
          fetch('http://localhost:5000/api/cache/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: foodName,
              results: nutritionResults,
              source: 'image-analysis'
            })
          }).then(response => {
            if (response.ok) {
              console.log('Nutrition data saved to cache');
            } else {
              console.warn('Failed to save nutrition data to cache');
            }
          }).catch(err => {
            console.warn('Nutrition cache save error:', err);
          });
          
          setLoadingMessage('Nutrition analysis complete!');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setIsLoading(false);
          // Pass the fresh nutrition results via navigation state
          navigate(`/results?q=${encodeURIComponent(foodName)}`, {
            state: {
              results: nutritionResults,
              dataSource: 'image-analysis',
              fromSearch: true
            }
          });
          return;
        } else {
          throw new Error('Invalid nutrition results');
        }
        
      } catch (nutritionError) {
        console.error('Nutrition analysis failed:', nutritionError);
        
        // Try similar results as fallback
        try {
          const similarResponse = await fetch(`http://localhost:5000/api/cache/similar?q=${encodeURIComponent(foodName)}`);
          
          if (similarResponse.ok) {
            const similarResults = await similarResponse.json();
            
            if (similarResults.length > 0) {
              console.log('Using similar nutrition data');
              setLoadingMessage('Loading similar nutrition data...');
              await new Promise(resolve => setTimeout(resolve, 300));
              
              setIsLoading(false);
              navigate(`/results?q=${encodeURIComponent(foodName)}`);
              return;
            }
          }
        } catch (similarError) {
          console.warn('Similar nutrition search failed:', similarError);
        }
        
        setLoadingMessage('Could not analyze this food item. Please try again.');
        setTimeout(() => {
          setIsLoading(false);
          setLoadingMessage('Searching...');
        }, 3000);
        return;
      }
      
    } catch (error) {
      console.error("Error processing analyzed food:", error);
      setLoadingMessage('Analysis failed. Please try again.');
      
      setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage('Searching...');
      }, 2000);
    } finally {
      setIsUploadModalOpen(false);
    }
  };

  // ================================
  // LIFECYCLE HOOKS
  // ================================

  /**
   * CLEANUP EFFECT
   * Resets loading state when component unmounts
   * Prevents memory leaks and state persistence issues
   */
  useEffect(() => {
    return () => {
      setIsLoading(false);
      setLoadingMessage('Searching...');
    };
  }, []);

  // Add this with your other useEffects
  useEffect(() => {
    // Call autoSize whenever searchQuery changes
    if (searchQuery !== undefined) {
      autoSize();
    }
  }, [searchQuery]);

  // ================================
  // UI COMPONENTS
  // ================================

  /**
   * LOADING OVERLAY COMPONENT
   * Shows animated loading screen with progress bar during search operations
   * @param message - Current loading message to display
   * @param progress - Progress percentage (0-100) for progress bar
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
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f1f1';
              e.currentTarget.style.color = '#333';
              e.currentTarget.style.borderColor = '#aaa';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#555';
              e.currentTarget.style.borderColor = '#ccc';
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // ================================
  // MAIN COMPONENT RENDER
  // ================================

  return (
    <div className="search-landing">
      {/* LOADING OVERLAY - Shows during search operations */}
      {isLoading && (
        <LoadingOverlay 
          message={loadingMessage}
          progress={progressFromMessage(loadingMessage)}
        />
      )}
      
      {/* AUTHENTICATION COMPONENT - Top-right login/logout */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <MultiAuthLogin className="main-login-button" />
      </div>

      {/* MAIN SEARCH INTERFACE */}
      <div className="search-container-centered">
        {/* LOGO SECTION - Shows either image logo or text fallback */}
        <div className="logo-container">
          {!imageError ? (
            <img 
              src="/assets/wihylogo.png"
              alt="What is Healthy?"
              className="search-logo-image"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
          ) : (
            <h1 className="search-logo">
              What is Healthy?
            </h1>
          )}
        </div>
        
        {/* SEARCH INPUT SECTION - Main search bar with icons */}
        <div className="search-input-container">
          <form onSubmit={(e) => { 
            e.preventDefault();
            handleSearch();
          }}>
            <textarea
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Ask anything about health..."
              className="search-input"
              autoFocus
              disabled={isLoading}
              rows={1}
              style={{
                resize: 'none',
                overflow: 'hidden',
                minHeight: '44px',
                height: 'auto',
                paddingRight: '100px',
                width: '100%', // Use full width of container
                boxSizing: 'border-box' // Include padding in width calculation
              }}
              onInput={(e) => {
                // Auto-resize height algorithm
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '0';
                const scrollHeight = target.scrollHeight;
                target.style.height = scrollHeight + 'px';
              }}
            />
          </form>

          {/* SEARCH ICONS - Clear, Camera, Voice input buttons */}
          <div className="search-icons">
            {/* CLEAR BUTTON - Clears current search query */}
            {searchQuery && (
              <button 
                className="icon-button clear-button" 
                onClick={handleClearSearch}
                aria-label="Clear"
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
                </svg>
              </button>
            )}
            
            {/* CAMERA BUTTON - Opens image upload modal */}
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="icon-button"
              aria-label="Upload image"
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
            </button>
            
            {/* VOICE INPUT BUTTON - Activates speech recognition */}
            <button
              type="button"
              onClick={() => {
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

                  recognition.onstart = () => setIsListening(true);
                  recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setSearchQuery(transcript);
                    setIsListening(false);
                  };
                  recognition.onerror = () => setIsListening(false);
                  recognition.onend = () => setIsListening(false);

                  recognitionRef.current = recognition;
                }

                if (!isListening) {
                  recognitionRef.current.start();
                } else {
                  recognitionRef.current.stop();
                  setIsListening(false);
                }
              }}
              className={`icon-button ${isListening ? 'listening' : ''}`}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.28c3.39-.49 6-3.3 6-6.72h-2z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ACTION BUTTONS - Primary search and secondary "feeling healthy" */}
        <div className="search-buttons">
          {/* PRIMARY SEARCH BUTTON - Triggers main search function */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="search-btn primary"
            disabled={!searchQuery.trim() || isLoading}
          >
            {isLoading ? loadingMessage : 'Analyze Nutrition'}
          </button>
          
          {/* FEELING HEALTHY BUTTON - Shows/hides health news feed */}
          <button 
            onClick={() => {
              if (isLoading) return;
              
              if (showFeelingHealthyContent) {
                // If news is showing, close it and set "What is Healthy?" in search
                setShowFeelingHealthyContent(false);
                setSearchQuery('What is Healthy?');
              } else {
                // Show the news feed
                setShowFeelingHealthyContent(true);
              }
            }}
            className="search-btn secondary"
            type="button"
            style={{ color: '#000000' }}
            disabled={isLoading}
          >
            I'm Feeling Healthy
          </button>
        </div>
      </div>
      
      {/* HEALTH NEWS FEED - Shows when "I'm Feeling Healthy" is active */}
      {showFeelingHealthyContent && (
        <div 
          className="feeling-healthy-section"
          onClick={(e) => {
            // Close if clicking on the background, not the content
            if (e.target === e.currentTarget) {
              setShowFeelingHealthyContent(false);
              setSearchQuery('What is Healthy?');
            }
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <HealthNewsFeed 
              maxArticles={6}
              setSearchQuery={setSearchQuery}
              triggerSearch={(customQuery?: string) => {
                setShowFeelingHealthyContent(false); // Close news feed
                // Use the custom query if provided, otherwise use current searchQuery
                if (customQuery) {
                  handleSearch(customQuery);
                } else {
                  handleSearch();
                }
              }}
            />
          </div>
        </div>
      )}

      {/* IMAGE UPLOAD MODAL - Opens when camera button is clicked */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)} // FIXED: Changed from setIsUploadModal to setIsUploadModalOpen
        onAnalysisComplete={handleAnalysisComplete}
        title="Upload Image"
        subtitle="Upload Image for Analysis"
      />
    </div>
  );
};

export default VHealthSearch;

/* Add this CSS to your styles
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
*/