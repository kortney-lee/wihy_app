import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { ghlService } from '../services/ghlService';
import { notificationService } from '../services/notificationService';
import { colors, sizes } from '../theme/design-tokens';
import { dashboardColors, GradientDashboardHeader, WebPageWrapper } from '../components/shared';
import { dashboardTheme } from '../theme/dashboardTheme';
import { getResponsiveIconSize } from '../utils/responsive';
import { DevPlanSwitcher } from '../components/DevPlanSwitcher';
import PlansModal from '../components/PlansModal';
import { hasFamilyAccess, hasCoachAccess } from '../utils/capabilities';
import SvgIcon from '../components/shared/SvgIcon';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { useFeatureAccess } from '../hooks/usePaywall';

const isWeb = Platform.OS === 'web';

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

export default function Profile() {
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
  const [isPremium, setIsPremium] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showAddOnsModal, setShowAddOnsModal] = useState(false);
  
  // Ref to track if subscription has been checked (prevents infinite calls)
  const subscriptionCheckedRef = useRef(false);
  
  // AI Add-on upgrade prompt
  const hasAIAccess = useFeatureAccess('ai');
  const [showAIUpgrade, setShowAIUpgrade] = useState(false);

  // Use user data from context or fallback
  const userInfo = user || {
    name: 'John Doe',
    email: 'john.doe@example.com',
    picture: undefined,
    memberSince: 'January 2024',
    healthScore: 82,
    streakDays: 15,
    preferences: defaultPreferences,
  };

  const syncFromUser = useCallback(() => {
    const prefs = (user?.preferences ?? defaultPreferences);
    setNotificationsEnabled(prefs.notifications ?? defaultPreferences.notifications);
    setBiometricsEnabled(prefs.biometrics ?? defaultPreferences.biometrics);
    setDarkModeEnabled(prefs.darkMode ?? defaultPreferences.darkMode);
    setAnalyticsEnabled(prefs.analytics ?? defaultPreferences.analytics);
    setAutoScanEnabled(prefs.autoScan ?? defaultPreferences.autoScan);
  }, [user?.preferences]);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!user?.email) return;
    
    // Prevent duplicate calls - only check once per mount
    if (subscriptionCheckedRef.current) {
      console.log('[Profile] Subscription already checked, skipping');
      return;
    }
    subscriptionCheckedRef.current = true;
    
    // Skip GHL subscription check in development to avoid 404 errors
    if (__DEV__) {
      console.log('[Profile] Skipping GHL subscription check in development');
      setIsPremium(false);
      return;
    }
    
    try {
      setLoadingSubscription(true);
      const status = await ghlService.checkSubscriptionStatus(user.email);
      setIsPremium(status.isPremium);
      console.log('[Profile] GHL subscription status:', status);
    } catch (error) {
      console.error('[Profile] Failed to check subscription status:', error);
      setIsPremium(false);
    } finally {
      setLoadingSubscription(false);
    }
  }, [user?.email]);

  // Run once on mount - empty dependency array to prevent re-runs
  useEffect(() => {
    syncFromUser();
    checkSubscriptionStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubscribe = () => {
    if (user?.plan === 'free' || !isPremium) {
      setShowPlansModal(true);
    } else {
      Alert.alert(
        'Premium Active',
        'You already have an active premium subscription!',
        [{ text: 'OK' }]
      );
    }
  };

  const persistPreferences = async (patch: Partial<typeof defaultPreferences>) => {
    if (!user) {return;} // Avoid throwing when viewing fallback user
    const nextPreferences = {
      ...(user.preferences ?? defaultPreferences),
      ...patch,
    };
    await updateUser({ preferences: nextPreferences });
  };

  const handleEditProfile = () => {
    // Navigate to the OnboardingFlow which has profile setup steps
    navigation.navigate('OnboardingFlow');
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
    if (isWeb) {
      // Use native confirm dialog on web
      if (window.confirm('Are you sure you want to sign out?')) {
        signOut().then(() => {
          // Navigate to Home after sign out on web
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' as any }],
          });
        }).catch(() => {
          window.alert('Failed to sign out');
        });
      }
    } else {
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
                // Navigation will be handled by the auth state change
              } catch (error) {
                Alert.alert('Error', 'Failed to sign out');
              }
            },
            style: 'destructive',
          },
        ]
      );
    }
  };

  // Check if dev/admin mode (show all options)
  const isDevMode = __DEV__ || user?.plan === 'corporate-enterprise' || user?.plan === 'workplace-plus';
  const showFamilyOption = isDevMode || hasFamilyAccess(user);
  const showCoachOption = isDevMode || hasCoachAccess(user);

  const settingsSections = [
    {
      title: 'Subscription',
      items: [
        {
          id: 'premium',
          title: isPremium ? 'Premium Active' : 'Upgrade to Premium',
          subtitle: isPremium 
            ? 'Unlimited scans & advanced insights'
            : 'Unlock all features and unlimited scans',
          type: 'navigation' as const,
          icon: isPremium ? 'checkmark-circle' : 'rocket',
          onPress: handleSubscribe,
        },
        {
          id: 'addons',
          title: 'Power-Up Add-ons',
          subtitle: 'AI Coach & Instacart • $4.99/mo each',
          type: 'navigation' as const,
          icon: 'sparkles',
          onPress: () => {
            if (!hasAIAccess) {
              setShowAIUpgrade(true);
            } else {
              setShowAddOnsModal(true);
            }
          },
        },
        // Family option - only show if user has family access or in dev mode
        ...(showFamilyOption ? [{
          id: 'family',
          title: 'Family Management',
          subtitle: 'Manage family members & guardian code',
          type: 'navigation' as const,
          icon: 'people',
          onPress: () => navigation.navigate('Enrollment', { tab: 'parent' }),
        }] : []),
        // Coach option - only show if user has coach access or in dev mode
        ...(showCoachOption ? [{
          id: 'coaching',
          title: 'Coach Dashboard',
          subtitle: 'Manage clients & track progress',
          type: 'navigation' as const,
          icon: 'fitness',
          onPress: () => navigation.navigate('Enrollment', { tab: 'coach' }),
        }] : []),
      ],
    },
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
          id: 'auto-scan',
          title: 'Auto Scan',
          subtitle: autoScanEnabled ? 'Automatically scan barcodes' : 'Enable quick barcode scanning',
          type: 'toggle' as const,
          icon: 'barcode',
          value: autoScanEnabled,
          onToggle: async (value) => {
            setAutoScanEnabled(value);
            await persistPreferences({ autoScan: value });
          },
        },
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: notificationsEnabled ? 'Reminders enabled' : 'Enable health reminders',
          type: 'toggle' as const,
          icon: 'notifications',
          value: notificationsEnabled,
          onToggle: async (value) => {
            if (value) {
              // Request permissions and initialize notification service
              const { granted } = await notificationService.requestPermissions();
              
              if (granted) {
                setNotificationsEnabled(true);
                await persistPreferences({ notifications: true });
                
                // Initialize notification service with user ID
                if (user?.id) {
                  await notificationService.initialize(user.id);
                }
                
                Alert.alert(
                  'Notifications Enabled',
                  'You will now receive health reminders and updates',
                  [
                    {
                      text: 'Set Up Reminders',
                      onPress: () => navigation.navigate('NotificationSettings' as any),
                    },
                    { text: 'OK' },
                  ]
                );
              } else {
                Alert.alert(
                  'Permission Denied',
                  'Please enable notifications in your device settings to receive health reminders',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Open Settings',
                      onPress: () => {
                        if (Platform.OS === 'ios') {
                          // iOS settings deep link
                          // Linking.openURL('app-settings:');
                        }
                      },
                    },
                  ]
                );
              }
            } else {
              // Disable notifications
              setNotificationsEnabled(false);
              await persistPreferences({ notifications: false });
              
              // Optionally cancel all scheduled notifications
              const shouldCancel = await new Promise<boolean>((resolve) => {
                Alert.alert(
                  'Disable Notifications',
                  'Do you want to cancel all scheduled reminders?',
                  [
                    { text: 'Keep Reminders', onPress: () => resolve(false) },
                    { 
                      text: 'Cancel All', 
                      onPress: () => resolve(true),
                      style: 'destructive',
                    },
                  ]
                );
              });
              
              if (shouldCancel) {
                await notificationService.cancelAllNotifications();
              }
            }
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
    <Pressable
      key={item.id}
      style={styles.settingsItem}
      onPress={item.onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[
          styles.settingsIcon,
          item.destructive && { backgroundColor: '#fee2e2' },
        ]}>
          <SvgIcon
            name={item.icon as any}
            size={getResponsiveIconSize(sizes.icons.md)}
            color={item.destructive ? '#ef4444' : '#3b82f6'}
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
            trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
            thumbColor="#ffffff"
          />
        ) : item.type === 'navigation' ? (
          <SvgIcon name="chevron-forward" size={getResponsiveIconSize(sizes.icons.md)} color="#9ca3af" />
        ) : null}
      </View>
    </Pressable>
  );

  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  
  // Profile header is taller than progress header
  const HEADER_MAX_HEIGHT = 220;
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

  const avatarScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  const mainContent = (
    <View style={[styles.container, isWeb && { flex: undefined, minHeight: undefined }]}>
      {/* Status bar area - Always blue */}
      <View style={{ height: insets.top, backgroundColor: '#3B82F6' }} />
      
      {/* Collapsible Profile Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight, backgroundColor: '#3B82F6' }]}>
        <Animated.View 
          style={[
            styles.profileHeaderContent,
            { 
              opacity: headerOpacity,
              transform: [{ scale: avatarScale }]
            }
          ]}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {userInfo.picture ? (
                <Image source={{ uri: userInfo.picture }} style={styles.avatarImage} />
              ) : (
                <SvgIcon name="person" size={getResponsiveIconSize(sizes.icons.xxl)} color="#3b82f6" />
              )}
            </View>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <SvgIcon name="star" size={16} color="#fbbf24" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{userInfo.name}</Text>
          {isPremium && (
            <View style={styles.premiumLabel}>
              <SvgIcon name="checkmark-circle" size={14} color="#fbbf24" />
              <Text style={styles.premiumLabelText}>Premium Member</Text>
            </View>
          )}
          <Text style={styles.userEmail}>{userInfo.email}</Text>
          <Text style={styles.memberSince}>Member since {userInfo.memberSince}</Text>
        </Animated.View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        style={isWeb ? { flex: undefined } : undefined}
        contentContainerStyle={isWeb ? { flexGrow: undefined } : undefined}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userInfo.healthScore}</Text>
            <Text style={styles.statLabel}>Health Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userInfo.streakDays}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
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

        {/* Bottom spacing for tab navigation */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
      
      <PlansModal
        visible={showPlansModal}
        onClose={() => setShowPlansModal(false)}
      />
      
      <PlansModal
        visible={showAddOnsModal}
        onClose={() => setShowAddOnsModal(false)}
        title="Power-Up Add-ons"
        subtitle="Enhance your WiHY experience"
        showAddOns={true}
      />

      {/* AI Add-on Upgrade Prompt */}
      <UpgradePrompt
        visible={showAIUpgrade}
        onClose={() => setShowAIUpgrade(false)}
        onUpgrade={() => {
          setShowAIUpgrade(false);
          setShowAddOnsModal(true);
        }}
        feature="AI Coach Add-on"
        description="Get personalized AI-powered health coaching, nutrition advice, and 24/7 support for just $4.99/month."
        requiredPlan="Premium + AI Add-on"
      />

      {/* Dev Plan Switcher - Remove in Production */}
      <DevPlanSwitcher />
    </View>
  );

  // Return wrapped content for web, or direct content for native
  return <WebPageWrapper activeTab="profile">{mainContent}</WebPageWrapper>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  collapsibleHeader: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    paddingTop: 40, // Account for status bar since gradient goes to top
    paddingBottom: 16,
    paddingHorizontal: dashboardTheme.spacing.lg,
  },
  profileHeaderContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  premiumLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  premiumLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  settingsContainer: {
    paddingHorizontal: 24,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  settingsItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingsItemRight: {
    marginLeft: 16,
  },
  versionContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  buildText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
