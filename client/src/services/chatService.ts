/**
 * Chat Service - Dedicated service for ChatWidget functionality
 * Connects to http://localhost:8000 with direct chat endpoint (no session required)
 * Sessions are optional and only used if they exist
 */

const CHAT_API_BASE = 'http://localhost:8000';

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  user_profile?: Record<string, any>;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  model_used?: string;
  confidence_score?: number;
  response_time_ms?: number;
  citations?: string[];
  session_token?: string;
  message?: string;
  error?: string;
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
   * Send a message using the direct chat endpoint (no session required)
   * This is the primary method for simple health questions
   */
  async sendDirectMessage(
    message: string, 
    userProfile?: Record<string, any>
  ): Promise<ChatResponse | null> {
    try {
      console.log('🔍 CHAT SERVICE: Sending message');

      // Add unique identifier to break backend caching while preserving message meaning
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(7);
      
      // Add the unique elements at the end in a way that won't affect the AI's response
      const uniqueMessage = `${message}\n\n[System: Request ID ${uniqueId} at ${timestamp}]`;
      
      // Always use /chat endpoint for ChatWidget conversations
      const endpoint = 'chat';
      
      const request = {
        message: uniqueMessage,
        conversation_id: this.conversationId,
        user_profile: userProfile
      };

      console.log('🔍 CHAT SERVICE: Sending unique message:', {
        originalMessage: message,
        uniqueMessage: uniqueMessage.substring(0, 100) + '...',
        timestamp,
        uniqueId,
        endpoint: 'chat'
      });

      const response = await fetch(`${CHAT_API_BASE}/chat?t=${timestamp}&r=${uniqueId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();

      console.log('🔍 CHAT SERVICE: Response received from /chat endpoint');
      console.log('🔍 CHAT SERVICE: Backend response structure:', {
        hasAnalysis: !!(data as any).analysis,
        hasSummary: !!(data as any).analysis?.summary,
        hasRecommendations: !!(data as any).analysis?.recommendations,
        hasResponse: !!data.response,
        responseKeys: Object.keys(data),
        analysisKeys: (data as any).analysis ? Object.keys((data as any).analysis) : []
      });

      // Store conversation ID for continuity (if provided)
      if (data.session_token) {
        this.conversationId = data.session_token;
      }

      return data;

    } catch (error) {
      console.error('Chat service direct message error:', error);
      return {
        success: false,
        response: 'Failed to send message',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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
   * Primary send message method - tries session first, falls back to direct
   */
  async sendMessage(
    message: string, 
    userProfile?: Record<string, any>,
    useCustomModel: boolean = false
  ): Promise<ChatResponse | ChatMessageResponse | null> {
    // Try session-based chat first if session exists
    if (this.currentSessionId) {
      const sessionResponse = await this.sendSessionMessage(message, 'health_chat', useCustomModel);
      if (sessionResponse?.success) {
        return sessionResponse;
      }
    }

    // Fall back to direct chat (no session required)
    return await this.sendDirectMessage(message, userProfile);
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
   * Send message with current user profile
   */
  async sendMessageWithProfile(message: string): Promise<ChatResponse | ChatMessageResponse | null> {
    return await this.sendMessage(message, this.userProfile);
  }
}

// Create and export singleton instance
export const chatService = new ChatService();

// Export for type usage
export default chatService;