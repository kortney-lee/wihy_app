import React, { useState, useEffect, useRef } from 'react';
import SearchResults from './SearchResults';
import ImageUploadModal from './components/ImageUploadModal';
import { searchCache } from './services/searchCache';
import { healthSearchService } from './services/healthSearchService';
import { photoStorageService } from './services/photoStorageService';
import { foodAnalysisService } from './components/foodAnalysisService';
import './VHealthSearch.css';
import LoginButton from './components/LoginButton/LoginButton';

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
    if (!query.trim()) return;

    const trimmedQuery = query.trim();
    
    // Check cache first
    const cachedResults = searchCache.getCachedResult(trimmedQuery);
    
    if (cachedResults) {
      // Use cached results
      setCurrentQuery(trimmedQuery);
      setCurrentResults(cachedResults);
      setCurrentView('results');
      setIsLoading(false);
      
      if (pushToHistory) {
        const url = `?q=${encodeURIComponent(trimmedQuery)}`;
        window.history.pushState(
          { view: 'results', query: trimmedQuery, results: cachedResults },
          '',
          url
        );
      }
    } else {
      // Perform new search with ChatGPT/OpenAI
      setIsLoading(true);
      setCurrentQuery(trimmedQuery);
      setCurrentView('results');
      
      if (pushToHistory) {
        const url = `?q=${encodeURIComponent(trimmedQuery)}`;
        window.history.pushState(
          { view: 'results', query: trimmedQuery, results: '' },
          '',
          url
        );
      }
      
      try {
        console.log('🔍 Searching with ChatGPT for:', trimmedQuery);
        
        // Get health information from ChatGPT or fallback
        const healthData = await healthSearchService.searchHealthInfo(trimmedQuery);
        setDataSource(healthData.dataSource);
        
        // Format the results for display
        const formattedResults = formatHealthResults(healthData);
        
        setCurrentResults(formattedResults);
        searchCache.setCachedResult(trimmedQuery, formattedResults, window.location.href);
        
        // If this search included an image, silently save the analysis
        if (currentPhotoId && image) {
          await photoStorageService.updatePhotoAnalysis(currentPhotoId, formattedResults);
          console.log('AI analysis saved for photo:', currentPhotoId);
        }
        
        // Update history with results
        if (pushToHistory) {
          const url = `?q=${encodeURIComponent(trimmedQuery)}`;
          window.history.replaceState(
            { 
              view: 'results', 
              query: trimmedQuery, 
              results: formattedResults,
              dataSource: healthData.dataSource
            },
            '',
            url
          );
        }

        console.log(`✅ Search completed using: ${healthData.dataSource === 'openai' ? 'ChatGPT' : 'Local Database'}`);
      } catch (error) {
        console.error('❌ Search error:', error);
        const errorMessage = 'Sorry, we encountered an error while searching for health information. Please try again or consult with a healthcare provider for medical advice.';
        setCurrentResults(errorMessage);
        setDataSource('error');
      } finally {
        setIsLoading(false);
        setCurrentPhotoId(null); // Reset after use
      }
    }
  };

  const formatHealthResults = (healthData: any): string => {
    let formatted = '';
    
    // Keep only the clean content:
    formatted += `${healthData.summary}\n\n`;
    formatted += `${healthData.details}\n\n`;
    
    if (healthData.recommendations && healthData.recommendations.length > 0) {
      formatted += `**Recommendations:**\n${healthData.recommendations.map((r: string) => `• ${r}`).join('\n')}\n\n`;
    }
    
    if (healthData.sources && healthData.sources.length > 0) {
      formatted += `**Sources:** ${healthData.sources.join(', ')}\n\n`;
    }
    
    formatted += `**Medical Disclaimer:** ${healthData.medicalDisclaimer}`;
    
    return formatted;
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
    // Check service status on load
    healthSearchService.checkServiceStatus().then(status => {
      console.log('🔧 Health Search Service Status:', status);
    });
  }, []);

  // Replace the handleCameraClick function
  const handleCameraClick = () => {
    setIsUploadModalOpen(true);
  };

  // Add file select handler for the modal
  const handleFileSelect = async (file: File) => {
    setImage(file);
    
    // Generate a unique ID for this photo
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentPhotoId(photoId);
    
    // Add visual indicator
    const searchInput = document.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.classList.add('with-image');
    }
    
    // Auto-analyze food using existing service
    try {
      const foodAnalysisResult = await foodAnalysisService.analyzeFoodImage(file);
      if (foodAnalysisResult) {
        // Food detected - use the analysis as the search query
        setCurrentQuery("Food nutrition analysis from uploaded image");
        
        // Convert object result to string if needed
        if (typeof foodAnalysisResult === 'string') {
          setCurrentResults(foodAnalysisResult);
        } else {
          // Handle FoodAnalysisResult object by extracting text content or stringify
          setCurrentResults(
            (foodAnalysisResult as any).details || 
            (foodAnalysisResult as any).text || 
            JSON.stringify(foodAnalysisResult)
          );
        }
        
        setCurrentView('results');
        setDataSource('local');
      } else {
        // No food detected
        setIsLoading(false);
        alert("Could not identify any food in the image. Please try a different image.");
      }
    } catch (error) {
      console.log('Food analysis failed, continuing with general image upload');
      setCurrentQuery("Analyze this uploaded health-related image");
    }
  };

  if (currentView === 'results') {
    return (
      <SearchResults
        query={currentQuery}
        results={currentResults}
        onBackToSearch={handleBackToSearch}
        onNewSearch={handleNewSearch}
        isLoading={isLoading}
        dataSource={dataSource}
      />
    );
  }

  return (
    <div className="search-container">
      <LoginButton 
        position="top-right"
        className="main-login-button"
      />

      <h1 className="search-title">What is Healthy?</h1>

      <form onSubmit={handleTextSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Ask anything about health..."
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
        onFileSelect={handleFileSelect}
        title="Upload What You Eat"
        subtitle="Upload food, medical, or health-related images for AI analysis"
      />
    </div>
  );
}

export default VHealthApp;