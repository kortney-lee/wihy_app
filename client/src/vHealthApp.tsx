import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchResults from './components/search/SearchResults';
import ImageUploadModal from './components/ui/ImageUploadModal';
import NutritionChart from './components/charts/cards/NutritionChart';
import ResultQualityPie from './components/charts/cards/ResultQualityPie';
import { searchCache } from './services/searchCache';
import { wihyAPI, isUnifiedResponse, UnifiedResponse, WihyResponse } from './services/wihyAPI';
import { photoStorageService } from './services/photoStorageService';
import { foodAnalysisService } from './services/foodAnalysisService';
import './styles/VHealthSearch.css';
import MultiAuthLogin from './components/shared/MultiAuthLogin';

// Add TypeScript declaration for Speech Recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: () => void;
  onresult: (event: any) => void;
  onerror: () => void;
  onend: () => void;
}

const VHealthApp: React.FC = () => {
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState({
    connected: false,
    message: 'Checking API connection...'
  });
  const [currentView, setCurrentView] = useState<'search' | 'results'>('search');
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentResults, setCurrentResults] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"openai" | "local" | "error" | "vnutrition">("openai");
  const [currentPhotoId, setCurrentPhotoId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [currentApiResponse, setCurrentApiResponse] = useState<UnifiedResponse | null>(null);
  const [currentChatResponse, setCurrentChatResponse] = useState<string>('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Handle browser navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state) {
        setCurrentView(state.view);
        setCurrentQuery(state.query || '');
        setCurrentResults(state.results || '');
        setDataSource(state.dataSource || 'local');
        setIsLoading(false);
      } else {
        // No state means we're at the root
        setCurrentView('search');
        setCurrentQuery('');
        setCurrentResults('');
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Check for initial query in URL
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    if (queryParam) {
      handleSearch(queryParam, false); // Don't push to history on initial load
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSearch = async (query: string, pushToHistory = true) => {
    console.log('🔍 SEARCH DEBUG: handleSearch called with query:', query);
    
    // Clear previous search state
    setCurrentApiResponse(null);
    setCurrentChatResponse('');
    
    setIsLoading(true);
    
    if (!query.trim()) return;

    const trimmedQuery = query.trim();
    
    try {
      console.log('🔍 SEARCH DEBUG: Making WiHy API call');
      const wihyResponse = await wihyAPI.searchHealth(trimmedQuery);
      console.log('🔍 SEARCH DEBUG: Got response from wihyAPI:', wihyResponse);
      
      if (wihyResponse.success) {
        // Store the unified API response for chart components
        if (isUnifiedResponse(wihyResponse)) {
          setCurrentApiResponse(wihyResponse as UnifiedResponse);
        } else {
          setCurrentApiResponse(null);
        }

        // Extract response text for ChatWidget
        let responseText = '';
        console.log('🔍 SEARCH DEBUG: Processing response for ChatWidget');
        console.log('🔍 SEARCH DEBUG: isUnifiedResponse:', isUnifiedResponse(wihyResponse));
        
        if (isUnifiedResponse(wihyResponse)) {
          const data = (wihyResponse as UnifiedResponse).data;
          console.log('🔍 SEARCH DEBUG: Unified response data:', data);
          
          if (data.ai_response?.response) {
            responseText = data.ai_response.response;
            console.log('🔍 SEARCH DEBUG: Using ai_response.response:', responseText.substring(0, 100) + '...');
          } else if (data.response) {
            // Handle JSON string responses
            if (typeof data.response === 'string') {
              try {
                const parsed = JSON.parse(data.response.replace(/'/g, '"'));
                responseText = parsed.core_principle || parsed.message || data.response;
                console.log('🔍 SEARCH DEBUG: Parsed JSON response:', responseText.substring(0, 100) + '...');
              } catch {
                responseText = data.response;
                console.log('🔍 SEARCH DEBUG: Using raw string response:', responseText.substring(0, 100) + '...');
              }
            } else {
              responseText = data.response;
              console.log('🔍 SEARCH DEBUG: Using direct response:', responseText.substring(0, 100) + '...');
            }
          }
        } else {
          // Legacy WihyResponse format
          const wihyResp = (wihyResponse as WihyResponse).wihy_response;
          console.log('🔍 SEARCH DEBUG: Legacy response wihy_response:', wihyResp);
          if (wihyResp && typeof wihyResp === 'object') {
            responseText = (wihyResp as any).core_principle || (wihyResp as any).message || 'Health information provided';
            console.log('🔍 SEARCH DEBUG: Using legacy response:', responseText.substring(0, 100) + '...');
          } else {
            responseText = 'Health information provided';
            console.log('🔍 SEARCH DEBUG: Using fallback response');
          }
        }

        // Set query and response for ChatWidget
        setCurrentQuery(trimmedQuery);
        setCurrentChatResponse(responseText);
        
        console.log('🔍 SEARCH DEBUG: Final - Setting query:', trimmedQuery);
        console.log('🔍 SEARCH DEBUG: Final - Setting chat response:', responseText);
        
        // Update URL for history
        if (pushToHistory) {
          const url = `?q=${encodeURIComponent(trimmedQuery)}`;
          window.history.pushState(
            { view: 'search', query: trimmedQuery, response: responseText },
            '',
            url
          );
        }
      } else {
        console.error('Search failed:', wihyResponse);
        setCurrentChatResponse('Sorry, I could not process your request. Please try again.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setCurrentChatResponse('Sorry, we encountered an error while searching. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSearch = () => {
    setCurrentView('search');
    setCurrentQuery('');
    setCurrentResults('');
    window.history.pushState({ view: 'search' }, '', '/');
  };

  const handleNewSearch = (newQuery: string) => {
    handleSearch(newQuery);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuery.trim()) return;
    console.log('🚀 Starting search with ChatGPT...');
    handleSearch(currentQuery.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTextSubmit(e as any);
    }
  };

  const handleClearAll = () => {
    setCurrentQuery('');
    setImage(null);
    setCurrentPhotoId(null);
    
    // Clear file input and CSS classes
    const fileInput = document.getElementById('camera-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    const searchInput = document.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.classList.remove('with-image');
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (!isListening) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  };

  // Clear expired cache on component mount
  useEffect(() => {
    searchCache.clearExpiredCache();
  }, []);

  useEffect(() => {
    // Service status check is now handled by WiHy API
    console.log('🔧 Using WiHy Unified API for health searches');
  }, []);



  // Replace the handleCameraClick function
  const handleCameraClick = () => {
    setIsUploadModalOpen(true);
  };

  // Change this function name and simplify it:
  const handleAnalysisComplete = async (foodName: string) => {
    try {
      console.log('Image analysis completed, food detected:', foodName);
      
      // Set the analyzed food name as the search query
      setCurrentQuery(foodName);
      
      // Trigger a search with the analyzed food name
      await handleSearch(foodName);
      
      // Close the modal
      setIsUploadModalOpen(false);
      
    } catch (error) {
      console.error('Error processing analyzed food:', error);
      alert('Failed to process the analyzed food. Please try again.');
    }
  };

  const handleUserChange = (user: any) => {
    console.log('User changed:', user);
  };

  const handleSignIn = (user: any) => {
    console.log('User signed in:', user);
  };

  const handleSignOut = () => {
    console.log('User signed out');
  };

  return (
    <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Main search area */}
      <div className="search-container">
      <MultiAuthLogin 
        position="top-right"
        className="main-login-button"
        onUserChange={handleUserChange}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      <h1 className="search-title">What is Healthy?</h1>

      <form onSubmit={handleTextSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Ask me what is healthy"
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="search-input"
          />
          
          {/* Show image chip when image is uploaded */}
          {image && (
            <div className="image-preview">
              <div className="image-icon">📷</div>
              <span className="image-name">{image.name}</span>
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setCurrentPhotoId(null);
                  const searchInput = document.querySelector('.search-input') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.classList.remove('with-image');
                  }
                }}
                className="remove-image"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          )}
          
          <div className="search-icons">
            {(currentQuery || image) && (
              <button
                type="button"
                onClick={handleClearAll}
                className="icon-button clear-button"
                aria-label="Clear all"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
            
            <button
              type="button"
              onClick={handleCameraClick}
              className="icon-button"
              aria-label="Upload image"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
            </button>
            
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`icon-button ${isListening ? 'listening' : ''}`}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.28c3.39-.49 6-3.3 6-6.72h-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </form>

      <div className="search-actions">
        <button 
          type="button" 
          className="search-button"
          onClick={() => window.open('https://mhealth.com', '_blank')}
        >
          mHealth
        </button>
        <button 
          type="button"
          className="search-button"
          onClick={() => window.open('https://whatishealthy.org', '_blank')}
        >
          What is Healthy?
        </button>
      </div>

      {/* Voice Feedback */}
      {isListening && (
        <div className="voice-feedback">
          <p>🎤 Listening...</p>
        </div>
      )}

      {/* Add the ImageUploadModal */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAnalysisComplete={handleAnalysisComplete} // Changed from onFileSelect
        title="Upload Image"
        subtitle="Upload images for analysis"
      />

      </div>

      {/* Chat and Charts Layout - Shows after search */}
      {(isChatOpen || currentResults) && (
        <div className="content-layout" style={{ 
          display: 'flex', 
          marginTop: '20px', 
          gap: '20px',
          padding: '20px',
          flex: '1'
        }}>
          {/* Chat placeholder */}
          <div className="chat-section" style={{ flex: '1', minWidth: '300px' }}>
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <p>Chat functionality is now available via the FullScreenChat component.</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section" style={{ flex: '1', minWidth: '300px' }}>
            <div className="analysis-charts">
              <h3 style={{ marginBottom: '20px', color: '#333' }}>Analysis Charts</h3>
              
              {/* Quality Analysis Chart */}
              <div className="chart-container" style={{ marginBottom: '30px' }}>
                <h4 style={{ marginBottom: '15px', color: '#666' }}>Quality Analysis</h4>
                <ResultQualityPie 
                  query={currentQuery}
                  results={currentResults}
                  dataSource={dataSource}
                  citations={[]}
                  apiResponse={currentApiResponse}
                />
              </div>

              {/* Nutrition Breakdown */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '15px', color: '#666' }}>Nutrition Breakdown</h4>
                <NutritionChart 
                  apiResponse={currentApiResponse}
                  query={currentQuery}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VHealthApp;