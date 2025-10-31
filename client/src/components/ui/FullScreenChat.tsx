import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../../services/chatService';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  message: string;
  timestamp: Date;
}

interface FullScreenChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  initialResponse?: string;
}

const FullScreenChat: React.FC<FullScreenChatProps> = ({
  isOpen,
  onClose,
  initialQuery,
  initialResponse
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for active session when component opens
  useEffect(() => {
    if (isOpen) {
      const sessionId = chatService.getCurrentSessionId();
      const conversationId = chatService.getConversationId();
      // Only consider it an active session if there's a session ID or conversation ID
      // indicating there's been previous chat interaction
      setHasActiveSession(Boolean(sessionId || conversationId));
      console.log('🔍 FULL SCREEN CHAT: Session check:', {
        hasSessionId: Boolean(sessionId),
        hasConversationId: Boolean(conversationId),
        hasActiveSession: Boolean(sessionId || conversationId)
      });
    }
  }, [isOpen]);

  // Initialize with provided query/response
  useEffect(() => {
    if (initialQuery && initialResponse) {
      const initialMessages: ChatMessage[] = [
        {
          id: '1',
          type: 'user',
          message: initialQuery,
          timestamp: new Date()
        },
        {
          id: '2',
          type: 'assistant',
          message: initialResponse,
          timestamp: new Date()
        }
      ];
      setMessages(initialMessages);
    }
  }, [initialQuery, initialResponse]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: messageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Get AI response
      const response = await chatService.sendMessage(messageText);
      
      let aiResponse: string;
      if (typeof response === 'object' && response !== null) {
        if ('data' in response && typeof response.data === 'string') {
          aiResponse = response.data;
        } else if ('analysis' in response && typeof response.analysis === 'string') {
          aiResponse = response.analysis;
        } else if ('response' in response && typeof response.response === 'string') {
          aiResponse = response.response;
        } else if ('message' in response && typeof response.message === 'string') {
          aiResponse = response.message;
        } else {
          aiResponse = 'I received your message but had trouble formatting the response. Could you try asking in a different way?';
        }
      } else if (typeof response === 'string') {
        aiResponse = response;
      } else {
        aiResponse = 'I apologize, but I encountered an issue processing your request. Could you please try again?';
      }

      // Provide helpful health responses for demo
      if (aiResponse.length < 20 || aiResponse.includes('There is no cure')) {
        const userQuery = messageText.toLowerCase();
        if (userQuery.includes('healthy') || userQuery.includes('health')) {
          aiResponse = "Great question about health! Being healthy generally involves maintaining a balanced diet, regular exercise, adequate sleep, and managing stress. What specific aspect of health would you like to explore?";
        } else if (userQuery.includes('diet') || userQuery.includes('nutrition') || userQuery.includes('eat')) {
          aiResponse = "Nutrition is key to good health! A balanced diet with plenty of fruits, vegetables, whole grains, and lean proteins is important. Would you like tips on any specific dietary concerns?";
        } else if (userQuery.includes('exercise') || userQuery.includes('fitness')) {
          aiResponse = "Regular physical activity is essential for health! Aim for at least 150 minutes of moderate exercise per week. What type of activities interest you?";
        } else {
          aiResponse = "I'm here to help with your health questions! What would you like to know about nutrition, exercise, or wellness?";
        }
      }

      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        message: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // After first successful message exchange, we now have an active session
      if (!hasActiveSession) {
        setHasActiveSession(true);
        console.log('🔍 FULL SCREEN CHAT: Session now active after first message exchange');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        message: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  // Determine if we should show chat history (only if there's an active session with history)
  const shouldShowHistory = hasActiveSession && (messages.length > 0 || (initialQuery && initialResponse));

  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '170px' : '150px', // Start higher on desktop
      left: isMobile ? '8px' : '30px', // Smaller side margins on desktop
      right: isMobile ? '8px' : '30px',
      bottom: isMobile ? '20px' : '30px', // Smaller bottom margin on desktop
      backgroundColor: '#ffffff',
      zIndex: 10000,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: isMobile ? '12px' : '16px', // Rounded corners
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', // Nice shadow
      border: '1px solid #e5e7eb', // Subtle border
      overflow: 'hidden',
      maxWidth: isMobile ? 'none' : '1200px', // Larger max width on desktop
      maxHeight: isMobile ? 'none' : '800px', // Larger max height on desktop
      margin: isMobile ? '0' : '0 auto' // Center on desktop
    }}>
      {/* Mobile History Toggle - only show if history exists */}
      {isMobile && shouldShowHistory && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 101
        }}>
          <button
            onClick={() => setShowMobileHistory(!showMobileHistory)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#f3f4f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: '#6b7280',
              transition: 'all 0.2s ease'
            }}
          >
            ☰
          </button>
        </div>
      )}

      {/* Chat History Sidebar - only show if history exists */}
      {shouldShowHistory && (
      <div style={{
        width: isMobile ? '100%' : '280px',
        height: isMobile ? (showMobileHistory ? '50%' : '0') : '100%',
        backgroundColor: '#f9fafb',
        borderRight: isMobile ? 'none' : '1px solid #e5e7eb',
        borderBottom: isMobile ? '1px solid #e5e7eb' : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: isMobile ? 'height 0.3s ease' : 'none',
        position: isMobile ? 'relative' : 'static',
        zIndex: isMobile ? 100 : 'auto'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Chat History
          </h2>
          {isMobile && (
            <button
              onClick={() => setShowMobileHistory(false)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#6b7280'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* History List */}
        <div style={{
          flex: 1,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '8px',
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {/* Current Chat */}
            <div style={{
              padding: '12px',
              marginBottom: '8px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#1f2937',
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {initialQuery || 'Current Chat'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Active now
              </div>
            </div>

            {/* Previous Chats */}
            {['Health and nutrition basics', 'Exercise routine planning', 'Sleep optimization tips', 'Stress management techniques'].map((chat, index) => (
              <div key={index} style={{
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#374151',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {chat}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>
                  {index + 1} days ago
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Main Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? (shouldShowHistory && showMobileHistory ? '50%' : '100%') : '100%',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '16px 60px 16px 16px' : '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Let's Chat
            </h1>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#f3f4f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#6b7280',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
          >
            ✕
          </button>
        </div>

        {/* Messages Container - Single scroll area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isMobile ? '16px' : '24px',
            maxWidth: isMobile ? '100%' : '768px',
            margin: '0 auto',
            width: '100%',
            scrollBehavior: 'smooth'
          }}>
            {messages.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{
                  width: isMobile ? '48px' : '64px',
                  height: isMobile ? '48px' : '64px',
                  borderRadius: '16px',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '20px' : '24px',
                  marginBottom: '16px'
                }}>
                  💬
                </div>
                <h3 style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 8px 0'
                }}>
                  How can I help you today?
                </h3>
                <p style={{
                  fontSize: isMobile ? '14px' : '16px',
                  margin: 0,
                  maxWidth: isMobile ? '300px' : '400px'
                }}>
                  Ask me anything about health, nutrition, exercise, or wellness. I'm here to provide evidence-based guidance.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    gap: isMobile ? '12px' : '16px',
                    marginBottom: isMobile ? '16px' : '24px',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{
                    width: isMobile ? '28px' : '32px',
                    height: isMobile ? '28px' : '32px',
                    borderRadius: '50%',
                    backgroundColor: message.type === 'user' ? '#10b981' : '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: message.type === 'user' ? 'white' : '#6b7280',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {message.type === 'user' ? 'U' : (
                      <img
                        src="/assets/wihyfavicon.png"
                        alt="WiHy"
                        style={{ 
                          width: isMobile ? '16px' : '20px', 
                          height: isMobile ? '16px' : '20px', 
                          borderRadius: '4px' 
                        }}
                      />
                    )}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: isMobile ? '14px' : '16px',
                      lineHeight: '1.6',
                      color: '#1f2937',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word'
                    }}>
                      {message.message}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginTop: '8px'
                    }}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div style={{
                display: 'flex',
                gap: isMobile ? '12px' : '16px',
                marginBottom: isMobile ? '16px' : '24px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: isMobile ? '28px' : '32px',
                  height: isMobile ? '28px' : '32px',
                  borderRadius: '50%',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <img
                    src="/assets/wihyfavicon.png"
                    alt="WiHy"
                    style={{ 
                      width: isMobile ? '16px' : '20px', 
                      height: isMobile ? '16px' : '20px', 
                      borderRadius: '4px' 
                    }}
                  />
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center',
                  padding: isMobile ? '8px 12px' : '12px 16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#9ca3af',
                    animation: 'typing 1.4s ease-in-out infinite'
                  }} />
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#9ca3af',
                    animation: 'typing 1.4s ease-in-out infinite 0.2s'
                  }} />
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#9ca3af',
                    animation: 'typing 1.4s ease-in-out infinite 0.4s'
                  }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <div style={{
            maxWidth: isMobile ? '100%' : '768px',
            margin: '0 auto'
          }}>
            <div className="chat-input-wrapper">
              <div className="search-input-container chat-input-container">
                <textarea
                  ref={inputRef}
                  className="search-input"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isLoading ? "Processing..." : "Ask about your health data..."}
                  rows={1}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`send-button ${(!inputMessage.trim() || isLoading) ? 'disabled' : 'active'}`}
              >
                {isLoading ? (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid currentColor',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                ) : (
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Hide scrollbars completely for a cleaner look */
        div::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }

        div::-webkit-scrollbar-thumb {
          background: transparent;
        }

        /* For Firefox */
        div {
          scrollbar-width: none;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Chat-specific input area styling */
        .chat-input-area {
          padding: ${isMobile ? '12px 16px' : '16px 24px'};
          border-top: 1px solid #e5e7eb;
          background-color: #ffffff;
          flex-shrink: 0;
        }

        /* Wrapper for input and button positioning */
        .chat-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Chat input container - Simple solid styling for chat */
        .chat-input-container {
          width: 100% !important; /* Override the 80% width for chat context */
          margin: 0 !important; /* Override auto margins for flexbox */
          flex: 1; /* Allow it to grow in flexbox */
          /* Override animated styles with solid styling */
          background: #ffffff !important;
          border: 2px solid #fa5f06 !important;
          border-radius: 28px !important;
          box-shadow: 0 2px 8px rgba(250, 95, 6, 0.1) !important;
          animation: none !important;
          padding: 4px;
        }

        .chat-input-container:focus-within {
          box-shadow: 0 4px 16px rgba(250, 95, 6, 0.25);
          border-color: #fa5f06;
        }

        /* Chat input overrides */
        .chat-input-container .search-input {
          width: 100%;
          min-height: ${isMobile ? '52px' : '60px'};
          max-height: ${isMobile ? '120px' : '140px'};
          padding: ${isMobile ? '16px 20px' : '18px 24px'};
          border: none;
          border-radius: 24px;
          font-size: ${isMobile ? '16px' : '18px'};
          line-height: 1.4;
          resize: none;
          outline: none;
          font-family: inherit;
          background-color: #ffffff !important; /* Ensure pure white background */
          color: #1f2937;
        }

        .chat-input-container .search-input:disabled {
          background-color: #f9fafb;
          color: #9ca3af;
        }

        /* Send button styling - positioned outside input, matching ChatWidget exactly */
        .send-button {
          position: relative;
          right: auto;
          top: auto;
          transform: none;
          color: #374151;
          border: none;
          border-radius: 16px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
          min-width: 44px;
          height: 44px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .send-button.active {
          background-color: #d1d5db;
          color: #374151;
          cursor: pointer;
        }

        .send-button.active:hover {
          background-color: #9ca3af;
          color: white;
        }

        .send-button.disabled {
          background-color: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
};

export default FullScreenChat;