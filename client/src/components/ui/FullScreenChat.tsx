import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
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
  initialResponse?: string | any; // Allow both string and structured barcode scan data
  onViewCharts?: () => void; // Optional callback for "View Charts" button
}

// Add interface for ref methods
export interface FullScreenChatRef {
  addMessage: (userMessage: string, assistantMessage: string | any) => void;
}

const FullScreenChat = forwardRef<FullScreenChatRef, FullScreenChatProps>(({
  isOpen,
  onClose,
  initialQuery,
  initialResponse,
  onViewCharts
}, ref) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [showDesktopHistory, setShowDesktopHistory] = useState(false);
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

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    addMessage: (userMessage: string, assistantMessage: string | any) => {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        message: userMessage,
        timestamp: new Date()
      };
      
      // Handle both simple strings and Universal Search response objects
      let formattedMessage: string;
      
      if (typeof assistantMessage === 'string') {
        formattedMessage = assistantMessage;
      } else if (assistantMessage && typeof assistantMessage === 'object') {
        // Handle different response types based on type field
        if (assistantMessage.type === 'universal_search' && assistantMessage.summary) {
          // Format Universal Search response for chat display
          formattedMessage = assistantMessage.summary;
          
          // Add key findings if available
          if (assistantMessage.key_findings && assistantMessage.key_findings.length > 0) {
            formattedMessage += '\n\n**Key Findings:**\n';
            assistantMessage.key_findings.forEach((finding: string) => {
              formattedMessage += `• ${finding}\n`;
            });
          }
          
          // Add recommendations if available
          if (assistantMessage.recommendations && assistantMessage.recommendations.length > 0) {
            formattedMessage += '\n\n**Recommendations:**\n';
            assistantMessage.recommendations.forEach((rec: string) => {
              formattedMessage += `• ${rec}\n`;
            });
          }
          
          // Add evidence quality if available
          if (assistantMessage.evidence_strength) {
            formattedMessage += `\n\n**Evidence Quality:** ${assistantMessage.evidence_strength.overall_quality}`;
          }
          
          // Add confidence score if available
          if (assistantMessage.confidence) {
            formattedMessage += `\n**Confidence:** ${Math.round(assistantMessage.confidence * 100)}%`;
          }
        } else if (assistantMessage.type === 'legacy_search' || assistantMessage.type === 'cached_search') {
          // Handle legacy/cached search responses
          formattedMessage = assistantMessage.summary || 'Search results received';
          
          // Add recommendations if available
          if (assistantMessage.recommendations && assistantMessage.recommendations.length > 0) {
            formattedMessage += '\n\n**Recommendations:**\n';
            assistantMessage.recommendations.forEach((rec: string) => {
              formattedMessage += `• ${rec}\n`;
            });
          }
          
          // Add sources if available
          if (assistantMessage.sources && assistantMessage.sources.length > 0) {
            formattedMessage += '\n\n**Sources:**\n';
            assistantMessage.sources.forEach((source: string) => {
              formattedMessage += `• ${source}\n`;
            });
          }
          
          // Add data source indicator
          if (assistantMessage.type === 'cached_search') {
            formattedMessage += '\n\n*Results from cache*';
          }
        } else {
          // Fallback for other object types
          formattedMessage = JSON.stringify(assistantMessage, null, 2);
        }
      } else {
        formattedMessage = 'Response received';
      }
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        message: formattedMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMsg, assistantMsg]);
      console.log('🔍 FULL SCREEN CHAT: Added messages via ref:', {
        userMessage: userMessage.substring(0, 50) + '...',
        assistantMessage: formattedMessage.substring(0, 50) + '...',
        messageType: typeof assistantMessage
      });
    }
  }), []);

  // Initialize with provided query/response
  useEffect(() => {
    if (initialQuery && initialResponse) {
      let responseMessage: string;
      
      // Handle structured barcode scan data
      if (typeof initialResponse === 'object' && initialResponse.type === 'barcode_analysis') {
        const barcodeData = initialResponse.data;
        
        // Format the comprehensive analysis for display
        responseMessage = `**${barcodeData.product_info?.name || 'Product'} Analysis**\n\n`;
        
        if (barcodeData.analysis?.summary) {
          responseMessage += `${barcodeData.analysis.summary}\n\n`;
        }
        
        if (barcodeData.health_score) {
          responseMessage += `**Health Score:** ${barcodeData.health_score}/100\n`;
        }
        
        if (barcodeData.nova_group) {
          responseMessage += `**Processing Level:** NOVA Group ${barcodeData.nova_group}\n\n`;
        }
        
        if (barcodeData.analysis?.recommendations?.length > 0) {
          responseMessage += `**Recommendations:**\n`;
          barcodeData.analysis.recommendations.forEach((rec: string) => {
            responseMessage += `• ${rec}\n`;
          });
          responseMessage += '\n';
        }
        
        if (barcodeData.nutrition_facts) {
          const nutrition = barcodeData.nutrition_facts;
          responseMessage += `**Nutrition Facts (per ${nutrition.serving_size || '100g'}):**\n`;
          responseMessage += `• Calories: ${nutrition.calories}\n`;
          responseMessage += `• Protein: ${nutrition.protein_g}g\n`;
          responseMessage += `• Carbohydrates: ${nutrition.carbohydrates_g}g\n`;
          responseMessage += `• Fat: ${nutrition.fat_g}g\n`;
          if (nutrition.fiber_g > 0) responseMessage += `• Fiber: ${nutrition.fiber_g}g\n`;
          if (nutrition.sugar_g > 0) responseMessage += `• Sugar: ${nutrition.sugar_g}g\n`;
          if (nutrition.sodium_mg > 0) responseMessage += `• Sodium: ${nutrition.sodium_mg}mg\n`;
        }
      } else {
        // Handle traditional string response
        responseMessage = typeof initialResponse === 'string' ? initialResponse : JSON.stringify(initialResponse);
      }
      
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
          message: responseMessage,
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
      // Get AI response using the updated API
      const response = await chatService.sendMessage(messageText);
      
      let aiResponse: string;
      let metadata: any = {};
      
      // Handle the new API response structure
      if (response && typeof response === 'object') {
        // Check if it's the new ChatResponse format (from /ask endpoint)
        if ('response' in response && 'type' in response && 'source' in response) {
          // New API structure with response, type, source, confidence
          const chatResp = response as any; // Type assertion since we checked the properties
          aiResponse = chatResp.response;
          metadata = {
            type: chatResp.type || 'unknown',
            source: chatResp.source || 'unknown',
            confidence: chatResp.confidence || 0,
            processing_time: chatResp.processing_time || 0
          };
          console.log('🔍 FULL SCREEN CHAT: New API response metadata:', metadata);
        } else if ('data' in response && typeof response.data === 'string') {
          aiResponse = response.data;
        } else if ('analysis' in response && typeof response.analysis === 'string') {
          aiResponse = response.analysis;
        } else if ('message' in response && typeof response.message === 'string') {
          aiResponse = response.message;
        } else if ('response' in response && typeof response.response === 'string') {
          aiResponse = response.response;
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
    <>
      {/* Backdrop overlay for both mobile and desktop */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }} onClick={onClose} />

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: isMobile ? '100vw' : 'auto',
        height: isMobile ? '100vh' : 'auto',
        backgroundColor: '#ffffff',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        transform: `translateX(${isOpen ? '0' : '100%'})`,
        transition: 'transform 0.3s ease-in-out'
      }}>

      {/* Chat History Sidebar - show when explicitly toggled */}
      {((isMobile && showMobileHistory) || (!isMobile && showDesktopHistory)) && (
        <div style={{
          width: isMobile ? '100%' : '280px',
          height: '100%',
          backgroundColor: '#f8faff',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'absolute',
          top: '0',
          left: '0',
          zIndex: isMobile ? 100 : 105
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
          <button
            onClick={() => {
              if (isMobile) {
                setShowMobileHistory(false);
              } else {
                setShowDesktopHistory(false);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              fontSize: '16px',
              color: '#666'
            }}
            title="Close History"
          >
            ✕
          </button>
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
            {shouldShowHistory ? (
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
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  No Chat History
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  lineHeight: '1.5'
                }}>
                  Create an account or login to start tracking your chat history
                </div>
              </div>
            )}

            {/* Previous Chats */}
            {shouldShowHistory && ['Health and nutrition basics', 'Exercise routine planning', 'Sleep optimization tips', 'Stress management techniques'].map((chat, index) => (
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
        height: '100%',
        overflow: 'hidden'
      }}>

        {/* Top Navigation Bar with Toggle History and View Charts */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#f8faff',
          minHeight: '40px'
        }}>
          {/* Left side - Toggle History Button */}
          <button
            onClick={() => {
              if (isMobile) {
                setShowMobileHistory(!showMobileHistory);
              } else {
                setShowDesktopHistory(!showDesktopHistory);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '24px'
            }}
            title="Toggle History"
          >
            ☰
          </button>

          {/* Right side - View Charts Button */}
          {onViewCharts && (
            <button
              onClick={onViewCharts}
              className="chat-icon-button"
              title="View Charts"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img 
                src="/assets/Chartlogo.png" 
                alt="View Charts"
                style={{
                  width: '64px',
                  height: '64px',
                  objectFit: 'contain'
                }}
              />
            </button>
          )}
        </div>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '8px 16px' : '12px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: 'fit-content' }}>
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              color: '#1f2937',
              whiteSpace: 'nowrap'
            }}>
              Ask WiHY{' '}
              <span style={{
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: '500',
                color: '#6b7280'
              }}>
                (pro·nounced why)
              </span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Header actions can be added here if needed */}
          </div>
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
    </>
  );
});

export default FullScreenChat;