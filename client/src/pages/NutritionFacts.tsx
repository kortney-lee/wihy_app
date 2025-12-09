// Universal nutrition facts page
// Displays analyzed food from any source: barcode, image, meal, recipe, etc.

import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FullScreenChat from "../components/ui/FullScreenChat";
import ProductScanView from "../components/food/ProductScanView";
import ImageUploadModal from "../components/ui/ImageUploadModal";
import { NutritionFactsData } from "../types/nutritionFacts";
import { PlatformDetectionService } from "../services/shared/platformDetectionService";
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

  // Log component mount
  React.useEffect(() => {
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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [scanHistory, setScanHistory] = useState<NutritionFactsData[]>([]);
  const [autoOpenCamera, setAutoOpenCamera] = useState(false);
  
  // Log view mode changes
  React.useEffect(() => {
    debug.logState('View mode changed', { viewMode, isMobile });
  }, [viewMode]);
  
  // Log history visibility changes
  React.useEffect(() => {
    if (showHistory) {
      debug.logEvent('History sidebar opened', { itemCount: scanHistory.length });
    }
  }, [showHistory]);

  // Resolve state once in effect, handle missing data gracefully
  useEffect(() => {
    debug.logState("Location state received", {
      hasState: !!location.state,
      stateKeys: location.state ? Object.keys(location.state) : [],
      pathname: location.pathname,
      search: location.search
    });
    
    const state = (location.state as LocationState) || {};
    debug.logState("Parsed location state", {
      hasNutritionFacts: !!state.nutritionfacts,
      hasApiResponse: !!state.apiResponse,
      hasInitialQuery: !!state.initialQuery,
      hasSessionId: !!state.sessionId,
      fromChat: state.fromChat
    });

    // Accept both nutritionfacts and apiResponse keys for flexibility
    let dataFromState = state.nutritionfacts ?? (state.apiResponse as NutritionFactsData | undefined);
    debug.logState("Data extracted from state", {
      hasData: !!dataFromState,
      dataSource: dataFromState ? 'location.state' : 'none',
      productName: dataFromState?.name
    });

    // iOS Safari fallback: Check sessionStorage if no data in location.state
    if (!dataFromState) {
      console.log("[NutritionFacts] useEffect - No data in location.state, checking sessionStorage");
      debug.logState("No data in location.state, checking sessionStorage", {});
      
      try {
        const stored = sessionStorage.getItem('nutritionfacts_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log("[NutritionFacts] useEffect - Found data in sessionStorage:", parsed);
          debug.logState("Found data in sessionStorage", { 
            hasData: !!parsed.nutritionfacts,
            timestamp: parsed.timestamp,
            age: Date.now() - parsed.timestamp
          });
          
          // Use stored data if it's recent (within 30 seconds)
          if (Date.now() - parsed.timestamp < 30000) {
            dataFromState = parsed.nutritionfacts;
            setSessionId(parsed.sessionId);
            console.log("[NutritionFacts] useEffect - Using sessionStorage data");
            debug.logState("Using sessionStorage data (fresh)", { productName: dataFromState?.name });
          } else {
            console.log("[NutritionFacts] useEffect - sessionStorage data too old, clearing");
            debug.logState("sessionStorage data too old, clearing", { age: Date.now() - parsed.timestamp });
            sessionStorage.removeItem('nutritionfacts_data');
          }
        } else {
          debug.logState("No data in sessionStorage either", {});
        }
      } catch (e) {
        console.warn("[NutritionFacts] useEffect - Failed to read sessionStorage:", e);
        debug.logError("Failed to read sessionStorage", e instanceof Error ? e : new Error(String(e)));
      }
    }

    if (dataFromState) {
      console.log("[NutritionFacts] useEffect - setting data, name:", dataFromState.name);
      debug.logState("Setting nutrition facts data", {
        productName: dataFromState.name,
        hasCalories: !!dataFromState.calories,
        hasMacros: !!dataFromState.macros,
        servingSize: dataFromState.servingSize
      });
      
      setNutritionfacts(dataFromState);
      setInitialQuery(state.initialQuery);
      if (state.sessionId) setSessionId(state.sessionId);
      
      // Clear sessionStorage after successful load
      try {
        sessionStorage.removeItem('nutritionfacts_data');
        console.log("[NutritionFacts] useEffect - Cleared sessionStorage backup");
      } catch (e) {
        console.warn("[NutritionFacts] useEffect - Failed to clear sessionStorage:", e);
      }
    } else {
      // No data - Safari probably opened /nutritionfacts directly or lost state
      // Redirect to home instead of rendering nothing
      debug.logError("NO DATA - redirecting to home", new Error('No nutrition facts data found'));
      console.log("[NutritionFacts] useEffect - NO DATA, redirecting to home");
      
      // Preserve debug parameter if present
      const searchParams = new URLSearchParams(window.location.search);
      const isDebugMode = searchParams.get('debug') === 'true';
      const redirectPath = isDebugMode ? '/?debug=true' : '/';
      
      debug.logNavigation('Redirecting to home (no data)', { redirectPath, isDebugMode });
      navigate(redirectPath, { replace: true });
    }
  }, [location.state, navigate, debug]);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const wasMobile = isMobile;
      const nowMobile = window.innerWidth <= 768;
      setIsMobile(nowMobile);
      
      if (wasMobile !== nowMobile) {
        debug.logEvent('Mobile view changed', { 
          isMobile: nowMobile, 
          width: window.innerWidth,
          height: window.innerHeight
        });
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Store current scan in history when component mounts
  useEffect(() => {
    if (nutritionfacts) {
      setScanHistory(prev => {
        // Add current scan to history if not already there
        const exists = prev.some(item => item.name === nutritionfacts.name);
        if (!exists) {
          return [nutritionfacts, ...prev];
        }
        return prev;
      });
    }
  }, [nutritionfacts]);

  // Handle new scan - store current in history and launch scanner
  const handleNewScan = () => {
    debug.logEvent('New scan initiated', { currentProduct: nutritionfacts?.name });
    
    // Current scan is already in history from useEffect
    // Open the scanner modal with camera auto-start
    setAutoOpenCamera(true);
    setIsUploadModalOpen(true);
  };

  // Handle analysis complete from scanner
  const handleAnalysisComplete = (result: any) => {
    debug.logScan('Analysis complete in NutritionFacts', { 
      success: result?.success,
      hasData: !!result,
      productName: result?.name
    });
    
    setIsUploadModalOpen(false);
    setAutoOpenCamera(false); // Reset auto-open flag
    
    // Navigate to new nutrition facts page with the new scan
    if (result && result.success) {
      debug.logNavigation('Navigating to new nutrition facts', { productName: result.name });
      
      navigate('/nutritionfacts', {
        state: {
          initialQuery: result.userQuery || 'New scan',
          nutritionfacts: result
        },
        replace: false // Don't replace history, add new entry
      });
    }
  };

  // Show loading state instead of returning null - AFTER all hooks
  if (!nutritionfacts) {
    debug.logRender('Rendering loading state (no nutrition facts data yet)', {});
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent mb-4"></div>
          <p className="text-sm opacity-75">Loading nutrition facts…</p>
        </div>
      </div>
    );
  }
  
  debug.logRender('Rendering NutritionFacts page', {
    productName: nutritionfacts.name,
    // ...existing code...
  });

  return (
    <>
      {/* NO BACKDROP - This is a standalone page, not a modal */}
      <div
        className={`fullscreen-chat-container ${isMobile ? 'w-screen' : 'w-auto'} flex flex-col font-sans`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100dvh', // Use dynamic viewport height for iOS
          minHeight: '-webkit-fill-available', // iOS Safari fallback
          paddingTop: PlatformDetectionService.isNative() ? '48px' : '0px',
          WebkitOverflowScrolling: 'touch',
          overflow: 'hidden',
          zIndex: 50, // Reduced from 10000
          forcedColorAdjust: 'auto'
        }}
        onLoad={() => {
          debug.logEvent('NutritionFacts container loaded', {
            containerVisible: true,
            viewMode,
            isMobile
          });
        }}
      >
        {/* History Sidebar - show when toggled */}
        {showHistory && (
          <div className={`${
            isMobile ? 'w-full' : 'w-70'
          } h-full bg-slate-50 border-r border-gray-200 flex flex-col overflow-hidden absolute top-0 left-0 ${
            isMobile ? 'z-[100]' : 'z-[105]'
          }`}>
            {/* Sidebar Header */}
            <div className="p-5 px-4 border-b flex items-center justify-between">
              <h2 className="m-0 text-base font-semibold">
                Recent Scans
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="bg-transparent border-none cursor-pointer p-2 text-base opacity-75 hover:opacity-100"
                title="Close History"
              >
                ✕
              </button>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-hidden">
              <div className="p-2 h-full overflow-y-auto overflow-x-hidden">
                {/* History Items */}
                {scanHistory.map((scan, index) => (
                  <div 
                    key={index}
                    className={`p-3 mb-2 rounded-lg border cursor-pointer transition-colors ${
                      scan.name === nutritionfacts.name
                        ? 'border-opacity-50'
                        : 'border-transparent hover:opacity-75'
                    }`}
                    onClick={() => {
                      if (scan.name !== nutritionfacts.name) {
                        // Navigate to this historical scan
                        navigate('/nutritionfacts', {
                          state: {
                            initialQuery: scan.name,
                            nutritionfacts: scan
                          }
                        });
                      }
                      if (isMobile) {
                        setShowHistory(false);
                      }
                    }}
                  >
                    <div className="text-sm font-medium mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {scan.name || 'Unnamed Item'}
                    </div>
                    <div className="text-xs opacity-75">
                      {scan.name === nutritionfacts.name ? 'Active now' : 'Previous scan'}
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {scanHistory.length === 0 && (
                  <div className="text-center p-4 text-sm opacity-75">
                    Previous scans will appear here
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b">
          
          {/* Top Navigation Bar with Toggle History and View Charts */}
          <div className="flex items-center justify-between w-full px-3 py-2 min-h-[40px]">
            {/* Left side - Toggle History Button */}
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
        } border-b flex-shrink-0`}>
          
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
              className="flex-1" 
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overflowY: 'auto',
                overflowX: 'hidden',
                height: '100%',
                forcedColorAdjust: 'auto'
              }}
              ref={(el) => {
                if (el) {
                  debug.logEvent('Overview container mounted', {
                    scrollHeight: el.scrollHeight,
                    clientHeight: el.clientHeight,
                    hasProduct: !!nutritionfacts,
                    productName: nutritionfacts?.name
                  });
                  console.log('[NutritionFacts] Overview container ref:', {
                    scrollHeight: el.scrollHeight,
                    clientHeight: el.clientHeight,
                    children: el.children.length
                  });
                }
              }}
            >
              {console.log('[NutritionFacts] About to render ProductScanView') as any}
              <ProductScanView
                product={nutritionfacts}
                onAskMore={() => setViewMode("chat")}
              />
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

      {/* IMAGE UPLOAD MODAL - Opens when camera button is clicked */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setAutoOpenCamera(false);
        }}
        onAnalysisComplete={handleAnalysisComplete}
        title="New Scan"
        subtitle="Scan barcodes, search products, or analyze images"
        autoOpenCamera={autoOpenCamera}
      />
    </>
  );
};

export default NutritionFactsPage;
