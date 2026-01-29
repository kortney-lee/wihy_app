import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList, RootStackParamList } from '../types/navigation';
import { dashboardTheme } from '../theme/dashboardTheme';
import { HamburgerMenu } from '../components/shared/HamburgerMenu';
import { GradientDashboardHeader } from '../components/shared/GradientDashboardHeader';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import SvgIcon from '../components/shared/SvgIcon';
import { BackToHubButton } from '../components/shared/BackToHubButton';
import CoachDashboard from './CoachDashboard';

const spinnerGif = require('../../assets/whatishealthyspinner.gif');
import CoachOverview from './CoachOverview';
import CreateMeals from './CreateMeals';
import ClientManagement from './ClientManagement';
import ClientOnboarding from './ClientOnboarding';
import CoachProfileSetup from './CoachProfileSetup';
import BookingsManagement from './BookingsManagement';

const isWeb = Platform.OS === 'web';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  StackNavigationProp<RootStackParamList>
>;

type CoachViewType = 'overview' | 'dashboard' | 'meals' | 'clients' | 'onboard' | 'profileSetup' | 'bookings' | 'coachProfile';

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
  const { theme } = useTheme();
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [selectedView, setSelectedView] = useState<CoachViewType | null>(null); // Start with hub view
  const layout = useDashboardLayout();
  const isMobileWeb = isWeb && layout.screenWidth < 768;

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
    {
      id: 'bookings',
      title: 'Bookings',
      subtitle: 'Manage sessions & schedule',
      icon: 'calendar',
      color: '#6366f1',
      available: true,
    },
    {
      id: 'coachProfile',
      title: 'Coach Profile',
      subtitle: 'Your coach bio & settings',
      icon: 'briefcase',
      color: '#14b8a6',
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
        return <CoachOverview isDashboardMode={true} onBack={handleBackToDashboardSelection} />;
      case 'dashboard':
        return <CoachDashboard isDashboardMode={true} onBack={handleBackToDashboardSelection} />;
      case 'meals':
        return <CreateMeals isDashboardMode={true} onBack={handleBackToDashboardSelection} />;
      case 'clients':
        return <ClientManagement isDashboardMode={true} onBack={handleBackToDashboardSelection} />;
      case 'onboard':
        return <ClientOnboarding isDashboardMode={true} onBack={handleBackToDashboardSelection} />;
      case 'profileSetup':
        return (
          <CoachProfileSetup
            isDashboardMode={true}
            onBack={handleBackToDashboardSelection}
          />
        );
      case 'bookings':
        return (
          <BookingsManagement
            isDashboardMode={true}
            onBack={handleBackToDashboardSelection}
          />
        );
      case 'coachProfile':
        return (
          <CoachProfileSetup
            isDashboardMode={true}
            onBack={handleBackToDashboardSelection}
          />
        );
      default:
        return null;
    }
  };

  if (selectedView) {
    const isMobileWebLocal = isWeb && layout.screenWidth < 768;
    
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
    <SafeAreaView style={styles.healthMainContent} edges={['left', 'right']}>
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

      {/* Fixed Header - Outside ScrollView (matching Health Dashboard) */}
      <GradientDashboardHeader
        title="Coach Hub"
        subtitle="Manage clients and grow your business"
        gradient="coach"
        badge={{ icon: "briefcase", text: "Active Today" }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
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
          {coachOptions.map((option) => {
            // Calculate responsive card width - matching Health Dashboard exactly
            const cardWidth = isWeb
              ? isMobileWeb 
                ? '47%'  // Mobile web: 2-column grid like native mobile
                : 160    // Desktop web: Fixed smaller size
              : layout.isTablet 
                ? (layout.maxContentWidth - layout.horizontalPadding * 2 - layout.cardSpacing * 2) / 3 - 4
                : '47%';
            
            // Responsive sizing based on device - matching Health Dashboard
            const iconContainerSize = isWeb && !isMobileWeb ? 40 : 56;
            const iconSize = isWeb && !isMobileWeb ? 24 : layout.rfs(32);
            const titleSize = isWeb && !isMobileWeb ? 14 : layout.rfs(16);
            const subtitleSize = isWeb && !isMobileWeb ? 11 : layout.rfs(12);
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.dashboardCard,
                  { backgroundColor: option.color, width: cardWidth as any },
                  !option.available && styles.optionCardDisabled,
                ]}
                onPress={() => option.available && handleViewSelect(option.id)}
                disabled={!option.available}
              >
                <View style={[styles.cardIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                  <SvgIcon name={option.icon as any} size={iconSize} color="#ffffff" />
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
          {onContextChange && (() => {
            // Same responsive sizing as other cards
            const cardWidth = isWeb
              ? isMobileWeb 
                ? '47%'
                : 160
              : layout.isTablet 
                ? (layout.maxContentWidth - layout.horizontalPadding * 2 - layout.cardSpacing * 2) / 3 - 4
                : '47%';
            const iconContainerSize = isWeb && !isMobileWeb ? 40 : 56;
            const iconSize = isWeb && !isMobileWeb ? 24 : layout.rfs(32);
            const titleSize = isWeb && !isMobileWeb ? 14 : layout.rfs(16);
            const subtitleSize = isWeb && !isMobileWeb ? 11 : layout.rfs(12);
            
            return (
              <TouchableOpacity
                style={[
                  styles.dashboardCard, 
                  styles.switchPersonalCard,
                  { width: cardWidth as any },
                ]}
                onPress={() => onContextChange('personal')}
              >
                <View style={[styles.cardIconContainer, styles.switchIconContainer, { width: iconContainerSize, height: iconContainerSize, borderRadius: iconContainerSize / 2 }]}>
                  <SvgIcon name="person" size={iconSize} color="#10b981" />
                </View>
                <Text style={[styles.cardTitle, { color: '#10b981', fontSize: titleSize }]}>Personal</Text>
                <Text style={[styles.cardSubtitle, { color: '#6b7280', fontSize: subtitleSize }]}>Back to my health</Text>
              </TouchableOpacity>
            );
          })()}
        </View>
        
        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  healthMainContent: {
    flex: 1,
    backgroundColor: '#f0fdf4', // Light green background matching Health Hub
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: dashboardTheme.spacing.md,
    padding: dashboardTheme.spacing.md,
  },
  dashboardCard: {
    // Width is now set dynamically in the render
    minWidth: 140,
    aspectRatio: 1,
    borderRadius: dashboardTheme.borderRadius.lg,
    padding: dashboardTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...dashboardTheme.shadows.md,
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
  switchIconContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
  },
});

export default CoachDashboardPage;
