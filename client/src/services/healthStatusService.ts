/**
 * Health Status Service - Utility for WIHY API system health monitoring
 * Based on WIHY API Documentation /health endpoint
 */

import { API_CONFIG } from '../config/apiConfig';

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

export interface ApiInfoResponse {
  message: string;
  status: 'operational' | 'degraded' | 'maintenance';
  version: string;
  endpoints: string[];
  documentation: string;
}

class HealthStatusService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.WIHY_API_URL;
  }

  /**
   * Get system health check with service status information
   */
  async getHealthCheck(): Promise<HealthCheckResponse | null> {
    try {
      console.log('🔍 HEALTH STATUS: Checking system health');

      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      const data: HealthCheckResponse = await response.json();

      console.log('🔍 HEALTH STATUS: Health check received:', {
        status: data.status,
        servicesAvailable: Object.values(data.services).filter(s => s === 'available').length,
        totalServices: Object.keys(data.services).length
      });

      return data;

    } catch (error) {
      console.error('Health status service error:', error);
      return null;
    }
  }

  /**
   * Get basic API information and available endpoints
   */
  async getApiInfo(): Promise<ApiInfoResponse | null> {
    try {
      console.log('🔍 HEALTH STATUS: Getting API info');

      const response = await fetch(`${this.baseURL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`API info failed: ${response.status} ${response.statusText}`);
      }

      const data: ApiInfoResponse = await response.json();

      console.log('🔍 HEALTH STATUS: API info received:', {
        status: data.status,
        version: data.version,
        endpointsCount: data.endpoints?.length || 0
      });

      return data;

    } catch (error) {
      console.error('API info service error:', error);
      return null;
    }
  }

  /**
   * Check if all critical services are available
   */
  async areServicesHealthy(): Promise<boolean> {
    const healthCheck = await this.getHealthCheck();
    
    if (!healthCheck) {
      return false;
    }

    // Consider system healthy if status is 'healthy' or 'degraded' (not 'unhealthy')
    // and at least one service is available
    const availableServices = Object.values(healthCheck.services).filter(s => s === 'available');
    
    return healthCheck.status !== 'unhealthy' && availableServices.length > 0;
  }

  /**
   * Get a human-readable status message
   */
  async getStatusMessage(): Promise<string> {
    const healthCheck = await this.getHealthCheck();
    
    if (!healthCheck) {
      return 'Unable to connect to WIHY services. Please try again later.';
    }

    const availableServices = Object.values(healthCheck.services).filter(s => s === 'available');
    const totalServices = Object.keys(healthCheck.services).length;

    switch (healthCheck.status) {
      case 'healthy':
        return `All WIHY services are operational (${availableServices.length}/${totalServices} services available)`;
      case 'degraded':
        return `WIHY services are partially available (${availableServices.length}/${totalServices} services available)`;
      case 'unhealthy':
        return `WIHY services are currently unavailable. Please try again later.`;
      default:
        return healthCheck.message || 'Unknown system status';
    }
  }
}

// Create and export singleton instance
export const healthStatusService = new HealthStatusService();
export default healthStatusService;