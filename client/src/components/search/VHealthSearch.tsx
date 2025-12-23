import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../styles/VHealthSearch.css';
import ImageUploadModal from '../ui/ImageUploadModal';
import MultiAuthLogin from '../shared/MultiAuthLogin';
import UserPreference from '../shared/UserPreference';
import { authService } from '../../services/authService';
import Spinner from '../ui/Spinner';
import NutritionChart from '../charts/cards/NutritionChart';
import ResultQualityPie from '../charts/cards/ResultQualityPie';
import { wihyAPI, isUnifiedResponse, UnifiedResponse, WihyResponse } from '../../services/wihyAPI';
import { searchCache } from '../../services/searchCache';
import { getApiEndpoint } from '../../config/apiConfig';
import { logger } from '../../utils/logger';
import { chatService } from '../../services/chatService';
import { sessionManager } from '../../services/sessionManager';
import { isLocalDevelopment, getTestDataForQuery } from '../../utils/testDataGenerator';
import { PlatformDetectionService } from '../../services/shared/platformDetectionService';
import { normalizeBarcodeScan } from '../../utils/nutritionDataNormalizer';
import { useDebugLog } from '../debug/DebugOverlay';
import { saveSessionToHistory } from '../debug/DebugOverlay';

// Pure Tailwind approach - animation defined in CSS files

const rotatingPrompts = [
  "Scan food and explain it",
  "Analyze my meals",
  "Create a nutrition plan for me",
  "Build me a workout plan",
  "Review this health claim",
  "Show me my habits over time",
  "Help me improve my health"
];

