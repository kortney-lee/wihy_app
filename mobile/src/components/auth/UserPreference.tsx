import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '../shared';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthContext } from '../../context/AuthContext';
import { colors } from '../../theme/design-tokens';
import { RootStackParamList } from '../../types/navigation';

interface UserPreferenceProps {
  visible: boolean;
  onClose: () => void;
}

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'navigation' | 'action';
  icon: string;
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

export default function UserPreference({ visible, onClose }: UserPreferenceProps) {
  const { user, signOut, updateUser } = useContext(AuthContext);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const defaultPreferences = {
    notifications: true,
    biometrics: false,
    darkMode: false,
    analytics: true,
    autoScan: false,
  };
  const [notificationsEnabled, setNotificationsEnabled] = useState(defaultPreferences.notifications);
  const [biometricsEnabled, setBiometricsEnabled] = useState(defaultPreferences.biometrics);
  const [darkModeEnabled, setDarkModeEnabled] = useState(defaultPreferences.darkMode);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(defaultPreferences.analytics);
  const [autoScanEnabled, setAutoScanEnabled] = useState(defaultPreferences.autoScan);

  if (!user) {return null;}

  const syncFromUser = useCallback(() => {
    const prefs = user.preferences ?? defaultPreferences;
    setNotificationsEnabled(prefs.notifications ?? defaultPreferences.notifications);
    setBiometricsEnabled(prefs.biometrics ?? defaultPreferences.biometrics);
    setDarkModeEnabled(prefs.darkMode ?? defaultPreferences.darkMode);
    setAnalyticsEnabled(prefs.analytics ?? defaultPreferences.analytics);
    setAutoScanEnabled(prefs.autoScan ?? defaultPreferences.autoScan);
  }, [user, defaultPreferences]);

  useEffect(() => {
    syncFromUser();
  }, [syncFromUser]);

  const persistPreferences = async (patch: Partial<typeof defaultPreferences>) => {
    const nextPreferences = {
      ...(user.preferences ?? defaultPreferences),
      ...patch,
    };
    await updateUser({ preferences: nextPreferences });
  };

  const handleEditProfile = () => {
    // OnboardingFlow is for mobile only (Android/iOS)
    if (Platform.OS === 'web') {
      Alert.alert(
        'Edit Profile',
        'Profile editing is available in the mobile app. Download the WIHY app for the full experience!',
        [{ text: 'OK' }]
      );
    } else {
      // Close the modal first, then navigate to OnboardingFlow
      onClose();
      navigation.navigate('OnboardingFlow');
    }
  };

  const handleHealthData = () => {
    Alert.alert(
      'Health Data',
      'Export or manage your health data',
      [
        { text: 'Export Data', onPress: () => console.log('Export data') },
        { text: 'Delete Data', onPress: () => console.log('Delete data'), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support',
      'How can we help you?',
      [
        { text: 'Contact Support', onPress: () => console.log('Contact support') },
        { text: 'FAQ', onPress: () => console.log('FAQ') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              await signOut();
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'edit-profile',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          type: 'navigation' as const,
          icon: 'person',
          onPress: handleEditProfile,
        },
        {
          id: 'health-data',
          title: 'Health Data',
          subtitle: 'Manage your health information',
          type: 'navigation' as const,
          icon: 'medical',
          onPress: handleHealthData,
        },
        {
          id: 'privacy',
          title: 'Privacy Settings',
          subtitle: 'Control your data sharing',
          type: 'navigation' as const,
          icon: 'shield-checkmark',
          onPress: () => console.log('Privacy settings'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Health reminders and updates',
          type: 'toggle' as const,
          icon: 'notifications',
          value: notificationsEnabled,
          onToggle: async (value) => {
            setNotificationsEnabled(value);
            await persistPreferences({ notifications: value });
          },
        },
        {
          id: 'biometrics',
          title: 'Biometric Authentication',
          subtitle: 'Use fingerprint or Face ID',
          type: 'toggle' as const,
          icon: 'finger-print',
          value: biometricsEnabled,
          onToggle: async (value) => {
            setBiometricsEnabled(value);
            await persistPreferences({ biometrics: value });
          },
        },
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          subtitle: 'Use dark theme',
          type: 'toggle' as const,
          icon: 'moon',
          value: darkModeEnabled,
          onToggle: async (value) => {
            setDarkModeEnabled(value);
            await persistPreferences({ darkMode: value });
          },
        },
        {
          id: 'auto-scan',
          title: 'Auto-Scan Barcodes',
          subtitle: 'Automatically scan when barcode detected',
          type: 'toggle' as const,
          icon: 'scan',
          value: autoScanEnabled,
          onToggle: async (value) => {
            setAutoScanEnabled(value);
            await persistPreferences({ autoScan: value });
          },
        },
        {
          id: 'analytics',
          title: 'Analytics',
          subtitle: 'Help improve the app',
          type: 'toggle' as const,
          icon: 'analytics',
          value: analyticsEnabled,
          onToggle: async (value) => {
            setAnalyticsEnabled(value);
            await persistPreferences({ analytics: value });
          },
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get assistance and FAQ',
          type: 'navigation' as const,
          icon: 'help-circle',
          onPress: handleSupport,
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Share your thoughts',
          type: 'navigation' as const,
          icon: 'chatbox',
          onPress: () => console.log('Send feedback'),
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'App version and info',
          type: 'navigation' as const,
          icon: 'information-circle',
          onPress: () => console.log('About'),
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          id: 'sign-out',
          title: 'Sign Out',
          type: 'action' as const,
          icon: 'log-out',
          onPress: handleSignOut,
          destructive: true,
        },
      ],
    },
  ];

  const renderSettingsItem = (item: SettingsItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingsItem}
      onPress={item.onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[
          styles.settingsIcon,
          item.destructive && { backgroundColor: '#fee2e2' },
        ]}>
          <Ionicons
            name={item.icon as any}
            size={20}
            color={item.destructive ? '#ef4444' : colors.primary}
          />
        </View>
        <View style={styles.settingsText}>
          <Text style={[
            styles.settingsTitle,
            item.destructive && { color: '#ef4444' },
          ]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingsItemRight}>
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        ) : item.type === 'navigation' ? (
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <View style={styles.userInfoContainer}>
            <View style={styles.userAvatar}>
              {user.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={32} color={colors.primary} />
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.memberSince}>Member since {user.memberSince}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.healthScore}</Text>
              <Text style={styles.statLabel}>Health Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.streakDays}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Scans Done</Text>
            </View>
          </View>

          {/* Settings Sections */}
          <View style={styles.settingsContainer}>
            {settingsSections.map((section) => (
              <View key={section.title} style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionContent}>
                  {section.items.map((item) => renderSettingsItem(item))}
                </View>
              </View>
            ))}
          </View>

          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Wihy Health v1.0.0</Text>
            <Text style={styles.buildText}>Build 100</Text>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  settingsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  settingsItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  settingsItemRight: {
    marginLeft: 12,
  },
  versionContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  buildText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
