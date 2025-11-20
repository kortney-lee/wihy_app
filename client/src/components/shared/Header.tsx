/* filepath: c:\vHealth\vhealth\client\src\components\shared\Header.tsx */
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MultiAuthLogin from './MultiAuthLogin';
import ImageUploadModal from '../ui/ImageUploadModal';
import { wihyAPI } from '../../services/wihyAPI';
import { chatService } from '../../services/chatService';
import { universalSearchService } from '../../services/universalSearchService';
import { getApiEndpoint } from '../../config/apiConfig';
import '../../styles/VHealthSearch.css';
import { CSS_CLASSES } from '../../constants/cssConstants';
import '../../styles/search-components.css';
import './Header.css';

interface UniversalSearchResult {
  success: boolean;
  data?: any;
  chatResponse?: string;
  error?: string;
}

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
  // New props for chat integration
  onChatMessage?: (query: string, response: any) => void;
  isInChatMode?: boolean;
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
  showLogin = true,
  // New props for chat integration
  onChatMessage,
  isInChatMode = false
}) => {
  // ================================
  // STATE MANAGEMENT
  // ================================
  const [input, setInput] = useState(searchQuery);
  const [internalIsListening, setInternalIsListening] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Searching...');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use internal listening state if onVoiceInput is not provided
  const currentIsListening = onVoiceInput ? isListening : internalIsListening;

  // ================================
  // SCROLL DETECTION FOR LOGIN BUTTON
  // ================================
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = 10; // Hide login button when scrolled more than 10px (more aggressive)
      console.log('Scroll detected:', scrollY, 'Threshold:', threshold, 'Should hide:', scrollY > threshold);
      setIsScrolled(scrollY > threshold);
    };

    // Check initial scroll position
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // ================================
  // HEADER HEIGHT MEASUREMENT
  // ================================
  // Keep body offset equal to the real header height
  useLayoutEffect(() => {
    const header = document.querySelector('header.vhealth-header') as HTMLElement | null;
    if (!header) return;

    const apply = () => {
      const h = Math.ceil(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--vh-header-height', `${h}px`);
    };

    // Run once now
    apply();

    // Update on header size change
    const ro = new ResizeObserver(apply);
    ro.observe(header);

    // Update on viewport resize / orientation change
    window.addEventListener('resize', apply);

    return () => {
      window.removeEventListener('resize', apply);
      ro.disconnect();
    };
  }, []);

  // ================================
  // FORCE HEADER ANIMATION WITH JAVASCRIPT
  // ================================
  useEffect(() => {
    // Force apply the rainbow border animation to header search bar using JavaScript
    const container = document.querySelector('.vhealth-header .search-input-container') as HTMLElement;
    if (container) {
      console.log('Applying JavaScript animation to header search bar, variant:', variant);
      
      // Set up the base styles
      container.style.setProperty('border', '2px solid transparent', 'important');
      container.style.setProperty('background', `
        linear-gradient(#fff, #fff) padding-box,
        linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box
      `, 'important');
      container.style.setProperty('background-size', '100% 100%, 200% 100%', 'important');
      container.style.setProperty('border-radius', '24px', 'important');
      
      // Remove CSS animation and use JavaScript instead
      container.style.setProperty('animation', 'none', 'important');
      
      // JavaScript animation
      let position = 0;
      const animate = () => {
        position += 1;
        if (position >= 200) position = 0;
        
        container.style.setProperty('background-position', `0 0, ${position}% 0`, 'important');
        requestAnimationFrame(animate);
      };
      
      animate();
    }
  }, [variant]); // Re-run when variant changes

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
   * CHECK CHAT MODE
   * Determines if we're currently in a chat conversation that should be continued
   */
  const isCurrentlyInChat = () => {
    // Check if we're explicitly told we're in chat mode
    if (isInChatMode) return true;
    
    // Check if we're on a results page and have an active chat session
    if (location.pathname === '/results') {
      const sessionId = chatService.getCurrentSessionId();
      const conversationId = chatService.getConversationId();
      return Boolean(sessionId || conversationId);
    }
    
    return false;
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
   * DEDICATED UNIVERSAL SEARCH HANDLER
   * 
   * This handler is specifically designed for Universal Search API integration.
   * Unlike legacy search handlers, it properly formats responses for:
   * 1. FullScreenChat integration (via onChatMessage callback)
   * 2. Results page display with AI-enhanced data
   * 3. Rich metadata including confidence scores and processing times
   * 
   * The return format is different from legacy handlers to support the
   * Universal Search API's comprehensive response structure.
   */
  const handleUniversalSearchRequest = async (queryToUse: string, _signal: AbortSignal): Promise<UniversalSearchResult> => {
    try {
      console.log('🔍 Universal Search API request for:', queryToUse);
      
      // Test connectivity first
      const connectionTest = await universalSearchService.testConnection();
      if (!connectionTest.available) {
        throw new Error(`Universal Search API unavailable: ${connectionTest.error}`);
      }
      
      // Make the universal search request with automatic type detection
      const universalResponse = await universalSearchService.quickSearch(queryToUse);
      
      if (universalResponse.success) {
        // Format different response types for different uses
        const displayResponse = universalSearchService.formatForDisplay(universalResponse);
        const chatData = universalSearchService.formatForChat(universalResponse);
        
        // Create comprehensive response object
        const formattedResponse = {
          success: true,
          query: universalResponse.query,
          detected_type: universalResponse.detected_type,
          processing_time: universalResponse.processing_time_ms,
          timestamp: universalResponse.timestamp,
          
          // Format for results page display
          response: displayResponse,
          
          // Chat data for FullScreenChat component
          chatData: chatData,
          
          // Raw results for advanced components
          raw_results: universalResponse.results,
          
          // Metadata
          data_source: 'universal_search_api',
          has_charts: !!universalResponse.charts,
          recommendations: universalResponse.recommendations || []
        };

        console.log('✅ Universal Search successful with enhanced formatting');
        
        return {
          success: true,
          data: formattedResponse,
          chatResponse: displayResponse
        };
      } else {
        throw new Error(universalResponse.error || 'Universal search failed');
      }
      
    } catch (error) {
      console.error('❌ Universal Search API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Universal search failed'
      };
    }
  };

  /**
   * MAIN SEARCH HANDLER - Updated to use Universal Search API
   * Primary search function that handles all types of queries with AI enhancement
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
      // Step 1: Check database cache first (keep existing cache for compatibility)
      setLoadingMessage('Checking cache...');
      
      try {
        const response = await fetch(getApiEndpoint(`/cache/get?q=${encodeURIComponent(queryToUse)}`), { signal });
        
        if (response.ok) {
          const cachedData = await response.json();
          console.log('Using cached results from database');
          setLoadingMessage('Loading cached results...');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setIsLoading(false);
          
          // Check if we should append cached results to existing chat or create new results page
          if (isCurrentlyInChat() && onChatMessage) {
            console.log('🔍 Appending cached results to existing chat conversation');
            // Create structured data for cached response
            const cachedChatData = {
              type: 'cached_search',
              summary: cachedData.results?.summary || cachedData.results?.details || 'Cached search results retrieved',
              recommendations: cachedData.results?.recommendations || [],
              sources: cachedData.results?.sources || []
            };
            onChatMessage(queryToUse, cachedChatData);
            clearInput();
            return;
          }
          
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
        if (cacheError.name === 'AbortError') {
          console.log('Cache request was cancelled');
          return;
        }
        console.log('No cache found, proceeding with Universal Search API');
      }

      // Step 2: Use Universal Search API with AI enhancement
      setLoadingMessage('Analyzing with Universal AI Search...');
      
      const universalResult = await handleUniversalSearchRequest(queryToUse, signal);
      
      if (universalResult.success && universalResult.data) {
        setLoadingMessage('Processing AI-enhanced results...');
        
        setIsLoading(false);
        
        // Check if we should append to existing chat or create new results page
        if (isCurrentlyInChat() && onChatMessage) {
          console.log('🔍 Appending Universal Search results to existing chat conversation');
          // Pass the rich Universal Search data object instead of just formatted string
          const universalSearchData = universalResult.data?.chatData || {
            type: 'universal_search',
            summary: universalResult.chatResponse || 'Search results received'
          };
          onChatMessage(queryToUse, universalSearchData);
          clearInput();
          return;
        }
        
        // Create new results page
        navigate(`/results?q=${encodeURIComponent(queryToUse)}`, {
          state: {
            results: universalResult.data,
            dataSource: 'universal_search',
            searchType: universalResult.data.detected_type,
            fromSearch: true,
            hasAI: true
          }
        });
        return;
      } else {
        console.error('❌ Universal Search failed:', universalResult.error);
        setLoadingMessage('Falling back to legacy search...');
        
        // Fallback to existing WiHy API search
        console.log('Falling back to WiHy API search for:', queryToUse);
        const wihyResponse = await wihyAPI.searchHealth(queryToUse);
        
        if (wihyResponse.success) {
          // Handle legacy response format
          let summary = 'Health information provided';
          let actualHealthResponse = 'Health information provided';
          
          if ('data' in wihyResponse) {
            // New unified API response format
            const data = (wihyResponse as any).data;
            if (data?.ai_response?.response) {
              actualHealthResponse = data.ai_response.response;
              summary = actualHealthResponse;
            } else if (data?.response) {
              // Handle JSON string responses
              if (typeof data.response === 'string') {
                try {
                  const parsed = JSON.parse(data.response.replace(/'/g, '"'));
                  actualHealthResponse = parsed.core_principle || parsed.message || data.response;
                } catch {
                  actualHealthResponse = data.response;
                }
              } else {
                actualHealthResponse = data.response;
              }
              summary = actualHealthResponse;
            }
          } else {
            // Legacy WihyResponse format
            const wihyResp = (wihyResponse as any).wihy_response;
            if (wihyResp && typeof wihyResp === 'object') {
              actualHealthResponse = wihyResp.core_principle || wihyResp.message || 'Health information provided';
              summary = actualHealthResponse;
            }
          }
          
          // Convert WiHy response to expected format
          const searchResults = {
            summary: summary,
            details: actualHealthResponse,
            sources: wihyAPI.extractCitations(wihyResponse),
            recommendations: wihyAPI.extractRecommendations(wihyResponse),
            relatedTopics: [],
            medicalDisclaimer: 'This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.',
            dataSource: 'wihy_fallback'
          };
          
          const isValidResult = searchResults && 
            typeof searchResults === 'object' && 
            searchResults !== null &&
            (searchResults.summary || searchResults.details || Object.keys(searchResults).length > 0);
          
          if (isValidResult) {
            // Save to database cache (async, don't wait)
            setLoadingMessage('Caching results...');
            
            fetch(getApiEndpoint('/cache/save'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: queryToUse,
                results: searchResults,
                source: 'wihy_fallback'
              })
            }).catch(err => console.warn('Cache save error:', err));
            
            setLoadingMessage('Results ready!');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setIsLoading(false);
            
            // Check if we should append to existing chat or create new results page
            if (isCurrentlyInChat() && onChatMessage) {
              console.log('🔍 Appending fallback results to existing chat conversation');
              // Create structured data for fallback response
              const fallbackChatData = {
                type: 'legacy_search',
                summary: searchResults.summary || searchResults.details || 'Search results received',
                recommendations: searchResults.recommendations || [],
                sources: searchResults.sources || []
              };
              onChatMessage(queryToUse, fallbackChatData);
              clearInput();
              return;
            }
            
            // Create new results page
            navigate(`/results?q=${encodeURIComponent(queryToUse)}`, {
              state: {
                results: searchResults,
                apiResponse: wihyResponse,
                dataSource: 'wihy_fallback',
                fromSearch: true
              }
            });
            return;
          } else {
            throw new Error('WiHy fallback API returned invalid results');
          }
        } else {
          throw new Error('WiHy fallback API request failed');
        }
      }
        
    } catch (error) {
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
    // Clear chat session when navigating to about page
    chatService.clearSession();
    console.log('🔍 HEADER: Cleared chat session on about page navigation');
    
    if (onLogoClick) {
      onLogoClick();
    } else {
      // Default behavior: navigate to about page
      navigate('/about');
    }
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
  const LoadingOverlay: React.FC<{ message: string; progress: number }> = ({ message: _message, progress }) => (
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
      {/* Ensure keyframes are available */}
      <style>
        {`
          @keyframes wiH-border-sweep {
            0%   { background-position: 0 0, 0% 0; }
            100% { background-position: 0 0, 200% 0; }
          }
        `}
      </style>
      
      {/* LOADING OVERLAY - Shows during search operations */}
      {isLoading && (
        <LoadingOverlay 
          message={loadingMessage}
          progress={progressFromMessage(loadingMessage)}
        />
      )}

      <header className={headerClasses}>
        {/* === TOP BAR: Login only (no notifications for client) === */}
        <div className={CSS_CLASSES.VHEALTH_TOPBAR}>
          <div className={CSS_CLASSES.VHEALTH_TOPBAR_RIGHT}>
            {showLogin && (
              <div 
                className={`${CSS_CLASSES.HEADER_AUTH_WRAPPER} ${isScrolled ? CSS_CLASSES.HIDDEN_ON_SCROLL || 'hidden-on-scroll' : ''}`}
                style={{
                  minWidth: '48px',
                  minHeight: '48px',
                  padding: '4px',
                  display: isScrolled ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isScrolled ? 0 : 1,
                  visibility: isScrolled ? 'hidden' : 'visible',
                  transition: 'all 0.2s ease'
                }}>
                <MultiAuthLogin 
                  position="inline"
                  onUserChange={(user) => console.log('User changed in header:', user)}
                  onSignIn={(user) => console.log('User signed in from header:', user)}
                  onSignOut={() => console.log('User signed out from header')}
                />
              </div>
            )}
          </div>
        </div>

        {/* === MAIN BAR: Logo + Search === */}
        <div className={CSS_CLASSES.VHEALTH_MAINBAR}>
          {/* Logo Section */}
          <div className={CSS_CLASSES.VHEALTH_LOGO_CONTAINER}>
            <img
              src="/assets/wihylogo.png?v=2025-11-05"
              alt="What is Healthy?"
              className={`${CSS_CLASSES.VHEALTH_LOGO} ${variant}-logo`}
              onClick={handleLogoClick}
              style={{ cursor: onLogoClick ? 'pointer' : 'default' }}
            />
          </div>

          {/* Search Input Section */}
          {showSearchInput && (
            <div className="vhealth-search-section">
              <form className="vhealth-search-form" onSubmit={handleSubmit}>
                <div 
                  className="search-input-container"
                  style={{
                    animation: 'wiH-border-sweep 2.2s linear infinite !important',
                    background: `
                      linear-gradient(#fff, #fff) padding-box,
                      linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box
                    `,
                    backgroundSize: '100% 100%, 200% 100%',
                    border: '2px solid transparent',
                    borderRadius: '24px',
                    position: 'relative',
                    width: '100%',
                    maxWidth: '800px',
                    margin: '0 auto',
                    boxShadow: '0 1px 6px rgba(32,33,36,0.28)'
                  }}
                >
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

    {/* IMAGE UPLOAD MODAL - Opens when camera button is clicked */}
    <ImageUploadModal
      isOpen={isUploadModalOpen}
      onClose={() => setIsUploadModalOpen(false)}
      onAnalysisComplete={handleAnalysisComplete}
      title="Upload Image"
      subtitle="Upload Image for Analysis"
    />
  </>
  );
};

export default Header;