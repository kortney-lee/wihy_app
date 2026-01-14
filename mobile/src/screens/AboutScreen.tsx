import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import MultiAuthLogin from '../components/auth/MultiAuthLogin';

// Import CSS for web only
if (Platform.OS === 'web') {
  require('../styles/web-landing.css');
  require('../styles/pricing.css');
}

const isWeb = Platform.OS === 'web';

const WIHY_GREEN = '#4cbb17';
const LIGHT_GRAY = '#f5f5f5';
const DARK_GRAY = '#1a1a1a';
const BORDER_GRAY = '#e5e7eb';

interface ExpandedSections {
  [key: string]: boolean;
}

export default function AboutScreen() {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleKickstarterPress = () => {
    Linking.openURL('https://www.kickstarter.com/projects/wihy/wihy-a-new-way-to-explore-food-knowledge-and-choices');
  };

  const handlePrivacyPress = () => {
    navigation.navigate('Privacy' as any);
  };

  const handleTermsPress = () => {
    navigation.navigate('Terms' as any);
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
        <button onClick={() => navigation.navigate('Subscription')} className="web-nav-item nav-health" type="button">
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
        <button onClick={() => navigation.navigate('About' as any)} className="web-nav-item nav-about active" type="button">
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
            setShowLoginModal(true);
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
          <div className="pricing-hero" style={{ background: 'linear-gradient(135deg, #e0f7e6 0%, #f0fdf4 100%)' }}>
            <div className="pricing-hero-inner">
              <div className="pricing-hero-icon">
                <Image 
                  source={require('../../assets/whatishealthyspinner.gif')} 
                  style={{ width: 88, height: 88 }}
                  resizeMode="contain"
                />
              </div>
              <h1 className="pricing-hero-title" style={{ color: DARK_GRAY }}>About WIHY</h1>
              <p className="pricing-hero-subtitle" style={{ color: '#666' }}>
                The World's Smartest Health Search Engine
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                <span style={{ background: WIHY_GREEN, color: '#fff', padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>Health Search</span>
                <span style={{ background: WIHY_GREEN, color: '#fff', padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>Evidence Based</span>
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <section style={{ padding: '48px 24px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: DARK_GRAY, marginBottom: '16px', textAlign: 'center' }}>Our Mission</h2>
            <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.6, textAlign: 'center', marginBottom: '24px' }}>
              Search, seek, and ask to understand what you eat through food and ingredient scanning. WIHY lets you search food the same way you search the internet, but with evidence instead of opinions.
            </p>
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={handleKickstarterPress}
                className="pricing-btn pricing-btn-primary pricing-btn-lg"
                type="button"
              >
                Join the WIHY Beta
              </button>
            </div>
          </section>

          {/* Features Grid */}
          <section style={{ padding: '48px 24px', background: '#f8fafc' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: DARK_GRAY, marginBottom: '32px', textAlign: 'center' }}>What WIHY Does</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
              
              {/* Health Search */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
                <div style={{ width: '48px', height: '48px', background: '#e0f7e6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill={WIHY_GREEN}>
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: DARK_GRAY, marginBottom: '8px' }}>Health Search</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
                  Ask health and nutrition questions and get research-backed answers. Powered by 35+ million scientific research articles.
                </p>
              </div>

              {/* Universal Scanning */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
                <div style={{ width: '48px', height: '48px', background: '#e0f7e6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill={WIHY_GREEN}>
                    <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: DARK_GRAY, marginBottom: '8px' }}>Universal Scanning</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
                  Scan barcodes, take photos, upload ingredients, or import receipts. WIHY detects, verifies, and analyzes automatically.
                </p>
              </div>

              {/* Nutrition Analysis */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
                <div style={{ width: '48px', height: '48px', background: '#e0f7e6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill={WIHY_GREEN}>
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: DARK_GRAY, marginBottom: '8px' }}>Nutrition Analysis</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
                  Understand nutrition in plain language. Analyze macros, micros, additives, processing level, and portion impact.
                </p>
              </div>

              {/* Predictive Insights */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
                <div style={{ width: '48px', height: '48px', background: '#e0f7e6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill={WIHY_GREEN}>
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: DARK_GRAY, marginBottom: '8px' }}>Predictive Insights</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
                  See where your habits are heading. Detect patterns, predict outcomes, and get early awareness of health shifts.
                </p>
              </div>

              {/* Fact Check */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
                <div style={{ width: '48px', height: '48px', background: '#e0f7e6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill={WIHY_GREEN}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: DARK_GRAY, marginBottom: '8px' }}>Fact Check</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
                  Verify health claims with real evidence. See strength of evidence, level of certainty, and what research actually supports.
                </p>
              </div>

              {/* Connected Platform */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
                <div style={{ width: '48px', height: '48px', background: '#e0f7e6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill={WIHY_GREEN}>
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: DARK_GRAY, marginBottom: '8px' }}>Connected Platform</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
                  Progress tracking, nutrition, research, fitness, and coaching unified in one place for you and your family.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section style={{ padding: '48px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: DARK_GRAY, marginBottom: '16px' }}>Experience WIHY Intelligence</h2>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
              WIHY is in early access. Join the beta and be among the first to experience intelligent health search.
            </p>
            <button 
              onClick={handleKickstarterPress}
              className="pricing-btn pricing-btn-primary pricing-btn-lg"
              type="button"
            >
              Join the WIHY Beta
            </button>
          </section>

          {/* Footer */}
          <footer className="pricing-footer">
            <p className="pricing-footer-copyright">© 2026 WIHY. All rights reserved.</p>
            <p className="pricing-footer-disclaimer">This page is for education and information only and is not a substitute for professional medical advice.</p>
            <div className="pricing-footer-links">
              <a href="/privacy" onClick={(e) => { e.preventDefault(); handlePrivacyPress(); }}>Privacy Policy</a>
              <span className="pricing-footer-separator">•</span>
              <a href="/terms" onClick={(e) => { e.preventDefault(); handleTermsPress(); }}>Terms of Service</a>
              <span className="pricing-footer-separator">•</span>
              <a href="mailto:info@wihy.ai">Contact Us</a>
            </div>
          </footer>
        </div>

        {/* Login Modal */}
        <MultiAuthLogin 
          visible={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
          onSignIn={() => setShowLoginModal(false)} 
        />
      </div>
    );
  }

  // Native render - existing implementation
  const FeatureSection = ({ id, title, tagline, details, icon }: any) => (
    <View style={styles.featureSection}>
      <Pressable
        onPress={() => toggleSection(id)}
        style={[styles.featureTitleContainer, { backgroundColor: LIGHT_GRAY }]}
      >
        <View style={styles.featureTitleContent}>
          <Ionicons name={icon} size={24} color={WIHY_GREEN} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureTagline}>{tagline}</Text>
          </View>
        </View>
        <Ionicons
          name={expandedSections[id] ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={WIHY_GREEN}
        />
      </Pressable>

      {expandedSections[id] && (
        <View style={styles.featureDetailsContainer}>
          {details.map((detail: any, idx: number) => (
            <View key={idx}>
              {detail.heading && (
                <Text style={styles.detailHeading}>{detail.heading}</Text>
              )}
              <Text style={styles.detailText}>{detail.text}</Text>
              {detail.items && (
                <View style={styles.detailItemsList}>
                  {detail.items.map((item: string, i: number) => (
                    <View key={i} style={styles.detailItem}>
                      <Text style={styles.detailItemBullet}>•</Text>
                      <Text style={styles.detailItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const CTAButton = ({ onPress, text }: any) => (
    <Pressable onPress={onPress} style={styles.ctaButton}>
      <Text style={styles.ctaButtonText}>{text}</Text>
    </Pressable>
  );

  const PlatformFeature = ({ title, description, icon }: any) => (
    <View style={styles.platformFeatureCard}>
      <View style={styles.platformFeatureIconContainer}>
        <Ionicons name={icon} size={32} color={WIHY_GREEN} />
      </View>
      <Text style={styles.platformFeatureTitle}>{title}</Text>
      <Text style={styles.platformFeatureDescription}>{description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK_GRAY} />
        </Pressable>
        <Text style={styles.headerTitle}>About WIHY</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={['#e0f7e6', '#f0fdf4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <Text style={styles.heroTitle}>WIHY</Text>
          <Text style={styles.heroSubtitle}>The World's Smartest Health Search Engine</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Health Search</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Evidence Based</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Main CTA */}
        <View style={styles.mainCTASection}>
          <Text style={styles.mainCTAText}>
            Search, seek, and ask to understand what you eat through food and ingredient scanning.
          </Text>
          <CTAButton onPress={handleKickstarterPress} text="Join the WIHY Beta" />
        </View>

        {/* Features */}
        <FeatureSection
          id="health-search"
          title="Health Search"
          tagline="Explore food with evidence instead of opinions"
          icon="search"
          details={[
            { text: 'WIHY lets you search food the same way you search the internet, but with evidence instead of opinions.' },
            { text: 'Ask health and nutrition questions and get research-backed answers.' },
            { heading: 'Powered by Intelligence:', items: [
              'Fact-checking across 35+ million scientific research articles',
              'Analysis of 4+ million verified food and ingredient records',
              'Government-funded nutrition and health data',
            ]},
          ]}
        />

        <FeatureSection
          id="universal-scanning"
          title="Universal Scanning"
          tagline="Instantly understand food and ingredients"
          icon="camera"
          details={[
            { text: 'Scan a barcode, take a photo, upload ingredients, or import a receipt and WIHY breaks it down into clear, understandable insights.' },
            { heading: 'How It Works:', items: [
              'Barcode decoding to recognize packaged products',
              'Food photography to identify meals and whole foods',
              'Ingredient OCR to read and analyze ingredient lists',
            ]},
          ]}
        />

        <FeatureSection
          id="nutrition-analysis"
          title="Nutrition Analysis"
          tagline="Understand nutrition in plain language"
          icon="leaf"
          details={[
            { text: 'After you scan food with WIHY, the system automatically analyzes what you are eating and explains it in plain language.' },
            { heading: 'What WIHY Analyzes:', items: [
              'Macronutrients (carbohydrates, protein, fats, fiber)',
              'Micronutrients (vitamins and minerals)',
              'Added sugars, sweeteners, and additives',
            ]},
          ]}
        />

        {/* Platform Section */}
        <View style={styles.platformSection}>
          <Text style={styles.platformTitle}>One Connected Platform</Text>
          <Text style={styles.platformSubtitle}>
            Progress tracking, nutrition, research, fitness, and coaching unified in one place.
          </Text>
          <View style={styles.platformFeatures}>
            <PlatformFeature title="My Progress" description="Track how your habits change over time." icon="trending-up" />
            <PlatformFeature title="Consumption" description="Track meals and groceries in one place." icon="restaurant" />
            <PlatformFeature title="Research" description="Search nutrition research without reading papers." icon="library" />
            <PlatformFeature title="Fitness" description="Generate workout plans for your goals." icon="fitness" />
          </View>
        </View>

        {/* Footer CTA */}
        <View style={styles.footerCTASection}>
          <Text style={styles.footerCTATitle}>Experience WIHY Intelligence</Text>
          <Text style={styles.footerCTASubtitle}>
            WIHY is in early access. Join the beta today.
          </Text>
          <CTAButton onPress={handleKickstarterPress} text="Join the WIHY Beta" />
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>© 2026 WIHY. All rights reserved.</Text>
          <Text style={styles.footerDisclaimer}>
            This page is for education and information only and is not a substitute for professional medical advice.
          </Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={handlePrivacyPress}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.footerLinkSeparator}>•</Text>
            <Pressable onPress={handleTermsPress}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </Pressable>
          </View>
          <View style={styles.footerContact}>
            <Text style={styles.footerContactLabel}>Contact</Text>
            <Pressable onPress={() => Linking.openURL('mailto:info@wihy.ai')}>
              <Text style={styles.footerContactLink}>info@wihy.ai</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    borderBottomColor: BORDER_GRAY,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: DARK_GRAY,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK_GRAY,
    textAlign: 'center',
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: WIHY_GREEN,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mainCTASection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GRAY,
  },
  mainCTAText: {
    fontSize: 16,
    color: DARK_GRAY,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: WIHY_GREEN,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featureSection: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_GRAY,
  },
  featureTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  featureTitleContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GRAY,
  },
  featureTagline: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  featureDetailsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER_GRAY,
  },
  detailHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_GRAY,
    marginBottom: 8,
    marginTop: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  detailItemsList: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItemBullet: {
    fontSize: 14,
    color: WIHY_GREEN,
    marginRight: 8,
    fontWeight: '600',
  },
  detailItemText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flex: 1,
  },
  platformSection: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER_GRAY,
    marginTop: 16,
  },
  platformTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 8,
    textAlign: 'center',
  },
  platformSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  platformFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  platformFeatureCard: {
    width: '48%',
    backgroundColor: LIGHT_GRAY,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  platformFeatureIconContainer: {
    marginBottom: 8,
  },
  platformFeatureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_GRAY,
    marginBottom: 6,
    textAlign: 'center',
  },
  platformFeatureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  footerCTASection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: LIGHT_GRAY,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerCTATitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 8,
    textAlign: 'center',
  },
  footerCTASubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  footerSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER_GRAY,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  footerDisclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 12,
    color: WIHY_GREEN,
    textDecorationLine: 'underline',
  },
  footerLinkSeparator: {
    fontSize: 12,
    color: '#999',
  },
  footerContact: {
    alignItems: 'center',
  },
  footerContactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: DARK_GRAY,
    marginBottom: 4,
  },
  footerContactLink: {
    fontSize: 12,
    color: WIHY_GREEN,
    textDecorationLine: 'underline',
  },
});
