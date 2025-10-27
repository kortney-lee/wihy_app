import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchNewsFeed, getArticlesByCategory, NewsArticle } from '../services/newsService';
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
  if (!category) return '#94a3b8';
  
  const colors: {[key: string]: string} = {
    'Nutrition': '#4caf50',
    'Medical Research': '#2196f3',
    'Public Health': '#ff9800',
    'Clinical Studies': '#9c27b0',
    'Prevention': '#f44336',
    'Mental Health': '#03a9f4',
    'General Health': '#ffeb3b',
    'Environment': '#22c55e'
  };
  
  return colors[category] || '#94a3b8';
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
    console.log('Article analysis requested:', query);
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
      console.log(`Device detection: ${mobile ? 'Mobile' : 'Desktop'} (width: ${window.innerWidth}px)`);
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
    console.log('useEffect triggered - maxArticles:', maxArticles);
    
    // Only fetch if maxArticles actually changed
    const prevParams = prevFetchParamsRef.current;
    if (prevParams.max !== maxArticles) {
      console.log('Fetching due to parameter change - prev:', prevParams, 'new:', {max: maxArticles});
      prevFetchParamsRef.current = {max: maxArticles};
      setCurrentPage(1); // Reset to first page when changing parameters
      setHasMorePages(true); // Reset pagination state
      fetchHealthNews(true); // true means reset (first page)
    } else {
      console.log('No fetch needed - parameters unchanged');
    }
  }, [maxArticles]);

  // Ensure news loads on mobile immediately
  useEffect(() => {
    // Always ensure news loads immediately if no articles
    if (articles.length === 0 && !loading) {
      fetchHealthNews(true);
    }
  }, [isMobile]);

  // Set up intersection observer for infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && !loading && !loadingMore && hasMorePages) {
      fetchHealthNews(false); // false means don't reset, load more
    }
  }, [loading, loadingMore, hasMorePages]);

  useEffect(() => {
    const element = observerTarget.current;
    const option = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };
    
    const observer = new IntersectionObserver(handleObserver, option);
    
    if (element) observer.observe(element);
    
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver, observerTarget]);

  // Update the fetchHealthNews function with priority handling

  const fetchHealthNews = async (resetPage: boolean = true) => {
    if (resetPage) {
      setLoading(true);
      setCurrentPage(1);
    } else {
      setLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }

    try {
      const page = resetPage ? 1 : currentPage + 1;
      console.log('Fetching latest health news, page:', page);
      
      // Always fetch latest news without category filters
      const effectiveMaxArticles = isMobile ? Math.max(maxArticles, 12) : maxArticles; // Show more articles on mobile
      const response = await fetchNewsFeed([], effectiveMaxArticles * 2);
      console.log('Fetching latest news with no category filters');
      
      if (response.success && response.articles && response.articles.length > 0) {
        let processedArticles = response.articles;
        console.log(`Received ${processedArticles.length} articles from API`);
        
        // Debug: Log first few articles and their image data
        console.log('Sample articles with image data:');
        processedArticles.slice(0, 3).forEach((article, index) => {
          console.log(`Article ${index + 1}: "${article.title}"`);
          console.log(`  - image_url: ${article.image_url || 'none'}`);
          console.log(`  - media_url: ${article.media_url || 'none'}`);
          console.log(`  - media_thumb_url: ${article.media_thumb_url || 'none'}`);
          console.log(`  - category: ${article.category || article.ai_category || 'none'}`);
        });
        
        // Define health categories for priority sorting
        const healthCategories = [
          'Nutrition', 
          'Medical Research', 
          'Public Health', 
          'Clinical Studies', 
          'Prevention', 
          'Mental Health', 
          'General Health',
          'Environment'
        ];
        
        // Sort articles by category priority
        processedArticles = sortArticlesByPriority(response.articles, healthCategories);
        
        // Diversify sources
        processedArticles = diversifySources(processedArticles);
        
        // Limit to maxArticles if we're on the first page
        if (resetPage) {
          processedArticles = processedArticles.slice(0, effectiveMaxArticles);
        } else {
          // For subsequent pages, limit to maxArticles more
          processedArticles = processedArticles.slice(0, effectiveMaxArticles);
        }
        
        if (resetPage) {
          setArticles(processedArticles);
        } else {
          // Append new articles to existing ones
          setArticles(prev => [...prev, ...processedArticles]);
        }
        
        // If API doesn't provide pagination info, infer it from response length
        if ('pagination' in response && response.pagination && 
            typeof response.pagination === 'object' && 
            'has_next_page' in response.pagination) {
          setHasMorePages(response.pagination.has_next_page as boolean);
        } else {
          // If we received at least as many articles as we requested, assume there are more
          setHasMorePages(response.articles.length >= maxArticles);
        }
      } else {
        console.log('No articles found on page', page);
        // Try fallback approach
        try {
          const fallbackResponse = await fetch(getApiEndpoint(`/news/articles?limit=${maxArticles}`));
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData.success && fallbackData.articles && fallbackData.articles.length > 0) {
            console.log('Fallback succeeded, got articles');
            if (resetPage) {
              setArticles(fallbackData.articles);
            } else {
              setArticles(prev => [...prev, ...fallbackData.articles]);
            }
            setHasMorePages(fallbackData.articles.length >= maxArticles);
          } else {
            if (resetPage) {
              setArticles([]);
            }
            setHasMorePages(false);
          }
        } catch (fallbackError) {
          console.error('Fallback failed:', fallbackError);
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
  
  // Replace your current sortArticlesByPriority function with this one

  const sortArticlesByPriority = (articles: NewsArticle[], priorityCategories: string[]): NewsArticle[] => {
    // Create a copy of the articles array
    const sortedArticles = [...articles];
    
    // Define a function to get priority score (lower is higher priority)
    const getPriorityScore = (article: NewsArticle): number => {
      const category = article.category || article.ai_category || '';
      
      // 1. Exact match with priority categories (in order)
      for (let i = 0; i < priorityCategories.length; i++) {
        if (category === priorityCategories[i]) {
          return i; // Return the exact index position (0, 1, 2, etc.)
        }
      }
      
      // 2. Partial match with priority categories
      for (let i = 0; i < priorityCategories.length; i++) {
        if (category.includes(priorityCategories[i])) {
          return i + 20; // Still keep order but with lower priority than exact matches
        }
      }
      
      // 3. Check for health-related keywords in title/description
      const title = article.title || '';
      const description = article.summary || '';
      const content = title + ' ' + description;
      const contentLower = content.toLowerCase();
      
      const healthKeywords = [
        'health', 'medical', 'medicine', 'doctor', 'patient', 'hospital',
        'disease', 'treatment', 'cure', 'wellness', 'fitness', 'diet',
        'nutrition', 'mental', 'therapy', 'clinical', 'drug', 'vaccine',
        'symptom', 'diagnosis', 'cancer', 'heart', 'diabetes', 'covid'
      ];
      
      if (healthKeywords.some(keyword => contentLower.includes(keyword))) {
        return 100; // All health-related content after categorized content
      }
      
      // 4. Tech content goes last
      const techKeywords = ['tech', 'technology', 'computing', 'software', 'hardware', 'ai', 'artificial intelligence'];
      if (techKeywords.some(keyword => 
        category.toLowerCase().includes(keyword) || 
        contentLower.includes(keyword)
      )) {
        return 1000; // Tech content at the bottom
      }
      
      // 5. Everything else
      return 500; // Other content in the middle
    };
    
    // Debug the categories before sorting
    console.log('Priority order:', priorityCategories);
    
    // Sort articles by priority score
    sortedArticles.sort((a, b) => {
      const priorityA = getPriorityScore(a);
      const priorityB = getPriorityScore(b);
      
      // First sort by priority category
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same priority category, sort by date (newest first)
      const dateA = a.pubDate || a.publishedDate;
      const dateB = b.pubDate || b.publishedDate;
      
      if (dateA && dateB) {
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
      
      return 0;
    });
    
    // Log the first few articles to debug the sorting
    console.log('Articles after sorting:');
    sortedArticles.slice(0, 5).forEach((article, i) => {
      const score = getPriorityScore(article);
      console.log(`  ${i+1}. [${score}] ${article.category || article.ai_category || 'uncategorized'}: ${article.title}`);
    });
    
    return sortedArticles;
  };
  
  // Function to ensure diversity of sources
  const diversifySources = (articles: NewsArticle[]): NewsArticle[] => {
    if (!articles || articles.length <= 4) return articles;
    
    // Group articles by source
    const sourceMap: Record<string, NewsArticle[]> = {};
    articles.forEach(article => {
      const source = article.source || 'unknown';
      if (!sourceMap[source]) {
        sourceMap[source] = [];
      }
      sourceMap[source].push(article);
    });
    
    // Get all unique sources
    const sources = Object.keys(sourceMap);
    console.log('Available sources:', sources);
    
    // If we only have one source, return original articles
    if (sources.length <= 1) return articles;
    
    // Build a diversified list by alternating between sources
    const diversified: NewsArticle[] = [];
    let remainingArticles = [...articles];
    
    // Limit articles per source based on how many sources we have
    const maxPerSource = Math.max(2, Math.ceil(articles.length / sources.length));
    
    // First pass: Take up to the limit from each source
    sources.forEach(source => {
      const sourceArticles = sourceMap[source].slice(0, maxPerSource);
      diversified.push(...sourceArticles);
      
      // Remove the ones we've taken
      remainingArticles = remainingArticles.filter(
        article => !sourceArticles.includes(article)
      );
    });
    
    // Add any remaining articles up to the original length
    if (remainingArticles.length > 0) {
      const neededCount = articles.length - diversified.length;
      diversified.push(...remainingArticles.slice(0, neededCount));
    }
    
    console.log(`Source diversity: from ${articles.length} articles with ${sources.length} sources, created ${diversified.length} diversified articles`);
    
    return diversified;
  };
  
  // Replace the handleAnalyzeWithWihy function (lines 471-493)

  const handleAnalyzeWithWihy = (article: NewsArticle, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (analyzingArticle === article.id) return;
    
    setAnalyzingArticle(article.id);
    
    const searchQuery = `Analyze this health article: ${article.title}. 
Summary: ${article.summary || article.description || 'No description available'}.
Source: ${article.source || 'Unknown source'}
Category: ${article.category || article.ai_category || 'Uncategorized'}`;

    console.log('Starting article analysis:', article.title);
    
    // Try the new direct approach first
    if (triggerSearch) {
      console.log('Using triggerSearch with custom query');
      // Also update the search input for visual feedback
      if (setSearchQuery) {
        setSearchQuery(searchQuery);
      }
      // Pass the query directly to triggerSearch
      triggerSearch(searchQuery);
    } else {
      // FALLBACK: Directly manipulate DOM and submit the form
      const searchElement = document.querySelector('.search-input') as HTMLInputElement;
      if (searchElement) {
        // Direct DOM update for immediate effect
        searchElement.value = searchQuery;
        searchElement.focus();
        
        // Find the form and submit it directly
        const form = searchElement.closest('form');
        if (form) {
          console.log('Found form, submitting directly');
          
          // Also update React state
          if (setSearchQuery) {
            setSearchQuery(searchQuery);
          }
          
          // Submit the form
          setTimeout(() => {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }, 10);
        } else {
          // No form found, fall back to setSearchQuery
          console.log('No form found, using setSearchQuery only');
          if (setSearchQuery) {
            setSearchQuery(searchQuery);
          }
        }
      } else {
        // Can't find search element, use the props approach
        console.log('No search input found, using prop methods');
        
        if (setSearchQuery) {
          setSearchQuery(searchQuery);
        }
        
        // Last resort - use the onAnalyzeArticle function
        if (onAnalyzeArticle) {
          onAnalyzeArticle(searchQuery);
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
                // Debug: Log available image URLs
                const imageUrl = article.image_url || article.media_url || article.media_thumb_url;
                if (imageUrl) {
                  console.log(`Article "${article.title}" has image:`, imageUrl);
                } else {
                  console.log(`Article "${article.title}" has no image, using WiHy logo`);
                }
                
                // Use API image if available, otherwise placeholder
                if (imageUrl) {
                  return (
                    <img 
                      src={imageUrl} 
                      alt={article.title}
                      onError={(e) => {
                        console.log('API image failed to load:', imageUrl);
                        console.log('Falling back to WiHy logo for article:', article.title);
                        // Use WiHy logo as fallback
                        (e.target as HTMLImageElement).src = getWiHyLogoFallback();
                        // Add placeholder class for styling
                        (e.target as HTMLImageElement).classList.add('placeholder-image');
                      }}
                      onLoad={() => {
                        console.log('API image loaded successfully:', imageUrl);
                      }}
                    />
                  );
                } else {
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
          style={{ height: '20px', margin: '20px 0', visibility: 'hidden' }}
        />
      )}
    </div>
  );
};

export default HealthNewsFeed;