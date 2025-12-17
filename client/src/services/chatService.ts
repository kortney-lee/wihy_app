/**
 * Chat Service - Dedicated service for ChatWidget functionality
 * Connects to dynamic API endpoint that adapts to mobile/development environment
 * Sessions are optional and only used if they exist
 */

import { API_CONFIG } from '../config/apiConfig';

const CHAT_API_BASE = API_CONFIG.WIHY_API_URL;

export interface ChatRequest {
  query: string;
}

// Updated to match WIHY API documentation
export interface ChatResponse {
  response: string;
  type: string;
  source: string;
  confidence: number;
  timestamp: string;
  processing_time: number;
}

export interface ChatSession {
  session_id: string;
  session_name?: string;
  created_at: string;
  user_id: string;
}

export interface ChatMessageRequest {
  session_id: string;
  message: string;
  message_type?: string;
  use_custom_model?: boolean;
}

export interface ChatMessageResponse {
  success: boolean;
  message_id?: string;
  response?: string;
  model_used?: string;
  confidence_score?: number;
  response_time_ms?: number;
  citations?: string[];
  message: string;
  error?: string;
}

class ChatService {
  private currentSessionId: string | null = null;
  private conversationId: string | null = null;

  /**
   * Send a message using the direct /ask endpoint (primary API endpoint)
   * This aligns with the WIHY API documentation
   * @param query - The message text
   * @param sessionId - Optional session ID for conversation context
   * @param askWihy - Optional pre-formatted query from scan API
   */
  async sendDirectMessage(query: string, sessionId?: string, askWihy?: string): Promise<ChatResponse | null> {
    try {
      console.log('🔍 CHAT SERVICE: Sending message to /ask endpoint');

      const request: any = { query };
      
      // Include session_id if provided for conversation context
      if (sessionId) {
        request.session_id = sessionId;
        console.log('🔍 CHAT SERVICE: Including session_id for conversation context:', sessionId);
      }

      // Include ask_wihy if provided from scan API
      if (askWihy) {
        request.ask_wihy = askWihy;
        console.log('🔍 CHAT SERVICE: Including ask_wihy from scan API');
      }

      console.log('🔍 CHAT SERVICE: Request:', { 
        query: query.substring(0, 100) + '...',
        hasSessionId: Boolean(sessionId)
      });

      const response = await fetch(`${CHAT_API_BASE}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();

      console.log('🔍 CHAT SERVICE: Response received from /ask endpoint:', {
        type: data.type,
        source: data.source,
        confidence: data.confidence,
        responseLength: data.response?.length,
        hasChartData: Boolean((data as any).chart_data)
      });

      return data;

    } catch (error) {
      console.error('Chat service direct message error:', error);
      return null;
    }
  }

  /**
   * Send a message using session-based endpoint (optional, advanced features)
   * Only used if a session already exists
   */
  async sendSessionMessage(
    message: string, 
    messageType: string = 'health_chat',
    useCustomModel: boolean = false
  ): Promise<ChatMessageResponse | null> {
    if (!this.currentSessionId) {
      console.log('🔍 CHAT SERVICE: No session available, falling back to direct message');
      return null;
    }

    try {
      console.log('🔍 CHAT SERVICE: Sending session message:', {
        sessionId: this.currentSessionId,
        message: message.substring(0, 100) + '...',
        messageType,
        useCustomModel
      });

      const request: ChatMessageRequest = {
        session_id: this.currentSessionId,
        message: message,
        message_type: messageType,
        use_custom_model: useCustomModel
      };

      const response = await fetch(`${CHAT_API_BASE}/api/chat/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to send session message: ${response.status} ${response.statusText}`);
      }

      const data: ChatMessageResponse = await response.json();

      console.log('🔍 CHAT SERVICE: Session message response:', {
        success: data.success,
        messageId: data.message_id,
        modelUsed: data.model_used,
        confidenceScore: data.confidence_score,
        responseTime: data.response_time_ms,
        responsePreview: data.response?.substring(0, 100) + '...'
      });

      return data;

    } catch (error) {
      console.error('Chat service session message error:', error);
      return {
        success: false,
        message: 'Failed to send session message',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Primary send message method - uses /ask endpoint with optional session_id
   * @param query - The message text
   * @param sessionId - Optional session ID for conversation context
   */
  async sendMessage(query: string, sessionId?: string): Promise<ChatResponse | ChatMessageResponse | null> {
    // Use the primary /ask endpoint with session_id if provided
    // This enables conversation context while using the main API endpoint
    return await this.sendDirectMessage(query, sessionId || this.currentSessionId || undefined);
  }

  /**
   * Set an existing session ID (optional)
   */
  setSessionId(sessionId: string): void {
    this.currentSessionId = sessionId;
    console.log('🔍 CHAT SERVICE: Session ID set:', sessionId);
  }

  /**
   * Clear current session - will use direct chat
   */
  clearSession(): void {
    this.currentSessionId = null;
    this.conversationId = null;
    console.log('🔍 CHAT SERVICE: Session cleared, using direct chat');
  }

  /**
   * Get current session ID (may be null)
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Get current session ID (alias for getCurrentSessionId)
   */
  getSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Get current conversation ID for direct chat continuity
   */
  getConversationId(): string | null {
    return this.conversationId;
  }

  /**
   * Set user profile for personalized responses in direct chat
   */
  setUserProfile(profile: Record<string, any>): void {
    this.userProfile = profile;
  }

  private userProfile?: Record<string, any>;

  /**
   * Send message with current user profile (simplified - profile handling moved to main API)
   */
  async sendMessageWithProfile(query: string): Promise<ChatResponse | ChatMessageResponse | null> {
    return await this.sendMessage(query);
  }
}

// Create and export singleton instance
export const chatService = new ChatService();

// Export for type usage
export default chatService;