/**
 * Favorites Service
 * 
 * Client-side service for managing user favorites including recipes, exercises, meals, and workouts.
 * Connects to services.wihy.ai for favorites management.
 */

import { servicesApi } from './servicesApiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============= TYPES =============

export type FavoriteType = 
  | 'recipe' 
  | 'exercise' 
  | 'meal' 
  | 'workout' 
  | 'meal_plan' 
  | 'workout_program'
  | 'article'
  | 'product';

export interface Favorite {
  id: string;
  userId: string;
  type: FavoriteType;
  resourceId: string;
  resourceName: string;
  resourceImage?: string;
  resourceDescription?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  notes?: string;
  createdAt: string;
  sortOrder?: number;
}

export interface FavoriteCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverImage?: string;
  type: FavoriteType;
  itemCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddFavoriteRequest {
  type: FavoriteType;
  resourceId: string;
  resourceName: string;
  resourceImage?: string;
  resourceDescription?: string;
  collectionId?: string;
  tags?: string[];
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  coverImage?: string;
  type: FavoriteType;
  isPublic?: boolean;
}

// ============= CONSTANTS =============

const CACHE_KEY = '@favorites';
const COLLECTIONS_CACHE_KEY = '@favorite_collections';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ============= SERVICE IMPLEMENTATION =============

