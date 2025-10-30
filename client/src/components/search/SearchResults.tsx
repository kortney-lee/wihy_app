import React, { useState, useEffect, useRef } from 'react';
import { searchCache } from '../../services/searchCache';
import { photoStorageService } from '../../services/photoStorageService';
import { foodAnalysisService } from '../../services/foodAnalysisService';
import ImageUploadModal from '../ui/ImageUploadModal';
import MultiAuthLogin from '../shared/MultiAuthLogin';
import ResultQualityPie from '../charts/ResultQualityPie';
// Chart imports removed - charts now handled by vHealthApp with new API structure
import ChatWidget from '../ui/ChatWidget';
import FullScreenChat from '../ui/FullScreenChat';
import DashboardCharts from '../charts/DashboardCharts';
import '../../styles/VHealthSearch.css';
import Header from '../shared/Header';
import Spinner from '../ui/Spinner';
import { wihyAPI } from '../../services/wihyAPI';
import { logger } from '../../utils/logger';

/* Define default topics and resources */
const defaultRelatedTopics = [
  "Nutrition and Diet Guidelines",
  "Exercise and Physical Activity", 
  "Mental Health and Wellness",
  "Preventive Care and Screenings",
  "Chronic Disease Management",
  "Healthy Lifestyle Choices"
];

const defaultResources = [
  { text: "Nutrition ED - Learn More", url: "https://vowels.com" },
  { text: "Nutrition 101", url: "https://members.vowels.com" },
  { text: "The World Counts", url: "https://www.theworldcounts.com/" }
];

