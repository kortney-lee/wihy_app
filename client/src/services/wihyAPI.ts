import { API_CONFIG, WIHY_API_ENDPOINT, getEnhancedWihyEndpoint, WIHY_HEALTH_CHECK_URL, WIHY_SCAN_IMAGE_URL, WIHY_SCAN_BARCODE_URL } from '../config/apiConfig';
import { logger } from '../utils/logger';

// Types for the WiHy Enhanced Model API (2,325 training examples)
export interface EnhancedHealthQuestion {
  query: string;                          // REQUIRED: Your health/nutrition question
  context?: string;                       // OPTIONAL: Additional context for the question
  user_id?: string;                       // OPTIONAL: User identifier for personalization
}

// Enhanced Model Response Structure
export interface EnhancedHealthResponse {
  question: string;
  answer: string;
  research_citations: string[];
  wihy_wisdom: string[];
  confidence_score: number;
  model_version: string;
  training_examples_used: number;
  timestamp: string;
}

// Image Scanner Response Structure
export interface ImageScanResponse {
  success: boolean;
  overall_assessment: {
    health_score: number;
    verdict: string;
    nova_group: number;
  };
  google_vision_analysis: {
    vision_api_success: boolean;
    detected_text: string[];
    labels: string[];
  };
  detected_foods: Array<{
    name: string;
    confidence: number;
    nova_group: number;
  }>;
  nova_chart_reference: {
    client_guidance: {
      color_coding: 'green' | 'yellow' | 'orange' | 'red';
      action: 'CHOOSE' | 'MODERATE' | 'LIMIT' | 'AVOID';
      message: string;
    };
  };
  wihy_recommendations: string[];
  carcinogen_warnings: string[];
  family_safety: {
    family_safe: boolean;
    family_verdict: string;
  };
  data_sources: string[];
}

// Barcode Scanner Response Structure  
export interface BarcodeScanResponse {
  success: boolean;
  nova_group: number;
  health_score: number;
  product_name: string;
  ingredients: string[];
  nutritional_data: {
    calories_per_100g: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sodium_mg: number;
  };
  health_analysis: {
    carcinogen_alerts: string[];
    toxic_additives: string[];
    processing_level: string;
  };
  wihy_recommendations: string[];
  data_sources: string[];
}

// Legacy interfaces for backward compatibility
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
  dietary_restrictions?: string[];
  activity_level?: 'low' | 'moderate' | 'high';
  current_health_concerns?: string[];
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

class WihyEnhancedAPIService {
  private baseURL: string;
  private isLocalDevelopment: boolean;

  constructor() {
    this.baseURL = API_CONFIG.WIHY_ENHANCED_API_URL;
    this.isLocalDevelopment = this.baseURL.includes('localhost');
  }

  /**
   * Ask WiHy Enhanced Model a health-related question (2,325 training examples)
   */
  async askEnhancedHealthQuestion(request: EnhancedHealthQuestion): Promise<EnhancedHealthResponse> {
    try {
      logger.apiRequest('Making WiHy Enhanced Model API request', request);
      
      const endpoint = `${this.baseURL}/ask`;
      
      // Use fetch API with timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await this.fetchWithRetry(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.apiResponse('WiHy Enhanced Model API response received', data);
      return data;
    } catch (error) {
      logger.error('WiHy Enhanced Model API error:', error);
      throw this.handleEnhancedError(error);
    }
  }

  /**
   * Scan food image using enhanced vision analysis
   */
  async scanFoodImage(imageFile: File, context: string = ''): Promise<ImageScanResponse> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('context', context);
      
      const endpoint = WIHY_SCAN_IMAGE_URL;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for images
      
