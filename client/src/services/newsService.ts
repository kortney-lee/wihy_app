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
  // ADDED: New image and media fields
  thumbnailUrl?: string;
  imageUrl?: string;
  mediaType?: string;
  mediaDescription?: string;
  // ADDED: Enhanced content fields
  author?: string;
  fullContent?: string;
  wordCount?: number;
  readingTime?: number;
  // ADDED: Quality indicators
  hasMedia: boolean;
  hasAuthor: boolean;
  contentLength?: number;
  // ADDED: Source metadata
  feedTitle?: string;
  feedImageUrl?: string;
  feedThumbnailUrl?: string;
  // ADDED: Additional metadata
  guid?: string;
  commentsUrl?: string;
  language?: string;
  rights?: string;
  extractedAt?: string;
  lastModified?: string;
}

export interface NewsFeedResponse {
  success: boolean;
  message?: string;
  articles?: NewsArticle[];
  categories?: Record<string, NewsArticle[]>;
  lastUpdated?: string;
  count?: number;
}

// UPDATED: Backend API response types with all new fields
interface BackendArticle {
  // Feed metadata
  feed_id?: number;
  feed_title?: string;
  feed_url?: string;
  category?: string;
  country_code?: string;
  feed_image_url?: string;
  feed_thumbnail_url?: string;
  
  // Article content
  title?: string;
  description?: string;
  summary?: string;
  link?: string;
  author?: string;
  pubDate?: string;
  guid?: string;
  article_category?: string;
  tags?: string;
  source?: string;
  source_url?: string;
  
  // Media content
  media_thumb_url?: string;
  media_url?: string;
  media_type?: string;
  media_description?: string;
  
  // Enhanced content
  content_encoded?: string;
  extracted_at?: string;
  word_count?: string;
  reading_time?: string;
  
  // Quality indicators
  has_media?: string | boolean;
  has_author?: string | boolean;
  has_content?: string | boolean;
  content_length?: string;
  
  // Additional metadata
  comments_url?: string;
  language?: string;
  rights?: string;
  last_modified?: string;
  last_checked?: string;
  updated_at?: string;
  feed_format?: string;
  raw_item_keys?: string[];
}

