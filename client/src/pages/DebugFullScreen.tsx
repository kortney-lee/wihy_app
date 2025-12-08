// Full-screen debug console for mobile devices
// Access via /debug-fullscreen or click "Full Page" button in debug overlay

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface DebugLog {
  timestamp: string;
  type: 'render' | 'css' | 'api' | 'error' | 'state' | 'event' | 'system' | 'navigation' | 'scan' | 'info' | 'warning' | 'user_action';
  message: string;
  data?: any;
  page?: string;
  stack?: string;
}

interface Session {
  session_id: string;
  platform: string;
  log_count: number;
  created_at: string;
  user_agent?: string;
  start_time?: string;
  end_time?: string;
}

const DEBUG_SESSION_KEY = 'wihy_debug_session';
const DEBUG_START_TIME_KEY = 'wihy_debug_start_time';
const DEBUG_HISTORY_KEY = 'wihy_debug_history';
const API_BASE = 'https://services.wihy.ai/api';

interface DebugSession {
  sessionId: string;
  startTime: number;
  endTime: number;
  logCount: number;
  logs: DebugLog[];
}

const DebugFullScreen: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch sessions from API
  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_BASE}/debug-sessions?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        console.log('[DebugFullScreen] Loaded', data.sessions?.length || 0, 'sessions from API');
      }
    } catch (error) {
      console.error('[DebugFullScreen] Failed to fetch sessions:', error);
    }
  };

  // Load logs from API or current sessionStorage
  const loadLogs = async (sessionId?: string) => {
    console.log('[DebugFullScreen] loadLogs called, sessionId:', sessionId);
    
    if (sessionId) {
      // Load from API
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/debug-sessions/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
          setSelectedSession(sessionId);
          if (data.session?.start_time) {
            setSessionStartTime(new Date(data.session.start_time).getTime());
          }
          console.log('[DebugFullScreen] Loaded session from API:', data.logs?.length || 0, 'logs');
        }
      } catch (error) {
        console.error('[DebugFullScreen] Failed to fetch session logs:', error);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Load current session from sessionStorage (local)
    try {
      const persistedLogs = sessionStorage.getItem(DEBUG_SESSION_KEY);
      const startTimeStr = sessionStorage.getItem(DEBUG_START_TIME_KEY);
      
      console.log('[DebugFullScreen] persistedLogs raw:', persistedLogs);
      console.log('[DebugFullScreen] startTimeStr:', startTimeStr);
      
      if (persistedLogs) {
        const parsedLogs = JSON.parse(persistedLogs);
        console.log('[DebugFullScreen] Parsed logs:', parsedLogs.length, 'logs');
        setLogs(parsedLogs);
        setSelectedSession(null);
      } else {
        console.log('[DebugFullScreen] No logs found in sessionStorage');
        setLogs([]);
      }
      
      if (startTimeStr) {
        setSessionStartTime(parseInt(startTimeStr, 10));
      }
    } catch (e) {
      console.error('[DebugFullScreen] Failed to load debug logs:', e);
    }
  };

  const searchLogs = async (query: string) => {
    if (!query.trim()) {
      loadLogs();
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/debug-sessions/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        console.log('[DebugFullScreen] Search returned', data.logs?.length || 0, 'logs');
      }
    } catch (error) {
      console.error('[DebugFullScreen] Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[DebugFullScreen] Component mounted, loading logs...');
    fetchSessions();
    loadLogs();
    
    if (autoRefresh && !selectedSession) {
      const interval = setInterval(() => loadLogs(), 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedSession]);

  const clearSession = () => {
    if (confirm('Clear all debug logs and return to app?')) {
      sessionStorage.removeItem(DEBUG_SESSION_KEY);
      sessionStorage.removeItem(DEBUG_START_TIME_KEY);
      navigate(-1);
    }
  };

  const exportLogs = () => {
    const exportData = {
      session_start: new Date(sessionStartTime).toISOString(),
      session_duration: `${((Date.now() - sessionStartTime) / 1000).toFixed(1)}s`,
      total_logs: logs.length,
      logs: logs
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wihy-debug-fullscreen-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const text = filteredLogs.map(log => {
      let entry = `[${log.timestamp}] [${log.page || 'Unknown'}] ${log.type.toUpperCase()}: ${log.message}`;
      if (log.stack) {
        entry += `\n  Stack: ${log.stack}`;
      }
      if (log.data) {
        entry += `\n  Data: ${JSON.stringify(log.data, null, 2)}`;
      }
      return entry;
    }).join('\n\n');
    
    navigator.clipboard.writeText(text).then(() => {
      alert('Logs copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.type !== filter) return false;
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getTypeColor = (type: DebugLog['type']) => {
    switch (type) {
      case 'navigation': return '#8b5cf6';
      case 'scan': return '#f59e0b';
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

  const errorCount = logs.filter(l => l.type === 'error').length;
  const apiCount = logs.filter(l => l.type === 'api').length;
  const scanCount = logs.filter(l => l.type === 'scan').length;

  return (
    <div style={{
      backgroundColor: '#0f172a',
      color: '#f1f5f9',
      minHeight: '100vh',
      fontFamily: 'Monaco, Consolas, monospace',
      fontSize: '13px',
      padding: '0',
      margin: '0'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1e293b',
        borderBottom: '2px solid #334155',
        padding: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#4cbb17' }}>
            🐛 Debug Console
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                backgroundColor: showHistory ? '#8b5cf6' : '#475569',
                border: 'none',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              📚 Sessions ({sessions.length})
            </button>
            <button
              onClick={() => navigate(-1)}
              style={{
                backgroundColor: '#64748b',
                border: 'none',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ← Back
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
          <span>📊 {logs.length} Total</span>
          <span style={{ color: '#dc2626' }}>❌ {errorCount} Errors</span>
          <span style={{ color: '#fa5f06' }}>🌐 {apiCount} API</span>
          <span style={{ color: '#f59e0b' }}>📷 {scanCount} Scans</span>
          <span>⏱️ Started: {sessionStartTime ? new Date(sessionStartTime).toLocaleTimeString() : 'N/A'}</span>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="🔍 Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                searchLogs(searchTerm);
              }
            }}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '6px',
              color: '#f1f5f9',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => searchLogs(searchTerm)}
            style={{
              backgroundColor: '#3b82f6',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            🔎 Search
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {['all', 'error', 'api', 'scan', 'navigation', 'css', 'render', 'state', 'event', 'system'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                backgroundColor: filter === type ? '#475569' : '#334155',
                border: filter === type ? '2px solid #4cbb17' : '1px solid #475569',
                color: filter === type ? '#4cbb17' : '#cbd5e1',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                textTransform: 'uppercase',
                fontWeight: filter === type ? 'bold' : 'normal'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              backgroundColor: autoRefresh ? '#10b981' : '#64748b',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {autoRefresh ? '✓ Auto-Refresh' : 'Auto-Refresh OFF'}
          </button>
          <button
            onClick={() => loadLogs()}
            style={{
              backgroundColor: '#3b82f6',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={copyToClipboard}
            style={{
              backgroundColor: '#8b5cf6',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            📋 Copy
          </button>
          <button
            onClick={exportLogs}
            style={{
              backgroundColor: '#1a73e8',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            💾 Export
          </button>
          <button
            onClick={clearSession}
            style={{
              backgroundColor: '#dc2626',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div style={{
          backgroundColor: '#1e293b',
          borderBottom: '2px solid #334155',
          padding: '16px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#94a3b8' }}>
            {loading ? 'Loading...' : 'Debug Sessions'}
          </h2>
          {sessions.length === 0 ? (
            <div style={{ color: '#64748b', padding: '20px', textAlign: 'center' }}>
              No sessions found on server
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.session_id}
                onClick={() => {
                  loadLogs(session.session_id);
                  setShowHistory(false);
                }}
                style={{
                  backgroundColor: selectedSession === session.session_id ? '#334155' : '#0f172a',
                  border: selectedSession === session.session_id ? '2px solid #8b5cf6' : '1px solid #475569',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '8px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: '12px' }}>
                    {session.session_id}
                  </span>
                  <span style={{ color: '#94a3b8' }}>
                    {session.log_count} logs
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {session.platform} • {new Date(session.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
          <button
            onClick={() => {
              loadLogs();
              setShowHistory(false);
            }}
            style={{
              width: '100%',
              backgroundColor: '#334155',
              border: 'none',
              color: '#ffffff',
              padding: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginTop: '8px'
            }}
          >
            📌 Current Session
          </button>
        </div>
      )}

      {/* Logs */}
      <div style={{ padding: '16px' }}>
        {filteredLogs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#64748b',
            fontSize: '16px'
          }}>
            {logs.length === 0 ? (
              <>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <div>No logs yet. Start debugging by navigating with ?debug=true</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
                <div>No logs match your filter or search</div>
              </>
            )}
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: log.type === 'error' ? '#7f1d1d' : '#1e293b',
                border: `2px solid ${getTypeColor(log.type)}`,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {log.timestamp}
                </span>
                {log.page && (
                  <span style={{
                    backgroundColor: '#334155',
                    color: '#60a5fa',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    [{log.page}]
                  </span>
                )}
                <span style={{
                  backgroundColor: getTypeColor(log.type),
                  color: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {log.type}
                </span>
              </div>

              {/* Message */}
              <div style={{
                color: '#f1f5f9',
                fontSize: '14px',
                lineHeight: '1.6',
                marginBottom: log.stack || log.data ? '12px' : '0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {log.message}
              </div>

              {/* Stack Trace */}
              {log.stack && (
                <details open={log.type === 'error'} style={{ marginTop: '12px' }}>
                  <summary style={{
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>
                    🔥 Stack Trace
                  </summary>
                  <pre style={{
                    backgroundColor: '#450a0a',
                    border: '1px solid #7f1d1d',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '11px',
                    color: '#fca5a5',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    lineHeight: '1.5'
                  }}>
                    {log.stack}
                  </pre>
                </details>
              )}

              {/* Data */}
              {log.data && (
                <details style={{ marginTop: '12px' }}>
                  <summary style={{
                    color: '#60a5fa',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>
                    📋 Additional Data
                  </summary>
                  <pre style={{
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '11px',
                    color: '#cbd5e1',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    lineHeight: '1.5'
                  }}>
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '24px',
        color: '#64748b',
        fontSize: '12px'
      }}>
        Showing {filteredLogs.length} of {logs.length} logs
      </div>
    </div>
  );
};

export default DebugFullScreen;
