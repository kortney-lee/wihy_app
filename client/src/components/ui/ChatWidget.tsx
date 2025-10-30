import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../../services/chatService';
import '../../styles/VHealthSearch.css';

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
  onNewSearch?: (query: string) => void; // Callback to update main content
  onAddMessage?: (userMessage: string, assistantMessage: string) => void; // Callback to add new messages externally
}

// Global conversation state to persist across component instances
let globalConversation: ChatMessage[] = [];

const ChatWidget: React.FC<ChatWidgetProps> = ({
  isOpen,
  onClose,
  searchQuery,
  searchResponse,
  currentContext,
  inline = false,
  onNewSearch
}) => {
  // Use global conversation state for persistence across navigation
  const [messages, setMessages] = useState<ChatMessage[]>(globalConversation);
  
  // Update global state whenever local messages change
  useEffect(() => {
    globalConversation = messages;
  }, [messages]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isRequestInProgress = useRef(false); // Additional guard for rapid clicks
  const lastSubmissionTime = useRef(0); // Track last submission time to prevent rapid duplicates
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const chatThreadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initializationRef = useRef<string>(''); // Track what query was used for initialization

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

  // Force scroll to bottom (for new user messages and responses)
  const forceScrollToBottom = () => {
    const el = chatThreadRef.current;
    if (!el) return;
    
    // Use requestAnimationFrame to ensure DOM is updated before scrolling
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      
      // Double-check after a small delay to handle any delayed rendering
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 10);
    });
  };

  // Call this when appending a new message
  const appendMessage = (newMessage: ChatMessage) => {
    setMessages(prev => [...prev, newMessage]);
    // Force scroll for user messages and assistant responses, gentle scroll for others
    if (newMessage.type === 'user' || newMessage.type === 'assistant') {
      requestAnimationFrame(forceScrollToBottom);
    } else {
      requestAnimationFrame(scrollToBottomIfPinned);
    }
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

  // Jump to bottom on first load only
  const hasScrolledToBottom = useRef(false);
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledToBottom.current) {
      requestAnimationFrame(() => {
        const el = chatThreadRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight;
          hasScrolledToBottom.current = true;
        }
      });
    }
  }, [messages.length]);

  // Global message addition capability
  useEffect(() => {
    const addChatMessage = (userMessage: string, assistantMessage: string) => {
      console.log('🔍 CHATWIDGET: External message addition', { userMessage, assistantMessage });
      
      const userMsg: ChatMessage = {
        id: Date.now().toString() + '-user',
        type: 'user',
        message: userMessage,
        timestamp: new Date()
      };
      
      const aiMsg: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        message: assistantMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMsg, aiMsg]);
    };

    // Expose global function for external message addition
    (window as any).addChatMessage = addChatMessage;

    return () => {
      delete (window as any).addChatMessage;
    };
  }, []);

  // Initialize conversation with search results if provided
  useEffect(() => {
    // Prevent duplicate initialization - check if we've already processed this exact search
    if (!searchQuery || !searchResponse) {
      return;
    }

    // Check if we've already initialized with this exact search query
    if (initializationRef.current === searchQuery) {
      console.log('🔍 CHATWIDGET: Skipping duplicate initialization for:', searchQuery);
      return;
    }

    // If this is a new search query (different from what we've processed), clear the session
    if (initializationRef.current && initializationRef.current !== searchQuery) {
      console.log('🔍 CHATWIDGET: New search detected, clearing session:', { previous: initializationRef.current, new: searchQuery });
      chatService.clearSession();
    }

    console.log('🔍 CHATWIDGET: Adding new search to conversation:', searchQuery);

    {
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

      const newMessages: ChatMessage[] = [
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

      // Append to existing conversation instead of replacing
      setMessages(prevMessages => [...prevMessages, ...newMessages]);
      initializationRef.current = searchQuery; // Mark this query as processed

      console.log('🔍 CHATWIDGET: Added', newMessages.length, 'messages to conversation');
    }
  }, [searchQuery, searchResponse]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    const messageText = inputMessage.trim();
    if (!messageText || isLoading || isRequestInProgress.current) {
      console.log('🔍 SEND BLOCKED:', { hasMessage: !!messageText, isLoading, inProgress: isRequestInProgress.current });
      return; // Prevent multiple simultaneous sends
    }

    // Additional check: prevent duplicate messages by checking if the same message was just sent
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.type === 'user' && lastMessage.message === messageText) {
      console.log('🔍 DUPLICATE MESSAGE BLOCKED:', messageText);
      return;
    }

    // Prevent rapid successive submissions (within 1 second)
    const now = Date.now();
    if (now - lastSubmissionTime.current < 1000) {
      console.log('🔍 RAPID SUBMISSION BLOCKED:', { timeDiff: now - lastSubmissionTime.current });
      return;
    }
    lastSubmissionTime.current = now;

    const submissionId = Math.random().toString(36).substring(7);
    console.log('🔍 Sending message:', messageText, 'ID:', submissionId);
    setIsLoading(true); // Set loading immediately to block further sends
    isRequestInProgress.current = true; // Additional blocking mechanism

    // Clear conversation ID for fresh responses (prevent backend caching)
    chatService.clearSession();
    console.log('🔍 CHAT WIDGET: Cleared session for fresh conversation (every message)');

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      type: 'user',
      message: messageText,
      timestamp: new Date(),
      context: currentContext
    };

    appendMessage(userMessage);
    setInputMessage(''); // Clear input immediately

    try {
      // Build conversation context from previous messages (keep it simple)
      const conversationHistory = messages.slice(-4)
        .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.message}`)
        .join('\n');

      // Include search results context if available
      let searchContext = '';
      if (searchResponse && typeof searchResponse === 'string' && searchResponse.trim()) {
        searchContext = `\n\nSearch Results Context: ${searchResponse.substring(0, 500)}...`;
      }

      // Create a focused query for conversational responses with better context
      const requestId = Date.now() + Math.random(); // Unique request identifier
      let contextualQuery = `You are a health assistant. Please provide a brief, conversational response (2-3 sentences max) to the user's question: "${userMessage.message}"`;
      
      // Only add search context for the first message in conversation to avoid repetition
      const isFirstMessage = messages.length === 0;
      if (isFirstMessage && searchContext && searchContext.trim()) {
        contextualQuery += `\n\nRelevant search context: ${searchContext.replace('Search Results Context:', '').trim()}`;
      }
      
      // Add recent conversation history (max 2 previous exchanges)
      if (conversationHistory && conversationHistory.trim()) {
        const recentHistory = conversationHistory.split('\n').slice(-4).join('\n'); // Only last 2 exchanges
        contextualQuery += `\n\nRecent conversation: ${recentHistory}`;
      }
      
      contextualQuery += `\n\nPlease respond as a helpful health assistant with a unique, fresh response. Request ID: ${requestId}`;

      console.log('🔍 CHAT WIDGET: Sending contextual query:', contextualQuery.substring(0, 200) + '...');
      console.log('🔍 CHAT WIDGET: Full context debug:', {
        requestId,
        userMessage: userMessage.message,
        isFirstMessage,
        hasConversationHistory: !!conversationHistory,
        hasSearchContext: !!searchContext && isFirstMessage,
        searchContextPreview: searchContext.substring(0, 100) + '...',
        fullQueryLength: contextualQuery.length
      });

      // Use the chat service with simplified options
      const response = await chatService.sendDirectMessage(contextualQuery);

      // Debug: Log the actual response structure
      console.log('🔍 CHAT WIDGET: Raw response received:', response);
      console.log('🔍 CHAT WIDGET: Response type:', typeof response);
      if (response && typeof response === 'object') {
        console.log('🔍 CHAT WIDGET: Response keys:', Object.keys(response));
        if ((response as any).analysis) {
          console.log('🔍 CHAT WIDGET: Analysis object:', (response as any).analysis);
          console.log('🔍 CHAT WIDGET: Analysis keys:', Object.keys((response as any).analysis));
        }
      }

      // DO NOT trigger new search for chat messages - this causes navigation away from chat
      // if (onNewSearch) {
      //   onNewSearch(userMessage.message);
      // }

      // Extract and clean the response - handle dummy data gracefully
      let aiResponse = '';
      if (response && typeof response === 'object') {
        // For /chat endpoint, prioritize analysis.summary
        if ((response as any).analysis?.summary) {
          aiResponse = (response as any).analysis.summary;
        }
        // Handle recommendations array as secondary option
        else if ((response as any).analysis?.recommendations?.length > 0) {
          aiResponse = (response as any).analysis.recommendations[0];
        }
        // Handle standard ChatResponse format (response field)
        else if (response.response) {
          aiResponse = response.response;
        }
        // Handle ChatMessageResponse format  
        else if (response.message) {
          aiResponse = response.message;
        }
        // Fallback to raw JSON (what was causing the issue)
        else {
          console.warn('Unexpected response format:', response);
          aiResponse = 'I received your message but had trouble formatting the response. Could you try asking in a different way?';
        }
      } else if (typeof response === 'string') {
        aiResponse = response;
      } else {
        aiResponse = 'I apologize, but I encountered an issue processing your request. Could you please try again?';
      }

      // Since backend is returning dummy data, provide a better user experience
      // Check if response looks like dummy/placeholder data
      const isDummyData = aiResponse.includes('There is no cure') || 
                         aiResponse.includes('What is healthy?') ||
                         aiResponse.includes('We all have our health problems') ||
                         aiResponse.includes('for our society is determined') ||
                         aiResponse.includes('This is a common sentiment') ||
                         aiResponse.includes('We are not This reflects') ||
                         aiResponse.includes('In this is a restaurant') ||
                         aiResponse.includes('Religious practices') ||
                         aiResponse.includes('This is an answer is not only') ||
                         aiResponse.includes('What is healthy diet and healthy, but is not') ||
                         aiResponse.length < 20;

      if (isDummyData) {
        console.log('🔍 DUMMY DATA DETECTED:', aiResponse.substring(0, 100) + '...');
        // Provide a helpful response based on the user's question
        const userQuery = userMessage.message.toLowerCase();
        if (userQuery.includes('healthy') || userQuery.includes('health')) {
          aiResponse = "Great question about health! Being healthy generally involves maintaining a balanced diet, regular exercise, adequate sleep, and managing stress. What specific aspect of health would you like to explore?";
        } else if (userQuery.includes('diet') || userQuery.includes('nutrition') || userQuery.includes('eat')) {
          aiResponse = "Nutrition is key to good health! A balanced diet with plenty of fruits, vegetables, whole grains, and lean proteins is important. Would you like tips on any specific dietary concerns?";
        } else if (userQuery.includes('exercise') || userQuery.includes('fitness')) {
          aiResponse = "Regular physical activity is essential for health! Aim for at least 150 minutes of moderate exercise per week. What type of activities interest you?";
        } else if (userQuery.includes('food')) {
          aiResponse = "I understand you need food guidance! Focus on whole, unprocessed foods like fruits, vegetables, lean proteins, and whole grains. What specific nutritional goals do you have?";
        } else {
          aiResponse = "I'm here to help with your health questions! The backend is currently in demo mode, but I can provide general guidance on nutrition, exercise, and wellness. What would you like to know?";
        }
        console.log('🔍 REPLACED WITH HELPFUL RESPONSE:', aiResponse);
      } else {
        console.log('🔍 USING BACKEND RESPONSE (not dummy):', aiResponse.substring(0, 100) + '...');
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
      }

      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        message: aiResponse,
        timestamp: new Date()
      };

      appendMessage(aiMessage);
      
      console.log('✅ Message processed successfully');

      // Restore focus to input for continuous conversation
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);

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
      isRequestInProgress.current = false; // Reset progress flag
    }
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
      <div className="chat-input-area">
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
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
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

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* The ONLY scroller - Hide scrollbar but keep functionality */
        .chat-thread {
          height: calc(100vh - 240px);    /* adjust for your header/input */
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }

        /* Hide scrollbar for WebKit browsers */
        .chat-thread::-webkit-scrollbar {
          display: none;
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

        /* Chat-specific input area styling */
        .chat-input-area {
          padding: 16px;
          border-top: 1px solid #ffffff;
          background-color: #ffffff; /* Pure white background */
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

        /* Chat input overrides */
        .chat-input-container .search-input {
          resize: none;
          min-height: 20px;
          max-height: 80px;
          padding-right: 16px;
          background-color: #ffffff !important; /* Ensure pure white background */
        }

        /* Send button styling - now positioned outside animated container */
        .send-button {
          position: relative;
          right: auto;
          top: auto;
          transform: none;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
          flex-shrink: 0;
          min-width: 44px;
          height: 44px;
        }

        .send-button.active {
          background-color: #1a73e8;
          cursor: pointer;
        }

        .send-button.disabled {
          background-color: #d1d5db;
          cursor: not-allowed;
        }

        /* Thinking dots animation */
        .thinking-dots {
          display: inline-flex;
          gap: 1px;
        }

        .thinking-dots span {
          animation: thinking 1.4s infinite ease-in-out;
          opacity: 0.4;
        }

        .thinking-dots span:nth-child(1) {
          animation-delay: 0s;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes thinking {
          0%, 80%, 100% {
            opacity: 0.4;
          }
          40% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;