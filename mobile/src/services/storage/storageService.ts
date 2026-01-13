/**
 * Storage Service
 * 
 * Unified storage layer for WIHY app.
 * Combines AsyncStorage (key-value) with SQLite (structured data).
 * 
 * Usage:
 *   - get/set: Simple key-value storage
 *   - getCachedWithExpiry/setCachedWithExpiry: TTL-based caching
 *   - query/execute: SQLite operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES
// ============================================

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

export interface CacheResult<T> {
  data: T;
  isStale: boolean;
  cacheAge?: number;
}

export interface StorageStats {
  keyCount: number;
  estimatedSize: number;
  oldestEntry?: string;
}

// ============================================
// STORAGE SERVICE
// ============================================

class StorageService {
  private initialized = false;

  /**
   * Initialize storage (call on app start)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Test AsyncStorage
      await AsyncStorage.getItem('__test__');
      this.initialized = true;
      console.log('[Storage] Initialized successfully');
    } catch (error) {
      console.error('[Storage] Initialization failed:', error);
      throw error;
    }
  }

  // ============================================
  // KEY-VALUE STORAGE (AsyncStorage)
  // ============================================

  /**
   * Get value from storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`[Storage] Get failed for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set value in storage
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[Storage] Set failed for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Remove value from storage
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[Storage] Remove failed for key: ${key}`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  }

  /**
   * Get multiple values
   */
  async getMultiple<T>(keys: string[]): Promise<Map<string, T>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result = new Map<string, T>();
      
      pairs.forEach(([key, value]) => {
        if (value) {
          result.set(key, JSON.parse(value));
        }
      });
      
      return result;
    } catch (error) {
      console.error('[Storage] GetMultiple failed:', error);
      return new Map();
    }
  }

  /**
   * Set multiple values
   */
  async setMultiple<T>(entries: Array<[string, T]>): Promise<void> {
    try {
      const pairs: Array<[string, string]> = entries.map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('[Storage] SetMultiple failed:', error);
      throw error;
    }
  }

  // ============================================
  // CACHE WITH EXPIRY
  // ============================================

  /**
   * Get cached value if not expired
   * Returns null if not cached, otherwise returns data with staleness info
   */
  async getCachedWithExpiry<T>(
    key: string, 
    ttlMs?: number
  ): Promise<CacheResult<T> | null> {
    try {
      const entry = await this.get<CacheEntry<T>>(key);
      
      if (!entry) return null;
      
      const cacheAge = Date.now() - entry.createdAt;
      const isStale = ttlMs 
        ? cacheAge > ttlMs 
        : entry.expiresAt < Date.now();
      
      return {
        data: entry.data,
        isStale,
        cacheAge,
      };
    } catch (error) {
      console.error(`[Storage] Cache get failed for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async setCachedWithExpiry<T>(key: string, data: T, ttlMs: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    };
    await this.set(key, entry);
  }

  /**
   * Get cache age in milliseconds
   */
  async getCacheAge(key: string): Promise<number | null> {
    const entry = await this.get<CacheEntry<unknown>>(key);
    if (!entry) return null;
    return Date.now() - entry.createdAt;
  }

  /**
   * Check if cache is stale but still usable
   */
  async isCacheStale(key: string): Promise<boolean> {
    const entry = await this.get<CacheEntry<unknown>>(key);
    if (!entry) return true;
    return entry.expiresAt < Date.now();
  }

  /**
   * Get stale data (returns even if expired)
   */
  async getStaleCache<T>(key: string): Promise<{ data: T; isStale: boolean } | null> {
    const entry = await this.get<CacheEntry<T>>(key);
    if (!entry) return null;
    
    return {
      data: entry.data,
      isStale: entry.expiresAt < Date.now(),
    };
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  /**
   * Clear cache by prefix
   */
  async clearCache(prefix?: string): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      
      const toRemove = prefix
        ? keys.filter(k => k.startsWith(prefix))
        : keys.filter(k => 
            k.startsWith('cache:') || 
            k.startsWith('global:') ||
            k.includes(':cache:')
          );
      
      if (toRemove.length > 0) {
        await AsyncStorage.multiRemove(toRemove);
      }
      
      console.log(`[Storage] Cleared ${toRemove.length} cache entries`);
      return toRemove.length;
    } catch (error) {
      console.error('[Storage] Clear cache failed:', error);
      return 0;
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const toRemove: string[] = [];
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
              toRemove.push(key);
            }
          } catch {
            // Not a cache entry, skip
          }
        }
      }
      
      if (toRemove.length > 0) {
        await AsyncStorage.multiRemove(toRemove);
      }
      
      console.log(`[Storage] Cleared ${toRemove.length} expired entries`);
      return toRemove.length;
    } catch (error) {
      console.error('[Storage] Clear expired cache failed:', error);
      return 0;
    }
  }

  /**
   * Get all keys with prefix
   */
  async getKeysWithPrefix(prefix: string): Promise<string[]> {
    const keys = await AsyncStorage.getAllKeys();
    return keys.filter(k => k.startsWith(prefix));
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let estimatedSize = 0;
      
      const pairs = await AsyncStorage.multiGet(keys);
      pairs.forEach(([_, value]) => {
        if (value) {
          estimatedSize += value.length;
        }
      });
      
      return {
        keyCount: keys.length,
        estimatedSize,
      };
    } catch (error) {
      console.error('[Storage] Get stats failed:', error);
      return { keyCount: 0, estimatedSize: 0 };
    }
  }

  /**
   * Clear all data (use with caution!)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('[Storage] All data cleared');
    } catch (error) {
      console.error('[Storage] Clear all failed:', error);
      throw error;
    }
  }
}

// Export singleton
export const storageService = new StorageService();
export default storageService;