class FavoritesService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  // ==========================================
  // FAVORITES CRUD
  // ==========================================

  /**
   * Add an item to favorites
   * 
   * @param favorite - Favorite details
   * @returns Created favorite
   */
  async addFavorite(favorite: AddFavoriteRequest): Promise<Favorite> {
    try {
      const response = await servicesApi.post<{ favorite: Favorite }>(
        '/api/favorites',
        favorite
      );
      
      this.invalidateCache();
      return response.favorite;
    } catch (error) {
      console.error('[FavoritesService] Error adding favorite:', error);
      throw error;
    }
  }

  /**
   * Remove a favorite
   * 
   * @param favoriteId - Favorite ID
   */
  async removeFavorite(favoriteId: string): Promise<void> {
    try {
      await servicesApi.delete(`/api/favorites/${favoriteId}`);
      this.invalidateCache();
    } catch (error) {
      console.error('[FavoritesService] Error removing favorite:', error);
      throw error;
    }
  }

  /**
   * Remove a favorite by resource
   * 
   * @param type - Favorite type
   * @param resourceId - Resource ID
   */
  async removeFavoriteByResource(type: FavoriteType, resourceId: string): Promise<void> {
    try {
      await servicesApi.delete(`/api/favorites/resource/${type}/${resourceId}`);
      this.invalidateCache();
    } catch (error) {
      console.error('[FavoritesService] Error removing favorite:', error);
      throw error;
    }
  }

  /**
   * Get all favorites
   * 
   * @param type - Optional type filter
   * @returns List of favorites
   */
  async getFavorites(type?: FavoriteType): Promise<Favorite[]> {
    try {
      const endpoint = type 
        ? `/api/favorites?type=${type}`
        : '/api/favorites';
        
      const response = await servicesApi.get<{ favorites: Favorite[] }>(endpoint);
      
      const favorites = response.favorites || [];
      await this.cacheData(CACHE_KEY, favorites);
      return favorites;
    } catch (error) {
      console.error('[FavoritesService] Error fetching favorites:', error);
      return this.getCachedData(CACHE_KEY) || [];
    }
  }

  /**
   * Check if a resource is favorited
   * 
   * @param type - Favorite type
   * @param resourceId - Resource ID
   * @returns Whether the resource is favorited
   */
  async isFavorite(type: FavoriteType, resourceId: string): Promise<boolean> {
    try {
      const response = await servicesApi.get<{ isFavorite: boolean }>(
        `/api/favorites/check/${type}/${resourceId}`
      );
      return response.isFavorite;
    } catch (error) {
      console.error('[FavoritesService] Error checking favorite:', error);
      return false;
    }
  }

  /**
   * Toggle favorite status
   * 
   * @param favorite - Favorite details (used when adding)
   * @returns Whether the item is now favorited
   */
  async toggleFavorite(favorite: AddFavoriteRequest): Promise<boolean> {
    const isFav = await this.isFavorite(favorite.type, favorite.resourceId);
    
    if (isFav) {
      await this.removeFavoriteByResource(favorite.type, favorite.resourceId);
      return false;
    } else {
      await this.addFavorite(favorite);
      return true;
    }
  }

  /**
   * Update favorite notes or tags
   * 
   * @param favoriteId - Favorite ID
   * @param updates - Updates to apply
   * @returns Updated favorite
   */
  async updateFavorite(
    favoriteId: string,
    updates: { notes?: string; tags?: string[] }
  ): Promise<Favorite> {
    try {
      const response = await servicesApi.put<{ favorite: Favorite }>(
        `/api/favorites/${favoriteId}`,
        updates
      );
      
      this.invalidateCache();
      return response.favorite;
    } catch (error) {
      console.error('[FavoritesService] Error updating favorite:', error);
      throw error;
    }
  }

  // ==========================================
  // COLLECTIONS
  // ==========================================

  /**
   * Create a new collection
   * 
   * @param collection - Collection details
   * @returns Created collection
   */
  async createCollection(collection: CreateCollectionRequest): Promise<FavoriteCollection> {
    try {
      const response = await servicesApi.post<{ collection: FavoriteCollection }>(
        '/api/favorites/collections',
        collection
      );
      
      this.invalidateCollectionsCache();
      return response.collection;
    } catch (error) {
      console.error('[FavoritesService] Error creating collection:', error);
      throw error;
    }
  }

  /**
   * Get all collections
   * 
   * @param type - Optional type filter
   * @returns List of collections
   */
  async getCollections(type?: FavoriteType): Promise<FavoriteCollection[]> {
    try {
      const endpoint = type 
        ? `/api/favorites/collections?type=${type}`
        : '/api/favorites/collections';
        
      const response = await servicesApi.get<{ collections: FavoriteCollection[] }>(endpoint);
      
      const collections = response.collections || [];
      await this.cacheData(COLLECTIONS_CACHE_KEY, collections);
      return collections;
    } catch (error) {
      console.error('[FavoritesService] Error fetching collections:', error);
      return this.getCachedData(COLLECTIONS_CACHE_KEY) || [];
    }
  }

  /**
   * Get a specific collection with its items
   * 
   * @param collectionId - Collection ID
   * @returns Collection with items
   */
  async getCollection(collectionId: string): Promise<{
    collection: FavoriteCollection;
    items: Favorite[];
  }> {
    try {
      const response = await servicesApi.get<{
        collection: FavoriteCollection;
        items: Favorite[];
      }>(`/api/favorites/collections/${collectionId}`);
      
      return response;
    } catch (error) {
      console.error('[FavoritesService] Error fetching collection:', error);
      throw error;
    }
  }

  /**
   * Update a collection
   * 
   * @param collectionId - Collection ID
   * @param updates - Updates to apply
   * @returns Updated collection
   */
  async updateCollection(
    collectionId: string,
    updates: Partial<CreateCollectionRequest>
  ): Promise<FavoriteCollection> {
    try {
      const response = await servicesApi.put<{ collection: FavoriteCollection }>(
        `/api/favorites/collections/${collectionId}`,
        updates
      );
      
      this.invalidateCollectionsCache();
      return response.collection;
    } catch (error) {
      console.error('[FavoritesService] Error updating collection:', error);
      throw error;
    }
  }

  /**
   * Delete a collection
   * 
   * @param collectionId - Collection ID
   * @param deleteItems - Whether to also delete items in the collection
   */
  async deleteCollection(collectionId: string, deleteItems: boolean = false): Promise<void> {
    try {
      await servicesApi.delete(
        `/api/favorites/collections/${collectionId}?deleteItems=${deleteItems}`
      );
      this.invalidateCollectionsCache();
    } catch (error) {
      console.error('[FavoritesService] Error deleting collection:', error);
      throw error;
    }
  }

  /**
   * Add an item to a collection
   * 
   * @param collectionId - Collection ID
   * @param favoriteId - Favorite ID to add
   */
  async addToCollection(collectionId: string, favoriteId: string): Promise<void> {
    try {
      await servicesApi.post(
        `/api/favorites/collections/${collectionId}/items`,
        { favoriteId }
      );
      this.invalidateCollectionsCache();
    } catch (error) {
      console.error('[FavoritesService] Error adding to collection:', error);
      throw error;
    }
  }

  /**
   * Remove an item from a collection
   * 
   * @param collectionId - Collection ID
   * @param favoriteId - Favorite ID to remove
   */
  async removeFromCollection(collectionId: string, favoriteId: string): Promise<void> {
    try {
      await servicesApi.delete(
        `/api/favorites/collections/${collectionId}/items/${favoriteId}`
      );
      this.invalidateCollectionsCache();
    } catch (error) {
      console.error('[FavoritesService] Error removing from collection:', error);
      throw error;
    }
  }

  // ==========================================
  // QUICK ACTIONS BY TYPE
  // ==========================================

  /**
   * Favorite a recipe
   */
  async favoriteRecipe(
    recipeId: string,
    recipeName: string,
    recipeImage?: string
  ): Promise<Favorite> {
    return this.addFavorite({
      type: 'recipe',
      resourceId: recipeId,
      resourceName: recipeName,
      resourceImage: recipeImage,
    });
  }

  /**
   * Favorite an exercise
   */
  async favoriteExercise(
    exerciseId: string,
    exerciseName: string,
    exerciseImage?: string,
    muscleGroups?: string[]
  ): Promise<Favorite> {
    return this.addFavorite({
      type: 'exercise',
      resourceId: exerciseId,
      resourceName: exerciseName,
      resourceImage: exerciseImage,
      metadata: { muscleGroups },
    });
  }

  /**
   * Favorite a meal
   */
  async favoriteMeal(
    mealId: string,
    mealName: string,
    mealImage?: string,
    calories?: number
  ): Promise<Favorite> {
    return this.addFavorite({
      type: 'meal',
      resourceId: mealId,
      resourceName: mealName,
      resourceImage: mealImage,
      metadata: { calories },
    });
  }

  /**
   * Favorite a workout
   */
  async favoriteWorkout(
    workoutId: string,
    workoutName: string,
    duration?: number,
    muscleGroups?: string[]
  ): Promise<Favorite> {
    return this.addFavorite({
      type: 'workout',
      resourceId: workoutId,
      resourceName: workoutName,
      metadata: { duration, muscleGroups },
    });
  }

  /**
   * Get favorite recipes
   */
  async getFavoriteRecipes(): Promise<Favorite[]> {
    return this.getFavorites('recipe');
  }

  /**
   * Get favorite exercises
   */
  async getFavoriteExercises(): Promise<Favorite[]> {
    return this.getFavorites('exercise');
  }

  /**
   * Get favorite meals
   */
  async getFavoriteMeals(): Promise<Favorite[]> {
    return this.getFavorites('meal');
  }

  /**
   * Get favorite workouts
   */
  async getFavoriteWorkouts(): Promise<Favorite[]> {
    return this.getFavorites('workout');
  }

  // ==========================================
  // SEARCH & SORTING
  // ==========================================

  /**
   * Search favorites
   * 
   * @param query - Search query
   * @param type - Optional type filter
   * @returns Matching favorites
   */
  async searchFavorites(query: string, type?: FavoriteType): Promise<Favorite[]> {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      if (type) params.append('type', type);

      const response = await servicesApi.get<{ favorites: Favorite[] }>(
        `/api/favorites/search?${params.toString()}`
      );
      return response.favorites || [];
    } catch (error) {
      console.error('[FavoritesService] Error searching favorites:', error);
      return [];
    }
  }

  /**
   * Reorder favorites
   * 
   * @param favoriteIds - Ordered list of favorite IDs
   */
  async reorderFavorites(favoriteIds: string[]): Promise<void> {
    try {
      await servicesApi.put('/api/favorites/reorder', { favoriteIds });
      this.invalidateCache();
    } catch (error) {
      console.error('[FavoritesService] Error reordering favorites:', error);
      throw error;
    }
  }

  // ==========================================
  // STATS
  // ==========================================

  /**
   * Get favorites statistics
   * 
   * @returns Favorites stats by type
   */
  async getStats(): Promise<{
    total: number;
    byType: { type: FavoriteType; count: number }[];
    recentlyAdded: Favorite[];
  }> {
    try {
      const response = await servicesApi.get('/api/favorites/stats');
      return response as any;
    } catch (error) {
      console.error('[FavoritesService] Error fetching stats:', error);
      return {
        total: 0,
        byType: [],
        recentlyAdded: [],
      };
    }
  }

  // ==========================================
  // CACHE HELPERS
  // ==========================================

  private invalidateCache(): void {
    this.cache.delete(CACHE_KEY);
  }

  private invalidateCollectionsCache(): void {
    this.cache.delete(COLLECTIONS_CACHE_KEY);
  }

  private async cacheData(key: string, data: any): Promise<void> {
    try {
      this.cache.set(key, { data, timestamp: Date.now() });
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('[FavoritesService] Cache error:', error);
    }
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  /**
   * Clear all cached favorites data
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    try {
      await AsyncStorage.multiRemove([CACHE_KEY, COLLECTIONS_CACHE_KEY]);
    } catch (error) {
      console.error('[FavoritesService] Error clearing cache:', error);
    }
  }
}

export const favoritesService = new FavoritesService();

export default favoritesService;
