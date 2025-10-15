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
  // API response standard fields
  id: string;
  title: string;
  description: string;
  link: string;
  author: string;
  published_date: string;
  thumbnail: string;
  image_url: string;
  has_image: boolean;
  has_author: boolean;
  category: string;
  source: string;
  feed_id: number;
  feed_priority: string;
  reading_time: number;
  word_count: number;
  time_ago: string;
  is_recent: boolean;
  content_quality: string;
  completeness: string;
  domain: string;
  extracted_at: string;
  
  // Client-side compatibility fields
  url?: string;
  summary?: string;
  publishedDate?: string;
  thumbnailUrl?: string;
  imageUrl?: string;        // Added to match client usage
  tags?: string[];
  relevanceScore?: number;
  hasMedia?: boolean;
  hasAuthor?: boolean;
  readingTime?: number;     // Added to match client usage
  wordCount?: number;       // Added to match client usage
  mediaType?: string;       // Added to match client usage
  contentLength?: number;   // Added to match client usage
}

export interface NewsFeedResponse {
  success: boolean;
  articles: NewsArticle[];
  count: number;
  pagination: {
    total_items: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    has_next_page: boolean;
    has_prev_page: false;
  };
  filters_applied: {
    category: string | null;
    country: string | null;
    feed_id: number | null;
    limit: number;
  };
  error?: string; // Added to handle errors from the API
  message?: string; // For backward compatibility
}

export interface NewsQueryParams {
  limit?: number;
  country?: string;
  category?: string;
  exclude_category?: string; // Add this field to exclude certain categories
  feed_id?: number;
  feed_priority?: string;
  flat?: boolean;
  page?: number;
  per_page?: number;
  timestamp?: number; // Added to support refreshNewsFeed
  query?: string;     // Added to support searchNewsArticles
  sort_by?: string; // Add sorting parameter
  sort_order?: 'asc' | 'desc'; // Add sort direction
}

class NewsService {
  // Update the apiUrl to use the configurable endpoint
  private getNewsEndpoint() {
    return getApiEndpoint('/news');
  }
  
  /**
   * Fetch news articles based on provided parameters
   */
  async getArticles(params: NewsQueryParams = {}): Promise<NewsFeedResponse> {
    try {
      // Set defaults
      const queryParams: NewsQueryParams = {
        limit: 500,
        country: 'US',
        feed_priority: '1-5',  // Changed from '1-10' to '1-5'
        flat: true,
        page: 1,
        per_page: 12,
        ...params // Override with any provided params
      };

      console.log('Fetching news with params:', queryParams);
      
      const response = await axios.get(`${this.getNewsEndpoint()}/articles`, { params: queryParams });
      
      // Process the response to add compatibility fields
      const apiResponse = response.data as NewsFeedResponse;
      
      // Map API articles to client format
      if (apiResponse.articles && apiResponse.articles.length > 0) {
        apiResponse.articles = apiResponse.articles.map(article => this.adaptArticleForClient(article));
      }
      
      return apiResponse;
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
          per_page: 12,
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
      // Add compatibility fields
      url: article.link || article.url,
      summary: article.description || article.summary,
      publishedDate: article.published_date || article.publishedDate,
      thumbnailUrl: article.thumbnail || article.thumbnailUrl,
      imageUrl: article.image_url || article.imageUrl,
      hasMedia: article.has_image || article.hasMedia,
      hasAuthor: article.has_author || article.hasAuthor,
      readingTime: article.reading_time || article.readingTime,
      wordCount: article.word_count || article.wordCount
    };
  }

  /**
   * Get available news categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.getNewsEndpoint()}/categories`);
      // Type assertion for correct response type
      return (response.data as any).categories || [];
    } catch (error) {
      console.error('Error fetching news categories:', error);
      return [];
    }
  }

  /**
   * Get available countries
   */
  async getCountries(): Promise<{code: string, name: string}[]> {
    try {
      const response = await axios.get(`${this.getNewsEndpoint()}/countries`);
      // Type assertion for correct response type
      return (response.data as any).countries || [];
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  }

  /**
   * Calculate trust score based on domain
   */
  calculateTrustScore(article: NewsArticle): number {
    if (!article.domain) return 0.5;
    
    return TRUSTED_DOMAINS[article.domain] || 
           TRUSTED_DOMAINS[`www.${article.domain}`] || 
           0.5;
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
  
  // Always sort by published date to get newest content
  params.sort_by = 'published_date';
  params.sort_order = 'desc';
  
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
    const dateA = a.publishedDate || a.published_date;
    const dateB = b.publishedDate || b.published_date;
    
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
    limit: limit ? limit * 1.5 : 20, // Fetch a few more than needed
    sort_by: 'published_date',
    sort_order: 'desc'
  };
  
  const response = await newsService.getArticles(params);
  
  if (response.success && response.articles && response.articles.length > 0) {
    // For category views, we still want to sort by date but within the category
    const sortedArticles = response.articles.sort((a, b) => {
      const dateA = a.publishedDate || a.published_date;
      const dateB = b.publishedDate || b.published_date;
      
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
  
  // Add sort parameters
  params.sort_by = 'published_date';
  params.sort_order = 'desc';
  
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
    sort_by: 'published_date', // Default to recent articles first
    sort_order: 'desc'
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
      const dateA = a.publishedDate || a.published_date;
      const dateB = b.publishedDate || b.published_date;
      
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