import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './VHealthSearch.css';
import ImageUploadModal from './components/ImageUploadModal';
import { foodAnalysisService } from './components/foodAnalysisService';
import LoginButton from './components/LoginButton/LoginButton';

const VHealthSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    console.log("Navigating to results for:", searchQuery);
    navigate(`/results?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    if (!isListening) {
      recognitionRef.current.start();
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleFeelingHealthy = () => {
    const healthyFoods = ['apple', 'broccoli', 'salmon', 'quinoa', 'blueberries'];
    const randomFood = healthyFoods[Math.floor(Math.random() * healthyFoods.length)];
    setSearchQuery(randomFood);
  };
  
  const handleFileSelect = async (file: File): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await foodAnalysisService.analyzeFoodImage(file);
      console.log("File analysis result:", result);
      
      let searchTerm = '';
      
      if (typeof result === 'string') {
        searchTerm = result;
      } else if (result && typeof result === 'object') {
        searchTerm = (result as any).name || 
                    (result as any).foodName || 
                    (result as any).food || 
                    'food item';
      }
      
      if (searchTerm) {
        setSearchQuery(searchTerm);
        navigate(`/results?q=${encodeURIComponent(searchTerm)}`);
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
    } finally {
      setIsLoading(false);
      setIsUploadModalOpen(false);
    }
  };

  return (
    <div className="search-landing">
      <div className="login-container" style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <LoginButton 
          position="top-right"
          className="login-button"
        />
      </div>

      <div className="search-container-centered">
        <h1 className="search-logo">
          What is Healthy?
        </h1>
        
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
            />
          </form>

          <div className="search-icons">
            {searchQuery && (
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
              onClick={() => setIsUploadModalOpen(true)}
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

        <div className="search-buttons">
          <button 
            onClick={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="search-btn primary"
            disabled={!searchQuery.trim() || isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Nutrition'}
          </button>
          
          <button 
            onClick={handleFeelingHealthy}
            className="search-btn secondary"
            type="button"
            style={{ color: '#000000' }} // Force black text
          >
            I'm Feeling Healthy
          </button>
        </div>
      </div>
      
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileSelect={handleFileSelect}
        title="Upload Health Image"
        subtitle="Upload food, medical, or health-related images for AI analysis"
      />
    </div>
  );
};

export default VHealthSearch;