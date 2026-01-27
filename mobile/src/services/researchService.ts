import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ResearchArticle {
  id: string;
  pmcid: string;
  title: string;
  authors?: string;
  authorCount?: number;
  journal?: string;
  publishedDate?: string;
  publicationYear?: number;
  abstract?: string;
  studyType?: string;
  researchArea?: string;
  evidenceLevel?: string;
  relevanceScore?: number;
  rank?: number;
  fullTextAvailable?: boolean;
  links?: {
    pmcWebsite?: string;
    pubmedLink?: string;
    pdfDownload?: string | null;
    doi?: string;
  };
  category?: string;
  bookmarked?: boolean;
}

export interface ResearchSearchParams {
  query: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface ResearchCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export interface ResearchDashboardStats {
  studies_found: number;
  high_evidence: number;
  full_text: number;
  new_papers: number;
  saved: number;
  recent_searches: number;
  total_searches?: number;
  total_bookmarks?: number;
  total_articles_viewed?: number;
}

export interface ResearchBookmark {
  id: string;
  pmcid: string;
  pmid?: string;
  doi?: string;
  title: string;
  authors?: string;
  journal?: string;
  publication_year?: number;
  abstract?: string;
  study_type?: string;
  evidence_level?: string;
  pmc_url?: string;
  pubmed_url?: string;
  full_text_url?: string;
  notes?: string;
  tags?: string[];
  folder?: string;
  bookmarked_at: string;
  last_accessed_at?: string;
}

export interface SearchHistoryItem {
  id: string;
  keyword: string;
  search_filters?: {
    study_type?: string;
    year_from?: number;
    year_to?: number;
    evidence_level?: string;
  };
  results_count: number;
  high_evidence_count?: number;
  full_text_count?: number;
  searched_at: string;
}

export interface ReadingListItem {
  id: string;
  pmcid: string;
  pmid?: string;
  doi?: string;
  title: string;
  authors?: string;
  journal?: string;
  status: 'unread' | 'in_progress' | 'completed';
  priority: number;
  added_at: string;
  started_at?: string;
  completed_at?: string;
}

class ResearchService {
  private readonly BOOKMARKS_KEY = '@research_bookmarks';
  private readonly CATEGORIES: ResearchCategory[] = [
    { id: 'nutrition', name: 'Nutrition', icon: 'nutrition', color: '#22c55e', description: 'Dietary science and nutrition research' },
    { id: 'fitness', name: 'Fitness', icon: 'barbell', color: '#3b82f6', description: 'Exercise science and physical training' },
    { id: 'mental', name: 'Mental Health', icon: 'brain', color: '#8b5cf6', description: 'Psychology and mental wellness' },
    { id: 'sleep', name: 'Sleep', icon: 'moon', color: '#6366f1', description: 'Sleep science and circadian rhythms' },
    { id: 'longevity', name: 'Longevity', icon: 'time', color: '#ec4899', description: 'Aging and lifespan research' },
    { id: 'supplements', name: 'Supplements', icon: 'medical', color: '#f59e0b', description: 'Vitamins, minerals, and supplements' },
  ];

