// Wihy Services API Scanning Integration
// Uses Universal Search API for comprehensive food scanning with rich business logic

import { universalSearchService, UniversalSearchResponse } from './universalSearchService';

export interface ScanRequest {
  barcode?: string;
  product_name?: string;
  image?: string; // Base64 encoded image data
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
    include_charts?: boolean;
    include_recommendations?: boolean;
    limit?: number;
  };
}

export interface ScanResult {
  success: boolean;
  analysis?: {
    summary: string;
    recommendations: string[];
    confidence_score: number;
    charts?: object;
    metadata?: object;
  };
  timestamp: string;
  processing_time?: number;
  error?: string;
}

export interface BarcodeScanResult {
  success: boolean;
  analysis?: {
    summary: string;
    recommendations: string[];
    confidence_score: number;
    charts?: object;
  };
  health_score?: number;
  nova_group?: number;
  product?: {
    name: string;
    brand: string;
    barcode: string;
    categories: string[];
    nova_group: number;
    image_url?: string;
  };
  nutrition?: {
    score: number;
    grade: string;
    per_100g: {
      energy_kcal: number;
      fat: number;
      saturated_fat: number;
      carbohydrates: number;
      sugars: number;
      fiber: number;
      proteins: number;
      salt: number;
      sodium: number;
    };
    daily_values: {
      energy: number;
      fat: number;
      saturated_fat: number;
    };
  };
  health_analysis?: {
    alerts: Array<{
      type: string;
      message: string;
      severity: string;
    }>;
    recommendations: string[];
    processing_level: {
      nova_group: number;
      description: string;
      details: string;
    };
  };
  scan_metadata?: {
    scan_id: string;
    timestamp: string;
    confidence_score: number;
    data_sources: string[];
  };
  error?: string;
}

export interface ScanHistory {
  success: boolean;
  count: number;
  scans: Array<{
    id: number;
    scan_type: string;
    scan_input: string;
    health_score: number;
    confidence_score: number;
    scan_timestamp: string;
    image_url?: string;
    product: {
      name: string;
      brand: string;
    };
  }>;
}

export interface ScanServiceStatus {
  success: boolean;
  services: {
    wihy_scanning_service: boolean;
    openfoodfacts_api: boolean;
    nutrition_calculator: boolean;
    restaurant_database: boolean;
    image_analysis: boolean;
  };
  capabilities: string[];
  last_checked: string;
}

class WihyScanningService {
  private readonly baseUrl = 'https://services.wihy.ai';
  
