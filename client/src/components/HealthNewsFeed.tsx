import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAllNews, getLazyLoadedNews, NewsArticle, ARTICLES_PER_PAGE } from '../services/newsService';
import { useNavigate } from 'react-router-dom';
// import { getApiEndpoint } from '../config/apiConfig';
import { CSS_CLASSES } from '../constants/cssConstants';
import './HealthNewsFeed.css';

// Update the props interface to receive the search functions
interface NewsFeedProps {
  maxArticles?: number;
  onAnalyzeArticle?: (query: string) => void;
  setSearchQuery?: (query: string) => void;
  triggerSearch?: (customQuery?: string) => void;
}

// Helper function to get WiHy logo as fallback
const getWiHyLogoFallback = (): string => {
  // Use the WiHy logo as fallback instead of random placeholder images
  return '/assets/wihylogo.png?v=2025-11-05'; // Adjust path as needed
};

// Helper function to get a color based on category
const getCategoryColor = (category?: string) => {
  if (!category) return '#ffeb2b';
  
  const colors: {[key: string]: string} = {
    'Nutrition': '#4caf50',
    'Medical Research': '#2196f3',
    'Public Health': '#ff9800',
    'Clinical Studies': '#9c27b0',
    'Prevention': '#f44336',
    'Mental Health': '#03a9f4',
    'General Health': '#ffeb3b',
    'Environment': '#22c55e',
    'Technology': '#607d8b',
    'General News': '#9e9e9e',
    'Health Technology': '#00bcd4',
    'Medical Technology': '#3f51b5'
  };
  
  return colors[category] || '#ffeb2b';
};

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return 'Recently';
  
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
};

