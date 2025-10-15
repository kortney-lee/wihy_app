import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import VHealthSearch from './VHealthSearch';
import SearchResults from './SearchResults';
import HealthNewsFeed from './components/HealthNewsFeed';
import openaiAPI from './services/openaiAPI';
import { wihyAPI } from './services/wihyAPI';
import { searchCache } from './services/searchCache';
import { fetchNewsFeed, refreshNewsFeed, searchNewsArticles } from './services/newsService';
import './styles/VHealthSearch.css';
import './index.css';
import VHealthApp from './vHealthApp';
import { API_CONFIG, getApiEndpoint } from './config/apiConfig';

const API_BASE_URL = API_CONFIG.BASE_URL.replace(/\/api$/, ''); // Remove /api suffix

export const searchFoodDatabase = async (query: string) => {
  try {
    console.log('Calling food database API for:', query);
    
    const response = await fetch(`${API_BASE_URL}/api/food/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Food API response:', data);
    
    return data;
  } catch (error) {
    console.error('Food database API error:', error);
    throw error;
  }
};

export const foodAPI = {
  searchFood: searchFoodDatabase
};

// Export news API for use in other components
export const newsAPI = {
  fetchNewsFeed,
  refreshNewsFeed,
  searchNewsArticles
};

type AllowedDataSource = "error" | "openai" | "local" | "vnutrition" | "wihy";

const ResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const isHealthNews = searchParams.get('type') === 'health_news';
  const category = searchParams.get('category') || 'all';
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string>('');
  const [dataSource, setDataSource] = useState<AllowedDataSource>("local");
  const [citations, setCitations] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>('');
  
  // Track if this is initial load to prevent loading spinner on browser navigation
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Add ref to prevent duplicate API calls
  const lastProcessedQuery = useRef<string>('');
  const isProcessing = useRef<boolean>(false);
  
  // Detect browser navigation type
  const isBrowserNavigation = () => {
    const navigation = (window as any).performance?.getEntriesByType?.('navigation')?.[0];
    return navigation?.type === 'back_forward';
  };

  // Fetch results when query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (!query && !isHealthNews) {
        setIsLoading(false);
        return;
      }
      
      // Create cache key based on type
      const cacheKey = isHealthNews ? `health_news_${category}` : query;
      
      // Prevent duplicate processing
      if (isProcessing.current || lastProcessedQuery.current === cacheKey) {
        console.log('Skipping duplicate query:', cacheKey);
        return;
      }
      
      console.log("Processing new query:", cacheKey);
      lastProcessedQuery.current = cacheKey;
      isProcessing.current = true;
      
      console.log("Is health news:", isHealthNews);
      console.log("Is browser navigation:", isBrowserNavigation());
      
      // Always check cache first - especially for browser navigation
      const cachedResult = searchCache.getCachedResult(cacheKey);
      if (cachedResult) {
        console.log('Using cached results for:', cacheKey);
        setResults(cachedResult);
        setDataSource('local');
        setIsLoading(false);
        setCitations([]);
        setRecommendations([]);
        setDisclaimer('');
        setIsInitialLoad(false);
        isProcessing.current = false; // Reset processing flag
        return; // Exit early - no API calls needed
      }
      
      // If this is browser navigation and no cache, redirect to search page
      if (isBrowserNavigation() || !isInitialLoad) {
        console.log('Browser navigation detected with no cache - redirecting to search');
        isProcessing.current = false; // Reset processing flag
        navigate('/');
        return;
      }
      
      // Only show loading for genuine new searches (not browser navigation)
      setIsLoading(true);
      
      try {
        // Handle "I'm Feeling Healthy" requests
        if (isHealthNews) {
          console.log('Fetching health news via newsService...');
          const healthNewsResult = await fetchNewsFeed([category], 6);
          
          if (healthNewsResult.success && healthNewsResult.articles) {
            console.log('Health news fetched successfully');
            
            // Format the news articles for display
            const formattedNews = formatNewsArticles(healthNewsResult.articles);
            
            setResults(formattedNews);
            setDataSource('openai'); // Use openai as the display source
            
            // Cache the health news results
            searchCache.setCachedResult(cacheKey, formattedNews, window.location.href);
            
            setDisclaimer('Health news provided by AI. Always consult healthcare professionals for medical advice.');
          } else {
            throw new Error(healthNewsResult.message || 'Failed to fetch health news');
          }
        } else {
          // Handle regular search queries
          // STEP 1: First try the nutrition database
          try {
            console.log('Trying nutrition database first...');
            console.log('API URL:', `${API_BASE_URL}/api/search/food?q=${encodeURIComponent(query)}`);
            
            const nutritionResponse = await fetch(`${API_BASE_URL}/api/search/food?q=${encodeURIComponent(query)}`);
            
            if (nutritionResponse.ok) {
              const nutritionData = await nutritionResponse.json();
              console.log('Nutrition API response:', nutritionData);
              
              if (nutritionData && nutritionData.found === true) {
                console.log('Found nutrition data - using vnutrition source');
                const resultString = JSON.stringify(nutritionData);
                setResults(resultString);
                setDataSource('vnutrition');
                
                // Cache the nutrition results
                searchCache.setCachedResult(query, resultString, window.location.href);
                
                setIsLoading(false);
                setIsInitialLoad(false);
                isProcessing.current = false; // Reset processing flag
                return;
              }
            }
          } catch (nutritionError) {
            console.log('Nutrition API error:', nutritionError);
          }
          
          // STEP 2: Fall back to WiHy API if no nutrition data found
          console.log('Making WiHy API call for query:', query);
          const wihyRequest = { query: query };
          const wihyResult = await wihyAPI.askAnything(wihyRequest);
          console.log("WiHy API result received:", wihyResult);
          
          if (wihyResult.success) {
            const formattedResult = wihyAPI.formatWihyResponse(wihyResult);
            setResults(formattedResult);
            setDataSource("wihy");
            
            // Cache the WiHy results
            searchCache.setCachedResult(query, formattedResult, window.location.href);
            
            setCitations(wihyAPI.extractCitations(wihyResult));
            setRecommendations(wihyAPI.extractRecommendations(wihyResult));
            setDisclaimer('This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.');
          } else {
            throw new Error('WiHy API request failed');
          }
        }
        
      } catch (error) {
        console.error("Search error:", error);
        const errorMessage = "Sorry, there was an error processing your request.";
        setResults(errorMessage);
        setDataSource("error");
        
        setCitations([]);
        setRecommendations([]);
        setDisclaimer('');
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
        isProcessing.current = false; // Always reset processing flag
      }
    };
    
    fetchResults();
  }, [query, isHealthNews, category]); // Removed 'navigate' from dependencies

  // Function to format news articles for display
  const formatNewsArticles = (articles: any[]): string => {
    let formatted = '# Latest Health News\n\n';
    
    articles.forEach((article, index) => {
      formatted += `## ${article.title}\n\n`;
      formatted += `**Source:** ${article.source} (${article.domain})\n`;
      formatted += `**Category:** ${article.category}\n`;
      formatted += `**Published:** ${new Date(article.publishedDate).toLocaleDateString()}\n`;
      formatted += `**Relevance:** ${Math.round(article.relevanceScore * 100)}%\n\n`;
      formatted += `${article.summary}\n\n`;
      
      if (article.tags && article.tags.length > 0) {
        formatted += `**Tags:** ${article.tags.join(', ')}\n\n`;
      }
      
      formatted += `[Read Full Article](${article.url})\n\n`;
      formatted += '---\n\n';
    });
    
    return formatted;
  };

  const handleBackToSearch = () => {
    navigate('/');
  };

  const handleNewSearch = (newQuery: string) => {
    if (newQuery !== query) {
      // Reset the initial load flag for new searches
      setIsInitialLoad(true);
      navigate(`/results?q=${encodeURIComponent(newQuery)}`);
    }
  };

  return (
    <SearchResults
      query={isHealthNews ? 'Latest Health News' : query}
      results={results}
      onBackToSearch={handleBackToSearch}
      onNewSearch={handleNewSearch}
      isLoading={isLoading}
      dataSource={dataSource}
      citations={citations}
      recommendations={recommendations}
      disclaimer={disclaimer}
    />
  );
};

const App: React.FC = () => {
  console.log("App component rendered");
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VHealthSearch />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Router>
  );
};

export default App;

interface ChatGPTResponse {
  details?: string;
  sources?: string[];
  recommendations?: string[];
  medicalDisclaimer?: string;
}