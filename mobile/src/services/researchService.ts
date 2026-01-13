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
   * Search research articles
   */
  async searchArticles(params: ResearchSearchParams): Promise<ResearchArticle[]> {
    try {
      const { query, category, limit = 20, offset = 0 } = params;
      
      // Build PubMed search query
      let searchTerm = query;
      if (category && category !== 'all') {
        searchTerm = `${query} AND ${category}[MeSH Terms]`;
      }

      // Search PubMed Central using eutils API
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${encodeURIComponent(searchTerm)}&retmax=${limit}&retstart=${offset}&retmode=json&sort=relevance`;
      
      const searchResponse = await fetchWithLogging(searchUrl);
      if (!searchResponse.ok) {
        throw new Error('Failed to search PubMed');
      }

      const searchData = await searchResponse.json();
      const pmcIds = searchData.esearchresult?.idlist || [];

      if (pmcIds.length === 0) {
        return [];
      }

      // Fetch article details
      const detailsUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id=${pmcIds.join(',')}&retmode=json`;
      
      const detailsResponse = await fetchWithLogging(detailsUrl);
      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch article details');
      }

      const detailsData = await detailsResponse.json();
      const bookmarks = await this.getBookmarks();

      // Transform to our article format
      const articles: ResearchArticle[] = pmcIds.map((id: string, index: number) => {
        const article = detailsData.result[id];
        if (!article) return null;

        const pmcid = `PMC${id}`;
        
        return {
          id,
          pmcid,
          title: article.title || 'Untitled',
          authors: article.authors?.slice(0, 3).map((a: any) => a.name).join(', '),
          authorCount: article.authors?.length,
          journal: article.fulljournalname || article.source,
          publishedDate: article.pubdate,
          publicationYear: article.pubdate ? new Date(article.pubdate).getFullYear() : undefined,
          abstract: article.abstract,
          studyType: article.articletype,
          researchArea: category,
          relevanceScore: 100 - (index * 5), // Simple relevance scoring
          rank: index + 1 + offset,
          fullTextAvailable: true,
          links: {
            pmcWebsite: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`,
            pubmedLink: article.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/` : undefined,
            pdfDownload: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/`,
            doi: article.doi,
          },
          category,
          bookmarked: bookmarks.some(b => b.id === id),
        };
      }).filter(Boolean) as ResearchArticle[];

      return articles;
    } catch (error) {
      console.error('Failed to search articles:', error);
      // Return mock data on error
      return this.getMockArticles(params.category);
    }
  }

  /**
   * Get article details by ID
   */
  async getArticle(id: string): Promise<ResearchArticle | null> {
    try {
      const detailsUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id=${id}&retmode=json`;
      
      const response = await fetchWithLogging(detailsUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }

      const data = await response.json();
      const article = data.result[id];

      if (!article) {
        return null;
      }

      const pmcid = `PMC${id}`;
      const bookmarks = await this.getBookmarks();

      return {
        id,
        pmcid,
        title: article.title || 'Untitled',
        authors: article.authors?.map((a: any) => a.name).join(', '),
        authorCount: article.authors?.length,
        journal: article.fulljournalname || article.source,
        publishedDate: article.pubdate,
        publicationYear: article.pubdate ? new Date(article.pubdate).getFullYear() : undefined,
        abstract: article.abstract,
        studyType: article.articletype,
        fullTextAvailable: true,
        links: {
          pmcWebsite: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`,
          pubmedLink: article.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/` : undefined,
          pdfDownload: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/`,
          doi: article.doi,
        },
        bookmarked: bookmarks.some(b => b.id === id),
      };
    } catch (error) {
      console.error('Failed to get article:', error);
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
      console.error('Failed to get recommendations:', error);
      return this.getMockArticles();
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
