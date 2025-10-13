import axios from 'axios';

const WIHY_API_URL = process.env.REACT_APP_WIHY_API_URL || 'http://localhost:8000';

// Types for the WiHy API
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
    this.baseURL = WIHY_API_URL;
  }

  /**
   * Ask WiHy a health-related question with optional user context
   */
  async askAnything(request: WihyRequest): Promise<WihyResponse> {
    try {
      console.log('Making WiHy API request:', request);
      
      const response = await axios.post<WihyResponse>(
        `${this.baseURL}/wihy/ask-anything`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('WiHy API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('WiHy API error:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data) {
          throw new Error(axiosError.response.data.detail || 'WiHy API request failed');
        }
        throw new Error(`Network error: ${axiosError.message || 'Request failed'}`);
      }
      
      throw new Error('Unknown error occurred while contacting WiHy API');
    }
  }

  /**
   * Format the WiHy response for display in the existing UI
   * This formats it to be compatible with the existing search results format
   */
  formatWihyResponse(response: WihyResponse): string {
    const { wihy_response } = response;
    
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
  extractRecommendations(response: WihyResponse): string[] {
    const recommendations: string[] = [];
    
    if (response.wihy_response.personalized_analysis?.action_items) {
      response.wihy_response.personalized_analysis.action_items.forEach(action => {
        recommendations.push(`${action.action} (${action.priority} priority)`);
      });
    }
    
    return recommendations;
  }

  /**
   * Extract citations from WiHy response for UI display
   */
  extractCitations(response: WihyResponse): string[] {
    const citations: string[] = [];
    
    if (response.wihy_response.research_foundation) {
      response.wihy_response.research_foundation.forEach(research => {
        citations.push(`${research.citation_text}: ${research.key_finding}`);
      });
    }
    
    return citations;
  }
}

// Export a singleton instance
export const wihyAPI = new WihyAPIService();
export default wihyAPI;