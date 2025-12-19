import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UserPreference from '../shared/UserPreference';
import { searchCache } from '../../services/searchCache';
import ImageUploadModal from '../ui/ImageUploadModal';
import { PlatformDetectionService } from '../../services/shared/platformDetectionService';
import NutritionChart from '../charts/cards/NutritionChart';
import ResearchQualityGauge from '../charts/cards/ResearchQualityGauge';
import ResultQualityPie from '../charts/cards/ResultQualityPie';
import MembersCard from '../charts/individual/MembersCard';
import AnalyzeWithWihyButton from '../charts/shared/AnalyzeWithWihyButton';
import DashboardCharts from '../charts/grids/DashboardCharts';
import QuickInsights from '../charts/cards/QuickInsights';
import BloodPressureChart from '../charts/individual/BloodPressureChart';
import { ChartType, CHART_TYPE_CONFIGS, getChartTypesByPriority, getChartTypesByTab } from '../charts/chartTypes';
import FullScreenChat, { FullScreenChatRef } from '../ui/FullScreenChat';
import MyProgressDashboard, { WihyCoachModel } from '../dashboard/MyProgressDashboard';
import CoachDashboard from '../dashboard/CoachDashboard';
import ParentDashboard from '../dashboard/ParentDashboard';
import ConsumptionDashboard from '../dashboard/ConsumptionDashboard';
import ResearchDashboard from '../dashboard/ResearchDashboard';
import FitnessDashboard, { FitnessDashboardModel, buildProgramKey } from '../dashboard/FitnessDashboard';
import OverviewDashboard from '../dashboard/OverviewDashboard';
import { ExerciseRowView } from '../dashboard/WorkoutProgramGrid';
import { CSS_CLASSES } from '../../constants/cssConstants';
import '../../styles/VHealthSearch.css';
import '../../styles/Dashboard.css';
import '../../styles/charts.css';
import '../../styles/chat-overlay.css';
import Header from '../shared/Header';
import { extractHealthMetrics, extractBMIData, extractNutritionData, extractHealthRiskData } from '../../utils/healthDataExtractor';
import Spinner from '../ui/Spinner';
import { logger } from '../../utils/logger';
import { authService } from '../../services/authService';

// Tab type definition - matches chartTypes.ts tabView values
type SearchTab = 'overview' | 'charts' | 'consumption' | 'fitness' | 'coach';

// Tab configuration
const TAB_CONFIG = {
  overview: { label: 'Dashboard', value: 'overview' as SearchTab },
  charts: { label: 'My Progress', value: 'charts' as SearchTab },
  consumption: { label: 'Intake & Consumption', value: 'consumption' as SearchTab },
  fitness: { label: 'Fitness', value: 'fitness' as SearchTab },
  coach: { label: 'Coach Portal', value: 'coach' as SearchTab }
};

const TABS = Object.values(TAB_CONFIG);

// Handle ResizeObserver errors - suppress harmless loop notifications
const resizeObserverErrorHandler = (error: ErrorEvent) => {
  if (error.message && error.message.includes('ResizeObserver loop')) {
    return true; // Prevent the error from being thrown
  }
  return false;
};

// Add error handler for ResizeObserver
if (typeof window !== 'undefined') {
  window.addEventListener('error', resizeObserverErrorHandler);
}





// Update the SearchResultsProps interface to include the new properties
interface SearchResultsProps {
  query: string;
  results: string;
  onBackToSearch: () => void;
  onNewSearch: (query: string) => void;
  isLoading: boolean;
  dataSource: "error" | "openai" | "local" | "vnutrition" | "wihy";
  citations?: string[];
  recommendations?: string[];
  disclaimer?: string;
  apiResponse?: any; // Add unified API response for chart components
  autoOpenChat?: boolean; // Add prop to automatically open chat when coming from VHealthSearch
  hideChatWidget?: boolean; // Hide chat widget completely (e.g., when coming from NutritionFacts)
  sessionId?: string; // Session ID for maintaining continuity across pages
}

