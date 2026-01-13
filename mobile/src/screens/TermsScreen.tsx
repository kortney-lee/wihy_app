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

export default function TermsScreen() {
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const TermsSection = ({ id, title, content }: any) => (
    <View style={styles.termsSection}>
      <Pressable
        onPress={() => toggleSection(id)}
        style={styles.termsSectionHeader}
      >
        <Text style={styles.termsSectionTitle}>{title}</Text>
        <Ionicons
          name={expandedSections[id] ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={WIHY_GREEN}
        />
      </Pressable>

      {expandedSections[id] && (
        <View style={styles.termsSectionContent}>
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
            <Text style={styles.headerBadgeText}>Legal Agreement</Text>
          </View>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <Text style={styles.headerDate}>Effective Date: December 2, 2025</Text>
          <Text style={styles.headerIntro}>
            These Terms of Service ("Terms") govern your access to and use of WIHY's website, mobile applications, and services.
          </Text>
        </LinearGradient>

        {/* Terms Sections */}
        <View style={styles.content}>
          <TermsSection
            id="acceptance"
            title="1. Acceptance of Terms"
            content={[
              {
                text: 'By accessing and using WIHY, you accept and agree to be bound by these Terms. If you do not agree to abide by the above, please do not use this service.',
              },
            ]}
          />

          <TermsSection
            id="use-license"
            title="2. Use License"
            content={[
              {
                text: 'Permission is granted to temporarily download one copy of the materials (information or software) on WIHY for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:',
              },
              {
                items: [
                  'Modifying or copying the materials',
                  'Using the materials for any commercial purpose or for any public display',
                  'Attempting to decompile or reverse engineer any software contained on WIHY',
                  'Removing any copyright or other proprietary notations from the materials',
                  'Transferring the materials to another person or "mirroring" the materials on any other server',
                  'Violating any applicable laws or regulations',
                  'Using the service to transmit harassment, abuse, or hate speech',
                  'Uploading viruses or malicious code',
                ],
              },
            ]}
          />

          <TermsSection
            id="disclaimer"
            title="3. Disclaimer of Warranties"
            content={[
              {
                text: 'The materials on WIHY are provided on an "as is" basis. WIHY makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.',
              },
            ]}
          />

          <TermsSection
            id="limitations"
            title="4. Limitations of Liability"
            content={[
              {
                text: 'In no event shall WIHY or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on WIHY, even if WIHY or an authorized representative has been notified orally or in writing of the possibility of such damage.',
              },
            ]}
          />

          <TermsSection
            id="accuracy"
            title="5. Accuracy of Materials"
            content={[
              {
                text: 'The materials appearing on WIHY could include technical, typographical, or photographic errors. WIHY does not warrant that any of the materials on its website are accurate, complete, or current. WIHY may make changes to the materials contained on its website at any time without notice.',
              },
            ]}
          />

          <TermsSection
            id="materials"
            title="6. Materials and Content"
            content={[
              {
                text: 'WIHY has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by WIHY of the site. Use of any such linked website is at the user\'s own risk.',
              },
            ]}
          />

          <TermsSection
            id="health-disclaimer"
            title="7. Health and Medical Disclaimer"
            content={[
              {
                text: 'WIHY is not a substitute for professional medical advice, diagnosis, or treatment. All content provided is for informational and educational purposes only.',
              },
              {
                items: [
                  'Do not use WIHY to self-diagnose or self-treat any medical condition',
                  'Always consult with a qualified healthcare provider for medical advice',
                  'WIHY does not establish a doctor-patient relationship',
                  'Nutrition and health advice from WIHY is general in nature',
                  'Individual results may vary based on personal health factors',
                  'Rely on licensed professionals for health decisions',
                ],
              },
            ]}
          />

          <TermsSection
            id="modifications"
            title="8. Modifications to Terms"
            content={[
              {
                text: 'WIHY may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.',
              },
            ]}
          />

          <TermsSection
            id="governing-law"
            title="9. Governing Law"
            content={[
              {
                text: 'These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.',
              },
            ]}
          />

          <TermsSection
            id="user-content"
            title="10. User-Generated Content"
            content={[
              {
                text: 'Any content you upload or submit to WIHY remains your responsibility. You grant WIHY a non-exclusive, royalty-free, perpetual license to use such content for service improvement and analytics.',
              },
              {
                items: [
                  'You warrant that you own or have the rights to all content you submit',
                  'You agree not to upload content that violates laws or rights of others',
                  'WIHY may remove content that violates these terms',
                  'You remain responsible for the accuracy of your content',
                ],
              },
            ]}
          />

          <TermsSection
            id="account-responsibility"
            title="11. Account Responsibility"
            content={[
              {
                text: 'You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.',
              },
              {
                items: [
                  'You accept responsibility for all activities that occur under your account',
                  'You agree to notify us immediately of any unauthorized use of your account',
                  'WIHY is not liable for unauthorized account access due to your negligence',
                  'You are responsible for all data you input into WIHY',
                ],
              },
            ]}
          />

          <TermsSection
            id="termination"
            title="12. Termination"
            content={[
              {
                text: 'WIHY may terminate your account and access to the service at any time, for any reason, with or without notice. This may include termination for violation of these Terms or for conduct WIHY believes is harmful to other users.',
              },
            ]}
          />

          <TermsSection
            id="dispute-resolution"
            title="13. Dispute Resolution"
            content={[
              {
                text: 'Any dispute arising out of or relating to these Terms shall be resolved through binding arbitration or litigation in the courts of the United States.',
              },
              {
                items: [
                  'You agree to attempt to resolve disputes informally first',
                  'If informal resolution fails, disputes will be resolved through arbitration',
                  'Each party bears its own costs unless otherwise agreed',
                ],
              },
            ]}
          />

          <TermsSection
            id="contact"
            title="14. Contact Information"
            content={[
              {
                text: 'For questions about these Terms, please contact us at:',
              },
              {
                heading: 'Email:',
                text: 'legal@wihy.ai',
              },
              {
                heading: 'Address:',
                text: 'WIHY Inc.\nUnited States',
              },
            ]}
          />

          <TermsSection
            id="entire-agreement"
            title="15. Entire Agreement"
            content={[
              {
                text: 'These Terms constitute the entire agreement between you and WIHY regarding your use of the service and supersede any prior agreements or understandings.',
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
  termsSection: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_GRAY,
  },
  termsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: LIGHT_GRAY,
  },
  termsSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK_GRAY,
    flex: 1,
  },
  termsSectionContent: {
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
