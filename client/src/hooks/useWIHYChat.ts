/**
 * React Hook for WIHY API Integration
 * Provides easy state management for WIHY chat functionality
 */

import { useState, useCallback } from 'react';
import { WIHYClient, WIHYResponse, ConversationMessage } from '../services/wihyClientPure';

export interface UseWIHYChatOptions {
  includeCharts?: boolean;
  conversationId?: string;
}

export interface UseWIHYChatReturn {
  messages: ConversationMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (query: string) => Promise<WIHYResponse | null>;
  analyzeContent: (content: string, contentType?: string) => Promise<WIHYResponse | null>;
  clearMessages: () => void;
  exportConversation: () => string;
}

/**
 * Hook for WIHY chat functionality
 */
export function useWIHYChat(options: UseWIHYChatOptions = {}): UseWIHYChatReturn {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client] = useState(() => new WIHYClient());

  const sendMessage = useCallback(async (query: string): Promise<WIHYResponse | null> => {
    if (!query.trim() || loading) return null;

    setLoading(true);
    setError(null);

    // Add user message
    const userMessage: ConversationMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      text: query,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Convert conversationId to user_context object for new API
      const userContext = options.conversationId ? {
        conversation_id: options.conversationId
      } : undefined;

      const response = await client.askWithContext(
        query, 
        options.includeCharts ?? true,
        userContext
      );

      // Handle response.response which can be string or object
      const responseText = typeof response.response === 'string' 
        ? response.response 
        : JSON.stringify(response.response);

      // Add AI response
      const aiMessage: ConversationMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        text: responseText,
        timestamp: new Date(),
        data: response
      };

      setMessages(prev => [...prev, aiMessage]);
      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Add error message to chat
      const errorMsg: ConversationMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        text: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMsg]);
      return null;
      
    } finally {
      setLoading(false);
    }
  }, [loading, client, options.includeCharts, options.conversationId]);

  const analyzeContent = useCallback(async (
    content: string, 
    contentType: string = 'health content'
  ): Promise<WIHYResponse | null> => {
    const query = `Please analyze this ${contentType}: ${content}`;
    return sendMessage(query);
  }, [sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    client.clearConversationHistory();
  }, [client]);

  const exportConversation = useCallback(() => {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      total_messages: messages.length,
      messages: messages
    }, null, 2);
  }, [messages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    analyzeContent,
    clearMessages,
    exportConversation
  };
}

/**
 * Hook for simple WIHY questions (no conversation state)
 */
export function useWIHYQuestion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client] = useState(() => new WIHYClient());

  const askQuestion = useCallback(async (query: string): Promise<WIHYResponse | null> => {
    if (!query.trim() || loading) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await client.ask(query, true);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loading, client]);

  return {
    askQuestion,
    loading,
    error
  };
}