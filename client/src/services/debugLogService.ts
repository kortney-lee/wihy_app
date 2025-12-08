// client/src/services/debugLogService.ts

export interface DebugLog {
  timestamp: string;
  type: 'info' | 'error' | 'warning' | 'api' | 'navigation' | 'user_action' | 'scan' | 'state' | 'css' | 'render' | 'event' | 'system';
  message: string;
  data?: any;
  page?: string;
  stack?: string;
}

class DebugLogService {
  private API_BASE = 'https://services.wihy.ai/api';
  private pendingLogs: Map<string, DebugLog[]> = new Map();
  private flushInterval = 5000; // Flush every 5 seconds
  private batchSize = 50; // Max logs per batch
  private flushTimers: Map<string, any> = new Map();

  /**
   * Create a new debug session
   */
  async createSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/debug-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userAgent: navigator.userAgent,
          platform: 'web',
          startTime: new Date().toISOString(),
          url: window.location.href
        })
      });

      if (!response.ok) {
        console.warn('Failed to create debug session:', response.statusText);
      }
    } catch (error) {
      console.warn('Debug session creation failed:', error);
      // Fail silently - don't break app if logging fails
    }
  }

  /**
   * Queue a log entry (will be sent in batches)
   */
  queueLog(log: DebugLog, sessionId: string): void {
    if (!this.pendingLogs.has(sessionId)) {
      this.pendingLogs.set(sessionId, []);
    }

    this.pendingLogs.get(sessionId)!.push(log);

    // Auto-flush if batch size reached
    if (this.pendingLogs.get(sessionId)!.length >= this.batchSize) {
      this.flush(sessionId);
    } else {
      // Schedule flush if not already scheduled
      if (!this.flushTimers.has(sessionId)) {
        const timer = setTimeout(() => {
          this.flush(sessionId);
          this.flushTimers.delete(sessionId);
        }, this.flushInterval);
        this.flushTimers.set(sessionId, timer);
      }
    }
  }

  /**
   * Flush pending logs to server
   */
  async flush(sessionId: string): Promise<void> {
    const logs = this.pendingLogs.get(sessionId) || [];
    if (logs.length === 0) return;

    try {
      const response = await fetch(
        `${this.API_BASE}/debug-sessions/${sessionId}/logs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs })
        }
      );

      if (response.ok) {
        // Clear queue on success
        this.pendingLogs.set(sessionId, []);
      } else {
        console.warn('Failed to flush logs:', response.statusText);
        // Keep logs in queue for retry
      }
    } catch (error) {
      console.warn('Debug log flush failed:', error);
      // Keep logs in queue - will retry on next flush
    }

    // Clear timer if exists
    const timer = this.flushTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.flushTimers.delete(sessionId);
    }
  }

  /**
   * Close a debug session
   */
  async closeSession(sessionId: string): Promise<void> {
    // Flush any remaining logs
    await this.flush(sessionId);

    try {
      const response = await fetch(
        `${this.API_BASE}/debug-sessions/${sessionId}/close`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endTime: new Date().toISOString() })
        }
      );

      if (!response.ok) {
        console.warn('Failed to close debug session:', response.statusText);
      }

      // Clean up
      this.pendingLogs.delete(sessionId);
      const timer = this.flushTimers.get(sessionId);
      if (timer) {
        clearTimeout(timer);
        this.flushTimers.delete(sessionId);
      }
    } catch (error) {
      console.warn('Debug session close failed:', error);
    }
  }
}

export const debugLogService = new DebugLogService();
