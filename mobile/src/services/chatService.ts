import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import type { ChatResponse, CreatedResource, SuggestedAction } from './types';

/** Session info for chat sessions */
export interface ChatSession {
  session_id: string;
  title: string;
  created_at: string;
  last_activity: string;
  message_count: number;
}

/** Message in a chat session */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  created_resources?: CreatedResource[];
  suggested_actions?: SuggestedAction[];
}

class ChatService {
  private baseUrl: string;
  private apiBaseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.mlApiUrl; // Use ML API for /ask
    this.apiBaseUrl = API_CONFIG.baseUrl; // Use main API for /api/chat/*
  }

  /**
   * Ask a quick question via /ask endpoint (Home screen)
   * This is for one-off questions that may create resources
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
    const endpoint = `${this.baseUrl}${API_CONFIG.endpoints.ask}`;
    
    console.log('=== ASK API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('Query:', query);
    console.log('Context:', JSON.stringify(context, null, 2));
    
    try {
      // Build request body matching ML API format
      const requestBody: any = {
        query,
      };
      
      // Add session_id if provided
      if (context?.session_id) {
        requestBody.session_id = context.session_id;
      }
      
      // Add user_context with productData if provided
      if (context) {
        const userContext: any = {};
        
        // Map product info to productData structure
        if (context.product_name || context.nutrition_data || context.productData) {
          userContext.productData = context.productData || {
            name: context.product_name,
            nutrition: context.nutrition_data,
            ...context,
          };
        }
        
        // Add user profile context if provided
        if (context.user_goals) {
          userContext.user_goals = context.user_goals;
        }
        if (context.fitness_level) {
          userContext.fitness_level = context.fitness_level;
        }
        if (context.dietary_restrictions) {
          userContext.dietary_restrictions = context.dietary_restrictions;
        }
        
        // Add any other context fields
        const { session_id, product_name, nutrition_data, productData, user_goals, fitness_level, dietary_restrictions, ...otherContext } = context;
        if (Object.keys(otherContext).length > 0) {
          Object.assign(userContext, otherContext);
        }
        
        if (Object.keys(userContext).length > 0) {
          requestBody.user_context = userContext;
        }
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
      
      return this.parseApiResponse(data, context?.session_id);
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== ASK ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return {
        success: false,
        response: '',
        timestamp: new Date().toISOString(),
        error: error.message || 'Failed to get response',
      };
    }
  }

  /**
   * Send a message in a chat session via /api/chat/message
   * Falls back to /ask endpoint if chat message endpoint not available
   */
  async sendMessage(
    message: string,
    sessionId: string,
    context?: {
      user_goals?: string[];
      fitness_level?: string;
      dietary_restrictions?: string[];
      [key: string]: any;
    }
  ): Promise<ChatResponse> {
    const startTime = Date.now();
    const endpoint = `${this.apiBaseUrl}/api/chat/message`;
    
    console.log('=== CHAT MESSAGE API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('Session ID:', sessionId);
    console.log('Message:', message);
    
    try {
      const requestBody: any = {
        session_id: sessionId,
        message,
      };
      
      // Add context if provided
      if (context && Object.keys(context).length > 0) {
        requestBody.context = context;
      }
      
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
        // If endpoint doesn't exist (404), fall back to /ask
        if (response.status === 404) {
          console.log('Chat message API not available, falling back to /ask');
          return this.ask(message, {
            session_id: sessionId,
            ...context,
          });
        }
        const errorText = await response.text();
        console.error(`Chat Message API HTTP error ${response.status}:`, errorText);
        console.log('=== CHAT MESSAGE FAILED ===');
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response Data:', JSON.stringify(data, null, 2));
      console.log('=== CHAT MESSAGE SUCCESS ===');
      
      return this.parseApiResponse(data, sessionId);
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== CHAT MESSAGE ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      
      // Fallback to /ask endpoint on any error
      console.log('Falling back to /ask endpoint');
      return this.ask(message, {
        session_id: sessionId,
        ...context,
      });
    }
  }

  /**
   * Create a new chat session
   * Falls back to local session ID if API endpoint not available
   */
  async createSession(title?: string): Promise<{ session_id: string; title: string } | null> {
    const endpoint = `${this.apiBaseUrl}/api/chat/session`;
    
    console.log('=== CREATE CHAT SESSION ===');
    console.log('Endpoint:', endpoint);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        // If endpoint doesn't exist (404), create local session
        if (response.status === 404) {
          console.log('Session API not available, using local session ID');
          const localSessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          return {
            session_id: localSessionId,
            title: title || 'New Chat',
          };
        }
        const errorText = await response.text();
        console.error(`Create Session API HTTP error ${response.status}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Session Created:', data);
      return {
        session_id: data.session_id,
        title: data.title || title || 'New Chat',
      };
    } catch (error: any) {
      console.error('=== CREATE SESSION ERROR ===', error);
      // Fallback: create local session ID so chat can still work
      const localSessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Fallback: using local session ID:', localSessionId);
      return {
        session_id: localSessionId,
        title: title || 'New Chat',
      };
    }
  }

  /**
   * Get list of chat sessions
   */
  async getSessions(): Promise<ChatSession[]> {
    const endpoint = `${this.apiBaseUrl}/api/chat/sessions`;
    
    console.log('=== GET CHAT SESSIONS ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Get Sessions API HTTP error ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.sessions || [];
    } catch (error: any) {
      console.error('=== GET SESSIONS ERROR ===', error);
      return [];
    }
  }

  /**
   * Get messages for a session
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const endpoint = `${this.apiBaseUrl}/api/chat/session/${sessionId}/messages`;
    
    console.log('=== GET SESSION MESSAGES ===');
    console.log('Session ID:', sessionId);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Get Messages API HTTP error ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error: any) {
      console.error('=== GET MESSAGES ERROR ===', error);
      return [];
    }
  }

  /**
   * Ask a follow-up question maintaining conversation context via session ID
   * @deprecated Use sendMessage() for session-based chat instead
   */
  async askFollowUp(
    query: string,
    sessionId: string,
    additionalContext?: any
  ): Promise<ChatResponse> {
    return this.ask(query, {
      session_id: sessionId,
      ...additionalContext,
    });
  }

  /**
   * Parse API response into standardized ChatResponse format
   */
  private parseApiResponse(data: any, sessionId?: string): ChatResponse {
    // Parse created_resources from response
    let created_resources: CreatedResource[] | undefined;
    if (data.created_resources && Array.isArray(data.created_resources)) {
      created_resources = data.created_resources.map((res: any) => ({
        type: res.type,
        id: res.id,
        name: res.name,
        navigate_to: res.navigate_to,
        metadata: res.metadata,
      }));
    }

    // Parse suggested_actions from response
    let suggested_actions: SuggestedAction[] | undefined;
    if (data.suggested_actions && Array.isArray(data.suggested_actions)) {
      suggested_actions = data.suggested_actions.map((action: any) => ({
        action: action.action,
        label: action.label,
        route: action.route,
      }));
    }

    // Parse follow_up_suggestions
    let follow_up_suggestions: string[] | undefined;
    if (data.follow_up_suggestions && Array.isArray(data.follow_up_suggestions)) {
      follow_up_suggestions = data.follow_up_suggestions;
    }

    // Parse clarifying_questions (from research_clarification responses)
    let clarifying_questions: string[] | undefined;
    if (data.clarifying_questions && Array.isArray(data.clarifying_questions)) {
      clarifying_questions = data.clarifying_questions;
    }

    // Parse suggested_searches (from research_clarification responses)
    let suggested_searches: string[] | undefined;
    if (data.suggested_searches && Array.isArray(data.suggested_searches)) {
      suggested_searches = data.suggested_searches;
    }

    return {
      success: true,
      response: data.response || data.answer || data.message || '',
      session_id: data.session_id || sessionId,
      timestamp: data.timestamp || new Date().toISOString(),
      type: data.type || data.detected_type,
      detected_type: data.detected_type,
      confidence: data.confidence,
      source: data.source,
      chart_data: data.chart_data,
      created_resources,
      suggested_actions,
      follow_up_suggestions,
      clarifying_questions,
      suggested_searches,
      recommendations: data.recommendations,
    };
  }
}

export const chatService = new ChatService();
