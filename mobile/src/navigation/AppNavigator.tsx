import React, { useContext, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, useNavigation, LinkingOptions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '../components/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabParamList, RootStackParamList } from '../types/navigation';
import { getResponsiveIconSize, getResponsiveButtonSize } from '../utils/responsive';
import { sizes } from '../theme/design-tokens';
import SvgIcon from '../components/shared/SvgIcon';

// Auth Components
import MultiAuthLogin from '../components/auth/MultiAuthLogin';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PlansModal from '../components/PlansModal';

// Import screens
import CameraScreen from '../screens/CameraScreen';
import HealthHub from '../screens/HealthHub';
import ProgressScreen from '../screens/ProgressScreen';
import NutritionScreen from '../screens/NutritionScreen';
import FullChat from '../screens/FullChat';
import WihyHomeScreen from '../screens/WihyHomeScreen';
import ResearchScreen from '../screens/ResearchScreen';
import Profile from '../screens/Profile';
import NutritionFacts from '../screens/NutritionFacts';
import BeautyFacts from '../screens/BeautyFacts';
import PetFoodFacts from '../screens/PetFoodFacts';
import FoodPhotoFacts from '../screens/FoodPhotoFacts';
import PillIdentification from '../screens/PillIdentification';
import LabelReader from '../screens/LabelReader';
import PermissionsScreen from '../screens/PermissionsScreen';
import ScanHistoryScreen from '../screens/ScanHistoryScreen';
import CoachDashboardPage from '../screens/CoachDashboardPage';
import FamilyDashboardPage from '../screens/FamilyDashboardPage';
import ParentDashboard from '../screens/ParentDashboard';
import ClientManagement from '../screens/ClientManagement';
import ClientOnboarding from '../screens/ClientOnboarding';
import CoachSelection from '../screens/CoachSelection';
import CreateMeals from '../screens/CreateMeals';
import MealCalendar from '../screens/MealCalendar';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import MealDetailsScreen from '../screens/MealDetailsScreen';
import MealPreferencesScreen from '../screens/MealPreferencesScreen';
import IntegrationTestScreen from '../screens/IntegrationTestScreen';
import ClientProgressScreen from '../screens/ClientProgressScreen';
import FitnessProgramDetails from '../screens/FitnessProgramDetails';
import MealPlanDetails from '../screens/MealPlanDetails';

// Coaching Workflow Screens
import CoachProfileSetup from '../screens/CoachProfileSetup';
import CoachDetailPage from '../screens/CoachDetailPage';
import RequestCoaching from '../screens/RequestCoaching';
import AcceptInvitation from '../screens/AcceptInvitation';
import SessionBooking from '../screens/SessionBooking';

import EnrollmentScreen from '../screens/EnrollmentScreen';
import OnboardingFlow from '../screens/OnboardingFlow';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { B2BPricingScreen } from '../screens/B2BPricingScreen';
import { PostPaymentRegistrationScreen } from '../screens/PostPaymentRegistrationScreen';
import AboutScreen from '../screens/AboutScreen';
import TermsScreen from '../screens/TermsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import HealthDataScreen from '../screens/HealthDataScreen';

import AuthCallbackScreen from '../screens/AuthCallbackScreen';
import SubscribeCompleteScreen from '../screens/SubscribeCompleteScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import ChatHistoryScreen from '../screens/ChatHistoryScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Web URL linking configuration - maps URL paths to screens
// This ensures backward compatibility with wihy.ai/about, wihy.ai/privacy, etc.
// Use try-catch because createURL throws in standalone builds without proper scheme registration
let prefix = 'wihy://';
try {
  prefix = Linking.createURL('/');
} catch (e) {
  // In standalone builds, fall back to the scheme defined in app.json
  console.log('Using fallback scheme for deep linking:', prefix);
}

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    prefix,
    'wihy://', // Native deep link scheme from app.json
    'https://wihy.ai',
    'https://www.wihy.ai',
    'http://localhost:19006', // Expo web dev
    'http://localhost:3000',  // Local dev
  ],
  config: {
    screens: {
      Main: {
        path: '',
        screens: {
          Home: '',
          Scan: 'scan',
          Chat: 'chat',
          Health: 'health',
          Profile: 'profile',
          CoachSelection: 'coach-selection',
        },
      },
      // Legacy web routes - maintain backward compatibility
      About: 'about',
      Terms: 'terms',
      Privacy: 'privacy',
      Subscription: 'subscription',
      B2BPricing: 'pricing',
      FullChat: 'fullchat',
      NutritionFacts: 'nutritionfacts',
      BeautyFacts: 'beautyfacts',
      PetFoodFacts: 'petfoodfacts',
      Camera: 'camera',
      ResearchDashboard: 'research',
      Permissions: 'permissions',
      ScanHistory: 'scan-history',
      CoachDashboardPage: 'coach-dashboard',
      FamilyDashboardPage: 'family-dashboard',
      ParentDashboard: 'parent-dashboard',
      ClientManagement: 'client-management',
      ClientOnboarding: 'client-onboarding',
      
      // Coaching Workflow Routes
      CoachProfileSetup: 'coach/setup',
      CoachDetailPage: 'coach/:coachId',
      RequestCoaching: 'coach/:coachId/request',
      AcceptInvitation: 'invitation/:invitationId',
      SessionBooking: 'coach/:coachId/book',
      
      ShoppingList: 'shopping-list',
      MealDetails: 'meal-details',
      MealPreferences: 'meal-preferences',
      IntegrationTest: 'integration-test',
      ClientProgress: 'client-progress',
      FitnessProgramDetails: 'fitness-program',
      MealPlanDetails: 'meal-plan',
      Enrollment: 'enrollment',
      CreateMeals: 'create-meals',
      MealCalendar: 'meal-calendar',
      PostPaymentRegistration: 'register',
      OnboardingFlow: 'onboarding',
      // OAuth callback route for web
      AuthCallback: 'auth/callback',
      // Subscribe complete route for OAuth-first flow
      SubscribeComplete: 'subscribe/complete',
      // Payment success route for Stripe redirect
      PaymentSuccess: 'payment/success',
      // Signup with payment (Payment-first flow - account creation after payment)
      SignupWithPayment: 'signup-with-payment',
      // Complete account (Comprehensive account setup with auth + profile)
      CompleteAccount: 'complete-account',
    },
  },
};

