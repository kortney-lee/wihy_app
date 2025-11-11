/**
 * WIHY API Service - Updated to support complete API documentation v5.0
 * 
 * This service provides access to the WIHY health intelligence API with support for:
 * - Primary /ask endpoint for health & nutrition questions
 * - Chat session management for ongoing conversations
 * - System health monitoring
 * - Backward compatibility with legacy endpoints
 * 
 * Usage Examples:
 * 
 * Basic health question:
 *   const response = await wihyAPI.askHealthQuestionV2({
 *     query: "Is quinoa good for weight loss?",
 *     analyse: false
 *   });
 * 
 * Enhanced analysis:
 *   const response = await wihyAPI.askHealthQuestionV2({
 *     query: "What does recent research say about omega-3 supplements?",
 *     analyse: true,
 *     user_context: {
 *       age: 45,
 *       health_goals: ["heart_health", "longevity"],
 *       medical_conditions: ["high_cholesterol"]
 *     }
 *   });
 * 
 * Chat session:
 *   const session = await wihyAPI.createChatSession({
 *     user_id: "user_12345",
 *     session_name: "Weight Loss Journey",
 *     context: { topic: "weight_management" }
 *   });
 *   
 *   const message = await wihyAPI.sendChatMessage({
 *     session_id: session.session_id,
 *     message: "I want to lose weight but keep craving sugar. What should I do?"
 *   });
 */

import { API_CONFIG, getApiEndpoint } from '../config/apiConfig';
import { logger } from '../utils/logger';

// Dynamic endpoint that adapts to environment
const getWihyApiEndpoint = (path: string = '/ask') => {
  return getApiEndpoint(path);
};

// ============================================================================
// WIHY API Types - Updated to match complete API documentation v5.0
// ============================================================================

// New /ask endpoint types (primary API)
export interface AskHealthRequest {
  query: string;                          // REQUIRED: Health/nutrition question
  analyse?: boolean;                      // OPTIONAL: Enhanced analysis (default: false)
  user_context?: {                        // OPTIONAL: User context
    age?: number;
    health_goals?: string[];
    dietary_restrictions?: string[];
    medical_conditions?: string[];
  };
}

export interface AskHealthResponse {
  analysis: {
    summary: string;
    recommendations: string[];
    confidence_score: number;
    charts: {
      nutrition_breakdown?: {
        chart_type: 'pie_chart' | 'bar_chart' | 'line_chart';
        title: string;
        data: Array<{
          label: string;
          value: number;
          color: string;
          percentage?: number;
        }>;
        verdict?: 'excellent' | 'good' | 'fair' | 'poor';
        reasons?: string[];
      };
      health_quality?: {
        chart_type: 'dual_quality' | 'risk_gauge' | 'trend_line';
        title: string;
        values: number[];
        labels: string[];
        colors: string[];
        thresholds?: {
          excellent: number;
          good: number;
          fair: number;
          poor: number;
        };
      };
    };
    metadata: {
      processor: 'wihy_model' | 'research_api' | 'openai_enhancer';
      citations?: string[];
      query_assist?: string;
      research_intent?: {
        detected: boolean;
        confidence: number;
        source_url?: string;
      };
      original_query: string;
      normalized_query: string;
    };
    openai_analysis?: {
      summary: string;
      details: string;
      sources: string[];
      related_topics: string[];
      recommendations: string[];
      medical_disclaimer: string;
    };
  };
  timestamp: string;
  processing_time: number;
}

// Chat API types
export interface CreateChatSessionRequest {
  user_id: string;
  session_name?: string;
  context?: {
    topic?: string;
    user_goals?: string[];
    priority?: 'low' | 'moderate' | 'high';
  };
}

export interface CreateChatSessionResponse {
  success: boolean;
  session_id: string;
  session_name: string;
  created_at: string;
  message: string;
}

export interface SendChatMessageRequest {
  session_id: string;
  message: string;
  message_type?: 'health_chat' | 'nutrition_question' | 'general';
  use_custom_model?: boolean;
}

export interface SendChatMessageResponse {
  success: boolean;
  message_id: string;
  response: string;
  model_used: 'wihy_health_processor' | 'custom_model' | 'openai_enhancer';
  confidence_score: number;
  response_time_ms: number;
  citations: string[];
  message: string;
}

// Legacy Types (for backward compatibility)
export interface HealthQuestion {
  query: string;                          // REQUIRED: Your health/nutrition question
  user_context?: Record<string, any>;     // OPTIONAL: User context object
  include_nutrition?: boolean;            // OPTIONAL: Include nutrition analysis (default: true)
  include_biblical_wisdom?: boolean;      // OPTIONAL: Include biblical wisdom (default: true)
  include_charts?: boolean;               // OPTIONAL: Include chart data (default: true)
}

// Chart data structure from OpenAPI spec
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

// Core response data structure from OpenAPI spec
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

// Main response structure from OpenAPI spec
export interface HealthQuestionResponse {
  success: boolean;
  timestamp: string;
  endpoint: string;
  data: ProcessedHealthData;
}

