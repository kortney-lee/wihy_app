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
        setViewMode("chat");
      } else if (diff < 0 && viewMode === "chat") {
        // Swiped right - show overview
        setViewMode("overview");
      }
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
            alert('Barcode scanning failed. Please try again.');
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
        <div className="fixed left-0 top-0 bottom-0 w-80 bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Scan History</h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
              title="Close History"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">📱</div>
              <p className="text-sm">No scan history available</p>
              <p className="text-xs mt-1 opacity-75">Previous scans will appear here</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <NavigationHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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
          } overflow-y-auto`}
          style={{ backgroundColor: '#f0f7ff', height: 'calc(100vh - 73px)' }}
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

              return (
                <>
                  {/* Product Header */}
                  <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform">
                    <div className="flex items-start gap-6">
                      {imageUrl && (
                        <div className="relative group">
                          <img
                            src={imageUrl}
                            alt={name || "Product"}
                            className="w-32 h-32 object-contain rounded-2xl border-0 bg-gradient-to-br from-white to-gray-50 shadow-lg group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      )}
                      <div className="flex-1 space-y-3">
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          {name || "Food item"}
                        </h1>
                        {brand && (
                          <p className="text-base text-gray-600 font-medium">{brand}</p>
                        )}
                        {typeof healthScore === "number" && (
                          <div className="flex items-center gap-3 mt-4">
                            <div className="relative hover:-translate-y-1 transition-transform duration-200 cursor-pointer">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${getScoreColor(healthScore)} shadow-lg`} />
                              <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">
                              {healthScore}<span className="text-sm text-gray-500">/100</span>
                            </span>
                            {grade && (
                              <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold rounded-full shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer transform active:scale-95">{grade}</span>
                            )}
                          </div>
                        )}
                        {novaScore && (
                          <div className="mt-3">
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg gap-2 hover:-translate-y-1 transition-all duration-200 cursor-pointer transform active:scale-95">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                              NOVA {novaScore}
                              {ultraProcessed && " · Ultra-processed"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nutrition Facts */}
                  {(calories || macros) && (
                    <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform">
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
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-l-4 border-orange-400 hover:bg-gradient-to-r hover:from-orange-100 hover:to-red-100 transition-all duration-200 cursor-pointer">
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
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 cursor-pointer">
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
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-l-4 border-yellow-400 hover:bg-gradient-to-r hover:from-yellow-100 hover:to-amber-100 transition-all duration-200 cursor-pointer">
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
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-400 hover:bg-gradient-to-r hover:from-purple-100 hover:to-violet-100 transition-all duration-200 cursor-pointer">
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
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-400 hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 transition-all duration-200 cursor-pointer">
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
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border-l-4 border-pink-400 hover:bg-gradient-to-r hover:from-pink-100 hover:to-rose-100 transition-all duration-200 cursor-pointer">
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

                  {/* Ingredients */}
                  {product.ingredientsText && (
                    <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                        </svg>
                        <span className="text-gray-900">Ingredients</span>
                      </h2>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-400">
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                          {product.ingredientsText}
                        </p>
                      </div>
                      {product.additives && Object.keys(product.additives).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                            Additives Detected
                          </h3>
                          <div className="space-y-2">
                            {Object.entries(product.additives).map(([code, name], idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-l-4 border-orange-400 hover:bg-gradient-to-r hover:from-orange-100 hover:to-amber-100 transition-all duration-200 cursor-pointer">
                                <span className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">{code}</span>
                                <span className="text-sm font-medium text-gray-700">{name as string}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Areas of Concern */}
                  {negatives.length > 0 && (
                    <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                        <span className="text-gray-900">Areas of Concern</span>
                      </h2>
                      <div className="space-y-4">
                        {negatives.map((negative, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-l-4 border-red-400 hover:bg-gradient-to-r hover:from-red-100 hover:to-pink-100 transition-all duration-200 cursor-pointer">
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
                    <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span className="text-gray-900">Positive Aspects</span>
                      </h2>
                      <div className="space-y-4">
                        {positives.map((positive, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-l-4 border-emerald-400 hover:bg-gradient-to-r hover:from-emerald-100 hover:to-green-100 transition-all duration-200 cursor-pointer">
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

        {/* Chat Content - Pre-mounted and Show/Hide with transitions */}
        <div 
          className={`absolute top-0 left-0 right-0 bottom-0 ${
            isInitialMount || slideDirection === 'none'
              ? (viewMode === "chat" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")
              : slideDirection === 'right'
              ? `transition-all duration-300 ease-in-out ${
                  viewMode === "chat" 
                    ? "opacity-100 translate-x-0 pointer-events-auto" 
                    : "opacity-0 translate-x-full pointer-events-none"
                }`
              : `transition-all duration-250 ease-in-out ${
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
            initialQuery={initialQuery || `Tell me more about ${nutritionfacts.name || "this food"}`}
            initialResponse={nutritionfacts?.name || "Product"}
            onClose={() => setViewMode("overview")}
            isEmbedded={true}
            onBackToOverview={() => setViewMode("overview")}
            onNewScan={handleNewScan}
            productName={nutritionfacts.name}
            apiResponseData={nutritionfacts}
            sessionId={sessionId}
          />
        </div>
      </div>
    </div>
  );
};

export default NutritionFactsPage;
