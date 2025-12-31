// Universal nutrition facts page
// Displays analyzed food from any source: barcode, image, meal, recipe, etc.

import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FullScreenChat from "../components/ui/FullScreenChat";
import NavigationHeader from "../components/ui/NavigationHeader";
import { NutritionFactsData } from "../types/nutritionFacts";
import { PlatformDetectionService } from "../services/shared/platformDetectionService";
import { scanningService } from "../services/scanningService";
import { wihyScanningService } from "../services/wihyScanningService";
import { normalizeBarcodeScan } from "../utils/nutritionDataNormalizer";
import { useDebugLog } from "../components/debug/DebugOverlay";
import "../styles/mobile-fixes.css";

type ViewMode = "overview" | "chat";

// API Base URL
const WIHY_API_BASE = 'https://services.wihy.ai';

// FDA Ingredient Analysis Types
interface IngredientAnalysis {
  ingredient: string;
  success: boolean;
  safety_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';
  recall_count: number;
  adverse_event_count: number;
  recommendations: {
    type: string;
    message: string;
  }[];
  fda_status: string;
  analysis_summary: string;
  error?: string;
}

interface IngredientAnalysisState {
  loading: boolean;
  analyses: IngredientAnalysis[];
  error: string | null;
  loadingIngredients: Set<string>; // Track which ingredients are being analyzed
  analyzedIngredients: Map<string, IngredientAnalysis>; // Store individual results
}

interface LocationState {
  initialQuery?: string;
  nutritionfacts?: NutritionFactsData;
  apiResponse?: any;
  sessionId?: string;
  fromChat?: boolean;
}

