import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
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

export default function PrivacySettings() {
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

  // Privacy Settings State
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private' | 'friends'>('private');
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showLocation, setShowLocation] = useState(true);
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  
  const [shareProgressWithCoach, setShareProgressWithCoach] = useState(true);
  const [shareHealthData, setShareHealthData] = useState(true);
  const [shareMealLogs, setShareMealLogs] = useState(true);
  const [shareWorkoutData, setShareWorkoutData] = useState(true);
  
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [personalizedAds, setPersonalizedAds] = useState(false);
  const [thirdPartySharing, setThirdPartySharing] = useState(false);

  const handleViewActivityLog = () => {
    Alert.alert('Activity Log', 'Activity log will be displayed here showing all account actions.');
  };

  const handleClearActivityLog = () => {
    Alert.alert(
      'Clear Activity Log',
      'Are you sure you want to clear your activity log? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Cleared', 'Your activity log has been cleared.');
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data from your device. App may be slower on next launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            Alert.alert('Success', 'Cache has been cleared (approximately 45 MB freed).');
          },
        },
      ]
    );
  };

  const handleClearSearchHistory = () => {
    Alert.alert(
      'Clear Search History',
      'This will delete all your search history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Cleared', 'Search history has been deleted.');
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
          <Text style={styles.headerTitle}>Privacy Settings</Text>
          <Text style={styles.headerSubtitle}>Control your privacy and data</Text>
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
        {/* Profile Visibility Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>
          <Text style={styles.sectionDescription}>
            Control who can see your profile information
          </Text>
          
          <View style={styles.visibilityOptions}>
            <Pressable
              style={[
                styles.visibilityOption,
                profileVisibility === 'public' && styles.visibilityOptionSelected,
              ]}
              onPress={() => setProfileVisibility('public')}
            >
              <View style={styles.visibilityIcon}>
                <Ionicons
                  name="earth"
                  size={24}
                  color={profileVisibility === 'public' ? '#3b82f6' : '#64748b'}
                />
              </View>
              <Text style={[
                styles.visibilityLabel,
                profileVisibility === 'public' && styles.visibilityLabelSelected,
              ]}>
                Public
              </Text>
              <Text style={styles.visibilityDescription}>Everyone can see</Text>
            </Pressable>

            <Pressable
              style={[
                styles.visibilityOption,
                profileVisibility === 'friends' && styles.visibilityOptionSelected,
              ]}
              onPress={() => setProfileVisibility('friends')}
            >
              <View style={styles.visibilityIcon}>
                <Ionicons
                  name="people"
                  size={24}
                  color={profileVisibility === 'friends' ? '#3b82f6' : '#64748b'}
                />
              </View>
              <Text style={[
                styles.visibilityLabel,
                profileVisibility === 'friends' && styles.visibilityLabelSelected,
              ]}>
                Friends
              </Text>
              <Text style={styles.visibilityDescription}>Friends only</Text>
            </Pressable>

            <Pressable
              style={[
                styles.visibilityOption,
                profileVisibility === 'private' && styles.visibilityOptionSelected,
              ]}
              onPress={() => setProfileVisibility('private')}
            >
              <View style={styles.visibilityIcon}>
                <Ionicons
                  name="lock-closed"
                  size={24}
                  color={profileVisibility === 'private' ? '#3b82f6' : '#64748b'}
                />
              </View>
              <Text style={[
                styles.visibilityLabel,
                profileVisibility === 'private' && styles.visibilityLabelSelected,
              ]}>
                Private
              </Text>
              <Text style={styles.visibilityDescription}>Only you</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Show Email Address</Text>
              <Text style={styles.settingSubtitle}>Display email on your profile</Text>
            </View>
            <Switch
              value={showEmail}
              onValueChange={setShowEmail}
              trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Show Phone Number</Text>
              <Text style={styles.settingSubtitle}>Display phone on your profile</Text>
            </View>
            <Switch
              value={showPhone}
              onValueChange={setShowPhone}
              trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Show Location</Text>
              <Text style={styles.settingSubtitle}>Display city and state</Text>
            </View>
            <Switch
              value={showLocation}
              onValueChange={setShowLocation}
              trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Show Activity Status</Text>
              <Text style={styles.settingSubtitle}>Let others see when you're active</Text>
            </View>
            <Switch
              value={showActivityStatus}
              onValueChange={setShowActivityStatus}
              trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Data Sharing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sharing</Text>
          <Text style={styles.sectionDescription}>
            Control what data you share with your coach and others
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Share Progress with Coach</Text>
              <Text style={styles.settingSubtitle}>Allow coach to view your progress</Text>
            </View>
            <Switch
              value={shareProgressWithCoach}
              onValueChange={setShareProgressWithCoach}
              trackColor={{ false: '#cbd5e1', true: '#10b981' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Share Health Data</Text>
              <Text style={styles.settingSubtitle}>Weight, measurements, health metrics</Text>
            </View>
            <Switch
              value={shareHealthData}
              onValueChange={setShareHealthData}
              trackColor={{ false: '#cbd5e1', true: '#10b981' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Share Meal Logs</Text>
              <Text style={styles.settingSubtitle}>Food diary and nutrition data</Text>
            </View>
            <Switch
              value={shareMealLogs}
              onValueChange={setShareMealLogs}
              trackColor={{ false: '#cbd5e1', true: '#10b981' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Share Workout Data</Text>
              <Text style={styles.settingSubtitle}>Exercise logs and activity</Text>
            </View>
            <Switch
              value={shareWorkoutData}
              onValueChange={setShareWorkoutData}
              trackColor={{ false: '#cbd5e1', true: '#10b981' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Analytics & Tracking Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics & Tracking</Text>
          <Text style={styles.sectionDescription}>
            Help us improve by sharing usage data
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Analytics</Text>
              <Text style={styles.settingSubtitle}>Help improve app performance</Text>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={setAnalyticsEnabled}
              trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Personalized Ads</Text>
              <Text style={styles.settingSubtitle}>Show ads based on your interests</Text>
            </View>
            <Switch
              value={personalizedAds}
              onValueChange={setPersonalizedAds}
              trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Third-Party Sharing</Text>
              <Text style={styles.settingSubtitle}>Share data with partner services</Text>
            </View>
            <Switch
              value={thirdPartySharing}
              onValueChange={setThirdPartySharing}
              trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Activity Log Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Log</Text>
          <Text style={styles.sectionDescription}>
            View and manage your account activity
          </Text>
          
          <Pressable style={styles.actionItem} onPress={handleViewActivityLog}>
            <View style={styles.actionLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="list-outline" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.actionTitle}>View Activity Log</Text>
                <Text style={styles.actionSubtitle}>See all account actions</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>

          <Pressable style={styles.actionItem} onPress={handleClearActivityLog}>
            <View style={styles.actionLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="trash-outline" size={20} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Clear Activity Log</Text>
                <Text style={styles.actionSubtitle}>Delete activity history</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <Text style={styles.sectionDescription}>
            Manage your stored data
          </Text>
          
          <Pressable style={styles.actionItem} onPress={handleClearCache}>
            <View style={styles.actionLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="file-tray-outline" size={20} color="#6366f1" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Clear Cache</Text>
                <Text style={styles.actionSubtitle}>~45 MB • Free up space</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>

          <Pressable style={styles.actionItem} onPress={handleClearSearchHistory}>
            <View style={styles.actionLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="search-outline" size={20} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Clear Search History</Text>
                <Text style={styles.actionSubtitle}>Delete all searches</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>
        </View>

        {/* Privacy Policy Link */}
        <View style={styles.section}>
          <Pressable style={styles.linkItem}>
            <Ionicons name="document-text-outline" size={20} color="#3b82f6" />
            <Text style={styles.linkText}>View Privacy Policy</Text>
            <Ionicons name="open-outline" size={16} color="#3b82f6" />
          </Pressable>

          <Pressable style={styles.linkItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#3b82f6" />
            <Text style={styles.linkText}>View Terms of Service</Text>
            <Ionicons name="open-outline" size={16} color="#3b82f6" />
          </Pressable>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color="#10b981" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your Privacy Matters</Text>
            <Text style={styles.infoText}>
              We take your privacy seriously and will never sell your personal information to third parties.
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
    backgroundColor: '#10b981',
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
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 18,
  },

  // Visibility Options
  visibilityOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  visibilityOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  visibilityOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  visibilityIcon: {
    marginBottom: 8,
  },
  visibilityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  visibilityLabelSelected: {
    color: '#3b82f6',
  },
  visibilityDescription: {
    fontSize: 11,
    color: '#94a3b8',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
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
    flex: 1,
    marginRight: 12,
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

  // Action Items
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionLeft: {
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
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },

  // Link Items
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#d1fae5',
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
    color: '#047857',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#059669',
    lineHeight: 18,
  },
});