// Define the dummy data for "test" queries
const dummyTestData = {
  query: "test",
  healthInfo: `I'm sorry, but your query "test" is too vague. Could you please provide more details or specify the type of test you are interested in? It could be a medical test, a psychological test, or a physical fitness test, among others. Please provide more context so I can give you a more accurate and helpful response.

**Recommendations:**
• Consult healthcare professionals for personalized medical advice
• Verify information with your doctor or medical provider
• Follow evidence-based medical guidelines
• Seek regular medical check-ups and screenings

**Sources:** NIH Guidelines, CDC & WHO Publications, PubMed and peer-reviewed studies, Academic Medical Journals, Evidence-Based Clinical Reviews

This information is based on research from reputable medical institutions and peer-reviewed journals including NIH, CDC, WHO, JAMA, NEJM, and other academic publications. It is for educational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns.`,
  relatedTopics: [
    "Nutrition and Diet Guidelines",
    "Exercise and Physical Activity", 
    "Mental Health and Wellness",
    "Preventive Care and Screenings",
    "Chronic Disease Management",
    "Healthy Lifestyle Choices"
  ],
  resources: [
    { text: "🩺 mHealth - Mobile Health Solutions", url: "#" },
    { text: "🏥 CDC - Health Guidelines", url: "#" },
    { text: "🌍 WHO - Global Health Information", url: "#" }
  ]
};

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
  initialDemoMode?: boolean; // Add prop to start in demo mode
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
  onBackToSearch,
  onNewSearch,
  isLoading,
  dataSource,
  citations = [],
  recommendations = [],
  disclaimer = "",
  apiResponse,
  initialDemoMode = false
}) => {
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
  const [currentContext, setCurrentContext] = useState<string>('search results');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [isDemoMode, setIsDemoMode] = useState(initialDemoMode);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Header search state - independent from main search
  const [headerSearchResults, setHeaderSearchResults] = useState<string>('');
  const [headerSearchQuery, setHeaderSearchQuery] = useState<string>('');
  const [headerApiResponse, setHeaderApiResponse] = useState<any>(null);
  const [isHeaderSearchLoading, setIsHeaderSearchLoading] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when component mounts  
  useEffect(() => {
    // Remove any body scroll restrictions - let the CSS variable approach handle positioning
    document.body.style.overflow = 'auto';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Check if we have valid results to display
  const hasValidResults = results && results.trim() !== '' && !isLoading;
  
  // Set context for ChatWidget based on search results
  useEffect(() => {
    if (results && typeof results === 'string' && results.trim()) {
      // Extract a meaningful summary for chat context
      const contextSummary = results.length > 300 ? results.substring(0, 300) + '...' : results;
      setCurrentContext(`Search results for "${query}": ${contextSummary}`);
      console.log('🔍 SEARCH RESULTS: Updated chat context');
    } else {
      setCurrentContext('search results');
    }
  }, [results, query]);
  
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
    setIsUploadModalOpen(false);
    if (results) {
      onNewSearch(JSON.stringify(results));
    }
  };

  // Check if this is a test query
  const isTestQuery = query.toLowerCase() === 'test';

  // Handle new search from header - makes its own API request
  const handleHeaderSearch = async (searchQuery: string) => {
    console.log('🔍 HEADER SEARCH initiated:', { searchQuery });
    
    if (!searchQuery.trim()) return;
    
    setIsHeaderSearchLoading(true);
    
    try {
      logger.debug('Header search: Making WiHy API call', { query: searchQuery });
      
      const wihyResponse = await wihyAPI.searchHealth(searchQuery);
      
      if (wihyResponse.success) {
        // Extract response content
        let summary = 'Health information provided';
        if ('data' in wihyResponse) {
          // New unified API response format
          summary = (wihyResponse as any).data?.response || 
                   (wihyResponse as any).data?.ai_response?.response || 
                   summary;
        } else {
          // Legacy WihyResponse format
          summary = (wihyResponse as any).wihy_response?.core_principle || summary;
        }
        
        // Update our local state and add to chat conversation
        setHeaderSearchResults(summary);
        setHeaderSearchQuery(searchQuery);
        setHeaderApiResponse(wihyResponse);
        
        // Add the new search to the existing chat conversation
        handleAddToChatConversation(searchQuery, summary);
        
        console.log('🔍 HEADER SEARCH state updated:', {
          query: searchQuery,
          hasResults: !!summary,
          timestamp: new Date().toISOString()
        });
        
        logger.info('Header search completed successfully', { query: searchQuery });
        
        console.log('🔍 HEADER SEARCH completed:', {
          query: searchQuery,
          success: true,
          hasResponse: !!summary,
          timestamp: new Date().toISOString()
        });
        
      } else {
        throw new Error('WiHy API request failed');
      }
      
    } catch (error) {
      logger.error('Header search failed:', error);
      setHeaderSearchResults('Sorry, there was an error processing your search. Please try again.');
      setHeaderApiResponse(null);
      
      console.log('🔍 HEADER SEARCH failed:', {
        query: searchQuery,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsHeaderSearchLoading(false);
    }
  };

  // Handle new search from ChatWidget
  const handleChatSearch = (query: string) => {
    console.log('🔍 ChatWidget triggered new search:', { query });
    // Clear any header search results when using ChatWidget
    setHeaderSearchResults('');
    setHeaderSearchQuery('');
    setHeaderApiResponse(null);
    // Use the main navigation flow for ChatWidget searches
    onNewSearch(query);
  };

  // Handle header search - add messages to existing conversation
  const handleAddToChatConversation = (userMessage: string, assistantMessage: string) => {
    console.log('🔍 ATTEMPTING TO ADD TO CHAT:', {
      userMessage,
      assistantMessage: assistantMessage.substring(0, 100) + '...',
      hasAddChatMessage: !!(window as any).addChatMessage,
      timestamp: new Date().toISOString()
    });
    
    if ((window as any).addChatMessage) {
      (window as any).addChatMessage(userMessage, assistantMessage);
    } else {
      console.error('🔍 addChatMessage function not available on window');
    }
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
    <div className="search-results-container" style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'var(--vh-header-height)',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000, 
        backgroundColor: 'white'
      }}>
        <Header
          variant="results"
          showLogin={true}
          showSearchInput={true}
          onSearchSubmit={handleHeaderSearch}
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
      <div style={{ 
        minHeight: 'calc(100vh - var(--vh-header-height))',
        overflow: 'hidden',
        padding: windowWidth <= 768 ? '12px' : '20px',
        backgroundColor: '#f8fafc'
      }}>
        
        {hasValidResults ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : (isDemoMode ? '1fr' : '2fr 1fr'),
            gridTemplateRows: windowWidth <= 768 ? '1fr 300px' : '1fr',
            gap: '20px',
            maxWidth: isDemoMode ? '1600px' : '1200px',
            margin: '0 auto',
            minHeight: 'calc(100vh - var(--vh-header-height) - 40px)', // Account for padding
            overflow: 'hidden',
            position: 'relative'
          }}>
            
            {/* Chat Widget - Only show when not in demo mode */}
            {!isDemoMode && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                padding: windowWidth <= 768 ? '16px' : '24px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                
                {/* Chat Widget - header now included inside */}
                <div style={{ flex: 1, overflow: 'hidden', height: '100%' }}>
                  <ChatWidget
                    key={`chatwidget-${query}`} // Stable key since we're adding to conversation instead of replacing
                    isOpen={true}
                    onClose={() => {}}
                    currentContext={currentContext}
                    inline={true}
                    searchQuery={query} // Always use original query for initialization
                    onNewSearch={handleChatSearch}
                    onAddMessage={handleAddToChatConversation}
                    searchResponse={(() => {
                      // Use original results for initialization, header search will be added via onAddMessage
                      let extractedResponse = '';
                      if (apiResponse?.data?.ai_response?.response) {
                        extractedResponse = apiResponse.data.ai_response.response;
                      } else if (apiResponse?.data?.response) {
                        extractedResponse = apiResponse.data.response;
                      } else {
                        extractedResponse = results;
                      }
                      
                      console.log('🔍 SEARCHRESULTS DEBUG: Using original results for initialization:', {
                        query,
                        extractedResponse: extractedResponse?.substring(0, 100) + '...',
                        apiResponse: !!apiResponse,
                        results: !!results
                      });
                      
                      return extractedResponse;
                    })()}
                  />
                </div>
              </div>
            )}

            {/* Full Screen Chat - Only in demo mode when chat is open */}
            <FullScreenChat
              isOpen={isDemoMode && isChatOpen}
              onClose={() => setIsChatOpen(false)}
              initialQuery={query}
              initialResponse={(() => {
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

            {/* Main Content Area - Dashboard in demo mode, charts sidebar in normal mode */}
            <div style={{
              backgroundColor: isDemoMode ? '#f8fafc' : '#ffffff',
              borderRadius: '12px',
              boxShadow: isDemoMode ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: isDemoMode ? 'none' : '1px solid #e5e7eb',
              padding: isDemoMode ? '0' : (windowWidth <= 768 ? '16px' : '20px'),
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative'
            }}>
              
              {/* Floating Chat Button - Only in demo mode when chat is closed */}
              {isDemoMode && !isChatOpen && (
                <button
                  onClick={() => setIsChatOpen(true)}
                  style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: 'white',
                    zIndex: 100,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  💬
                </button>
              )}

              {isDemoMode ? (
                <>
                  {/* Health Dashboard Layout */}
                  <div style={{ 
                    flex: 1,
                    overflow: 'auto',
                    padding: '20px'
                  }}>
                    {/* Dashboard Header */}
                    <h1 style={{ 
                      fontSize: '28px', 
                      fontWeight: '600', 
                      color: '#1f2937', 
                      marginBottom: '30px',
                      textAlign: 'left'
                    }}>
                      Your Health Snapshot
                    </h1>
                    
                    {/* Health Metrics Cards */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '20px',
                      marginBottom: '40px'
                    }}>
                      {/* Current Weight */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #f3f4f6'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', margin: 0 }}>Current Weight</h3>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ⏰
                          </div>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>68.5</span>
                          <span style={{ fontSize: '16px', color: '#6b7280', marginLeft: '4px' }}>kg</span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>Goal: 65 kg</p>
                        <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', backgroundColor: '#3b82f6', width: '70%', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* Calories */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #f3f4f6'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', margin: 0 }}>Calories</h3>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            📊
                          </div>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>1,850</span>
                          <span style={{ fontSize: '16px', color: '#6b7280', marginLeft: '4px' }}>kcal</span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>Burned: 2,100 kcal</p>
                        <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', backgroundColor: '#10b981', width: '85%', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* Steps Today */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #f3f4f6'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', margin: 0 }}>Steps Today</h3>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ✈️
                          </div>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>8,742</span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>Goal: 10,000</p>
                        <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', backgroundColor: '#8b5cf6', width: '87%', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* Sleep Last Night */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #f3f4f6'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', margin: 0 }}>Sleep Last Night</h3>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            🌙
                          </div>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>7.2</span>
                          <span style={{ fontSize: '16px', color: '#6b7280', marginLeft: '4px' }}>hrs</span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>Quality: 82%</p>
                        <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', backgroundColor: '#8b5cf6', width: '82%', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* Hydration Today */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #f3f4f6'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', margin: 0 }}>Hydration Today</h3>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#cffafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            💧
                          </div>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>1.8</span>
                          <span style={{ fontSize: '16px', color: '#6b7280', marginLeft: '4px' }}>L</span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>Goal: 2.5 L</p>
                        <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', backgroundColor: '#06b6d4', width: '72%', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Chart Sections */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: '20px',
                      marginBottom: '40px'
                    }}>
                      {/* Weight & Body */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #f3f4f6'
                      }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                          📊 Weight & Body
                        </h3>
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6', marginRight: '8px' }}></div>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>Weight (kg)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', marginRight: '8px' }}></div>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>Goal (65 kg)</span>
                          </div>
                          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>70 kg</p>
                        </div>
                        <div className="wihy-btn-wrapper" style={{
                          display: 'inline-block',
                          width: '100%',
                          animation: 'wiH-border-sweep 2.2s linear infinite',
                          background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
                          backgroundSize: '100% 100%, 200% 100%',
                          border: '2px solid transparent',
                          borderRadius: '16px'
                        }}>
                          <button 
                            className="analyze-wihy-btn"
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '16px',
                              padding: '12px 16px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              color: '#fa5f06',
                              boxShadow: 'none',
                              transform: 'none'
                            }}
                          >
                            Analyze with WiHy
                          </button>
                        </div>
                      </div>

                      {/* Activity */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #f3f4f6'
                      }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                          🏃 Activity
                        </h3>
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>Steps</span>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>8,742/10,000</span>
                          </div>
                          <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', backgroundColor: '#8b5cf6', width: '87%', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>Distance</span>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>6.2/8 km</span>
                          </div>
                          <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', backgroundColor: '#3b82f6', width: '78%', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                        <div className="wihy-btn-wrapper" style={{
                          display: 'inline-block',
                          width: '100%',
                          animation: 'wiH-border-sweep 2.2s linear infinite',
                          background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
                          backgroundSize: '100% 100%, 200% 100%',
                          border: '2px solid transparent',
                          borderRadius: '16px'
                        }}>
                          <button 
                            className="analyze-wihy-btn"
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '16px',
                              padding: '12px 16px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              color: '#fa5f06',
                              boxShadow: 'none',
                              transform: 'none'
                            }}
                          >
                            Analyze with WiHy
                          </button>
                        </div>
                      </div>

                      {/* Nutrition */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #f3f4f6'
                      }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                          🥗 Nutrition
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                          <button style={{
                            padding: '8px 16px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            Macro Breakdown
                          </button>
                          <button style={{
                            padding: '8px 16px',
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            border: 'none',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            Micronutrients
                          </button>
                        </div>
                        <div className="wihy-btn-wrapper" style={{
                          display: 'inline-block',
                          width: '100%',
                          animation: 'wiH-border-sweep 2.2s linear infinite',
                          background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
                          backgroundSize: '100% 100%, 200% 100%',
                          border: '2px solid transparent',
                          borderRadius: '16px'
                        }}>
                          <button 
                            className="analyze-wihy-btn"
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '16px',
                              padding: '12px 16px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              color: '#fa5f06',
                              boxShadow: 'none',
                              transform: 'none'
                            }}
                          >
                            Analyze with WiHy
                          </button>
                        </div>
                      </div>

                      {/* Sleep */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #f3f4f6'
                      }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                          💤 Sleep
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                          <button style={{
                            padding: '8px 16px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            Duration & Quality
                          </button>
                          <button style={{
                            padding: '8px 16px',
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            border: 'none',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            Quality Distribution
                          </button>
                        </div>
                        <div className="wihy-btn-wrapper" style={{
                          display: 'inline-block',
                          width: '100%',
                          animation: 'wiH-border-sweep 2.2s linear infinite',
                          background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
                          backgroundSize: '100% 100%, 200% 100%',
                          border: '2px solid transparent',
                          borderRadius: '16px'
                        }}>
                          <button 
                            className="analyze-wihy-btn"
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '16px',
                              padding: '12px 16px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              color: '#fa5f06',
                              boxShadow: 'none',
                              transform: 'none'
                            }}
                          >
                            Analyze with WiHy
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Insights */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      padding: '32px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #f3f4f6'
                    }}>
                      <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '32px', display: 'flex', alignItems: 'center' }}>
                        📊 Quick Insights
                      </h3>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '40px',
                        textAlign: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '48px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>85</div>
                          <div style={{ fontSize: '16px', color: '#6b7280' }}>Overall Health Score</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '48px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px' }}>7.2h</div>
                          <div style={{ fontSize: '16px', color: '#6b7280' }}>Avg Sleep Quality</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '48px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px' }}>8.4k</div>
                          <div style={{ fontSize: '16px', color: '#6b7280' }}>Daily Steps (Avg)</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '48px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>5</div>
                          <div style={{ fontSize: '16px', color: '#6b7280' }}>Personal Bests This Month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ marginBottom: '20px', color: '#1f2937', fontSize: '18px', fontWeight: '600', flexShrink: 0 }}>
                    Analysis Charts
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '20px',
                    flex: 1,
                    overflow: 'auto',
                    paddingRight: '4px'
                  }}>
                    {(results || headerSearchResults) && (
                      <>
                        <div>
                          <h4 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px' }}>Quality Analysis</h4>
                          <ResultQualityPie 
                            apiResponse={headerApiResponse || apiResponse}
                            query={headerSearchQuery || query}
                            results={headerSearchResults || results} 
                            dataSource={dataSource === 'wihy' ? 'vnutrition' : dataSource}
                          />
                        </div>
                        {/* Chart components removed - now handled by vHealthApp with new API structure */}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          !isLoading && !isSearching && (
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center', 
              padding: '40px',
              color: '#6b7280'
            }}>
              <p>No results to display. Try searching for something else.</p>
            </div>
          )
        )}
      </div>

      {/* ImageUploadModal - always available */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
        title="Upload Image"
        subtitle="Upload images for analysis"
      />
      
      {/* Add CSS for header search loading animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes wiH-border-sweep {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }

        @keyframes slideInLeft {
          from { 
            transform: translateX(-100%);
            opacity: 0;
          }
          to { 
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInUp {
          from { 
            transform: translateY(100%);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* INDUSTRY-STANDARD SCROLLBAR HANDLING */
        
        /* Hide scrollbars for all chat-related elements */
        .chat-overlay *::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
          background: transparent !important;
        }
        
        .chat-overlay * {
          scrollbar-width: none !important; /* Firefox */
          -ms-overflow-style: none !important; /* Internet Explorer 10+ */
        }
        
        /* Ensure smooth scrolling for all chat elements */
        .chat-overlay * {
          scroll-behavior: smooth !important;
        }
        
        /* Custom invisible scrollbar for WebKit browsers */
        .chat-container::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        
        .chat-container::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .chat-container::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 0px;
        }
        
        /* Enhanced focus states for better UX - but preserve existing input styles */
        .chat-overlay input:focus:not(.search-input),
        .chat-overlay textarea:focus:not(.search-input) {
          outline: 2px solid #10b981 !important;
          outline-offset: 2px !important;
          border-color: #10b981 !important;
        }
        
        /* Preserve existing search input styling - remove double borders */
        .chat-overlay .search-input {
          border: 2px solid #fa5f06 !important;
          border-radius: 28px !important;
          background: #ffffff !important;
          box-shadow: 0 2px 8px rgba(250, 95, 6, 0.1) !important;
        }
        
        .chat-overlay .search-input:focus {
          outline: none !important;
          border-color: #fa5f06 !important;
          box-shadow: 0 2px 8px rgba(250, 95, 6, 0.2) !important;
        }
        
        /* Remove double border from chat input container */
        .chat-overlay .chat-input-container {
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        
        /* Ensure chat input area has proper styling */
        .chat-overlay .chat-input-area {
          padding: 16px !important;
          border-top: 1px solid #e5e7eb !important;
          background-color: #ffffff !important;
        }
        
        /* Ensure search input container doesn't add extra border */
        .chat-overlay .search-input-container {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        
        /* Ensure chat messages and history are visible */
        .chat-overlay .chat-thread {
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
          padding: 12px 16px !important;
          height: 100% !important;
          overflow-y: auto !important;
        }
        
        .chat-overlay .chat-message {
          display: flex !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        /* Ensure chat widget components are visible */
        .chat-overlay .chat-widget > div {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
        }
        
        /* Make sure messages container is visible */
        .chat-overlay [style*="height: calc(100vh - 240px)"] {
          display: flex !important;
          flex-direction: column !important;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Gradient fade effect at top and bottom of chat */
        .chat-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0));
          pointer-events: none;
          z-index: 10;
        }
        
        .chat-container::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0));
          pointer-events: none;
          z-index: 10;
        }
        
        /* Improved button hover effects */
        .chat-overlay button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        .chat-overlay button:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        
        /* Professional loading states */
        .chat-overlay .loading-indicator {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        /* Custom selection colors */
        .chat-overlay ::selection {
          background-color: #10b981;
          color: white;
        }
        
        .chat-overlay ::-moz-selection {
          background-color: #10b981;
          color: white;
        }
        
        /* Improved typography */
        .chat-overlay {
          font-feature-settings: "kern" 1, "liga" 1;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Accessibility improvements */
        .chat-overlay button:focus-visible {
          outline: 2px solid #10b981;
          outline-offset: 2px;
        }
        
        /* Mobile-specific improvements */
        @media (max-width: 768px) {
          .chat-overlay {
            font-size: 16px; /* Prevents zoom on iOS */
          }
          
          .chat-overlay input,
          .chat-overlay textarea {
            font-size: 16px; /* Prevents zoom on iOS */
          }
          
          /* Mobile chat panel takes full width */
          .chat-panel {
            width: 100vw !important;
            border-radius: 0 !important;
          }
          
          /* Ensure mobile starts at top */
          .chat-container {
            padding-top: 20px !important;
          }
          
          /* Mobile-specific input styling fixes */
          .chat-overlay .search-input {
            border: 2px solid #fa5f06 !important;
            border-radius: 28px !important;
            background: #ffffff !important;
            box-shadow: 0 2px 8px rgba(250, 95, 6, 0.1) !important;
          }
          
          /* Remove double border on mobile */
          .chat-overlay .chat-input-container {
            background: transparent !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          
          .chat-overlay .search-input-container {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
        
        /* Subtle shadow for chat panel */
        .chat-panel {
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        
        /* Professional backdrop blur effect */
        .chat-backdrop {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
      `}</style>
    </div>
  );
};

export default SearchResults;