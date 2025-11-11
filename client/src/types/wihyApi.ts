/**
 * WIHY API Types - Pure Implementation Guide Types
 * Based on WIHY API Pure Implementation Guide
 * Base URL: https://ml.wihy.ai
 */

// Main /ask endpoint types
export interface WIHYAskRequest {
  query: string;
  user_context?: {
    age?: number;
    health_goals?: string[];
    dietary_restrictions?: string[];
    medical_conditions?: string[];
    [key: string]: any;
  };
  include_charts?: boolean;
  chart_types?: string[];
}

export interface WIHYAskResponse {
  type: string;
  response: string | object;
  recommendations?: string[];
  citations?: Array<{
    title?: string;
    type?: string;
    [key: string]: any;
  }>;
  confidence: number;
  source: string;
  timestamp: string;
  processing_time: number;
  chart_data?: {
    health_score?: number;
    nutrition_grade?: string;
    nova_classification?: number;
    research_quality_score?: number;
    evidence_grade?: string;
    study_count?: number;
    confidence_level?: number;
    macronutrients?: { [key: string]: number };
    vitamins?: { [key: string]: number };
    minerals?: { [key: string]: number };
    calories_per_serving?: number;
    publication_timeline?: Array<{ [key: string]: number }>;
    study_type_distribution?: { [key: string]: number };
    evidence_distribution?: { [key: string]: number };
    journal_impact_scores?: number[];
    [key: string]: any;
  };
}

// Research endpoint types
export interface WIHYResearchRequest {
  topic: string;
  limit?: number;
}

export interface WIHYResearchResponse {
  articles: Array<{
    title: string;
    summary: string;
    quality_score: number;
    [key: string]: any;
  }>;
  error?: string;
}

// Conversation message type
export interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  data?: WIHYAskResponse;
}

// Health check types (legacy compatibility)
export interface WIHYHealthCheckResponse {
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
export interface WIHYApiInfoResponse {
  message: string;
  status: 'operational' | 'degraded' | 'maintenance';
  version: string;
  endpoints: string[];
  documentation: string;
}

// Error types
export interface WIHYApiError {
  error: string;
  message: string;
  timestamp: string;
}

// Rate limiting info (from documentation) - focused on user-facing endpoints
export interface WIHYRateLimits {
  healthQuestions: '60 requests per minute per IP';
  healthChecks: '120 requests per minute per IP';
}

// Performance targets (from documentation) - focused on user-facing endpoints
export interface WIHYPerformanceTargets {
  basicHealthQuestions: '< 2 seconds response time';
  healthChecks: '< 0.5 seconds response time';
  uptime: '99.9% availability target';
}

// Utility types for error handling
export type WIHYApiResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: WIHYApiError;
};

// Union type for core API responses
export type WIHYApiResponse = 
  | WIHYAskResponse 
  | WIHYHealthCheckResponse 
  | WIHYApiInfoResponse 
  | WIHYApiError;