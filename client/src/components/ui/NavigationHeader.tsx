import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformNavigation } from '../../hooks/usePlatformNavigation';

interface NavigationHeaderProps {
  // View mode management
  viewMode?: 'overview' | 'chat';
  onViewModeChange?: (mode: 'overview' | 'chat') => void;
  showViewToggle?: boolean;
  
  // History/sidebar management  
  showHistory?: boolean;
  onHistoryToggle?: () => void;
  
  // Action handlers
  onCameraScan?: () => void;
  onImageUpload?: () => void;
  onChartsView?: () => void;
  
  // Data for charts navigation
  hasChartData?: boolean;
  chartData?: any;
  sessionId?: string;
  
  // Customization
  showUploadButton?: boolean;
  showCameraButton?: boolean;
  showChartsButton?: boolean;
  isFixed?: boolean;
  
  // Context info
  dataSource?: string;
  fromNutritionFacts?: boolean;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  viewMode = 'overview',
  onViewModeChange,
  showViewToggle = true,
  showHistory = false,
  onHistoryToggle,
  onCameraScan,
  onImageUpload,
  onChartsView,
  hasChartData = false,
  chartData,
  sessionId,
  showUploadButton = false,
  showCameraButton = true,
  showChartsButton = true,
  isFixed = false,
  dataSource = 'nutrition_facts',
  fromNutritionFacts = false
}) => {
  const navigate = useNavigate();
  const { platform } = usePlatformNavigation();

  const handleChartsClick = () => {
    if (onChartsView) {
      onChartsView();
    } else if (hasChartData && chartData) {
      navigate('/dashboard', {
        state: {
          apiResponse: chartData,
          dataSource: dataSource,
          fromNutritionFacts: fromNutritionFacts,
          fromChat: !fromNutritionFacts,
          sessionId: sessionId,
          initialTab: 'overview'
        }
      });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`bg-white border-b border-gray-200 shadow-sm ${isFixed ? 'fixed top-0 left-0 right-0 z-50' : ''}`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* History/Menu Button */}
        <button
          onClick={onHistoryToggle}
          className="w-10 h-10 rounded-xl bg-gray-100/60 hover:bg-gray-200/80 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all duration-200 backdrop-blur-sm"
          title="Toggle History"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Center Toggle Buttons */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-2xl bg-gray-100 p-1.5 text-sm border border-gray-200">
            {showViewToggle && (
              <>
                <button
                  onClick={() => onViewModeChange?.('overview')}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium flex items-center gap-2 ${
                    viewMode === "overview" 
                      ? "bg-white shadow-lg text-blue-600 transform scale-105" 
                      : "text-gray-600 hover:text-blue-600 hover:bg-white/50"
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                  Overview
                </button>
                
                <button
                  onClick={() => onViewModeChange?.('chat')}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium flex items-center gap-2 ${
                    viewMode === "chat" 
                      ? "bg-white shadow-lg text-purple-600 transform scale-105" 
                      : "text-gray-600 hover:text-purple-600 hover:bg-white/50"
                  }`}
                >
                  <img src="/assets/wihyfavicon.png" alt="WiHY" className="w-4 h-4" />
                  Ask WiHY
                </button>
              </>
            )}
            
            {!showViewToggle && (
              <button
                className="px-4 py-2 rounded-xl transition-all duration-300 font-medium flex items-center gap-2 bg-white shadow-lg text-purple-600 transform scale-105"
                disabled
              >
                <img src="/assets/wihyfavicon.png" alt="WiHY" className="w-4 h-4" />
                Ask WiHY
              </button>
            )}
            
            {/* Upload Button - Only show if enabled */}
            {showUploadButton && (
              <button
                onClick={onImageUpload}
                className="px-3 py-2 rounded-xl transition-all duration-300 text-gray-600 hover:text-blue-600 hover:bg-white/50 hover:scale-110"
                title="Upload Image"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </button>
            )}
            
            {/* Camera Button - Show if enabled */}
            {showCameraButton && (
              <button
                onClick={onCameraScan}
                className="px-3 py-2 rounded-xl transition-all duration-300 text-gray-600 hover:text-green-600 hover:bg-white/50 hover:scale-110"
                title="Camera Scan"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Charts Button */}
        {showChartsButton && (
          <div className="relative">
            <button
              onClick={handleChartsClick}
              title={hasChartData ? "View Interactive Charts" : "Back to Search Screen"}
              className="p-1 rounded transition-all hover:opacity-90"
            >
              <img 
                src="/assets/Chartlogo.png" 
                alt="View Charts"
                className="w-16 h-16 object-contain"
              />
            </button>
            {hasChartData && (
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NavigationHeader;