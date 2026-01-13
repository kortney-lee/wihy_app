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

// SVG icons for web (Ionicons don't render properly on web)
const WebIcon = ({ name, size = 24, color = '#3b82f6' }: { name: string; size?: number; color?: string }) => {
  const icons: Record<string, string> = {
    'business': 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z',
    'trending-up': 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z',
    'globe': 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z',
    'school': 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
    'library': 'M12 11.55C9.64 9.35 6.48 8 3 8v11c3.48 0 6.64 1.35 9 3.55 2.36-2.19 5.52-3.55 9-3.55V8c-3.48 0-6.64 1.35-9 3.55zM12 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z',
    'medkit': 'M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm6 11h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z',
    'bed': 'M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z',
    'checkmark-circle': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    'person': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    'people': 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    'mail': 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  };
  
  const path = icons[name] || icons['business'];
  
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d={path} />
    </svg>
  );
};

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
        <button onClick={() => navigation.navigate('Main')} className="web-nav-item nav-home" type="button">
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
                <Image 
                  source={require('../../assets/whatishealthyspinner.gif')} 
                  style={{ width: 88, height: 88 }}
                  resizeMode="cover"
                />
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
                    <WebIcon name={plan.icon} size={28} color={colors.primary} />
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
                        <WebIcon name="checkmark-circle" size={18} color={SUCCESS_GREEN} />
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
                    <WebIcon name={plan.icon} size={28} color={plan.color} />
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
              <WebIcon name="mail" size={32} color={colors.primary} />
              <h3>Ready to get started?</h3>
              <p>Contact our sales team for a custom quote tailored to your organization.</p>
              <button
                onClick={handleContactSales}
                className="pricing-btn pricing-btn-primary pricing-btn-lg"
                type="button"
              >
                <WebIcon name="mail" size={20} color="#fff" />
                Contact Sales
              </button>
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
              <a href="mailto:enterprise@wihy.app">Contact Sales</a>
            </div>
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
