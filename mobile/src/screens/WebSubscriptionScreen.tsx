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
import { colors, shadows, borderRadius } from '../theme/design-tokens';
import { checkoutService } from '../services/checkoutService';
import { useAuth } from '../context/AuthContext';

// Import CSS for web only
if (Platform.OS === 'web') {
  require('../styles/web-landing.css');
}

const isWeb = Platform.OS === 'web';

// Consumer Plans - Correct pricing from PRICING_QUICK_REFERENCE.md
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
    stripeLink: null, // No payment needed
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
    stripeLink: 'https://buy.stripe.com/YOUR_PREMIUM_LINK',
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
    stripeLink: 'https://buy.stripe.com/YOUR_FAMILY_BASIC_LINK',
    icon: 'people',
  },
  {
    id: 'family-premium',
    name: 'Family Premium',
    monthlyPrice: 34.99,
    yearlyPrice: 349,
    tagline: 'For entire households — no limits',
    features: [
      'Unlimited household members',
      'Every member gets their own login',
      'WIHY Coach (AI) included',
      'Instacart Pro included',
    ],
    popular: true,
    stripeLink: 'https://buy.stripe.com/YOUR_FAMILY_PREMIUM_LINK',
    icon: 'home',
  },
  {
    id: 'coach',
    name: 'Coach Platform',
    setupFee: 99.99,
    monthlyPrice: 29.99,
    tagline: 'For health & fitness professionals',
    features: [
      'Unlimited clients',
      'Meal plan and workout creation',
      'Progress tracking & reporting',
      'Full app access for yourself',
    ],
    stripeLink: 'https://buy.stripe.com/YOUR_COACH_LINK',
    icon: 'fitness',
  },
];

// B2B/Enterprise Plans
const B2B_PLANS = [
  {
    id: 'workplace-core',
    name: 'Workplace Core',
    pricePerUser: 3.00,
    minSeats: 25,
    tagline: 'Essential wellness for small teams',
    features: [
      'Basic health tracking',
      'Team wellness dashboard',
      'Monthly health reports',
      'Email support',
    ],
    icon: 'business',
  },
  {
    id: 'workplace-plus',
    name: 'Workplace Plus',
    pricePerUser: 5.00,
    minSeats: 50,
    tagline: 'Full wellness suite for growing teams',
    features: [
      'Full nutrition & fitness tools',
      'Admin portal',
      'Custom challenges',
      'Priority support',
    ],
    popular: true,
    icon: 'trending-up',
  },
  {
    id: 'corporate-enterprise',
    name: 'Enterprise',
    pricePerUser: 7.00,
    minSeats: 100,
    tagline: 'Complete solution for large organizations',
    features: [
      'SSO integration',
      'Custom branding',
      'Dedicated success manager',
      'API access',
    ],
    icon: 'globe',
  },
];

const VERTICAL_PLANS = [
  {
    id: 'k12-school',
    name: 'K-12 Schools',
    pricePerUser: 1.50,
    unit: 'student',
    icon: 'school',
    color: '#f59e0b',
  },
  {
    id: 'university',
    name: 'Universities',
    pricePerUser: 2.50,
    unit: 'student',
    icon: 'library',
    color: '#8b5cf6',
  },
  {
    id: 'hospital',
    name: 'Healthcare',
    pricePerUser: 5.00,
    unit: 'user',
    icon: 'medkit',
    color: '#ef4444',
  },
  {
    id: 'hospitality',
    name: 'Hospitality',
    pricePerUser: 4.00,
    unit: 'resident',
    icon: 'bed',
    color: '#06b6d4',
  },
];

type SubscriptionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Subscription'
>;

interface Props {
  navigation: SubscriptionScreenNavigationProp;
}

