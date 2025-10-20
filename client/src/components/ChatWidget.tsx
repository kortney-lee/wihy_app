import React, { useState, useRef, useEffect } from 'react';
import { wihyAPI } from '../services/wihyAPI';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  context?: string;
}

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery?: string;
  searchResponse?: string;
  currentContext?: string; // Current dashboard section being viewed
  inline?: boolean; // Whether to render inline or as fixed overlay
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose, searchQuery, searchResponse, currentContext, inline = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const chatThreadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Cache measured heights so items retain size during prepend
  const heightMap = useRef<Record<string, number>>({});
  const ro = useRef<ResizeObserver>();

  useEffect(() => {
    ro.current = new ResizeObserver(entries => {
      for (const e of entries) {
        const id = (e.target as HTMLElement).dataset.id!;
        heightMap.current[id] = e.contentRect.height;
      }
    });
    return () => ro.current?.disconnect();
  }, []);

  // Attach observer to each rendered message
  const observe = (el: HTMLDivElement | null) => {
    if (!el || !ro.current) return;
    ro.current.observe(el);
  };

  // Keep auto-scrolling to bottom ONLY if user is near bottom
  const scrollToBottomIfPinned = () => {
    const el = chatThreadRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  };

  // Call this when appending a new message
  const appendMessage = (newMessage: ChatMessage) => {
    setMessages(prev => [...prev, newMessage]);
    requestAnimationFrame(scrollToBottomIfPinned);
  };

  // Scroll handler for loading older messages
  const onScroll = () => {
    const el = chatThreadRef.current;
    if (!el) return;
    if (el.scrollTop < 120) loadOlder();
  };

  // Load older messages with viewport anchoring
  const loadOlder = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    const el = chatThreadRef.current;
    if (!el) return;

    setLoadingMore(true);

    // 1) Pick an anchor element (first fully visible)
    const children = Array.from(el.children) as HTMLElement[];
    const anchor =
      children.find(c => c.getBoundingClientRect().top >= el.getBoundingClientRect().top) ??
      (children[0] as HTMLElement);

    const anchorId = anchor?.dataset.id;
    const anchorTopBefore = anchor?.getBoundingClientRect().top ?? 0;

    // 2) Freeze current heights so items "retain their size"
    children.forEach(c => {
      const id = (c as HTMLElement).dataset.id!;
      const h = heightMap.current[id] || c.getBoundingClientRect().height;
      (c as HTMLElement).style.height = `${h}px`;
    });

    // 3) Simulate prepending older items (for now, just mark no more)
    // In a real app, you'd fetch older messages here
    setHasMore(false);

    // 4) After DOM updates, restore the anchor position
    requestAnimationFrame(() => {
      const newAnchor = anchorId
        ? (Array.from(el.children).find(c => (c as HTMLElement).dataset.id === anchorId) as HTMLElement)
        : null;

      const anchorTopAfter = newAnchor?.getBoundingClientRect().top ?? 0;
      const delta = anchorTopAfter - anchorTopBefore;
      el.scrollTop += delta; // shift viewport up by the added height

      // 5) Unfreeze heights (let new messages measure/observe)
      Array.from(el.children).forEach(c => ((c as HTMLElement).style.height = ""));
      setLoadingMore(false);
    });
  };

  // Jump to bottom on first load
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        const el = chatThreadRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages.length]);

  // Initialize conversation with search results if provided
  useEffect(() => {
    if (searchQuery && searchResponse && messages.length === 0) {
      // Create a conversational summary instead of full response
      let conversationalSummary = searchResponse;
      
      // Extract key points and make it conversational
      if (searchResponse.includes('WIHY Health')) {
        const lines = searchResponse.split('\n').filter(line => line.trim());
        const keyPoints = lines
          .filter(line => line.includes('•') || line.includes('-'))
          .slice(0, 2)
          .map(line => line.replace(/[•-]/g, '').trim())
          .join('. ');
          
        conversationalSummary = keyPoints || 'I found some helpful information for you!';
        conversationalSummary += ' What specific aspect would you like to explore further?';
      }
      
      const initialMessages: ChatMessage[] = [
        {
          id: Date.now().toString() + '-user',
          type: 'user',
          message: searchQuery,
          timestamp: new Date()
        },
        {
          id: Date.now().toString() + '-assistant',
          type: 'assistant',
          message: conversationalSummary,
          timestamp: new Date()
        }
      ];
      setMessages(initialMessages);
    }
  }, [searchQuery, searchResponse, messages.length]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      type: 'user',
      message: inputMessage.trim(),
      timestamp: new Date(),
      context: currentContext
    };

    appendMessage(userMessage);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation context from previous messages
      const conversationHistory = messages.slice(-4) // Last 4 messages for context
        .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.message}`)
        .join('\n');
      
      // Create a focused query for conversational responses
      const contextualQuery = `Please provide a brief, conversational response (2-3 sentences max) to: ${userMessage.message}${conversationHistory ? `\n\nContext from our conversation: ${conversationHistory}` : ''}`;

      const response = await wihyAPI.askAnything({
        query: contextualQuery,
        user_context: {
          conversation_mode: true,
          response_style: 'concise',
          conversation_context: conversationHistory,
          current_context: currentContext,
          is_followup: messages.length > 0
        }
      });

      // Extract just the main response without full formatting
      let aiResponse = '';
      if ('success' in response && 'data' in response && response.data && 'response' in response.data) {
        const healthResp = response as any;
        aiResponse = healthResp.data.response;
        
        // Clean up the response to be more conversational
        aiResponse = aiResponse
          .replace(/🥗.*?\*\*/g, '') // Remove emoji headers
          .replace(/\*\*.*?\*\*/g, '') // Remove bold formatting
          .replace(/📋.*?:/g, '') // Remove section headers
          .replace(/•/g, '-') // Replace bullets
          .split('\n')
          .filter(line => line.trim() && !line.includes('Biblical') && !line.includes('Corinthians'))
          .slice(0, 3) // Take first 3 meaningful lines
          .join(' ')
          .trim();
          
        // If response is too long, truncate and add follow-up prompt
        if (aiResponse.length > 200) {
          aiResponse = aiResponse.substring(0, 200).trim() + '... What would you like to know more about?';
        }
      } else {
        aiResponse = wihyAPI.formatWihyResponse(response);
      }
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        message: aiResponse,
        timestamp: new Date()
      };

      appendMessage(aiMessage);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        message: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      appendMessage(errorMessage);
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
  
  if (!isOpen) {
    return null;
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header - now inside the component */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 16px 16px 16px',
        borderBottom: '1px solid #f3f4f6'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '600',
          color: '#1f2937'
        }}>
          WiHy Health Response
        </h2>
        <span style={{
          fontSize: '12px',
          color: '#6b7280',
          backgroundColor: '#f3f4f6',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          AI-Powered
        </span>
      </div>

      {/* Messages - Clean scroll pattern with viewport anchoring */}
      <div 
        ref={chatThreadRef}
        className="chat-thread"
        onScroll={onScroll}
        style={{
          height: 'calc(100vh - 240px)', // Fixed height based on viewport
          overflowY: 'auto',
          overscrollBehavior: 'contain', // Prevent body scroll chaining
          scrollBehavior: 'smooth',      // Nice bottom scroll on new msg
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
        
        {/* Loading indicator for older messages */}
        {loadingMore && hasMore && (
          <div style={{ textAlign: "center", padding: "6px 0" }}>Loading…</div>
        )}
        
        {messages.length === 0 ? (
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
              💬
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              Start a health conversation
            </div>
            <div style={{
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              Ask any health question to begin learning
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              data-id={message.id}
              className="chat-message"
              ref={observe}
              style={{
                flex: '0 0 auto',         // Don't shrink or stretch
                overflow: 'visible',      // Important: no nested scrollbars
                maxHeight: 'none',        // Remove any fixed max-height
                display: 'flex',
                flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                gap: '10px',
                padding: '10px 0',
                alignItems: 'flex-start',
                contain: 'content'        // Micro-optimization
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
                <div 
                  className="bubble"
                  style={{
                    backgroundColor: message.type === 'user' ? '#10b981' : '#f3f4f6',
                    color: message.type === 'user' ? 'white' : '#1f2937',
                    padding: '12px 16px',
                    borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    overflow: 'visible',        // Clean pattern: no bubble scrolling
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere'    // Handle super-long tokens/URLs
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
          ))
        )}
        
        {isLoading && (
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start'
          }}>
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
            ref={inputRef}
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
            disabled={!inputMessage.trim() || isLoading}
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

        /* The ONLY scroller */
        .chat-thread {
          height: calc(100vh - 240px);    /* adjust for your header/input */
          overflow-y: auto;
          overscroll-behavior: contain;
        }

        /* Each message keeps its size and never creates its own scrollbar */
        .chat-message {
          flex: 0 0 auto;                 /* don't shrink or stretch */
          overflow: visible;              /* prevent inner scrollbars */
          max-height: none;
          padding: 10px 0;
        }

        /* Long text wraps (no overflow) */
        .chat-message .bubble {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        /* Kill any legacy scrollbars on messages */
        .chat-message::-webkit-scrollbar { 
          display: none; 
        }
        
        .chat-message {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;