import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function ProfileSettings() {
  const navigation = useNavigation<NavigationProp>();
  
  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 140;
  const HEADER_MIN_HEIGHT = 0;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleChangeEmail = () => {
    Alert.prompt(
      'Change Email',
      'Enter your new email address',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: (email) => {
            if (email) {
              Alert.alert('Verification Required', `A verification link has been sent to ${email}`);
            }
          },
        },
      ],
      'plain-text',
      '',
      'email-address'
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'You will be sent a password reset link to your email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: () => {
            Alert.alert('Email Sent', 'Check your email for the password reset link.');
          },
        },
      ]
    );
  };

  const handleToggle2FA = () => {
    if (!twoFactorEnabled) {
      Alert.alert(
        'Enable Two-Factor Authentication',
        'This will add an extra layer of security to your account. You will need to enter a code from your authenticator app when logging in.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: () => {
              setTwoFactorEnabled(true);
              Alert.alert('2FA Enabled', 'Two-factor authentication is now active.');
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'This will remove the extra security layer from your account.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              setTwoFactorEnabled(false);
              Alert.alert('2FA Disabled', 'Two-factor authentication has been disabled.');
            },
          },
        ]
      );
    }
  };

  const handleConnectGoogle = () => {
    Alert.alert('Connect Google', 'Google account connection will be implemented');
  };

  const handleConnectApple = () => {
    Alert.alert('Connect Apple', 'Apple account connection will be implemented');
  };

  const handleDisconnectAccount = (provider: string) => {
    Alert.alert(
      `Disconnect ${provider}`,
      `Are you sure you want to disconnect your ${provider} account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Disconnected', `Your ${provider} account has been disconnected.`);
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Your Data',
      'We will prepare a download of all your data and send you an email when it\'s ready (usually within 24 hours).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              Alert.alert('Export Requested', 'You will receive an email when your data is ready to download.');
            }, 1500);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This action is permanent and cannot be undone. All your data will be deleted within 30 days.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirm Deletion',
              'Type "DELETE" to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: (text) => {
                    if (text === 'DELETE') {
                      Alert.alert('Account Deletion Scheduled', 'Your account will be deleted in 30 days. You can cancel this by logging in within that time.');
                    } else {
                      Alert.alert('Incorrect', 'You must type "DELETE" to confirm.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Collapsing Header */}
      <Animated.View
        style={[
          styles.collapsibleHeader,
          {
            height: headerHeight,
            opacity: headerOpacity,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: titleScale }] }}>
          <Text style={styles.headerTitle}>Account Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account and security</Text>
        </Animated.View>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <Pressable style={styles.settingItem} onPress={handleChangeEmail}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="mail-outline" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Email Address</Text>
                <Text style={styles.settingSubtitle}>sarah.johnson@example.com</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>

          <Pressable style={styles.settingItem} onPress={handleChangePassword}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="key-outline" size={20} color="#6366f1" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Password</Text>
                <Text style={styles.settingSubtitle}>Change your password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#d1fae5' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                <Text style={styles.settingSubtitle}>
                  {twoFactorEnabled ? 'Enabled - Extra security active' : 'Disabled - Add extra security'}
                </Text>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleToggle2FA}
              trackColor={{ false: '#cbd5e1', true: '#10b981' }}
              thumbColor="#fff"
            />
          </View>

          <Pressable style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="phone-portrait-outline" size={20} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Active Sessions</Text>
                <Text style={styles.settingSubtitle}>2 devices • Manage sessions</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>
        </View>

        {/* Connected Accounts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Accounts</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="logo-google" size={20} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Google</Text>
                <Text style={styles.settingSubtitle}>Not connected</Text>
              </View>
            </View>
            <Pressable
              style={styles.connectButton}
              onPress={handleConnectGoogle}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </Pressable>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="logo-apple" size={20} color="#1e293b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Apple</Text>
                <Text style={styles.settingSubtitle}>Not connected</Text>
              </View>
            </View>
            <Pressable
              style={styles.connectButton}
              onPress={handleConnectApple}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </Pressable>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="mail-outline" size={20} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Email Notifications</Text>
                <Text style={styles.settingSubtitle}>Receive updates via email</Text>
              </View>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="notifications-outline" size={20} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSubtitle}>Receive push notifications</Text>
              </View>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Danger Zone Section */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          
          <Pressable
            style={styles.dangerItem}
            onPress={handleExportData}
            disabled={loading}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="download-outline" size={20} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Download Your Data</Text>
                <Text style={styles.settingSubtitle}>Export all your data</Text>
              </View>
            </View>
            {loading ? (
              <ActivityIndicator color="#f59e0b" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            )}
          </Pressable>

          <Pressable
            style={[styles.dangerItem, styles.dangerItemDelete]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, styles.dangerText]}>Delete Account</Text>
                <Text style={styles.settingSubtitle}>Permanently delete your account and data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
          </Pressable>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#3b82f6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Need Help?</Text>
            <Text style={styles.infoText}>
              Contact our support team if you have any questions about your account settings.
            </Text>
          </View>
        </View>

        {/* Spacing for bottom safe area */}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  
  // Collapsing Header
  collapsibleHeader: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingBottom: 16,
    justifyContent: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerTitle: {
    color: '#ef4444',
  },

  // Setting Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },

  // Connect Button
  connectButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Danger Zone
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dangerItemDelete: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#ef4444',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#3b82f6',
    lineHeight: 18,
  },
});
