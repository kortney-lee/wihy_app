import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '../components/shared';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { SweepBorder } from '../components/SweepBorder';
import { useTheme } from '../context/ThemeContext';
import type { LabelScanResponse, GreenwashingFlag, MarketingClaim } from '../services/types';
import { chatService } from '../services/chatService';

type NavigationProp = StackNavigationProp<RootStackParamList, 'LabelReader'>;
type RouteProps = RouteProp<RootStackParamList, 'LabelReader'>;

// Extended label data interface
interface LabelData {
  productName?: string;
  summary?: string;
  detectedText?: string;
  detectedClaims?: MarketingClaim[];
  greenwashingFlags?: GreenwashingFlag[];
  greenwashingScore?: number;
  sustainabilityScore?: number;
  detectedCertifications?: string[];
  healthClaims?: string[];
  ingredientsList?: string[];
  charts?: any;
  recommendations?: string[];
  analysis?: any;
}

interface LabelReaderParams {
  labelData: LabelData;
  context?: any;
  capturedImage?: string;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function getGreenwashingColor(score: number) {
  if (score <= 20) return { bg: '#d1fae5', border: '#10b981', text: '#065f46', label: 'Very Low Risk' };
  if (score <= 40) return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', label: 'Low Risk' };
  if (score <= 60) return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', label: 'Moderate Risk' };
  if (score <= 80) return { bg: '#fed7aa', border: '#f97316', text: '#9a3412', label: 'High Risk' };
  return { bg: '#fecaca', border: '#ef4444', text: '#991b1b', label: 'Very High Risk' };
}

function getFlagSeverityColor(severity: string) {
  switch (severity) {
    case 'positive': return { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: 'checkmark-circle' };
    case 'low': return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', icon: 'information-circle' };
    case 'medium': return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: 'alert-circle' };
    case 'high': return { bg: '#fecaca', border: '#ef4444', text: '#991b1b', icon: 'warning' };
    default: return { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280', icon: 'help-circle' };
  }
}

function getClaimCategoryIcon(category: string): string {
  switch (category) {
    case 'certification': return 'ribbon';
    case 'marketing': return 'megaphone';
    case 'ingredient': return 'flask';
    case 'health': return 'heart';
    case 'environmental': return 'leaf';
    default: return 'pricetag';
  }
}

export default function LabelReader() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const { labelData: initialData, context, capturedImage } = (route?.params || {}) as LabelReaderParams;
  
