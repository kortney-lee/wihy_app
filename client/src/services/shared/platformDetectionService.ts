/**
 * Platform Detection Service
 * Detects if app is running on web, iOS, or Android
 */

export class PlatformDetectionService {
  /**
   * Check if running as native mobile app (iOS or Android)
   */
  static isNative(): boolean {
    return typeof window !== 'undefined' && 
           (window as any).Capacitor?.isNativePlatform();
  }

  /**
   * Check if running in web browser
   */
  static isWeb(): boolean {
    return !this.isNative();
  }

  /**
   * Check if running on iOS
   */
  static isIOS(): boolean {
    return this.isNative() && 
           (window as any).Capacitor?.getPlatform() === 'ios';
  }

  /**
   * Check if running on Android
   */
  static isAndroid(): boolean {
    return this.isNative() && 
           (window as any).Capacitor?.getPlatform() === 'android';
  }

  /**
   * Get the current platform name
   * @returns 'web' | 'ios' | 'android'
   */
  static getPlatform(): string {
    if (typeof window === 'undefined') return 'web';
    return (window as any).Capacitor?.getPlatform() || 'web';
  }

  /**
   * Log current platform info (useful for debugging)
   */
  static logPlatformInfo(): void {
    console.log('🔍 Platform Detection:', {
      isNative: this.isNative(),
      isWeb: this.isWeb(),
      isIOS: this.isIOS(),
      isAndroid: this.isAndroid(),
      platform: this.getPlatform(),
      capacitorAvailable: typeof (window as any).Capacitor !== 'undefined'
    });
  }
}
