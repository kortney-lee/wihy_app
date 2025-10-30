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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#ffffff',
      zIndex: 10000,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Mobile History Toggle */}
      {isMobile && (
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

      {/* Chat History Sidebar */}
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

      {/* Main Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? (showMobileHistory ? '50%' : '100%') : '100%',
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
            <img
              src="/assets/wihylogo.png"
              alt="WiHy Health Assistant"
              style={{
                height: isMobile ? '32px' : '40px',
                width: 'auto'
              }}
            />
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
        <div style={{
          padding: isMobile ? '12px 16px' : '16px 24px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          flexShrink: 0
        }}>
          <div style={{
            maxWidth: isMobile ? '100%' : '768px',
            margin: '0 auto',
            position: 'relative'
          }}>
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your health data..."
              disabled={isLoading}
              style={{
                width: '100%',
                minHeight: isMobile ? '52px' : '60px',
                maxHeight: isMobile ? '120px' : '140px',
                padding: isMobile ? '16px 50px 16px 20px' : '18px 60px 18px 24px',
                border: '3px solid #fa5f06',
                borderRadius: isMobile ? '30px' : '35px',
                fontSize: isMobile ? '16px' : '18px',
                lineHeight: '1.4',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                backgroundColor: isLoading ? '#f9fafb' : '#ffffff',
                color: isLoading ? '#9ca3af' : '#1f2937',
                boxShadow: '0 3px 12px rgba(250, 95, 6, 0.15)',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 4px 16px rgba(250, 95, 6, 0.25)';
                e.target.style.borderColor = '#fa5f06';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = '0 3px 12px rgba(250, 95, 6, 0.15)';
                e.target.style.borderColor = '#fa5f06';
              }}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{
                position: 'absolute',
                right: isMobile ? '8px' : '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: inputMessage.trim() && !isLoading ? '#10b981' : '#e5e7eb',
                color: inputMessage.trim() && !isLoading ? 'white' : '#9ca3af',
                cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '16px' : '18px',
                transition: 'all 0.2s ease',
                boxShadow: inputMessage.trim() && !isLoading ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              {isLoading ? (
                <div style={{
                  width: isMobile ? '14px' : '16px',
                  height: isMobile ? '14px' : '16px',
                  border: '2px solid currentColor',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                '↑'
              )}
            </button>
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
      `}</style>
    </div>
  );
};

export default FullScreenChat;