export const SubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('family-premium');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  
  const isDesktop = width >= 1024;
  const isTablet = width >= 768;

  const handleSubscribe = async (planId: string) => {
    const plan = CONSUMER_PLANS.find(p => p.id === planId);
    if (!plan) return;

    // Free plan - redirect to registration (no payment needed)
    if (planId === 'free') {
      if (!user?.email) {
        // Not logged in - go to registration with plan parameter
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = '/register?plan=free';
        } else {
          navigation.navigate('Register' as any, { plan: 'free' });
        }
      } else {
        // Already logged in with free plan
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('You are already on the Free plan. Explore the app or upgrade to unlock more features!');
        } else {
          Alert.alert('Free Plan', 'You are already on the Free plan. Explore the app or upgrade to unlock more features!');
        }
      }
      return;
    }

    // Paid plans - check if user is logged in
    if (!user?.email) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const proceed = window.confirm(
          'You need to be signed in to subscribe.\n\nWould you like to sign in now?'
        );
        if (proceed) {
          navigation.navigate('Login' as any);
        }
      } else {
        Alert.alert(
          'Sign In Required',
          'You need to be signed in to subscribe.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => navigation.navigate('Login' as any) },
          ]
        );
      }
      return;
    }

    setIsLoading(true);
    
    try {
      // Determine plan ID based on billing cycle
      const checkoutPlanId = billingCycle === 'yearly' && plan.yearlyPrice 
        ? `${planId}-yearly` 
        : planId;

      // Initiate checkout with the checkout service
      const response = await checkoutService.initiateCheckout(checkoutPlanId, user.email);
      
      if (response.success && response.checkoutUrl) {
        // Open Stripe checkout
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
  };

  const handleContactSales = () => {
    if (typeof window !== 'undefined') {
      window.location.href = 'mailto:enterprise@wihy.app?subject=Enterprise%20Inquiry';
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(/\.00$/, '');
  };

  // Web Navigation Header Component
  const WebNavHeader = () => (
    <nav className="web-top-nav">
      <div className="web-nav-left">
        <button onClick={() => navigation.navigate('WihyHome')} className="web-nav-item nav-home" type="button">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span>Home</span>
        </button>
        <button onClick={() => navigation.navigate('Health')} className="web-nav-item nav-health" type="button">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>Health</span>
        </button>
        <button onClick={() => navigation.navigate('Chat')} className="web-nav-item nav-chat" type="button">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span>Chat</span>
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

  // Web render with CSS navigation
  if (isWeb) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        {/* @ts-ignore */}
        <WebNavHeader />
        
        <div style={{ paddingTop: 60 }}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Section - Light Blue Gradient */}
            <View style={styles.heroSection}>
              <View style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}>
                <View style={styles.heroIconContainer}>
                  <Ionicons name="sparkles" size={48} color="#fff" />
                </View>
                <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
                <Text style={styles.heroSubtitle}>
                  Choose the plan that fits how you live — or how you coach.
                </Text>
              </View>
            </View>

            {/* Consumer Plans Section */}
            <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
              <Text style={styles.sectionLabel}>FOR INDIVIDUALS & FAMILIES</Text>
              <Text style={styles.sectionTitle}>Personal & Family Plans</Text>
              
              {/* Billing Toggle */}
              <View style={styles.billingToggleContainer}>
                <View style={styles.billingToggle}>
                  <Pressable
                    style={[
                      styles.billingOption,
                      billingCycle === 'monthly' && styles.billingOptionActive,
                    ]}
                    onPress={() => setBillingCycle('monthly')}
                  >
                    <Text style={[
                      styles.billingOptionText,
                      billingCycle === 'monthly' && styles.billingOptionTextActive,
                    ]}>Monthly</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.billingOption,
                      billingCycle === 'yearly' && styles.billingOptionActive,
                    ]}
                    onPress={() => setBillingCycle('yearly')}
                  >
                    <Text style={[
                      styles.billingOptionText,
                      billingCycle === 'yearly' && styles.billingOptionTextActive,
                    ]}>Yearly</Text>
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveBadgeText}>Save 20%</Text>
                    </View>
                  </Pressable>
                </View>
              </View>

              {/* Consumer Plan Cards */}
              <View style={[styles.plansGrid, isDesktop && styles.plansGridDesktop]}>
                {CONSUMER_PLANS.map((plan) => (
                  <View 
                    key={plan.id}
                    style={[
                      styles.planCard,
                      plan.popular && styles.planCardPopular,
                      isDesktop && styles.planCardDesktop,
                    ]}
                  >
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>Most Popular</Text>
                      </View>
                    )}
                    
                    <View style={styles.planHeader}>
                      <View style={[styles.planIconContainer, plan.popular && styles.planIconContainerPopular]}>
                        <Ionicons 
                          name={plan.icon as any} 
                          size={24} 
                          color={plan.popular ? '#fff' : colors.primary} 
                        />
                      </View>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planTagline}>{plan.tagline}</Text>
                    </View>

                    <View style={styles.pricingContainer}>
                      {plan.setupFee ? (
                        <>
                          <Text style={styles.priceAmount}>${formatPrice(plan.setupFee)}</Text>
                          <Text style={styles.pricePeriod}>setup + 1% commission</Text>
                        </>
                      ) : plan.monthlyPrice === 0 ? (
                        <>
                          <Text style={styles.priceAmount}>Free</Text>
                          <Text style={styles.pricePeriod}>forever</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.priceAmount}>
                            ${billingCycle === 'yearly' && plan.yearlyPrice 
                              ? formatPrice(plan.yearlyPrice / 12) 
                              : formatPrice(plan.monthlyPrice)}
                          </Text>
                          <Text style={styles.pricePeriod}>/month</Text>
                          {billingCycle === 'yearly' && plan.yearlyPrice && (
                            <Text style={styles.yearlyTotal}>
                              ${formatPrice(plan.yearlyPrice)}/year
                            </Text>
                          )}
                        </>
                      )}
                    </View>

                    <View style={styles.featuresContainer}>
                      {plan.features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.subscribeButton,
                        plan.popular && styles.subscribeButtonPopular,
                        pressed && styles.subscribeButtonPressed,
                        isLoading && styles.subscribeButtonDisabled,
                      ]}
                      onPress={() => handleSubscribe(plan.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={[
                          styles.subscribeButtonText,
                          plan.popular && styles.subscribeButtonTextPopular,
                        ]}>
                          {plan.monthlyPrice === 0 ? 'Get Started' : 'Subscribe'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>

            {/* B2B Plans Section */}
            <View style={[styles.section, styles.sectionB2B, isDesktop && styles.sectionDesktop]}>
              <Text style={styles.sectionLabel}>FOR BUSINESSES & ORGANIZATIONS</Text>
              <Text style={styles.sectionTitle}>Enterprise Solutions</Text>
              <Text style={styles.sectionSubtitle}>
                Custom wellness programs for teams of all sizes
              </Text>

              <View style={[styles.plansGrid, isDesktop && styles.plansGridDesktop]}>
                {B2B_PLANS.map((plan) => (
                  <View 
                    key={plan.id}
                    style={[
                      styles.planCard,
                      styles.planCardB2B,
                      plan.popular && styles.planCardPopular,
                      isDesktop && styles.planCardDesktop,
                    ]}
                  >
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>Most Popular</Text>
                      </View>
                    )}
                    
                    <View style={styles.planHeader}>
                      <View style={[styles.planIconContainer, styles.planIconContainerB2B]}>
                        <Ionicons 
                          name={plan.icon as any} 
                          size={24} 
                          color="#fff" 
                        />
                      </View>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planTagline}>{plan.tagline}</Text>
                    </View>

                    <View style={styles.pricingContainer}>
                      <Text style={styles.priceAmount}>${formatPrice(plan.pricePerUser)}</Text>
                      <Text style={styles.pricePeriod}>/user/month</Text>
                      <Text style={styles.minSeats}>Min {plan.minSeats} seats</Text>
                    </View>

                    <View style={styles.featuresContainer}>
                      {plan.features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.subscribeButton,
                        styles.contactSalesButton,
                        pressed && styles.subscribeButtonPressed,
                      ]}
                      onPress={handleContactSales}
                    >
                      <Text style={styles.contactSalesText}>Contact Sales</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>

            {/* Vertical Markets */}
            <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
              <Text style={styles.sectionLabel}>SPECIALIZED SOLUTIONS</Text>
              <Text style={styles.sectionTitle}>Industry-Specific Plans</Text>

              <View style={[styles.verticalsGrid, isDesktop && styles.verticalsGridDesktop]}>
                {VERTICAL_PLANS.map((plan) => (
                  <Pressable 
                    key={plan.id}
                    style={({ pressed }) => [
                      styles.verticalCard,
                      pressed && styles.verticalCardPressed,
                    ]}
                    onPress={handleContactSales}
                  >
                    <View style={[styles.verticalIconContainer, { backgroundColor: plan.color }]}>
                      <Ionicons name={plan.icon as any} size={28} color="#fff" />
                    </View>
                    <Text style={styles.verticalName}>{plan.name}</Text>
                    <Text style={styles.verticalTagline}>{plan.tagline}</Text>
                    <Text style={styles.contactSalesText}>Contact Sales for Enterprise Pricing</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* FAQ Section */}
            <View style={[styles.section, styles.faqSection, isDesktop && styles.sectionDesktop]}>
              <Text style={styles.sectionLabel}>FREQUENTLY ASKED</Text>
              <Text style={styles.sectionTitle}>Questions?</Text>
              <Text style={styles.infoText}>
                Contact us at support@wihy.app or visit our FAQ for more information about plans and billing.
              </Text>
            </View>
          </ScrollView>
        </div>
      </div>
    );
  }

  // Native app render
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Native Header with Logo */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => navigation.navigate('WihyHome')} 
          style={({ pressed }) => [styles.logoButton, pressed && styles.logoButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go to WiHY Home"
        >
          <Image
            source={require('../../assets/Logo_wihy.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </Pressable>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <Pressable 
          onPress={() => navigation.goBack()} 
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section - Light Blue Gradient */}
        <View style={styles.heroSection}>
          <View style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}>
            <View style={styles.heroIconContainer}>
              <Ionicons name="sparkles" size={48} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
            <Text style={styles.heroSubtitle}>
              Choose the plan that fits how you live — or how you coach.
            </Text>
          </View>
        </View>

        {/* Consumer Plans Section */}
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionLabel}>FOR INDIVIDUALS & FAMILIES</Text>
          <Text style={styles.sectionTitle}>Personal & Family Plans</Text>
          
          {/* Billing Toggle */}
          <View style={styles.billingToggleContainer}>
            <View style={styles.billingToggle}>
              <Pressable
                style={[
                  styles.billingOption,
                  billingCycle === 'monthly' && styles.billingOptionActive,
                ]}
                onPress={() => setBillingCycle('monthly')}
              >
                <Text style={[
                  styles.billingOptionText,
                  billingCycle === 'monthly' && styles.billingOptionTextActive,
                ]}>Monthly</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.billingOption,
                  billingCycle === 'yearly' && styles.billingOptionActive,
                ]}
                onPress={() => setBillingCycle('yearly')}
              >
                <Text style={[
                  styles.billingOptionText,
                  billingCycle === 'yearly' && styles.billingOptionTextActive,
                ]}>Yearly</Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>Save 36%</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Consumer Plans Grid */}
          <View style={[
            styles.plansGrid,
            isTablet && styles.plansGridTablet,
            isDesktop && styles.plansGridDesktop,
          ]}>
            {CONSUMER_PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const displayPrice = billingCycle === 'yearly' && plan.yearlyPrice 
                ? plan.yearlyPrice 
                : plan.monthlyPrice;
              const displayPeriod = billingCycle === 'yearly' ? 'year' : 'month';
              
              return (
                <Pressable
                  key={plan.id}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                    plan.popular && styles.planCardPopular,
                  ]}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Ionicons name="star" size={14} color="#fff" />
                      <Text style={styles.popularBadgeText}>Most Popular</Text>
                    </View>
                  )}

                  <View style={[styles.planHeader, plan.popular && styles.planHeaderPopular]}>
                    <View style={[styles.planIconContainer, isSelected && styles.planIconContainerSelected]}>
                      <Ionicons 
                        name={plan.icon as any} 
                        size={24} 
                        color={isSelected ? '#fff' : colors.primary} 
                      />
                    </View>
                    <Text style={styles.planName}>{plan.name}</Text>
                  </View>

                  <View style={styles.pricingContainer}>
                    {plan.setupFee && (
                      <Text style={styles.setupFee}>
                        ${formatPrice(plan.setupFee)} setup fee
                      </Text>
                    )}
                    <View style={styles.priceRow}>
                      <Text style={styles.priceCurrency}>$</Text>
                      <Text style={styles.priceAmount}>{formatPrice(displayPrice)}</Text>
                      <Text style={styles.pricePeriod}>/{displayPeriod}</Text>
                    </View>
                    {billingCycle === 'yearly' && plan.yearlyPrice && (
                      <Text style={styles.yearlyNote}>
                        billed annually
                      </Text>
                    )}
                  </View>

                  <Text style={styles.planTagline}>{plan.tagline}</Text>

                  <View style={styles.featuresList}>
                    {plan.features.map((feature, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <View style={styles.featureCheck}>
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.ctaButton,
                      isSelected && styles.ctaButtonSelected,
                      pressed && styles.ctaButtonPressed,
                      isLoading && styles.ctaButtonLoading,
                    ]}
                    onPress={() => handleSubscribe(plan.id)}
                    disabled={isLoading}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <ActivityIndicator color={isSelected ? '#fff' : colors.primary} size="small" />
                    ) : (
                      <>
                        <Text style={[
                          styles.ctaButtonText,
                          isSelected && styles.ctaButtonTextSelected,
                        ]}>
                          {isSelected ? 'Get Started' : 'Select Plan'}
                        </Text>
                        {isSelected && (
                          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                        )}
                      </>
                    )}
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* B2B Section - Light Blue Background */}
        <View style={styles.b2bSection}>
          <View style={[styles.b2bContent, isDesktop && styles.b2bContentDesktop]}>
            <View style={styles.b2bHeader}>
              <View style={styles.b2bIconContainer}>
                <Ionicons name="business" size={32} color={colors.primary} />
              </View>
              <Text style={styles.b2bLabel}>FOR ORGANIZATIONS</Text>
              <Text style={styles.b2bTitle}>Enterprise & B2B Solutions</Text>
              <Text style={styles.b2bSubtitle}>
                Empower your team, students, or community with wellness at scale
              </Text>
            </View>

            {/* B2B Plans Grid */}
            <View style={[
              styles.b2bPlansGrid,
              isTablet && styles.b2bPlansGridTablet,
            ]}>
              {B2B_PLANS.map((plan) => (
                <View key={plan.id} style={[styles.b2bCard, plan.popular && styles.b2bCardPopular]}>
                  {plan.popular && (
                    <View style={styles.b2bPopularBadge}>
                      <Text style={styles.b2bPopularBadgeText}>Recommended</Text>
                    </View>
                  )}
                  <View style={styles.b2bCardIcon}>
                    <Ionicons name={plan.icon as any} size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.b2bCardName}>{plan.name}</Text>
                  <View style={styles.b2bPriceRow}>
                    <Text style={styles.b2bPrice}>${formatPrice(plan.pricePerUser)}</Text>
                    <Text style={styles.b2bPriceUnit}>/user/mo</Text>
                  </View>
                  <Text style={styles.b2bMinSeats}>Min. {plan.minSeats} seats</Text>
                  <Text style={styles.b2bTagline}>{plan.tagline}</Text>
                  <View style={styles.b2bFeatures}>
                    {plan.features.map((feature, idx) => (
                      <View key={idx} style={styles.b2bFeatureRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.b2bFeatureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {/* Industry Verticals */}
            <View style={styles.verticalsSection}>
              <Text style={styles.verticalsTitle}>Industry-Specific Solutions</Text>
              <View style={[styles.verticalsGrid, isTablet && styles.verticalsGridTablet]}>
                {VERTICAL_PLANS.map((plan) => (
                  <View key={plan.id} style={styles.verticalCard}>
                    <View style={[styles.verticalIcon, { backgroundColor: plan.color + '15' }]}>
                      <Ionicons name={plan.icon as any} size={28} color={plan.color} />
                    </View>
                    <Text style={styles.verticalName}>{plan.name}</Text>
                    <Text style={styles.verticalPrice}>
                      ${formatPrice(plan.pricePerUser)}<Text style={styles.verticalPriceUnit}>/{plan.unit}/mo</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Contact Sales CTA */}
            <Pressable
              style={({ pressed }) => [styles.contactSalesButton, pressed && styles.contactSalesButtonPressed]}
              onPress={handleContactSales}
            >
              <Ionicons name="mail" size={20} color="#fff" />
              <Text style={styles.contactSalesText}>Contact Sales for Enterprise Pricing</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Trust Section */}
        <View style={[styles.trustSection, isDesktop && styles.trustSectionDesktop]}>
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              <Text style={styles.trustText}>Secure Payments</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <Text style={styles.trustText}>Cancel Anytime</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="card" size={20} color={colors.primary} />
              <Text style={styles.trustText}>30-Day Guarantee</Text>
            </View>
          </View>
          <View style={styles.poweredBy}>
            <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
            <Text style={styles.poweredByText}>Powered by Stripe</Text>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={[styles.infoSection, isDesktop && styles.infoSectionDesktop]}>
          <Text style={styles.infoTitle}>Questions?</Text>
          <Text style={styles.infoText}>
            Contact us at support@wihy.app or visit our FAQ for more information about plans and billing.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoButton: {
    padding: 4,
    borderRadius: borderRadius.md,
  },
  logoButtonPressed: {
    opacity: 0.7,
  },
  headerLogo: {
    width: 80,
    height: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPressed: {
    backgroundColor: colors.buttonSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },

  // Hero Section - Primary Blue Gradient (matching mobile)
  heroSection: {
    backgroundColor: `${colors.primary}15`,
    ...Platform.select({
      web: {
        background: `linear-gradient(135deg, ${colors.primary}12 0%, ${colors.primary}20 50%, ${colors.primary}30 100%)`,
      } as any,
    }),
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  heroContentDesktop: {
    maxWidth: 800,
  },
  heroIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...shadows.lg,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 18,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 28,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
  },
  sectionDesktop: {
    paddingHorizontal: 40,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 32,
  },

  // Billing Toggle
  billingToggleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: colors.buttonSecondary,
    borderRadius: borderRadius.pill,
    padding: 4,
  },
  billingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: borderRadius.pill,
  },
  billingOptionActive: {
    backgroundColor: colors.primary,
  },
  billingOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  billingOptionTextActive: {
    color: '#fff',
  },
  saveBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  saveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4CAF50',
  },

  // Plans Grid
  plansGrid: {
    gap: 16,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  plansGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  plansGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: 20,
  },

  // Plan Card
  planCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 320,
      },
    }),
    ...shadows.sm,
  },
  planCardSelected: {
    borderColor: colors.primary,
    ...shadows.md,
  },
  planCardPopular: {
    borderColor: '#4CAF50',
    marginTop: 12,
  },
  popularBadge: {
    position: 'absolute',
    top: -14,
    left: '50%',
    transform: [{ translateX: -55 }],
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Plan Header
  planHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  planHeaderPopular: {
    marginTop: 8,
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  planIconContainerSelected: {
    backgroundColor: colors.primary,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },

  // Pricing
  pricingContainer: {
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 70,
  },
  setupFee: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  pricePeriod: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 2,
  },
  yearlyNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Tagline
  planTagline: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    minHeight: 36,
  },

  // Features
  featuresList: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  featureText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },

  // CTA Button
  ctaButton: {
    backgroundColor: colors.buttonSecondary,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ctaButtonPressed: {
    opacity: 0.9,
  },
  ctaButtonLoading: {
    opacity: 0.7,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  ctaButtonTextSelected: {
    color: '#fff',
  },

  // B2B Section - Primary Blue Background (matching mobile)
  b2bSection: {
    backgroundColor: `${colors.primary}08`,
    ...Platform.select({
      web: {
        background: `linear-gradient(180deg, ${colors.primary}08 0%, ${colors.primary}15 100%)`,
      } as any,
    }),
    paddingVertical: 56,
    paddingHorizontal: 16,
  },
  b2bContent: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  b2bContentDesktop: {
    maxWidth: 1200,
  },
  b2bHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  b2bIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...shadows.sm,
  },
  b2bLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  b2bTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  b2bSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 500,
    lineHeight: 24,
  },

  // B2B Plans Grid
  b2bPlansGrid: {
    gap: 16,
    marginBottom: 40,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  b2bPlansGridTablet: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 0,
  },

  // B2B Card
  b2bCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 320,
      },
    }),
    ...shadows.sm,
  },
  b2bCardPopular: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  b2bPopularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  b2bPopularBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  b2bCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  b2bCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  b2bPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  b2bPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  b2bPriceUnit: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 4,
  },
  b2bMinSeats: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  b2bTagline: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  b2bFeatures: {
    gap: 8,
  },
  b2bFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  b2bFeatureText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },

  // Verticals Section
  verticalsSection: {
    marginBottom: 40,
    width: '100%',
    paddingHorizontal: 16,
  },
  verticalsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  verticalsGrid: {
    gap: 16,
    alignItems: 'center',
    width: '100%',
  },
  verticalsGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  verticalCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verticalIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  verticalName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  verticalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  verticalPriceUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },

  // Contact Sales Button
  contactSalesButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: borderRadius.md,
    gap: 12,
    alignSelf: 'center',
    ...shadows.sm,
  },
  contactSalesButtonPressed: {
    opacity: 0.9,
  },
  contactSalesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Trust Section
  trustSection: {
    paddingVertical: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  trustSectionDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  trustDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  trustText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    opacity: 0.7,
  },
  poweredByText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Info Section
  infoSection: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: colors.buttonSecondary,
  },
  infoSectionDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