const NutritionFactsPage: React.FC = () => {
  
  const navigate = useNavigate();
  const location = useLocation();
  const debug = useDebugLog('NutritionFacts');
  
  // Prevent excessive logging during React StrictMode double mounting
  const componentInitializedRef = useRef<boolean>(false);

  // Initialize component only once (prevent double mounting from React StrictMode)
  React.useEffect(() => {
    if (componentInitializedRef.current) {
      return;
    }
    
    componentInitializedRef.current = true;
    // Component initialized - reduced logging
  }, []);

  // ALL HOOKS MUST BE AT THE TOP - before any conditional returns
  // Initialize state directly from location.state to avoid blank screen flash
  const locationState = (location.state as LocationState) || {};
  const initialData = locationState.nutritionfacts ?? (locationState.apiResponse as NutritionFactsData | undefined);
  
  const [initialQuery, setInitialQuery] = useState<string | undefined>(locationState.initialQuery);
  const [nutritionfacts, setNutritionfacts] = useState<NutritionFactsData | null>(initialData || null);
  const [sessionId, setSessionId] = useState<string | undefined>(locationState.sessionId);
  const [viewMode, setViewMode] = useState<ViewMode>(locationState.fromChat ? "chat" : "overview");
  const [isMobile, setIsMobile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hasChartData, setHasChartData] = useState(true); // Always true for nutrition facts
  const [cameFromChat, setCameFromChat] = useState(locationState.fromChat === true);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [slideDirection, setSlideDirection] = useState<'none' | 'left' | 'right'>('none'); // Track slide direction
  
  // FDA Ingredient Analysis state
  const [ingredientAnalysis, setIngredientAnalysis] = useState<IngredientAnalysisState>({
    loading: false,
    analyses: [],
    error: null,
    loadingIngredients: new Set(),
    analyzedIngredients: new Map()
  });
  
  // Chat pre-loading state
  const [chatPreloaded, setChatPreloaded] = useState(false);
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  
  // Touch swipe handling
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const overviewScrollPos = useRef<number>(0);
  const overviewRef = useRef<HTMLDivElement>(null);
  
  // Save scroll position when switching away from overview
  useEffect(() => {
    if (viewMode !== 'overview' && overviewRef.current) {
      overviewScrollPos.current = overviewRef.current.scrollTop;
    }
  }, [viewMode]);
  
  // Restore scroll position when returning to overview
  useEffect(() => {
    if (viewMode === 'overview' && overviewRef.current) {
      overviewRef.current.scrollTop = overviewScrollPos.current;
    }
  }, [viewMode]);
  
  // Auto-switch to chat for unknown products
  useEffect(() => {
    if (nutritionfacts && viewMode === "overview") {
      const isUnknownProduct = nutritionfacts.name === "Unknown product" || 
                              (!nutritionfacts.ingredientsText && !nutritionfacts.imageUrl && 
                               (!nutritionfacts.name || nutritionfacts.name === "Unknown product"));
      
      if (isUnknownProduct && !initialQuery) {
        setInitialQuery(`I scanned a product but couldn't find detailed information about it. Can you help me analyze this product?`);
        setViewMode("chat");
      }
    }
  }, [nutritionfacts, viewMode, initialQuery]);
  
  // Handle unknown value clicks - prompt Wihy for analysis
  const handleUnknownHealthScore = () => {
    const productName = nutritionfacts?.name || "this food";
    setInitialQuery(`I can't find health score data for ${productName}. Can you analyze its nutritional value and give it a health score out of 100?`);
    setViewMode("chat");
  };

  const handleUnknownGrade = () => {
    const productName = nutritionfacts?.name || "this food";
    setInitialQuery(`I can't find grade information for ${productName}. Can you analyze its overall quality and assign it a letter grade?`);
    setViewMode("chat");
  };

  const handleUnknownNova = () => {
    const productName = nutritionfacts?.name || "this food";
    setInitialQuery(`I can't find NOVA classification data for ${productName}. Can you analyze its processing level and classify it according to the NOVA system?`);
    setViewMode("chat");
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    const swipeThreshold = 50; // minimum swipe distance
    const diff = touchStartX.current - touchEndX.current;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && viewMode === "overview") {
        // Swiped left - show chat
        handleViewModeChange("chat");
      } else if (diff < 0 && viewMode === "chat") {
        // Swiped right - show overview
        handleViewModeChange("overview");
      }
    }
  };
  
  // Handle view mode changes with smooth transitions
  const handleViewModeChange = (newMode: ViewMode) => {
    debug.logEvent('View mode changing', { from: viewMode, to: newMode });
    
    if (newMode === 'chat') {
      // Pre-mount chat if not already mounted
      if (!chatMounted) {
        setChatMounted(true);
      }
      
      // Smooth transition to chat
      setSlideDirection('left');
      setTimeout(() => {
        setViewMode(newMode);
      }, 50);
    } else {
      // Smooth transition to overview
      setSlideDirection('right');
      setTimeout(() => {
        setViewMode(newMode);
      }, 50);
    }
  };
  
  // Log view mode changes
  React.useEffect(() => {
    // debug.logState('View mode changed', { viewMode, isMobile });
  }, [viewMode, isMobile]);
  
  // Disable transitions on initial mount to prevent flash
  React.useEffect(() => {
    // Check if this is a new scan (coming from NutritionFacts page itself)
    const state = location.state as LocationState;
    const isNewScan = window.history.state?.usr?.isNewScan;
    
    if (isNewScan) {
      // New scan - slide in from right
      setSlideDirection('right');
      setIsInitialMount(false);
    } else {
      // First load or from home - no animation
      setSlideDirection('none');
      // Allow one frame to pass before enabling transitions
      const timer = setTimeout(() => {
        setIsInitialMount(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [location.state]);
  
  // Removed history logging to prevent re-render loops

  // Resolve state once in effect, handle missing data gracefully
  useEffect(() => {
    const state = (location.state as LocationState) || {};

    // Accept both nutritionfacts and apiResponse keys for flexibility
    let dataFromState = state.nutritionfacts ?? (state.apiResponse as NutritionFactsData | undefined);

    // No sessionStorage fallback - direct navigation only

    if (dataFromState) {
      // Data received - reduced logging
      setNutritionfacts(dataFromState);
      setInitialQuery(state.initialQuery);
      if (state.sessionId) setSessionId(state.sessionId);
      setCameFromChat(state.fromChat === true);
    } else {
      // No data - show empty state instead of redirecting
      setNutritionfacts(null);
    }
  }, [location.state, navigate]);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const wasMobile = isMobile;
      const nowMobile = window.innerWidth <= 768;
      setIsMobile(nowMobile);
      
      // if (wasMobile !== nowMobile) {
      //   debug.logEvent('Mobile view changed', { 
      //     isMobile: nowMobile, 
      //     width: window.innerWidth,
      //     height: window.innerHeight
      //   });
      // }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // No local history tracking - keep it simple

  // FDA Ingredient Analysis Functions
  const analyzeIngredient = async (ingredient: string): Promise<IngredientAnalysis> => {
    try {
      const response = await fetch(`${WIHY_API_BASE}/api/openfda/ingredient/${encodeURIComponent(ingredient.trim())}`);
      
      if (!response.ok) {
        // For FDA API errors (500, 404, etc), return "no results" and try wihy fallback
        return await fallbackToWihyLookup(ingredient.trim());
      }
      
      const data = await response.json();
      return {
        ingredient: ingredient.trim(),
        success: data.success || true,
        safety_score: data.safety_score || 0,
        risk_level: data.risk_level || 'low',
        recall_count: data.recall_count || 0,
        adverse_event_count: data.adverse_event_count || 0,
        recommendations: data.recommendations || [],
        fda_status: data.fda_status || 'No data available',
        analysis_summary: data.analysis_summary || 'No analysis available'
      };
    } catch (error: any) {
      console.error(`Error analyzing ingredient "${ingredient}":`, error);
      // Network errors also get wihy fallback
      return await fallbackToWihyLookup(ingredient.trim());
    }
  };

  // Fallback function to query wihy when FDA fails
  const fallbackToWihyLookup = async (ingredient: string): Promise<IngredientAnalysis> => {
    try {
      const response = await fetch(`${WIHY_API_BASE}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `Tell me about the ingredient: ${ingredient}. Is it safe? What should I know about it?`,
          user_context: { ingredient_lookup: true }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          ingredient: ingredient,
          success: true,
          safety_score: 0,
          risk_level: 'low',
          recall_count: 0,
          adverse_event_count: 0,
          recommendations: [],
          fda_status: 'Wihy Analysis',
          analysis_summary: data.response || data.answer || 'Analysis complete'
        };
      }
    } catch (error) {
      console.error(`Wihy fallback failed for ingredient "${ingredient}":`, error);
    }
    
    // Final fallback - no results but no error display
    return {
      ingredient: ingredient,
      success: false,
      safety_score: 0,
      risk_level: 'low',
      recall_count: 0,
      adverse_event_count: 0,
      recommendations: [],
      fda_status: 'No results',
      analysis_summary: 'No analysis available'
    };
  };

  // Analyze individual ingredient on demand
  const analyzeIndividualIngredient = async (ingredient: string) => {
    const trimmedIngredient = ingredient.trim();
    
    // Don't analyze if already analyzing or already analyzed
    if (ingredientAnalysis.loadingIngredients.has(trimmedIngredient) || 
        ingredientAnalysis.analyzedIngredients.has(trimmedIngredient)) {
      return;
    }
    
    // Add to loading set
    setIngredientAnalysis(prev => ({ 
      ...prev, 
      loadingIngredients: new Set([...prev.loadingIngredients, trimmedIngredient]),
      error: null 
    }));
    
    try {
      debug.logEvent('Starting individual FDA analysis', { ingredient: trimmedIngredient });
      
      const analysis = await analyzeIngredient(trimmedIngredient);
      
      // Update state with analysis result
      setIngredientAnalysis(prev => {
        const newLoadingIngredients = new Set(prev.loadingIngredients);
        newLoadingIngredients.delete(trimmedIngredient);
        
        const newAnalyzedIngredients = new Map(prev.analyzedIngredients);
        newAnalyzedIngredients.set(trimmedIngredient, analysis);
        
        return {
          ...prev,
          loadingIngredients: newLoadingIngredients,
          analyzedIngredients: newAnalyzedIngredients,
          error: null
        };
      });
      
      debug.logEvent('Individual FDA analysis completed', { 
        ingredient: trimmedIngredient,
        success: analysis.success,
        safetyScore: analysis.safety_score
      });
      
    } catch (error: any) {
      console.error(`Error analyzing ingredient "${trimmedIngredient}":`, error);
      
      // Remove from loading and add error result
      setIngredientAnalysis(prev => {
        const newLoadingIngredients = new Set(prev.loadingIngredients);
        newLoadingIngredients.delete(trimmedIngredient);
        
        const newAnalyzedIngredients = new Map(prev.analyzedIngredients);
        newAnalyzedIngredients.set(trimmedIngredient, {
          ingredient: trimmedIngredient,
          success: false,
          safety_score: 0,
          risk_level: 'low',
          recall_count: 0,
          adverse_event_count: 0,
          recommendations: [],
          fda_status: 'No data available',
          analysis_summary: 'Unable to analyze this ingredient',
          error: error.message || 'Unknown error'
        });
        
        return {
          ...prev,
          loadingIngredients: newLoadingIngredients,
          analyzedIngredients: newAnalyzedIngredients
        };
      });
    }
  };

  // On-demand FDA analysis - removed auto-analysis to prevent API spam

  // Pre-load chat response when nutrition facts data is available
  const preloadChatResponse = async (askWihyQuery: string) => {
    if (chatPreloaded || chatLoading || !askWihyQuery) return;
    
    setChatLoading(true);
    debug.logEvent('Pre-loading chat response', { query: askWihyQuery });
    
    try {
      const response = await fetch('https://ml.wihy.ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: askWihyQuery,
          session_id: sessionId,
          user_context: {
            productData: {
              name: nutritionfacts?.name,
              nutrition: nutritionfacts
            }
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setChatResponse(data.response || data.answer || 'Analysis complete!');
        setChatPreloaded(true);
        debug.logEvent('Chat response pre-loaded successfully');
      } else {
        console.warn('Failed to pre-load chat response:', response.status);
        // Mark as preloaded to prevent retries on 404/500 errors
        setChatPreloaded(true);
      }
    } catch (error) {
      console.error('Error pre-loading chat response:', error);
      // Mark as preloaded to prevent retries on network errors
      setChatPreloaded(true);
    } finally {
      setChatLoading(false);
    }
  };

  // Pre-load chat when nutrition facts data is available
  useEffect(() => {
    if (nutritionfacts?.askWihy && !chatPreloaded && !chatLoading) {
      // Add delay to let the page render first
      const timer = setTimeout(() => {
        preloadChatResponse(nutritionfacts.askWihy!);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [nutritionfacts?.askWihy, chatPreloaded, chatLoading]);

  // Mount chat component when switching to chat view
  useEffect(() => {
    if (viewMode === 'chat') {
      setChatMounted(true);
      // If chat not preloaded yet, try to preload now
      if (!chatPreloaded && !chatLoading && nutritionfacts?.askWihy) {
        preloadChatResponse(nutritionfacts.askWihy);
      }
    }
  }, [viewMode, chatPreloaded, chatLoading, nutritionfacts?.askWihy]);

  // Handle new scan - use scanningService directly
  const handleNewScan = async () => {
    debug.logEvent('New scan initiated', { currentProduct: nutritionfacts?.name });
    
    try {
      await scanningService.openCameraWithBarcodeScanning(
        async (barcode: string) => {
          console.log('✅ Barcode detected from NutritionFacts camera:', barcode);
          
          try {
            // Scan new barcode and navigate to new nutrition facts
            const barcodeResult = await wihyScanningService.scanBarcode(barcode);
            if (barcodeResult.success) {
              debug.logNavigation('Navigating to new NutritionFacts from camera scan');
              
              // Use the normalize function to convert barcode result to proper format
              const newNutritionfacts = normalizeBarcodeScan(barcodeResult);
              
              try {
                sessionStorage.setItem('nutritionfacts_data', JSON.stringify({
                  nutritionfacts: newNutritionfacts,
                  sessionId: (barcodeResult as any).sessionId,
                  timestamp: Date.now()
                }));
              } catch (e) {
                console.warn('Failed to store in sessionStorage:', e);
              }
              
              // Navigate to new nutrition facts with right-slide animation
              navigate('/nutritionfacts', {
                state: {
                  nutritionfacts: newNutritionfacts,
                  sessionId: (barcodeResult as any).sessionId,
                  fromChat: false, // Stay in overview mode when scanning from NutritionFacts page
                  isNewScan: true // Flag to trigger right-slide animation
                },
                replace: false // Don't replace - create new history entry so back button works
              });
              return;
            }
            
            // If barcode scan fails, show error and stay on current page
            alert(barcodeResult.error || 'Barcode not found in database');
          } catch (error) {
            console.error('Error during camera barcode processing:', error);
            alert('Please try scanning again.');
          }
        },
        () => {
          console.log('❌ Camera scan closed by user');
        },
        async (file: File) => {
          console.log('📸 Photo captured from NutritionFacts camera');
          // For now, just show an alert. You could implement image analysis here
          alert('Photo captured! Image analysis functionality can be implemented here.');
        }
      );
    } catch (error) {
      console.error('❌ Error opening camera from NutritionFacts:', error);
      alert('Camera access failed. Please ensure camera permissions are granted.');
    }
  };

  // Show simple message if no data - AFTER all hooks
  if (!nutritionfacts) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">No nutrition facts to display</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go to Search
          </button>
        </div>
      </div>
    );
  }
  
  // debug.logRender('Rendering NutritionFacts page', {
  //   productName: nutritionfacts.name,
  //   // ...existing code...
  // });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f7ff' }}>
      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed left-0 top-0 bottom-0 w-80 bg-white border-r border-gray-200 z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Scan History</h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-gray-500 text-xl"
              title="Close History"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4 text-gray-400">No Data</div>
              <p className="text-sm">No scan history available</p>
              <p className="text-xs mt-1 opacity-75">Previous scans will appear here</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <NavigationHeader
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        showViewToggle={true}
        showHistory={showHistory}
        onHistoryToggle={() => setShowHistory(!showHistory)}
        onCameraScan={handleNewScan}
        hasChartData={hasChartData}
        chartData={nutritionfacts}
        sessionId={sessionId}
        showUploadButton={false}
        showCameraButton={true}
        showChartsButton={true}
        isFixed={true}
        dataSource="nutrition_facts"
        fromNutritionFacts={true}
      />
      {/* Main Content */}
      <div className="relative min-h-screen pt-[73px]">
        {/* Overview Content - Show/Hide with transitions */}
        <div 
          ref={overviewRef}
          className={`${
            isInitialMount || slideDirection === 'none'
              ? (viewMode === "overview" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none absolute inset-0")
              : slideDirection === 'right'
              ? `transition-all duration-300 ease-in-out ${
                  viewMode === "overview" 
                    ? "opacity-100 translate-x-0 pointer-events-auto" 
                    : "opacity-0 translate-x-full pointer-events-none absolute inset-0"
                }`
              : `transition-all duration-250 ease-in-out ${
                  viewMode === "overview" 
                    ? "opacity-100 translate-x-0 pointer-events-auto" 
                    : "opacity-0 -translate-x-full pointer-events-none absolute inset-0"
                }`
          } overflow-y-auto md:overflow-hidden`}
          style={{ 
            backgroundColor: '#f0f7ff', 
            height: window.innerWidth >= 768 ? 'calc(100vh - 73px)' : 'auto',
            minHeight: 'calc(100vh - 73px)'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="py-8">
            <div className="max-w-3xl mx-auto p-6 space-y-8">
              {(() => {
                const product = nutritionfacts;
                if (!product) return null;

              const {
                name, brand, imageUrl, healthScore, grade, novaScore, ultraProcessed,
                calories, macros, servingSize, positives = [], negatives = []
              } = product;

              const getScoreColor = (score?: number) => {
                if (!score) return "bg-gray-400";
                if (score >= 80) return "bg-emerald-500";
                if (score >= 60) return "bg-yellow-500"; 
                if (score >= 40) return "bg-orange-500";
                return "bg-red-500";
              };

              // Enhanced Debug logging
              console.log('NutritionFacts rendering data:', {
                name: product.name,
                imageUrl: product.imageUrl,
                imageUrlType: typeof product.imageUrl,
                imageUrlLength: product.imageUrl?.length,
                ingredientsText: product.ingredientsText,
                hasProduct: !!product,
                productKeys: Object.keys(product),
                fullProduct: product
              });
              
              console.log('Image URL detailed check:', {
                hasImageUrl: !!imageUrl,
                imageUrlValue: imageUrl,
                imageUrlTruthy: imageUrl ? 'truthy' : 'falsy'
              });

              return (
                <>
                  {/* Product Header */}
                  <div className="bg-white rounded-2xl border-0 p-6">
                    <div className="flex items-start gap-6">
                      <div className="relative group">
                        {/* Enhanced framed product image - Always show container */}
                        <div className="p-3 bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl border-4 border-white">
                          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={name || "Product"}
                                className="w-32 h-32 object-contain rounded-2xl bg-white p-2"
                                onError={(e) => {
                                  console.log('Image failed to load:', imageUrl);
                                  e.currentTarget.style.display = 'none';
                                  const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (placeholder) {
                                    placeholder.style.display = 'flex';
                                  }
                                }}
                                onLoad={() => {
                                  console.log('Image loaded successfully:', imageUrl);
                                }}
                              />
                            ) : null}
                            {/* Placeholder for when no image or image fails to load */}
                            <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center" style={{display: imageUrl ? 'none' : 'flex'}}>
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            {/* Decorative frame overlay */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/5 via-transparent to-white/20 opacity-0" />
                            {/* Frame shine effect */}
                            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-blue-400/20 opacity-0 blur-sm" />
                          </div>
                          {/* Frame caption */}
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full border border-gray-200 opacity-0">
                            <span className="text-xs font-medium text-gray-600">Product Image</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          {name || "Food item"}
                        </h1>
                        {brand && (
                          <p className="text-base text-gray-600 font-medium">{brand}</p>
                        )}
                        <div className="flex items-center gap-3 mt-4">
                          <div className="relative">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${getScoreColor(healthScore)}`} />
                            <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse" />
                          </div>
                          <span 
                            className={`text-xl font-bold text-gray-900 ${typeof healthScore !== "number" ? "cursor-pointer hover:text-blue-600" : ""}`}
                            onClick={typeof healthScore !== "number" ? handleUnknownHealthScore : undefined}
                          >
                            {typeof healthScore === "number" ? healthScore : 0}<span className="text-sm text-gray-500">/100</span>
                          </span>
                          <span 
                            className={`px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold rounded-full ${!grade ? "cursor-pointer hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600" : ""}`}
                            onClick={!grade ? handleUnknownGrade : undefined}
                          >
                            {grade || 'U'}
                          </span>
                        </div>
                        <div className="mt-3">
                          <span 
                            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-orange-400 to-red-500 text-white gap-2 ${!novaScore ? "cursor-pointer hover:from-orange-500 hover:to-red-600" : ""}`}
                            onClick={!novaScore ? handleUnknownNova : undefined}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            NOVA {novaScore || 'U'}
                            {ultraProcessed && " · Ultra-processed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nutrition Facts */}
                  {(calories || macros) && (
                    <div className="bg-white rounded-2xl border-0 p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                        </svg>
                        <span className="text-gray-900">Nutrition Facts</span>
                        {servingSize && (
                          <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            per {servingSize}
                          </span>
                        )}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {calories && (
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-l-4 border-orange-400">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <svg className="w-4 h-4 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                              </svg>
                              Calories
                            </span>
                            <span className="text-lg font-bold text-orange-600">{calories}</span>
                          </div>
                        )}
                        {macros?.protein !== undefined && (
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                              Protein
                            </span>
                            <span className="text-lg font-bold text-blue-600">{macros.protein}g</span>
                          </div>
                        )}
                        {macros?.carbs !== undefined && (
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-l-4 border-yellow-400">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <svg className="w-4 h-4 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v3l-1-.75L9 7V4zm9 16H6V4h1v6l2.5-1.5L12 10V4h6v16z"/>
                              </svg>
                              Carbs
                            </span>
                            <span className="text-lg font-bold text-yellow-600">{macros.carbs}g</span>
                          </div>
                        )}
                        {macros?.fat !== undefined && (
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-400">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                              Fat
                            </span>
                            <span className="text-lg font-bold text-purple-600">{macros.fat}g</span>
                          </div>
                        )}
                        {macros?.fiber !== undefined && (
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-400">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66C7.84 17.17 9.64 12.65 17 11.24V17l7-7-7-7v5.76z"/>
                              </svg>
                              Fiber
                            </span>
                            <span className="text-lg font-bold text-green-600">{macros.fiber}g</span>
                          </div>
                        )}
                        {macros?.sugar !== undefined && (
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border-l-4 border-pink-400">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <svg className="w-4 h-4 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM7.34 9.66L4.66 12l2.68 2.34L10 12l-2.66-2.34zm9.32 4.68L14 12l2.66-2.34L19.34 12l-2.68 2.34z"/>
                              </svg>
                              Sugar
                            </span>
                            <span className="text-lg font-bold text-pink-600">{macros.sugar}g</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Ingredients Card with FDA Analysis */}
                  {product.ingredientsText && (
                    <div className="bg-white rounded-2xl border-0 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                          </svg>
                          <span className="text-gray-900">Ingredients & FDA Analysis</span>
                        </h2>
                        
                        {chatLoading && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            Preparing chat...
                          </div>
                        )}        
                      </div>
                      
                      {/* Error State - Removed to prevent technical error messages from showing to users */}
                      
                      <div className="space-y-3">
                        {/* Clickable ingredient list with on-demand FDA analysis */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {product.ingredientsText.split(',').map((ingredient, idx) => {
                            const trimmedIngredient = ingredient.trim();
                            const analysis = ingredientAnalysis.analyzedIngredients.get(trimmedIngredient);
                            const isLoading = ingredientAnalysis.loadingIngredients.has(trimmedIngredient);
                            
                            const getRiskColor = (risk?: string) => {
                              switch (risk) {
                                case 'low': return { bg: 'from-green-50 to-emerald-50', border: 'border-green-400', text: 'text-green-600', badge: 'bg-green-500' };
                                case 'moderate': return { bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-400', text: 'text-yellow-600', badge: 'bg-yellow-500' };
                                case 'high': return { bg: 'from-orange-50 to-red-50', border: 'border-orange-400', text: 'text-orange-600', badge: 'bg-orange-500' };
                                case 'very_high': return { bg: 'from-red-50 to-pink-50', border: 'border-red-400', text: 'text-red-600', badge: 'bg-red-500' };
                                default: return { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-400', text: 'text-blue-600', badge: 'bg-blue-500' };
                              }
                            };
                            
                            const defaultColors = [
                              { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-400', text: 'text-blue-600', badge: 'bg-blue-500' },
                              { bg: 'from-green-50 to-emerald-50', border: 'border-green-400', text: 'text-green-600', badge: 'bg-green-500' },
                              { bg: 'from-purple-50 to-violet-50', border: 'border-purple-400', text: 'text-purple-600', badge: 'bg-purple-500' },
                              { bg: 'from-pink-50 to-rose-50', border: 'border-pink-400', text: 'text-pink-600', badge: 'bg-pink-500' },
                              { bg: 'from-orange-50 to-amber-50', border: 'border-orange-400', text: 'text-orange-600', badge: 'bg-orange-500' },
                              { bg: 'from-teal-50 to-cyan-50', border: 'border-teal-400', text: 'text-teal-600', badge: 'bg-teal-500' },
                            ];
                            
                            const colors = analysis ? getRiskColor(analysis.risk_level) : defaultColors[idx % defaultColors.length];
                            
                            return (
                              <div key={idx} 
                                className={`p-3 bg-gradient-to-r ${colors.bg} rounded-lg border-l-4 ${colors.border} cursor-pointer`}
                                onClick={() => !isLoading && !analysis && analyzeIndividualIngredient(trimmedIngredient)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">{trimmedIngredient}</span>
                                  
                                  {isLoading && (
                                    <svg className="w-4 h-4 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                    </svg>
                                  )}
                                  
                                  {analysis && (
                                    <div className="flex items-center gap-2">
                                      {analysis.success ? (
                                        <>
                                          <span className={`px-2 py-1 ${colors.badge} text-white text-xs rounded-full font-bold`}>
                                            {analysis.safety_score}/100
                                          </span>
                                          <span className={`px-2 py-1 bg-white/80 ${colors.text} text-xs rounded-full font-medium border`}>
                                            {analysis.risk_level.replace('_', ' ').toUpperCase()}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-gray-400 text-xs">No data</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Show detailed analysis if available */}
                                {analysis && analysis.success && (
                                  <div className="mt-2 pt-2 border-t border-white/50 text-xs text-gray-600 space-y-1">
                                    <p><strong>FDA Status:</strong> {analysis.fda_status}</p>
                                    {(analysis.recall_count > 0 || analysis.adverse_event_count > 0) && (
                                      <div className="flex gap-3">
                                        {analysis.recall_count > 0 && (
                                          <span className="text-red-600">Recalls: {analysis.recall_count}</span>
                                        )}
                                        {analysis.adverse_event_count > 0 && (
                                          <span className="text-orange-600">Events: {analysis.adverse_event_count}</span>
                                        )}
                                      </div>
                                    )}
                                    {analysis.analysis_summary && (
                                      <p className="italic">{analysis.analysis_summary}</p>
                                    )}
                                  </div>
                                )}
                                
                                {analysis && !analysis.success && (
                                  <div className="mt-2 pt-2 border-t border-white/50 text-xs text-gray-500">
                                    {analysis.error === 'No results found' ? 'No results found' : (analysis.error || 'Analysis unavailable')}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Summary Stats - only show if we have analyzed ingredients */}
                        {ingredientAnalysis.analyzedIngredients.size > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="text-lg font-bold text-blue-600">{ingredientAnalysis.analyzedIngredients.size}</div>
                                <div className="text-xs text-blue-600">Analyzed</div>
                              </div>
                              <div className="bg-green-50 p-3 rounded-lg">
                                <div className="text-lg font-bold text-green-600">
                                  {ingredientAnalysis.analyzedIngredients.size > 0 ? Math.round(Array.from(ingredientAnalysis.analyzedIngredients.values()).reduce((sum, a) => sum + a.safety_score, 0) / ingredientAnalysis.analyzedIngredients.size) : 0}
                                </div>
                                <div className="text-xs text-green-600">Avg Safety</div>
                              </div>
                              <div className="bg-orange-50 p-3 rounded-lg">
                                <div className="text-lg font-bold text-orange-600">
                                  {Array.from(ingredientAnalysis.analyzedIngredients.values()).filter(a => a.risk_level === 'high' || a.risk_level === 'very_high').length}
                                </div>
                                <div className="text-xs text-orange-600">High Risk</div>
                              </div>
                              <div className="bg-red-50 p-3 rounded-lg">
                                <div className="text-lg font-bold text-red-600">
                                  {Array.from(ingredientAnalysis.analyzedIngredients.values()).reduce((sum, a) => sum + a.recall_count + a.adverse_event_count, 0)}
                                </div>
                                <div className="text-xs text-red-600">Total Issues</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}



                  {/* Additives Card */}
                  {product.additives && Object.keys(product.additives).length > 0 && (
                    <div className="bg-white rounded-2xl border-0 p-6 cursor-pointer transform">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        <span className="text-gray-900">Additives Detected</span>
                      </h2>
                      
                      <div className="space-y-2">
                        {Object.entries(product.additives).map(([code, name], idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-l-4 border-orange-400 cursor-pointer">
                            <span className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">{code}</span>
                            <span className="text-sm font-medium text-gray-700">{name as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Areas of Concern */}
                  {negatives.length > 0 && (
                    <div className="bg-white rounded-2xl border-0 p-6 cursor-pointer transform">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                        <span className="text-gray-900">Areas of Concern</span>
                      </h2>
                      <div className="space-y-4">
                        {negatives.map((negative, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-l-4 border-red-400 cursor-pointer">
                            <span className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-base font-bold text-gray-900">{negative.label}</p>
                              {negative.description && (
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{negative.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Positive Aspects */}
                  {positives.length > 0 && (
                    <div className="bg-white rounded-2xl border-0 p-6 cursor-pointer transform">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span className="text-gray-900">Positive Aspects</span>
                      </h2>
                      <div className="space-y-4">
                        {positives.map((positive, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-l-4 border-emerald-400 cursor-pointer">
                            <span className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-base font-bold text-gray-900">{positive.label}</p>
                              {positive.description && (
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{positive.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            </div>
          </div>
        </div>

        {/* Chat Content - Conditionally mounted with smooth transitions */}
        {(chatMounted || viewMode === "chat") && (
          <div 
            className={`absolute top-0 left-0 right-0 bottom-0 ${
              isInitialMount || slideDirection === 'none'
                ? (viewMode === "chat" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")
                : slideDirection === 'left'
                ? `transition-all duration-300 ease-in-out ${
                    viewMode === "chat" 
                      ? "opacity-100 translate-x-0 pointer-events-auto" 
                      : "opacity-0 -translate-x-full pointer-events-none"
                  }`
                : `transition-all duration-300 ease-in-out ${
                    viewMode === "chat" 
                      ? "opacity-100 translate-x-0 pointer-events-auto" 
                      : "opacity-0 translate-x-full pointer-events-none"
                  }`
            }`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <FullScreenChat
              isOpen={viewMode === "chat"}
              initialQuery={initialQuery || nutritionfacts.askWihy || `Tell me more about ${nutritionfacts.name || "this food"}`}
              initialResponse={chatPreloaded ? chatResponse : undefined}
              onClose={() => handleViewModeChange("overview")}
              isEmbedded={true}
              onBackToOverview={() => handleViewModeChange("overview")}
              onNewScan={handleNewScan}
              productName={nutritionfacts.name}
              apiResponseData={nutritionfacts}
              sessionId={sessionId}
              askWihy={nutritionfacts.askWihy}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionFactsPage;
