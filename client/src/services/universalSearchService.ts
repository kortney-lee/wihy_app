// Universal Search Service - Single intelligent endpoint for all dashboard queries with AI enhancement
// Uses services.wihy.ai Universal Search API with automatic query routing and AI enhancement

import { API_CONFIG } from '../config/apiConfig';

// ================================
// TYPE DEFINITIONS
// ================================

export interface UniversalSearchRequest {
  query: string;
  type?: 'auto' | 'barcode' | 'food' | 'research' | 'news' | 'recipe' | 'health' | 'meal_education';
  context?: {
    health_goals?: string[];
    dietary_restrictions?: string[];
    age?: number;
    weight?: number;
    gender?: string;
    background?: string;
    interests?: string[];
  };
  options?: {
    limit?: number;
    maxResults?: number;
    include_charts?: boolean;
    include_recommendations?: boolean;
    include_ai_enhancement?: boolean;
  };
}

export interface UniversalSearchResponse {
  success: boolean;
  query: string;
  detected_type: string;
  processing_time_ms: number;
  timestamp: string;
  results: {
    // Research results
    articles?: Array<{
      id: string;
      title: string;
      authors: string;
      journal: string;
      publicationYear: number;
      evidenceLevel: string;
      links: {
        pmcWebsite: string;
        pdfDownload: string;
      };
    }>;
    total_found?: number;
    quality_score?: number;
    evidence_level?: string;
    quality_assessment?: {
      methodology_score: number;
      sample_size_adequacy: string;
      bias_risk: string;
      statistical_power: string;
    };
    outcomes?: {
      primary_outcomes: string[];
      secondary_outcomes: string[];
      safety_outcomes: string[];
    };
    total_research_count?: number;
    returned_count?: number;
    
    // Food/Barcode analysis results
    summary?: string;
    confidence_score?: number;
    metadata?: {
      scan_type: 'barcode' | 'food_name';
      product_name: string;
      brand: string;
      categories: string[];
      barcode?: string;
      nova_group: number;
      nova_description: string;
      processing_level: string;
      health_score: number;
      nutrition_score: number;
      grade: string;
      grade_description: string;
      health_category: string;
      
      nutrition_facts: {
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
        saturated_fat: number;
        fiber: number;
        sugars: number;
        sodium: number;
        salt: number;
      };
      
      nutrition_analysis: {
        overall_score: number;
        component_scores: {
          protein: number;
          fiber: number;
          sugars: number;
          sodium: number;
          saturated_fat: number;
          calorie_density: number;
          fat_balance: number;
        };
        daily_value_percentages: {
          calories: number;
          protein: number;
          carbohydrates: number;
          fat: number;
          saturated_fat: number;
          fiber: number;
          sugars: number;
          sodium: number;
        };
        health_alerts: Array<{
          type: string;
          level: 'warning' | 'info' | 'critical';
          message: string;
          recommendation: string;
        }>;
        positive_aspects: Array<{
          aspect: string;
          message: string;
          benefit: string;
        }>;
        areas_of_concern: Array<{
          concern: string;
          message: string;
          impact: string;
          recommendation: string;
        }>;
        serving_recommendations: {
          suggested_serving_size: string;
          frequency: 'daily' | 'weekly' | 'rarely';
          daily_limit: string | null;
          pairing_suggestions: string[];
          timing_recommendations: string[];
        };
      };
      
      additives: {
        total_count: number;
        concerning_additives: string[];
        safety_level: 'safe' | 'concerning' | 'avoid';
      };
      allergens: string[];
      labels: string[];
    };
    
    // News results
    news_articles?: Array<{
      title: string;
      description: string;
      url: string;
      source: string;
      publishedAt: string;
      imageUrl: string;
      category: string;
    }>;
    
    // Recipe results
    type?: string;
    message?: string;
    example?: {
      ingredients: string[];
      instructions: string[];
    };
    endpoints?: {
      parse_recipe: string;
      parse_ingredient: string;
      nutrition_summary: string;
    };
    
    // Health assessment results
    risk_assessment?: {
      overallRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
      healthScore: number;
      carcinogenicRisk: boolean;
      riskFactors: string[];
      protectiveFactors: string[];
    };
    health_warnings?: Array<{
      type: string;
      severity: 'low' | 'moderate' | 'high' | 'critical';
      message: string;
      recommendation: string;
    }>;
    prevention_strategies?: Array<{
      strategy: string;
      effectiveness: string;
      evidence_level: string;
    }>;
    medical_disclaimer?: string;
    
    // Meal education results
    meals_found?: Array<{
      name: string;
      category: string;
      description: string;
      nutrition_profile: any;
      health_score: number;
      recommendations: string[];
    }>;
    education_summary?: {
      topic: string;
      key_points: string[];
      nutritional_insights: string[];
      health_implications: string[];
      recommendations: string[];
    };
    total_meals?: number;
  };
  recommendations?: string[];
  charts?: {
    macronutrient_breakdown?: {
      type: 'pie';
      data: {
        labels: string[];
        datasets: Array<{
          data: number[];
          backgroundColor: string[];
          borderColor: string[];
          borderWidth: number;
          hoverOffset: number;
        }>;
      };
      options: {
        responsive: boolean;
        maintainAspectRatio: boolean;
        plugins: {
          legend: {
            position: string;
            labels: {
              padding: number;
              usePointStyle: boolean;
            };
          };
        };
      };
    };
    health_score_gauge?: {
      type: 'gauge';
      title: string;
      value: number;
      max_value: number;
      color: string;
      verdict: string;
    };
    generated_by?: string;
    chart_count?: number;
  };
  context_used?: any;
  options_used?: any;
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
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'test connection',
          type: 'auto'
        })
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
      console.log('📡 API Endpoint:', `${this.baseUrl}/search`);
      console.log('📤 Request payload:', {
        query: request.query,
        type: request.type || 'auto',
        context: request.context,
        options: request.options
      });

      const response = await fetch(`${this.baseUrl}/search`, {
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
        data.results.example || 
        data.results.meals_found || 
        data.results.metadata ||
        data.results.summary
      );
      
      const apiSuccess = data.success !== false && hasValidData;

      return {
        success: apiSuccess,
        query: data.query || request.query,
        detected_type: data.detected_type || request.type || 'auto',
        processing_time_ms: data.processing_time_ms || 0,
        timestamp: data.timestamp || new Date().toISOString(),
        results: data.results || {},
        recommendations: data.recommendations || [],
        charts: data.charts || {},
        context_used: data.context_used || {},
        options_used: data.options_used || {},
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
        background: userBackground || 'general_public',
        health_goals: ['research_information'],
        interests: ['clinical_trials', 'evidence_based_medicine']
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
        dietary_restrictions: dietaryRestrictions || [],
        health_goals: healthGoals || ['nutrition_analysis'],
        interests: ['nutrition', 'food_safety']
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
        health_goals: healthGoals || ['general_health'],
        background: background || 'general_public',
        interests: ['prevention', 'treatment_options', 'lifestyle']
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
        interests: ['health_news', 'medical_breakthroughs', 'public_health']
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
        health_goals: ['nutrition_education'],
        interests: ['food_ingredients', 'nutritional_quality']
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
          context: userContext,
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

    // Extract relevant data based on detected type
    let summary = '';
    let key_findings: string[] = [];
    let recommendations: string[] = result.recommendations || [];

    switch (result.detected_type) {
      case 'barcode':
      case 'food':
        if (result.results.metadata) {
          summary = result.results.summary || 
                   `${result.results.metadata.product_name} - Health Score: ${result.results.metadata.health_score}/100`;
          key_findings = [
            `Grade: ${result.results.metadata.grade} (${result.results.metadata.grade_description})`,
            `Processing Level: ${result.results.metadata.processing_level}`,
            `NOVA Group: ${result.results.metadata.nova_group} (${result.results.metadata.nova_description})`
          ];
          if (result.results.metadata.nutrition_analysis?.health_alerts) {
            key_findings.push(...result.results.metadata.nutrition_analysis.health_alerts.map(alert => alert.message));
          }
        }
        break;
      
      case 'research':
        summary = `Found ${result.results.total_found || 0} research articles`;
        if (result.results.evidence_level) {
          summary += ` with ${result.results.evidence_level} evidence level`;
        }
        if (result.results.articles && result.results.articles.length > 0) {
          key_findings = result.results.articles.slice(0, 3).map(article => 
            `${article.title} (${article.journal}, ${article.publicationYear})`
          );
        }
        break;
      
      case 'health':
        if (result.results.risk_assessment) {
          summary = `Health Risk Level: ${result.results.risk_assessment.overallRiskLevel}`;
          key_findings = result.results.risk_assessment.riskFactors || [];
          if (result.results.prevention_strategies) {
            recommendations.push(...result.results.prevention_strategies.map(s => s.strategy));
          }
        }
        break;
      
      case 'news':
        summary = `Found ${result.results.total_found || 0} recent health news articles`;
        if (result.results.news_articles && result.results.news_articles.length > 0) {
          key_findings = result.results.news_articles.slice(0, 3).map(article => article.title);
        }
        break;
      
      case 'meal_education':
        if (result.results.education_summary) {
          summary = result.results.education_summary.topic || 'Meal education information';
          key_findings = result.results.education_summary.key_points || [];
          recommendations = result.results.education_summary.recommendations || [];
        }
        break;
      
      default:
        summary = 'Search completed successfully';
    }
    
    return {
      type: 'universal_search',
      query: result.query,
      detected_type: result.detected_type,
      timestamp: result.timestamp,
      summary,
      key_findings,
      recommendations,
      raw_results: result.results,
      processing_time: result.processing_time_ms
    };
  }

  /**
   * Format search results for display components
   */
  formatForDisplay(result: UniversalSearchResponse): string {
    if (!result.success) {
      return result.error || 'Search failed';
    }

    let formatted = '';
    
    // Format based on detected type
    switch (result.detected_type) {
      case 'barcode':
      case 'food':
        if (result.results.metadata) {
          formatted += `🍎 Product Analysis: ${result.results.metadata.product_name}\n`;
          formatted += `📊 Health Score: ${result.results.metadata.health_score}/100 (Grade ${result.results.metadata.grade})\n`;
          formatted += `🏭 Processing Level: ${result.results.metadata.processing_level}\n`;
          
          if (result.results.metadata.nutrition_analysis?.positive_aspects) {
            formatted += `\n✅ Positive Aspects:\n`;
            formatted += result.results.metadata.nutrition_analysis.positive_aspects
              .map(aspect => `• ${aspect.message}`)
              .join('\n') + '\n';
          }
          
          if (result.results.metadata.nutrition_analysis?.areas_of_concern) {
            formatted += `\n⚠️ Areas of Concern:\n`;
            formatted += result.results.metadata.nutrition_analysis.areas_of_concern
              .map(concern => `• ${concern.message}`)
              .join('\n') + '\n';
          }
        }
        break;
      
      case 'research':
        formatted += `🔬 Research Results: Found ${result.results.total_found || 0} articles\n`;
        if (result.results.evidence_level) {
          formatted += `� Evidence Level: ${result.results.evidence_level}\n`;
        }
        if (result.results.articles && result.results.articles.length > 0) {
          formatted += `\n� Key Studies:\n`;
          formatted += result.results.articles.slice(0, 3)
            .map(article => `• ${article.title} (${article.journal}, ${article.publicationYear})`)
            .join('\n') + '\n';
        }
        break;
      
      case 'health':
        if (result.results.risk_assessment) {
          formatted += `🏥 Health Assessment\n`;
          formatted += `🎯 Risk Level: ${result.results.risk_assessment.overallRiskLevel}\n`;
          formatted += `📊 Health Score: ${result.results.risk_assessment.healthScore}/100\n`;
          
          if (result.results.risk_assessment.riskFactors.length > 0) {
            formatted += `\n⚠️ Risk Factors:\n`;
            formatted += result.results.risk_assessment.riskFactors
              .map(factor => `• ${factor}`)
              .join('\n') + '\n';
          }
          
          if (result.results.prevention_strategies && result.results.prevention_strategies.length > 0) {
            formatted += `\n💡 Prevention Strategies:\n`;
            formatted += result.results.prevention_strategies
              .map(strategy => `• ${strategy.strategy}`)
              .join('\n') + '\n';
          }
        }
        break;
      
      case 'news':
        formatted += `📰 Health News: Found ${result.results.total_found || 0} articles\n\n`;
        if (result.results.news_articles && result.results.news_articles.length > 0) {
          formatted += result.results.news_articles.slice(0, 3)
            .map(article => `📌 ${article.title}\n${article.description}\n`)
            .join('\n');
        }
        break;
      
      case 'meal_education':
        if (result.results.education_summary) {
          formatted += `📚 Meal Education: ${result.results.education_summary.topic}\n\n`;
          
          if (result.results.education_summary.key_points.length > 0) {
            formatted += `🔍 Key Points:\n`;
            formatted += result.results.education_summary.key_points
              .map(point => `• ${point}`)
              .join('\n') + '\n\n';
          }
          
          if (result.results.education_summary.nutritional_insights.length > 0) {
            formatted += `� Nutritional Insights:\n`;
            formatted += result.results.education_summary.nutritional_insights
              .map(insight => `• ${insight}`)
              .join('\n') + '\n\n';
          }
        }
        break;
      
      default:
        formatted += `✅ Search completed for: ${result.query}\n`;
        if (result.results.summary) {
          formatted += `📋 ${result.results.summary}\n`;
        }
    }
    
    // Add recommendations if available
    if (result.recommendations && result.recommendations.length > 0) {
      formatted += `\n🎯 Recommendations:\n`;
      formatted += result.recommendations.map(rec => `• ${rec}`).join('\n');
      formatted += '\n\n';
    }
    
    // Add medical disclaimer for health-related queries
    if (result.results.medical_disclaimer) {
      formatted += `⚕️ Medical Disclaimer: ${result.results.medical_disclaimer}\n\n`;
    }
    
    // Data source
    formatted += `📋 Data from: Universal Search API (${result.detected_type})`;

    return formatted.trim();
  }
}

// ================================
// EXPORT SINGLETON INSTANCE
// ================================

export const universalSearchService = new UniversalSearchService();
export default universalSearchService;