// Keep the old interface for backward compatibility
export interface UnifiedRequest extends HealthQuestion {
  request_type?: 'auto' | 'nutrition' | 'health' | 'chat' | 'auth' | 'predict' | 'train';
  context?: Record<string, any>;
  user_id?: string;
  session_id?: string;
}

// Interface for the /scan endpoint
export interface ScanRequest {
  image_url?: string;                     // OPTIONAL: URL to image
  image_base64?: string;                  // OPTIONAL: Base64 encoded image
  product_name?: string;                  // OPTIONAL: Product name to scan
  barcode?: string;                       // OPTIONAL: Barcode/UPC to scan  
  user_context?: Record<string, any>;     // OPTIONAL: User context object
}

export interface UnifiedResponse {
  success: boolean;
  data: {
    ai_response: {
      response: string;
      enhanced: boolean;
      service: string;
      confidence: number;
    };
    nutrition?: {
      facts: {
        calories_per_serving: number;
        protein_g: number;
        carbs_g: number;
        fiber_g: number;
        fat_g: number;
        sodium_mg: number;
        sugar_g: number;
      };
      nourish_score: {
        score: number;
        category: string;
        breakdown: {
          nutrient_density: number;
          processing_level: number;
          ingredient_quality: number;
        };
      };
      daily_value_percentages: Record<string, number>;
      macronutrients: { protein: number; carbs: number; fat: number };
      micronutrients: string[];
    };
    health_analysis?: {
      safety_score: number;
      carcinogen_alerts: string[];
      toxic_additives: string[];
      processing_level: string;
      ingredient_analysis: Array<{
        name: string;
        safety_score: number;
        category: string;
        concerns: string[];
        benefits: string[];
      }>;
    };
    charts_data?: {
      nutrition_breakdown: {
        labels: string[];
        values: number[];
        colors: string[];
        chart_type: string;
      };
      ingredient_safety_radar: {
        labels: string[];
        values: number[];
        max_value: number;
        chart_type: string;
      };
      daily_nutrition_progress: {
        nutrients: Array<{
          name: string;
          current: number;
          target: number;
          color: string;
        }>;
        chart_type: string;
      };
    };
    recommendations?: {
      immediate_actions: string[];
      lifestyle_changes: string[];
      better_alternatives: string[];
      shopping_tips: string[];
      meal_planning: string[];
    };
    evidence?: {
      research_studies: string[];
      scientific_consensus: string;
      regulatory_status: string[];
      expert_opinions: string[];
    };
    personalization?: {
      user_goals: string[];
      dietary_restrictions: string[];
      health_conditions: string[];
      personalized_advice: string[];
    };
    metadata?: {
      services_used: string[];
      data_sources: string[];
      confidence_scores: Record<string, number>;
      processing_time: number;
      enhanced_by_ai: boolean;
      api_version: string;
    };
    // Legacy support fields
    service?: string;
    query?: string;
    response?: string;
    session_id?: string;
    conversation_context?: string;
    enhanced?: boolean;
    legacy_recommendations?: string[];
    analysis?: string;
    training_status?: string;
    available_models?: string[];
    sources?: string[];
    [key: string]: any;
  };
  rendering_hints?: {
    primary_display: string;
    chart_components: string[];
    key_metrics: string[];
    action_items: string[];
  };
  service_used: string;
  request_type?: string;
  processing_time?: number;
  suggestions?: string[];
}

// Type guard for detecting unified responses at runtime
export function isUnifiedResponse(obj: any): obj is UnifiedResponse {
  return obj && typeof obj === 'object' && ('data' in obj) && ('service_used' in obj);
}

// Legacy types for backward compatibility
export interface UserContext {
  age?: number;
  family_size?: number;
  family_history?: string[];
  health_concerns?: string[];
  health_goals?: string[];
  dietary_restrictions?: string[];
  medical_conditions?: string[];
  activity_level?: 'low' | 'moderate' | 'high';
  current_health_concerns?: string[];
  [key: string]: any; // Allow additional context fields
}

export interface WihyRequest {
  query: string;
  user_context?: UserContext;
}

export interface RiskFactor {
  risk_factor: string;
  associated_illnesses: string;
  prevalence_rate: number;
  preventability_score: number;
}

export interface ActionItem {
  action: string;
  priority: string;
  target_illness: string;
  evidence_level: string;
  mechanism: string;
  timeline: string;
}

export interface PersonalizedAnalysis {
  identified_risk_factors: RiskFactor[];
  priority_health_goals: string[];
  action_items: ActionItem[];
  timeline: string;
}

export interface ResearchFoundation {
  citation_text: string;
  study_type: string;
  key_finding: string;
}

export interface ProgressTracking {
  key_metrics: string[];
  reassessment_period: string;
}

export interface WihyResponseData {
  query_type: string;
  query: string;
  core_principle: string;
  personalized_analysis: PersonalizedAnalysis;
  research_foundation: ResearchFoundation[];
  progress_tracking: ProgressTracking;
  biblical_wisdom: string[];
}

