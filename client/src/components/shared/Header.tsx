/* filepath: c:\vHealth\vhealth\client\src\components\shared\Header.tsx */
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MultiAuthLogin from './MultiAuthLogin';
import UserPreference from './UserPreference';
import { authService } from '../../services/authService';
import ImageUploadModal from '../ui/ImageUploadModal';
import { wihyAPI } from '../../services/wihyAPI';
import { chatService } from '../../services/chatService';
import { universalSearchService } from '../../services/universalSearchService';
import { getApiEndpoint } from '../../config/apiConfig';
import { PlatformDetectionService } from '../../services/shared/platformDetectionService';
import { normalizeBarcodeScan } from '../../utils/nutritionDataNormalizer';
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
  // Progress sidebar props
  showProgressMenu?: boolean;
  onProgressMenuClick?: () => void;
  // Session continuity prop
  sessionId?: string;
}

const Header: React.FC<HeaderProps> = ({
  searchQuery = '',
  onSearchSubmit,
  onVoiceInput,
  onImageUpload,
  onLogoClick,
  isListening = false,
  showSearchInput = true,
  sessionId,
  variant = 'landing',
  className = '',
  showLogin = true,
  // New props for chat integration
  onChatMessage,
  isInChatMode = false,
  // Progress sidebar props
  showProgressMenu = false,
  onProgressMenuClick
}) => {
  // ================================
  // STATE MANAGEMENT
  // ================================
  const [input, setInput] = useState(searchQuery);
  const [internalIsListening, setInternalIsListening] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Searching...');
  const [showNavMenu, setShowNavMenu] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use internal listening state if onVoiceInput is not provided
  const currentIsListening = onVoiceInput ? isListening : internalIsListening;

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
  // SESSION MANAGEMENT
  // ================================
  // Set session ID in chat service when provided via props for continuity
  useEffect(() => {
    if (sessionId && sessionId !== chatService.getCurrentSessionId()) {
      console.log('[Header] Setting session ID from props:', sessionId);
      chatService.setSessionId(sessionId);
    }
  }, [sessionId]);

  // ================================
  // SEARCH QUERY SYNCHRONIZATION
  // ================================
  // Sync internal input state with searchQuery prop changes
  useEffect(() => {
    console.log('[Header] searchQuery prop changed to:', searchQuery);
    setInput(searchQuery);
    // Auto-resize the textarea after updating input
    setTimeout(() => autoSize(), 0);
  }, [searchQuery]);

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
    
    // Check if we have a sessionId prop (from navigation state)
    if (sessionId) return true;
    
    // Check if we're on a results page and have an active chat session
    if (location.pathname === '/results') {
      const currentSessionId = chatService.getCurrentSessionId();
      const conversationId = chatService.getConversationId();
      return Boolean(currentSessionId || conversationId);
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
  const handleAnalysisComplete = async (foodName: string | any): Promise<void> => {
    // Handle object results (from image analysis)
    if (typeof foodName === 'object' && foodName !== null) {
      // Close the upload modal
      setIsUploadModalOpen(false);
      
      // Check if this is an error
      if (foodName.type === 'error') {
        console.error('Analysis error:', foodName.error);
        return;
      }
      
      // Check if this is a barcode scan - navigate to NutritionFacts page
      if (foodName.type === 'barcode_scan') {
        const barcodeData = foodName.data;
        const productName = barcodeData.product?.name || barcodeData.product_info?.name || 'Unknown Product';
        
        // Normalize barcode scan data to universal format
        const nutritionfacts = normalizeBarcodeScan(foodName);
        
        // Navigate to NutritionFacts page
        navigate('/nutritionfacts', {
          state: {
            initialQuery: `Tell me about ${productName}`,
            nutritionfacts,
          },
        });
        return;
      }
      
      // Check if this is other image/vision/product analysis result
      const isImageResult = foodName.type && (
        foodName.type === 'image_analysis' ||
        foodName.type === 'vision_analysis' ||
        foodName.type === 'product_search' ||
        foodName.type === 'barcode_analysis'
      );
      
      // If it's an image result with data, pass it to onSearchSubmit as an object
      if (isImageResult || foodName.data || foodName.summary) {
        if (onSearchSubmit) {
          // Pass the entire object to the parent
          onSearchSubmit(foodName);
        }
        return;
      }
    }
    
    // Handle string results (legacy behavior)
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
    // Maintain session when navigating back to home
    console.log('🔍 HEADER: Navigating to home page (maintaining session)');
    
    if (onLogoClick) {
      onLogoClick();
    } else {
      // Default behavior: navigate to home page (VHealthSearch)
      navigate('/');
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

      <header className={headerClasses} style={{
        paddingTop: PlatformDetectionService.isNative() ? '48px' : undefined
      }}>
        {/* === TOP BAR: Login + Settings Menu === */}
        <div className={CSS_CLASSES.VHEALTH_TOPBAR} style={{ justifyContent: 'space-between', padding: '8px 12px' }}>
          {/* Left corner: Navigation Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setShowNavMenu(!showNavMenu)}
              className="settings-menu-button w-10 h-10 rounded-xl bg-gray-100/60 flex items-center justify-center text-gray-700 backdrop-blur-sm"
              aria-label="Navigation menu"
              title="Menu"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          {/* Right side: Identity (UserPreference as Green Avatar) */}
          <div className={CSS_CLASSES.VHEALTH_TOPBAR_RIGHT} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {(() => {
              const isAuthed = authService.getState().isAuthenticated;
              
              if (showLogin && !PlatformDetectionService.isNative()) {
                if (isAuthed) {
                  // Show UserPreference as green avatar identity
                  return <UserPreference />;
                } else {
                  // Show login for non-authenticated users
                  return (
                    <div 
                      className={CSS_CLASSES.HEADER_AUTH_WRAPPER}
                      style={{
                        minWidth: '48px',
                        minHeight: '48px',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                      <MultiAuthLogin 
                        position="inline"
                        onUserChange={(user) => console.log('User changed in header:', user)}
                        onSignIn={(user) => console.log('User signed in from header:', user)}
                        onSignOut={() => console.log('User signed out from header')}
                      />
                    </div>
                  );
                }
              }
              
              return null;
            })()}
          </div>
        </div>
        
        {/* Navigation Menu Dropdown */}
        {showNavMenu && (
          <div 
            className="fixed inset-0 bg-black/20 z-[9999]" 
            onClick={() => setShowNavMenu(false)}
          >
            <div 
              className="nav-menu-container absolute top-16 left-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-3"
                onClick={() => {
                  navigate('/');
                  setShowNavMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#5f6368' }}>
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                Home
              </button>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-3"
                onClick={() => {
                  navigate('/dashboard');
                  setShowNavMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#5f6368' }}>
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
                Dashboard
              </button>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-3"
                onClick={() => {
                  navigate('/overview');
                  setShowNavMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#5f6368' }}>
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
                Overview
              </button>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-3"
                onClick={() => {
                  navigate('/parent');
                  setShowNavMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#5f6368' }}>
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                Parent Dashboard
              </button>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-3"
                onClick={() => {
                  navigate('/research');
                  setShowNavMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#5f6368' }}>
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                Research
              </button>
              <div className="border-t border-gray-200 my-2"></div>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-3"
                onClick={() => {
                  navigate('/about');
                  setShowNavMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#5f6368' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                </svg>
                About
              </button>
            </div>
          </div>
        )}

        {/* === MAIN BAR: Logo + Search === */}
        <div className={CSS_CLASSES.VHEALTH_MAINBAR}>
          {/* Logo Section */}
          <div className={CSS_CLASSES.VHEALTH_LOGO_CONTAINER}>
            <img
              src="/assets/wihylogohome.png"
              alt="What is Healthy?"
              className={`${CSS_CLASSES.VHEALTH_LOGO} ${variant}-logo`}
              onClick={handleLogoClick}
              style={{ cursor: 'pointer' }}
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
                      minHeight: '48px',
                      height: 'auto',
                      paddingRight: '120px',
                      paddingLeft: '16px',
                      fontSize: '16px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: '#202124',
                      border: 'none',
                      outline: 'none',
                      borderRadius: '24px',
                      background: 'transparent'
                    }}
                  />

                  <div 
                    className="search-icons"
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center',
                      background: 'transparent'
                    }}
                  >
                    {input && (
                      <button
                        type="button"
                        onClick={clearInput}
                        title="Clear"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#5f6368',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleImageUpload}
                      title="Upload image"
                      disabled={isLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#5f6368',
                        opacity: isLoading ? 0.5 : 1,
                        transition: 'background-color 0.2s, opacity 0.2s'
                      }}
                      onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#f1f3f4')}
                      onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      title={currentIsListening ? 'Stop listening' : 'Start voice input'}
                      disabled={isLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: currentIsListening ? '#4285f4' : '#5f6368',
                        opacity: isLoading ? 0.5 : 1,
                        transition: 'background-color 0.2s, opacity 0.2s, color 0.2s'
                      }}
                      onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#f1f3f4')}
                      onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'transparent')}
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