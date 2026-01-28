/**
 * Messaging Service
 * 
 * Client-side service for coach-client messaging via coaching.wihy.ai
 * Handles direct messages, conversation threads, and attachments.
 */

import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import { authService } from './authService';

// ============= TYPES =============

export type MessageType = 'text' | 'image' | 'file' | 'workout_plan' | 'meal_plan' | 'progress_photo' | 'voice';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: 'coach' | 'client';
  content: string;
  type: MessageType;
  status: MessageStatus;
  attachments?: MessageAttachment[];
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
  editedAt?: string;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'audio';
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  thumbnailUrl?: string;
}

export interface ConversationThread {
  id: string;
  coachId: string;
  clientId: string;
  coachName: string;
  clientName: string;
  coachAvatar?: string;
  clientAvatar?: string;
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  threadId?: string;
  recipientId: string;
  content: string;
  type?: MessageType;
  attachments?: File[];
  metadata?: Record<string, any>;
}

export interface GetMessagesOptions {
  limit?: number;
  before?: string;
  after?: string;
}

export interface MessageSearchOptions {
  query: string;
  threadId?: string;
  type?: MessageType;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// ============= API RESPONSES =============

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

// ============= SERVICE IMPLEMENTATION =============

class MessagingService {
  private baseUrl: string;
  private wsConnection: WebSocket | null = null;
  private messageListeners: Map<string, (message: Message) => void> = new Map();

  constructor() {
    this.baseUrl = API_CONFIG.coachingUrl || 'https://coaching.wihy.ai';
  }

  /**
   * Get authorization headers with JWT token
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Handle API response and extract data or throw error
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `API Error: ${response.status}`);
    }
    
    return data.data || data;
  }

  // ==========================================
  // CONVERSATION THREADS
  // ==========================================

  /**
   * Get all conversation threads for the current user
   * 
   * @returns List of conversation threads
   */
  async getConversations(): Promise<ConversationThread[]> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/messaging/threads`,
      {
        method: 'GET',
        headers,
      }
    );

    return await this.handleResponse<ConversationThread[]>(response);
  }

  /**
   * Get a specific conversation thread
   * 
   * @param threadId - Thread ID
   * @returns Conversation thread details
   */
  async getThread(threadId: string): Promise<ConversationThread> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/messaging/threads/${threadId}`,
      {
        method: 'GET',
        headers,
      }
    );

