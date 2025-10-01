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
}

export interface NewsFeedResponse {
  success: boolean;
  message?: string;
  articles?: NewsArticle[];
  categories?: Record<string, NewsArticle[]>;
  lastUpdated?: string;
  count?: number;
}

// Backend API response types
interface BackendArticle {
  id: number;
  title: string;
  description: string;
  link: string;
  pub_date: string;
  created_at: string;
  author: string;
  guid: string;
  feed: {
    title: string;
    url: string;
    country_code: string;
    category: string;
  };
}

interface BackendArticlesResponse {
  success: boolean;
  message?: string;
  articles: BackendArticle[];
  count: number;
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
  'cnn.com': 0.8,
  'npr.org': 0.9,
  'pbs.org': 0.9,
  'cbsnews.com': 0.8,
  'abcnews.com': 0.8,
  'foxnews.com': 0.7,
  'reuters.com': 0.9,
  'washingtonpost.com': 0.8,
  'nytimes.com': 0.8,
  'latimes.com': 0.8
};

export const NEWS_CATEGORIES = {
  NUTRITION: 'Nutrition & Diet',
  MEDICAL: 'Medical Research',
  PUBLIC_HEALTH: 'Public Health',
  CLINICAL: 'Clinical Studies',
  PREVENTION: 'Disease Prevention',
  MENTAL_HEALTH: 'Mental Health',
  GENERAL: 'General Health'
};

// Helper function to validate if a domain is trusted
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

// UPDATED: Use backend API instead of direct RSS fetching
export const fetchNewsFeed = async (categories?: string[], limit?: number): Promise<NewsFeedResponse> => {
  try {
    console.log('🔍 Fetching health news from backend API...', { categories, limit });
    
    // Use your backend API to get articles
    const response = await axios.get<BackendArticlesResponse>(`${API_URL}/news/articles`, {
      params: {
        limit: limit || 50,
        category: categories?.[0] || undefined,
        country: undefined
      }
    });
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch news');
    }
    
    console.log('✅ Backend API response:', data);
    
    // Convert backend article format to frontend format
    const articles: NewsArticle[] = (data.articles || []).map((article: BackendArticle) => ({
      id: article.id?.toString() || `article_${Date.now()}`,
      title: article.title || 'No title',
      summary: article.description || 'No summary available',
      url: article.link || '#',
      source: article.feed?.title || article.author || 'Unknown Source',
      domain: extractDomain(article.link || ''),
      category: mapBackendCategory(article.feed?.category) || NEWS_CATEGORIES.GENERAL,
      publishedDate: article.pub_date || article.created_at || new Date().toISOString(),
      relevanceScore: calculateRelevanceScore(article.title, article.description),
      tags: extractTags(article.title, article.description)
    }));
    
    // Categorize articles
    const categorizedArticles: Record<string, NewsArticle[]> = {};
    articles.forEach(article => {
      if (!categorizedArticles[article.category]) {
        categorizedArticles[article.category] = [];
      }
      categorizedArticles[article.category].push(article);
    });
    
    console.log('✅ News feed processed successfully:', articles.length, 'articles');
    
    return {
      success: true,
      articles: articles,
      categories: categorizedArticles,
      lastUpdated: new Date().toISOString(),
      count: articles.length,
      message: 'Health news fetched successfully from database'
    };
    
  } catch (error: any) {
    console.error('❌ Error fetching news feed from backend:', error);
    
    // If it's a network error, try fallback
    if (error.code === 'ECONNREFUSED' || error.response?.status === 500) {
      console.log('📱 Backend unavailable, using fallback news...');
      return await getFallbackNews();
    }
    
    // For other errors, still provide fallback but with error message
    const fallback = await getFallbackNews();
    return {
      ...fallback,
      message: `Backend error: ${error.message}. Showing sample news.`
    };
  }
};

// Helper function to map backend categories to frontend categories
const mapBackendCategory = (backendCategory: string | undefined): string => {
  if (!backendCategory) return NEWS_CATEGORIES.GENERAL;
  
  const categoryMap: Record<string, string> = {
    'nutrition': NEWS_CATEGORIES.NUTRITION,
    'diet': NEWS_CATEGORIES.NUTRITION,
    'medical': NEWS_CATEGORIES.MEDICAL,
    'health': NEWS_CATEGORIES.PUBLIC_HEALTH,
    'mental': NEWS_CATEGORIES.MENTAL_HEALTH,
    'prevention': NEWS_CATEGORIES.PREVENTION,
    'clinical': NEWS_CATEGORIES.CLINICAL
  };
  
  const lowerCategory = backendCategory.toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(key)) {
      return value;
    }
  }
  
  return NEWS_CATEGORIES.GENERAL;
};

