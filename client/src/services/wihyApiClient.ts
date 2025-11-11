/**
 * WIHY API Client - Simplified client focused on core functionality
 * 
 * This client focuses on the essential endpoints for user-facing features:
 * - Primary /ask endpoint for health & nutrition questions (includes automatic research integration)
 * - /health for system health checks
 * - / for API information
 * 
 * The /ask endpoint automatically incorporates research when relevant, 
 * so no separate research endpoints are needed for the main user interface.
 */

import { API_CONFIG } from '../config/apiConfig';

// Primary /ask endpoint types
export interface AskRequest {
  query: string;
}

export interface AskResponse {
  response: string;
  type: string;
  source: 'wihy_model' | 'research_api' | 'openai_enhancer' | 'fallback';
  confidence: number;
  timestamp: string;
  processing_time: number;
}

// Health check types
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    wihy_model: 'available' | 'unavailable';
    openai_enhancer: 'available' | 'unavailable';
    research_api: 'available' | 'unavailable';
  };
  message: string;
}

// API info types
export interface ApiInfoResponse {
  message: string;
  status: 'operational' | 'degraded' | 'maintenance';
  version: string;
  endpoints: string[];
  documentation: string;
}

// Error response type
export interface ApiError {
  error: string;
  message: string;
  timestamp: string;
}

export class WIHYApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.WIHY_API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Primary endpoint for health & nutrition questions
   * 
   * @param query - Health question (1-2000 characters)
   * @returns Promise<AskResponse | null>
   * 
   * @example
   * const result = await client.askHealthQuestion("Is quinoa good for weight loss?");
   * console.log(`Response: ${result.response}`);
   * console.log(`Source: ${result.source}`);
   * console.log(`Confidence: ${result.confidence}`);
   */
  async askHealthQuestion(query: string): Promise<AskResponse | null> {
    try {
      if (!query || query.length === 0 || query.length > 2000) {
        throw new Error('Query must be between 1 and 2000 characters');
      }

      console.log('🔍 WIHY CLIENT: Asking health question:', query.substring(0, 100) + '...');

      const response = await fetch(`${this.baseUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query } as AskRequest)
      });

      if (!response.ok) {
        const errorData = await this.handleApiError(response);
        console.error('WIHY CLIENT: Ask endpoint error:', errorData);
        return null;
      }

      const data: AskResponse = await response.json();

      console.log('🔍 WIHY CLIENT: Health question response received:', {
        type: data.type,
        source: data.source,
        confidence: data.confidence,
        processingTime: data.processing_time
      });

      return data;

    } catch (error) {
      console.error('WIHY CLIENT: Ask health question error:', error);
      return null;
    }
  }

  /**
   * Check system health and service availability
   * 
   * @returns Promise<HealthCheckResponse | null>
   * 
   * @example
   * const health = await client.checkHealth();
   * console.log(`System status: ${health.status}`);
   * console.log(`Services: ${Object.entries(health.services).map(([k,v]) => `${k}:${v}`).join(', ')}`);
   */
  async checkHealth(): Promise<HealthCheckResponse | null> {
    try {
      console.log('🔍 WIHY CLIENT: Checking system health');

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await this.handleApiError(response);
        console.error('WIHY CLIENT: Health check error:', errorData);
        return null;
      }

      const data: HealthCheckResponse = await response.json();

      console.log('🔍 WIHY CLIENT: Health check completed:', {
        status: data.status,
        servicesAvailable: Object.values(data.services).filter(s => s === 'available').length,
        totalServices: Object.keys(data.services).length
      });

      return data;

    } catch (error) {
      console.error('WIHY CLIENT: Health check error:', error);
      return null;
    }
  }

  /**
   * Get API information and available endpoints
   * 
   * @returns Promise<ApiInfoResponse | null>
   * 
   * @example
   * const info = await client.getApiInfo();
   * console.log(`API version: ${info.version}`);
   * console.log(`Status: ${info.status}`);
   * console.log(`Available endpoints: ${info.endpoints.join(', ')}`);
   */
  async getApiInfo(): Promise<ApiInfoResponse | null> {
    try {
      console.log('🔍 WIHY CLIENT: Getting API information');

      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await this.handleApiError(response);
        console.error('WIHY CLIENT: API info error:', errorData);
        return null;
      }

      const data: ApiInfoResponse = await response.json();

      console.log('🔍 WIHY CLIENT: API info received:', {
        version: data.version,
        status: data.status,
        endpointsCount: data.endpoints?.length || 0
      });

      return data;

    } catch (error) {
      console.error('WIHY CLIENT: Get API info error:', error);
      return null;
    }
  }

  /**
   * Comprehensive health assessment - checks both health endpoint and system functionality
   * 
   * @returns Promise<{isHealthy: boolean, details: any}>
   */
  async getSystemStatus(): Promise<{isHealthy: boolean, details: any}> {
    try {
      const [healthCheck, apiInfo] = await Promise.all([
        this.checkHealth(),
        this.getApiInfo()
      ]);

      const isHealthy = healthCheck?.status === 'healthy' && apiInfo?.status === 'operational';

      return {
        isHealthy,
        details: {
          health: healthCheck,
          api: apiInfo,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('WIHY CLIENT: System status error:', error);
      return {
        isHealthy: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Handle API errors and parse error responses
   */
  private async handleApiError(response: Response): Promise<ApiError | null> {
    try {
      const errorData = await response.json();
      return errorData as ApiError;
    } catch {
      return {
        error: 'HTTP_ERROR',
        message: `Request failed with status ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create and export singleton instance using configured API URL
export const wihyApiClient = new WIHYApiClient();
export default wihyApiClient;