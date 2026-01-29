import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientDashboardHeader, Ionicons, CloseButton } from '../components/shared';
import { SweepBorder } from '../components/SweepBorder';
import { colors } from '../theme/design-tokens';
import { dashboardTheme } from '../theme/dashboardTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { researchService, ResearchArticle, ResearchDashboardStats, ResearchBookmark, SearchHistoryItem } from '../services';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const isWeb = Platform.OS === 'web';

// Import CSS for web only
if (isWeb) {
  require('../styles/web-landing.css');
}

// Types
type ResearchSearchResult = ResearchArticle;

interface ResearchScreenProps {
  isDashboardMode?: boolean;
  /** Callback when results view is entered/exited (for hiding/showing hub button) */
  onResultsViewChange?: (isInResultsView: boolean) => void;
}

// Cache utilities
const getCachedResults = async (keyword: string): Promise<ResearchSearchResult[] | null> => {
  try {
    const cacheKey = `research_cache_${keyword.toLowerCase().replace(/\s+/g, '_')}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const isExpired = Date.now() - parsed.timestamp > 30 * 60 * 1000; // 30 minutes
      return isExpired ? null : parsed.results;
    }
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};

const cacheSearchResults = async (keyword: string, results: ResearchSearchResult[]) => {
  try {
    const cacheKey = `research_cache_${keyword.toLowerCase().replace(/\s+/g, '_')}`;
    const cacheData = {
      query: keyword,
      timestamp: Date.now(),
      results,
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

// Color helpers
const getStudyTypeColor = (studyType?: string) => {
  switch (studyType) {
    case 'randomized_controlled_trial': return '#ef4444';
    case 'meta_analysis': return '#8b5cf6';
    case 'systematic_review': return '#3b82f6';
    case 'cohort_study': return '#22c55e';
    default: return '#6b7280';
  }
};

const getEvidenceLevelColor = (level?: string) => {
  switch (level) {
    case 'high': return '#4cbb17';
    case 'moderate': return '#f59e0b';
    case 'low': return '#f97316';
    case 'very_low': return '#ef4444';
    default: return '#6b7280';
  }
};

const getStudyTypeDisplay = (studyType?: string) => {
  if (!studyType) return 'Research';
  return studyType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
};

// Topic icon helper for API-returned topics (strings)
const getTopicIcon = (topic: string): string => {
  const topicLower = topic.toLowerCase();
  if (topicLower.includes('diet') || topicLower.includes('mediterranean') || topicLower.includes('plant')) return 'leaf';
  if (topicLower.includes('fast') || topicLower.includes('time')) return 'time';
  if (topicLower.includes('gut') || topicLower.includes('microbiome') || topicLower.includes('fitness')) return 'fitness';
  if (topicLower.includes('sleep') || topicLower.includes('moon')) return 'moon';
  if (topicLower.includes('oil') || topicLower.includes('water')) return 'water';
  if (topicLower.includes('processed') || topicLower.includes('food') || topicLower.includes('ultra')) return 'fast-food';
  if (topicLower.includes('protein') || topicLower.includes('muscle')) return 'barbell';
  if (topicLower.includes('sugar') || topicLower.includes('glucose')) return 'pulse';
  if (topicLower.includes('vitamin') || topicLower.includes('supplement')) return 'medical';
  return 'nutrition';
};

// Topic color helper for API-returned topics
const getTopicColor = (index: number): string => {
  const colors = ['#22c55e', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444', '#f97316'];
  return colors[index % colors.length];
};

// Note: Mock data removed - UI now shows proper empty/error states

// Study Card Component
const StudyCard: React.FC<{
  study: ResearchSearchResult;
  onPress: (study: ResearchSearchResult) => void;
}> = ({ study, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.studyCard}
      onPress={() => onPress(study)}
      activeOpacity={0.7}
    >
      <View style={styles.studyCardHeader}>
        <View style={[styles.studyTypeBadge, { backgroundColor: getStudyTypeColor(study.studyType) + '20' }]}>
          <Text style={[styles.studyTypeBadgeText, { color: getStudyTypeColor(study.studyType) }]}>
            {getStudyTypeDisplay(study.studyType)}
          </Text>
        </View>
        <View style={styles.evidenceBadge}>
          <View style={[styles.evidenceDot, { backgroundColor: getEvidenceLevelColor(study.evidenceLevel) }]} />
          <Text style={styles.evidenceText}>{study.evidenceLevel}</Text>
        </View>
      </View>

      <Text style={styles.studyTitle} numberOfLines={2}>
        {study.title}
      </Text>

      {study.abstract && (
        <Text style={styles.studyAbstract} numberOfLines={2}>
          {study.abstract}
        </Text>
      )}

      <View style={styles.studyMeta}>
        <Text style={styles.studyJournal} numberOfLines={1}>
          {study.journal}
        </Text>
        <Text style={styles.studyYear}>{study.publicationYear}</Text>
      </View>

      <View style={styles.studyFooter}>
        <Text style={styles.relevanceScore}>
          {Math.round((study.relevanceScore || 0) * 100)}% relevant
        </Text>
        <View style={styles.readButtonSmall}>
          <Text style={styles.readButtonSmallText}>View</Text>
          <Ionicons name="chevron-forward" size={14} color="#8b5cf6" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Main Research Screen
export default function ResearchScreen({ isDashboardMode = false, onResultsViewChange }: ResearchScreenProps) {
  // Auth context for user ID
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const userId = user?.id || '';

  // State management
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ResearchSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<ResearchSearchResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // User stats from backend
  const [userStats, setUserStats] = useState<ResearchDashboardStats | null>(null);
  const [popularTopics, setPopularTopics] = useState<string[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

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

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    setLoadingStats(true);
    try {
      // Load recent searches from backend (with local fallback)
      await loadRecentSearches();
      
      // Load user stats from backend
      if (userId) {
        try {
          const stats = await researchService.getUserStats(userId);
          setUserStats(stats);
        } catch (statsError) {
          console.warn('[Research] Failed to load user stats:', statsError);
        }
      }
      
      // Load popular topics from backend
      try {
        const topics = await researchService.getTopics();
        if (topics.length > 0) {
          setPopularTopics(topics.slice(0, 6));
        }
      } catch (topicsError) {
        console.warn('[Research] Failed to load topics, using defaults:', topicsError);
        // Fallback to default topics
        setPopularTopics([
          'Mediterranean Diet',
          'Intermittent Fasting',
          'Gut Microbiome',
          'Sleep Quality',
          'Seed Oils',
          'Ultra-processed Foods',
        ]);
      }
    } catch (error) {
      console.error('[Research] Failed to load dashboard data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadRecentSearches = async () => {
    try {
      // Try backend first if user is logged in
      if (userId) {
        try {
          const history = await researchService.getSearchHistory(userId, 5);
          if (history.searches.length > 0) {
            const searches = history.searches.map(s => s.keyword);
            setRecentSearches(searches);
            return;
          }
        } catch (backendError) {
          console.warn('[Research] Backend search history not available:', backendError);
        }
      }
      
      // Fallback to local storage
      const stored = await AsyncStorage.getItem('wihy_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const updateRecentSearches = async (searchQuery: string) => {
    try {
      const updated = [
        searchQuery,
        ...recentSearches.filter(s => s !== searchQuery),
      ].slice(0, 5);

      setRecentSearches(updated);
      
      // Save to local storage as fallback
      await AsyncStorage.setItem('wihy_recent_searches', JSON.stringify(updated));
      
      // Note: Backend will track searches automatically via the search endpoint
    } catch (error) {
      console.error('Failed to update recent searches:', error);
    }
  };

  // Search functionality
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setActiveWorkspace(searchQuery);
    onResultsViewChange?.(true); // Notify parent we're entering results view

    try {
      // Check cache first
      const cachedResults = await getCachedResults(searchQuery);
      if (cachedResults) {
        setSearchResults(cachedResults);
        setLoading(false);
        await updateRecentSearches(searchQuery);
        return;
      }

      // Call WIHY Research API: GET /api/research/search?keyword={query}&limit={limit}
      // Using researchService which already implements the correct endpoint
      const results = await researchService.searchArticles({ 
        query: searchQuery,  // researchService converts 'query' to 'keyword' parameter
        limit: 20 
      });

      if (results.length === 0) {
        // Show empty state when no results found
        setSearchResults([]);
        setError('No research articles found for your query. Try different keywords.');
      } else {
        setSearchResults(results);
        await cacheSearchResults(searchQuery, results);
      }

      await updateRecentSearches(searchQuery);
    } catch (apiError) {
      console.error('Search error:', apiError);
      // Show error state - no mock data fallback
      setSearchResults([]);
      setError('Unable to search research database. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = () => {
    if (query.trim()) {
      handleSearch(query.trim());
    }
  };

  const handleStudyPress = async (study: ResearchSearchResult) => {
    setSelectedStudy(study);
    setShowModal(true);
    
    // Fetch full article content including abstract and body text
    // API: GET /api/research/pmc/{pmcId}/content
    // This returns the complete article content, not just metadata
    if (!study.abstract || study.abstract === 'Abstract not available - full text may contain detailed methodology') {
      try {
        console.log('[ResearchScreen] Fetching full article content for', study.pmcid);
        const content = await researchService.getArticleContent(study.pmcid);
        if (content && content.abstract) {
          // Update the selected study with the full abstract from content
          setSelectedStudy({ 
            ...study, 
            abstract: content.abstract 
          });
        }
      } catch (error) {
        console.warn('[ResearchScreen] Failed to fetch article content:', error);
        // Keep showing the modal even if fetch fails
      }
    }
  };

  const handleBackToDashboard = () => {
    setActiveWorkspace(null);
    setSearchResults([]);
    setQuery('');
    setError(null);
    onResultsViewChange?.(false); // Notify parent we're exiting results view
  };

  const onRefresh = async () => {
    if (activeWorkspace) {
      setRefreshing(true);
      await handleSearch(activeWorkspace);
      setRefreshing(false);
    }
  };

  // Results view when searching
  if (activeWorkspace) {
    const isWeb = Platform.OS === 'web';
    
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
          }
        >
          {/* Results Header - Using dedicated GradientDashboardHeader component */}
          <GradientDashboardHeader
            title="Research Results"
            subtitle={`"${activeWorkspace}"`}
            gradient="research"
            showBackButton={!isWeb}
            onBackPress={handleBackToDashboard}
            rightAction={isWeb ? { icon: 'arrow-back', onPress: handleBackToDashboard } : undefined}
            badge={error ? { icon: "information-circle", text: error } : undefined}
          />

          {/* Results Stats */}
          <View style={styles.resultsStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{searchResults.length}</Text>
              <Text style={styles.statLabel}>Studies Found</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {searchResults.filter(s => s.evidenceLevel === 'high').length}
              </Text>
              <Text style={styles.statLabel}>High Evidence</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {searchResults.filter(s => s.fullTextAvailable).length}
              </Text>
              <Text style={styles.statLabel}>Full Text</Text>
            </View>
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text style={styles.loadingText}>Searching research...</Text>
            </View>
          )}

          {/* Results List */}
          {!loading && (
            <View style={styles.resultsList}>
              {searchResults.map((study) => (
                <StudyCard
                  key={study.id}
                  study={study}
                  onPress={handleStudyPress}
                />
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Study Detail Modal */}
        <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <View style={styles.modalHeader}>
              <View style={{ width: 40 }} />
              <Text style={styles.modalHeaderTitle}>Study Details</Text>
              <CloseButton onPress={() => setShowModal(false)} />
            </View>

            {selectedStudy && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.studyTypeBadge, { backgroundColor: getStudyTypeColor(selectedStudy.studyType) + '20', alignSelf: 'flex-start', marginBottom: 16 }]}>
                  <Text style={[styles.studyTypeBadgeText, { color: getStudyTypeColor(selectedStudy.studyType) }]}>
                    {getStudyTypeDisplay(selectedStudy.studyType)}
                  </Text>
                </View>

                <Text style={styles.modalTitle}>{selectedStudy.title}</Text>

                <View style={styles.modalMeta}>
                  <View style={styles.modalMetaRow}>
                    <Ionicons name="people-outline" size={16} color="#6b7280" />
                    <Text style={styles.modalAuthors}>{selectedStudy.authors}</Text>
                  </View>
                  <View style={styles.modalMetaRow}>
                    <Ionicons name="book-outline" size={16} color="#6b7280" />
                    <Text style={styles.modalJournal}>{selectedStudy.journal} • {selectedStudy.publicationYear}</Text>
                  </View>
                  <View style={styles.modalMetaRow}>
                    <Ionicons name="document-text-outline" size={16} color="#6b7280" />
                    <Text style={styles.modalPmcId}>PMC ID: {selectedStudy.pmcid}</Text>
                  </View>
                </View>

                <View style={styles.evidenceSection}>
                  <Text style={styles.sectionTitle}>Evidence Level</Text>
                  <View style={styles.evidenceLevelCard}>
                    <View style={[styles.evidenceLevelDot, { backgroundColor: getEvidenceLevelColor(selectedStudy.evidenceLevel) }]} />
                    <View>
                      <Text style={styles.evidenceLevelText}>
                        {selectedStudy.evidenceLevel?.replace(/_/g, ' ').toUpperCase()} EVIDENCE
                      </Text>
                      <Text style={styles.evidenceLevelDesc}>
                        {Math.round((selectedStudy.relevanceScore || 0) * 100)}% relevance score
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedStudy.abstract && (
                  <View style={styles.abstractSection}>
                    <Text style={styles.sectionTitle}>Abstract</Text>
                    <Text style={styles.abstractText}>{selectedStudy.abstract}</Text>
                  </View>
                )}

                {selectedStudy.fullTextAvailable && selectedStudy.links?.pmcWebsite && (
                  <TouchableOpacity 
                    style={styles.fullTextButton}
                    onPress={() => {
                      if (selectedStudy.links?.pmcWebsite) {
                        Linking.openURL(selectedStudy.links.pmcWebsite);
                      }
                    }}
                  >
                    <Ionicons name="open-outline" size={20} color="#fff" />
                    <Text style={styles.fullTextButtonText}>View Full Text</Text>
                  </TouchableOpacity>
                )}

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>
      </View>
    );
  }

  // Dashboard view (default state)
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Status bar area - solid color */}
      <View style={{ height: insets.top, backgroundColor: '#8b5cf6' }} />
      
      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
          <Text style={styles.headerTitle}>Research</Text>
          <Text style={styles.headerSubtitle}>Evidence-based health insights</Text>
          <View style={styles.headerStats}>
            <View style={styles.headerStatBadge}>
              <Ionicons name="document-text" size={14} color="#fff" />
              <Text style={styles.headerStatText}>
                {userStats?.new_papers || 0} new papers this month
              </Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={loadingStats}
            onRefresh={loadDashboardData}
            tintColor="#8b5cf6"
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={{ flex: 1 }}>
            {isWeb ? (
              // Web: Use CSS border sweep animation
              // @ts-ignore - className for web
              <div className="web-search-input-container" style={{ display: 'flex', alignItems: 'center', paddingLeft: 18, paddingRight: 8, gap: 12, flex: 1 }}>
                <Ionicons name="search" size={20} color="#9ca3af" />
                {/* @ts-ignore - web input */}
                <input
                  type="text"
                  value={query}
                  onChange={(e: any) => setQuery(e.target.value)}
                  placeholder="Search health topics..."
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#1f2937',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    height: 56,
                    lineHeight: '56px',
                  }}
                  onKeyDown={(e: any) => {
                    if (e.key === 'Enter') handleAnalyze();
                  }}
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
                {/* Search button inside the sweep border */}
                <TouchableOpacity style={styles.searchButtonInline} onPress={handleAnalyze}>
                  <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </div>
            ) : (
              // Native: Use SweepBorder component
              <SweepBorder
                borderWidth={2}
                radius={28}
                durationMs={2500}
                colors={colors.borderSweep}
              >
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={20} color="#9ca3af" />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search health topics..."
                    placeholderTextColor="#9ca3af"
                    style={styles.searchInput}
                    returnKeyType="search"
                    onSubmitEditing={handleAnalyze}
                  />
                  {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.searchButtonInline} onPress={handleAnalyze}>
                    <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              </SweepBorder>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#ede9fe' }]}>
              <Ionicons name="time" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.quickActionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="bookmark" size={20} color="#22c55e" />
            </View>
            <Text style={styles.quickActionText}>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="trending-up" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.quickActionText}>Trending</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionHeader}>Your Research</Text>
          <View style={styles.statsCards}>
            <View style={[styles.statsCard, { borderLeftColor: '#8b5cf6' }]}>
              <Ionicons name="document-text" size={24} color="#8b5cf6" />
              <Text style={styles.statsCardValue}>{userStats?.new_papers || 0}</Text>
              <Text style={styles.statsCardLabel}>New Papers</Text>
            </View>
            <View style={[styles.statsCard, { borderLeftColor: '#22c55e' }]}>
              <Ionicons name="bookmark" size={24} color="#22c55e" />
              <Text style={styles.statsCardValue}>{userStats?.saved || 0}</Text>
              <Text style={styles.statsCardLabel}>Saved</Text>
            </View>
          </View>
        </View>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionHeader}>Recent Searches</Text>
            <View style={styles.recentTags}>
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentTag}
                  onPress={() => {
                    setQuery(search);
                    handleSearch(search);
                  }}
                >
                  <Ionicons name="time-outline" size={14} color="#6b7280" />
                  <Text style={styles.recentTagText}>{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Popular Topics */}
        <View style={styles.topicsSection}>
          <Text style={styles.sectionHeader}>Popular Topics</Text>
          <View style={styles.topicsList}>
            {(popularTopics.length > 0 ? popularTopics : [
              { topic: 'Mediterranean Diet', icon: 'leaf', color: '#22c55e' },
              { topic: 'Intermittent Fasting', icon: 'time', color: '#f59e0b' },
              { topic: 'Gut Microbiome', icon: 'fitness', color: '#8b5cf6' },
              { topic: 'Sleep Quality', icon: 'moon', color: '#3b82f6' },
              { topic: 'Seed Oils', icon: 'water', color: '#ef4444' },
              { topic: 'Ultra-processed Foods', icon: 'fast-food', color: '#f97316' },
            ]).map((item, index) => {
              // Handle both API response (string) and fallback (object) formats
              const topicName = typeof item === 'string' ? item : item.topic;
              const topicIcon = typeof item === 'string' ? getTopicIcon(item) : item.icon;
              const topicColor = typeof item === 'string' ? getTopicColor(index) : item.color;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.topicItem}
                  onPress={() => {
                    setQuery(topicName);
                    handleSearch(topicName);
                  }}
                >
                  <View style={[styles.topicIcon, { backgroundColor: topicColor + '20' }]}>
                    <Ionicons name={topicIcon as any} size={18} color={topicColor} />
                  </View>
                  <Text style={styles.topicText}>{topicName}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  
  // Collapsing Header
  collapsibleHeader: {
    backgroundColor: '#8b5cf6',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  
  // Header
  header: {
    paddingHorizontal: dashboardTheme.header.paddingHorizontal,
    paddingTop: dashboardTheme.header.paddingTop,
    paddingBottom: dashboardTheme.header.paddingBottom,
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
  headerStats: {
    flexDirection: 'row',
  },
  headerStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  headerStatText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },

  // Search Section
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(64,60,67,0.35)',
        shadowOpacity: 0.35,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 3px 6px rgba(64,60,67,0.35)',
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    outlineStyle: 'none' as any,
  },
  searchButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
  },
  searchButtonInline: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  statsCards: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
  },
  statsCardLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },

  // Recent Section
  recentSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  recentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recentTagText: {
    fontSize: 14,
    color: '#374151',
  },

  // Topics Section
  topicsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  topicsList: {
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    overflow: 'hidden',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  topicIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topicText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },

  // Results Header
  resultsHeader: {
    paddingHorizontal: dashboardTheme.header.paddingHorizontal,
    paddingTop: dashboardTheme.header.paddingTop,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  resultsHeaderContent: {},
  resultsHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  resultsHeaderQuery: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ffffff',
  },

  // Results Stats
  resultsStats: {
    flexDirection: 'row',
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 12,
  },

  // Results List
  resultsList: {
    padding: 16,
    gap: 12,
  },

  // Study Card
  studyCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  studyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studyTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  studyTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  evidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  evidenceText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  studyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 22,
    marginBottom: 8,
  },
  studyAbstract: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  studyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  studyJournal: {
    fontSize: 12,
    color: '#9ca3af',
    flex: 1,
  },
  studyYear: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  studyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  relevanceScore: {
    fontSize: 12,
    color: '#6b7280',
  },
  readButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readButtonSmallText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b5cf6',
  },

  // Modal
  modalContainer: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 28,
    marginBottom: 16,
  },
  modalMeta: {
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalAuthors: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  modalJournal: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalPmcId: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  evidenceSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  evidenceLevelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  evidenceLevelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  evidenceLevelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  evidenceLevelDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  abstractSection: {
    marginBottom: 16,
  },
  abstractText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    padding: 16,
  },
  fullTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  fullTextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
