// vHealth News API Client Integration
// Swagger UI Documentation: https://services.wihy.ai/api/docs

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

// API Configuration
const API_BASE_URL = {
  production: 'https://services.wihy.ai',
  development: 'http://localhost:5001'
};

class VHealthNewsClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Use production by default
    this.baseUrl = baseUrl || API_BASE_URL.production;
  }

  async getArticles(params: {
    limit?: number;
    category?: string;
    fresh?: boolean;
  } = {}): Promise<ArticlesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.fresh !== undefined) queryParams.append('fresh', params.fresh.toString());

    const fullUrl = `${this.baseUrl}/api/news/articles?${queryParams}`;
    console.log('Making API request to:', fullUrl);

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
    data.articles = articles.map(article => ({
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
    
    return {
      success: data.success !== false,
      articles: data.articles,
      count: data.count || data.articles.length,
      meta: data.meta,
      // Legacy compatibility fields extracted from meta
      sources_used: data.sources_used || [],
      timestamp: data.timestamp || new Date().toISOString()
    };
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
      limit: limit || 100,
      fresh: true
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
      limit: limit || 100,
      fresh: true
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
  return await fetchNewsFeed(undefined, 100);
};

export const searchNewsArticles = async (query: string, limit?: number): Promise<{ success: boolean; articles: NewsArticle[] }> => {
  try {
    // Simple search call - API handles query processing
    const response = await newsClient.getArticles({
      limit: limit || 100,
      fresh: true
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

// Simple function to get all news - API handles filtering and priority
export const getAllNews = async (limit: number = 100): Promise<{ success: boolean; articles: NewsArticle[]; count: number; sources_used: string[] }> => {
  try {
    // Simple API call - server handles all filtering, categorization, and priority sorting
    const response = await newsClient.getArticles({
      limit: limit,
      fresh: true
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