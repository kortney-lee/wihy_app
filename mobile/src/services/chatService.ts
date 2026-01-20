import { API_CONFIG, getMLAuthHeaders } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import type { ChatResponse, CreatedResource, SuggestedAction } from './types';

/** Session info for chat sessions */
export interface ChatSession {
  session_id: string;
  title: string;
  created_at: string;
  last_activity: string;
  last_message_at?: string;
  message_count: number;
}

/** Message in a chat session */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: string;
  created_resources?: CreatedResource[];
  suggested_actions?: SuggestedAction[];
}

class ChatService {
  private mlBaseUrl: string;
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.mlBaseUrl = API_CONFIG.mlApiUrl; // https://ml.wihy.ai
  }

  /**
   * Get headers for ML API requests
   * Includes optional client identification for analytics/rate limiting
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...getMLAuthHeaders(), // Optional X-Client-ID and X-Client-Secret
    };
  }

  /**
   * Get headers for public/session endpoints (no auth needed)
   */
  private getPublicHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      // Don't include auth headers - public endpoints don't accept them
    };
  }

  /**
   * Get or create session ID for chat continuity
   * Persists session ID across app lifecycle
   */
  private getSessionId(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      let sessionId = localStorage.getItem('wihy_session_id');
      if (!sessionId) {
        sessionId = this.generateUUID();
        localStorage.setItem('wihy_session_id', sessionId);
      }
      return sessionId;
    }
    // Fallback for environments without localStorage
    return this.generateUUID();
  }

  /**
   * Generate UUID v4
   */
  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Ask a health question via /ask endpoint (Universal Health Question)
   * Supports authenticated (Bearer token) and anonymous access (rate-limited)
   * Uses "message" field per API v3.0 spec
   * session_id is REQUIRED for all calls
   */
  async ask(
    query: string,
    context?: {
      product_name?: string;
      nutrition_data?: any;
      session_id?: string;
      productData?: any;
      user_goals?: string[];
      fitness_level?: string;
      dietary_restrictions?: string[];
      user_id?: string;
      [key: string]: any;
    }
  ): Promise<ChatResponse> {
    const startTime = Date.now();
    const endpoint = `${this.mlBaseUrl}${API_CONFIG.endpoints.ask}`;
    
    console.log('=== ASK API CALL (/ask) - v3.0 ===');
    console.log('Endpoint:', endpoint);
    console.log('Query:', query);
    
    try {
      // Build request body matching ML API v3.0 format
      // Required: message, session_id
      const requestBody: any = {
        message: query, // v3.0: renamed from 'query'
        session_id: context?.session_id || this.getSessionId(), // v3.0: required field
        ...(context?.user_id && { user_id: context.user_id }),
      };
      
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Ask API HTTP error ${response.status}:`, errorText);
        console.log('=== ASK FAILED ===');
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response Data:', JSON.stringify(data, null, 2));
      console.log('=== ASK SUCCESS ===');
      
      return this.parseAskResponse(data);
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== ASK ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      console.error('Error message:', error.message);
      return {
        success: false,
        response: '',
        timestamp: new Date().toISOString(),
        error: error.message || 'Failed to get response',
      };
    }
  }

  /**
   * Start a new chat session via /chat/start-session
   * Returns session_id for use in send-message calls
   */
  async startSession(userId: string): Promise<{ session_id: string; user_id: string; created_at: string } | null> {
    const endpoint = `${this.mlBaseUrl}${API_CONFIG.endpoints.chatStartSession}`;
    
    console.log('=== START CHAT SESSION (/chat/start-session) ===');
    console.log('Endpoint:', endpoint);
    console.log('User ID:', userId);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: this.getPublicHeaders(),
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Session API not available, using local session ID');
          const localSessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          return {
            session_id: localSessionId,
            user_id: userId,
            created_at: new Date().toISOString(),
          };
        }
        const errorText = await response.text();
        console.error(`Start Session API HTTP error ${response.status}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Session Started:', data);
      return {
        session_id: data.session_id,
        user_id: data.user_id || userId,
        created_at: data.created_at || new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('=== START SESSION ERROR ===', error);
      const localSessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Fallback: using local session ID:', localSessionId);
      return {
        session_id: localSessionId,
        user_id: userId,
        created_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Send a message in a chat session via /chat/send-message
   * Maintains conversation history on the server
   * Response format: ModalResponse with assistantMessage, actions, entities, etc.
   */
  async sendMessage(
    message: string,
    sessionId: string,
    userId: string,
    context?: {
      user_goals?: string[];
      fitness_level?: string;
      dietary_restrictions?: string[];
      [key: string]: any;
    }
  ): Promise<ChatResponse> {
    const startTime = Date.now();
    const endpoint = `${this.mlBaseUrl}${API_CONFIG.endpoints.chatSendMessage}`;
    
    console.log('=== CHAT SEND MESSAGE (/chat/send-message) ===');
    console.log('Endpoint:', endpoint);
    console.log('Session ID:', sessionId);
    console.log('User ID:', userId);
    console.log('Message:', message);
    
    try {
      const requestBody: any = {
        session_id: sessionId,
        user_id: userId,
        message,
      };
      
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: this.getPublicHeaders(),
        body: JSON.stringify(requestBody),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      if (!response.ok) {
        // If endpoint doesn't exist (404), fall back to public ask
        if (response.status === 404) {
          console.log('Chat send-message API not available, falling back to public/ask');
          return this.ask(message, context);
        }
        const errorText = await response.text();
        console.error(`Chat Send Message API HTTP error ${response.status}:`, errorText);
        console.log('=== CHAT MESSAGE FAILED ===');
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response Data:', JSON.stringify(data, null, 2));
      console.log('=== CHAT MESSAGE SUCCESS ===');
      
      return this.parseSendMessageResponse(data, sessionId);
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== CHAT MESSAGE ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      
      // Fallback to public ask endpoint on any error
      console.log('Falling back to public/ask endpoint');
      return this.ask(message, context);
    }
  }

  /**
   * Get chat history for a session via /chat/session/{session_id}/history
   */
  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const endpoint = `${this.mlBaseUrl}${API_CONFIG.endpoints.chatHistory}/${sessionId}/history`;
    
    console.log('=== GET CHAT HISTORY ===');
    console.log('Endpoint:', endpoint);
    console.log('Session ID:', sessionId);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'GET',
        headers: this.getPublicHeaders(),
      });

      if (!response.ok) {
        console.error(`Get History API HTTP error ${response.status}`);
        return [];
      }

      const data = await response.json();
      console.log('History loaded:', data.total_messages, 'messages');
      return data.messages || [];
    } catch (error: any) {
      console.error('=== GET HISTORY ERROR ===', error);
      return [];
    }
  }

  /**
   * Get list of chat sessions for a user via /chat/user/{user_id}/sessions
   */
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    const endpoint = `${this.mlBaseUrl}${API_CONFIG.endpoints.chatUserSessions}/${userId}/sessions`;
    
    console.log('=== GET USER SESSIONS ===');
    console.log('Endpoint:', endpoint);
    console.log('User ID:', userId);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'GET',
        headers: this.getPublicHeaders(),
      });

      if (!response.ok) {
        console.error(`Get User Sessions API HTTP error ${response.status}`);
        return [];
      }

      const data = await response.json();
      console.log('Sessions loaded:', data.total_sessions);
      return (data.sessions || []).map((s: any) => ({
        session_id: s.session_id,
        title: s.title || `Chat ${new Date(s.created_at).toLocaleDateString()}`,
        created_at: s.created_at,
        last_activity: s.last_message_at || s.created_at,
        last_message_at: s.last_message_at,
        message_count: s.message_count || 0,
      }));
    } catch (error: any) {
      console.error('=== GET USER SESSIONS ERROR ===', error);
      return [];
    }
  }

  /**
   * Resume a previous session by loading its history
   */
  async resumeSession(sessionId: string): Promise<ChatMessage[]> {
    return this.getHistory(sessionId);
  }

  /**
   * @deprecated Use startSession() instead - createSession is legacy
   */
  async createSession(title?: string): Promise<{ session_id: string; title: string } | null> {
    // For backwards compatibility, generate a local session ID
    const localSessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('createSession is deprecated, use startSession(userId) instead');
    return {
      session_id: localSessionId,
      title: title || 'New Chat',
    };
  }

  /**
   * @deprecated Use getUserSessions(userId) instead
   */
  async getSessions(): Promise<ChatSession[]> {
    console.warn('getSessions is deprecated, use getUserSessions(userId) instead');
    return [];
  }

  /**
   * @deprecated Use getHistory(sessionId) instead
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    console.warn('getSessionMessages is deprecated, use getHistory(sessionId) instead');
    return this.getHistory(sessionId);
  }

  /**
   * @deprecated Use sendMessage() for session-based chat instead
   */
  async askFollowUp(
    query: string,
    sessionId: string,
    additionalContext?: any
  ): Promise<ChatResponse> {
    console.warn('askFollowUp is deprecated, use sendMessage() instead');
    return this.ask(query, {
      session_id: sessionId,
      ...additionalContext,
    });
  }

  /**
   * Parse /ask endpoint response (API v2.0)
   * Response includes: type, response, confidence, cached, session_id, recommendations, citations, quick_insights
   */
  private parseAskResponse(data: any): ChatResponse {
    // Parse actions to suggested_actions format
    let suggested_actions: SuggestedAction[] | undefined;
    if (data.actions && Array.isArray(data.actions)) {
      suggested_actions = data.actions.map((action: any) => ({
        action: action.type?.toLowerCase() || action.action,
        label: action.label,
        route: action.payload?.route,
      }));
    }

    // Also check for suggested_actions in top-level response
    if (!suggested_actions && data.suggested_actions && Array.isArray(data.suggested_actions)) {
      suggested_actions = data.suggested_actions;
    }

    return {
      success: data.success !== false,
      // v3.0: Use 'message' field (fallback to old 'response' for compatibility)
      message: data.message || data.response || data.assistantMessage || '',
      response: data.message || data.response || data.assistantMessage || '', // Backward compatibility
      timestamp: data.timestamp || new Date().toISOString(),
      // v3.0: 'type' is required, no longer 'detected_type'
      type: data.type || data.detected_type || 'general',
      detected_type: data.detected_type || data.type, // Backward compatibility
      confidence: data.confidence || 0,
      // v3.0: Required fields renamed
      processing_time_ms: data.processing_time_ms || data.processingTimeMs || 0,
      trace_id: data.trace_id || data.traceId || '',
      session_id: data.session_id,
      user_id: data.user_id,
      source: data.source || 'ask',
      cached: data.cached,
      // Additional fields from ask response
      recommendations: data.recommendations,
      citations: data.citations,
      quick_insights: data.quick_insights,
      suggested_actions,
      created_resources: data.created_resources,
      follow_up_suggestions: data.follow_up_suggestions,
      clarifying_questions: data.clarifying_questions,
      suggested_searches: data.suggested_searches,
    };
  }

  /**
   * Parse /chat/send-message response (ModalResponse format - API v2.0)
   * Response includes: assistantMessage, citations, actions, entities, traceId, conversationId, mode, detectedIntent
   */
  private parseSendMessageResponse(data: any, sessionId: string): ChatResponse {
    // Parse actions from ModalResponse format
    let suggested_actions: SuggestedAction[] | undefined;
    if (data.actions && Array.isArray(data.actions)) {
      suggested_actions = data.actions.map((action: any) => ({
        action: action.type?.toLowerCase() || action.action,
        label: action.label,
        route: action.payload?.route,
      }));
    }
    // Also check modal.actions for backwards compatibility
    if (!suggested_actions && data.modal?.actions && Array.isArray(data.modal.actions)) {
      suggested_actions = data.modal.actions.map((action: any) => ({
        action: action.type?.toLowerCase() || action.action,
        label: action.label,
        route: action.route,
      }));
    }

    return {
      success: data.success !== false,
      response: data.assistantMessage || data.response || '',
      session_id: data.conversationId || sessionId,
      timestamp: data.timestamp || new Date().toISOString(),
      type: data.mode || data.detectedIntent,
      detected_type: data.detectedIntent,
      source: data.service || 'wihy_ai',
      traceId: data.traceId,
      processingTimeMs: data.processingTimeMs,
      suggested_actions,
      citations: data.citations,
      entities: data.entities,
      // Modal info for UI display (backwards compat)
      modal: data.modal,
    };
  }
}

export const chatService = new ChatService();
