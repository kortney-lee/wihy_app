import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, TabParamList } from '../types/navigation';
import { colors, borderRadius } from '../theme/design-tokens';
import { checkoutService } from '../services/checkoutService';
import { purchaseService } from '../services/purchaseService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import EmailCheckoutModal from '../components/checkout/EmailCheckoutModal';
import MultiAuthLogin from '../components/auth/MultiAuthLogin';
import { WebNavHeader } from '../components/web/WebNavHeader';

// Import CSS for web only
if (Platform.OS === 'web') {
  require('../styles/web-landing.css');
  require('../styles/pricing.css');
}

const isWeb = Platform.OS === 'web';

// SVG icons for web (Ionicons don't render properly on web)
const WebIcon = ({ name, size = 24, color = '#3b82f6' }: { name: string; size?: number; color?: string }) => {
  const icons: Record<string, string> = {
    'gift': 'M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z',
    'person': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    'people': 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    'home': 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    'fitness': 'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z',
    'checkmark-circle': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    'business': 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z',
    'trending-up': 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z',
    'globe': 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z',
    'school': 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
    'restaurant': 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
    'medical-services': 'M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm6 11h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z',
  };
  
  const path = icons[name] || icons['person'];
  
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d={path} />
    </svg>
  );
};


// Consumer Plans - Matches backend plan keys
const CONSUMER_PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    tagline: 'Get started with essential features',
    features: [
      'Barcode scanning',
      'Photo food analysis',
      'Medication tracking',
      'Basic health dashboard',
    ],
    icon: 'gift',
  },
  {
    id: 'pro_monthly',
    name: 'Premium',
    monthlyPrice: 12.99,
    yearlyPrice: 99.99,
    tagline: 'For individuals focused on their health journey',
    features: [
      'Full nutrition and fitness tools',
      'Personal dashboard',
      'Meal planning and tracking',
      'Optional WIHY Coach (AI)',
    ],
    icon: 'person',
  },
  {
    id: 'family_basic',
    name: 'Family Basic',
    monthlyPrice: 24.99,
    yearlyPrice: 249.99,
    tagline: 'For households with up to 4 members',
    features: [
      'Up to 4 family members',
      'Shared parent/guardian dashboard',
      'Individual accounts for everyone',
      'Optional WIHY Coach (AI)',
    ],
    icon: 'people',
  },
  {
    id: 'family_pro',
    name: 'Family Pro',
    monthlyPrice: 49.99,
    yearlyPrice: 499.99,
    tagline: 'For entire households — no limits',
    features: [
      'Up to 5 family members',
      'Every member gets their own login',
      'WIHY Coach (AI) included',
      'Instacart Pro included',
    ],
    popular: true,
    icon: 'home',
  },
  {
    id: 'coach',
    name: 'Coach Platform',
    setupFee: 99.99,
    monthlyPrice: 29.99,
    commission: '1%',
    tagline: 'For health & fitness professionals',
    features: [
      'Unlimited clients',
      'Meal plan and workout creation',
      'Progress tracking & reporting',
      'Full app access for yourself',
    ],
    icon: 'fitness',
  },
];

// Comparison data for legal-safe copy
type ComparisonItem = {
  id: string;
  appName: string;
  statedFocus: string;
  scopeNotes: string;
  wihyApproach: string;
  color: string;
};

const COMPARISON_DISCLAIMER =
  "Comparison reflects each product's publicly stated primary focus and typical use. Features may vary by plan, region, and updates. This is not a comprehensive feature audit.";

