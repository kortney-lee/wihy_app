export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: 'google' | 'microsoft' | 'apple' | 'facebook';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error?: string;
}

class AuthService {
  private listeners: Set<(state: AuthState) => void> = new Set();
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: false
  };

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

  async signIn(email: string, password: string): Promise<void> {
    this.setState({ loading: true, error: undefined });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user: User = {
        id: '1',
        name: email.split('@')[0],
        email,
        provider: 'google'
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('vhealth_user', JSON.stringify(user));
      }
      
      this.setState({ isAuthenticated: true, user, loading: false });
    } catch (error) {
      this.setState({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Sign in failed'
      });
      throw error;
    }
  }

  async signOut(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vhealth_user');
    }
    this.setState({ isAuthenticated: false, user: null, loading: false, error: undefined });
  }

  async checkAuth(): Promise<void> {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('vhealth_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          this.setState({ isAuthenticated: true, user, loading: false });
        } catch {
          this.setState({ loading: false });
        }
      } else {
        this.setState({ loading: false });
      }
    }
  }
}

export const authService = new AuthService();