interface BackendArticlesResponse {
  success: boolean;
  message?: string;
  articles: BackendArticle[];
  count: number;
  debug?: any;
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
  'livemint.com': 0.8, // ADDED: LiveMint as trusted source
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

// UPDATED: Enhanced article conversion with better image field mapping
export const fetchNewsFeed = async (categories?: string[], limit?: number): Promise<NewsFeedResponse> => {
  try {
    console.log('🔍 Fetching health news from backend API...', { categories, limit });
    
    const params: any = {
      limit: limit || 50,
      flat: 'true'
    };
    
    if (categories && categories.length > 0 && categories[0] !== 'all') {
      params.category = categories[0];
    }
    
    console.log('📡 Making request to:', `${API_URL}/news/articles`, 'with params:', params);
    
    const response = await axios.get<BackendArticlesResponse>(`${API_URL}/news/articles`, {
      params,
      timeout: 10000
    });
    
    const data = response.data;
    
    console.log('✅ Backend API response:', {
      success: data.success,
      articleCount: data.articles?.length || 0,
      count: data.count,
      message: data.message,
      debug: data.debug
    });

    // DEBUG: Log first few articles to see the actual structure
    if (data.articles && data.articles.length > 0) {
      console.log('🔍 Sample backend article structure:', {
        first_article_keys: Object.keys(data.articles[0]),
        sample_article: data.articles[0],
        media_fields: {
          media_thumb_url: data.articles[0].media_thumb_url,
          media_url: data.articles[0].media_url,
          feed_image_url: data.articles[0].feed_image_url,
          feed_thumbnail_url: data.articles[0].feed_thumbnail_url,
          has_media: data.articles[0].has_media
        }
      });
    }
    
    if (!data.success) {
      console.warn('⚠️ Backend returned success=false:', data.message);
    }
    
    // ENHANCED: Convert backend article format with better image handling
    const articles: NewsArticle[] = (data.articles || [])
      .filter(article => article.title && article.title.trim() !== '')
      .map((article: BackendArticle, index: number) => {
        
        // DEBUG: Log image fields for first few articles
        if (index < 3) {
          console.log(`🖼️ Article ${index + 1} image analysis:`, {
            title: article.title?.substring(0, 50) + '...',
            media_thumb_url: article.media_thumb_url,
            media_url: article.media_url,
            feed_image_url: article.feed_image_url,
            feed_thumbnail_url: article.feed_thumbnail_url,
            has_media: article.has_media,
            raw_fields: Object.keys(article).filter(key => 
              key.includes('media') || key.includes('image') || key.includes('thumb')
            )
          });
        }
        
        // IMPROVED: Better image URL extraction with validation
        const extractValidImageUrl = (url: string | undefined): string => {
          if (!url) return '';
          const trimmed = url.trim();
          if (trimmed === 'null' || trimmed === 'undefined' || trimmed === '') return '';
          if (trimmed.startsWith('http') || trimmed.startsWith('//')) return trimmed;
          return '';
        };
        
        // Extract all possible image URLs
        const mediaThumbUrl = extractValidImageUrl(article.media_thumb_url);
        const mediaUrl = extractValidImageUrl(article.media_url);
        const feedImageUrl = extractValidImageUrl(article.feed_image_url);
        const feedThumbnailUrl = extractValidImageUrl(article.feed_thumbnail_url);
        
        // Choose best available images (prefer article-specific over feed-level)
        const thumbnailUrl = mediaThumbUrl || mediaUrl || feedThumbnailUrl || feedImageUrl;
        const imageUrl = mediaUrl || mediaThumbUrl || feedImageUrl || feedThumbnailUrl;
        
        // Parse boolean fields more robustly
        const parseBoolean = (value: any): boolean => {
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            const lower = value.toLowerCase();
            return lower === 'true' || lower === '1' || lower === 'yes';
          }
          if (typeof value === 'number') return value === 1;
          return false;
        };
        
        const hasMedia = parseBoolean(article.has_media) || !!(thumbnailUrl || imageUrl);
        const hasAuthor = parseBoolean(article.has_author) || !!(article.author && article.author.trim());
        const hasContent = parseBoolean(article.has_content) || !!(article.content_encoded && article.content_encoded.trim());
        
        // DEBUG: Log final image decisions for first few articles
        if (index < 3) {
          console.log(`✅ Article ${index + 1} final image decision:`, {
            thumbnailUrl,
            imageUrl,
            hasMedia,
            mediaFound: !!(mediaThumbUrl || mediaUrl),
            feedImageFound: !!(feedImageUrl || feedThumbnailUrl)
          });
        }
        
        return {
          id: article.guid || `${article.feed_id}_${index}` || `article_${Date.now()}_${index}`,
          title: article.title || 'No title',
          summary: article.description || article.summary || 'No summary available',
          url: article.link || '#',
          source: article.feed_title || article.source || article.author || 'Unknown Source',
          domain: extractDomain(article.link || ''),
          category: article.category || article.article_category || 'general',
          publishedDate: article.pubDate || article.extracted_at || new Date().toISOString(),
          relevanceScore: calculateRelevanceScore(article.title, article.description || article.summary),
          tags: extractTags(article.title, article.description || article.summary, article.tags),
          
          // FIXED: Image and media fields with proper extraction
          thumbnailUrl,
          imageUrl,
          mediaType: article.media_type || (hasMedia ? 'image' : ''),
          mediaDescription: article.media_description || '',
          
          // Enhanced content fields
          author: article.author || '',
          fullContent: article.content_encoded || '',
          wordCount: parseInt(article.word_count || '0') || 0,
          readingTime: parseInt(article.reading_time || '0') || 0,
          
          // Quality indicators
          hasMedia,
          hasAuthor,
          contentLength: parseInt(article.content_length || '0') || 0,
          
          // Source metadata
          feedTitle: article.feed_title || '',
          feedImageUrl: feedImageUrl,
          feedThumbnailUrl: feedThumbnailUrl,
          
          // Additional metadata
          guid: article.guid || '',
          commentsUrl: article.comments_url || '',
          language: article.language || '',
          rights: article.rights || '',
          extractedAt: article.extracted_at || '',
          lastModified: article.last_modified || ''
        };
      });
    
    console.log('📰 Processed articles:', articles.length);
    console.log('📸 Articles with images:', articles.filter(a => a.hasMedia).length);
    console.log('📸 Articles with thumbnail URLs:', articles.filter(a => a.thumbnailUrl).length);
    console.log('📸 Articles with image URLs:', articles.filter(a => a.imageUrl).length);
    console.log('✍️ Articles with authors:', articles.filter(a => a.hasAuthor).length);
    
    // Log some sample image URLs for debugging
    const articlesWithImages = articles.filter(a => a.thumbnailUrl || a.imageUrl);
    if (articlesWithImages.length > 0) {
      console.log('🖼️ Sample image URLs found:', articlesWithImages.slice(0, 3).map(a => ({
        title: a.title.substring(0, 30) + '...',
        thumbnailUrl: a.thumbnailUrl,
        imageUrl: a.imageUrl
      })));
    } else {
      console.log('❌ No image URLs found in any articles');
    }

    // If no articles from flat endpoint, try the regular endpoint
    if (articles.length === 0) {
      console.log('🔄 No articles from flat endpoint, trying regular endpoint...');
      
      const regularResponse = await axios.get<BackendArticlesResponse>(`${API_URL}/news/articles`, {
        params: {
          limit: limit || 50,
          category: categories?.[0] !== 'all' ? categories?.[0] : undefined
        },
        timeout: 10000
      });
      
      const regularData = regularResponse.data;
      console.log('📰 Regular endpoint response:', {
        success: regularData.success,
        articleCount: regularData.articles?.length || 0,
        count: regularData.count
      });
      
      // Process regular endpoint articles with enhanced fields
      const regularArticles: NewsArticle[] = (regularData.articles || [])
        .filter(article => article.title && article.title.trim() !== '')
        .map((article: any, index: number) => ({
          id: article.id?.toString() || article.guid || `article_${Date.now()}_${index}`,
          title: article.title || 'No title',
          summary: article.description || article.summary || 'No summary available',
          url: article.link || article.url || '#',
          source: article.feed?.title || article.source || article.author || 'Unknown Source',
          domain: extractDomain(article.link || article.url || ''),
          category: article.feed?.category || article.category || 'general',
          publishedDate: article.pub_date || article.pubDate || article.created_at || new Date().toISOString(),
          relevanceScore: calculateRelevanceScore(article.title, article.description || article.summary),
          tags: extractTags(article.title, article.description || article.summary),
          
          // Enhanced fields with fallbacks
          thumbnailUrl: article.thumbnail_url || article.media_thumb_url || '',
          imageUrl: article.image_url || article.media_url || '',
          mediaType: article.media_type || 'image',
          mediaDescription: article.media_description || '',
          author: article.author || '',
          fullContent: article.content || article.content_encoded || '',
          wordCount: parseInt(article.word_count || '0') || 0,
          readingTime: parseInt(article.reading_time || '0') || 0,
          hasMedia: !!(article.thumbnail_url || article.image_url || article.media_thumb_url || article.media_url),
          hasAuthor: !!(article.author && article.author.trim()),
          contentLength: parseInt(article.content_length || '0') || 0,
          feedTitle: article.feed?.title || '',
          feedImageUrl: article.feed?.image_url || '',
          feedThumbnailUrl: article.feed?.thumbnail_url || '',
          guid: article.guid || article.id?.toString() || '',
          commentsUrl: article.comments_url || '',
          language: article.language || '',
          rights: article.rights || '',
          extractedAt: article.extracted_at || article.created_at || '',
          lastModified: article.last_modified || article.updated_at || ''
        }));
      
      articles.push(...regularArticles);
    }
    
    // Categorize articles
    const categorizedArticles: Record<string, NewsArticle[]> = {};
    articles.forEach(article => {
      const category = mapBackendCategory(article.category);
      if (!categorizedArticles[category]) {
        categorizedArticles[category] = [];
      }
      categorizedArticles[category].push(article);
    });
    
    console.log('✅ News feed processed successfully:', {
      totalArticles: articles.length,
      articlesWithImages: articles.filter(a => a.hasMedia).length,
      articlesWithAuthors: articles.filter(a => a.hasAuthor).length,
      categories: Object.keys(categorizedArticles),
      categoryCount: Object.entries(categorizedArticles).map(([cat, arts]) => `${cat}: ${arts.length}`).join(', ')
    });
    
    // If still no articles, use fallback
    if (articles.length === 0) {
      console.log('📱 No articles found, using fallback...');
      return await getFallbackNews();
    }
    
    return {
      success: true,
      articles: articles,
      categories: categorizedArticles,
      lastUpdated: new Date().toISOString(),
      count: articles.length,
      message: data.message || 'Health news fetched successfully from database'
    };
    
  } catch (error: any) {
    console.error('❌ Error fetching news feed from backend:', error);
    
    // Check specific error types
    if (error.code === 'ECONNREFUSED') {
      console.log('📱 Backend connection refused, using fallback news...');
    } else if (error.response?.status === 500) {
      console.log('📱 Backend server error, using fallback news...');
    } else if (error.code === 'ENOTFOUND') {
      console.log('📱 Backend not found, using fallback news...');
    } else {
      console.log('📱 Unknown error, using fallback news...', error.message);
    }
    
    const fallback = await getFallbackNews();
    return {
      ...fallback,
      message: `Backend error (${error.message}). Showing sample news.`
    };
  }
};

