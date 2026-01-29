import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, NotificationTile, BackToHubButton } from '../components/shared';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { dashboardColors, GradientDashboardHeader } from '../components/shared';
import { dashboardTheme } from '../theme/dashboardTheme';
import { coachService, Client as APIClient, ClientDashboard } from '../services';
import { useAuth } from '../context/AuthContext';
import SendInvitation from './SendInvitation';

const spinnerGif = require('../../assets/whatishealthyspinner.gif');
const isWeb = Platform.OS === 'web';
const { width: screenWidth } = Dimensions.get('window');

interface Client {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  goals: string[];
  diet?: string;
  lastActive: string;
}

type TabType = 'goals' | 'actions' | 'meals' | 'shopping' | 'client-view';

interface CoachDashboardProps {
  isDashboardMode?: boolean;
  onBack?: () => void;
}

export default function CoachDashboard({
  isDashboardMode = false,
  onBack,
}: CoachDashboardProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { coachId } = useAuth();
  
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('goals');
  
  // API State
  const [clients, setClients] = useState<Client[]>([]);
  const [clientDashboard, setClientDashboard] = useState<ClientDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Client invitation - using SendInvitation modal
  const [showSendInvitation, setShowSendInvitation] = useState(false);

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  // Load client dashboard when a client is selected
  useEffect(() => {
    if (selectedClient) {
      loadClientDashboard(selectedClient.id);
    }
  }, [selectedClient]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Require authenticated coachId
      if (!coachId) {
        throw new Error('Coach authentication required');
      }
      
      const data = await coachService.listClients(coachId, {
        status: 'ACTIVE',
        search: searchQuery || undefined,
      });
      
      // Map API client to UI client format
      // Goals and diet will be populated when dashboard is loaded
      const mappedClients: Client[] = data.map((client: APIClient) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        goals: [],
        diet: undefined,
        lastActive: client.last_active || 'Recently',
      }));
      
      setClients(mappedClients);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load clients';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const loadClientDashboard = async (clientId: string) => {
    try {
      // Require authenticated coachId
      if (!coachId) {
        throw new Error('Coach authentication required');
      }
      
      const data = await coachService.getClientDashboard(coachId, clientId);
      setClientDashboard(data);
      
      // Update selected client with dashboard data
      if (selectedClient) {
        // Extract goals from client data (assuming client object has goals array)
        const extractedGoals = (data.client as any).goals || [];
        
        // Extract diet type from nutrition summary or client preferences
        const extractedDiet = (data.client as any).diet_type || (data.client as any).preferences?.diet;
        
        setSelectedClient({
          ...selectedClient,
          goals: extractedGoals,
          diet: extractedDiet,
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Could not load client details');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    if (selectedClient) {
      await loadClientDashboard(selectedClient.id);
    }
    setRefreshing(false);
  };

  const handleInvitationSent = async () => {
    // Refresh client list after invitation is sent
    await loadClients();
  };

  const handleSearch = async () => {
    await loadClients();
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'goals' as TabType, label: 'Goals & Diets', icon: 'flag' },
    { id: 'actions' as TabType, label: 'Actions', icon: 'checkbox' },
    { id: 'meals' as TabType, label: 'Meals', icon: 'restaurant' },
    { id: 'shopping' as TabType, label: 'Shopping', icon: 'cart' },
    { id: 'client-view' as TabType, label: 'Client View', icon: 'eye' },
  ];

  const handleClientPress = (client: Client) => {
    // Navigate to dedicated client progress screen
    navigation.navigate('ClientProgress', {
      clientId: client.id,
      clientName: client.name,
    });
  };

  const renderClientItem = ({ item }: { item: Client }) => (
    <Pressable
      style={[
        styles.clientCard,
        selectedClient?.id === item.id && styles.clientCardSelected,
      ]}
      onPress={() => handleClientPress(item)}
    >
      <View style={styles.clientAvatar}>
        <Text style={styles.clientAvatarText}>
          {item.name.split(' ').map(n => n[0]).join('')}
        </Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.clientEmail}>{item.email}</Text>
        {item.goals.length > 0 && (
          <View style={styles.goalsContainer}>
            {item.goals.slice(0, 2).map((goal, idx) => (
              <View key={idx} style={styles.goalBadge}>
                <Text style={styles.goalText}>{goal}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.clientMeta}>
        <Text style={styles.lastActive}>{item.lastActive}</Text>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </Pressable>
  );

  const renderGoalsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Client Goals</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Primary Goals</Text>
        {selectedClient?.goals && selectedClient.goals.length > 0 ? (
          selectedClient.goals.map((goal, idx) => (
            <View key={idx} style={styles.goalItem}>
              <Ionicons name="flag" size={20} color="#10b981" />
              <Text style={styles.goalItemText}>{goal}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyGoalText}>No goals set yet</Text>
        )}
        <Pressable style={styles.addButton}>
          <Ionicons name="add-circle" size={20} color="#3b82f6" />
          <Text style={styles.addButtonText}>Add New Goal</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Diet Preferences</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Current Diet Plan</Text>
        <Text style={styles.dietCurrentText}>
          {selectedClient?.diet || 'No diet plan assigned'}
        </Text>
        <View style={styles.dietSelector}>
          {['Keto', 'Paleo', 'Mediterranean', 'Vegan', 'High Protein'].map((diet) => (
            <Pressable
              key={diet}
              style={[
                styles.dietOption,
                selectedClient?.diet === diet && styles.dietOptionSelected,
              ]}
            >
              <Text
                style={[
                  styles.dietOptionText,
                  selectedClient?.diet === diet && styles.dietOptionTextSelected,
                ]}
              >
                {diet}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      {/* Workout Stats */}
      {clientDashboard?.fitness_progress && (
        <View>
          <Text style={styles.sectionTitle}>Fitness Progress</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Current Program</Text>
            <Text style={styles.statValue}>
              {clientDashboard.fitness_progress.current_program || 'No active program'}
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Workouts Completed</Text>
                <Text style={styles.statNumber}>{clientDashboard.fitness_progress.workouts_completed}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Adherence Rate</Text>
                <Text style={styles.statNumber}>{clientDashboard.fitness_progress.adherence_rate}%</Text>
              </View>
            </View>
          </View>
        </View>
      )}
      
      {/* Nutrition Stats */}
      {clientDashboard?.nutrition_summary && (
        <View>
          <Text style={styles.sectionTitle}>Nutrition Summary</Text>
          <View style={styles.card}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg Daily Calories</Text>
                <Text style={styles.statNumber}>{clientDashboard.nutrition_summary.daily_average_calories}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Goal Compliance</Text>
                <Text style={styles.statNumber}>{clientDashboard.nutrition_summary.goal_compliance_rate}%</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderActionsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Action Items</Text>
      
      <View style={styles.card}>
        <View style={styles.actionItem}>
          <Ionicons name="checkbox" size={24} color="#10b981" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Log daily meals</Text>
            <Text style={styles.actionStatus}>Due: Today</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: '#fef3c7' }]}>
            <Text style={styles.priorityText}>High</Text>
          </View>
        </View>

        <View style={styles.actionItem}>
          <Ionicons name="square-outline" size={24} color="#6b7280" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Track water intake</Text>
            <Text style={styles.actionStatus}>Due: Tomorrow</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: '#dbeafe' }]}>
            <Text style={styles.priorityText}>Medium</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.primaryButton}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.primaryButtonText}>Create New Action</Text>
      </Pressable>
    </View>
  );

  const renderMealsTab = () => {
    const handleAssignFitnessPlan = async () => {
      if (!selectedClient) return;
      
      Alert.prompt(
        'Assign Fitness Plan',
        'Enter program ID to assign:',
        async (programId) => {
          if (!programId?.trim()) return;
          
          try {
            // Require authenticated coachId
            if (!coachId) {
              throw new Error('Coach authentication required');
            }
            
            await coachService.assignFitnessPlan({
              coachId: coachId,
              clientId: selectedClient.id,
              programId: programId.trim(),
            });
            
            Alert.alert('Success', 'Fitness plan assigned successfully');
            await loadClientDashboard(selectedClient.id);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to assign plan';
            Alert.alert('Error', message);
          }
        }
      );
    };
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Meal Programs</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardLabel}>7-Day Meal Plan</Text>
          <View style={styles.mealDay}>
            <Text style={styles.mealDayTitle}>Monday</Text>
            <View style={styles.mealItem}>
              <Ionicons name="sunny" size={16} color="#f59e0b" />
              <Text style={styles.mealType}>Breakfast:</Text>
              <Text style={styles.mealName}>Protein Smoothie Bowl</Text>
            </View>
            <View style={styles.mealItem}>
              <Ionicons name="partly-sunny" size={16} color="#10b981" />
              <Text style={styles.mealType}>Lunch:</Text>
              <Text style={styles.mealName}>Grilled Chicken Salad</Text>
            </View>
            <View style={styles.mealItem}>
              <Ionicons name="moon" size={16} color="#6366f1" />
              <Text style={styles.mealType}>Dinner:</Text>
              <Text style={styles.mealName}>Salmon with Vegetables</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => Alert.alert('Build Meal Program', 'Navigate to meal builder from the dashboard menu.')}>
          <Ionicons name="restaurant" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Build Meal Program</Text>
        </Pressable>
        
        <Pressable style={styles.secondaryButton} onPress={handleAssignFitnessPlan}>
          <Ionicons name="fitness" size={20} color="#3b82f6" />
          <Text style={styles.secondaryButtonText}>Assign Fitness Plan</Text>
        </Pressable>
      </View>
    );
  };

  const renderShoppingTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Shopping List</Text>
      
      {['Produce', 'Protein', 'Dairy', 'Grains'].map((category) => (
        <View key={category} style={styles.card}>
          <Text style={styles.cardLabel}>{category}</Text>
          <View style={styles.shoppingItems}>
            <Text style={styles.shoppingItem}>• Spinach (2 bunches)</Text>
            <Text style={styles.shoppingItem}>• Chicken breast (1 lb)</Text>
            <Text style={styles.shoppingItem}>• Greek yogurt (32 oz)</Text>
          </View>
        </View>
      ))}

      <Pressable style={styles.secondaryButton}>
        <Ionicons name="cart" size={20} color="#3b82f6" />
        <Text style={styles.secondaryButtonText}>Send to Instacart</Text>
      </Pressable>
    </View>
  );

  const renderClientViewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.previewBanner}>
        <Ionicons name="phone-portrait" size={24} color="#6366f1" />
        <Text style={styles.previewText}>Client Mobile View Preview</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.previewTitle}>What {selectedClient?.name} Sees</Text>
        <Text style={styles.previewSubtitle}>Today's Plan</Text>
        <View style={styles.previewMeal}>
          <Text style={styles.previewMealTime}>Breakfast</Text>
          <Text style={styles.previewMealName}>Protein Smoothie Bowl</Text>
          <Text style={styles.previewMacros}>380 cal • 25g protein • 15g carbs</Text>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'goals':
        return renderGoalsTab();
      case 'actions':
        return renderActionsTab();
      case 'meals':
        return renderMealsTab();
      case 'shopping':
        return renderShoppingTab();
      case 'client-view':
        return renderClientViewTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Back to Coach Hub button - only on web */}
      {isDashboardMode && onBack && (
        <BackToHubButton
          hubName="Coach Hub"
          color="#3b82f6"
          onPress={onBack}
          isMobileWeb={isWeb && screenWidth < 768}
          spinnerGif={spinnerGif}
        />
      )}

      {/* Status bar area - solid color */}
      <View style={{ height: insets.top, backgroundColor: '#3b82f6' }} />
        
        {/* Collapsing Header */}
        <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
          <Animated.View style={[styles.headerContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
            <Text style={styles.headerTitle}>Coach Dashboard</Text>
            <Text style={styles.headerSubtitle}>Manage your clients & programs</Text>
            <View style={styles.headerStats}>
              <View style={styles.headerStatBadge}>
                <Text style={styles.headerStatText}>{clients.length} active clients</Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >

        {!selectedClient ? (
          /* Client List View */
          <View style={styles.clientListContainer}>
            {/* Notifications Tile for Coaches */}
            <View style={styles.notificationSection}>
              <NotificationTile
                userId={coachId || undefined}
                onPress={() => navigation.navigate('Notifications' as never)}
                onViewMessages={() => navigation.navigate('Messages' as never)}
                onViewReminders={() => navigation.navigate('Reminders' as never)}
              />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search clients..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                placeholderTextColor="#9ca3af"
                returnKeyType="search"
              />
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {filteredClients.length} Client{filteredClients.length !== 1 ? 's' : ''}
              </Text>
              <Pressable 
                style={styles.addClientButton}
                onPress={() => setShowSendInvitation(true)}
              >
                <Ionicons name="person-add" size={20} color="#3b82f6" />
                <Text style={styles.addClientText}>Invite Client</Text>
              </Pressable>
            </View>

            {loading && clients.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading clients...</Text>
              </View>
            ) : filteredClients.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No clients found</Text>
                <Text style={styles.emptySubtext}>Add your first client to get started</Text>
              </View>
            ) : (
              filteredClients.map((client) => (
                <View key={client.id}>
                  {renderClientItem({ item: client })}
                </View>
              ))
            )}
          </View>
        ) : (
          /* Client Detail View with Tabs */
          <View style={styles.clientDetailContainer}>
            {/* Client Header */}
            <View style={styles.clientHeader}>
              <Pressable onPress={() => setSelectedClient(null)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color="#3b82f6" />
              </Pressable>
              <View style={styles.clientHeaderInfo}>
                <Text style={styles.clientHeaderName}>{selectedClient.name}</Text>
                <Text style={styles.clientHeaderEmail}>{selectedClient.email}</Text>
              </View>
            </View>

            {/* Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
              {tabs.map((tab) => (
                <Pressable
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={18}
                    color={activeTab === tab.id ? '#3b82f6' : '#6b7280'}
                  />
                  <Text
                    style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Tab Content */}
            {renderTabContent()}
          </View>
        )}
      </Animated.ScrollView>
      
      {/* Client Invitation Modal */}
      {showSendInvitation && (
        <SendInvitation
          visible={showSendInvitation}
          onClose={() => {
            setShowSendInvitation(false);
            handleInvitationSent();
          }}
          coachId={coachId || ''}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  
  // Collapsing Header
  collapsibleHeader: {
    backgroundColor: '#3b82f6',
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
  
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
  },
  contentWrapper: {
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  innerContainer: {
    flex: 1,
  },
  clientListContainer: {
    flex: 1,
  },
  notificationSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
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
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
    outlineStyle: 'none' as any,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  addClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addClientText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  clientList: {
    paddingHorizontal: 16,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  clientCardSelected: {
    borderColor: '#3b82f6',
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  clientInfo: {
    flex: 1,
    marginLeft: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  clientEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  goalBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  goalText: {
    fontSize: 12,
    color: '#166534',
  },
  clientMeta: {
    alignItems: 'flex-end',
  },
  lastActive: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  clientDetailContainer: {
    flex: 1,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  clientHeaderInfo: {
    marginLeft: 12,
  },
  clientHeaderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  clientHeaderEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  goalItemText: {
    fontSize: 16,
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  dietSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dietOptionSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  dietOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  dietOptionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  actionStatus: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  mealDay: {
    marginBottom: 16,
  },
  mealDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  mealName: {
    fontSize: 14,
    color: '#111827',
  },
  shoppingItems: {
    gap: 8,
  },
  shoppingItem: {
    fontSize: 14,
    color: '#111827',
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#eef2ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  previewSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 8,
  },
  previewMeal: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  previewMealTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  previewMealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  previewMacros: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  emptyGoalText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  dietCurrentText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statValue: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
    outlineStyle: 'none' as any,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  modalButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
