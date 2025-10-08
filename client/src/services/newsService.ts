import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  domain: string;
  category: string;
  publishedDate: string;
  relevanceScore: number;
  tags: string[];
  // Enhanced RSS fields
  thumbnailUrl?: string;
  imageUrl?: string;
  mediaType?: string;
  mediaDescription?: string;
  author?: string;
  fullContent?: string;
  wordCount?: number;
  readingTime?: number;
  hasMedia: boolean;
  hasAuthor: boolean;
  contentLength?: number;
  feedTitle?: string;
  feedImageUrl?: string;
  feedThumbnailUrl?: string;
  guid?: string;
  commentsUrl?: string;
  language?: string;
  rights?: string;
  extractedAt?: string;
  lastModified?: string;
  // RSS API enhanced fields
  timeAgo?: string;
  isRecent?: boolean;
  contentQuality?: 'low' | 'medium' | 'high';
  completeness?: 'minimal' | 'partial' | 'complete';
  country?: string;
  feedName?: string;
  feedId?: number;
}

export interface NewsFeedResponse {
  success: boolean;
  message?: string;
  articles?: NewsArticle[];
  categories?: Record<string, NewsArticle[]>;
  lastUpdated?: string;
  count?: number;
  filtersApplied?: {
    category?: string | null;
    country?: string | null;
    feed_id?: string | null;
    limit?: number;
  };
}

// RSS API response types
interface RSSArticleResponse {
  id: number;
  title: string;
  description: string;
  link: string;
  published_date: string;
  author?: string;
  category?: string;
  country?: string;
  feed_name: string;
  feed_id: number;
  time_ago: string;
  reading_time: number;
  word_count: number;
  is_recent: boolean;
  content_quality: 'low' | 'medium' | 'high';
  completeness: 'minimal' | 'partial' | 'complete';
  domain: string;
  extracted_at: string;
  // Additional possible fields
  media_thumb_url?: string;
  media_url?: string;
  media_type?: string;
  media_description?: string;
  content_encoded?: string;
  guid?: string;
  comments_url?: string;
  language?: string;
  rights?: string;
  last_modified?: string;
  has_media?: boolean;
  has_author?: boolean;
  content_length?: number;
}

interface RSSResponse {
  success: boolean;
  articles: RSSArticleResponse[];
  count: number;
  filters_applied: {
    category: string | null;
    country: string | null;
    feed_id: string | null;
    limit: number;
  };
  message?: string;
}

interface RSSHealthResponse {
  success: boolean;
  message: string;
  status: {
    controller_created: boolean;
    database_available: boolean;
    parser_available: boolean;
    polling_available: boolean;
    is_initialized: boolean;
    initialization_error: string | null;
    database_connection?: string;
    timestamp: string;
  };
}

interface RSSCategoriesResponse {
  success: boolean;
  categories: string[];
  countries: string[];
}

interface RSSPollingResponse {
  success: boolean;
  message: string;
  results: {
    total: number;
    successful: number;
    failed: number;
    articles_fetched: number;
    duration: string;
  };
}

export const TRUSTED_DOMAINS: Record<string, number> = {
  'nih.gov': 1,
  'ncbi.nlm.nih.gov': 1,
  'who.int': 1,
  'cdc.gov': 1,
  'fda.gov': 1,
  'usda.gov': 1,
  'jamanetwork.com': 1,
  'nejm.org': 1,
  'thelancet.com': 1,
  'bmj.com': 1,
  'nature.com': 1,
  'science.org': 1,
  'mayoclinic.org': 1,
  'harvard.edu': 1,
  'stanford.edu': 1,
  'clevelandclinic.org': 1,
  'uptodate.com': 1,
  'cochranelibrary.com': 1,
  'pubmed.ncbi.nlm.nih.gov': 1,
  'medlineplus.gov': 1,
  'livemint.com': 0.8,
  'npr.org': 0.9,
  'reuters.com': 0.9,
  'cnn.com': 0.8,
  'cbsnews.com': 0.8,
  'abcnews.com': 0.8,
  'washingtonpost.com': 0.8,
  'nytimes.com': 0.8
};

