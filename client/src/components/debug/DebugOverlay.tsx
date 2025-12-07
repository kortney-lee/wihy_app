// Debug overlay component for monitoring page activity without opening console
// Usage: Add ?debug=true to any URL
// Logs persist across navigation via sessionStorage

import React, { useState, useEffect, useRef } from 'react';

interface DebugLog {
  timestamp: string;
  type: 'render' | 'css' | 'api' | 'error' | 'state' | 'event' | 'system' | 'navigation' | 'scan';
  message: string;
  data?: any;
  page?: string; // Track which page logged this
  stack?: string; // Stack trace for errors
}

interface DebugOverlayProps {
  pageName: string;
}

// Global session storage key
const DEBUG_SESSION_KEY = 'wihy_debug_session';
const DEBUG_START_TIME_KEY = 'wihy_debug_start_time';
const DEBUG_HISTORY_KEY = 'wihy_debug_history'; // localStorage for historical sessions

// Save current session to history
const saveSessionToHistory = () => {
  try {
    const currentLogs = sessionStorage.getItem(DEBUG_SESSION_KEY);
    const startTime = sessionStorage.getItem(DEBUG_START_TIME_KEY);
    
    if (!currentLogs || !startTime) return;
    
    const logs = JSON.parse(currentLogs);
    if (logs.length === 0) return;
    
    // Get existing history
    const historyStr = localStorage.getItem(DEBUG_HISTORY_KEY);
    const history = historyStr ? JSON.parse(historyStr) : [];
    
    // Add current session
    history.push({
      sessionId: startTime,
      startTime: parseInt(startTime),
      endTime: Date.now(),
      logCount: logs.length,
      logs: logs
    });
    
    // Keep only last 10 sessions
    const trimmed = history.slice(-10);
    localStorage.setItem(DEBUG_HISTORY_KEY, JSON.stringify(trimmed));
    
    console.log('[Debug] Session saved to history:', logs.length, 'logs');
  } catch (e) {
    console.warn('[Debug] Failed to save session to history:', e);
  }
};

export { saveSessionToHistory };

// Initialize debug session if ?debug=true
const initDebugSession = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const isDebugMode = searchParams.get('debug') === 'true';
  
  if (isDebugMode) {
    // If starting fresh, record start time
    if (!sessionStorage.getItem(DEBUG_START_TIME_KEY)) {
      sessionStorage.setItem(DEBUG_START_TIME_KEY, Date.now().toString());
      sessionStorage.setItem(DEBUG_SESSION_KEY, JSON.stringify([]));
    }
    
    // Add ?debug=true to all links if not already present
    setTimeout(() => {
      document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.includes('debug=') && !href.startsWith('http') && !href.startsWith('//')) {
          const separator = href.includes('?') ? '&' : '?';
          link.setAttribute('href', `${href}${separator}debug=true`);
        }
      });
    }, 500);
  }
  
  return isDebugMode;
};

