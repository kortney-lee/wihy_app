import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import { chatService } from './chatService';
import type { IngredientAnalysis } from './types';

/**
 * FDA Service - Ingredient Analysis
 * 
 * Two-tier fallback system:
 * 1. Try backend FDA endpoint (services.wihy.ai/api/openfda/ingredient/{ingredient})
 * 2. Fallback to WiHY AI (/api/ask)
 * 3. Silent failure with "No data available"
 * 
 * See: mobile/FDA_FACT_CHECK.md for full architecture documentation
 */
class FDAService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  /**
   * Analyze an ingredient using FDA database
   * Falls back to WiHY AI if FDA data is unavailable
   * 
   * Flow:
   * 1. GET /api/openfda/ingredient/{ingredient} -> If 200, return structured FDA data
   * 2. If 404/500/timeout -> POST /api/ask with natural language query
   * 3. If both fail -> Return "No data available" (silent failure)
   */
  async analyzeIngredient(ingredient: string): Promise<IngredientAnalysis> {
    const startTime = Date.now();
    const trimmedIngredient = ingredient.trim();
    const endpoint = `${this.baseUrl}${API_CONFIG.endpoints.fdaIngredient}/${encodeURIComponent(trimmedIngredient)}`;
    
    console.log('=== FDA INGREDIENT ANALYSIS ===');
    console.log('Endpoint:', endpoint);
    console.log('Ingredient:', trimmedIngredient);
    
    try {
      // STEP 1: Attempt FDA database lookup via backend
      const response = await fetchWithLogging(endpoint);
      
      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      // STEP 2: Check HTTP status
      if (!response.ok) {
        // FDA returned error (404 Not Found, 500 Server Error, etc.)
        // -> Trigger WiHY AI fallback
        console.log(`FDA lookup failed for "${trimmedIngredient}", falling back to WiHY AI...`);
        return await this.fallbackToWihyLookup(trimmedIngredient);
      }

      // STEP 3: Parse successful FDA response
      const data = await response.json();
      console.log('FDA Response Data:', JSON.stringify(data, null, 2));
      console.log('=== FDA ANALYSIS SUCCESS ===');
      
      // STEP 4: Return structured FDA data
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
      // STEP 5: Network error (timeout, connection refused, etc.)
      // -> Trigger WiHY AI fallback
      const responseTime = Date.now() - startTime;
      console.error('=== FDA ANALYSIS ERROR ===');
      console.error(`Network error after ${responseTime}ms:`, error.message);
      console.log('Falling back to WiHY AI...');
      return await this.fallbackToWihyLookup(trimmedIngredient);
    }
  }

  /**
   * Fallback to WiHY AI when FDA database lookup fails
   * Called when:
   * - FDA returns 404 (ingredient not found)
   * - FDA returns 500 (server error)
   * - Network timeout or connection refused
   */
  private async fallbackToWihyLookup(ingredient: string): Promise<IngredientAnalysis> {
    const startTime = Date.now();
    
    console.log('=== WIHY AI INGREDIENT LOOKUP (FALLBACK) ===');
    console.log('Ingredient:', ingredient);
    
    try {
      // STEP 1: Call WiHY /ask endpoint with natural language query
      const chatResponse = await chatService.ask(
        `Tell me about the ingredient: ${ingredient}. Is it safe? What should I know about it?`,
        { ingredient_lookup: true }  // Context flag helps WiHY optimize response
      );
      
      const responseTime = Date.now() - startTime;
      console.log(`WiHY AI response received (${responseTime}ms)`);
      console.log('=== WIHY AI LOOKUP SUCCESS ===');

      // STEP 2: Transform WiHY response into IngredientAnalysis format
      return {
        ingredient,
        success: true,
        safety_score: 0,              // WiHY doesn't provide numeric scores
        risk_level: 'low',            // Default to low risk
        recall_count: 0,              // No recall data from WiHY
        adverse_event_count: 0,       // No adverse event data from WiHY
        recommendations: [],          // No structured recommendations
        fda_status: 'Wihy Analysis',  // Indicator that this came from WiHY, not FDA
        analysis_summary: chatResponse.response || 'Analysis complete',
      };
    } catch (error: any) {
      // STEP 3: Final fallback - return empty result (silent failure)
      const responseTime = Date.now() - startTime;
      console.error('=== WIHY AI LOOKUP ERROR ===');
      console.error(`Error after ${responseTime}ms:`, error.message);
      
      // Silent failure - don't show error to user
      return {
        ingredient,
        success: false,
        safety_score: 0,
        risk_level: 'unknown',
        recall_count: 0,
        adverse_event_count: 0,
        recommendations: [],
        fda_status: 'No data available',
        analysis_summary: 'Unable to analyze this ingredient at this time.',
      };
    }
  }
}

export const fdaService = new FDAService();
