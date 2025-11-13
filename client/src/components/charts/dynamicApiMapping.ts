import { ChartType } from './chartTypes';
import { CardData } from './cardConfig';
import { UniversalSearchResponse } from '../../services/universalSearchService';

/**
 * Universal Search API response interface - matches the full contract
 */
export interface UniversalApiResponse {
  success: boolean;
  query: string;
  detected_type: string;
  processing_time_ms: number;
  timestamp: string;
  results: {
    // Food/Barcode analysis
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
    quality_score?: number;
    evidence_level?: string;
    
    // Health assessment
    risk_assessment?: {
      overallRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
      healthScore: number;
      carcinogenicRisk: boolean;
      riskFactors: string[];
      protectiveFactors: string[];
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
      options: any;
    };
    health_score_gauge?: {
      type: 'gauge';
      title: string;
      value: number;
      max_value: number;
      color: string;
      verdict: string;
    };
  };
  context_used?: any;
  options_used?: any;
  error?: string;
}

/**
 * Dynamic card mapping based on API response data
 */
export interface DynamicCardMapping {
  cardId: string;
  chartType: ChartType;
  dataPath: string; // Path to data in API response (e.g., 'health.bmi')
  condition?: (data: any) => boolean; // Optional condition to show card
  transform?: (data: any) => any; // Optional data transformation
}

/**
 * Universal Search API dynamic mappings for cards 2-5
 * Card 1 is always QuickInsights and doesn't need dynamic mapping
 * These mappings work with the real Universal Search API response data
 */
