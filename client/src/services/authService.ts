// ============================================================
// WIHY AUTH API SERVICE
// ============================================================
// Comprehensive authentication service for wihy_auth API
// Supports local auth, OAuth2 (Google, Facebook, Microsoft), and session management
// API Base: http://wihy-auth-api.centralus.azurecontainer.io:5000

const WIHY_AUTH_API_BASE = 
  process.env.REACT_APP_WIHY_AUTH_API_URL || 
  'http://wihy-auth-api.centralus.azurecontainer.io:5000';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: 'local' | 'google' | 'microsoft' | 'apple' | 'facebook' | 'samsung';
  created_at?: string;
  last_login?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  profile_data?: Record<string, any>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  session_token?: string;
  expires_at?: string;
  error?: string;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: User;
  auth_method?: string;
  session?: {
    created_at: string;
    expires_at: string;
  };
}

export interface AuthProvider {
  name: string;
  type: 'local' | 'oauth2';
  endpoints?: {
    authorize?: string;
    callback?: string;
    register?: string;
    login?: string;
  };
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  providers: {
    local: boolean;
    oauth: string[];
  };
}

// ============================================================
// AUTHENTICATION SERVICE CLASS
// ============================================================

class AuthService {
  private listeners: Set<(state: AuthState) => void> = new Set();
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: false
  };
  private sessionToken: string | null = null;
  private storageKey = 'wihy_auth_user';
  private tokenKey = 'wihy_auth_token';

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): AuthState {
    return this.state;
  }

  private setState(newState: Partial<AuthState>): void {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(error.error || error.message || 'Request failed');
    }
    
    return response.json();
  }

  private saveSession(user: User, token?: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
      if (token) {
        localStorage.setItem(this.tokenKey, token);
        this.sessionToken = token;
      }
    }
  }

  private clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.tokenKey);
    }
    this.sessionToken = null;
  }

  // ============================================================
  // HEALTH & DISCOVERY ENDPOINTS
  // ============================================================

  /**
   * Check service health and available providers
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${WIHY_AUTH_API_BASE}/api/health`, {
        method: 'GET',
        credentials: 'include'
      });
      return this.handleResponse<HealthResponse>(response);
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Get detailed list of authentication providers
   */
  async getProviders(): Promise<Record<string, AuthProvider>> {
    try {
      const response = await fetch(`${WIHY_AUTH_API_BASE}/api/auth/providers`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await this.handleResponse<{ providers: Record<string, AuthProvider> }>(response);
      return data.providers;
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      throw error;
    }
  }

  // ============================================================
  // LOCAL AUTHENTICATION
  // ============================================================

  /**
   * Register a new user account
   */
  async register(data: RegisterRequest): Promise<{ success: boolean; user_id?: string; error?: string }> {
    this.setState({ loading: true, error: undefined });
    
    try {
      const response = await fetch(`${WIHY_AUTH_API_BASE}/api/auth/local/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const result = await this.handleResponse<{ success: boolean; user_id?: string; message?: string }>(response);
      
      if (result.success) {
        this.setState({ loading: false });
        return { success: true, user_id: result.user_id };
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      this.setState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Authenticate user with email/password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    this.setState({ loading: true, error: undefined });
    
    try {
      const response = await fetch(`${WIHY_AUTH_API_BASE}/api/auth/local/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const result = await this.handleResponse<LoginResponse>(response);
      
      if (result.success && result.user) {
        const user: User = {
          ...result.user,
          provider: 'local'
        };
        
        this.saveSession(user, result.session_token);
        this.setState({ 
          isAuthenticated: true, 
          user, 
          loading: false 
        });
        
        return result;
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.setState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Change user password (requires authentication)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    this.setState({ loading: true, error: undefined });
    
    try {
      const response = await fetch(`${WIHY_AUTH_API_BASE}/api/auth/local/change-password`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const result = await this.handleResponse<{ success: boolean; message?: string }>(response);
      this.setState({ loading: false });
      
      return { success: result.success };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      this.setState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  // ============================================================
  // OAUTH2 AUTHENTICATION
  // ============================================================

  /**
   * Initiate OAuth2 authorization flow
   */
  async initiateOAuth(provider: 'google' | 'facebook' | 'microsoft' | 'apple' | 'samsung'): Promise<{ authorization_url: string; state: string }> {
    try {
      const response = await fetch(`${WIHY_AUTH_API_BASE}/api/auth/${provider}/authorize`, {
        method: 'GET',
        credentials: 'include'
      });

      const result = await this.handleResponse<{ authorization_url: string; state: string }>(response);
      
      // Redirect user to authorization URL
      window.location.href = result.authorization_url;
      
      return result;
    } catch (error) {
      console.error(`OAuth ${provider} initiation failed:`, error);
      throw error;
    }
  }

  /**
   * Handle OAuth2 callback
   */
  async handleOAuthCallback(provider: string, code: string, state: string): Promise<LoginResponse> {
    this.setState({ loading: true, error: undefined });
    
    try {
      // The callback is typically handled by the server redirecting back to the app
      // This method is for manual handling if needed
      const response = await fetch(
        `${WIHY_AUTH_API_BASE}/api/auth/${provider}/callback?code=${code}&state=${state}`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );

      const result = await this.handleResponse<any>(response);
      
      if (result.success && result.user) {
        const user: User = {
          ...result.user,
          provider: provider as any
        };
        
        this.saveSession(user, result.token_data?.access_token);
        this.setState({ 
          isAuthenticated: true, 
          user, 
          loading: false 
        });
        
        return { success: true, user };
      } else {
        throw new Error('OAuth callback failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth callback failed';
      this.setState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  // ============================================================
  // SESSION MANAGEMENT
  // ============================================================

  /**
   * Check current authentication status
   */
  async checkSession(): Promise<SessionResponse> {
    try {
      const response = await fetch(`${WIHY_AUTH_API_BASE}/api/auth/session`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });

      const result = await this.handleResponse<SessionResponse>(response);
      
      if (result.authenticated && result.user) {
        const user: User = {
          ...result.user,
          provider: result.auth_method as any || 'local'
        };
        
        this.saveSession(user);
        this.setState({ 
          isAuthenticated: true, 
          user, 
          loading: false 
        });
      } else {
        this.clearSession();
        this.setState({ 
          isAuthenticated: false, 
          user: null, 
          loading: false 
        });
      }
      
      return result;
    } catch (error) {
      console.error('Session check failed:', error);
      this.clearSession();
      this.setState({ 
        isAuthenticated: false, 
        user: null, 
        loading: false 
      });
      return { authenticated: false };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    this.setState({ loading: true });
    
    try {
      await fetch(`${WIHY_AUTH_API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout request failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      this.clearSession();
      this.setState({ 
        isAuthenticated: false, 
        user: null, 
        loading: false,
        error: undefined 
      });
    }
  }

  /**
   * Initialize authentication state from storage
   */
  async initAuth(): Promise<void> {
    this.setState({ loading: true });
    
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem(this.storageKey);
      const storedToken = localStorage.getItem(this.tokenKey);
      
      if (storedToken) {
        this.sessionToken = storedToken;
      }
      
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          // Verify session with server
          const sessionStatus = await this.checkSession();
          
          if (!sessionStatus.authenticated) {
            // Session expired, clear local storage
            this.clearSession();
            this.setState({ 
              isAuthenticated: false, 
              user: null, 
              loading: false 
            });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          this.clearSession();
          this.setState({ 
            isAuthenticated: false, 
            user: null, 
            loading: false 
          });
        }
      } else {
        this.setState({ loading: false });
      }
    } else {
      this.setState({ loading: false });
    }
  }

  // ============================================================
  // LEGACY COMPATIBILITY METHODS
  // ============================================================

  /**
   * Legacy signIn method for backward compatibility
   */
  async signIn(email: string, password: string): Promise<void> {
    const result = await this.login(email, password);
    if (!result.success) {
      throw new Error(result.error || 'Sign in failed');
    }
  }

  /**
   * Legacy signOut method for backward compatibility
   */
  async signOut(): Promise<void> {
    await this.logout();
  }

  /**
   * Legacy checkAuth method for backward compatibility
   */
  async checkAuth(): Promise<void> {
    await this.initAuth();
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const authService = new AuthService();

// Initialize authentication on module load
if (typeof window !== 'undefined') {
  authService.initAuth().catch(console.error);
}