export const NEWS_CATEGORIES = {
  NUTRITION: 'nutrition',
  MEDICAL: 'medical',
  PUBLIC_HEALTH: 'health',
  CLINICAL: 'clinical',
  PREVENTION: 'prevention',
  MENTAL_HEALTH: 'mental',
  GENERAL: 'general',
  SCIENCE: 'science',
  TECH: 'tech',
  POLITICAL: 'political',
  SPORTS: 'sports',
  ENTERTAINMENT: 'entertainment',
  BUSINESS: 'business',
  NATURE: 'nature'
};

// Add simple cache to prevent duplicate calls
let newsCache: { data: NewsFeedResponse | null; timestamp: number } = {
  data: null,
  timestamp: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Main function to fetch RSS articles
export const fetchNewsFeed = async (categories?: string[], limit?: number): Promise<NewsFeedResponse> => {
  try {
    // Check cache first to prevent duplicate calls
    const now = Date.now();
    const cacheKey = `${categories?.join(',') || 'all'}_${limit || 100}`;
    
    if (newsCache.data && 
        newsCache.data.articles && 
        newsCache.data.articles.length >= (limit || 100) &&
        (now - newsCache.timestamp) < CACHE_DURATION) {
      console.log('📦 Using cached RSS data');
      return newsCache.data;
    }
    
    console.log('🔍 Fetching RSS articles...', { categories, limit });
    
    // Only make ONE API call
    const params: any = {
      limit: limit || 100,
      flat: true,
      category: 'health',
      country: 'US',
      feed_id: 276
    };
    
    // Override category if specified
    if (categories && categories.length > 0 && categories[0] !== 'all') {
      const mappedCategory = mapFrontendToBackendCategory(categories[0]);
      if (mappedCategory) {
        params.category = mappedCategory;
      }
    }
    
    console.log('📡 Making RSS API request:', `${API_URL}/news/articles`, 'with params:', params);
    
    const response = await axios.get<RSSResponse>(`${API_URL}/news/articles`, {
      params,
      timeout: 10000
    });
    
    const data = response.data;
    
    console.log('✅ RSS API response:', {
      success: data.success,
      articleCount: data.articles?.length || 0,
      count: data.count,
      filtersApplied: data.filters_applied
    });

    if (!data.success) {
      console.warn('⚠️ RSS API returned success=false, using fallback');
      return await getFallbackNews();
    }

    // Convert RSS articles to NewsArticle format
    const articles: NewsArticle[] = (data.articles || [])
      .filter(article => article.title && article.title.trim() !== '')
      .map((article: RSSArticleResponse, index: number) => {
        
        // Enhanced image URL extraction with better validation
        const extractValidImageUrl = (url: string | undefined): string => {
          if (!url) return '';
          const trimmed = url.trim();
          if (trimmed === 'null' || trimmed === 'undefined' || trimmed === '') return '';
          if (trimmed.startsWith('http') || trimmed.startsWith('//')) {
            // Validate it's actually an image URL
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
            const hasImageExtension = imageExtensions.some(ext => 
              trimmed.toLowerCase().includes(ext)
            );
            // Accept if it has image extension or contains image-related path
            if (hasImageExtension || trimmed.includes('/image') || trimmed.includes('/photo')) {
              return trimmed;
            }
          }
          return '';
        };
        
        const thumbnailUrl = extractValidImageUrl(article.media_thumb_url);
        const imageUrl = extractValidImageUrl(article.media_url);
        
        // Better summary handling - ensure we have actual content
        let summary = article.description || article.content_encoded || '';
        
        // Clean up HTML tags and decode entities if present
        summary = summary.replace(/<[^>]*>/g, '').trim();
        summary = summary.replace(/&[^;]+;/g, ' ').trim();
        
        // If still empty, create a meaningful fallback
        if (!summary || summary.length < 10) {
          summary = `Read about ${article.title} from ${article.feed_name}`;
        }
        
        const cleanSummary = summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
        
        return {
          id: article.id?.toString() || article.guid || `rss_${Date.now()}_${index}`,
          title: article.title || 'No title',
          summary: cleanSummary,
          url: article.link || '#',
          source: article.feed_name || 'Unknown Source',
          domain: article.domain || extractDomain(article.link || ''),
          category: mapBackendCategory(article.category),
          publishedDate: article.published_date || article.extracted_at || new Date().toISOString(),
          relevanceScore: calculateRelevanceScore(article.title, article.description),
          tags: extractTags(article.title, article.description),
          
          // RSS enhanced fields
          thumbnailUrl,
          imageUrl,
          mediaType: article.media_type || '',
          mediaDescription: article.media_description || '',
          author: article.author || '',
          fullContent: article.content_encoded || '',
          wordCount: article.word_count || 0,
          readingTime: article.reading_time || Math.ceil((article.word_count || 200) / 200),
          hasMedia: !!(thumbnailUrl || imageUrl),
          hasAuthor: !!(article.author && article.author.trim()),
          contentLength: article.content_length || 0,
          feedTitle: article.feed_name || '',
          guid: article.guid || '',
          commentsUrl: article.comments_url || '',
          language: article.language || '',
          rights: article.rights || '',
          extractedAt: article.extracted_at || '',
          lastModified: article.last_modified || '',
          
          // RSS API specific fields
          timeAgo: article.time_ago || formatTimeAgo(article.published_date || article.extracted_at || ''),
          isRecent: article.is_recent || false,
          contentQuality: article.content_quality || 'medium',
          completeness: article.completeness || 'partial',
          country: article.country || '',
          feedName: article.feed_name || '',
          feedId: article.feed_id || 0
        };
      });
    
    console.log('📰 Processed RSS articles:', {
      total: articles.length,
      withImages: articles.filter(a => a.hasMedia).length,
      withAuthors: articles.filter(a => a.hasAuthor).length,
      withSummaries: articles.filter(a => a.summary !== 'Click to read full article').length,
      categories: [...new Set(articles.map(a => a.category))]
    });
    
    // Categorize articles
    const categorizedArticles: Record<string, NewsArticle[]> = {};
    articles.forEach(article => {
      const category = article.category;
      if (!categorizedArticles[category]) {
        categorizedArticles[category] = [];
      }
      categorizedArticles[category].push(article);
    });
    
    const result = {
      success: true,
      articles: articles,
      categories: categorizedArticles,
      lastUpdated: new Date().toISOString(),
      count: articles.length,
      filtersApplied: data.filters_applied,
      message: 'Health news fetched successfully from RSS feeds'
    };
    
    // Cache the result
    newsCache = {
      data: result,
      timestamp: now
    };
    
    return result;
    
  } catch (error: any) {
    console.error('❌ Error fetching RSS feed:', error);
    
    // If we have cached data, use it even if it's old
    if (newsCache.data) {
      console.log('📦 Using stale cached data due to error');
      return newsCache.data;
    }
    
    const fallback = await getFallbackNews();
    return {
      ...fallback,
      message: `RSS service error (${error.message}). Showing sample news.`
    };
  }
};

// Clear cache function
export const clearNewsCache = () => {
  newsCache = { data: null, timestamp: 0 };
  console.log('🗑️ News cache cleared');
};

// Get available categories and countries from RSS API
export const getRSSFilters = async (): Promise<{
  success: boolean;
  categories?: string[];
  countries?: string[];
  message?: string;
}> => {
  try {
    console.log('🏷️ Fetching RSS categories and countries...');
    
    const response = await axios.get<RSSCategoriesResponse>(`${API_URL}/news/categories-countries`, {
      timeout: 5000
    });
    
    const data = response.data;
    console.log('✅ RSS filters response:', data);
    
    return {
      success: data.success,
      categories: data.categories || [],
      countries: data.countries || []
    };
    
  } catch (error: any) {
    console.error('❌ Error fetching RSS filters:', error);
    return {
      success: false,
      message: `Failed to fetch filters: ${error.message}`
    };
  }
};

// Trigger RSS polling manually
export const triggerRSSPolling = async (force?: boolean, feedId?: number): Promise<{
  success: boolean;
  results?: any;
  message?: string;
}> => {
  try {
    console.log('🔄 Triggering RSS polling...', { force, feedId });
    
    const params: any = {};
    if (force) params.force = 'true';
    if (feedId) params.feed_id = feedId.toString();
    
    const response = await axios.post<RSSPollingResponse>(`${API_URL}/news/polling/trigger`, {}, {
      params,
      timeout: 30000 // Longer timeout for polling
    });
    
    const data = response.data;
    console.log('✅ RSS polling response:', data);
    
    return {
      success: data.success,
      results: data.results,
      message: data.message
    };
    
  } catch (error: any) {
    console.error('❌ Error triggering RSS polling:', error);
    return {
      success: false,
      message: `Failed to trigger polling: ${error.message}`
    };
  }
};

// Map frontend categories to backend RSS categories
const mapFrontendToBackendCategory = (frontendCategory: string): string | null => {
  const categoryMap: Record<string, string> = {
    'nutrition': 'nutrition',
    'medical': 'medical',
    'health': 'health',
    'clinical': 'medical',
    'prevention': 'health',
    'mental': 'mental',
    'science': 'science',
    'general': 'health',
    'tech': 'tech',
    'business': 'business'
  };
  
  return categoryMap[frontendCategory.toLowerCase()] || 'health'; // Default to 'health' instead of null
};

// Map backend categories to frontend display categories
const mapBackendCategory = (backendCategory: string | undefined): string => {
  if (!backendCategory) return 'General Health';
  
  const categoryMap: Record<string, string> = {
    'nutrition': 'Nutrition & Diet',
    'diet': 'Nutrition & Diet',
    'medical': 'Medical Research',
    'health': 'Public Health',
    'mental': 'Mental Health',
    'prevention': 'Disease Prevention',
    'clinical': 'Clinical Studies',
    'science': 'Medical Research',
    'tech': 'Medical Technology',
    'political': 'Health Policy',
    'sports': 'Fitness & Sports',
    'entertainment': 'Wellness',
    'business': 'Health Business',
    'nature': 'Environmental Health'
  };
  
  const lowerCategory = backendCategory.toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(key)) {
      return value;
    }
  }
  
  return 'General Health';
};

