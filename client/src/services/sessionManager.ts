/**
 * Session Manager - Centralized session management for all services
 * 
 * This service manages session state across the application:
 * - For authenticated users: uses user.id as session identifier
 * - For anonymous users: creates and maintains temporary session via backend API
 * - Provides session ID to chatService, conversationService, and all other services
 * - Falls back to client-only sessions if backend is unavailable
 * 
 * Session flow:
 * 1. App initializes → SessionManager checks auth state
 * 2. If authenticated → use user.id as sessionId
 * 3. If not authenticated → create backend anonymous session (or client fallback)
 * 4. Pass sessionId to all services (chat, conversation, etc.)
 * 5. Persist session across navigation
 * 6. Validate session periodically to check rate limits
 */

import { authService, User } from './authService';
import { conversationService } from './conversationService';
import { chatService } from './chatService';

export interface SessionInfo {
  sessionId: string;
  userId: string | null;
  isAuthenticated: boolean;
  isTemporary: boolean;
  createdAt: Date;
  expiresAt?: Date;
  requestCount?: number;
  isBackendSession?: boolean; // True if using backend API, false if client-only fallback
}

interface BackendAnonymousSessionResponse {
  success: boolean;
  session_id: string;
  expires_at: string;
  fingerprint?: string;
}

interface BackendSessionValidation {
  valid: boolean;
  session_id: string;
  created_at: string;
  expires_at: string;
  request_count: number;
  throttled?: boolean;
  throttle_until?: string;
  reason?: string;
}

class SessionManager {
  private currentSession: SessionInfo | null = null;
  private listeners: Set<(session: SessionInfo) => void> = new Set();
  private storageKey = 'wihy_session';
  private backendUrl = 'https://auth.wihy.ai';
  private validationInterval: NodeJS.Timeout | null = null;
  private useBackend = true; // Try backend first, fallback to client-only if fails

  /**
   * Initialize session manager
   * Checks auth state and creates/restores session
   */
  async initialize(): Promise<SessionInfo> {
    console.log('🔑 SESSION MANAGER: Initializing...');

    // Check if we have a stored session
    const storedSession = this.getStoredSession();
    
    // Get current auth state
    const authState = authService.getState();
    
    if (authState.isAuthenticated && authState.user) {
      // Authenticated user - use user ID as session
      const session: SessionInfo = {
        sessionId: authState.user.id,
        userId: authState.user.id,
        isAuthenticated: true,
        isTemporary: false,
        createdAt: new Date(),
        isBackendSession: false
      };
      
      this.setSession(session);
      this.initializeServices(session);
      
      console.log('🔑 SESSION MANAGER: Authenticated session created:', session.sessionId);
      return session;
      
    } else if (storedSession && !this.isSessionExpired(storedSession)) {
      // Restore stored session if not expired
      console.log('🔑 SESSION MANAGER: Found stored session, validating...');
      
      // Validate backend session if it was created via backend
      if (storedSession.isBackendSession) {
        const validation = await this.validateBackendSession(storedSession.sessionId);
        
        if (validation.valid) {
          // Update session with latest info from backend
          storedSession.requestCount = validation.request_count;
          storedSession.expiresAt = new Date(validation.expires_at);
          
          this.setSession(storedSession);
          this.initializeServices(storedSession);
          this.startValidationInterval();
          
          console.log('🔑 SESSION MANAGER: Restored backend session:', storedSession.sessionId);
          return storedSession;
        } else {
          console.log('🔑 SESSION MANAGER: Stored backend session invalid, creating new...');
        }
      } else {
        // Client-only session, restore it
        this.setSession(storedSession);
        this.initializeServices(storedSession);
        
        console.log('🔑 SESSION MANAGER: Restored client session:', storedSession.sessionId);
        return storedSession;
      }
    }
    
    // Create new temporary session (try backend first, fallback to client)
    const session = await this.createTemporarySession();
    this.setSession(session);
    this.initializeServices(session);
    
    if (session.isBackendSession) {
      this.startValidationInterval();
    }
    
    console.log('🔑 SESSION MANAGER: Created new temporary session:', session.sessionId);
    return session;
  }

