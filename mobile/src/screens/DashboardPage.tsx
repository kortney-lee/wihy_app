import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Image,
  useWindowDimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList, RootStackParamList } from '../types/navigation';
import type { DashboardContext } from './HealthHub';
import { dashboardTheme } from '../theme/dashboardTheme';
import { HamburgerMenu } from '../components/shared/HamburgerMenu';
import { GradientDashboardHeader, QuickStartGuide } from '../components/shared';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { hasCoachAccess, hasFamilyAccess, hasMealsAccess } from '../utils/capabilities';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import SvgIcon from '../components/shared/SvgIcon';
import { BackToHubButton } from '../components/shared/BackToHubButton';
// import { useSession } from '../contexts/SessionContext';
import OverviewDashboard from './OverviewDashboard';

const spinnerGif = require('../../assets/whatishealthyspinner.gif');
import MyProgressDashboard from './MyProgressDashboard';
import ConsumptionDashboard from './ConsumptionDashboard';
import ResearchScreen from './ResearchScreen';
import FitnessDashboard from './FitnessDashboard';
import ParentDashboard from './ParentDashboard';
import CreateMeals from './CreateMeals';
import ShoppingListScreen from './ShoppingListScreen';
import CoachSelection from './CoachSelection';
import ProfileSetupScreen from './ProfileSetupScreen';
import MealCalendar from './MealCalendar';
import PlanMealScreen from './PlanMealScreen';
import CookingDashboard from './CookingDashboard';
import TrainingDashboard from './TrainingDashboard';

// Note: screenWidth is now handled dynamically via useDashboardLayout

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  StackNavigationProp<RootStackParamList>
>;

type DashboardType = 'overview' | 'progress' | 'consumption' | 'fitness' | 'research' | 'coach' | 'parent' | 'meals' | 'calendar';

interface DashboardOption {
  id: DashboardType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  available: boolean;
}