// Enhanced fallback news with RSS structure
const getFallbackNews = async (): Promise<NewsFeedResponse> => {
  const fallbackArticles: NewsArticle[] = [
    {
      id: 'fallback_1',
      title: "New Study Reveals Benefits of Mediterranean Diet for Heart Health",
      summary: "Researchers found that following a Mediterranean diet can reduce cardiovascular disease risk by up to 30%. The study tracked over 7,000 participants for 5 years.",
      url: "https://www.nih.gov/news-events/news-releases/mediterranean-diet-heart-health",
      source: "NIH Health News",
      domain: "nih.gov",
      category: "Nutrition & Diet",
      publishedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      relevanceScore: 0.95,
      tags: ['nutrition', 'heart-health', 'mediterranean-diet', 'cardiovascular'],
      thumbnailUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
      mediaType: "image",
      author: "Dr. Sarah Johnson",
      hasMedia: true,
      hasAuthor: true,
      wordCount: 150,
      readingTime: 1,
      contentLength: 750,
      timeAgo: "1 day ago",
      isRecent: true,
      contentQuality: "high",
      completeness: "complete"
    },
    {
      id: 'fallback_2',
      title: "Exercise and Mental Health: The Connection You Need to Know",
      summary: "New research shows that just 30 minutes of exercise daily can significantly improve mental well-being and reduce symptoms of depression and anxiety.",
      url: "https://www.cdc.gov/mental-health/exercise-connection",
      source: "CDC Health Updates",
      domain: "cdc.gov",
      category: "Mental Health",
      publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      relevanceScore: 0.90,
      tags: ['mental-health', 'exercise', 'wellness', 'depression'],
      thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
      mediaType: "image",
      author: "Dr. Michael Chen",
      hasMedia: true,
      hasAuthor: true,
      wordCount: 180,
      readingTime: 1,
      contentLength: 900,
      timeAgo: "2 days ago",
      isRecent: true,
      contentQuality: "high",
      completeness: "complete"
    },
    {
      id: 'fallback_3',
      title: "The Importance of Sleep for Immune System Function",
      summary: "Studies demonstrate that quality sleep is crucial for maintaining a strong immune system. Adults need 7-9 hours of sleep per night for optimal health.",
      url: "https://www.nih.gov/news-events/sleep-immune-system",
      source: "Sleep Health Research",
      domain: "nih.gov",
      category: "General Health",
      publishedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      relevanceScore: 0.85,
      tags: ['sleep', 'immune-system', 'health', 'wellness'],
      thumbnailUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&q=80",
      imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&q=80",
      mediaType: "image",
      author: "Dr. Lisa Rodriguez",
      hasMedia: true,
      hasAuthor: true,
      wordCount: 200,
      readingTime: 1,
      contentLength: 1000,
      timeAgo: "3 days ago",
      isRecent: false,
      contentQuality: "high",
      completeness: "complete"
    }
  ];

  // Categorize fallback articles
  const categorizedArticles: Record<string, NewsArticle[]> = {};
  fallbackArticles.forEach(article => {
    if (!categorizedArticles[article.category]) {
      categorizedArticles[article.category] = [];
    }
    categorizedArticles[article.category].push(article);
  });

  return {
    success: true,
    articles: fallbackArticles,
    categories: categorizedArticles,
    lastUpdated: new Date().toISOString(),
    count: fallbackArticles.length,
    message: 'Using sample health news (RSS service unavailable)'
  };
};