// Add this function before the SearchResults component
const convertLinksToClickable = (text: any): React.ReactNode => {
  // Handle non-string inputs
  if (!text) return null;
  
  // If text is not a string, convert it to string first
  if (typeof text !== 'string') {
    // If it's an object, try to stringify it or extract meaningful content
    if (typeof text === 'object') {
      // If it has specific properties we can use
      if (text.content) {
        text = text.content;
      } else if (text.message) {
        text = text.message;
      } else if (text.details) {
        text = text.details;
      } else {
        // Last resort - stringify the object
        text = JSON.stringify(text);
      }
    } else {
      // Convert other types to string
      text = String(text);
    }
  }

  // Now we're sure text is a string, proceed with original logic
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => (
        urlRegex.test(part) ? (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#2563eb', textDecoration: 'underline' }}
          >
            {part}
          </a>
        ) : (
          part
        )
      ))}
    </>
  );
};

const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  results,
  onBackToSearch: _onBackToSearch,
  onNewSearch,
  isLoading,
  dataSource,
  citations: _citations = [],
  recommendations: _recommendations = [],
  disclaimer: _disclaimer = "",
  apiResponse,
  autoOpenChat = false,
  hideChatWidget = false,
  sessionId
}) => {
  // Debug log for hideChatWidget
  useEffect(() => {
    console.log('🔍 SEARCH RESULTS hideChatWidget:', hideChatWidget);
  }, [hideChatWidget]);
  
  // Only log on significant changes, not every render
  const prevQueryRef = useRef<string>('');
  
  useEffect(() => {
    if (query !== prevQueryRef.current) {
      console.log('🔍 SEARCH RESULTS: New query -', query);
      prevQueryRef.current = query;
    }
  }, [query]);
  
  const [input, setInput] = useState('');
  const [image, setImage] = useState<File | string | null>(null);
  const [currentPhotoId, setCurrentPhotoId] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: string} | null>(null);
  const [isUploadLoading, setUploadLoading] = useState(false);
  const [lastProcessedQuery, setLastProcessedQuery] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatRef = useRef<FullScreenChatRef>(null);
  const [activeTab, setActiveTab] = useState<SearchTab>('overview');

  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeQuery.addEventListener('change', handler);
    return () => darkModeQuery.removeEventListener('change', handler);
  }, []);





  // Tab bar styles - Responsive with mobile-friendly touch targets
  const tabBarStyles = {
    tab: {
      padding: windowWidth < 768 ? '10px 16px' : '12px 20px',
      borderRadius: windowWidth < 768 ? '20px' : '24px',
      fontSize: windowWidth < 768 ? '14px' : '15px',
      fontWeight: 600 as const,
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.2s ease',
      outline: 'none',
      whiteSpace: 'nowrap' as const,
      userSelect: 'none' as const,
      minHeight: windowWidth < 768 ? '44px' : 'auto', // Minimum touch target size
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    tabActive: {
      background: '#111827',
      color: '#ffffff'
    },
    tabInactive: {
      background: '#f3f4f6',
      color: '#111827'
    },
    tabHover: {
      background: '#e5e7eb',
      color: '#111827'
    }
  };

  // Extract dynamic health data from API response
  const healthMetrics = extractHealthMetrics(apiResponse);
  const bmiData = extractBMIData(apiResponse);
  const nutritionData = extractNutritionData(apiResponse);
  const healthRiskData = extractHealthRiskData(apiResponse);
  
  // Calculate dynamic dashboard values
  const calculateAlerts = () => {
    let alertCount = 0;
    
    // Check BMI alerts
    if (bmiData.bmi < 18.5 || bmiData.bmi > 25) alertCount++;
    
    // Check steps alerts
    if (healthMetrics.steps.progress < 70) alertCount++;
    
    // Check sleep alerts
    if (healthMetrics.sleep.hours < 6 || healthMetrics.sleep.hours > 9) alertCount++;
    
    // Check calories alerts
    if (healthMetrics.calories.progress < 50 || healthMetrics.calories.progress > 120) alertCount++;
    
    return alertCount;
  };
  
  const calculateRecommendations = () => {
    const recommendations = [];
    
    // BMI recommendations
    if (bmiData.bmi < 18.5) recommendations.push('Consider healthy weight gain');
    if (bmiData.bmi > 25) recommendations.push('Consider healthy weight loss');
    
    // Activity recommendations
    if (healthMetrics.steps.progress < 70) recommendations.push('Increase daily activity');
    
    // Sleep recommendations
    if (healthMetrics.sleep.hours < 7) recommendations.push('Improve sleep quality');
    
    // Nutrition recommendations
    if (nutritionData) recommendations.push('Maintain balanced nutrition');
    
    // Health risk recommendations
    if (healthRiskData?.recommendations) {
      recommendations.push(...healthRiskData.recommendations.slice(0, 2));
    }
    
    return Math.max(recommendations.length, 1); // At least 1 recommendation
  };
  
  const calculateMaxCards = () => {
    // Responsive card calculation based on window width
    if (windowWidth < 768) return 8;  // Mobile
    if (windowWidth < 1200) return 12; // Tablet
    return 20; // Desktop
  };
  
  const getDashboardPeriod = () => {
    // Could be made user-configurable later
    return windowWidth < 768 ? 'day' : 'week';
  };
  
  const getResponsiveSpacing = () => {
    // Compact spacing for mobile to reduce white space
    if (windowWidth < 480) return '8px'; // Very small mobile
    if (windowWidth < 768) return '12px'; // Mobile
    if (windowWidth < 1024) return '20px'; // Tablet
    return '32px'; // Desktop
  };



  const [hasAutoOpened, setHasAutoOpened] = useState(false); // Track if auto-open has already happened
  
  // Auto-open chat when coming from VHealthSearch - only once
  // Add delay to ensure FullScreenChat is mounted in DOM before triggering animation
  useEffect(() => {
    if (autoOpenChat && !isChatOpen && !hasAutoOpened) {
      // RequestAnimationFrame ensures component is mounted before animation starts
      requestAnimationFrame(() => {
        setTimeout(() => {
          setIsChatOpen(true);
          setHasAutoOpened(true); // Prevent future auto-opens
          console.log('🔍 SEARCH RESULTS: Auto-opening chat from VHealthSearch');
        }, 50);
      });
    }
  }, [autoOpenChat, isChatOpen, hasAutoOpened]);
  
  // Overview tab now shows dashboard directly instead of navigating
  // useEffect(() => {
  //   if (activeTab === 'overview') {
  //     console.log('🔍 Navigating to overview dashboard from SearchResults');
  //     navigate('/overview');
  //   }
  // }, [activeTab, navigate]);

  // Header search state - independent from main search
  const [headerSearchResults, setHeaderSearchResults] = useState<string>('');
  const [headerSearchQuery, setHeaderSearchQuery] = useState<string>('');
  const [headerApiResponse, setHeaderApiResponse] = useState<any>(null);
  const [isHeaderSearchLoading, setIsHeaderSearchLoading] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  // Handle window resize for responsive layout with debouncing
  useEffect(() => {
    let resizeTimeout: number;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150); // Debounce resize events by 150ms
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Prevent body scroll when component mounts  
  useEffect(() => {
    // Remove any body scroll restrictions - let the CSS variable approach handle positioning
    document.body.style.overflow = 'auto';
    
    return () => {
      document.body.style.overflow = 'auto';
      // Cleanup ResizeObserver error handler
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', resizeObserverErrorHandler);
      }
    };
  }, []);

  // Check if we have valid results to display
  const hasValidResults = results && results.trim() !== '' && !isLoading;
  
  // 🔍 SEARCH RESULTS LOGGING: Track loading states
  useEffect(() => {
    if (isLoading) {
      console.log('🔍 SEARCH RESULTS LOADING STATE:', {
        query: query,
        timestamp: new Date().toISOString(),
        component: 'SearchResults',
        action: 'loadingStarted',
        isLoading: true,
        hasValidResults: hasValidResults
      });
    } else {
      console.log('🔍 SEARCH RESULTS LOADING COMPLETE:', {
        query: query,
        timestamp: new Date().toISOString(),
        component: 'SearchResults',
        action: 'loadingComplete',
        isLoading: false,
        hasValidResults: hasValidResults,
        resultsLength: results?.length || 0
      });
    }
  }, [isLoading, hasValidResults]);
  
  // Cache results when they change
  useEffect(() => {
    if (query && results && !isLoading) {
      searchCache.setCachedResult(query, results, window.location.href);
    }
  }, [query, results, isLoading]);

  // Add effect to manage body class when modal opens/closes
  useEffect(() => {
    if (isUploadModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isUploadModalOpen]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (typeof image === 'string' && image.startsWith('blob:')) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  // Add this effect
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle new search submission
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const trimmedQuery = input.trim();
    
    if (trimmedQuery === lastProcessedQuery || trimmedQuery === query) {
      console.log('Preventing duplicate search for:', trimmedQuery);
      return;
    }
    
    console.log('User explicit search from results page:', trimmedQuery);
    setLastProcessedQuery(trimmedQuery);
    setIsSearching(true);
    onNewSearch(trimmedQuery);
  };

  // Handle voice input (placeholder for now)
  const handleVoiceInput = () => {
    setIsListening(!isListening);
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      setIsUploadModalOpen(true);
    }
  };

  // Handle image upload completion
  const handleAnalysisComplete = (results: any) => {
    console.log('🔍 handleAnalysisComplete called with:', {
      results,
      type: results?.type,
      hasType: Boolean(results?.type),
      resultType: typeof results,
      hasData: Boolean(results?.data),
      hasSummary: Boolean(results?.summary)
    });
    
    setIsUploadModalOpen(false);
    if (!results) return;
    
    // Check if this is an error type
    if (results.type === 'error') {
      console.error('Analysis error:', results.error);
      // Could show a toast notification here
      return;
    }
    
    // Check if this is an image/vision/barcode analysis result
    // Check both by type field AND by having data/summary (defensive check)
    const isImageResult = results.type && (
      results.type === 'image_analysis' ||
      results.type === 'vision_analysis' ||
      results.type === 'barcode_scan' ||
      results.type === 'product_search' ||
      results.type === 'barcode_analysis'
    );
    
    const hasAnalysisData = results.data || results.summary || results.chatData;
    const hasImageMetadata = results.imageUrl || results.userQuery;
    
    if (isImageResult || hasImageMetadata || (hasAnalysisData && typeof results === 'object')) {
      // Direct chat display for image/scan results
      const userMessage = results.userQuery || 'Uploaded image';
      
      console.log('🔍 Opening chat with image results:', { 
        userMessage, 
        type: results.type,
        isImageResult,
        hasAnalysisData,
        hasImageMetadata
      });
      
      // Open chat directly with the results
      if (chatRef.current) {
        chatRef.current.addMessage(userMessage, results);
      }
      setIsChatOpen(true);
      
      console.log('✅ Chat opened successfully');
      return; // Important: exit here
    }
    
    // Only reach here if it's not an image result
    if (typeof results === 'string') {
      // If results is a string, use normal search flow
      console.log('🔍 Results is string, using onNewSearch');
      onNewSearch(results);
    } else {
      // For any other object type, stringify it for normal search
      console.warn('⚠️ Unknown result type, using normal search flow:', results);
      onNewSearch(JSON.stringify(results));
    }
  };



  // Original handle header search function
  const handleHeaderSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsHeaderSearchLoading(true);
    setHeaderSearchResults('');
    setHeaderApiResponse(null);
    
    try {
      logger.debug('SearchResults: Header search initiated', { query: searchQuery });
      
      // Use Universal Search API for header searches
      const response = await fetch('https://ml.wihy.ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          type: 'auto',
          options: {
            include_charts: true,
            include_recommendations: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Header search failed: ${response.statusText}`);
      }

      const universalResult = await response.json();
      
      if (universalResult.success && universalResult.results) {
        setHeaderSearchResults(JSON.stringify(universalResult.results));
        setHeaderApiResponse(universalResult);
        logger.info('SearchResults: Header search completed', { query: searchQuery });
      } else {
        setHeaderSearchResults('No results found.');
      }
      
    } catch (error) {
      logger.error('Header search failed:', error);
      setHeaderSearchResults('Sorry, there was an error processing your search. Please try again.');
      setHeaderApiResponse(null);
    } finally {
      setIsHeaderSearchLoading(false);
    }
  };

  // New Universal Search handler - calls services.wihy.ai/api/search and opens FullScreenChat
  const handleUniversalSearch = async (searchQuery: string | any) => {
    console.log('🔍 UNIVERSAL SEARCH initiated from SearchResults page:', { searchQuery });
    
    // Handle object results (from image analysis)
    if (typeof searchQuery === 'object' && searchQuery !== null) {
      console.log('🔍 Received object result, routing to handleAnalysisComplete');
      handleAnalysisComplete(searchQuery);
      return;
    }
    
    // Handle string search queries
    if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
      console.warn('⚠️ Invalid search query:', searchQuery);
      return;
    }
    
    try {
      logger.debug('SearchResults: Making Universal Search API call', { 
        query: searchQuery, 
        endpoint: 'https://ml.wihy.ai/ask' 
      });
      
      // Call Universal Search API directly using new endpoint
      const response = await fetch('https://ml.wihy.ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          type: 'auto',
          options: {
            include_charts: true,
            include_recommendations: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const universalResult = await response.json();
      
      if (universalResult.success && universalResult.results) {
        console.log('🔍 Universal Search API response received:', universalResult);
        
        // Open FullScreenChat with the Universal Search results
        if (chatRef.current) {
          chatRef.current.addMessage(searchQuery, universalResult.results);
        }
        
        // Set the chat to open
        setIsChatOpen(true);
        
        logger.info('SearchResults: Universal Search completed and FullScreenChat opened', { 
          query: searchQuery,
          hasData: !!universalResult.results 
        });
        
        console.log('🔍 UNIVERSAL SEARCH completed and FullScreenChat opened:', {
          query: searchQuery,
          success: true,
          chatOpened: true,
          timestamp: new Date().toISOString()
        });
        
      } else {
        throw new Error('Universal Search API request failed');
      }
      
    } catch (error) {
      logger.error('Universal search failed:', error);
      console.log('🔍 UNIVERSAL SEARCH failed:', {
        query: searchQuery,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Show error message in chat
      if (chatRef.current) {
        chatRef.current.addMessage(searchQuery, 'Sorry, there was an error processing your search. Please try again.');
        setIsChatOpen(true);
      }
    }
  };

  // Handle header search - add messages to existing conversation
  const handleAddToChatConversation = (userMessage: string, assistantMessage: string) => {
    console.log('🔍 ADDING TO CHAT CONVERSATION:', {
      userMessage,
      assistantMessage: assistantMessage.substring(0, 100) + '...',
      chatRefAvailable: !!chatRef.current,
      isChatOpen,
      timestamp: new Date().toISOString()
    });
    
    if (chatRef.current) {
      // Use the ref to add messages to the chat
      chatRef.current.addMessage(userMessage, assistantMessage);
      
      // Open chat if it's not already open
      if (!isChatOpen) {
        setIsChatOpen(true);
      }
    } else {
      console.error('🔍 Chat ref not available - opening chat with new messages');
      // Fallback: just open the chat (it will need manual re-entry)
      setIsChatOpen(true);
    }
  };

  // Handle opening receipt upload modal
  const handleOpenReceiptUpload = () => {
    setIsUploadModalOpen(true);
  };

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 SEARCHRESULTS STATE DEBUG:', {
      headerSearchQuery,
      originalQuery: query,
      hasHeaderSearchResults: !!headerSearchResults,
      isHeaderSearchLoading,
      chatWidgetKey: `chatwidget-${headerSearchQuery || query}`,
      timestamp: new Date().toISOString()
    });
  }, [headerSearchQuery, headerSearchResults, query, isHeaderSearchLoading]);

  // Clear header search results when main query changes
  useEffect(() => {
    if (query && headerSearchQuery && query !== headerSearchQuery) {
      console.log('🔍 Main query changed, clearing header search results');
      setHeaderSearchResults('');
      setHeaderSearchQuery('');
      setHeaderApiResponse(null);
    }
  }, [query, headerSearchQuery]);

  // 🔍 SEARCH RESULTS LOGGING: Track prop changes
  useEffect(() => {
    console.log('🔍 SEARCH RESULTS PROPS CHANGED:', {
      query: query,
      timestamp: new Date().toISOString(),
      component: 'SearchResults',
      action: 'propsChanged',
      isLoading: isLoading,
      dataSource: dataSource,
      hasResults: !!results,
      resultsLength: results?.length || 0,
      hasApiResponse: !!apiResponse
    });
  }, [query, results, isLoading, dataSource, apiResponse]);

  return (
    <>
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000, 
        backgroundColor: 'white',
        paddingTop: PlatformDetectionService.isNative() ? '48px' : undefined
      }}>
        <Header
          variant="results"
          showLogin={true}
          showSearchInput={true}
          onSearchSubmit={handleUniversalSearch}
          onChatMessage={handleAddToChatConversation}
          isInChatMode={isChatOpen}
          showProgressMenu={true}
          onProgressMenuClick={undefined}
          sessionId={sessionId}
        />
      </div>

      {/* Show spinner when loading from parent OR header search */}
      {(isLoading || isHeaderSearchLoading) && (
        <Spinner
          overlay={true}
          title="Analyzing with AI..."
          subtitle="Processing your health query..."
          disableEsc={true}
        />
      )}
      
      {/* Main Content Area with Dashboard Layout */}
      <div className={CSS_CLASSES.DASHBOARD_CONTAINER} style={{ 
        paddingTop: windowWidth < 768 ? '280px' : windowWidth < 1200 ? '260px' : '140px'
      }}>

        
        <div className={CSS_CLASSES.DASHBOARD_MAIN_CONTENT}>
        
        {hasValidResults ? (
          <>
            {/* Full Screen Chat - Hidden when coming from NutritionFacts */}
            {!hideChatWidget && (
              <FullScreenChat
                ref={chatRef}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                onViewCharts={() => setIsChatOpen(false)} // Close chat to view charts behind it
                initialQuery={query}
              initialResponse={(() => {
                // For image/barcode/product scans from VHealthSearch, pass the full apiResponse object
                // so FullScreenChat can extract imageUrl and other metadata
                if (apiResponse && apiResponse.imageUrl) {
                  // Return the full apiResponse object to preserve imageUrl and other data
                  return apiResponse;
                }
                
                // Handle barcode scan data with full analysis
                if (apiResponse && (apiResponse.analysis || apiResponse.product_info)) {
                  // This is barcode scan data - return the formatted results as string
                  return results;
                }
                
                // Handle traditional API responses
                let extractedResponse = '';
                if (apiResponse?.data?.ai_response?.response) {
                  extractedResponse = apiResponse.data.ai_response.response;
                } else if (apiResponse?.data?.response) {
                  extractedResponse = apiResponse.data.response;
                } else {
                  extractedResponse = results;
                }
                return extractedResponse;
              })()}
              />
            )}

            {/* Floating Chat Button - Show when chat is closed and not hidden (hidden on native Android) */}
            {!hideChatWidget && !isChatOpen && !PlatformDetectionService.isNative() && (
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="floating-chat-button"
              >
                💬
              </button>
            )}

            {/* Tab Navigation - Removed per user request
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              marginTop: windowWidth < 768 ? '0px' : '80px',
              marginBottom: windowWidth < 768 ? '12px' : '24px',
              padding: windowWidth < 768 ? '0 8px' : '0 20px',
              paddingTop: windowWidth < 768 ? '20px' : '0',
              position: 'relative'
            }}>
              <div className="results-tabs" style={{
                display: 'flex',
                gap: windowWidth < 768 ? '6px' : '8px',
                alignItems: 'center',
                flexWrap: 'wrap', // Always allow wrapping for all screen sizes
                justifyContent: 'center',
                maxWidth: '100%'
              }}>
                {TABS.map(tab => {
                  const active = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      onMouseEnter={(e) => {
                        if (!active) {
                          const target = e.target as HTMLButtonElement;
                          Object.assign(target.style, {
                            ...tabBarStyles.tab,
                            ...tabBarStyles.tabInactive,
                            ...tabBarStyles.tabHover
                          });
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          const target = e.target as HTMLButtonElement;
                          Object.assign(target.style, {
                            ...tabBarStyles.tab,
                            ...tabBarStyles.tabInactive
                          });
                        }
                      }}
                      style={{
                        ...tabBarStyles.tab,
                        ...(active ? tabBarStyles.tabActive : tabBarStyles.tabInactive)
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
            */}

            {/* Render dashboard content based on active tab */}
            {activeTab === 'overview' ? (
              <OverviewDashboard onAnalyze={handleAddToChatConversation} />
            ) : (
              <div style={{
                padding: windowWidth < 768 ? '5px 8px 0 8px' : '10px 20px',
                maxWidth: '100%',
                overflowX: 'hidden'
              }}>
                {/* Other dashboard tabs would render here */}
                <p>Dashboard content for {activeTab} tab would appear here.</p>
              </div>
            )}
          </>
        ) : (
          !isLoading && !isSearching && (
            <div className="no-results-container">
              <p>No results to display. Try searching for something else.</p>
            </div>
          )
        )}
      </div>
      </div>

      {/* ImageUploadModal - always available */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
        title="Upload Image"
        subtitle="Upload images for analysis"
      />

      {/* Mobile Bottom Navigation */}
      {PlatformDetectionService.isNative() && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '56px',
          backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          borderTop: `1px solid ${isDarkMode ? '#2d2d2d' : '#e0e0e0'}`,
          zIndex: 1200,
          boxShadow: isDarkMode ? 'none' : '0 -2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Search Button - Navigate to home */}
          <button
            onClick={() => {
              if (isChatOpen) setIsChatOpen(false);
              navigate('/');
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'none',
              border: 'none',
              color: isDarkMode ? '#e0e0e0' : '#5f6368',
              padding: '0',
              cursor: 'pointer',
              gap: '4px',
              transition: 'color 0.2s'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Search</span>
          </button>

          {/* Scan Button - Open modal */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'none',
              border: 'none',
              color: isDarkMode ? '#e0e0e0' : '#5f6368',
              padding: '0',
              cursor: 'pointer',
              gap: '4px',
              transition: 'color 0.2s'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Scan</span>
          </button>

          {/* Chat Button - Toggle chat open/close */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'none',
              border: 'none',
              color: isChatOpen ? '#4cbb17' : (isDarkMode ? '#e0e0e0' : '#5f6368'), // Highlighted when open
              padding: '0',
              cursor: 'pointer',
              gap: '4px',
              transition: 'color 0.2s'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Chat</span>
          </button>

          {/* Login Button - Trigger login */}
          <button
            onClick={() => {
              const loginButton = document.querySelector('.login-icon') as HTMLElement;
              if (loginButton) {
                loginButton.click();
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'none',
              border: 'none',
              color: isDarkMode ? '#e0e0e0' : '#5f6368',
              padding: '0',
              cursor: 'pointer',
              gap: '4px',
              transition: 'color 0.2s'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Login</span>
          </button>
        </div>
      )}
      

    </>
  );
};

export default SearchResults;