const HealthNewsFeed: React.FC<NewsFeedProps> = ({ 
  maxArticles = 6, 
  onAnalyzeArticle = (query: string) => {
    // Default implementation that will ensure the button always appears
    // You could show a toast notification here or redirect to the analysis page
    window.open(`/analyze?query=${encodeURIComponent(query)}`, '_blank');
  },
  setSearchQuery,
  triggerSearch
}) => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [analyzingArticle, setAnalyzingArticle] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const _navigate = useNavigate();
  
  const prevFetchParamsRef = useRef<{max: number}>({max: 0});
  const observerTarget = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false); // Prevent multiple simultaneous requests

  // Fetch initial articles when component mounts or maxArticles changes
  useEffect(() => {
    // Only fetch if maxArticles actually changed
    const prevParams = prevFetchParamsRef.current;
    if (prevParams.max !== maxArticles) {
      prevFetchParamsRef.current = {max: maxArticles};
      setCurrentPage(1); // Reset to first page when changing parameters
      setHasMorePages(true); // Reset pagination state
      // Note: fetchHealthNews will be called by the mount effect
    }
  }, [maxArticles]);

  // Ensure news loads on initial mount - separate from fetchHealthNews to avoid dependency issues
  useEffect(() => {
    console.log('📱 Component mounted - triggering initial news load');
    // Trigger initial load directly here to avoid stale closure issues
    const loadInitialNews = async () => {
      if (fetchingRef.current) {
        console.log('📱 Already fetching, skipping initial load');
        return;
      }
      
      fetchingRef.current = true;
      setLoading(true);
      setCurrentPage(1);
      
      try {
        const response = await getLazyLoadedNews(1);
        
        if (response.success && response.newArticles && response.newArticles.length > 0) {
          setArticles(response.newArticles);
          setHasMorePages(response.hasNextPage);
        } else {
          // Fallback
          const fallbackResponse = await getAllNews(ARTICLES_PER_PAGE);
          if (fallbackResponse.success && fallbackResponse.articles) {
            setArticles(fallbackResponse.articles);
            setHasMorePages(fallbackResponse.articles.length >= ARTICLES_PER_PAGE);
          } else {
            setArticles([]);
            setHasMorePages(false);
          }
        }
      } catch (error) {
        console.error('Error loading initial news:', error);
        setArticles([]);
        setHasMorePages(false);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };
    
    loadInitialNews();
  }, []); // Only run on mount

  // Simplified mobile scroll handling - remove competing scroll listeners
  // Mobile pagination is handled by intersection observer only

  // Removed scroll direction tracking for smoother mobile performance

  // Simplified fetchHealthNews function for smoother mobile experience
  const fetchHealthNews = useCallback(async (resetPage: boolean = true) => {
    // Simple duplicate request prevention
    if (loading || loadingMore || fetchingRef.current) {
      return;
    }
    
    fetchingRef.current = true; // Set fetching flag
    console.log('📱 Fetching health news:', { resetPage, currentPage, hasMorePages });
    
    if (resetPage) {
      setLoading(true);
      setCurrentPage(1);
    } else {
      setLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }

    try {
      const page = resetPage ? 1 : currentPage + 1;
      
      // Use lazy loading system: fetch 24 results, cache for 5 mins, append 8 per page
      const response = await getLazyLoadedNews(page);
      
      if (response.success && response.newArticles && response.newArticles.length > 0) {
        if (resetPage) {
          // First load: show first page of articles
          setArticles(response.newArticles);
        } else {
          // Lazy loading: append new articles to existing ones
          setArticles(prev => [...prev, ...response.newArticles]);
        }
        
        // Use lazy loading info from the service
        setHasMorePages(response.hasNextPage);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📄 Lazy loading info:', {
            currentPage: response.currentPage,
            totalPages: response.totalPages,
            totalCount: response.totalCount,
            hasNextPage: response.hasNextPage,
            newArticlesLoaded: response.newArticles.length,
            totalArticlesLoaded: response.loadedCount
          });
        }
      } else {
        // Fallback: try old method if lazy loading fails
        const fallbackResponse = await getAllNews(ARTICLES_PER_PAGE);
        
        if (fallbackResponse.success && fallbackResponse.articles && fallbackResponse.articles.length > 0) {
          if (resetPage) {
            setArticles(fallbackResponse.articles);
          } else {
            setArticles(prev => [...prev, ...fallbackResponse.articles]);
          }
          setHasMorePages(fallbackResponse.articles.length >= ARTICLES_PER_PAGE);
        } else {
          if (resetPage) {
            setArticles([]);
          }
          setHasMorePages(false);
        }
      }
    } catch (error) {
      console.error('Error fetching health news:', error);
      if (resetPage) {
        setArticles([]);
      }
      setHasMorePages(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false; // Clear fetching flag
    }
  }, [loading, loadingMore, currentPage, hasMorePages]);

  // Simplified intersection observer for smooth mobile scrolling
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    
    // Simple trigger logic - no complex debouncing that causes stuttering
    if (target.isIntersecting && !loading && !loadingMore && hasMorePages) {
      fetchHealthNews(false); // false means don't reset, load more
    }
  }, [loading, loadingMore, hasMorePages, fetchHealthNews]);

  // Remove scroll direction tracking to eliminate choppy behavior
  // Intersection observer handles pagination smoothly without scroll interference

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;
    
    const option = {
      root: null,
      rootMargin: '150px', // Reduced margin for better mobile performance
      threshold: 0.1, // Higher threshold for more predictable triggering
    };
    
    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [handleObserver]);

  // Optimized analyze function with useCallback
  const handleAnalyzeWithWihy = useCallback(async (article: NewsArticle, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (analyzingArticle === article.id) return;
    
    setAnalyzingArticle(article.id);
    
    const searchQuery = `Analyze this health article: ${article.title}. 
Summary: ${article.summary || article.description || 'No description available'}.
Source: ${article.source || 'Unknown source'}
Category: ${article.category || article.ai_category || 'Uncategorized'}`;

    // Try to directly call WiHy API with enhanced analysis first
    try {
      const { wihyAPI } = await import('../services/wihyAPI');
      
      // Use the special analyzeWithWiHy method that always enables enhanced analysis
      const result = await wihyAPI.analyzeWithWiHy(
        searchQuery,
        {
          age: 35, // Default context
          health_concerns: ['general_health']
        },
        'HealthNewsFeed'
      );
      
      // Format the result for display
      const formattedResult = wihyAPI.formatResponse(result);
      
      // Set the search query for visual feedback
      if (setSearchQuery) {
        setSearchQuery(searchQuery);
      }
      
      // Trigger search with the enhanced result
      if (triggerSearch) {
        triggerSearch(formattedResult);
      } else if (onAnalyzeArticle) {
        onAnalyzeArticle(formattedResult);
      }
      
    } catch (wihyError) {
      console.error('Enhanced WiHy analysis failed, falling back to regular search:', wihyError);
      
      // Fallback to regular search behavior
      if (triggerSearch) {
        if (setSearchQuery) {
          setSearchQuery(searchQuery);
        }
        triggerSearch(searchQuery);
      } else {
        // FALLBACK: Directly manipulate DOM and submit the form
        const searchElement = document.querySelector('.search-input') as HTMLInputElement;
        if (searchElement) {
          searchElement.value = searchQuery;
          searchElement.focus();
          
          const form = searchElement.closest('form');
          if (form) {
            if (setSearchQuery) {
              setSearchQuery(searchQuery);
            }
            setTimeout(() => {
              form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }, 10);
          } else {
            if (setSearchQuery) {
              setSearchQuery(searchQuery);
            }
          }
        } else {
          if (setSearchQuery) {
            setSearchQuery(searchQuery);
          }
          if (onAnalyzeArticle) {
            onAnalyzeArticle(searchQuery);
          }
        }
      }
    } finally {
      // Reset analyzing state 
      setAnalyzingArticle(null);
    }
  }, [analyzingArticle, setSearchQuery, triggerSearch, onAnalyzeArticle]);
  
  if (loading && currentPage === 1) {
    return (
      <div className={CSS_CLASSES.NEWS_FEED_CONTAINER}>
        <div className={CSS_CLASSES.LOADING_NEWS}>
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
    <div className="news-feed-container">
      <div className="news-grid">
        {articles.map((article) => (
          <article 
            key={article.id} 
            className="news-card"
            data-category={article.category || article.ai_category}
            onClick={() => window.open(article.link || article.url, '_blank')}
          >
            {/* Image Section - Optimized */}
            <div className="news-image">
              <img 
                src={article.image_url || article.media_url || article.media_thumb_url || getWiHyLogoFallback()}
                alt={article.title || 'Health article'}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = getWiHyLogoFallback();
                  img.classList.add('placeholder-image');
                }}
                className={!(article.has_image && (article.image_url || article.media_url || article.media_thumb_url)) ? 'placeholder-image' : ''}
              />
            </div>
            
            {/* Content Section */}
            <div className="news-content">
              {/* Meta Information */}
              <div className="news-meta">
                {/* Analyze with WIHY Button - Optimized */}
                {onAnalyzeArticle && (
                  <div className={`wihy-btn-wrapper ${analyzingArticle === article.id ? 'analyzing' : ''}`}>
                    <button 
                      className="analyze-wihy-btn"
                      onClick={(e) => handleAnalyzeWithWihy(article, e)}
                      disabled={analyzingArticle === article.id}
                    >
                      {analyzingArticle === article.id ? (
                        <>
                          <div className="analyze-spinner"></div>
                          Analyzing...
                        </>
                      ) : (
                        'Analyze with WiHy'
                      )}
                    </button>
                  </div>
                )}
                
                {/* Source Tag */}
                <span 
                  className="news-category"
                  style={{ backgroundColor: getCategoryColor(article.category || article.ai_category) }}
                >
                  {article.category || article.ai_category}
                </span>
                <span className="news-time">{formatTimeAgo(article.pubDate || article.publishedDate || article.published_at)}</span>
              </div>
              
              <h3 className="news-title">{article.title}</h3>
              <p className="news-summary">{article.summary || article.description}</p>
              
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

      {/* Empty state */}
      {articles.length === 0 && !loading && (
        <div className="no-articles">
          <p>No health news articles available at the moment. Please try again later.</p>
        </div>
      )}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="loading-more">
          <div className="loading-spinner"></div>
          <p>Loading more articles...</p>
        </div>
      )}

      {/* Intersection Observer Target - invisible element that triggers loading when scrolled into view */}
      {hasMorePages && !loadingMore && articles.length > 0 && (
        <div
          ref={observerTarget} 
          className="intersection-observer-target"
          style={{ 
            height: '50px', // Smaller height for better mobile performance
            margin: '20px 0', 
            visibility: 'hidden',
            pointerEvents: 'none' // Prevent any interaction with this element
          }}
        />
      )}

      {/* Add a "Back to Top" button for mobile */}
      {isMobile && articles.length > 6 && (
        <button
          className="back-to-top-btn"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#fa5f06',
            color: 'white',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default HealthNewsFeed;