// Updated utility functions
export const getArticlesByCategory = async (category: string, limit?: number): Promise<NewsFeedResponse> => {
  try {
    console.log('📂 Fetching RSS articles for category:', category);
    return await fetchNewsFeed([category], limit);
  } catch (error: any) {
    console.error('❌ Error fetching articles by category:', error);
    return {
      success: false,
      message: 'Error fetching articles by category'
    };
  }
};

export const searchNewsArticles = async (query: string, category?: string, limit?: number): Promise<NewsFeedResponse> => {
  try {
    console.log('🔎 Searching RSS articles:', { query, category, limit });
    
    if (!query.trim()) {
      return {
        success: false,
        message: 'Search query cannot be empty'
      };
    }
    
    const feedResponse = await fetchNewsFeed(category ? [category] : undefined, 100);
    
    if (!feedResponse.success || !feedResponse.articles) {
      return {
        success: false,
        message: 'No articles available to search'
      };
    }
    
    const searchTerm = query.toLowerCase();
    
    const matchingArticles = feedResponse.articles
      .filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.summary.toLowerCase().includes(searchTerm) ||
        article.tags.some(tag => tag.includes(searchTerm)) ||
        (article.author && article.author.toLowerCase().includes(searchTerm))
      )
      .slice(0, limit || 10);
    
    return {
      success: true,
      articles: matchingArticles,
      lastUpdated: new Date().toISOString(),
      count: matchingArticles.length,
      message: `Search results for "${query}"`
    };
    
  } catch (error: any) {
    console.error('❌ Error searching articles:', error);
    return {
      success: false,
      message: 'Error searching articles'
    };
  }
};

