import React, { useState, useRef } from 'react';
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
}

/**
 * Reusable "Analyze with WiHy" button component that opens FullScreenChat
 * with context from the card data
 */
const AnalyzeWithWihyButton: React.FC<AnalyzeWithWihyButtonProps> = ({
  cardContext,
  userQuery = 'Analyze this data',
  buttonText = 'Analyze with WiHy',
  className = '',
  style = {}
}) => {
  // FullScreenChat state and ref
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatRef = useRef<FullScreenChatRef>(null);

  // Handle analyze button click
  const handleAnalyzeClick = () => {
    if (chatRef.current && cardContext) {
      chatRef.current.addMessage(userQuery, cardContext);
    }
    setIsChatOpen(true);
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
      <div style={{ marginTop: '12px' }}>
        <div className="wihy-btn-wrapper">
          <button 
            className={`${CSS_CLASSES.ANALYZE_WIHY_BTN} ${className}`.trim()}
            onClick={handleAnalyzeClick}
            style={defaultStyle}
          >
            {buttonText}
          </button>
        </div>
      </div>

      {/* FullScreenChat Component */}
      <FullScreenChat
        ref={chatRef}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialQuery={userQuery}
      />
    </>
  );
};

export default AnalyzeWithWihyButton;