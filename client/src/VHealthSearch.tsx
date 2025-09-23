import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './VHealthSearch.css';
import ImageUploadModal from './components/ImageUploadModal';
import MultiAuthLogin from './components/shared/components/MultiAuthLogin';
import { healthSearchService } from './services/healthSearchService';
import { searchCache } from './services/searchCache';
import { foodAnalysisService } from './components/foodAnalysisService';
import HealthNewsFeed from './components/HealthNewsFeed';

const VHealthSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Searching...');
  const [showFeelingHealthyContent, setShowFeelingHealthyContent] = useState(false);
  
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

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

  const handleUserChange = (user: any) => {
    console.log('User changed:', user);
  };

  const handleSignIn = (user: any) => {
    console.log('User signed in:', user);
  };

  const handleSignOut = () => {
    console.log('User signed out');
  };

  // Simplified search handler
  const handleSearch = async () => {
    if (!searchQuery.trim() || isLoading) return;
    
    setIsLoading(true);
    setLoadingMessage('Initializing search...');
    
    try {
      // Step 1: Check database cache first
      setLoadingMessage('Checking cache...');
      
      try {
        const response = await fetch(`http://localhost:5000/api/cache/get?q=${encodeURIComponent(searchQuery)}`);
        
        if (response.ok) {
          const cachedData = await response.json();
          console.log('Using cached results from database');
          setLoadingMessage('Loading cached results...');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setIsLoading(false);
          navigate(`/results?q=${encodeURIComponent(searchQuery)}&cached=true`);
          return;
        }
      } catch (cacheError) {
        console.log('No cache found, proceeding with API call');
      }

      // Step 2: Get fresh results from API
      setLoadingMessage('Analyzing with AI...');
      console.log('Getting fresh results for:', searchQuery);
      
      try {
        const searchResults = await healthSearchService.searchHealthInfo(searchQuery);
        console.log('Health search results received:', searchResults);
        
        const isValidResult = searchResults && 
          typeof searchResults === 'object' && 
          searchResults !== null &&
          (searchResults.summary || searchResults.details || Object.keys(searchResults).length > 0);
        
        if (isValidResult) {
          console.log('Valid results confirmed');
          
          // Step 3: Save to database cache (async, don't wait)
          setLoadingMessage('Caching results...');
          
          fetch('http://localhost:5000/api/cache/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: searchQuery,
              results: searchResults,
              source: 'openai'
            })
          }).then(response => {
            if (response.ok) {
              console.log('Results saved to database cache');
            } else {
              console.warn('Failed to save to cache');
            }
          }).catch(err => {
            console.warn('Cache save error:', err);
          });
          
          setLoadingMessage('Results ready!');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setIsLoading(false);
          console.log('Navigating to results page');
          navigate(`/results?q=${encodeURIComponent(searchQuery)}`);
          return;
        } else {
          throw new Error('Invalid results from API');
        }
        
      } catch (apiError) {
        console.error('Health search service failed:', apiError);
        
        // Step 4: Try similar results as fallback
        setLoadingMessage('Searching for similar results...');
        
        try {
          const similarResponse = await fetch(`http://localhost:5000/api/cache/similar?q=${encodeURIComponent(searchQuery)}`);
          
          if (similarResponse.ok) {
            const similarResults = await similarResponse.json();
            
            if (similarResults.length > 0) {
              console.log('Using similar cached results');
              setLoadingMessage('Loading similar results...');
              await new Promise(resolve => setTimeout(resolve, 300));
              
              setIsLoading(false);
              navigate(`/results?q=${encodeURIComponent(searchQuery)}&similar=true`);
              return;
            }
          }
        } catch (similarError) {
          console.warn('Similar results search failed:', similarError);
        }
        
        setLoadingMessage('No results found. Please try a different search.');
        setTimeout(() => {
          setIsLoading(false);
          setLoadingMessage('Searching...');
        }, 3000);
        return;
      }
        
    } catch (error) {
      console.error("Search error:", error);
      setLoadingMessage('Search failed. Please try again.');
      
      setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage('Searching...');
      }, 2000);
    }
  };

  const handleAnalysisComplete = async (foodName: string): Promise<void> => {
    if (!foodName || isLoading) {
      setIsUploadModalOpen(false);
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Processing image analysis...');
    
    try {
      console.log("Image analysis completed, food detected:", foodName);
      setSearchQuery(foodName);
      
      // Step 1: Check database cache for nutrition data
      setLoadingMessage('Checking nutrition database...');
      
      try {
        const response = await fetch(`http://localhost:5000/api/cache/get?q=${encodeURIComponent(foodName)}`);
        
        if (response.ok) {
          const cachedData = await response.json();
          console.log('Using cached nutrition data');
          setLoadingMessage('Loading cached nutrition data...');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setIsLoading(false);
          navigate(`/results?q=${encodeURIComponent(foodName)}&cached=true`);
          return;
        }
      } catch (cacheError) {
        console.log('No cached nutrition data found');
      }
      
      // Step 2: Get fresh nutrition data
      setLoadingMessage('Analyzing nutrition content...');
      
      try {
        const nutritionResults = await healthSearchService.searchHealthInfo(foodName);
        
        const isValidResult = nutritionResults && 
          typeof nutritionResults === 'object' && 
          nutritionResults !== null &&
          (nutritionResults.summary || nutritionResults.details || Object.keys(nutritionResults).length > 0);
        
        if (isValidResult) {
          // Step 3: Save to database cache (async, don't wait)
          setLoadingMessage('Caching nutrition data...');
          
          fetch('http://localhost:5000/api/cache/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: foodName,
              results: nutritionResults,
              source: 'image-analysis'
            })
          }).then(response => {
            if (response.ok) {
              console.log('Nutrition data saved to cache');
            } else {
              console.warn('Failed to save nutrition data to cache');
            }
          }).catch(err => {
            console.warn('Nutrition cache save error:', err);
          });
          
          setLoadingMessage('Nutrition analysis complete!');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setIsLoading(false);
          navigate(`/results?q=${encodeURIComponent(foodName)}`);
          return;
        } else {
          throw new Error('Invalid nutrition results');
        }
        
      } catch (nutritionError) {
        console.error('Nutrition analysis failed:', nutritionError);
        
        // Try similar results as fallback
        try {
          const similarResponse = await fetch(`http://localhost:5000/api/cache/similar?q=${encodeURIComponent(foodName)}`);
          
          if (similarResponse.ok) {
            const similarResults = await similarResponse.json();
            
            if (similarResults.length > 0) {
              console.log('Using similar nutrition data');
              setLoadingMessage('Loading similar nutrition data...');
              await new Promise(resolve => setTimeout(resolve, 300));
              
              setIsLoading(false);
              navigate(`/results?q=${encodeURIComponent(foodName)}&similar=true`);
              return;
            }
          }
        } catch (similarError) {
          console.warn('Similar nutrition search failed:', similarError);
        }
        
        setLoadingMessage('Could not analyze this food item. Please try again.');
        setTimeout(() => {
          setIsLoading(false);
          setLoadingMessage('Searching...');
        }, 3000);
        return;
      }
      
    } catch (error) {
      console.error("Error processing analyzed food:", error);
      setLoadingMessage('Analysis failed. Please try again.');
      
      setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage('Searching...');
      }, 2000);
    } finally {
      setIsUploadModalOpen(false);
    }
  };

  // Reset loading state on component unmount
  useEffect(() => {
    return () => {
      setIsLoading(false);
      setLoadingMessage('Searching...');
    };
  }, []);

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
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 24px auto'
        }} />
        
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
        
        {/* Progress Text */}
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#6b7280'
        }}>
          {progress}% Complete
        </p>
      </div>
    </div>
  );

  return (
    <div className="search-landing">
      {isLoading && (
        <LoadingOverlay 
          message={loadingMessage}
          progress={progressFromMessage(loadingMessage)}
        />
      )}
      
      <MultiAuthLogin 
        position="top-right"
        className="main-login-button"
        onUserChange={handleUserChange}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      <div className="search-container-centered">
        <div className="logo-container">
          {!imageError ? (
            <img 
              src="/assets/whatishealthylogo.png"
              alt="What is Healthy?"
              className="search-logo-image"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
          ) : (
            <h1 className="search-logo">
              What is Healthy?
            </h1>
          )}
        </div>
        
        <div className="search-input-container">
          <form onSubmit={(e) => { 
            e.preventDefault();
            handleSearch();
          }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ask anything about health..."
              className="search-input"
              autoFocus
              disabled={isLoading}
            />
          </form>

          <div className="search-icons">
            {searchQuery && !isLoading && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
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
              onClick={() => setIsUploadModalOpen(true)}
              className="icon-button"
              aria-label="Upload image"
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
            </button>
            
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

        <div className="search-buttons">
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
          
          <button 
            onClick={() => {
              if (isLoading) return;
              
              if (showFeelingHealthyContent) {
                // If news is showing, close it and set "What is Healthy?" in search
                setShowFeelingHealthyContent(false);
                setSearchQuery('What is Healthy?');
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
        </div>
      </div>
      
      {showFeelingHealthyContent && (
        <div 
          className="feeling-healthy-section"
          onClick={(e) => {
            // Close if clicking on the background, not the content
            if (e.target === e.currentTarget) {
              setShowFeelingHealthyContent(false);
              setSearchQuery('What is Healthy?');
            }
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <HealthNewsFeed maxArticles={6} />
          </div>
        </div>
      )}

      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
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