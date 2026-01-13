/**
 * Rate Limiter for API Requests
 * Prevents too many requests in a short time period
 */

export class RateLimiter {
  private lastRequestTime: number | null = null;
  private requestCount: number = 0;
  private windowStart: number | null = null;

  constructor(
    private minInterval: number = 1000, // 1 second between requests
    private maxRequestsPerWindow: number = 10, // Max 10 requests per minute
    private windowSize: number = 60000 // 1 minute window
  ) {}

  /**
   * Check if a request can be made
   */
  canMakeRequest(): boolean {
    const now = Date.now();

    // Check minimum interval between requests
    if (this.lastRequestTime) {
      const elapsed = now - this.lastRequestTime;
      if (elapsed < this.minInterval) {
        console.log(`[RateLimiter] Request blocked - too soon (${elapsed}ms < ${this.minInterval}ms)`);
        return false;
      }
    }

    // Check requests per window
    if (!this.windowStart) {
      this.windowStart = now;
      this.requestCount = 0;
    }

    const windowElapsed = now - this.windowStart;
    if (windowElapsed > this.windowSize) {
      // Reset window
      this.windowStart = now;
      this.requestCount = 0;
    }

    if (this.requestCount >= this.maxRequestsPerWindow) {
      console.log(`[RateLimiter] Request blocked - rate limit exceeded (${this.requestCount}/${this.maxRequestsPerWindow})`);
      return false;
    }

    // Request allowed
    this.lastRequestTime = now;
    this.requestCount++;
    return true;
  }

  /**
   * Get time to wait before next request can be made
   */
  getWaitTime(): number {
    const now = Date.now();
    
    if (!this.lastRequestTime) {
      return 0;
    }
    
    const elapsed = now - this.lastRequestTime;
    return Math.max(0, this.minInterval - elapsed);
  }

  /**
   * Wait until a request can be made
   */
  async waitForNextSlot(): Promise<void> {
    if (this.canMakeRequest()) {
      return;
    }

    const waitTime = this.getWaitTime();

    if (waitTime > 0) {
      console.log(`[RateLimiter] Waiting ${waitTime}ms for next request slot`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.lastRequestTime = null;
    this.requestCount = 0;
    this.windowStart = null;
    console.log('[RateLimiter] Reset');
  }

  /**
   * Get current status
   */
  getStatus(): {
    requestCount: number;
    maxRequests: number;
    windowStart: number | null;
    lastRequest: number | null;
  } {
    return {
      requestCount: this.requestCount,
      maxRequests: this.maxRequestsPerWindow,
      windowStart: this.windowStart,
      lastRequest: this.lastRequestTime,
    };
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();
