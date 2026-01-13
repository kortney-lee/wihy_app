// src/services/debugLogService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface DebugLog {
  timestamp: string;
  type: 'info' | 'error' | 'warning' | 'api' | 'navigation' | 'user_action';
  message: string;
  data?: any;
  page?: string;
  stack?: string;
}

// Check if running in development mode
const isDev = __DEV__ || process.env.NODE_ENV === 'development';

class DebugLogService {
  private API_BASE = 'https://services.wihy.ai/api';
  private pendingLogs: Map<string, DebugLog[]> = new Map();
  private flushInterval = 5000; // Flush every 5 seconds
  private batchSize = 50; // Max logs per batch
  private flushTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private startTime: number = Date.now();
  private currentSessionId: string | null = null;

  // Console color codes for different log types
  private logColors = {
    info: '\x1b[36m',     // Cyan
    error: '\x1b[31m',    // Red
    warning: '\x1b[33m',  // Yellow
    api: '\x1b[35m',      // Magenta
    navigation: '\x1b[32m', // Green
    user_action: '\x1b[34m', // Blue
    reset: '\x1b[0m',
  };

  /**
   * Get formatted timestamp since session start
   */
  private getTimestamp(): string {
    const elapsed = (Date.now() - this.startTime) / 1000;
    return `+${elapsed.toFixed(3)}s`;
  }

  /**
   * Log to console in development mode
   */
  private logToConsole(log: DebugLog): void {
    const color = this.logColors[log.type] || '';
    const reset = this.logColors.reset;
    const prefix = `[${log.type.toUpperCase()}]`;
    const pageInfo = log.page ? ` (${log.page})` : '';
    
    // Format: [TYPE] +0.000s (Page) Message
    const formattedMessage = `${color}${prefix}${reset} ${log.timestamp}${pageInfo} ${log.message}`;
    
    switch (log.type) {
      case 'error':
        console.error(formattedMessage, log.data || '');
        if (log.stack) {
          console.error('Stack:', log.stack);
        }
        break;
      case 'warning':
        console.warn(formattedMessage, log.data || '');
        break;
      default:
        console.log(formattedMessage, log.data ? JSON.stringify(log.data, null, 2) : '');
    }
  }

  /**
   * Create a new debug session
   */
  async createSession(sessionId: string): Promise<void> {
    this.startTime = Date.now();
    this.currentSessionId = sessionId;
    
    // Store session ID for access across components
    await AsyncStorage.setItem('debugSessionId', sessionId);

    if (isDev) {
      console.log('\n========================================');
      console.log(`🔍 Debug Session Started: ${sessionId}`);
      console.log(`📱 Platform: ${Platform.OS} ${Platform.Version}`);
      console.log(`⏰ Time: ${new Date().toISOString()}`);
      console.log('========================================\n');
      return;
    }

    try {
      const response = await fetch(`${this.API_BASE}/debug-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userAgent: `WiHY/${Constants.expoConfig?.version || '1.0.0'} (${Platform.OS})`,
          platform: Platform.OS,
          startTime: new Date().toISOString(),
          deviceInfo: {
            os: Platform.OS,
            version: Platform.Version,
            isTV: Platform.isTV,
          }
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
   * Get the current session ID
   */
  async getSessionId(): Promise<string | null> {
    if (this.currentSessionId) return this.currentSessionId;
    return await AsyncStorage.getItem('debugSessionId');
  }

  /**
   * Queue a log entry (will be sent in batches or logged locally)
   */
  queueLog(log: DebugLog, sessionId?: string): void {
    // Auto-fill timestamp if not provided
    if (!log.timestamp || log.timestamp === '') {
      log.timestamp = this.getTimestamp();
    }

    // Always log to console in dev mode
    if (isDev) {
      this.logToConsole(log);
      return; // Don't send to API in dev mode
    }

    const sid = sessionId || this.currentSessionId;
    if (!sid) {
      console.warn('No session ID available for logging');
      return;
    }

    if (!this.pendingLogs.has(sid)) {
      this.pendingLogs.set(sid, []);
    }

    this.pendingLogs.get(sid)!.push(log);

    // Auto-flush if batch size reached
    if (this.pendingLogs.get(sid)!.length >= this.batchSize) {
      this.flush(sid);
    } else {
      // Schedule flush if not already scheduled
      if (!this.flushTimers.has(sid)) {
        const timer = setTimeout(() => {
          this.flush(sid);
          this.flushTimers.delete(sid);
        }, this.flushInterval);
        this.flushTimers.set(sid, timer);
      }
    }
  }

  /**
   * Convenience methods for different log types
   */
  info(message: string, data?: any, page?: string): void {
    this.queueLog({ timestamp: this.getTimestamp(), type: 'info', message, data, page });
  }

  error(message: string, data?: any, page?: string, stack?: string): void {
    this.queueLog({ timestamp: this.getTimestamp(), type: 'error', message, data, page, stack });
  }

  warning(message: string, data?: any, page?: string): void {
    this.queueLog({ timestamp: this.getTimestamp(), type: 'warning', message, data, page });
  }

  api(message: string, data?: any, page?: string): void {
    this.queueLog({ timestamp: this.getTimestamp(), type: 'api', message, data, page });
  }

  navigation(message: string, data?: any, page?: string): void {
    this.queueLog({ timestamp: this.getTimestamp(), type: 'navigation', message, data, page });
  }

  userAction(message: string, data?: any, page?: string): void {
    this.queueLog({ timestamp: this.getTimestamp(), type: 'user_action', message, data, page });
  }

  /**
   * Flush pending logs to server
   */
  async flush(sessionId?: string): Promise<void> {
    const sid = sessionId || this.currentSessionId;
    if (!sid) return;

    const logs = this.pendingLogs.get(sid) || [];
    if (logs.length === 0) return;

    // In dev mode, logs are already printed to console
    if (isDev) {
      this.pendingLogs.set(sid, []);
      return;
    }

    try {
      const response = await fetch(
        `${this.API_BASE}/debug-sessions/${sid}/logs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs })
        }
      );

      if (response.ok) {
        // Clear queue on success
        this.pendingLogs.set(sid, []);
      } else {
        console.warn('Failed to flush logs:', response.statusText);
        // Keep logs in queue for retry
      }
    } catch (error) {
      console.warn('Debug log flush failed:', error);
      // Keep logs in queue - will retry on next flush
    }

    // Clear timer if exists
    const timer = this.flushTimers.get(sid);
    if (timer) {
      clearTimeout(timer);
      this.flushTimers.delete(sid);
    }
  }

  /**
   * Close a debug session
   */
  async closeSession(sessionId?: string): Promise<void> {
    const sid = sessionId || this.currentSessionId;
    if (!sid) return;

    // Flush any remaining logs
    await this.flush(sid);

    if (isDev) {
      console.log('\n========================================');
      console.log(`🔍 Debug Session Ended: ${sid}`);
      console.log(`⏱️ Duration: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`);
      console.log('========================================\n');
      await AsyncStorage.removeItem('debugSessionId');
      this.currentSessionId = null;
      return;
    }

    try {
      const response = await fetch(
        `${this.API_BASE}/debug-sessions/${sid}/close`,
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
      this.pendingLogs.delete(sid);
      const timer = this.flushTimers.get(sid);
      if (timer) {
        clearTimeout(timer);
        this.flushTimers.delete(sid);
      }
      await AsyncStorage.removeItem('debugSessionId');
      this.currentSessionId = null;
    } catch (error) {
      console.warn('Debug session close failed:', error);
    }
  }
}

export const debugLogService = new DebugLogService();
