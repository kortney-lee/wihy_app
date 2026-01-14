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
import { RootStackParamList } from '../types/navigation';
import { colors, borderRadius } from '../theme/design-tokens';
import { checkoutService } from '../services/checkoutService';
import { useAuth } from '../context/AuthContext';
import EmailCheckoutModal from '../components/checkout/EmailCheckoutModal';

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


// Consumer Plans
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
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 12.99,
    yearlyPrice: 99,
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
    id: 'family-basic',
    name: 'Family Basic',
    monthlyPrice: 24.99,
    yearlyPrice: 249,
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
    id: 'family-premium',
    name: 'Family Premium',
    monthlyPrice: 49.99,
    yearlyPrice: 499,
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
};

const COMPARISON_DISCLAIMER =
  "Comparison reflects each product's publicly stated primary focus and typical use. Features may vary by plan, region, and updates. This is not a comprehensive feature audit.";

const COMPARISONS: ComparisonItem[] = [
  {
    id: "cal-ai",
    appName: "Cal AI",
    statedFocus: "Photo/barcode scanning for fast nutrition tracking",
    scopeNotes:
      "Primarily designed for tracking. Ingredient processing context and individualized planning may not be central to the core workflow.",
    wihyApproach:
      "Adds ingredient + processing context and can generate individualized meals and workouts based on the user's goals, preferences, and constraints.",
  },
  {
    id: "yuka",
    appName: "Yuka",
    statedFocus: "Product scoring based on nutrition-related factors and ingredients",
    scopeNotes:
      "Score-based guidance. Deeper personalization and lifestyle planning are typically outside a scanner-first workflow.",
    wihyApproach:
      "Explains relevance to the individual and can generate personalized meal and workout recommendations using user inputs.",
  },
  {
    id: "myfitnesspal",
    appName: "MyFitnessPal",
    statedFocus: "Food and fitness tracking with a large database",
    scopeNotes:
      "Tracking/logging centric. Insights depend on what the user logs and reviews over time.",
    wihyApproach:
      "Turns inputs into contextual insights and generates individualized meal/workout recommendations.",
  },
  {
    id: "cronometer",
    appName: "Cronometer",
    statedFocus: "Detailed nutrient tracking with emphasis on micronutrients",
    scopeNotes:
      "Designed for depth and precision; typically benefits from consistent entry and review.",
    wihyApproach:
      "Automates interpretation and connects nutrition patterns to behavior and lifestyle context.",
  },
  {
    id: "lifesum",
    appName: "Lifesum",
    statedFocus: "Healthy eating plans, tracking, and recipes",
    scopeNotes:
      "Plan-and-tracking oriented; explanation depth varies by feature set and content model.",
    wihyApproach:
      "Adds research-informed explanations and generates recommendations based on user-specific constraints.",
  },
  {
    id: "noom",
    appName: "Noom",
    statedFocus: "Behavior-change program with lessons and tracking tools",
    scopeNotes:
      "Curriculum/behavior oriented; nutrition depth and outputs vary by program design.",
    wihyApproach:
      "Integrates behavior signals with food/ingredient context and produces individualized meal and workout recommendations.",
  },
  {
    id: "fitbit",
    appName: "Fitbit",
    statedFocus: "Activity and wearable ecosystem with optional nutrition logging",
    scopeNotes:
      "Wearable-first experience; food insights are typically part of a broader activity platform.",
    wihyApproach:
      "Acts as an interpretation layer across food + activity and generates user-specific plans.",
  },
  {
    id: "apple-health",
    appName: "Apple Health",
    statedFocus: "Health data aggregation, trends, and highlights",
    scopeNotes:
      "Primarily aggregates and displays data; recommendations depend on connected apps and sources.",
    wihyApproach:
      "Interprets patterns and offers individualized meal/workout recommendations based on user inputs and connected data where available.",
  },
  {
    id: "samsung-food",
    appName: "Samsung Food",
    statedFocus: "Recipes, meal planning, and shopping workflows",
    scopeNotes:
      "Cooking and meal planning oriented; health-intelligence depth depends on recipe metadata and integrations.",
    wihyApproach:
      "Adds ingredient/processing context and tailors recommendations to the individual.",
  },
  {
    id: "appediet",
    appName: "Appediet",
    statedFocus: "AI food scanning and logging for calories and nutrition estimates",
    scopeNotes:
      "Logging/scanning oriented; broader coaching, behavior, and environment workflows may not be central to the core product design.",
    wihyApproach:
      "Connects food + behavior + activity and generates individualized meals and workouts based on user-specific inputs.",
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

  const handleSubscribe = async (planId: string) => {
    const plan = CONSUMER_PLANS.find(p => p.id === planId);
    if (!plan) return;

    // Free plan - redirect to registration
    if (planId === 'free') {
      if (!user?.email) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = '/register?plan=free';
        } else {
          navigation.navigate('Register' as any, { plan: 'free' });
        }
      } else {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('You are already on the Free plan!');
        } else {
          Alert.alert('Free Plan', 'You are already on the Free plan!');
        }
      }
      return;
    }

    // For logged-in users, go directly to checkout
    if (user?.email) {
      setIsLoading(true);
      try {
        const checkoutPlanId = billingCycle === 'yearly' && plan.yearlyPrice ? `${planId}-yearly` : planId;
        const response = await checkoutService.initiateCheckout(checkoutPlanId, user.email);
        
        if (response.success && response.checkoutUrl) {
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
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
      return;
    }

    // For new users, show email collection modal
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

  // Web Navigation Header
  const WebNavHeader = () => (
    <nav className="web-top-nav">
      <div className="web-nav-left">
        <button onClick={() => navigation.navigate('Main')} className="web-nav-item nav-home" type="button">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span>Home</span>
        </button>
        <button onClick={() => navigation.navigate('Main')} className="web-nav-item nav-health" type="button">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>Health</span>
        </button>
        <button onClick={() => navigation.navigate('FullChat')} className="web-nav-item nav-chat" type="button">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span>Chat</span>
        </button>
        <button onClick={() => navigation.navigate('About' as any)} className="web-nav-item nav-about" type="button">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span>About</span>
        </button>
      </div>
      <div className="web-nav-right">
        <button onClick={() => {
          if (user) {
            navigation.navigate('Profile');
          } else {
            navigation.navigate('Login' as any);
          }
        }} className="web-nav-item profile" type="button">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </button>
      </div>
    </nav>
  );

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
        <WebNavHeader />
        
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
              <h1 className="pricing-hero-title">Unlock Your Full Potential</h1>
              <p className="pricing-hero-subtitle">
                Choose the plan that fits how you live — or how you coach.
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
                    <div className="comparison-card-header">
                      <span className="comparison-app-name">{item.appName}</span>
                      <span className="comparison-vs">vs WiHY</span>
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
                        <span className="comparison-label">WiHY Approach</span>
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

          {/* B2B Link Section */}
          <section className="pricing-section pricing-section-alt">
            <div className="pricing-cta-box">
              <WebIcon name="business" size={32} color={colors.primary} />
              <h3>Looking for Enterprise Solutions?</h3>
              <p>We offer custom wellness programs for businesses, schools, and healthcare organizations.</p>
              <button
                onClick={() => navigation.navigate('B2BPricing' as any)}
                className="pricing-btn pricing-btn-outline pricing-btn-lg"
                type="button"
              >
                View Enterprise Plans →
              </button>
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
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{item.appName}</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#6b7280' }}>vs WiHY</Text>
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 4 }}>
                  Their Stated Focus
                </Text>
                <Text style={{ fontSize: 13, color: '#111827', marginBottom: 10 }}>{item.statedFocus}</Text>

                <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 4 }}>
                  Scope Notes
                </Text>
                <Text style={{ fontSize: 13, color: '#111827', marginBottom: 12 }}>{item.scopeNotes}</Text>

                <View
                  style={{
                    backgroundColor: '#fff7ed',
                    borderWidth: 1,
                    borderColor: '#fed7aa',
                    borderRadius: 14,
                    padding: 12,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#9a3412', marginBottom: 4 }}>
                    WiHY Approach
                  </Text>
                  <Text style={{ fontSize: 13, color: '#111827' }}>{item.wihyApproach}</Text>
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
