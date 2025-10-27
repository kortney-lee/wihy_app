// vHealth News API Client Integration
// Swagger UI Documentation: https://services.wihy.ai/api/docs

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  link?: string; // Alternative URL field for legacy compatibility
  image_url: string | null;
  source: string;
  author: string | null;
  published_at: string;
  publishedDate?: string; // Alternative date field for legacy compatibility
  pubDate?: string; // Alternative date field for legacy compatibility
  api_source: 'NewsAPI' | 'GNews' | 'NewsData' | 'MediaStack';
  ai_category: string;
  category?: string; // Legacy compatibility
  time_ago: string;
  is_recent: boolean;
  has_image: boolean;
  has_author: boolean;
  reading_time: number;
  quality_score: number;
  tags: string[]; // Legacy compatibility
  summary?: string; // Legacy compatibility
  media_url?: string; // Legacy compatibility
  media_thumb_url?: string; // Legacy compatibility
  relevanceScore?: number; // Legacy compatibility
}

export interface ArticlesResponse {
  success: boolean;
  articles: NewsArticle[];
  count: number;
  sources_used: string[];
  pagination: {
    total_items: number;
    current_page: number;
    per_page: number;
    has_next_page: boolean;
  };
  filters_applied: {
    category: string | null;
    source: string;
    limit: number;
    ai_categorization: boolean;
  };
  timestamp: string;
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
    source?: 'all' | 'newsapi' | 'gnews' | 'newsdata' | 'mediastack';
    useAI?: boolean;
  } = {}): Promise<ArticlesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.source) queryParams.append('source', params.source);
    if (params.useAI !== undefined) queryParams.append('useAI', params.useAI.toString());

    const fullUrl = `${this.baseUrl}/api/news/articles?${queryParams}`;
    console.log('Making API request to:', fullUrl);
    console.log('Request params:', params);

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
    console.log('Raw API response:', data);
    
    // Ensure we have the correct structure and add legacy compatibility fields to articles
    const articles = data.articles || [];
    data.articles = articles.map(article => ({
      ...article,
      // Legacy compatibility fields
      publishedDate: article.published_at,
      pubDate: article.published_at,
      category: article.ai_category,
      summary: article.description,
      tags: [article.ai_category, article.source],
      media_url: article.image_url,
      media_thumb_url: article.image_url,
      relevanceScore: article.quality_score / 10, // Convert 1-10 scale to 0-1 scale
      link: article.url
    }));
    
    console.log('Processed articles:', data.articles.length, 'articles');
    console.log('First processed article:', data.articles[0]);
    
    // Ensure we always return a valid response structure
    return {
      success: data.success !== false,
      articles: data.articles,
      count: data.count || data.articles.length,
      sources_used: data.sources_used || [],
      pagination: data.pagination || {
        total_items: data.articles.length,
        current_page: 1,
        per_page: data.articles.length,
        has_next_page: false
      },
      filters_applied: data.filters_applied || {
        category: params.category || null,
        source: params.source || 'all',
        limit: params.limit || 20,
        ai_categorization: params.useAI !== false
      },
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

// Main functions for legacy compatibility
export const fetchNewsFeed = async (categories?: string[], limit?: number): Promise<{ success: boolean; articles: NewsArticle[] }> => {
  try {
    const category = categories && categories.length > 0 ? categories[0] : undefined;
    const response = await newsClient.getArticles({
      category,
      limit: limit || 20,
      source: 'all',
      useAI: true
    });
    
    return {
      success: response.success,
      articles: response.articles
    };
  } catch (error) {
    console.error('vHealth News API error:', error);
    
    // Fallback to sample data if API fails
    return {
      success: false,
      articles: [{
        id: 'error-1',
        title: 'vHealth News Service Temporarily Unavailable',
        description: 'We are currently experiencing technical difficulties with our news service. Please try again later.',
        content: 'Technical difficulties encountered',
        url: '#',
        image_url: null,
        source: 'vHealth System',
        author: null,
        published_at: new Date().toISOString(),
        publishedDate: new Date().toISOString(),
        api_source: 'NewsAPI',
        ai_category: 'System Notice',
        category: 'system',
        time_ago: 'Just now',
        is_recent: true,
        has_image: false,
        has_author: false,
        reading_time: 1,
        quality_score: 0,
        tags: ['system', 'notice']
      }]
    };
  }
};

export const getArticlesByCategory = async (category: string, limit?: number): Promise<{ success: boolean; articles: NewsArticle[] }> => {
  try {
    console.log('getArticlesByCategory called with:', { category, limit });
    
    const response = await newsClient.getArticles({
      category,
      limit: limit || 20,
      source: 'all',
      useAI: true
    });
    
    console.log('getArticlesByCategory API response:', response);
    console.log('Articles received:', response.articles?.length, 'articles');
    console.log('First article category:', response.articles?.[0]?.ai_category || response.articles?.[0]?.category);
    
    return {
      success: response.success,
      articles: response.articles
    };
  } catch (error) {
    console.error('vHealth News API error (category):', error);
    return await fetchNewsFeed([category], limit);
  }
};

export const refreshNewsFeed = async (): Promise<{ success: boolean; articles: NewsArticle[] }> => {
  // Refresh news feed with latest articles
  return await fetchNewsFeed(undefined, 50);
};

export const searchNewsArticles = async (query: string, limit?: number): Promise<{ success: boolean; articles: NewsArticle[] }> => {
  try {
    // Search by using the query as a category filter for now
    // In future versions, the API might support full-text search
    const response = await newsClient.getArticles({
      category: query,
      limit: limit || 20,
      source: 'all',
      useAI: true
    });
    
    return {
      success: response.success,
      articles: response.articles
    };
  } catch (error) {
    console.error('vHealth News API error (search):', error);
    return await fetchNewsFeed(undefined, limit);
  }
};

// Additional utility functions for enhanced functionality
export const getNewsCategories = async (): Promise<Category[]> => {
  try {
    const response = await newsClient.getCategories();
    return response.success ? response.categories : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return Universal News API v2.0 categories as per documentation
    return [
      { category: 'All News', description: 'All news content from all sources and categories' },
      { category: 'Breaking News', description: 'Latest developments, urgent updates, live news' },
      { category: 'Technology', description: 'Tech innovations, software, hardware, digital trends' },
      { category: 'Business', description: 'Markets, economy, corporate news, financial updates' },
      { category: 'Science', description: 'Research, discoveries, scientific breakthroughs' },
      { category: 'Politics', description: 'Government, elections, policy, political developments' },
      { category: 'World News', description: 'International events, global coverage, foreign affairs' },
      { category: 'Health', description: 'Medical news, wellness, healthcare developments' },
      { category: 'Entertainment', description: 'Movies, music, celebrity news, pop culture' },
      { category: 'Sports', description: 'Games, teams, athletic events, sports news' },
      { category: 'Education', description: 'Schools, universities, academic developments' },
      { category: 'Environment', description: 'Climate, sustainability, environmental issues' },
      { category: 'Nutrition', description: 'Diet, supplements, and nutritional research' },
      { category: 'Medical Research', description: 'Latest medical studies and breakthroughs' },
      { category: 'Public Health', description: 'Community health and disease prevention' },
      { category: 'Clinical Studies', description: 'Clinical trials and medical research' },
      { category: 'Prevention', description: 'Preventive medicine and wellness' },
      { category: 'Mental Health', description: 'Mental wellness and psychological health' },
      { category: 'General Health', description: 'General health news and information' }
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

// Export the client for advanced usage
export { VHealthNewsClient, newsClient };