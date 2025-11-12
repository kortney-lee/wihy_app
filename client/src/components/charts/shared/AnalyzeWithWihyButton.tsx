import React, { useState, useRef, useCallback } from 'react';
import { CSS_CLASSES } from '../../../constants/cssConstants';
import FullScreenChat, { FullScreenChatRef } from '../../ui/FullScreenChat';

interface AnalyzeWithWihyButtonProps {
  /** Context to send to WiHy for analysis */
  cardContext: string;
  /** User query or question to analyze */
  userQuery?: string;
  /** Optional button text override */
  buttonText?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom styling */
  style?: React.CSSProperties;
  /** Optional callback for parent to handle analyze - when provided, uses centralized chat approach */
  onAnalyze?: (userQuery: string, cardContext: string) => void;
}

/**
 * Reusable "Analyze with WiHy" button component that:
 * 1. Uses centralized chat (via onAnalyze callback) when available - PREFERRED
 * 2. Falls back to local FullScreenChat when no onAnalyze callback provided
 */
const AnalyzeWithWihyButton: React.FC<AnalyzeWithWihyButtonProps> = ({
  cardContext,
  userQuery = 'Analyze this data',
  buttonText = 'Analyze with WiHy',
  className = '',
  style = {},
  onAnalyze
}) => {
  // FullScreenChat state and ref
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatRef = useRef<FullScreenChatRef>(null);

  // Enhanced analyze function adapted from HealthNewsFeed
  const handleAnalyzeWithWihy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    try {
      const searchQuery = `${userQuery}. Context: ${cardContext}`;

      // Check if we're in local development mode
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      if (isLocalDev) {
        // Use local chatService for development
        try {
          const { chatService } = await import('../../../services/chatService');
          const result = await chatService.sendMessage(searchQuery);
          
          // Handle both ChatResponse and ChatMessageResponse types
          const formattedResult = (result as any)?.response || (result as any)?.message || 'Analysis completed';
          
          if (onAnalyze) {
            // PREFERRED: Use parent's centralized chat system
            console.log('🔍 Using centralized chat approach via onAnalyze callback (local)');
            onAnalyze(userQuery, formattedResult);
          } else {
            // FALLBACK: Use local FullScreenChat
            console.log('🔍 Using local FullScreenChat - onAnalyze callback not provided (local)');
            if (chatRef.current) {
              chatRef.current.addMessage(userQuery, formattedResult);
            }
            setIsChatOpen(true);
          }
        } catch (error) {
          console.error('Local chat service failed:', error);
          // Final fallback to basic behavior
          if (onAnalyze) {
            onAnalyze(userQuery, cardContext);
          } else {
            if (chatRef.current && cardContext) {
              chatRef.current.addMessage(userQuery, cardContext);
            }
            setIsChatOpen(true);
          }
        }
      } else {
        // Production: Try enhanced WiHy API first
        try {
          const { wihyAPI } = await import('../../../services/wihyAPI');
          
          // Use the special analyzeWithWiHy method that always enables enhanced analysis
          const result = await wihyAPI.analyzeWithWiHy(
            searchQuery,
            {
              age: 35, // Default context
              health_concerns: ['general_health']
            },
            'AnalyzeWithWihyButton'
          );
          
          // Format the result for display
          const formattedResult = wihyAPI.formatResponse(result);
          
          if (onAnalyze) {
            // PREFERRED: Use parent's centralized chat system
            console.log('🔍 Using centralized chat approach via onAnalyze callback');
            onAnalyze(userQuery, formattedResult);
          } else {
            // FALLBACK: Use local FullScreenChat for backward compatibility
            console.log('🔍 Falling back to local FullScreenChat - onAnalyze callback not provided');
            if (chatRef.current) {
              chatRef.current.addMessage(userQuery, formattedResult);
            }
            setIsChatOpen(true);
          }
          
        } catch (wihyError) {
          console.error('Enhanced WiHy analysis failed, falling back to regular behavior:', wihyError);
          
          // Fallback to original behavior
          if (onAnalyze) {
            // PREFERRED: Use parent's centralized chat system
            console.log('🔍 Using centralized chat approach via onAnalyze callback');
            onAnalyze(userQuery, cardContext);
          } else {
            // FALLBACK: Use local FullScreenChat for backward compatibility  
            console.log('🔍 Falling back to local FullScreenChat - onAnalyze callback not provided');
            if (chatRef.current && cardContext) {
              chatRef.current.addMessage(userQuery, cardContext);
            }
            setIsChatOpen(true);
          }
        }
      }
    } finally {
      // Reset analyzing state 
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, userQuery, cardContext, onAnalyze]);

  // Handle analyze button click (kept for backward compatibility)
  const handleAnalyzeClick = () => {
    handleAnalyzeWithWihy({ stopPropagation: () => {}, preventDefault: () => {} } as React.MouseEvent);
  };

  const defaultStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderRadius: '16px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#fa5f06',
    boxShadow: 'none',
    transform: 'none',
    transition: 'all 0.2s ease',
    ...style
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{ marginTop: '12px' }}>
        <div className="wihy-btn-wrapper">
          <button 
            className={`${CSS_CLASSES.ANALYZE_WIHY_BTN} ${className}`.trim()}
            onClick={handleAnalyzeWithWihy}
            disabled={isAnalyzing}
            style={defaultStyle}
          >
            {isAnalyzing ? (
              <>
                <div className="analyze-spinner" style={{ 
                  display: 'inline-block', 
                  width: '12px', 
                  height: '12px', 
                  border: '2px solid #fa5f06', 
                  borderTop: '2px solid transparent', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></div>
                Analyzing...
              </>
            ) : (
              buttonText
            )}
          </button>
        </div>
      </div>

      {/* FullScreenChat Component - Only render when NOT using centralized approach */}
      {!onAnalyze && (
        <FullScreenChat
          ref={chatRef}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          initialQuery={userQuery}
          onViewCharts={() => setIsChatOpen(false)} // Close chat to view charts behind it
        />
      )}
    </>
  );
};

export default AnalyzeWithWihyButton;