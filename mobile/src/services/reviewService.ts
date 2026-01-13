/**
 * Review Service
 * 
 * Client-side service for recipe ratings, reviews, and feedback.
 * Connects to services.wihy.ai for review management.
 */

import { servicesApi } from './servicesApiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============= TYPES =============

export type ReviewableType = 'recipe' | 'meal' | 'workout' | 'meal_plan' | 'workout_program' | 'coach';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: ReviewableType;
  resourceId: string;
  resourceName?: string;
  rating: number; // 1-5 stars
  title?: string;
  content: string;
  pros?: string[];
  cons?: string[];
  images?: string[];
  isVerified: boolean; // User actually used/completed the item
  helpfulCount: number;
  reportCount: number;
  response?: {
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  resourceId: string;
  type: ReviewableType;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedCount: number;
  recommendPercentage: number;
}

export interface CreateReviewRequest {
  type: ReviewableType;
  resourceId: string;
  resourceName?: string;
  rating: number;
  title?: string;
  content: string;
  pros?: string[];
  cons?: string[];
  images?: string[];
  wouldRecommend?: boolean;
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  content?: string;
  pros?: string[];
  cons?: string[];
  images?: string[];
}

export interface GetReviewsOptions {
  resourceId?: string;
  type?: ReviewableType;
  userId?: string;
  rating?: number;
  verified?: boolean;
  sortBy?: 'recent' | 'rating_high' | 'rating_low' | 'helpful';
  limit?: number;
  offset?: number;
}

// ============= CONSTANTS =============

const CACHE_KEY_PREFIX = '@reviews_';
const USER_REVIEWS_CACHE = '@user_reviews';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// ============= SERVICE IMPLEMENTATION =============

