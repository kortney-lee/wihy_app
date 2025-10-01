import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import VHealthSearch from './VHealthSearch';
import SearchResults from './SearchResults';
import HealthNewsFeed from './components/HealthNewsFeed';
import openaiAPI from './services/openaiAPI';
import { searchCache } from './services/searchCache';
import { fetchNewsFeed, refreshNewsFeed, searchNewsArticles } from './services/newsService';
import './VHealthSearch.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

type AllowedDataSource = "error" | "openai" | "local" | "vnutrition";

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
      
      console.log("Query changed to:", query);
      console.log("Is health news:", isHealthNews);
      console.log("Is browser navigation:", isBrowserNavigation());
      
      // Create cache key based on type
      const cacheKey = isHealthNews ? `health_news_${category}` : query;
      
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
        return; // Exit early - no API calls needed
      }
      
      // If this is browser navigation and no cache, redirect to search page
      if (isBrowserNavigation() || !isInitialLoad) {
        console.log('Browser navigation detected with no cache - redirecting to search');
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
                return;
              }
            }
          } catch (nutritionError) {
            console.log('Nutrition API error:', nutritionError);
          }
          
          // STEP 2: Fall back to OpenAI if no nutrition data found
          console.log('Using OpenAI as fallback...');
          const result: ChatGPTResponse = await openaiAPI.searchHealthInfo(query);
          console.log("OpenAI Search result:", result);
          
          const resultText = result.details || JSON.stringify(result);
          setResults(resultText);
          setDataSource("openai");
          
          // Cache the OpenAI results
          searchCache.setCachedResult(query, resultText, window.location.href);
          
          setCitations(result.sources || []);
          setRecommendations(result.recommendations || []);
          setDisclaimer(result.medicalDisclaimer || '');
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
      }
    };
    
    fetchResults();
  }, [query, isHealthNews, category, navigate]);

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