import React, { useState, useEffect, useRef } from 'react';
import { searchCache } from '../../services/searchCache';
import ImageUploadModal from '../ui/ImageUploadModal';
import NutritionChart from '../charts/cards/NutritionChart';
import ResearchQualityGauge from '../charts/cards/ResearchQualityGauge';
import ResultQualityPie from '../charts/cards/ResultQualityPie';
import MembersCard from '../charts/individual/MembersCard';
import AnalyzeWithWihyButton from '../charts/shared/AnalyzeWithWihyButton';
import DashboardCharts from '../charts/grids/DashboardCharts';
import QuickInsights from '../charts/cards/QuickInsights';
import BloodPressureChart from '../charts/individual/BloodPressureChart';
import { ChartType, CHART_TYPE_CONFIGS, getChartTypesByPriority, getChartTypesByTab } from '../charts/chartTypes';
import FullScreenChat, { FullScreenChatRef } from '../ui/FullScreenChat';
import MyProgressDashboard, { WihyCoachModel } from '../dashboard/MyProgressDashboard';
import { CSS_CLASSES } from '../../constants/cssConstants';
import '../../styles/VHealthSearch.css';
import '../../styles/Dashboard.css';
import '../../styles/charts.css';
import '../../styles/chat-overlay.css';
import Header from '../shared/Header';
import { extractHealthMetrics, extractBMIData, extractNutritionData, extractHealthRiskData } from '../../utils/healthDataExtractor';
import Spinner from '../ui/Spinner';
import { logger } from '../../utils/logger';

// Tab type definition - matches chartTypes.ts tabView values
type SearchTab = 'overview' | 'charts' | 'consumption' | 'research' | 'insights' | 'wellness' | 'fitness';

// Tab configuration
const TAB_CONFIG = {
  overview: { label: 'Overview', value: 'overview' as SearchTab },
  charts: { label: 'My Progress', value: 'charts' as SearchTab },
  consumption: { label: 'Consumption', value: 'consumption' as SearchTab },
  research: { label: 'Research', value: 'research' as SearchTab },
  insights: { label: 'Insights', value: 'insights' as SearchTab },
  wellness: { label: 'Wellness', value: 'wellness' as SearchTab },
  fitness: { label: 'Fitness', value: 'fitness' as SearchTab }
};

const TABS = Object.values(TAB_CONFIG);

// Handle ResizeObserver errors - suppress harmless loop notifications
const resizeObserverErrorHandler = (error: ErrorEvent) => {
  if (error.message && error.message.includes('ResizeObserver loop')) {
    return true; // Prevent the error from being thrown
  }
  return false;
};

// Add error handler for ResizeObserver
if (typeof window !== 'undefined') {
  window.addEventListener('error', resizeObserverErrorHandler);
}

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
  apiResponse?: any; // Add unified API response for chart components
  autoOpenChat?: boolean; // Add prop to automatically open chat when coming from VHealthSearch
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
  
  return (
    <>
      {parts.map((part, index) => (
        urlRegex.test(part) ? (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#2563eb', textDecoration: 'underline' }}
          >
            {part}
          </a>
        ) : (
          part
        )
      ))}
    </>
  );
};

