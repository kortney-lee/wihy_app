export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
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
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): AuthState {
    return this.state;
  }

  private setState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  async signIn(email: string, password: string): Promise<void> {
    this.setState({ loading: true });
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const user: User = {
        id: '1',
        email,
        name: email.split('@')[0],
      };

      this.setState({
        isAuthenticated: true,
        user,
        loading: false
      });
    } catch (error) {
      this.setState({ loading: false });
      throw error;
    }
  }

  async signUp(email: string, password: string, name: string): Promise<void> {
    this.setState({ loading: true });
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const user: User = {
        id: '1',
        email,
        name,
      };

      this.setState({
        isAuthenticated: true,
        user,
        loading: false
      });
    } catch (error) {
      this.setState({ loading: false });
      throw error;
    }
  }

  async signOut(): Promise<void> {
    this.setState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
  }

  async checkAuth(): Promise<void> {
    this.setState({ loading: true });
    try {
      // TODO: Replace with actual API call to check if user is logged in
      const token = localStorage.getItem('authToken');
      if (token) {
        // Simulate user data from token
        const user: User = {
          id: '1',
          email: 'user@example.com',
          name: 'User',
        };
        this.setState({
          isAuthenticated: true,
          user,
          loading: false
        });
      } else {
        this.setState({ loading: false });
      }
    } catch (error) {
      this.setState({ loading: false });
    }
  }
}

export const authService = new AuthService();