interface DashboardPageProps {
  showMenuFromHealthTab?: boolean;
  onMenuClose?: () => void;
  onContextChange?: (context: DashboardContext) => void;
  canAccessFamily?: boolean;
  canAccessCoach?: boolean;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  showMenuFromHealthTab = false, 
  onMenuClose,
  onContextChange,
  canAccessFamily = false,
  canAccessCoach = false,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { user } = React.useContext(AuthContext);
  const { theme } = useTheme();
  const layout = useDashboardLayout();
  const insets = useSafeAreaInsets();

  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  
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
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });
  // const { hasActiveSession, createMockSession, endSession } = useSession();
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [showQuickStartGuide, setShowQuickStartGuide] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<'overview' | 'progress' | 'nutrition' | 'research' | 'fitness' | 'training' | 'parent' | 'meals' | 'shoppingList' | 'profileSetup' | 'calendar' | 'planMeal' | 'cooking' | null>(null);
  const [hideHubButtonForSubView, setHideHubButtonForSubView] = useState(false);

  // Reset dashboard state when user plan changes (dev mode switcher)
  React.useEffect(() => {
    setSelectedDashboard(null);
    setShowHamburgerMenu(false);
    setHideHubButtonForSubView(false);
  }, [user?.plan]);

  // Reset sub-view state when dashboard selection changes
  React.useEffect(() => {
    setHideHubButtonForSubView(false);
  }, [selectedDashboard]);

  // Handle route parameters to auto-open research dashboard
  React.useEffect(() => {
    const params = route.params as any;
    if (params?.openResearchDashboard) {
      setSelectedDashboard('research');
    }
  }, [route.params]);

  // Handle Health tab clicks from parent HealthHub
  React.useEffect(() => {
    if (showMenuFromHealthTab) {
      setShowHamburgerMenu(true);
    }
  }, [showMenuFromHealthTab]);

  const openQuickStartGuide = () => {
    setShowQuickStartGuide(true);
  };

  const handleGuideNavigate = (tab: 'Home' | 'Scan' | 'Chat' | 'Health' | 'Profile') => {
    // On web, check if we're in TabNavigator or need to navigate to Main first
    if (Platform.OS === 'web') {
      const isInTabNavigator = ['Home', 'Scan', 'Chat', 'Health', 'Profile'].includes(route.name);
      
      if (isInTabNavigator) {
        // Already in TabNavigator, navigate directly
        navigation.navigate(tab as any);
      } else {
        // In stack screen, navigate to Main then to tab
        navigation.navigate('Main', { screen: tab });
      }
    } else {
      // Native (iOS/Android) - direct navigation works
      navigation.navigate(tab as any);
    }
  };

  const endSession = () => {
    setHasActiveSession(false);
    console.log('Session ended - Dashboard access disabled');
  };

  const handleAnalyze = (userMessage: string, assistantMessage: string) => {
    navigation.navigate('FullChat', {
      context: { type: 'analysis', source: 'dashboard-page' },
      initialMessage: userMessage || assistantMessage
    });
    console.log('Analyze triggered:', { userMessage, assistantMessage });
  };

  const handleNavigateToDashboard = (dashboardType: 'overview' | 'progress' | 'nutrition' | 'research' | 'fitness' | 'parent' | 'findCoach' | 'coach' | 'meals' | 'clients' | 'onboard' | 'shoppingList' | null) => {
    // Handle special navigation cases
    if (dashboardType === 'findCoach') {
      // Render inline like Research
      setSelectedDashboard('findCoach' as any);
      return;
    }
    if (dashboardType === 'coach') {
      navigation.navigate('CoachDashboardPage');
      return;
    }
    if (dashboardType === 'clients') {
      navigation.navigate('ClientManagement');
      return;
    }
    if (dashboardType === 'onboard') {
      navigation.navigate('ClientOnboarding');
      return;
    }
    if (dashboardType === 'shoppingList') {
      // Render inline like Research
      setSelectedDashboard('shoppingList');
      return;
    }
    
    // Handle dashboard switches within DashboardPage
    setSelectedDashboard(dashboardType as 'overview' | 'progress' | 'nutrition' | 'research' | 'fitness' | 'parent' | 'meals' | 'shoppingList' | 'profileSetup' | null);
  };

  const renderSelectedDashboard = () => {
    if (!selectedDashboard) {
      return renderHealthMainContent();
    }

    const isWeb = Platform.OS === 'web';
    const isMobileWeb = isWeb && layout.screenWidth < 768;

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {!hideHubButtonForSubView && (
          <BackToHubButton
            hubName="Health Hub"
            color="#16a34a"
            onPress={() => setSelectedDashboard(null)}
            isMobileWeb={isMobileWeb}
            spinnerGif={spinnerGif}
          />
        )}
        {selectedDashboard === 'overview' && <OverviewDashboard onAnalyze={handleAnalyze} />}
        {selectedDashboard === 'progress' && <MyProgressDashboard />}
        {selectedDashboard === 'nutrition' && <ConsumptionDashboard onAnalyze={handleAnalyze} />}
        {selectedDashboard === 'research' && (
          <ResearchScreen 
            isDashboardMode={true} 
            onResultsViewChange={(isInResults) => setHideHubButtonForSubView(isInResults)}
          />
        )}
        {selectedDashboard === 'fitness' && <FitnessDashboard />}
        {selectedDashboard === 'training' && <TrainingDashboard isDashboardMode={true} onBack={() => setSelectedDashboard(null)} />}
        {selectedDashboard === 'parent' && <ParentDashboard />}
        {selectedDashboard === 'meals' && <CreateMeals isDashboardMode={true} />}
        {selectedDashboard === 'shoppingList' && <ShoppingListScreen isDashboardMode={true} onBack={() => setSelectedDashboard(null)} />}
        {selectedDashboard === 'calendar' && <MealCalendar isDashboardMode={true} />}
        {selectedDashboard === 'planMeal' && <PlanMealScreen isDashboardMode={true} onBack={() => setSelectedDashboard(null)} />}
        {selectedDashboard === 'cooking' && <CookingDashboard isDashboardMode={true} onBack={() => setSelectedDashboard(null)} />}
        {(selectedDashboard as any) === 'findCoach' && <CoachSelection />}
        {selectedDashboard === 'profileSetup' && <ProfileSetupScreen isDashboardMode={true} onBack={() => setSelectedDashboard(null)} />}
      </View>
    );
  };

  const renderHealthMainContent = () => {
    // Calculate responsive card width - properly responsive for mobile web
    const isWeb = Platform.OS === 'web';
    const isMobileWeb = isWeb && layout.screenWidth < 768;
    
    // For mobile web: use percentage-based width like native mobile
    // For desktop web: use fixed smaller cards
    // For native: use existing tablet/mobile logic
    const cardWidth = isWeb
      ? isMobileWeb 
        ? '47%'  // Mobile web: 2-column grid like native mobile
        : 160    // Desktop web: Fixed smaller size
      : layout.isTablet 
        ? (layout.maxContentWidth - layout.horizontalPadding * 2 - layout.cardSpacing * 2) / 3 - 4
        : '47%';
    
    // Responsive sizing based on device
    const iconContainerSize = isWeb && !isMobileWeb ? 40 : 56;
    const iconSize = isWeb && !isMobileWeb ? 24 : layout.rfs(32);
    const titleSize = isWeb && !isMobileWeb ? 14 : layout.rfs(16);
    const subtitleSize = isWeb && !isMobileWeb ? 11 : layout.rfs(12);
    
    // Check if user has premium access (not free plan)
    const isFreeUser = !user || user.plan === 'free';
    
    // Helper to check access and navigate to subscription if needed
    const handlePremiumTilePress = (dashboard: typeof selectedDashboard, requiredCapability: 'premium' | 'meals' | 'family' | 'coach') => {
      // Check access based on capability
      let hasAccess = false;
      switch (requiredCapability) {
        case 'premium':
          hasAccess = !isFreeUser;
          break;
        case 'meals':
          hasAccess = hasMealsAccess(user);
          break;
        case 'family':
          hasAccess = hasFamilyAccess(user);
          break;
        case 'coach':
          hasAccess = hasCoachAccess(user);
          break;
      }
      
      if (hasAccess) {
        setSelectedDashboard(dashboard);
      } else {
        // Navigate to subscription to upgrade
        navigation.navigate('Subscription');
      }
    };
    
    // Lock badge component for premium features
    const LockBadge = () => (
      <View style={styles.lockBadge}>
        <SvgIcon name="lock-closed" size={10} color="#ffffff" />
      </View>
    );
    
    return (
    <View style={[styles.healthMainContent, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#16a34a" />
      {/* Status bar area - Always green */}
      <View style={{ height: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top, backgroundColor: '#16a34a' }} />
      
      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight, backgroundColor: '#16a34a' }]}>
        <Animated.View 
          style={[
            styles.headerContent,
            { 
              opacity: headerOpacity,
              transform: [{ scale: titleScale }]
            }
          ]}
        >
          <Text style={styles.collapsibleHeaderTitle}>Health Dashboard</Text>
          <Text style={styles.collapsibleHeaderSubtitle}>
            {isFreeUser ? "Basic health overview" : "Your comprehensive health overview"}
          </Text>
          <View style={styles.progressBadge}>
            <SvgIcon name="fitness" size={14} color="#16a34a" />
            <Text style={styles.progressBadgeText}>Active Today</Text>
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
      >
      {/* Dashboard Grid - Centered with max-width on tablets */}
      <View style={[
        styles.dashboardGrid,
        {
          maxWidth: layout.maxContentWidth,
          alignSelf: 'center',
          width: '100%',
          paddingHorizontal: layout.horizontalPadding,
        }
      ]}>
        {/* === FREE USER VIEW: Only show essential tiles + Hub upgrade paths === */}
        {isFreeUser ? (
          <>
            {/* Overview Dashboard - Available to ALL users */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.overviewCard, { width: cardWidth as any }]}
              onPress={() => setSelectedDashboard('overview')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="analytics" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Overview</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Health metrics</Text>
            </TouchableOpacity>

            {/* Notifications - Available to ALL users */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.notificationsCard, { width: cardWidth as any }]}
              onPress={() => navigation.navigate('Notifications' as never)}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="notifications" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Notifications</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Messages & alerts</Text>
            </TouchableOpacity>

            {/* Nutrition Dashboard - Available to ALL users (scan history, food analysis) */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.nutritionCard, { width: cardWidth as any }]}
              onPress={() => setSelectedDashboard('nutrition')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="nutrition" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Nutrition</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Scan history</Text>
            </TouchableOpacity>

            {/* Profile Setup - Available to ALL users */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.profileSetupCard, { width: cardWidth as any }]}
              onPress={() => setSelectedDashboard('profileSetup')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="person-add" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Profile Setup</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Health profile</Text>
            </TouchableOpacity>

            {/* Find a Coach - Available to all */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.coachCard, { width: cardWidth as any }]}
              onPress={() => handleNavigateToDashboard('findCoach')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="people" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Find Coach</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Expert guidance</Text>
            </TouchableOpacity>

            {/* Switch to Family Hub - Upgrade path for free users */}
            {onContextChange && (
              <TouchableOpacity
                style={[styles.dashboardCard, styles.switchFamilyCard, { width: cardWidth as any }]}
                onPress={() => navigation.navigate('Subscription', { highlight: 'family' })}
              >
                <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                  <SvgIcon name="people-circle" size={iconSize} color="#ffffff" />
                </View>
                <LockBadge />
                <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Family Hub</Text>
                <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Manage family</Text>
              </TouchableOpacity>
            )}

            {/* Switch to Coach Hub - Upgrade path for free users */}
            {onContextChange && (
              <TouchableOpacity
                style={[styles.dashboardCard, styles.switchCoachCard, { width: cardWidth as any }]}
                onPress={() => navigation.navigate('Subscription', { highlight: 'coach' })}
              >
                <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                  <SvgIcon name="briefcase" size={iconSize} color="#ffffff" />
                </View>
                <LockBadge />
                <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Coach Hub</Text>
                <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Become a coach</Text>
              </TouchableOpacity>
            )}

            {/* Quick Start Guide */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.actionCard, { width: cardWidth as any }]}
              onPress={openQuickStartGuide}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="compass" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Quick Start</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>App guide</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* === PAID USER VIEW: Show all tiles === */}
            {/* Overview Dashboard - Available to ALL users */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.overviewCard, { width: cardWidth as any }]}
              onPress={() => setSelectedDashboard('overview')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="analytics" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Overview</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Health metrics</Text>
            </TouchableOpacity>

            {/* Notifications - Available to ALL users */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.notificationsCard, { width: cardWidth as any }]}
              onPress={() => navigation.navigate('Notifications' as never)}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="notifications" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Notifications</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Messages & alerts</Text>
            </TouchableOpacity>

            {/* Nutrition Dashboard - Available to ALL users (scan history, food analysis) */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.nutritionCard, { width: cardWidth as any }]}
              onPress={() => setSelectedDashboard('nutrition')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="nutrition" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Nutrition</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Scan history</Text>
            </TouchableOpacity>

            {/* Profile Setup - Available to ALL users to set up their health profile */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.profileSetupCard, { width: cardWidth as any }]}
              onPress={() => setSelectedDashboard('profileSetup')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="person-add" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Profile Setup</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Health profile</Text>
            </TouchableOpacity>

            {/* Progress Dashboard - Premium users */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.progressCard, { width: cardWidth as any }]}
              onPress={() => setSelectedDashboard('progress')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="trending-up" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Progress</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Track goals</Text>
            </TouchableOpacity>

            {/* AI Meal Plans Card - Available to meal plan subscribers */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.mealsCard, { width: cardWidth as any }]}
              onPress={() => hasMealsAccess(user) ? handleNavigateToDashboard('meals') : navigation.navigate('Subscription')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="sparkles" size={iconSize} color="#ffffff" />
              </View>
              {!hasMealsAccess(user) && <LockBadge />}
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>AI Meal Plans</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Auto-generate</Text>
            </TouchableOpacity>

            {/* Meal Calendar Card - Available to meal plan subscribers */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.calendarCard, { width: cardWidth as any }]}
              onPress={() => hasMealsAccess(user) ? setSelectedDashboard('calendar') : navigation.navigate('Subscription')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="calendar" size={iconSize} color="#ffffff" />
              </View>
              {!hasMealsAccess(user) && <LockBadge />}
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Meal Calendar</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>View schedule</Text>
            </TouchableOpacity>

            {/* Plan Meal Card - Available to meal plan subscribers */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.planMealCard, { width: cardWidth as any }]}
              onPress={() => hasMealsAccess(user) ? setSelectedDashboard('planMeal') : navigation.navigate('Subscription')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="create" size={iconSize} color="#ffffff" />
              </View>
              {!hasMealsAccess(user) && <LockBadge />}
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Plan Meal</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Create meals</Text>
            </TouchableOpacity>

            {/* Shopping List Card - Available to meal plan subscribers */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.shoppingListCard, { width: cardWidth as any }]}
              onPress={() => hasMealsAccess(user) ? handleNavigateToDashboard('shoppingList') : navigation.navigate('Subscription')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="cart" size={iconSize} color="#ffffff" />
              </View>
              {!hasMealsAccess(user) && <LockBadge />}
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Shopping List</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Grocery items</Text>
            </TouchableOpacity>

            {/* Cooking Dashboard Card - Available to meal plan subscribers */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.cookingCard, { width: cardWidth as any }]}
              onPress={() => hasMealsAccess(user) ? setSelectedDashboard('cooking') : navigation.navigate('Subscription')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="flame" size={iconSize} color="#ffffff" />
              </View>
              {!hasMealsAccess(user) && <LockBadge />}
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Cooking</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Instructions</Text>
            </TouchableOpacity>

            {/* Research Card - Premium users */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.researchCard, { width: cardWidth as any }]}
              onPress={() => setSelectedDashboard('research')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="library" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Research</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Health insights</Text>
            </TouchableOpacity>

            {/* Fitness Dashboard - Premium users */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.fitnessCard, { width: cardWidth as any }]}
              onPress={() => setSelectedDashboard('fitness')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="fitness" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Fitness</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Workout plans</Text>
            </TouchableOpacity>

            {/* Training Programs - Premium users */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.trainingCard, { width: cardWidth as any }]}
              onPress={() => setSelectedDashboard('training')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="trophy" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Training</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Sports programs</Text>
            </TouchableOpacity>

            {/* Find a Coach - Available to all */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.coachCard, { width: cardWidth as any }]}
              onPress={() => handleNavigateToDashboard('findCoach')}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="people" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Find Coach</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Expert guidance</Text>
            </TouchableOpacity>

            {/* Family Dashboard - Only visible when user has Family Hub access */}
            {hasFamilyAccess(user) && (
              <TouchableOpacity
                style={[styles.dashboardCard, styles.parentCard, { width: cardWidth as any }]}
                onPress={() => setSelectedDashboard('parent')}
              >
                <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                  <SvgIcon name="heart" size={iconSize} color="#ffffff" />
                </View>
                <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Family</Text>
                <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>Manage family</Text>
              </TouchableOpacity>
            )}

            {/* Switch to Family Hub - Show with lock if no access */}
            {onContextChange && (
              <TouchableOpacity
                style={[styles.dashboardCard, styles.switchFamilyCard, { width: cardWidth as any }]}
                onPress={() => hasFamilyAccess(user) ? onContextChange('family') : navigation.navigate('Subscription', { highlight: 'family' })}
              >
                <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                  <SvgIcon name="people-circle" size={iconSize} color="#ffffff" />
                </View>
                {!hasFamilyAccess(user) && <LockBadge />}
                <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Family Hub</Text>
                <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>{hasFamilyAccess(user) ? 'Switch view' : 'Manage family'}</Text>
              </TouchableOpacity>
            )}

            {/* Switch to Coach Hub - Show with lock if no access */}
            {onContextChange && (
              <TouchableOpacity
                style={[styles.dashboardCard, styles.switchCoachCard, { width: cardWidth as any }]}
                onPress={() => hasCoachAccess(user) ? onContextChange('coach') : navigation.navigate('Subscription', { highlight: 'coach' })}
              >
                <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                  <SvgIcon name="briefcase" size={iconSize} color="#ffffff" />
                </View>
                {!hasCoachAccess(user) && <LockBadge />}
                <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Coach Hub</Text>
                <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>{hasCoachAccess(user) ? 'Switch view' : 'Become a coach'}</Text>
              </TouchableOpacity>
            )}

            {/* Quick Start Guide */}
            <TouchableOpacity
              style={[styles.dashboardCard, styles.actionCard, { width: cardWidth as any }]}
              onPress={openQuickStartGuide}
            >
              <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                <SvgIcon name="compass" size={iconSize} color="#ffffff" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>Quick Start</Text>
              <Text style={[styles.cardSubtitle, { fontSize: subtitleSize }]}>App guide</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Session Status */}
      {hasActiveSession && (
        <View style={[styles.sessionBanner, { maxWidth: layout.maxContentWidth, alignSelf: 'center', backgroundColor: theme.mode === 'dark' ? '#064e3b' : '#ecfdf5' }]}>
          <SvgIcon name="checkmark-circle" size={20} color="#059669" />
          <Text style={[styles.sessionText, { color: theme.mode === 'dark' ? '#34d399' : '#059669' }]}>Active session - Full access enabled</Text>
          <TouchableOpacity onPress={endSession}>
            <Text style={[styles.endSessionText, { color: theme.mode === 'dark' ? '#f87171' : '#dc2626' }]}>End</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Bottom spacing for tab bar */}
      <View style={{ height: 100 }} />
    </Animated.ScrollView>
    </View>
  );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {showHamburgerMenu && (
        <HamburgerMenu
          visible={showHamburgerMenu}
          onClose={() => {
            setShowHamburgerMenu(false);
            onMenuClose?.();
          }}
          onNavigateToDashboard={handleNavigateToDashboard}
          context="personal"
        />
      )}

      <QuickStartGuide
        visible={showQuickStartGuide}
        onClose={() => setShowQuickStartGuide(false)}
        onNavigate={handleGuideNavigate}
      />

      {renderSelectedDashboard()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 32,
  },

  tabContainer: {
    paddingVertical: dashboardTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.colors.border,
    ...dashboardTheme.shadows.sm,
    borderWidth: 2,
  },

  tabScrollContent: {
    paddingHorizontal: dashboardTheme.spacing.md,
    alignItems: 'center',
  },

  tabButton: {
    alignItems: 'center',
    paddingHorizontal: dashboardTheme.spacing.md,
    paddingVertical: dashboardTheme.spacing.sm,
    marginHorizontal: dashboardTheme.spacing.xs,
    borderRadius: dashboardTheme.borderRadius.lg,
    minWidth: 80,
  },

  tabButtonActive: {
    backgroundColor: dashboardTheme.colors.background,
    ...dashboardTheme.shadows.sm,
  },

  tabIcon: {
    width: 36,
    height: 36,
    borderRadius: dashboardTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: dashboardTheme.spacing.xs,
  },

  tabText: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },

  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dashboardTheme.spacing.sm,
    borderWidth: 2,
  },

  pageIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    backgroundColor: dashboardTheme.colors.border,
  },

  pageIndicatorDotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
  },

  dashboardScroll: {
    flex: 1,
  },

  dashboardPage: {
    width: '100%',
    flex: 1,
  },

  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.colors.background,
    paddingHorizontal: dashboardTheme.spacing.xl,
  },

  comingSoonTitle: {
    ...dashboardTheme.typography.title,
    color: dashboardTheme.colors.textSecondary,
    marginTop: dashboardTheme.spacing.lg,
    marginBottom: dashboardTheme.spacing.sm,
  },

  comingSoonText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
    textAlign: 'center',
  },

  // New dashboard grid styles
  healthMainContent: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },

  floatingHeader: {
    alignItems: 'center',
    paddingTop: dashboardTheme.header.paddingTop,
    paddingBottom: 32,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },

  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },

  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },



  floatingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a', // Note: Override with theme.colors.text inline where used
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },

  floatingSubtitle: {
    fontSize: 16,
    color: '#64748b', // Note: Override with theme.colors.textSecondary inline where used
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginBottom: 20,
  },

  floatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },

  floatingBadgeText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },

  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: dashboardTheme.spacing.md,
    padding: dashboardTheme.spacing.md,
  },

  dashboardCard: {
    // Width is now set dynamically in renderHealthMainContent
    minWidth: 140,
    aspectRatio: 1,
    borderRadius: dashboardTheme.borderRadius.lg,
    padding: dashboardTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...dashboardTheme.shadows.md,
  },

  homeCard: {
    backgroundColor: '#4f46e5',
  },

  overviewCard: {
    backgroundColor: '#059669',
  },

  notificationsCard: {
    backgroundColor: '#8b5cf6', // Purple for notifications
  },

  progressCard: {
    backgroundColor: '#dc2626',
  },

  nutritionCard: {
    backgroundColor: '#ea580c',
  },

  researchCard: {
    backgroundColor: '#8b5cf6',
  },

  fitnessCard: {
    backgroundColor: '#f59e0b',
  },

  actionCard: {
    backgroundColor: '#7c3aed',
  },

  chatCard: {
    backgroundColor: '#0891b2',
  },

  coachCard: {
    backgroundColor: '#3b82f6',
  },

  upgradeCard: {
    backgroundColor: '#f59e0b', // Amber/gold for premium upgrade
  },

  parentCard: {
    backgroundColor: '#ec4899',
  },

  switchFamilyCard: {
    backgroundColor: '#0ea5e9', // Sky blue for family hub
  },

  switchCoachCard: {
    backgroundColor: '#8b5cf6', // Purple for coach hub
  },

  coachSelectionCard: {
    backgroundColor: '#14b8a6',
  },

  mealsCard: {
    backgroundColor: '#f97316',
  },

  calendarCard: {
    backgroundColor: '#f59e0b', // Amber/Orange for calendar
  },

  planMealCard: {
    backgroundColor: '#3b82f6', // Blue for Plan Meal (manual meal planning)
  },

  shoppingListCard: {
    backgroundColor: '#4cbb17',
  },

  cookingCard: {
    backgroundColor: '#ef4444', // Red for cooking/instructions
  },

  clientCard: {
    backgroundColor: '#6366f1',
  },

  onboardingCard: {
    backgroundColor: '#84cc16',
  },

  profileSetupCard: {
    backgroundColor: '#14b8a6', // Teal - for profile/wellness setup
  },

  trainingCard: {
    backgroundColor: '#10b981', // Green for training/sports programs
  },

  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: dashboardTheme.spacing.md,
    flexShrink: 0,
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

  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: dashboardTheme.spacing.sm,
    borderRadius: dashboardTheme.borderRadius.md,
    marginTop: dashboardTheme.spacing.lg,
    gap: dashboardTheme.spacing.xs,
  },

  sessionText: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },

  endSessionText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },

  // Dashboard navigation styles
  dashboardContainer: {
    flex: 1,
  },

  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: dashboardTheme.spacing.md,
    paddingVertical: dashboardTheme.spacing.md,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e0e8ff',
  },

  dashboardTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },

  dashboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: dashboardTheme.colors.text, // Note: Override with theme.colors.text inline where used
  },

  menuButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },

  dashboardContent: {
    flex: 1,
  },

  researchDashboardWrapper: {
    flex: 1,
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
  },

  fitnessDashboardWrapper: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },

  // Collapsible Header Styles
  collapsibleHeader: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },

  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
  },

  collapsibleHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },

  collapsibleHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },

  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },

  progressBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
});

export default DashboardPage;