// Fallback news data if backend is unavailable
const getFallbackNews = async (): Promise<NewsFeedResponse> => {
  const fallbackArticles: NewsArticle[] = [
    {
      id: 'fallback_1',
      title: "New Study Reveals Benefits of Mediterranean Diet for Heart Health",
      summary: "Researchers found that following a Mediterranean diet can reduce cardiovascular disease risk by up to 30%.",
      url: "https://www.nih.gov/news-events/news-releases/mediterranean-diet-heart-health",
      source: "NIH",
      domain: "nih.gov",
      category: NEWS_CATEGORIES.NUTRITION,
      publishedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      relevanceScore: 0.95,
      tags: ['nutrition', 'heart-health', 'mediterranean-diet']
    },
    {
      id: 'fallback_2',
      title: "Exercise and Mental Health: The Connection You Need to Know",
      summary: "New research shows that just 30 minutes of exercise daily can significantly improve mental well-being.",
      url: "https://www.cdc.gov/mental-health/exercise-connection",
      source: "CDC",
      domain: "cdc.gov",
      category: NEWS_CATEGORIES.MENTAL_HEALTH,
      publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      relevanceScore: 0.90,
      tags: ['mental-health', 'exercise', 'wellness']
    },
    {
      id: 'fallback_3',
      title: "The Importance of Sleep for Immune System Function",
      summary: "Studies demonstrate that quality sleep is crucial for maintaining a strong immune system.",
      url: "https://www.nih.gov/news-events/sleep-immune-system",
      source: "NIH",
      domain: "nih.gov",
      category: NEWS_CATEGORIES.GENERAL,
      publishedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      relevanceScore: 0.85,
      tags: ['sleep', 'immune-system', 'health']
    },
    {
      id: 'fallback_4',
      title: "Breakthrough in Cancer Research: New Treatment Shows Promise",
      summary: "Scientists have developed a new immunotherapy approach that shows remarkable results in clinical trials.",
      url: "https://www.nih.gov/news-events/cancer-breakthrough-2024",
      source: "NIH",
      domain: "nih.gov",
      category: NEWS_CATEGORIES.MEDICAL,
      publishedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      relevanceScore: 0.98,
      tags: ['cancer', 'research', 'immunotherapy']
    },
    {
      id: 'fallback_5',
      title: "Preventive Care: Early Detection Saves Lives",
      summary: "Regular health screenings can detect potential health issues before they become serious problems.",
      url: "https://www.cdc.gov/prevention/early-detection",
      source: "CDC",
      domain: "cdc.gov",
      category: NEWS_CATEGORIES.PREVENTION,
      publishedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      relevanceScore: 0.80,
      tags: ['prevention', 'screening', 'early-detection']
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
    message: 'Using fallback news data (backend unavailable)'
  };
};

// Helper function to extract domain from URL
const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return 'unknown';
  }
};

// Helper function to calculate relevance score based on health content
const calculateRelevanceScore = (title: string = '', description: string = ''): number => {
  const content = `${title} ${description}`.toLowerCase();
  
  const healthKeywords = ['health', 'medical', 'wellness', 'fitness', 'nutrition', 'diet', 'exercise', 'mental health'];
  const matchingKeywords = healthKeywords.filter(keyword => content.includes(keyword));
  
  // Base score + bonus for health relevance
  let score = 0.5;
  score += (matchingKeywords.length * 0.1);
  
  return Math.min(score, 1.0);
};

// Helper function to extract tags from content
const extractTags = (title: string = '', description: string = ''): string[] => {
  const content = `${title} ${description}`.toLowerCase();
  const tags: string[] = [];
  
  const tagKeywords = [
    'health', 'medical', 'nutrition', 'diet', 'fitness', 'exercise',
    'mental-health', 'wellness', 'prevention', 'treatment', 'research',
    'study', 'clinical', 'vaccine', 'medicine', 'hospital', 'doctor'
  ];
  
  tagKeywords.forEach(keyword => {
    if (content.includes(keyword.replace('-', ' '))) {
      tags.push(keyword);
    }
  });
  
  return tags.slice(0, 5); // Limit to 5 tags
};