    return await this.handleResponse<ConversationThread>(response);
  }

  /**
   * Get or create a thread between coach and client
   * 
   * @param coachId - Coach user ID
   * @param clientId - Client user ID
   * @returns Conversation thread
   */
  async getOrCreateThread(coachId: string, clientId: string): Promise<ConversationThread> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/messaging/threads/find-or-create`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ coachId, clientId }),
      }
    );

    return await this.handleResponse<ConversationThread>(response);
  }

  /**
   * Get threads with unread messages
   * 
   * @returns Threads with unread messages
   */
  async getUnreadThreads(): Promise<ConversationThread[]> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/messaging/threads/unread`,
      {
        method: 'GET',
        headers,
      }
    );

    return await this.handleResponse<ConversationThread[]>(response);
  }

  // ==========================================
  // MESSAGES
  // ==========================================

  /**
   * Send a message
   * 
   * @param request - Message request with content and recipient
   * @returns Sent message
   */
  async sendMessage(request: SendMessageRequest): Promise<Message> {
    const headers = await this.getAuthHeaders();
    
    // If there are attachments, use FormData
    if (request.attachments && request.attachments.length > 0) {
      const formData = new FormData();
      formData.append('recipientId', request.recipientId);
      formData.append('content', request.content);
      formData.append('type', request.type || 'text');
      
      if (request.threadId) {
        formData.append('threadId', request.threadId);
      }
      
      if (request.metadata) {
        formData.append('metadata', JSON.stringify(request.metadata));
      }
      
      request.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });

      const token = await authService.getAccessToken();
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/messaging/messages`,
        {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        }
      );

      return await this.handleResponse<Message>(response);
    }

    // Standard JSON request
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/messaging/messages`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...request,
          type: request.type || 'text',
        }),
      }
    );

    return await this.handleResponse<Message>(response);
  }

  /**
   * Get messages in a thread
   * 
   * @param threadId - Thread ID
   * @param options - Pagination options
   * @returns List of messages
   */
  async getMessages(
    threadId: string,
    options?: GetMessagesOptions
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const headers = await this.getAuthHeaders();
    
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.before) params.append('before', options.before);
    if (options?.after) params.append('after', options.after);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/messaging/threads/${threadId}/messages${queryString}`,
      {
        method: 'GET',
        headers,
      }
    );

    return await this.handleResponse<{ messages: Message[]; hasMore: boolean }>(response);
  }

  /**
   * Mark messages as read
   * 
   * @param threadId - Thread ID
   * @param messageIds - Optional specific message IDs (marks all if not provided)
   */
  async markAsRead(threadId: string, messageIds?: string[]): Promise<void> {
    const headers = await this.getAuthHeaders();
    
    await fetchWithLogging(
      `${this.baseUrl}/api/messaging/threads/${threadId}/read`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ messageIds }),
      }
    );
  }

  /**
   * Delete a message
   * 
   * @param messageId - Message ID to delete
   */
  async deleteMessage(messageId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    
    await fetchWithLogging(
      `${this.baseUrl}/api/messaging/messages/${messageId}`,
      {
        method: 'DELETE',
        headers,
      }
    );
  }

  /**
   * Edit a message
   * 
   * @param messageId - Message ID to edit
   * @param content - New content
   * @returns Updated message
   */
  async editMessage(messageId: string, content: string): Promise<Message> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/messaging/messages/${messageId}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ content }),
      }
    );

    return await this.handleResponse<Message>(response);
  }

  /**
   * Search messages
   * 
   * @param options - Search options
   * @returns Matching messages
   */
  async searchMessages(options: MessageSearchOptions): Promise<Message[]> {
    const headers = await this.getAuthHeaders();
    
    const params = new URLSearchParams();
    params.append('query', options.query);
    if (options.threadId) params.append('threadId', options.threadId);
    if (options.type) params.append('type', options.type);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/messaging/search?${params.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );

    return await this.handleResponse<Message[]>(response);
  }

  // ==========================================
  // ATTACHMENTS
  // ==========================================

  /**
   * Upload an attachment
   * 
   * @param file - File to upload
   * @returns Attachment details
   */
  async uploadAttachment(file: File): Promise<MessageAttachment> {
    const token = await authService.getAccessToken();
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/messaging/attachments`,
      {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      }
    );

    return await this.handleResponse<MessageAttachment>(response);
  }

  /**
   * Get attachment download URL
   * 
   * @param attachmentId - Attachment ID
   * @returns Download URL
   */
  async getAttachmentUrl(attachmentId: string): Promise<string> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/messaging/attachments/${attachmentId}/url`,
      {
        method: 'GET',
        headers,
      }
    );

    const data = await this.handleResponse<{ url: string }>(response);
    return data.url;
  }

  // ==========================================
  // REAL-TIME MESSAGING (WebSocket)
  // ==========================================

  /**
   * Connect to real-time messaging
   */
  async connectRealTime(): Promise<void> {
    const token = await authService.getAccessToken();
    if (!token) {
      throw new Error('Authentication required for real-time messaging');
    }

    const wsUrl = this.baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    return new Promise((resolve, reject) => {
      this.wsConnection = new WebSocket(`${wsUrl}/ws/messaging?token=${token}`);
      
      this.wsConnection.onopen = () => {
        console.log('[MessagingService] WebSocket connected');
        resolve();
      };
      
      this.wsConnection.onerror = (error) => {
        console.error('[MessagingService] WebSocket error:', error);
        reject(error);
      };
      
      this.wsConnection.onmessage = (event) => {
        try {
          const message: Message = JSON.parse(event.data);
          this.notifyListeners(message);
        } catch (error) {
          console.error('[MessagingService] Failed to parse message:', error);
        }
      };
      
      this.wsConnection.onclose = () => {
        console.log('[MessagingService] WebSocket disconnected');
        this.wsConnection = null;
      };
    });
  }

  /**
   * Disconnect from real-time messaging
   */
  disconnectRealTime(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  /**
   * Check if real-time connection is active
   */
  isConnected(): boolean {
    return this.wsConnection?.readyState === WebSocket.OPEN;
  }

  /**
   * Subscribe to new messages
   * 
   * @param listenerId - Unique listener ID
   * @param callback - Callback for new messages
   */
  onNewMessage(listenerId: string, callback: (message: Message) => void): void {
    this.messageListeners.set(listenerId, callback);
  }

  /**
   * Unsubscribe from new messages
   * 
   * @param listenerId - Listener ID to remove
   */
  offNewMessage(listenerId: string): void {
    this.messageListeners.delete(listenerId);
  }

  /**
   * Notify all listeners of a new message
   */
  private notifyListeners(message: Message): void {
    this.messageListeners.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error('[MessagingService] Listener error:', error);
      }
    });
  }

  // ==========================================
  // TYPING INDICATORS
  // ==========================================

  /**
   * Send typing indicator
   * 
   * @param threadId - Thread ID
   * @param isTyping - Whether user is typing
   */
  async sendTypingIndicator(threadId: string, isTyping: boolean): Promise<void> {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'typing',
        threadId,
        isTyping,
      }));
    }
  }

  // ==========================================
  // QUICK ACTIONS
  // ==========================================

  /**
   * Share a workout plan in a message
   * 
   * @param recipientId - Recipient user ID
   * @param programId - Workout program ID
   * @param message - Optional message
   */
  async shareWorkoutPlan(
    recipientId: string,
    programId: string,
    message?: string
  ): Promise<Message> {
    return this.sendMessage({
      recipientId,
      content: message || 'Here\'s your workout plan!',
      type: 'workout_plan',
      metadata: { programId },
    });
  }

  /**
   * Share a meal plan in a message
   * 
   * @param recipientId - Recipient user ID
   * @param programId - Meal program ID
   * @param message - Optional message
   */
  async shareMealPlan(
    recipientId: string,
    programId: string,
    message?: string
  ): Promise<Message> {
    return this.sendMessage({
      recipientId,
      content: message || 'Here\'s your meal plan!',
      type: 'meal_plan',
      metadata: { programId },
    });
  }

  /**
   * Share a progress photo
   * 
   * @param recipientId - Recipient user ID
   * @param photoUrl - Progress photo URL
   * @param message - Optional message
   */
  async shareProgressPhoto(
    recipientId: string,
    photoUrl: string,
    message?: string
  ): Promise<Message> {
    return this.sendMessage({
      recipientId,
      content: message || 'Check out my progress!',
      type: 'progress_photo',
      metadata: { photoUrl },
    });
  }
}

export const messagingService = new MessagingService();

export default messagingService;
