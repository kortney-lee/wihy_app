import { API_CONFIG, WIHY_API_ENDPOINT } from '../config/apiConfig';
import { logger } from '../utils/logger';

// Types for the WiHy Unified API (updated to match documentation)
export interface UnifiedRequest {
  query: string;                    // REQUIRED: Your health/nutrition question or request
  request_type?: 'auto' | 'nutrition' | 'health' | 'chat' | 'auth' | 'predict' | 'train'; // OPTIONAL: defaults to "auto"
  context?: Record<string, any>;    // OPTIONAL: Additional context object
  user_id?: string;                 // OPTIONAL: User identifier for personalization
  session_id?: string;              // OPTIONAL: Session identifier for conversation tracking
}

export interface UnifiedResponse {
  success: boolean;                 // Request processing success status
  data: {                          // Service-specific response data
    service?: string;              // Service that handled the request (e.g., "health_coaching")
    query?: string;                // The original query
    response?: string;             // The main response text
    session_id?: string;           // Session identifier
    conversation_context?: string; // Context of the conversation
    enhanced?: boolean;            // Whether response was enhanced
    recommendations?: string[];    // Array of recommendations
    analysis?: string;             // Analysis text (legacy support)
    training_status?: string;      // Training status (for ML endpoints)
    available_models?: string[];   // Available models (for ML endpoints)
    sources?: string[];            // Sources for research foundation
    [key: string]: any;            // Allow other properties for flexibility
  };
  service_used: string;            // Which service processed the request (e.g., "chat")
  request_type: string;            // The request type that was processed
  processing_time: number;         // Processing time in seconds
  suggestions: string[];           // Optional suggestions for improvement
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

class WihyAPIService {
  private baseURL: string;

  constructor() {
    this.baseURL = WIHY_API_ENDPOINT;
  }

  /**
   * Ask WiHy a health-related question using the unified API
   */
  async askAnything(request: WihyRequest | UnifiedRequest): Promise<WihyResponse | UnifiedResponse> {
    try {
      logger.apiRequest('Making WiHy Unified API request', request);
      
      // Convert legacy WihyRequest to UnifiedRequest format if needed
      let unifiedRequest: UnifiedRequest;
      if ('user_context' in request) {
        // Legacy format - convert to unified format
        unifiedRequest = {
          query: request.query,
          request_type: 'auto',
          context: request.user_context || {},
        };
      } else {
        // Already in unified format
        unifiedRequest = request as UnifiedRequest;
      }
      
      // Use fetch API to match the working example exactly with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unifiedRequest),
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
        
        // Check for network/connectivity issues
        if (error.message.includes('fetch') || 
            error.message.includes('network') || 
            error.name === 'TypeError' ||
            error.message.includes('Failed to fetch')) {
          throw new Error('NETWORK_ERROR: Unable to connect to WiHy services');
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
          action_items: unifiedResponse.data.recommendations?.map((rec: string, index: number) => ({
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
   * Format the WiHy response for display in the existing UI
   * This formats it to be compatible with the existing search results format
   */
  formatWihyResponse(response: WihyResponse | UnifiedResponse): string {
    // Handle UnifiedResponse format (new API)
    if ('data' in response && 'service_used' in response) {
      const unifiedResp = response as UnifiedResponse;
      
      let formatted = `# WiHy Health Assistant\n\n`;
      
      if (unifiedResp.data.response) {
        formatted += unifiedResp.data.response;
      } else if (unifiedResp.data.analysis) {
        formatted += unifiedResp.data.analysis;
      } else if (unifiedResp.data.training_status) {
        formatted += `## Training Service\n\n`;
        formatted += `${unifiedResp.data.training_status}\n\n`;
        if (unifiedResp.data.available_models && unifiedResp.data.available_models.length > 0) {
          formatted += `**Available Models:**\n`;
          unifiedResp.data.available_models.forEach((model: string) => {
            formatted += `- ${model}\n`;
          });
        }
      } else {
        formatted += `**Service:** ${unifiedResp.service_used}\n\n`;
        formatted += `**Processing Time:** ${unifiedResp.processing_time} seconds\n\n`;
        formatted += `**Data:**\n\`\`\`json\n${JSON.stringify(unifiedResp.data, null, 2)}\n\`\`\``;
      }
      
      formatted += `\n\n---\n\n*Response from ${unifiedResp.service_used} service (${unifiedResp.processing_time}s)*`;
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
    
    formatted += `---\n\n*WiHy health truth analysis generated at: ${new Date(response.timestamp).toLocaleString()}*\n`;
    
    return formatted;
  }

  /**
   * Extract recommendations from WiHy response for UI display
   */
  extractRecommendations(response: WihyResponse | UnifiedResponse): string[] {
    const recommendations: string[] = [];

    if (isUnifiedResponse(response)) {
      if (response.data.recommendations && response.data.recommendations.length > 0) {
        response.data.recommendations.forEach((r: string) => recommendations.push(r));
      }
    } else {
      if (response.wihy_response.personalized_analysis?.action_items) {
        response.wihy_response.personalized_analysis.action_items.forEach(action => {
          recommendations.push(`${action.action} (${action.priority} priority)`);
        });
      }
    }

    return recommendations;
  }

  /**
   * Extract citations from WiHy response for UI display
   */
  extractCitations(response: WihyResponse | UnifiedResponse): string[] {
    const citations: string[] = [];

    if (isUnifiedResponse(response)) {
      // Unified API may include sources array
      if (response.data.sources && response.data.sources.length > 0) {
        response.data.sources.forEach((s: string) => citations.push(s));
      }
    } else {
      if (response.wihy_response.research_foundation) {
        response.wihy_response.research_foundation.forEach(research => {
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

// Export a singleton instance
export const wihyAPI = new WihyAPIService();
export default wihyAPI;