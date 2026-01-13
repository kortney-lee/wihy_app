/**
 * Sync Engine
 * 
 * Manages offline-first data synchronization.
 * Queues operations when offline and processes them when back online.
 * 
 * Features:
 * - Priority-based queue processing
 * - Automatic retry with exponential backoff
 * - Callback support for post-sync operations
 * - Dead letter queue for failed operations
 */

import { storageService } from '../storage/storageService';
import { connectivityService } from '../connectivity/connectivityService';

// ============================================
// TYPES
// ============================================

export type SyncPriority = 'critical' | 'high' | 'normal' | 'low';
export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string;
  operation: SyncOperation;
  endpoint: string;
  payload: any;
  localId?: string;
  priority: SyncPriority;
  callback?: string;
  attempts: number;
  maxAttempts: number;
  lastAttempt?: string;
  nextRetryAt?: string;
  error?: string;
  createdAt: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncAt?: string;
  lastError?: string;
}

export type SyncStatusListener = (status: SyncStatus) => void;

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEYS = {
  QUEUE: 'sync:queue',
  DEAD_LETTER: 'sync:dead_letter',
  STATUS: 'sync:status',
};

const PRIORITY_CONFIG: Record<SyncPriority, { weight: number; maxAttempts: number; baseDelayMs: number }> = {
  critical: { weight: 0, maxAttempts: 10, baseDelayMs: 1000 },
  high: { weight: 1, maxAttempts: 5, baseDelayMs: 2000 },
  normal: { weight: 2, maxAttempts: 3, baseDelayMs: 5000 },
  low: { weight: 3, maxAttempts: 2, baseDelayMs: 10000 },
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.wihy.app';

// ============================================
// SYNC ENGINE
// ============================================

class SyncEngine {
  private isSyncing: boolean = false;
  private listeners: Set<SyncStatusListener> = new Set();
  private syncTimer: NodeJS.Timeout | null = null;
  private initialized: boolean = false;

  /**
   * Initialize sync engine (call on app start)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Subscribe to connectivity changes
    connectivityService.subscribe((info) => {
      if (info.isOnline) {
        this.processQueue();
      }
      this.notifyListeners();
    });

    // Process any pending items
    if (connectivityService.isOnline()) {
      this.processQueue();
    }

    this.initialized = true;
    console.log('[SyncEngine] Initialized');
  }

  /**
   * Add operation to sync queue
   */
  async enqueue(item: Omit<SyncQueueItem, 'id' | 'attempts' | 'maxAttempts' | 'createdAt'>): Promise<string> {
    const queueItem: SyncQueueItem = {
      id: this.generateId(),
      ...item,
      attempts: 0,
      maxAttempts: PRIORITY_CONFIG[item.priority].maxAttempts,
      createdAt: new Date().toISOString(),
    };

    const queue = await this.getQueue();
    queue.push(queueItem);
    
    // Sort by priority then creation time
    queue.sort((a, b) => {
      const priorityDiff = PRIORITY_CONFIG[a.priority].weight - PRIORITY_CONFIG[b.priority].weight;
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    await this.saveQueue(queue);
    this.notifyListeners();

    // Try to sync immediately if online
    if (connectivityService.isOnline()) {
      this.processQueue();
    }

    console.log(`[SyncEngine] Enqueued: ${queueItem.operation} ${queueItem.endpoint}`);
    return queueItem.id;
  }

  /**
   * Process pending sync operations
   */
  async processQueue(): Promise<void> {
    if (this.isSyncing || !connectivityService.isOnline()) return;

    this.isSyncing = true;
    this.notifyListeners();
    console.log('[SyncEngine] Processing queue...');

    try {
      const queue = await this.getQueue();
      const now = Date.now();
      
      const toProcess = queue.filter(item => 
        !item.nextRetryAt || new Date(item.nextRetryAt).getTime() <= now
      );

      if (toProcess.length === 0) {
        this.isSyncing = false;
        this.notifyListeners();
        return;
      }

      const processed: string[] = [];
      const remaining: SyncQueueItem[] = [];

      for (const item of toProcess) {
        if (!connectivityService.isOnline()) {
          remaining.push(item);
          continue;
        }

        try {
          await this.executeOperation(item);
          processed.push(item.id);
          console.log(`[SyncEngine] Synced: ${item.operation} ${item.endpoint}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          item.attempts += 1;
          item.lastAttempt = new Date().toISOString();
          item.error = errorMessage;

          if (item.attempts >= item.maxAttempts) {
            await this.moveToDeadLetter(item);
            console.warn(`[SyncEngine] Moved to dead letter: ${item.endpoint}`, errorMessage);
          } else {
            // Calculate next retry with exponential backoff
            const delay = PRIORITY_CONFIG[item.priority].baseDelayMs * Math.pow(2, item.attempts - 1);
            item.nextRetryAt = new Date(Date.now() + delay).toISOString();
            remaining.push(item);
            console.log(`[SyncEngine] Will retry in ${delay}ms: ${item.endpoint}`);
          }
        }
      }

      // Keep items that weren't processed
      const notProcessed = queue.filter(item => !processed.includes(item.id) && !remaining.find(r => r.id === item.id));
      await this.saveQueue([...remaining, ...notProcessed]);

      // Update status
      await this.updateStatus(processed.length > 0 ? undefined : remaining[0]?.error);

      // Schedule retry for remaining items
      if (remaining.length > 0) {
        this.scheduleRetry(remaining);
      }

    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Get current sync status
   */
  async getStatus(): Promise<SyncStatus> {
    const queue = await this.getQueue();
    const deadLetter = await this.getDeadLetter();
    const savedStatus = await storageService.get<{ lastSyncAt?: string; lastError?: string }>(STORAGE_KEYS.STATUS);

    return {
      isOnline: connectivityService.isOnline(),
      isSyncing: this.isSyncing,
      pendingCount: queue.length,
      failedCount: deadLetter.length,
      lastSyncAt: savedStatus?.lastSyncAt,
      lastError: savedStatus?.lastError,
    };
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Force sync now
   */
  async forceSync(): Promise<void> {
    if (connectivityService.isOnline()) {
      await this.processQueue();
    }
  }

  /**
   * Clear all pending syncs
   */
  async clearQueue(): Promise<void> {
    await this.saveQueue([]);
    this.notifyListeners();
    console.log('[SyncEngine] Queue cleared');
  }

  /**
   * Get pending items (for debugging/UI)
   */
  async getPendingItems(): Promise<SyncQueueItem[]> {
    return this.getQueue();
  }

  /**
   * Get failed items from dead letter queue
   */
  async getFailedItems(): Promise<SyncQueueItem[]> {
    return this.getDeadLetter();
  }

  /**
   * Retry a specific failed item
   */
  async retryFailedItem(itemId: string): Promise<boolean> {
    const deadLetter = await this.getDeadLetter();
    const item = deadLetter.find(i => i.id === itemId);
    
    if (!item) return false;

    // Reset attempts and move back to queue
    item.attempts = 0;
    item.error = undefined;
    item.nextRetryAt = undefined;

    const queue = await this.getQueue();
    queue.push(item);
    await this.saveQueue(queue);

    // Remove from dead letter
    await this.saveDeadLetter(deadLetter.filter(i => i.id !== itemId));

    // Try to process
    if (connectivityService.isOnline()) {
      this.processQueue();
    }

    return true;
  }

  /**
   * Remove item from dead letter queue
   */
  async removeFailedItem(itemId: string): Promise<boolean> {
    const deadLetter = await this.getDeadLetter();
    const filtered = deadLetter.filter(i => i.id !== itemId);
    
    if (filtered.length === deadLetter.length) return false;
    
    await this.saveDeadLetter(filtered);
    this.notifyListeners();
    return true;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async getQueue(): Promise<SyncQueueItem[]> {
    return await storageService.get<SyncQueueItem[]>(STORAGE_KEYS.QUEUE) || [];
  }

  private async saveQueue(queue: SyncQueueItem[]): Promise<void> {
    await storageService.set(STORAGE_KEYS.QUEUE, queue);
  }

  private async getDeadLetter(): Promise<SyncQueueItem[]> {
    return await storageService.get<SyncQueueItem[]>(STORAGE_KEYS.DEAD_LETTER) || [];
  }

  private async saveDeadLetter(items: SyncQueueItem[]): Promise<void> {
    await storageService.set(STORAGE_KEYS.DEAD_LETTER, items);
  }

  private async executeOperation(item: SyncQueueItem): Promise<void> {
    const method = item.operation === 'delete' ? 'DELETE' :
                   item.operation === 'create' ? 'POST' : 'PUT';

    const authToken = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}${item.endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      },
      body: method !== 'DELETE' ? JSON.stringify(item.payload) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    // Execute callback if specified
    if (item.callback) {
      const data = await response.json().catch(() => ({}));
      await this.executeCallback(item.callback, item.localId, data);
    }
  }

  private async executeCallback(callback: string, localId: string | undefined, data: any): Promise<void> {
    try {
      const [serviceName, methodName] = callback.split('.');
      
      // Dynamic import based on service name
      let service: any;
      switch (serviceName) {
        case 'goalsDashboardService':
          service = (await import('../goalsDashboardService')).default;
          break;
        case 'globalGoalsService':
          service = (await import('../globalGoalsService')).default;
          break;
        // Add more services as needed
        default:
          console.warn(`[SyncEngine] Unknown service for callback: ${serviceName}`);
          return;
      }

      if (service && typeof service[methodName] === 'function') {
        await service[methodName](localId, data);
      }
    } catch (error) {
      console.error('[SyncEngine] Callback execution failed:', error);
    }
  }

  private async moveToDeadLetter(item: SyncQueueItem): Promise<void> {
    const deadLetter = await this.getDeadLetter();
    deadLetter.push(item);
    await this.saveDeadLetter(deadLetter);
  }

  private async updateStatus(lastError?: string): Promise<void> {
    await storageService.set(STORAGE_KEYS.STATUS, {
      lastSyncAt: new Date().toISOString(),
      lastError,
    });
  }

  private scheduleRetry(items: SyncQueueItem[]): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    // Find the nearest retry time
    const nextRetry = items
      .filter(i => i.nextRetryAt)
      .map(i => new Date(i.nextRetryAt!).getTime())
      .sort((a, b) => a - b)[0];

    if (nextRetry) {
      const delay = Math.max(1000, nextRetry - Date.now());
      this.syncTimer = setTimeout(() => {
        this.processQueue();
      }, delay);
    }
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('[SyncEngine] Listener error:', error);
      }
    });
  }

  private async getAuthToken(): Promise<string | null> {
    return storageService.get<string>('auth:token');
  }

  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton
export const syncEngine = new SyncEngine();
export default syncEngine;
