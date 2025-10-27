import { API_CONFIG, getApiEndpoint } from '../config/apiConfig';
import { logger } from '../utils/logger';

// ==================== WIHY API v4.0.0 INTERFACES ====================

// Chat System v4.0.0 Interfaces
export interface ChatSessionRequest {
  user_id: string;
  session_name?: string;
  context?: Record<string, any>;
}

export interface ChatSessionResponse {
  success: boolean;
  session_id?: string;
  session_name?: string;
  created_at?: string;
  message: string;
  error?: string;
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

export interface ChatHistoryResponse {
  success: boolean;
  session_id: string;
  messages: Record<string, any>[];
  total_messages: number;
  error?: string;
}

export interface UserSessionsResponse {
  success: boolean;
  user_id: string;
  sessions: Record<string, any>[];
  total_sessions: number;
  error?: string;
}

// Public Chat v4.0.0 Interfaces
export interface PublicChatRequest {
  message: string;
  context?: Record<string, any>;
}

export interface PublicChatResponse {
  success: boolean;
  response: string;
  model_used?: string;
  confidence_score?: number;
  response_time_ms?: number;
  citations?: string[];
  session_token?: string;
  message?: string;
}

// Training & Analytics v4.0.0 Interfaces
export interface TrainingQuestion {
  question: string;
  answer: string;
  category: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsQueryParams {
  user_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export interface StorageStats {
  containers: Record<string, any>;
  total_size: number;
  total_files: number;
}

// Chart Data v4.0.0 (from OpenAPI spec)
export interface ChartData {
  chart_type: string;
  labels: string[];
  values: number[];
  colors: string[];
  verdict?: string;
  reasons?: string[];
}

export interface ChartsData {
  nutrition_breakdown?: ChartData;
  health_quality?: ChartData;
}

export interface HealthInsights {
  key_benefits?: string[];
  potential_risks?: string[];
  recommendations?: string[];
}

// Core Health Processing v4.0.0
export interface ProcessedHealthData {
  query: string;
  timestamp: number;
  processor_used: string;
  processing_time: number;
  response: string;
  nutrition_data: Record<string, any>;
  health_insights: HealthInsights;
  biblical_wisdom: Record<string, any>;
  charts_data: ChartsData;
}

export interface HealthQuestionResponse {
  success: boolean;
  timestamp: string;
  endpoint: string;
  data: ProcessedHealthData;
}

// Scan Analysis v4.0.0
export interface ScanAnalysis {
  scan_type: string;
  timestamp: number;
  processing_time: number;
  analysis: Record<string, any>;
  nutrition_facts: Record<string, any>;
  health_score: number;
  recommendations: string[];
  warnings: string[];
  alternatives: string[];
  charts_data: ChartsData;
}

export interface ScanResponse {
  success: boolean;
  timestamp: string;
  endpoint: string;
  data: ScanAnalysis;
}

// Request Interfaces v4.0.0
export interface HealthQuestion {
  query?: string;
  message?: string;
  user_context?: Record<string, any>;
  include_nutrition?: boolean;
  include_biblical_wisdom?: boolean;
  include_charts?: boolean;
}

export interface ScanRequest {
  image_url?: string;
  image_base64?: string;
  product_name?: string;
  barcode?: string;
  user_context?: Record<string, any>;
}

export interface ChatRequest {
  message: string;
  context?: Record<string, any>;
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
}

// System Health Check v4.0.0
export interface HealthCheck {
  status: string;
  timestamp: string;
  services: Record<string, string>;
  service_descriptions?: Record<string, string>;
  uptime: string;
}

export interface SystemStatus {
  message: string;
  status: string;
  version: string;
  architecture: string;
  endpoints: Record<string, string>;
  services: Record<string, boolean>;
  capabilities: string[];
  documentation: string;
}

// ==================== WIHY API v4.0.0 ENDPOINTS ====================

export const WIHY_ENDPOINTS = {
  // Core Health Intelligence
  ASK: '/ask',
  SCAN: '/scan',
  CHAT: '/chat',
  
  // Chat System v4.0.0
  CHAT_START_SESSION: '/api/chat/start-session',
  CHAT_SEND_MESSAGE: '/api/chat/send-message',
  CHAT_SESSION_HISTORY: '/api/chat/session/{session_id}/history',
  CHAT_USER_SESSIONS: '/api/chat/user/{user_id}/sessions',
  CHAT_HEALTH: '/api/chat/health',
  CHAT_PUBLIC_ASK: '/api/chat/public/ask',
  
  // Training & Analytics v4.0.0
  TRAINING_SAVE_QUESTIONS: '/api/chat/training-questions/save',
  TRAINING_GET_QUESTIONS: '/api/chat/training-questions/{user_id}',
  MODELS_GET_USER: '/api/chat/models/{user_id}',
  ANALYTICS_OPENAI: '/api/chat/analytics/openai-responses',
  STORAGE_STATS: '/api/chat/storage/stats',
  
  // System
  ROOT: '/',
  HEALTH: '/health',
} as const;

// Chat system endpoint helpers
export const getChatSessionHistoryEndpoint = (sessionId: string) => {
  return getApiEndpoint(WIHY_ENDPOINTS.CHAT_SESSION_HISTORY.replace('{session_id}', sessionId));
};

export const getUserSessionsEndpoint = (userId: string) => {
  return getApiEndpoint(WIHY_ENDPOINTS.CHAT_USER_SESSIONS.replace('{user_id}', userId));
};

export const getUserTrainingQuestionsEndpoint = (userId: string) => {
  return getApiEndpoint(WIHY_ENDPOINTS.TRAINING_GET_QUESTIONS.replace('{user_id}', userId));
};

export const getUserModelsEndpoint = (userId: string) => {
  return getApiEndpoint(WIHY_ENDPOINTS.MODELS_GET_USER.replace('{user_id}', userId));
};

// ==================== WIHY API v4.0.0 SERVICE ====================

export class WihyAPIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_WIHY_API_KEY || '';
    this.baseUrl = API_CONFIG.WIHY_API_URL;
  }