      const response = await this.fetchWithRetry(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.apiResponse('WiHy Image Scanner response received', data);
      return data;
    } catch (error) {
      logger.error('WiHy Image Scanner error:', error);
      throw this.handleScannerError(error, 'image');
    }
  }

  /**
   * Scan barcode using enhanced nutrition database
   */
  async scanBarcode(barcode: string, context: any = {}): Promise<BarcodeScanResponse> {
    try {
      const requestBody = {
        query: barcode,
        scan_location: context.scan_location || 'web_app',
        device_type: context.device_type || 'desktop'
      };
      
      const endpoint = WIHY_SCAN_BARCODE_URL;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      const response = await this.fetchWithRetry(endpoint, {
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
      logger.apiResponse('WiHy Barcode Scanner response received', data);
      return data;
    } catch (error) {
      logger.error('WiHy Barcode Scanner error:', error);
      throw this.handleScannerError(error, 'barcode');
    }
  }

  /**
   * Check API health and get status
   */
  async checkAPIHealth(): Promise<{ status: string; model_version: string; training_examples: number }> {
    try {
      const response = await fetch(WIHY_HEALTH_CHECK_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('WiHy API health check failed:', error);
      throw error;
    }
  }

  /**
   * Fetch with simple retry logic (single endpoint only)
   */
  private async fetchWithRetry(url: string, options: RequestInit, retries: number = 2): Promise<Response> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, options);
        return response; // Return response for error handling upstream
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Attempt ${attempt + 1} failed for ${this.baseURL}:`, error);
        
        // If this is the last attempt, throw error
        if (attempt === retries) {
          throw lastError;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
    
    throw lastError!;
  }

  /**
   * Enhanced error handling for API responses
   */
  private handleEnhancedError(error: any): Error {
    if (error instanceof Error) {
      // Check for timeout/abort errors
      if (error.name === 'AbortError') {
        return new Error('TIMEOUT_ERROR: Enhanced model request timed out - services may be under heavy load');
      }
      
      // Check for CORS errors
      if (error.message.includes('CORS') || 
          error.message.includes('Access to fetch') ||
          error.message.includes('No \'Access-Control-Allow-Origin\'')) {
        return new Error('CORS_ERROR: Unable to connect to WiHy Enhanced Model from this domain');
      }
      
      // Check for network/connectivity issues
      if (error.message.includes('fetch') || 
          error.message.includes('network') || 
          error.name === 'TypeError' ||
          error.message.includes('Failed to fetch')) {
        return new Error('NETWORK_ERROR: Unable to connect to WiHy Enhanced Model services');
      }
      
      // Check for server errors
      if (error.message.includes('HTTP error! status: 5')) {
        return new Error('SERVER_ERROR: WiHy Enhanced Model temporarily unavailable');
      }
      
      return new Error(error.message || 'WiHy Enhanced Model request failed');
    }
    
    return new Error('Unknown error occurred while contacting WiHy Enhanced Model');
  }

  /**
   * Scanner-specific error handling
   */
  private handleScannerError(error: any, scanType: 'image' | 'barcode'): Error {
    const context = scanType === 'image' ? 'Image Scanner' : 'Barcode Scanner';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new Error(`TIMEOUT_ERROR: ${context} request timed out`);
      }
      
      if (error.message.includes('HTTP error! status: 400')) {
        return new Error(`VALIDATION_ERROR: Invalid ${scanType} format or data`);
      }
      
      if (error.message.includes('HTTP error! status: 404')) {
        return new Error(`NOT_FOUND: ${scanType === 'barcode' ? 'Product not found in nutrition databases' : 'Unable to analyze image'}`);
      }
      
      return new Error(`${context.toUpperCase()}_ERROR: ${error.message}`);
    }
    
    return new Error(`Unknown ${context.toLowerCase()} error occurred`);
  }

  /**
   * Legacy compatibility method - Ask WiHy a health-related question
   * Now routes to Enhanced Model ONLY (no fallbacks)
   */
  async askAnything(request: WihyRequest | UnifiedRequest): Promise<HealthQuestionResponse | WihyResponse | UnifiedResponse> {
    try {
      // Convert legacy request to enhanced format
      const enhancedRequest: EnhancedHealthQuestion = {
        query: request.query,
        context: 'user_context' in request ? JSON.stringify(request.user_context) : '',
        user_id: 'user_id' in request ? request.user_id : undefined
      };
      
      // Use enhanced model ONLY
      const enhancedResponse = await this.askEnhancedHealthQuestion(enhancedRequest);
      
      // Convert enhanced response to legacy format for backward compatibility
      return this.convertEnhancedToLegacy(enhancedResponse, request.query);
      
    } catch (error) {
      logger.error('Enhanced WiHy API failed:', error);
      throw error;
    }
  }

  /**
   * Fallback method for legacy unified API
   */
  private async askLegacyUnified(request: WihyRequest | UnifiedRequest): Promise<HealthQuestionResponse | WihyResponse | UnifiedResponse> {
    logger.apiRequest('Making WiHy Legacy API request', request);
    
    let requestBody: any;
    let endpoint: string;
    
    // Use legacy endpoints
    endpoint = this.isLocalDevelopment ? 
      `${API_CONFIG.WIHY_UNIFIED_API_URL}/ask` : 
      `${API_CONFIG.WIHY_UNIFIED_API_URL}/ask`;
    
    // Build HealthQuestion object according to legacy spec
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
        user_context: unifiedReq.context || {},
        include_nutrition: true,
        include_biblical_wisdom: true,
        include_charts: true
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
    logger.apiResponse('WiHy Legacy API response received', data);
    return data;
  }

  /**
   * Convert Enhanced Model response to legacy format for backward compatibility
   */
  private convertEnhancedToLegacy(enhancedResponse: EnhancedHealthResponse, originalQuery: string): WihyResponse {
    return {
      success: true,
      timestamp: enhancedResponse.timestamp || new Date().toISOString(),
      response_type: 'enhanced_model',
      query: originalQuery,
      wihy_response: {
        query_type: 'enhanced_model',
        query: originalQuery,
        core_principle: enhancedResponse.answer,
        personalized_analysis: {
          identified_risk_factors: [],
          priority_health_goals: [enhancedResponse.answer],
          action_items: enhancedResponse.wihy_wisdom.map((wisdom: string, index: number) => ({
            action: wisdom,
            priority: 'high',
            target_illness: 'general_health',
            evidence_level: 'enhanced_model',
            mechanism: 'biblical_wisdom',
            timeline: 'immediate'
          })),
          timeline: 'immediate'
        },
        research_foundation: enhancedResponse.research_citations.map((citation: string) => ({
          citation_text: citation,
          study_type: 'enhanced_model_research',
          key_finding: citation
        })),
        progress_tracking: {
          key_metrics: ['enhanced_health_understanding'],
          reassessment_period: '1 week'
        },
        biblical_wisdom: enhancedResponse.wihy_wisdom
      },
      message: enhancedResponse.answer
    };
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
        response_type: unifiedResponse.request_type,
        query: originalQuery,
        wihy_response: {
          query_type: unifiedResponse.request_type,
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
      response_type: unifiedResponse.request_type,
      query: originalQuery,
      wihy_response: {
        query_type: unifiedResponse.request_type,
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
   * Legacy scan food images method - now uses enhanced scanner
   */
  async scanFood(file?: File, scanOptions?: Partial<ScanRequest>): Promise<WihyResponse | UnifiedResponse> {
    try {
      if (file) {
        // Use enhanced image scanner
        const enhancedResponse = await this.scanFoodImage(file, scanOptions?.user_context ? JSON.stringify(scanOptions.user_context) : '');
        
        // Convert to legacy format
        return this.convertImageScanToLegacy(enhancedResponse, 'Image scan analysis');
        
      } else if (scanOptions?.barcode) {
        // Use enhanced barcode scanner
        const enhancedResponse = await this.scanBarcode(scanOptions.barcode, scanOptions.user_context);
        
        // Convert to legacy format
        return this.convertBarcodeScanToLegacy(enhancedResponse, `Barcode scan: ${scanOptions.barcode}`);
        
      } else {
        throw new Error('No file or barcode provided for scanning');
      }
      
    } catch (error) {
      logger.error('WiHy Scan error:', error);
      throw error;
    }
  }

  /**
   * Convert Image Scanner response to legacy format
   */
  private convertImageScanToLegacy(response: ImageScanResponse, query: string): WihyResponse {
    const recommendations = response.wihy_recommendations || [];
    const warnings = response.carcinogen_warnings || [];
    
    return {
      success: response.success,
      timestamp: new Date().toISOString(),
      response_type: 'image_scan',
      query: query,
      wihy_response: {
        query_type: 'image_scan',
        query: query,
        core_principle: response.overall_assessment?.verdict || 'Image analysis complete',
        personalized_analysis: {
          identified_risk_factors: warnings.map(warning => ({
            risk_factor: warning,
            associated_illnesses: 'various',
            prevalence_rate: 0,
            preventability_score: 100
          })),
          priority_health_goals: recommendations,
          action_items: recommendations.map(rec => ({
            action: rec,
            priority: 'high',
            target_illness: 'general_health',
            evidence_level: 'image_analysis',
            mechanism: 'food_choice',
            timeline: 'immediate'
          })),
          timeline: 'immediate'
        },
        research_foundation: response.data_sources?.map(source => ({
          citation_text: source,
          study_type: 'database',
          key_finding: source
        })) || [],
        progress_tracking: {
          key_metrics: ['food_quality_awareness'],
          reassessment_period: '1 week'
        },
        biblical_wisdom: ['Choose foods that nourish your temple - 1 Corinthians 6:19']
      },
      message: this.formatImageScanResponse(response)
    };
  }

  /**
   * Convert Barcode Scanner response to legacy format
   */
  private convertBarcodeScanToLegacy(response: BarcodeScanResponse, query: string): WihyResponse {
    const recommendations = response.wihy_recommendations || [];
    const warnings = [...(response.health_analysis?.carcinogen_alerts || []), ...(response.health_analysis?.toxic_additives || [])];
    
    return {
      success: response.success,
      timestamp: new Date().toISOString(),
      response_type: 'barcode_scan',
      query: query,
      wihy_response: {
        query_type: 'barcode_scan',
        query: query,
        core_principle: `Product Analysis: ${response.product_name}`,
        personalized_analysis: {
          identified_risk_factors: warnings.map(warning => ({
            risk_factor: warning,
            associated_illnesses: 'various',
            prevalence_rate: 0,
            preventability_score: 100
          })),
          priority_health_goals: recommendations,
          action_items: recommendations.map(rec => ({
            action: rec,
            priority: 'high',
            target_illness: 'general_health',
            evidence_level: 'product_analysis',
            mechanism: 'ingredient_awareness',
            timeline: 'immediate'
          })),
          timeline: 'immediate'
        },
        research_foundation: response.data_sources?.map(source => ({
          citation_text: source,
          study_type: 'nutrition_database',
          key_finding: source
        })) || [],
        progress_tracking: {
          key_metrics: ['product_awareness', 'nova_understanding'],
          reassessment_period: '1 week'
        },
        biblical_wisdom: ['Real food doesn\'t need complicated analysis - choose whole foods']
      },
      message: this.formatBarcodeScanResponse(response)
    };
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
   * General health search using the unified API
   */
  async searchHealth(query: string, userContext?: UserContext): Promise<WihyResponse | UnifiedResponse> {
    const request: UnifiedRequest = {
      query: query,
      request_type: 'auto',
      context: userContext || {}
    };

    const response = await this.askAnything(request);
    // Return the raw response (could be legacy WihyResponse or UnifiedResponse)
    return response as WihyResponse | UnifiedResponse;
  }

  /**
   * Format Enhanced Model response for display in the UI
   */
  formatEnhancedResponse(response: EnhancedHealthResponse): string {
    let formatted = `# WiHy Enhanced Health Intelligence\n\n`;
    
    // Main response content
    formatted += response.answer;
    
    // Add research citations if available
    if (response.research_citations && response.research_citations.length > 0) {
      formatted += `\n\n## 📚 Research Citations\n`;
      response.research_citations.forEach((citation, index) => {
        formatted += `${index + 1}. ${citation}\n`;
      });
    }
    
    // Add biblical wisdom if available
    if (response.wihy_wisdom && response.wihy_wisdom.length > 0) {
      formatted += `\n\n## ✝️ Biblical Wisdom\n`;
      response.wihy_wisdom.forEach(wisdom => {
        formatted += `> ${wisdom}\n\n`;
      });
    }
    
    // Add enhanced model info
    formatted += `\n\n---\n\n`;
    formatted += `*Enhanced Model Response (${response.training_examples_used} training examples)*\n`;
    formatted += `*Confidence Score: ${Math.round(response.confidence_score * 100)}%*\n`;
    formatted += `*Model Version: ${response.model_version}*`;
    
    return formatted;
  }

  /**
   * Format Image Scanner response for display
   */
  formatImageScanResponse(response: ImageScanResponse): string {
    let formatted = `# 📷 WiHy Image Analysis Results\n\n`;
    
    if (response.success && response.overall_assessment) {
      const { health_score, verdict, nova_group } = response.overall_assessment;
      const guidance = response.nova_chart_reference?.client_guidance;
      
      formatted += `## Health Assessment\n`;
      formatted += `**Health Score:** ${health_score}/100\n`;
      formatted += `**Verdict:** ${verdict}\n`;
      formatted += `**NOVA Group:** ${nova_group} (${this.getNovaLabel(nova_group)})\n`;
      
      if (guidance) {
        formatted += `**Recommendation:** ${guidance.action} - ${guidance.message}\n\n`;
      }
      
      // Detected foods
      if (response.detected_foods && response.detected_foods.length > 0) {
        formatted += `## 🍽️ Detected Foods\n`;
        response.detected_foods.forEach(food => {
          formatted += `- **${food.name}** (Confidence: ${Math.round(food.confidence * 100)}%, NOVA: ${food.nova_group})\n`;
        });
        formatted += '\n';
      }
      
      // WIHY recommendations
      if (response.wihy_recommendations && response.wihy_recommendations.length > 0) {
        formatted += `## 💡 WIHY Recommendations\n`;
        response.wihy_recommendations.forEach(rec => {
          formatted += `- ${rec}\n`;
        });
        formatted += '\n';
      }
      
      // Health warnings
      if (response.carcinogen_warnings && response.carcinogen_warnings.length > 0) {
        formatted += `## ⚠️ Health Warnings\n`;
        response.carcinogen_warnings.forEach(warning => {
          formatted += `- ${warning}\n`;
        });
        formatted += '\n';
      }
      
      // Family safety
      if (response.family_safety) {
        formatted += `## 👨‍👩‍👧‍👦 Family Safety\n`;
        formatted += `**Status:** ${response.family_safety.family_safe ? '✅ Safe' : '❌ Not Recommended'}\n`;
        formatted += `**Verdict:** ${response.family_safety.family_verdict}\n\n`;
      }
      
    } else {
      formatted += `Analysis failed. Please try again or choose whole foods when in doubt.\n\n`;
    }
    
    // Data sources
    if (response.data_sources && response.data_sources.length > 0) {
      formatted += `---\n\n*Data sources: ${response.data_sources.join(', ')}*`;
    }
    
    return formatted;
  }

  /**
   * Format Barcode Scanner response for display
   */
  formatBarcodeScanResponse(response: BarcodeScanResponse): string {
    let formatted = `# 🔍 WiHy Barcode Analysis\n\n`;
    
    if (response.success) {
      formatted += `## Product Information\n`;
      formatted += `**Product:** ${response.product_name}\n`;
      formatted += `**Health Score:** ${response.health_score}/100\n`;
      formatted += `**NOVA Group:** ${response.nova_group} (${this.getNovaLabel(response.nova_group)})\n\n`;
      
      // Nutritional data
      if (response.nutritional_data) {
        const nutrition = response.nutritional_data;
        formatted += `## 📊 Nutrition Facts (per 100g)\n`;
        formatted += `- **Calories:** ${nutrition.calories_per_100g}\n`;
        formatted += `- **Protein:** ${nutrition.protein_g}g\n`;
        formatted += `- **Carbohydrates:** ${nutrition.carbs_g}g\n`;
        formatted += `- **Fat:** ${nutrition.fat_g}g\n`;
        formatted += `- **Fiber:** ${nutrition.fiber_g}g\n`;
        formatted += `- **Sodium:** ${nutrition.sodium_mg}mg\n\n`;
      }
      
      // Health analysis
      if (response.health_analysis) {
        const analysis = response.health_analysis;
        formatted += `## 🔬 Health Analysis\n`;
        formatted += `**Processing Level:** ${analysis.processing_level}\n`;
        
        if (analysis.carcinogen_alerts && analysis.carcinogen_alerts.length > 0) {
          formatted += `**⚠️ Carcinogen Alerts:**\n`;
          analysis.carcinogen_alerts.forEach(alert => {
            formatted += `- ${alert}\n`;
          });
        }
        
        if (analysis.toxic_additives && analysis.toxic_additives.length > 0) {
          formatted += `**🧪 Toxic Additives:**\n`;
          analysis.toxic_additives.forEach(additive => {
            formatted += `- ${additive}\n`;
          });
        }
        formatted += '\n';
      }
      
      // WIHY recommendations
      if (response.wihy_recommendations && response.wihy_recommendations.length > 0) {
        formatted += `## 💡 WIHY Recommendations\n`;
        response.wihy_recommendations.forEach(rec => {
          formatted += `- ${rec}\n`;
        });
        formatted += '\n';
      }
      
      // Ingredients
      if (response.ingredients && response.ingredients.length > 0) {
        formatted += `## 🧾 Ingredients\n`;
        formatted += response.ingredients.join(', ') + '\n\n';
      }
      
    } else {
      formatted += `Product not found or analysis failed. Choose foods with 5 or fewer ingredients when in doubt.\n\n`;
    }
    
    // Data sources
    if (response.data_sources && response.data_sources.length > 0) {
      formatted += `---\n\n*Data sources: ${response.data_sources.join(', ')}*`;
    }
    
    return formatted;
  }

  /**
   * Get NOVA group label
   */
  private getNovaLabel(novaGroup: number): string {
    const labels = {
      1: 'Natural/Unprocessed',
      2: 'Processed Culinary Ingredients', 
      3: 'Processed Foods',
      4: 'Ultra-Processed Foods'
    };
    return labels[novaGroup as keyof typeof labels] || 'Unknown';
  }

  /**
   * Get NOVA guidance for UI display
   */
  getNovaGuidance(novaGroup: number): { action: string; color: string; message: string } {
    const guidance = {
      1: { action: 'CHOOSE', color: 'green', message: 'Real food as God intended' },
      2: { action: 'MODERATE', color: 'yellow', message: 'Use sparingly' },
      3: { action: 'LIMIT', color: 'orange', message: 'Find alternatives' },
      4: { action: 'AVOID', color: 'red', message: 'Your family deserves better' }
    };
    
    return guidance[novaGroup as keyof typeof guidance] || guidance[4];
  }
  formatWihyResponse(response: HealthQuestionResponse | WihyResponse | UnifiedResponse): string {
    // Handle new HealthQuestionResponse format (OpenAPI v4.0.0)
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
  extractRecommendations(response: HealthQuestionResponse | WihyResponse | UnifiedResponse): string[] {
    const recommendations: string[] = [];

    // Handle new HealthQuestionResponse format (OpenAPI v4.0.0)
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
      if (legacyResp.wihy_response.personalized_analysis?.action_items) {
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
  extractCitations(response: HealthQuestionResponse | WihyResponse | UnifiedResponse): string[] {
    const citations: string[] = [];

    // Handle new HealthQuestionResponse format (OpenAPI v4.0.0)
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
      if (legacyResp.wihy_response.research_foundation) {
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
}

// Export a singleton instance of the enhanced API service
export const wihyAPI = new WihyEnhancedAPIService();
export default wihyAPI;