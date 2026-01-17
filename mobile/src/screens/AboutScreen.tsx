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

export default function AboutScreen() {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleSubscribePress = () => {
    Linking.openURL('https://wihy.ai/pricing');
  };

  const handlePrivacyPress = () => {
    navigation.navigate('Privacy' as any);
  };

  const handleTermsPress = () => {
    navigation.navigate('Terms' as any);
  };

  const navigateToTab = (tabName: string) => {
    navigation.navigate('Main', { screen: tabName });
  };

  const navigateToStack = (screenName: string) => {
    navigation.navigate(screenName as any);
  };

  // Web Navigation Header
  const WebNavHeader = () => (
    <nav className="web-top-nav">
      <div className="web-nav-left">
        <button onClick={() => navigateToTab('Home')} className="web-nav-item nav-home" type="button">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span>Home</span>
        </button>
        <button onClick={() => navigateToStack('Subscription')} className="web-nav-item nav-health" type="button">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>Health</span>
        </button>
        <button onClick={() => navigateToTab('Chat')} className="web-nav-item nav-chat" type="button">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span>Chat</span>
        </button>
        <button onClick={() => navigateToStack('About')} className="web-nav-item nav-about active" type="button">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span>About</span>
        </button>
      </div>
      <div className="web-nav-right">
        <button onClick={() => {
          if (user) {
            navigateToTab('Profile');
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
          {/* Hero: What WiHY Is */}
          <div className="pricing-hero">
            <div className="pricing-hero-inner">
              <div className="pricing-hero-icon">
                <svg viewBox="0 0 24 24" width="88" height="88" fill="#1a73e8">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
              </div>
              <h1 className="pricing-hero-title">WiHY — What Is Healthy for You</h1>
              <p className="pricing-hero-subtitle">
                Personalized health answers, grounded in science, culture, and real life.
              </p>
            </div>
          </div>

          {/* The Problem We're Solving */}
          <section className="pricing-section pricing-section-alt">
            <p className="pricing-section-label">WHY WIHY EXISTS</p>
            <h2 className="pricing-section-title">The Problem We're Solving</h2>
            
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>Health information is everywhere — but clarity is rare</h3>
                <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6 }}>
                  You're bombarded with conflicting advice, marketing claims, and outdated information. Where do you find answers you can trust?
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>One-size-fits-all advice ignores what matters to you</h3>
                <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6 }}>
                  Generic diet advice doesn't account for your culture, budget, food access, family situation, or stage of life. What's healthy for someone else might not be healthy for you.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>People are blamed for outcomes without usable tools</h3>
                <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6 }}>
                  You're told "eat healthier" or "exercise more," but not given the actual tools, knowledge, or support to make those decisions in real life.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>Research exists, but it isn't written for real people</h3>
                <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6 }}>
                  Scientists publish findings in academic journals. Those findings never reach the people who need them most. The gap between research and reality is huge.
                </p>
              </div>

              <p style={{ fontSize: '18px', fontWeight: '700', color: '#1a73e8', textAlign: 'center', paddingTop: '16px', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#e5e7eb' }}>
                WiHY was built to close that gap.
              </p>
            </div>
          </section>

          {/* What Makes WiHY Different */}
          <section className="pricing-section">
            <p className="pricing-section-label">WHAT SETS US APART</p>
            <h2 className="pricing-section-title">Not Another Health App</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '40px', maxWidth: '1200px', margin: '40px auto 0' }}>
              
              {/* Personalized */}
              <div style={{ padding: '24px', border: '1px solid #e5e7eb', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>Personalized, not prescriptive</h3>
                <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6 }}>
                  WiHY adapts to your individual reality — your goals, food access, culture, family situation, and stage of life.
                </p>
              </div>

              {/* Research-backed */}
              <div style={{ padding: '24px', border: '1px solid #e5e7eb', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>Research-backed, not trend-driven</h3>
                <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6 }}>
                  Every answer is grounded in peer-reviewed research and trusted data sources, not the latest social media trend.
                </p>
              </div>

              {/* Real Life */}
              <div style={{ padding: '24px', border: '1px solid #e5e7eb', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>Built for real life</h3>
                <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6 }}>
                  We account for budgets, time constraints, families, schools, and communities — not just ideal scenarios.
                </p>
              </div>

              {/* One Entry Point */}
              <div style={{ padding: '24px', border: '1px solid #e5e7eb', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>One intelligent entry point</h3>
                <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6 }}>
                  Nutrition, fitness, medications, research, and planning — all accessible through one unified system.
                </p>
              </div>

              {/* Explainable AI */}
              <div style={{ padding: '24px', border: '1px solid #e5e7eb', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>Explainable AI</h3>
                <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6 }}>
                  You don't just get answers. You see the reasoning behind them, the evidence supporting them, and can make informed decisions.
                </p>
              </div>

            </div>
          </section>

          {/* What WiHY Does */}
          <section className="pricing-section pricing-section-alt">
            <p className="pricing-section-label">WHAT YOU CAN DO</p>
            <h2 className="pricing-section-title">What WiHY Does</h2>

            <div style={{ maxWidth: '800px', margin: '40px auto 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                'Ask health questions in plain language',
                'Analyze foods, meals, and ingredients',
                'Understand nutrition labels and additives',
                'Track meals, movement, and habits',
                'Build realistic plans for individuals or families',
                'Support coaches, trainers, and nutrition professionals',
                'Turn research into practical action',
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingBottom: '12px', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#e5e7eb' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="#4cbb17" style={{ marginTop: '2px', flexShrink: 0 }}>
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                  </svg>
                  <span style={{ fontSize: '16px', color: '#1f2937' }}>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Who WiHY Is For */}
          <section className="pricing-section">
            <p className="pricing-section-label">WHO WE SERVE</p>
            <h2 className="pricing-section-title">Who WiHY Is For</h2>

            <div style={{ maxWidth: '800px', margin: '40px auto 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'Individuals and families looking to eat healthier',
                'Coaches, trainers, and nutrition professionals',
                'Schools and students',
                'Healthcare and community organizations',
                'Employers and wellness programs',
              ].map((item, idx) => (
                <p key={idx} style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6 }}>• {item}</p>
              ))}
              <p style={{ fontSize: '16px', color: '#1a73e8', fontWeight: '600', marginTop: '16px', textAlign: 'center' }}>
                If health touches your life — WiHY was built for you.
              </p>
            </div>
          </section>

          {/* Our Philosophy */}
          <section className="pricing-section pricing-section-alt">
            <p className="pricing-section-label">OUR BELIEF</p>
            <h2 className="pricing-section-title">Our Philosophy</h2>

            <div style={{ maxWidth: '800px', margin: '40px auto 0' }}>
              <p style={{ fontSize: '18px', color: '#6b7280', lineHeight: 1.8, textAlign: 'center', marginBottom: '32px' }}>
                Health isn't about perfection. It's about alignment — between knowledge, access, behavior, and intention.
              </p>

              <div style={{ padding: '24px', background: '#f0f9ff', borderRadius: '16px', borderLeft: '4px solid #1a73e8' }}>
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', textAlign: 'center', margin: '0 0 8px' }}>Healthy isn't a trend.</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', textAlign: 'center', margin: '8px 0' }}>Healthy is learned.</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', textAlign: 'center', margin: '8px 0 0' }}>Healthy is lived.</p>
              </div>
            </div>
          </section>

          {/* How WiHY Was Built */}
          <section className="pricing-section">
            <p className="pricing-section-label">OUR FOUNDATION</p>
            <h2 className="pricing-section-title">Built From the Ground Up</h2>

            <div style={{ maxWidth: '800px', margin: '40px auto 0' }}>
              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '24px' }}>
                WiHY was created at the intersection of lived experience, academic research, and technology. It draws from nutrition science, public health, behavioral science, and cultural context — not just algorithms.
              </p>

              <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '12px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#e5e7eb' }}>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>This isn't theory.</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '8px 0 0' }}>This is application.</p>
              </div>
            </div>
          </section>

          {/* The Bigger Mission */}
          <section className="pricing-section pricing-section-alt">
            <p className="pricing-section-label">WHERE WE'RE GOING</p>
            <h2 className="pricing-section-title">The Bigger Mission</h2>

            <div style={{ maxWidth: '800px', margin: '40px auto 0' }}>
              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '24px' }}>
                Our mission is to make health understandable, accessible, and actionable — across generations, communities, and systems.
              </p>

              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '12px' }}>
                WiHY isn't here to replace doctors, coaches, or educators.
              </p>

              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '24px' }}>
                It's here to support better decisions, earlier understanding, and long-term change.
              </p>
            </div>
          </section>

          {/* Final CTA */}
          <section className="pricing-section">
            <p className="pricing-section-label">READY TO START?</p>
            <h2 className="pricing-section-title">Start With One Question</h2>

            <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6, textAlign: 'center', marginBottom: '40px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
              Ask WiHY what's healthy for you — and start from there.
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
                Explore Features
              </button>
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

  // Native render
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK_GRAY} />
        </Pressable>
        <Text style={styles.headerTitle}>About WIHY</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#e8f0fe', '#d3e3fd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <Text style={styles.heroTitle}>WiHY</Text>
          <Text style={styles.heroSubtitle}>What Is Healthy for You</Text>
          <Text style={styles.heroDescription}>Personalized health answers, grounded in science, culture, and real life.</Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The Problem We're Solving</Text>
          <Text style={styles.problemText}>Health information is everywhere — but clarity is rare. One-size-fits-all advice ignores your unique situation. WiHY bridges the gap between scientific research and real life.</Text>
          <View style={styles.buttonContainer}>
            <Pressable onPress={handleSubscribePress} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Explore WIHY</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.section, styles.altSection]}>
          <Text style={styles.sectionTitle}>What Makes Us Different</Text>
          <View style={styles.pillarGrid}>
            {[
              { title: 'Personalized', desc: 'Adapts to your goals, culture, and real life' },
              { title: 'Research-Backed', desc: 'Grounded in 35M+ scientific articles' },
              { title: 'For Real Life', desc: 'Accounts for budgets, families, and communities' },
              { title: 'One Platform', desc: 'Nutrition, fitness, and planning unified' },
              { title: 'Explainable', desc: 'You see the reasoning behind answers' },
            ].map((pillar, idx) => (
              <View key={idx} style={styles.pillarCard}>
                <Text style={styles.pillarTitle}>{pillar.title}</Text>
                <Text style={styles.pillarDesc}>{pillar.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You Can Do</Text>
          {[
            'Ask health questions in plain language',
            'Analyze foods and ingredients',
            'Understand nutrition labels',
            'Track meals and habits',
            'Build personalized plans',
          ].map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Ionicons name="checkmark-circle" size={20} color={WIHY_GREEN} />
              <Text style={styles.listItemText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, styles.altSection]}>
          <Text style={styles.sectionTitle}>Our Philosophy</Text>
          <Text style={styles.philosophyText}>Health isn't about perfection. It's about alignment between knowledge, access, behavior, and intention.</Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>Healthy isn't a trend.{'\n'}Healthy is learned.{'\n'}Healthy is lived.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Your Journey</Text>
          <Text style={styles.ctaText}>Ask WiHY what's healthy for you and start from there.</Text>
          <View style={styles.ctaButtonContainer}>
            <Pressable onPress={() => navigateToTab('Chat')} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Ask WiHY</Text>
            </Pressable>
            <Pressable onPress={handleSubscribePress} style={[styles.ctaButton, styles.ctaButtonSecondary]}>
              <Text style={styles.ctaButtonTextSecondary}>Explore Plans</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerText}>© 2026 WIHY. All rights reserved.</Text>
          <Text style={styles.footerDisclaimer}>This page is for education and information only.</Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={handlePrivacyPress}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.footerSeparator}>•</Text>
            <Pressable onPress={handleTermsPress}>
              <Text style={styles.footerLink}>Terms</Text>
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
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: DARK_GRAY,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK_GRAY,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GRAY,
  },
  altSection: {
    backgroundColor: LIGHT_GRAY,
    borderBottomWidth: 0,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 16,
    textAlign: 'center',
  },
  problemText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  pillarGrid: {
    gap: 12,
  },
  pillarCard: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
  },
  pillarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 6,
  },
  pillarDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  listItemText: {
    fontSize: 15,
    color: DARK_GRAY,
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  philosophyText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  highlightBox: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1a73e8',
  },
  highlightText: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_GRAY,
    textAlign: 'center',
    lineHeight: 28,
  },
  ctaText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  ctaButton: {
    backgroundColor: WIHY_GREEN,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 180,
    alignItems: 'center',
  },
  ctaButtonSecondary: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: WIHY_GREEN,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaButtonTextSecondary: {
    color: WIHY_GREEN,
    fontSize: 16,
    fontWeight: '600',
  },
  ctaButtonContainer: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  footerSection: {
    paddingVertical: 24,
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
    marginBottom: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLink: {
    fontSize: 12,
    color: WIHY_GREEN,
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontSize: 12,
    color: '#999',
  },
});