// Re-export types for convenience
export type { TabParamList, RootStackParamList } from '../types/navigation';
export type FullChatNavigationProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList, 'FullChat'>,
  BottomTabNavigationProp<TabParamList>
>;

// Profile screen component that handles login state
function ProfileScreenComponent() {
  const { user } = useContext(AuthContext);
  const [showLogin, setShowLogin] = useState(false);
  const navigation = useNavigation<any>();

  React.useEffect(() => {
    // On web, redirect to Home when not authenticated
    if (Platform.OS === 'web' && !user) {
      navigation.navigate('Home');
      return;
    }
    // Only show login if user is not authenticated and modal is not already visible
    if (!user) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  }, [user, navigation]);

  if (user) {
    return <Profile />;
  }

  // On web, show nothing while redirecting
  if (Platform.OS === 'web') {
    return null;
  }

  // Native: show login gate when not authenticated
  return (
    <View style={styles.loginGateContainer}>
      <Text style={styles.loginGateTitle}>Sign in to view your profile</Text>
      <Text style={styles.loginGateSubtitle}>Access streaks, health score, and preferences.</Text>
      <TouchableOpacity style={styles.loginGateButton} onPress={() => setShowLogin(true)}>
        <Text style={styles.loginGateButtonText}>Sign In / Sign Up</Text>
      </TouchableOpacity>
      <MultiAuthLogin
        visible={showLogin}
        onClose={() => {
          // Keep the profile tab usable after cancel; user can reopen via the CTA button
          setShowLogin(false);
        }}
        onSignIn={() => {
          setShowLogin(false);
        }}
      />
    </View>
  );
}

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { user, initializing } = useContext(AuthContext);
  const { theme, isDark } = useTheme();
  const [showPlansModal, setShowPlansModal] = React.useState(false);

  return (
    <>
    <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          let iconColor: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            iconColor = focused ? '#1f2937' : '#374151';
          } else if (route.name === 'Scan') {
            iconName = focused ? 'scan' : 'scan-outline';
            iconColor = focused ? '#1f2937' : '#374151';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
            iconColor = focused ? '#4cbb17' : '#22c55e';
          } else if (route.name === 'Health') {
            iconName = focused ? 'fitness' : 'fitness-outline';
            iconColor = focused ? '#fa5f06' : '#f97316';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
            iconColor = focused ? '#3b82f6' : '#6b7280';
          } else {
            iconName = 'help-outline';
            iconColor = '#6b7280'; // Gray
          }

          // Return icon with rounded square background
          const containerSize = getResponsiveButtonSize(48, 48);
          const iconSize = getResponsiveIconSize(sizes.icons.lg);

          return (
            <View style={{
              width: containerSize.width,
              height: containerSize.height,
              borderRadius: 14,
              backgroundColor: focused ? '#dbeafe' : '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: focused ? 0.15 : 0.08,
              shadowRadius: 6,
              elevation: focused ? 4 : 2,
              borderWidth: focused ? 1 : 0.5,
              borderColor: focused ? '#3b82f6' : '#e2e8f0',
            }}>
              <SvgIcon
                name={iconName}
                size={iconSize}
                color={iconColor}
              />
            </View>
          );
        },
        tabBarActiveTintColor: isDark ? '#ffffff' : '#1e40af',
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#64748b',
        tabBarStyle: Platform.OS === 'web' ? { display: 'none' } : {
          height: 100 + insets.bottom,
          paddingBottom: Math.max(insets.bottom + 8, 20),
          paddingTop: 12,
          backgroundColor: isDark ? '#000000' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f97316',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 6,
          textAlign: 'center',
          letterSpacing: 0.2,
        },
        tabBarLabelPosition: 'below-icon',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={WihyHomeScreen}
      />
      <Tab.Screen
        name="Scan"
        component={CameraScreen}
      />
      <Tab.Screen
        name="Chat"
        component={FullChat}
      />
      <Tab.Screen
        name="Health"
        component={HealthHub}
        listeners={() => ({
          tabPress: (e) => {
            // On native platforms (iOS/Android), if user is not logged in,
            // show the PlansModal (Upgrade to Access Features) instead of Health Dashboard
            // Skip check while auth is still initializing to avoid false positives
            if (Platform.OS !== 'web' && !user && !initializing) {
              e.preventDefault();
              console.log('[Health Tab] Showing Plans Modal for unauthenticated user');
              setShowPlansModal(true);
              return;
            }
            console.log('[Health Tab] Allowing navigation - user:', !!user);
            // Otherwise, allow normal navigation to Health tab
          },
        })}
        // Free users CAN access Health tab - they get limited dashboards (Overview, Consumption)
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreenComponent}
      />
      <Tab.Screen
        name="CoachSelection"
        component={CoachSelection}
        options={{
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
    </Tab.Navigator>

    {/* Plans Modal for Free Users */}
    <PlansModal
      visible={showPlansModal}
      onClose={() => {
        console.log('[Plans Modal] Closing modal');
        setShowPlansModal(false);
      }}
      title="Sign In to Access Health Features"
      subtitle="Track your complete health journey with Premium"
      onSelectPlan={(planId) => {
        console.log('[Plans Modal] Selected plan:', planId);
        // TODO: Integrate with actual subscription flow
        // For now, just show an alert
        alert(`Plan selected: ${planId}\n\nSubscription integration coming soon!`);
      }}
    />
    </>
  );
}

