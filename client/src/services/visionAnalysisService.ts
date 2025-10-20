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
  };
  error?: string;
}

class VisionAnalysisService {
  /**
   * Analyze image using browser-native APIs and backend services
   */
  async analyzeImage(imageFile: File): Promise<VisionAnalysisResult> {
    try {
      console.log('🔍 Starting comprehensive image analysis...');
      
      // Get basic image information
      const imageInfo = this.getImageInfo(imageFile);
      console.log('📊 Image info:', imageInfo);

      // Use existing WiHy API for comprehensive food analysis
      let wihyAnalysis = '';
      let nutritionInfo = '';
      
      try {
        console.log('🍎 Attempting WiHy API analysis...');
        const { wihyAPI } = await import('./wihyAPI');
        const wihyResult = await wihyAPI.scanFood(imageFile);
        
        if (wihyResult.success && 'data' in wihyResult && wihyResult.data?.ai_response?.response) {
          wihyAnalysis = wihyResult.data.ai_response.response;
          console.log('✅ WiHy analysis successful');
        }
      } catch (error) {
        console.log('ℹ️ WiHy API analysis not available');
      }

      // Extract potential nutrition and food information
      const foodAnalysis = this.analyzeFoodContent(wihyAnalysis, imageInfo);
      
      const result: VisionAnalysisResult = {
        success: true,
        data: {
          description: wihyAnalysis || 'Image uploaded for analysis',
          foodItems: foodAnalysis.foodItems,
          brands: foodAnalysis.brands,
          nutritionText: foodAnalysis.nutritionText,
          barcodes: [], // Future: could integrate barcode detection
          qrCodes: [], // Future: could integrate QR code detection
          text: '', // Future: could integrate OCR
          imageInfo
        }
      };

      console.log('✅ Analysis complete:', result);
      return result;

    } catch (error) {
      console.error('❌ Vision analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
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
   * Format analysis results for display
   */
  formatForDisplay(result: VisionAnalysisResult): string {
    if (!result.success || !result.data) {
      return result.error || 'Image analysis failed';
    }

    const { data } = result;
    const parts: string[] = [];

    // Primary description from AI analysis
    if (data.description) {
      parts.push(data.description);
    }

    // Add detected food items
    if (data.foodItems && data.foodItems.length > 0) {
      parts.push(`Detected foods: ${data.foodItems.join(', ')}`);
    }

    // Add brands if detected
    if (data.brands && data.brands.length > 0) {
      parts.push(`Brands: ${data.brands.join(', ')}`);
    }

    // Add nutrition info
    if (data.nutritionText) {
      parts.push(data.nutritionText);
    }

    // Add basic image info
    if (data.imageInfo) {
      parts.push(`Image: ${data.imageInfo.name} (${data.imageInfo.size})`);
    }

    return parts.length > 0 ? parts.join('\n\n') : 'Image analyzed - ready for health insights';
  }
}

export const visionAnalysisService = new VisionAnalysisService();
export type { VisionAnalysisResult };