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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '../components/shared';
import { useTheme } from '../context/ThemeContext';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardTheme } from '../theme/dashboardTheme';
import { SweepBorder } from '../components/SweepBorder';
import type { PetFoodProductResponse, PetFoodIngredientConcern } from '../services/types';
import { chatService } from '../services/chatService';

type NavigationProp = StackNavigationProp<RootStackParamList, 'PetFoodFacts'>;
type RouteProps = RouteProp<RootStackParamList, 'PetFoodFacts'>;

// ========================================
// HELPER FUNCTIONS
// ========================================

function getPetIcon(petType: string): string {
  switch (petType?.toLowerCase()) {
    case 'dog': return '🐕';
    case 'cat': return '🐈';
    case 'bird': return '🐦';
    case 'fish': return '🐟';
    default: return '🐾';
  }
}

function getNutritionGradeColor(grade: string) {
  switch (grade?.toUpperCase()) {
    case 'A': return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
    case 'B': return { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' };
    case 'C': return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
    case 'D': return { bg: '#fed7aa', text: '#9a3412', border: '#f97316' };
    case 'E':
    case 'F': return { bg: '#fecaca', text: '#991b1b', border: '#ef4444' };
    default: return { bg: '#e5e7eb', text: '#111827' /* theme.colors.text */, border: '#9ca3af' };
  }
}

function getIngredientFlagColor(hasIssue: boolean) {
  return hasIssue 
    ? { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: 'alert-circle' }
    : { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: 'checkmark-circle' };
}

export default function PetFoodFacts() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const { product: initialProduct, context } = route?.params || { product: null, context: null };
  
  const [product, setProduct] = useState<PetFoodProductResponse | null>(null);
  const [expandedIngredients, setExpandedIngredients] = useState(false);
  const [analyzingIngredient, setAnalyzingIngredient] = useState<string | null>(null);
  const [ingredientAnalysis, setIngredientAnalysis] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct as PetFoodProductResponse);
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
      const petType = product?.pet_info?.suggested_pet_type || 'pet';
      const chatResponse = await chatService.ask(
        `Analyze this ${petType} food ingredient for safety and nutrition: ${trimmed}. Is it good for ${petType}s? Any concerns?`,
        { type: 'pet_food_ingredient_analysis', ingredient: trimmed, petType }
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
    const petType = product?.pet_info?.suggested_pet_type || 'pet';
    navigation.navigate('FullChat', {
      context: {
        ...context,
        petFoodProduct: product,
        productType: 'pet_food',
        petType,
        ...chatContext,
      },
      initialMessage: chatContext.query || `Tell me about ${product?.product?.name || 'this pet food'}`,
    });
  };

  const insets = useSafeAreaInsets();

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </View>
    );
  }

  const { product: productInfo, nutrition, ingredients, pet_info } = product;
  const hasAnyConcerns = ingredients.concerns.length > 0;
  const petEmoji = getPetIcon(pet_info?.suggested_pet_type || 'other');
  const gradeColors = getNutritionGradeColor(nutrition.grade);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pet Food</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Card */}
        <View style={styles.productCard}>
          <LinearGradient
            colors={['#ede9fe', '#ddd6fe']}
            style={styles.productGradient}
          >
            {productInfo.image_url ? (
              <Image source={{ uri: productInfo.image_url }} style={styles.productImage} />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Text style={styles.petEmojiLarge}>{petEmoji}</Text>
              </View>
            )}
            
            <View style={styles.productInfo}>
              <View style={styles.petTypeBadge}>
                <Text style={styles.petTypeText}>
                  For {pet_info?.suggested_pet_type || 'Pets'}
                </Text>
              </View>
              <Text style={styles.productBrand}>{productInfo.brand || 'Unknown Brand'}</Text>
              <Text style={styles.productName}>{productInfo.name}</Text>
              <Text style={styles.productCategory}>{productInfo.category}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Nutrition Grade */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="nutrition" size={18} color="#8b5cf6" /> Nutrition Grade
          </Text>
          
          <View style={styles.gradeContainer}>
            <View style={[styles.gradeBadge, { backgroundColor: gradeColors.bg, borderColor: gradeColors.border }]}>
              <Text style={[styles.gradeText, { color: gradeColors.text }]}>{nutrition.grade}</Text>
            </View>
            
            <View style={styles.nutritionStats}>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Energy</Text>
                <Text style={styles.nutritionValue}>{nutrition.per_100g.energy_kcal} kcal/100g</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Protein</Text>
                <Text style={styles.nutritionValue}>{nutrition.per_100g.protein_g}g/100g</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Fat</Text>
                <Text style={styles.nutritionValue}>{nutrition.per_100g.fat_g}g/100g</Text>
              </View>
              {nutrition.per_100g.carbohydrates_g !== undefined && (
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                  <Text style={styles.nutritionValue}>{nutrition.per_100g.carbohydrates_g}g/100g</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Protein Sources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="fitness" size={18} color="#8b5cf6" /> Protein Sources
          </Text>
          
          <View style={styles.proteinSourcesContainer}>
            {ingredients.protein_sources.length > 0 ? (
              ingredients.protein_sources.map((source, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.proteinSourceBadge}
                  onPress={() => analyzeIngredient(source)}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.proteinSourceText}>{source}</Text>
                  {analyzingIngredient === source && (
                    <ActivityIndicator size="small" color="#8b5cf6" style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noProteinText}>No named protein sources identified</Text>
            )}
          </View>
        </View>

        {/* Ingredient Flags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="flag" size={18} color="#8b5cf6" /> Ingredient Flags
          </Text>
          
          <View style={styles.flagsGrid}>
            <IngredientFlag 
              label="Grains"
              hasIssue={ingredients.has_grain}
              issueText="Contains"
              safeText="Grain-Free"
              note="Some pets have sensitivities"
            />
            <IngredientFlag 
              label="By-Products"
              hasIssue={ingredients.has_byproducts}
              issueText="Contains"
              safeText="Free"
              note="Lower quality protein source"
            />
            <IngredientFlag 
              label="Artificial"
              hasIssue={ingredients.has_artificial}
              issueText="Contains"
              safeText="Free"
              note="Colors, flavors, preservatives"
            />
          </View>
        </View>

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
              <Ionicons name="list" size={18} color="#8b5cf6" /> Full Ingredients
            </Text>
            <Ionicons 
              name={expandedIngredients ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#8b5cf6" 
            />
          </TouchableOpacity>
          
          {expandedIngredients && (
            <View style={styles.ingredientsList}>
              <Text style={styles.ingredientsText}>{ingredients.full_list}</Text>
              <TouchableOpacity 
                style={styles.analyzeAllButton}
                onPress={() => openChatWithContext({ 
                  type: 'ingredients-analysis',
                  query: `Analyze all these ${pet_info?.suggested_pet_type || 'pet'} food ingredients: ${ingredients.full_list}`
                })}
              >
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.analyzeAllText}>Ask WiHY about these ingredients</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Product Details */}
        {(productInfo.origin_countries || productInfo.certifications || productInfo.quantity) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="information-circle" size={18} color="#8b5cf6" /> Product Details
            </Text>
            <View style={styles.detailsGrid}>
              {productInfo.quantity && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Size</Text>
                  <Text style={styles.detailValue}>{productInfo.quantity}</Text>
                </View>
              )}
              {productInfo.origin_countries && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Origin</Text>
                  <Text style={styles.detailValue}>{productInfo.origin_countries}</Text>
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
                <Text style={styles.assessmentEmoji}>{petEmoji}</Text>
                <Text style={[
                  styles.assessmentTitle,
                  { color: hasAnyConcerns ? '#92400e' : '#065f46' }
                ]}>
                  {hasAnyConcerns ? 'Some Concerns Found' : 'Good Choice!'}
                </Text>
              </View>
              <Text style={[
                styles.assessmentText,
                { color: hasAnyConcerns ? '#78350f' : '#047857' }
              ]}>
                {hasAnyConcerns 
                  ? `This ${pet_info?.suggested_pet_type || 'pet'} food has ${ingredients.concerns.length} ingredient concern(s). Review them above to make an informed decision.`
                  : `This appears to be a quality ${pet_info?.suggested_pet_type || 'pet'} food with ${ingredients.protein_sources.length > 0 ? 'identifiable protein sources' : 'standard ingredients'}.`}
              </Text>
            </View>
          </SweepBorder>
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
              onPress={() => openChatWithContext({ 
                type: 'pet-food-assessment',
                query: `Is ${productInfo.name} by ${productInfo.brand} a good choice for my ${pet_info?.suggested_pet_type || 'pet'}? Give me a full assessment.`
              })}
            >
              <Ionicons name="shield-checkmark" size={18} color={theme.colors.textSecondary} />
              <Text style={styles.secondaryActionText}>Full assessment</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => Alert.alert('Feature Coming Soon', 'Product tracking feature will be available soon!')}
            >
              <Ionicons name="bookmark" size={18} color={theme.colors.textSecondary} />
              <Text style={styles.secondaryActionText}>Save product</Text>
            </Pressable>
          </View>
        </View>

        {/* Data Source */}
        <View style={styles.sourceInfo}>
          <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
          <Text style={styles.sourceText}>
            Data from {product.metadata.data_source} • {product.metadata.database_size || '14,800+ products'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Ingredient Flag Component
function IngredientFlag({ 
  label, 
  hasIssue, 
  issueText, 
  safeText,
  note 
}: { 
  label: string; 
  hasIssue: boolean; 
  issueText: string; 
  safeText: string;
  note: string;
}) {
  const colors = getIngredientFlagColor(hasIssue);
  
  return (
    <View style={[styles.flagBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Ionicons 
        name={hasIssue ? 'alert-circle' : 'checkmark-circle'} 
        size={24} 
        color={colors.text} 
      />
      <Text style={[styles.flagLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.flagStatus, { color: colors.text }]}>
        {hasIssue ? issueText : safeText}
      </Text>
      <Text style={[styles.flagNote, { color: colors.text }]} numberOfLines={2}>
        {note}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
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
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginRight: 48,
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
  petEmojiLarge: {
    fontSize: 48,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  petTypeBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  petTypeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  productBrand: {
    fontSize: 12,
    color: '#6d28d9',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4c1d95',
    marginTop: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#7c3aed',
    marginTop: 4,
  },
  section: {
    // backgroundColor: '#ffffff', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    // color: theme.colors.text
    marginBottom: 12,
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  gradeBadge: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 40,
    fontWeight: '800',
  },
  nutritionStats: {
    flex: 1,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  nutritionLabel: {
    fontSize: 14,
    // color: theme.colors.textSecondary
  },
  nutritionValue: {
    fontSize: 14,
    // color: theme.colors.text
    fontWeight: '600',
  },
  proteinSourcesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  proteinSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  proteinSourceText: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
  },
  noProteinText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  flagsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  flagBadge: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  flagLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  flagStatus: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  flagNote: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.8,
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
    // color: theme.colors.text
    lineHeight: 20,
  },
  analyzeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
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
    // borderBottomColor: theme.colors.text,
  },
  detailLabel: {
    fontSize: 14,
    // color: theme.colors.textSecondary
  },
  detailValue: {
    fontSize: 14,
    // color: theme.colors.text
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
  assessmentEmoji: {
    fontSize: 32,
  },
  assessmentTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  assessmentText: {
    fontSize: 14,
    lineHeight: 20,
  },
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
    // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryActionText: {
    // color: theme.colors.text
    fontSize: 14,
    fontWeight: '500',
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: 12,
    // color: theme.colors.textSecondary
  },
});