export const refreshNewsFeed = async (): Promise<NewsFeedResponse> => {
  try {
    console.log('🔄 Refreshing RSS feed...');
    
    // Clear cache to force fresh data
    clearNewsCache();
    
    // Trigger RSS polling
    const pollingResult = await triggerRSSPolling(true);
    if (pollingResult.success) {
      console.log('✅ RSS polling triggered successfully:', pollingResult.results);
    } else {
      console.warn('⚠️ RSS polling failed:', pollingResult.message);
    }
    
    // Fetch fresh articles
    return await fetchNewsFeed();
  } catch (error: any) {
    console.error('❌ Error refreshing news feed:', error);
    return {
      success: false,
      message: 'Error refreshing news feed'
    };
  }
};

export const getNewsFeedStats = async (): Promise<{
  success: boolean;
  message?: string;
  stats?: {
    totalArticles: number;
    categoryCounts: Record<string, number>;
    lastUpdated: string;
    sourcesCounts: Record<string, number>;
    articlesWithImages: number;
    articlesWithAuthors: number;
    averageWordCount: number;
    averageReadingTime: number;
    trustedSources: number;
  };
}> => {
  try {
    const feedResponse = await fetchNewsFeed();
    
    if (!feedResponse.success || !feedResponse.articles) {
      return {
        success: false,
        message: 'No articles available for stats'
      };
    }
    
    const categoryCounts: Record<string, number> = {};
    const sourcesCounts: Record<string, number> = {};
    
    let totalWordCount = 0;
    let totalReadingTime = 0;
    let articlesWithImages = 0;
    let articlesWithAuthors = 0;
    let trustedSources = 0;
    
    feedResponse.articles.forEach(article => {
      categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
      sourcesCounts[article.source] = (sourcesCounts[article.source] || 0) + 1;
      
      if (article.hasMedia) articlesWithImages++;
      if (article.hasAuthor) articlesWithAuthors++;
      if (isTrustedDomain(article.url)) trustedSources++;
      if (article.wordCount) totalWordCount += article.wordCount;
      if (article.readingTime) totalReadingTime += article.readingTime;
    });

    return {
      success: true,
      stats: {
        totalArticles: feedResponse.articles.length,
        categoryCounts,
        lastUpdated: feedResponse.lastUpdated || new Date().toISOString(),
        sourcesCounts,
        articlesWithImages,
        articlesWithAuthors,
        averageWordCount: Math.round(totalWordCount / feedResponse.articles.length) || 0,
        averageReadingTime: Math.round(totalReadingTime / feedResponse.articles.length) || 0,
        trustedSources
      }
    };
  } catch (error: any) {
    console.error('❌ Error fetching RSS stats:', error);
    return {
      success: false,
      message: 'Error fetching news feed statistics'
    };
  }
};

