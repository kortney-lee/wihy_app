import React, { useState, useEffect, useRef } from 'react';
import { fetchNewsFeed, getArticlesByCategory, NewsArticle } from '../services/newsService';
import { useNavigate } from 'react-router-dom';
import './HealthNewsFeed.css';

// Update the props interface at the top of the file:
interface NewsFeedProps {
  maxArticles?: number;
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
  onAnalyzeArticle?: (query: string) => void;
  setSearchQuery?: (query: string) => void;
  triggerSearch?: () => void;
}

const HealthNewsFeed: React.FC<NewsFeedProps> = ({ 
  maxArticles = 6,
  selectedCategory = 'all',
  onCategorySelect,
  onAnalyzeArticle,
  setSearchQuery,
  triggerSearch
}) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingArticle, setAnalyzingArticle] = useState<string | null>(null);
  const [currentMaxArticles, setCurrentMaxArticles] = useState(maxArticles);
  
  // Scroll tracking refs
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

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

  // Update currentMaxArticles when maxArticles prop changes
  useEffect(() => {
    setCurrentMaxArticles(maxArticles);
  }, [maxArticles]);

  useEffect(() => {
    fetchHealthNews();
  }, [selectedCategory, currentMaxArticles]);

  // Scroll handler for loading more articles
  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const scrollDirection = scrollTop > lastScrollY.current ? 'down' : 'up';
    
    // Load more articles when scrolling up and near the top
    if (scrollDirection === 'up' && scrollTop < 100 && currentMaxArticles < 12) {
      setCurrentMaxArticles(prev => Math.min(prev + 3, 12));
    }

    lastScrollY.current = scrollTop;
    ticking.current = false;
  };

  const onScroll = () => {
    if (!ticking.current) {
      requestAnimationFrame(handleScroll);
      ticking.current = true;
    }
  };

  // Add scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', onScroll);
      };
    }
  }, []);

  const fetchHealthNews = async () => {
    setLoading(true);
    try {
      console.log('Fetching health news for category:', selectedCategory);
      
      let newsData;
      
      if (selectedCategory === 'all') {
        // Fetch all categories
        const response = await fetchNewsFeed();
        if (response.success && response.articles) {
          newsData = response.articles.slice(0, currentMaxArticles);
        }
      } else {
        // Fetch specific category
        const response = await getArticlesByCategory(selectedCategory);
        if (response.success && response.articles) {
          newsData = response.articles.slice(0, currentMaxArticles);
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
            hasMedia: true,
            hasAuthor: true,
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
            hasMedia: true,
            hasAuthor: true,
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
            hasMedia: true,
            hasAuthor: true,
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
            hasMedia: true,
            hasAuthor: true,
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
            hasMedia: false,
            hasAuthor: true,
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
            hasMedia: true,
            hasAuthor: false,
            thumbnailUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80",
            imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80",
            mediaType: "image",
            wordCount: 140,
            readingTime: 1,
            contentLength: 700
          },
          // ADD MORE MOCK ARTICLES FOR TESTING SCROLL
          {
            id: '7',
            title: 'The Science Behind Intermittent Fasting',
            summary: 'New research reveals how intermittent fasting affects metabolism and longevity.',
            url: 'https://www.nejm.org/intermittent-fasting',
            source: 'NEJM',
            domain: 'nejm.org',
            category: 'Nutrition & Diet',
            publishedDate: '2025-01-21T12:00:00Z',
            relevanceScore: 0.93,
            tags: ['intermittent-fasting', 'metabolism', 'longevity'],
            hasMedia: true,
            hasAuthor: true,
            thumbnailUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80",
            imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
            mediaType: "image",
            author: "Dr. John Smith",
            wordCount: 220,
            readingTime: 2,
            contentLength: 1100
          },
          {
            id: '8',
            title: 'Vitamin D Deficiency: A Global Health Crisis',
            summary: 'Studies show alarming rates of vitamin D deficiency worldwide and its health implications.',
            url: 'https://www.who.int/vitamin-d-deficiency',
            source: 'WHO',
            domain: 'who.int',
            category: 'Public Health',
            publishedDate: '2025-01-21T10:00:00Z',
            relevanceScore: 0.88,
            tags: ['vitamin-d', 'deficiency', 'public-health'],
            hasMedia: true,
            hasAuthor: true,
            thumbnailUrl: "https://images.unsplash.com/photo-1559757175-8a5c71f5e34b?w=400&q=80",
            imageUrl: "https://images.unsplash.com/photo-1559757175-8a5c71f5e34b?w=800&q=80",
            mediaType: "image",
            author: "Dr. Maria Garcia",
            wordCount: 190,
            readingTime: 1,
            contentLength: 950
          },
          {
            id: '9',
            title: 'AI in Healthcare: Revolutionizing Diagnosis',
            summary: 'Artificial intelligence is transforming how doctors diagnose diseases with unprecedented accuracy.',
            url: 'https://www.nature.com/ai-healthcare',
            source: 'Nature',
            domain: 'nature.com',
            category: 'Medical Research',
            publishedDate: '2025-01-21T08:00:00Z',
            relevanceScore: 0.96,
            tags: ['ai', 'healthcare', 'diagnosis'],
            hasMedia: true,
            hasAuthor: true,
            thumbnailUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80",
            imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
            mediaType: "image",
            author: "Dr. Alex Chen",
            wordCount: 280,
            readingTime: 2,
            contentLength: 1400
          }
        ];

        // Filter by category if not 'all'
        const filteredArticles = selectedCategory === 'all' 
          ? mockArticles 
          : mockArticles.filter(article => article.category === selectedCategory);

        setArticles(filteredArticles.slice(0, currentMaxArticles));
      }
    } catch (error) {
      console.error('Error fetching health news:', error);
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

  const handleAnalyzeWithWihy = async (article: NewsArticle, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const analysisQuery = `Analyze this health article and provide a comprehensive review with scoring:

Article Title: "${article.title}"
Summary: ${article.summary}
Category: ${article.category}
Source: ${article.source}

Please provide:
1. A detailed explanation of the health implications
2. Key takeaways and actionable insights  
3. Scientific accuracy assessment (1-10 score)
4. Practical applicability rating (1-10 score)
5. Overall credibility score (1-10 score)
6. How this relates to overall wellness and health optimization
7. Any potential concerns or limitations of the research
8. Recommendations for readers based on this information

Format the response with clear sections and scoring breakdown.`;

    if (setSearchQuery && triggerSearch) {
      setSearchQuery(analysisQuery);
      triggerSearch();
    } else if (onAnalyzeArticle) {
      onAnalyzeArticle(analysisQuery);
    }
  };

  if (loading) {
    return (
      <div className="news-feed-container">
        <div className="news-feed-header">
          <h2>Latest Health News</h2>
        </div>
        <div className="loading-news">
          <img 
            src="/assets/whatishealthyspinner.gif" 
            alt="Loading..." 
            style={{
              width: '48px',
              height: '48px',
              objectFit: 'contain',
              marginBottom: '16px'
            }}
          />
          <p>Loading latest health news...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="news-feed-container" ref={containerRef}>
      <div className="news-categories">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => onCategorySelect?.(category.id)}
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
            data-category={article.category}
            onClick={() => window.open(article.url, '_blank')}
          >
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
                <button 
                  className="analyze-wihy-btn"
                  onClick={(e) => handleAnalyzeWithWihy(article, e)}
                  disabled={analyzingArticle === article.id}
                  style={{
                    background: analyzingArticle === article.id 
                      ? 'linear-gradient(#f3f4f6, #f3f4f6)' 
                      : 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fbbc05, #34a853, #1a73e8) border-box',
                    border: '2px solid transparent',
                    borderRadius: '16px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: analyzingArticle === article.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#1f2937',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    backgroundSize: '100% 100%, 200% 100%',
                    opacity: analyzingArticle === article.id ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (analyzingArticle !== article.id) {
                      e.currentTarget.style.animation = 'wiH-border-sweep 2.2s linear infinite';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.animation = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {analyzingArticle === article.id ? (
                    <>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid #1f2937',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Analyzing...
                    </>
                  ) : (
                    <>🧠 Analyze with WIHY</>
                  )}
                </button>
                
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
    </div>
  );
};

export default HealthNewsFeed;