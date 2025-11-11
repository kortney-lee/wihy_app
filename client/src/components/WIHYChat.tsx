/**
 * Simple WIHY Chat Component
 * Pure implementation following the API guide
 */

import React, { useState, useRef, useEffect } from 'react';
import { useWIHYChat } from '../hooks/useWIHYChat';
import { QUICK_HEALTH_QUESTIONS } from '../services/wihyClientPure';

interface WIHYChatProps {
  className?: string;
  placeholder?: string;
  showQuickQuestions?: boolean;
  onResponse?: (response: any) => void;
}

export const WIHYChat: React.FC<WIHYChatProps> = ({
  className = '',
  placeholder = 'Ask WIHY about health...',
  showQuickQuestions = true,
  onResponse
}) => {
  const [query, setQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    exportConversation
  } = useWIHYChat({ includeCharts: true });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!query.trim() || loading) return;
    
    const response = await sendMessage(query);
    setQuery('');
    
    if (response && onResponse) {
      onResponse(response);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const askQuickQuestion = (question: string) => {
    setQuery(question);
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`wihy-chat ${className}`}>
      {/* Quick Questions */}
      {showQuickQuestions && messages.length === 0 && (
        <div className="quick-questions">
          <h3>Quick Health Questions:</h3>
          <div className="quick-questions-grid">
            {QUICK_HEALTH_QUESTIONS.slice(0, 6).map((question, index) => (
              <button
                key={index}
                className="quick-question-btn"
                onClick={() => askQuickQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message message-${message.type}`}>
            <div className="message-header">
              <strong>{message.type === 'user' ? 'You' : 'WIHY'}</strong>
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
            
            <div className="message-content">
              {message.text}
            </div>

            {/* AI Response Metadata */}
            {message.type === 'ai' && message.data && (
              <div className="message-meta">
                <span className="source">Source: {message.data.source}</span>
                <span className="confidence">
                  Confidence: {Math.round(message.data.confidence * 100)}%
                </span>
                {message.data.processing_time && (
                  <span className="processing-time">
                    {message.data.processing_time.toFixed(1)}s
                  </span>
                )}
              </div>
            )}

            {/* Chart Data */}
            {message.data?.chart_data?.chart_metadata && (
              <div className="chart-metadata">
                <h4>📊 Research Analysis:</h4>
                <div className="metadata-grid">
                  <div>
                    <strong>Quality Score:</strong> 
                    {message.data.chart_data.chart_metadata.research_quality_score}/100
                  </div>
                  <div>
                    <strong>Evidence Grade:</strong> 
                    {message.data.chart_data.chart_metadata.evidence_grade}
                  </div>
                  <div>
                    <strong>Studies:</strong> 
                    {message.data.chart_data.chart_metadata.study_count}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="message message-loading">
            <div className="message-content">
              <span className="loading-text">WIHY is thinking...</span>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="message message-error">
            <div className="message-content">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="input-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={loading}
            className="chat-input"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !query.trim()}
            className="send-button"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        <div className="chat-controls">
          <button
            onClick={clearMessages}
            disabled={loading || messages.length === 0}
            className="clear-button"
          >
            Clear Chat
          </button>
          <button
            onClick={() => {
              const exported = exportConversation();
              const blob = new Blob([exported], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `wihy-conversation-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={loading || messages.length === 0}
            className="export-button"
          >
            Export
          </button>
        </div>
      </div>

      {/* Conversation Stats */}
      {messages.length > 0 && (
        <div className="conversation-stats">
          Messages: {messages.length} | 
          Session: {new Date().toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

/**
 * Simple WIHY Question Component (no conversation state)
 */
interface WIHYQuestionProps {
  question: string;
  onResponse: (response: any) => void;
  buttonText?: string;
  disabled?: boolean;
}

export const WIHYQuestion: React.FC<WIHYQuestionProps> = ({
  question,
  onResponse,
  buttonText = 'Ask WIHY',
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://ml.wihy.ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: question,
          include_charts: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      onResponse(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wihy-question">
      <button
        onClick={handleAsk}
        disabled={disabled || loading}
        className="wihy-question-button"
      >
        {loading ? 'Asking WIHY...' : buttonText}
      </button>
      {error && (
        <div className="wihy-question-error">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default WIHYChat;