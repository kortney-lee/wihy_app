import React, { useState, useEffect, useRef } from 'react';
import { searchCache } from './services/searchCache';
import { photoStorageService } from './services/photoStorageService';
import { foodAnalysisService } from './components/foodAnalysisService';
import ImageUploadModal from './components/ImageUploadModal';
import LoginButton from './components/LoginButton/LoginButton';
import ResultQualityPie from './components/ResultQualityPie';
import { 
  analyzeFoodImage, 
  processUploadedFoodImage, 
  fetchNutritionData 
} from './services/apiService';
import './VHealthSearch.css';
import Spinner from './components/Spinner';

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
  { text: "🩺 mHealth - Mobile Health Solutions", url: "https://mhealth.com" },
  { text: "🏥 CDC - Health Guidelines", url: "https://cdc.gov/healthliving" },
  { text: "🌍 WHO - Global Health Information", url: "https://who.int/health-topics" }
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
  dataSource: "error" | "openai" | "local" | "vnutrition";
  citations?: string[];
  recommendations?: string[];
  disclaimer?: string;
}

// Add this function before the SearchResults component
const convertLinksToClickable = (text: string): JSX.Element => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a 
              key={index} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-link"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </>
  );
};

const SearchResults: React.FC<SearchResultsProps> = ({ 
  query, 
  results, 
  onBackToSearch,
  onNewSearch,
  isLoading = false,
  dataSource = 'local'
}) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<File | string | null>(null);
  const [currentPhotoId, setCurrentPhotoId] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: string} | null>(null);
  const [isUploadLoading, setUploadLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

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
    
    // Cleanup on unmount
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
    if (!input.trim()) return;
    
    const trimmedQuery = input.trim();
    
    // Check for test query - return fake data without API call
    if (trimmedQuery.toLowerCase() === 'test') {
      console.log('🧪 Test query detected in SearchResults - avoiding API call');
      onNewSearch(trimmedQuery); // This will trigger the test logic in parent
      return;
    }
    
    onNewSearch(trimmedQuery);
  };

  // Handle voice input
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
        setNewQuery(transcript); // Update the input field
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

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      console.log(`Image uploaded: ${file.name}`);
    }
  };

  // Clear all search items
  const handleClearAll = () => {
    setInput('');
    setNewQuery(''); // <-- Add this line
    setImage(null);
    setCurrentPhotoId(null);
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Remove CSS class
    const searchInput = document.querySelector('.results-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.classList.remove('with-image');
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextSubmit(e as any);
    }
  };

  // Photo modal handlers
  const handleCameraClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleFileSelect = async (file: File) => {
    setUploadLoading(true); // Use the new state instead
    setImage(URL.createObjectURL(file));
    
    try {
      const result = await processUploadedFoodImage(file);
      
      if (result.success) {
        // Use the food name and nutrition data
        setNewQuery(result.foodName);
        
        // If we have nutrition data
        if (result.nutrition) {
          onNewSearch(result.foodName); // Only call search here
        } else {
          onNewSearch(result.foodName);
        }
      } else {
        // Handle error
        setNotification({
          message: 'Could not identify food in image',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setUploadLoading(false); // Reset the loading state
      setIsUploadModalOpen(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleNewSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuery.trim()) return;
    onNewSearch(newQuery);
    setNewQuery(''); // Reset after search
  };

  // Check if current query is "test" to show dummy data styles
  const isTestQuery = query.toLowerCase().trim() === 'test';

  // Replace your existing calculateQualityScore function with this one:
  const calculateQualityScore = (): number => {
    // Start with a baseline score
    let score = 0.5;
    
    // Special case: Invalid query responses should score ZERO
    if (/not appear to be a recognized medical term/.test(results) || 
        /not a recognized|unrecognized|isn't recognized/.test(results) ||
        /could not find information|no information found/.test(results) ||
        /does not seem to be|doesn't seem to be/.test(results) ||
        /please provide more|please clarify/.test(results)) {
      return 0; // Zero score (not 0.25) for nonsensical queries
    }
    
    // Check if the query itself looks like gibberish
    // This catches strings like "yiiiy", "wqerq2", "qaoijna", etc.
    if (/^[a-z0-9]{1,7}$/i.test(query) && !/^(hiv|flu|cold|covid|bp|bmi|gerd|ibs|std|uti)$/i.test(query)) {
      return 0; // Zero for short, random character sequences (unless common medical abbreviations)
    }
    
    // If error, return low score immediately
    if (dataSource === 'error') return 0.2;
    
    // For nutrition data, base score on completeness
    if (dataSource === 'vnutrition') {
      try {
        const nutrition = typeof results === 'string' ? JSON.parse(results) : results;
        if (!nutrition || nutrition === 'null' || nutrition.found === false) {
          return 0.4; // Incomplete data
        }
        // Higher score if detailed nutrition data is available
        const detailsAvailable = nutrition.calories_per_serving && 
                                nutrition.macros?.protein && 
                                nutrition.macros?.carbs;
        return detailsAvailable ? 0.9 : 0.75;
      } catch {
        return 0.5; // Default for nutrition if parsing fails
      }
    }
    
    // For text-based search results, analyze content quality
    const resultsText = results.toLowerCase();
    
    // Check for academic citations and journal references
    const hasCitations = /\b(?:doi|pmid|pubmed|journal|citation)\b/i.test(resultsText);
    const hasJournalNames = /\b(?:jama|nejm|lancet|bmj|nih|nature|science|cell|journal)\b/i.test(resultsText);
    const hasAcademicSources = /\b(?:study|research|clinical trial|meta-analysis|systematic review)\b/i.test(resultsText);
    
    // Check for actionable content
    const hasActionableContent = /\b(?:recommend|should|can|treatment option|therapy|steps|guidelines|advice)\b/i.test(resultsText);
    const hasNumericData = /\b\d+(?:\.\d+)?%?\s*(?:mg|g|mcg|iu|percent|patients|cases|risk)\b/i.test(resultsText);
    
    // Add points for quality indicators
    if (hasCitations) score += 0.15;
    if (hasJournalNames) score += 0.15;
    if (hasAcademicSources) score += 0.1;
    if (hasActionableContent) score += 0.1;
    if (hasNumericData) score += 0.1;
    
    // Check for lack of specificity
    const hasVagueLanguage = /\b(?:may|might|possibly|perhaps|unclear|not certain)\b/i.test(resultsText);
    
    // Reduce score for vague content
    if (hasVagueLanguage && !hasAcademicSources) score -= 0.1;
    
    // Cap the score between 0.1 and 0.95
    return Math.min(0.95, Math.max(0.1, score));
  };

  // Then in your JSX, add the chart above Related Health Topics
  const resultQualityScore = calculateQualityScore();

  return (
    <div className={`results-page ${isLoading ? 'loading' : ''} ${isUploadModalOpen ? 'modal-open' : ''}`}>
      <LoginButton 
        position="top-right"
        className="results-login-button"
      />

      {/* Always show header */}
      <div className="results-search-header">
        <div className="search-input-container">
          <form onSubmit={handleNewSearchSubmit}>
            <input
              type="text"
              placeholder="Ask anything about health..."
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              className="search-input results-search-input"
              data-query={isTestQuery ? 'test' : ''}
            />
          </form>
          
          {/* Show image chip when image is uploaded */}
          {image && (
            <div className="image-preview">
              <div className="image-icon">📷</div>
              <span className="image-name">
                {typeof image === 'object' && image !== null ? image.name : 'Uploaded image'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setCurrentPhotoId(null);
                  const searchInput = document.querySelector('.results-search-input') as HTMLInputElement;
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
            {(newQuery || image) && (
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
      </div>

      {/* Always show Results Content */}
      <div className="results-container">
        <h1 className="results-header">Search Results for: "{query}"</h1>
        
        <div className="results-content">
          <div className="health-info-card">
            <div className="health-info-content">
              {/* Use the link conversion function */}
              <div className="markdown-content">
                {dataSource === 'vnutrition' ? (
                  (() => {
                    let nutrition;
                    try {
                      nutrition = typeof results === 'string' ? JSON.parse(results) : results;
                    } catch {
                      nutrition = results;
                    }
                    if (!nutrition || nutrition === 'null') {
                      return <div>No nutrition data found.</div>;
                    }
                    if (nutrition.found === false) {
                      return <div>{nutrition.message}</div>;
                    }
                    return (
                      <div>
                        <h3>{nutrition.item || 'Unknown Product'}</h3>
                        <ul>
                          <li>Calories per serving: {nutrition.calories_per_serving ?? 'N/A'}</li>
                          <li>Protein: {nutrition.macros?.protein ?? 'N/A'}</li>
                          <li>Carbs: {nutrition.macros?.carbs ?? 'N/A'}</li>
                          <li>Fat: {nutrition.macros?.fat ?? 'N/A'}</li>
                          <li>Processed Level: {nutrition.processed_level ?? 'N/A'}</li>
                          <li>Ingredients: {nutrition.verdict ?? 'N/A'}</li>
                        </ul>
                      </div>
                    );
                  })()
                ) : (
                  convertLinksToClickable(results)
                )}
              </div>
            </div>
            
            <div className="data-source-indicator">
              {dataSource === 'openai' ? (
                <span>Powered by AI</span>
              ) : dataSource === 'error' ? (
                <span className="error-source">Error retrieving data</span>
              ) : (
                <span>From health database</span>
              )}
            </div>
          </div>
          
          <div className="sidebar">
            {/* Add the quality chart here */}
            <div className="quality-chart-container" style={{ marginBottom: "2rem" }}>
              <ResultQualityPie qualityScore={resultQualityScore} />
            </div>
            
            <div className="related-topics-card">
              <h3>Related Health Topics</h3>
              <ul className="related-topics-list">
                {isTestQuery ? (
                  dummyTestData.relatedTopics.map((topic, index) => (
                    <li key={index}>
                      <button 
                        onClick={() => onNewSearch(topic)}
                        className="topic-button"
                      >
                        {topic}
                      </button>
                    </li>
                  ))
                ) : (
                  defaultRelatedTopics.map((topic, index) => (
                    <li key={index}>
                      <button 
                        onClick={() => onNewSearch(topic)}
                        className="topic-button"
                      >
                        {topic}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
            
            <div className="resources-card">
              <h3>Useful Resources</h3>
              <ul className="resources-list">
                {isTestQuery ? (
                  dummyTestData.resources.map((resource, index) => (
                    <li key={index}>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        {resource.text}
                      </a>
                    </li>
                  ))
                ) : (
                  defaultResources.map((resource, index) => (
                    <li key={index}>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        {resource.text}
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Loading State Overlay - Only shows when loading */}
        {isLoading && (
          <div className="loading-container">
            <Spinner message="Searching for health information..." />
          </div>
        )}

        {/* ImageUploadModal - always available */}
        <ImageUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onFileSelect={handleFileSelect}
          title="Upload Health Image"
          subtitle="Upload food, medical, or health-related images for AI analysis"
        />
      </div>
    </div>
  );
};

export default SearchResults;