// Helper function to map backend categories to frontend categories
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

// ENHANCED: Updated fallback news with image URLs
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
      contentLength: 750
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
      contentLength: 900
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
      contentLength: 1000
    },
    {
      id: 'fallback_4',
      title: "Breakthrough in Cancer Research: New Treatment Shows Promise",
      summary: "Scientists have developed a new immunotherapy approach that shows remarkable results in clinical trials, offering hope for difficult-to-treat cancers.",
      url: "https://www.nih.gov/news-events/cancer-breakthrough-2024",
      source: "Medical Research Today",
      domain: "nih.gov",
      category: "Medical Research",
      publishedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      relevanceScore: 0.98,
      tags: ['cancer', 'research', 'immunotherapy', 'clinical-trials'],
      thumbnailUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&q=80",
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&q=80",
      mediaType: "image",
      author: "Dr. Robert Kim",
      hasMedia: true,
      hasAuthor: true,
      wordCount: 250,
      readingTime: 2,
      contentLength: 1250
    },
    {
      id: 'fallback_5',
      title: "Preventive Care: Early Detection Saves Lives",
      summary: "Regular health screenings can detect potential health issues before they become serious problems. Learn what screenings you need by age.",
      url: "https://www.cdc.gov/prevention/early-detection",
      source: "CDC Prevention Guidelines",
      domain: "cdc.gov",
      category: "Disease Prevention",
      publishedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      relevanceScore: 0.80,
      tags: ['prevention', 'screening', 'early-detection', 'health-checkup'],
      thumbnailUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80",
      imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80",
      mediaType: "image",
      author: "Dr. Amanda White",
      hasMedia: true,
      hasAuthor: true,
      wordCount: 160,
      readingTime: 1,
      contentLength: 800
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
    message: 'Using sample health news (backend unavailable)'
  };
};

