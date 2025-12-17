import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import VHealthSearch from './components/search/VHealthSearch';
import SearchResults from './components/search/SearchResults';
// import HealthNewsFeed from './components/HealthNewsFeed';
import TestChartsPage from './pages/TestChartsPage';
import ComprehensiveHealthDashboard from './pages/ComprehensiveHealthDashboard';
import TestDashboardGrid from './pages/TestDashboardGrid';
import TestIndividualComponents from './pages/TestIndividualComponents';
import AboutPage from './pages/AboutPage';
import NewAboutpage from './pages/NewAboutpage';
import InvestorsPage from './pages/InvestorsPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage'
import TailwindDemoPage from './pages/TailwindDemoPage';
import NewsPage from './pages/NewsPage';
import NutritionFactsPage from './pages/NutritionFacts';
import DebugFullScreen from './pages/DebugFullScreen';
import CoachDashboard from './components/dashboard/CoachDashboard';
import ParentDashboard from './components/dashboard/ParentDashboard';
import OverviewDashboard from './components/dashboard/OverviewDashboard';
import DashboardPage from './components/dashboard/DashboardPage';
import TrackingDashboard from './pages/TrackingDashboard';
import AdminLinkGenerator from './pages/AdminLinkGenerator';
import EngagementDashboard from './pages/EngagementDashboard';
import EngagementSignup from './pages/EngagementSignup';
import PredictiveDashboard from './pages/PredictiveDashboard';
import { PlatformNavigationExample } from './components/examples/PlatformNavigationExample';
import { wihyAPI } from './services/wihyAPI';
import { searchCache } from './services/searchCache';
import { fetchNewsFeed, refreshNewsFeed, searchNewsArticles } from './services/newsService';
import { logger } from './utils/logger';
import { PlatformDetectionService } from './services/shared/platformDetectionService';
import './styles/VHealthSearch.css';
import './index.css';
// import VHealthApp from './vHealthApp';
import { API_CONFIG } from './config/apiConfig';

const API_BASE_URL = API_CONFIG.WIHY_API_URL; // Use the ml.wihy.ai endpoint

