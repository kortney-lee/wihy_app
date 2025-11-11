// src/services/visionAnalysisService.ts

import { BrowserMultiFormatReader } from '@zxing/browser';

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

// WIHY Scanner API Configuration with dev flag support
const getWihyApiUrl = () => {
  // Check for explicit environment variable first (highest priority)
  if (process.env.REACT_APP_WIHY_API_URL) {
    return process.env.REACT_APP_WIHY_API_URL;
  }
  
  // Development flag - set to true to use local scanner dev server, false for production
  const USE_LOCAL_SCANNER = process.env.REACT_APP_USE_LOCAL_SCANNER === 'true';
  
  // Check if we're on localhost (local development)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocalhost && USE_LOCAL_SCANNER) {
    // Local development with dev flag enabled - use localhost Scanner API
    return 'http://localhost:5001'; // WIHY Scanner API dev server
  } else {
    // Production/deployed OR dev flag disabled - use production Scanner API
    return 'https://services.wihy.ai'; // Official WIHY Scanner API
  }
};

const WIHY_API_BASE = getWihyApiUrl();

// Debug logging for Scanner API
console.log('🔍 WIHY SCANNER API CONFIG DEBUG:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_WIHY_API_URL: process.env.REACT_APP_WIHY_API_URL,
  FINAL_API_URL: WIHY_API_BASE,
  HOSTNAME: window.location.hostname,
  IS_LOCALHOST: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  USE_LOCAL_SCANNER: process.env.REACT_APP_USE_LOCAL_SCANNER === 'true',
  DETECTION_REASON: process.env.REACT_APP_WIHY_API_URL ? 'ENV_VAR' : 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && process.env.REACT_APP_USE_LOCAL_SCANNER === 'true' ? 'LOCAL_SCANNER_DEV' : 'PRODUCTION_SCANNER_API'
});

class VisionAnalysisService {
  private barcodeReader: BrowserMultiFormatReader;
  
  constructor() {
    this.barcodeReader = new BrowserMultiFormatReader();
  }

