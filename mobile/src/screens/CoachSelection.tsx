import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  FlatList,
  Platform,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dashboardColors, SvgIcon } from '../components/shared';
import { useTheme } from '../context/ThemeContext';
import { getDashboardTheme, dashboardTheme } from '../theme/dashboardTheme';
import { userService } from '../services/userService';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';

const isWeb = Platform.OS === 'web';

interface Coach {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  rating: number;
  reviews: number;
  specialties: string[];
  experience: string;
  certification: string;
  rate: string;
  location: string;
  bio: string;
}

export default function CoachSelection() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const dashboardTheme = getDashboardTheme(isDark);
  const insets = useSafeAreaInsets();
  useDashboardLayout(); // For responsive behavior
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Collapsible header animation constants - CRITICAL: 180px per design patterns
  const HEADER_MAX_HEIGHT = 180;
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>('All');
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const specialties = [
    { key: 'All', label: 'All', icon: 'apps' },
    { key: 'Weight Loss', label: 'Weight Loss', icon: 'trending-down' },
    { key: 'Sports Nutrition', label: 'Sports Nutrition', icon: 'fitness' },
    { key: 'Meal Planning', label: 'Meal Planning', icon: 'restaurant' },
    { key: 'Diabetes', label: 'Diabetes', icon: 'medical' },
    { key: 'Heart Health', label: 'Heart Health', icon: 'heart' },
    { key: 'Vegan/Plant-Based', label: 'Vegan/Plant-Based', icon: 'leaf' },
  ];

  // Load coaches from API
  const loadCoaches = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const filters: any = {
        accepting_clients: true,
        sort: 'rating' as const,
      };
      
      // Add search query if present
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      
      // Add specialty filter if selected
      if (selectedSpecialty && selectedSpecialty !== 'All') {
        filters.specialty = selectedSpecialty;
      }

      const result = await userService.discoverCoaches(filters);
      
      // Map API response to Coach interface
      const mappedCoaches: Coach[] = (result.coaches || []).map((c: any) => {
        // Handle location - can be string or {city, state} object
        let locationStr = 'Remote';
        if (typeof c.location === 'string') {
          locationStr = c.location;
        } else if (c.location && typeof c.location === 'object') {
          const parts = [c.location.city, c.location.state].filter(Boolean);
          locationStr = parts.length > 0 ? parts.join(', ') : 'Remote';
        } else if (c.city) {
          locationStr = c.state ? `${c.city}, ${c.state}` : c.city;
        }
        
        return {
          id: c.id || c.coach_id,
          name: c.name || c.full_name || 'Unknown Coach',
          title: c.title || c.specialization || 'Health Coach',
          avatar: c.avatar_url || c.avatar,
          rating: typeof c.rating === 'object' ? (c.rating?.average || 0) : (c.rating || c.average_rating || 0),
          reviews: typeof c.rating === 'object' ? (c.rating?.total_reviews || 0) : (c.review_count || c.reviews || 0),
          specialties: c.specialties || c.specialty_areas || [],
          experience: c.experience || c.years_experience ? `${c.years_experience} years` : 'Experienced',
          certification: c.certification || c.certifications?.join(', ') || '',
          rate: c.rate || c.hourly_rate ? `$${c.hourly_rate}/session` : 'Contact for pricing',
          location: locationStr,
          bio: c.bio || c.about || '',
        };
      });

      setCoaches(mappedCoaches);
    } catch (err) {
      console.error('[CoachSelection] Failed to load coaches:', err);
      setError('Failed to load coaches. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedSpecialty]);

  // Load coaches on mount and when filters change
  useEffect(() => {
    loadCoaches();
  }, [loadCoaches]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadCoaches();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = useCallback(() => {
    loadCoaches(true);
  }, [loadCoaches]);

  const getSpecialtyColor = (key: string): string => {
    switch (key) {
      case 'Heart Health':
        return '#ef4444'; // red
      case 'Vegan/Plant-Based':
        return '#10b981'; // green
      case 'Weight Loss':
        return '#f59e0b'; // orange
      case 'Sports Nutrition':
        return '#8b5cf6'; // purple
      case 'Meal Planning':
        return '#06b6d4'; // cyan
      case 'Diabetes':
        return '#ec4899'; // pink
      case 'All':
      default:
        return '#3b82f6'; // blue
    }
  };

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = 
      coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpecialty = !selectedSpecialty || selectedSpecialty === 'All' || 
      coach.specialties.includes(selectedSpecialty);
    
    return matchesSearch && matchesSpecialty;
  });

  const renderCoachCard = ({ item }: { item: Coach }) => (
    <Pressable 
      style={[styles.coachCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('CoachDetailPage' as any, { coachId: item.id })}
    >
      {/* Coach Header */}
      <View style={styles.coachHeader}>
        <View style={styles.coachAvatar}>
          <Text style={styles.coachAvatarText}>
            {item.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.coachHeaderInfo}>
          <Text style={[styles.coachName, { color: theme.colors.text }]}>{item.name}</Text>
          <Text style={[styles.coachTitle, { color: theme.colors.textSecondary }]}>{item.title}</Text>
          <View style={styles.ratingContainer}>
            <SvgIcon name="star" size={16} color="#f59e0b" />
            <Text style={[styles.ratingText, { color: theme.colors.text }]}>{item.rating}</Text>
            <Text style={[styles.reviewsText, { color: theme.colors.textSecondary }]}>({item.reviews} reviews)</Text>
          </View>
        </View>
      </View>

      {/* Specialties */}
      <View style={styles.specialtiesContainer}>
        {item.specialties.map((specialty, idx) => (
          <View key={idx} style={styles.specialtyBadge}>
            <Text style={styles.specialtyText}>{specialty}</Text>
          </View>
        ))}
      </View>

      {/* Bio */}
      <Text style={[styles.bio, { color: theme.colors.textSecondary }]} numberOfLines={2}>
        {item.bio}
      </Text>

      {/* Coach Details */}
      <View style={[styles.detailsContainer, { borderTopColor: theme.colors.border }]}>
        <View style={styles.detailItem}>
          <SvgIcon name="briefcase" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{item.experience}</Text>
        </View>
        <View style={styles.detailItem}>
          <SvgIcon name="medal" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{item.certification}</Text>
        </View>
        <View style={styles.detailItem}>
          <SvgIcon name="location" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{item.location}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <View style={styles.rateInfo}>
          <Text style={[styles.rateLabel, { color: theme.colors.textSecondary }]}>From</Text>
          <Text style={[styles.rateValue, { color: theme.colors.text }]}>{item.rate}</Text>
        </View>
        <Pressable 
          style={[styles.viewProfileButton, { borderColor: '#3b82f6' }]}
          onPress={() => navigation.navigate('CoachDetailPage' as any, { coachId: item.id })}
        >
          <Text style={styles.viewProfileText}>View Profile</Text>
        </Pressable>
        <Pressable 
          style={styles.bookButton}
          onPress={() => navigation.navigate('RequestCoaching' as any, { coachId: item.id, coachName: item.name })}
        >
          <SvgIcon name="calendar" size={18} color="#fff" />
          <Text style={styles.bookButtonText}>Book</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  const renderHeader = () => (
    <>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <SvgIcon name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search by name, specialty..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.textSecondary}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <SvgIcon name="close-circle" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Specialty Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
        keyboardShouldPersistTaps="handled"
      >
        {specialties.map((specialty) => (
          <Pressable
            key={specialty.key}
            style={[
              styles.filterChip,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              selectedSpecialty === specialty.key && [
                styles.filterChipActive,
                { 
                  backgroundColor: getSpecialtyColor(specialty.key) + '15',
                  borderColor: getSpecialtyColor(specialty.key),
                },
              ],
            ]}
            onPress={() => setSelectedSpecialty(specialty.key)}
          >
            <SvgIcon
              name={specialty.icon as any}
              size={20}
              color={selectedSpecialty === specialty.key ? getSpecialtyColor(specialty.key) : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: theme.colors.textSecondary },
                selectedSpecialty === specialty.key && [
                  styles.filterChipTextActive,
                  { color: getSpecialtyColor(specialty.key) },
                ],
              ]}
            >
              {specialty.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Results Header */}
      <View style={[styles.resultsHeader, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.resultsText, { color: theme.colors.textSecondary }]}>
          {filteredCoaches.length} Coach{filteredCoaches.length !== 1 ? 'es' : ''} Available
        </Text>
        <Pressable style={styles.sortButton}>
          <Text style={[styles.sortText, { color: theme.colors.textSecondary }]}>Sort by Rating</Text>
          <SvgIcon name="chevron-down" size={16} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Status bar area - Always indigo to match header */}
      <View style={{ height: insets.top, backgroundColor: '#6366f1' }} />
      
      {/* Collapsing Header - Brand colors only, NO theme colors per dark mode exclusion rules */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
        <Animated.View 
          style={[
            styles.headerContent,
            { 
              opacity: headerOpacity,
              transform: [{ scale: titleScale }]
            }
          ]}
        >
          <Text style={styles.headerTitle}>Find Your Coach</Text>
          <Text style={styles.headerSubtitle}>Connect with expert health coaches</Text>
          {coaches.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{coaches.length} coaches available</Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[dashboardColors.primary]}
            tintColor={dashboardColors.primary}
          />
        }
      >
        {renderHeader()}
      
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={dashboardColors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Finding coaches...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <SvgIcon name="alert-circle" size={64} color="#ef4444" />
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => loadCoaches()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : filteredCoaches.length === 0 ? (
          <View style={styles.emptyState}>
            <SvgIcon name="people" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No coaches found</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          <View style={styles.coachList}>
            {filteredCoaches.map((coach) => (
              <View key={coach.id}>
                {renderCoachCard({ item: coach })}
              </View>
            ))}
          </View>
        )}
        
        {/* Bottom spacing for navigation */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  collapsibleHeader: {
    backgroundColor: '#6366f1',  // Brand color - DO NOT theme per dark mode rules
    overflow: 'hidden',
    paddingBottom: 20,  // CRITICAL: Prevents color bleeding
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,  // CRITICAL: Proper spacing from top
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: dashboardTheme.header.paddingHorizontal,
    paddingTop: dashboardTheme.header.paddingTop,
    paddingBottom: dashboardTheme.header.paddingBottom,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerStats: {
    alignSelf: 'stretch',
  },
  statBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerStatText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  contentWrapper: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: theme.colors.surface
    margin: 16,
    marginBottom: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(64,60,67,0.2)',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(64,60,67,0.2)',
      },
    }),
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    // color: theme.colors.text
    outlineStyle: 'none' as any,
  },
  filtersContainer: {
    maxHeight: 80,
    marginBottom: 4,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    // backgroundColor: theme.colors.surface
    borderWidth: 2,
    // borderColor: theme.colors.border
    minHeight: 48,
  },
  filterChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 15,
    fontWeight: '500',
    // color: theme.colors.textSecondary
    lineHeight: 20,
  },
  filterChipTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // backgroundColor: theme.colors.background
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    // color: theme.colors.textSecondary
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    // color: theme.colors.textSecondary
  },
  coachList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  coachCard: {
    // backgroundColor: theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coachHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  coachAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachAvatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3b82f6',
  },
  coachHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  coachName: {
    fontSize: 18,
    fontWeight: '600',
    // color: theme.colors.text
  },
  coachTitle: {
    fontSize: 14,
    // color: theme.colors.textSecondary
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    // color: theme.colors.text
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    // color: theme.colors.textSecondary
    marginLeft: 4,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  specialtyBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#166534',
  },
  bio: {
    fontSize: 14,
    // color: theme.colors.textSecondary
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    // borderTopColor: theme.colors.border
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    // color: theme.colors.textSecondary
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rateInfo: {
    marginRight: 8,
  },
  rateLabel: {
    fontSize: 12,
    // color: theme.colors.textSecondary
  },
  rateValue: {
    fontSize: 18,
    fontWeight: '700',
    // color: theme.colors.text
  },
  viewProfileButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    // borderColor: #3b82f6
    marginRight: 8,
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    // color: theme.colors.text
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    // color: theme.colors.textSecondary
    marginTop: 8,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 16,
    // color: theme.colors.textSecondary
    marginTop: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: dashboardColors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
