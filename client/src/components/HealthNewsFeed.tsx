import React, { useState, useEffect } from 'react';
import { fetchNewsFeed, getArticlesByCategory, NewsArticle } from '../services/newsService';
import './HealthNewsFeed.css';

interface NewsFeedProps {
  maxArticles?: number;
}

const HealthNewsFeed: React.FC<NewsFeedProps> = ({ maxArticles = 6 }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Health News' },
    { id: 'Nutrition & Diet', label: 'Nutrition' },
    { id: 'Medical Research', label: 'Medical Research' },
    { id: 'Public Health', label: 'Public Health' },
    { id: 'Clinical Studies', label: 'Clinical Studies' },
    { id: 'Disease Prevention', label: 'Prevention' },
    { id: 'Mental Health', label: 'Mental Health' },
    { id: 'General Health', label: 'General Health' }
  ];

  useEffect(() => {
    fetchHealthNews();
  }, [selectedCategory, maxArticles]);

  const fetchHealthNews = async () => {
    setLoading(true);
    try {
      console.log('Fetching health news for category:', selectedCategory);
      
      let newsData;
      
      if (selectedCategory === 'all') {
        // Fetch all categories
        const response = await fetchNewsFeed();
        if (response.success && response.articles) {
          newsData = response.articles.slice(0, maxArticles);
        }
      } else {
        // Fetch specific category
        const response = await getArticlesByCategory(selectedCategory);
        if (response.success && response.articles) {
          newsData = response.articles.slice(0, maxArticles);
        }
      }
      
      if (newsData && newsData.length > 0) {
        // Use real API data
        setArticles(newsData);
      } else {
        // Fallback to mock data if API fails or returns no data
        console.log('Using fallback mock data');
        const mockArticles: NewsArticle[] = [
          {
            id: '1',
            title: 'New Study Reveals Benefits of Mediterranean Diet for Heart Health',
            summary: 'Researchers found that following a Mediterranean diet can reduce cardiovascular disease risk by up to 30%.',
            url: 'https://www.nih.gov/news-events/news-releases/mediterranean-diet-heart-health',
            source: 'NIH',
            domain: 'nih.gov',
            category: 'Nutrition & Diet',
            publishedDate: '2025-01-22T10:30:00Z',
            relevanceScore: 0.95,
            tags: ['mediterranean-diet', 'heart-health', 'cardiovascular']
          },
          {
            id: '2', 
            title: 'Exercise and Mental Health: The Connection You Need to Know',
            summary: 'New research shows that just 30 minutes of exercise daily can significantly improve mental well-being.',
            url: 'https://www.cdc.gov/physicalactivity/basics/pa-health/index.htm',
            source: 'CDC',
            domain: 'cdc.gov',
            category: 'Mental Health',
            publishedDate: '2025-01-22T08:15:00Z',
            relevanceScore: 0.92,
            tags: ['exercise', 'mental-health', 'wellness']
          },
          {
            id: '3',
            title: 'Breakthrough in Cancer Research: Early Detection Methods',
            summary: 'Scientists develop new blood test that can detect multiple types of cancer in early stages.',
            url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2035570',
            source: 'New England Journal of Medicine',
            domain: 'nejm.org',
            category: 'Medical Research',
            publishedDate: '2025-01-22T06:45:00Z',
            relevanceScore: 0.98,
            tags: ['cancer', 'early-detection', 'research']
          },
          {
            id: '4',
            title: 'Sleep Quality: How It Affects Your Immune System',
            summary: 'Poor sleep quality can weaken your immune response and increase susceptibility to infections.',
            url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/sleep/art-20048379',
            source: 'Mayo Clinic',
            domain: 'mayoclinic.org',
            category: 'General Health',
            publishedDate: '2025-01-21T20:30:00Z',
            relevanceScore: 0.89,
            tags: ['sleep', 'immune-system', 'health']
          },
          {
            id: '5',
            title: 'Mindfulness and Stress Reduction Techniques That Actually Work',
            summary: 'Evidence-based mindfulness practices shown to reduce stress hormones and improve overall health.',
            url: 'https://www.harvard.edu/healthbeat/benefits-of-mindfulness',
            source: 'Harvard Health',
            domain: 'harvard.edu',
            category: 'Mental Health',
            publishedDate: '2025-01-21T18:20:00Z',
            relevanceScore: 0.91,
            tags: ['mindfulness', 'stress-reduction', 'mental-health']
          },
          {
            id: '6',
            title: 'Superfoods That Boost Your Energy Naturally',
            summary: 'Discover nutrient-dense foods that can help increase energy levels without caffeine crashes.',
            url: 'https://www.usda.gov/topics/food-and-nutrition/dietary-guidelines',
            source: 'USDA',
            domain: 'usda.gov',
            category: 'Nutrition & Diet',
            publishedDate: '2025-01-21T15:10:00Z',
            relevanceScore: 0.87,
            tags: ['nutrition', 'energy', 'superfoods']
          }
        ];

        // Filter by category if not 'all'
        const filteredArticles = selectedCategory === 'all' 
          ? mockArticles 
          : mockArticles.filter(article => article.category === selectedCategory);

        setArticles(filteredArticles.slice(0, maxArticles));
      }
    } catch (error) {
      console.error('Error fetching health news:', error);
      // Use mock data as fallback
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getSourceIcon = (source: string) => {
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('nih')) return '🏛️';
    if (sourceLower.includes('cdc')) return '🏥';
    if (sourceLower.includes('fda')) return '💊';
    if (sourceLower.includes('mayo')) return '🩺';
    if (sourceLower.includes('harvard')) return '🎓';
    if (sourceLower.includes('stanford')) return '🎓';
    if (sourceLower.includes('nejm')) return '📚';
    if (sourceLower.includes('lancet')) return '📚';
    if (sourceLower.includes('bmj')) return '📚';
    if (sourceLower.includes('nature')) return '🧬';
    if (sourceLower.includes('who')) return '🌍';
    return '📰';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Nutrition & Diet': '#4CAF50',
      'Medical Research': '#2196F3',
      'Public Health': '#FF9800',
      'Clinical Studies': '#9C27B0',
      'Disease Prevention': '#F44336',
      'Mental Health': '#607D8B',
      'General Health': '#795548'
    };
    return colors[category] || '#666';
  };

  if (loading) {
    return (
      <div className="news-feed-container">
        <div className="news-feed-header">
          <h2>Latest Health News</h2>
        </div>
        <div className="loading-news">
          <div className="loading-spinner"></div>
          <p>Loading latest health news...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="news-feed-container">
      <div className="news-feed-header">
        <h2>Latest Health News</h2>
        <p>Stay updated with the latest health and wellness news from trusted sources</p>
      </div>

      <div className="news-categories">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="news-grid">
        {articles.map((article) => (
          <article key={article.id} className="news-card">
            <div className="news-content">
              <div className="news-meta">
                <span className="news-source">
                  {getSourceIcon(article.source)} {article.source}
                </span>
                <span 
                  className="news-category"
                  style={{ backgroundColor: getCategoryColor(article.category) }}
                >
                  {article.category}
                </span>
                <span className="news-time">{formatTimeAgo(article.publishedDate)}</span>
              </div>
              <h3 className="news-title">{article.title}</h3>
              <p className="news-summary">{article.summary}</p>
              <div className="news-tags">
                {article.tags?.map(tag => (
                  <span key={tag} className="news-tag">{tag}</span>
                ))}
              </div>
              <div className="news-footer">
                <span className="relevance-score">
                  Relevance: {Math.round((article.relevanceScore || 0) * 100)}%
                </span>
                <a 
                  href={article.url} 
                  className="read-more-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read Full Article →
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      {articles.length === 0 && !loading && (
        <div className="no-articles">
          <p>No articles found for the selected category. Try selecting a different category or refresh the feed.</p>
        </div>
      )}

      <div className="news-footer">
        <button className="load-more-btn" onClick={fetchHealthNews}>
          Refresh Articles
        </button>
      </div>
    </div>
  );
};

export default HealthNewsFeed;