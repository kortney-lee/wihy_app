/**
 * Conversation Service - Full implementation of WIHY Conversation & History Management
 * Based on: WIHY Conversation & History Management Guide v4.1.0
 * API Base: https://ml.wihy.ai
 * 
 * Features:
 * - Multi-session conversation management
 * - Full history retrieval
 * - Context preservation across sessions
 * - Session filtering by topic/time period
 */

import { API_CONFIG } from '../config/apiConfig';

const API_BASE = API_CONFIG.WIHY_API_URL;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SessionContext {
  topic?: 'nutrition' | 'fitness' | 'research' | 'barcode_scanning' | 'general';
  time_of_day?: 'morning' | 'afternoon' | 'evening';
  location?: string;
  goal?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  [key: string]: any; // Allow custom context fields
}

export interface ChatSession {
  session_id: string;
  session_name: string;
  created_at: string;
  updated_at?: string;
  message_count: number;
  context: SessionContext;
}

export interface ChatMessage {
  message_id: string;
  sender: 'user' | 'assistant';
  message: string;
  timestamp: string;
  message_type?: string;
  model_used?: string;
  confidence_score?: number;
  citations?: string[];
  imageUrl?: string;
}

export interface CreateSessionRequest {
  user_id: string;
  session_name: string;
  context?: SessionContext;
}

export interface CreateSessionResponse {
  success: boolean;
  session_id: string;
  session_name: string;
  created_at: string;
  message: string;
}

export interface SendMessageRequest {
  session_id: string;
  message: string;
  message_type?: string;
  imageUrl?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message_id: string;
  response: string;
  model_used?: string;
  confidence_score?: number;
  response_time_ms?: number;
  citations?: string[];
}

export interface SessionListResponse {
  success: boolean;
  user_id: string;
  total_sessions: number;
  sessions: ChatSession[];
}

export interface ConversationHistoryResponse {
  success: boolean;
  session_id: string;
  total_messages: number;
  messages: ChatMessage[];
}

export interface SessionFilters {
  since?: string; // e.g., "7d", "30d"
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  topic?: string;
}

// ============================================================================
// CONVERSATION SERVICE CLASS
// ============================================================================

class ConversationService {
  private currentUserId: string | null = null;
  private currentSessionId: string | null = null;

  // ========================================
  // User Management
  // ========================================

  /**
   * Set the current user ID for all operations
   */
  setUserId(userId: string): void {
    this.currentUserId = userId;
    console.log(' CONVERSATION: User ID set:', userId);
  }

