import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardTheme } from '../theme/dashboardTheme';

const WIHY_GREEN = '#4cbb17';
const LIGHT_GRAY = '#f5f5f5';
const DARK_GRAY = '#1a1a1a';
const BORDER_GRAY = '#e5e5e5';

interface ExpandedSections {
  [key: string]: boolean;
}

export default function AboutScreen() {
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
    // Navigate to privacy screen - adjust based on your navigation setup
    console.log('Navigate to Privacy');
  };

  const handleTermsPress = () => {
    // Navigate to terms screen - adjust based on your navigation setup
    console.log('Navigate to Terms');
  };

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
          <Text style={styles.headerTitle}>WIHY</Text>
          <Text style={styles.headerSubtitle}>The World's Smartest Health Search Engine</Text>
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

        {/* Health Search Section */}
        <FeatureSection
          id="health-search"
          title="Health Search"
          tagline="Explore food with evidence instead of opinions"
          icon="search"
          details={[
            {
              text: 'WIHY lets you search food the same way you search the internet, but with evidence instead of opinions.',
            },
            {
              text: 'Ask health and nutrition questions and get research-backed answers.',
            },
            {
              text: 'Turn complex studies into clear guidance you can use right away.',
            },
            {
              heading: 'Powered by Intelligence:',
              items: [
                'Fact-checking across 35+ million scientific research articles',
                'Analysis of 4+ million verified food and ingredient records',
                'Government-funded nutrition and health data',
                'Real-time food and ingredient analysis',
                'Personalized health insights based on patterns',
              ],
            },
          ]}
        />

        {/* Universal Scanning Section */}
        <FeatureSection
          id="universal-scanning"
          title="Universal Scanning"
          tagline="Instantly understand food and ingredients"
          icon="camera"
          details={[
            {
              text: 'Scan a barcode, take a photo, upload ingredients, or import a receipt and WIHY breaks it down into clear, understandable insights.',
            },
            {
              heading: 'How It Works:',
              items: [
                'Barcode decoding to recognize packaged products',
                'Food photography to identify meals and whole foods',
                'Ingredient OCR to read and analyze ingredient lists',
                'Receipt parsing to understand what you purchased',
                'Global product verification against trusted databases',
              ],
            },
            {
              text: 'You do not need to tell WIHY what to look for. It detects, verifies, and analyzes automatically.',
            },
            {
              heading: 'What You Get:',
              items: [
                'What the food is made of',
                'How processed it is',
                'Which ingredients matter and why',
                'How it fits into a healthier pattern',
                'What to change or keep doing next',
              ],
            },
          ]}
        />

        {/* Nutrition Analysis Section */}
        <FeatureSection
          id="nutrition-analysis"
          title="Nutrition Analysis"
          tagline="Understand nutrition in plain language"
          icon="leaf"
          details={[
            {
              text: 'After you scan food with WIHY, the system automatically analyzes what you are eating and explains it in plain language.',
            },
            {
              heading: 'What WIHY Analyzes:',
              items: [
                'Macronutrients (carbohydrates, protein, fats, fiber)',
                'Micronutrients (vitamins and minerals)',
                'Added sugars, sweeteners, and additives',
                'Processing level and ingredient quality',
                'Portion impact and eating patterns',
              ],
            },
            {
              heading: 'Clear Answers:',
              items: [
                'What this food contributes',
                'What it may be missing',
                'What to balance next',
                'Whether it supports your goal',
              ],
            },
          ]}
        />

        {/* Predictive Insights Section */}
        <FeatureSection
          id="predictive-insights"
          title="Predictive Insights"
          tagline="See where your habits are heading"
          icon="trending-up"
          details={[
            {
              text: 'WIHY looks at patterns across your food choices, activity, and consistency to help you understand what is likely to happen next.',
            },
            {
              heading: 'What WIHY Can Detect:',
              items: [
                'Likelihood of eating out of routine versus hunger',
                'Patterns that suggest motivation or avoidance',
                'Consistency in movement and workouts',
                'Shifts toward more or less calorie-dense foods',
                'Habits that tend to lead toward weight gain or loss',
                'Early signs of burnout or disengagement',
              ],
            },
            {
              heading: 'Why It Matters:',
              text: 'Most health setbacks happen slowly, through small repeated behaviors. Early awareness lets you adjust with intention.',
            },
          ]}
        />

        {/* Fact Check Section */}
        <FeatureSection
          id="fact-check"
          title="Fact Check"
          tagline="Verify claims with real evidence"
          icon="checkmark-circle"
          details={[
            {
              text: 'Health information is full of claims that sound convincing but lack evidence. WIHY lets you fact-check claims by analyzing available research.',
            },
            {
              heading: 'How Fact Checking Works:',
              items: [
                'Identifies the exact health or nutrition statement',
                'Searches relevant research and trusted data sources',
                'Evaluates study type, consistency, and limitations',
                'Separates correlation from causation',
                'Explains what the evidence actually supports',
              ],
            },
            {
              heading: 'What You See:',
              items: [
                'Strength of evidence',
                'Level of certainty',
                'What research supports',
                'What research does not support',
                'Common misunderstandings',
              ],
            },
          ]}
        />

        {/* Platform Stack */}
        <View style={styles.platformSection}>
          <Text style={styles.platformTitle}>One Connected Platform</Text>
          <Text style={styles.platformSubtitle}>
            Progress tracking, nutrition, research, fitness, and coaching unified in one place.
          </Text>

          <View style={styles.platformFeatures}>
            <PlatformFeature
              title="My Progress"
              description="Track how your nutrition, activity, and habits change over time."
              icon="trending-up"
            />
            <PlatformFeature
              title="Consumption"
              description="Track meals, groceries, and planning in one place."
              icon="restaurant"
            />
            <PlatformFeature
              title="Research"
              description="Search nutrition and health research without reading hundreds of papers."
              icon="library"
            />
            <PlatformFeature
              title="Fitness"
              description="Generate workout plans that fit your schedule and goals."
              icon="fitness"
            />
            <PlatformFeature
              title="Coach Portal"
              description="Track clients and improve engagement and retention."
              icon="person"
            />
            <PlatformFeature
              title="Parent Portal"
              description="Get visibility into children's intake and household consumption."
              icon="home"
            />
          </View>
        </View>

        {/* Footer CTA */}
        <View style={styles.footerCTASection}>
          <Text style={styles.footerCTATitle}>Experience WIHY Intelligence</Text>
          <Text style={styles.footerCTASubtitle}>
            WIHY is in early access. Join the beta and be among the first to experience intelligent health search.
          </Text>
          <CTAButton onPress={handleKickstarterPress} text="Join the WIHY Beta" />
        </View>

        {/* Footer Links */}
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

const PlatformFeature = ({ title, description, icon }: any) => (
  <View style={styles.platformFeatureCard}>
    <View style={styles.platformFeatureIconContainer}>
      <Ionicons name={icon} size={32} color={WIHY_GREEN} />
    </View>
    <Text style={styles.platformFeatureTitle}>{title}</Text>
    <Text style={styles.platformFeatureDescription}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 20,
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