  /**
   * Search research articles using WIHY Research API
   * Endpoint: GET /api/research/search?keyword=...&limit=...
   */
  async searchArticles(params: ResearchSearchParams): Promise<ResearchArticle[]> {
    try {
      const { query, category, limit = 20, offset = 0 } = params;
      
      // Build query parameters for WIHY Research API
      // API uses 'keyword' not 'q'
      const queryParams = new URLSearchParams({
        keyword: query,
        limit: limit.toString(),
      });

      // Add optional filters if provided
      if (category && category !== 'all') {
        queryParams.append('type', category);
      }

      // Call WIHY Research API
      const searchUrl = `${API_CONFIG.servicesUrl}/api/research/search?${queryParams.toString()}`;
      
      console.log('[ResearchService] Searching:', searchUrl);
      
      const searchResponse = await fetchWithLogging(searchUrl, {
        headers: {
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
      });

      if (!searchResponse.ok) {
        throw new Error(`Research API error: ${searchResponse.status}`);
      }

      const data = await searchResponse.json();
      
      // API returns { success, keyword, totalFound, articles }
      if (!data.success) {
        console.warn('[ResearchService] Search not successful:', data.error);
        return [];
      }

      const articlesData = data.articles || data.results || [];
      if (articlesData.length === 0) {
        console.warn('[ResearchService] No results found');
        return [];
      }

      // Transform API results to our article format
      const articles: ResearchArticle[] = articlesData.map((article: any, index: number) => {
        const pmcid = article.pmcid || `PMC${article.id}`;
        
        // Relevance score mapping:
        // API returns relevanceScore as decimal (0-1) like 0.87
        // We store as decimal and display as percentage in UI
        let relevanceScore = 0;
        if (article.relevanceScore !== undefined) {
          // Already a decimal (0-1)
          relevanceScore = article.relevanceScore;
        } else if (article.relevance_score !== undefined) {
          // Snake case version
          relevanceScore = article.relevance_score;
        } else {
          // Calculate based on rank (first result = 0.95, decreasing)
          relevanceScore = Math.max(0.5, 0.95 - (index * 0.03));
        }
        
        // Normalize evidence level to lowercase for consistent UI rendering
        const evidenceLevel = (article.evidenceLevel || article.evidence_level || 'moderate').toLowerCase();
        
        return {
          id: article.id || pmcid,
          pmcid,
          title: article.title || 'Untitled',
          authors: Array.isArray(article.authors) 
            ? article.authors.slice(0, 3).join(', ')
            : article.authors,
          authorCount: article.authorCount || (Array.isArray(article.authors) ? article.authors.length : undefined),
          journal: article.journal || 'Unknown Journal',
          publishedDate: article.publishedDate || article.publication_date,
          publicationYear: article.publicationYear || article.publication_year || 
            (article.publishedDate ? new Date(article.publishedDate).getFullYear() : undefined),
          abstract: article.abstract,
          studyType: article.studyType || article.study_type,
          evidenceLevel,
          researchArea: article.researchArea || category,
          relevanceScore,
          rank: article.rank || (index + 1 + offset),
          fullTextAvailable: article.fullTextAvailable ?? article.open_access ?? true,
          links: article.links || {
            pmcWebsite: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`,
            pubmedLink: article.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/` : undefined,
            pdfDownload: article.fullTextAvailable ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/` : null,
            doi: article.doi,
          },
          category: article.category || category,
          bookmarked: article.bookmarked || false,
        };
      });

      console.log(`[ResearchService] Found ${articles.length} articles`);
      return articles;
      
    } catch (error) {
      console.error('[ResearchService] Search failed:', error);
      // Re-throw error - no mock fallback
      throw error;
    }
  }

  /**
   * Get article details by PMCID using WIHY Research API
   * Endpoint: GET /api/research/pmc/:pmc_id
   */
  async getArticle(pmcid: string): Promise<ResearchArticle | null> {
    try {
      // Ensure pmcid starts with "PMC"
      const normalizedPmcid = pmcid.startsWith('PMC') ? pmcid : `PMC${pmcid}`;
      
      // Call WIHY Research API - correct endpoint is /api/research/pmc/{pmc_id}
      const articleUrl = `${API_CONFIG.servicesUrl}/api/research/pmc/${normalizedPmcid}`;
      
      console.log('[ResearchService] Fetching article:', articleUrl);
      
      const response = await fetchWithLogging(articleUrl, {
        headers: {
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`Research API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.article) {
        console.warn('[ResearchService] Article not found');
        return null;
      }

      const article = data.article;
      const bookmarks = await this.getBookmarks();

      return {
        id: article.pmcid || article.id,
        pmcid: article.pmcid,
        title: article.title || 'Untitled',
        authors: Array.isArray(article.authors)
          ? article.authors.map((a: any) => a.name || a).join(', ')
          : article.authors,
        authorCount: Array.isArray(article.authors) ? article.authors.length : undefined,
        journal: article.journal?.name || article.journal || 'Unknown Journal',
        publishedDate: article.publication_info?.published_date || article.publishedDate,
        publicationYear: article.publication_info?.published_date
          ? new Date(article.publication_info.published_date).getFullYear()
          : article.publicationYear,
        abstract: article.abstract || article.full_text_sections?.introduction,
        studyType: article.study_design?.type || article.studyType,
        evidenceLevel: article.quality_assessment?.grade_evidence || article.evidenceLevel,
        fullTextAvailable: article.open_access || true,
        links: {
          pmcWebsite: `https://www.ncbi.nlm.nih.gov/pmc/articles/${article.pmcid}/`,
          pubmedLink: article.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/` : undefined,
          pdfDownload: article.open_access ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${article.pmcid}/pdf/` : null,
          doi: article.publication_info?.doi || article.doi,
        },
        bookmarked: bookmarks.some(b => b.pmcid === article.pmcid || b.id === article.id),
      };
    } catch (error) {
      console.error('[ResearchService] Failed to get article:', error);
      return null;
    }
  }

  /**
   * Get personalized article recommendations
   */
  async getRecommendations(userProfile?: any, limit: number = 10): Promise<ResearchArticle[]> {
    try {
      // Build query based on user interests
      const interests = userProfile?.interests || ['nutrition', 'fitness', 'health'];
      const query = interests.join(' OR ');
      
      return await this.searchArticles({ query, limit });
    } catch (error) {
      console.error('[ResearchService] Failed to get recommendations:', error);
      throw error;
    }
  }

  /**
   * Get full article content with body text
   * Endpoint: GET /api/research/pmc/:pmcId/content
   */
  async getArticleContent(pmcid: string): Promise<{
    pmcid: string;
    title: string;
    abstract: string;
    body: {
      introduction?: string;
      methods?: string;
      results?: string;
      discussion?: string;
      conclusion?: string;
    };
    references?: string[];
  } | null> {
    try {
      const normalizedPmcid = pmcid.startsWith('PMC') ? pmcid : `PMC${pmcid}`;
      const contentUrl = `${API_CONFIG.servicesUrl}/api/research/pmc/${normalizedPmcid}/content`;
      
      console.log('[ResearchService] Fetching article content:', contentUrl);
      
      const response = await fetchWithLogging(contentUrl, {
        headers: {
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`Article content API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.content) {
        console.warn('[ResearchService] Article content not found');
        return null;
      }

      return data.content;
    } catch (error) {
      console.error('[ResearchService] Failed to get article content:', error);
      throw error;
    }
  }

  /**
   * Get research quality score for a topic
   * Endpoint: GET /api/research/quality?keyword=...&maxResults=...
   */
  async getQualityScore(keyword: string, maxResults: number = 20): Promise<{
    keyword: string;
    qualityScore: number;
    confidence: 'high' | 'moderate' | 'low';
    totalStudies: number;
    studyTypeBreakdown: Record<string, number>;
    evidenceLevelBreakdown: Record<string, number>;
    yearRange: { earliest: number; latest: number };
    topJournals: string[];
    recommendation: string;
  } | null> {
    try {
      const queryParams = new URLSearchParams({
        keyword,
        maxResults: maxResults.toString(),
      });
      
      const qualityUrl = `${API_CONFIG.servicesUrl}/api/research/quality?${queryParams.toString()}`;
      
      console.log('[ResearchService] Fetching quality score:', qualityUrl);
      
      const response = await fetchWithLogging(qualityUrl, {
        headers: {
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`Quality score API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        console.warn('[ResearchService] Quality score not available');
        return null;
      }

      return {
        keyword: data.keyword,
        qualityScore: data.qualityScore,
        confidence: data.confidence,
        totalStudies: data.totalStudies,
        studyTypeBreakdown: data.studyTypeBreakdown,
        evidenceLevelBreakdown: data.evidenceLevelBreakdown,
        yearRange: data.yearRange,
        topJournals: data.topJournals,
        recommendation: data.recommendation,
      };
    } catch (error) {
      console.error('[ResearchService] Failed to get quality score:', error);
      throw error;
    }
  }

  /**
   * Get popular research topics from API
   * Endpoint: GET /api/research/topics
   */
  async getTopics(): Promise<string[]> {
    try {
      const topicsUrl = `${API_CONFIG.servicesUrl}/api/research/topics`;
      
      console.log('[ResearchService] Fetching topics:', topicsUrl);
      
      const response = await fetchWithLogging(topicsUrl, {
        headers: {
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`Topics API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.topics) {
        console.warn('[ResearchService] Topics not available');
        return [];
      }

      return data.topics;
    } catch (error) {
      console.error('[ResearchService] Failed to get topics:', error);
      throw error;
    }
  }

  /**
   * Get articles for a specific topic (simplified response)
   * Endpoint: GET /api/research/articles?topic=...&limit=...
   */
  async getArticlesByTopic(topic: string = 'nutrition', limit: number = 10): Promise<{
    topic: string;
    articles: Array<{
      pmcid: string;
      title: string;
      journal: string;
      year: number;
      abstract: string;
      studyType: string;
    }>;
  }> {
    try {
      const queryParams = new URLSearchParams({
        topic,
        limit: limit.toString(),
      });
      
      const articlesUrl = `${API_CONFIG.servicesUrl}/api/research/articles?${queryParams.toString()}`;
      
      console.log('[ResearchService] Fetching articles by topic:', articlesUrl);
      
      const response = await fetchWithLogging(articlesUrl, {
        headers: {
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`Articles by topic API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        console.warn('[ResearchService] Articles not available');
        return { topic, articles: [] };
      }

      return {
        topic: data.topic,
        articles: data.articles || [],
      };
    } catch (error) {
      console.error('[ResearchService] Failed to get articles by topic:', error);
      throw error;
    }
  }

  /**
   * Verify a health claim against scientific evidence
   * Endpoint: POST /api/research/verify
   */
  async verifyClaim(claim: string, context?: {
    source?: string;
    population?: string;
    specific_type?: string;
  }): Promise<any> {
    try {
      const verifyUrl = `${API_CONFIG.servicesUrl}/api/research/verify`;
      
      console.log('[ResearchService] Verifying claim:', claim);
      
      const response = await fetchWithLogging(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
        body: JSON.stringify({
          claim,
          claim_context: context,
          evidence_threshold: 'moderate',
        }),
      });

      if (!response.ok) {
        throw new Error(`Verification API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Claim verification failed');
      }

      return data;
    } catch (error) {
      console.error('[ResearchService] Failed to verify claim:', error);
      throw error;
    }
  }

  /**
   * Get research trends and emerging topics
   * Endpoint: GET /api/research/trends
   */
  async getTrends(timeframe: '1month' | '3months' | '6months' | '1year' = '3months', category?: string): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
        timeframe,
      });

      if (category) {
        queryParams.append('category', category);
      }

      const trendsUrl = `${API_CONFIG.servicesUrl}/api/research/trends?${queryParams.toString()}`;
      
      console.log('[ResearchService] Fetching trends:', trendsUrl);
      
      const response = await fetchWithLogging(trendsUrl, {
        headers: {
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`Trends API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch trends');
      }

      return data;
    } catch (error) {
      console.error('[ResearchService] Failed to get trends:', error);
      throw error;
    }
  }

  /**
   * Get research service status
   * Endpoint: GET /api/research/status
   */
  async getStatus(): Promise<any> {
    try {
      const statusUrl = `${API_CONFIG.servicesUrl}/api/research/status`;
      
      const response = await fetchWithLogging(statusUrl, {
        headers: {
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`Status API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[ResearchService] Failed to get status:', error);
      throw error;
    }
  }

  // ==========================================
  // USER RESEARCH API METHODS
  // ==========================================

  /**
   * Get user's research dashboard statistics
   * Endpoint: GET /api/research/user/stats
   */
  async getUserStats(userId: string): Promise<ResearchDashboardStats> {
    try {
      const statsUrl = `${API_CONFIG.servicesUrl}/api/research/user/stats?userId=${userId}`;
      
      console.log('[ResearchService] Fetching user stats:', userId);
      
      const response = await fetchWithLogging(statsUrl, {
        headers: {
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`User stats API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.stats) {
        throw new Error('Failed to fetch user stats');
      }

      return data.stats;
    } catch (error) {
      console.error('[ResearchService] Failed to get user stats:', error);
      // Return default stats on error
      return {
        studies_found: 0,
        high_evidence: 0,
        full_text: 0,
        new_papers: 0,
        saved: 0,
        recent_searches: 0,
      };
    }
  }

  /**
   * Get user's bookmarked articles
   * Endpoint: GET /api/research/user/bookmarks
   */
  async getUserBookmarks(
    userId: string,
    options?: {
      folder?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ count: number; bookmarks: ResearchBookmark[] }> {
    try {
      const queryParams = new URLSearchParams({
        userId,
      });

      if (options?.folder) {
        queryParams.append('folder', options.folder);
      }
      if (options?.limit) {
        queryParams.append('limit', options.limit.toString());
      }
      if (options?.offset) {
        queryParams.append('offset', options.offset.toString());
      }

      const bookmarksUrl = `${API_CONFIG.servicesUrl}/api/research/user/bookmarks?${queryParams.toString()}`;
      
      console.log('[ResearchService] Fetching user bookmarks:', userId);
      
      const response = await fetchWithLogging(bookmarksUrl, {
        headers: {
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`Bookmarks API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch bookmarks');
      }

      return {
        count: data.count || 0,
        bookmarks: data.bookmarks || [],
      };
    } catch (error) {
      console.error('[ResearchService] Failed to get bookmarks:', error);
      return { count: 0, bookmarks: [] };
    }
  }

  /**
   * Save/bookmark a research article
   * Endpoint: POST /api/research/user/bookmark
   */
  async saveBookmark(
    userId: string,
    article: Partial<ResearchArticle> & { title: string; pmcid?: string; pmid?: string; doi?: string },
    options?: {
      notes?: string;
      tags?: string[];
      folder?: string;
    }
  ): Promise<{ success: boolean; bookmark?: ResearchBookmark; message?: string }> {
    try {
      const bookmarkUrl = `${API_CONFIG.servicesUrl}/api/research/user/bookmark`;
      
      console.log('[ResearchService] Saving bookmark:', article.title);
      
      const response = await fetchWithLogging(bookmarkUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
        body: JSON.stringify({
          userId,
          pmcid: article.pmcid,
          pmid: article.pmid,
          doi: article.links?.doi,
          title: article.title,
          authors: article.authors,
          journal: article.journal,
          publication_year: article.publicationYear,
          abstract: article.abstract,
          study_type: article.studyType,
          evidence_level: article.evidenceLevel,
          pmc_url: article.links?.pmcWebsite,
          pubmed_url: article.links?.pubmedLink,
          full_text_url: article.links?.pdfDownload,
          notes: options?.notes,
          tags: options?.tags,
          folder: options?.folder || 'default',
        }),
      });

      if (!response.ok) {
        throw new Error(`Save bookmark API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[ResearchService] Failed to save bookmark:', error);
      return { success: false, message: 'Failed to save article' };
    }
  }

  /**
   * Remove a bookmarked article
   * Endpoint: DELETE /api/research/user/bookmark/:pmcid
   */
  async removeBookmarkByPmcid(userId: string, pmcid: string): Promise<{ success: boolean; message?: string }> {
    try {
      const bookmarkUrl = `${API_CONFIG.servicesUrl}/api/research/user/bookmark/${pmcid}?userId=${userId}`;
      
      console.log('[ResearchService] Removing bookmark:', pmcid);
      
      const response = await fetchWithLogging(bookmarkUrl, {
        method: 'DELETE',
        headers: {
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`Remove bookmark API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[ResearchService] Failed to remove bookmark:', error);
      return { success: false, message: 'Failed to remove bookmark' };
    }
  }

  /**
   * Get user's search history
   * Endpoint: GET /api/research/user/searches
   */
  async getSearchHistory(
    userId: string,
    limit: number = 10
  ): Promise<{ count: number; searches: SearchHistoryItem[] }> {
    try {
      const historyUrl = `${API_CONFIG.servicesUrl}/api/research/user/searches?userId=${userId}&limit=${limit}`;
      
      console.log('[ResearchService] Fetching search history:', userId);
      
      const response = await fetchWithLogging(historyUrl, {
        headers: {
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`Search history API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch search history');
      }

      return {
        count: data.count || 0,
        searches: data.searches || [],
      };
    } catch (error) {
      console.error('[ResearchService] Failed to get search history:', error);
      return { count: 0, searches: [] };
    }
  }

  /**
   * Get user's reading list
   * Endpoint: GET /api/research/user/reading-list
   */
  async getReadingList(
    userId: string,
    status?: 'unread' | 'in_progress' | 'completed'
  ): Promise<{ count: number; reading_list: ReadingListItem[] }> {
    try {
      const queryParams = new URLSearchParams({
        userId,
      });

      if (status) {
        queryParams.append('status', status);
      }

      const readingUrl = `${API_CONFIG.servicesUrl}/api/research/user/reading-list?${queryParams.toString()}`;
      
      console.log('[ResearchService] Fetching reading list:', userId);
      
      const response = await fetchWithLogging(readingUrl, {
        headers: {
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`Reading list API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch reading list');
      }

      return {
        count: data.count || 0,
        reading_list: data.reading_list || [],
      };
    } catch (error) {
      console.error('[ResearchService] Failed to get reading list:', error);
      return { count: 0, reading_list: [] };
    }
  }

  /**
   * Add article to reading list
   * Endpoint: POST /api/research/user/reading-list
   */
  async addToReadingList(
    userId: string,
    article: Partial<ResearchArticle> & { title: string; pmcid?: string; pmid?: string; doi?: string },
    priority: number = 0
  ): Promise<{ success: boolean; item?: ReadingListItem; message?: string }> {
    try {
      const readingUrl = `${API_CONFIG.servicesUrl}/api/research/user/reading-list`;
      
      console.log('[ResearchService] Adding to reading list:', article.title);
      
      const response = await fetchWithLogging(readingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': API_CONFIG.servicesClientId,
          'X-Client-Secret': API_CONFIG.servicesClientSecret,
        },
        body: JSON.stringify({
          userId,
          pmcid: article.pmcid,
          pmid: article.pmid,
          doi: article.links?.doi,
          title: article.title,
          authors: article.authors,
          journal: article.journal,
          priority,
        }),
      });

      if (!response.ok) {
        throw new Error(`Reading list API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[ResearchService] Failed to add to reading list:', error);
      return { success: false, message: 'Failed to add to reading list' };
    }
  }

  /**
   * Check if an article is bookmarked by the user
   */
  async isArticleBookmarked(userId: string, pmcid: string): Promise<boolean> {
    try {
      const bookmarks = await this.getUserBookmarks(userId, { limit: 100 });
      return bookmarks.bookmarks.some(b => b.pmcid === pmcid);
    } catch (error) {
      console.error('[ResearchService] Failed to check bookmark status:', error);
      return false;
    }
  }

  /**
   * Bookmark an article
   */
  async bookmarkArticle(article: ResearchArticle): Promise<void> {
    try {
      const bookmarks = await this.getBookmarks();
      
      // Check if already bookmarked
      if (bookmarks.some(b => b.id === article.id)) {
        return;
      }

      bookmarks.push(article);
      await AsyncStorage.setItem(this.BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Failed to bookmark article:', error);
      throw error;
    }
  }

  /**
   * Remove bookmark
   */
  async removeBookmark(articleId: string): Promise<void> {
    try {
      const bookmarks = await this.getBookmarks();
      const filtered = bookmarks.filter(b => b.id !== articleId);
      await AsyncStorage.setItem(this.BOOKMARKS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      throw error;
    }
  }

  /**
   * Get all bookmarked articles
   */
  async getBookmarks(): Promise<ResearchArticle[]> {
    try {
      const data = await AsyncStorage.getItem(this.BOOKMARKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get bookmarks:', error);
      return [];
    }
  }

  /**
   * Get available categories
   */
  getCategories(): ResearchCategory[] {
    return this.CATEGORIES;
  }

  /**
   * Get category by ID
   */
  getCategory(id: string): ResearchCategory | undefined {
    return this.CATEGORIES.find(c => c.id === id);
  }
}

export const researchService = new ResearchService();
