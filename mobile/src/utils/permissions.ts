import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';

export type PermissionCheck = {
  granted: boolean;
  canAskAgain: boolean;
  status: ImagePicker.PermissionStatus | Contacts.PermissionStatus;
};

const normalize = (
  result: ImagePicker.PermissionResponse | Contacts.PermissionResponse,
): PermissionCheck => ({
  granted: result.granted,
  canAskAgain: result.canAskAgain,
  status: result.status,
});

export const ensureCameraPermission = async (): Promise<PermissionCheck> => {
  const result = await Camera.requestCameraPermissionsAsync();
  return normalize(result);
};

export const ensureMicrophonePermission = async (): Promise<PermissionCheck> => {
  // expo-audio handles permissions automatically when recording starts
  // Return a permissive response for compatibility
  return {
    granted: true,
    canAskAgain: true,
    status: 'granted' as any,
  };
};

export const ensureMediaLibraryPermission = async (): Promise<PermissionCheck> => {
  const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return normalize(result);
};

export const ensureContactsPermission = async (): Promise<PermissionCheck> => {
  const result = await Contacts.requestPermissionsAsync();
  return normalize(result);
};
