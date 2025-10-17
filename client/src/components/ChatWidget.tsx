import React from 'react';

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery?: string;
  searchResponse?: string;
  currentContext?: string; // Current dashboard section being viewed
  inline?: boolean; // Whether to render inline or as fixed overlay
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose, searchQuery, searchResponse, currentContext, inline = false }) => {
  console.log('🔍 CHATWIDGET DEBUG: Received props:', {
    isOpen,
    searchQuery,
    searchResponse: searchResponse?.substring(0, 100) + '...',
    currentContext,
    inline
  });
  
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="chat-widget"
      style={{
        position: inline ? 'relative' : 'fixed',
        left: inline ? 'auto' : '0',
        top: inline ? 'auto' : '0',
        width: inline ? '100%' : '350px',
        height: inline ? '100%' : '100vh',
        backgroundColor: 'white',
        borderRight: inline ? 'none' : '1px solid #e5e7eb',
        border: inline ? '1px solid #e5e7eb' : 'none',
        borderRadius: inline ? '8px' : '0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: inline ? 'auto' : 1000,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        animation: inline ? 'none' : 'slideInFromLeft 0.3s ease-out',
        boxShadow: inline ? 'none' : '4px 0 12px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Results Display */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: inline ? '16px' : '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {searchResponse ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#334155',
              whiteSpace: 'pre-wrap'
            }}>
              {searchResponse}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#64748b'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              opacity: 0.3
            }}>
              🔍
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              No search results yet
            </div>
            <div style={{
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              Use the search above to get health information
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;