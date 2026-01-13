/**
 * Authentication Settings Screen
 * Demonstrates biometric login and auto token refresh
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEnhancedAuth } from '../hooks/useEnhancedAuth';
import { colors, sizes } from '../theme/design-tokens';

export default function AuthSettingsScreen() {
  const {
    biometricCapability,
    biometricEnabled,
    autoRefreshEnabled,
    loading,
    enableBiometric,
    disableBiometric,
    loginWithBiometric,
    enableAutoRefresh,
    disableAutoRefresh,
    getBiometricTypeName,
  } = useEnhancedAuth();

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const success = await enableBiometric();
      if (!success) {
        Alert.alert(
          'Biometric Login',
          `Could not enable ${getBiometricTypeName()}. Please make sure biometric authentication is set up on your device.`
        );
      }
    } else {
      await disableBiometric();
    }
  };

  const handleAutoRefreshToggle = async (value: boolean) => {
    if (value) {
      await enableAutoRefresh();
      Alert.alert(
        'Auto Token Refresh',
        'Automatic token refresh is now enabled. Your session will be kept alive automatically.'
      );
    } else {
      await disableAutoRefresh();
    }
  };

  const testBiometricLogin = async () => {
    const success = await loginWithBiometric();
    if (success) {
      Alert.alert('Success', 'Biometric authentication successful!');
    } else {
      Alert.alert('Failed', 'Biometric authentication failed');
    }
  };

  const biometricAvailable = biometricCapability?.available || false;
  const biometricTypeName = getBiometricTypeName();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Authentication Settings</Text>

        {/* Biometric Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name={
                biometricCapability?.supportsFaceID
                  ? 'scan'
                  : 'finger-print'
              }
              size={24}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Biometric Login</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                Enable {biometricTypeName}
              </Text>
              <Text style={styles.settingDescription}>
                {biometricAvailable
                  ? `Use ${biometricTypeName} for quick and secure login`
                  : `${biometricTypeName} is not available on this device`}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!biometricAvailable || loading}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={biometricEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          {biometricCapability && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Status: </Text>
                {biometricCapability.enrolled
                  ? `${biometricTypeName} is set up`
                  : `${biometricTypeName} is not set up on this device`}
              </Text>
              {biometricCapability.types.length > 0 && (
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Available: </Text>
                  {biometricCapability.types.join(', ')}
                </Text>
              )}
            </View>
          )}

          {biometricEnabled && (
            <Pressable
              style={styles.testButton}
              onPress={testBiometricLogin}
              disabled={loading}
            >
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.testButtonText}>
                Test {biometricTypeName}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Auto Refresh Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="refresh-circle" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Token Management</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Token Refresh</Text>
              <Text style={styles.settingDescription}>
                Automatically refresh your session in the background
              </Text>
            </View>
            <Switch
              value={autoRefreshEnabled}
              onValueChange={handleAutoRefreshToggle}
              disabled={loading}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={autoRefreshEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              When enabled, your authentication tokens will be automatically
              refreshed every 5 minutes to keep your session alive.
            </Text>
            <Text style={[styles.infoText, { marginTop: 8 }]}>
              This prevents unexpected logouts and ensures a seamless
              experience.
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="information-circle"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Security Information</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              • All authentication tokens are stored securely on your device
            </Text>
            <Text style={styles.infoText}>
              • Biometric data never leaves your device
            </Text>
            <Text style={styles.infoText}>
              • Sessions expire after 24 hours of inactivity
            </Text>
            <Text style={styles.infoText}>
              • Auto refresh checks for token expiration every 5 minutes
            </Text>
          </View>
        </View>

        {/* Platform Info */}
        {__DEV__ && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Debug Info</Text>
            <Text style={styles.debugText}>
              Platform: {Platform.OS} {Platform.Version}
            </Text>
            <Text style={styles.debugText}>
              Biometric Available: {biometricAvailable ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.debugText}>
              Biometric Enrolled: {biometricCapability?.enrolled ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.debugText}>
              Biometric Enabled: {biometricEnabled ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.debugText}>
              Auto Refresh: {autoRefreshEnabled ? 'On' : 'Off'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textMuted,
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  infoLabel: {
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugSection: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
});
