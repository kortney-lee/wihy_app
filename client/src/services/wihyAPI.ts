// ==================== WIHY HEALTH INTELLIGENCE API v4.0.0 ====================
// Simplified implementation using ONLY the ASK endpoint
// All legacy functionality removed per user request
// Documentation: WIHY Health Intelligence API v4.0.0

import logger from '../utils/logger';
import { API_CONFIG } from '../config/apiConfig';

// ==================== API v4.0.0 INTERFACES ====================

// ASK endpoint request interface (OpenAPI v4.0.0)
export interface HealthQuestionRequest {
  query: string;
  analyse?: boolean; // Optional OpenAI enhanced analysis
  user_context?: {
    age?: number;
    health_goals?: string[];
    dietary_restrictions?: string[];
    current_medications?: string[];
    activity_level?: 'low' | 'moderate' | 'high' | 'very_high';
    health_concerns?: string[];
  };
}

// ASK endpoint response interface (OpenAPI v4.0.0)
export interface HealthQuestionResponse {
  success: boolean;
  data: {
    response: string;
    health_insights: {
      key_benefits: string[];
      potential_risks: string[];
      recommendations: string[];
    };
    processor_used: string;
    processing_time: number;
  };
  analysis?: {
    summary: string;
    recommendations: string[];
    confidence_score: number;
    charts?: {
      [key: string]: {
        type: string;
        title: string;
        data: any[];
        colors?: string[];
      };
    };
    metadata?: {
      processor: string;
      nova_group?: number;
      health_score?: number;
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
  processing_time?: number;
}

// Legacy compatibility types (minimal set for existing components)
export interface UserContext {
  age?: number;
  health_concerns?: string[];
  dietary_restrictions?: string[];
  activity_level?: 'low' | 'moderate' | 'high';
  conversation_mode?: boolean; // For ChatWidget compatibility
  response_style?: string; // For ChatWidget compatibility
  current_context?: string; // For ChatWidget compatibility
  is_followup?: boolean; // For ChatWidget compatibility
  conversation_context?: any; // For ChatWidget conversation history
}

export interface WihyRequest {
  query: string;
  user_context?: UserContext;
}

// Legacy response interface for backward compatibility
export interface WihyResponse {
  success: boolean;
  timestamp: string;
  response_type: string;
  query: string;
  user_context?: UserContext;
  wihy_response: {
    query_type: string;
    query: string;
    core_principle: string;
    personalized_analysis: {
      identified_risk_factors: any[];
      priority_health_goals: string[];
      action_items: Array<{
        action: string;
        priority: string;
        target_illness: string;
        evidence_level: string;
        mechanism: string;
        timeline: string;
      }>;
      timeline: string;
    };
    research_foundation: Array<{
      citation_text: string;
      study_type: string;
      key_finding: string;
    }>;
    progress_tracking: {
      key_metrics: string[];
      reassessment_period: string;
    };
    biblical_wisdom: string[];
  };
  message: string;
}

// Legacy UnifiedResponse interface for chart components compatibility
export interface UnifiedResponse {
  success: boolean;
  data: {
    response?: string;
    analysis?: string;
    recommendations?: {
      immediate_actions?: string[];
      lifestyle_changes?: string[];
      better_alternatives?: string[];
      shopping_tips?: string[];
      meal_planning?: string[];
    };
    sources?: string[];
    [key: string]: any;
  };
  service_used: string;
  request_type?: string;
  processing_time?: number;
}

// Type guard for detecting unified responses at runtime (for chart compatibility)
export function isUnifiedResponse(obj: any): obj is UnifiedResponse {
  return obj && typeof obj === 'object' && ('data' in obj) && ('service_used' in obj);
}

// ==================== WIHY API SERVICE CLASS ====================

class WihyAPIService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.WIHY_API_URL;
  }

