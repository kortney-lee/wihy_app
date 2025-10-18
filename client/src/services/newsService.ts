import axios from 'axios';

// Define trusted domains directly here instead of importing from self
export const TRUSTED_DOMAINS: Record<string, number> = {
  'nih.gov': 1,
  'ncbi.nlm.nih.gov': 1,  // PubMed
  'who.int': 1,
  'cdc.gov': 1,
  'fda.gov': 1,
  'usda.gov': 1,
  'jamanetwork.com': 1,
  'nejm.org': 1,
  'thelancet.com': 1,
  'bmj.com': 1,
  'nature.com': 1,
  'mayoclinic.org': 1,
  'health.harvard.edu': 1
};

// Update API URL configuration
import { getApiEndpoint } from '../config/apiConfig';

export interface NewsArticle {
  // Core API response fields (expected CNN Health API structure)
  id: number;                        // Unique article identifier (number format like 12359)
  title: string;                     // Article title
  description: string;               // Article description/summary
  link: string;                      // Article URL
  pubDate: string;                   // Publication date (ISO format)
  category: string;                  // Original category from feed
  mapped_category: string;           // Health-specific category mapping
  feed_title: string;                // Source publication name (e.g., "CNN Health")
  feed_id: number;                   // RSS feed ID
  media_url: string;                 // Main image URL (actual images from CNN/sources)
  media_thumb_url: string;           // Thumbnail image URL
  has_media: boolean;                // Whether article has images
  word_count: number;                // Article word count
  time_ago: string;                  // Human-readable time since publication
  is_recent: boolean;                // Published within last 24 hours
  keywords: string[];                // Article keywords/tags
  
  // Optional fields that may not always be present
  author?: string;                   // Article author (can be empty)
  has_author?: boolean;              // Whether article has author info
  feed_priority?: string;            // Feed priority level
  reading_time?: number;             // Estimated reading time in minutes
  content_quality?: 'high' | 'medium' | 'low';  // Content quality assessment
  completeness?: 'complete' | 'partial' | 'minimal';  // Data completeness
  domain?: string;                   // Source domain
  extracted_at?: string;             // When article was extracted
  
  // Legacy/compatibility fields for existing client code
  url?: string;                      // Alias for link
  summary?: string;                  // Alias for description
  publishedDate?: string;            // Alias for pubDate
  thumbnailUrl?: string;             // Alias for media_thumb_url
  imageUrl?: string;                 // Alias for media_url
  hasMedia?: boolean;                // Alias for has_media
  source?: string;                   // Alias for feed_title
  tags?: string[];                   // Alias for keywords
  wordCount?: number;                // Alias for word_count
  readingTime?: number;              // Calculated reading time
  relevanceScore?: number;           // Client-side scoring
  mediaType?: string;                // Media type classification
  contentLength?: number;            // Content length
}

export interface NewsFeedResponse {
  success: boolean;
  articles: NewsArticle[];
  count: number;
  total?: number;                    // Total available articles
  message?: string;                  // API message
  pagination?: {
    total_items: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  filters_applied?: {
    category: string | null;
    country: string | null;
    feed_id: number | null;
    limit: number;
    quality?: string;                // Added from OpenAPI spec
  };
  // Quality mode field (when quality=1)
  flagged_for_review?: Array<{
    id: number;
    title: string;
    reason: string;
    category: string;
  }>;
  error?: string; // Added to handle errors from the API
}

export interface NewsQueryParams {
  limit?: number;                    // Number of articles to return (1-500)
  quality?: string;                  // '1'/'true' for quality articles, '0'/'false' for all
  category?: string;                 // Health categories: 'All Health News', 'Nutrition', etc.
  country?: string;                  // Country code: US, IN, UK, CA, AU, DE, FR, JP
  feed_id?: number;                  // Filter by specific feed ID
  feed_priority?: string;            // Feed priority: single, range, or comma-separated
  flat?: string | boolean;           // Return flat structure ('true'/'false')
  page?: number;                     // Page number (starts at 1)
  per_page?: number;                 // Number of articles per page (1-100)
  your_new_param?: string;           // Additional parameter from API spec
  timestamp?: number;                // Added to support refreshNewsFeed
  query?: string;                    // Added to support searchNewsArticles
}

class NewsService {
  // Get the correct endpoint based on environment
  private getNewsEndpoint(): string {
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      // Based on working endpoint: /api/news
      const localEndpoint = 'http://localhost:5001/api/news';
      console.log('🔧 Development mode: Using local endpoint:', localEndpoint);
      return localEndpoint;
    } else {
      // In production: use production endpoint
      const prodEndpoint = 'https://services.wihy.ai/api/news';
      console.log('🚀 Production mode: Using production endpoint:', prodEndpoint);
      return prodEndpoint;
    }
  }
  