export const searchFoodDatabase = async (query: string) => {
  try {
    logger.apiRequest('Food Database Search', { query });
    
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        type: 'food',
        user_context: {}
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    logger.apiResponse('Food Database Search', data);
    
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
  const location = useLocation();
  const query = searchParams.get('q') || '';
  const isHealthNews = searchParams.get('type') === 'health_news';
  const category = searchParams.get('category') || 'all';
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string>('');
  const [dataSource, setDataSource] = useState<AllowedDataSource>("local");
  const [citations, setCitations] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>('');
  
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
      
      // Check if we have fresh data from navigation (e.g., from Header search)
      const navigationState = location.state as any;
      logger.debug('🔍 ResultsPage: Checking navigation state', { 
        hasNavigationState: !!navigationState,
        fromSearch: navigationState?.fromSearch,
        hasResults: !!navigationState?.results,
        hasApiResponse: !!navigationState?.apiResponse,
        query: query,
        cacheKey: cacheKey
      });
      
      if (navigationState?.fromSearch && navigationState?.results) {
        // 🔍 RESULTS PAGE LOGGING: Navigation state received
        console.log('🔍 RESULTS PAGE NAVIGATION:', {
          query: query,
          timestamp: new Date().toISOString(),
          fromSearch: navigationState.fromSearch,
          dataSource: navigationState.dataSource,
          hasResults: !!navigationState.results,
          hasApiResponse: !!navigationState.apiResponse,
          resultType: typeof navigationState.results,
          component: 'App.tsx',
          action: 'navigationStateReceived'
        });
        
        logger.info('🔍 ResultsPage: Using navigation state data (no API call needed)', { query, cacheKey });
        
        // Show "Analyzing with AI..." briefly for user feedback, then display results
        setIsLoading(true);
        
        // Small delay to ensure users see the "Analyzing with AI..." feedback
        setTimeout(() => {
          setResults(navigationState.results.details || navigationState.results.summary || 'No results');
          setApiResponse(navigationState.apiResponse || null); // Set the API response for ChatWidget (may be null for cached data)
          setDataSource(navigationState.dataSource || 'wihy');
          setCitations(navigationState.results.sources || []);
          setRecommendations(navigationState.results.recommendations || []);
          setDisclaimer(navigationState.results.medicalDisclaimer || '');
          setSessionId(navigationState.sessionId || ''); // Extract sessionId for continuity
          setIsLoading(false);
          
          // 🔍 RESULTS PAGE LOGGING: State updated
          console.log('🔍 RESULTS PAGE STATE UPDATED:', {
            query: query,
            timestamp: new Date().toISOString(),
            isLoading: false,
            dataSource: navigationState.dataSource || 'wihy',
            hasCitations: !!(navigationState.results.sources?.length),
            hasRecommendations: !!(navigationState.results.recommendations?.length),
            hasDisclaimer: !!(navigationState.results.medicalDisclaimer),
            resultLength: (navigationState.results.details || navigationState.results.summary || '').length
          });
        }, 800); // Short delay to show "Analyzing with AI..." feedback
        
        return;
      }
      
      // Prevent duplicate processing
      if (isProcessing.current || lastProcessedQuery.current === cacheKey) {
        logger.debug('Skipping duplicate query', { cacheKey });
        return;
      }
      
      logger.debug('Processing new query', { cacheKey });
      lastProcessedQuery.current = cacheKey;
      isProcessing.current = true;
      
      logger.debug('Query type analysis', { 
        isHealthNews, 
        isBrowserNavigation: isBrowserNavigation() 
      });
      
      // Always check cache first - especially for browser navigation
      const cachedResult = searchCache.getCachedResult(cacheKey);
      if (cachedResult) {
        logger.cache('Using cached results', { cacheKey });
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
      
      // If this is browser navigation and no cache, show placeholder content instead of redirecting
      if (isBrowserNavigation() || !isInitialLoad) {
        logger.debug('Browser navigation detected with no cache - showing placeholder content');
        setResults('Please perform a new search to see results.');
        setDataSource('local');
        setIsLoading(false);
        setCitations([]);
        setRecommendations([]);
        setDisclaimer('');
        setIsInitialLoad(false);
        isProcessing.current = false; // Reset processing flag
        return;
      }
      
      // Only show loading for genuine new searches (not browser navigation)
      setIsLoading(true);
      
      try {
        // Use WiHy Unified API for all types of searches
        logger.apiRequest('WiHy Unified API', { 
          type: isHealthNews ? 'health_news' : 'search',
          query: query || `health news - ${category}` 
        });
        
        let wihyResult: any;
        
        if (isHealthNews) {
          // Handle health news requests
          logger.debug('Fetching health news via WiHy API');
          const categories = category === 'all' ? [] : [category];
          wihyResult = await wihyAPI.getHealthNews(categories, 6);
        } else {
          // Handle regular search queries (health, nutrition, etc.)
          logger.debug('Making WiHy API call for query', { query });
          wihyResult = await wihyAPI.searchHealth(query);
        }
        
        logger.apiResponse('WiHy API result', wihyResult);
        
        if (wihyResult.success) {
          const formattedResult = wihyAPI.formatWihyResponse(wihyResult);
          setResults(formattedResult);
          setDataSource("wihy");
          setApiResponse(wihyResult); // Store the original API response
          
          // Cache the WiHy results (still cache the formatted result for legacy compatibility)
          searchCache.setCachedResult(cacheKey, formattedResult, window.location.href);
          
          setCitations(wihyAPI.extractCitations(wihyResult));
          setRecommendations(wihyAPI.extractRecommendations(wihyResult));
          
          if (isHealthNews) {
            setDisclaimer('Health news provided by WiHy AI. Always consult healthcare professionals for medical advice.');
          } else {
            setDisclaimer('This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.');
          }
        } else {
          // Fallback: If WiHy fails, try legacy APIs
          logger.warn('WiHy API failed, trying fallback methods');
          await handleFallbackAPIs();
        }
        
      } catch (error) {
        logger.error("WiHy API error:", error);
        // Try fallback APIs if WiHy fails
        try {
          await handleFallbackAPIs();
        } catch (fallbackError) {
          logger.error("All APIs failed:", fallbackError);
          
          // Check for specific error types
          const errorMessage = error.message || '';
          const fallbackErrorMessage = fallbackError.message || '';
          
          let userFriendlyMessage;
          
          if (errorMessage.includes('CORS_ERROR')) {
            userFriendlyMessage = "Oops! There's a configuration issue preventing us from reaching our AI services. 🔧 Our team is working on it - please try again later!";
          } else if (errorMessage.includes('NETWORK_ERROR') || errorMessage.includes('TIMEOUT_ERROR')) {
            userFriendlyMessage = "Oops! Looks like we're having some technical difficulties. 🤖 Please come back in a few minutes while we fix things up!";
          } else if (errorMessage.includes('SERVER_ERROR')) {
            userFriendlyMessage = "Our servers are taking a quick break! ☕ Please try again in a few minutes.";
          } else if (fallbackErrorMessage.includes('fetch') || 
                     fallbackErrorMessage.includes('network') || 
                     error.name === 'TypeError') {
            userFriendlyMessage = "Looks like there's a connection hiccup! 📡 Please check your internet and try again.";
          } else {
            userFriendlyMessage = `Sorry, we're experiencing some issues right now. 

🏠 You can still use these features:
•  Browse health news (click "I'm Feeling Healthy") 
• 📷 Upload images for basic analysis
• 🔍 Try visiting /test to see chart examples
• 📊 View charts in search results sidebar

Please try your search again in a moment! 😅`;
          }
          
          setResults(userFriendlyMessage);
          setDataSource("error");
          
          setCitations([]);
          setRecommendations([]);
          setDisclaimer('If this issue persists, please try refreshing the page or contact support.');
        }
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
        isProcessing.current = false; // Always reset processing flag
      }
    };

    // Fallback function for legacy APIs
    const handleFallbackAPIs = async () => {
      if (isHealthNews) {
        logger.debug('Fallback: Fetching health news via newsService');
        const healthNewsResult = await fetchNewsFeed([category], 6);
        
        if (healthNewsResult.success && healthNewsResult.articles) {
          logger.info('Health news fetched successfully');
          
          // Format the news articles for display
          const formattedNews = formatNewsArticles(healthNewsResult.articles);
          
          setResults(formattedNews);
          setDataSource('openai'); // Use openai as the display source
          
          // Cache the health news results
          const newsKey = `health_news_${category}`;
          searchCache.setCachedResult(newsKey, formattedNews, window.location.href);
          
          setDisclaimer('Health news provided by AI. Always consult healthcare professionals for medical advice.');
        } else {
          throw new Error('Failed to fetch health news');
        }
      } else {
        // Try nutrition database for food-related queries
        try {
          logger.debug('Fallback: Trying nutrition database');
          logger.debug('API URL', { url: `${API_BASE_URL}/ask` });
          
          const nutritionResponse = await fetch(`${API_BASE_URL}/ask`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: query,
              type: 'nutrition',
              user_context: {}
            })
          });
          
          if (nutritionResponse.ok) {
            const nutritionData = await nutritionResponse.json();
            logger.apiResponse('Nutrition API', nutritionData);
            
            if (nutritionData && nutritionData.found === true) {
              logger.info('Found nutrition data - using vnutrition source');
              const resultString = JSON.stringify(nutritionData);
              setResults(resultString);
              setDataSource('vnutrition');
              
              // Cache the nutrition results
              searchCache.setCachedResult(query, resultString, window.location.href);
              return;
            }
          }
        } catch (nutritionError) {
          logger.debug('Nutrition API also failed', { error: nutritionError });
        }
        
        throw new Error('All fallback APIs failed');
      }
    };
    
    fetchResults();
  }, [query, isHealthNews, category, location.state]); // Added location.state to dependencies

  // Function to format news articles for display
  const formatNewsArticles = (articles: any[]): string => {
    let formatted = '# Latest Health News\n\n';
    
    articles.forEach((article, _index) => {
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

  // Check if we should auto-open chat (when coming from VHealthSearch)
  const navigationState = location.state as any;
  const shouldAutoOpenChat = navigationState?.fromSearch === true && !isHealthNews;
  const hideChatWidget = navigationState?.fromNutritionFacts === true;

  // Debug log
  console.log('🔍 APP.TSX ResultsPage render:', {
    fromNutritionFacts: navigationState?.fromNutritionFacts,
    hideChatWidget,
    shouldAutoOpenChat,
    query
  });

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
      apiResponse={apiResponse}
      autoOpenChat={shouldAutoOpenChat}
      hideChatWidget={hideChatWidget}
      sessionId={sessionId}
    />
  );
};

// Demo component for development - shows results without API calls
const DemoResultsPage: React.FC = () => {
  const sampleQuery = "Is quinoa healthy?";
  const sampleResponse = `# Comprehensive Health Analysis: Quinoa

**Overview:**
Quinoa is a nutrient-dense pseudocereal that offers exceptional health benefits. Originally cultivated in the Andes mountains, this superfood has gained worldwide recognition for its complete protein profile and versatility.

**Key Health Benefits:**
• **Complete Protein**: Contains all 9 essential amino acids
• **High Fiber**: Supports digestive health and blood sugar regulation  
• **Rich in Minerals**: Excellent source of iron, magnesium, and phosphorus
• **Gluten-Free**: Safe for those with celiac disease or gluten sensitivity
• **Low Glycemic Index**: Helps maintain stable blood sugar levels

**Nutritional Highlights:**
- 8g protein per cooked cup
- 5g fiber per serving
- Rich in folate, manganese, and antioxidants
- Contains heart-healthy monounsaturated fats

**Recommendations:**
✓ Rinse quinoa before cooking to remove bitter saponins
✓ Toast dry quinoa for enhanced nutty flavor
✓ Use as a base for salads, bowls, or as a rice substitute
✓ Combine with vegetables and healthy fats for optimal nutrition

This analysis is based on peer-reviewed nutritional research and USDA food composition data.`;

  const sampleApiResponse = {
    success: true,
    data: {
      ai_response: {
        response: sampleResponse
      },
      confidence_score: 0.92,
      charts: {
        nutrition_breakdown: {
          carbohydrates: 39,
          protein: 22,
          fat: 16,
          fiber: 12,
          minerals: 11
        },
        health_quality: {
          chart_type: "dual_quality",
          labels: ["Food Quality", "Research Quality"],
          values: [92, 88]
        }
      }
    }
  };

  return (
    <SearchResults
      query={sampleQuery}
      results={sampleResponse}
      onBackToSearch={() => window.location.href = '/'}
      onNewSearch={(query) => console.log('Demo search:', query)}
      isLoading={false}
      dataSource="local"
      citations={['Journal of Nutrition (2024)', 'USDA Food Database', 'American Heart Association']}
      recommendations={[
        'Consult with healthcare professionals for personalized advice',
        'Consider individual dietary restrictions and allergies',
        'Follow evidence-based nutritional guidelines'
      ]}
      disclaimer="This is demo data for development purposes. Always consult healthcare professionals for real medical advice."
      apiResponse={sampleApiResponse}
      sessionId="demo-session-id"
    />
  );
};

const App: React.FC = () => {
  logger.debug("App component rendered");
  
  // Log platform information on app initialization
  useEffect(() => {
    PlatformDetectionService.logPlatformInfo();
  }, []);
  
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<VHealthSearch />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/nutritionfacts" element={<NutritionFactsPage />} />
          <Route path="/debug-fullscreen" element={<DebugFullScreen />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/investors" element={<InvestorsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/new-about" element={<NewAboutpage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/overview" element={<OverviewDashboard />} />
          <Route path="/dashboard/parent" element={<ParentDashboard />} />
          <Route path="/dashboard/predictive" element={<PredictiveDashboard />} />
          <Route path="/tracking-dashboard" element={<TrackingDashboard />} />
          <Route path="/tracking-admin" element={<AdminLinkGenerator />} />
          <Route path="/engagement-signup" element={<EngagementSignup />} />
          <Route path="/engagement-dashboard" element={<EngagementDashboard />} />
          <Route path="/engagement/:trackingId" element={<EngagementDashboard />} />
          <Route path="/test" element={<TestChartsPage />} />
          <Route path="/test-grid" element={<TestDashboardGrid />} />
          <Route path="/test-individual" element={<TestIndividualComponents />} />
          <Route path="/health-dashboard" element={<ComprehensiveHealthDashboard />} />
          <Route path="/tailwind-demo" element={<TailwindDemoPage />} />
          <Route path="/platform-demo" element={<PlatformNavigationExample />} />
          {/* Demo route - only available in development */}
          {process.env.NODE_ENV === 'development' && (
            <Route path="/demo" element={<DemoResultsPage />} />
          )}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

// interface ChatGPTResponse {
//   details?: string;
//   sources?: string[];
//   recommendations?: string[];
//   medicalDisclaimer?: string;
// }