const COMPARISONS: ComparisonItem[] = [
  {
    id: "myfitnesspal",
    appName: "MyFitnessPal",
    statedFocus: "Food and fitness tracking with a large database",
    scopeNotes:
      "Calorie counter and macro tracker. Users manually log meals and exercises. Offers community support and barcode scanning.",
    wihyApproach:
      "Automatically generates personalized meal plans AND workout programs based on your goals. Syncs nutrition with fitness (adjusts calories on workout days, recommends post-workout meals). Evidence-based insights from 35+ million research articles and over 4 million things we know about food.",
    color: "#0099FF",
  },
  {
    id: "cal-ai",
    appName: "Cal AI",
    statedFocus: "Photo-based calorie and macro tracking",
    scopeNotes:
      "Uses computer vision to estimate calories from food photos. Focused on quick logging and tracking.",
    wihyApproach:
      "Scans barcodes AND photos, plus explains ingredient processing (NOVA groups, additives). Generates individualized meal plans and workouts. Connects nutrition patterns to behavior and lifestyle context.",
    color: "#FF6B35",
  },
  {
    id: "yuka",
    appName: "Yuka",
    statedFocus: "Product scoring based on nutrition and ingredient analysis",
    scopeNotes:
      "Scans products and provides health scores. Recommends healthier alternatives. Focus is on product-level evaluation.",
    wihyApproach:
      "Goes beyond scores—explains WHY ingredients matter to YOU based on your health profile. Generates meal plans and workouts tailored to individual constraints and goals. Backed by research, not just ratings.",
    color: "#4CAF50",
  },
  {
    id: "cronometer",
    appName: "Cronometer",
    statedFocus: "Detailed nutrient tracking with emphasis on micronutrients",
    scopeNotes:
      "Comprehensive nutrition database tracking 84+ micronutrients. Popular with biohackers and precision nutrition enthusiasts.",
    wihyApproach:
      "Automates interpretation of nutrition data and connects it to behavior patterns. Generates personalized meal plans and workouts. Predicts health trends based on your patterns—no manual analysis needed.",
    color: "#9C27B0",
  },
  {
    id: "lifesum",
    appName: "Lifesum",
    statedFocus: "Diet plans, calorie counting, and macro tracking",
    scopeNotes:
      "Offers pre-made diet plans (keto, Mediterranean, etc.) and recipe suggestions. Includes barcode scanner and meal logging.",
    wihyApproach:
      "Creates meal plans from scratch based on YOUR constraints (dietary restrictions, calorie targets, cooking skill). Generates workouts too. Combines food + fitness + behavior for comprehensive health intelligence.",
    color: "#00BCD4",
  },
  {
    id: "noom",
    appName: "Noom",
    statedFocus: "Psychology-based weight loss program with coaching",
    scopeNotes:
      "Structured curriculum with daily lessons. Assigns human coaches. Uses color-coded food system (green, yellow, red).",
    wihyApproach:
      "Integrates behavior insights with food scanning and ingredient analysis. Generates personalized meal plans AND workout programs based on your goals. Research-backed answers from 35+ million scientific articles.",
    color: "#FF9800",
  },
  {
    id: "fitbit",
    appName: "Fitbit",
    statedFocus: "Activity tracking and wearable devices",
    scopeNotes:
      "Tracks steps, heart rate, sleep, and exercise. Offers basic food logging. Strength is in activity and biometric tracking.",
    wihyApproach:
      "Acts as an intelligence layer across food AND activity data. Generates personalized meal plans synced with workout programs (adjusts nutrition on training vs rest days). Explains how food impacts fitness performance.",
    color: "#00D4AA",
  },
  {
    id: "apple-health",
    appName: "Apple Health",
    statedFocus: "Health data aggregation and dashboard",
    scopeNotes:
      "Centralizes health data from various apps and devices. Displays trends and summaries. Recommendations come from connected third-party apps.",
    wihyApproach:
      "Interprets health data patterns and generates actionable insights. Creates personalized meal plans AND workout programs. Scans food with camera, explains ingredient processing, and connects it all to your health trends.",
    color: "#E91E63",
  },
  {
    id: "samsung-food",
    appName: "Samsung Food",
    statedFocus: "Recipe discovery and meal planning",
    scopeNotes:
      "Offers recipes, grocery lists, and meal planning tools. Integrates with Samsung smart appliances. Focus is on cooking and recipes.",
    wihyApproach:
      "Generates custom meal plans based on your goals, dietary needs, and preferences. Adds ingredient processing context (NOVA groups, additives). Creates workout programs too—combines nutrition + fitness intelligence.",
    color: "#3F51B5",
  },
  {
    id: "appediet",
    appName: "Appediet",
    statedFocus: "Photo-based food recognition and calorie tracking",
    scopeNotes:
      "Uses image recognition to identify food and estimate calories. Designed for quick meal logging without manual entry.",
    wihyApproach:
      "Scans food AND generates personalized meal plans + workout programs. Connects food, behavior, and activity patterns. Explains ingredient processing and health impacts. Backed by 35+ million research articles—not just calorie estimates.",
    color: "#FFEB3B",
  },
];

type SubscriptionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Subscription'>;

interface Props {
  navigation: SubscriptionScreenNavigationProp;
}

