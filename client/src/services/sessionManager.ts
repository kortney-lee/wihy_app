/**
 * Session Manager - Centralized session management for all services
 * 
 * This service manages session state across the application:
 * - For authenticated users: uses user.id as session identifier
 * - For anonymous users: creates and maintains temporary session
 * - Provides session ID to chatService, conversationService, and all other services
 * 
 * Session flow:
 * 1. App initializes → SessionManager checks auth state
 * 2. If authenticated → use user.id as sessionId
 * 3. If not authenticated → create temp session (temp_timestamp_random)
 * 4. Pass sessionId to all services (chat, conversation, etc.)
 * 5. Persist session across navigation
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
}

class SessionManager {
  private currentSession: SessionInfo | null = null;
  private listeners: Set<(session: SessionInfo) => void> = new Set();
  private storageKey = 'wihy_session';

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
        createdAt: new Date()
      };
      
      this.setSession(session);
      this.initializeServices(session);
      
      console.log('🔑 SESSION MANAGER: Authenticated session created:', session.sessionId);
      return session;
      
    } else if (storedSession && !this.isSessionExpired(storedSession)) {
      // Restore stored temporary session if not expired (24 hours)
      this.setSession(storedSession);
      this.initializeServices(storedSession);
      
      console.log('🔑 SESSION MANAGER: Restored temporary session:', storedSession.sessionId);
      return storedSession;
      
    } else {
      // Create new temporary session
      const session = this.createTemporarySession();
      this.setSession(session);
      this.initializeServices(session);
      
      console.log('🔑 SESSION MANAGER: Created new temporary session:', session.sessionId);
      return session;
    }
  }

  /**
   * Create a temporary session for anonymous users
   */
  private createTemporarySession(): SessionInfo {
    const sessionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      sessionId,
      userId: null,
      isAuthenticated: false,
      isTemporary: true,
      createdAt: new Date()
    };
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
    
    if (user) {
      // User logged in - create authenticated session
      const session: SessionInfo = {
        sessionId: user.id,
        userId: user.id,
        isAuthenticated: true,
        isTemporary: false,
        createdAt: new Date()
      };
      
      this.setSession(session);
      this.initializeServices(session);
      
      return session;
      
    } else {
      // User logged out - create temporary session
      const session = this.createTemporarySession();
      this.setSession(session);
      this.initializeServices(session);
      
      return session;
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
   * Check if session is expired (24 hours for temporary sessions)
   */
  private isSessionExpired(session: SessionInfo): boolean {
    if (!session.isTemporary) return false; // Auth sessions don't expire
    
    const now = new Date();
    const sessionAge = now.getTime() - session.createdAt.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return sessionAge > maxAge;
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSession = null;
    this.clearStoredSession();
    console.log('🔑 SESSION MANAGER: Session cleared');
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
