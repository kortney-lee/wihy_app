import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList, RootStackParamList } from '../types/navigation';
import { dashboardTheme } from '../theme/dashboardTheme';
import { HamburgerMenu } from '../components/shared/HamburgerMenu';
import { WebPageWrapper } from '../components/shared';
import { AuthContext } from '../context/AuthContext';
import CoachDashboard from './CoachDashboard';
import CoachOverview from './CoachOverview';
import CreateMeals from './CreateMeals';
import ClientManagement from './ClientManagement';
import ClientOnboarding from './ClientOnboarding';

const isWeb = Platform.OS === 'web';

const { width: screenWidth } = Dimensions.get('window');

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  StackNavigationProp<RootStackParamList>
>;

type CoachViewType = 'overview' | 'dashboard' | 'meals' | 'clients' | 'onboard';

interface CoachOption {
  id: CoachViewType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  available: boolean;
}

interface CoachDashboardPageProps {
  showMenuFromHealthTab?: boolean;
  onMenuClose?: () => void;
  onContextChange?: (context: 'personal' | 'family' | 'coach') => void;
}

const CoachDashboardPage: React.FC<CoachDashboardPageProps> = ({ showMenuFromHealthTab = false, onMenuClose, onContextChange }) => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = React.useContext(AuthContext);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [selectedView, setSelectedView] = useState<CoachViewType | null>(null); // Start with hub view

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
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // Reset view state when user plan changes (dev mode switcher)
  React.useEffect(() => {
    setSelectedView(null);
    setShowHamburgerMenu(false);
  }, [user?.plan]);

  const coachOptions: CoachOption[] = [
    {
      id: 'overview',
      title: 'Overview',
      subtitle: 'Revenue & quick actions',
      icon: 'stats-chart',
      color: '#10b981',
      available: true,
    },
    {
      id: 'dashboard',
      title: 'Coach Dashboard',
      subtitle: 'Manage your clients & programs',
      icon: 'people',
      color: '#3b82f6',
      available: true,
    },
    {
      id: 'clients',
      title: 'Clients',
      subtitle: 'View and manage all clients',
      icon: 'people-circle',
      color: '#8b5cf6',
      available: true,
    },
    {
      id: 'meals',
      title: 'Programs',
      subtitle: 'Meal plans & workout programs',
      icon: 'restaurant',
      color: '#f59e0b',
      available: true,
    },
    {
      id: 'onboard',
      title: 'Onboarding',
      subtitle: 'Add new clients',
      icon: 'person-add',
      color: '#10b981',
      available: true,
    },
  ];

  const handleViewSelect = (viewId: CoachViewType) => {
    setSelectedView(viewId);
    setShowHamburgerMenu(false);
  };

  const handleBackToDashboardSelection = () => {
    setSelectedView(null);
    setShowHamburgerMenu(false);
  };

  // Handle Health tab clicks from parent HealthHub
  React.useEffect(() => {
    if (showMenuFromHealthTab) {
      setShowHamburgerMenu(true);
    }
  }, [showMenuFromHealthTab]);

  const renderSelectedView = () => {
    switch (selectedView) {
      case 'overview':
        return <CoachOverview />;
      case 'dashboard':
        return <CoachDashboard />;
      case 'meals':
        return <CreateMeals />;
      case 'clients':
        return <ClientManagement />;
      case 'onboard':
        return <ClientOnboarding />;
      default:
        return null;
    }
  };

  if (selectedView) {
    return (
      <View style={styles.container}>
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
              // Map hamburger menu options to coach views
              if (dashboardType === 'coach') {
                setSelectedView('dashboard');
              } else if (dashboardType === 'meals') {
                setSelectedView('meals');
              } else if (dashboardType === 'clients') {
                setSelectedView('clients');
              } else if (dashboardType === 'onboard') {
                setSelectedView('onboard');
              } else if (dashboardType === null) {
                // Back to coach hub home
                handleBackToDashboardSelection();
              } else {
                // For non-coach views, go back to selection
                handleBackToDashboardSelection();
              }
            }}
            context="coach"
            isCoach={true}
          />
        )}
        
        {renderSelectedView()}
      </View>
    );
  }

  return (
    <WebPageWrapper activeTab="health">
      <View style={[styles.container, isWeb && { flex: undefined, minHeight: undefined }]}>
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
            // Map hamburger menu options to coach views
            if (dashboardType === null) {
              // "Coach Hub" clicked - go back to main hub
              handleBackToDashboardSelection();
            } else if (dashboardType === 'coach') {
              setSelectedView('dashboard');
            } else if (dashboardType === 'meals') {
              setSelectedView('meals');
            } else if (dashboardType === 'clients') {
              setSelectedView('clients');
            } else if (dashboardType === 'onboard') {
              setSelectedView('onboard');
            }
          }}
          context="coach"
        />
      )}

      {/* Status bar area - solid color */}
      <View style={{ height: insets.top, backgroundColor: '#3b82f6' }} />
      
      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
          <Text style={styles.headerTitle}>Coach Hub</Text>
          <Text style={styles.headerSubtitle}>Manage clients and grow your business</Text>
          <View style={styles.statsRow}>
            <Ionicons name="briefcase" size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.statsLabel}>Active Today</Text>
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: '#e0f2fe' }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Dashboard Grid */}
        <View style={[styles.dashboardGrid, isWeb && { maxWidth: 800, alignSelf: 'center', width: '100%' }]}>
          {coachOptions.map((option) => {
            // Web-specific sizing
            const cardWidth = isWeb ? 160 : '47%';
            const iconSize = isWeb ? 24 : 32;
            const titleSize = isWeb ? 14 : 16;
            const subtitleSize = isWeb ? 11 : 12;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.dashboardCard,
                  { backgroundColor: option.color, width: cardWidth as any },
                  isWeb && { aspectRatio: undefined, height: 140, padding: 12 },
                  !option.available && styles.optionCardDisabled,
                ]}
                onPress={() => option.available && handleViewSelect(option.id)}
                disabled={!option.available}
              >
                <View style={[styles.cardIconContainer, isWeb && { marginBottom: 8 }]}>
                  <Ionicons name={option.icon as any} size={iconSize} color="#ffffff" />
                </View>
                <Text style={[styles.cardTitle, { fontSize: titleSize }]}>{option.title}</Text>
                <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>{option.subtitle}</Text>
                {!option.available && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          
          {/* Switch back to Personal Dashboard */}
          {onContextChange && (
            <TouchableOpacity
              style={[
                styles.dashboardCard, 
                styles.switchPersonalCard,
                isWeb && { width: 160, aspectRatio: undefined, height: 140, padding: 12 },
              ]}
              onPress={() => onContextChange('personal')}
            >
              <View style={[styles.cardIconContainer, isWeb && { marginBottom: 8 }]}>
                <Ionicons name="person" size={isWeb ? 24 : 32} color="#10b981" />
              </View>
              <Text style={[styles.cardTitle, { color: '#10b981', fontSize: isWeb ? 14 : 16 }]}>Personal</Text>
              <Text style={[styles.cardSubtitle, { color: '#6b7280', fontSize: isWeb ? 11 : 12 }]}>Back to my health</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
      </View>
    </WebPageWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  collapsibleHeader: {
    backgroundColor: '#3b82f6',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: dashboardTheme.spacing.md,
    padding: dashboardTheme.spacing.md,
  },
  dashboardCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: dashboardTheme.borderRadius.lg,
    padding: dashboardTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...dashboardTheme.shadows.md,
  },
  cardIconContainer: {
    marginBottom: dashboardTheme.spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  optionCardDisabled: {
    opacity: 0.6,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  switchPersonalCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
  },
});

export default CoachDashboardPage;
