import React, { useState, useRef, useEffect } from 'react';
import { wihyAPI } from '../services/wihyAPI';
import { logger } from '../utils/logger';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  context?: string; // What the user was viewing when they asked
}

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  currentContext?: string; // Current dashboard section being viewed
  inline?: boolean; // Whether to render inline or as fixed overlay
  externalMessage?: { query: string; response: string } | null; // External message to add
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onToggle, onClose, currentContext, inline = false, externalMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      message: 'Hi! I\'m your health assistant. I can help explain your dashboard data and answer questions about your health metrics. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add external message when provided
  useEffect(() => {
    if (externalMessage && isOpen) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        message: externalMessage.query,
        timestamp: new Date()
      };
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        message: externalMessage.response,
        timestamp: new Date()
      };
      
      // Replace existing messages with the external conversation
      setMessages([
        {
          id: '1',
          type: 'assistant',
          message: 'Hi! I\'m your health assistant. I can help explain your dashboard data and answer questions about your health metrics. What would you like to know?',
          timestamp: new Date()
        },
        userMessage,
        assistantMessage
      ]);
    }
  }, [externalMessage, isOpen]);

  // Add contextual message when context changes (but not when external message is provided)
  useEffect(() => {
    if (currentContext && isOpen && !externalMessage) {
      const contextualMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        message: `I see you're looking at your ${currentContext}. I can help explain these metrics, identify trends, or answer any questions about this data. What would you like to know?`,
        timestamp: new Date(),
        context: currentContext
      };
      
      // Only add if it's not the same as the last message
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.context === currentContext) {
          return prev; // Don't duplicate context messages
        }
        return [...prev, contextualMessage];
      });
    }
  }, [currentContext, isOpen, externalMessage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage.trim(),
      timestamp: new Date(),
      context: currentContext
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Use WiHy API for chat responses
      logger.debug('ChatWidget: Making WiHy API request for:', inputMessage.trim());
      
      const wihyResponse = await wihyAPI.searchHealth(inputMessage.trim(), {
        // Add context if available
        health_concerns: currentContext ? [currentContext] : undefined
      });

      logger.debug('ChatWidget: WiHy API full response:', wihyResponse);

      let responseMessage = 'I apologize, but I encountered an issue processing your request. Please try again.';

      if (wihyResponse.success) {
        // Handle both new unified response format and legacy format
        if ((wihyResponse as any).data && (wihyResponse as any).data.response) {
          // New unified API response format
          const data = (wihyResponse as any).data;
          responseMessage = data.response;
          if (data.recommendations && data.recommendations.length > 0) {
            responseMessage += '\n\n**Recommendations:**\n' + 
              data.recommendations.map((r: string) => `• ${r}`).join('\n');
          }
          logger.debug('ChatWidget: Using new unified format response');
        } else if ('wihy_response' in wihyResponse) {
          // Legacy format - use existing formatter
          responseMessage = wihyAPI.formatWihyResponse(wihyResponse);
          logger.debug('ChatWidget: Using legacy format response');
        } else {
          // Fallback to dedicated chat formatter
          responseMessage = wihyAPI.formatUnifiedResponseForChat(wihyResponse as any);
          logger.debug('ChatWidget: Using chat formatter fallback');
        }
        logger.debug('ChatWidget: Final response message:', responseMessage);
      } else {
        logger.warn('ChatWidget: WiHy API request failed');
        // Fallback to contextual response
        responseMessage = generateContextualResponse(inputMessage.trim(), currentContext);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        message: responseMessage,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    } catch (error) {
      logger.error('ChatWidget: Error getting AI response:', error);

      // Fallback to contextual response on error
      const fallbackMessage = generateContextualResponse(inputMessage.trim(), currentContext);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        message: fallbackMessage,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }
  };

  const generateContextualResponse = (question: string, context?: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    // Context-aware responses based on current dashboard section
    if (context?.includes('nutrition') || context?.includes('food')) {
      if (lowerQuestion.includes('calories') || lowerQuestion.includes('nutrition')) {
        return 'Based on your search results, I can help you understand the nutritional information. The data shows detailed breakdowns of calories, macronutrients, and other important dietary factors. Would you like me to explain any specific nutritional values?';
      }
      if (lowerQuestion.includes('protein') || lowerQuestion.includes('carb') || lowerQuestion.includes('fat')) {
        return 'I can help you understand the macronutrient breakdown in your search results. The nutrition data shows the distribution of proteins, carbohydrates, and fats. Would you like specific recommendations for optimizing these ratios?';
      }
    }
    
    if (context?.includes('search') || context?.includes('results')) {
      if (lowerQuestion.includes('quality') || lowerQuestion.includes('reliable')) {
        return 'The search results quality chart shows how reliable and comprehensive the information is. It takes into account factors like source credibility, data completeness, and scientific backing. What specific aspect of the results would you like me to explain?';
      }
      if (lowerQuestion.includes('chart') || lowerQuestion.includes('graph')) {
        return 'The charts on the right show different aspects of your search results - including result quality metrics and nutritional breakdowns when applicable. Which chart would you like me to explain in detail?';
      }
    }

    // General health responses
    if (lowerQuestion.includes('help') || lowerQuestion.includes('what can you do')) {
      return "I can help you with:\n• Understanding your search results and health information\n• Explaining charts and data visualizations\n• Providing context about nutritional data\n• Answering questions about health topics\n• Suggesting related information to explore\n\nWhat would you like to know more about?";
    }
    
    if (lowerQuestion.includes('nutrition') || lowerQuestion.includes('food') || lowerQuestion.includes('diet')) {
      return "I can analyze nutritional data from your search results and help you understand dietary information. I can explain calories, macronutrients, vitamins, and suggest improvements. What specific nutrition question do you have?";
    }
    
    if (lowerQuestion.includes('health') || lowerQuestion.includes('wellness')) {
      return "I can help you understand the health information in your search results. I can explain medical terms, provide context for health metrics, and offer evidence-based insights. What health topic interests you most?";
    }
    
    if (lowerQuestion.includes('recommend') || lowerQuestion.includes('suggest') || lowerQuestion.includes('advice')) {
      return "Based on your search results, I can provide personalized recommendations and insights. I can suggest related topics to explore, explain complex information, or help you understand how to apply this information. What area would you like recommendations for?";
    }

    // Default responses
    const defaultResponses = [
      "I'm here to help you understand your search results! Could you tell me more about what specific aspect you'd like to explore?",
      "I can provide insights about your health search results. What would you like to know more about?",
      "Great question! I can help explain the information in your search results. Could you be more specific about what you're looking for?",
      "I'd love to help you with that. Which part of the search results or health information would you like me to explain?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return null; // Don't show toggle button when closed
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
      {/* Header */}
      <div style={{
        padding: inline ? '16px 20px' : '20px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/assets/wihyfavicon.png" 
            alt="WiHy Assistant"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '2px solid #e5e7eb',
              backgroundColor: 'white',
              padding: '4px'
            }}
          />
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
              WiHy Health Assistant
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {currentContext ? `Analyzing: ${currentContext}` : 'Online • Ready to help'}
            </div>
          </div>
        </div>
        {!inline && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: inline ? '12px 16px' : '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
              gap: '8px',
              alignItems: 'flex-start'
            }}
          >
            {message.type === 'user' ? (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                U
              </div>
            ) : (
              <img 
                src="/assets/wihyfavicon.png" 
                alt="WiHy"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  padding: '2px',
                  flexShrink: 0
                }}
              />
            )}
            <div style={{
              maxWidth: '75%',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{
                backgroundColor: message.type === 'user' ? '#10b981' : '#f3f4f6',
                color: message.type === 'user' ? 'white' : '#1f2937',
                padding: '12px 16px',
                borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {message.message}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#9ca3af',
                textAlign: message.type === 'user' ? 'right' : 'left',
                paddingLeft: message.type === 'user' ? '0' : '16px',
                paddingRight: message.type === 'user' ? '16px' : '0'
              }}>
                {formatTime(message.timestamp)}
                {message.context && (
                  <span style={{ marginLeft: '8px', fontStyle: 'italic' }}>
                    • viewing {message.context}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#1a73e8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              WH
            </div>
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '12px 16px',
              borderRadius: '18px 18px 18px 4px',
              display: 'flex',
              gap: '4px',
              alignItems: 'center'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#9ca3af',
                animation: 'typing 1.5s ease-in-out infinite'
              }} />
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#9ca3af',
                animation: 'typing 1.5s ease-in-out infinite 0.2s'
              }} />
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#9ca3af',
                animation: 'typing 1.5s ease-in-out infinite 0.4s'
              }} />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #f3f4f6',
        backgroundColor: '#fafbfc'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your health data..."
            style={{
              flex: 1,
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              resize: 'none',
              minHeight: '20px',
              maxHeight: '80px',
              fontFamily: 'inherit',
              outline: 'none'
            }}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            style={{
              backgroundColor: inputMessage.trim() ? '#1a73e8' : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;