export const SubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showFreeLoginModal, setShowFreeLoginModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof CONSUMER_PLANS[0] | null>(null);

  const isDesktop = width >= 1024;
  const isTablet = width >= 640;

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(/\.00$/, '');
  };

  // Get price string for modal display
  const getSelectedPlanPrice = () => {
    if (!selectedPlan) return '';
    if (selectedPlan.setupFee) {
      return `$${formatPrice(selectedPlan.setupFee)} setup + ${selectedPlan.commission}`;
    }
    if (selectedPlan.monthlyPrice === 0) return 'Free';
    const price = billingCycle === 'yearly' && selectedPlan.yearlyPrice 
      ? selectedPlan.yearlyPrice / 12 
      : selectedPlan.monthlyPrice;
    return `$${formatPrice(price)}/month`;
  };

  // Process checkout with email (for new users)
  const processCheckoutWithEmail = async (email: string) => {
    if (!selectedPlan) return;
    
    setIsLoading(true);
    try {
      const checkoutPlanId = billingCycle === 'yearly' && selectedPlan.yearlyPrice 
        ? `${selectedPlan.id}-yearly` 
        : selectedPlan.id;
      
      // Initiate checkout with the email (no login required)
      const response = await checkoutService.initiateCheckout(checkoutPlanId, email);
      
      if (response.success && response.checkoutUrl) {
        setShowEmailModal(false);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // Store pending checkout info for post-payment registration
          sessionStorage.setItem('pendingCheckout', JSON.stringify({
            email,
            planId: checkoutPlanId,
            planName: selectedPlan.name,
          }));
          window.location.href = response.checkoutUrl;
        } else {
          await checkoutService.openCheckout(response.checkoutUrl);
        }
      } else {
        throw new Error(response.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Checkout Error\n\n${error.message || 'Please try again.'}`);
      } else {
        Alert.alert('Checkout Error', error.message || 'Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Map plan IDs to native store product IDs
  const getNativeProductId = (planId: string, yearly: boolean): string => {
    const suffix = yearly ? '_yearly' : '_monthly';
    const mapping: Record<string, string> = {
      'premium': `com.wihy.native.premium${suffix}`,
      'family-basic': `com.wihy.native.family_basic${suffix}`,
      'family-pro': `com.wihy.native.family_premium${suffix}`,
      'coach': `com.wihy.native.coach${suffix}`,
    };
    return mapping[planId] || planId;
  };

  const handleSubscribe = async (planId: string) => {
    const plan = CONSUMER_PLANS.find(p => p.id === planId);
    if (!plan) return;

    // Free plan - login or signup (no payment required)
    if (planId === 'free') {
      if (!user?.email) {
        // Not logged in - show login/signup modal
        setShowFreeLoginModal(true);
      } else {
        // Already logged in - navigate to main app
        navigation.navigate('Main');
      }
      return;
    }

    // iOS: Use Apple In-App Purchases (required by App Store policy)
    if (Platform.OS === 'ios') {
      // For new users, show email modal first (consistent with web)
      if (!user?.email) {
        setSelectedPlan(plan);
        setShowEmailModal(true);
        return;
      }

      setIsLoading(true);
      try {
        // Initialize purchase service if needed
        await purchaseService.initialize();
        
        const productId = getNativeProductId(planId, billingCycle === 'yearly');
        console.log('[Subscription] iOS In-App Purchase:', productId);
        
        // Trigger the purchase - listener in purchaseService will handle completion
        await purchaseService.purchase(productId);
        
        // Note: Purchase completion is handled by the purchase listener
        // The UI should update when the listener verifies the purchase with backend
      } catch (error: any) {
        console.error('[Subscription] iOS purchase error:', error);
        Alert.alert(
          'Purchase Error',
          error.message || 'Unable to complete purchase. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Android: Use Google Play Billing (preferred) or Stripe
    if (Platform.OS === 'android') {
      // For new users, show email modal first (consistent with web)
      if (!user?.email) {
        setSelectedPlan(plan);
        setShowEmailModal(true);
        return;
      }

      setIsLoading(true);
      try {
        // Try Google Play Billing first
        await purchaseService.initialize();
        const productId = getNativeProductId(planId, billingCycle === 'yearly');
        const products = purchaseService.getProducts();
        
        // Check if product is available in Google Play
        const googlePlayProduct = products.find(p => p.productId === productId);
        
        if (googlePlayProduct) {
          console.log('[Subscription] Android Google Play purchase:', productId);
          await purchaseService.purchase(productId);
        } else {
          // Fallback to Stripe for Android if product not in Google Play
          console.log('[Subscription] Android Stripe fallback:', planId);
          const checkoutPlanId = billingCycle === 'yearly' && plan.yearlyPrice ? `${planId}-yearly` : planId;
          const response = await checkoutService.initiateCheckout(checkoutPlanId, user.email);
          
          if (response.success && response.checkoutUrl) {
            await checkoutService.openCheckout(response.checkoutUrl);
          } else {
            throw new Error(response.error || 'Failed to create checkout session');
          }
        }
      } catch (error: any) {
        console.error('[Subscription] Android purchase error:', error);
        Alert.alert(
          'Purchase Error',
          error.message || 'Unable to complete purchase. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Web: Use Stripe checkout
    if (user?.email) {
      setIsLoading(true);
      try {
        const checkoutPlanId = billingCycle === 'yearly' && plan.yearlyPrice ? `${planId}-yearly` : planId;
        const response = await checkoutService.initiateCheckout(checkoutPlanId, user.email);
        
        if (response.success && response.checkoutUrl) {
          if (typeof window !== 'undefined') {
            window.location.href = response.checkoutUrl;
          }
        } else {
          throw new Error(response.error || 'Failed to create checkout session');
        }
      } catch (error: any) {
        console.error('[Subscription] Web checkout error:', error);
        if (typeof window !== 'undefined') {
          window.alert(`Checkout Error\n\n${error.message || 'Please try again.'}`);
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // For new users on web, show email collection modal
    setSelectedPlan(plan);
    setShowEmailModal(true);
  };

  const handleEmailModalClose = () => {
    setShowEmailModal(false);
    setSelectedPlan(null);
    // Option: User clicked "Sign in" in modal - navigate to login
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Check if user wants to sign in
      // For now, just close the modal
    }
  };

  // Navigate to tab screens (inside Main TabNavigator)
  const navigateToTab = (tabName: keyof TabParamList) => {
    navigation.navigate('Main', { screen: tabName });
  };

  // Determine grid columns based on screen size
  const getGridClass = () => {
    if (isDesktop) return 'pricing-grid pricing-grid-5';
    if (isTablet) return 'pricing-grid pricing-grid-2';
    return 'pricing-grid pricing-grid-1';
  };

  // Web render
  if (isWeb) {
    return (
      <div className="pricing-page">
        {/* @ts-ignore */}
        <WebNavHeader activePage="subscription" />
        
        <div className="pricing-content">
          {/* Hero Section */}
          <div className="pricing-hero">
            <div className="pricing-hero-inner">
              <div className="pricing-hero-icon">
                <Image 
                  source={require('../../assets/whatishealthyspinner.gif')} 
                  style={{ width: 88, height: 88 }}
                  resizeMode="cover"
                />
              </div>
              <h1 className="pricing-hero-title">Make Every Food Decision Count</h1>
              <p className="pricing-hero-subtitle">
                Scan. Understand. Ask. Track. Choose the plan that fits your health journey.
              </p>
            </div>
          </div>

          {/* Consumer Plans Section */}
          <section className="pricing-section">
            <p className="pricing-section-label">FOR INDIVIDUALS & FAMILIES</p>
            <h2 className="pricing-section-title">Personal & Family Plans</h2>

            {/* Billing Toggle */}
            <div className="pricing-toggle-container">
              <div className="pricing-toggle">
                <button
                  className={`pricing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                  onClick={() => setBillingCycle('monthly')}
                  type="button"
                >
                  Monthly
                </button>
                <button
                  className={`pricing-toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                  onClick={() => setBillingCycle('yearly')}
                  type="button"
                >
                  Yearly
                  <span className="pricing-save-badge">Save 20%</span>
                </button>
              </div>
            </div>

            {/* Plan Cards */}
            <div className={getGridClass()}>
              {CONSUMER_PLANS.map((plan) => (
                <div 
                  key={plan.id}
                  className={`pricing-card ${plan.popular ? 'pricing-card-popular' : ''}`}
                >
                  {plan.popular && (
                    <div className="pricing-badge">Most Popular</div>
                  )}
                  
                  <div className="pricing-card-icon">
                    <WebIcon name={plan.icon} size={28} color={colors.primary} />
                  </div>
                  <h3 className="pricing-card-name">{plan.name}</h3>
                  <p className="pricing-card-tagline">{plan.tagline}</p>
                  
                  <div className="pricing-card-price">
                    {plan.setupFee ? (
                      <>
                        <span className="pricing-amount">${formatPrice(plan.setupFee)}</span>
                        <span className="pricing-period"> setup + {plan.commission}</span>
                      </>
                    ) : plan.monthlyPrice === 0 ? (
                      <>
                        <span className="pricing-amount">$0</span>
                        <span className="pricing-period">/month</span>
                      </>
                    ) : (
                      <>
                        <span className="pricing-amount">
                          ${billingCycle === 'yearly' && plan.yearlyPrice 
                            ? formatPrice(plan.yearlyPrice / 12) 
                            : formatPrice(plan.monthlyPrice)}
                        </span>
                        <span className="pricing-period">/month</span>
                      </>
                    )}
                  </div>
                  {billingCycle === 'yearly' && plan.yearlyPrice && plan.yearlyPrice > 0 && (
                    <p className="pricing-yearly-note">${formatPrice(plan.yearlyPrice)}/year</p>
                  )}

                  <ul className="pricing-features">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="pricing-feature">
                        <WebIcon name="checkmark-circle" size={18} color="#22c55e" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    className={`pricing-btn ${plan.popular ? 'pricing-btn-popular' : 'pricing-btn-primary'}`}
                    disabled={isLoading}
                    type="button"
                  >
                    {isLoading ? 'Loading...' : plan.monthlyPrice === 0 ? 'Get Started' : 'Subscribe'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Comparison Section - Modern Cards */}
          <section className="comparison-section">
            <div className="comparison-container">
              <div className="comparison-header">
                <h2>How WiHY Compares</h2>
                <p>See how WiHY's personalized health intelligence differs from other popular apps</p>
              </div>
              
              <div className="comparison-grid">
                {COMPARISONS.map((item) => (
                  <div key={item.id} className="comparison-card">
                    <div className="comparison-card-header" style={{ borderBottomColor: item.color }}>
                      <span className="comparison-app-name" style={{ color: item.color }}>{item.appName}</span>
                    </div>

                    <div className="comparison-card-body">
                      <div className="comparison-row">
                        <span className="comparison-label">Their Stated Focus</span>
                        <span className="comparison-value">{item.statedFocus}</span>
                      </div>

                      <div className="comparison-row">
                        <span className="comparison-label">Scope Notes</span>
                        <span className="comparison-value">{item.scopeNotes}</span>
                      </div>

                      <div className="comparison-wihy-box">
                        <span className="comparison-label">WiHY Delivers</span>
                        <span className="comparison-value">{item.wihyApproach}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="comparison-disclaimer">
                <p><strong>Note:</strong> {COMPARISON_DISCLAIMER}</p>
              </div>
            </div>
          </section>

          {/* Mission Section */}
          <section className="pricing-section pricing-section-alt">
            <p className="pricing-section-label">HOW IT WORKS</p>
            <h2 className="pricing-section-title">Your Journey to Better Health</h2>
            <p className="about-mission-text">
              WIHY makes understanding what you eat as simple as searching the internet—but with real evidence instead of opinions.
            </p>
            
            {/* Story Section with Screenshots */}
            <div style={{ maxWidth: '1000px', margin: '0 auto 48px' }}>
              
              {/* Step 1: Scan */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '64px', flexDirection: 'row' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ background: 'linear-gradient(135deg, #e8f0fe 0%, #d3e3fd 100%)', borderRadius: '20px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* Phone Mockup Frame */}
                      <div style={{ 
                        position: 'relative', 
                        width: '300px', 
                        height: '600px',
                        background: '#1f2937',
                        borderRadius: '40px',
                        padding: '12px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                      }}>
                        {/* Screen Notch */}
                        <div style={{
                          position: 'absolute',
                          top: '0',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '150px',
                          height: '28px',
                          background: '#1f2937',
                          borderBottomLeftRadius: '20px',
                          borderBottomRightRadius: '20px',
                          zIndex: 10
                        }}></div>
                        {/* Screen Content */}
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          background: '#ffffff',
                          borderRadius: '32px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Image 
                            source={require('../../assets/CameraScreen.png')} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
                            resizeMode="cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>1. Scan Anything</h3>
                  <div style={{ borderLeft: '4px solid #fa5f06', paddingLeft: '20px' }}>
                    <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '12px' }}>
                      Point your camera at any food, barcode, nutrition label, or ingredient list. WIHY instantly recognizes what you're looking at.
                    </p>
                    <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8 }}>
                      Works with barcodes, photos, screenshots, or even handwritten lists.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Understand */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '64px', flexDirection: 'row-reverse' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '20px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* Phone Mockup Frame */}
                      <div style={{ 
                        position: 'relative', 
                        width: '300px', 
                        height: '600px',
                        background: '#1f2937',
                        borderRadius: '40px',
                        padding: '12px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                      }}>
                        {/* Screen Notch */}
                        <div style={{
                          position: 'absolute',
                          top: '0',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '150px',
                          height: '28px',
                          background: '#1f2937',
                          borderBottomLeftRadius: '20px',
                          borderBottomRightRadius: '20px',
                          zIndex: 10
                        }}></div>
                        {/* Screen Content */}
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          background: '#ffffff',
                          borderRadius: '32px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Image 
                            source={require('../../assets/NutritionAnalysis.png')} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
                            resizeMode="cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>2. Understand Instantly</h3>
                  <div style={{ borderLeft: '4px solid #4cbb17', paddingLeft: '20px' }}>
                    <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '12px' }}>
                      See complete nutrition breakdowns, ingredient processing levels (NOVA groups), additives, and allergens—all explained in plain language.
                    </p>
                    <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8 }}>
                      No guessing. Just facts backed by 35+ million research articles.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3: Ask */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '64px', flexDirection: 'row' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '20px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* Phone Mockup Frame */}
                      <div style={{ 
                        position: 'relative', 
                        width: '300px', 
                        height: '600px',
                        background: '#1f2937',
                        borderRadius: '40px',
                        padding: '12px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                      }}>
                        {/* Screen Notch */}
                        <div style={{
                          position: 'absolute',
                          top: '0',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '150px',
                          height: '28px',
                          background: '#1f2937',
                          borderBottomLeftRadius: '20px',
                          borderBottomRightRadius: '20px',
                          zIndex: 10
                        }}></div>
                        {/* Screen Content */}
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          background: '#ffffff',
                          borderRadius: '32px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Image 
                            source={require('../../assets/WihyHomescreen.png')} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
                            resizeMode="cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>3. Ask Anything</h3>
                  <div style={{ borderLeft: '4px solid #1a73e8', paddingLeft: '20px' }}>
                    <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '12px' }}>
                      Chat with WIHY about what you scanned. "Is this good for weight loss?" "Are these additives safe?" "How does this compare to alternatives?"
                    </p>
                    <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8 }}>
                      Get personalized, evidence-based answers—not generic advice.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4: Track */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexDirection: 'row-reverse' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', borderRadius: '20px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* Phone Mockup Frame */}
                      <div style={{ 
                        position: 'relative', 
                        width: '300px', 
                        height: '600px',
                        background: '#1f2937',
                        borderRadius: '40px',
                        padding: '12px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                      }}>
                        {/* Screen Notch */}
                        <div style={{
                          position: 'absolute',
                          top: '0',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '150px',
                          height: '28px',
                          background: '#1f2937',
                          borderBottomLeftRadius: '20px',
                          borderBottomRightRadius: '20px',
                          zIndex: 10
                        }}></div>
                        {/* Screen Content */}
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          background: '#ffffff',
                          borderRadius: '32px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Image 
                            source={require('../../assets/MyProgressScreen.png')} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
                            resizeMode="cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>4. Track My Progress</h3>
                  <div style={{ borderLeft: '4px solid #9333ea', paddingLeft: '20px' }}>
                    <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '12px' }}>
                      See your health patterns over time. Track nutrition trends, monitor fitness progress, and visualize how your habits are impacting your health goals.
                    </p>
                    <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '12px' }}>
                      Your data works for you—revealing insights and predicting where you're heading.
                    </p>
                    <p style={{ fontSize: '14px', color: '#9333ea', fontWeight: '600', lineHeight: 1.8 }}>
                      ⭐ Available with paid subscription only
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Features Grid */}
          <section className="pricing-section">
            <p className="pricing-section-label">WHAT WIHY DOES</p>
            <h2 className="pricing-section-title">Intelligent Health Features</h2>
            <div className="about-features-grid">
              
              {/* Health Search */}
              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Health Search</h3>
                <p className="pricing-card-tagline">Ask health and nutrition questions and get research-backed answers. Powered by 35+ million scientific research articles.</p>
              </div>

              {/* Universal Scanning */}
              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Universal Scanning</h3>
                <p className="pricing-card-tagline">Scan barcodes, take photos, upload ingredients, or import receipts. WIHY detects, verifies, and analyzes automatically.</p>
              </div>

              {/* Nutrition Analysis */}
              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Nutrition Analysis</h3>
                <p className="pricing-card-tagline">Understand nutrition in plain language. Analyze macros, micros, additives, processing level, and portion impact.</p>
              </div>

              {/* Predictive Insights */}
              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Predictive Insights</h3>
                <p className="pricing-card-tagline">See where your habits are heading. Detect patterns, predict outcomes, and get early awareness of health shifts.</p>
              </div>

              {/* Fact Check */}
              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Fact Check</h3>
                <p className="pricing-card-tagline">Verify health claims with real evidence. See strength of evidence, level of certainty, and what research actually supports.</p>
              </div>

              {/* Connected Platform */}
              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Connected Platform</h3>
                <p className="pricing-card-tagline">Progress tracking, nutrition, research, fitness, and coaching unified in one place for you and your family.</p>
              </div>
            </div>
          </section>

          {/* Trust Section */}
          <section className="pricing-section">
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Secure Payments</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ionicons name="refresh" size={20} color={colors.primary} />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Cancel Anytime</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ionicons name="card" size={20} color={colors.primary} />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>30-Day Guarantee</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
              <Ionicons name="lock-closed" size={14} color="#9ca3af" />
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Powered by Stripe</span>
            </div>
          </section>

          {/* Footer */}
          <footer className="pricing-footer">
            <p className="pricing-footer-copyright">© 2026 WIHY. All rights reserved.</p>
            <p className="pricing-footer-disclaimer">This page is for education and information only and is not a substitute for professional medical advice.</p>
            <div className="pricing-footer-links">
              <a href="/privacy" onClick={(e) => { e.preventDefault(); navigation.navigate('Privacy'); }}>Privacy Policy</a>
              <span className="pricing-footer-separator">•</span>
              <a href="/terms" onClick={(e) => { e.preventDefault(); navigation.navigate('Terms'); }}>Terms of Service</a>
              <span className="pricing-footer-separator">•</span>
              <a href="mailto:support@wihy.app">Contact Us</a>
              <span className="pricing-footer-separator">•</span>
              <a href="#" onClick={(e) => { e.preventDefault(); navigation.navigate('B2BPricing' as any); }}>Looking for Enterprise Solutions?</a>
            </div>
          </footer>
        </div>

        {/* Email Collection Modal */}
        <EmailCheckoutModal
          visible={showEmailModal}
          onClose={handleEmailModalClose}
          onContinue={processCheckoutWithEmail}
          planName={selectedPlan?.name || ''}
          planPrice={getSelectedPlanPrice()}
          isLoading={isLoading}
        />

        {/* Free Plan Login Modal */}
        <MultiAuthLogin
          visible={showFreeLoginModal}
          onClose={() => setShowFreeLoginModal(false)}
          onSignIn={() => {
            setShowFreeLoginModal(false);
            // After successful login, navigate to main
            navigation.navigate('Main');
          }}
          onSkip={() => {
            setShowFreeLoginModal(false);
            // Continue without account - go to main with limited features
            navigation.navigate('Main');
          }}
          skipLabel="Continue to Free"
          title="Get Started Free"
        />
      </div>
    );
  }

  // Native app render
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable 
          onPress={() => navigation.navigate('Main')} 
          style={styles.logoButton}
        >
          <Image
            source={require('../../assets/Logo_wihy.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </Pressable>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles" size={40} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
          <Text style={styles.heroSubtitle}>Choose the plan that fits how you live.</Text>
        </View>

        {/* Billing Toggle */}
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleBtn, billingCycle === 'monthly' && styles.toggleBtnActive]}
            onPress={() => setBillingCycle('monthly')}
          >
            <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, billingCycle === 'yearly' && styles.toggleBtnActive]}
            onPress={() => setBillingCycle('yearly')}
          >
            <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.toggleTextActive]}>Yearly</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>Save 20%</Text>
            </View>
          </Pressable>
        </View>

        {/* Plan Cards */}
        {CONSUMER_PLANS.map((plan) => (
          <View key={plan.id} style={[styles.planCard, plan.popular && styles.planCardPopular]}>
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Most Popular</Text>
              </View>
            )}
            
            <View style={styles.planCardIcon}>
              <Ionicons name={plan.icon as any} size={24} color={colors.primary} />
            </View>
            <Text style={styles.planCardName}>{plan.name}</Text>
            <Text style={styles.planCardTagline}>{plan.tagline}</Text>
            
            <View style={styles.priceRow}>
              {plan.setupFee ? (
                <>
                  <Text style={styles.priceAmount}>${formatPrice(plan.setupFee)}</Text>
                  <Text style={styles.pricePeriod}> setup + {plan.commission}</Text>
                </>
              ) : plan.monthlyPrice === 0 ? (
                <Text style={styles.priceAmount}>Free</Text>
              ) : (
                <>
                  <Text style={styles.priceAmount}>
                    ${billingCycle === 'yearly' && plan.yearlyPrice 
                      ? formatPrice(plan.yearlyPrice / 12) 
                      : formatPrice(plan.monthlyPrice)}
                  </Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </>
              )}
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={[styles.subscribeBtn, plan.popular && styles.subscribeBtnPopular]}
              onPress={() => handleSubscribe(plan.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.subscribeBtnText}>
                  {plan.monthlyPrice === 0 ? 'Get Started' : 'Subscribe'}
                </Text>
              )}
            </Pressable>
          </View>
        ))}

        {/* How WiHY Compares - Native */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1f2937', marginBottom: 8 }}>
            How WiHY Compares
          </Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
            {COMPARISON_DISCLAIMER}
          </Text>

          {COMPARISONS.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: '#fff',
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#000000' }}>{item.appName}</Text>
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#6b7280', marginBottom: 4 }}>
                  Their Stated Focus
                </Text>
                <Text style={{ fontSize: 14, color: '#000000', marginBottom: 10, lineHeight: 20 }}>{item.statedFocus}</Text>

                <Text style={{ fontSize: 11, fontWeight: '800', color: '#6b7280', marginBottom: 4 }}>
                  Scope Notes
                </Text>
                <Text style={{ fontSize: 14, color: '#000000', marginBottom: 12, lineHeight: 20 }}>{item.scopeNotes}</Text>

                <View
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 2,
                    borderColor: '#fa5f06',
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#1f2937', marginBottom: 8 }}>
                    WiHY Delivers
                  </Text>
                  <Text style={{ fontSize: 15, color: '#000000', lineHeight: 22, fontWeight: '500' }}>{item.wihyApproach}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* B2B Link */}
        <Pressable 
          style={styles.b2bLink}
          onPress={() => navigation.navigate('B2BPricing' as any)}
        >
          <Ionicons name="business" size={24} color={colors.primary} />
          <View style={styles.b2bLinkText}>
            <Text style={styles.b2bLinkTitle}>Enterprise Solutions</Text>
            <Text style={styles.b2bLinkSubtitle}>For businesses & organizations</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Questions? support@wihy.app</Text>
        </View>
      </ScrollView>

      {/* Free Plan Login Modal (Native) */}
      <MultiAuthLogin
        visible={showFreeLoginModal}
        onClose={() => setShowFreeLoginModal(false)}
        onSignIn={() => {
          setShowFreeLoginModal(false);
          navigation.navigate('Main');
        }}
        onSkip={() => {
          setShowFreeLoginModal(false);
          // Continue without account - go to main with limited features
          navigation.navigate('Main');
        }}
        skipLabel="Continue to Free"
        title="Get Started Free"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  logoButton: {
    padding: 4,
  },
  headerLogo: {
    width: 80,
    height: 32,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    backgroundColor: '#e8f0fe',
    padding: 32,
    alignItems: 'center',
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 28,
    padding: 4,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  toggleTextActive: {
    color: '#1f2937',
  },
  saveBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
  },
  planCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  planCardPopular: {
    borderColor: '#22c55e',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  planCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  planCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  planCardTagline: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#6b7280',
  },
  featuresList: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  subscribeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeBtnPopular: {
    backgroundColor: '#22c55e',
  },
  subscribeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  b2bLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  b2bLinkText: {
    flex: 1,
  },
  b2bLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  b2bLinkSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
  },
});

export default SubscriptionScreen;
