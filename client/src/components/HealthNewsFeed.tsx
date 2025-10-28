import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAllNews, getLazyLoadedNews, NewsArticle, ARTICLES_PER_PAGE } from '../services/newsService';
import { useNavigate } from 'react-router-dom';
import { getApiEndpoint } from '../config/apiConfig';
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
  return '/assets/wihylogo.png'; // Adjust path as needed
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
  const navigate = useNavigate();
  
  const prevFetchParamsRef = useRef<{max: number}>({max: 0});
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch initial articles when component mounts or maxArticles changes
  useEffect(() => {
    // Only fetch if maxArticles actually changed
    const prevParams = prevFetchParamsRef.current;
    if (prevParams.max !== maxArticles) {
      prevFetchParamsRef.current = {max: maxArticles};
      setCurrentPage(1); // Reset to first page when changing parameters
      setHasMorePages(true); // Reset pagination state
      fetchHealthNews(true); // true means reset (first page)
    }
  }, [maxArticles]);

  // Ensure news loads on mobile immediately with better pagination control
  useEffect(() => {
    // Always ensure news loads immediately if no articles
    if (articles.length === 0 && !loading) {
      fetchHealthNews(true);
    }
    
    // On mobile, disable infinite scroll if user has scrolled up significantly
    if (isMobile) {
      const handleMobilePagination = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // If user is near the top of the page, enable normal scrolling
        if (scrollTop < windowHeight) {
          setScrollDirection('up');
        }
      };
      
      window.addEventListener('scroll', handleMobilePagination, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', handleMobilePagination);
      };
    }
  }, [isMobile, articles.length, loading]);

  // Track scroll direction for better mobile experience
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const lastScrollTop = useRef(0);

  // Set up intersection observer for infinite scroll with improved mobile handling
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    
    // Only trigger pagination if:
    // 1. Element is intersecting
    // 2. Not currently loading
    // 3. Has more pages
    // 4. User is scrolling down (not up)
    // 5. Add a small delay to prevent rapid triggering
    if (target.isIntersecting && 
        !loading && 
        !loadingMore && 
        hasMorePages && 
        scrollDirection === 'down') {
      
      // Add a small delay to ensure user intent
      setTimeout(() => {
        // Double-check conditions after delay
        if (!loading && !loadingMore && hasMorePages) {
          fetchHealthNews(false); // false means don't reset, load more
        }
      }, 300);
    }
  }, [loading, loadingMore, hasMorePages, scrollDirection]);

  // Track scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (currentScrollTop > lastScrollTop.current + 50) {
        // Scrolling down with some threshold to avoid jitter
        setScrollDirection('down');
      } else if (currentScrollTop < lastScrollTop.current - 50) {
        // Scrolling up with some threshold
        setScrollDirection('up');
      }
      
      lastScrollTop.current = currentScrollTop;
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, []);

  useEffect(() => {
    const element = observerTarget.current;
    const option = {
      root: null,
      rootMargin: '100px', // Increased margin to give more buffer
      threshold: 0.1,
    };
    
    const observer = new IntersectionObserver(handleObserver, option);
    
    if (element) observer.observe(element);
    
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  // Update the fetchHealthNews function with better mobile pagination control

  const fetchHealthNews = async (resetPage: boolean = true) => {
    // Prevent excessive loading on mobile when scrolling up
    if (isMobile && !resetPage && scrollDirection === 'up') {
      return;
    }
    
    if (resetPage) {
      setLoading(true);
      setCurrentPage(1);
    } else {
      setLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }

    try {
      const page = resetPage ? 1 : currentPage + 1;
      
      // Use lazy loading system: fetch 100 results, cache for 5 mins, append 12 per page
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
    }
  };
  
  // Replace the handleAnalyzeWithWihy function (lines 471-493)

  const handleAnalyzeWithWihy = async (article: NewsArticle, e: React.MouseEvent) => {
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
    }
    
    // Reset analyzing state after delay
    setTimeout(() => setAnalyzingArticle(null), 2000);
  };
  
  if (loading && currentPage === 1) {
    return (
      <div className="news-feed-container">
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
    <div className="news-feed-container">
      <div className="news-grid">
        {articles.map((article) => (
          <article 
            key={article.id} 
            className="news-card"
            data-category={article.category || article.ai_category}
            onClick={() => window.open(article.link || article.url, '_blank')}
          >
            {/* Image Section - Using images from vHealth News API */}
            <div className="news-image">
              {(() => {
                const imageUrl = article.image_url || article.media_url || article.media_thumb_url;
                const hasValidImage = article.has_image && imageUrl && imageUrl !== null;
                
                // Debug: Log image data for troubleshooting (only in development)
                if (process.env.NODE_ENV === 'development') {
                  console.log('🖼️ Article image debug:', {
                    id: article.id,
                    title: article.title?.substring(0, 50) + '...',
                    image_url: article.image_url,
                    has_image: article.has_image,
                    image_status: article.image_status,
                    image_source: article.image_source,
                    finalImageUrl: imageUrl,
                    hasValidImage: hasValidImage
                  });
                }
                
                // Use API image if available and valid
                if (hasValidImage) {
                  return (
                    <img 
                      src={imageUrl} 
                      alt={article.title}
                      onError={(e) => {
                        console.log('Image failed to load:', imageUrl);
                        // Use WiHy logo as fallback
                        (e.target as HTMLImageElement).src = getWiHyLogoFallback();
                        // Add placeholder class for styling
                        (e.target as HTMLImageElement).classList.add('placeholder-image');
                      }}
                    />
                  );
                } else {
                  // Simple placeholder without overlay
                  return (
                    <img 
                      src={getWiHyLogoFallback()}
                      alt={article.title || 'Health article'}
                      className="placeholder-image"
                    />
                  );
                }
              })()}
            </div>
            
            {/* Content Section */}
            <div className="news-content">
              {/* Meta Information */}
              <div className="news-meta">
                {/* Analyze with WIHY Button - Updated with Wrapper */}
                {onAnalyzeArticle && (
                  <div className="wihy-btn-wrapper" style={{
                    display: 'inline-block',
                    animation: analyzingArticle === article.id ? 'none' : 'wiH-border-sweep 2.2s linear infinite',
                    background: analyzingArticle === article.id 
                      ? 'linear-gradient(#f3f4f6, #f3f4f6)' 
                      : 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
                    backgroundSize: '100% 100%, 200% 100%',
                    border: '2px solid transparent',
                    borderRadius: '16px'
                  }}>
                    <button 
                      className="analyze-wihy-btn"
                      onClick={(e) => handleAnalyzeWithWihy(article, e)}
                      disabled={analyzingArticle === article.id}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '16px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: analyzingArticle === article.id ? 'not-allowed' : 'pointer',
                        boxShadow: 'none',
                        transform: 'none'
                      }}
                    >
                      {analyzingArticle === article.id ? (
                        <>
                          <div className="analyze-spinner"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>Analyze with WiHy</>
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
            height: '200px', // Increased height for better mobile detection
            margin: '40px 0', 
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