  /**
   * Create a temporary session for anonymous users
   * Tries backend API first, falls back to client-only
   */
  private async createTemporarySession(): Promise<SessionInfo> {
    // Try backend API first
    if (this.useBackend) {
      try {
        const response = await fetch(`${this.backendUrl}/api/session/anonymous`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            source: 'web_app',
            version: '1.0.0'
          })
        });

        if (response.ok) {
          const data: BackendAnonymousSessionResponse = await response.json();
          
          console.log('🔑 SESSION MANAGER: Created backend anonymous session');
          return {
            sessionId: data.session_id,
            userId: null,
            isAuthenticated: false,
            isTemporary: true,
            createdAt: new Date(),
            expiresAt: new Date(data.expires_at),
            requestCount: 0,
            isBackendSession: true
          };
        } else {
          console.warn('🔑 SESSION MANAGER: Backend session creation failed, using client fallback');
        }
      } catch (error) {
        console.warn('🔑 SESSION MANAGER: Backend unavailable, using client fallback:', error);
      }
    }
    
    // Fallback to client-only session
    const sessionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      sessionId,
      userId: null,
      isAuthenticated: false,
      isTemporary: true,
      createdAt: new Date(),
      isBackendSession: false
    };
  }

  /**
   * Validate backend session and check for rate limits
   */
  private async validateBackendSession(sessionId: string): Promise<BackendSessionValidation> {
    try {
      const response = await fetch(`${this.backendUrl}/api/session/anonymous/${sessionId}`);
      
      if (response.ok) {
        const data: BackendSessionValidation = await response.json();
        return data;
      } else if (response.status === 429) {
        // Throttled
        const data = await response.json();
        return {
          valid: false,
          session_id: sessionId,
          created_at: '',
          expires_at: '',
          request_count: 0,
          throttled: true,
          throttle_until: data.throttle_until,
          reason: data.reason
        };
      }
      
      return { valid: false, session_id: sessionId, created_at: '', expires_at: '', request_count: 0 };
    } catch (error) {
      console.warn('🔑 SESSION MANAGER: Backend validation failed:', error);
      // On network error, assume valid to allow offline usage
      return { valid: true, session_id: sessionId, created_at: '', expires_at: '', request_count: 0 };
    }
  }

  /**
   * Start periodic validation for backend sessions
   */
  private startValidationInterval(): void {
    // Clear existing interval
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
    }
    
    // Validate every 5 minutes
    this.validationInterval = setInterval(async () => {
      if (this.currentSession?.isBackendSession && this.currentSession.isTemporary) {
        const validation = await this.validateBackendSession(this.currentSession.sessionId);
        
        if (!validation.valid) {
          if (validation.throttled) {
            console.warn('🔑 SESSION MANAGER: Session throttled until', validation.throttle_until);
            // Notify listeners about throttle
            this.notifyListeners({ ...this.currentSession, requestCount: -1 }); // -1 indicates throttled
          } else {
            console.log('🔑 SESSION MANAGER: Session expired, creating new...');
            const newSession = await this.createTemporarySession();
            this.setSession(newSession);
            this.initializeServices(newSession);
          }
        } else {
          // Update request count
          if (this.currentSession) {
            this.currentSession.requestCount = validation.request_count;
            this.storeSession(this.currentSession);
          }
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop validation interval
   */
  private stopValidationInterval(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  /**
   * Initialize all services with current session
   */
  private initializeServices(session: SessionInfo): void {
    // Set session in chatService
    chatService.setSessionId(session.sessionId);
    
    // Set user and session in conversationService
    if (session.userId) {
      conversationService.setUserId(session.userId);
    }
    conversationService.setSessionId(session.sessionId);
    
    console.log('🔑 SESSION MANAGER: Services initialized with session:', session.sessionId);
  }

  /**
   * Handle auth state changes
   * Call this when user logs in/out
   */
  async handleAuthChange(user: User | null): Promise<SessionInfo> {
    console.log('🔑 SESSION MANAGER: Auth state changed:', user ? 'logged in' : 'logged out');
    
    // Stop validation interval when auth state changes
    this.stopValidationInterval();
    
    if (user) {
      // User logged in - create authenticated session
      const session: SessionInfo = {
        sessionId: user.id,
        userId: user.id,
        isAuthenticated: true,
        isTemporary: false,
        createdAt: new Date(),
        isBackendSession: false
      };
      
      // Revoke old anonymous session if it was backend session
      if (this.currentSession?.isBackendSession && this.currentSession.isTemporary) {
        await this.revokeBackendSession(this.currentSession.sessionId);
      }
      
      this.setSession(session);
      this.initializeServices(session);
      
      return session;
      
    } else {
      // User logged out - create temporary session
      const session = await this.createTemporarySession();
      this.setSession(session);
      this.initializeServices(session);
      
      if (session.isBackendSession) {
        this.startValidationInterval();
      }
      
      return session;
    }
  }

  /**
   * Revoke backend anonymous session
   */
  private async revokeBackendSession(sessionId: string): Promise<void> {
    try {
      await fetch(`${this.backendUrl}/api/session/anonymous/${sessionId}`, {
        method: 'DELETE'
      });
      console.log('🔑 SESSION MANAGER: Revoked backend session:', sessionId);
    } catch (error) {
      console.warn('🔑 SESSION MANAGER: Failed to revoke backend session:', error);
    }
  }

  /**
   * Get current session
   */
  getSession(): SessionInfo | null {
    return this.currentSession;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.currentSession?.sessionId || null;
  }

  /**
   * Set current session
   */
  private setSession(session: SessionInfo): void {
    this.currentSession = session;
    
    // Store temporary sessions in localStorage
    if (session.isTemporary) {
      this.storeSession(session);
    } else {
      // Clear stored temp session when using authenticated session
      this.clearStoredSession();
    }
    
    // Notify listeners
    this.notifyListeners(session);
  }

  /**
   * Subscribe to session changes
   */
  subscribe(listener: (session: SessionInfo) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current session if available
    if (this.currentSession) {
      listener(this.currentSession);
    }
    
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of session change
   */
  private notifyListeners(session: SessionInfo): void {
    this.listeners.forEach(listener => listener(session));
  }

  /**
   * Store session in localStorage
   */
  private storeSession(session: SessionInfo): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(session));
    }
  }

  /**
   * Get stored session from localStorage
   */
  private getStoredSession(): SessionInfo | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const session = JSON.parse(stored);
      // Convert createdAt back to Date
      session.createdAt = new Date(session.createdAt);
      
      return session;
    } catch (error) {
      console.error('🔑 SESSION MANAGER: Failed to parse stored session:', error);
      return null;
    }
  }

  /**
   * Clear stored session
   */
  private clearStoredSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Check if session is expired (24 hours for client sessions, backend sessions use server time)
   */
  private isSessionExpired(session: SessionInfo): boolean {
    if (!session.isTemporary) return false; // Auth sessions don't expire
    
    // Backend sessions use server-provided expiration
    if (session.isBackendSession && session.expiresAt) {
      return new Date() > session.expiresAt;
    }
    
    // Client sessions expire after 24 hours
    const now = new Date();
    const sessionAge = now.getTime() - session.createdAt.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return sessionAge > maxAge;
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    // Revoke backend session if exists
    if (this.currentSession?.isBackendSession && this.currentSession.isTemporary) {
      this.revokeBackendSession(this.currentSession.sessionId);
    }
    
    this.stopValidationInterval();
    this.currentSession = null;
    this.clearStoredSession();
    console.log('🔑 SESSION MANAGER: Session cleared');
  }

  /**
   * Check if current session is throttled
   */
  isThrottled(): boolean {
    return this.currentSession?.requestCount === -1; // -1 indicates throttled
  }

  /**
   * Get request count for current session
   */
  getRequestCount(): number {
    return this.currentSession?.requestCount ?? 0;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
