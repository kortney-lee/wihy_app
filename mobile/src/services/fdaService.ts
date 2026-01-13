import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import { chatService } from './chatService';
import type { IngredientAnalysis } from './types';

class FDAService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  /**
   * Analyze an ingredient using FDA database
   * Falls back to Wihy AI if FDA data is unavailable
   */
  async analyzeIngredient(ingredient: string): Promise<IngredientAnalysis> {
    const startTime = Date.now();
    const trimmedIngredient = ingredient.trim();
    const endpoint = `${this.baseUrl}${API_CONFIG.endpoints.fdaIngredient}/${encodeURIComponent(trimmedIngredient)}`;
    
    console.log('=== FDA INGREDIENT ANALYSIS API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('Ingredient:', trimmedIngredient);
    
    try {
      // Try FDA database first
      const response = await fetchWithLogging(endpoint);
      
      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      if (!response.ok) {
        console.log('FDA database returned error, falling back to Wihy AI...');
        // Fallback to Wihy AI
        return await this.fallbackToWihyLookup(trimmedIngredient);
      }

      const data = await response.json();
      console.log('FDA Response Data:', JSON.stringify(data, null, 2));
      console.log('=== FDA ANALYSIS SUCCESS ===');
      
      return {
        ingredient: trimmedIngredient,
        success: data.success || true,
        safety_score: data.safety_score || 0,
        risk_level: data.risk_level || 'low',
        recall_count: data.recall_count || 0,
        adverse_event_count: data.adverse_event_count || 0,
        recommendations: data.recommendations || [],
        fda_status: data.fda_status || 'No data available',
        analysis_summary: data.analysis_summary || 'No analysis available',
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== FDA ANALYSIS ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      console.error('Falling back to Wihy AI...');
      // Network errors also get wihy fallback
      return await this.fallbackToWihyLookup(ingredient.trim());
    }
  }

  /**
   * Fallback to Wihy AI when FDA database has no data
   */
  private async fallbackToWihyLookup(ingredient: string): Promise<IngredientAnalysis> {
    const startTime = Date.now();
    
    console.log('=== WIHY AI INGREDIENT LOOKUP (FALLBACK) ===');
    console.log('Ingredient:', ingredient);
    
    try {
      const chatResponse = await chatService.ask(
        `Tell me about the ingredient: ${ingredient}. Is it safe? What should I know about it?`,
        { ingredient_lookup: true }
      );
      
      const responseTime = Date.now() - startTime;
      console.log(`Wihy AI response received (${responseTime}ms)`);
      console.log('Wihy AI Response:', chatResponse.response);
      console.log('=== WIHY AI LOOKUP SUCCESS ===');

      return {
        ingredient,
        success: true,
        safety_score: 0,
        risk_level: 'low',
        recall_count: 0,
        adverse_event_count: 0,
        recommendations: [],
        fda_status: 'Wihy Analysis',
        analysis_summary: chatResponse.response,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== WIHY AI LOOKUP ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      return {
        ingredient,
        success: false,
        safety_score: 0,
        risk_level: 'unknown',
        recall_count: 0,
        adverse_event_count: 0,
        recommendations: [],
        fda_status: 'Error',
        analysis_summary: 'Unable to analyze this ingredient at this time.',
      };
    }
  }
}

export const fdaService = new FDAService();