export const DYNAMIC_CARD_MAPPINGS: DynamicCardMapping[] = [
  // Card 2: Nutrition Analysis (barcode/food scans)
  {
    cardId: 'card-2',
    chartType: ChartType.MACRONUTRIENTS,
    dataPath: 'results.metadata.nutrition_facts',
    condition: (data) => data && data.protein !== undefined && data.carbohydrates !== undefined && data.fat !== undefined,
    transform: (data) => ({
      protein: data.protein,
      carbohydrates: data.carbohydrates,
      fat: data.fat,
      fiber: data.fiber || 0
    })
  },
  {
    cardId: 'card-2', 
    chartType: ChartType.NUTRITION,
    dataPath: 'results.metadata',
    condition: (data) => data && data.nutrition_facts && data.health_score !== undefined,
    transform: (data) => ({
      nutritionFacts: data.nutrition_facts,
      healthScore: data.health_score,
      grade: data.grade,
      productName: data.product_name
    })
  },
  
  // Card 3: Health Assessment & Risk Analysis
  {
    cardId: 'card-3',
    chartType: ChartType.HEALTH_RISK,
    dataPath: 'results.risk_assessment',
    condition: (data) => data && data.riskFactors && Array.isArray(data.riskFactors) && data.riskFactors.length > 0,
    transform: (data) => ({
      riskLevel: data.overallRiskLevel,
      healthScore: data.healthScore,
      riskFactors: data.riskFactors,
      protectiveFactors: data.protectiveFactors || [],
      carcinogenicRisk: data.carcinogenicRisk
    })
  },
  {
    cardId: 'card-3',
    chartType: ChartType.NOVA_SCORE,
    dataPath: 'results.metadata',
    condition: (data) => data && data.nova_group !== undefined && data.processing_level !== undefined,
    transform: (data) => ({
      novaGroup: data.nova_group,
      processingLevel: data.processing_level,
      novaDescription: data.nova_description,
      healthCategory: data.health_category
    })
  },
  
  // Card 4: Research Quality & Publication Analysis
  {
    cardId: 'card-4',
    chartType: ChartType.RESEARCH_QUALITY,
    dataPath: 'results',
    condition: (data) => data && data.articles && Array.isArray(data.articles) && data.quality_score !== undefined,
    transform: (data) => ({
      qualityScore: data.quality_score,
      evidenceLevel: data.evidence_level,
      totalArticles: data.articles?.length || 0,
      articles: data.articles || []
    })
  },
  {
    cardId: 'card-4',
    chartType: ChartType.PUBLICATION_TIMELINE,
    dataPath: 'results.articles',
    condition: (data) => data && Array.isArray(data) && data.length > 3,
    transform: (data) => {
      // Group articles by publication year for timeline
      const yearCounts = data.reduce((acc: any, article: any) => {
        const year = article.publicationYear || new Date().getFullYear();
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(yearCounts).map(([year, count]) => ({
        year: parseInt(year),
        count: count as number,
        totalStudies: data.length
      }));
    }
  },
  
  // Card 5: Health Alerts & Recommendations
  {
    cardId: 'card-5',
    chartType: ChartType.DAILY_VALUE_PROGRESS,
    dataPath: 'results.metadata.nutrition_analysis.daily_value_percentages',
    condition: (data) => data && Object.keys(data).length > 0,
    transform: (data) => ({
      dailyValues: data,
      categories: Object.keys(data)
    })
  },
  {
    cardId: 'card-5', 
    chartType: ChartType.VITAMIN_CONTENT,
    dataPath: 'results.metadata.nutrition_analysis.positive_aspects',
    condition: (data) => data && Array.isArray(data) && data.some((aspect: any) => 
      aspect.aspect && (aspect.aspect.toLowerCase().includes('vitamin') || 
                       aspect.aspect.toLowerCase().includes('mineral') ||
                       aspect.aspect.toLowerCase().includes('antioxidant'))
    ),
    transform: (data) => ({
      vitamins: data.filter((aspect: any) => 
        aspect.aspect && (aspect.aspect.toLowerCase().includes('vitamin') ||
                         aspect.aspect.toLowerCase().includes('mineral') ||
                         aspect.aspect.toLowerCase().includes('antioxidant'))
      ).map((aspect: any) => ({
        name: aspect.aspect,
        benefit: aspect.benefit,
        message: aspect.message
      }))
    })
  },

  // Additional mappings for available chart types with Universal Search API data
  
  // Health Score Gauge - can be used in multiple cards
  {
    cardId: 'card-2',
    chartType: ChartType.HEALTH_SCORE,
    dataPath: 'results.metadata.health_score',
    condition: (data) => data !== undefined && typeof data === 'number',
    transform: (data) => ({
      score: data,
      maxScore: 100,
      grade: data >= 80 ? 'A' : data >= 70 ? 'B' : data >= 60 ? 'C' : data >= 50 ? 'D' : 'F'
    })
  },
  {
    cardId: 'card-3',
    chartType: ChartType.HEALTH_SCORE,
    dataPath: 'results.risk_assessment.healthScore',
    condition: (data) => data !== undefined && typeof data === 'number',
    transform: (data) => ({
      score: data,
      maxScore: 100,
      grade: data >= 80 ? 'A' : data >= 70 ? 'B' : data >= 60 ? 'C' : data >= 50 ? 'D' : 'F'
    })
  },

  // Nutrition Grade Badge
  {
    cardId: 'card-2',
    chartType: ChartType.NUTRITION_GRADE_BADGE,
    dataPath: 'results.metadata',
    condition: (data) => data && data.grade && data.nutrition_score !== undefined,
    transform: (data) => ({
      grade: data.grade,
      score: data.nutrition_score,
      description: data.grade_description,
      healthCategory: data.health_category
    })
  },

  // Study Type Distribution Chart
  {
    cardId: 'card-4',
    chartType: ChartType.STUDY_TYPE_DISTRIBUTION,
    dataPath: 'results.articles',
    condition: (data) => data && Array.isArray(data) && data.length > 2,
    transform: (data) => {
      // Analyze study types from evidence levels
      const studyTypes = data.reduce((acc: any, article: any) => {
        const studyType = article.evidenceLevel || 'Other';
        acc[studyType] = (acc[studyType] || 0) + 1;
        return acc;
      }, {});

      return {
        studyTypes: Object.entries(studyTypes).map(([type, count]) => ({
          type,
          count: count as number,
          percentage: Math.round(((count as number) / data.length) * 100)
        })),
        totalStudies: data.length
      };
    }
  },

  // Result Quality Pie Chart
  {
    cardId: 'card-4',
    chartType: ChartType.RESULT_QUALITY_PIE,
    dataPath: 'results.articles',
    condition: (data) => data && Array.isArray(data) && data.length > 1,
    transform: (data) => {
      // Group by evidence level quality
      const qualityLevels = data.reduce((acc: any, article: any) => {
        const level = article.evidenceLevel || 'Unknown';
        let quality = 'Medium';
        
        if (level.includes('Meta-analysis') || level.includes('Systematic Review')) {
          quality = 'High';
        } else if (level.includes('Randomized') || level.includes('Clinical Trial')) {
          quality = 'High';
        } else if (level.includes('Cohort') || level.includes('Case-Control')) {
          quality = 'Medium';
        } else if (level.includes('Cross-sectional') || level.includes('Observational')) {
          quality = 'Low';
        }
        
        acc[quality] = (acc[quality] || 0) + 1;
        return acc;
      }, {});

      return {
        qualityDistribution: Object.entries(qualityLevels).map(([quality, count]) => ({
          quality,
          count: count as number,
          percentage: Math.round(((count as number) / data.length) * 100)
        })),
        totalArticles: data.length
      };
    }
  },

  // Health Risk Chart (detailed health alerts visualization)
  {
    cardId: 'card-3',
    chartType: ChartType.HEALTH_RISK_CHART,
    dataPath: 'results.metadata.nutrition_analysis.health_alerts',
    condition: (data) => data && Array.isArray(data) && data.length > 0,
    transform: (data) => ({
      alerts: data.map((alert: any) => ({
        type: alert.type,
        level: alert.level,
        message: alert.message,
        recommendation: alert.recommendation,
        severity: alert.level === 'critical' ? 3 : alert.level === 'warning' ? 2 : 1
      })),
      totalAlerts: data.length,
      criticalCount: data.filter((alert: any) => alert.level === 'critical').length,
      warningCount: data.filter((alert: any) => alert.level === 'warning').length
    })
  },

  // Nutrition Tracking - component scores analysis
  {
    cardId: 'card-2',
    chartType: ChartType.NUTRITION_TRACKING,
    dataPath: 'results.metadata.nutrition_analysis.component_scores',
    condition: (data) => data && typeof data === 'object' && Object.keys(data).length > 3,
    transform: (data) => ({
      componentScores: Object.entries(data).map(([component, score]) => ({
        component: component.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        score: score as number,
        percentage: Math.round((score as number) * 10) // Assuming scores are 0-10, convert to percentage
      })),
      overallScore: (Object.values(data).reduce((sum: number, score: any) => sum + (score as number), 0) as number) / Object.keys(data).length,
      components: Object.keys(data)
    })
  },

  // Calories information from nutrition facts
  {
    cardId: 'card-2',
    chartType: ChartType.CALORIES,
    dataPath: 'results.metadata.nutrition_facts.calories',
    condition: (data) => data !== undefined && typeof data === 'number' && data > 0,
    transform: (data) => ({
      calories: data,
      dailyValuePercentage: Math.round((data / 2000) * 100), // Assuming 2000 calorie daily value
      category: data < 100 ? 'low' : data < 300 ? 'moderate' : data < 500 ? 'high' : 'very-high'
    })
  },

  // BMI Domain (if we have serving size and nutritional density data)
  {
    cardId: 'card-5',
    chartType: ChartType.BMI_BODY_FAT,
    dataPath: 'results.metadata.nutrition_analysis.serving_recommendations',
    condition: (data) => data && data.suggested_serving_size && data.frequency,
    transform: (data) => ({
      servingSize: data.suggested_serving_size,
      frequency: data.frequency,
      dailyLimit: data.daily_limit,
      pairingSuggestions: data.pairing_suggestions || [],
      timingRecommendations: data.timing_recommendations || [],
      healthImpact: data.frequency === 'daily' ? 'positive' : data.frequency === 'rarely' ? 'concerning' : 'moderate'
    })
  }
];

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Determine chart type and data for a card based on Universal Search API response
 */
export function determineCardContent(
  cardId: string,
  apiResponse: UniversalApiResponse | UniversalSearchResponse | any
): { chartType: ChartType; data: any } | null {
  
  // Card 1 is always QuickInsights
  if (cardId === 'card-1') {
    return {
      chartType: ChartType.QUICK_INSIGHTS,
      data: {
        // Extract summary data for QuickInsights from Universal Search response
        query: apiResponse.query,
        detectedType: apiResponse.detected_type,
        processingTime: apiResponse.processing_time_ms,
        hasResults: apiResponse.success && apiResponse.results,
        healthScore: apiResponse.results?.metadata?.health_score || 
                    apiResponse.results?.risk_assessment?.healthScore || 
                    75, // Default fallback
        recommendations: apiResponse.recommendations?.length || 0,
        confidence: apiResponse.results?.confidence_score || 0.8
      }
    };
  }
  
  // Handle both successful and failed responses
  if (!apiResponse.success || !apiResponse.results) {
    console.log(`No valid data in API response for ${cardId}`);
    return null;
  }
  
  // Find the first available mapping for this card based on response data
  const availableMappings = DYNAMIC_CARD_MAPPINGS.filter(mapping => mapping.cardId === cardId);
  
  for (const mapping of availableMappings) {
    try {
      const data = getNestedValue(apiResponse, mapping.dataPath);
      
      if (data !== undefined && (!mapping.condition || mapping.condition(data))) {
        console.log(`Using mapping ${mapping.chartType} for ${cardId} with data:`, data);
        
        const transformedData = mapping.transform ? mapping.transform(data) : data;
        
        return {
          chartType: mapping.chartType,
          data: {
            ...transformedData,
            // Always include metadata for context
            _meta: {
              query: apiResponse.query,
              detectedType: apiResponse.detected_type,
              source: 'universal_search_api',
              confidence: apiResponse.results.confidence_score,
              timestamp: apiResponse.timestamp
            }
          }
        };
      }
    } catch (error) {
      console.warn(`Error processing mapping ${mapping.chartType} for ${cardId}:`, error);
      continue;
    }
  }
  
  console.log(`No suitable mapping found for ${cardId} in response:`, apiResponse);
  return null; // No suitable data found for this card
}

/**
 * Generate dynamic card configurations based on Universal Search API response
 */
export function generateDynamicCards(
  apiResponse: UniversalApiResponse | UniversalSearchResponse | any,
  cardIds: string[] = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5']
): CardData[] {
  const cards: CardData[] = [];
  
  console.log('Generating dynamic cards with API response:', {
    success: apiResponse.success,
    query: apiResponse.query,
    detectedType: apiResponse.detected_type,
    hasResults: !!apiResponse.results
  });
  
  for (const cardId of cardIds) {
    const content = determineCardContent(cardId, apiResponse);
    
    if (content || cardId === 'card-1') { // Card 1 always appears
      const chartType = content?.chartType || ChartType.QUICK_INSIGHTS;
      const title = getChartTypeTitle(chartType);
      
      // Add dynamic title suffix based on response data
      let dynamicTitle = title;
      if (apiResponse.success && apiResponse.results) {
        const productName = apiResponse.results.metadata?.product_name;
        if (productName && cardId !== 'card-1') {
          dynamicTitle = `${title} - ${productName}`;
        }
      }
      
      cards.push({
        id: cardId,
        title: dynamicTitle,
        chartType: chartType,
        data: content?.data,
        priority: getChartTypePriority(chartType),
        isAlwaysVisible: cardId === 'card-1'
      });
      
      console.log(`Added card ${cardId} with type ${chartType}:`, {
        title: dynamicTitle,
        hasData: !!content?.data
      });
    } else {
      console.log(`Skipped card ${cardId} - no suitable content found`);
    }
  }
  
  console.log(`Generated ${cards.length} cards from API response`);
  return cards;
}

/**
 * Helper function to get chart type title
 */
function getChartTypeTitle(chartType: ChartType): string {
  const titles: Record<ChartType, string> = {
    [ChartType.QUICK_INSIGHTS]: 'Quick Insights',
    [ChartType.BMI_DOMAIN]: 'BMI Analysis',
    [ChartType.HEALTH_RISK]: 'Health Risk',
    [ChartType.HEALTH_SCORE]: 'Health Score',
    [ChartType.CURRENT_WEIGHT]: 'Current Weight',
    [ChartType.WEIGHT_TREND]: 'Weight Trend',
    [ChartType.ACTIVITY]: 'Activity Overview',
    [ChartType.STEPS]: 'Daily Steps',
    [ChartType.STEPS_CHART]: 'Steps History',
    [ChartType.ACTIVE_MINUTES]: 'Active Minutes',
    [ChartType.SLEEP]: 'Sleep Analysis',
    [ChartType.HYDRATION]: 'Hydration',
    [ChartType.HYDRATION_CHART]: 'Hydration Tracking',
    [ChartType.BLOOD_PRESSURE]: 'Blood Pressure Trends',
    [ChartType.HEART_RATE]: 'Heart Rate Analysis',
    [ChartType.CALORIES]: 'Calories',
    [ChartType.CALORIES_CHART]: 'Calorie Tracking',
    [ChartType.NUTRITION]: 'Nutrition',
    [ChartType.NUTRITION_TRACKING]: 'Nutrition Tracking',
    [ChartType.MACRONUTRIENTS]: 'Macronutrients',
    [ChartType.DOPAMINE]: 'Dopamine Analysis',
    [ChartType.MOOD_CHART]: 'Mood Tracking',
    [ChartType.MEMBERS_CARD]: 'Awards & Achievements',
    [ChartType.NOVA_SCORE]: 'NOVA Score',
    [ChartType.RESEARCH_QUALITY]: 'Research Quality',
    [ChartType.PUBLICATION_TIMELINE]: 'Publications',
    [ChartType.VITAMIN_CONTENT]: 'Vitamins',
    [ChartType.DAILY_VALUE_PROGRESS]: 'Daily Values',
    [ChartType.STUDY_TYPE_DISTRIBUTION]: 'Study Types',
    [ChartType.RESULT_QUALITY_PIE]: 'Result Quality',
    [ChartType.BMI_BODY_FAT]: 'BMI & Body Fat',
    [ChartType.SLEEP_CHART]: 'Sleep Patterns',
    [ChartType.HEALTH_RISK_CHART]: 'Health Risk Chart',
    [ChartType.NUTRITION_GRADE_BADGE]: 'Nutrition Grade'
  };
  
  return titles[chartType] || chartType;
}

/**
 * Helper function to get chart type priority
 */
function getChartTypePriority(chartType: ChartType): number {
  const priorities: Record<ChartType, number> = {
    [ChartType.QUICK_INSIGHTS]: 100,
    [ChartType.BMI_DOMAIN]: 85,
    [ChartType.HEALTH_RISK]: 80,
    [ChartType.HEALTH_SCORE]: 79,
    [ChartType.CURRENT_WEIGHT]: 78,
    [ChartType.WEIGHT_TREND]: 75,
    [ChartType.ACTIVITY]: 72,
    [ChartType.STEPS]: 70,
    [ChartType.STEPS_CHART]: 68,
    [ChartType.ACTIVE_MINUTES]: 65,
    [ChartType.SLEEP]: 60,
    [ChartType.HYDRATION]: 55,
    [ChartType.HYDRATION_CHART]: 65,
    [ChartType.BLOOD_PRESSURE]: 76,
    [ChartType.HEART_RATE]: 68,
    [ChartType.CALORIES]: 50,
    [ChartType.CALORIES_CHART]: 55,
    [ChartType.NUTRITION]: 45,
    [ChartType.NUTRITION_TRACKING]: 52,
    [ChartType.MACRONUTRIENTS]: 40,
    [ChartType.DOPAMINE]: 35,
    [ChartType.MOOD_CHART]: 38,
    [ChartType.MEMBERS_CARD]: 95,
    [ChartType.NOVA_SCORE]: 30,
    [ChartType.RESEARCH_QUALITY]: 25,
    [ChartType.STUDY_TYPE_DISTRIBUTION]: 25,
    [ChartType.PUBLICATION_TIMELINE]: 20,
    [ChartType.RESULT_QUALITY_PIE]: 20,
    [ChartType.VITAMIN_CONTENT]: 15,
    [ChartType.DAILY_VALUE_PROGRESS]: 10,
    [ChartType.BMI_BODY_FAT]: 73,
    [ChartType.SLEEP_CHART]: 62,
    [ChartType.HEALTH_RISK_CHART]: 81,
    [ChartType.NUTRITION_GRADE_BADGE]: 48
  };
  
  return priorities[chartType] || 0;
}