const DebugOverlay: React.FC<DebugOverlayProps> = ({ pageName }) => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showSystemInfo, setShowSystemInfo] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const sessionStartTime = useRef<number>(0);

  // Check if debug mode is enabled
  const isDebugMode = initDebugSession();

  const addLog = (type: DebugLog['type'], message: string, data?: any, stack?: string) => {
    const startTime = sessionStartTime.current;
    const elapsed = startTime ? ((Date.now() - startTime) / 1000).toFixed(3) : '0.000';
    const timestamp = `+${elapsed}s`;
    
    const newLog: DebugLog = { 
      timestamp, 
      type, 
      message, 
      data,
      page: pageName,
      stack
    };
    
    setLogs(prev => {
      const updated = [...prev, newLog];
      // Persist to sessionStorage
      try {
        sessionStorage.setItem(DEBUG_SESSION_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist debug log:', e);
      }
      return updated;
    });
  };

  // Load persisted logs on mount
  useEffect(() => {
    const startTimeStr = sessionStorage.getItem(DEBUG_START_TIME_KEY);
    if (startTimeStr) {
      sessionStartTime.current = parseInt(startTimeStr, 10);
    }
    
    const persistedLogs = sessionStorage.getItem(DEBUG_SESSION_KEY);
    if (persistedLogs) {
      try {
        const parsed = JSON.parse(persistedLogs);
        setLogs(parsed);
        addLog('navigation', `Navigated to: ${pageName}`, { url: window.location.href });
      } catch (e) {
        console.error('Failed to parse debug logs:', e);
      }
    }
  }, []);

  // Monitor component renders
  useEffect(() => {
    // System info logs
    addLog('system', `Page: ${pageName}`);
    addLog('system', `UserAgent: ${navigator.userAgent}`);
    addLog('system', `Platform: ${navigator.platform}`);
    addLog('system', `Screen: ${window.screen.width}x${window.screen.height}`);
    addLog('system', `Viewport: ${window.innerWidth}x${window.innerHeight}`);
    addLog('system', `Device Pixel Ratio: ${window.devicePixelRatio}`);
    addLog('system', `Touch Support: ${('ontouchstart' in window) || (navigator.maxTouchPoints > 0) ? 'YES' : 'NO'}`);
    addLog('system', `URL: ${window.location.href}`);
    
    addLog('render', `${pageName} mounted`);
    
    return () => {
      addLog('render', `${pageName} unmounted`);
    };
  }, [pageName]);

  // Get all loaded stylesheets
  useEffect(() => {
    const styleSheets = Array.from(document.styleSheets);
    addLog('css', `Total stylesheets: ${styleSheets.length}`);
    styleSheets.forEach((sheet, index) => {
      try {
        const href = sheet.href || `inline-${index}`;
        const rulesCount = sheet.cssRules?.length || 0;
        addLog('css', `[${index}] ${href} (${rulesCount} rules)`);
      } catch (e) {
        addLog('css', `[${index}] CORS blocked: ${sheet.href || 'unknown'}`);
      }
    });
    
    // Check for mobile-fixes.css specifically
    const mobileFixesLoaded = styleSheets.some(sheet => 
      sheet.href?.includes('mobile-fixes.css')
    );
    if (mobileFixesLoaded) {
      addLog('css', '✅ mobile-fixes.css is LOADED');
    } else {
      addLog('css', '❌ mobile-fixes.css NOT found');
    }
    
    // Inspect body styles that could cause white screen
    setTimeout(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      addLog('css', `BODY backgroundColor: ${computedStyle.backgroundColor}`);
      addLog('css', `BODY color: ${computedStyle.color}`);
      addLog('css', `BODY -webkit-text-fill-color: ${computedStyle.getPropertyValue('-webkit-text-fill-color')}`);
      
      // Check main content area
      const mainContent = document.querySelector('.nutrition-facts-container, main, [class*="content"]');
      if (mainContent) {
        const mainStyle = window.getComputedStyle(mainContent);
        addLog('css', `MAIN backgroundColor: ${mainStyle.backgroundColor}`);
        addLog('css', `MAIN color: ${mainStyle.color}`);
        addLog('css', `MAIN -webkit-text-fill-color: ${mainStyle.getPropertyValue('-webkit-text-fill-color')}`);
      }
    }, 500);
  }, []);

  // Monitor fetch/XHR calls
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0].toString();
      addLog('api', `FETCH → ${url}`);
      try {
        const response = await originalFetch(...args);
        addLog('api', `FETCH ← ${url} (${response.status})`, { status: response.status });
        return response;
      } catch (error: any) {
        addLog('error', `FETCH ERROR: ${url}`, error);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Monitor console errors with stack traces
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const error = args[0];
      let stack = '';
      
      if (error instanceof Error) {
        stack = error.stack || '';
      } else if (typeof error === 'object' && error?.stack) {
        stack = error.stack;
      } else {
        // Capture current stack trace
        stack = new Error().stack || '';
      }
      
      addLog('error', `❌ ERROR: ${args.join(' ')}`, { args, stack });
      originalError(...args);
    };
    
    console.warn = (...args) => {
      addLog('error', `⚠️ WARNING: ${args.join(' ')}`, { args });
      originalWarn(...args);
    };
    
    // Global error handler
    const handleGlobalError = (event: ErrorEvent) => {
      addLog('error', `🔥 UNCAUGHT ERROR: ${event.message}`, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack || 'No stack trace available'
      });
    };
    
    // Promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog('error', `🔥 UNHANDLED PROMISE REJECTION: ${event.reason}`, {
        reason: event.reason,
        stack: event.reason?.stack || 'No stack trace available'
      });
    };
    
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Export logs function
  const exportLogs = () => {
    const exportData = {
      session_start: new Date(sessionStartTime.current).toISOString(),
      session_duration: `${((Date.now() - sessionStartTime.current) / 1000).toFixed(1)}s`,
      current_page: pageName,
      user_agent: navigator.userAgent,
      platform: navigator.platform,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${window.screen.width}x${window.screen.height}`,
      pixel_ratio: window.devicePixelRatio,
      touch_support: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
      total_logs: logs.length,
      logs: logs.map(log => ({
        time: log.timestamp,
        page: log.page,
        type: log.type,
        message: log.message,
        data: log.data
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wihy-debug-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addLog('system', `Session exported: ${logs.length} entries from ${sessionStartTime.current ? new Date(sessionStartTime.current).toLocaleTimeString() : 'start'}`);
  };

  // Clear session
  const clearSession = () => {
    if (confirm('Clear debug session and reload page?')) {
      sessionStorage.removeItem(DEBUG_SESSION_KEY);
      sessionStorage.removeItem(DEBUG_START_TIME_KEY);
      window.location.href = window.location.pathname; // Remove query params
    }
  };

  if (!isDebugMode) return null;

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.type === filter);

  const getTypeColor = (type: DebugLog['type']) => {
    switch (type) {
      case 'navigation': return '#8b5cf6'; // Purple for navigation
      case 'scan': return '#f59e0b'; // Amber for barcode scanning
      case 'render': return '#4cbb17';
      case 'css': return '#1a73e8';
      case 'api': return '#fa5f06';
      case 'error': return '#dc2626';
      case 'state': return '#9333ea';
      case 'event': return '#06b6d4';
      case 'system': return '#eab308';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 999999,
      backgroundColor: '#1f2937',
      color: '#f3f4f6',
      fontFamily: 'Monaco, Consolas, monospace',
      fontSize: '12px',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: isExpanded ? '70vh' : '50px',
      transition: 'max-height 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#111827',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #374151',
        cursor: 'pointer',
        minHeight: '50px'
      }} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontWeight: 'bold', color: '#4cbb17', fontSize: '14px' }}>
            🐛 DEBUG SESSION: {pageName}
          </span>
          <span style={{ color: '#9ca3af', fontSize: '11px' }}>
            {logs.length} logs • Started {sessionStartTime.current ? new Date(sessionStartTime.current).toLocaleTimeString() : 'now'} • Tap to {isExpanded ? 'collapse' : 'expand'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              window.open('/debug-fullscreen', '_blank');
            }}
            style={{
              backgroundColor: '#10b981',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              minHeight: '36px',
              minWidth: '70px'
            }}
          >
            Full Page
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); clearSession(); }}
            style={{
              backgroundColor: '#dc2626',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              minHeight: '36px',
              minWidth: '70px'
            }}
          >
            Reset
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); exportLogs(); }}
            style={{
              backgroundColor: '#1a73e8',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              minHeight: '36px',
              minWidth: '70px'
            }}
          >
            Export
          </button>
        </div>
      </div>

      {/* System Info Toggle */}
      {isExpanded && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#111827',
          borderBottom: '1px solid #374151',
        }}>
          <button
            onClick={() => setShowSystemInfo(!showSystemInfo)}
            style={{
              backgroundColor: showSystemInfo ? '#374151' : 'transparent',
              border: '1px solid #374151',
              color: '#f3f4f6',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%',
              minHeight: '36px'
            }}
          >
            {showSystemInfo ? '🔽' : '▶️'} System Info
          </button>
        </div>
      )}

      {/* Filters */}
      {isExpanded && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#111827',
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #374151',
          flexWrap: 'wrap'
        }}>
          {['all', 'navigation', 'scan', 'api', 'error', 'css', 'render', 'state', 'event', 'system'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                backgroundColor: filter === type ? '#374151' : 'transparent',
                border: '1px solid #374151',
                color: filter === type ? '#4cbb17' : '#f3f4f6',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: filter === type ? 'bold' : 'normal',
                minHeight: '36px',
                flex: '0 0 auto'
              }}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Logs */}
      {isExpanded && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px',
          backgroundColor: '#1f2937',
          WebkitOverflowScrolling: 'touch'
        }}>
          {filteredLogs.map((log, idx) => {
            // Hide system logs if toggle is off
            if (log.type === 'system' && !showSystemInfo) return null;
            
            return (
              <div 
                key={idx}
                style={{
                  padding: '8px 12px',
                  marginBottom: '6px',
                  backgroundColor: log.type === 'error' ? '#7f1d1d' : '#374151',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${getTypeColor(log.type)}`,
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}
              >
                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ color: '#9ca3af', fontSize: '10px' }}>
                    {log.timestamp}
                  </span>
                  {log.page && (
                    <span style={{
                      backgroundColor: '#1f2937',
                      color: '#60a5fa',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      [{log.page}]
                    </span>
                  )}
                  <span style={{ 
                    color: getTypeColor(log.type),
                    fontWeight: 'bold',
                    fontSize: '10px',
                    textTransform: 'uppercase'
                  }}>
                    {log.type}
                  </span>
                </div>
                <div style={{ 
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  color: '#f3f4f6'
                }}>
                  {log.message}
                </div>
                {log.stack && (
                  <details style={{ marginTop: '8px', cursor: 'pointer' }}>
                    <summary style={{ 
                      color: '#ef4444',
                      padding: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      🔥 Stack Trace
                    </summary>
                    <pre style={{ 
                      margin: '8px 0 0 0',
                      padding: '8px',
                      fontSize: '10px',
                      color: '#fca5a5',
                      backgroundColor: '#450a0a',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '300px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      border: '1px solid #7f1d1d'
                    }}>
                      {log.stack}
                    </pre>
                  </details>
                )}
                {log.data && (
                  <details style={{ marginTop: '8px', cursor: 'pointer' }}>
                    <summary style={{ 
                      color: '#60a5fa',
                      padding: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      📋 View Data
                    </summary>
                    <pre style={{ 
                      margin: '8px 0 0 0',
                      padding: '8px',
                      fontSize: '10px',
                      color: '#d1d5db',
                      backgroundColor: '#111827',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '200px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}>
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
};

export default DebugOverlay;

// Export hook for adding custom debug logs from any component
export const useDebugLog = (pageName: string) => {
  const searchParams = new URLSearchParams(window.location.search);
  const isDebugMode = searchParams.get('debug') === 'true';

  const addToSession = (type: DebugLog['type'], message: string, data?: any, stack?: string) => {
    if (!isDebugMode) return;
    
    try {
      let startTimeStr = sessionStorage.getItem(DEBUG_START_TIME_KEY);
      if (!startTimeStr) {
        // Initialize session if not exists
        const now = Date.now().toString();
        sessionStorage.setItem(DEBUG_START_TIME_KEY, now);
        sessionStorage.setItem(DEBUG_SESSION_KEY, JSON.stringify([]));
        startTimeStr = now;
        console.log('[Debug] Session initialized at:', new Date(parseInt(now)));
      }
      const startTime = parseInt(startTimeStr, 10);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(3);
      const timestamp = `+${elapsed}s`;
      
      const persistedLogs = sessionStorage.getItem(DEBUG_SESSION_KEY);
      const logs = persistedLogs ? JSON.parse(persistedLogs) : [];
      
      logs.push({
        timestamp,
        type,
        message,
        data,
        page: pageName,
        stack
      });
      
      sessionStorage.setItem(DEBUG_SESSION_KEY, JSON.stringify(logs));
      console.log(`[${pageName}] ${type.toUpperCase()}:`, message, data);
    } catch (e) {
      console.warn('Failed to add debug log:', e);
    }
  };

  return {
    logState: (message: string, data?: any) => {
      addToSession('state', message, data);
    },
    logEvent: (message: string, data?: any) => {
      addToSession('event', message, data);
    },
    logRender: (message: string, data?: any) => {
      addToSession('render', message, data);
    },
    logAPI: (message: string, data?: any) => {
      addToSession('api', message, data);
    },
    logError: (message: string, data?: any, error?: Error) => {
      const stack = error?.stack || new Error().stack || '';
      addToSession('error', message, data, stack);
    },
    logNavigation: (message: string, data?: any) => {
      addToSession('navigation', message, data);
    },
    logScan: (message: string, data?: any) => {
      addToSession('scan', message, data);
    }
  };
};
