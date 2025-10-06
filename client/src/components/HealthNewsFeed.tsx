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
            tags: ['mediterranean-diet', 'heart-health', 'cardiovascular'],
            // ADDED: Required fields
            hasMedia: true,
            hasAuthor: true,
            // ADDED: Optional enhanced fields
            thumbnailUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
            imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
            mediaType: "image",
            author: "Dr. Sarah Johnson",
            wordCount: 150,
            readingTime: 1,
            contentLength: 750
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
            tags: ['exercise', 'mental-health', 'wellness'],
            // ADDED: Required fields
            hasMedia: true,
            hasAuthor: true,
            // ADDED: Optional enhanced fields
            thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
            imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
            mediaType: "image",
            author: "Dr. Michael Chen",
            wordCount: 180,
            readingTime: 1,
            contentLength: 900
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
            tags: ['cancer', 'early-detection', 'research'],
            // ADDED: Required fields
            hasMedia: true,
            hasAuthor: true,
            // ADDED: Optional enhanced fields
            thumbnailUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&q=80",
            imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&q=80",
            mediaType: "image",
            author: "Dr. Robert Kim",
            wordCount: 250,
            readingTime: 2,
            contentLength: 1250
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
            tags: ['sleep', 'immune-system', 'health'],
            // ADDED: Required fields
            hasMedia: true,
            hasAuthor: true,
            // ADDED: Optional enhanced fields
            thumbnailUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&q=80",
            imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&q=80",
            mediaType: "image",
            author: "Dr. Lisa Rodriguez",
            wordCount: 200,
            readingTime: 1,
            contentLength: 1000
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
            tags: ['mindfulness', 'stress-reduction', 'mental-health'],
            // ADDED: Required fields
            hasMedia: false,
            hasAuthor: true,
            // ADDED: Optional enhanced fields
            author: "Dr. Amanda White",
            wordCount: 160,
            readingTime: 1,
            contentLength: 800
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
            tags: ['nutrition', 'energy', 'superfoods'],
            // ADDED: Required fields
            hasMedia: true,
            hasAuthor: false,
            // ADDED: Optional enhanced fields
            thumbnailUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80",
            imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80",
            mediaType: "image",
            wordCount: 140,
            readingTime: 1,
            contentLength: 700
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

  const getSourceInitials = (source: string) => {
    return source
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
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

  const getPlaceholderImage = (category: string) => {
    const placeholders: Record<string, string> = {
      'Nutrition & Diet': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=200&fit=crop',
      'Medical Research': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop',
      'Public Health': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=200&fit=crop',
      'Clinical Studies': 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=200&fit=crop',
      'Disease Prevention': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=200&fit=crop',
      'Mental Health': 'https://images.unsplash.com/photo-1559757175-8a5c71f5e34b?w=400&h=200&fit=crop',
      'General Health': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop'
    };
    return placeholders[category] || 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop';
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
          <article 
            key={article.id} 
            className="news-card"
            onClick={() => window.open(article.url, '_blank')}
          >
            {/* Image Section */}
            <div className="news-image">
              {article.thumbnailUrl ? (
                <img 
                  src={article.thumbnailUrl} 
                  alt={article.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getPlaceholderImage(article.category);
                  }}
                />
              ) : (
                <img 
                  src={getPlaceholderImage(article.category)} 
                  alt={article.title}
                />
              )}
            </div>

            <div className="news-content">
              <div className="news-meta">
                <span className="news-source">
                  <span className="source-avatar">
                    {getSourceInitials(article.source)}
                  </span>
                  {article.source}
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
                {article.tags?.slice(0, 3).map(tag => (
                  <span key={tag} className="news-tag">#{tag}</span>
                ))}
              </div>
              
              <div className="news-footer">
                <span className="relevance-score">
                  Relevance: {Math.round((article.relevanceScore || 0) * 100)}%
                </span>
                <span className="read-more-btn">
                  Read Full Article →
                </span>
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