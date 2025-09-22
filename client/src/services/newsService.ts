const NEWS_API_KEY = process.env.REACT_APP_NEWS_API_KEY;

export class NewsService {
  private static readonly BASE_URL = 'https://newsapi.org/v2';
  
  static async fetchHealthNews(category: string = 'health', pageSize: number = 6) {
    try {
      const params = new URLSearchParams({
        q: `health ${category !== 'all' ? category : ''}`,
        category: 'health',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: pageSize.toString(),
        apiKey: NEWS_API_KEY || ''
      });

      const response = await fetch(`${this.BASE_URL}/everything?${params}`);
      const data = await response.json();
      
      return data.articles?.map((article: any) => ({
        id: article.url,
        title: article.title,
        summary: article.description,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        imageUrl: article.urlToImage,
        category: this.categorizeArticle(article.title + ' ' + article.description)
      })) || [];
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }
  
  private static categorizeArticle(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes('nutrition') || lower.includes('diet') || lower.includes('food')) return 'nutrition';
    if (lower.includes('exercise') || lower.includes('fitness') || lower.includes('workout')) return 'fitness';
    if (lower.includes('mental') || lower.includes('anxiety') || lower.includes('depression')) return 'mental-health';
    if (lower.includes('research') || lower.includes('study') || lower.includes('medical')) return 'medical';
    if (lower.includes('wellness') || lower.includes('lifestyle')) return 'wellness';
    return 'general';
  }
}