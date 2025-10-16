/**
 * Logger utility that respects environment settings
 * Only logs in development or when debug mode is explicitly enabled
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment: boolean;
  private isDebugEnabled: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isDebugEnabled = process.env.REACT_APP_DEBUG_MODE === 'true';
  }

  private shouldLog(level: LogLevel): boolean {
    // Always allow errors and warnings
    if (level === 'error' || level === 'warn') {
      return true;
    }
    
    // For debug and info, only log in development or if debug is explicitly enabled
    return this.isDevelopment || this.isDebugEnabled;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(`ℹ️ [INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`❌ [ERROR] ${message}`, ...args);
    }
  }

  // API-specific logging
  apiRequest(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(`🌐 [API] ${message}`, data || '');
    }
  }

  apiResponse(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(`📡 [RESPONSE] ${message}`, data || '');
    }
  }

  // User action logging
  userAction(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(`👤 [USER] ${message}`, data || '');
    }
  }

  // Cache operations
  cache(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(`💾 [CACHE] ${message}`, data || '');
    }
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;