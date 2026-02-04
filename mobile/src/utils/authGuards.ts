import { Alert } from 'react-native';

export type AuthGuardOptions = {
  context: string;
  onError?: (message: string) => void;
  showAlert?: boolean;
};

const notifyAuthError = (message: string, options?: AuthGuardOptions) => {
  options?.onError?.(message);
  if (options?.showAlert) {
    Alert.alert('Authentication required', message);
  }
};

export const requireUserId = (userId: string | null | undefined, options: AuthGuardOptions): string | null => {
  if (!userId) {
    notifyAuthError(`${options.context}: sign in required.`, options);
    return null;
  }
  return userId;
};

export const requireCoachId = (coachId: string | null | undefined, options: AuthGuardOptions): string | null => {
  if (!coachId) {
    notifyAuthError(`${options.context}: coach authentication required.`, options);
    return null;
  }
  return coachId;
};

export const requireAuthToken = (token: string | null | undefined, options: AuthGuardOptions): string | null => {
  if (!token) {
    notifyAuthError(`${options.context}: session expired. Please sign in again.`, options);
    return null;
  }
  return token;
};
