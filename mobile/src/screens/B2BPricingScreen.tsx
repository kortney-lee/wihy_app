import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { colors, borderRadius } from '../theme/design-tokens';
import { useAuth } from '../context/AuthContext';

// Import CSS for web only
if (Platform.OS === 'web') {
  require('../styles/web-landing.css');
  require('../styles/pricing.css');
}

const isWeb = Platform.OS === 'web';
const SUCCESS_GREEN = '#22c55e';

// B2B/Enterprise Plans - No pricing displayed (contact sales model)
const B2B_PLANS = [
  {
    id: 'workplace-core',
    name: 'Workplace Core',
    tagline: 'Essential wellness for small teams',
    description: 'Perfect for teams of 25+ employees looking to kickstart their wellness journey.',
    features: [
      'Basic health tracking',
      'Team wellness dashboard',
      'Monthly health reports',
      'Email support',
      'Onboarding assistance',
    ],
    icon: 'business',
  },
  {
    id: 'workplace-plus',
    name: 'Workplace Plus',
    tagline: 'Full wellness suite for growing teams',
    description: 'Comprehensive solution for mid-sized organizations with 50+ employees.',
    features: [
      'Full nutrition & fitness tools',
      'Admin portal with analytics',
      'Custom challenges & programs',
      'Priority support',
      'Quarterly business reviews',
    ],
    popular: true,
    icon: 'trending-up',
  },
  {
    id: 'corporate-enterprise',
    name: 'Enterprise',
    tagline: 'Complete solution for large organizations',
    description: 'Tailored enterprise deployment for organizations with 100+ employees.',
    features: [
      'SSO & SAML integration',
      'Custom branding & white-label',
      'Dedicated success manager',
      'Full API access',
      'Custom integrations',
      'SLA guarantees',
    ],
    icon: 'globe',
  },
];

const VERTICAL_PLANS = [
  {
    id: 'k12-school',
    name: 'K-12 Schools',
    tagline: 'Student wellness programs',
    description: 'Age-appropriate health education and tracking for students.',
    icon: 'school',
    color: '#f59e0b',
  },
  {
    id: 'university',
    name: 'Universities',
    tagline: 'Campus-wide health initiatives',
    description: 'Comprehensive wellness programs for students and staff.',
    icon: 'library',
    color: '#8b5cf6',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    tagline: 'Patient & staff wellness',
    description: 'HIPAA-compliant solutions for healthcare organizations.',
    icon: 'medkit',
    color: '#ef4444',
  },
  {
    id: 'hospitality',
    name: 'Hospitality',
    tagline: 'Guest & resident programs',
    description: 'Wellness amenities for hotels, resorts, and senior living.',
    icon: 'bed',
    color: '#06b6d4',
  },
];

type B2BPricingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'B2BPricing'>;

interface Props {
  navigation: B2BPricingScreenNavigationProp;
}

export const B2BPricingScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  
  const isDesktop = width >= 1024;
  const isTablet = width >= 768;

  const handleContactSales = () => {
    if (typeof window !== 'undefined') {
      window.location.href = 'mailto:enterprise@wihy.app?subject=Enterprise%20Inquiry';
    }
  };

  const handleRequestDemo = () => {
    if (typeof window !== 'undefined') {
      window.location.href = 'mailto:enterprise@wihy.app?subject=Request%20Demo';
    }
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
        <button onClick={() => navigation.navigate('Main' as any)} className="web-nav-item nav-health" type="button">
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
      </div>
      <div className="web-nav-right">
        <button onClick={() => {
          if (user) {
            navigation.navigate('Profile');
          } else {
            navigation.navigate('Main' as any);
          }
        }} className="web-nav-item profile" type="button">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </button>
      </div>
    </nav>
  );

  // Web render
  if (isWeb) {
    return (
      <div className="pricing-page">
        {/* @ts-ignore */}
        <WebNavHeader />
        
        <div className="pricing-content">
          {/* Hero Section */}
          <div className="pricing-hero pricing-hero-b2b">
            <div className="pricing-hero-inner">
              <div className="pricing-hero-icon">
                <Ionicons name="business" size={48} color="#fff" />
              </div>
              <h1 className="pricing-hero-title">Enterprise Solutions</h1>
              <p className="pricing-hero-subtitle">
                Custom wellness programs for teams of all sizes
              </p>
              <button 
                onClick={() => navigation.navigate('Subscription')}
                className="pricing-link-btn"
                type="button"
              >
                ← View Personal Plans
              </button>
            </div>
          </div>

          {/* B2B Plans */}
          <section className="pricing-section">
            <p className="pricing-section-label">FOR BUSINESSES</p>
            <h2 className="pricing-section-title">Workplace Wellness</h2>

            <div className={`pricing-grid ${isDesktop ? 'pricing-grid-3' : isTablet ? 'pricing-grid-2' : 'pricing-grid-1'}`}>
              {B2B_PLANS.map((plan) => (
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
                    <span className="pricing-custom">Custom Pricing</span>
                  </div>
                  <p className="pricing-description">{plan.description}</p>

                  <ul className="pricing-features">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="pricing-feature">
                        <Ionicons name="checkmark-circle" size={18} color={SUCCESS_GREEN} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleContactSales}
                    className="pricing-btn pricing-btn-outline"
                    type="button"
                  >
                    Get a Quote
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Vertical Markets */}
          <section className="pricing-section pricing-section-alt">
            <p className="pricing-section-label">INDUSTRY SOLUTIONS</p>
            <h2 className="pricing-section-title">Specialized Plans</h2>

            <div className={`pricing-grid ${isDesktop ? 'pricing-grid-4' : isTablet ? 'pricing-grid-2' : 'pricing-grid-1'}`}>
              {VERTICAL_PLANS.map((plan) => (
                <div 
                  key={plan.id}
                  className="pricing-card pricing-card-vertical"
                  style={{ borderTopColor: plan.color }}
                >
                  <div 
                    className="pricing-card-icon-colored"
                    style={{ backgroundColor: `${plan.color}15` }}
                  >
                    <Ionicons name={plan.icon as any} size={28} color={plan.color} />
                  </div>
                  <h3 className="pricing-card-name">{plan.name}</h3>
                  <p className="pricing-card-tagline">{plan.tagline}</p>
                  <p className="pricing-description">{plan.description}</p>

                  <button
                    onClick={handleRequestDemo}
                    className="pricing-btn pricing-btn-outline"
                    type="button"
                  >
                    Request Demo
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="pricing-section pricing-cta-section">
            <div className="pricing-cta-box">
              <Ionicons name="mail" size={32} color={colors.primary} />
              <h3>Ready to get started?</h3>
              <p>Contact our sales team for a custom quote tailored to your organization.</p>
              <button
                onClick={handleContactSales}
                className="pricing-btn pricing-btn-primary pricing-btn-lg"
                type="button"
              >
                <Ionicons name="mail" size={20} color="#fff" />
                Contact Sales
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="pricing-footer">
            <p>Questions? Contact us at <a href="mailto:enterprise@wihy.app">enterprise@wihy.app</a></p>
          </footer>
        </div>
      </div>
    );
  }

  // Native render (simplified for now)
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Enterprise Solutions</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.nativeContent}>
        <Text style={styles.nativeText}>
          For enterprise pricing, please contact our sales team at enterprise@wihy.app
        </Text>
      </View>
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
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  nativeContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default B2BPricingScreen;