export interface WihyResponse {
  success: boolean;
  timestamp: string;
  response_type: string;
  query: string;
  user_context?: UserContext;
  wihy_response: WihyResponseData;
  message: string;
}

export interface WihyError {
  detail: string;
}

class WihyAPIService {
  private baseURL: string;
  private isLocalDevelopment: boolean;

  constructor() {
    this.baseURL = getWihyApiEndpoint('/ask');
    this.isLocalDevelopment = API_CONFIG.WIHY_API_URL.includes('localhost');
    
    // Log service initialization in development only
    if (this.isLocalDevelopment) {
      logger.info('WiHy API Service initialized', {
        baseURL: this.baseURL,
        isLocalDevelopment: this.isLocalDevelopment
      });
    }
  }

  /**
   * Ask WiHy a health-related question using the unified API
   */
  async askAnything(request: WihyRequest | UnifiedRequest): Promise<HealthQuestionResponse | WihyResponse | UnifiedResponse> {
    const requestStartTime = performance.now();
    
    try {
      logger.apiRequest('Making WiHy Unified API request', request);
      
      let requestBody: any;
      let endpoint: string;
      
      // Both local and remote APIs use the same /ask endpoint with HealthQuestion format
      endpoint = this.isLocalDevelopment ? this.baseURL : `${API_CONFIG.WIHY_API_URL}/ask`;
      
      // Build HealthQuestion object according to OpenAPI spec
      if ('user_context' in request) {
        requestBody = {
          query: request.query,
          user_context: request.user_context || {},
          include_nutrition: true,
          include_biblical_wisdom: false,
          include_charts: true
        };
      } else {
        const unifiedReq = request as UnifiedRequest;
        requestBody = {
          query: unifiedReq.query,
          user_context: unifiedReq.context || unifiedReq.user_context || {},
          include_nutrition: unifiedReq.include_nutrition !== false,
          include_biblical_wisdom: unifiedReq.include_biblical_wisdom === true,
          include_charts: unifiedReq.include_charts !== false
        };
      }
      
      // Use fetch API to match the working example exactly with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      logger.apiResponse('WiHy Unified API response received', data);
      return data;
    } catch (error) {
      logger.error('WiHy API error:', error);
      
      if (error instanceof Error) {
        // Check for timeout/abort errors
        if (error.name === 'AbortError') {
          throw new Error('TIMEOUT_ERROR: Request timed out - services may be unavailable');
        }
        
        // Check for CORS errors
        if (error.message.includes('CORS') || 
            error.message.includes('Access to fetch') ||
            error.message.includes('No \'Access-Control-Allow-Origin\'')) {
          throw new Error('CORS_ERROR: Unable to connect to WiHy services from this domain');
        }
        
        // Check for network/connectivity issues (including mobile-specific issues)
        if (error.message.includes('fetch') || 
            error.message.includes('network') || 
            error.name === 'TypeError' ||
            error.message.includes('Failed to fetch')) {
          
          // Provide mobile-specific guidance
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const baseMessage = 'NETWORK_ERROR: Unable to connect to WiHy services';
          
          if (isMobile) {
            throw new Error(`${baseMessage}. For mobile testing, ensure your device and development machine are on the same network, and set REACT_APP_WIHY_API_URL to your machine's IP address (e.g., http://192.168.1.100:8000).`);
          } else {
            throw new Error(`${baseMessage}. Check if the API server is running on the configured endpoint.`);
          }
        }
        
        // Check for server errors
        if (error.message.includes('HTTP error! status: 5')) {
          throw new Error('SERVER_ERROR: WiHy services are temporarily unavailable');
        }
        
        throw new Error(error.message || 'WiHy API request failed');
      }
      
      throw new Error('Unknown error occurred while contacting WiHy API');
    }
  }

