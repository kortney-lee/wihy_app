// Universal Search Service - Single intelligent endpoint for all dashboard queries with AI enhancement
// Uses services.wihy.ai Universal Search API with automatic query routing and AI enhancement

import { API_CONFIG } from '../config/apiConfig';

// ================================
// TYPE DEFINITIONS
// ================================

export interface UniversalSearchRequest {
  query: string;
  type?: 'auto' | 'food' | 'research' | 'news' | 'recipe' | 'health' | 'meal_education';
  context?: {
    user_preferences?: {
      health_goals?: string[];
      dietary_restrictions?: string[];
      background?: string;
      interests?: string[];
    };
  };
  options?: {
    limit?: number;
    include_charts?: boolean;
    include_recommendations?: boolean;
  };
}

export interface UniversalSearchResponse {
  success: boolean;
  query: string;
  detected_type: string;
  processing_time_ms: number;
  ai_processing_time_ms?: number;
  timestamp: string;
  results: {
    // Basic data from appropriate service
    articles?: any[];
    total_research_count?: number;
    returned_count?: number;
    quality_score?: number;
    evidence_level?: string;
    
    // Food/nutrition data
    nutrition_facts?: any;
    health_score?: number;
    nova_group?: number;
    
    // News data
    news_articles?: any[];
    
    // Recipe data
    recipes?: any[];
    
    // Meal education data
    meals_found?: any[];
    chart_data?: any;
    educational_summary?: {
      message: string;
      key_insights: string[];
      recommendations: string[];
    };
    
    // AI Enhancement (the key addition)
    ai_enhancement?: {
      research_summary?: string;
      key_findings?: string[];
      evidence_strength?: {
        overall_quality: string;
        confidence_level: string;
        study_limitations: string;
      };
      practical_implications?: string[];
      consumer_action?: {
        immediate_steps: string[];
        discussion_points: string[];
      };
      research_context?: {
        study_scope: string;
        recent_developments: string;
        consensus_level: string;
      };
      clinical_significance?: string;
      medical_disclaimers?: string[];
      follow_up_research?: string;
      confidence: number;
    };
  };
  error?: string;
}

export interface SearchHistory {
  query: string;
  type: string;
  timestamp: string;
  success: boolean;
}

// ================================
// UNIVERSAL SEARCH SERVICE CLASS
// ================================

class UniversalSearchService {
  private readonly baseUrl = 'https://ml.wihy.ai';
  