class ReviewService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  // ==========================================
  // REVIEWS CRUD
  // ==========================================

  /**
   * Create a new review
   * 
   * @param review - Review details
   * @returns Created review
   */
  async createReview(review: CreateReviewRequest): Promise<Review> {
    try {
      const response = await servicesApi.post<{ review: Review }>(
        '/api/reviews',
        review
      );
      
      this.invalidateCache(review.type, review.resourceId);
      return response.review;
    } catch (error) {
      console.error('[ReviewService] Error creating review:', error);
      throw error;
    }
  }

  /**
   * Get a specific review
   * 
   * @param reviewId - Review ID
   * @returns Review details
   */
  async getReview(reviewId: string): Promise<Review | null> {
    try {
      const response = await servicesApi.get<{ review: Review }>(
        `/api/reviews/${reviewId}`
      );
      return response.review || null;
    } catch (error) {
      console.error('[ReviewService] Error fetching review:', error);
      return null;
    }
  }

  /**
   * Get reviews with optional filtering
   * 
   * @param options - Filter options
   * @returns List of reviews
   */
  async getReviews(options: GetReviewsOptions): Promise<{
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (options.resourceId) params.append('resourceId', options.resourceId);
      if (options.type) params.append('type', options.type);
      if (options.userId) params.append('userId', options.userId);
      if (options.rating) params.append('rating', options.rating.toString());
      if (options.verified !== undefined) params.append('verified', options.verified.toString());
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const response = await servicesApi.get<{
        reviews: Review[];
        total: number;
        hasMore: boolean;
      }>(`/api/reviews?${params.toString()}`);
      
      return response;
    } catch (error) {
      console.error('[ReviewService] Error fetching reviews:', error);
      return { reviews: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get reviews for a specific resource
   * 
   * @param type - Resource type
   * @param resourceId - Resource ID
   * @param options - Additional options
   * @returns Reviews for the resource
   */
  async getResourceReviews(
    type: ReviewableType,
    resourceId: string,
    options?: Omit<GetReviewsOptions, 'type' | 'resourceId'>
  ): Promise<Review[]> {
    const result = await this.getReviews({ type, resourceId, ...options });
    return result.reviews;
  }

  /**
   * Update an existing review
   * 
   * @param reviewId - Review ID
   * @param updates - Fields to update
   * @returns Updated review
   */
  async updateReview(reviewId: string, updates: UpdateReviewRequest): Promise<Review> {
    try {
      const response = await servicesApi.put<{ review: Review }>(
        `/api/reviews/${reviewId}`,
        updates
      );
      
      this.cache.clear(); // Invalidate all review caches
      return response.review;
    } catch (error) {
      console.error('[ReviewService] Error updating review:', error);
      throw error;
    }
  }

  /**
   * Delete a review
   * 
   * @param reviewId - Review ID
   */
  async deleteReview(reviewId: string): Promise<void> {
    try {
      await servicesApi.delete(`/api/reviews/${reviewId}`);
      this.cache.clear();
    } catch (error) {
      console.error('[ReviewService] Error deleting review:', error);
      throw error;
    }
  }

  // ==========================================
  // RATINGS
  // ==========================================

  /**
   * Quick rate without writing a review
   * 
   * @param type - Resource type
   * @param resourceId - Resource ID
   * @param rating - Rating (1-5)
   * @returns Created or updated review
   */
  async rateResource(
    type: ReviewableType,
    resourceId: string,
    rating: number
  ): Promise<Review> {
    try {
      const response = await servicesApi.post<{ review: Review }>(
        `/api/reviews/rate`,
        { type, resourceId, rating }
      );
      
      this.invalidateCache(type, resourceId);
      return response.review;
    } catch (error) {
      console.error('[ReviewService] Error rating resource:', error);
      throw error;
    }
  }

  /**
   * Get rating summary for a resource
   * 
   * @param type - Resource type
   * @param resourceId - Resource ID
   * @returns Rating summary
   */
  async getRatingSummary(type: ReviewableType, resourceId: string): Promise<RatingSummary> {
    try {
      const response = await servicesApi.get<RatingSummary>(
        `/api/reviews/summary/${type}/${resourceId}`
      );
      return response;
    } catch (error) {
      console.error('[ReviewService] Error fetching rating summary:', error);
      return {
        resourceId,
        type,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedCount: 0,
        recommendPercentage: 0,
      };
    }
  }

  /**
   * Get user's rating for a resource
   * 
   * @param type - Resource type
   * @param resourceId - Resource ID
   * @returns User's rating (null if not rated)
   */
  async getUserRating(type: ReviewableType, resourceId: string): Promise<number | null> {
    try {
      const response = await servicesApi.get<{ rating: number | null }>(
        `/api/reviews/my-rating/${type}/${resourceId}`
      );
      return response.rating;
    } catch (error) {
      console.error('[ReviewService] Error fetching user rating:', error);
      return null;
    }
  }

  /**
   * Check if user has reviewed a resource
   * 
   * @param type - Resource type
   * @param resourceId - Resource ID
   * @returns Whether user has reviewed
   */
  async hasUserReviewed(type: ReviewableType, resourceId: string): Promise<boolean> {
    try {
      const response = await servicesApi.get<{ hasReviewed: boolean }>(
        `/api/reviews/check/${type}/${resourceId}`
      );
      return response.hasReviewed;
    } catch (error) {
      console.error('[ReviewService] Error checking review status:', error);
      return false;
    }
  }

  // ==========================================
  // USER REVIEWS
  // ==========================================

  /**
   * Get current user's reviews
   * 
   * @param type - Optional type filter
   * @returns User's reviews
   */
  async getMyReviews(type?: ReviewableType): Promise<Review[]> {
    try {
      const endpoint = type 
        ? `/api/reviews/mine?type=${type}`
        : '/api/reviews/mine';
        
      const response = await servicesApi.get<{ reviews: Review[] }>(endpoint);
      return response.reviews || [];
    } catch (error) {
      console.error('[ReviewService] Error fetching my reviews:', error);
      return [];
    }
  }

  /**
   * Get reviews by a specific user
   * 
   * @param userId - User ID
   * @param type - Optional type filter
   * @returns User's public reviews
   */
  async getUserReviews(userId: string, type?: ReviewableType): Promise<Review[]> {
    const result = await this.getReviews({ userId, type });
    return result.reviews;
  }

  // ==========================================
  // HELPFUL / REPORT
  // ==========================================

  /**
   * Mark a review as helpful
   * 
   * @param reviewId - Review ID
   * @returns Updated helpful count
   */
  async markHelpful(reviewId: string): Promise<number> {
    try {
      const response = await servicesApi.post<{ helpfulCount: number }>(
        `/api/reviews/${reviewId}/helpful`,
        {}
      );
      return response.helpfulCount;
    } catch (error) {
      console.error('[ReviewService] Error marking helpful:', error);
      throw error;
    }
  }

  /**
   * Remove helpful mark from a review
   * 
   * @param reviewId - Review ID
   * @returns Updated helpful count
   */
  async removeHelpful(reviewId: string): Promise<number> {
    try {
      const response = await servicesApi.delete<{ helpfulCount: number }>(
        `/api/reviews/${reviewId}/helpful`
      );
      return response.helpfulCount;
    } catch (error) {
      console.error('[ReviewService] Error removing helpful:', error);
      throw error;
    }
  }

  /**
   * Report a review
   * 
   * @param reviewId - Review ID
   * @param reason - Report reason
   * @param details - Additional details
   */
  async reportReview(
    reviewId: string,
    reason: 'spam' | 'inappropriate' | 'fake' | 'other',
    details?: string
  ): Promise<void> {
    try {
      await servicesApi.post(`/api/reviews/${reviewId}/report`, { reason, details });
    } catch (error) {
      console.error('[ReviewService] Error reporting review:', error);
      throw error;
    }
  }

  // ==========================================
  // REVIEW RESPONSES (for coaches/authors)
  // ==========================================

  /**
   * Respond to a review (for resource owners)
   * 
   * @param reviewId - Review ID
   * @param content - Response content
   * @returns Updated review with response
   */
  async respondToReview(reviewId: string, content: string): Promise<Review> {
    try {
      const response = await servicesApi.post<{ review: Review }>(
        `/api/reviews/${reviewId}/response`,
        { content }
      );
      return response.review;
    } catch (error) {
      console.error('[ReviewService] Error responding to review:', error);
      throw error;
    }
  }

  /**
   * Update a response
   * 
   * @param reviewId - Review ID
   * @param content - Updated response content
   */
  async updateResponse(reviewId: string, content: string): Promise<Review> {
    try {
      const response = await servicesApi.put<{ review: Review }>(
        `/api/reviews/${reviewId}/response`,
        { content }
      );
      return response.review;
    } catch (error) {
      console.error('[ReviewService] Error updating response:', error);
      throw error;
    }
  }

  /**
   * Delete a response
   * 
   * @param reviewId - Review ID
   */
  async deleteResponse(reviewId: string): Promise<void> {
    try {
      await servicesApi.delete(`/api/reviews/${reviewId}/response`);
    } catch (error) {
      console.error('[ReviewService] Error deleting response:', error);
      throw error;
    }
  }

  // ==========================================
  // RECIPE-SPECIFIC HELPERS
  // ==========================================

  /**
   * Rate a recipe
   */
  async rateRecipe(recipeId: string, rating: number): Promise<Review> {
    return this.rateResource('recipe', recipeId, rating);
  }

  /**
   * Review a recipe
   */
  async reviewRecipe(
    recipeId: string,
    recipeName: string,
    rating: number,
    content: string,
    options?: {
      title?: string;
      pros?: string[];
      cons?: string[];
      images?: string[];
      wouldRecommend?: boolean;
    }
  ): Promise<Review> {
    return this.createReview({
      type: 'recipe',
      resourceId: recipeId,
      resourceName: recipeName,
      rating,
      content,
      ...options,
    });
  }

  /**
   * Get recipe reviews
   */
  async getRecipeReviews(recipeId: string): Promise<Review[]> {
    return this.getResourceReviews('recipe', recipeId);
  }

  /**
   * Get recipe rating summary
   */
  async getRecipeRatingSummary(recipeId: string): Promise<RatingSummary> {
    return this.getRatingSummary('recipe', recipeId);
  }

  // ==========================================
  // STATS
  // ==========================================

  /**
   * Get review statistics
   * 
   * @returns Review stats
   */
  async getReviewStats(): Promise<{
    totalReviews: number;
    averageRating: number;
    reviewsByType: { type: ReviewableType; count: number; avgRating: number }[];
    recentReviews: Review[];
  }> {
    try {
      const response = await servicesApi.get('/api/reviews/stats');
      return response as any;
    } catch (error) {
      console.error('[ReviewService] Error fetching stats:', error);
      return {
        totalReviews: 0,
        averageRating: 0,
        reviewsByType: [],
        recentReviews: [],
      };
    }
  }

  // ==========================================
  // CACHE HELPERS
  // ==========================================

  private invalidateCache(type: ReviewableType, resourceId: string): void {
    const key = `${CACHE_KEY_PREFIX}${type}_${resourceId}`;
    this.cache.delete(key);
    this.cache.delete(USER_REVIEWS_CACHE);
  }

  /**
   * Clear all cached review data
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
  }
}

export const reviewService = new ReviewService();

export default reviewService;
