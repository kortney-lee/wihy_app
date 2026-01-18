import { API_CONFIG } from './config';
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
   * Ask a quick question via /api/chat/public/ask endpoint (Home screen)
   * This is the stateless Ask endpoint - no session needed, no auth required
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
      [key: string]: any;
    }
  ): Promise<ChatResponse> {
    const startTime = Date.now();
    const endpoint = `${this.mlBaseUrl}${API_CONFIG.endpoints.ask}`;
    
    console.log('=== ASK API CALL (Public) ===');
    console.log('Endpoint:', endpoint);
    console.log('Query:', query);
    
    try {
      // Build request body matching ML API format - uses "message" field
      const requestBody: any = {
        message: query,
      };
      
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
   * Start a new chat session via /api/chat/start-session
   * Returns session_id for use in send-message calls
   */
  async startSession(userId: string): Promise<{ session_id: string; user_id: string; created_at: string } | null> {
    const endpoint = `${this.mlBaseUrl}${API_CONFIG.endpoints.chatStartSession}`;
    
    console.log('=== START CHAT SESSION ===');
    console.log('Endpoint:', endpoint);
    console.log('User ID:', userId);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
   * Send a message in a chat session via /api/chat/send-message
   * Maintains conversation history on the server
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
    
    console.log('=== CHAT SEND MESSAGE ===');
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
        headers: {
          'Content-Type': 'application/json',
        },
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
   * Get chat history for a session via /api/chat/session/{session_id}/history
   */
  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const endpoint = `${this.mlBaseUrl}${API_CONFIG.endpoints.chatHistory}/${sessionId}/history`;
    
    console.log('=== GET CHAT HISTORY ===');
    console.log('Session ID:', sessionId);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
   * Get list of chat sessions for a user via /api/chat/user/{user_id}/sessions
   */
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    const endpoint = `${this.mlBaseUrl}${API_CONFIG.endpoints.chatUserSessions}/${userId}/sessions`;
    
    console.log('=== GET USER SESSIONS ===');
    console.log('User ID:', userId);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
   * Parse /api/chat/public/ask response
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

    return {
      success: data.success !== false,
      response: data.assistantMessage || data.response || '',
      timestamp: new Date().toISOString(),
      type: data.mode || data.detectedIntent,
      detected_type: data.detectedIntent,
      source: 'ask',
      // Additional fields from ask response
      traceId: data.traceId,
      processingTimeMs: data.processingTimeMs,
      suggested_actions,
    };
  }

  /**
   * Parse /api/chat/send-message response
   */
  private parseSendMessageResponse(data: any, sessionId: string): ChatResponse {
    // Parse modal actions if present
    let suggested_actions: SuggestedAction[] | undefined;
    if (data.modal?.actions && Array.isArray(data.modal.actions)) {
      suggested_actions = data.modal.actions.map((action: any) => ({
        action: action.type?.toLowerCase() || action.action,
        label: action.label,
        route: action.route,
      }));
    }

    return {
      success: true,
      response: data.assistantMessage || data.response || '',
      session_id: sessionId,
      timestamp: data.timestamp || new Date().toISOString(),
      type: data.detectedIntent,
      detected_type: data.detectedIntent,
      source: data.service || 'wihy_ai',
      suggested_actions,
      // Modal info for UI display
      modal: data.modal,
    };
  }
}

export const chatService = new ChatService();
