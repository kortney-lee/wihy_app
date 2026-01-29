import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardColors, Ionicons, BackToHubButton } from '../components/shared';
import { SweepBorder } from '../components/SweepBorder';
import { colors } from '../theme/design-tokens';

const spinnerGif = require('../../assets/whatishealthyspinner.gif');
const isWeb = Platform.OS === 'web';

// Import CSS for web only
if (isWeb) {
  require('../styles/web-landing.css');
}
const { width: screenWidth } = Dimensions.get('window');
import { dashboardTheme } from '../theme/dashboardTheme';
import { coachService, Client as APIClient, ClientDashboard } from '../services';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  program: string;
  startDate: string;
  lastContact: string;
  adherence: number;
}

interface ClientManagementProps {
  isDashboardMode?: boolean;
  onBack?: () => void;
}

export default function ClientManagement({
  isDashboardMode = false,
  onBack,
}: ClientManagementProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { coachId, user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [selectedView, setSelectedView] = useState<'list' | 'grid'>('list');

  // API State
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, [coachId]);

  const loadClients = useCallback(async () => {
    if (!coachId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get coach overview which includes all clients
      const overview = await coachService.getCoachOverview(coachId);
      
      // Map API clients to UI Client format
      const mappedClients: Client[] = (overview.clients || []).map((apiClient: any) => ({
        id: apiClient.id || apiClient.client_id,
        name: apiClient.name || apiClient.client_name || 'Unknown',
        email: apiClient.email || apiClient.client_email || '',
        phone: '', // API may not provide phone
        status: mapStatus(apiClient.status),
        program: getProgramName(apiClient),
        startDate: formatDate(apiClient.joined_date || apiClient.relationship_started),
        lastContact: apiClient.last_active || 'Recently',
        adherence: apiClient.adherence_rate || 0, // API required for adherence data
      }));
      
      setClients(mappedClients);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load clients';
      setError(message);
      console.error('ClientManagement: Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  const mapStatus = (status: string): 'active' | 'inactive' | 'pending' => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'active') return 'active';
    if (normalizedStatus === 'pending') return 'pending';
    return 'inactive';
  };

  const getProgramName = (client: any): string => {
    if (client.active_meal_programs > 0 && client.active_fitness_programs > 0) {
      return 'Nutrition + Fitness';
    }
    if (client.active_meal_programs > 0) return 'Nutrition Plan';
    if (client.active_fitness_programs > 0) return 'Fitness Plan';
    return 'No Active Program';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  }, [loadClients]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.program.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = selectedFilter === 'all' || client.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#6b7280';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getFilterColor = (filter: string) => {
    switch (filter) {
      case 'active':
        return '#10b981'; // green
      case 'pending':
        return '#f59e0b'; // orange
      case 'inactive':
        return '#6b7280'; // gray
      case 'all':
      default:
        return '#3b82f6'; // blue
    }
  };

  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 80) return '#10b981';
    if (adherence >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const handleClientPress = (client: Client) => {
    // Navigate to dedicated client progress screen
    navigation.navigate('ClientProgress', {
      clientId: client.id,
      clientName: client.name,
    });
  };

  const handleAddClient = () => {
    // Navigate to client onboarding page
    navigation.navigate('ClientOnboarding');
  };

  const handleUpdateClientStatus = async (client: Client, newStatus: 'active' | 'inactive') => {
    try {
      await coachService.updateClientStatus(coachId, client.id, newStatus);
      Alert.alert('Success', `Client status updated to ${newStatus}`);
      await loadClients();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      Alert.alert('Error', message);
    }
  };

  const handleMessageClient = (client: Client) => {
    Alert.alert('Message Client', `Send message to ${client.name}`);
  };

  const handleCallClient = (client: Client) => {
    Alert.alert('Call Client', `Call ${client.phone || client.email}`);
  };

  const renderClientCard = (client: Client) => {
    if (selectedView === 'grid') {
      return (
        <Pressable
          style={styles.gridCard}
          onPress={() => handleClientPress(client)}
        >
          <View style={styles.gridAvatarContainer}>
            <View style={styles.gridAvatarCircle}>
              <Text style={styles.gridAvatar}>
                {client.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(client.status) }]} />
          </View>
          <Text style={styles.gridName} numberOfLines={1}>
            {client.name}
          </Text>
          <Text style={styles.gridProgram} numberOfLines={1}>
            {client.program}
          </Text>
          <View style={styles.gridAdherence}>
            <View style={[styles.adherenceBar, { width: `${client.adherence}%`, backgroundColor: getAdherenceColor(client.adherence) }]} />
          </View>
          <Text style={styles.gridAdherenceText}>{client.adherence}% adherence</Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        style={styles.clientCard}
        onPress={() => handleClientPress(client)}
      >
        <View style={styles.clientHeader}>
          <View style={styles.clientInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatar}>
                  {client.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(client.status) }]} />
            </View>
            <View style={styles.clientDetails}>
              <Text style={styles.clientName}>{client.name}</Text>
              <Text style={styles.clientEmail}>{client.email}</Text>
              <Text style={styles.clientPhone}>{client.phone}</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, { color: getStatusColor(client.status) }]}>
              {client.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.clientMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="briefcase" size={16} color="#6b7280" />
            <Text style={styles.metaText}>{client.program}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={16} color="#6b7280" />
            <Text style={styles.metaText}>Since {client.startDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={16} color="#6b7280" />
            <Text style={styles.metaText}>Last: {client.lastContact}</Text>
          </View>
        </View>

        <View style={styles.adherenceContainer}>
          <View style={styles.adherenceHeader}>
            <Text style={styles.adherenceLabel}>Program Adherence</Text>
            <Text style={[styles.adherenceValue, { color: getAdherenceColor(client.adherence) }]}>
              {client.adherence}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${client.adherence}%`,
                  backgroundColor: getAdherenceColor(client.adherence),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.clientActions}>
          <Pressable
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => handleClientPress(client)}
          >
            <Ionicons name="eye" size={20} color="#fff" />
            <Text style={styles.primaryActionText}>View</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleMessageClient(client)}
          >
            <Ionicons name="chatbubble" size={22} color="#3b82f6" />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleCallClient(client)}
          >
            <Ionicons name="call" size={22} color="#10b981" />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back to Coach Hub button - only on web */}
      {isDashboardMode && onBack && (
        <BackToHubButton
          hubName="Coach Hub"
          color="#8b5cf6"
          onPress={onBack}
          isMobileWeb={isWeb && screenWidth < 768}
          spinnerGif={spinnerGif}
        />
      )}

      {/* Status bar area - solid color */}
      <View style={{ height: insets.top, backgroundColor: '#8b5cf6' }} />
        
        {/* Collapsing Header */}
        <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
          <Animated.View style={[styles.headerContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
            <Text style={styles.headerTitle}>Client Management</Text>
            <Text style={styles.headerSubtitle}>Track client progress & engagement</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Active Clients</Text>
              <Text style={styles.statsValue}>{clients.filter(c => c.status === 'active').length} / {clients.length}</Text>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            {isWeb ? (
              <div className="web-search-input-container" style={{ width: '100%' }}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9ca3af"
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#9ca3af" />
                    </Pressable>
                  )}
                </View>
              </div>
            ) : (
              <SweepBorder
                borderWidth={2}
                radius={28}
                durationMs={2500}
                colors={colors.borderSweep}
              >
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9ca3af"
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#9ca3af" />
                    </Pressable>
                  )}
                </View>
              </SweepBorder>
            )}
          </View>

          {/* Filters & View Toggle */}
          <View style={styles.filtersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}
            >
              {['all', 'active', 'pending', 'inactive'].map((filter) => (
                <Pressable
                  key={filter}
                  style={[
                    styles.filterChip,
                    selectedFilter === filter && [
                      styles.filterChipActive,
                      {
                        backgroundColor: getFilterColor(filter) + '15',
                        borderColor: getFilterColor(filter),
                      },
                    ],
                  ]}
                  onPress={() => setSelectedFilter(filter as typeof selectedFilter)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selectedFilter === filter && [
                        styles.filterTextActive,
                        { color: getFilterColor(filter) },
                      ],
                    ]}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.viewToggle}>
              <Pressable
                style={[styles.viewButton, selectedView === 'list' && styles.viewButtonActive]}
                onPress={() => setSelectedView('list')}
              >
                <Ionicons
                  name="list"
                  size={20}
                  color={selectedView === 'list' ? '#3b82f6' : '#6b7280'}
                />
              </Pressable>
              <Pressable
                style={[styles.viewButton, selectedView === 'grid' && styles.viewButtonActive]}
                onPress={() => setSelectedView('grid')}
              >
                <Ionicons
                  name="grid"
                  size={20}
                  color={selectedView === 'grid' ? '#3b82f6' : '#6b7280'}
                />
              </Pressable>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#d1fae5', borderColor: '#10b981' }]}>
              <Text style={[styles.statValue, { color: '#047857' }]}>{clients.filter((c) => c.status === 'active').length}</Text>
              <Text style={[styles.statLabel, { color: '#065f46' }]}>Active</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
              <Text style={[styles.statValue, { color: '#d97706' }]}>{clients.filter((c) => c.status === 'pending').length}</Text>
              <Text style={[styles.statLabel, { color: '#92400e' }]}>Pending</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#dbeafe', borderColor: '#3b82f6' }]}>
              <Text style={[styles.statValue, { color: '#1e40af' }]}>{clients.length}</Text>
              <Text style={[styles.statLabel, { color: '#1e3a8a' }]}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#e9d5ff', borderColor: '#a855f7' }]}>
              <Text style={[styles.statValue, { color: '#7c3aed' }]}>
                {Math.round(clients.reduce((sum, c) => sum + c.adherence, 0) / clients.length)}%
              </Text>
              <Text style={[styles.statLabel, { color: '#6b21a8' }]}>Avg Adherence</Text>
            </View>
          </View>

          {/* Client List */}
          <View
            style={[styles.content, selectedView === 'grid' ? styles.gridContainer : undefined]}
          >
            {loading && clients.length === 0 ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.loadingText}>Loading clients...</Text>
              </View>
            ) : error && clients.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle" size={64} color="#ef4444" />
                <Text style={styles.emptyTitle}>Error Loading Clients</Text>
                <Text style={styles.emptyText}>{error}</Text>
                <Pressable style={styles.emptyButton} onPress={loadClients}>
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : filteredClients.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people" size={64} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No Clients Found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Add your first client to get started'}
                </Text>
                <Pressable style={styles.emptyButton} onPress={handleAddClient}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>Add Client</Text>
                </Pressable>
              </View>
            ) : (
              filteredClients.map((client) => (
                <View key={client.id}>
                  {renderClientCard(client)}
                </View>
              ))
            )}
          </View>
          
          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  collapsibleHeader: {
    backgroundColor: '#8b5cf6',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginRight: 8,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
    color: '#111827',
    outlineStyle: 'none' as any,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 16,
  },
  filtersScroll: {
    gap: 12,
    paddingRight: 16,
    flexGrow: 0,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 48,
  },
  filterChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 20,
  },
  filterTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  viewButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  viewButtonActive: {
    backgroundColor: '#eff6ff',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  clientCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3b82f6',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  clientEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  clientPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clientMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  adherenceContainer: {
    gap: 6,
  },
  adherenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adherenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  adherenceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  clientActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  primaryAction: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  gridAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  gridAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridAvatar: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3b82f6',
  },
  gridName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  gridProgram: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },
  gridAdherence: {
    width: '100%',
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  adherenceBar: {
    height: '100%',
  },
  gridAdherenceText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