// Get articles by specific category
export const getArticlesByCategory = async (category: string, limit?: number): Promise<NewsFeedResponse> => {
  try {
    console.log('📂 Fetching articles for category:', category);
    return await fetchNewsFeed([category], limit);
  } catch (error: any) {
    console.error('❌ Error fetching articles by category:', error);
    return {
      success: false,
      message: 'Error fetching articles by category'
    };
  }
};

// Search articles from backend
export const searchNewsArticles = async (query: string, category?: string, limit?: number): Promise<NewsFeedResponse> => {
  try {
    console.log('🔎 Searching articles:', { query, category, limit });
    
    if (!query.trim()) {
      return {
        success: false,
        message: 'Search query cannot be empty'
      };
    }
    
    // For now, fetch all articles and filter client-side
    const feedResponse = await fetchNewsFeed(category ? [category] : undefined, 100);
    
    if (!feedResponse.success || !feedResponse.articles) {
      return {
        success: false,
        message: 'No articles available to search'
      };
    }
    
    const searchTerm = query.toLowerCase();
    
    // Filter articles based on search query
    const matchingArticles = feedResponse.articles
      .filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.summary.toLowerCase().includes(searchTerm) ||
        article.tags.some(tag => tag.includes(searchTerm))
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

// Refresh news feed (triggers new fetch from backend)
export const refreshNewsFeed = async (): Promise<NewsFeedResponse> => {
  try {
    console.log('🔄 Refreshing news feed...');
    return await fetchNewsFeed();
  } catch (error: any) {
    console.error('❌ Error refreshing news feed:', error);
    return {
      success: false,
      message: 'Error refreshing news feed'
    };
  }
};

// Get news feed stats from backend
export const getNewsFeedStats = async (): Promise<{
  success: boolean;
  message?: string;
  stats?: {
    totalArticles: number;
    categoryCounts: Record<string, number>;
    lastUpdated: string;
    sourcesCounts: Record<string, number>;
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
    
    feedResponse.articles.forEach(article => {
      categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
      sourcesCounts[article.source] = (sourcesCounts[article.source] || 0) + 1;
    });

    return {
      success: true,
      stats: {
        totalArticles: feedResponse.articles.length,
        categoryCounts,
        lastUpdated: feedResponse.lastUpdated || new Date().toISOString(),
        sourcesCounts
      }
    };
  } catch (error: any) {
    console.error('❌ Error fetching stats:', error);
    return {
      success: false,
      message: 'Error fetching news feed statistics'
    };
  }
};

// Utility function to format articles for display
export const formatArticleForDisplay = (article: NewsArticle) => {
  return {
    ...article,
    formattedDate: formatTimeAgo(article.publishedDate),
    isTrusted: isTrustedDomain(article.url),
    relevancePercentage: Math.round(article.relevanceScore * 100),
    shortSummary: article.summary.length > 150 
      ? article.summary.substring(0, 150) + '...'
      : article.summary
  };
};

// Helper function to format time ago
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

// Get available categories
export const getAvailableCategories = (): Array<{id: string, label: string}> => {
  return [
    { id: 'all', label: 'All Health News' },
    { id: NEWS_CATEGORIES.NUTRITION, label: 'Nutrition & Diet' },
    { id: NEWS_CATEGORIES.MEDICAL, label: 'Medical Research' },
    { id: NEWS_CATEGORIES.PUBLIC_HEALTH, label: 'Public Health' },
    { id: NEWS_CATEGORIES.CLINICAL, label: 'Clinical Studies' },
    { id: NEWS_CATEGORIES.PREVENTION, label: 'Disease Prevention' },
    { id: NEWS_CATEGORIES.MENTAL_HEALTH, label: 'Mental Health' },
    { id: NEWS_CATEGORIES.GENERAL, label: 'General Health' }
  ];
};

// Legacy compatibility - keep the NewsService class for any existing code
export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  category: string;
}

export class NewsService {
  async fetchNews(): Promise<NewsItem[]> {
    const response = await fetchNewsFeed();
    
    // Convert to legacy format
    return response.articles?.map(article => ({
      title: article.title,
      link: article.url,
      description: article.summary,
      pubDate: article.publishedDate,
      source: article.source,
      category: article.category
    })) || [];
  }
}

export const newsService = new NewsService();