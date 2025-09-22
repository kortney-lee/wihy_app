import React, { useState, useEffect } from 'react';
import { NewsService } from '../services/newsService';
import './HealthNewsFeed.css';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  category: string;
}

interface NewsFeedProps {
  maxArticles?: number;
}

const HealthNewsFeed: React.FC<NewsFeedProps> = ({ maxArticles = 6 }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Health News' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'fitness', label: 'Fitness' },
    { id: 'mental-health', label: 'Mental Health' },
    { id: 'medical', label: 'Medical Research' },
    { id: 'wellness', label: 'Wellness' }
  ];

  useEffect(() => {
    fetchHealthNews();
  }, [selectedCategory, maxArticles]);

  const fetchHealthNews = async () => {
    setLoading(true);
    try {
      console.log('Fetching health news for category:', selectedCategory);
      
      // Use NewsService to fetch real data
      const newsData = await NewsService.fetchHealthNews(selectedCategory, maxArticles);
      
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
            url: '#',
            source: 'Yahoo Health',
            publishedAt: '2025-01-22T10:30:00Z',
            imageUrl: '/assets/mediterranean-diet.jpg',
            category: 'nutrition'
          },
          {
            id: '2', 
            title: 'Exercise and Mental Health: The Connection You Need to Know',
            summary: 'New research shows that just 30 minutes of exercise daily can significantly improve mental well-being.',
            url: '#',
            source: 'MSN Health',
            publishedAt: '2025-01-22T08:15:00Z',
            imageUrl: '/assets/exercise-mental-health.jpg',
            category: 'fitness'
          },
          {
            id: '3',
            title: 'Breakthrough in Cancer Research: Early Detection Methods',
            summary: 'Scientists develop new blood test that can detect multiple types of cancer in early stages.',
            url: '#',
            source: 'Bing News',
            publishedAt: '2025-01-22T06:45:00Z',
            imageUrl: '/assets/cancer-research.jpg',
            category: 'medical'
          },
          {
            id: '4',
            title: 'Sleep Quality: How It Affects Your Immune System',
            summary: 'Poor sleep quality can weaken your immune response and increase susceptibility to infections.',
            url: '#',
            source: 'Yahoo Health',
            publishedAt: '2025-01-21T20:30:00Z',
            imageUrl: '/assets/sleep-health.jpg',
            category: 'wellness'
          },
          {
            id: '5',
            title: 'Mindfulness and Stress Reduction Techniques That Actually Work',
            summary: 'Evidence-based mindfulness practices shown to reduce stress hormones and improve overall health.',
            url: '#',
            source: 'MSN Health',
            publishedAt: '2025-01-21T18:20:00Z',
            imageUrl: '/assets/mindfulness.jpg',
            category: 'mental-health'
          },
          {
            id: '6',
            title: 'Superfoods That Boost Your Energy Naturally',
            summary: 'Discover nutrient-dense foods that can help increase energy levels without caffeine crashes.',
            url: '#',
            source: 'Bing News',
            publishedAt: '2025-01-21T15:10:00Z',
            imageUrl: '/assets/superfoods.jpg',
            category: 'nutrition'
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
    switch (source.toLowerCase()) {
      case 'yahoo health':
        return '🟣';
      case 'msn health':
        return '🔵';
      case 'bing news':
        return '🟢';
      default:
        return '📰';
    }
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
            {article.imageUrl && (
              <div className="news-image">
                <img 
                  src={article.imageUrl} 
                  alt={article.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="news-content">
              <div className="news-meta">
                <span className="news-source">
                  {getSourceIcon(article.source)} {article.source}
                </span>
                <span className="news-time">{formatTimeAgo(article.publishedAt)}</span>
              </div>
              <h3 className="news-title">{article.title}</h3>
              <p className="news-summary">{article.summary}</p>
              <a 
                href={article.url} 
                className="read-more-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read Full Article →
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="news-footer">
        <button className="load-more-btn" onClick={fetchHealthNews}>
          Load More Articles
        </button>
      </div>
    </div>
  );
};

export default HealthNewsFeed;