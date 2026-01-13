import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
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
const BORDER_GRAY = '#e5e5e5';

interface ExpandedSections {
  [key: string]: boolean;
}

const privacyData = [
  {
    id: 'overview',
    title: '1. Overview',
    content: [
      {
        text: 'WIHY.ai ("WIHY", "we", "us", "our") is committed to protecting your privacy. This Privacy Policy describes our practices regarding the collection, use, and protection of information collected through our website, mobile applications, and services.',
      },
    ],
  },
  {
    id: 'collection',
    title: '2. Information We Collect',
    content: [
      {
        heading: 'Account Information:',
        items: [
          'Email address',
          'Password and authentication credentials',
          'Name and profile information',
          'Profile picture',
          'Payment information (processed by third-party payment providers)',
        ],
      },
      {
        heading: 'Health & Nutrition Data:',
        items: [
          'Food scans and barcode data',
          'Meal history and consumption patterns',
          'Nutrition preferences',
          'Health metrics and measurements',
          'Fitness and activity data',
          'Weight and body composition data',
        ],
      },
      {
        heading: 'Device & Usage Data:',
        items: [
          'Device type, operating system, and version',
          'IP address and location data',
          'Browser type and language',
          'Usage patterns and feature interactions',
          'App performance data',
          'Crash reports and error logs',
        ],
      },
    ],
  },
  {
    id: 'usage',
    title: '3. How We Use Your Information',
    content: [
      {
        items: [
          'Provide and improve our services',
          'Personalize your experience',
          'Send notifications and updates',
          'Process payments and manage subscriptions',
          'Analyze trends and usage patterns',
          'Prevent fraud and security issues',
          'Comply with legal obligations',
          'Communicate with you about your account',
        ],
      },
    ],
  },
  {
    id: 'sharing',
    title: '4. How We Share Information',
    content: [
      {
        heading: 'We do NOT sell your personal data.',
        text: 'We may share information in these limited cases:',
      },
      {
        items: [
          'Service providers who assist us in operations (payment processors, cloud hosting, analytics)',
          'Legal authorities when required by law',
          'Business partners with your explicit consent',
          'In the event of a merger or acquisition',
        ],
      },
    ],
  },
  {
    id: 'security',
    title: '5. Data Security',
    content: [
      {
        text: 'We implement industry-standard security measures including:',
      },
      {
        items: [
          'Encryption of data in transit and at rest',
          'Secure authentication mechanisms',
          'Regular security audits',
          'Limited employee access to personal data',
          'HIPAA-aligned security practices',
        ],
      },
      {
        text: 'However, no security system is completely secure. We cannot guarantee absolute security of your information.',
      },
    ],
  },
  {
    id: 'retention',
    title: '6. Data Retention',
    content: [
      {
        text: 'We retain your data for as long as your account is active, or longer if required by law. You can request deletion of your account and associated data at any time.',
      },
    ],
  },
  {
    id: 'cookies',
    title: '7. Cookies and Tracking',
    content: [
      {
        text: 'We use cookies and similar technologies to:',
      },
      {
        items: [
          'Remember your preferences',
          'Understand usage patterns',
          'Improve user experience',
          'Deliver personalized content',
          'Measure marketing effectiveness',
        ],
      },
      {
        text: 'You can control cookie preferences through your browser settings.',
      },
    ],
  },
  {
    id: 'rights',
    title: '8. Your Rights',
    content: [
      {
        text: 'Depending on your location, you may have the right to:',
      },
      {
        items: [
          'Access your personal data',
          'Correct inaccurate information',
          'Delete your data (right to be forgotten)',
          'Opt-out of marketing communications',
          'Data portability',
          'Withdraw consent',
        ],
      },
      {
        text: 'To exercise these rights, contact us at privacy@wihy.ai',
      },
    ],
  },
  {
    id: 'gdpr',
    title: '9. GDPR and International Data',
    content: [
      {
        text: 'If you are located in the EU, UK, or other jurisdictions with data protection laws, we comply with GDPR and similar regulations.',
      },
      {
        text: 'We may transfer data internationally. When we do, we implement appropriate safeguards including Standard Contractual Clauses.',
      },
    ],
  },
  {
    id: 'children',
    title: '10. Children\'s Privacy',
    content: [
      {
        text: 'WIHY is not intended for children under 13. We do not knowingly collect data from children under 13. If we learn we have collected such data, we will delete it promptly.',
      },
    ],
  },
  {
    id: 'contact',
    title: '11. Contact Us',
    content: [
      {
        text: 'For privacy questions or concerns, contact us at:',
      },
      {
        heading: 'Email:',
        text: 'privacy@wihy.ai',
      },
      {
        heading: 'Address:',
        text: 'WIHY Inc.\nUnited States',
      },
    ],
  },
  {
    id: 'changes',
    title: '12. Changes to This Policy',
    content: [
      {
        text: 'We may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Effective Date" at the top of this policy.',
      },
    ],
  },
];