  /**
   * Fetch news articles based on provided parameters
   */
  async getArticles(params: NewsQueryParams = {}): Promise<NewsFeedResponse> {
    try {
      // Get the endpoint
      const endpoint = this.getNewsEndpoint();
      
      // Set minimal parameters - backend may not support all OpenAPI parameters
      const queryParams: any = {
        ...params // Start with provided params
      };

      // Only add limit if specified or use a reasonable default
      if (!queryParams.limit) {
        queryParams.limit = 50;
      }

      // Try to prioritize sources that might have images
      // Don't restrict to clinical trials only - get diverse news sources
      if (!queryParams.feed_id) {
        // Remove any feed_id restriction to get articles from all sources
        delete queryParams.feed_id;
      }

      // Remove any undefined parameters that might cause issues
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === null || queryParams[key] === '') {
          delete queryParams[key];
        }
      });

      console.log('Fetching news with params:', queryParams);
      
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           window.location.hostname === 'localhost';
      
      console.log(`🌍 Environment: ${isDevelopment ? 'Development' : 'Production'}`);
      console.log(`📡 Using endpoint: ${endpoint}`);
      
      try {
        // Set timeout based on endpoint type (local vs remote)
        const isLocal = endpoint.includes('localhost');
        const timeout = isLocal ? 30000 : 15000; // Much longer timeout for local development
        
        console.log(`🚀 Making request to: ${endpoint}`);
        console.log(`📋 Request params:`, queryParams);
        console.log(`🔍 Current window location:`, window.location.href);
        console.log(`🔍 Process NODE_ENV:`, process.env.NODE_ENV);
        console.log(`🔍 Final axios URL will be:`, endpoint);
        
        // For local development, try a simple connectivity test first
        if (isLocal) {
          try {
            console.log('🔍 Testing basic connectivity to service...');
            const healthCheck = await axios.get('http://localhost:5001/', { timeout: 5000 });
            console.log('✅ Service is reachable');
          } catch (connectError: any) {
            console.log('⚠️ Service connectivity check failed:', connectError.message);
            if (connectError.code === 'ECONNREFUSED') {
              throw new Error('Local news service is not running on port 5001. Please start the service first.');
            }
          }
        }
        
        const response = await axios.get(endpoint, { 
          params: queryParams,
          timeout: timeout,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ Response status: ${response.status}`);
        console.log(`📦 Response data type:`, typeof response.data);
        console.log(`🔍 Response structure:`, {
          keys: Object.keys(response.data || {}),
          isArray: Array.isArray(response.data),
          articlesCount: (response.data as any)?.articles?.length || 0,
          totalCount: (response.data as any)?.count || 0,
          totalAvailable: (response.data as any)?.total || 0,
          success: (response.data as any)?.success
        });

        // Log detailed information about sources and images
        const articles = (response.data as any)?.articles || [];
        if (articles.length > 0) {
          console.log(`📰 Article sources and images:`)
          articles.slice(0, 5).forEach((article: any, idx: number) => {
            console.log(`${idx + 1}. Source: ${article.source} (Feed ID: ${article.feed_id})`);
            console.log(`   Domain: ${article.domain}`);
            console.log(`   Has Image: ${article.has_image}`);
            console.log(`   Media URL: ${article.media_url || 'none'}`);
            console.log(`   Thumbnail URL: ${article.media_thumb_url || 'none'}`);
            console.log(`   Thumbnail: ${article.thumbnail || 'none'}`);
            console.log(`   Title: ${article.title?.substring(0, 60)}...`);
            console.log(`---`);
          });

          // Show unique sources and their image stats
          const sourceStats = articles.reduce((acc: any, article: any) => {
            const source = article.source || 'Unknown';
            if (!acc[source]) {
              acc[source] = { count: 0, withImages: 0, feedId: article.feed_id };
            }
            acc[source].count++;
            if (article.has_media || article.media_url || article.media_thumb_url) {
              acc[source].withImages++;
            }
            return acc;
          }, {});

          console.log('📊 Source statistics:');
          Object.entries(sourceStats).forEach(([source, stats]: [string, any]) => {
            console.log(`${source}: ${stats.count} articles, ${stats.withImages} with images (Feed ID: ${stats.feedId})`);
          });
        }
        
        if (isLocal) {
          console.log('✅ Local endpoint successful:', endpoint);
          
          // Check if database is empty
          const articleCount = (response.data as any)?.count || 0;
          if (articleCount === 0) {
            console.log('📭 No articles found in local database');
            console.log('💡 The database appears to be empty');
          }
        } else {
          console.log('✅ Production endpoint successful:', endpoint);
        }
        
        // Process the response to add compatibility fields
        const apiResponse = response.data as NewsFeedResponse;
        
        // Map API articles to client format
        if (apiResponse.articles && apiResponse.articles.length > 0) {
          apiResponse.articles = apiResponse.articles.map(article => this.adaptArticleForClient(article));
        }
        
        return apiResponse;
        
      } catch (error: any) {
        console.error(`❌ Failed to fetch from ${endpoint}:`, error.name);
        console.log(`🔍 Error details:`, {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method
        });
        
        const isLocal = endpoint.includes('localhost');
        
        if (isLocal && isDevelopment) {
          if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
            console.error('💡 Local service not available. Make sure the RSS news service is running on port 5001');
            console.error('💡 You can start it with the appropriate command for your local setup');
          } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.error('💡 Request timed out. The service might be running but responding slowly');
            console.error('💡 Try testing the endpoint manually: http://localhost:5001/api/news');
            console.error('💡 Check if the service is processing data or needs time to start up');
          } else if (error.response?.status === 404) {
            console.error('💡 404 Error: The /api/news endpoint may not exist');
            console.error('💡 Check the API documentation at http://localhost:5001/api/service/docs/');
            console.error('💡 Verify the correct endpoint path with the service documentation');
          }
        }
        
        throw error; // Re-throw the error instead of trying fallbacks
      }
    } catch (error) {
      console.error('Error fetching news articles:', error);
      return {
        success: false,
        articles: [],
        count: 0,
        pagination: {
          total_items: 0,
          total_pages: 0,
          current_page: 1,
          per_page: 50,
          has_next_page: false,
          has_prev_page: false
        },
        filters_applied: {
          category: null,
          country: null,
          feed_id: null,
          limit: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        message: error instanceof Error ? error.message : 'Unknown error' // For backward compatibility
      };
    }
  }

  /**
   * Helper method to adapt API response article format to client format
   */
  private adaptArticleForClient(article: NewsArticle): NewsArticle {
    return {
      ...article,
      // Map API fields to legacy compatibility fields
      url: article.link,
      summary: article.description,
      publishedDate: article.pubDate,
      thumbnailUrl: article.media_thumb_url || '',
      imageUrl: article.media_url || '',
      hasMedia: article.has_media,
      source: article.feed_title,
      tags: article.keywords || [],
      readingTime: article.reading_time || Math.ceil((article.word_count || 0) / 200),
      wordCount: article.word_count
    };
  }

  /**
   * Get available news categories from articles endpoint
   */
  async getCategories(): Promise<string[]> {
    try {
      // Based on the OpenAPI spec, health categories are:
      return [
        'All Health News', 
        'Nutrition', 
        'Medical Research', 
        'Public Health', 
        'Clinical Studies', 
        'Prevention', 
        'Mental Health', 
        'General Health', 
        'Environment'
      ];
    } catch (error) {
      console.error('Error fetching news categories:', error);
      return [];
    }
  }

  /**
   * Get available countries from articles endpoint
   */
  async getCountries(): Promise<{code: string, name: string}[]> {
    try {
      // Based on the OpenAPI spec, supported countries are: US, IN, UK, CA, AU, DE, FR, JP
      return [
        { code: 'US', name: 'United States' },
        { code: 'IN', name: 'India' },
        { code: 'UK', name: 'United Kingdom' },
        { code: 'CA', name: 'Canada' },
        { code: 'AU', name: 'Australia' },
        { code: 'DE', name: 'Germany' },
        { code: 'FR', name: 'France' },
        { code: 'JP', name: 'Japan' }
      ];
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  }

  /**
   * Calculate trust score based on domain
   */
  calculateTrustScore(article: NewsArticle): number {
    try {
      // Extract domain from article link
      const url = new URL(article.link);
      const domain = url.hostname.replace('www.', '');
      
      return TRUSTED_DOMAINS[domain] || 
             TRUSTED_DOMAINS[`www.${domain}`] || 
             0.5;
    } catch {
      return 0.5; // Default score if URL parsing fails
    }
  }
}

export const newsService = new NewsService();

// Update these functions to improve category filtering and sort by date

export const fetchNewsFeed = async (categories?: string[], limit?: number): Promise<NewsFeedResponse> => {
  // First, set up the API request parameters
  const params: NewsQueryParams = {};
  
  // Only add category parameter if categories array is non-empty
  if (categories && categories.length > 0) {
    params.category = categories.join(',');
  }
  
  // Request more articles than needed for better sorting/filtering
  params.limit = limit ? limit * 2 : 50;
  
  // Note: Sorting is handled by the API internally, no sort parameters needed
  
  console.log('Fetching news with params:', params);
  
  // Fetch articles from API
  const response = await newsService.getArticles(params);
  
  if (response.success && response.articles && response.articles.length > 0) {
    // Define priority categories in exact order
    const priorityCategories = [
      'Nutrition & Diet', 
      'Medical Research', 
      'Public Health', 
      'Clinical Studies', 
      'Disease Prevention', 
      'Mental Health', 
      'General Health'
    ];
    
    // Sort articles by our priority scheme
    const sortedArticles = sortArticlesByPriority(response.articles, priorityCategories);
    
    // Limit to requested count after sorting
    const limitedArticles = sortedArticles.slice(0, limit || sortedArticles.length);
    
    // Log first few articles to verify order
    console.log('Articles returned after prioritization:');
    limitedArticles.slice(0, 5).forEach((article, i) => {
      console.log(`  ${i+1}. [${article.category || 'uncategorized'}]: ${article.title}`);
    });
    
    // Return a modified response with our prioritized articles
    return {
      ...response,
      articles: limitedArticles,
      count: limitedArticles.length
    };
  }
  
  return response;
};

// Add the prioritization function to the newsService file
function sortArticlesByPriority(articles: NewsArticle[], priorityCategories: string[]): NewsArticle[] {
  // Create a copy of the articles array
  const sortedArticles = [...articles];
  
  // Define a function to get priority score (lower is higher priority)
  const getPriorityScore = (article: NewsArticle): number => {
    const category = article.category || '';
    const categoryLower = category.toLowerCase();
    
    // FIRST: Explicitly handle tech content - make sure it's always at the bottom
    // Check if it's explicitly categorized as tech
    if (categoryLower === 'tech' || 
        categoryLower.includes('technology') || 
        categoryLower.includes('computing') || 
        categoryLower.includes('it ') || 
        categoryLower.includes('software')) {
      console.log(`👉 Found tech article, assigning lowest priority: ${article.title}`);
      return 1000; // Tech should be shown last
    }
    
    // 1. Exact match with priority categories (in strict order)
    for (let i = 0; i < priorityCategories.length; i++) {
      if (category === priorityCategories[i]) {
        return i; // Return the exact index position (0, 1, 2, etc.)
      }
    }
    
    // 2. Partial match with priority categories
    for (let i = 0; i < priorityCategories.length; i++) {
      if (category.includes(priorityCategories[i])) {
        return i + 20; // Still keep order but with lower priority than exact matches
      }
    }
    
    // 3. Check for health-related keywords in title/description
    const title = article.title || '';
    const description = article.description || '';
    const content = title + ' ' + description;
    const contentLower = content.toLowerCase();
    
    const healthKeywords = [
      'health', 'medical', 'medicine', 'doctor', 'patient', 'hospital',
      'disease', 'treatment', 'cure', 'wellness', 'fitness', 'diet',
      'nutrition', 'mental', 'therapy', 'clinical', 'drug', 'vaccine',
      'symptom', 'diagnosis', 'cancer', 'heart', 'diabetes', 'covid'
    ];
    
    if (healthKeywords.some(keyword => contentLower.includes(keyword))) {
      return 100; // All health-related content after categorized content
    }
    
    // 4. Check for tech keywords in title/description if not already caught above
    const techKeywords = ['tech', 'technology', 'computing', 'software', 'hardware', 
                        'ai', 'artificial intelligence', 'computer', 'code', 'programming',
                        'developer', 'cybersecurity', 'digital', 'internet', 'smartphone',
                        'app ', 'apps ', 'device', 'gadget', 'google', 'apple', 'microsoft',
                        'facebook', 'twitter', 'social media', 'tesla', 'elon musk'];
    
    if (techKeywords.some(keyword => 
      contentLower.includes(keyword)
    )) {
      // Extra debug log for tech content detection
      console.log(`👉 Found tech content by keyword, assigning lowest priority: ${article.title}`);
      return 900; // Tech content at the bottom, but just above explicitly categorized tech
    }
    
    // 5. Everything else (general content)
    return 500; 
  };
  
  // Sort articles by priority score
  sortedArticles.sort((a, b) => {
    const priorityA = getPriorityScore(a);
    const priorityB = getPriorityScore(b);
    
    // First sort by priority category
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority category, sort by date (newest first)
    const dateA = a.publishedDate || a.pubDate;
    const dateB = b.publishedDate || b.pubDate;
    
    if (dateA && dateB) {
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    }
    
    return 0;
  });
  
  // Add debug information to see what categories are being returned
  console.log('Article order after prioritization:');
  sortedArticles.slice(0, 8).forEach((article, idx) => {
    // Show the priority score as part of the debugging
    const score = getPriorityScore(article);
    const category = article.category || 'uncategorized';
    console.log(`  ${idx + 1}. [${score}] [${category}]: ${article.title}`);
  });
  
  return sortedArticles;
}

// Update getArticlesByCategory to use the same prioritization logic

export const getArticlesByCategory = async (category: string, limit?: number): Promise<NewsFeedResponse> => {
  if (category === 'all') {
    return fetchNewsFeed([], limit);
  }
  
  const params: NewsQueryParams = { 
    category, 
    limit: limit ? Math.round(limit * 1.5) : 20, // Fetch a few more than needed
    quality: '1' // Get quality articles with good images
  };
  
  const response = await newsService.getArticles(params);
  
  if (response.success && response.articles && response.articles.length > 0) {
    // For category views, we still want to sort by date but within the category
    const sortedArticles = response.articles.sort((a, b) => {
      const dateA = a.publishedDate || a.pubDate;
      const dateB = b.publishedDate || b.pubDate;
      
      if (dateA && dateB) {
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
      
      return 0;
    });
    
    // Limit to requested count
    const limitedArticles = sortedArticles.slice(0, limit || sortedArticles.length);
    
    // Return a modified response with our sorted articles
    return {
      ...response,
      articles: limitedArticles,
      count: limitedArticles.length
    };
  }
  
  return response;
};

// Add these functions at the end of the file

/**
 * Refresh news feed with timestamp to get latest articles
 */
export const refreshNewsFeed = async (categories?: string[], limit?: number): Promise<NewsFeedResponse> => {
  const timestamp = new Date().getTime();
  const params: NewsQueryParams = {
    timestamp, // Add timestamp to bust cache
    limit: limit || 50
  };
  
  if (categories && categories.length > 0) {
    params.category = categories.join(',');
  }
  
  // Use quality parameter for better articles
  params.quality = '1';
  
  console.log('Refreshing news feed with timestamp:', timestamp);
  
  const response = await newsService.getArticles(params);
  
  if (response.success && response.articles && response.articles.length > 0) {
    // Use the same priority sorting as fetchNewsFeed
    const priorityCategories = [
      'Nutrition & Diet', 
      'Medical Research', 
      'Public Health', 
      'Clinical Studies', 
      'Disease Prevention', 
      'Mental Health', 
      'General Health'
    ];
    
    const sortedArticles = sortArticlesByPriority(response.articles, priorityCategories);
    
    // Limit to requested count after sorting
    const limitedArticles = sortedArticles.slice(0, limit || sortedArticles.length);
    
    // Return a modified response with our prioritized articles
    return {
      ...response,
      articles: limitedArticles,
      count: limitedArticles.length
    };
  }
  
  return response;
};

/**
 * Search for news articles based on query
 */
export const searchNewsArticles = async (query: string, limit?: number): Promise<NewsFeedResponse> => {
  if (!query || query.trim() === '') {
    // If no query, return empty results
    return {
      success: true,
      articles: [],
      count: 0,
      pagination: {
        total_items: 0,
        total_pages: 0,
        current_page: 1,
        per_page: 12,
        has_next_page: false,
        has_prev_page: false
      },
      filters_applied: {
        category: null,
        country: null,
        feed_id: null,
        limit: 0
      }
    };
  }
  
  const params: NewsQueryParams = {
    query: query.trim(),
    limit: limit || 50,
    quality: '1' // Get quality articles with good images for search
  };
  
  console.log(`Searching news articles with query: "${query}"`);
  
  const response = await newsService.getArticles(params);
  
  if (response.success && response.articles && response.articles.length > 0) {
    // For search results, we want to prioritize by relevance to search term
    // But still use our priority categories as a secondary sort
    const priorityCategories = [
      'Nutrition & Diet', 
      'Medical Research', 
      'Public Health', 
      'Clinical Studies', 
      'Disease Prevention', 
      'Mental Health', 
      'General Health'
    ];
    
    // Sort articles based on search relevance and category
    const sortedArticles = response.articles.sort((a, b) => {
      // First, prioritize by relevance score if available
      if (a.relevanceScore !== undefined && b.relevanceScore !== undefined) {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
      }
      
      // If relevance scores are the same, use our category priority
      const categoryA = a.category || '';
      const categoryB = b.category || '';
      
      // Check if categories are in our priority list
      const indexA = priorityCategories.findIndex(cat => categoryA.includes(cat));
      const indexB = priorityCategories.findIndex(cat => categoryB.includes(cat));
      
      // If both categories are in priority list
      if (indexA >= 0 && indexB >= 0) {
        if (indexA !== indexB) {
          return indexA - indexB;
        }
      } 
      // If only one category is in priority list
      else if (indexA >= 0) {
        return -1;
      } else if (indexB >= 0) {
        return 1;
      }
      
      // Finally, sort by date
      const dateA = a.publishedDate || a.pubDate;
      const dateB = b.publishedDate || b.pubDate;
      
      if (dateA && dateB) {
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
      
      return 0;
    });
    
    // Limit to requested count
    const limitedArticles = sortedArticles.slice(0, limit || sortedArticles.length);
    
    return {
      ...response,
      articles: limitedArticles,
      count: limitedArticles.length
    };
  }
  
  return response;
};