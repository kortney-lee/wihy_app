/**
 * WIHY API Client - Pure Implementation
 * Based on the WIHY API Pure Implementation Guide
 * Base URL: https://ml.wihy.ai
 */

import { authService } from './authService';

// Types based on the API documentation
export interface WIHYRequest {
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

export interface WIHYResponse {
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

export interface ResearchRequest {
  topic: string;
  limit?: number;
}

export interface ResearchResponse {
  articles: Array<{
    title: string;
    summary: string;
    quality_score: number;
    [key: string]: any;
  }>;
  error?: string;
}

export interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  data?: WIHYResponse;
}

/**
 * WIHY API Client Class
 */
export class WIHYClient {
  private baseURL: string;
  private conversations: Array<{ query: string; response: WIHYResponse }>;
  
  constructor(baseURL: string = 'https://ml.wihy.ai') {
    this.baseURL = baseURL;
    this.conversations = [];
  }

  /**
   * Ask a health question to WIHY
   */
  async ask(query: string, includeCharts: boolean = false): Promise<WIHYResponse> {
    try {
      const requestBody: WIHYRequest = {
        query: query,
        include_charts: includeCharts
      };

      const response = await fetch(`${this.baseURL}/ask`, {
        method: 'POST',
        headers: authService.getAuthenticatedHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: WIHYResponse = await response.json();
      
      // Store in conversation history
      this.conversations.push({ query, response: data });
      
      return data;
      
    } catch (error) {
      console.error('WIHY API Error:', error);
      throw error;
    }
  }

  /**
   * Ask with user context
   */
  async askWithContext(
    query: string, 
    includeCharts: boolean = false,
    userContext?: WIHYRequest['user_context']
  ): Promise<WIHYResponse> {
    try {
      const requestBody: WIHYRequest = {
        query: query,
        include_charts: includeCharts,
        user_context: userContext
      };
      
      const response = await fetch(`${this.baseURL}/ask`, {
        method: 'POST',
        headers: authService.getAuthenticatedHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: WIHYResponse = await response.json();
      
      // Store in conversation history
      this.conversations.push({ query, response: data });
      
      return data;
      
    } catch (error) {
      console.error('WIHY API Error:', error);
      throw error;
    }
  }

  /**
   * Get research articles for visualizations/analytics (bulk data)
   * For research questions, use ask() instead
   */
  async getResearch(topic: string, limit: number = 10): Promise<ResearchResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/research/articles?topic=${encodeURIComponent(topic)}&limit=${limit}`, {
        method: 'GET',
        headers: authService.getAuthenticatedHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error('WIHY Research API Error:', error);
      return { articles: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Ask research questions (automatically routed via /ask)
   */
  async askResearchQuestion(question: string): Promise<WIHYResponse> {
    return this.ask(question, true);
  }

  /**
   * Analyze content (like "Analyze with Wihy" button)
   */
  async analyzeContent(content: string, contentType: string = 'health content'): Promise<WIHYResponse> {
    const query = `Please analyze this ${contentType}: ${content}`;
    return this.ask(query, true);
  }

  /**
   * Get conversation context for follow-up questions
   */
  private getConversationContext(lastN: number = 5): string {
    if (this.conversations.length === 0) return '';
    
    return this.conversations
      .slice(-lastN)
      .map(conv => `User: ${conv.query}\nWIHY: ${conv.response.response}`)
      .join('\n\n');
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Array<{ query: string; response: WIHYResponse }> {
    return [...this.conversations];
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(): void {
    this.conversations = [];
  }

  /**
   * Export conversation to JSON
   */
  exportConversation(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      total_messages: this.conversations.length,
      conversations: this.conversations
    }, null, 2);
  }
}

/**
 * Analyze with WIHY button implementation
 */
export function addAnalyzeWithWihyButton(
  element: HTMLElement, 
  content: string,
  onResponse?: (response: WIHYResponse) => void
): void {
  const button = document.createElement('button');
  button.textContent = 'Analyze with Wihy';
  button.className = 'analyze-with-wihy-btn';
  
  button.onclick = async () => {
    try {
      const client = new WIHYClient();
      const response = await client.analyzeContent(content);
      
      if (onResponse) {
        onResponse(response);
      } else {
        // Default behavior - show alert
        alert(`WIHY Analysis:\n\n${response.response}\n\nConfidence: ${Math.round(response.confidence * 100)}%`);
      }
    } catch (error) {
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  element.appendChild(button);
}

/**
 * Quick questions for getting started
 */
export const QUICK_HEALTH_QUESTIONS = [
  "Is coffee healthy?",
  "Best foods for weight loss?",
  "How much water should I drink daily?",
  "Mediterranean diet benefits?",
  "Dangers of processed foods?",
  "Intermittent fasting pros and cons?",
  "Best vitamins for energy?",
  "How to reduce inflammation naturally?",
  "Healthy sleep habits?",
  "Exercise for beginners?"
];

/**
 * Default WIHY client instance
 */
export const wihyClient = new WIHYClient();

/**
 * Simple usage functions
 */
export const wihyAPI = {
  // Simple question
  ask: (query: string) => wihyClient.ask(query, true),
  
  // Analyze content
  analyze: (content: string) => wihyClient.analyzeContent(content),
  
  // Research questions (routed via /ask)
  research: (question: string) => wihyClient.askResearchQuestion(question),
  
  // Get bulk research data for visualizations
  getResearchData: (topic: string, limit?: number) => wihyClient.getResearch(topic, limit),
  
  // Chat with context
  chat: (query: string, userContext?: WIHYRequest['user_context']) => 
    wihyClient.askWithContext(query, true, userContext),
  
  // Clear history
  clear: () => wihyClient.clearConversationHistory(),
  
  // Export conversation
  export: () => wihyClient.exportConversation()
};