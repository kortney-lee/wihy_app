import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchNewsFeed, getArticlesByCategory, NewsArticle } from '../services/newsService';
import { useNavigate } from 'react-router-dom';
import './HealthNewsFeed.css';

// Update the props interface to receive the search functions
interface NewsFeedProps {
  maxArticles?: number;
  onAnalyzeArticle?: (query: string) => void;
  setSearchQuery?: (query: string) => void;
  triggerSearch?: () => void;
}

// Define placeholder images by category
const PLACEHOLDER_IMAGES: Record<string, string[]> = {
  'Nutrition & Diet': [
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&q=80',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80'
  ],
  'Medical Research': [
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80',
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80',
    'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&q=80'
  ],
  'Public Health': [
    'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&q=80',
    'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&q=80',
    'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&q=80',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80'
  ],
  'Clinical Studies': [
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80',
    'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?w=800&q=80',
    'https://images.unsplash.com/photo-1624727828489-a1e03b79bba8?w=800&q=80',
    'https://images.unsplash.com/photo-1516069677022-53fe679c7ccb?w=800&q=80'
  ],
  'Disease Prevention': [
    'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&q=80',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=800&q=80',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80',
    'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800&q=80'
  ],
  'Mental Health': [
    'https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=800&q=80',
    'https://images.unsplash.com/photo-1527736947477-2790e28f3443?w=800&q=80',
    'https://images.unsplash.com/photo-1546290581-22fe67c7bd0e?w=800&q=80',
    'https://images.unsplash.com/photo-1569893033503-9204c3ab911c?w=800&q=80'
  ],
  'General Health': [
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80',
    'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?w=800&q=80',
    'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=800&q=80',
    'https://images.unsplash.com/photo-1579126038374-6064e9370f0f?w=800&q=80'
  ],
  'default': [
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80',
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80',
    'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&q=80'
  ]
};

// Helper function to get a random placeholder image for a category
const getRandomPlaceholderImage = (category?: string): string => {
  // Default to 'default' category if the category doesn't exist or is not provided
  const categoryImages = PLACEHOLDER_IMAGES[category || ''] || PLACEHOLDER_IMAGES['default'];
  
  // Get a random image from the array
  const randomIndex = Math.floor(Math.random() * categoryImages.length);
  return categoryImages[randomIndex];
};

