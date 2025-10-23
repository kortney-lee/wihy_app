// Simple newsService stub for user app
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  description?: string; // Optional description field
  url: string;
  link?: string; // Alternative URL field
  source: string;
  publishedDate: string;
  pubDate?: string; // Alternative date field
  category: string;
  tags: string[];
  media_url?: string; // Optional media URL
  media_thumb_url?: string; // Optional thumbnail URL
  relevanceScore?: number; // Optional relevance score
}

export const fetchNewsFeed = async (categories?: string[], limit?: number): Promise<{ success: boolean; articles: NewsArticle[] }> => {
  // Stub implementation - in a real app this would connect to the news API
  return {
    success: true,
    articles: [
      {
        id: '1',
        title: 'Sample Health News',
        summary: 'This is a sample news article for the user dashboard.',
        url: '#',
        source: 'Health Source',
        publishedDate: new Date().toISOString(),
        category: 'general',
        tags: ['health', 'wellness']
      }
    ]
  };
};

export const getArticlesByCategory = async (category: string, limit?: number): Promise<{ success: boolean; articles: NewsArticle[] }> => {
  const result = await fetchNewsFeed([category], limit);
  return result;
};

export const refreshNewsFeed = async (): Promise<{ success: boolean; articles: NewsArticle[] }> => {
  // Refresh news feed - stub implementation
  return await fetchNewsFeed();
};

export const searchNewsArticles = async (query: string, limit?: number): Promise<{ success: boolean; articles: NewsArticle[] }> => {
  // Search news articles - stub implementation
  return await fetchNewsFeed(undefined, limit);
};