// Rest of helper functions remain the same but with enhanced logging...
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

// ENHANCED: Updated utility functions with image support
export const formatArticleForDisplay = (article: NewsArticle) => {
  return {
    ...article,
    formattedDate: formatTimeAgo(article.publishedDate),
    isTrusted: isTrustedDomain(article.url),
    relevancePercentage: Math.round(article.relevanceScore * 100),
    shortSummary: article.summary.length > 150 
      ? article.summary.substring(0, 150) + '...'
      : article.summary,
    // ADDED: Image display helpers
    displayImage: article.thumbnailUrl || article.imageUrl || article.feedThumbnailUrl || article.feedImageUrl || '',
    hasValidImage: !!(article.thumbnailUrl || article.imageUrl),
    // ADDED: Content quality indicators
    qualityScore: calculateQualityScore(article),
    readingTimeText: article.readingTime ? `${article.readingTime} min read` : 'Quick read'
  };
};

// ADDED: Calculate article quality score
const calculateQualityScore = (article: NewsArticle): number => {
  let score = 0;
  
  if (article.hasAuthor) score += 0.2;
  if (article.hasMedia) score += 0.2;
  if (article.wordCount && article.wordCount > 100) score += 0.2;
  if (article.contentLength && article.contentLength > 500) score += 0.2;
  if (isTrustedDomain(article.url)) score += 0.2;
  
  return Math.min(score, 1.0);
};

// Rest of the functions remain the same...
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

export const searchNewsArticles = async (query: string, category?: string, limit?: number): Promise<NewsFeedResponse> => {
  try {
    console.log('🔎 Searching articles:', { query, category, limit });
    
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
    console.log('🔄 Refreshing news feed...');
    try {
      await axios.post(`${API_URL}/news/fetch`, {}, { timeout: 5000 });
      console.log('✅ Triggered backend refresh');
    } catch (fetchError) {
      console.log('⚠️ Could not trigger backend refresh, getting current data');
    }
    
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
    // ADDED: Enhanced stats
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
    console.error('❌ Error fetching stats:', error);
    return {
      success: false,
      message: 'Error fetching news feed statistics'
    };
  }
};

// Utility functions remain the same...
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

export const getAvailableCategories = (): Array<{id: string, label: string}> => {
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
  // ADDED: Legacy support for new fields
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