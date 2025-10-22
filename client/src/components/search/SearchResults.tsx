import React, { useState, useEffect, useRef } from 'react';
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
  apiResponse
}) => {
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
        />
      </div>

      {/* Show spinner when searching from header */}
      {(isLoading || isSearching) && (
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
                  key={`chatwidget-${query}`} // Force re-render when query changes
                  isOpen={true}
                  onClose={() => {}}
                  currentContext={currentContext}
                  inline={true}
                  searchQuery={query}
                  searchResponse={(() => {
                    // Extract response from apiResponse or fall back to results
                    let extractedResponse = '';
                    if (apiResponse?.data?.ai_response?.response) {
                      extractedResponse = apiResponse.data.ai_response.response;
                    } else if (apiResponse?.data?.response) {
                      extractedResponse = apiResponse.data.response;
                    } else {
                      extractedResponse = results;
                    }
                    
                    console.log('🔍 SEARCHRESULTS DEBUG: Passing to ChatWidget:', {
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
                {results && (
                  <>
                    <div>
                      <h4 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px' }}>Quality Analysis</h4>
                      <ResultQualityPie 
                        apiResponse={apiResponse}
                        query={query}
                        results={results} 
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
    </div>
  );
};

export default SearchResults;