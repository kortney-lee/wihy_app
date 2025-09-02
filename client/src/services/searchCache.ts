interface CachedResult {
  query: string;
  results: string;
  timestamp: number;
  url: string;
}

class SearchCacheService {
  private cacheKey = 'vhealth_search_cache';
  private maxCacheSize = 50; // Maximum number of cached searches
  private cacheExpiry = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Get cached result for a query
  getCachedResult(query: string): string | null {
    try {
      const cache = this.getCache();
      const normalizedQuery = query.toLowerCase().trim();
      
      const cached = cache.find(item => 
        item.query.toLowerCase().trim() === normalizedQuery &&
        (Date.now() - item.timestamp) < this.cacheExpiry
      );

      return cached ? cached.results : null;
    } catch (error) {
      console.error('Error retrieving cached result:', error);
      return null;
    }
  }

  // Cache a search result
  setCachedResult(query: string, results: string, url: string): void {
    try {
      const cache = this.getCache();
      const normalizedQuery = query.toLowerCase().trim();
      
      // Remove existing entry for this query
      const filteredCache = cache.filter(item => 
        item.query.toLowerCase().trim() !== normalizedQuery
      );

      // Add new entry at the beginning
      const newEntry: CachedResult = {
        query: normalizedQuery,
        results,
        timestamp: Date.now(),
        url
      };

      filteredCache.unshift(newEntry);

      // Keep only the most recent entries
      if (filteredCache.length > this.maxCacheSize) {
        filteredCache.splice(this.maxCacheSize);
      }

      this.saveCache(filteredCache);
    } catch (error) {
      console.error('Error caching result:', error);
    }
  }

  // Get cached result by URL (for browser navigation)
  getCachedResultByUrl(url: string): { query: string; results: string } | null {
    try {
      const cache = this.getCache();
      const cached = cache.find(item => item.url === url);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
        return {
          query: cached.query,
          results: cached.results
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving cached result by URL:', error);
      return null;
    }
  }

  // Clear expired cache entries
  clearExpiredCache(): void {
    try {
      const cache = this.getCache();
      const validCache = cache.filter(item => 
        (Date.now() - item.timestamp) < this.cacheExpiry
      );
      
      if (validCache.length !== cache.length) {
        this.saveCache(validCache);
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  // Clear all cache
  clearAllCache(): void {
    try {
      sessionStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Get all cached results
  private getCache(): CachedResult[] {
    try {
      const cached = sessionStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error parsing cache:', error);
      return [];
    }
  }

  // Save cache to sessionStorage
  private saveCache(cache: CachedResult[]): void {
    try {
      sessionStorage.setItem(this.cacheKey, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }

  // Get cache statistics
  getCacheStats(): { size: number; oldestEntry: Date | null } {
    const cache = this.getCache();
    const oldestTimestamp = cache.length > 0 
      ? Math.min(...cache.map(item => item.timestamp))
      : null;
    
    return {
      size: cache.length,
      oldestEntry: oldestTimestamp ? new Date(oldestTimestamp) : null
    };
  }
}

export const searchCache = new SearchCacheService();