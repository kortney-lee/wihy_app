// vHealth News API Client Integration
// Swagger UI Documentation: https://services.wihy.ai/api/docs

import { API_CONFIG } from '../config/apiConfig';

export interface NewsArticle {
  // Article Identity
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  
  // Source Information
  source: string;
  api_source?: 'NewsAPI' | 'GNews' | 'NewsData' | 'MediaStack';
  author: string | null;
  published_at: string; // API uses published_at
  
  // AI Categorization
  ai_category: string;
  category_priority?: number;
  priority_position?: number;
  
  // Image Data (Complete)
  image_url: string | null;
  has_image: boolean;
  image_status?: 'original' | 'generated' | 'missing';
  image_source?: 'unsplash' | 'pexels' | 'pixabay' | 'extracted';
  image_attribution?: string;
  photographer?: string;
  
  // Enriched Metadata
  time_ago: string;
  is_recent: boolean;
  reading_time: number; // Minutes
  quality_score: number; // 0-10 scale
  
  // Legacy compatibility fields
  published_date?: string; // Alternative date field
  publishedDate?: string; // Alternative date field
  pubDate?: string; // Alternative date field
  category?: string; // Maps to ai_category
  has_author?: boolean; // Computed from author field
  tags?: string[]; // Legacy compatibility
  summary?: string; // Maps to description
  media_url?: string; // Maps to image_url
  media_thumb_url?: string; // Maps to image_url
  relevanceScore?: number; // Maps to quality_score
  link?: string; // Maps to url
}

export interface ArticlesResponse {
  success: boolean;
  articles: NewsArticle[];
  count: number;
  meta?: {
    // Cache Information
    total_articles?: number;
    returned_articles?: number;
    cache_info?: {
      served_from_cache: boolean;
      cache_size: number;
      last_refresh: string;
      last_top_refresh: string;
      cache_age_minutes: number;
    };
    
    // Sorting Information
    sorting?: {
      sort_by: string;
      sort_order: string;
      sorted_field: string;
    };
    
    // Image Statistics
    image_stats?: {
      total_articles: number;
      articles_with_images: number;
      image_percentage: number;
      original_images: number;
      generated_images: number;
      ai_enhanced_images: number;
      sources: {
        extracted: number;
        unsplash: number;
        pexels: number;
        pixabay: number;
      };
    };
    
    // Pagination
    pagination?: {
      total_items: number;
      current_page: number;
      per_page: number;
      has_next_page: boolean;
    };
    
    // Applied Filters
    filters_applied?: {
      images_only: boolean;
      top_articles_only: boolean;
      limit: number;
      offset: number;
      category?: string | null;
      source?: string;
      ai_categorization?: boolean;
    };
    
    // Priority Sorting System
    priority_sorting?: {
      enabled: boolean;
      description: string;
      sorting_order: string;
      total: number;
      priority_categories: number;
      discovered_categories: number;
      categories: string[];
      category_priorities: Record<string, number>;
      dynamic_learning: string;
    };
    
    // Adaptive Recency System
    recency_stats?: {
      recent_articles: number;
      older_articles: number;
      threshold: string;
      threshold_description: string;
      adaptive_sorting?: string;
    };
    
    // Category Distribution (Current Response)
    category_distribution?: Record<string, number>;
    
    // Category Priorities (Duplicate for convenience)
    category_priorities?: Record<string, number>;
  };
  
  // Legacy compatibility fields
  sources_used?: string[];
  timestamp?: string;
}

export interface Category {
  category: string;
  description: string;
}

// News API Configuration - Uses unified API config with flexible port
const getNewsApiUrl = () => {
  // Check for explicit environment variable first
  if (process.env.REACT_APP_NEWS_API_URL) {
    return process.env.REACT_APP_NEWS_API_URL;
  }
  
  // Development flag - set to true to use local dev server, false for production
  const USE_LOCAL_DEV = process.env.REACT_APP_USE_LOCAL_NEWS === 'true';
  
  // Check if we're on localhost (local development on the development machine)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocalhost && USE_LOCAL_DEV) {
    // Local development with dev flag enabled - use localhost with flexible port
    const defaultPort = process.env.REACT_APP_NEWS_PORT || '5001';
    return `http://localhost:${defaultPort}`;
  } else {
    // Production/deployed OR dev flag disabled - always use production news service
    return 'https://services.wihy.ai';
  }
};

// Local cache configuration
const CACHE_DURATION = 30 * 1000; // 30 seconds in milliseconds
const ARTICLES_PER_PAGE = 8; // Changed from 24 to 8 for smaller pagination
const API_FETCH_LIMIT = 24; // Changed from 100 to 24 for smaller requests

