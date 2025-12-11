// Universal nutrition facts page
// Displays analyzed food from any source: barcode, image, meal, recipe, etc.

import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FullScreenChat from "../components/ui/FullScreenChat";
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
  // IMMEDIATE LOG - before any hooks
  try {
    const sessionLogs = sessionStorage.getItem('wihy_debug_session');
    const logs = sessionLogs ? JSON.parse(sessionLogs) : [];
    logs.push({
      timestamp: '+' + ((Date.now() - parseInt(sessionStorage.getItem('wihy_debug_start_time') || Date.now().toString())) / 1000).toFixed(3) + 's',
      type: 'system',
      message: 'NutritionFacts: Component function called',
      page: 'NutritionFacts',
      data: { 
        pathname: window.location.pathname,
        hasLocationState: !!(window as any).history?.state?.usr
      }
    });
    sessionStorage.setItem('wihy_debug_session', JSON.stringify(logs));
    console.log('[NutritionFacts] Component function called');
  } catch (e) {
    console.error('[NutritionFacts] Failed to log component call:', e);
  }
  
  const navigate = useNavigate();
  const location = useLocation();
  const debug = useDebugLog('NutritionFacts');
  
  // Prevent excessive logging during React StrictMode double mounting
  const componentInitializedRef = useRef<boolean>(false);

  // Log component mount (prevent double logging from React StrictMode)
  React.useEffect(() => {
    if (componentInitializedRef.current) {
      console.log('💬 NUTRITION FACTS: Skipping duplicate initialization (StrictMode double mount)');
      return;
    }
    
    componentInitializedRef.current = true;
    debug.logRender('NutritionFacts component mounted', {
      platform: PlatformDetectionService.getPlatform(),
      isNative: PlatformDetectionService.isNative(),
      width: window.innerWidth,
      pathname: location.pathname,
      hasState: !!location.state
    });
  }, []);

  // ALL HOOKS MUST BE AT THE TOP - before any conditional returns
  // Use state to manage nutrition facts data instead of reading directly from location
  const [initialQuery, setInitialQuery] = useState<string | undefined>();
  const [nutritionfacts, setNutritionfacts] = useState<NutritionFactsData | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [isMobile, setIsMobile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hasChartData, setHasChartData] = useState(true); // Always true for nutrition facts
  
  // Log view mode changes
  React.useEffect(() => {
    // debug.logState('View mode changed', { viewMode, isMobile });
  }, [viewMode, isMobile]);
  
  // Removed history logging to prevent re-render loops

  // Resolve state once in effect, handle missing data gracefully
  useEffect(() => {
    const state = (location.state as LocationState) || {};

    // Accept both nutritionfacts and apiResponse keys for flexibility
    let dataFromState = state.nutritionfacts ?? (state.apiResponse as NutritionFactsData | undefined);

    // No sessionStorage fallback - direct navigation only

    if (dataFromState) {
      console.log("[NutritionFacts] useEffect - setting data, name:", dataFromState.name);
      
      setNutritionfacts(dataFromState);
      setInitialQuery(state.initialQuery);
      if (state.sessionId) setSessionId(state.sessionId);

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
              
              // Replace current page with new nutrition facts
              navigate('/nutritionfacts', {
                state: {
                  nutritionfacts: newNutritionfacts,
                  sessionId: (barcodeResult as any).sessionId,
                  fromCamera: true
                },
                replace: true // Replace current page instead of adding to history
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
    <>

      {/* NO BACKDROP - This is a standalone page, not a modal */}
      <div
        className={`nutrition-facts-page fixed inset-0 ${isMobile ? 'w-screen h-screen' : 'w-auto h-auto'} flex flex-col font-sans overflow-hidden`}
        style={{
          // backgroundColor: '#f0f7ff',
          paddingTop: PlatformDetectionService.isNative() ? '48px' : '0px',
        }}
        onLoad={() => {
          // debug.logEvent('NutritionFacts container loaded', {
          //   containerVisible: true,
          //   viewMode,
          //   isMobile
          // });
        }}
      >
        {/* Mock History Sidebar - toggles on/off but shows no actual data */}
        {showHistory && (
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col">
            {/* Sidebar Header */}
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
            
            {/* Sidebar Content - Mock/Empty State */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">📱</div>
                <p className="text-sm">No scan history available</p>
                <p className="text-xs mt-1 opacity-75">Previous scans will appear here</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          
          {/* Top Navigation Bar with Toggle History and View Charts */}
          <div className="flex items-center justify-between w-full px-3 py-2 bg-white min-h-[40px]">
            {/* Left side - Toggle History Button (mock functionality) */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-transparent border-none cursor-pointer p-1 text-2xl hover:text-gray-600 transition-colors duration-200"
              title="Toggle History"
            >
              ☰
            </button>

            {/* Right side - View Charts Button */}
            <div className="relative">
              <button
                onClick={() => {
                  if (hasChartData) {
                    // Navigate to dashboard with chart data
                    navigate('/dashboard', {
                      state: {
                        apiResponse: nutritionfacts,
                        dataSource: 'nutrition_facts',
                        fromNutritionFacts: true,
                        sessionId: sessionId,
                        initialTab: 'overview' // Start on overview tab to show charts
                      }
                    });
                  } else {
                    navigate(-1); // Navigate back when no chart data
                  }
                }}
                title={hasChartData ? "View Interactive Charts" : "Back to Search Screen"}
                className="bg-transparent border-none cursor-pointer p-1 rounded transition-all duration-200 flex items-center justify-center opacity-100 hover:opacity-90"
              >
                <img 
                  src="/assets/Chartlogo.png" 
                  alt="View Charts"
                  className="w-16 h-16 object-contain"
                />
              </button>
              
              {/* Chart availability indicator */}
              {hasChartData && (
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
              )}
              
              {/* Back indicator - clickable to return to search */}
              {!hasChartData && (
                <div className="absolute -bottom-0.5 right-2 text-[9px] text-gray-500 font-medium text-center">
                  ← Back
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Header with title and view mode toggle */}
        <div className={`flex items-center justify-center ${
          isMobile ? 'px-4 py-2' : 'px-6 py-3'
        } border-b border-gray-200 bg-white flex-shrink-0`}>
          
          {/* Title & View tabs - centered */}
          <div className="flex items-center gap-3">
            <span className={`${
              isMobile ? 'text-xs' : 'text-sm'
            } font-semibold hidden sm:inline max-w-[200px] truncate`}>
              {nutritionfacts.name || "Nutrition Facts"}
            </span>

            {/* View mode toggle with Camera button */}
            <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs">
              <button
                onClick={() => setViewMode("overview")}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  viewMode === "overview"
                    ? "shadow-sm font-semibold"
                    : "hover:opacity-80"
                }`}
              >
                Overview
              </button>

              <button
                onClick={() => setViewMode("chat")}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  viewMode === "chat"
                    ? "shadow-sm font-semibold"
                    : "hover:opacity-80"
                }`}
              >
                Ask WiHY
              </button>

              {/* Camera button - directly opens camera function */}
              <button
                onClick={handleNewScan}
                className="px-2 py-1.5 rounded-full transition-all hover:opacity-80"
                title="New Scan"
                aria-label="Start new scan"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Body - Single scroll container pattern (matches FullScreenChat) */}
        <div className="flex-1 flex flex-col" style={{ 
          overflow: 'hidden',
          height: '100%',
          minHeight: 0 // Critical for flex children scrolling
        }}>
          {viewMode === "overview" ? (
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden h-full" 
              style={{ 
                // backgroundColor: '#f0f7ff',
                WebkitOverflowScrolling: 'touch'
              }}
              ref={(el) => {
                if (el) {
                  // debug.logEvent('Overview container mounted', {
                  //   scrollHeight: el.scrollHeight,
                  //   clientHeight: el.clientHeight,
                  //   hasProduct: !!nutritionfacts,
                  //   productName: nutritionfacts?.name
                  // });
                  console.log('[NutritionFacts] Overview container ref:', {
                    scrollHeight: el.scrollHeight,
                    clientHeight: el.clientHeight,
                    children: el.children.length
                  });
                }
              }}
            >
              {console.log('[NutritionFacts] About to render inline ProductScanView') as any}
              {/* Inline ProductScanView Component */}
              {(() => {
                const product = nutritionfacts;
                if (!product) return null;

                console.log('[ProductScanView] Rendering with product:', product.name);
                
                // Log rendering diagnostics
                // debug.logRender('ProductScanView rendering', {
                //   productName: product.name,
                //   healthScore: product.healthScore,
                //   hasImage: !!product.imageUrl,
                //   hasPositives: product.positives?.length || 0,
                //   hasNegatives: product.negatives?.length || 0
                // });
                
                const {
                  name,
                  brand,
                  imageUrl,
                  healthScore,
                  grade,
                  novaScore,
                  ultraProcessed,
                  additives = [],
                  calories,
                  macros,
                  servingSize,
                  positives = [],
                  negatives = [],
                  recommendations = [],
                } = product;

                // Color-coded health score
                const getScoreColor = (score?: number) => {
                  if (!score) return "bg-gray-400";
                  if (score >= 80) return "bg-emerald-500";
                  if (score >= 60) return "bg-yellow-500";
                  if (score >= 40) return "bg-orange-500";
                  return "bg-red-500";
                };

                return (
                  <div 
                    className="flex flex-col product-scan-view min-h-screen p-4"
                    style={{
                      opacity: 1,
                      visibility: 'visible',
                      display: 'flex'
                    }}
                  >
                    {/* Header Section */}
                    <div className="flex items-start gap-4 mb-6">
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt={name || "Product"}
                          className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-white"
                        />
                      )}

                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 leading-tight">
                          {name || "Food item"}
                        </h2>
                        {brand && (
                          <p className="text-sm text-gray-600 mt-1">{brand}</p>
                        )}

                        {/* Health Score */}
                        {typeof healthScore === "number" && (
                          <div className="flex items-center gap-2 mt-3">
                            <span
                              className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${getScoreColor(
                                healthScore
                              )}`}
                            />
                            <span className="text-base font-semibold text-gray-900">
                              {healthScore}/100
                            </span>
                            {grade && (
                              <span className="text-sm text-gray-600 ml-1">{grade}</span>
                            )}
                          </div>
                        )}

                        {/* NOVA Score */}
                        {novaScore && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              NOVA {novaScore}
                              {ultraProcessed && " · Ultra-processed"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nutrition Facts Summary */}
                    {(calories || macros) && (
                      <section className="mb-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">
                          Nutrition Facts
                          {servingSize && (
                            <span className="ml-2 text-sm font-normal text-gray-500">
                              per {servingSize}
                            </span>
                          )}
                        </h3>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <div className="grid grid-cols-2 gap-3">
                            {calories && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Calories</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {calories}
                                </span>
                              </div>
                            )}
                            {macros?.protein !== undefined && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Protein</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {macros.protein}g
                                </span>
                              </div>
                            )}
                            {macros?.carbs !== undefined && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Carbs</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {macros.carbs}g
                                </span>
                              </div>
                            )}
                            {macros?.fat !== undefined && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Fat</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {macros.fat}g
                                </span>
                              </div>
                            )}
                            {macros?.fiber !== undefined && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Fiber</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {macros.fiber}g
                                </span>
                              </div>
                            )}
                            {macros?.sugar !== undefined && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Sugar</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {macros.sugar}g
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Negatives */}
                    {negatives.length > 0 && (
                      <section className="mb-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">
                          Areas of Concern
                        </h3>
                        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                          {negatives.map((negative, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 px-4 py-3"
                            >
                              <span className="w-3 h-3 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {negative.label}
                                </p>
                                {negative.description && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {negative.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Positives */}
                    {positives.length > 0 && (
                      <section className="mb-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">
                          Positive Aspects
                        </h3>
                        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                          {positives.map((positive, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 px-4 py-3"
                            >
                              <span className="w-3 h-3 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {positive.label}
                                </p>
                                {positive.description && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {positive.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <FullScreenChat
              isOpen={true}
              initialQuery={initialQuery || `Tell me more about ${nutritionfacts.name || "this food"}`}
              initialResponse={nutritionfacts}
              onClose={() => setViewMode("overview")}
              isEmbedded={true}
              onBackToOverview={() => setViewMode("overview")}
              onNewScan={handleNewScan}
              productName={nutritionfacts.name}
              apiResponseData={nutritionfacts}
              sessionId={sessionId}
            />
          )}
        </div>
      </div>


    </>
  );
};

export default NutritionFactsPage;