  /**
   * Ask WiHy Health Intelligence a question using the v4.0.0 ASK endpoint
   */
  async askHealthQuestion(request: HealthQuestionRequest): Promise<HealthQuestionResponse> {
    try {
      logger.info('Making WiHy API v4.0.0 ASK request', { query: request.query });
      
      const endpoint = `${this.baseURL}/ask`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`WiHy API error: ${response.status} ${response.statusText}`, { error: errorText });
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: HealthQuestionResponse = await response.json();
      logger.info('WiHy API response received', { 
        success: data.success, 
        processor: data.data.processor_used,
        processingTime: data.data.processing_time 
      });
      
      return data;
    } catch (error) {
      logger.error('WiHy API request failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Check API health status
   */
  async checkHealth(): Promise<{ status: string; version: string }> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
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
   * Legacy compatibility method - converts old request format to new format
   */
  async askAnything(request: WihyRequest): Promise<WihyResponse> {
    try {
      // Convert legacy request to v4.0.0 format
      const healthRequest: HealthQuestionRequest = {
        query: request.query,
        user_context: request.user_context ? {
          age: request.user_context.age,
          health_concerns: request.user_context.health_concerns,
          dietary_restrictions: request.user_context.dietary_restrictions,
          activity_level: request.user_context.activity_level
        } : undefined
      };
      
      // Call the new API
      const response = await this.askHealthQuestion(healthRequest);
      
      // Convert response to legacy format for backward compatibility
      return this.convertToLegacyFormat(response, request.query);
      
    } catch (error) {
      logger.error('Legacy askAnything failed:', error);
      throw error;
    }
  }

  /**
   * Legacy compatibility method - general health search
   */
  async searchHealth(query: string, userContext?: UserContext): Promise<WihyResponse> {
    const request: WihyRequest = {
      query: query,
      user_context: userContext
    };

    // If conversation_mode is enabled, use new API and convert to legacy format
    if (userContext?.conversation_mode) {
      const healthRequest: HealthQuestionRequest = {
        query: query,
        user_context: userContext ? {
          age: userContext.age,
          health_concerns: userContext.health_concerns,
          dietary_restrictions: userContext.dietary_restrictions,
          activity_level: userContext.activity_level
        } : undefined
      };
      
      const newResponse = await this.askHealthQuestion(healthRequest);
      return this.convertToLegacyFormat(newResponse, query);
    }

    return this.askAnything(request);
  }

  /**
   * Legacy compatibility method - nutrition search  
   */
  async searchNutrition(foodQuery: string, userContext?: UserContext): Promise<WihyResponse> {
    const query = `Nutrition information for ${foodQuery}`;
    return this.searchHealth(query, userContext);
  }

  /**
   * Legacy compatibility method - health news (now uses general health search)
   */
  async getHealthNews(categories?: string[], limit?: number): Promise<WihyResponse> {
    const query = categories && categories.length > 0 
      ? `Latest health news about ${categories.join(', ')}`
      : 'Latest health news and wellness updates';
    
    return this.searchHealth(query);
  }

  /**
   * Convert new API response to legacy format for backward compatibility
   */
  private convertToLegacyFormat(response: HealthQuestionResponse, originalQuery: string): WihyResponse {
    return {
      success: response.success,
      timestamp: response.timestamp,
      response_type: 'health_intelligence_v4',
      query: originalQuery,
      wihy_response: {
        query_type: 'health_intelligence',
        query: originalQuery,
        core_principle: response.data.response,
        personalized_analysis: {
          identified_risk_factors: [],
          priority_health_goals: response.data.health_insights.key_benefits,
          action_items: response.data.health_insights.recommendations.map((rec: string, index: number) => ({
            action: rec,
            priority: 'high',
            target_illness: 'general_health',
            evidence_level: 'high',
            mechanism: 'lifestyle_modification',
            timeline: 'ongoing'
          })),
          timeline: 'ongoing'
        },
        research_foundation: [{
          citation_text: `WiHy Health Intelligence v4.0.0 (${response.data.processor_used})`,
          study_type: 'ai_analysis',
          key_finding: response.data.response
        }],
        progress_tracking: {
          key_metrics: ['health_understanding', 'wellness_improvement'],
          reassessment_period: '2 weeks'
        },
        biblical_wisdom: []
      },
      message: response.data.response
    };
  }

  /**
   * Enhanced error handling
   */
  private handleError(error: any): Error {
    if (error instanceof Error) {
      // Check for timeout/abort errors
      if (error.name === 'AbortError') {
        return new Error('Request timed out - WiHy Health Intelligence services may be under heavy load');
      }
      
      // Check for CORS errors
      if (error.message.includes('CORS') || 
          error.message.includes('Access to fetch') ||
          error.message.includes('No \'Access-Control-Allow-Origin\'')) {
        return new Error('Unable to connect to WiHy Health Intelligence from this domain');
      }
      
      // Check for network/connectivity issues
      if (error.message.includes('fetch') || 
          error.message.includes('network') || 
          error.name === 'TypeError' ||
          error.message.includes('Failed to fetch')) {
        return new Error('Network error - Unable to connect to WiHy Health Intelligence services');
      }
      
      // Check for server errors
      if (error.message.includes('HTTP error! status: 5')) {
        return new Error('WiHy Health Intelligence services temporarily unavailable');
      }
      
      return error;
    }
    
    return new Error('Unknown error occurred while contacting WiHy Health Intelligence');
  }

  /**
   * Format response for display in the UI
   */
  formatResponse(response: HealthQuestionResponse): string {
    let formatted = `# WiHy Health Intelligence\n\n`;
    
    // Main response content (prioritize analysis summary if available)
    if (response.analysis?.summary) {
      formatted += response.analysis.summary;
    } else {
      formatted += response.data.response;
    }
    
    // Add health insights if available
    if (response.data.health_insights) {
      if (response.data.health_insights.key_benefits?.length) {
        formatted += `\n\n## 🌟 Key Benefits\n`;
        response.data.health_insights.key_benefits.forEach(benefit => {
          formatted += `- ${benefit}\n`;
        });
      }
      
      if (response.data.health_insights.potential_risks?.length) {
        formatted += `\n\n## ⚠️ Potential Risks\n`;
        response.data.health_insights.potential_risks.forEach(risk => {
          formatted += `- ${risk}\n`;
        });
      }
      
      if (response.data.health_insights.recommendations?.length) {
        formatted += `\n\n## 📋 Recommendations\n`;
        response.data.health_insights.recommendations.forEach(rec => {
          formatted += `- ${rec}\n`;
        });
      }
    }
    
    // Add enhanced OpenAI analysis if available
    if (response.analysis?.openai_analysis) {
      const openai = response.analysis.openai_analysis;
      
      formatted += `\n\n## 🧠 Enhanced Scientific Analysis\n\n`;
      formatted += openai.details;
      
      if (openai.sources?.length) {
        formatted += `\n\n### 📚 Research Sources\n`;
        openai.sources.forEach((source, index) => {
          formatted += `${index + 1}. ${source}\n`;
        });
      }
      
      if (openai.related_topics?.length) {
        formatted += `\n\n### 🔗 Related Topics\n`;
        openai.related_topics.forEach(topic => {
          formatted += `- ${topic}\n`;
        });
      }
      
      if (openai.recommendations?.length) {
        formatted += `\n\n### 💡 Evidence-Based Recommendations\n`;
        openai.recommendations.forEach(rec => {
          formatted += `- ${rec}\n`;
        });
      }
      
      if (openai.medical_disclaimer) {
        formatted += `\n\n### ⚕️ Medical Disclaimer\n`;
        formatted += `*${openai.medical_disclaimer}*`;
      }
    }
    
    // Add confidence score if available
    if (response.analysis?.confidence_score !== undefined) {
      formatted += `\n\n**Confidence Score**: ${Math.round(response.analysis.confidence_score * 100)}%`;
    }
    
    // Add processing info
    const processingTime = response.processing_time || response.data.processing_time;
    formatted += `\n\n---\n\n*Processed by ${response.data.processor_used} in ${processingTime.toFixed(2)}ms*`;
    
    return formatted;
  }

  /**
   * Format legacy response for display
   */
  formatWihyResponse(response: WihyResponse): string {
    let formatted = `# ${response.wihy_response.core_principle}\n\n`;
    
    // Add recommendations
    if (response.wihy_response.personalized_analysis.action_items?.length > 0) {
      formatted += `## 📋 Recommendations\n`;
      response.wihy_response.personalized_analysis.action_items.forEach(item => {
        formatted += `- ${item.action}\n`;
      });
      formatted += '\n';
    }
    
    // Add health goals
    if (response.wihy_response.personalized_analysis.priority_health_goals?.length > 0) {
      formatted += `## 🎯 Health Benefits\n`;
      response.wihy_response.personalized_analysis.priority_health_goals.forEach(goal => {
        formatted += `- ${goal}\n`;
      });
      formatted += '\n';
    }
    
    // Add timestamp
    formatted += `---\n\n*WiHy Health Intelligence analysis generated at: ${new Date(response.timestamp).toLocaleString()}*\n`;
    
    return formatted;
  }

  /**
   * Extract recommendations from response for UI display
   */
  extractRecommendations(response: HealthQuestionResponse | WihyResponse): string[] {
    if ('data' in response && response.data) {
      // New format - check both standard and enhanced recommendations
      const healthResp = response as HealthQuestionResponse;
      const recommendations: string[] = [];
      
      // Add standard recommendations
      if (healthResp.data.health_insights.recommendations) {
        recommendations.push(...healthResp.data.health_insights.recommendations);
      }
      
      // Add enhanced OpenAI recommendations if available
      if (healthResp.analysis?.openai_analysis?.recommendations) {
        recommendations.push(...healthResp.analysis.openai_analysis.recommendations);
      }
      
      // Add analysis-level recommendations if available
      if (healthResp.analysis?.recommendations) {
        recommendations.push(...healthResp.analysis.recommendations);
      }
      
      return recommendations;
    } else {
      // Legacy format
      const legacyResp = response as WihyResponse;
      return legacyResp.wihy_response.personalized_analysis.action_items?.map(item => item.action) || [];
    }
  }

  /**
   * Extract key benefits from response for UI display
   */
  extractBenefits(response: HealthQuestionResponse | WihyResponse): string[] {
    if ('data' in response && response.data) {
      // New format
      return (response as HealthQuestionResponse).data.health_insights.key_benefits || [];
    } else {
      // Legacy format  
      const legacyResp = response as WihyResponse;
      return legacyResp.wihy_response.personalized_analysis.priority_health_goals || [];
    }
  }

  /**
   * Extract citations from response for UI display (legacy compatibility)
   */
  extractCitations(response: HealthQuestionResponse | WihyResponse | UnifiedResponse): string[] {
    // Handle new HealthQuestionResponse format
    if ('data' in response && response.data && 'processor_used' in response.data) {
      const healthResp = response as HealthQuestionResponse;
      const citations: string[] = [];
      
      // Add standard processor citation
      citations.push(`WiHy Health Intelligence v4.0.0 (${healthResp.data.processor_used})`);
      
      // Add OpenAI sources if available
      if (healthResp.analysis?.openai_analysis?.sources) {
        citations.push(...healthResp.analysis.openai_analysis.sources);
      }
      
      return citations;
    }

    // Handle legacy WihyResponse format
    if ('wihy_response' in response) {
      const legacyResp = response as WihyResponse;
      return legacyResp.wihy_response.research_foundation?.map(research => 
        `${research.citation_text}: ${research.key_finding}`
      ) || [];
    }

    // Handle UnifiedResponse format
    if ('service_used' in response) {
      const unifiedResp = response as UnifiedResponse;
      return unifiedResp.data.sources || [`${unifiedResp.service_used} service`];
    }

    return [];
  }

  /**
   * Legacy compatibility - Enhanced health question (renamed method)
   * NOTE: This method now defaults to analyse: false unless explicitly specified
   */
  async askEnhancedHealthQuestion(request: { query: string; context?: string; user_id?: string; analyse?: boolean }): Promise<HealthQuestionResponse> {
    const healthRequest: HealthQuestionRequest = {
      query: request.query,
      analyse: request.analyse ?? false, // Default to basic analysis unless explicitly requested
      user_context: request.context ? JSON.parse(request.context) : undefined
    };
    
    return this.askHealthQuestion(healthRequest);
  }

  /**
   * Legacy compatibility - Scan food (removed functionality, returns helpful message)
   */
  async scanFood(file?: File, options?: any): Promise<WihyResponse> {
    logger.warn('scanFood method called but scanning functionality has been removed per API v4.0.0 update');
    
    const query = `Analyze the food in this image: general food analysis`;
    const response = await this.searchHealth(query);
    
    // Add a note about the removed functionality  
    response.message = "Food scanning functionality has been updated. For food analysis, please describe the food in your question.";
    
    return response;
  }

  /**
   * Legacy compatibility - Scan food image (removed functionality, returns helpful message)
   */
  async scanFoodImage(file: File, context?: string): Promise<any> {
    logger.warn('scanFoodImage method called but scanning functionality has been removed per API v4.0.0 update');
    
    const query = context ? `Analyze food: ${context}` : 'General food analysis and nutrition information';
    const response = await this.searchHealth(query);
    
    return {
      success: true,
      message: "Food scanning functionality has been updated. For food analysis, please describe the food in your question.",
      analysis: response.message,
      recommendations: this.extractRecommendations(response)
    };
  }

  /**
   * Ask a health question with enhanced OpenAI analysis
   * @param query - The health question to ask
   * @param userContext - Optional user context for personalization
   * @param analyse - Whether to include enhanced OpenAI analysis (default: false)
   */
  async askWithAnalysis(query: string, userContext?: UserContext, analyse: boolean = false): Promise<HealthQuestionResponse> {
    const healthRequest: HealthQuestionRequest = {
      query: query,
      analyse: analyse,
      user_context: userContext ? {
        age: userContext.age,
        health_concerns: userContext.health_concerns,
        dietary_restrictions: userContext.dietary_restrictions,
        activity_level: userContext.activity_level,
        health_goals: userContext.health_concerns // Map health_concerns to health_goals for v4.0.0
      } : undefined
    };
    
    return this.askHealthQuestion(healthRequest);
  }

  /**
   * Ask a health question with enhanced OpenAI analysis enabled
   * @param query - The health question to ask
   * @param userContext - Optional user context for personalization
   */
  async askWithEnhancedAnalysis(query: string, userContext?: UserContext): Promise<HealthQuestionResponse> {
    return this.askWithAnalysis(query, userContext, true);
  }

  /**
   * ENHANCED ANALYSIS - Use this method from "Analyze with WiHy" buttons
   * This method explicitly enables the analyse flag for comprehensive AI analysis
   * @param query - The health question to ask
   * @param userContext - Optional user context for personalization
   * @param source - Source component calling this method (for logging)
   */
  async analyzeWithWiHy(query: string, userContext?: UserContext, source?: string): Promise<HealthQuestionResponse> {
    logger.info(`Enhanced WiHy analysis requested from ${source || 'unknown component'}`, { query });
    
    const healthRequest: HealthQuestionRequest = {
      query: query,
      analyse: true, // Always enable enhanced analysis for "Analyze with WiHy" buttons
      user_context: userContext ? {
        age: userContext.age,
        health_concerns: userContext.health_concerns,
        dietary_restrictions: userContext.dietary_restrictions,
        activity_level: userContext.activity_level,
        health_goals: userContext.health_concerns // Map health_concerns to health_goals for v4.0.0
      } : undefined
    };
    
    return this.askHealthQuestion(healthRequest);
  }
}

// Export singleton instance
export const wihyAPI = new WihyAPIService();

// Default export for compatibility
export default wihyAPI;