// Helper function to get a color based on category
const getCategoryColor = (category?: string) => {
  if (!category) return '#94a3b8';
  
  const colors: {[key: string]: string} = {
    'Nutrition & Diet': '#4caf50',
    'Medical Research': '#2196f3',
    'Public Health': '#ff9800',
    'Clinical Studies': '#9c27b0',
    'Disease Prevention': '#f44336',
    'Mental Health': '#03a9f4',
    'General Health': '#ffeb3b'
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
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [analyzingArticle, setAnalyzingArticle] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const navigate = useNavigate();
  
  const prevFetchParamsRef = useRef<{category: string, max: number}>({category: '', max: 0});
  const observerTarget = useRef<HTMLDivElement>(null);

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

  // Fetch initial articles when category changes
  useEffect(() => {
    // Only fetch if category or maxArticles actually changed
    const prevParams = prevFetchParamsRef.current;
    if (prevParams.category !== selectedCategory || prevParams.max !== maxArticles) {
      prevFetchParamsRef.current = {category: selectedCategory, max: maxArticles};
      setCurrentPage(1); // Reset to first page when changing categories
      setHasMorePages(true); // Reset pagination state
      fetchHealthNews(true); // true means reset (first page)
    }
  }, [selectedCategory, maxArticles]);

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
      console.log('Fetching health news for category:', selectedCategory, 'page:', page);
      
      let response;
      
      // Define all health categories and their priority order
      const healthCategories = [
        'Nutrition & Diet', 
        'Medical Research', 
        'Public Health', 
        'Clinical Studies', 
        'Disease Prevention', 
        'Mental Health', 
        'General Health'
      ];
      
      if (selectedCategory === 'all') {
        // Explicitly pass an empty array to ensure NO category filters are applied
        response = await fetchNewsFeed([], maxArticles * 2);
        console.log('Fetching ALL news with no category filters');
      } else {
        response = await getArticlesByCategory(selectedCategory, maxArticles);
      }
      
      if (response.success && response.articles && response.articles.length > 0) {
        let processedArticles = response.articles;
        console.log(`Received ${processedArticles.length} articles from API`);
        
        // For "all" category, still sort and diversify
        if (selectedCategory === 'all') {
          // Sort articles by category priority
          processedArticles = sortArticlesByPriority(response.articles, healthCategories);
          
          // Diversify sources
          processedArticles = diversifySources(processedArticles);
          
          // Limit to maxArticles if we're on the first page
          if (resetPage) {
            processedArticles = processedArticles.slice(0, maxArticles);
          } else {
            // For subsequent pages, limit to maxArticles more
            processedArticles = processedArticles.slice(0, maxArticles);
          }
        }
        
        if (resetPage) {
          setArticles(processedArticles);
        } else {
          // Append new articles to existing ones
          setArticles(prev => [...prev, ...processedArticles]);
        }
        
        // If API doesn't provide pagination info, infer it from response length
        if (response.pagination) {
          setHasMorePages(response.pagination.has_next_page);
        } else {
          // If we received at least as many articles as we requested, assume there are more
          setHasMorePages(response.articles.length >= maxArticles);
        }
      } else {
        console.log('No articles found for the selected category on page', page);
        // If no articles found and it's "all" category, try one more time with really no filters
        if (selectedCategory === 'all') {
          console.log('Trying again with absolutely no filters');
          // Last resort - force no filtering at all
          try {
            const fallbackResponse = await fetch('/api/news/articles?limit=' + maxArticles);
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
            console.error('Even fallback failed:', fallbackError);
            if (resetPage) {
              setArticles([]);
            }
            setHasMorePages(false);
          }
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
  
  // Replace your current sortArticlesByPriority function with this one

  const sortArticlesByPriority = (articles: NewsArticle[], priorityCategories: string[]): NewsArticle[] => {
    // Create a copy of the articles array
    const sortedArticles = [...articles];
    
    // Define a function to get priority score (lower is higher priority)
    const getPriorityScore = (article: NewsArticle): number => {
      const category = article.category || '';
      
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
      const description = article.description || '';
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
      const dateA = a.publishedDate || a.published_date;
      const dateB = b.publishedDate || b.published_date;
      
      if (dateA && dateB) {
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
      
      return 0;
    });
    
    // Log the first few articles to debug the sorting
    console.log('Articles after sorting:');
    sortedArticles.slice(0, 5).forEach((article, i) => {
      const score = getPriorityScore(article);
      console.log(`  ${i+1}. [${score}] ${article.category || 'uncategorized'}: ${article.title}`);
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
Summary: ${article.description || article.summary || 'No description available'}.
Source: ${article.source || 'Unknown source'}
Category: ${article.category || 'Uncategorized'}`;

    console.log('Starting article analysis:', article.title);
    
    // GUARANTEED APPROACH: Directly manipulate DOM and submit the form
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
        
        // Also try triggerSearch as backup
        if (triggerSearch) {
          setTimeout(() => {
            triggerSearch();
          }, 50);
        }
      } else {
        // No form found, fall back to triggerSearch
        console.log('No form found, using triggerSearch directly');
        if (setSearchQuery) {
          setSearchQuery(searchQuery);
        }
        
        if (triggerSearch) {
          triggerSearch();
        }
      }
    } else {
      // Can't find search element, use the props approach
      console.log('No search input found, using prop methods');
      
      if (setSearchQuery) {
        setSearchQuery(searchQuery);
      }
      
      if (triggerSearch) {
        triggerSearch();
      }
      
      // Last resort - use the onAnalyzeArticle function
      if (!setSearchQuery || !triggerSearch) {
        onAnalyzeArticle(searchQuery);
      }
    }
    
    // Reset analyzing state after delay
    setTimeout(() => setAnalyzingArticle(null), 2000);
  };
  
  if (loading && currentPage === 1) {
    return (
      <div className="news-feed-container">
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
            data-category={article.category}
            onClick={() => window.open(article.link || article.url, '_blank')}
          >
            {/* Image Section - Using category-based random placeholders only when needed */}
            <div className="news-image">
              {(article.image_url || article.thumbnail || article.imageUrl || article.thumbnailUrl) ? (
                <img 
                  src={article.image_url || article.thumbnail || article.imageUrl || article.thumbnailUrl} 
                  alt={article.title}
                  onError={(e) => {
                    console.log('Image failed to load:', article.image_url || article.thumbnail);
                    // Use category-specific random placeholder instead of hiding
                    (e.target as HTMLImageElement).src = getRandomPlaceholderImage(article.category);
                    // Add placeholder class for styling
                    (e.target as HTMLImageElement).classList.add('placeholder-image');
                  }}
                />
              ) : (
                // Use category-specific random placeholder when no image is provided
                <img 
                  src={getRandomPlaceholderImage(article.category)}
                  alt={article.title || 'Health article'}
                  className="placeholder-image"
                />
              )}
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
                  style={{ backgroundColor: getCategoryColor(article.category) }}
                >
                  {article.category}
                </span>
                <span className="news-time">{formatTimeAgo(article.publishedDate || article.published_date)}</span>
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
          <p>No articles found for the selected category. Try selecting a different category.</p>
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