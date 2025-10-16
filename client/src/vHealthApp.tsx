import React, { useState, useEffect, useRef } from 'react';
import SearchResults from './SearchResults';
import ImageUploadModal from './components/ImageUploadModal';
import { searchCache } from './services/searchCache';
import { wihyAPI } from './services/wihyAPI';
import { photoStorageService } from './services/photoStorageService';
import { foodAnalysisService } from './components/foodAnalysisService';
import './VHealthSearch.css';
import MultiAuthLogin from './components/shared/components/MultiAuthLogin';

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
  const [placeholder, setPlaceholder] = useState(rotatingPrompts[0]);

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
    
    // Add debugging right when loading starts
    setIsLoading(true);
    console.log('🔍 SEARCH DEBUG: setIsLoading(true) called');
    
    if (!query.trim()) return;

    const trimmedQuery = query.trim();
    
    // Check cache first
    const cachedResults = searchCache.getCachedResult(trimmedQuery);
    
    if (cachedResults) {
      console.log('🔍 SEARCH DEBUG: Using cached results');
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
      console.log('🔍 SEARCH DEBUG: Making new search request');
      
      try {
        console.log('🔍 SEARCH DEBUG: About to call wihyAPI.searchHealth');
        const wihyResponse = await wihyAPI.searchHealth(trimmedQuery);
        console.log('🔍 SEARCH DEBUG: Got response from wihyAPI:', wihyResponse);
        
        let healthData;
        let formattedResults;
        
        if (wihyResponse.success) {
          // Convert WiHy response to expected format
          healthData = {
            summary: wihyResponse.wihy_response.core_principle,
            details: wihyAPI.formatWihyResponse(wihyResponse),
            sources: wihyAPI.extractCitations(wihyResponse),
            recommendations: wihyAPI.extractRecommendations(wihyResponse),
            relatedTopics: [],
            medicalDisclaimer: 'This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.',
            dataSource: 'wihy'
          };
          
          // Format the results for display
          formattedResults = formatHealthResults(healthData);
          
          setCurrentResults(formattedResults);
          searchCache.setCachedResult(trimmedQuery, formattedResults, window.location.href);
        } else {
          throw new Error('WiHy API request failed');
        }
        
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
        console.error('🔍 SEARCH DEBUG: Error in search:', error);
        const errorMessage = 'Sorry, we encountered an error while searching for health information. Please try again or consult with a healthcare provider for medical advice.';
        setCurrentResults(errorMessage);
        setDataSource('error');
      } finally {
        console.log('🔍 SEARCH DEBUG: setIsLoading(false) called');
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
    // Service status check is now handled by WiHy API
    console.log('🔧 Using WiHy Unified API for health searches');
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
            placeholder={placeholder}
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
  );
}

export default VHealthApp;