  /**
   * Convert UnifiedResponse to legacy WihyResponse format for backward compatibility
   */
  private convertToLegacyFormat(unifiedResponse: UnifiedResponse, originalQuery: string): WihyResponse {
    // Handle chat service response
    if (unifiedResponse.service_used === 'chat' && unifiedResponse.data.response) {
      return {
        success: unifiedResponse.success,
        timestamp: new Date().toISOString(),
        response_type: unifiedResponse.request_type || 'chat',
        query: originalQuery,
        wihy_response: {
          query_type: unifiedResponse.request_type || 'chat',
          query: originalQuery,
          core_principle: unifiedResponse.data.response,
          personalized_analysis: {
            identified_risk_factors: [],
            priority_health_goals: [unifiedResponse.data.response],
            action_items: [{
              action: unifiedResponse.data.response,
              priority: 'medium',
              target_illness: 'general_health',
              evidence_level: 'ai_generated',
              mechanism: 'chat_response',
              timeline: 'immediate'
            }],
            timeline: 'immediate'
          },
          research_foundation: [{
            citation_text: 'WiHy AI Chat System',
            study_type: 'ai_response',
            key_finding: unifiedResponse.data.response
          }],
          progress_tracking: {
            key_metrics: ['general_health'],
            reassessment_period: '1 week'
          },
          biblical_wisdom: []
        },
        message: unifiedResponse.data.response
      };
    }

    // Handle other service types (training, nutrition, etc.)
    return {
      success: unifiedResponse.success,
      timestamp: new Date().toISOString(),
      response_type: unifiedResponse.request_type || 'health',
      query: originalQuery,
      wihy_response: {
        query_type: unifiedResponse.request_type || 'health',
        query: originalQuery,
        core_principle: unifiedResponse.data.analysis || unifiedResponse.data.response || 'Health Information',
        personalized_analysis: {
          identified_risk_factors: [],
          priority_health_goals: [],
          action_items: unifiedResponse.data.recommendations?.immediate_actions?.map((rec: string, index: number) => ({
            action: rec,
            priority: 'medium',
            target_illness: 'general_health',
            evidence_level: 'moderate',
            mechanism: 'lifestyle_modification',
            timeline: 'ongoing'
          })) || unifiedResponse.data.legacy_recommendations?.map((rec: string, index: number) => ({
            action: rec,
            priority: 'medium',
            target_illness: 'general_health',
            evidence_level: 'moderate',
            mechanism: 'lifestyle_modification',
            timeline: 'ongoing'
          })) || [],
          timeline: 'ongoing'
        },
        research_foundation: unifiedResponse.data.sources?.map((source: string) => ({
          citation_text: source,
          study_type: 'research',
          key_finding: source
        })) || [],
        progress_tracking: {
          key_metrics: ['general_health'],
          reassessment_period: '1 month'
        },
        biblical_wisdom: []
      },
      message: unifiedResponse.data.response || unifiedResponse.data.analysis || 'Health information provided'
    };
  }

  // ============================================================================
  // NEW API Methods - Updated to match documentation v5.0
  // ============================================================================

  /**
   * Ask WiHy a health-related question using the new /ask endpoint
   * This is the main endpoint for health questions with comprehensive AI analysis
   */
  async askHealthQuestionV2(request: AskHealthRequest): Promise<AskHealthResponse> {
    try {
      logger.apiRequest('Making WiHy /ask API request (v2)', request);
      
      const endpoint = this.isLocalDevelopment 
        ? this.baseURL 
        : `${API_CONFIG.WIHY_API_URL}/ask`;
      
      // Use fetch API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AskHealthResponse = await response.json();
      
      logger.apiResponse('WiHy /ask API response received (v2)', data);
      return data;
    } catch (error) {
      logger.error('WiHy /ask API error (v2):', error);
      
      if (error instanceof Error) {
        // Check for timeout/abort errors
        if (error.name === 'AbortError') {
          throw new Error('TIMEOUT_ERROR: Request timed out - services may be unavailable');
        }
        
        // Check for CORS errors
        if (error.message.includes('CORS') || 
            error.message.includes('Access to fetch') ||
            error.message.includes('No \'Access-Control-Allow-Origin\'')) {
          throw new Error('CORS_ERROR: Unable to connect to WiHy services from this domain');
        }
        
        // Check for network/connectivity issues
        if (error.message.includes('fetch') || 
            error.message.includes('network') || 
            error.name === 'TypeError' ||
            error.message.includes('Failed to fetch')) {
          
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const baseMessage = 'NETWORK_ERROR: Unable to connect to WiHy services';
          
          if (isMobile) {
            throw new Error(`${baseMessage}. For mobile testing, ensure your device and development machine are on the same network.`);
          } else {
            throw new Error(`${baseMessage}. Check if the API server is running on the configured endpoint.`);
          }
        }
        
        // Check for server errors
        if (error.message.includes('HTTP error! status: 5')) {
          throw new Error('SERVER_ERROR: WiHy services are temporarily unavailable');
        }
        
        throw new Error(error.message || 'WiHy API request failed');
      }
      
      throw new Error('Unknown error occurred while contacting WiHy API');
    }
  }

  /**
   * Create a new chat session for ongoing health discussions
   */
  async createChatSession(request: CreateChatSessionRequest): Promise<CreateChatSessionResponse> {
    try {
      const endpoint = `${API_CONFIG.WIHY_API_URL}/api/chat/session`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CreateChatSessionResponse = await response.json();
      logger.apiResponse('Chat session created', data);
      return data;
    } catch (error) {
      logger.error('Chat session creation error:', error);
      throw error;
    }
  }

  /**
   * Send a message within an existing chat session
   */
  async sendChatMessage(request: SendChatMessageRequest): Promise<SendChatMessageResponse> {
    try {
      const endpoint = `${API_CONFIG.WIHY_API_URL}/api/chat/message`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SendChatMessageResponse = await response.json();
      logger.apiResponse('Chat message sent', data);
      return data;
    } catch (error) {
      logger.error('Chat message error:', error);
      throw error;
    }
  }

  // ============================================================================
  // System Health & Status Endpoints
  // ============================================================================

