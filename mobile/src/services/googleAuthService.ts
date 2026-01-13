import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Configure web browser behavior
WebBrowser.maybeCompleteAuthSession();

// Google OAuth credentials - update with your values
const GOOGLE_OAUTH_IOS_CLIENT_ID = '12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com';
const GOOGLE_OAUTH_WEB_CLIENT_ID = '12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com';

// Get the redirect URL for your app
const redirectUrl = AuthSession.makeRedirectUrl();

export class GoogleAuthService {
  /**
   * Sign in with Google
   * @returns ID token on success, null on error/cancel
   */
  static async signIn(): Promise<string | null> {
    try {
      // Create request object for Google OAuth
      const request = new AuthSession.GoogleAuthRequest({
        clientId: GOOGLE_OAUTH_WEB_CLIENT_ID,
        iosClientId: GOOGLE_OAUTH_IOS_CLIENT_ID,
        redirectUrl: redirectUrl,
        scopes: ['profile', 'email', 'openid'],
      });

      // Perform the authentication
      const result = await request.promptAsync();

      if (result.type === 'success') {
        const idToken = result.params.id_token;
        if (!idToken) {
          console.error('No ID token in OAuth response');
          return null;
        }
        return idToken;
      } else if (result.type === 'error') {
        console.error('OAuth Error:', result.params.error);
        return null;
      } else if (result.type === 'dismiss') {
        console.log('OAuth cancelled by user');
        return null;
      }

      return null;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      return null;
    }
  }

  /**
   * Sign out (clears any cached credentials)
   */
  static async signOut(): Promise<void> {
    // Expo handles sign-out internally
    // No additional action needed
    try {
      // You can make a call to your backend to revoke the token if needed
      console.log('Signed out from Google');
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  }

  /**
   * Get the current redirect URL
   */
  static getRedirectUrl(): string {
    return redirectUrl;
  }

  /**
   * Get Google OAuth configuration
   */
  static getConfig() {
    return {
      iosClientId: GOOGLE_OAUTH_IOS_CLIENT_ID,
      webClientId: GOOGLE_OAUTH_WEB_CLIENT_ID,
      redirectUrl: redirectUrl,
    };
  }
}
