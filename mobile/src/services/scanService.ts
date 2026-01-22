import { API_CONFIG, getDefaultUserContext } from './config';
import { authService } from './authService';
import { fetchWithLogging } from '../utils/apiLogger';
import type { 
  BarcodeScanResult, 
  BarcodeScanResponse,
  ImageScanResult, 
  FoodPhotoScanResult,
  PhotoScanResponse,
  PillScanResult,
  LabelScanResult,
  LabelScanResponse,
  ScanHistoryResult,
  AskWihyResponse,
  BeautyProductResponse,
  PetFoodProductResponse 
} from './types';

class ScanService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  /**
   * Get current authenticated user ID
   * Throws error if user is not authenticated - no fallbacks.
   */
  private async getCurrentUserId(): Promise<string> {
    const userData = await authService.getUserData();
    if (userData?.id) {
      return userData.id;
    }
    throw new Error('User not authenticated. Please log in to continue.');
  }

  /**
   * Universal Ask WiHY endpoint - auto-detects product type
   * API v6.1: POST /api/scan/ask_wihy
   * Searches ALL databases: Food, Beauty, Pet Food
   * Returns product_type to determine which screen to navigate to
   */
  async askWihy(query: string, mode: 'auto' | 'barcode' | 'photo' | 'pill' | 'label' = 'auto', userContext?: any): Promise<AskWihyResponse> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}/api/scan/ask_wihy`;
    
    console.log('=== ASK WIHY API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('Query:', query);
    console.log('Mode:', mode);
    
    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      const requestBody = {
        query,
        mode,
        user_context: {
          include_charts: true,
          userId: currentUserId,
          ...userContext,
        },
      };
      
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Ask WiHY HTTP error ${response.status}:`, errorText);
        console.log('=== ASK WIHY FAILED ===');
        throw new Error(`Product not found (${response.status})`);
      }

      const data = await response.json();
      console.log('Response product_type:', data.product_type);
      console.log('Response found:', data.found);
      console.log('=== ASK WIHY SUCCESS ===');
      
      return data;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== ASK WIHY ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      return {
        success: false,
        found: false,
        product_type: 'unknown',
        query_info: {
          original_query: query,
          query_type: 'barcode',
          detected_mode: mode,
          user_mode: mode,
        },
        message: error.message || 'Failed to search. Please try again.',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Scan a barcode and get product information
   * API v2.0: POST /api/scan/barcode
   * Returns flat response structure matching services.wihy.ai
   */
  async scanBarcode(barcode: string, userContext?: any): Promise<BarcodeScanResult> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}/api/scan/barcode`;
    
    console.log('=== BARCODE SCAN API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('Barcode:', barcode);
    console.log('User Context:', userContext);
    
    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      const requestBody = {
        barcode,
        user_context: {
          include_charts: true,
          include_ingredients: true,
          userId: currentUserId,
          ...userContext,
        },
      };
      
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Barcode scan HTTP error ${response.status}:`, errorText);
        console.log('=== BARCODE SCAN FAILED ===');
        throw new Error(`Product not found (${response.status})`);
      }

      const data = await response.json();
      console.log('Response Data Keys:', Object.keys(data));
      console.log('=== BARCODE SCAN SUCCESS ===');
      
      // API v2.0 returns flat structure:
      // { success, product_name, brand, health_score, nutrition_grade, nova_group,
      //   calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg,
      //   health_alerts[], positive_aspects[], areas_of_concern[],
      //   ingredients_text, allergens[], additives[], ask_wihy, ... }
      return data;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== BARCODE SCAN ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      console.error('Error message:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to scan barcode. Please try again or take a photo of the nutrition label.',
      } as BarcodeScanResponse;
    }
  }

  /**
   * Get NOVA group description
   */
  private getNovaDescription(novaGroup: number): string {
    const descriptions: Record<number, string> = {
      1: 'Unprocessed or minimally processed foods',
      2: 'Processed culinary ingredients',
      3: 'Processed foods',
      4: 'Ultra-processed foods',
    };
    return descriptions[novaGroup] || 'Unknown processing level';
  }

  /**
   * Scan an image and get food analysis
   * API v2.0: POST /api/scan/photo
   * Returns flat response structure matching services.wihy.ai
   */
  async scanImage(imageUri: string, userContext?: any): Promise<ImageScanResult> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}/api/scan/photo`;
    
    console.log('=== IMAGE SCAN API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('Image URI:', imageUri.substring(0, 50) + '...');
    console.log('User Context:', userContext);
    
    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      // Convert image to base64 if needed
      let imageData = imageUri;
      if (!imageUri.startsWith('data:image')) {
        console.log('Converting image to base64...');
        imageData = await this.convertImageToBase64(imageUri);
        console.log('Image converted, size:', imageData.length, 'chars');
      }

      const requestBody = {
        image: imageData,
        context: userContext?.context || 'food analysis',
        user_context: {
          include_charts: true,
          userId: currentUserId,
          ...userContext,
        },
      };

      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Image scan HTTP error ${response.status}:`, errorText);
        console.log('=== IMAGE SCAN FAILED ===');
        throw new Error(`Failed to analyze image (${response.status})`);
      }

      const data = await response.json();
      console.log('Response Data Keys:', Object.keys(data));
      console.log('=== IMAGE SCAN SUCCESS ===');
      
      // API v2.0 returns same flat structure as barcode scan
      return data;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== IMAGE SCAN ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      return {
        success: false,
        error: error.message || 'Failed to analyze image. Please try again.',
      } as PhotoScanResponse;
    }
  }

  /**
   * Convert image URI to base64 string
   */
  private async convertImageToBase64(uri: string): Promise<string> {
    try {
      const response = await fetchWithLogging(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  }

  /**
   * Scan a food photo and get nutrition analysis (Google Vision)
   * Returns complete analysis with detected foods, nutrition estimates, and metadata
   */
  async scanFoodPhoto(imageUri: string, userContext?: any): Promise<FoodPhotoScanResult> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}${API_CONFIG.endpoints.scan}`;
    
    console.log('=== FOOD PHOTO SCAN API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('Image URI:', imageUri.substring(0, 50) + '...');
    console.log('User Context:', userContext);
    
    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      let imageData = imageUri;
      if (!imageUri.startsWith('data:image')) {
        console.log('Converting image to base64...');
        imageData = await this.convertImageToBase64(imageUri);
        console.log('Image converted, size:', imageData.length, 'chars');
      }

      const requestBody = {
        image: imageData.substring(0, 100) + '... [truncated]',
        user_context: {
          userId: currentUserId,
          include_charts: true,
          trackHistory: true,
          ...userContext,
        },
      };
      
      console.log('Request Body (truncated image):', JSON.stringify(requestBody, null, 2));

      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'WIHY-Mobile/2.0.1',
          'X-Client-Version': '2.0.1',
          'X-Platform': 'react-native',
        },
        body: JSON.stringify({
          image: imageData,
          user_context: {
            userId: currentUserId,
            include_charts: true,
            trackHistory: true,
            ...userContext,
          },
        }),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Food photo scan HTTP error ${response.status}:`, errorText);
        console.log('=== FOOD PHOTO SCAN FAILED ===');
        throw new Error(`Failed to analyze food photo (${response.status})`);
      }

      const data = await response.json();
      console.log('Response Data:', JSON.stringify(data, null, 2));
      console.log('=== FOOD PHOTO SCAN SUCCESS ===');
      
      // Return API v2.0 response structure
      return {
        success: true,
        scan_id: data.analysis?.metadata?.scan_id || `photo_${Date.now()}`,
        scan_type: 'food_photo' as const,
        analysis: {
          summary: data.analysis?.summary || 'Food photo analyzed successfully',
          confidence_score: data.analysis?.confidence_score || 0.8,
          meal_type: data.analysis?.meal_type || 'unknown',
          charts: data.analysis?.charts || null,
          metadata: data.analysis?.metadata || {},
          recommendations: data.analysis?.recommendations || [],
          openai_analysis: data.analysis?.openai_analysis || null,
          
          // Keep legacy fields for backward compatibility
          detected_foods: data.analysis?.metadata?.detected_foods || [],
          nutrition_estimate: data.analysis?.metadata?.nutrition_facts?.per_100g || {},
          confidence: data.analysis?.confidence_score || 0.8,
        },
        metadata: data.metadata || {},
        ask_wihy: data.ask_wihy || '',
        image_url: data.image_url || null,
        timestamp: data.timestamp || new Date().toISOString(),
        processing_time: data.processing_time || 0,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== FOOD PHOTO SCAN ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return {
        success: false,
        error: error.message || 'Failed to scan food photo. Please ensure the image is clear and try again.',
      } as PhotoScanResponse;
    }
  }

  /**
   * Scan a product label for claims and greenwashing detection
   */
  async scanLabel(imageUri: string, userContext?: any): Promise<LabelScanResult> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}${API_CONFIG.endpoints.labelScan}`;
    
    console.log('=== LABEL SCAN API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('Image URI:', imageUri.substring(0, 50) + '...');
    console.log('User Context:', userContext);
    
    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      let imageData = imageUri;
      if (!imageUri.startsWith('data:image')) {
        console.log('Converting image to base64...');
        imageData = await this.convertImageToBase64(imageUri);
        console.log('Image converted, size:', imageData.length, 'chars');
      }

      const userContextWithId = {
        ...getDefaultUserContext(),
        userId: currentUserId,
        ...userContext,
      };

      const requestBody = {
        image: imageData.substring(0, 100) + '... [truncated]',
        user_context: userContextWithId,
      };
      
      console.log('Request Body (truncated image):', JSON.stringify(requestBody, null, 2));

      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'WIHY-Mobile/2.0.1',
          'X-Client-Version': '2.0.1',
          'X-Platform': 'react-native',
        },
        body: JSON.stringify({
          image: imageData,
          user_context: userContextWithId,
        }),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Label scan HTTP error ${response.status}:`, errorText);
        console.log('=== LABEL SCAN FAILED ===');
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response Data:', JSON.stringify(data, null, 2));
      console.log('=== LABEL SCAN SUCCESS ===');
      return data;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== LABEL SCAN ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return {
        success: false,
        error: error.message || 'Failed to scan label',
      } as LabelScanResponse;
    }
  }

  /**
   * Scan a recipe image for ingredient and instruction extraction
   * API v6.0: POST /api/scan/recipe
   * Returns nested response structure with analysis object containing recipe details
   * 
   * @param imageUri - Image URI (URL or base64)
   * @param userContext - Optional user context
   * @returns Recipe scan result with ingredients, instructions, nutrition estimates
   */
  async scanRecipe(imageUri: string, userContext?: any): Promise<any> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}/api/scan/recipe`;
    
    console.log('=== RECIPE SCAN API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('Image URI:', imageUri.substring(0, 50) + '...');
    console.log('User Context:', userContext);
    
    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      let imageData = imageUri;
      if (!imageUri.startsWith('data:image')) {
        console.log('Converting image to base64...');
        imageData = await this.convertImageToBase64(imageUri);
        console.log('Image converted, size:', imageData.length, 'chars');
      }

      const requestBody = {
        image_url: imageData.substring(0, 100) + '... [truncated]',
        user_context: {
          userId: currentUserId,
          trackHistory: true,
          ...userContext,
        },
      };
      
      console.log('Request Body (truncated image):', JSON.stringify(requestBody, null, 2));

      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'WIHY-Mobile/2.0.1',
          'X-Client-Version': '2.0.1',
          'X-Platform': 'react-native',
        },
        body: JSON.stringify({
          image_url: imageData,
          user_context: {
            userId: currentUserId,
            trackHistory: true,
            ...userContext,
          },
        }),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Recipe scan HTTP error ${response.status}:`, errorText);
        console.log('=== RECIPE SCAN FAILED ===');
        throw new Error(`Failed to analyze recipe (${response.status})`);
      }

      const data = await response.json();
      console.log('Response Data:', JSON.stringify(data, null, 2));
      console.log('=== RECIPE SCAN SUCCESS ===');
      
      // API v6.0 returns nested structure with analysis object
      // {
      //   "success": true,
      //   "scan_id": "scan_recipe_abc123",
      //   "analysis": {
      //     "recipe_title": "...",
      //     "ingredients": [...],
      //     "instructions": [...],
      //     "servings": 6,
      //     ...
      //   },
      //   "timestamp": "...",
      //   "processing_time_ms": 3124
      // }
      return data;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== RECIPE SCAN ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return {
        success: false,
        error: error.message || 'Failed to scan recipe. Please ensure the image is clear and try again.',
      };
    }
  }

  /**
   * Scan a pill for identification
   */
  async scanPill(
    imageUri: string, 
    context?: { 
      userId?: string; 
      imprint?: string; 
      color?: string; 
      shape?: string;
    }
  ): Promise<PillScanResult> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}${API_CONFIG.endpoints.pillScan}`;
    
    console.log('=== PILL SCAN API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('Image URI:', imageUri.substring(0, 50) + '...');
    console.log('Context:', context);
    
    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      let imageData = imageUri;
      if (!imageUri.startsWith('data:image')) {
        console.log('Converting image to base64...');
        imageData = await this.convertImageToBase64(imageUri);
        console.log('Image converted, size:', imageData.length, 'chars');
      }

      const requestBody = {
        images: ['[base64 image data - truncated]'],
        context: {
          userId: currentUserId,
          ...context,
        },
      };
      
      console.log('Request Body (truncated image):', JSON.stringify(requestBody, null, 2));

      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'WIHY-Mobile/2.0.1',
          'X-Client-Version': '2.0.1',
          'X-Platform': 'react-native',
        },
        body: JSON.stringify({
          images: [imageData],
          context: {
            userId: currentUserId,
            ...context,
          },
        }),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Pill scan HTTP error ${response.status}:`, errorText);
        console.log('=== PILL SCAN FAILED ===');
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response Data:', JSON.stringify(data, null, 2));
      console.log('=== PILL SCAN SUCCESS ===');
      return data;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== PILL SCAN ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return {
        success: false,
        error: error.message || 'Failed to scan pill',
      };
    }
  }

  /**
   * Confirm pill identification
   */
  async confirmPill(scanId: string, selectedRxcui: string, userId?: string): Promise<any> {
    try {
      // Get the current authenticated user ID if not provided
      const currentUserId = userId || await this.getCurrentUserId();
      
      const response = await fetchWithLogging(`${this.baseUrl}${API_CONFIG.endpoints.pillConfirm}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanId,
          selectedRxcui,
          userId: currentUserId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Pill confirmation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to confirm pill',
      };
    }
  }

  /**
   * Get scan history for a user
   */
  async getScanHistory(
    userId: string,
    options?: {
      limit?: number;
      scanType?: 'barcode' | 'image' | 'pill' | 'label';
      includeImages?: boolean;
    }
  ): Promise<ScanHistoryResult> {
    try {
      const params = new URLSearchParams({
        userId,
        ...(options?.limit && { limit: options.limit.toString() }),
        ...(options?.scanType && { scanType: options.scanType }),
        ...(options?.includeImages !== undefined && { 
          includeImages: options.includeImages.toString() 
        }),
      });

      const response = await fetchWithLogging(
        `${this.baseUrl}${API_CONFIG.endpoints.scanHistory}?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Scan history error:', error);
      return {
        success: false,
        count: 0,
        scans: [],
        error: error.message || 'Failed to fetch scan history',
      };
    }
  }

  /**
   * Delete a scan from history
   */
  async deleteScan(scanId: number, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}${API_CONFIG.endpoints.scanHistory}/${scanId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Delete scan error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete scan',
      };
    }
  }

  /**
   * Upload a user's captured scan image to storage
   * Uses the same /api/scan endpoint that food photos use
   * Returns permanent URL for the stored image
   */
  async uploadScanImage(
    imageUri: string,
    options: {
      barcode?: string;
      scanType: 'barcode' | 'food' | 'pill' | 'label';
      userId?: string;
    }
  ): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    const startTime = Date.now();
    // Use the same scan endpoint that food photos use - it handles image storage
    const endpoint = `${this.baseUrl}${API_CONFIG.endpoints.scan}`;
    
    console.log('=== UPLOAD SCAN IMAGE ===');
    console.log('Endpoint:', endpoint);
    console.log('Options:', options);
    
    try {
      // Get the current authenticated user ID if not provided
      const currentUserId = options.userId || await this.getCurrentUserId();
      
      // Convert image to base64
      let imageData = imageUri;
      if (!imageUri.startsWith('data:image')) {
        console.log('Converting image to base64...');
        imageData = await this.convertImageToBase64(imageUri);
        console.log('Image converted, size:', imageData.length, 'chars');
      }

      // Send as image upload with barcode context
      // Backend will store the image and return URL
      const requestBody = {
        image: imageData,
        barcode: options.barcode,
        upload_only: true, // Flag to indicate this is just for storage, not analysis
        user_context: {
          userId: currentUserId,
          scan_type: options.scanType,
          timestamp: new Date().toISOString(),
        },
      };

      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Upload Response Status: ${response.status} (${responseTime}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Upload HTTP error ${response.status}:`, errorText);
        console.log('=== UPLOAD SCAN IMAGE FAILED ===');
        // Don't throw - return gracefully so scan can continue without upload
        return {
          success: false,
          error: `Upload failed (${response.status})`,
        };
      }

      const data = await response.json();
      console.log('Upload Response:', data);
      console.log('=== UPLOAD SCAN IMAGE SUCCESS ===');

      return {
        success: true,
        imageUrl: data.image_url || data.url,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== UPLOAD SCAN IMAGE ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      // Don't throw - return gracefully so scan can continue without upload
      return {
        success: false,
        error: error.message || 'Failed to upload image',
      };
    }
  }
}

export const scanService = new ScanService();
