import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const WIHY_GREEN = '#4cbb17';
const LIGHT_GRAY = '#f5f5f5';
const DARK_GRAY = '#1a1a1a';
const BORDER_GRAY = '#e5e5e5';

interface ExpandedSections {
  [key: string]: boolean;
}

export default function PrivacyScreen() {
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#e0f7e6', '#f0fdf4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Legal & Privacy</Text>
          </View>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerDate}>Effective Date: December 2, 2025</Text>
          <Text style={styles.headerIntro}>
            This Privacy Policy explains how WIHY.ai collects, uses, discloses, and protects your
            information when you use our website, mobile apps, and AI-powered health and nutrition services.
          </Text>
        </LinearGradient>

        {/* Privacy Policy Sections */}
        <View style={styles.content}>
          <PolicySection
            id="overview"
            title="1. Overview"
            content={[
              {
                text: 'WIHY.ai ("WIHY", "we", "us", "our") is committed to protecting your privacy. This Privacy Policy describes our practices regarding the collection, use, and protection of information collected through our website, mobile applications, and services.',
              },
            ]}
          />

          <PolicySection
            id="collection"
            title="2. Information We Collect"
            content={[
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
            ]}
          />

          <PolicySection
            id="usage"
            title="3. How We Use Your Information"
            content={[
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
            ]}
          />

          <PolicySection
            id="sharing"
            title="4. How We Share Information"
            content={[
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
            ]}
          />

          <PolicySection
            id="security"
            title="5. Data Security"
            content={[
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
            ]}
          />

          <PolicySection
            id="retention"
            title="6. Data Retention"
            content={[
              {
                text: 'We retain your data for as long as your account is active, or longer if required by law. You can request deletion of your account and associated data at any time.',
              },
            ]}
          />

          <PolicySection
            id="cookies"
            title="7. Cookies and Tracking"
            content={[
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
            ]}
          />

          <PolicySection
            id="rights"
            title="8. Your Rights"
            content={[
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
            ]}
          />

          <PolicySection
            id="gdpr"
            title="9. GDPR and International Data"
            content={[
              {
                text: 'If you are located in the EU, UK, or other jurisdictions with data protection laws, we comply with GDPR and similar regulations.',
              },
              {
                text: 'We may transfer data internationally. When we do, we implement appropriate safeguards including Standard Contractual Clauses.',
              },
            ]}
          />

          <PolicySection
            id="children"
            title="10. Children's Privacy"
            content={[
              {
                text: 'WIHY is not intended for children under 13. We do not knowingly collect data from children under 13. If we learn we have collected such data, we will delete it promptly.',
              },
            ]}
          />

          <PolicySection
            id="contact"
            title="11. Contact Us"
            content={[
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
            ]}
          />

          <PolicySection
            id="changes"
            title="12. Changes to This Policy"
            content={[
              {
                text: 'We may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Effective Date" at the top of this policy.',
              },
            ]}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 WIHY. All rights reserved.</Text>
          <Text style={styles.footerDisclaimer}>
            Last Updated: December 2, 2025
          </Text>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  headerBadge: {
    alignSelf: 'center',
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 8,
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
    fontWeight: '600',
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
  },
});