  /**
   * Get the current user ID
   */
  getUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    this.currentUserId = null;
    this.currentSessionId = null;
    console.log(' CONVERSATION: User context cleared');
  }

  // ========================================
  // Session Management
  // ========================================

  /**
   * Create a new conversation session
   * @param sessionName - Human-readable name for the conversation
   * @param context - Optional context to preserve across messages
   */
  async createSession(
    sessionName: string, 
    context?: SessionContext
  ): Promise<CreateSessionResponse | null> {
    if (!this.currentUserId) {
      console.error(' CONVERSATION: Cannot create session - no user ID set');
      return null;
    }

    try {
      console.log(' CONVERSATION: Creating new session:', { sessionName, context });

      const request: CreateSessionRequest = {
        user_id: this.currentUserId,
        session_name: sessionName,
        context: context || { topic: 'general' }
      };

      const response = await fetch(`${API_BASE}/api/chat/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status} ${response.statusText}`);
      }

      const data: CreateSessionResponse = await response.json();
      
      // Set as current session
      this.currentSessionId = data.session_id;

      console.log(' CONVERSATION: Session created:', {
        sessionId: data.session_id,
        sessionName: data.session_name
      });

      return data;

    } catch (error) {
      console.error(' CONVERSATION: Failed to create session:', error);
      return null;
    }
  }

  /**
   * Set the active session ID
   */
  setSessionId(sessionId: string): void {
    this.currentSessionId = sessionId;
    console.log(' CONVERSATION: Active session set:', sessionId);
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Clear the current session (but keep user context)
   */
  clearSession(): void {
    this.currentSessionId = null;
    console.log(' CONVERSATION: Session cleared');
  }

  // ========================================
  // Messaging
  // ========================================

  /**
   * Send a message in the current session
   * @param message - The message text
   * @param messageType - Type of message (default: 'health_chat')
   * @param imageUrl - Optional image URL for image-based queries
   */
  async sendMessage(
    message: string,
    messageType: string = 'health_chat',
    imageUrl?: string
  ): Promise<SendMessageResponse | null> {
    if (!this.currentSessionId) {
      console.error(' CONVERSATION: Cannot send message - no active session');
      return null;
    }

    try {
      console.log(' CONVERSATION: Sending message:', {
        sessionId: this.currentSessionId,
        messagePreview: message.substring(0, 100) + '...',
        messageType,
        hasImage: !!imageUrl
      });

      const request: SendMessageRequest = {
        session_id: this.currentSessionId,
        message: message,
        message_type: messageType
      };

      if (imageUrl) {
        request.imageUrl = imageUrl;
      }

      const response = await fetch(`${API_BASE}/api/chat/message/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }

      const data: SendMessageResponse = await response.json();

      console.log(' CONVERSATION: Message sent successfully:', {
        messageId: data.message_id,
        modelUsed: data.model_used,
        confidenceScore: data.confidence_score,
        responseTimeMs: data.response_time_ms
      });

      return data;

    } catch (error) {
      console.error(' CONVERSATION: Failed to send message:', error);
      return null;
    }
  }

  // ========================================
  // History Retrieval
  // ========================================

  /**
   * Get all messages from a specific session
   * @param sessionId - Session ID (optional, uses current session if not provided)
   */
  async getConversationHistory(
    sessionId?: string
  ): Promise<ConversationHistoryResponse | null> {
    const targetSessionId = sessionId || this.currentSessionId;

    if (!targetSessionId) {
      console.error(' CONVERSATION: Cannot get history - no session ID');
      return null;
    }

    try {
      console.log(' CONVERSATION: Fetching conversation history for session:', targetSessionId);

      const response = await fetch(`${API_BASE}/api/chat/history/${targetSessionId}`);

      if (!response.ok) {
        throw new Error(`Failed to get history: ${response.status} ${response.statusText}`);
      }

      const data: ConversationHistoryResponse = await response.json();

      console.log(' CONVERSATION: History retrieved:', {
        sessionId: data.session_id,
        totalMessages: data.total_messages
      });

      return data;

    } catch (error) {
      console.error(' CONVERSATION: Failed to get history:', error);
      return null;
    }
  }

  /**
   * Get all sessions for the current user
   * @param filters - Optional filters for sessions
   */
  async getAllSessions(
    filters?: SessionFilters
  ): Promise<SessionListResponse | null> {
    if (!this.currentUserId) {
      console.error(' CONVERSATION: Cannot get sessions - no user ID set');
      return null;
    }

    try {
      console.log(' CONVERSATION: Fetching all sessions for user:', this.currentUserId, filters);

      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters?.since) queryParams.append('since', filters.since);
      if (filters?.start_date) queryParams.append('start_date', filters.start_date);
      if (filters?.end_date) queryParams.append('end_date', filters.end_date);
      if (filters?.topic) queryParams.append('topic', filters.topic);

      const queryString = queryParams.toString();
      const url = `${API_BASE}/api/chat/sessions/${this.currentUserId}${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to get sessions: ${response.status} ${response.statusText}`);
      }

      const data: SessionListResponse = await response.json();

      console.log(' CONVERSATION: Sessions retrieved:', {
        userId: data.user_id,
        totalSessions: data.total_sessions
      });

      return data;

    } catch (error) {
      console.error(' CONVERSATION: Failed to get sessions:', error);
      return null;
    }
  }

  /**
   * Get recent sessions (last 7 days by default)
   */
  async getRecentSessions(days: number = 7): Promise<SessionListResponse | null> {
    return this.getAllSessions({ since: `${days}d` });
  }

  /**
   * Get sessions by topic
   */
  async getSessionsByTopic(topic: string): Promise<SessionListResponse | null> {
    return this.getAllSessions({ topic });
  }

  // ========================================
  // Session Operations
  // ========================================

  /**
   * Delete a session
   * @param sessionId - Session ID to delete
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      console.log(' CONVERSATION: Deleting session:', sessionId);

      const response = await fetch(`${API_BASE}/api/chat/session/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.status} ${response.statusText}`);
      }

      console.log(' CONVERSATION: Session deleted successfully');

      // Clear current session if it was deleted
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }

      return true;

    } catch (error) {
      console.error(' CONVERSATION: Failed to delete session:', error);
      return false;
    }
  }

  /**
   * Export all user data (GDPR compliance)
   */
  async exportUserData(): Promise<any | null> {
    if (!this.currentUserId) {
      console.error(' CONVERSATION: Cannot export data - no user ID set');
      return null;
    }

    try {
      console.log(' CONVERSATION: Exporting user data for:', this.currentUserId);

      const response = await fetch(`${API_BASE}/api/chat/export/${this.currentUserId}`);

      if (!response.ok) {
        throw new Error(`Failed to export data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log(' CONVERSATION: User data exported successfully');

      return data;

    } catch (error) {
      console.error(' CONVERSATION: Failed to export user data:', error);
      return null;
    }
  }

  // ========================================
  // Helper Methods
  // ========================================

  /**
   * Create a session with smart context detection based on query
   */
  async createSmartSession(query: string): Promise<CreateSessionResponse | null> {
    // Detect context from query
    const context: SessionContext = { topic: 'general' };
    const queryLower = query.toLowerCase();

    if (queryLower.includes('barcode') || queryLower.match(/^\d{12,14}$/)) {
      context.topic = 'barcode_scanning';
    } else if (queryLower.includes('workout') || queryLower.includes('exercise') || queryLower.includes('fitness')) {
      context.topic = 'fitness';
    } else if (queryLower.includes('food') || queryLower.includes('nutrition') || queryLower.includes('eat')) {
      context.topic = 'nutrition';
    } else if (queryLower.includes('study') || queryLower.includes('research') || queryLower.includes('clinical')) {
      context.topic = 'research';
    }

    // Add time of day
    const hour = new Date().getHours();
    if (hour < 12) context.time_of_day = 'morning';
    else if (hour < 18) context.time_of_day = 'afternoon';
    else context.time_of_day = 'evening';

    // Generate session name
    const timestamp = new Date().toLocaleString();
    const sessionName = `${context.topic} - ${timestamp}`;

    return this.createSession(sessionName, context);
  }

  /**
   * Resume a previous session
   */
  async resumeSession(sessionId: string): Promise<ConversationHistoryResponse | null> {
    this.currentSessionId = sessionId;
    return this.getConversationHistory(sessionId);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const conversationService = new ConversationService();
export default conversationService;
