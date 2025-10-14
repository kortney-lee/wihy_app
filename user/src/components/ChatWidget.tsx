import React, { useState, useRef, useEffect } from 'react';

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
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onToggle, onClose, currentContext }) => {
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

  // Add contextual message when context changes
  useEffect(() => {
    if (currentContext && isOpen) {
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
  }, [currentContext, isOpen]);

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

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const response = generateContextualResponse(inputMessage, currentContext);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        message: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateContextualResponse = (question: string, context?: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    // Context-aware responses based on current dashboard section
    if (context?.includes('weight')) {
      if (lowerQuestion.includes('bmi') || lowerQuestion.includes('weight')) {
        return 'Your current BMI is 22.4, which falls in the healthy range (18.5-24.9). Your weight trend shows you\'re 3.5kg from your goal of 65kg. The gradual progress indicates a sustainable approach to weight management.';
      }
      if (lowerQuestion.includes('goal') || lowerQuestion.includes('target')) {
        return 'Your weight goal of 65kg represents a 3.5kg reduction from your current weight of 68.5kg. Based on your current trend, you\'re making steady progress. A healthy weight loss rate is 0.5-1kg per week.';
      }
    }

    if (context?.includes('activity')) {
      if (lowerQuestion.includes('steps') || lowerQuestion.includes('walking')) {
        return 'You\'ve taken 8,742 steps today, which is 87% of your 10,000 step goal. Your activity level is good! The WHO recommends at least 150 minutes of moderate activity per week.';
      }
      if (lowerQuestion.includes('calories') || lowerQuestion.includes('burn')) {
        return 'You\'ve burned 2,100 calories today through various activities. Your active minutes (45/60 min goal) show consistent movement throughout the day, which is excellent for metabolic health.';
      }
    }

    if (context?.includes('nutrition')) {
      if (lowerQuestion.includes('calories') || lowerQuestion.includes('food')) {
        return 'Your calorie intake today is 1,850 kcal. Based on your activity level and goals, this appears well-balanced. Your macro breakdown shows good protein intake for muscle maintenance.';
      }
      if (lowerQuestion.includes('protein') || lowerQuestion.includes('macro')) {
        return 'Your macronutrient distribution looks balanced. Protein intake supports muscle maintenance during weight loss. Consider timing protein intake around workouts for optimal results.';
      }
    }

    if (context?.includes('sleep')) {
      if (lowerQuestion.includes('sleep') || lowerQuestion.includes('rest')) {
        return 'You got 7.2 hours of sleep last night with 62% quality score. This meets the 7-9 hour recommendation for adults. The sleep quality could be improved - consider consistent bedtime routines.';
      }
      if (lowerQuestion.includes('quality') || lowerQuestion.includes('deep')) {
        return 'Sleep quality at 62% suggests room for improvement. Deep sleep phases are crucial for recovery. Try reducing screen time before bed and maintaining a cool, dark environment.';
      }
    }

    // General health responses
    if (lowerQuestion.includes('improve') || lowerQuestion.includes('better')) {
      return 'Based on your current metrics, focus areas for improvement include: 1) Increasing daily steps by 1,000-2,000, 2) Improving sleep quality through better sleep hygiene, 3) Maintaining consistent meal timing for better metabolism.';
    }

    if (lowerQuestion.includes('trend') || lowerQuestion.includes('progress')) {
      return 'Your overall health trends are positive! Weight is steadily decreasing, activity levels are consistent, and sleep duration is adequate. Keep focusing on sustainable habits rather than dramatic changes.';
    }

    if (lowerQuestion.includes('recommendation') || lowerQuestion.includes('advice')) {
      return 'My top recommendations: 1) Aim for 8,000+ steps daily, 2) Focus on sleep quality (7-8 hours), 3) Maintain protein intake at 1.6-2.2g/kg body weight, 4) Stay hydrated (2-3L daily). Small, consistent changes yield the best results.';
    }

    // Default response
    return 'I\'d be happy to help explain your health data! You can ask me about your weight trends, activity levels, nutrition intake, sleep quality, or any specific metrics you see on your dashboard. What interests you most?';
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
        position: 'fixed',
        left: '0',
        top: '0',
        width: '350px',
        height: '100vh',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        animation: 'slideInFromLeft 0.3s ease-out',
        boxShadow: '4px 0 12px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 24px',
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
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
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