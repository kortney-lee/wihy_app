// React Hook for Universal Search - Easy integration with components
// Provides state management, caching, and convenient methods for all search types

import { useState, useCallback, useRef } from 'react';
import { universalSearchService, UniversalSearchRequest, UniversalSearchResponse } from '../services/universalSearchService';

interface UseUniversalSearchOptions {
  enableCaching?: boolean;
  defaultOptions?: UniversalSearchRequest['options'];
  defaultContext?: UniversalSearchRequest['context'];
}

interface SearchState {
  results: UniversalSearchResponse | null;
  loading: boolean;
  error: string | null;
  lastQuery: string | null;
  searchHistory: Array<{ query: string; timestamp: string; type: string }>;
}

export const useUniversalSearch = (options: UseUniversalSearchOptions = {}) => {
  const {
    enableCaching = true,
    defaultOptions = {
      include_ai_enhancement: true,
      include_charts: true,
      include_recommendations: true,
      limit: 10
    },
    defaultContext = {}
  } = options;

  // ================================
  // STATE MANAGEMENT
  // ================================
  const [state, setState] = useState<SearchState>({
    results: null,
    loading: false,
    error: null,
    lastQuery: null,
    searchHistory: []
  });

  const cacheRef = useRef<Map<string, UniversalSearchResponse>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // ================================
  // HELPER FUNCTIONS
  // ================================
  
  /**
   * Generate cache key for a search request
   */
  const getCacheKey = (request: UniversalSearchRequest): string => {
    return JSON.stringify({
      query: request.query.toLowerCase().trim(),
      type: request.type || 'auto',
      context: request.context,
      options: request.options
    });
  };

  /**
   * Add search to history
   */
  const addToHistory = useCallback((query: string, type: string) => {
    setState(prev => ({
      ...prev,
      searchHistory: [
        { query, type, timestamp: new Date().toISOString() },
        ...prev.searchHistory.slice(0, 19) // Keep last 20 searches
      ]
    }));
  }, []);

  /**
   * Update state during search operations
   */
  const updateState = useCallback((updates: Partial<SearchState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // ================================
  // CORE SEARCH FUNCTION
  // ================================

  /**
   * Universal search with full control over parameters
   */
  const search = useCallback(async (request: UniversalSearchRequest): Promise<UniversalSearchResponse> => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Merge with default options and context
    const fullRequest: UniversalSearchRequest = {
      ...request,
      options: { ...defaultOptions, ...request.options },
      context: {
        ...defaultContext,
        ...request.context
      }
    };

    const cacheKey = getCacheKey(fullRequest);

    updateState({
      loading: true,
      error: null,
      lastQuery: request.query
    });

    try {
      // Check cache first if enabled
      if (enableCaching && cacheRef.current.has(cacheKey)) {
        console.log('[SEARCH] Using cached universal search results for:', request.query);
        const cachedResult = cacheRef.current.get(cacheKey)!;
        
        updateState({
          results: cachedResult,
          loading: false
        });

        addToHistory(request.query, cachedResult.detected_type);
        return cachedResult;
      }

      // Test API connectivity first
      const connectionTest = await universalSearchService.testConnection();
      if (!connectionTest.available) {
        throw new Error(`Universal Search API unavailable: ${connectionTest.error}`);
      }

      console.log('[SEARCH] Making universal search request:', fullRequest);
      
      // Make the search request
      const result = await universalSearchService.search(fullRequest);
      
      if (!result.success) {
        throw new Error(result.error || 'Search failed');
      }

      // Cache successful results
      if (enableCaching) {
        cacheRef.current.set(cacheKey, result);
        
        // Limit cache size to prevent memory issues
        if (cacheRef.current.size > 100) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }
      }

      updateState({
        results: result,
        loading: false
      });

      addToHistory(request.query, result.detected_type);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      console.error('[X] Universal search error:', error);
      
      updateState({
        error: errorMessage,
        loading: false,
        results: null
      });

      throw error;
    }
  }, [enableCaching, defaultOptions, defaultContext, addToHistory, updateState]);

  // ================================
  // CONVENIENCE SEARCH METHODS
  // ================================

  /**
   * Quick search with automatic type detection
   */
  const quickSearch = useCallback(async (query: string): Promise<UniversalSearchResponse> => {
    return search({
      query,
      type: 'auto'
    });
  }, [search]);

  /**
   * Health-focused search
   */
  const searchHealth = useCallback(async (
    query: string, 
    healthGoals?: string[],
    background?: string
  ): Promise<UniversalSearchResponse> => {
    return search({
      query,
      type: 'health',
      context: {
        health_goals: healthGoals || ['general_health'],
        background: background || 'general_public'
      }
    });
  }, [search]);  /**
   * Research-focused search with enhanced AI analysis
   */
  const searchResearch = useCallback(async (
    query: string, 
    userBackground?: string
  ): Promise<UniversalSearchResponse> => {
    return search({
      query,
      type: 'research',
      context: {
        background: userBackground || 'general_public',
        health_goals: ['research_information'],
        interests: ['clinical_trials', 'evidence_based_medicine']
      },
      options: {
        ...defaultOptions,
        limit: 15 // More results for research
      }
    });
  }, [search, defaultOptions]);

  /**
   * Food and nutrition search
   */
  const searchFood = useCallback(async (
    query: string,
    dietaryRestrictions?: string[],
    healthGoals?: string[]
  ): Promise<UniversalSearchResponse> => {
    return search({
      query,
      type: 'food',
      context: {
        dietary_restrictions: dietaryRestrictions || [],
        health_goals: healthGoals || ['nutrition_analysis']
      }
    });
  }, [search]);

  /**
   * News search for latest developments
   */
  const searchNews = useCallback(async (query: string): Promise<UniversalSearchResponse> => {
    return search({
      query,
      type: 'news',
      options: {
        ...defaultOptions,
        include_charts: false,
        limit: 8
      }
    });
  }, [search, defaultOptions]);

  /**
   * Meal education for understanding food ingredients
   */
  const searchMealEducation = useCallback(async (query: string): Promise<UniversalSearchResponse> => {
    return search({
      query,
      type: 'meal_education'
    });
  }, [search]);

  // ================================
  // UTILITY FUNCTIONS
  // ================================

  /**
   * Clear all cached results
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    console.log('[TRASH] Universal search cache cleared');
  }, []);

  /**
   * Clear current results and error state
   */
  const clearResults = useCallback(() => {
    updateState({
      results: null,
      error: null,
      lastQuery: null
    });
  }, [updateState]);

  /**
   * Clear search history
   */
  const clearHistory = useCallback(() => {
    updateState({ searchHistory: [] });
  }, [updateState]);

  /**
   * Cancel current search request
   */
  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      updateState({ loading: false });
    }
  }, [updateState]);

  /**
   * Get formatted results for chat display
   */
  const getFormattedForChat = useCallback(() => {
    if (!state.results) return null;
    return universalSearchService.formatForChat(state.results);
  }, [state.results]);

  /**
   * Get formatted results for text display
   */
  const getFormattedForDisplay = useCallback(() => {
    if (!state.results) return null;
    return universalSearchService.formatForDisplay(state.results);
  }, [state.results]);

  /**
   * Check if a query is currently cached
   */
  const isCached = useCallback((query: string, type?: string): boolean => {
    const request: UniversalSearchRequest = { 
      query, 
      type: type as any || 'auto',
      options: defaultOptions,
      context: defaultContext
    };
    const cacheKey = getCacheKey(request);
    return cacheRef.current.has(cacheKey);
  }, [defaultOptions, defaultContext]);

  // ================================
  // RETURN HOOK INTERFACE
  // ================================

  return {
    // State
    ...state,
    
    // Core search functions
    search,
    quickSearch,
    
    // Specialized search functions
    searchHealth,
    searchResearch,
    searchFood,
    searchNews,
    searchMealEducation,
    
    // Formatted results
    getFormattedForChat,
    getFormattedForDisplay,
    
    // Utility functions
    clearCache,
    clearResults,
    clearHistory,
    cancelSearch,
    isCached,
    
    // Cache info
    cacheSize: cacheRef.current.size,
    
    // Helper properties
    isSearching: state.loading,
    hasResults: state.results !== null,
    hasError: state.error !== null,
    canRetry: state.error !== null && state.lastQuery !== null
  };
};

export default useUniversalSearch;