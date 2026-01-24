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
   * Endpoint: GET /api/research/search
   */
  async searchArticles(params: ResearchSearchParams): Promise<ResearchArticle[]> {
    try {
      const { query, category, limit = 20, offset = 0 } = params;
      
      // Build query parameters for WIHY Research API
      const queryParams = new URLSearchParams({
        q: query,
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
      
      if (!data.success || !data.results) {
        console.warn('[ResearchService] No results found');
        return [];
      }

      const bookmarks = await this.getBookmarks();

      // Transform API results to our article format
      const articles: ResearchArticle[] = data.results.map((article: any, index: number) => {
        const pmcid = article.pmcid || `PMC${article.id}`;
        
        return {
          id: article.pmcid || article.id,
          pmcid,
          title: article.title || 'Untitled',
          authors: Array.isArray(article.authors) 
            ? article.authors.slice(0, 3).join(', ')
            : article.authors,
          authorCount: Array.isArray(article.authors) ? article.authors.length : undefined,
          journal: article.journal || 'Unknown Journal',
          publishedDate: article.publication_date || article.publishedDate,
          publicationYear: article.publication_date 
            ? new Date(article.publication_date).getFullYear() 
            : article.publicationYear,
          abstract: article.abstract,
          studyType: article.study_type || article.studyType,
          evidenceLevel: article.evidence_level || article.evidenceLevel,
          researchArea: category,
          relevanceScore: article.relevance_score || (100 - (index * 5)) / 100,
          rank: index + 1 + offset,
          fullTextAvailable: article.open_access || article.fullTextAvailable || true,
          links: {
            pmcWebsite: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`,
            pubmedLink: article.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/` : undefined,
            pdfDownload: article.open_access ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/` : null,
            doi: article.doi,
          },
          category,
          bookmarked: bookmarks.some(b => b.pmcid === pmcid || b.id === article.id),
        };
      });

      console.log(`[ResearchService] Found ${articles.length} articles`);
      return articles;
      
    } catch (error) {
      console.error('[ResearchService] Search failed:', error);
      // Return mock data on error
      return this.getMockArticles(params.category);
    }
  }

  /**
   * Get article details by PMCID using WIHY Research API
   * Endpoint: GET /api/research/article/:pmcid
   */
  async getArticle(pmcid: string): Promise<ResearchArticle | null> {
    try {
      // Ensure pmcid starts with "PMC"
      const normalizedPmcid = pmcid.startsWith('PMC') ? pmcid : `PMC${pmcid}`;
      
      // Call WIHY Research API
      const articleUrl = `${API_CONFIG.servicesUrl}/api/research/article/${normalizedPmcid}?include_metrics=true`;
      
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
      return this.getMockArticles();
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

  // Mock data for development/fallback
  private getMockArticles(category?: string): ResearchArticle[] {
    const mockArticles: ResearchArticle[] = [
      {
        id: '1',
        pmcid: 'PMC8123456',
        title: 'The Effects of Intermittent Fasting on Metabolic Health',
        authors: 'Smith J, Johnson M, Williams R',
        authorCount: 3,
        journal: 'Journal of Nutrition',
        publishedDate: '2023-05-15',
        publicationYear: 2023,
        abstract: 'This systematic review examines the metabolic effects of intermittent fasting across 50 clinical trials...',
        studyType: 'Systematic Review',
        researchArea: 'nutrition',
        evidenceLevel: 'High',
        relevanceScore: 95,
        rank: 1,
        fullTextAvailable: true,
        links: {
          pmcWebsite: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8123456/',
          pubmedLink: 'https://pubmed.ncbi.nlm.nih.gov/37123456/',
          pdfDownload: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8123456/pdf/',
        },
        category: 'nutrition',
        bookmarked: false,
      },
      {
        id: '2',
        pmcid: 'PMC8234567',
        title: 'High-Intensity Interval Training vs. Moderate Continuous Exercise',
        authors: 'Davis K, Brown L, Taylor P',
        authorCount: 3,
        journal: 'Sports Medicine',
        publishedDate: '2023-03-22',
        publicationYear: 2023,
        abstract: 'A meta-analysis comparing cardiovascular adaptations between HIIT and moderate-intensity training...',
        studyType: 'Meta-analysis',
        researchArea: 'fitness',
        evidenceLevel: 'High',
        relevanceScore: 92,
        rank: 2,
        fullTextAvailable: true,
        links: {
          pmcWebsite: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8234567/',
          pubmedLink: 'https://pubmed.ncbi.nlm.nih.gov/37234567/',
          pdfDownload: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8234567/pdf/',
        },
        category: 'fitness',
        bookmarked: false,
      },
      {
        id: '3',
        pmcid: 'PMC8345678',
        title: 'Sleep Quality and Cognitive Performance: A Longitudinal Study',
        authors: 'Anderson M, Wilson T, Garcia A',
        authorCount: 3,
        journal: 'Sleep Research',
        publishedDate: '2023-01-10',
        publicationYear: 2023,
        abstract: '10-year study tracking sleep patterns and cognitive function in 5,000 participants...',
        studyType: 'Longitudinal Study',
        researchArea: 'sleep',
        evidenceLevel: 'Medium',
        relevanceScore: 88,
        rank: 3,
        fullTextAvailable: true,
        links: {
          pmcWebsite: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8345678/',
          pubmedLink: 'https://pubmed.ncbi.nlm.nih.gov/37345678/',
          pdfDownload: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8345678/pdf/',
        },
        category: 'sleep',
        bookmarked: false,
      },
    ];

    if (category && category !== 'all') {
      return mockArticles.filter(a => a.category === category);
    }

    return mockArticles;
  }
}

export const researchService = new ResearchService();