  // Core Health Intelligence Methods
  async ask(request: HealthQuestion): Promise<HealthQuestionResponse> {
    try {
      const response = await fetch(getApiEndpoint(WIHY_ENDPOINTS.ASK), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY ask request failed:', error);
      throw error;
    }
  }

  async scan(request: ScanRequest): Promise<ScanResponse> {
    try {
      const response = await fetch(getApiEndpoint(WIHY_ENDPOINTS.SCAN), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY scan request failed:', error);
      throw error;
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(getApiEndpoint(WIHY_ENDPOINTS.CHAT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY chat request failed:', error);
      throw error;
    }
  }

  // Chat System v4.0.0 Methods
  async startChatSession(request: ChatSessionRequest): Promise<ChatSessionResponse> {
    try {
      const response = await fetch(getApiEndpoint(WIHY_ENDPOINTS.CHAT_START_SESSION), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY start chat session failed:', error);
      throw error;
    }
  }

  async sendChatMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    try {
      const response = await fetch(getApiEndpoint(WIHY_ENDPOINTS.CHAT_SEND_MESSAGE), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY send chat message failed:', error);
      throw error;
    }
  }

  async getChatHistory(sessionId: string, limit: number = 50): Promise<ChatHistoryResponse> {
    try {
      const url = `${getChatSessionHistoryEndpoint(sessionId)}?limit=${limit}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY get chat history failed:', error);
      throw error;
    }
  }

  async getUserChatSessions(userId: string, limit: number = 20): Promise<UserSessionsResponse> {
    try {
      const url = `${getUserSessionsEndpoint(userId)}?limit=${limit}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY get user chat sessions failed:', error);
      throw error;
    }
  }

  async chatServiceHealth(): Promise<any> {
    try {
      const response = await fetch(getApiEndpoint(WIHY_ENDPOINTS.CHAT_HEALTH), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY chat service health check failed:', error);
      throw error;
    }
  }

  // Public Chat v4.0.0 Methods
  async publicChatAsk(request: PublicChatRequest): Promise<PublicChatResponse> {
    try {
      const response = await fetch(getApiEndpoint(WIHY_ENDPOINTS.CHAT_PUBLIC_ASK), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY public chat ask failed:', error);
      throw error;
    }
  }

  // Training & Analytics v4.0.0 Methods
  async saveTrainingQuestions(userId: string, collectionName: string, questions: TrainingQuestion[]): Promise<any> {
    try {
      const url = `${getApiEndpoint(WIHY_ENDPOINTS.TRAINING_SAVE_QUESTIONS)}?user_id=${userId}&collection_name=${encodeURIComponent(collectionName)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questions),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY save training questions failed:', error);
      throw error;
    }
  }

  async getUserTrainingQuestions(userId: string): Promise<any> {
    try {
      const url = getUserTrainingQuestionsEndpoint(userId);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY get user training questions failed:', error);
      throw error;
    }
  }

  async getUserTrainedModels(userId: string): Promise<any> {
    try {
      const url = getUserModelsEndpoint(userId);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY get user trained models failed:', error);
      throw error;
    }
  }

  async getOpenAIAnalytics(params: AnalyticsQueryParams = {}): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params.user_id) queryParams.append('user_id', params.user_id);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const url = `${getApiEndpoint(WIHY_ENDPOINTS.ANALYTICS_OPENAI)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY get OpenAI analytics failed:', error);
      throw error;
    }
  }

  async getStorageStatistics(): Promise<StorageStats> {
    try {
      const response = await fetch(getApiEndpoint(WIHY_ENDPOINTS.STORAGE_STATS), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY get storage statistics failed:', error);
      throw error;
    }
  }

  // System Methods v4.0.0
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      const response = await fetch(getApiEndpoint(WIHY_ENDPOINTS.ROOT), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY get system status failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<HealthCheck> {
    try {
      const response = await fetch(getApiEndpoint(WIHY_ENDPOINTS.HEALTH), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WIHY health check failed:', error);
      throw error;
    }
  }

  // Legacy compatibility methods for existing code
  async scanBarcode(barcode: string, options?: any): Promise<any> {
    const scanRequest: ScanRequest = { 
      barcode,
      user_context: options 
    };
    const scanResponse = await this.scan(scanRequest);
    
    return {
      success: scanResponse.success,
      data: scanResponse.data,
      healthScore: scanResponse.data.health_score,
      recommendations: scanResponse.data.recommendations,
      warnings: scanResponse.data.warnings,
      nova_group: scanResponse.data.analysis?.nova_group || 0,
    };
  }

  async scanImage(imageBase64: string): Promise<any> {
    const scanRequest: ScanRequest = { image_base64: imageBase64 };
    const scanResponse = await this.scan(scanRequest);
    
    return {
      success: scanResponse.success,
      data: scanResponse.data,
      healthScore: scanResponse.data.health_score,
      recommendations: scanResponse.data.recommendations,
      warnings: scanResponse.data.warnings,
    };
  }

  // Legacy VHealthSearch compatibility methods
  async searchHealth(query: string): Promise<any> {
    const healthRequest: HealthQuestion = { 
      query,
      include_nutrition: true,
      include_biblical_wisdom: true,
      include_charts: true
    };
    const response = await this.ask(healthRequest);
    
    return {
      success: response.success,
      data: response.data,
      response: response.data.response,
      nutrition_data: response.data.nutrition_data,
      health_insights: response.data.health_insights,
      biblical_wisdom: response.data.biblical_wisdom,
      charts_data: response.data.charts_data,
    };
  }

  async searchNutrition(foodName: string): Promise<any> {
    const nutritionRequest: HealthQuestion = { 
      query: `Tell me about the nutrition of ${foodName}`,
      include_nutrition: true,
      include_charts: true
    };
    const response = await this.ask(nutritionRequest);
    
    return {
      success: response.success,
      data: response.data,
      response: response.data.response,
      nutrition_data: response.data.nutrition_data,
      health_insights: response.data.health_insights,
      charts_data: response.data.charts_data,
    };
  }

  formatWihyResponse(response: any): string {
    if (response.data && response.data.response) {
      return response.data.response;
    }
    if (response.response) {
      return response.response;
    }
    return 'No response data available';
  }

  extractCitations(response: any): string[] {
    // Extract citations from the response structure
    const citations: string[] = [];
    
    if (response.data && response.data.biblical_wisdom && response.data.biblical_wisdom.verses) {
      citations.push(...response.data.biblical_wisdom.verses);
    }
    
    if (response.citations) {
      citations.push(...response.citations);
    }

    return citations.length > 0 ? citations : ['WIHY Health Intelligence System'];
  }

  extractRecommendations(response: any): string[] {
    const recommendations: string[] = [];
    
    if (response.data && response.data.health_insights && response.data.health_insights.recommendations) {
      recommendations.push(...response.data.health_insights.recommendations);
    }
    
    if (response.recommendations) {
      recommendations.push(...response.recommendations);
    }

    return recommendations.length > 0 ? recommendations : ['Consult with healthcare professionals for personalized advice'];
  }

  // Additional legacy test compatibility methods
  async checkAPIHealth(): Promise<any> {
    return await this.healthCheck();
  }

  async askEnhancedHealthQuestion(request: any): Promise<any> {
    const healthRequest: HealthQuestion = {
      query: request.query || request.message,
      user_context: request.context,
      include_nutrition: true,
      include_biblical_wisdom: true,
      include_charts: true
    };
    return await this.ask(healthRequest);
  }

  formatEnhancedResponse(response: any): string {
    return this.formatWihyResponse(response);
  }

  async askAnything(request: any): Promise<any> {
    const healthRequest: HealthQuestion = {
      query: request.query || request.message,
      user_context: request.context,
      include_nutrition: true,
      include_biblical_wisdom: true,
      include_charts: true
    };
    return await this.ask(healthRequest);
  }

  getNovaGuidance(novaGroup: number): any {
    switch (novaGroup) {
      case 1:
        return {
          action: "CHOOSE",
          color: "green",
          message: "NOVA Group 1 - Unprocessed or minimally processed foods. These are the best choices for your health."
        };
      case 2:
        return {
          action: "MODERATE",
          color: "yellow",
          message: "NOVA Group 2 - Processed culinary ingredients. Use in moderation as seasonings and cooking aids."
        };
      case 3:
        return {
          action: "LIMIT",
          color: "orange",
          message: "NOVA Group 3 - Processed foods. Limit consumption and choose options with fewer additives."
        };
      case 4:
        return {
          action: "AVOID",
          color: "red",
          message: "NOVA Group 4 - Ultra-processed foods. Avoid or consume very rarely due to health risks."
        };
      default:
        return {
          action: "UNKNOWN",
          color: "gray",
          message: "NOVA classification not available for this product."
        };
    }
  }
}

// Export API service instance
export const wihyAPI = new WihyAPIService();

export default wihyAPI;