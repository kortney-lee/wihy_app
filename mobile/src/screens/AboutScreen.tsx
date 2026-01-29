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
import SvgIcon from '../components/shared/SvgIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MultiAuthLogin from '../components/auth/MultiAuthLogin';
import { WebNavHeader } from '../components/web/WebNavHeader';

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
  const { theme: appTheme } = useTheme();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleSubscribePress = () => {
    Linking.openURL('https://wihy.ai/pricing');
  };

  const handlePrivacyPress = () => {
    navigation.navigate('Privacy' as any);
  };

  const handleTermsPress = () => {
    navigation.navigate('Terms' as any);
  };

  // Navigate to tab screens (inside Main TabNavigator)
  const navigateToTab = (tabName: string) => {
    navigation.navigate('Main', { screen: tabName });
  };

  // Web render
  if (isWeb) {
    return (
      <div className="about-page">
        {/* @ts-ignore */}
        <WebNavHeader 
          activePage="about"
          showLoginModal={showLoginModal}
          setShowLoginModal={setShowLoginModal}
        />
        
        <div className="about-content">
          {/* HERO */}
          <div className="pricing-hero">
            <div className="pricing-hero-inner">
              <div className="pricing-hero-icon">
                <Image 
                  source={require('../../assets/whatishealthyspinner.gif')} 
                  style={{ width: 88, height: 88 }}
                  resizeMode="contain"
                />
              </div>
              <h1 className="pricing-hero-title">WiHY — What Is Healthy for You</h1>
              <p className="pricing-hero-subtitle">
                Ask health questions. Scan food. Get clear answers with sources — and next steps you can use.
              </p>
            </div>
          </div>

          {/* SECTION 1: What We Do */}
          <section className="pricing-section">
            <p className="pricing-section-label">ABOUT WIHY</p>
            <h2 className="pricing-section-title">What We Do</h2>
            
            <div className="about-features-grid">
              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Health Made Clear</h3>
                <p className="pricing-card-tagline">We translate complex health information into answers you can understand and act on.</p>
              </div>

              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Science You Can Trust</h3>
                <p className="pricing-card-tagline">Every answer draws from 35+ million peer-reviewed research articles — not trends or opinions.</p>
              </div>

              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Your Data, Your Control</h3>
                <p className="pricing-card-tagline">Your health information stays private. We use encryption and never sell your data.</p>
              </div>
            </div>
          </section>

          {/* SECTION 2: Why WiHY Exists */}
          <section className="pricing-section pricing-section-alt">
            <p className="pricing-section-label">THE CHALLENGE</p>
            <h2 className="pricing-section-title">Why WiHY Exists</h2>
            
            <div className="about-features-grid about-grid-4">
              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Health Info Overload</h3>
                <p className="pricing-card-tagline">Conflicting advice, marketing claims, and outdated information everywhere. Where do you find answers you can trust?</p>
              </div>

              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Generic Advice Fails</h3>
                <p className="pricing-card-tagline">One-size-fits-all approaches ignore culture, budget, access, family, and stage of life.</p>
              </div>

              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">No Tools, No Support</h3>
                <p className="pricing-card-tagline">You're told "eat healthier" without the actual tools, knowledge, or support to make those decisions.</p>
              </div>

              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Research Stays Hidden</h3>
                <p className="pricing-card-tagline">Scientists publish findings in journals. Those insights never reach the people who need them.</p>
              </div>
            </div>
          </section>

          {/* SECTION 3: What Makes WiHY Different */}
          <section className="pricing-section">
            <p className="pricing-section-label">OUR APPROACH</p>
            <h2 className="pricing-section-title">What Makes WiHY Different</h2>

            <div className="about-features-grid">
              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Made for You</h3>
                <p className="pricing-card-tagline">Adapts to your goals, culture, budget, family, and stage of life — because your health context is unique.</p>
              </div>

              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Built for Real Life</h3>
                <p className="pricing-card-tagline">We account for time, money, access, and family — not just ideal scenarios that don't exist.</p>
              </div>

              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Everything in One Place</h3>
                <p className="pricing-card-tagline">Nutrition, fitness, medications, research, and planning — unified through one intelligent system.</p>
              </div>

              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Transparent AI</h3>
                <p className="pricing-card-tagline">You see the reasoning behind every answer — the evidence, the sources, and why it matters for you.</p>
              </div>

              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Long-term Focus</h3>
                <p className="pricing-card-tagline">We help you build sustainable habits, not quick fixes that don't last.</p>
              </div>
            </div>
          </section>

          {/* SECTION 4: How WiHY Works */}
          <section className="pricing-section pricing-section-alt">
            <p className="pricing-section-label">HOW IT WORKS</p>
            <h2 className="pricing-section-title">How WiHY Works</h2>

            <div className="about-features-grid">
              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Ask WiHY</h3>
                <p className="pricing-card-tagline">Ask a health or nutrition question in plain language. Get a clear answer with sources you can review.</p>
              </div>

              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6 8h1.5v1.5H13V13zm1.5 1.5H16V16h-1.5v-1.5zM16 13h1.5v1.5H16V13zm-3 3h1.5v1.5H13V16zm1.5 1.5H16V19h-1.5v-1.5zM16 16h1.5v1.5H16V16zm1.5-1.5H19V16h-1.5v-1.5zm0 3H19V19h-1.5v-1.5zM19 13h-1.5v1.5H19V13z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Scan Anything</h3>
                <p className="pricing-card-tagline">Point your camera at a barcode or nutrition label. WiHY tells you what's inside — no guesswork.</p>
              </div>

              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Explain It Clearly</h3>
                <p className="pricing-card-tagline">Every answer shows you where the information came from and why it matters for your situation.</p>
              </div>
            </div>
          </section>

          {/* SECTION 5: Trust & Privacy */}
          <section className="pricing-section">
            <p className="pricing-section-label">TRUST & PRIVACY</p>
            <h2 className="pricing-section-title">Your Data, Your Control</h2>

            <div className="about-features-grid">
              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Private by Default</h3>
                <p className="pricing-card-tagline">Your health data is encrypted and never sold. You control what's stored and what's shared.</p>
              </div>

              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">Sources Included</h3>
                <p className="pricing-card-tagline">Every answer shows where it came from — peer-reviewed journals and verified databases.</p>
              </div>

              <div className="pricing-card">
                <div className="pricing-card-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3 className="pricing-card-name">No Hidden Agendas</h3>
                <p className="pricing-card-tagline">WiHY doesn't promote products or take sponsorships. Our only job is to help you understand your health.</p>
              </div>
            </div>
          </section>

          {/* SECTION 6: Team */}
          <section className="pricing-section pricing-section-alt">
            <p className="pricing-section-label">OUR TEAM</p>
            <h2 className="pricing-section-title">The People Behind WiHY</h2>

            <div style={{ maxWidth: '900px', margin: '40px auto 0' }}>
              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '40px', textAlign: 'center' }}>
                We're a multidisciplinary team spanning health, education, technology, and community work. We combine lived experience with academic training to solve real-world problems.
              </p>

              {/* Founder */}
              <div className="pricing-card" style={{ borderColor: '#1a73e8', backgroundColor: '#f0f9ff', marginBottom: '40px' }}>
                <p style={{ fontSize: '11px', fontWeight: '800', color: '#1a73e8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>Founder & Lead Architect</p>
                <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937', margin: '0 0 4px' }}>Kortney Lee</h3>
                <p style={{ fontSize: '14px', color: '#1a73e8', fontWeight: '600', margin: '0 0 16px' }}>Founder, WiHY</p>
                <p className="pricing-card-tagline" style={{ textAlign: 'left' }}>
                  Founded WiHY to close the disconnect between health research and everyday decision-making. Background in business, history, and community health education. Translates complex systems into tools people can actually use.
                </p>
              </div>

              {/* Team Functions */}
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>Core Team Functions</h3>
              <div className="about-features-grid" style={{ marginBottom: '40px' }}>
                <div className="pricing-card">
                  <h3 className="pricing-card-name">Health & Research</h3>
                  <p className="pricing-card-tagline">Nutrition science, public health, behavioral research — grounded and responsible answers.</p>
                </div>

                <div className="pricing-card">
                  <h3 className="pricing-card-name">Technology & AI</h3>
                  <p className="pricing-card-tagline">Engineers and data scientists building explainable systems that prioritize clarity and privacy.</p>
                </div>

                <div className="pricing-card">
                  <h3 className="pricing-card-name">Education & Community</h3>
                  <p className="pricing-card-tagline">Educators and partners focused on accessibility and real-world application.</p>
                </div>

                <div className="pricing-card">
                  <h3 className="pricing-card-name">Design & Experience</h3>
                  <p className="pricing-card-tagline">Designers creating intuitive interfaces that are usable, not overwhelming.</p>
                </div>
              </div>

              {/* Collaboration */}
              <div className="pricing-card" style={{ borderColor: '#1a73e8', backgroundColor: '#f0f9ff' }}>
                <h3 className="pricing-card-name">Advisors & Collaborators</h3>
                <p className="pricing-card-tagline" style={{ textAlign: 'left' }}>
                  We collaborate with clinicians, researchers, educators, and community leaders to ensure our work reflects both expertise and lived reality. Partners help guide research priorities and ethical deployment.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 7: Mission & Call to Action */}
          <section className="pricing-section">
            <p className="pricing-section-label">OUR MISSION</p>
            <h2 className="pricing-section-title">The Bigger Picture</h2>

            <div style={{ maxWidth: '800px', margin: '40px auto 0', textAlign: 'center' }}>
              <p style={{ fontSize: '18px', color: '#1f2937', lineHeight: 1.8, marginBottom: '24px', fontWeight: '600' }}>
                Make health understandable, accessible, and actionable — for everyone.
              </p>

              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '12px' }}>
                We're not here to replace doctors, coaches, or educators.
              </p>

              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '32px' }}>
                We're here to help you make better decisions, understand your health earlier, and build habits that last.
              </p>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => navigateToTab('Chat')}
                  className="pricing-btn pricing-btn-primary"
                  type="button"
                >
                  Ask WiHY
                </button>
                <button 
                  onClick={handleSubscribePress}
                  className="pricing-btn pricing-btn-primary"
                  type="button"
                >
                  Explore Plans
                </button>
              </div>
            </div>
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
          <SvgIcon name={icon} size={24} color={WIHY_GREEN} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureTagline}>{tagline}</Text>
          </View>
        </View>
        <SvgIcon
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
        <SvgIcon name={icon} size={32} color={WIHY_GREEN} />
      </View>
      <Text style={styles.platformFeatureTitle}>{title}</Text>
      <Text style={styles.platformFeatureDescription}>{description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appTheme.colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <SvgIcon name="arrow-back" size={24} color={DARK_GRAY} />
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
          <Text style={styles.heroSubtitle}>Health answers you can verify</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Ask & Chat</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Scan Food</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Sources Included</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Main CTA */}
        <View style={styles.mainCTASection}>
          <Text style={styles.mainCTAText}>
            WiHY helps you understand food and health in plain language — with sources, context, and next steps.
          </Text>
          <CTAButton onPress={handleSubscribePress} text="Get Started with WIHY" />
        </View>

        {/* Features */}
        <FeatureSection
          id="ask"
          title="Ask WiHY"
          tagline="Get clear answers with sources"
          icon="chatbubble-ellipses"
          details={[
            { text: 'Ask a health question in plain language and WiHY gives you a direct answer — plus the key reasons behind it.' },
            { heading: 'What you get:', items: [
              'A clear summary (no jargon)',
              'Sources you can open',
              'What to do next (save, log, compare, plan)',
            ]},
          ]}
        />

        <FeatureSection
          id="scan"
          title="Scan Anything"
          tagline="Barcode, label, ingredients, or a meal photo"
          icon="scan"
          details={[
            { text: 'Scan a barcode, label, ingredient list, or meal photo and WiHY explains what it is and why it matters.' },
            { heading: 'Scanning modes:', items: [
              'Barcode scan (packaged products)',
              'Ingredient scan (label breakdown)',
              'Meal photo (identify foods + estimate)',
            ]},
          ]}
        />

        <FeatureSection
          id="explain"
          title="Explain It Clearly"
          tagline="What it means for you, not a textbook"
          icon="information-circle"
          details={[
            { text: 'WiHY turns nutrition and ingredients into plain-language explanations based on your goals and context.' },
            { heading: 'What we highlight:', items: [
              'Added sugars, sodium, fiber, protein',
              'Common additives and what they do',
              'Tradeoffs (better, best, and why)',
            ]},
          ]}
        />

        {/* Platform Section */}
        <View style={styles.platformSection}>
          <Text style={styles.platformTitle}>One Place to Keep Track</Text>
          <Text style={styles.platformSubtitle}>
            Save answers, track patterns, and build routines that actually stick.
          </Text>
          <View style={styles.platformFeatures}>
            <PlatformFeature title="Trends" description="See how your habits change over time." icon="trending-up" />
            <PlatformFeature title="Meals & Groceries" description="Log what you eat and buy." icon="restaurant" />
            <PlatformFeature title="Sources" description="Access the research behind answers." icon="library" />
            <PlatformFeature title="Plans" description="Build routines that fit your life." icon="calendar" />
          </View>
        </View>

        {/* Trust & Privacy */}
        <FeatureSection
          id="trust"
          title="Trust & Privacy"
          tagline="Built to be helpful, not exploitative"
          icon="shield-checkmark"
          details={[
            { text: 'WiHY is designed to help you make better decisions — not to sell your data.' },
            { heading: 'Our commitments:', items: [
              'We don\'t sell personal health data',
              'You control what you save and track',
              'We prioritize transparent explanations over black-box answers',
            ]},
          ]}
        />

        {/* Founder Card */}
        <View style={styles.founderCard}>
          <Text style={styles.founderName}></Text>
          <Text style={styles.founderRole}>Founder, WiHY</Text>
          <Text style={styles.founderBio}>
            WiHY was built to turn health confusion into clarity — with tools people can actually use, not just advice.
          </Text>
        </View>

        {/* Team */}
        <FeatureSection
          id="team"
          title="Our Team"
          tagline="The people building WiHY"
          icon="people"
          details={[
            {
              text:
                "WiHY is built by a team that cares about accuracy, usability, and real-world health outcomes — across families, schools, and communities.",
            },
            {
              heading: "What they do for you:",
              items: [
                "Health & Research: keeps recommendations responsible",
                "Technology & AI: keeps answers fast and explainable",
                "Education & Community: keeps it usable outside perfect conditions",
                "Design: keeps it simple",
              ],
            },
            {
              heading: "Advisors & Collaborators",
              text:
                "We work with clinicians, researchers, educators, and community leaders to make sure WiHY reflects both expertise and lived reality.",
            },
          ]}
        />

        {/* Footer CTA */}
        <View style={styles.footerCTASection}>
          <Text style={styles.footerCTATitle}>Experience WIHY Intelligence</Text>
          <Text style={styles.footerCTASubtitle}>
            Start your journey to understanding what you eat.
          </Text>
          <CTAButton onPress={handleSubscribePress} text="Get Started Today" />
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
    // backgroundColor: '#fff', // Now using theme.colors.surface dynamically
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
    // backgroundColor: '#fff', // Now using theme.colors.surface dynamically
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
  founderCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    backgroundColor: '#f0fdf4',
  },
  founderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: WIHY_GREEN,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  founderName: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 2,
  },
  founderRole: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2f6f15',
    marginBottom: 10,
  },
  founderBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