  /**
   * Smart detection: Analyze image to determine if it contains barcode patterns
   */
  private async analyzeImagePattern(imageFile: File): Promise<{ hasBarcodeLikePattern: boolean; confidence: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        if (!ctx) {
          resolve({ hasBarcodeLikePattern: false, confidence: 0 });
          return;
        }
        
        // Set canvas size (optimize for analysis)
        const maxSize = 800;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data for pattern analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Analyze for barcode patterns (vertical lines, alternating dark/light patterns)
        let verticalLineScore = 0;
        let horizontalVariance = 0;
        const sampleRows = 5; // Sample multiple rows
        
        for (let row = 0; row < sampleRows; row++) {
          const y = Math.floor((canvas.height / (sampleRows + 1)) * (row + 1));
          let transitions = 0;
          let lastBrightness = 0;
          
          for (let x = 0; x < canvas.width; x += 2) { // Sample every 2 pixels for performance
            const i = (y * canvas.width + x) * 4;
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            
            if (Math.abs(brightness - lastBrightness) > 30) { // Threshold for transition
              transitions++;
            }
            lastBrightness = brightness;
          }
          
          // Barcodes typically have many transitions (vertical lines)
          verticalLineScore += transitions;
        }
        
        // Calculate confidence based on pattern analysis
        const avgTransitions = verticalLineScore / sampleRows;
        const confidence = Math.min(avgTransitions / 20, 1); // Normalize to 0-1
        const hasBarcodeLikePattern = confidence > 0.3; // Threshold for barcode detection
        
        console.log('🔍 Pattern Analysis:', {
          avgTransitions,
          confidence: Math.round(confidence * 100) + '%',
          hasBarcodeLikePattern,
          imageSize: `${canvas.width}x${canvas.height}`
        });
        
        URL.revokeObjectURL(img.src);
        resolve({ hasBarcodeLikePattern, confidence });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve({ hasBarcodeLikePattern: false, confidence: 0 });
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Helper: Create ImageBitmap from File
   */
  private async createImageBitmap(file: File): Promise<ImageBitmap> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        createImageBitmap(img)
          .then(resolve)
          .catch(reject);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Helper: Load image from File
   */
  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Normalize barcode to GTIN-14 format for food product lookup
   */
  private normalizeToGTIN14(barcode: string): string {
    // Remove any non-digit characters
    const digits = barcode.replace(/\D/g, '');
    
    // Handle different UPC/EAN formats and normalize to GTIN-14
    switch (digits.length) {
      case 8:  // EAN-8
        return '000000' + digits;
      case 12: // UPC-A
        return '00' + digits;
      case 13: // EAN-13
        return '0' + digits;
      case 14: // Already GTIN-14
        return digits;
      default:
        // If not a standard food product barcode format, return as-is
        return digits;
    }
  }

  /**
   * Hybrid barcode detection: Native BarcodeDetector → ZXing fallback
   * Optimized for food product barcodes (UPC/EAN formats)
   */
  private async detectBarcodes(imageFile: File): Promise<string[]> {
    console.log('🔍 Starting hybrid barcode detection...', {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type
    });

    // First, smart pattern detection
    const patternAnalysis = await this.analyzeImagePattern(imageFile);
    
    if (!patternAnalysis.hasBarcodeLikePattern) {
      console.log('📷 No barcode pattern detected, skipping barcode scanning');
      return [];
    }
    
    console.log('📊 Barcode pattern detected, proceeding with detection...');
    
    const detectedBarcodes: string[] = [];
    
    // Method 1: Try native BarcodeDetector (fast path)
    if ('BarcodeDetector' in window) {
      try {
        console.log('🚀 Trying native BarcodeDetector (fast path)...');
        
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] // Food retail formats
        });
        
        const barcodes = await barcodeDetector.detect(await this.createImageBitmap(imageFile));
        
        if (barcodes.length > 0) {
          barcodes.forEach((barcode: any) => {
            const normalizedBarcode = this.normalizeToGTIN14(barcode.rawValue);
            console.log('✅ Native detector found:', barcode.rawValue, '→', normalizedBarcode);
            detectedBarcodes.push(normalizedBarcode);
          });
          return [...new Set(detectedBarcodes)]; // Remove duplicates
        }
      } catch (nativeError) {
        console.log('⚠️ Native BarcodeDetector failed:', nativeError.message);
      }
    } else {
      console.log('ℹ️ Native BarcodeDetector not supported');
    }
    
    // Method 2: ZXing fallback (reliable path) - only for food barcode formats
    try {
      console.log('� Falling back to ZXing detection...');
      
      const img = await this.loadImage(imageFile);
      
      // Try ZXing with timeout and format restrictions
      const zxingPromise = this.barcodeReader.decodeFromImageElement(img);
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('ZXing timeout')), 3000); // Shorter timeout
      });
      
      const result = await Promise.race([zxingPromise, timeout]) as any;
      
      if (result && result.getText) {
        const rawBarcode = result.getText();
        const normalizedBarcode = this.normalizeToGTIN14(rawBarcode);
        console.log('✅ ZXing detected:', rawBarcode, '→', normalizedBarcode);
        detectedBarcodes.push(normalizedBarcode);
      }
      
    } catch (zxingError) {
      console.log('⚠️ ZXing detection failed:', zxingError.message || zxingError);
    }
    
    const uniqueBarcodes = [...new Set(detectedBarcodes)];
    console.log('🎯 Final detected barcodes (GTIN-14):', uniqueBarcodes);
    
    return uniqueBarcodes;
  }

  /**
   * Analyze image using WIHY Scanner API
   */
  async analyzeImage(imageFile: File): Promise<VisionAnalysisResult> {
    try {
      console.log('🔍 Starting WIHY image analysis...');
      
      // Get basic image information
      const imageInfo = this.getImageInfo(imageFile);
      console.log('Image info:', imageInfo);

      // Try hybrid barcode detection 
      console.log('🔍 Starting hybrid barcode detection...');
      const detectedBarcodes = await this.detectBarcodes(imageFile);
      
      console.log('🔍 Barcode detection result:', detectedBarcodes);
      
      // If we found barcodes, scan them instead of doing image analysis
      if (detectedBarcodes.length > 0) {
        console.log('🎯 Barcodes detected, performing barcode scan:', detectedBarcodes);
        
        try {
          // Scan the first detected barcode
          const barcodeResult = await this.scanBarcode(detectedBarcodes[0]);
          console.log('📊 Barcode scan result:', barcodeResult);
          
          // Add the detected barcodes to the result
          if (barcodeResult.success && barcodeResult.data) {
            barcodeResult.data.barcodes = detectedBarcodes;
            console.log('✅ Returning barcode analysis result');
            return barcodeResult;
          }
        } catch (barcodeError) {
          console.log('Barcode scan failed, falling back to image analysis:', barcodeError);
        }
      } else {
        console.log('ℹ️ No barcodes detected, proceeding with regular image analysis');
      }

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
        const processedResult = this.processWihyImageResponse(wihyResult, imageInfo);
        // Add any detected barcodes to the image analysis result
        if (processedResult.data && detectedBarcodes.length > 0) {
          processedResult.data.barcodes = detectedBarcodes;
        }
        return processedResult;
      } else {
        const fallbackResult = await this.fallbackAnalysis(imageFile, imageInfo);
        // Add any detected barcodes to the fallback result
        if (fallbackResult.data && detectedBarcodes.length > 0) {
          fallbackResult.data.barcodes = detectedBarcodes;
        }
        return fallbackResult;
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
    console.log('🔍 Analyzing with WIHY Scanner API...');
    
    // Create FormData for the image upload
    const formData = new FormData();
    
    if (typeof input === 'string') {
      // URL analysis - fetch the image first
      console.log('🌐 Analyzing image from URL:', input);
      
      const imageResponse = await fetch(input);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      
      const blob = await imageResponse.blob();
      formData.append('image', blob, 'url-image.jpg');
    } else {
      // File upload analysis
      console.log('📁 Analyzing uploaded file:', input.name);
      formData.append('image', input);
    }
    
    // Add additional scanning options
    formData.append('include_charts', 'true');
    formData.append('include_ingredients', 'true');
    formData.append('health_goals', JSON.stringify(['nutrition_analysis', 'health_insights']));
    formData.append('dietary_restrictions', JSON.stringify([]));
    
    const response = await fetch(`${WIHY_API_BASE}/api/image`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`WIHY Scanner API Error: ${response.status}`);
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
   * Get color coding from health score
   */
  private getColorFromHealthScore(healthScore: number): string {
    if (healthScore >= 90) return 'green';
    if (healthScore >= 70) return 'yellow';
    if (healthScore >= 40) return 'orange';
    return 'red';
  }

  /**
   * Process WIHY Scanner API response
   */
  private processWihyImageResponse(wihyResult: any, imageInfo: any): VisionAnalysisResult {
    const {
      success,
      analysis,
      health_score,
      nova_group,
      product_info,
      nutrition_facts,
      warnings,
      alternatives,
      charts_data
    } = wihyResult;

    const healthScore = health_score || 0;
    const novaGroup = nova_group || 4;
    const verdict = analysis?.summary || 'Analysis completed';
    const colorCode = this.getColorFromHealthScore(healthScore);
    
    // Extract detected foods from product info
    const foodItems = product_info?.name ? [product_info.name] : [];
    const brands = product_info?.brand ? [product_info.brand] : [];
    
    // Extract recommendations and warnings
    const recommendations = analysis?.recommendations || [];
    const warningMessages = warnings || [];
    
    // Determine if healthy based on NOVA group and health score
    const isHealthy = novaGroup <= 2 && healthScore >= 60;
    const familySafe = healthScore >= 60;

    return {
      success: true,
      data: {
        description: verdict,
        foodItems: foodItems,
        brands: brands,
        nutritionText: nutrition_facts ? 
          `Health Score: ${healthScore}/100 | NOVA Group: ${novaGroup} | Calories: ${nutrition_facts.calories || 0}` :
          `Health Score: ${healthScore}/100 | NOVA Group: ${novaGroup}`,
        barcodes: [],
        qrCodes: [],
        text: '',
        imageInfo,
        // WIHY Scanner specific data
        healthScore,
        novaGroup,
        novaDescription: this.getNovaDescription(novaGroup),
        isHealthy,
        recommendations,
        warnings: warningMessages,
        familySafe,
        colorCode,
        verdict,
        dataSources: ['WIHY Scanner API']
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
      
      if (('success' in wihyResult && wihyResult.success) || !('success' in wihyResult)) {
        const message = ('message' in wihyResult) ? wihyResult.message : 
                       ('data' in wihyResult && wihyResult.data.ai_response) ? wihyResult.data.ai_response.response : 
                       null;
        if (message) {
          wihyAnalysis = message;
        }
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
      
      // Use the correct GET endpoint for barcode lookup
      const url = `${WIHY_API_BASE}/api/barcode/${encodeURIComponent(barcode)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
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
      health_score,
      nova_group,
      product_info,
      analysis,
      nutrition_facts,
      warnings,
      alternatives
    } = result;
    
    const healthScore = health_score || 0;
    const novaGroup = nova_group || 4;
    const isHealthy = novaGroup <= 2 && healthScore >= 60;
    const colorCode = this.getColorFromHealthScore(healthScore);
    const familySafe = healthScore >= 60;
    
    return {
      success: true,
      data: {
        description: product_info?.name || `Product ${barcode}`,
        foodItems: product_info?.name ? [product_info.name] : [],
        brands: product_info?.brand ? [product_info.brand] : [],
        nutritionText: nutrition_facts ? 
          `Health Score: ${healthScore}/100 | NOVA Group: ${novaGroup} | Calories: ${nutrition_facts.calories || 0}` :
          `Health Score: ${healthScore}/100 | NOVA Group: ${novaGroup}`,
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
        healthScore: healthScore,
        novaGroup: novaGroup,
        novaDescription: this.getNovaDescription(novaGroup),
        isHealthy,
        recommendations: analysis?.recommendations || [],
        warnings: warnings || [],
        familySafe,
        colorCode,
        verdict: analysis?.summary || this.getHealthVerdict(healthScore, novaGroup),
        dataSources: ['WIHY Scanner API']
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

    // Barcode detection info
    if (data.barcodes && data.barcodes.length > 0) {
      parts.push(`📱 Barcode detected: ${data.barcodes[0]}`);
    }

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
      
      // Test with health endpoint
      const response = await fetch(`${WIHY_API_BASE}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        const hasService = result.status === 'healthy';
        
        return {
          healthy: hasService,
          message: hasService ? '✅ WIHY Scanner API is healthy' : '⚠️ API service degraded',
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