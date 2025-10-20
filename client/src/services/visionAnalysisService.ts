// src/services/visionAnalysisService.ts

interface VisionAnalysisResult {
  success: boolean;
  data?: {
    barcodes?: string[];
    qrCodes?: string[];
    text?: string;
    nutritionText?: string;
    description?: string;
    foodItems?: string[];
    brands?: string[];
    imageInfo?: {
      name: string;
      size: string;
      type: string;
      dimensions: string;
    };
    // WIHY Scanner API fields
    healthScore?: number;
    novaGroup?: number;
    novaDescription?: string;
    isHealthy?: boolean;
    recommendations?: string[];
    warnings?: string[];
    familySafe?: boolean;
    colorCode?: string;
    verdict?: string;
    dataSources?: string[];
  };
  error?: string;
}

// WIHY Scanner API Configuration
const WIHY_API_BASE = 'https://vhealth-wihy-ml-api.gentlebush-f35a13de.westus2.azurecontainerapps.io';

class VisionAnalysisService {
  /**
   * Analyze image using WIHY Scanner API
   */
  async analyzeImage(imageFile: File): Promise<VisionAnalysisResult> {
    try {
      console.log('🔍 Starting WIHY image analysis...');
      
      // Get basic image information
      const imageInfo = this.getImageInfo(imageFile);
      console.log('Image info:', imageInfo);

      // Use WIHY Scanner API for comprehensive food analysis
      let wihyResult: any = null;
      
      try {
        console.log('Analyzing with WIHY Scanner API...');
        wihyResult = await this.analyzeWithWihyAPI(imageFile, {
          user_context: 'web_upload',
          image_name: imageFile.name
        });
        console.log('WIHY Scanner analysis result:', wihyResult);
      } catch (error) {
        console.log('WIHY Scanner API not available, falling back to legacy analysis');
        return this.fallbackAnalysis(imageFile, imageInfo);
      }

      if (wihyResult && wihyResult.success) {
        return this.processWihyImageResponse(wihyResult, imageInfo);
      } else {
        return this.fallbackAnalysis(imageFile, imageInfo);
      }

    } catch (error) {
      console.error('Vision analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  /**
   * Analyze image using WIHY Scanner API (supports File objects and URLs)
   */
  private async analyzeWithWihyAPI(input: File | string, userContext = {}): Promise<any> {
    let response: Response;
    
    if (typeof input === 'string') {
      // URL analysis
      console.log('🌐 Analyzing image from URL:', input);
      response = await fetch(`${WIHY_API_BASE}/wihy/scan-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: input,
          context: JSON.stringify({
            analysis_type: 'food_health',
            user_location: 'web_app',
            input_type: 'url',
            ...userContext
          })
        })
      });
    } else {
      // File upload analysis
      console.log('📁 Analyzing uploaded file:', input.name);
      const formData = new FormData();
      formData.append('image', input);
      formData.append('context', JSON.stringify({
        analysis_type: 'food_health',
        user_location: 'web_app',
        input_type: 'file_upload',
        file_name: input.name,
        file_size: input.size,
        ...userContext
      }));
      
      response = await fetch(`${WIHY_API_BASE}/wihy/scan-image`, {
        method: 'POST',
        body: formData
      });
    }
    
    if (!response.ok) {
      throw new Error(`WIHY API Error: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Analyze image from URL
   */
  async analyzeImageUrl(imageUrl: string, userContext = {}): Promise<VisionAnalysisResult> {
    try {
      console.log('🔍 Analyzing image from URL with WIHY Scanner API');
      
      const wihyResult = await this.analyzeWithWihyAPI(imageUrl, {
        ...userContext,
        source: 'url_input'
      });
      
      if (wihyResult && wihyResult.success) {
        return this.processWihyImageResponse(wihyResult, {
          name: 'Image from URL',
          size: 'Unknown',
          type: 'url',
          dimensions: 'Unknown'
        });
      } else {
        return this.handleUrlAnalysisError(imageUrl);
      }
      
    } catch (error) {
      console.error('URL image analysis failed:', error);
      return this.handleUrlAnalysisError(imageUrl, error);
    }
  }

  /**
   * Handle URL analysis errors
   */
  private handleUrlAnalysisError(imageUrl: string, error?: any): VisionAnalysisResult {
    return {
      success: false,
      error: error?.message || 'URL analysis failed',
      data: {
        description: 'Could not analyze image from URL',
        foodItems: [],
        brands: [],
        nutritionText: 'Analysis failed',
        barcodes: [],
        qrCodes: [],
        text: '',
        imageInfo: {
          name: 'Image from URL',
          size: 'Unknown',
          type: 'url',
          dimensions: 'Unknown'
        },
        healthScore: 0,
        novaGroup: 4,
        novaDescription: 'Unknown - Analysis failed',
        isHealthy: false,
        recommendations: [
          'URL Error - When in doubt, choose whole foods',
          'Real food doesn\'t need complex analysis'
        ],
        warnings: ['Could not analyze image from URL'],
        familySafe: false,
        colorCode: 'red',
        verdict: 'Choose whole foods when uncertain',
        dataSources: ['Error - No data available']
      }
    };
  }

  /**
   * Process WIHY Scanner API response
   */
  private processWihyImageResponse(wihyResult: any, imageInfo: any): VisionAnalysisResult {
    const {
      success,
      overall_assessment,
      google_vision_analysis,
      detected_foods,
      nova_chart_reference,
      wihy_recommendations,
      wihy_analysis
    } = wihyResult;

    const healthScore = overall_assessment?.health_score || 0;
    const novaGroup = overall_assessment?.nova_group || 4;
    const verdict = overall_assessment?.verdict || 'Analysis completed';
    const colorCode = nova_chart_reference?.client_guidance?.color_coding || 'red';
    
    // Extract detected foods
    const foodItems = detected_foods?.map((food: any) => food.name || food) || [];
    
    // Extract recommendations and warnings
    const recommendations = wihy_recommendations || [];
    const warnings = wihy_analysis?.carcinogen_warnings || [];
    
    // Determine if healthy based on NOVA group and health score
    const isHealthy = novaGroup <= 2 && healthScore >= 60;
    const familySafe = wihy_analysis?.family_safety?.safety_score >= 60;

    return {
      success: true,
      data: {
        description: verdict,
        foodItems: foodItems,
        brands: [], // Could extract from vision analysis
        nutritionText: `Health Score: ${healthScore}/100 | NOVA Group: ${novaGroup}`,
        barcodes: [],
        qrCodes: [],
        text: google_vision_analysis?.detected_text || '',
        imageInfo,
        // WIHY Scanner specific data
        healthScore,
        novaGroup,
        novaDescription: this.getNovaDescription(novaGroup),
        isHealthy,
        recommendations,
        warnings,
        familySafe,
        colorCode,
        verdict,
        dataSources: wihyResult.data_sources || ['WIHY Scanner', 'Google Vision']
      }
    };
  }

  /**
   * Fallback analysis when WIHY API is not available
   */
  private async fallbackAnalysis(imageFile: File, imageInfo: any): Promise<VisionAnalysisResult> {
    console.log('Using fallback analysis...');
    
    // Try legacy WiHy API as fallback
    let wihyAnalysis = '';
    
    try {
      const { wihyAPI } = await import('./wihyAPI');
      const wihyResult = await wihyAPI.scanFood(imageFile);
      
      if (wihyResult.success && 'data' in wihyResult && wihyResult.data?.ai_response?.response) {
        wihyAnalysis = wihyResult.data.ai_response.response;
      }
    } catch (error) {
      console.log('Legacy WiHy API also unavailable');
    }

    // Extract potential nutrition and food information
    const foodAnalysis = this.analyzeFoodContent(wihyAnalysis, imageInfo);
    
    return {
      success: true,
      data: {
        description: wihyAnalysis || 'Image analyzed - choose whole foods when in doubt',
        foodItems: foodAnalysis.foodItems,
        brands: foodAnalysis.brands,
        nutritionText: foodAnalysis.nutritionText,
        barcodes: [],
        qrCodes: [],
        text: '',
        imageInfo,
        // Default WIHY values for fallback
        healthScore: 50,
        novaGroup: 4,
        novaDescription: 'Unknown processing level',
        isHealthy: false,
        recommendations: ['Choose whole foods when uncertain', 'Real food doesn\'t need complicated analysis'],
        warnings: ['Could not analyze product completely'],
        familySafe: false,
        colorCode: 'orange',
        verdict: 'Analysis limited - choose natural foods',
        dataSources: ['Local Analysis']
      }
    };
  }

  /**
   * Get NOVA group description
   */
  private getNovaDescription(novaGroup: number): string {
    const descriptions = {
      1: 'Natural - Real food as God intended',
      2: 'Processed - Use sparingly',
      3: 'Highly Processed - Find alternatives',
      4: 'Ultra-Processed - Your family deserves better'
    };
    
    return descriptions[novaGroup as keyof typeof descriptions] || descriptions[4];
  }

  /**
   * Get basic image file information
   */
  private getImageInfo(file: File) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    
    return {
      name: file.name,
      size: `${sizeInMB} MB`,
      type: file.type,
      dimensions: 'Analyzing...' // Could load image to get actual dimensions
    };
  }

  /**
   * Analyze food-related content from text and AI response
   */
  private analyzeFoodContent(analysisText: string, imageInfo: any) {
    const text = analysisText.toLowerCase();
    
    // Common food keywords
    const foodKeywords = [
      'apple', 'banana', 'orange', 'bread', 'milk', 'cheese', 'chicken', 'beef',
      'rice', 'pasta', 'salad', 'sandwich', 'pizza', 'burger', 'fruit', 'vegetable',
      'cereal', 'yogurt', 'soup', 'snack', 'cookie', 'chocolate', 'candy'
    ];
    
    // Common brand keywords
    const brandKeywords = [
      'coca cola', 'pepsi', 'nestlé', 'kraft', 'kellogs', 'general mills',
      'unilever', 'procter', 'johnson', 'mars', 'ferrero', 'danone'
    ];
    
    // Nutrition-related keywords
    const nutritionKeywords = [
      'calories', 'protein', 'carbs', 'fat', 'sugar', 'sodium', 'fiber',
      'vitamin', 'mineral', 'organic', 'natural', 'healthy', 'nutrition'
    ];
    
    const detectedFood = foodKeywords.filter(keyword => text.includes(keyword));
    const detectedBrands = brandKeywords.filter(keyword => text.includes(keyword));
    const nutritionMentions = nutritionKeywords.filter(keyword => text.includes(keyword));
    
    return {
      foodItems: detectedFood,
      brands: detectedBrands,
      nutritionText: nutritionMentions.length > 0 ? 
        `Nutrition-related content detected: ${nutritionMentions.join(', ')}` : 
        ''
    };
  }

  /**
   * Scan barcode using WIHY Scanner API
   */
  async scanBarcode(barcode: string, userContext = {}): Promise<VisionAnalysisResult> {
    try {
      console.log('🔍 Scanning barcode with WIHY Scanner API:', barcode);
      
      const response = await fetch(`${WIHY_API_BASE}/wihy/scan-barcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: barcode,
          user_context: {
            scan_location: 'web_app',
            device_type: 'browser',
            ...userContext
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`WIHY Barcode API Error: ${response.status}`);
      }
      
      const result = await response.json();
      return this.processWihyBarcodeResponse(result, barcode);
      
    } catch (error) {
      console.error('Barcode scan failed:', error);
      return this.handleBarcodeError(error, barcode);
    }
  }

  /**
   * Process WIHY barcode scan response
   */
  private processWihyBarcodeResponse(result: any, barcode: string): VisionAnalysisResult {
    const {
      success,
      nova_group,
      nova_description,
      nova_chart_reference,
      health_score,
      wihy_analysis,
      data_sources,
      product_name
    } = result;
    
    const isHealthy = nova_group <= 2 && health_score >= 60;
    const colorCode = nova_chart_reference?.client_guidance?.color_coding || 'red';
    const familySafe = wihy_analysis?.family_safety?.safety_score >= 60;
    
    return {
      success: true,
      data: {
        description: product_name || `Product ${barcode}`,
        foodItems: product_name ? [product_name] : [],
        brands: [],
        nutritionText: `Health Score: ${health_score}/100 | NOVA Group: ${nova_group}`,
        barcodes: [barcode],
        qrCodes: [],
        text: '',
        imageInfo: {
          name: `Barcode-${barcode}`,
          size: 'N/A',
          type: 'barcode',
          dimensions: 'N/A'
        },
        // WIHY Scanner specific data
        healthScore: health_score,
        novaGroup: nova_group,
        novaDescription: nova_description || this.getNovaDescription(nova_group),
        isHealthy,
        recommendations: wihy_analysis?.wihy_recommendations || [],
        warnings: wihy_analysis?.carcinogen_warnings || [],
        familySafe,
        colorCode,
        verdict: wihy_analysis?.verdict || this.getHealthVerdict(health_score, nova_group),
        dataSources: data_sources || ['WIHY Enhanced DB']
      }
    };
  }

  /**
   * Handle barcode scan errors
   */
  private handleBarcodeError(error: any, barcode: string): VisionAnalysisResult {
    return {
      success: false,
      error: error.message || 'Barcode scan failed',
      data: {
        description: 'Could not analyze product',
        foodItems: [],
        brands: [],
        nutritionText: 'Analysis failed',
        barcodes: [barcode],
        qrCodes: [],
        text: '',
        imageInfo: {
          name: `Barcode-${barcode}`,
          size: 'N/A',
          type: 'barcode',
          dimensions: 'N/A'
        },
        healthScore: 0,
        novaGroup: 4,
        novaDescription: 'Unknown - Analysis failed',
        isHealthy: false,
        recommendations: [
          'API Error - When in doubt, choose whole foods',
          'Real food doesn\'t need barcodes'
        ],
        warnings: ['Could not analyze product'],
        familySafe: false,
        colorCode: 'red',
        verdict: 'Choose whole foods when uncertain',
        dataSources: ['Error - No data available']
      }
    };
  }

  /**
   * Get health verdict based on scores
   */
  private getHealthVerdict(healthScore: number, novaGroup: number): string {
    if (novaGroup === 1 && healthScore >= 80) return 'Excellent choice - natural and healthy!';
    if (novaGroup <= 2 && healthScore >= 60) return 'Good choice - moderately processed';
    if (novaGroup === 3) return 'Caution - highly processed food';
    if (novaGroup === 4) return 'Avoid - ultra-processed food';
    return 'Choose whole foods for better health';
  }

  /**
   * Format analysis results for display
   */
  formatForDisplay(result: VisionAnalysisResult): string {
    if (!result.success || !result.data) {
      return result.error || 'Analysis failed';
    }

    const { data } = result;
    const parts: string[] = [];

    // WIHY Scanner results
    if (data.verdict) {
      parts.push(`🎯 ${data.verdict}`);
    }

    // Health information
    if (data.healthScore !== undefined && data.novaGroup !== undefined) {
      parts.push(`📊 Health Score: ${data.healthScore}/100`);
      parts.push(`🏷️ ${data.novaDescription}`);
    }

    // Detected foods
    if (data.foodItems && data.foodItems.length > 0) {
      parts.push(`🍎 Detected: ${data.foodItems.join(', ')}`);
    }

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      parts.push(`💡 Recommendations:`);
      data.recommendations.forEach(rec => parts.push(`  • ${rec}`));
    }

    // Warnings
    if (data.warnings && data.warnings.length > 0) {
      parts.push(`⚠️ Warnings:`);
      data.warnings.forEach(warning => parts.push(`  • ${warning}`));
    }

    // Data sources
    if (data.dataSources && data.dataSources.length > 0) {
      parts.push(`📋 Data from: ${data.dataSources.join(' • ')}`);
    }

    // Fallback to basic info
    if (parts.length === 0) {
      if (data.description) {
        parts.push(data.description);
      }
      if (data.imageInfo) {
        parts.push(`📁 ${data.imageInfo.name} (${data.imageInfo.size})`);
      }
    }

    return parts.length > 0 ? parts.join('\n\n') : 'Image analyzed - choose whole foods for better health';
  }

  /**
   * Get color coding for UI display
   */
  getColorCoding(result: VisionAnalysisResult): { color: string; label: string; action: string } {
    if (!result.success || !result.data?.colorCode) {
      return { color: 'red', label: 'ERROR', action: 'TRY AGAIN' };
    }

    const colorMap = {
      'green': { color: '#4CAF50', label: 'CHOOSE', action: 'Great choice!' },
      'yellow': { color: '#FFEB3B', label: 'MODERATE', action: 'Use sparingly' },
      'orange': { color: '#FF9800', label: 'LIMIT', action: 'Find alternatives' },
      'red': { color: '#F44336', label: 'AVOID', action: 'Choose whole foods instead' }
    };

    return colorMap[result.data.colorCode as keyof typeof colorMap] || colorMap.red;
  }

  /**
   * Comprehensive image analysis supporting files, URLs, and camera captures
   */
  async analyzeAnyImage(input: File | string | Blob, context = {}): Promise<VisionAnalysisResult> {
    try {
      // Handle different input types
      if (input instanceof Blob && !(input instanceof File)) {
        // Convert Blob to File for camera captures
        const file = new File([input], 'camera-capture.jpg', { type: 'image/jpeg' });
        return this.analyzeImage(file);
      } else if (typeof input === 'string') {
        // Handle URLs
        return this.analyzeImageUrl(input, context);
      } else {
        // Handle File objects
        return this.analyzeImage(input);
      }
    } catch (error) {
      console.error('Image analysis failed:', error);
      return this.handleGenericError(error);
    }
  }

  /**
   * Handle generic analysis errors with WIHY guidance
   */
  private handleGenericError(error: any): VisionAnalysisResult {
    return {
      success: false,
      error: error?.message || 'Analysis failed',
      data: {
        description: 'Image analysis failed',
        foodItems: [],
        brands: [],
        nutritionText: 'Choose whole foods when technology fails',
        barcodes: [],
        qrCodes: [],
        text: '',
        imageInfo: {
          name: 'Analysis Failed',
          size: 'N/A',
          type: 'error',
          dimensions: 'N/A'
        },
        healthScore: 0,
        novaGroup: 4,
        novaDescription: 'Unknown - Technical error',
        isHealthy: false,
        recommendations: [
          'Technical error - When in doubt, choose whole foods',
          'Real food doesn\'t need complex analysis',
          'Shop the perimeter of the grocery store',
          'If it has more than 5 ingredients, consider alternatives'
        ],
        warnings: ['Analysis system temporarily unavailable'],
        familySafe: false,
        colorCode: 'red',
        verdict: 'Choose whole foods - they\'re always the safest bet',
        dataSources: ['WIHY Health Guidance']
      }
    };
  }

  /**
   * Test WIHY Scanner API health and connectivity
   */
  async testApiHealth(): Promise<{ healthy: boolean; message: string; latency?: number }> {
    try {
      const startTime = Date.now();
      
      // Test with a simple barcode scan
      const response = await fetch(`${WIHY_API_BASE}/wihy/scan-barcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '3017620422003', // Nutella test barcode
          user_context: { test: true }
        })
      });
      
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        const hasRequired = result.nova_group && result.health_score !== undefined;
        
        return {
          healthy: hasRequired,
          message: hasRequired ? '✅ WIHY Scanner API is healthy' : '⚠️ API missing required fields',
          latency
        };
      } else {
        return {
          healthy: false,
          message: `❌ API Error: ${response.status}`,
          latency
        };
      }
      
    } catch (error) {
      return {
        healthy: false,
        message: `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const visionAnalysisService = new VisionAnalysisService();
export type { VisionAnalysisResult };