export default function AppNavigator() {
  const { user } = useContext(AuthContext);

  // Show onboarding flow for first-time users who haven't completed it
  // Only on native (iOS/Android) - web users go directly to main app
  if (Platform.OS !== 'web' && user && user.isFirstTimeUser && !user.onboardingCompleted) {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            presentation: 'modal',
          }}
        >
          <Stack.Screen
            name="OnboardingFlow"
            component={OnboardingFlow}
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
          {/* Allow navigation during onboarding */}
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: 'modal',
        }}
      >
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="FullChat"
          component={FullChat}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ChatHistory"
          component={ChatHistoryScreen}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="NutritionFacts"
          component={NutritionFacts}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="BeautyFacts"
          component={BeautyFacts}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PetFoodFacts"
          component={PetFoodFacts}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="FoodPhotoFacts"
          component={FoodPhotoFacts}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PillIdentification"
          component={PillIdentification}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="LabelReader"
          component={LabelReader}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ResearchDashboard"
          component={ResearchScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Permissions"
          component={PermissionsScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ScanHistory"
          component={ScanHistoryScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CoachDashboardPage"
          component={CoachDashboardPage}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="FamilyDashboardPage"
          component={FamilyDashboardPage}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ParentDashboard"
          component={ParentDashboard}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ClientManagement"
          component={ClientManagement}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ClientOnboarding"
          component={ClientOnboarding}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CoachSelection"
          component={CoachSelection}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ShoppingList"
          component={ShoppingListScreen}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MealDetails"
          component={MealDetailsScreen}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MealPreferences"
          component={MealPreferencesScreen}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />

        <Stack.Screen

          name="IntegrationTest"
          component={IntegrationTestScreen}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ClientProgress"
          component={ClientProgressScreen}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        
        {/* Coaching Workflow Screens */}
        <Stack.Screen
          name="CoachProfileSetup"
          component={CoachProfileSetup}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CoachDetailPage"
          component={CoachDetailPage}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="RequestCoaching"
          component={RequestCoaching}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AcceptInvitation"
          component={AcceptInvitation}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SessionBooking"
          component={SessionBooking}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        
        <Stack.Screen
          name="FitnessProgramDetails"
          component={FitnessProgramDetails}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MealPlanDetails"
          component={MealPlanDetails}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Enrollment"
          component={EnrollmentScreen}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CreateMeals"
          component={CreateMeals}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MealCalendar"
          component={MealCalendar}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="B2BPricing"
          component={B2BPricingScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PostPaymentRegistration"
          component={PostPaymentRegistrationScreen}
          options={{
            headerShown: false,
            gestureEnabled: false, // Prevent back gesture during registration
          }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Terms"
          component={TermsScreen}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Privacy"
          component={PrivacyScreen}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ProfileSetup"
          component={ProfileSetupScreen}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="HealthData"
          component={HealthDataScreen}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AuthCallback"
          component={AuthCallbackScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="SubscribeComplete"
          component={SubscribeCompleteScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="PaymentSuccess"
          component={PaymentSuccessScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        {/* OnboardingFlow accessible for Edit Profile on mobile */}
        <Stack.Screen
          name="OnboardingFlow"
          component={OnboardingFlow}
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loginGateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  loginGateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginGateSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginGateButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  loginGateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