// Utility functions
export const formatArticleForDisplay = (article: NewsArticle) => {
  return {
    ...article,
    formattedDate: article.timeAgo || formatTimeAgo(article.publishedDate),
    isTrusted: isTrustedDomain(article.url),
    relevancePercentage: Math.round(article.relevanceScore * 100),
    shortSummary: article.summary.length > 150 
      ? article.summary.substring(0, 150) + '...'
      : article.summary,
    displayImage: article.thumbnailUrl || article.imageUrl || article.feedThumbnailUrl || article.feedImageUrl || '',
    hasValidImage: !!(article.thumbnailUrl || article.imageUrl),
    qualityScore: calculateQualityScore(article),
    readingTimeText: article.readingTime ? `${article.readingTime} min read` : 'Quick read'
  };
};

const calculateQualityScore = (article: NewsArticle): number => {
  let score = 0;
  
  if (article.hasAuthor) score += 0.2;
  if (article.hasMedia) score += 0.2;
  if (article.wordCount && article.wordCount > 100) score += 0.2;
  if (article.contentLength && article.contentLength > 500) score += 0.2;
  if (isTrustedDomain(article.url)) score += 0.2;
  
  return Math.min(score, 1.0);
};

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return 'unknown';
  }
};

const calculateRelevanceScore = (title: string = '', description: string = ''): number => {
  const content = `${title} ${description}`.toLowerCase();
  
  const healthKeywords = ['health', 'medical', 'wellness', 'fitness', 'nutrition', 'diet', 'exercise', 'mental health', 'disease', 'treatment', 'research', 'study'];
  const matchingKeywords = healthKeywords.filter(keyword => content.includes(keyword));
  
  let score = 0.5;
  score += (matchingKeywords.length * 0.08);
  
  return Math.min(score, 1.0);
};

