import React, { useState, useEffect, useRef } from 'react';
import { searchCache } from './services/searchCache';
import { photoStorageService } from './services/photoStorageService';
import { foodAnalysisService } from './components/foodAnalysisService';
import ImageUploadModal from './components/ImageUploadModal';
import MultiAuthLogin from './components/shared/components/MultiAuthLogin';
import ResultQualityPie from './components/ResultQualityPie';
import NutritionChart from './components/NutritionChart';
import NovaChart from './components/NovaChart';
import './styles/VHealthSearch.css';
import Header from './components/shared/components/Header';
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
  
  return parts.map((part: string, index: number) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#2563eb', textDecoration: 'underline' }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const SearchResults: React.FC<SearchResultsProps> = ({ 
  query, 
  results, 
  onBackToSearch,
  onNewSearch,
  isLoading = false,
  dataSource,
  citations
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
  const [imageError, setImageError] = useState(false); // Add this state
  const [isSearching, setIsSearching] = useState(false);
  const recognitionRef = useRef<any>(null);

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

  // Handle new search submission - only allow if user explicitly searches from results page
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const trimmedQuery = input.trim();
    
    // Prevent duplicate searches
    if (trimmedQuery === lastProcessedQuery || trimmedQuery === query) {
      console.log('Preventing duplicate search for:', trimmedQuery);
      return;
    }
    
    setLastProcessedQuery(trimmedQuery);
    onNewSearch(trimmedQuery);
    setInput(''); // Clear input after search
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

  // Simple handler that just triggers a new search - only when user explicitly requests it
  const handleAnalysisComplete = (foodName: string) => {
    if (foodName && foodName !== lastProcessedQuery && foodName !== query) {
      console.log('User explicit search from image analysis:', foodName);
      setNewQuery(foodName);
      setLastProcessedQuery(foodName);
      onNewSearch(foodName);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (imageFile) {
      // Instead of calling handleFileSelect, open the modal and let it handle the file
      setIsUploadModalOpen(true);
      // You could also trigger the analysis directly if you want immediate processing
      // But it's cleaner to let the user see the modal and confirm
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleNewSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuery.trim() || isLoading) return;
    
    const trimmedQuery = newQuery.trim();
    
    // Prevent duplicate searches
    if (trimmedQuery === lastProcessedQuery || trimmedQuery === query) {
      console.log('Preventing duplicate search for:', trimmedQuery);
      return;
    }
    
    console.log('User explicit search from new query:', trimmedQuery);
    setLastProcessedQuery(trimmedQuery);
    onNewSearch(trimmedQuery);
    setNewQuery(''); // Reset after search
  };

  // Update last processed query when props change
  useEffect(() => {
    if (query && query !== lastProcessedQuery) {
      setLastProcessedQuery(query);
    }
  }, [query]);

  // Check if current query is "test" to show dummy data styles
  const isTestQuery = query.toLowerCase().trim() === 'test';

  // Header search handler
  const handleHeaderSearch = async (newQuery: string) => {
    if (newQuery.trim() && newQuery !== query) {
      setIsSearching(true);
      
      try {
        // Call the parent's onNewSearch which should handle the API call
        await onNewSearch(newQuery);
      } catch (error) {
        console.error('Header search error:', error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleLogoClick = () => {
    onBackToSearch();
  };

  return (
    <div className="results-page">
      <Header
        searchQuery={query}
        onSearchSubmit={handleHeaderSearch}
        onVoiceInput={() => {/* voice logic */}}
        onImageUpload={() => setIsUploadModalOpen(true)}
        onLogoClick={handleLogoClick}
        isListening={false}
        variant="results"
        showLogin={true}
      />

      {/* Show spinner when searching from header */}
      {(isLoading || isSearching) && (
        <Spinner
          overlay={true}
          title="Analyzing with AI..."
          subtitle="Processing your health query..."
          disableEsc={true}
        />
      )}
      
      <div className="results-container">
        {hasValidResults ? (
          <>
            <div className="results-content">
              {/* Main content */}
              <div className="health-info-card">
                <div className="health-info-content">
                  <div className="markdown-content">
                    {dataSource === 'vnutrition' ? (
                      (() => {
                        let nutrition;
                        try {
                          nutrition = typeof results === 'string' ? JSON.parse(results) : results;
                          console.log('Raw nutrition object for debugging:', nutrition);
                          
                          if (nutrition && nutrition.found !== false) {
                            return (
                              <div>
                                <h3>Nutrition Information</h3>
                                <ul>
                                  <li>Calories per serving: {nutrition.calories_per_serving || 0}</li>
                                  <li>Protein: {nutrition.protein_g || 0}g</li>
                                  <li>Carbs: {nutrition.carbs_g || 0}g</li>
                                  <li>Fat: {nutrition.fat_g || 0}g</li>
                                  <li>NOVA Score: {nutrition.nova_classification || 1}</li>
                                  <li>Processing Level: {nutrition.nova_description || nutrition.processed_level || 'Unknown'}</li>
                                </ul>
                              </div>
                            );
                          } else {
                            return (
                              <div>
                                <h3>Raw Database Data (Debug)</h3>
                                <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px' }}>
                                  {JSON.stringify(nutrition, null, 2)}
                                </pre>
                              </div>
                            );
                          }
                        } catch {
                          return <div>Error parsing nutrition data</div>;
                        }
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
                    <span>What Is Healthy?</span>
                  )}
                </div>
              </div>
              
              {/* Sidebar - ONLY when NOT loading and we have results */}
              <div className="sidebar">
                {/* Quality Chart */}
                <div className="quality-chart-container" style={{ marginBottom: "2rem" }}>
                  <ResultQualityPie 
                    query={query || ''} 
                    results={results || ''}
                    dataSource={dataSource || 'openai'}
                    citations={citations || []}
                  />
                </div>

                {/* Nutrition Charts - Only show when we have nutrition data */}
                {dataSource === 'vnutrition' && (
                  <>
                    <div className="nutrition-chart-container" style={{ marginBottom: "2rem" }}>
                      <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#374151" }}>
                        Nutrition Breakdown
                      </h3>
                      <NutritionChart 
                        query={query}
                        results={results}
                        dataSource={dataSource}
                      />
                    </div>

                    <div className="nova-chart-container" style={{ marginBottom: "2rem" }}>
                      <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#374151" }}>
                        Processing Level (NOVA Score)
                      </h3>
                      <NovaChart 
                        query={query}
                        results={results}
                        dataSource={dataSource}
                      />
                    </div>
                  </>
                )}
                
                {/* Related Topics */}
                <div className="related-topics-card">
                  <h3>Related Health Topics</h3>
                  <ul className="related-topics-list">
                    {isTestQuery ? (
                      dummyTestData.relatedTopics.map((topic, index) => (
                        <li key={index}>
                          <button 
                            onClick={() => {
                              if (topic !== lastProcessedQuery && topic !== query && !isLoading) {
                                console.log('User explicit search from related topic:', topic);
                                setLastProcessedQuery(topic);
                                onNewSearch(topic);
                              }
                            }}
                            className="topic-button"
                            disabled={isLoading}
                          >
                            {topic}
                          </button>
                        </li>
                      ))
                    ) : (
                      defaultRelatedTopics.map((topic, index) => (
                        <li key={index}>
                          <button 
                            onClick={() => {
                              if (topic !== lastProcessedQuery && topic !== query && !isLoading) {
                                console.log('User explicit search from related topic:', topic);
                                setLastProcessedQuery(topic);
                                onNewSearch(topic);
                              }
                            }}
                            className="topic-button"
                            disabled={isLoading}
                          >
                            {topic}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                
                {/* Resources */}
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
          </>
        ) : (
          !isLoading && !isSearching && (
            <div className="no-results-message">
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