export default function PrivacyScreen() {
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

  const handleTermsPress = () => {
    navigation.navigate('Terms' as any);
  };

  const handleAboutPress = () => {
    navigation.navigate('About' as any);
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
        <button onClick={handleAboutPress} className="web-nav-item nav-about" type="button">
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

  // Web Section Component
  const WebPolicySection = ({ id, title, content }: any) => (
    <div style={{ marginBottom: '8px', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' }}>
      <button
        onClick={() => toggleSection(id)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px',
          background: LIGHT_GRAY,
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
        type="button"
      >
        <span style={{ fontSize: '15px', fontWeight: 600, color: DARK_GRAY }}>{title}</span>
        <svg viewBox="0 0 24 24" width="20" height="20" fill={WIHY_GREEN} style={{ transform: expandedSections[id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
        </svg>
      </button>
      {expandedSections[id] && (
        <div style={{ padding: '12px 14px', background: '#fff', borderTop: '1px solid #e5e5e5' }}>
          {content.map((item: any, idx: number) => (
            <div key={idx}>
              {item.heading && (
                <p style={{ fontSize: '13px', fontWeight: 600, color: DARK_GRAY, marginTop: '10px', marginBottom: '6px' }}>{item.heading}</p>
              )}
              {item.text && (
                <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.5, marginBottom: '8px' }}>{item.text}</p>
              )}
              {item.items && (
                <ul style={{ margin: '8px 0', paddingLeft: '0', listStyle: 'none' }}>
                  {item.items.map((text: string, i: number) => (
                    <li key={i} style={{ display: 'flex', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: WIHY_GREEN, marginRight: '8px', fontWeight: 600 }}>•</span>
                      <span style={{ fontSize: '13px', color: '#666', lineHeight: 1.5 }}>{text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
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
              <span style={{ display: 'inline-block', background: WIHY_GREEN, color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                Legal & Privacy
              </span>
              <h1 className="pricing-hero-title" style={{ color: DARK_GRAY }}>Privacy Policy</h1>
              <p style={{ fontSize: '12px', color: '#999', marginBottom: '12px', fontWeight: 500 }}>Effective Date: December 2, 2025</p>
              <p className="pricing-hero-subtitle" style={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}>
                This Privacy Policy explains how WIHY.ai collects, uses, discloses, and protects your information when you use our website, mobile apps, and AI-powered health and nutrition services.
              </p>
            </div>
          </div>

          {/* Privacy Policy Sections */}
          <section style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            {privacyData.map((section) => (
              <WebPolicySection key={section.id} id={section.id} title={section.title} content={section.content} />
            ))}
          </section>

          {/* Footer */}
          <footer className="pricing-footer">
            <p className="pricing-footer-copyright">© 2026 WIHY. All rights reserved.</p>
            <p className="pricing-footer-disclaimer">Last Updated: December 2, 2025</p>
            <div className="pricing-footer-links">
              <a href="#" onClick={(e) => { e.preventDefault(); handleTermsPress(); }}>Terms of Service</a>
              <span className="pricing-footer-separator">•</span>
              <a href="#" onClick={(e) => { e.preventDefault(); handleAboutPress(); }}>About</a>
              <span className="pricing-footer-separator">•</span>
              <a href="mailto:privacy@wihy.ai">Contact Us</a>
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

  // Native render
  const PolicySection = ({ id, title, content }: any) => (
    <View style={styles.policySection}>
      <Pressable
        onPress={() => toggleSection(id)}
        style={styles.policySectionHeader}
      >
        <Text style={styles.policySectionTitle}>{title}</Text>
        <Ionicons
          name={expandedSections[id] ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={WIHY_GREEN}
        />
      </Pressable>

      {expandedSections[id] && (
        <View style={styles.policySectionContent}>
          {content.map((item: any, idx: number) => (
            <View key={idx}>
              {item.heading && (
                <Text style={styles.contentHeading}>{item.heading}</Text>
              )}
              {item.text && (
                <Text style={styles.contentText}>{item.text}</Text>
              )}
              {item.items && (
                <View style={styles.contentItemsList}>
                  {item.items.map((text: string, i: number) => (
                    <View key={i} style={styles.contentItem}>
                      <Text style={styles.contentItemBullet}>•</Text>
                      <Text style={styles.contentItemText}>{text}</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK_GRAY} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#e0f7e6', '#f0fdf4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Legal & Privacy</Text>
          </View>
          <Text style={styles.heroTitle}>Privacy Policy</Text>
          <Text style={styles.headerDate}>Effective Date: December 2, 2025</Text>
          <Text style={styles.headerIntro}>
            This Privacy Policy explains how WIHY.ai collects, uses, discloses, and protects your information when you use our website, mobile apps, and AI-powered health and nutrition services.
          </Text>
        </LinearGradient>

        {/* Privacy Policy Sections */}
        <View style={styles.content}>
          {privacyData.map((section) => (
            <PolicySection key={section.id} id={section.id} title={section.title} content={section.content} />
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 WIHY. All rights reserved.</Text>
          <Text style={styles.footerDisclaimer}>Last Updated: December 2, 2025</Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={handleTermsPress}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.footerLinkSeparator}>•</Text>
            <Pressable onPress={handleAboutPress}>
              <Text style={styles.footerLink}>About</Text>
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
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerBadge: {
    backgroundColor: WIHY_GREEN,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    fontWeight: '500',
  },
  headerIntro: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  policySection: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_GRAY,
  },
  policySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: LIGHT_GRAY,
  },
  policySectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK_GRAY,
    flex: 1,
  },
  policySectionContent: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: BORDER_GRAY,
  },
  contentHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK_GRAY,
    marginTop: 10,
    marginBottom: 6,
  },
  contentText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  contentItemsList: {
    marginVertical: 8,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  contentItemBullet: {
    fontSize: 13,
    color: WIHY_GREEN,
    marginRight: 8,
    fontWeight: 600,
  },
  contentItemText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    flex: 1,
  },
  footer: {
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
  footerLinkSeparator: {
    fontSize: 12,
    color: '#999',
  },
});
