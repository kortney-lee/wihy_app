import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../styles/VHealthSearch.css';
import ImageUploadModal from '../ui/ImageUploadModal';
import MultiAuthLogin from '../shared/MultiAuthLogin';
import NutritionChart from '../charts/cards/NutritionChart';
import ResultQualityPie from '../charts/cards/ResultQualityPie';
import { wihyAPI, isUnifiedResponse, UnifiedResponse, WihyResponse } from '../../services/wihyAPI';
import { searchCache } from '../../services/searchCache';
import HealthNewsFeed from '../HealthNewsFeed';
import { getApiEndpoint } from '../../config/apiConfig';
import { logger } from '../../utils/logger';
import { chatService } from '../../services/chatService';
import { isLocalDevelopment, getTestDataForQuery } from '../../utils/testDataGenerator';

const rotatingPrompts = [
  "Ask me what is healthy",
  "Do we really need to eat several small meals per day?",
  "What's the real truth about detox?",
  "Why doesn't cleansing actually heal the body?",
  "What does it mean to rediscover real food?",
  "When did food become a prescription instead of nourishment?",
  "What do we really know about the metabolism?",
  "Is the thyroid the whole story—or just part of it?",
  "How are food and fertility connected to our future?",
  "What's the hidden cost of convenience in modern life?",
  "What exactly happened in the year 2000 that changed our health?",
  "How did disconnection start replacing love?"
];

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [placeholder, setPlaceholder] = useState(rotatingPrompts[0]);
  
  // Results display state (like VHealthApp)
  const [currentApiResponse, setCurrentApiResponse] = useState<UnifiedResponse | null>(null);
  const [currentChatResponse, setCurrentChatResponse] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  
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
  // ALLOW SCROLLING WHEN NEWS FEED OR RESULTS ARE OPEN
  // ================================
  useEffect(() => {
    if (showFeelingHealthyContent || showResults) {
      // Remove landing page classes to allow scrolling when news feed or results are open
      document.body.classList.remove('landing-page-active');
      document.documentElement.classList.remove('landing-page-active');
    } else {
      // Re-add landing page classes when news feed and results are closed
      document.body.classList.add('landing-page-active');
      document.documentElement.classList.add('landing-page-active');
    }
  }, [showFeelingHealthyContent, showResults]);

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
  // FORCE MOBILE ANIMATION
  // ================================
  useEffect(() => {
    // Force the animation to work on mobile by applying it directly
    const forceAnimation = () => {
      const container = document.querySelector('.search-input-container') as HTMLElement;
      if (container) {
        // Try a simpler animation approach for mobile
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
          // Mobile-specific animation using background-position sweep (matching desktop pattern)
          container.style.setProperty('border', '2px solid transparent', 'important');
          container.style.setProperty('background', `
            linear-gradient(#fff, #fff) padding-box,
            linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box
          `, 'important');
          container.style.setProperty('background-size', '100% 100%, 200% 100%', 'important');
          container.style.setProperty('animation', 'none', 'important');
          
          // Use background-position animation to match desktop sweep pattern
          let position = 0;
          const animateSweep = () => {
            position = (position + 1) % 200; // 0 to 200% like the original
            container.style.setProperty('background-position', `0 0, ${position}% 0`, 'important');
            setTimeout(() => requestAnimationFrame(animateSweep), 22); // ~2.2s for full cycle (200 * 22ms ≈ 4.4s)
          };
          animateSweep();
          
          container.classList.add('force-mobile-animation');
          logger.debug('Mobile device detected - custom gradient animation started');
        } else {
          // Desktop - use CSS animation
          container.style.setProperty('animation', 'wiH-border-sweep 2.2s linear infinite', 'important');
          container.style.setProperty('background', `
            linear-gradient(#fff, #fff) padding-box,
            linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17, #1a73e8) border-box
          `, 'important');
          container.style.setProperty('background-size', '100% 100%, 200% 100%', 'important');
          container.style.setProperty('border', '2px solid transparent', 'important');
          logger.debug('Desktop animation applied');
        }
        
        logger.debug('Forced animation applied to search container');
      }
    };

    // Apply immediately and also after a short delay to ensure it sticks
    forceAnimation();
    const timeoutId = setTimeout(forceAnimation, 100);
    
    // Also apply when the component mounts fully
    const mountTimeout = setTimeout(forceAnimation, 500);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(mountTimeout);
    };
  }, []);

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
          
          // 🔍 MAIN SEARCH LOGGING: API request initiated
          console.log('🔍 MAIN SEARCH API REQUEST:', {
            query: queryToUse,
            service: 'wihyAPI.searchHealth',
            timestamp: new Date().toISOString()
          });
          
          wihyResponse = await wihyAPI.searchHealth(queryToUse);
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
                fromSearch: true
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
    const barcodeData = input.data;
    const productName = barcodeData.product?.name || barcodeData.product_info?.name || 'Unknown Product';
    setSearchQuery(productName);
    
    const nutritionResults = {
      summary: input.summary,
      details: input.summary,
      sources: [],
      recommendations: barcodeData.health_analysis?.recommendations || [],
      relatedTopics: [],
      medicalDisclaimer: 'This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.',
      dataSource: 'wihy_scanner',
      scanResult: barcodeData,
      imageUrl: input.imageUrl // Pass through the image URL
    };
    
    setIsLoading(false);
    navigate(`/results?q=${encodeURIComponent(productName)}`, {
      state: {
        results: nutritionResults,
        apiResponse: {
          ...barcodeData,
          imageUrl: input.imageUrl // Include imageUrl in apiResponse
        },
        chatData: input.chatData, // Pass rich chat data
        dataSource: 'wihy_scanner',
        fromSearch: true,
        scanType: 'barcode',
        imageUrl: input.imageUrl // Pass imageUrl at top level too
      }
    });
    setIsUploadModalOpen(false);
  };

  /**
   * Handle product search results
   */
  const handleProductSearchResult = (input: any) => {
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
        imageUrl: input.imageUrl // Pass imageUrl at top level too
      }
    });
    setIsUploadModalOpen(false);
  };

  /**
   * Handle image analysis results
   */
  const handleImageAnalysisResult = (input: any) => {
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
        imageUrl: input.imageUrl // Pass imageUrl at top level too
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
        const wihyResponse = await wihyAPI.searchNutrition(foodName);
        
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
            // Pass the fresh nutrition results via navigation state
            navigate(`/results?q=${encodeURIComponent(foodName)}`, {
              state: {
                results: nutritionResults,
                apiResponse: wihyResponse, // Include the raw API response for ChatWidget
                dataSource: 'wihy',
                fromSearch: true
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
      // Removed auto-show behavior - let users click "I'm Feeling Healthy" button
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
        zIndex: 10002
      }}>
        <MultiAuthLogin className="main-login-button" position="top-right" />
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
              placeholder={placeholder}
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
                // If news is showing, just close it (don't change search query)
                setShowFeelingHealthyContent(false);
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

          {/* DEMO MODE BUTTON - Development only */}
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={() => {
                if (isLoading) return;
                navigate('/demo');
              }}
              className="search-btn secondary"
              type="button"
              style={{ 
                color: '#10b981',
                border: '1px solid #10b981',
                fontSize: '14px'
              }}
              disabled={isLoading}
            >
              Demo Mode
            </button>
          )}
        </div>
      </div>
      
      {/* HEALTH NEWS FEED - Shows when "I'm Feeling Healthy" is active */}
      {showFeelingHealthyContent && (
        <div 
          className="feeling-healthy-section"
          onClick={() => {
            // Close news feed when clicking anywhere in the white space
            setShowFeelingHealthyContent(false);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(2px)',
            zIndex: 500,
            overflow: 'auto',
            cursor: 'pointer',
            paddingTop: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: isMobile ? '0 10px' : '10px 20px',
              cursor: 'default'
            }}
          >
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

      {/* INLINE RESULTS DISPLAY - Shows search results without navigation */}
      {showResults && (
        <div 
          className="inline-results-section"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(2px)',
            zIndex: 1000,
            overflow: 'auto',
            padding: '20px'
          }}
        >
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '2fr 1fr',
            gap: '20px',
            minHeight: 'calc(100vh - 40px)'
          }}>
            
            {/* Chat Widget as Main Content */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '15px'
              }}>
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
            <div style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <h3 style={{ 
                marginBottom: '20px', 
                color: '#1f2937', 
                fontSize: '18px', 
                fontWeight: '600',
                flexShrink: 0 
              }}>
                Analysis Charts
              </h3>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '20px',
                flex: 1,
                overflow: 'auto'
              }}>
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