import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardTheme } from '../theme/dashboardTheme';
import { SweepBorder } from '../components/SweepBorder';
import type { BeautyProductResponse, BeautyIngredientConcern } from '../services/types';
import { chatService } from '../services/chatService';

type NavigationProp = StackNavigationProp<RootStackParamList, 'BeautyFacts'>;
type RouteProps = RouteProp<RootStackParamList, 'BeautyFacts'>;

// ========================================
// HELPER FUNCTIONS
// ========================================

function getConcernColor(severity: 'low' | 'moderate' | 'high') {
  switch (severity) {
    case 'low':
      return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' };
    case 'moderate':
      return { bg: '#fed7aa', border: '#f97316', text: '#9a3412' };
    case 'high':
      return { bg: '#fecaca', border: '#ef4444', text: '#991b1b' };
    default:
      return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' };
  }
}

function getSafetyBadgeColor(hasIssue: boolean) {
  return hasIssue 
    ? { bg: '#fecaca', border: '#ef4444', text: '#991b1b', icon: 'warning' }
    : { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: 'checkmark-circle' };
}

export default function BeautyFacts() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();

  const { product: initialProduct, context } = route?.params || { product: null, context: null };
  
  const [product, setProduct] = useState<BeautyProductResponse | null>(null);
  const [expandedIngredients, setExpandedIngredients] = useState(false);
  const [analyzingIngredient, setAnalyzingIngredient] = useState<string | null>(null);
  const [ingredientAnalysis, setIngredientAnalysis] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct as BeautyProductResponse);
    }
  }, [initialProduct]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main', { screen: 'Scan' });
    }
  };

  const analyzeIngredient = async (ingredient: string) => {
    const trimmed = ingredient.trim();
    
    if (ingredientAnalysis.has(trimmed) || analyzingIngredient === trimmed) {
      return;
    }

    setAnalyzingIngredient(trimmed);

    try {
      const chatResponse = await chatService.ask(
        `Analyze this beauty/cosmetic ingredient for safety and skin concerns: ${trimmed}. Is it safe for skin? Any concerns?`,
        { type: 'beauty_ingredient_analysis', ingredient: trimmed }
      );
      
      setIngredientAnalysis(prev => {
        const newMap = new Map(prev);
        newMap.set(trimmed, chatResponse.response || 'Analysis unavailable');
        return newMap;
      });
    } catch (error) {
      console.error('Ingredient analysis error:', error);
      Alert.alert('Analysis Error', 'Failed to analyze ingredient. Please try again.');
    } finally {
      setAnalyzingIngredient(null);
    }
  };

  const openChatWithContext = (chatContext: any) => {
    navigation.navigate('FullChat', {
      context: {
        ...context,
        beautyProduct: product,
        productType: 'beauty',
        ...chatContext,
      },
      initialMessage: chatContext.query || `Tell me about ${product?.product?.name || 'this product'}`,
    });
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec4899" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { product: productInfo, ingredients } = product;
  const hasAnyConcerns = ingredients.concerns.length > 0 || ingredients.warnings.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Beauty Product</Text>
        <TouchableOpacity 
          onPress={() => openChatWithContext({ type: 'beauty-help' })}
          style={styles.helpButton}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Card */}
        <View style={styles.productCard}>
          <LinearGradient
            colors={['#fdf2f8', '#fce7f3']}
            style={styles.productGradient}
          >
            {productInfo.image_url ? (
              <Image source={{ uri: productInfo.image_url }} style={styles.productImage} />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="sparkles" size={48} color="#ec4899" />
              </View>
            )}
            
            <View style={styles.productInfo}>
              <Text style={styles.productBrand}>{productInfo.brand || 'Unknown Brand'}</Text>
              <Text style={styles.productName}>{productInfo.name}</Text>
              <Text style={styles.productCategory}>{productInfo.category}</Text>
              {productInfo.quantity && (
                <Text style={styles.productQuantity}>{productInfo.quantity}</Text>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Safety Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="shield-checkmark" size={18} color="#ec4899" /> Safety Overview
          </Text>
          
          <View style={styles.safetyGrid}>
            <SafetyBadge 
              label="Fragrance"
              hasIssue={ingredients.has_fragrance}
              issueText="Contains"
              safeText="Free"
            />
            <SafetyBadge 
              label="Parabens"
              hasIssue={ingredients.has_parabens}
              issueText="Contains"
              safeText="Free"
            />
            <SafetyBadge 
              label="Sulfates"
              hasIssue={ingredients.has_sulfates}
              issueText="Contains"
              safeText="Free"
            />
          </View>
        </View>

        {/* Warnings */}
        {ingredients.warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="warning" size={18} color="#ef4444" /> Warnings
            </Text>
            {ingredients.warnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Ingredient Concerns */}
        {ingredients.concerns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="alert-circle" size={18} color="#f97316" /> Ingredient Concerns
            </Text>
            {ingredients.concerns.map((concern, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.concernItem}
                onPress={() => analyzeIngredient(concern.ingredient)}
              >
                <View style={styles.concernHeader}>
                  <Text style={styles.concernIngredient}>{concern.ingredient}</Text>
                  {analyzingIngredient === concern.ingredient ? (
                    <ActivityIndicator size="small" color="#f97316" />
                  ) : (
                    <Ionicons name="information-circle-outline" size={20} color="#f97316" />
                  )}
                </View>
                <Text style={styles.concernReason}>{concern.reason}</Text>
                {ingredientAnalysis.has(concern.ingredient) && (
                  <View style={styles.ingredientAnalysis}>
                    <Text style={styles.analysisText}>
                      {ingredientAnalysis.get(concern.ingredient)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Full Ingredients List */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.ingredientsHeader}
            onPress={() => setExpandedIngredients(!expandedIngredients)}
          >
            <Text style={styles.sectionTitle}>
              <Ionicons name="list" size={18} color="#ec4899" /> Full Ingredients
            </Text>
            <Ionicons 
              name={expandedIngredients ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#ec4899" 
            />
          </TouchableOpacity>
          
          {expandedIngredients && (
            <View style={styles.ingredientsList}>
              <Text style={styles.ingredientsText}>{ingredients.full_list}</Text>
              <TouchableOpacity 
                style={styles.analyzeAllButton}
                onPress={() => openChatWithContext({ 
                  type: 'ingredients-analysis',
                  query: `Analyze all these beauty product ingredients for safety: ${ingredients.full_list}`
                })}
              >
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.analyzeAllText}>Ask WiHY about these ingredients</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Product Details */}
        {(productInfo.origin_countries || productInfo.certifications || productInfo.packaging) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="information-circle" size={18} color="#ec4899" /> Product Details
            </Text>
            <View style={styles.detailsGrid}>
              {productInfo.origin_countries && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Origin</Text>
                  <Text style={styles.detailValue}>{productInfo.origin_countries}</Text>
                </View>
              )}
              {productInfo.packaging && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Packaging</Text>
                  <Text style={styles.detailValue}>{productInfo.packaging}</Text>
                </View>
              )}
              {productInfo.certifications && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Certifications</Text>
                  <Text style={styles.detailValue}>{productInfo.certifications}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Overall Assessment */}
        <View style={styles.section}>
          <SweepBorder radius={16} durationMs={3000}>
            <View style={[
              styles.assessmentCard,
              { backgroundColor: hasAnyConcerns ? '#fef3c7' : '#d1fae5' }
            ]}>
              <View style={styles.assessmentHeader}>
                <Ionicons 
                  name={hasAnyConcerns ? 'warning' : 'checkmark-circle'} 
                  size={32} 
                  color={hasAnyConcerns ? '#f59e0b' : '#10b981'} 
                />
                <Text style={[
                  styles.assessmentTitle,
                  { color: hasAnyConcerns ? '#92400e' : '#065f46' }
                ]}>
                  {hasAnyConcerns ? 'Some Concerns Found' : 'Generally Safe'}
                </Text>
              </View>
              <Text style={[
                styles.assessmentText,
                { color: hasAnyConcerns ? '#78350f' : '#047857' }
              ]}>
                {hasAnyConcerns 
                  ? `This product has ${ingredients.concerns.length} ingredient concern(s) and ${ingredients.warnings.length} warning(s). Review them above.`
                  : 'No major ingredient concerns were found in this product. Always patch test new products.'}
              </Text>
              <TouchableOpacity 
                style={[
                  styles.askWihyButton,
                  { backgroundColor: hasAnyConcerns ? '#f59e0b' : '#10b981' }
                ]}
                onPress={() => openChatWithContext({ 
                  type: 'beauty-assessment',
                  query: `Give me a full safety assessment of ${productInfo.name} by ${productInfo.brand}`
                })}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
                <Text style={styles.askWihyText}>Ask WiHY for Full Assessment</Text>
              </TouchableOpacity>
            </View>
          </SweepBorder>
        </View>

        {/* Data Source */}
        <View style={styles.sourceInfo}>
          <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
          <Text style={styles.sourceText}>
            Data from {product.metadata.data_source} • {product.metadata.database_size || '61,000+ products'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Safety Badge Component
function SafetyBadge({ 
  label, 
  hasIssue, 
  issueText, 
  safeText 
}: { 
  label: string; 
  hasIssue: boolean; 
  issueText: string; 
  safeText: string;
}) {
  const colors = getSafetyBadgeColor(hasIssue);
  
  return (
    <View style={[styles.safetyBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Ionicons 
        name={hasIssue ? 'alert-circle' : 'checkmark-circle'} 
        size={24} 
        color={colors.text} 
      />
      <Text style={[styles.safetyLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.safetyStatus, { color: colors.text }]}>
        {hasIssue ? issueText : safeText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#9ca3af',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ec4899',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  helpButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  productCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  productGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  productImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productBrand: {
    fontSize: 12,
    color: '#be185d',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginTop: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#9d174d',
    marginTop: 4,
  },
  productQuantity: {
    fontSize: 12,
    color: '#be185d',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#252547',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  safetyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  safetyBadge: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  safetyLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  safetyStatus: {
    fontSize: 10,
    marginTop: 2,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#991b1b',
  },
  concernItem: {
    backgroundColor: '#fff7ed',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f97316',
  },
  concernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  concernIngredient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9a3412',
  },
  concernReason: {
    fontSize: 13,
    color: '#c2410c',
    marginTop: 4,
  },
  ingredientAnalysis: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffedd5',
    borderRadius: 6,
  },
  analysisText: {
    fontSize: 12,
    color: '#78350f',
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientsList: {
    marginTop: 8,
  },
  ingredientsText: {
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 20,
  },
  analyzeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec4899',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  analyzeAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsGrid: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  detailLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  assessmentCard: {
    padding: 20,
    borderRadius: 16,
  },
  assessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  assessmentTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  assessmentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  askWihyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  askWihyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