interface CachedData {
  articles: NewsArticle[];
  timestamp: number;
  totalCount: number;
}

class NewsCache {
  private cache: Map<string, CachedData> = new Map();

  private getCacheKey(params: any): string {
    return JSON.stringify(params);
  }

  get(params: any): CachedData | null {
    const key = this.getCacheKey(params);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache is expired (5 minutes)
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }

  set(params: any, data: NewsArticle[], totalCount: number): void {
    const key = this.getCacheKey(params);
    this.cache.set(key, {
      articles: data,
      timestamp: Date.now(),
      totalCount
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

class VHealthNewsClient {
  private baseUrl: string;
  private cache: NewsCache;

  constructor(baseUrl?: string) {
    // Use unified news API URL or override
    this.baseUrl = baseUrl || getNewsApiUrl();
    this.cache = new NewsCache();
    
    // Debug logging
    console.log('🔍 NEWS API DEBUG:', {
      baseUrl: this.baseUrl,
      isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
      hostname: window.location.hostname,
      useLocalDev: process.env.REACT_APP_USE_LOCAL_NEWS === 'true',
      detectedEnvironment: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && process.env.REACT_APP_USE_LOCAL_NEWS === 'true' ? 'LOCAL_DEV' : 'PRODUCTION',
      newsPort: process.env.REACT_APP_NEWS_PORT || '5001',
      envOverride: process.env.REACT_APP_NEWS_API_URL || 'none'
    });
  }

  async getArticles(params: {
    limit?: number;
    category?: string;
    fresh?: boolean;
    useCache?: boolean;
  } = {}): Promise<ArticlesResponse> {
    const cacheParams = {
      category: params.category,
      fresh: params.fresh
    };

    // Check cache first (unless fresh is explicitly requested or cache is disabled)
    if (params.useCache !== false && !params.fresh) {
      const cached = this.cache.get(cacheParams);
      if (cached) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📱 Serving from cache:', {
            totalArticles: cached.articles.length,
            cacheAge: Math.round((Date.now() - cached.timestamp) / 1000) + 's'
          });
        }
        
        return {
          success: true,
          articles: cached.articles,
          count: cached.totalCount,
          meta: {
            cache_info: {
              served_from_cache: true,
              cache_size: cached.articles.length,
              last_refresh: new Date(cached.timestamp).toISOString(),
              last_top_refresh: new Date(cached.timestamp).toISOString(),
              cache_age_minutes: Math.round((Date.now() - cached.timestamp) / 60000)
            }
          }
        };
      }
    }

    // Fetch from API with smaller limit for efficiency
    const queryParams = new URLSearchParams();
    const fetchLimit = API_FETCH_LIMIT; // Always fetch 24 for better performance
    queryParams.append('limit', fetchLimit.toString());
    
    if (params.category) queryParams.append('category', params.category);
    if (params.fresh !== undefined) queryParams.append('fresh', params.fresh.toString());

    const fullUrl = `${this.baseUrl}/api/news/articles?${queryParams}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 Making API request to:', fullUrl);
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`vHealth News API error! status: ${response.status}`);
    }
    
    const data: ArticlesResponse = await response.json();
    
    // Debug: Log API response summary (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('� News API Response Summary:', {
        success: data.success,
        totalArticles: data.articles?.length || 0,
        articlesWithImages: data.articles?.filter(a => a.has_image && a.image_url).length || 0,
        articlesWithoutImages: data.articles?.filter(a => !a.has_image || !a.image_url).length || 0
      });
      
      // Log a sample of image statuses
      if (data.articles && data.articles.length > 0) {
        const imageStatuses = data.articles.slice(0, 3).map(article => ({
          title: article.title?.substring(0, 40) + '...',
          has_image: article.has_image,
          image_url: article.image_url ? 'present' : 'null',
          image_status: article.image_status
        }));
        console.log('📸 Sample image statuses:', imageStatuses);
      }
    }
    
    // Add legacy compatibility fields to articles
    const articles = data.articles || [];
    const processedArticles = articles.map(article => ({
      ...article,
      // Ensure core fields are properly mapped
      has_author: !!article.author,
      // Legacy compatibility fields
      published_date: article.published_at,
      publishedDate: article.published_at,
      pubDate: article.published_at,
      category: article.ai_category,
      summary: article.description,
      tags: article.ai_category ? [article.ai_category, article.source] : [article.source],
      media_url: article.image_url, // Map image_url to media_url for legacy compatibility
      media_thumb_url: article.image_url, // Map image_url to media_thumb_url for legacy compatibility
      relevanceScore: article.quality_score ? article.quality_score / 10 : 0.5,
      link: article.url
    }));

    // Cache the results for future use
    if (params.useCache !== false) {
      this.cache.set(cacheParams, processedArticles, data.count || processedArticles.length);
    }
    
    return {
      success: data.success !== false,
      articles: processedArticles,
      count: data.count || processedArticles.length,
      meta: {
        ...data.meta,
        cache_info: {
          served_from_cache: false,
          cache_size: processedArticles.length,
          last_refresh: new Date().toISOString(),
          last_top_refresh: new Date().toISOString(),
          cache_age_minutes: 0
        }
      },
      // Legacy compatibility fields extracted from meta
      sources_used: data.sources_used || [],
      timestamp: data.timestamp || new Date().toISOString()
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  async getCategories(): Promise<{ success: boolean; categories: Category[] }> {
    const response = await fetch(`${this.baseUrl}/api/news/categories`);
    
    if (!response.ok) {
      throw new Error(`vHealth News API error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async getStats(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/news/stats`);
    
    if (!response.ok) {
      throw new Error(`vHealth News API error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    
    if (!response.ok) {
      throw new Error(`vHealth News API error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async testSource(source: 'newsapi' | 'gnews' | 'newsdata' | 'mediastack', limit: number = 5): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/news/test/${source}?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`vHealth News API error! status: ${response.status}`);
    }
    
    return response.json();
  }
}

// Initialize the client
const newsClient = new VHealthNewsClient();

// Simple function to fetch news feed - API handles all filtering
export const fetchNewsFeed = async (categories?: string[], limit?: number): Promise<{ success: boolean; articles: NewsArticle[] }> => {
  try {
    // Simple API call - no client-side filtering needed
    const response = await newsClient.getArticles({
      limit: limit || 8, // Changed from 24 to 8
      fresh: true, // Always get fresh articles
      useCache: false // Disable cache to ensure fresh content
    });
    
    return {
      success: response.success,
      articles: response.articles
    };
  } catch (error) {
    console.error('vHealth News API error:', error);
    return {
      success: false,
      articles: []
    };
  }
};

export const getArticlesByCategory = async (category: string, limit?: number): Promise<{ success: boolean; articles: NewsArticle[] }> => {
  try {
    // Simple API call with category - API handles filtering
    const response = await newsClient.getArticles({
      category,
      limit: limit || 8, // Changed from 24 to 8
      fresh: true, // Always get fresh articles
      useCache: false // Disable cache to ensure fresh content
    });
    
    return {
      success: response.success,
      articles: response.articles
    };
  } catch (error) {
    console.error('vHealth News API error (category):', error);
    return {
      success: false,
      articles: []
    };
  }
};

export const refreshNewsFeed = async (): Promise<{ success: boolean; articles: NewsArticle[] }> => {
  // Simple refresh - API handles everything
  return await fetchNewsFeed(undefined, 8); // Changed from 24 to 8
};

export const searchNewsArticles = async (query: string, limit?: number): Promise<{ success: boolean; articles: NewsArticle[] }> => {
  try {
    // Simple search call - API handles query processing
    const response = await newsClient.getArticles({
      limit: limit || 8, // Changed from 24 to 8
      fresh: true, // Always get fresh articles
      useCache: false // Disable cache to ensure fresh content
    });
    
    return {
      success: response.success,
      articles: response.articles
    };
  } catch (error) {
    console.error('vHealth News API error (search):', error);
    return {
      success: false,
      articles: []
    };
  }
};

// Simple function to get all news with pagination - API handles filtering and priority
export const getAllNews = async (limit: number = 8): Promise<{ success: boolean; articles: NewsArticle[]; count: number; sources_used: string[] }> => {
  try {
    // Simple API call - server handles all filtering, categorization, and priority sorting
    const response = await newsClient.getArticles({
      limit: limit,
      fresh: false, // Use cache when available
      useCache: true // Enable cache for better performance
    });
    
    return {
      success: response.success,
      articles: response.articles,
      count: response.count,
      sources_used: response.sources_used || []
    };
  } catch (error) {
    console.error('Error fetching all news:', error);
    return {
      success: false,
      articles: [],
      count: 0,
      sources_used: []
    };
  }
};

// New paginated function that returns specific page from cached results
export const getPaginatedNews = async (page: number = 1, category?: string): Promise<{
  success: boolean;
  articles: NewsArticle[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}> => {
  try {
    // Fetch smaller dataset (24 articles for caching) and paginate to 8 per page
    const response = await newsClient.getArticles({
      limit: API_FETCH_LIMIT,
      category: category,
      fresh: true, // Always get fresh articles
      useCache: false // Disable cache to ensure fresh content
    });

    if (!response.success || !response.articles) {
      return {
        success: false,
        articles: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      };
    }

    // Calculate pagination
    const totalCount = response.articles.length;
    const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);
    const startIndex = (page - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;
    const paginatedArticles = response.articles.slice(startIndex, endIndex);

    return {
      success: true,
      articles: paginatedArticles,
      totalCount: totalCount,
      currentPage: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  } catch (error) {
    console.error('Error fetching paginated news:', error);
    return {
      success: false,
      articles: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    };
  }
};

// New lazy loading function that returns all articles up to the current page
export const getLazyLoadedNews = async (page: number = 1, category?: string): Promise<{
  success: boolean;
  articles: NewsArticle[];
  newArticles: NewsArticle[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  loadedCount: number;
}> => {
  try {
    // Fetch smaller dataset (24 articles for caching) and paginate to 8 per page
    const response = await newsClient.getArticles({
      limit: API_FETCH_LIMIT,
      category: category,
      fresh: false, // Use cache when available  
      useCache: true // Enable cache for better performance
    });

    if (!response.success || !response.articles) {
      return {
        success: false,
        articles: [],
        newArticles: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasNextPage: false,
        loadedCount: 0
      };
    }

    // Calculate lazy loading: return all articles from page 1 to current page
    const totalCount = response.articles.length;
    const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);
    const loadedCount = Math.min(page * ARTICLES_PER_PAGE, totalCount);
    const allArticles = response.articles.slice(0, loadedCount);
    
    // Get just the new articles for this page (for appending)
    const startIndex = (page - 1) * ARTICLES_PER_PAGE;
    const endIndex = Math.min(startIndex + ARTICLES_PER_PAGE, totalCount);
    const newArticles = response.articles.slice(startIndex, endIndex);

    return {
      success: true,
      articles: allArticles, // All articles from page 1 to current page
      newArticles: newArticles, // Just the new articles for this page
      totalCount: totalCount,
      currentPage: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      loadedCount: loadedCount
    };
  } catch (error) {
    console.error('Error fetching lazy loaded news:', error);
    return {
      success: false,
      articles: [],
      newArticles: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
      hasNextPage: false,
      loadedCount: 0
    };
  }
};

// Clear cache function
export const clearNewsCache = (): void => {
  newsClient.clearCache();
};

export const getNewsCategories = async (): Promise<Category[]> => {
  try {
    const response = await newsClient.getCategories();
    return response.success ? response.categories : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return default categories if API fails
    return [
      { category: 'Medical Research', description: 'Latest medical studies and breakthroughs' },
      { category: 'Clinical Studies', description: 'Clinical trials and medical research' },
      { category: 'Public Health', description: 'Community health and disease prevention' },
      { category: 'Prevention', description: 'Preventive medicine and wellness' },
      { category: 'Nutrition', description: 'Diet, supplements, and nutritional research' },
      { category: 'Mental Health', description: 'Mental wellness and psychological health' },
      { category: 'Health Technology', description: 'Health tech and medical AI innovations' },
      { category: 'Medical Technology', description: 'Medical devices and healthcare technology' },
      { category: 'General Health', description: 'General health news and information' },
      { category: 'Environment', description: 'Environmental health and sustainability' },
      { category: 'Technology', description: 'Tech innovations and digital trends' },
      { category: 'General News', description: 'General news and current events' }
    ];
  }
};

export const getNewsStats = async (): Promise<any> => {
  try {
    return await newsClient.getStats();
  } catch (error) {
    console.error('Error fetching news stats:', error);
    return { error: 'Stats unavailable' };
  }
};

export const checkNewsServiceHealth = async (): Promise<boolean> => {
  try {
    const health = await newsClient.healthCheck();
    return health.status === 'healthy';
  } catch (error) {
    console.error('News service health check failed:', error);
    return false;
  }
};

// Helper functions to extract information from the new meta structure
export const getImageStats = (response: ArticlesResponse) => {
  return response.meta?.image_stats || null;
};

export const getCacheInfo = (response: ArticlesResponse) => {
  return response.meta?.cache_info || null;
};

export const getPriorityInfo = (response: ArticlesResponse) => {
  return response.meta?.priority_sorting || null;
};

export const getRecencyStats = (response: ArticlesResponse) => {
  return response.meta?.recency_stats || null;
};

export const getCategoryDistribution = (response: ArticlesResponse) => {
  return response.meta?.category_distribution || {};
};

export const getCategoryPriorities = (response: ArticlesResponse) => {
  return response.meta?.category_priorities || response.meta?.priority_sorting?.category_priorities || {};
};

// Export the client for advanced usage
export { VHealthNewsClient, newsClient };

// Export pagination constants
export { ARTICLES_PER_PAGE, API_FETCH_LIMIT, CACHE_DURATION };