  /**
   * Test API connectivity via Universal Search API
   */
  async testConnection(): Promise<{ available: boolean; error?: string }> {
    try {
      console.log('🔍 Testing WiHy Scanning API connectivity via Universal Search...');
      
      // Test Universal Search API since that's what handles the business logic
      const universalSearchTest = await universalSearchService.testConnection();
      
      if (universalSearchTest.available) {
        console.log('✅ Universal Search API available for scanning');
        return { available: true };
      } else {
        console.warn('⚠️ Universal Search API not available:', universalSearchTest.error);
        return { available: false, error: universalSearchTest.error };
      }
    } catch (error) {
      console.error('❌ WiHy Scanning API connectivity test failed:', error);
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }
  
  /**
   * Convert File to base64 for API transmission
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Scan food by image using WiHy Scanner API /scan endpoint
   */
  async scanImage(image: File | string, userContext?: ScanRequest['context']): Promise<ScanResult> {
    try {
      let imageData: string;
      
      if (image instanceof File) {
        imageData = await this.fileToBase64(image);
      } else {
        imageData = image;
      }

      console.log('🔍 WiHy Scanning API - image scan via /scan endpoint');
      console.log('📡 API Endpoint: Using /api/scan directly (no /ask redirect)');
      console.log('📤 Request payload:', {
        imageDataLength: imageData.length,
        context: image instanceof File ? `Image analysis: ${image.name}` : 'Image analysis',
        userContext: {
          health_goals: ['nutrition_analysis'],
          dietary_restrictions: [],
          ...userContext
        }
      });

      // First, get basic image analysis from the scanner API
      const response = await fetch(`${this.baseUrl}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          context: image instanceof File ? `Image analysis: ${image.name}` : 'Image analysis',
          userContext: {
            health_goals: ['nutrition_analysis'],
            dietary_restrictions: [],
            ...userContext
          }
        })
      });

      if (!response.ok) {
        console.error(`❌ WiHy Scanner API - HTTP Error: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const scannerData = await response.json();
      console.log('✅ WiHy Scanner API - initial image response:', scannerData);

      // Return the scanner result directly (no need for second /ask call)
      const scanResult: ScanResult = {
        success: true,
        analysis: {
          summary: scannerData.analysis?.summary || scannerData.message || 'Image analysis completed',
          recommendations: scannerData.analysis?.recommendations || scannerData.recommendations || [],
          confidence_score: scannerData.analysis?.confidence_score || scannerData.confidence_score || 0,
          charts: scannerData.charts_data,
          metadata: {
            health_score: scannerData.health_score,
            nova_group: scannerData.nova_group,
            product_info: scannerData.product_info,
            nutrition_facts: scannerData.nutrition_facts,
            scan_endpoint_used: '/api/scan'
          }
        },
        timestamp: scannerData.timestamp || new Date().toISOString(),
        processing_time: scannerData.processing_time
      };
      
      console.log('✅ WiHy Scanning API - image scan completed (single /scan request):', scanResult);
      return scanResult;

      // Fallback: Use scanner data only if Universal Search fails
      console.log('⚠️ Universal Search enhancement failed, using scanner data only');

      
    } catch (error) {
      console.error('❌ WiHy Scanning API - image scan error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image scanning failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Scan food by barcode using Universal Search API with full business logic
   */
  async scanBarcode(barcode: string, userContext?: any): Promise<BarcodeScanResult> {
    try {
      console.log('🔍 WiHy Scanning API - barcode scan via Universal Search:', barcode);

      // Use Universal Search API for barcode scanning with rich business logic
      const universalSearchResult = await universalSearchService.search({
        query: barcode,
        type: 'barcode',
        context: {
          health_goals: ['nutrition_analysis'],
          dietary_restrictions: [],
          ...userContext
        },
        options: {
          include_charts: true,
          include_recommendations: true,
          limit: 1
        }
      });

      if (universalSearchResult.success && universalSearchResult.results.metadata) {
        const metadata = universalSearchResult.results.metadata;
        
        // Transform Universal Search response to BarcodeScanResult format
        const transformedResult: BarcodeScanResult = {
          success: true,
          analysis: {
            summary: universalSearchResult.results.summary || 
                    `${metadata.product_name} - Health Score: ${metadata.health_score}/100`,
            recommendations: universalSearchResult.recommendations || [],
            confidence_score: universalSearchResult.results.confidence_score || 0.8,
            charts: universalSearchResult.charts
          },
          health_score: metadata.health_score,
          nova_group: metadata.nova_group,
          product: {
            name: metadata.product_name,
            brand: metadata.brand,
            barcode: metadata.barcode || barcode,
            categories: metadata.categories,
            nova_group: metadata.nova_group,
            image_url: undefined // Not provided in current contract
          },
          nutrition: {
            score: metadata.nutrition_score,
            grade: metadata.grade,
            per_100g: {
              energy_kcal: metadata.nutrition_facts.calories,
              fat: metadata.nutrition_facts.fat,
              saturated_fat: metadata.nutrition_facts.saturated_fat,
              carbohydrates: metadata.nutrition_facts.carbohydrates,
              sugars: metadata.nutrition_facts.sugars,
              fiber: metadata.nutrition_facts.fiber,
              proteins: metadata.nutrition_facts.protein,
              salt: metadata.nutrition_facts.salt,
              sodium: metadata.nutrition_facts.sodium
            },
            daily_values: {
              energy: metadata.nutrition_analysis.daily_value_percentages.calories,
              fat: metadata.nutrition_analysis.daily_value_percentages.fat,
              saturated_fat: metadata.nutrition_analysis.daily_value_percentages.saturated_fat
            }
          },
          health_analysis: {
            alerts: metadata.nutrition_analysis.health_alerts.map(alert => ({
              type: alert.type,
              message: alert.message,
              severity: alert.level
            })),
            recommendations: metadata.nutrition_analysis.areas_of_concern.map(concern => concern.recommendation),
            processing_level: {
              nova_group: metadata.nova_group,
              description: metadata.nova_description,
              details: metadata.processing_level
            }
          },
          scan_metadata: {
            scan_id: `scan_${Date.now()}`,
            timestamp: universalSearchResult.timestamp,
            confidence_score: universalSearchResult.results.confidence_score || 0.8,
            data_sources: ['universal_search_api', 'openfoodfacts']
          }
        };

        console.log('✅ Universal Search barcode scan successful');
        return transformedResult;
      } else {
        return {
          success: false,
          error: universalSearchResult.error || 'No barcode data found'
        } as BarcodeScanResult;
      }

    } catch (error) {
      console.error('❌ WiHy Scanning API - barcode scan error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Barcode scanning failed'
      } as BarcodeScanResult;
    }
  }

  /**
   * Scan food by product name using Universal Search API with full business logic
   */
  async scanProductName(productName: string, userContext?: ScanRequest['context']): Promise<ScanResult> {
    try {
      console.log('🔍 WiHy Scanning API - product name scan via Universal Search:', productName);

      // Use Universal Search API for food name searching with rich business logic
      const universalSearchResult = await universalSearchService.search({
        query: productName,
        type: 'food',
        context: {
          health_goals: ['nutrition_analysis'],
          dietary_restrictions: [],
          ...userContext
        },
        options: {
          include_charts: true,
          include_recommendations: true,
          limit: 1
        }
      });

      if (universalSearchResult.success) {
        const transformedResult: ScanResult = {
          success: true,
          analysis: {
            summary: universalSearchResult.results.summary || 
                    `Analysis for ${productName}`,
            recommendations: universalSearchResult.recommendations || [],
            confidence_score: universalSearchResult.results.confidence_score || 0.7,
            charts: universalSearchResult.charts,
            metadata: universalSearchResult.results.metadata
          },
          timestamp: universalSearchResult.timestamp,
          processing_time: universalSearchResult.processing_time_ms
        };

        console.log('✅ Universal Search product name scan successful');
        return transformedResult;
      } else {
        return {
          success: false,
          error: universalSearchResult.error || 'No product data found',
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error('❌ WiHy Scanning API - product name scan error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Product scanning failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get scanning service status
   */
  async getServiceStatus(): Promise<ScanServiceStatus> {
    try {
      console.log('🔍 WiHy Scanning API - checking service status');

      const response = await fetch(`${this.baseUrl}/api/scan/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ WiHy Scanning API - service status:', data);

      return data;

    } catch (error) {
      console.error('❌ WiHy Scanning API - service status error:', error);
      return {
        success: false,
        services: {
          wihy_scanning_service: false,
          openfoodfacts_api: false,
          nutrition_calculator: false,
          restaurant_database: false,
          image_analysis: false
        },
        capabilities: [],
        last_checked: new Date().toISOString()
      };
    }
  }

  /**
   * Get user's scan history
   */
  async getScanHistory(userId: string, limit: number = 50, includeImages: boolean = true): Promise<ScanHistory> {
    try {
      console.log('🔍 WiHy Scanning API - getting scan history for user:', userId);

      const params = new URLSearchParams({
        userId,
        limit: limit.toString(),
        includeImages: includeImages.toString()
      });

      const response = await fetch(`${this.baseUrl}/api/scan/history?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ WiHy Scanning API - scan history:', data);

      return data;

    } catch (error) {
      console.error('❌ WiHy Scanning API - scan history error:', error);
      return {
        success: false,
        count: 0,
        scans: []
      };
    }
  }

  /**
   * Extract structured data for chat interface
   */
  extractChatData(result: ScanResult | BarcodeScanResult): any {
    if (!result.success) {
      return {
        type: 'error',
        message: result.error || 'Scanning failed'
      };
    }

    // Handle barcode scan result with rich data
    if ('product' in result && result.product) {
      return {
        type: 'barcode_analysis',
        product_info: {
          name: result.product.name,
          brand: result.product.brand,
          barcode: result.product.barcode
        },
        health_score: result.health_score || (result.nutrition ? result.nutrition.score : 0),
        nova_group: result.nova_group || result.product.nova_group || 0,
        analysis: result.analysis || {
          summary: `${result.product.name} analysis`,
          recommendations: result.health_analysis?.recommendations || [],
          confidence_score: result.scan_metadata?.confidence_score || 0
        },
        nutrition_facts: result.nutrition ? {
          calories: result.nutrition.per_100g.energy_kcal,
          protein_g: result.nutrition.per_100g.proteins,
          carbohydrates_g: result.nutrition.per_100g.carbohydrates,
          fat_g: result.nutrition.per_100g.fat,
          fiber_g: result.nutrition.per_100g.fiber,
          sodium_g: result.nutrition.per_100g.sodium,
          grade: result.nutrition.grade
        } : null,
        charts: result.analysis?.charts || {},
        timestamp: result.scan_metadata?.timestamp || new Date().toISOString()
      };
    }

    // Handle image analysis result
    if ('analysis' in result && result.analysis) {
      return {
        type: 'image_analysis', 
        analysis: result.analysis,
        charts: result.analysis.charts || {},
        timestamp: ('timestamp' in result ? result.timestamp : null) || new Date().toISOString()
      };
    }

    return {
      type: 'unknown',
      message: 'Unknown scan result format'
    };
  }

  /**
   * Format scan result for display
   */
  formatScanResult(result: ScanResult | BarcodeScanResult): string {
    if (!result.success) {
      return result.error || 'Scanning failed';
    }

    // Handle main scan result
    if ('analysis' in result && result.analysis) {
      let formatted = result.analysis.summary || 'Food item analyzed';
      
      if (result.analysis.recommendations && result.analysis.recommendations.length > 0) {
        formatted += '\n\n🔸 Recommendations:\n';
        formatted += result.analysis.recommendations.map(rec => `• ${rec}`).join('\n');
      }

      if (result.analysis.confidence_score) {
        formatted += `\n\n📊 Confidence: ${Math.round(result.analysis.confidence_score * 100)}%`;
      }

      return formatted;
    }

    // Handle barcode scan result
    if ('product' in result && result.product) {
      let formatted = `📦 ${result.product.name}`;
      
      if (result.product.brand) {
        formatted += ` by ${result.product.brand}`;
      }

      if (result.nutrition) {
        formatted += `\n\n📊 Health Score: ${result.nutrition.grade} (${result.nutrition.score}/100)`;
        
        const nutrition = result.nutrition.per_100g;
        formatted += `\n\n🥄 Per 100g:`;
        formatted += `\n• Calories: ${nutrition.energy_kcal} kcal`;
        formatted += `\n• Protein: ${nutrition.proteins}g`;
        formatted += `\n• Carbs: ${nutrition.carbohydrates}g`;
        formatted += `\n• Fat: ${nutrition.fat}g`;
        
        if (nutrition.fiber > 0) {
          formatted += `\n• Fiber: ${nutrition.fiber}g`;
        }
      }

      if (result.health_analysis?.recommendations && result.health_analysis.recommendations.length > 0) {
        formatted += '\n\n🔸 Recommendations:\n';
        formatted += result.health_analysis.recommendations.map(rec => `• ${rec}`).join('\n');
      }

      if (result.health_analysis?.alerts && result.health_analysis.alerts.length > 0) {
        formatted += '\n\n⚠️ Health Alerts:\n';
        formatted += result.health_analysis.alerts.map(alert => `• ${alert.message}`).join('\n');
      }

      return formatted;
    }

    return 'Food item analyzed successfully';
  }
}

// Export singleton instance
export const wihyScanningService = new WihyScanningService();