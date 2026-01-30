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
import type { PillMatch, PillScanResult } from '../services/types';
import { chatService } from '../services/chatService';

type NavigationProp = StackNavigationProp<RootStackParamList, 'PillIdentification'>;
type RouteProps = RouteProp<RootStackParamList, 'PillIdentification'>;

// Extended pill match with additional fields from our API
interface ExtendedPillMatch extends Partial<PillMatch> {
  name: string;
  brandName?: string;
  genericName?: string;
  imprint?: string;
  color?: string;
  shape?: string;
  rxcui?: string;
  confidence?: number;
  dosage?: string;
  manufacturer?: string;
}

// Extended pill data interface
interface PillData {
  scanId?: string;
  matches?: ExtendedPillMatch[];
  topMatch?: ExtendedPillMatch;
}

interface PillIdentificationParams {
  pillData: PillData;
  context?: any;
  capturedImage?: string;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.9) return { bg: '#d1fae5', border: '#10b981', text: '#065f46' };
  if (confidence >= 0.7) return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' };
  if (confidence >= 0.5) return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' };
  return { bg: '#fecaca', border: '#ef4444', text: '#991b1b' };
}

function getShapeIcon(shape?: string): string {
  const shapeLower = (shape || '').toLowerCase();
  if (shapeLower.includes('round') || shapeLower.includes('circle')) return 'ellipse';
  if (shapeLower.includes('oval') || shapeLower.includes('capsule')) return 'ellipse-outline';
  if (shapeLower.includes('square')) return 'square';
  if (shapeLower.includes('rectangle')) return 'tablet-portrait';
  if (shapeLower.includes('triangle')) return 'triangle';
  if (shapeLower.includes('diamond')) return 'diamond';
  return 'medical';
}

