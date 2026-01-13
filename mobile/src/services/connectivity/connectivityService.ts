/**
 * Connectivity Service
 * 
 * Monitors network connectivity and provides a simple API
 * for checking online/offline status.
 * 
 * Features:
 * - Real-time connectivity monitoring
 * - Subscribe to connectivity changes
 * - Check current online status
 */

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

// ============================================
// TYPES
// ============================================

export interface ConnectivityInfo {
  isOnline: boolean;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
  details?: {
    isConnectionExpensive?: boolean;
    cellularGeneration?: string;
  };
}

export type ConnectivityListener = (info: ConnectivityInfo) => void;

// ============================================
// CONNECTIVITY SERVICE
// ============================================

class ConnectivityService {
  private _isOnline: boolean = true;
  private _currentType: string = 'unknown';
  private _isWifi: boolean = false;
  private _isCellular: boolean = false;
  private _details: ConnectivityInfo['details'] = {};
  
  private listeners: Set<ConnectivityListener> = new Set();
  private subscription: NetInfoSubscription | null = null;
  private initialized: boolean = false;

  /**
   * Initialize connectivity monitoring (call on app start)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Get initial state
    const state = await NetInfo.fetch();
    this.handleConnectivityChange(state);

    // Subscribe to changes
    this.subscription = NetInfo.addEventListener(
      this.handleConnectivityChange.bind(this)
    );

    this.initialized = true;
    console.log(`[Connectivity] Initialized - Online: ${this._isOnline}, Type: ${this._currentType}`);
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this._isOnline;
  }

  /**
   * Get current connectivity info
   */
  getInfo(): ConnectivityInfo {
    return {
      isOnline: this._isOnline,
      type: this._currentType,
      isWifi: this._isWifi,
      isCellular: this._isCellular,
      details: this._details,
    };
  }

  /**
   * Subscribe to connectivity changes
   * Returns unsubscribe function
   */
  subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current state
    listener(this.getInfo());
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Wait until device is online
   * Useful for operations that must be done online
   */
  async waitForOnline(timeoutMs: number = 30000): Promise<boolean> {
    if (this._isOnline) return true;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.subscribe((info) => {
        if (info.isOnline) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  /**
   * Manually refresh connectivity status
   */
  async refresh(): Promise<ConnectivityInfo> {
    const state = await NetInfo.fetch();
    this.handleConnectivityChange(state);
    return this.getInfo();
  }

  /**
   * Cleanup subscriptions (call on app close)
   */
  cleanup(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.listeners.clear();
    this.initialized = false;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private handleConnectivityChange(state: NetInfoState): void {
    const wasOnline = this._isOnline;
    
    // Update state
    this._isOnline = state.isConnected ?? false;
    this._currentType = state.type;
    this._isWifi = state.type === 'wifi';
    this._isCellular = state.type === 'cellular';
    this._details = {
      isConnectionExpensive: state.details && 'isConnectionExpensive' in state.details 
        ? (state.details as any).isConnectionExpensive 
        : undefined,
      cellularGeneration: state.details && 'cellularGeneration' in state.details
        ? (state.details as any).cellularGeneration
        : undefined,
    };

    // Notify listeners only if changed
    if (wasOnline !== this._isOnline) {
      console.log(`[Connectivity] Status changed: ${this._isOnline ? 'Online' : 'Offline'} (${this._currentType})`);
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    const info = this.getInfo();
    this.listeners.forEach(listener => {
      try {
        listener(info);
      } catch (error) {
        console.error('[Connectivity] Listener error:', error);
      }
    });
  }
}

// Export singleton
export const connectivityService = new ConnectivityService();
export default connectivityService;