  /**
   * Get API status and available services
   */
  async getApiStatus(): Promise<{
    message: string;
    status: 'operational' | 'degraded' | 'maintenance';
    version: string;
    architecture: string;
    endpoints: Record<string, string>;
    services: Record<string, boolean>;
    capabilities: string[];
    documentation: string;
  }> {
    try {
      const endpoint = `${API_CONFIG.WIHY_API_URL}/`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.apiResponse('API status retrieved', data);
      return data;
    } catch (error) {
      logger.error('API status error:', error);
      throw error;
    }
  }

  /**
   * Get detailed system health check
   */
  async getHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    services: Record<string, 'available' | 'unavailable'>;
    service_descriptions: Record<string, string>;
  }> {
    try {
      const endpoint = `${API_CONFIG.WIHY_API_URL}/health`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.apiResponse('Health check retrieved', data);
      return data;
    } catch (error) {
      logger.error('Health check error:', error);
      throw error;
    }
  }

  // ============================================================================
  // Legacy Methods (for backward compatibility)
  // ============================================================================

  /**
   * Get health news articles using the unified API
   */
  async getHealthNews(categories?: string[], limit?: number): Promise<WihyResponse> {
    const query = categories && categories.length > 0 
      ? `Latest health news about ${categories.join(', ')}`
      : 'Latest health news';
    
    const request: UnifiedRequest = {
      query: query,
      request_type: 'health',
      context: {
        categories: categories,
        limit: limit
      }
    };

    const response = await this.askAnything(request);
    if ('data' in response) {
      // It's a UnifiedResponse, convert to legacy format
      return this.convertToLegacyFormat(response as UnifiedResponse, query);
    }
    return response as WihyResponse;
  }

  /**
   * Search for nutrition information using the unified API
   */
  async searchNutrition(foodQuery: string, userContext?: UserContext): Promise<WihyResponse> {
    const request: UnifiedRequest = {
      query: `Nutrition information for ${foodQuery}`,
      request_type: 'nutrition',
      context: userContext || {}
    };

    const response = await this.askAnything(request);
    if ('data' in response) {
      // It's a UnifiedResponse, convert to legacy format
      return this.convertToLegacyFormat(response as UnifiedResponse, request.query);
    }
    return response as WihyResponse;
  }

  /**
   * Scan food images, barcodes, or products using the unified API
   */
  async scanFood(file?: File, scanOptions?: Partial<ScanRequest>): Promise<WihyResponse | UnifiedResponse> {
    try {
      let endpoint: string;
      let requestBody: any;
      
      if (this.isLocalDevelopment) {
        // Local API uses /scan endpoint
        endpoint = `${API_CONFIG.WIHY_API_URL}/scan`;
        
        if (file) {
          // Convert file to base64 for the API
          const base64 = await this.fileToBase64(file);
          requestBody = {
            image_base64: base64,
            user_context: scanOptions?.user_context || {},
            ...scanOptions
          };
        } else {
          requestBody = scanOptions || {};
        }
      } else {
        // Remote API - fallback to legacy image analysis
        // This would need to be implemented based on what the remote API supports
        throw new Error('Image scanning not yet supported on remote API');
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.apiResponse('WiHy Scan API response received', data);
      return data;
    } catch (error) {
      logger.error('WiHy Scan API error:', error);
      throw error;
    }
  }

  /**
   * Convert File to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Scan food image - alias for scanFood for compatibility
   */
  async scanFoodImage(file: File, scanOptions?: Partial<ScanRequest>): Promise<WihyResponse | UnifiedResponse> {
    return this.scanFood(file, scanOptions);
  }

  /**
   * Ask health question - compatibility method
   */
  async askHealthQuestion(request: { query: string }): Promise<HealthQuestionResponse> {
    const unifiedRequest: UnifiedRequest = {
      query: request.query,
      request_type: 'health',
      context: {}
    };

    const response = await this.askAnything(unifiedRequest);
    
    // Ensure we return a HealthQuestionResponse format
    if ('success' in response && 'data' in response) {
      return response as HealthQuestionResponse;
    }
    
    // Convert WihyResponse to HealthQuestionResponse format
    const wihyResp = response as WihyResponse;
    const timestamp = Date.now();
    
    return {
      success: wihyResp.success,
      timestamp: new Date().toISOString(),
      endpoint: '/health/question',
      data: {
        query: request.query,
        timestamp: timestamp,
        response: wihyResp.wihy_response?.core_principle || wihyResp.message,
        processor_used: 'wihy_api',
        processing_time: 100,
        nutrition_data: {},
        health_insights: {
          key_benefits: [],
          potential_risks: [],
          recommendations: []
        },
        biblical_wisdom: {},
        charts_data: {
          nutrition_breakdown: {
            chart_type: 'pie',
            labels: [],
            values: [],
            colors: []
          },
          health_quality: {
            chart_type: 'bar',
            labels: [],
            values: [],
            colors: []
          }
        }
      }
    };
  }

  /**
   * General health search using the unified API
   */
  async searchHealth(query: string, userContext?: UserContext): Promise<WihyResponse | UnifiedResponse> {
    try {
      // Use the new unified /ask endpoint format
      const request = {
        query: query,
        user_context: userContext ? {
          age: userContext.age,
          health_goals: userContext.health_goals,
          dietary_restrictions: userContext.dietary_restrictions,
          medical_conditions: userContext.medical_conditions,
          ...userContext
        } : undefined,
        include_charts: true
      };

      const endpoint = this.isLocalDevelopment ? this.baseURL : `${API_CONFIG.WIHY_API_URL}/ask`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as WihyResponse | UnifiedResponse;
    } catch (error) {
      logger.error('WiHy API searchHealth error:', error);
      throw error;
    }
  }

  /**
   * Enhanced analysis method for special cases (compatibility method)
   */
  async analyzeWithWiHy(query: string, userContext?: UserContext, source?: string): Promise<WihyResponse | UnifiedResponse> {
    const request: UnifiedRequest = {
      query: query,
      request_type: 'auto',
      context: {
        enhanced_analysis: true,
        source: source,
        ...userContext
      }
    };

    const response = await this.askAnything(request);
    return response as WihyResponse | UnifiedResponse;
  }

  /**
   * Format the WiHy response for display in the existing UI
   * This formats it to be compatible with the existing search results format
   */
  formatWihyResponse(response: AskHealthResponse | HealthQuestionResponse | WihyResponse | UnifiedResponse): string {
    // Handle new AskHealthResponse format (API v5.0)
    if ('analysis' in response && 'timestamp' in response && 'processing_time' in response) {
      const askResp = response as AskHealthResponse;
      const analysis = askResp.analysis;
      
      let formatted = `# WiHy Health Intelligence\n\n`;
      
      // Main response content
      formatted += analysis.summary;
      
      // Add recommendations if available
      if (analysis.recommendations?.length) {
        formatted += `\n\n## 📋 Recommendations\n`;
        analysis.recommendations.forEach(rec => {
          formatted += `- ${rec}\n`;
        });
      }
      
      // Add enhanced analysis if available
      if (analysis.openai_analysis) {
        formatted += `\n\n## 🔬 Enhanced Analysis\n`;
        formatted += analysis.openai_analysis.summary;
        
        if (analysis.openai_analysis.details) {
          formatted += `\n\n**Details:** ${analysis.openai_analysis.details}`;
        }
        
        if (analysis.openai_analysis.related_topics?.length) {
          formatted += `\n\n**Related Topics:**\n`;
          analysis.openai_analysis.related_topics.forEach(topic => {
            formatted += `- ${topic}\n`;
          });
        }
        
        if (analysis.openai_analysis.sources?.length) {
          formatted += `\n\n**Sources:**\n`;
          analysis.openai_analysis.sources.forEach(source => {
            formatted += `- ${source}\n`;
          });
        }
        
        if (analysis.openai_analysis.medical_disclaimer) {
          formatted += `\n\n**Medical Disclaimer:** ${analysis.openai_analysis.medical_disclaimer}`;
        }
      }
      
      // Add processing info
      formatted += `\n\n---\n\n*Processed by ${analysis.metadata.processor} in ${askResp.processing_time.toFixed(2)}s*`;
      if (analysis.confidence_score) {
        formatted += ` (Confidence: ${Math.round(analysis.confidence_score * 100)}%)`;
      }
      
      return formatted;
    }

    // Handle legacy HealthQuestionResponse format (OpenAPI v4.0.0)
    if ('success' in response && 'data' in response && response.data && 'response' in response.data && 'processor_used' in response.data) {
      const healthResp = response as HealthQuestionResponse;
      const data = healthResp.data;
      
      let formatted = `# WiHy Health Intelligence\n\n`;
      
      // Main response content
      formatted += data.response;
      
      // Add health insights if available
      if (data.health_insights) {
        if (data.health_insights.key_benefits?.length) {
          formatted += `\n\n## 🌟 Key Benefits\n`;
          data.health_insights.key_benefits.forEach(benefit => {
            formatted += `- ${benefit}\n`;
          });
        }
        
        if (data.health_insights.potential_risks?.length) {
          formatted += `\n\n## ⚠️ Potential Risks\n`;
          data.health_insights.potential_risks.forEach(risk => {
            formatted += `- ${risk}\n`;
          });
        }
        
        if (data.health_insights.recommendations?.length) {
          formatted += `\n\n## 📋 Recommendations\n`;
          data.health_insights.recommendations.forEach(rec => {
            formatted += `- ${rec}\n`;
          });
        }
      }
      
      // Add processing info
      formatted += `\n\n---\n\n*Processed by ${data.processor_used} in ${data.processing_time.toFixed(2)}ms*`;
      
      return formatted;
    }
    
    // Handle UnifiedResponse format (legacy API)
    if ('success' in response && 'data' in response && response.data && 'ai_response' in response.data) {
      const unifiedResp = response as UnifiedResponse;
      
      let formatted = `# WiHy Health Assistant\n\n`;
      
      // Use the ai_response.response field which contains the actual response
      if (unifiedResp.data.ai_response && unifiedResp.data.ai_response.response) {
        formatted += unifiedResp.data.ai_response.response;
      } else {
        // Fallback to showing raw data if ai_response is not available
        formatted += `**Data:**\n\`\`\`json\n${JSON.stringify(unifiedResp.data, null, 2)}\n\`\`\``;
      }
      
      // Add service information if available
      if (unifiedResp.data.ai_response?.service) {
        formatted += `\n\n---\n\n*Response from ${unifiedResp.data.ai_response.service} service*`;
        if (unifiedResp.data.ai_response.confidence) {
          formatted += ` (Confidence: ${Math.round(unifiedResp.data.ai_response.confidence * 100)}%)`;
        }
      }
      
      return formatted;
    }
    
    // Handle legacy WihyResponse format
    const legacyResp = response as WihyResponse;
    const { wihy_response } = legacyResp;
    
    let formatted = `# ${wihy_response.core_principle}\n\n`;
    
    // Personalized Analysis
    if (wihy_response.personalized_analysis) {
      formatted += `## 🎯 Personalized Health Analysis\n\n`;
      
      // Risk Factors
      if (wihy_response.personalized_analysis.identified_risk_factors?.length > 0) {
        formatted += `### Identified Risk Factors:\n`;
        wihy_response.personalized_analysis.identified_risk_factors.forEach(risk => {
          formatted += `- **${risk.risk_factor.replace(/_/g, ' ').toUpperCase()}**\n`;
          formatted += `  - Associated with: ${risk.associated_illnesses.replace(/_/g, ' ')}\n`;
          formatted += `  - Prevalence: ${risk.prevalence_rate}%\n`;
          formatted += `  - Preventability: ${risk.preventability_score}%\n\n`;
        });
      }
      
      // Priority Goals
      if (wihy_response.personalized_analysis.priority_health_goals?.length > 0) {
        formatted += `### 🎯 Priority Health Goals:\n`;
        wihy_response.personalized_analysis.priority_health_goals.forEach(goal => {
          formatted += `- ${goal}\n`;
        });
        formatted += '\n';
      }
      
      // Action Items
      if (wihy_response.personalized_analysis.action_items?.length > 0) {
        formatted += `### 📋 Action Items:\n`;
        wihy_response.personalized_analysis.action_items.forEach((action, index) => {
          formatted += `#### ${index + 1}. ${action.action}\n`;
          formatted += `- **Priority:** ${action.priority}\n`;
          formatted += `- **Target:** ${action.target_illness.replace(/_/g, ' ')}\n`;
          formatted += `- **Evidence Level:** ${action.evidence_level}\n`;
          formatted += `- **How it works:** ${action.mechanism}\n`;
          formatted += `- **Timeline:** ${action.timeline}\n\n`;
        });
      }
      
      // Timeline
      if (wihy_response.personalized_analysis.timeline) {
        formatted += `**Implementation Timeline:** ${wihy_response.personalized_analysis.timeline}\n\n`;
      }
    }
    
    // Research Foundation
    if (wihy_response.research_foundation?.length > 0) {
      formatted += `## 📚 Research Foundation\n\n`;
      wihy_response.research_foundation.forEach(research => {
        formatted += `- **${research.citation_text}** (${research.study_type})\n`;
        formatted += `  ${research.key_finding}\n\n`;
      });
    }
    
    // Progress Tracking
    if (wihy_response.progress_tracking) {
      formatted += `## 📊 Progress Tracking\n\n`;
      formatted += `**Key Metrics to Track:**\n`;
      wihy_response.progress_tracking.key_metrics.forEach(metric => {
        formatted += `- ${metric}\n`;
      });
      formatted += `\n**Reassessment:** ${wihy_response.progress_tracking.reassessment_period}\n\n`;
    }
    
    // Biblical Wisdom
    if (wihy_response.biblical_wisdom?.length > 0) {
      formatted += `## ✝️ Biblical Wisdom\n\n`;
      wihy_response.biblical_wisdom.forEach(wisdom => {
        formatted += `> ${wisdom}\n\n`;
      });
    }
    
    // Add timestamp if available (different field names in different response formats)
    const timestamp = (response as any).timestamp || (response as any).created_at || new Date().toISOString();
    formatted += `---\n\n*WiHy health truth analysis generated at: ${new Date(timestamp).toLocaleString()}*\n`;
    
    return formatted;
  }

  /**
   * Extract recommendations from WiHy response for UI display
   */
  extractRecommendations(response: AskHealthResponse | HealthQuestionResponse | WihyResponse | UnifiedResponse): string[] {
    const recommendations: string[] = [];

    // Handle new AskHealthResponse format (API v5.0)
    if ('analysis' in response && 'timestamp' in response) {
      const askResp = response as AskHealthResponse;
      if (askResp.analysis.recommendations) {
        recommendations.push(...askResp.analysis.recommendations);
      }
      if (askResp.analysis.openai_analysis?.recommendations) {
        recommendations.push(...askResp.analysis.openai_analysis.recommendations);
      }
      return recommendations;
    }

    // Handle legacy HealthQuestionResponse format (OpenAPI v4.0.0)
    if ('success' in response && 'data' in response && response.data && 'health_insights' in response.data) {
      const healthResp = response as HealthQuestionResponse;
      if (healthResp.data.health_insights.recommendations) {
        healthResp.data.health_insights.recommendations.forEach(r => recommendations.push(r));
      }
      return recommendations;
    }

    if (isUnifiedResponse(response)) {
      // Handle new structured recommendations
      if (response.data.recommendations) {
        const recs = response.data.recommendations;
        if (recs.immediate_actions) recs.immediate_actions.forEach(r => recommendations.push(r));
        if (recs.lifestyle_changes) recs.lifestyle_changes.forEach(r => recommendations.push(r));
        if (recs.better_alternatives) recs.better_alternatives.forEach(r => recommendations.push(r));
        if (recs.shopping_tips) recs.shopping_tips.forEach(r => recommendations.push(r));
        if (recs.meal_planning) recs.meal_planning.forEach(r => recommendations.push(r));
      }
      // Handle legacy recommendations
      if (response.data.legacy_recommendations && response.data.legacy_recommendations.length > 0) {
        response.data.legacy_recommendations.forEach((r: string) => recommendations.push(r));
      }
    } else {
      // Handle legacy WihyResponse format
      const legacyResp = response as WihyResponse;
      if (legacyResp.wihy_response && legacyResp.wihy_response.personalized_analysis?.action_items) {
        legacyResp.wihy_response.personalized_analysis.action_items.forEach(action => {
          recommendations.push(`${action.action} (${action.priority} priority)`);
        });
      }
    }

    return recommendations;
  }

  /**
   * Extract citations from WiHy response for UI display
   */
  extractCitations(response: AskHealthResponse | HealthQuestionResponse | WihyResponse | UnifiedResponse): string[] {
    const citations: string[] = [];

    // Handle new AskHealthResponse format (API v5.0)
    if ('analysis' in response && 'timestamp' in response) {
      const askResp = response as AskHealthResponse;
      if (askResp.analysis.metadata.citations) {
        citations.push(...askResp.analysis.metadata.citations);
      }
      if (askResp.analysis.openai_analysis?.sources) {
        citations.push(...askResp.analysis.openai_analysis.sources);
      }
      return citations;
    }

    // Handle legacy HealthQuestionResponse format (OpenAPI v4.0.0)
    if ('success' in response && 'data' in response && response.data && 'processor_used' in response.data) {
      // For now, the new API doesn't include specific citation fields in the schema
      // We could parse citations from the response text if needed
      return citations;
    }

    if (isUnifiedResponse(response)) {
      // Unified API may include sources array
      if (response.data.sources && response.data.sources.length > 0) {
        response.data.sources.forEach((s: string) => citations.push(s));
      }
    } else {
      // Handle legacy WihyResponse format
      const legacyResp = response as WihyResponse;
      if (legacyResp.wihy_response && legacyResp.wihy_response.research_foundation) {
        legacyResp.wihy_response.research_foundation.forEach(research => {
          citations.push(`${research.citation_text}: ${research.key_finding}`);
        });
      }
    }

    return citations;
  }

  /**
   * Format UnifiedResponse for chat display (simple format)
   */
  formatUnifiedResponseForChat(response: UnifiedResponse): string {
    // Handle chat service responses
    if (response.service_used === 'chat' && response.data.response) {
      // For now, the API is returning very brief responses like "AI Chat response to: what is healthy"
      // We should provide more helpful information to the user
      const briefResponse = response.data.response;
      
      if (briefResponse.includes('AI Chat response to:')) {
        // The API gave us a placeholder response, provide something more useful
        const query = response.data.query || 'your question';
        return `I received your question about "${query}" and I'm here to help! 

The WiHy AI system is currently processing health-related queries. While the response system is being optimized, I can help you with:

• Understanding health and nutrition concepts
• Providing general wellness guidance  
• Explaining health data and metrics
• Offering evidence-based health insights

What specific aspect of health would you like to explore further?`;
      }
      
      return briefResponse;
    }
    
    // Handle other response types
    if (response.data.response) {
      return response.data.response;
    }
    
    if (response.data.analysis) {
      return response.data.analysis;
    }
    
    if (response.data.training_status) {
      let message = `🔄 ${response.data.training_status}`;
      if (response.data.available_models && response.data.available_models.length > 0) {
        message += `\n\n📊 Available models: ${response.data.available_models.join(', ')}`;
      }
      return message;
    }
    
    // Fallback - show the raw data in a readable format
    return `I received a response from the ${response.service_used} service. Here's what I found:\n\n${JSON.stringify(response.data, null, 2)}`;
  }

  /**
   * Format response for display - compatibility alias for formatWihyResponse
   */
  formatResponse(response: HealthQuestionResponse | WihyResponse | UnifiedResponse): string {
    return this.formatWihyResponse(response);
  }
}

// Export a singleton instance
export const wihyAPI = new WihyAPIService();
export default wihyAPI;