const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  results,
  onBackToSearch: _onBackToSearch,
  onNewSearch,
  isLoading,
  dataSource,
  citations: _citations = [],
  recommendations: _recommendations = [],
  disclaimer: _disclaimer = "",
  apiResponse,
  autoOpenChat = false
}) => {
  // Only log on significant changes, not every render
  const prevQueryRef = useRef<string>('');
  
  useEffect(() => {
    if (query !== prevQueryRef.current) {
      console.log('🔍 SEARCH RESULTS: New query -', query);
      prevQueryRef.current = query;
    }
  }, [query]);
  
  const [input, setInput] = useState('');
  const [image, setImage] = useState<File | string | null>(null);
  const [currentPhotoId, setCurrentPhotoId] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: string} | null>(null);
  const [isUploadLoading, setUploadLoading] = useState(false);
  const [lastProcessedQuery, setLastProcessedQuery] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatRef = useRef<FullScreenChatRef>(null);
  const [activeTab, setActiveTab] = useState<SearchTab>('overview');
  const [showProgressSidebar, setShowProgressSidebar] = useState(false);

  // Mock coach data for My Progress tab
  const mockCoachData: WihyCoachModel = {
    summary: "",
    motivation: "Keep up the great work! 💪",
    priorities: [
      { id: "p1", title: "Morning Workout", icon: "🏃", description: "30 min cardio" },
      { id: "p2", title: "Hydration Goal", icon: "💧", description: "8 cups today" },
      { id: "p3", title: "Balanced Meals", icon: "🥗", description: "Track macros" }
    ],
    actions: [
      { 
        id: "a1", 
        type: "workout", 
        title: "Complete morning cardio", 
        description: "Get your heart rate up",
        status: "completed",
        meta: "30 min"
      },
      { 
        id: "a2", 
        type: "meal", 
        title: "Log breakfast", 
        description: "Track your morning meal",
        status: "completed",
        meta: "400 cal"
      },
      { 
        id: "a3", 
        type: "hydration", 
        title: "Drink water", 
        description: "Stay hydrated throughout the day",
        status: "in_progress",
        meta: "4/8 cups"
      },
      { 
        id: "a4", 
        type: "habit", 
        title: "Evening stretch routine", 
        description: "Flexibility and recovery",
        status: "pending",
        meta: "15 min"
      }
    ],
    workout: {
      title: "Upper Body Strength",
      durationLabel: "35–40 min",
      intensityLabel: "Moderate",
      steps: [
        { id: "s1", label: "Warm-up", detail: "5 min dynamic stretches" },
        { id: "s2", label: "Push-ups", detail: "3 sets of 12 reps" },
        { id: "s3", label: "Dumbbell rows", detail: "3 sets of 10 reps each arm" },
        { id: "s4", label: "Shoulder press", detail: "3 sets of 10 reps" },
        { id: "s5", label: "Cool-down", detail: "5 min stretching" }
      ]
    },
    workoutProgram: [
      {
        meta: {
          id: "ex1",
          name: "Squats",
          equipment: "BARBELL",
          fitnessLoad: { STRENGTH: 3, ENDURANCE: 1 },
          muscleLoad: { QUADS: 3, GLUTES: 2, HAMSTRINGS: 2, CORE: 1 }
        },
        prescription: {
          exerciseId: "ex1",
          sets: 4,
          intensityLabel: "75% 1RM"
        }
      },
      {
        meta: {
          id: "ex2",
          name: "Bench Press",
          equipment: "BARBELL",
          fitnessLoad: { STRENGTH: 3, ENDURANCE: 1 },
          muscleLoad: { CHEST: 3, SHOULDERS: 2, ARMS: 2 }
        },
        prescription: {
          exerciseId: "ex2",
          sets: 4,
          intensityLabel: "70% 1RM"
        }
      },
      {
        meta: {
          id: "ex3",
          name: "Deadlift",
          equipment: "BARBELL",
          fitnessLoad: { STRENGTH: 3, ENDURANCE: 1 },
          muscleLoad: { HAMSTRINGS: 3, GLUTES: 3, BACK: 2, CORE: 2 }
        },
        prescription: {
          exerciseId: "ex3",
          sets: 3,
          intensityLabel: "80% 1RM"
        }
      },
      {
        meta: {
          id: "ex4",
          name: "Pull-ups",
          equipment: "NONE",
          fitnessLoad: { STRENGTH: 2, ENDURANCE: 2 },
          muscleLoad: { BACK: 3, ARMS: 2, SHOULDERS: 1 }
        },
        prescription: {
          exerciseId: "ex4",
          sets: 3,
          intensityLabel: "Bodyweight"
        }
      },
      {
        meta: {
          id: "ex5",
          name: "Overhead Press",
          equipment: "DUMBBELLS",
          fitnessLoad: { STRENGTH: 3, MOBILITY: 1 },
          muscleLoad: { SHOULDERS: 3, ARMS: 2, CORE: 1 }
        },
        prescription: {
          exerciseId: "ex5",
          sets: 3,
          intensityLabel: "Moderate"
        }
      },
      {
        meta: {
          id: "ex6",
          name: "Romanian Deadlifts",
          equipment: "DUMBBELLS",
          fitnessLoad: { STRENGTH: 2, MOBILITY: 2 },
          muscleLoad: { HAMSTRINGS: 3, GLUTES: 2, BACK: 1 }
        },
        prescription: {
          exerciseId: "ex6",
          sets: 3,
          intensityLabel: "Light"
        }
      },
      {
        meta: {
          id: "ex7",
          name: "Plank",
          equipment: "NONE",
          fitnessLoad: { ENDURANCE: 2, STRENGTH: 1 },
          muscleLoad: { CORE: 3, SHOULDERS: 1 }
        },
        prescription: {
          exerciseId: "ex7",
          sets: 3,
          intensityLabel: "60 sec"
        }
      }
    ],
    consumption: {
      mealsLogged: 2,
      mealsPlanned: 4,
      calories: 850,
      caloriesTarget: 2000,
      protein: 45,
      proteinTarget: 150
    },
    hydration: {
      cups: 4,
      goalCups: 8
    },
    streaks: [
      { id: "str1", label: "7 day workout streak", icon: "🔥" },
      { id: "str2", label: "5 day meal tracking", icon: "✅" }
    ],
    checkin: {
      question: "How are you feeling today?",
      inputType: "mood"
    },
    education: {
      title: "Benefits of Progressive Overload",
      summary: "Learn how gradually increasing weight, frequency, or reps can boost muscle growth and strength gains.",
      linkLabel: "Read More →"
    }
  };

  // Tab bar styles - Responsive with mobile-friendly touch targets
  const tabBarStyles = {
    tab: {
      padding: windowWidth < 768 ? '10px 16px' : '12px 20px',
      borderRadius: windowWidth < 768 ? '20px' : '24px',
      fontSize: windowWidth < 768 ? '14px' : '15px',
      fontWeight: 600 as const,
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.2s ease',
      outline: 'none',
      whiteSpace: 'nowrap' as const,
      userSelect: 'none' as const,
      minHeight: windowWidth < 768 ? '44px' : 'auto', // Minimum touch target size
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    tabActive: {
      background: '#111827',
      color: '#ffffff'
    },
    tabInactive: {
      background: '#f3f4f6',
      color: '#111827'
    },
    tabHover: {
      background: '#e5e7eb',
      color: '#111827'
    }
  };

  // Extract dynamic health data from API response
  const healthMetrics = extractHealthMetrics(apiResponse);
  const bmiData = extractBMIData(apiResponse);
  const nutritionData = extractNutritionData(apiResponse);
  const healthRiskData = extractHealthRiskData(apiResponse);
  
  // Calculate dynamic dashboard values
  const calculateAlerts = () => {
    let alertCount = 0;
    
    // Check BMI alerts
    if (bmiData.bmi < 18.5 || bmiData.bmi > 25) alertCount++;
    
    // Check steps alerts
    if (healthMetrics.steps.progress < 70) alertCount++;
    
    // Check sleep alerts
    if (healthMetrics.sleep.hours < 6 || healthMetrics.sleep.hours > 9) alertCount++;
    
    // Check calories alerts
    if (healthMetrics.calories.progress < 50 || healthMetrics.calories.progress > 120) alertCount++;
    
    return alertCount;
  };
  
  const calculateRecommendations = () => {
    const recommendations = [];
    
    // BMI recommendations
    if (bmiData.bmi < 18.5) recommendations.push('Consider healthy weight gain');
    if (bmiData.bmi > 25) recommendations.push('Consider healthy weight loss');
    
    // Activity recommendations
    if (healthMetrics.steps.progress < 70) recommendations.push('Increase daily activity');
    
    // Sleep recommendations
    if (healthMetrics.sleep.hours < 7) recommendations.push('Improve sleep quality');
    
    // Nutrition recommendations
    if (nutritionData) recommendations.push('Maintain balanced nutrition');
    
    // Health risk recommendations
    if (healthRiskData?.recommendations) {
      recommendations.push(...healthRiskData.recommendations.slice(0, 2));
    }
    
    return Math.max(recommendations.length, 1); // At least 1 recommendation
  };
  
  const calculateMaxCards = () => {
    // Responsive card calculation based on window width
    if (windowWidth < 768) return 8;  // Mobile
    if (windowWidth < 1200) return 12; // Tablet
    return 20; // Desktop
  };
  
  const getDashboardPeriod = () => {
    // Could be made user-configurable later
    return windowWidth < 768 ? 'day' : 'week';
  };
  
  const getResponsiveSpacing = () => {
    // Compact spacing for mobile to reduce white space
    if (windowWidth < 480) return '8px'; // Very small mobile
    if (windowWidth < 768) return '12px'; // Mobile
    if (windowWidth < 1024) return '20px'; // Tablet
    return '32px'; // Desktop
  };

  // Filter charts based on active tab using the proper function from chartTypes.ts
  const getChartsForActiveTab = () => {
    // Use the dedicated function that properly handles 'all' tabView
    const charts = getChartTypesByTab(activeTab);
    console.log(`🔍 CHARTS FOR TAB "${activeTab}":`, charts.map(c => ({ type: c.type, label: c.label, tabView: c.tabView })));
    console.log(`🔍 TOTAL CHARTS FOR "${activeTab}":`, charts.length);
    return charts;
  };

  // Get chart types to exclude based on active tab
  const getExcludedChartTypes = () => {
    const chartsForTab = getChartsForActiveTab();
    const chartTypesForTab = chartsForTab.map(config => config.type);
    
    // Always exclude QUICK_INSIGHTS from DashboardCharts component
    const excludeTypes = [ChartType.QUICK_INSIGHTS];
    
    // Add charts that don't belong to the current tab
    const allChartTypes = Object.values(ChartType);
    allChartTypes.forEach(chartType => {
      if (!chartTypesForTab.includes(chartType) && chartType !== ChartType.QUICK_INSIGHTS) {
        excludeTypes.push(chartType);
      }
    });
    
    console.log(`🔍 EXCLUDED CHART TYPES FOR "${activeTab}":`, excludeTypes);
    console.log(`🔍 INCLUDED CHART TYPES FOR "${activeTab}":`, chartTypesForTab);
    
    return excludeTypes;
  };

  const [hasAutoOpened, setHasAutoOpened] = useState(false); // Track if auto-open has already happened
  
  // Auto-open chat when coming from VHealthSearch - only once
  useEffect(() => {
    if (autoOpenChat && !isChatOpen && !hasAutoOpened) {
      setIsChatOpen(true);
      setHasAutoOpened(true); // Prevent future auto-opens
      console.log('🔍 SEARCH RESULTS: Auto-opening chat from VHealthSearch');
    }
  }, [autoOpenChat, isChatOpen, hasAutoOpened]);
  
  // Header search state - independent from main search
  const [headerSearchResults, setHeaderSearchResults] = useState<string>('');
  const [headerSearchQuery, setHeaderSearchQuery] = useState<string>('');
  const [headerApiResponse, setHeaderApiResponse] = useState<any>(null);
  const [isHeaderSearchLoading, setIsHeaderSearchLoading] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  // Handle window resize for responsive layout with debouncing
  useEffect(() => {
    let resizeTimeout: number;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150); // Debounce resize events by 150ms
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Prevent body scroll when component mounts  
  useEffect(() => {
    // Remove any body scroll restrictions - let the CSS variable approach handle positioning
    document.body.style.overflow = 'auto';
    
    return () => {
      document.body.style.overflow = 'auto';
      // Cleanup ResizeObserver error handler
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', resizeObserverErrorHandler);
      }
    };
  }, []);

  // Check if we have valid results to display
  const hasValidResults = results && results.trim() !== '' && !isLoading;
  
  // 🔍 SEARCH RESULTS LOGGING: Track loading states
  useEffect(() => {
    if (isLoading) {
      console.log('🔍 SEARCH RESULTS LOADING STATE:', {
        query: query,
        timestamp: new Date().toISOString(),
        component: 'SearchResults',
        action: 'loadingStarted',
        isLoading: true,
        hasValidResults: hasValidResults
      });
    } else {
      console.log('🔍 SEARCH RESULTS LOADING COMPLETE:', {
        query: query,
        timestamp: new Date().toISOString(),
        component: 'SearchResults',
        action: 'loadingComplete',
        isLoading: false,
        hasValidResults: hasValidResults,
        resultsLength: results?.length || 0
      });
    }
  }, [isLoading, hasValidResults]);
  
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
    if (!input.trim() || isLoading) return;
    
    const trimmedQuery = input.trim();
    
    if (trimmedQuery === lastProcessedQuery || trimmedQuery === query) {
      console.log('Preventing duplicate search for:', trimmedQuery);
      return;
    }
    
    console.log('User explicit search from results page:', trimmedQuery);
    setLastProcessedQuery(trimmedQuery);
    setIsSearching(true);
    onNewSearch(trimmedQuery);
  };

  // Handle voice input (placeholder for now)
  const handleVoiceInput = () => {
    setIsListening(!isListening);
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      setIsUploadModalOpen(true);
    }
  };

  // Handle image upload completion
  const handleAnalysisComplete = (results: any) => {
    console.log('🔍 handleAnalysisComplete called with:', {
      results,
      type: results?.type,
      hasType: Boolean(results?.type),
      resultType: typeof results,
      hasData: Boolean(results?.data),
      hasSummary: Boolean(results?.summary)
    });
    
    setIsUploadModalOpen(false);
    if (!results) return;
    
    // Check if this is an error type
    if (results.type === 'error') {
      console.error('Analysis error:', results.error);
      // Could show a toast notification here
      return;
    }
    
    // Check if this is an image/vision/barcode analysis result
    // Check both by type field AND by having data/summary (defensive check)
    const isImageResult = results.type && (
      results.type === 'image_analysis' ||
      results.type === 'vision_analysis' ||
      results.type === 'barcode_scan' ||
      results.type === 'product_search' ||
      results.type === 'barcode_analysis'
    );
    
    const hasAnalysisData = results.data || results.summary || results.chatData;
    const hasImageMetadata = results.imageUrl || results.userQuery;
    
    if (isImageResult || hasImageMetadata || (hasAnalysisData && typeof results === 'object')) {
      // Direct chat display for image/scan results
      const userMessage = results.userQuery || 'Uploaded image';
      
      console.log('🔍 Opening chat with image results:', { 
        userMessage, 
        type: results.type,
        isImageResult,
        hasAnalysisData,
        hasImageMetadata
      });
      
      // Open chat directly with the results
      if (chatRef.current) {
        chatRef.current.addMessage(userMessage, results);
      }
      setIsChatOpen(true);
      
      console.log('✅ Chat opened successfully');
      return; // Important: exit here
    }
    
    // Only reach here if it's not an image result
    if (typeof results === 'string') {
      // If results is a string, use normal search flow
      console.log('🔍 Results is string, using onNewSearch');
      onNewSearch(results);
    } else {
      // For any other object type, stringify it for normal search
      console.warn('⚠️ Unknown result type, using normal search flow:', results);
      onNewSearch(JSON.stringify(results));
    }
  };

  // Check if this is a test query
  const isTestQuery = query.toLowerCase() === 'test';

  // Original handle header search function
  const handleHeaderSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsHeaderSearchLoading(true);
    setHeaderSearchResults('');
    setHeaderApiResponse(null);
    
    try {
      logger.debug('SearchResults: Header search initiated', { query: searchQuery });
      
      // Use Universal Search API for header searches
      const response = await fetch('https://ml.wihy.ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          type: 'auto',
          options: {
            include_charts: true,
            include_recommendations: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Header search failed: ${response.statusText}`);
      }

      const universalResult = await response.json();
      
      if (universalResult.success && universalResult.results) {
        setHeaderSearchResults(JSON.stringify(universalResult.results));
        setHeaderApiResponse(universalResult);
        logger.info('SearchResults: Header search completed', { query: searchQuery });
      } else {
        setHeaderSearchResults('No results found.');
      }
      
    } catch (error) {
      logger.error('Header search failed:', error);
      setHeaderSearchResults('Sorry, there was an error processing your search. Please try again.');
      setHeaderApiResponse(null);
    } finally {
      setIsHeaderSearchLoading(false);
    }
  };

  // New Universal Search handler - calls services.wihy.ai/api/search and opens FullScreenChat
  const handleUniversalSearch = async (searchQuery: string | any) => {
    console.log('🔍 UNIVERSAL SEARCH initiated from SearchResults page:', { searchQuery });
    
    // Handle object results (from image analysis)
    if (typeof searchQuery === 'object' && searchQuery !== null) {
      console.log('🔍 Received object result, routing to handleAnalysisComplete');
      handleAnalysisComplete(searchQuery);
      return;
    }
    
    // Handle string search queries
    if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
      console.warn('⚠️ Invalid search query:', searchQuery);
      return;
    }
    
    try {
      logger.debug('SearchResults: Making Universal Search API call', { 
        query: searchQuery, 
        endpoint: 'https://ml.wihy.ai/ask' 
      });
      
      // Call Universal Search API directly using new endpoint
      const response = await fetch('https://ml.wihy.ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          type: 'auto',
          options: {
            include_charts: true,
            include_recommendations: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const universalResult = await response.json();
      
      if (universalResult.success && universalResult.results) {
        console.log('🔍 Universal Search API response received:', universalResult);
        
        // Open FullScreenChat with the Universal Search results
        if (chatRef.current) {
          chatRef.current.addMessage(searchQuery, universalResult.results);
        }
        
        // Set the chat to open
        setIsChatOpen(true);
        
        logger.info('SearchResults: Universal Search completed and FullScreenChat opened', { 
          query: searchQuery,
          hasData: !!universalResult.results 
        });
        
        console.log('🔍 UNIVERSAL SEARCH completed and FullScreenChat opened:', {
          query: searchQuery,
          success: true,
          chatOpened: true,
          timestamp: new Date().toISOString()
        });
        
      } else {
        throw new Error('Universal Search API request failed');
      }
      
    } catch (error) {
      logger.error('Universal search failed:', error);
      console.log('🔍 UNIVERSAL SEARCH failed:', {
        query: searchQuery,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Show error message in chat
      if (chatRef.current) {
        chatRef.current.addMessage(searchQuery, 'Sorry, there was an error processing your search. Please try again.');
        setIsChatOpen(true);
      }
    }
  };

  // Handle header search - add messages to existing conversation
  const handleAddToChatConversation = (userMessage: string, assistantMessage: string) => {
    console.log('🔍 ADDING TO CHAT CONVERSATION:', {
      userMessage,
      assistantMessage: assistantMessage.substring(0, 100) + '...',
      chatRefAvailable: !!chatRef.current,
      isChatOpen,
      timestamp: new Date().toISOString()
    });
    
    if (chatRef.current) {
      // Use the ref to add messages to the chat
      chatRef.current.addMessage(userMessage, assistantMessage);
      
      // Open chat if it's not already open
      if (!isChatOpen) {
        setIsChatOpen(true);
      }
    } else {
      console.error('🔍 Chat ref not available - opening chat with new messages');
      // Fallback: just open the chat (it will need manual re-entry)
      setIsChatOpen(true);
    }
  };

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 SEARCHRESULTS STATE DEBUG:', {
      headerSearchQuery,
      originalQuery: query,
      hasHeaderSearchResults: !!headerSearchResults,
      isHeaderSearchLoading,
      chatWidgetKey: `chatwidget-${headerSearchQuery || query}`,
      timestamp: new Date().toISOString()
    });
  }, [headerSearchQuery, headerSearchResults, query, isHeaderSearchLoading]);

  // Clear header search results when main query changes
  useEffect(() => {
    if (query && headerSearchQuery && query !== headerSearchQuery) {
      console.log('🔍 Main query changed, clearing header search results');
      setHeaderSearchResults('');
      setHeaderSearchQuery('');
      setHeaderApiResponse(null);
    }
  }, [query, headerSearchQuery]);

  // 🔍 SEARCH RESULTS LOGGING: Track prop changes
  useEffect(() => {
    console.log('🔍 SEARCH RESULTS PROPS CHANGED:', {
      query: query,
      timestamp: new Date().toISOString(),
      component: 'SearchResults',
      action: 'propsChanged',
      isLoading: isLoading,
      dataSource: dataSource,
      hasResults: !!results,
      resultsLength: results?.length || 0,
      hasApiResponse: !!apiResponse
    });
  }, [query, results, isLoading, dataSource, apiResponse]);

  return (
    <>
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000, 
        backgroundColor: 'white'
      }}>
        <Header
          variant="results"
          showLogin={true}
          showSearchInput={true}
          onSearchSubmit={handleUniversalSearch}
          onChatMessage={handleAddToChatConversation}
          isInChatMode={isChatOpen}
          showProgressMenu={true}
          onProgressMenuClick={() => setShowProgressSidebar(!showProgressSidebar)}
        />
      </div>

      {/* Show spinner when loading from parent OR header search */}
      {(isLoading || isHeaderSearchLoading) && (
        <Spinner
          overlay={true}
          title="Analyzing with AI..."
          subtitle="Processing your health query..."
          disableEsc={true}
        />
      )}
      
      {/* Main Content Area with Dashboard Layout */}
      <div className={CSS_CLASSES.DASHBOARD_CONTAINER} style={{ paddingTop: windowWidth < 768 ? '200px' : '100px' }}>
        {/* Progress History Sidebar - Always available */}
        {showProgressSidebar && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '280px',
            height: '100vh',
            backgroundColor: '#f8fafc',
            borderRight: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1001
          }}>
            {/* Sidebar Header */}
            <div className="p-5 px-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="m-0 text-base font-semibold text-gray-800">
                Progress History
              </h2>
              <button
                onClick={() => setShowProgressSidebar(false)}
                className="bg-transparent border-none cursor-pointer p-2 text-base text-gray-500 hover:text-gray-700"
                title="Close History"
              >
                ✕
              </button>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-hidden">
              <div className="p-2 h-full overflow-y-auto overflow-x-hidden">
                {/* Current Progress */}
                <div className="p-3 mb-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                  <div className="text-sm font-medium text-gray-800 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    Today's Progress
                  </div>
                  <div className="text-xs text-gray-500">
                    Active now
                  </div>
                </div>

                {/* Previous Days */}
                {['Yesterday', 'Thursday', 'Wednesday', 'Tuesday'].map((day, index) => (
                  <div 
                    key={index} 
                    className="p-3 mb-2 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-100"
                  >
                    <div className="text-sm text-gray-700 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {day}
                    </div>
                    <div className="text-xs text-gray-400">
                      {index + 1} day{index > 0 ? 's' : ''} ago
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className={CSS_CLASSES.DASHBOARD_MAIN_CONTENT}>
        
        {hasValidResults ? (
          <>
            {/* Full Screen Chat */}
            <FullScreenChat
              ref={chatRef}
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              onViewCharts={() => setIsChatOpen(false)} // Close chat to view charts behind it
              initialQuery={query}
              initialResponse={(() => {
                // For image/barcode/product scans from VHealthSearch, pass the full apiResponse object
                // so FullScreenChat can extract imageUrl and other metadata
                if (apiResponse && apiResponse.imageUrl) {
                  // Return the full apiResponse object to preserve imageUrl and other data
                  return apiResponse;
                }
                
                // Handle barcode scan data with full analysis
                if (apiResponse && (apiResponse.analysis || apiResponse.product_info)) {
                  // This is barcode scan data - return the formatted results as string
                  return results;
                }
                
                // Handle traditional API responses
                let extractedResponse = '';
                if (apiResponse?.data?.ai_response?.response) {
                  extractedResponse = apiResponse.data.ai_response.response;
                } else if (apiResponse?.data?.response) {
                  extractedResponse = apiResponse.data.response;
                } else {
                  extractedResponse = results;
                }
                return extractedResponse;
              })()}
            />

            {/* Floating Chat Button - Show when chat is closed */}
            {!isChatOpen && (
              <button
                onClick={() => setIsChatOpen(true)}
                className="floating-chat-button"
              >
                💬
              </button>
            )}

            {/* Tab Navigation - Above Health Snapshot */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              marginTop: windowWidth < 768 ? '0px' : '80px',
              marginBottom: windowWidth < 768 ? '12px' : '24px',
              padding: windowWidth < 768 ? '0 8px' : '0',
              paddingTop: windowWidth < 768 ? '20px' : '0',
              position: 'relative'
            }}>
              <div className="results-tabs" style={{
                display: 'flex',
                gap: windowWidth < 768 ? '6px' : '8px',
                alignItems: 'center',
                flexWrap: windowWidth < 768 ? 'wrap' : 'nowrap',
                justifyContent: 'center',
                maxWidth: '100%'
              }}>
                {TABS.map(tab => {
                  const active = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      onMouseEnter={(e) => {
                        if (!active) {
                          const target = e.target as HTMLButtonElement;
                          Object.assign(target.style, {
                            ...tabBarStyles.tab,
                            ...tabBarStyles.tabInactive,
                            ...tabBarStyles.tabHover
                          });
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          const target = e.target as HTMLButtonElement;
                          Object.assign(target.style, {
                            ...tabBarStyles.tab,
                            ...tabBarStyles.tabInactive
                          });
                        }
                      }}
                      style={{
                        ...tabBarStyles.tab,
                        ...(active ? tabBarStyles.tabActive : tabBarStyles.tabInactive)
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Dashboard */}
            <div className="health-dashboard-content" style={{
              padding: windowWidth < 768 ? '5px 8px 0 8px' : '10px 20px',
              maxWidth: '100%',
              overflowX: 'hidden'
            }}>
              {/* Tab-specific content */}
              {activeTab === 'overview' && (
                <>
                  {/* Dashboard Header */}
                  <h1 className="dashboard-title" style={{
                    fontSize: windowWidth < 768 ? '22px' : '28px',
                    textAlign: windowWidth < 768 ? 'center' : 'left',
                    marginBottom: windowWidth < 768 ? '12px' : '15px',
                    marginTop: windowWidth < 768 ? '8px' : '10px',
                    padding: windowWidth < 768 ? '0 8px' : '0'
                  }}>
                    Your Health Snapshot
                  </h1>
                  
                  {/* Overview displays only 6 charts via DashboardCharts */}
                  <div style={{ marginTop: '8px' }}>
                    <DashboardCharts 
                      period={getDashboardPeriod()} 
                      maxCards={calculateMaxCards()} 
                      showAllCharts={true}
                      excludeChartTypes={getExcludedChartTypes()}
                      onAnalyze={handleAddToChatConversation}
                    />
                  </div>
                </>
              )}

              {activeTab === 'charts' && (
                <>
                  <MyProgressDashboard 
                    coach={mockCoachData}
                    onToggleAction={(actionId) => console.log('Toggle action:', actionId)}
                    onStartWorkout={() => console.log('Start workout')}
                    onAddHydration={() => console.log('Add hydration')}
                    onLogMeal={() => console.log('Log meal')}
                    onEducationClick={() => console.log('Education clicked')}
                  />
                </>
              )}

              {activeTab === 'research' && (
                <>
                  <h1 className="dashboard-title" style={{
                    fontSize: windowWidth < 768 ? '22px' : '28px',
                    textAlign: windowWidth < 768 ? 'center' : 'left',
                    marginBottom: windowWidth < 768 ? '12px' : '15px',
                    marginTop: windowWidth < 768 ? '8px' : '10px',
                    padding: windowWidth < 768 ? '0 8px' : '0'
                  }}>
                    Research & Analysis
                  </h1>
                  
                  <div style={{ marginTop: '8px' }}>
                    <DashboardCharts 
                      period={getDashboardPeriod()} 
                      maxCards={calculateMaxCards()} 
                      showAllCharts={true}
                      excludeChartTypes={getExcludedChartTypes()}
                      isResearchLayout={true}
                      onAnalyze={handleAddToChatConversation}
                    />
                  </div>
                </>
              )}

              {activeTab === 'consumption' && (
                <>
                  <h1 className="dashboard-title" style={{
                    fontSize: windowWidth < 768 ? '22px' : '28px',
                    textAlign: windowWidth < 768 ? 'center' : 'left',
                    marginBottom: windowWidth < 768 ? '12px' : '15px',
                    marginTop: windowWidth < 768 ? '8px' : '10px',
                    padding: windowWidth < 768 ? '0 8px' : '0'
                  }}>
                    Nutrition & Diet Analysis
                  </h1>
                  
                  <div style={{ marginTop: '8px' }}>
                    <DashboardCharts 
                      period={getDashboardPeriod()} 
                      maxCards={calculateMaxCards()} 
                      showAllCharts={true}
                      excludeChartTypes={getExcludedChartTypes()}
                      isNutritionLayout={true}
                      onAnalyze={handleAddToChatConversation}
                    />
                  </div>
                </>
              )}

              {activeTab === 'insights' && (
                <>
                  <h1 className="dashboard-title" style={{
                    fontSize: windowWidth < 768 ? '22px' : '28px',
                    textAlign: windowWidth < 768 ? 'center' : 'left',
                    marginBottom: windowWidth < 768 ? '12px' : '15px',
                    marginTop: windowWidth < 768 ? '8px' : '10px',
                    padding: windowWidth < 768 ? '0 8px' : '0'
                  }}>
                    Mind & Behavior Insights
                  </h1>
                  
                  <div style={{ marginTop: '8px' }}>
                    <DashboardCharts 
                      period={getDashboardPeriod()} 
                      maxCards={calculateMaxCards()} 
                      showAllCharts={true}
                      excludeChartTypes={getExcludedChartTypes()}
                      isInsightsLayout={true}
                      onAnalyze={handleAddToChatConversation}
                    />
                  </div>
                </>
              )}

              {activeTab === 'wellness' && (
                <>
                  <h1 className="dashboard-title" style={{
                    fontSize: windowWidth < 768 ? '22px' : '28px',
                    textAlign: windowWidth < 768 ? 'center' : 'left',
                    marginBottom: windowWidth < 768 ? '12px' : '15px',
                    marginTop: windowWidth < 768 ? '8px' : '10px',
                    padding: windowWidth < 768 ? '0 8px' : '0'
                  }}>
                    Wellness & Recovery
                  </h1>
                  
                  <div style={{ marginTop: '8px' }}>
                    <DashboardCharts 
                      period={getDashboardPeriod()} 
                      maxCards={calculateMaxCards()} 
                      showAllCharts={true}
                      excludeChartTypes={getExcludedChartTypes()}
                      onAnalyze={handleAddToChatConversation}
                    />
                  </div>
                </>
              )}

              {activeTab === 'fitness' && (
                <>
                  <h1 className="dashboard-title" style={{
                    fontSize: windowWidth < 768 ? '22px' : '28px',
                    textAlign: windowWidth < 768 ? 'center' : 'left',
                    marginBottom: windowWidth < 768 ? '12px' : '15px',
                    marginTop: windowWidth < 768 ? '8px' : '10px',
                    padding: windowWidth < 768 ? '0 8px' : '0'
                  }}>
                    Fitness & Performance
                  </h1>
                  
                  <div style={{ marginTop: '8px' }}>
                    <DashboardCharts 
                      period={getDashboardPeriod()} 
                      maxCards={calculateMaxCards()} 
                      showAllCharts={true}
                      excludeChartTypes={getExcludedChartTypes()}
                      onAnalyze={handleAddToChatConversation}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          !isLoading && !isSearching && (
            <div className="no-results-container">
              <p>No results to display. Try searching for something else.</p>
            </div>
          )
        )}
      </div>
      </div>

      {/* ImageUploadModal - always available */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
        title="Upload Image"
        subtitle="Upload images for analysis"
      />
      

    </>
  );
};

export default SearchResults;