  const [labelData, setLabelData] = useState<LabelData | null>(initialData || null);
  const [expandedFlags, setExpandedFlags] = useState(false);
  const [expandedClaims, setExpandedClaims] = useState(false);
  const [expandedText, setExpandedText] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main', { screen: 'Scan' });
    }
  };

  const analyzeLabel = async () => {
    if (analyzing || aiAnalysis) return;
    
    setAnalyzing(true);
    try {
      const claims = labelData?.detectedClaims?.map(c => c.claim).join(', ') || '';
      const response = await chatService.ask(
        `Analyze these product label claims for marketing accuracy: ${claims}. Are these claims legitimate or potentially misleading?`,
        { type: 'label_analysis', claims: labelData?.detectedClaims }
      );
      setAiAnalysis(response.response || 'Analysis unavailable');
    } catch (error) {
      console.error('Label analysis error:', error);
      Alert.alert('Analysis Error', 'Failed to analyze label. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const openChatWithContext = (chatContext: any) => {
    navigation.navigate('FullChat', {
      context: {
        ...context,
        labelData: labelData,
        productType: 'label',
        ...chatContext,
      },
      initialMessage: chatContext.query || `Analyze the claims on ${labelData?.productName || 'this product'}`,
    });
  };

  if (!labelData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Loading label analysis...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const greenwashingScore = labelData.greenwashingScore || 0;
  const greenwashingColors = getGreenwashingColor(greenwashingScore);
  const flags = labelData.greenwashingFlags || [];
  const claims = labelData.detectedClaims || [];
  const positiveFlags = flags.filter(f => f.severity === 'positive');
  const concernFlags = flags.filter(f => f.severity !== 'positive');
  
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#ef4444', '#dc2626']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
          <Text style={styles.headerTitle}>Label Reader</Text>

        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Captured Image */}
        {capturedImage && (
          <View style={styles.imageSection}>
            <Image
              source={{ uri: capturedImage }}
              style={styles.capturedImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Product Name */}
        {labelData.productName && (
          <View style={styles.productNameSection}>
            <Text style={styles.productName}>{labelData.productName}</Text>
          </View>
        )}

        {/* Greenwashing Score Card */}
        <SweepBorder
          colors={[greenwashingColors.border, greenwashingColors.text, greenwashingColors.border] as const}
          backgroundColor="#ffffff"
          radius={16}
          durationMs={4000}
        >
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Ionicons name="shield-checkmark" size={24} color={greenwashingColors.border} />
              <Text style={styles.scoreTitle}>Greenwashing Risk Score</Text>
            </View>
            <View style={styles.scoreValueContainer}>
              <Text style={[styles.scoreValue, { color: greenwashingColors.text }]}>
                {greenwashingScore}
              </Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: greenwashingColors.bg }]}>
              <Text style={[styles.scoreBadgeText, { color: greenwashingColors.text }]}>
                {greenwashingColors.label}
              </Text>
            </View>
            
            {/* Score Bar */}
            <View style={styles.scoreBarContainer}>
              <View style={styles.scoreBar}>
                <View 
                  style={[
                    styles.scoreBarFill, 
                    { 
                      width: `${greenwashingScore}%`,
                      backgroundColor: greenwashingColors.border 
                    }
                  ]} 
                />
              </View>
              <View style={styles.scoreBarLabels}>
                <Text style={styles.scoreBarLabel}>Low Risk</Text>
                <Text style={styles.scoreBarLabel}>High Risk</Text>
              </View>
            </View>
          </View>
        </SweepBorder>

        {/* Sustainability Score if available */}
        {labelData.sustainabilityScore !== undefined && (
          <View style={styles.sustainabilityCard}>
            <View style={styles.sustainabilityHeader}>
              <Ionicons name="leaf" size={20} color="#10b981" />
              <Text style={styles.sustainabilityTitle}>Sustainability Score</Text>
            </View>
            <Text style={styles.sustainabilityValue}>{labelData.sustainabilityScore}/100</Text>
          </View>
        )}

        {/* Greenwashing Flags */}
        {flags.length > 0 && (
          <View style={styles.flagsSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedFlags(!expandedFlags)}
            >
              <Text style={styles.sectionTitle}>
                <Ionicons name="flag" size={18} color="#ef4444" /> Greenwashing Flags ({flags.length})
              </Text>
              <Ionicons
                name={expandedFlags ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>

            {/* Always show first few flags */}
            {(expandedFlags ? flags : flags.slice(0, 3)).map((flag, index) => {
              const colors = getFlagSeverityColor(flag.severity);
              return (
                <View 
                  key={index} 
                  style={[styles.flagCard, { backgroundColor: colors.bg, borderColor: colors.border }]}
                >
                  <View style={styles.flagHeader}>
                    <Ionicons name={colors.icon as any} size={18} color={colors.border} />
                    <Text style={[styles.flagTitle, { color: colors.text }]}>{flag.flag}</Text>
                  </View>
                  <Text style={[styles.flagDetail, { color: colors.text }]}>{flag.detail}</Text>
                  {flag.claim_text && (
                    <View style={styles.flagClaimContainer}>
                      <Text style={styles.flagClaimLabel}>Claim:</Text>
                      <Text style={styles.flagClaimText}>"{flag.claim_text}"</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {!expandedFlags && flags.length > 3 && (
              <Text style={styles.showMoreText}>
                +{flags.length - 3} more flags
              </Text>
            )}
          </View>
        )}

        {/* Detected Claims */}
        {claims.length > 0 && (
          <View style={styles.claimsSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedClaims(!expandedClaims)}
            >
              <Text style={styles.sectionTitle}>
                <Ionicons name="pricetags" size={18} color="#ef4444" /> Detected Claims ({claims.length})
              </Text>
              <Ionicons
                name={expandedClaims ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>

            {(expandedClaims ? claims : claims.slice(0, 4)).map((claim, index) => (
              <View key={index} style={styles.claimCard}>
                <View style={styles.claimHeader}>
                  <Ionicons 
                    name={getClaimCategoryIcon(claim.category) as any} 
                    size={16} 
                    color="#6b7280" 
                  />
                  <Text style={styles.claimCategory}>{claim.category}</Text>
                  {claim.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                  {claim.needs_verification && (
                    <View style={styles.unverifiedBadge}>
                      <Ionicons name="help-circle" size={14} color="#f59e0b" />
                      <Text style={styles.unverifiedText}>Unverified</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.claimText}>{claim.claim}</Text>
                {claim.description && (
                  <Text style={styles.claimDescription}>{claim.description}</Text>
                )}
              </View>
            ))}

            {!expandedClaims && claims.length > 4 && (
              <Text style={styles.showMoreText}>
                +{claims.length - 4} more claims
              </Text>
            )}
          </View>
        )}

        {/* Certifications */}
        {labelData.detectedCertifications && labelData.detectedCertifications.length > 0 && (
          <View style={styles.certificationsSection}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="ribbon" size={18} color="#10b981" /> Certifications
            </Text>
            <View style={styles.certificationsContainer}>
              {labelData.detectedCertifications.map((cert, index) => (
                <View key={index} style={styles.certificationChip}>
                  <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                  <Text style={styles.certificationText}>{cert}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Detected Text */}
        {labelData.detectedText && (
          <View style={styles.detectedTextSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedText(!expandedText)}
            >
              <Text style={styles.sectionTitle}>
                <Ionicons name="document-text" size={18} color="#ef4444" /> Detected Text
              </Text>
              <Ionicons
                name={expandedText ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
            
            {expandedText && (
              <View style={styles.detectedTextContainer}>
                <Text style={styles.detectedText}>{labelData.detectedText}</Text>
              </View>
            )}
          </View>
        )}

        {/* AI Analysis Section */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="analytics" size={18} color="#ef4444" /> AI Analysis
          </Text>
          
          {!aiAnalysis && !analyzing && (
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={analyzeLabel}
            >
              <LinearGradient
                colors={['#fef2f2', '#fecaca']}
                style={styles.analyzeButtonGradient}
              >
                <Ionicons name="search" size={20} color="#dc2626" />
                <Text style={styles.analyzeButtonText}>Analyze Label Claims</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {analyzing && (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="small" color="#ef4444" />
              <Text style={styles.analyzingText}>Analyzing label claims...</Text>
            </View>
          )}

          {aiAnalysis && (
            <View style={styles.analysisResultCard}>
              <Text style={styles.analysisText}>{aiAnalysis}</Text>
            </View>
          )}
        </View>

        {/* Recommendations */}
        {labelData.recommendations && labelData.recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="bulb" size={18} color="#f59e0b" /> Recommendations
            </Text>
            {labelData.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="arrow-forward-circle" size={16} color="#f59e0b" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Pressable
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => openChatWithContext({ type: 'general' })}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#ffffff" />
            <Text style={styles.primaryActionText}>Ask WiHY</Text>
          </Pressable>
          <View style={styles.secondaryActions}>
            <Pressable
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => openChatWithContext({ type: 'alternatives' })}
            >
              <Ionicons name="swap-horizontal" size={18} color="#6b7280" />
              <Text style={styles.secondaryActionText}>Compare alternatives</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => Alert.alert('Feature Coming Soon', 'Product tracking feature will be available soon!')}
            >
              <Ionicons name="bookmark" size={18} color="#6b7280" />
              <Text style={styles.secondaryActionText}>Save product</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginRight: 56,
  },
  content: {
    flex: 1,
    padding: 16,
  },

  // Image Section
  imageSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  capturedImage: {
    width: '100%',
    height: 200,
  },

  // Product Name
  productNameSection: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },

  // Score Card
  scoreCard: {
    padding: 20,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  scoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 20,
    color: '#9ca3af',
    marginLeft: 4,
  },
  scoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  scoreBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreBarContainer: {
    width: '100%',
    marginTop: 16,
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scoreBarLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },

  // Sustainability
  sustainabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  sustainabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sustainabilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
  },
  sustainabilityValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },

  // Flags Section
  flagsSection: {
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  flagCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  flagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  flagTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  flagDetail: {
    fontSize: 13,
    lineHeight: 18,
  },
  flagClaimContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 8,
    padding: 10,
  },
  flagClaimLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  flagClaimText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#374151',
  },
  showMoreText: {
    textAlign: 'center',
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 4,
  },

  // Claims Section
  claimsSection: {
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  claimCard: {
    // // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  claimCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  unverifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
  },
  claimText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  claimDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },

  // Certifications
  certificationsSection: {
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  certificationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  certificationText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#065f46',
  },

  // Detected Text
  detectedTextSection: {
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detectedTextContainer: {
    // // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  detectedText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },

  // Analysis Section
  analysisSection: {
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analyzeButton: {
    overflow: 'hidden',
    borderRadius: 12,
    marginTop: 8,
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  analyzeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  analyzingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  analysisResultCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  analysisText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },

  // Recommendations
  recommendationsSection: {
    // // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },

  // Action Section
  actionSection: {
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: '#4cbb17',
    borderWidth: 1.5,
    borderColor: '#4cbb17',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    // // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
});
