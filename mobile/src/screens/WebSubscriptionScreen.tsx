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

// Import CSS for web only
if (Platform.OS === 'web') {
  require('../styles/web-landing.css');
  require('../styles/pricing.css');
}

const isWeb = Platform.OS === 'web';

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

type SubscriptionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Subscription'>;

interface Props {
  navigation: SubscriptionScreenNavigationProp;
}

export const SubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const isDesktop = width >= 1024;
  const isTablet = width >= 640;

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(/\.00$/, '');
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

    // Paid plans - check if user is logged in
    if (!user?.email) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const proceed = window.confirm('You need to be signed in to subscribe.\n\nWould you like to sign in now?');
        if (proceed) {
          navigation.navigate('Login' as any);
        }
      } else {
        Alert.alert('Sign In Required', 'You need to be signed in to subscribe.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login' as any) },
        ]);
      }
      return;
    }

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
  };

  // Web Navigation Header
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
                <img 
                  src={require('../../assets/whatishealthyspinner.gif')} 
                  alt="WiHY" 
                  style={{ width: 48, height: 48 }}
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
                    <Ionicons name={plan.icon as any} size={28} color={colors.primary} />
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
                        <span className="pricing-amount">Free</span>
                        <span className="pricing-period"> forever</span>
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
                        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
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

          {/* B2B Link Section */}
          <section className="pricing-section pricing-section-alt">
            <div className="pricing-cta-box">
              <Ionicons name="business" size={32} color={colors.primary} />
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
            <p>Questions? Contact us at <a href="mailto:support@wihy.app">support@wihy.app</a></p>
          </footer>
        </div>
      </div>
    );
  }

  // Native app render
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable 
          onPress={() => navigation.navigate('WihyHome')} 
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
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
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