const VHealthSearch: React.FC = () => {
  const debug = useDebugLog('VHealthSearch');
  
  // Log component mount and initialize server debug session
  React.useEffect(() => {
    // Initialize debug session if ?debug=true
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('debug') === 'true') {
      const startTimeStr = sessionStorage.getItem('wihy_debug_start_time');
      let sessionId = sessionStorage.getItem('wihy_debug_session_id');
      
      if (!startTimeStr || !sessionId) {
        // First load - initialize fresh debug session
        const now = Date.now().toString();
        sessionId = `web_${now}_${Math.random().toString(36).substr(2, 9)}`;
        
        sessionStorage.setItem('wihy_debug_start_time', now);
        sessionStorage.setItem('wihy_debug_session_id', sessionId);
        sessionStorage.setItem('wihy_debug_session', JSON.stringify([]));
        
        // Create session on server
        import('../../services/debugLogService').then(({ debugLogService }) => {
          debugLogService.createSession(sessionId!);
        });
        
        console.log('[Debug] Fresh debug session initialized:', sessionId, 'at:', new Date(parseInt(now)));
      }
    }
    
    debug.logRender('VHealthSearch component mounted', {
      platform: PlatformDetectionService.getPlatform(),
      isNative: PlatformDetectionService.isNative(),
      width: window.innerWidth
    });
    
    // Initialize session manager
    sessionManager.initialize().then((session) => {
      debug.logState('Session initialized', {
        sessionId: session?.sessionId,
        isAuthenticated: session?.isAuthenticated,
        isTemporary: session?.isTemporary
      });
      console.log('Session initialized:', session);
    }).catch((error) => {
      debug.logError('Failed to initialize session', { error: error.message }, error);
      console.error('Failed to initialize session:', error);
    });
  }, []);
  
  // ================================
  // STATE MANAGEMENT
  // ================================
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Searching...');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [placeholder, setPlaceholder] = useState(rotatingPrompts[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Detect system dark/light mode
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  // Results display state (like VHealthApp)
  const [currentApiResponse, setCurrentApiResponse] = useState<UnifiedResponse | null>(null);
  const [currentChatResponse, setCurrentChatResponse] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  
  // Pull-to-refresh handler for native mobile
  const handleRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    debug.logEvent('Pull-to-refresh triggered (native)', { platform: PlatformDetectionService.getPlatform() });
    
    // Save current debug session to history BEFORE clearing
    saveSessionToHistory();
    
    // Clear debug session for fresh start
    sessionStorage.removeItem('wihy_debug_session');
    sessionStorage.removeItem('wihy_debug_start_time');
    sessionStorage.removeItem('wihy_debug_session_id');
    
    // Reload the page
    setTimeout(() => {
      window.location.reload();
    }, 300);
  }, [debug]);
  
  // Native pull-to-refresh setup
  React.useEffect(() => {
    // Enable native overscroll behavior for pull-to-refresh
    const container = document.querySelector('.search-landing');
    if (container) {
      (container as HTMLElement).style.overscrollBehavior = 'auto';
    }
    
    // Listen for native refresh event (iOS/Android)
    const handleNativeRefresh = () => {
      handleRefresh();
    };
    
    window.addEventListener('refresh', handleNativeRefresh);
    
    return () => {
      window.removeEventListener('refresh', handleNativeRefresh);
    };
  }, [handleRefresh]);
  
  // Log state changes
  React.useEffect(() => {
    if (searchQuery) {
      debug.logState('Search query updated', { searchQuery, length: searchQuery.length });
    }
  }, [searchQuery]);
  
  React.useEffect(() => {
    debug.logState('Loading state changed', { isLoading, loadingMessage });
  }, [isLoading, loadingMessage]);
  
  React.useEffect(() => {
    if (showResults) {
      debug.logState('Results displayed', { 
        hasApiResponse: !!currentApiResponse,
        hasChatResponse: !!currentChatResponse
      });
    }
  }, [showResults]);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);



  // ================================
  // HANDLE URL SEARCH PARAMETERS (Optional auto-population, no auto-search)
  // ================================
  useEffect(() => {
    const queryFromUrl = searchParams.get('q');
    if (queryFromUrl && queryFromUrl.trim()) {
      console.log('🔍 VHealthSearch: Auto-populating from URL parameter:', queryFromUrl);
      setSearchQuery(queryFromUrl);
      // Note: No auto-search here to avoid conflicts with direct navigation
    }
  }, [searchParams]);

  // ================================
  // LISTEN FOR SYSTEM THEME CHANGES (Android only)
  // ================================
  useEffect(() => {
    // Only run on native Android
    if (!PlatformDetectionService.isNative()) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDarkMode('matches' in e ? e.matches : (e as MediaQueryListEvent).matches);
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange as (e: MediaQueryListEvent) => void);
      return () => mediaQuery.removeEventListener('change', handleChange as (e: MediaQueryListEvent) => void);
    } 
    // Legacy browsers
    else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleChange);
      return () => (mediaQuery as any).removeListener(handleChange);
    }
  }, []);

  // ================================
  // PREVENT SCROLLBARS ON LANDING PAGE
  // ================================
  useEffect(() => {
    // Clear chat session when visiting home page
    try {
      chatService.clearSession();
      console.log('🔍 VHEALTHSEARCH: Cleared chat session on home page visit');
    } catch (error) {
      console.error('🔍 VHEALTHSEARCH: Error clearing chat session:', error);
    }
    
    // Add class to body to hide scrollbars on landing page
    document.body.classList.add('landing-page-active');
    document.documentElement.classList.add('landing-page-active');
    
    // Cleanup when component unmounts or navigates away
    return () => {
      document.body.classList.remove('landing-page-active');
      document.documentElement.classList.remove('landing-page-active');
    };
  }, []);

  // ================================
  // ALLOW SCROLLING WHEN RESULTS ARE OPEN
  // ================================
  useEffect(() => {
    if (showResults) {
      // Remove landing page classes to allow scrolling when results are open
      document.body.classList.remove('landing-page-active');
      document.documentElement.classList.remove('landing-page-active');
    } else {
      // Re-add landing page classes when results are closed
      document.body.classList.add('landing-page-active');
      document.documentElement.classList.add('landing-page-active');
    }
  }, [showResults]);

  // ================================
  // SCROLL DETECTION FOR LOGIN BUTTON
  // ================================
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = 10; // Hide login button when scrolled more than 10px
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
  // BORDER ANIMATION
  // ================================
  // Animation is now handled by the animate-border-sweep CSS class applied directly to the search-input-container
  // Following TailwindDemo patterns for cleaner utility-based animations

  // ================================
  // UTILITY FUNCTIONS
  // ================================

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
   * Clears search input, resets its height to default, and hides results
   */
  const handleClearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
    setCurrentApiResponse(null);
    setCurrentChatResponse('');
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
   * BACK TO SEARCH HANDLER
   * Clears results and returns to search interface
   */
  const handleBackToSearch = () => {
    setShowResults(false);
    setCurrentApiResponse(null);
    setCurrentChatResponse('');
    setSearchQuery('');
  };

  /**
   * NEW SEARCH HANDLER
   * Handles new search from chat widget or other components
   */
  const handleNewSearch = (newQuery: string) => {
    setSearchQuery(newQuery);
    handleSearch(newQuery);
  };

  /**
   * MAIN SEARCH HANDLER
   * Primary search function that handles text-based health queries
   * Flow: Check cache → API call → Save to cache → Display results inline
   * Uses 4-step fallback strategy for reliability
   */
  const handleSearch = async (queryParam?: string) => {
    const queryToUse = queryParam || searchQuery;
    if (!queryToUse.trim() || isLoading) return;
    
    // Debug logging
    debug.logEvent('Search initiated', { query: queryToUse });
    
    // 🔍 MAIN SEARCH LOGGING: Initial request
    console.log('🔍 MAIN SEARCH INITIATED:', {
      query: queryToUse,
      timestamp: new Date().toISOString(),
      component: 'VHealthSearch',
      action: 'handleSearch'
    });
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setIsLoading(true);
    setLoadingMessage('Initializing search...');
    
    // 🔍 MAIN SEARCH LOGGING: Loading state set
    console.log('🔍 MAIN SEARCH LOADING:', {
      query: queryToUse,
      isLoading: true,
      loadingMessage: 'Initializing search...',
      timestamp: new Date().toISOString()
    });
    
    try {
      // Get fresh results from WiHy API (cache is managed by the API)
      setLoadingMessage('Analyzing with AI...');
      
      // 🔍 MAIN SEARCH LOGGING: AI analysis phase
      console.log('🔍 MAIN SEARCH AI ANALYSIS:', {
        query: queryToUse,
        loadingMessage: 'Analyzing with AI...',
        timestamp: new Date().toISOString()
      });
      
      logger.debug('Getting fresh results for query', { query: queryToUse });
      
      try {
        // Check if we should use test data for local development
        let wihyResponse;
        
        if (isLocalDevelopment()) {
          // Use test data for local development
          console.log('🔍 USING TEST DATA FOR LOCAL DEVELOPMENT:', {
            query: queryToUse,
            timestamp: new Date().toISOString()
          });
          
          // Simulate API delay for realistic UX
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
          
          wihyResponse = getTestDataForQuery(queryToUse);
          
          console.log('🔍 TEST DATA GENERATED:', {
            query: queryToUse,
            hasData: !!(wihyResponse as any).data,
            responseKeys: Object.keys(wihyResponse),
            timestamp: new Date().toISOString()
          });
        } else {
          // Use WiHy Unified API for production
          logger.apiRequest('WiHy API search', { query: queryToUse });
          debug.logAPI('Calling wihyAPI.searchHealth', { query: queryToUse });
          
          // 🔍 MAIN SEARCH LOGGING: API request initiated
          console.log('🔍 MAIN SEARCH API REQUEST:', {
            query: queryToUse,
            service: 'wihyAPI.searchHealth',
            timestamp: new Date().toISOString()
          });
          
          wihyResponse = await wihyAPI.searchHealth(queryToUse);
          debug.logAPI('wihyAPI.searchHealth response received', { 
            success: wihyResponse.success,
            hasData: !!(wihyResponse as any).data 
          });
        }
        
        // 🔍 MAIN SEARCH LOGGING: API response received
        console.log('🔍 MAIN SEARCH API RESPONSE:', {
          query: queryToUse,
          success: wihyResponse.success,
          responseType: typeof wihyResponse,
          timestamp: new Date().toISOString(),
          hasData: !!(wihyResponse as any).data,
          responseKeys: Object.keys(wihyResponse),
          fullResponse: wihyResponse  // Debug: See the full response
        });
        
        // Check for response format - handle production, local server, test data, and new RAG responses
        const isProductionResponse = wihyResponse.success === true;
        const isLocalResponse = !('success' in wihyResponse) && 'analysis' in wihyResponse;
        const isRagResponse = 'type' in wihyResponse && 'response' in wihyResponse;
        const isTestDataResponse = wihyResponse.dataSource === 'test_generator';
        
        // 🔍 MAIN SEARCH LOGGING: Response format check
        console.log('🔍 MAIN SEARCH RESPONSE FORMAT CHECK:', {
          timestamp: new Date().toISOString(),
          hasSuccessField: 'success' in wihyResponse,
          hasAnalysisField: 'analysis' in wihyResponse,
          hasDataField: 'data' in wihyResponse,
          hasTypeField: 'type' in wihyResponse,
          hasResponseField: 'response' in wihyResponse,
          responseType: (wihyResponse as any).type,
          isValidLocalResponse: isLocalResponse,
          isValidProductionResponse: isProductionResponse,
          isValidRagResponse: isRagResponse,
          isTestDataResponse: isTestDataResponse,
          dataSource: (wihyResponse as any).dataSource
        });
        
        if (isProductionResponse || isLocalResponse || isRagResponse || isTestDataResponse) {
          // Handle both unified and legacy response formats
          let summary = 'Health information provided';
          let searchResults;
          
          if (isRagResponse) {
            // Handle new RAG response format
            const ragResp = wihyResponse as any;
            
            summary = ragResp.response || 'Health information provided';
            
            searchResults = {
              summary: summary,
              details: summary,
              sources: ragResp.citations || [],
              recommendations: ragResp.recommendations || [],
              relatedTopics: [],
              medicalDisclaimer: 'This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.',
              dataSource: 'wihy',
              chartData: ragResp.chart_data // Include chart data if available
            };
            
            // 🔍 MAIN SEARCH LOGGING: RAG response parsed
            console.log('🔍 RAG RESPONSE PARSED:', {
              timestamp: new Date().toISOString(),
              summaryLength: summary?.length || 0,
              detailsLength: searchResults.details?.length || 0,
              recommendationsCount: searchResults.recommendations?.length || 0,
              citationsCount: searchResults.sources?.length || 0,
              hasChartData: !!(ragResp.chart_data),
              responseType: ragResp.type,
              confidence: ragResp.confidence
            });
            
          } else if (isTestDataResponse) {
            // Handle test data response format
            const testResp = wihyResponse as any;
            
            summary = testResp.data?.ai_response?.response || 'Test data health analysis provided';
            
            searchResults = {
              summary: summary,
              details: summary,
              sources: testResp.data?.research_quality?.sources || [],
              recommendations: testResp.data?.ai_response?.recommendations || [
                'This is test data for local development',
                'Switch to production environment for real health insights',
                'Test data includes realistic sample values for dashboard charts'
              ],
              relatedTopics: [],
              medicalDisclaimer: 'This is test data for development purposes only. Not for actual medical guidance.',
              dataSource: 'test_generator',
              testData: testResp.data // Pass through the complete test data
            };
            
            // 🔍 MAIN SEARCH LOGGING: Test data response parsed
            console.log('🔍 TEST DATA RESPONSE PARSED:', {
              timestamp: new Date().toISOString(),
              summaryLength: summary?.length || 0,
              detailsLength: searchResults.details?.length || 0,
              recommendationsCount: searchResults.recommendations?.length || 0,
              hasTestData: !!(testResp.data),
              testDataKeys: Object.keys(testResp.data || {}),
              confidence: testResp.data?.ai_response?.metadata?.confidence
            });
            
          } else if (isLocalResponse) {
            // Handle local development server response format
            const localResp = wihyResponse as any;
            const analysis = localResp.analysis;
            
            summary = analysis?.summary || 'Health information provided';
            
            searchResults = {
              summary: summary,
              details: analysis?.details || summary,
              sources: [], // Local server doesn't provide sources in same format
              recommendations: analysis?.recommendations || [],
              relatedTopics: [],
              medicalDisclaimer: 'This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.',
              dataSource: 'wihy'
            };
            
            // 🔍 MAIN SEARCH LOGGING: Local response parsed
            console.log('🔍 LOCAL RESPONSE PARSED:', {
              timestamp: new Date().toISOString(),
              summaryLength: summary?.length || 0,
              detailsLength: searchResults.details?.length || 0,
              recommendationsCount: searchResults.recommendations?.length || 0,
              hasCharts: !!(analysis?.charts),
              analysisKeys: Object.keys(analysis || {})
            });
            
          } else if ('data' in wihyResponse) {
            // New unified API response format  
            summary = (wihyResponse as any).data?.response || summary;
            
            searchResults = {
              summary: summary,
              details: wihyAPI.formatWihyResponse(wihyResponse),
              sources: wihyAPI.extractCitations(wihyResponse),
              recommendations: wihyAPI.extractRecommendations(wihyResponse),
              relatedTopics: [],
              medicalDisclaimer: 'This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.',
              dataSource: 'wihy'
            };
          } else {
            // Legacy WihyResponse format
            summary = (wihyResponse as any).wihy_response?.core_principle || summary;
            
            searchResults = {
              summary: summary,
              details: wihyAPI.formatWihyResponse(wihyResponse),
              sources: wihyAPI.extractCitations(wihyResponse),
              recommendations: wihyAPI.extractRecommendations(wihyResponse),
              relatedTopics: [],
              medicalDisclaimer: 'This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.',
              dataSource: 'wihy'
            };
          }
          
          console.log('WiHy search results received:', searchResults);
        
          const isValidResult = searchResults && 
            typeof searchResults === 'object' && 
            searchResults !== null &&
            (searchResults.summary || searchResults.details || Object.keys(searchResults).length > 0);
          
          if (isValidResult) {
            logger.info('Valid search results confirmed');
            
            // Show "Results ready!" for a moment to give user feedback
            setLoadingMessage('Results ready!');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get current session ID from session manager
            const sessionId = sessionManager.getSessionId();
            
            // Navigate to SearchResults with the results
            navigate(`/results?q=${encodeURIComponent(queryToUse)}`, {
              state: {
                results: {
                  summary: summary,
                  details: summary, // Use the extracted summary
                  sources: wihyAPI.extractCitations(wihyResponse),
                  recommendations: wihyAPI.extractRecommendations(wihyResponse),
                  relatedTopics: [],
                  medicalDisclaimer: 'This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.',
                  dataSource: 'wihy'
                },
                apiResponse: wihyResponse,
                dataSource: 'wihy',
                fromSearch: true,
                sessionId // Pass session ID for continuity
              }
            });
            
            // Turn off loading after navigation
            setIsLoading(false);
            logger.debug('Navigating to SearchResults route');
            return;
          } else {
            throw new Error('WiHy API returned invalid results');
          }
        } else {
          throw new Error('WiHy API request failed');
        }
        
      } catch (apiError) {
        // Handle AbortError specifically
        if (apiError.name === 'AbortError') {
          logger.debug('API request was cancelled');
          return; // Exit early
        }
        
        const isNetworkError = apiError.message?.includes('NETWORK_ERROR') || 
                              apiError.message?.includes('TIMEOUT_ERROR') ||
                              apiError.message?.includes('fetch') || 
                              apiError.message?.includes('network') || 
                              apiError.name === 'TypeError' ||
                              apiError.message?.includes('Failed to fetch');
        
        const isServerError = apiError.message?.includes('SERVER_ERROR');
        const isCorsError = apiError.message?.includes('CORS_ERROR');
        
        if (isCorsError) {
          logger.error('CORS error in health search:', apiError);
          setLoadingMessage('Configuration hiccup! 🔧 Our team is fixing this - try again later!');
        } else if (isNetworkError) {
          logger.error('Network error in health search:', apiError);
          setLoadingMessage('Connection trouble! 🌐 Our servers might be napping...');
        } else if (isServerError) {
          logger.error('Server error in health search:', apiError);
          setLoadingMessage('Our servers are taking a coffee break ☕ Come back in a few minutes!');
        } else {
          logger.error('Health search service failed:', apiError);
          setLoadingMessage('Search hit a snag! 🔍 Please try again later.');
        }
        
        // Show error message for a few seconds then reset
        setTimeout(() => {
          setIsLoading(false);
          setLoadingMessage('Searching...');
        }, 4000);
        return;
      }
        
    } catch (error) {
      // Handle AbortError specifically
      if (error.name === 'AbortError') {
        logger.debug('Search request was cancelled');
        return; // Exit early
      }
      
      logger.error("Search error:", error);
      
      // Check for specific error types
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('CORS_ERROR')) {
        setLoadingMessage('Configuration issue! 🔧 Our team is working on this - please try again later!');
      } else if (errorMessage.includes('NETWORK_ERROR') || errorMessage.includes('TIMEOUT_ERROR')) {
        setLoadingMessage('Oops! Our servers are taking a coffee break ☕ Come back in a few minutes!');
      } else if (errorMessage.includes('SERVER_ERROR')) {
        setLoadingMessage('Server hiccup! 🤖 Please try again in a moment.');
      } else if (errorMessage.includes('fetch') || 
                 errorMessage.includes('network') || 
                 error.name === 'TypeError') {
        setLoadingMessage('Connection trouble! 📡 Please check your internet and try again.');
      } else {
        setLoadingMessage('Something went wrong! Please try your search again 🔄');
      }
      
      setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage('Searching...');
      }, 4000); // Give a bit more time to read the friendly message
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
  // STRUCTURED RESPONSE HANDLERS
  // ================================

  /**
   * Handle barcode scan results
   */
  const handleBarcodeResult = (input: any) => {
    console.log('🔍 HANDLE BARCODE RESULT CALLED:', input);
    debug.logScan('Barcode scan result received', { 
      hasData: !!input.data,
      barcode: input.barcode,
      productName: input.data?.product?.name 
    });
    
    const barcodeData = input.data;
    const productName = barcodeData.product?.name || barcodeData.product_info?.name || 'Unknown Product';
    console.log('🔍 Product name extracted:', productName);
    setSearchQuery(productName);
    
    // Normalize barcode scan data to universal NutritionFactsData format
    const nutritionfacts = normalizeBarcodeScan(input);
    console.log('🔍 Normalized nutrition facts:', nutritionfacts);
    
    setIsLoading(false);
    
    // Get current session ID from session manager
    const sessionId = sessionManager.getSessionId();
    
    console.log('🔍 ABOUT TO NAVIGATE TO NUTRITIONFACTS');
    debug.logNavigation('Navigating to NutritionFacts from barcode', { productName, sessionId });
    
    // Preserve debug parameter if present
    const searchParams = new URLSearchParams(window.location.search);
    const debugParam = searchParams.get('debug') === 'true' ? '?debug=true' : '';
    
    // Close modal first, then navigate after a brief delay to avoid navigation conflicts
    setIsUploadModalOpen(false);
    console.log('🔍 MODAL CLOSED');
    
    // Use setTimeout to ensure modal closes before navigation
    setTimeout(() => {
      console.log('🔍 EXECUTING NAVIGATION');
      const queryText = `Tell me about ${productName}`;
      console.log('🔍 Initial query text:', queryText);
      
      // Navigate to new NutritionFacts page instead of SearchResults
      navigate(`/nutritionfacts${debugParam}`, {
        state: {
          initialQuery: queryText,
          nutritionfacts: nutritionfacts,
          sessionId: sessionId, // Pass session ID for continuity
          fromChat: false, // Open in overview (nutrition facts) view when scanning from camera
        },
      });
      console.log('🔍 NAVIGATE CALLED');
    }, 100);
  };

  /**
   * Handle product search results
   */
  const handleProductSearchResult = (input: any) => {
    debug.logScan('Product search result received', { 
      hasData: !!input.data,
      summary: input.summary
    });
    
    const productData = input.data;
    const productName = productData.analysis?.summary || input.summary || 'Product Search Result';
    setSearchQuery(productName);
    
    const nutritionResults = {
      summary: input.summary,
      details: input.summary,
      sources: [],
      recommendations: productData.analysis?.recommendations || [],
      relatedTopics: [],
      medicalDisclaimer: 'This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.',
      dataSource: 'wihy_scanner',
      scanResult: productData,
      imageUrl: input.imageUrl // Pass through the image URL
    };
    
    setIsLoading(false);
    
    // Get current session ID from session manager
    const sessionId = sessionManager.getSessionId();
    
    navigate(`/results?q=${encodeURIComponent(productName)}`, {
      state: {
        results: nutritionResults,
        apiResponse: {
          ...productData,
          imageUrl: input.imageUrl // Include imageUrl in apiResponse
        },
        chatData: input.chatData, // Pass rich chat data
        dataSource: 'wihy_scanner',
        fromSearch: true,
        scanType: 'product_search',
        imageUrl: input.imageUrl, // Pass imageUrl at top level too
        sessionId // Pass session ID for continuity
      }
    });
    setIsUploadModalOpen(false);
  };

  /**
   * Handle image analysis results
   */
  const handleImageAnalysisResult = (input: any) => {
    debug.logScan('Image analysis completed', { 
      summary: input.summary, 
      type: input.type,
      hasImageUrl: !!input.imageUrl 
    });
    
    const analysisData = input.data;
    const analysisName = input.summary || 'Image Analysis Result';
    setSearchQuery(analysisName);
    
    const nutritionResults = {
      summary: input.summary,
      details: input.summary,
      sources: [],
      recommendations: analysisData.analysis?.recommendations || [],
      relatedTopics: [],
      medicalDisclaimer: 'This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.',
      dataSource: input.type === 'vision_analysis' ? 'vision_analysis' : 'wihy_scanner',
      scanResult: analysisData,
      imageUrl: input.imageUrl // Pass through the image URL
    };
    
    setIsLoading(false);
    
    // Get current session ID from session manager
    const sessionId = sessionManager.getSessionId();
    
    navigate(`/results?q=${encodeURIComponent(analysisName)}`, {
      state: {
        results: nutritionResults,
        apiResponse: {
          ...analysisData,
          imageUrl: input.imageUrl // Include imageUrl in apiResponse
        },
        chatData: input.chatData, // Pass rich chat data
        dataSource: input.type === 'vision_analysis' ? 'vision_analysis' : 'wihy_scanner',
        fromSearch: true,
        scanType: 'image_analysis',
        imageUrl: input.imageUrl, // Pass imageUrl at top level too
        sessionId // Pass session ID for continuity
      }
    });
    setIsUploadModalOpen(false);
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
  const handleAnalysisComplete = async (input: string | any): Promise<void> => {
    if (!input || isLoading) {
      setIsUploadModalOpen(false);
      return;
    }
    
    debug.logEvent('Analysis complete handler called', { 
      inputType: typeof input,
      isStructured: typeof input === 'object' && input.type
    });

    // Create abort controller for this request too
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      // Handle structured responses from ImageUploadModal
      if (typeof input === 'object' && input.type) {
        console.log(`${input.type} completed, processing structured result:`, input);
        
        // Handle different types of structured responses
        // Note: barcode_scan, product_search, and image_analysis already have their data
        // so we don't need to show the loading overlay - they're ready to navigate
        switch (input.type) {
          case 'barcode_scan':
            return handleBarcodeResult(input);
            
          case 'product_search':
            return handleProductSearchResult(input);
            
          case 'image_analysis':
          case 'vision_analysis':
            return handleImageAnalysisResult(input);
            
          case 'error':
            console.error('Analysis error:', input.error);
            debug.logError('Analysis error received', new Error(input.error || 'Unknown error'));
            setIsLoading(false);
            // You could show a toast/notification here
            return;
            
          default:
            console.warn('Unknown structured response type:', input.type);
            // Fall through to handle as string
        }
      }
      
      // For string inputs (legacy or manual), we need to fetch nutrition data
      // So we show the loading overlay
      setIsLoading(true);
      setLoadingMessage('Processing analysis...');
      
      // Handle traditional string input (food name)
      const foodName = typeof input === 'string' ? input : String(input);
      console.log("Image analysis completed, food detected:", foodName);
      setSearchQuery(foodName);
      
      // Search for nutrition data using WiHy API (cache managed by API)
      setLoadingMessage('Analyzing nutrition content...');
      
      try {
        logger.debug('Making WiHy API nutrition search for:', foodName);
        debug.logAPI('Calling wihyAPI.searchNutrition', { foodName });
        
        const wihyResponse = await wihyAPI.searchNutrition(foodName);
        
        debug.logAPI('wihyAPI.searchNutrition response', { 
          success: wihyResponse.success,
          hasData: 'data' in wihyResponse
        });
        
        if (wihyResponse.success) {
          // Handle both unified and legacy response formats
          let summary = 'Nutrition information provided';
          if ('data' in wihyResponse) {
            // New unified API response format
            summary = (wihyResponse as any).data?.response || summary;
          } else {
            // Legacy WihyResponse format
            summary = (wihyResponse as any).wihy_response?.core_principle || summary;
          }
          
          // Convert WiHy response to expected format
          const nutritionResults = {
            summary: summary,
            details: wihyAPI.formatWihyResponse(wihyResponse),
            sources: wihyAPI.extractCitations(wihyResponse),
            recommendations: wihyAPI.extractRecommendations(wihyResponse),
            relatedTopics: [],
            medicalDisclaimer: 'This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.',
            dataSource: 'wihy'
          };
          
          const isValidResult = nutritionResults && 
            typeof nutritionResults === 'object' && 
            nutritionResults !== null &&
            (nutritionResults.summary || nutritionResults.details || Object.keys(nutritionResults).length > 0);
          
          if (isValidResult) {
            // Nutrition analysis complete - cache is managed by the API
            setLoadingMessage('Nutrition analysis complete!');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setIsLoading(false);
            
            // Get current session ID from session manager
            const sessionId = sessionManager.getSessionId();
            
            // Pass the fresh nutrition results via navigation state
            navigate(`/results?q=${encodeURIComponent(foodName)}`, {
              state: {
                results: nutritionResults,
                apiResponse: wihyResponse, // Include the raw API response for ChatWidget
                dataSource: 'wihy',
                fromSearch: true,
                sessionId // Pass session ID for continuity
              }
            });
            return;
          } else {
            throw new Error('WiHy API returned invalid nutrition results');
          }
        } else {
          throw new Error('WiHy nutrition API request failed');
        }
        
      } catch (nutritionError) {
        logger.error('Nutrition analysis failed:', nutritionError);
        
        setLoadingMessage('Hmm, we couldn\'t figure out what that food is 🤔 Try a different photo or search manually!');
        setTimeout(() => {
          setIsLoading(false);
          setLoadingMessage('Searching...');
        }, 4000);
        return;
      }
      
    } catch (error) {
      logger.error("Error processing analyzed food:", error);
      
      const isNetworkError = error.message?.includes('fetch') || 
                            error.message?.includes('network') || 
                            error.name === 'TypeError';
      
      if (isNetworkError) {
        setLoadingMessage('Oops! Connection hiccup 📡 Please try again in a moment!');
      } else {
        setLoadingMessage('Food analysis had a little hiccup 🍎 Please try again!');
      }
      
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

  // Auto-show news feed on mobile devices - REMOVED TO MATCH DESKTOP BEHAVIOR
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || 'ontouchstart' in window;
      setIsMobile(isMobileDevice);
      // Removed auto-show behavior - let users click "Verify With Evidence" button
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Rotating placeholder effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(prev => {
        const nextIndex = (rotatingPrompts.indexOf(prev) + 1) % rotatingPrompts.length;
        return rotatingPrompts[nextIndex];
      });
    }, 4000); // rotate every 4 seconds
    return () => clearInterval(interval);
  }, []);


  // ================================
  // MAIN COMPONENT RENDER
  // ================================

  return (
    <div className="search-landing">
      {/* LOADING SPINNER - Shows during search operations */}
      {isLoading && (
        <Spinner
          overlay={true}
          title={loadingMessage}
          subtitle="This may take a few moments..."
          disableEsc={false}
          onClose={handleCancelSearch}
          type="gif"
        />
      )}
      
      {/* AUTHENTICATION COMPONENT - Top-right login/logout (Hidden visually on mobile but still rendered for functionality) */}
      <div className={`fixed top-5 right-5 z-[10002] ${
        PlatformDetectionService.isNative() ? 'hidden' : 'block'
      }`}>
        {(() => {
          const isAuthed = authService.getState().isAuthenticated;
          
          // Signed out = show login
          if (!isAuthed) {
            return <MultiAuthLogin className="main-login-button" position="top-right" />;
          }
          
          // Signed in = show hamburger (UserPreference)
          return <UserPreference />;
        })()}
      </div>

      {/* MAIN SEARCH INTERFACE - Centered on page */}
      <div className="search-container-centered">
        {/* LOGO SECTION - Shows either image logo or text fallback */}
        <div className="logo-container">
          {!imageError ? (
            <img 
              src="/assets/wihylogo.png?v=2025-11-05"
              alt="What is Healthy?"
              className="search-logo-image"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
              onClick={() => navigate('/about')}
              style={{ cursor: 'pointer' }}
            />
          ) : (
            <h1 
              className="search-logo"
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer' }}
            >
              What is Healthy?
            </h1>
          )}
        </div>
        
        {/* SEARCH INPUT SECTION - Main search bar with icons */}
        <div className="relative w-full max-w-[584px] mx-auto my-6 p-0 rounded-3xl bg-white transition-shadow duration-200 shadow-[0_2px_5px_1px_rgba(64,60,67,0.16)] hover:shadow-[0_2px_5px_1px_rgba(64,60,67,0.16)] focus-within:shadow-[0_2px_5px_1px_rgba(64,60,67,0.16)] animate-border-sweep border-2 border-transparent" style={{background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box', backgroundSize: '100% 100%, 200% 100%'}}>
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
              placeholder={placeholder}
              className="w-full min-h-[44px] max-h-[40vh] py-2.5 pl-4 pr-[128px] text-base text-gray-800 bg-transparent border-none outline-none rounded-3xl resize-none overflow-hidden font-sans leading-6 placeholder-gray-400 md:min-h-[48px] md:pr-[128px] md:pl-4 md:py-3 focus:text-left disabled:opacity-60 disabled:cursor-not-allowed"
              autoFocus
              disabled={isLoading}
              rows={1}
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
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5 items-center bg-white/90 p-1 rounded-2xl md:gap-2 md:p-1">
            {/* CLEAR BUTTON - Clears current search query */}
            {searchQuery && (
              <button 
                className="w-8 h-8 border-none bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-blue-600 transition-colors cursor-pointer rounded-full flex items-center justify-center" 
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
              className="w-8 h-8 border-none bg-transparent text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
              className={`w-8 h-8 border-none transition-colors cursor-pointer rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                isListening 
                  ? 'bg-red-500 text-white' 
                  : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-blue-600'
              }`}
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

        {/* ACTION BUTTONS - Large mobile-friendly buttons similar to Google interface */}
        <div className="search-buttons-mobile">
          {/* PRIMARY SEARCH BUTTON - Triggers main search function */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className={`h-12 !bg-[#4285f4] text-white border-none rounded-3xl text-base font-medium m-2 transition-all duration-200 ease shadow-[0_2px_4px_rgba(0,0,0,0.1)] flex items-center justify-center px-6 ${
              isLoading || !searchQuery.trim() ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
            disabled={!searchQuery.trim() || isLoading}
            onMouseOver={(e) => {
              if (!isLoading && searchQuery.trim()) {
                e.currentTarget.style.backgroundColor = '#3367d6';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading && searchQuery.trim()) {
                e.currentTarget.style.backgroundColor = '#4285f4';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }
            }}
          >
            {isLoading ? loadingMessage : 'Analyze Nutrition'}
          </button>
          
          {/* VERIFY WITH EVIDENCE BUTTON - Navigates to research dashboard */}
          <button 
            onClick={() => {
              if (isLoading) return;
              navigate('/research');
            }}
            className={`h-12 !bg-[#f8f9fa] !text-[#3c4043] !border !border-[#f0f0f0] rounded-3xl text-base font-medium m-2 transition-all duration-200 ease shadow-md flex items-center justify-center px-6 ${
              isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
            type="button"
            disabled={isLoading}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#f1f3f4';
                e.currentTarget.style.borderColor = '#dadce0';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#f0f0f0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }
            }}
          >
            Verify With Evidence
          </button>
        </div>
      </div>
      
      {/* INLINE RESULTS DISPLAY - Shows search results without navigation */}
      {showResults && (
        <div className="fixed inset-0 bg-white/98 backdrop-blur-sm z-[1000] overflow-auto p-5">
          <div className={`max-w-6xl mx-auto gap-5 min-h-[calc(100vh-2.5rem)] ${
            window.innerWidth <= 768 ? 'grid grid-cols-1' : 'grid grid-cols-3'
          }`}>
            
            {/* Chat Widget as Main Content */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-lg p-6 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-4">
                <h2 style={{ 
                  margin: 0, 
                  color: '#1f2937', 
                  fontSize: '20px', 
                  fontWeight: '600' 
                }}>
                  Search Results: {searchQuery}
                </h2>
                <button
                  onClick={handleBackToSearch}
                  style={{
                    background: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#6b7280'
                  }}
                >
                  ← Back to Search
                </button>
              </div>
              
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {/* Chat functionality moved to FullScreenChat */}
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#6b7280' 
                }}>
                  <p>Chat functionality is now available via the floating chat button.</p>
                </div>
              </div>
            </div>

            {/* Charts Sidebar */}
            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-lg flex flex-col overflow-hidden">
              <h3 className="mb-5 text-gray-800 text-lg font-semibold flex-shrink-0">
                Analysis Charts
              </h3>
              <div className="flex flex-col gap-5 flex-1 overflow-auto">
                {currentApiResponse && (
                  <>
                    <div style={{ minHeight: '200px' }}>
                      <NutritionChart 
                        apiResponse={currentApiResponse}
                      />
                    </div>
                    
                    <div style={{ minHeight: '200px' }}>
                      <ResultQualityPie 
                        apiResponse={currentApiResponse}
                      />
                    </div>
                  </>
                )}
                
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '15px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    <strong>Dev Mode:</strong> Charts display based on search context
                  </div>
                )}
              </div>
            </div>
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

      {/* BOTTOM NAVIGATION - Mobile-friendly menu (Android standard 56dp height) */}
      {PlatformDetectionService.isNative() && (
        <div className={`fixed bottom-0 left-0 right-0 h-14 flex justify-around items-center border-t z-[1200] ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200 shadow-lg'
        }`}>
          {/* Analyze Nutrition - Links to Search */}
          <button
            onClick={() => {
              setSearchQuery('');
              setShowResults(false);
            }}
            className={`flex-1 flex flex-col items-center justify-start bg-transparent border-none p-0 cursor-pointer gap-1 transition-colors ${
              isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <span className="text-[11px] font-medium">Search</span>
          </button>

          {/* Scan - Camera/Upload */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className={`flex-1 flex flex-col items-center justify-start bg-transparent border-none p-0 cursor-pointer gap-1 transition-colors ${
              isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-600 hover:text-green-600'
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
            <span className="text-[11px] font-medium">Scan</span>
          </button>

          {/* Verify With Evidence - Navigate to Research Dashboard */}
          <button
            onClick={() => {
              navigate('/research');
            }}
            className={`flex-1 flex flex-col items-center justify-start bg-transparent border-none p-0 cursor-pointer gap-1 transition-colors ${
              isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            <span className="text-[11px] font-medium">Research</span>
          </button>

          {/* Login/Account */}
          <button
            onClick={() => {
              // Trigger the login button click
              const loginButton = document.querySelector('.main-login-button button');
              if (loginButton) {
                (loginButton as HTMLElement).click();
              }
            }}
            className={`flex-1 flex flex-col items-center justify-start bg-transparent border-none p-0 cursor-pointer gap-1 transition-colors ${
              isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          <span className="text-[11px] font-medium">Login</span>
        </button>
      </div>
    )}
    </div>
  );
};export default VHealthSearch;