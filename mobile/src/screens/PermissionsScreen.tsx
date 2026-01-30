import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '../components/shared';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  ensureCameraPermission,
  ensureMicrophonePermission,
  ensureMediaLibraryPermission,
  ensureContactsPermission,
} from '../utils/permissions';
import {
  requestAppleHealthPermissions,
  requestGoogleFitPermissions,
} from '../utils/health';

type NavigationProp = StackNavigationProp<RootStackParamList>;

type PermissionItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'granted' | 'denied' | 'pending';
  onRequest: () => Promise<void>;
};

export default function PermissionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const [permissions, setPermissions] = useState<PermissionItem[]>([
    {
      id: 'camera',
      title: 'Camera',
      description: 'Scan barcodes and take photos of food',
      icon: 'camera',
      status: 'pending',
      onRequest: async () => {
        const result = await ensureCameraPermission();
        updatePermissionStatus('camera', result.granted ? 'granted' : 'denied');
      },
    },
    {
      id: 'microphone',
      title: 'Microphone',
      description: 'Record audio for voice interactions',
      icon: 'mic',
      status: 'pending',
      onRequest: async () => {
        const result = await ensureMicrophonePermission();
        updatePermissionStatus('microphone', result.granted ? 'granted' : 'denied');
      },
    },
    {
      id: 'photos',
      title: 'Photo Library',
      description: 'Select images from your gallery to analyze',
      icon: 'images',
      status: 'pending',
      onRequest: async () => {
        const result = await ensureMediaLibraryPermission();
        updatePermissionStatus('photos', result.granted ? 'granted' : 'denied');
      },
    },
    {
      id: 'contacts',
      title: 'Contacts',
      description: 'Share health insights with selected contacts',
      icon: 'people',
      status: 'pending',
      onRequest: async () => {
        const result = await ensureContactsPermission();
        updatePermissionStatus('contacts', result.granted ? 'granted' : 'denied');
      },
    },
    {
      id: 'health',
      title: 'Health Data',
      description: 'Sync health and fitness data',
      icon: 'fitness',
      status: 'pending',
      onRequest: async () => {
        if (Platform.OS === 'ios') {
          const result = await requestAppleHealthPermissions({
            read: ['HKQuantityTypeIdentifierStepCount', 'HKQuantityTypeIdentifierActiveEnergyBurned'],
            write: ['HKQuantityTypeIdentifierDietaryEnergyConsumed'],
          });
          updatePermissionStatus('health', result.granted ? 'granted' : 'denied');
        } else {
          const result = await requestGoogleFitPermissions([
            'https://www.googleapis.com/auth/fitness.activity.read',
            'https://www.googleapis.com/auth/fitness.body.read',
          ]);
          updatePermissionStatus('health', result.granted ? 'granted' : 'denied');
        }
      },
    },
  ]);

  const updatePermissionStatus = (
    id: string,
    status: 'granted' | 'denied' | 'pending'
  ) => {
    setPermissions((prev) =>
      prev.map((perm) => (perm.id === id ? { ...perm, status } : perm))
    );
  };

  const handleRequestPermission = async (permission: PermissionItem) => {
    try {
      await permission.onRequest();
    } catch (error) {
      console.error(`Error requesting ${permission.title}:`, error);
      Alert.alert('Error', `Failed to request ${permission.title} permission`);
    }
  };

  const handleRequestAll = async () => {
    for (const permission of permissions) {
      if (permission.status === 'pending') {
        await handleRequestPermission(permission);
      }
    }
  };

  const allGranted = permissions.every((p) => p.status === 'granted');
  const anyPending = permissions.some((p) => p.status === 'pending');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Permissions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={48} color="#3b82f6" />
          <Text style={styles.infoTitle}>Grant Access</Text>
          <Text style={styles.infoText}>
            WiHY needs these permissions to provide personalized health insights and features.
          </Text>
        </View>

        <View style={styles.permissionsSection}>
          {permissions.map((permission) => (
            <View key={permission.id} style={styles.permissionCard}>
              <View style={styles.permissionIcon}>
                <Ionicons
                  name={permission.icon as any}
                  size={24}
                  color={
                    permission.status === 'granted'
                      ? '#10b981'
                      : permission.status === 'denied'
                      ? '#ef4444'
                      : theme.colors.textSecondary
                  }
                />
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>{permission.title}</Text>
                <Text style={styles.permissionDescription}>
                  {permission.description}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.permissionButton,
                  permission.status === 'granted' && styles.permissionButtonGranted,
                  permission.status === 'denied' && styles.permissionButtonDenied,
                ]}
                onPress={() => handleRequestPermission(permission)}
                disabled={permission.status === 'granted'}
              >
                <Text
                  style={[
                    styles.permissionButtonText,
                    permission.status === 'granted' &&
                      styles.permissionButtonTextGranted,
                  ]}
                >
                  {permission.status === 'granted'
                    ? 'Granted'
                    : permission.status === 'denied'
                    ? 'Retry'
                    : 'Allow'}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {anyPending && (
          <Pressable
            style={styles.requestAllButton}
            onPress={handleRequestAll}
          >
            <Text style={styles.requestAllButtonText}>Request All Permissions</Text>
          </Pressable>
        )}
        {allGranted && (
          <Pressable
            style={styles.continueButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    // color: theme.colors.text
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    // color: theme.colors.text
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    // color: theme.colors.textSecondary
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionsSection: {
    gap: 12,
  },
  permissionCard: {
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    // // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    // color: theme.colors.text
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    // color: theme.colors.textSecondary
    lineHeight: 18,
  },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  permissionButtonGranted: {
    backgroundColor: '#10b981',
  },
  permissionButtonDenied: {
    backgroundColor: '#ef4444',
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  permissionButtonTextGranted: {
    color: '#ffffff',
  },
  footer: {
    padding: 16,
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  requestAllButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  requestAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  continueButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
