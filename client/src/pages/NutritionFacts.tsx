// Universal nutrition facts page
// Displays analyzed food from any source: barcode, image, meal, recipe, etc.

import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FullScreenChat from "../components/ui/FullScreenChat";
import ProductScanView from "../components/food/ProductScanView";
import ImageUploadModal from "../components/ui/ImageUploadModal";
import { NutritionFactsData } from "../types/nutritionFacts";
import { PlatformDetectionService } from "../services/shared/platformDetectionService";
import "../styles/mobile-fixes.css";
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

  // Resolve state once in effect, handle missing data gracefully
  useEffect(() => {
    console.log("[NutritionFacts] useEffect - location.state:", location.state);
    const state = (location.state as LocationState) || {};
    console.log("[NutritionFacts] useEffect - parsed state:", state);

    // Accept both nutritionfacts and apiResponse keys for flexibility
    let dataFromState = state.nutritionfacts ?? (state.apiResponse as NutritionFactsData | undefined);
    console.log("[NutritionFacts] useEffect - dataFromState from location:", dataFromState);

    // iOS Safari fallback: Check sessionStorage if no data in location.state
    if (!dataFromState) {
      console.log("[NutritionFacts] useEffect - No data in location.state, checking sessionStorage");
      try {
        const stored = sessionStorage.getItem('nutritionfacts_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log("[NutritionFacts] useEffect - Found data in sessionStorage:", parsed);
          // Use stored data if it's recent (within 30 seconds)
          if (Date.now() - parsed.timestamp < 30000) {
            dataFromState = parsed.nutritionfacts;
            setSessionId(parsed.sessionId);
            console.log("[NutritionFacts] useEffect - Using sessionStorage data");
          } else {
            console.log("[NutritionFacts] useEffect - sessionStorage data too old, clearing");
            sessionStorage.removeItem('nutritionfacts_data');
          }
        }
      } catch (e) {
        console.warn("[NutritionFacts] useEffect - Failed to read sessionStorage:", e);
      }
    }

    if (dataFromState) {
      console.log("[NutritionFacts] useEffect - setting data, name:", dataFromState.name);
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
      console.log("[NutritionFacts] useEffect - NO DATA, redirecting to home");
      navigate("/", { replace: true });
    }
  }, [location.state, navigate]);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
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
    // Current scan is already in history from useEffect
    // Open the scanner modal with camera auto-start
    setAutoOpenCamera(true);
    setIsUploadModalOpen(true);
  };

  // Handle analysis complete from scanner
  const handleAnalysisComplete = (result: any) => {
    setIsUploadModalOpen(false);
    setAutoOpenCamera(false); // Reset auto-open flag
    
    // Navigate to new nutrition facts page with the new scan
    if (result && result.success) {
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-gray-500 text-sm">Loading nutrition facts…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* NO BACKDROP - This is a standalone page, not a modal */}
      
      <div 
        className={`fullscreen-chat-container fixed inset-0 ${
          isMobile ? 'w-screen h-screen' : 'w-auto h-auto'
        } z-[10000] flex flex-col font-sans overflow-hidden`}
        style={{
          backgroundColor: '#f0f7ff',
          paddingTop: PlatformDetectionService.isNative() ? '48px' : '0px',
          WebkitOverflowScrolling: 'touch'
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
            <div className="p-5 px-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="m-0 text-base font-semibold text-gray-800">
                Recent Scans
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="bg-transparent border-none cursor-pointer p-2 text-base text-gray-500 hover:text-gray-700"
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
                        ? 'bg-white border-gray-200'
                        : 'bg-transparent border-transparent hover:bg-gray-50'
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
                    <div className="text-sm font-medium text-gray-800 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {scan.name || 'Unnamed Item'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {scan.name === nutritionfacts.name ? 'Active now' : 'Previous scan'}
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {scanHistory.length === 0 && (
                  <div className="text-center p-4 text-sm text-gray-500">
                    Previous scans will appear here
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          
          {/* Top Navigation Bar with Toggle History and View Charts */}
          <div className="flex items-center justify-between w-full px-3 py-2 bg-white min-h-[40px]">
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
                className={`chat-icon-button bg-transparent border-none cursor-pointer p-1 rounded transition-all duration-200 flex items-center justify-center ${
                  hasChartData ? 'opacity-100' : 'opacity-70'
                } hover:opacity-90`}
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
            } font-semibold text-gray-900 hidden sm:inline max-w-[200px] truncate`}>
              {nutritionfacts.name || "Nutrition Facts"}
            </span>

            {/* View mode toggle with Camera button */}
            <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs">
              <button
                onClick={() => setViewMode("overview")}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  viewMode === "overview"
                    ? "bg-white text-gray-900 shadow-sm font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Overview
              </button>

              <button
                onClick={() => setViewMode("chat")}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  viewMode === "chat"
                    ? "bg-white text-gray-900 shadow-sm font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Ask WiHY
              </button>

              {/* Camera button - directly opens camera function */}
              <button
                onClick={handleNewScan}
                className="px-2 py-1.5 rounded-full transition-all text-gray-600 hover:text-gray-900 hover:bg-white"
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === "overview" ? (
            <div 
              className="flex-1 overflow-y-auto" 
              style={{ 
                backgroundColor: '#f0f7ff',
                WebkitOverflowScrolling: 'touch'
              }}
            >
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
