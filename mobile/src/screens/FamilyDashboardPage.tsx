import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Share,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientDashboardHeader, WebPageWrapper } from '../components/shared';
import { HamburgerMenu } from '../components/shared/HamburgerMenu';
import { AuthContext } from '../context/AuthContext';
import { hasAIAccess, hasInstacartAccess } from '../utils/capabilities';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import SvgIcon from '../components/shared/SvgIcon';
import type { DashboardContext } from './HealthHub';

const spinnerGif = require('../../assets/whatishealthyspinner.gif');
const isWeb = Platform.OS === 'web';

const { width: screenWidth } = Dimensions.get('window');

interface FamilyMember {
  id: string;
  name: string;
  age: number;
  avatar?: string;
  role: 'owner' | 'member';
  healthScore: number;
  lastActive: string;
}

interface FamilyDashboardPageProps {
  showMenuFromHealthTab?: boolean;
  onMenuClose?: () => void;
  onContextChange?: (context: DashboardContext) => void;
}

export default function FamilyDashboardPage({ 
  showMenuFromHealthTab = false, 
  onMenuClose,
  onContextChange,
}: FamilyDashboardPageProps) {
  const { user } = useContext(AuthContext);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const layout = useDashboardLayout();
  const isMobileWeb = isWeb && layout.screenWidth < 768;
  
  // Handle Health tab clicks from parent HealthHub
  useEffect(() => {
    if (showMenuFromHealthTab) {
      setShowHamburgerMenu(true);
    }
  }, [showMenuFromHealthTab]);
  
  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
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
  
  // Mock family data - replace with real data from backend
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: '1',
      name: 'John (You)',
      age: 35,
      role: 'owner',
      healthScore: 82,
      lastActive: 'Now',
    },
    {
      id: '2',
      name: 'Sarah',
      age: 33,
      role: 'member',
      healthScore: 88,
      lastActive: '2h ago',
    },
    {
      id: '3',
      name: 'Emma',
      age: 10,
      role: 'member',
      healthScore: 95,
      lastActive: '5h ago',
    },
    {
      id: '4',
      name: 'Jake',
      age: 8,
      role: 'member',
      healthScore: 91,
      lastActive: '1d ago',
    },
  ]);

  const guardianCode = user?.guardianCode || 'WIHY-ABC123';
  const isPremium = user?.plan === 'family-premium';
  const maxMembers = isPremium ? 999 : 4; // Unlimited for premium, 4 for basic
  const canAddMembers = familyMembers.length < maxMembers;

  const handleShareGuardianCode = async () => {
    try {
      await Share.share({
        message: `Join our WIHY AI family! Use this Guardian Code: ${guardianCode}\n\nDownload the app: https://wihy.ai\n\nEnter this code to join our family health tracking.`,
        title: 'Join WIHY AI Family',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderMemberCard = (member: FamilyMember) => (
    <TouchableOpacity key={member.id} style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {member.name.split(' ')[0].charAt(0)}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberHeader}>
          <Text style={styles.memberName}>{member.name}</Text>
          {member.role === 'owner' && (
            <View style={styles.ownerBadge}>
              <SvgIcon name="star" size={12} color="#fbbf24" />
              <Text style={styles.ownerBadgeText}>Owner</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberMeta}>Age {member.age} • {member.lastActive}</Text>
        <View style={styles.healthScoreBar}>
          <View
            style={[
              styles.healthScoreFill,
              { width: `${member.healthScore}%` },
            ]}
          />
        </View>
        <Text style={styles.healthScoreText}>Health Score: {member.healthScore}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
      <View style={styles.container}>
        {/* Hamburger Menu for navigation */}
        {showHamburgerMenu && (
          <HamburgerMenu
            visible={showHamburgerMenu}
            onClose={() => {
              setShowHamburgerMenu(false);
              onMenuClose?.();
            }}
            onNavigateToDashboard={(dashboardType) => {
              setShowHamburgerMenu(false);
              onMenuClose?.();
              // Navigate to different contexts
              if (dashboardType === null) {
                onContextChange?.('personal');
              } else if (dashboardType === 'coach') {
                onContextChange?.('coach');
              }
              // Stay on family if 'family' is selected
            }}
            context="family"
          />
        )}
        
        {/* Back to Health Hub button for web */}
        {isWeb && onContextChange && (
          <TouchableOpacity
            onPress={() => onContextChange('personal')}
            style={{
              position: 'absolute',
              top: isMobileWeb ? 12 : 40,
              right: isMobileWeb ? 12 : 24,
              zIndex: 99,
              flexDirection: 'row',
              alignItems: 'center',
              gap: isMobileWeb ? 6 : 10,
              paddingVertical: isMobileWeb ? 4 : 6,
              paddingLeft: isMobileWeb ? 8 : 12,
              paddingRight: isMobileWeb ? 4 : 6,
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
            } as any}
          >
            <SvgIcon name="arrow-back" size={isMobileWeb ? 14 : 16} color="#16a34a" />
            <Text style={{ fontSize: isMobileWeb ? 11 : 13, fontWeight: '600', color: '#16a34a' }}>Health Hub</Text>
            <Image 
              source={spinnerGif}
              resizeMode="cover"
              style={{
                width: isMobileWeb ? 28 : 36,
                height: isMobileWeb ? 28 : 36,
                borderRadius: isMobileWeb ? 14 : 18,
              }}
            />
          </TouchableOpacity>
        )}
        
        {/* Status bar area - solid color */}
        <View style={{ height: insets.top, backgroundColor: '#0ea5e9' }} />
        
        {/* Collapsing Header */}
        <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
          <Animated.View style={[styles.headerContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
            <Text style={styles.headerTitle}>Family Health</Text>
            <Text style={styles.headerSubtitle}>Track your family's health journey</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Family Health Score</Text>
              <Text style={styles.statsValue}>89%</Text>
            </View>
          </Animated.View>
        </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Family Members - Metric Style */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Today's Metrics</Text>
          <View style={styles.metricsGrid}>
            {familyMembers.map((member) => (
              <TouchableOpacity key={member.id} style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: '#e0f2fe' }]}>
                  <Text style={styles.metricAvatarText}>
                    {member.name.split(' ')[0].charAt(0)}
                  </Text>
                </View>
                <Text style={styles.metricValue}>{member.healthScore}%</Text>
                <Text style={styles.metricLabel}>{member.name.split(' ')[0]}</Text>
                <Text style={styles.metricSubLabel}>{member.lastActive}</Text>
                <View style={styles.metricBar}>
                  <View
                    style={[
                      styles.metricBarFill,
                      { width: `${member.healthScore}%`, backgroundColor: '#0ea5e9' },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Guardian Code Card */}
        {user?.familyRole === 'owner' && (
          <View style={styles.section}>
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.guardianCodeCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.guardianCodeHeader}>
                <SvgIcon name="shield-checkmark" size={24} color="#fff" />
                <Text style={styles.guardianCodeTitle}>Guardian Code</Text>
              </View>
              <Text style={styles.guardianCode}>{guardianCode}</Text>
              <Text style={styles.guardianCodeSubtitle}>
                Share this code with family members to join
              </Text>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareGuardianCode}
              >
                <SvgIcon name="share-outline" size={18} color="#8b5cf6" />
                <Text style={styles.shareButtonText}>Share Code</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Family Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Features</Text>
          <View style={styles.featuresGrid}>
            <TouchableOpacity style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#dbeafe' }]}>
                <SvgIcon name="restaurant" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.featureTitle}>Family Meals</Text>
              <Text style={styles.featureSubtitle}>Plan together</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#fef3c7' }]}>
                <SvgIcon name="cart" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.featureTitle}>Shopping List</Text>
              <Text style={styles.featureSubtitle}>Shared grocery</Text>
              {hasInstacartAccess(user) && (
                <View style={styles.featureBadge}>
                  <Text style={styles.featureBadgeText}>+ Instacart</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#f3e8ff' }]}>
                <SvgIcon name="fitness" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.featureTitle}>Family Goals</Text>
              <Text style={styles.featureSubtitle}>Track progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              disabled={!hasAIAccess(user)}
            >
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: hasAIAccess(user) ? '#dcfce7' : '#f3f4f6' },
                ]}
              >
                <SvgIcon
                  name="sparkles"
                  size={24}
                  color={hasAIAccess(user) ? '#10b981' : '#9ca3af'}
                />
                {!hasAIAccess(user) && (
                  <View style={styles.lockIcon}>
                    <SvgIcon name="lock-closed" size={12} color="#fff" />
                  </View>
                )}
              </View>
              <Text style={styles.featureTitle}>WIHY AI</Text>
              <Text style={styles.featureSubtitle}>
                {hasAIAccess(user) ? 'Ask questions' : 'Premium only'}
              </Text>
            </TouchableOpacity>

            {/* Switch back to Personal Dashboard */}
            {onContextChange && (
              <TouchableOpacity
                style={[styles.featureCard, styles.switchPersonalCard]}
                onPress={() => onContextChange('personal')}
              >
                <View style={[styles.featureIcon, { backgroundColor: '#dcfce7' }]}>
                  <SvgIcon name="person" size={24} color="#10b981" />
                </View>
                <Text style={styles.featureTitle}>Personal</Text>
                <Text style={styles.featureSubtitle}>Back to my health</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  scrollView: {
    flex: 1,
  },
  
  // Collapsing Header
  collapsibleHeader: {
    backgroundColor: '#0ea5e9',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  
  headerBanner: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    opacity: 0.95,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  statsValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  metricsSection: {
    padding: 20,
    paddingTop: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    minWidth: 140,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    flexShrink: 0,
  },
  metricAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  metricSubLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 8,
  },
  metricBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  guardianCodeCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  guardianCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  guardianCodeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  guardianCode: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
    marginVertical: 8,
  },
  guardianCodeSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#d97706',
  },
  memberMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  healthScoreBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  healthScoreFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  healthScoreText: {
    fontSize: 11,
    color: '#6b7280',
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  upgradeBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    minWidth: 140,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  lockIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'center',
  },
  featureBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 6,
  },
  featureBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
  },
  switchPersonalCard: {
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
  },
});
