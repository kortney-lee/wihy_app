// Wihy Services API Scanning Integration
// Integrates with https://services.wihy.ai for comprehensive food scanning

export interface ScanRequest {
  // Input types based on Wihy Services API
  barcode?: string;
  product_name?: string;
  image?: string; // Base64 encoded image data
  user_context?: {
    include_charts?: boolean;
    include_ingredients?: boolean;
    health_goals?: string[];
    dietary_restrictions?: string[];
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
   * Test API connectivity
   */
  async testConnection(): Promise<{ available: boolean; error?: string }> {
    try {
      console.log('🔍 Testing WiHy Scanning API connectivity...');
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        console.log('✅ WiHy Scanning API is available');
        return { available: true };
      } else {
        console.warn(`⚠️ WiHy Scanning API returned ${response.status}`);
        return { available: false, error: `HTTP ${response.status}` };
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
   * Scan food by image using the correct WIHY Scanner API endpoint
   */
  async scanImage(image: File | string, userContext?: ScanRequest['user_context']): Promise<ScanResult> {
    try {
      let imageData: string;
      
      if (image instanceof File) {
        imageData = await this.fileToBase64(image);
      } else {
        imageData = image;
      }

      console.log('🔍 WiHy Scanning API - image scan');
      console.log('📡 API Endpoint:', `${this.baseUrl}/api/scan`);
      console.log('📤 Request payload:', {
        imageDataLength: imageData.length,
        context: image instanceof File ? `Image analysis: ${image.name}` : 'Image analysis',
        userContext: {
          health_goals: ['nutrition_analysis'],
          dietary_restrictions: [],
          ...userContext
        }
      });

      // For image analysis, we still use POST /api/scan since it requires image data
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
        console.error(`❌ WiHy Scanning API - HTTP Error: ${response.status} ${response.statusText}`);
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
      console.log('✅ WiHy Scanning API - image response:', data);

      // The API might not return a success field, so determine success based on data presence
      const hasAnalysisData = data.analysis || data.health_score || data.product_info || data.charts_data;
      const apiSuccess = data.success !== false && hasAnalysisData; // Treat as success unless explicitly false

      return {
        success: apiSuccess,
        analysis: {
          summary: data.analysis?.summary || data.description || 'Image analysis completed',
          recommendations: data.analysis?.recommendations || data.recommendations || [],
          confidence_score: data.analysis?.confidence_score || data.confidence_score || 0,
          charts: data.charts_data || data.charts,
          metadata: {
            health_score: data.health_score,
            nova_group: data.nova_group,
            product_info: data.product_info,
            nutrition_facts: data.nutrition_facts
          }
        },
        timestamp: data.timestamp || new Date().toISOString(),
        processing_time: data.processing_time
      };
      
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
   * Scan food by barcode using the correct WIHY Scanner API endpoint
   */
  async scanBarcode(barcode: string, userContext?: any): Promise<BarcodeScanResult> {
    try {
      console.log('🔍 WiHy Scanning API - barcode scan:', barcode);

      // Use the correct GET endpoint with barcode in URL and user context as query parameter
      let url = `${this.baseUrl}/api/scan/barcode/${encodeURIComponent(barcode)}`;

      // Add user context as query parameter if provided
      if (userContext) {
        const userContextParam = encodeURIComponent(JSON.stringify({
          health_goals: ['nutrition_analysis'],
          dietary_restrictions: [],
          ...userContext
        }));
        url += `?userContext=${userContextParam}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'Product not found in database'
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ WiHy Scanning API - barcode response:', data);

      // Check if we have valid analysis data (API doesn't return a success field when successful)
      const hasValidData = data.analysis || data.product_info || data.nutrition_facts;

      return {
        success: hasValidData,
        analysis: data.analysis,
        health_score: data.health_score,
        nova_group: data.nova_group,
        product: data.product_info,
        nutrition: data.nutrition_facts,
        health_analysis: {
          alerts: data.health_alerts || [],
          recommendations: data.analysis?.recommendations || [],
          processing_level: {
            nova_group: data.nova_group || 0,
            description: `NOVA Group ${data.nova_group || 0}`,
            details: data.analysis?.summary || ''
          }
        },
        scan_metadata: {
          scan_id: data.scan_id || '',
          timestamp: data.timestamp || new Date().toISOString(),
          confidence_score: data.analysis?.confidence_score || 0,
          data_sources: data.data_sources || []
        }
      };

    } catch (error) {
      console.error('❌ WiHy Scanning API - barcode scan error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Barcode scanning failed'
      };
    }
  }

  /**
   * Scan food by product name using the correct WIHY Scanner API endpoint
   */
  async scanProductName(productName: string, userContext?: ScanRequest['user_context']): Promise<ScanResult> {
    try {
      console.log('🔍 WiHy Scanning API - product name scan:', productName);

      // Encode product name for URL and user context as query parameter
      const encodedProductName = encodeURIComponent(productName);
      let url = `${this.baseUrl}/api/scan/product/${encodedProductName}`;

      // Add user context as query parameter if provided
      if (userContext) {
        const userContextParam = encodeURIComponent(JSON.stringify({
          health_goals: ['nutrition_analysis'],
          dietary_restrictions: [],
          ...userContext
        }));
        url += `?userContext=${userContextParam}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ WiHy Scanning API - product response:', data);

      return {
        success: data.success,
        analysis: {
          summary: data.analysis?.summary || `${productName} analysis`,
          recommendations: data.analysis?.recommendations || [],
          confidence_score: data.analysis?.confidence_score || 0,
          charts: data.charts_data,
          metadata: {
            health_score: data.health_score,
            nova_group: data.nova_group,
            product_info: data.product_info,
            nutrition_facts: data.nutrition_facts
          }
        },
        timestamp: data.timestamp || new Date().toISOString(),
        processing_time: data.processing_time
      };

    } catch (error) {
      console.error('❌ WiHy Scanning API - product name scan error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Product name scanning failed',
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