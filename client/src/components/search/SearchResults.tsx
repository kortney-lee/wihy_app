import React, { useState, useEffect, useRef, memo } from 'react';
import { searchCache } from '../../services/searchCache';
import { photoStorageService } from '../../services/photoStorageService';
import { foodAnalysisService } from '../../services/foodAnalysisService';
import ImageUploadModal from '../ui/ImageUploadModal';
import MultiAuthLogin from '../shared/MultiAuthLogin';
import ResultQualityPie from '../charts/ResultQualityPie';
// Chart imports removed - charts now handled by vHealthApp with new API structure
import ChatWidget from '../ui/ChatWidget';
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

const SearchResults: React.FC<SearchResultsProps> = memo(({
  query,
  results,
  onBackToSearch,
  onNewSearch,
  isLoading,
  dataSource,
  citations = [],
  recommendations = [],
  disclaimer = "",
  apiResponse
}) => {
  // Only log significant events, not every mount
  console.log('🔍 SEARCH RESULTS: Rendered for query:', query);
  
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
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : '2fr 1fr',
            gridTemplateRows: windowWidth <= 768 ? '1fr 300px' : '1fr',
            gap: '20px',
            maxWidth: '1200px',
            margin: '0 auto',
            minHeight: 'calc(100vh - var(--vh-header-height) - 40px)', // Account for padding
            overflow: 'hidden'
          }}>
            
            {/* Chat Widget as Main Content */}
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
              <div style={{ flex: 1, overflow: 'hidden' }}>
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
                    
                    // Simplified logging
                    console.log('🔍 SEARCHRESULTS: Using results for ChatWidget initialization');
                    
                    return extractedResponse;
                  })()}
                />
              </div>
            </div>

            {/* Charts Sidebar */}
            <div style={{
              padding: windowWidth <= 768 ? '16px' : '20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
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
      `}</style>
    </div>
  );
});

export default SearchResults;