const extractTags = (title: string = '', description: string = '', existingTags?: string): string[] => {
  const content = `${title} ${description}`.toLowerCase();
  const tags: string[] = [];
  
  if (existingTags) {
    try {
      const parsedTags = existingTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      tags.push(...parsedTags);
    } catch (e) {
      // Continue with keyword extraction
    }
  }
  
  const tagKeywords = [
    'health', 'medical', 'nutrition', 'diet', 'fitness', 'exercise',
    'mental-health', 'wellness', 'prevention', 'treatment', 'research',
    'study', 'clinical', 'vaccine', 'medicine', 'hospital', 'doctor',
    'heart', 'cancer', 'diabetes', 'sleep', 'immune', 'therapy'
  ];
  
  tagKeywords.forEach(keyword => {
    if (content.includes(keyword.replace('-', ' ')) && !tags.includes(keyword)) {
      tags.push(keyword);
    }
  });
  
  return tags.slice(0, 5);
};

export const isTrustedDomain = (url: string): boolean => {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return Object.keys(TRUSTED_DOMAINS).some(trustedDomain => 
      domain.includes(trustedDomain.toLowerCase())
    );
  } catch {
    return false;
  }
};

export const formatTimeAgo = (dateString: string): string => {
  try {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  } catch {
    return 'Unknown';
  }
};

export const getAvailableCategories = async (): Promise<Array<{id: string, label: string}>> => {
  try {
    const filters = await getRSSFilters();
    
    if (filters.success && filters.categories) {
      // Map RSS categories to display labels
      const rssCategories = filters.categories.map(cat => ({
        id: cat,
        label: mapBackendCategory(cat)
      }));
      
      return [
        { id: 'all', label: 'All Health News' },
        ...rssCategories
      ];
    }
  } catch (error) {
    console.error('❌ Error fetching RSS categories:', error);
  }
  
  // Fallback categories
  return [
    { id: 'all', label: 'All Health News' },
    { id: 'nutrition', label: 'Nutrition & Diet' },
    { id: 'medical', label: 'Medical Research' },
    { id: 'health', label: 'Public Health' },
    { id: 'clinical', label: 'Clinical Studies' },
    { id: 'prevention', label: 'Disease Prevention' },
    { id: 'mental', label: 'Mental Health' },
    { id: 'science', label: 'Science Research' },
    { id: 'general', label: 'General Health' }
  ];
};

// Legacy compatibility
export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  category: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  author?: string;
  hasMedia?: boolean;
}

export class NewsService {
  async fetchNews(): Promise<NewsItem[]> {
    const response = await fetchNewsFeed();
    
    return response.articles?.map(article => ({
      title: article.title,
      link: article.url,
      description: article.summary,
      pubDate: article.publishedDate,
      source: article.source,
      category: article.category,
      thumbnailUrl: article.thumbnailUrl,
      imageUrl: article.imageUrl,
      author: article.author,
      hasMedia: article.hasMedia
    })) || [];
  }
}

export const newsService = new NewsService();