export default function PillIdentification() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const { pillData: initialData, context, capturedImage } = (route?.params || {}) as PillIdentificationParams;
  
  const [pillData, setPillData] = useState<PillData | null>(initialData || null);
  const [selectedMatch, setSelectedMatch] = useState<number>(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main', { screen: 'Scan' });
    }
  };

  const analyzePill = async (pillName: string) => {
    if (analyzing || aiAnalysis) return;
    
    setAnalyzing(true);
    try {
      const response = await chatService.ask(
        `Tell me about the medication ${pillName}. What is it used for? What are common side effects? Any important interactions or warnings?`,
        { type: 'pill_analysis', medication: pillName }
      );
      setAiAnalysis(response.response || 'Analysis unavailable');
    } catch (error) {
      console.error('Pill analysis error:', error);
      Alert.alert('Analysis Error', 'Failed to analyze medication. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const openChatWithContext = (chatContext: any) => {
    const pillName = pillData?.topMatch?.name || pillData?.matches?.[0]?.name || 'this medication';
    navigation.navigate('FullChat', {
      context: {
        ...context,
        pillData: pillData,
        productType: 'pill',
        ...chatContext,
      },
      initialMessage: chatContext.query || `Tell me about ${pillName}`,
    });
  };

  if (!pillData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading pill identification...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const topMatch = pillData.topMatch || pillData.matches?.[0];
  const allMatches = pillData.matches || [];
  const currentMatch = allMatches[selectedMatch] || topMatch;
  const confidence = currentMatch?.confidence || topMatch?.confidence || 0;
  const confidenceColors = getConfidenceColor(confidence);
  
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
          <Text style={styles.headerTitle}>Pill Identification</Text>
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
            <View style={styles.imageOverlay}>
              <View style={[styles.confidenceBadge, { backgroundColor: confidenceColors.bg }]}>
                <Ionicons name="checkmark-circle" size={14} color={confidenceColors.border} />
                <Text style={[styles.confidenceText, { color: confidenceColors.text }]}>
                  {Math.round(confidence * 100)}% match
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Main Match Card */}
        <SweepBorder
          colors={['#f59e0b', '#d97706', '#f59e0b'] as const}
          backgroundColor="#ffffff"
          radius={16}
          durationMs={4000}
        >
          <View style={styles.mainMatchCard}>
            <View style={styles.pillIconContainer}>
              <LinearGradient
                colors={['#fef3c7', '#fde68a']}
                style={styles.pillIconGradient}
              >
                <Ionicons name="medical" size={40} color="#f59e0b" />
              </LinearGradient>
            </View>
            
            <Text style={styles.pillName}>{topMatch?.name || 'Unknown Medication'}</Text>
            {topMatch?.brandName && (
              <Text style={styles.brandName}>{topMatch.brandName}</Text>
            )}
            {topMatch?.genericName && topMatch.genericName !== topMatch.name && (
              <Text style={styles.genericName}>Generic: {topMatch.genericName}</Text>
            )}
            
            {/* Physical Characteristics */}
            <View style={styles.characteristicsContainer}>
              {topMatch?.imprint && (
                <View style={styles.characteristicChip}>
                  <Ionicons name="text" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.characteristicText}>Imprint: {topMatch.imprint}</Text>
                </View>
              )}
              {topMatch?.color && (
                <View style={styles.characteristicChip}>
                  <Ionicons name="color-palette" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.characteristicText}>{topMatch.color}</Text>
                </View>
              )}
              {topMatch?.shape && (
                <View style={styles.characteristicChip}>
                  <Ionicons name={getShapeIcon(topMatch.shape) as any} size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.characteristicText}>{topMatch.shape}</Text>
                </View>
              )}
            </View>

            {/* Additional Info */}
            {(topMatch?.dosage || topMatch?.manufacturer) && (
              <View style={styles.additionalInfo}>
                {topMatch.dosage && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Dosage:</Text>
                    <Text style={styles.infoValue}>{topMatch.dosage}</Text>
                  </View>
                )}
                {topMatch.manufacturer && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Manufacturer:</Text>
                    <Text style={styles.infoValue}>{topMatch.manufacturer}</Text>
                  </View>
                )}
                {topMatch.rxcui && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>RxCUI:</Text>
                    <Text style={styles.infoValue}>{topMatch.rxcui}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </SweepBorder>

        {/* AI Analysis Section */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="flask" size={18} color="#f59e0b" /> Medication Analysis
          </Text>
          
          {!aiAnalysis && !analyzing && (
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={() => analyzePill(topMatch?.name || 'this medication')}
            >
              <LinearGradient
                colors={['#fef3c7', '#fde68a']}
                style={styles.analyzeButtonGradient}
              >
                <Ionicons name="search" size={20} color="#d97706" />
                <Text style={styles.analyzeButtonText}>Analyze This Medication</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {analyzing && (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="small" color="#f59e0b" />
              <Text style={styles.analyzingText}>Analyzing medication...</Text>
            </View>
          )}

          {aiAnalysis && (
            <View style={styles.analysisResultCard}>
              <Text style={styles.analysisText}>{aiAnalysis}</Text>
            </View>
          )}
        </View>

        {/* Other Possible Matches */}
        {allMatches.length > 1 && (
          <View style={styles.otherMatchesSection}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="list" size={18} color="#f59e0b" /> Other Possible Matches
            </Text>
            
            {allMatches.slice(1, 5).map((match, index) => {
              const matchConfidence = match.confidence || 0;
              const matchColors = getConfidenceColor(matchConfidence);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.otherMatchCard}
                  onPress={() => {
                    setSelectedMatch(index + 1);
                    setAiAnalysis(null);
                  }}
                >
                  <View style={styles.otherMatchLeft}>
                    <Ionicons name="medical-outline" size={24} color="#f59e0b" />
                    <View style={styles.otherMatchInfo}>
                      <Text style={styles.otherMatchName}>{match.name}</Text>
                      {match.brandName && (
                        <Text style={styles.otherMatchBrand}>{match.brandName}</Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.otherMatchConfidence, { backgroundColor: matchColors.bg }]}>
                    <Text style={[styles.otherMatchConfidenceText, { color: matchColors.text }]}>
                      {Math.round(matchConfidence * 100)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Warning Section */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={20} color="#dc2626" />
            <Text style={styles.warningTitle}>Important Safety Information</Text>
          </View>
          <Text style={styles.warningText}>
            This identification is for informational purposes only and should not be used as medical advice. 
            Always consult a healthcare professional or pharmacist before taking any medication.
          </Text>
        </View>

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
              <Ionicons name="swap-horizontal" size={18} color={theme.colors.textSecondary} />
              <Text style={styles.secondaryActionText}>Compare alternatives</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => Alert.alert('Feature Coming Soon', 'Medication tracking feature will be available soon!')}
            >
              <Ionicons name="calendar" size={18} color={theme.colors.textSecondary} />
              <Text style={styles.secondaryActionText}>Track medication</Text>
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
    // color: theme.colors.textSecondary
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
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Main Match Card
  mainMatchCard: {
    padding: 20,
    alignItems: 'center',
  },
  pillIconContainer: {
    marginBottom: 16,
  },
  pillIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillName: {
    fontSize: 24,
    fontWeight: '800',
    // color: theme.colors.text
    textAlign: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
    marginTop: 4,
  },
  genericName: {
    fontSize: 14,
    // color: theme.colors.textSecondary
    marginTop: 4,
  },
  characteristicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  characteristicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    // // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  characteristicText: {
    fontSize: 13,
    // color: theme.colors.text
  },
  additionalInfo: {
    width: '100%',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    // color: theme.colors.textSecondary
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    // color: theme.colors.text
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    // color: theme.colors.text
    marginBottom: 12,
  },
  analyzeButton: {
    overflow: 'hidden',
    borderRadius: 12,
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
    color: '#d97706',
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
    // color: theme.colors.textSecondary
  },
  analysisResultCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  analysisText: {
    fontSize: 14,
    // color: theme.colors.text
    lineHeight: 22,
  },

  // Other Matches
  otherMatchesSection: {
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
  otherMatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  otherMatchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  otherMatchInfo: {
    flex: 1,
  },
  otherMatchName: {
    fontSize: 14,
    fontWeight: '600',
    // color: theme.colors.text
  },
  otherMatchBrand: {
    fontSize: 12,
    // color: theme.colors.textSecondary
  },
  otherMatchConfidence: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  otherMatchConfidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Warning Section
  warningSection: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
  },
  warningText: {
    fontSize: 13,
    color: '#7f1d1d',
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
    // color: theme.colors.text
    fontSize: 14,
    fontWeight: '500',
  },
});