  /**
   * Test API connectivity for Universal Search
   */
  async testConnection(): Promise<{ available: boolean; error?: string }> {
    try {
      console.log('🔍 Testing Universal Search API connectivity...');
      const response = await fetch(`${this.baseUrl}/search/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        console.log('✅ Universal Search API is available');
        return { available: true };
      } else {
        console.warn(`⚠️ Universal Search API returned ${response.status}`);
        return { available: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error('❌ Universal Search API connectivity test failed:', error);
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Universal Search - Single endpoint for all queries with AI enhancement
   */
  async search(request: UniversalSearchRequest): Promise<UniversalSearchResponse> {
    try {
      console.log('🔍 Universal Search API - starting search');
      console.log('📡 API Endpoint:', `${this.baseUrl}/search/`);
      console.log('📤 Request payload:', {
        query: request.query,
        type: request.type || 'auto',
        context: request.context,
        options: request.options
      });

      const response = await fetch(`${this.baseUrl}/search/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: request.query,
          type: request.type || 'auto',
          context: request.context || {},
          options: {
            limit: 10,
            include_charts: true,
            include_recommendations: true,
            ...request.options
          }
        })
      });

      if (!response.ok) {
        console.error(`❌ Universal Search API - HTTP Error: ${response.status} ${response.statusText}`);
        console.error('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Try to get error details from response body
        let errorDetails = '';
        try {
          const errorData = await response.text();
          errorDetails = errorData;
          console.error('📄 Error response body:', errorData);
        } catch (e) {
          console.error('❌ Could not read error response body');
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ''}`);
      }

      const data = await response.json();
      console.log('✅ Universal Search API - response received:', data);

      // The API should return a success field, but check for valid data as backup
      const hasValidData = data.results && (
        data.results.articles || 
        data.results.news_articles || 
        data.results.recipes || 
        data.results.meals_found || 
        data.results.nutrition_facts ||
        data.results.ai_enhancement
      );
      
      const apiSuccess = data.success !== false && hasValidData;

      return {
        success: apiSuccess,
        query: data.query || request.query,
        detected_type: data.detected_type || request.type || 'auto',
        processing_time_ms: data.processing_time_ms || 0,
        ai_processing_time_ms: data.ai_processing_time_ms,
        timestamp: data.timestamp || new Date().toISOString(),
        results: data.results || {},
        error: apiSuccess ? undefined : (data.error || 'No valid data returned')
      };
      
    } catch (error) {
      console.error('❌ Universal Search API - search error:', error);
      return {
        success: false,
        query: request.query,
        detected_type: 'error',
        processing_time_ms: 0,
        timestamp: new Date().toISOString(),
        results: {},
        error: error instanceof Error ? error.message : 'Universal search failed'
      };
    }
  }

  /**
   * Quick search with default settings - most common use case
   */
  async quickSearch(query: string, type?: string): Promise<UniversalSearchResponse> {
    return this.search({
      query,
      type: type as any || 'auto',
      options: {
        include_charts: true,
        include_recommendations: true,
        limit: 10
      }
    });
  }

  /**
   * Research-focused search with enhanced context
   */
  async searchResearch(query: string, userBackground?: string): Promise<UniversalSearchResponse> {
    return this.search({
      query,
      type: 'research',
      context: {
        user_preferences: {
          background: userBackground || 'general_public',
          health_goals: ['research_information'],
          interests: ['clinical_trials', 'evidence_based_medicine']
        }
      },
      options: {
        include_charts: true,
        include_recommendations: true,
        limit: 15
      }
    });
  }

  /**
   * Food/nutrition search with dietary context
   */
  async searchFood(query: string, dietaryRestrictions?: string[], healthGoals?: string[]): Promise<UniversalSearchResponse> {
    return this.search({
      query,
      type: 'food',
      context: {
        user_preferences: {
          dietary_restrictions: dietaryRestrictions || [],
          health_goals: healthGoals || ['nutrition_analysis'],
          interests: ['nutrition', 'food_safety']
        }
      },
      options: {
        include_charts: true,
        include_recommendations: true,
        limit: 10
      }
    });
  }

  /**
   * Health information search with personalized context
   */
  async searchHealth(query: string, healthGoals?: string[], background?: string): Promise<UniversalSearchResponse> {
    return this.search({
      query,
      type: 'health',
      context: {
        user_preferences: {
          health_goals: healthGoals || ['general_health'],
          background: background || 'general_public',
          interests: ['prevention', 'treatment_options', 'lifestyle']
        }
      },
      options: {
        include_charts: true,
        include_recommendations: true,
        limit: 12
      }
    });
  }

  /**
   * News search for latest health developments
   */
  async searchNews(query: string): Promise<UniversalSearchResponse> {
    return this.search({
      query,
      type: 'news',
      context: {
        user_preferences: {
          interests: ['health_news', 'medical_breakthroughs', 'public_health']
        }
      },
      options: {
        include_charts: false,
        include_recommendations: true,
        limit: 8
      }
    });
  }

  /**
   * Meal education search for understanding food ingredients
   */
  async searchMealEducation(query: string): Promise<UniversalSearchResponse> {
    return this.search({
      query,
      type: 'meal_education',
      context: {
        user_preferences: {
          health_goals: ['nutrition_education'],
          interests: ['food_ingredients', 'nutritional_quality']
        }
      },
      options: {
        include_charts: true,
        include_recommendations: true,
        limit: 10
      }
    });
  }

  /**
   * Smart search with automatic fallback - recommended for all components
   * Tries Universal Search first, falls back to legacy WiHy API if needed
   */
  async smartSearch(
    query: string, 
    legacySearchFn?: (query: string) => Promise<any>,
    options?: {
      type?: string;
      userContext?: any;
      enableFallback?: boolean;
    }
  ): Promise<{ 
    success: boolean;
    source: 'universal' | 'legacy' | 'error';
    data?: any;
    error?: string;
  }> {
    const { type = 'auto', userContext = {}, enableFallback = true } = options || {};
    
    try {
      console.log('🔍 Smart Search attempting Universal Search for:', query);
      
      // First try Universal Search
      const connectionTest = await this.testConnection();
      if (connectionTest.available) {
        const universalResult = await this.search({
          query,
          type: type as any,
          context: { user_preferences: userContext },
          options: {
            include_charts: true,
            include_recommendations: true,
            limit: 10
          }
        });
        
        if (universalResult.success) {
          console.log('✅ Smart Search - Universal Search successful');
          return {
            success: true,
            source: 'universal',
            data: universalResult
          };
        }
      }
      
      // Fall back to legacy search if provided and enabled
      if (enableFallback && legacySearchFn) {
        console.log('🔄 Smart Search falling back to legacy search');
        const legacyResult = await legacySearchFn(query);
        
        if (legacyResult && legacyResult.success) {
          console.log('✅ Smart Search - Legacy search successful');
          return {
            success: true,
            source: 'legacy',
            data: legacyResult
          };
        }
      }
      
      // Both failed
      return {
        success: false,
        source: 'error',
        error: 'Both Universal Search and legacy search failed'
      };
      
    } catch (error) {
      console.error('❌ Smart Search error:', error);
      
      // Try legacy search as last resort
      if (enableFallback && legacySearchFn) {
        try {
          console.log('🆘 Smart Search last resort - trying legacy search');
          const legacyResult = await legacySearchFn(query);
          
          if (legacyResult && legacyResult.success) {
            return {
              success: true,
              source: 'legacy',
              data: legacyResult
            };
          }
        } catch (legacyError) {
          console.error('❌ Legacy search also failed:', legacyError);
        }
      }
      
      return {
        success: false,
        source: 'error',
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Format search results for chat display
   */
  formatForChat(result: UniversalSearchResponse): any {
    if (!result.success) {
      return {
        type: 'error',
        message: result.error || 'Search failed'
      };
    }

    const aiEnhancement = result.results.ai_enhancement;
    
    return {
      type: 'universal_search',
      query: result.query,
      detected_type: result.detected_type,
      timestamp: result.timestamp,
      
      // Core content
      summary: aiEnhancement?.research_summary || 
               aiEnhancement?.clinical_significance || 
               result.results.educational_summary?.message ||
               'Search completed successfully',
      
      // Key findings
      key_findings: aiEnhancement?.key_findings || 
                   result.results.educational_summary?.key_insights || 
                   [],
      
      // Actionable recommendations
      recommendations: aiEnhancement?.consumer_action?.immediate_steps ||
                      aiEnhancement?.practical_implications ||
                      result.results.educational_summary?.recommendations ||
                      [],
      
      // Discussion points for healthcare providers
      discussion_points: aiEnhancement?.consumer_action?.discussion_points || [],
      
      // Evidence and context
      evidence_strength: aiEnhancement?.evidence_strength,
      research_context: aiEnhancement?.research_context,
      
      // Medical disclaimers
      disclaimers: aiEnhancement?.medical_disclaimers || [],
      
      // Raw data for advanced users
      raw_results: result.results,
      
      // Confidence score
      confidence: aiEnhancement?.confidence || 0,
      
      // Processing metrics
      processing_time: result.processing_time_ms,
      ai_processing_time: result.ai_processing_time_ms
    };
  }

  /**
   * Format search results for display components
   */
  formatForDisplay(result: UniversalSearchResponse): string {
    if (!result.success) {
      return result.error || 'Search failed';
    }

    const ai = result.results.ai_enhancement;
    const education = result.results.educational_summary;
    
    let formatted = '';
    
    // Title and summary
    if (ai?.research_summary) {
      formatted += `🔬 Research Summary:\n${ai.research_summary}\n\n`;
    } else if (ai?.clinical_significance) {
      formatted += `🏥 Clinical Significance:\n${ai.clinical_significance}\n\n`;
    } else if (education?.message) {
      formatted += `📚 Educational Insights:\n${education.message}\n\n`;
    }
    
    // Key findings
    if (ai?.key_findings && ai.key_findings.length > 0) {
      formatted += `🔍 Key Findings:\n`;
      formatted += ai.key_findings.map(finding => `• ${finding}`).join('\n');
      formatted += '\n\n';
    }
    
    // Practical implications
    if (ai?.practical_implications && ai.practical_implications.length > 0) {
      formatted += `💡 Practical Implications:\n`;
      formatted += ai.practical_implications.map(impl => `• ${impl}`).join('\n');
      formatted += '\n\n';
    }
    
    // Consumer actions
    if (ai?.consumer_action?.immediate_steps && ai.consumer_action.immediate_steps.length > 0) {
      formatted += `🎯 Immediate Actions:\n`;
      formatted += ai.consumer_action.immediate_steps.map(step => `• ${step}`).join('\n');
      formatted += '\n\n';
    }
    
    // Evidence quality
    if (ai?.evidence_strength) {
      formatted += `📊 Evidence Quality: ${ai.evidence_strength.overall_quality}\n`;
      if (ai.confidence) {
        formatted += `🎯 Confidence: ${Math.round(ai.confidence * 100)}%\n`;
      }
      formatted += '\n';
    }
    
    // Data source
    formatted += `📋 Data from: Universal Search API (${result.detected_type})\n`;
    if (result.ai_processing_time_ms) {
      formatted += `🤖 AI Enhanced (${result.ai_processing_time_ms}ms processing)`;
    }

    return formatted.trim();
  }
}

// ================================
// EXPORT SINGLETON INSTANCE
// ================================

export const universalSearchService = new UniversalSearchService();
export default universalSearchService;