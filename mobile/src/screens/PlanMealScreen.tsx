import React, { useState, useContext, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform, StatusBar, Modal, ScrollView, TouchableOpacity, Text, TextInput, ActivityIndicator, FlatList, RefreshControl, Linking } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ManualMealForm } from '../components/ManualMealForm';
import SvgIcon from '../components/shared/SvgIcon';
import { CloseButton } from '../components/shared';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCreateMealWithShopping } from '../hooks/useCreateMealWithShopping';
import { SavedMeal, MealTemplate, MealIngredient } from '../services/mealService';
import { mealService } from '../services/mealService';
import { getMealDiaryService, Meal } from '../services/mealDiary';
import { authService } from '../services/authService';
import { dashboardTheme } from '../theme/dashboardTheme';
import type { RootStackParamList } from '../types/navigation';

interface PlanMealScreenProps {
  isDashboardMode?: boolean;
  onBack?: () => void;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * PlanMealScreen - Standalone dashboard for manual meal planning
 * 
 * This is a separate production from CreateMeals (AI meal plans).
 * Users can:
 * - Create meals manually by adding ingredients
 * - Search 4M+ products for nutrition data
 * - Build shopping lists and send to Instacart
 * - Use templates for quick meal creation
 * - Scan recipes from images
 * 
 * Follows the dashboard pattern from DESIGN_PATTERNS.md
 */
export default function PlanMealScreen({ 
  isDashboardMode = false, 
  onBack 
}: PlanMealScreenProps) {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const userId = user?.id || '';
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  
  // Product search is now inline in ManualMealForm
  
  // Meal templates modal state
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Library modal state
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryMeals, setLibraryMeals] = useState<Meal[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [libraryFilterTag, setLibraryFilterTag] = useState<string | null>(null);
  const [libraryOffset, setLibraryOffset] = useState(0);
  const [libraryHasMore, setLibraryHasMore] = useState(false);
  const [libraryTotal, setLibraryTotal] = useState(0);
  
  // Scanning state
  const [scanning, setScanning] = useState(false);
  
  // Saved meal ID
  const [savedMealId, setSavedMealId] = useState<string | null>(null);
  
  // Selected meal for loading into form
  const [selectedMealForEdit, setSelectedMealForEdit] = useState<Meal | null>(null);
  
  // Templates
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // Meal shopping hook for product search
  const mealShoppingHook = useCreateMealWithShopping(userId);
  
  // Library filter tags
  const libraryTags = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'High Protein', 'Low Carb', 'Vegan', 'Favorites'];

  const handleBack = () => {
    if (isDashboardMode && onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const handleShowProductSearch = () => {
    // Product search is now inline in ManualMealForm
    // This callback is kept for interface compatibility but does nothing
  };

  // ========================================================================
  // Meal Library Functions
  // ========================================================================
  
  /**
   * Load meals from the Meal Library with fields=minimal for efficiency
   * GET /api/users/:userId/meals?fields=minimal
   */
  const loadLibraryMeals = useCallback(async (
    search?: string,
    filterTag?: string,
    offset: number = 0,
    append: boolean = false
  ) => {
    if (!userId) return;
    
    setLoadingLibrary(true);
    try {
      const token = await authService.getAccessToken();
      const mealDiaryService = getMealDiaryService(token || undefined);
      
      // Determine meal_type filter
      let mealType: string | undefined;
      if (filterTag && ['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(filterTag)) {
        mealType = filterTag.toLowerCase();
      }
      
      // For Favorites, use the favorites endpoint
      if (filterTag === 'Favorites') {
        const result = await mealDiaryService.getFavorites(userId);
        setLibraryMeals(result.meals || []);
        setLibraryTotal(result.pagination?.total || result.meals?.length || 0);
        setLibraryHasMore(false);
        setLoadingLibrary(false);
        return;
      }
      
      // Standard query with pagination
      const result = await mealDiaryService.getAllMeals(userId, {
        limit: 20,
        offset,
        meal_type: mealType,
        search: search || undefined,
        sort: 'created_at',
        order: 'desc',
      });
      
      const meals = result.meals || [];
      
      if (append) {
        setLibraryMeals(prev => [...prev, ...meals]);
      } else {
        setLibraryMeals(meals);
      }
      
      setLibraryTotal(result.pagination?.total || meals.length);
      setLibraryHasMore(result.pagination?.hasMore || false);
      setLibraryOffset(offset + meals.length);
      
    } catch (error) {
      console.error('[PlanMealScreen] Error loading library meals:', error);
      Alert.alert('Error', 'Failed to load your meal library');
    } finally {
      setLoadingLibrary(false);
    }
  }, [userId]);
  
  /**
   * Handle library search
   */
  const handleLibrarySearch = useCallback((query: string) => {
    setLibrarySearchQuery(query);
    setLibraryOffset(0);
    loadLibraryMeals(query, libraryFilterTag || undefined, 0, false);
  }, [libraryFilterTag, loadLibraryMeals]);
  
  /**
   * Handle library filter tag selection
   */
  const handleLibraryFilterByTag = useCallback((tag: string) => {
    const newTag = libraryFilterTag === tag ? null : tag;
    setLibraryFilterTag(newTag);
    setLibraryOffset(0);
    loadLibraryMeals(librarySearchQuery, newTag || undefined, 0, false);
  }, [libraryFilterTag, librarySearchQuery, loadLibraryMeals]);
  
  /**
   * Load more meals (infinite scroll)
   */
  const handleLoadMoreMeals = useCallback(() => {
    if (!loadingLibrary && libraryHasMore) {
      loadLibraryMeals(librarySearchQuery, libraryFilterTag || undefined, libraryOffset, true);
    }
  }, [loadingLibrary, libraryHasMore, libraryOffset, librarySearchQuery, libraryFilterTag, loadLibraryMeals]);
  
  /**
   * Toggle favorite status of a meal
   */
  const handleToggleFavorite = useCallback(async (mealId: string) => {
    if (!userId) return;
    
    try {
      const token = await authService.getAccessToken();
      const mealDiaryService = getMealDiaryService(token || undefined);
      const result = await mealDiaryService.toggleFavorite(userId, mealId);
      
      // Update local state
      setLibraryMeals(prev => prev.map(meal => 
        meal.meal_id === mealId 
          ? { ...meal, is_favorite: result.is_favorite }
          : meal
      ));
    } catch (error) {
      console.error('[PlanMealScreen] Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  }, [userId]);
  
  /**
   * Delete a meal from library
   */
  const handleDeleteMeal = useCallback(async (mealId: string, mealName: string) => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${mealName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await authService.getAccessToken();
              const mealDiaryService = getMealDiaryService(token || undefined);
              await mealDiaryService.deleteMeal(userId, mealId);
              
              // Remove from local state
              setLibraryMeals(prev => prev.filter(meal => meal.meal_id !== mealId));
              setLibraryTotal(prev => prev - 1);
              
              Alert.alert('Success', 'Meal deleted successfully');
            } catch (error) {
              console.error('[PlanMealScreen] Error deleting meal:', error);
              Alert.alert('Error', 'Failed to delete meal');
            }
          }
        }
      ]
    );
  }, [userId]);
  
  /**
   * Log a meal (mark as eaten)
   */
  const handleLogMeal = useCallback(async (mealId: string, mealName: string) => {
    if (!userId) return;
    
    try {
      const token = await authService.getAccessToken();
      const mealDiaryService = getMealDiaryService(token || undefined);
      const result = await mealDiaryService.logMeal(userId, mealId);
      
      // Update local state
      setLibraryMeals(prev => prev.map(meal => 
        meal.meal_id === mealId 
          ? { ...meal, times_logged: result.times_logged, last_logged: result.last_logged }
          : meal
      ));
      
      Alert.alert('Logged!', `"${mealName}" logged (${result.times_logged} times total)`);
    } catch (error) {
      console.error('[PlanMealScreen] Error logging meal:', error);
      Alert.alert('Error', 'Failed to log meal');
    }
  }, [userId]);
  
  /**
   * Add a saved meal's ingredients to Instacart
   */
  const handleAddToInstacart = useCallback(async (meal: Meal) => {
    try {
      // Get full meal details if ingredients are not loaded
      let mealWithIngredients = meal;
      
      if (!meal.ingredients || meal.ingredients.length === 0) {
        const token = await authService.getAccessToken();
        const mealDiaryService = getMealDiaryService(token || undefined);
        const fullMeal = await mealDiaryService.getMeal(userId, meal.meal_id);
        mealWithIngredients = fullMeal.meal;
      }
      
      if (!mealWithIngredients.ingredients || mealWithIngredients.ingredients.length === 0) {
        Alert.alert('No Ingredients', 'This meal has no ingredients to add to cart');
        return;
      }
      
      // Use the shopping hook to create an Instacart list
      const ingredients = mealWithIngredients.ingredients.map((ing: any) => ({
        name: typeof ing === 'string' ? ing : ing.name,
        amount: typeof ing === 'string' ? 1 : (ing.amount || 1),
        unit: typeof ing === 'string' ? 'item' : (ing.unit || 'item'),
      }));
      
      // Show confirmation
      Alert.alert(
        'Add to Instacart',
        `Add ${ingredients.length} ingredients from "${meal.name}" to your Instacart cart?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add to Cart',
            onPress: () => {
              // The useCreateMealWithShopping hook handles this
              ingredients.forEach((ing: any) => {
                mealShoppingHook.addIngredientFromProduct({
                  id: `${meal.meal_id}_${ing.name}`,
                  name: ing.name,
                  brands: '',
                  nutriments: {},
                } as any);
              });
              
              Alert.alert(
                'Added!',
                `${ingredients.length} ingredients added. View your shopping cart to checkout with Instacart.`,
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('[PlanMealScreen] Error adding to Instacart:', error);
      Alert.alert('Error', 'Failed to add ingredients to cart');
    }
  }, [userId, mealShoppingHook]);
  
  /**
   * Load a meal into the form for editing/duplicating
   */
  const handleLoadMealIntoForm = useCallback(async (meal: Meal) => {
    try {
      // Get full meal details
      const token = await authService.getAccessToken();
      const mealDiaryService = getMealDiaryService(token || undefined);
      const fullMeal = await mealDiaryService.getMeal(userId, meal.meal_id);
      setSelectedMealForEdit(fullMeal.meal);
      setShowLibrary(false);
      
      Alert.alert(
        'Meal Loaded',
        `"${meal.name}" loaded into the form. Edit and save as a new meal or update the existing one.`
      );
    } catch (error) {
      console.error('[PlanMealScreen] Error loading meal:', error);
      Alert.alert('Error', 'Failed to load meal details');
    }
  }, [userId]);

  const handleShowLibrary = () => {
    setShowLibrary(true);
    loadLibraryMeals(librarySearchQuery, libraryFilterTag || undefined, 0, false);
  };

  const handleShowTemplates = async () => {
    setLoadingTemplates(true);
    setShowTemplates(true);
    try {
      const fetchedTemplates = await mealService.getTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleScanRecipe = async () => {
    setScanning(true);
    try {
      // Navigate to camera for food scanning (recipe scanning uses food mode)
      navigation.navigate('Camera', { mode: 'food' });
    } catch (error) {
      console.error('Error scanning recipe:', error);
      Alert.alert('Error', 'Failed to open camera for recipe scanning');
    } finally {
      setScanning(false);
    }
  };

  const handleSavedMealId = (id: string) => {
    setSavedMealId(id);
  };

  // ========================================================================
  // Render Meal Card for Library
  // ========================================================================
  const renderMealCard = ({ item: meal }: { item: Meal }) => {
    const calories = meal.nutrition?.calories || 0;
    const protein = meal.nutrition?.protein || 0;
    const carbs = meal.nutrition?.carbs || 0;
    const fat = meal.nutrition?.fat || 0;
    const tags = meal.tags || [];
    
    return (
      <TouchableOpacity
        style={styles.mealCard}
        onPress={() => handleLoadMealIntoForm(meal)}
        activeOpacity={0.7}
      >
        {/* Meal Header */}
        <View style={styles.mealCardHeader}>
          <View style={styles.mealIconContainer}>
            <SvgIcon name="restaurant" size={24} color="#8b5cf6" />
          </View>
          <View style={styles.mealCardInfo}>
            <Text style={styles.mealCardName} numberOfLines={1}>{meal.name}</Text>
            <Text style={styles.mealCardMeta}>
              {calories} cal • {protein}g protein
            </Text>
          </View>
          <SvgIcon name="chevron-forward" size={20} color="#9ca3af" />
        </View>
        
        {/* Nutrition Row */}
        <View style={styles.mealCardNutrition}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{protein}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{carbs}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{fat}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>
        
        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.mealCardTags}>
            {tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.mealTag}>
                <Text style={styles.mealTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Action Row - Favorite, Delete, Log */}
        <View style={styles.mealCardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleFavorite(meal.meal_id);
            }}
          >
            <SvgIcon 
              name={meal.is_favorite ? 'heart' : 'heart-outline'} 
              size={20} 
              color={meal.is_favorite ? '#ef4444' : '#9ca3af'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteMeal(meal.meal_id, meal.name);
            }}
          >
            <SvgIcon name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.logButton}
            onPress={(e) => {
              e.stopPropagation();
              handleLogMeal(meal.meal_id, meal.name);
            }}
          >
            <Text style={styles.logButtonText}>
              Logged {meal.times_logged || 0}×
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.instacartButton}
            onPress={(e) => {
              e.stopPropagation();
              handleAddToInstacart(meal);
            }}
          >
            <SvgIcon name="cart-outline" size={16} color="#16a34a" />
            <Text style={styles.instacartButtonText}>Instacart</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const handleTemplateSelect = (template: any) => {
    // Apply template to form
    // This would need to be implemented with a callback to ManualMealForm
    setShowTemplates(false);
    Alert.alert('Template Applied', `Using template: ${template.name}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
      
      {/* Main Form - Now includes inline product search */}
      <ManualMealForm
        userId={userId}
        onBack={handleBack}
        onShowProductSearch={handleShowProductSearch}
        onShowLibrary={handleShowLibrary}
        onShowTemplates={handleShowTemplates}
        onScanRecipe={handleScanRecipe}
        onSavedMealId={handleSavedMealId}
        scanning={scanning}
        onLoadLibraryMeals={loadLibraryMeals}
        mealToEdit={selectedMealForEdit}
        onClearMealToEdit={() => setSelectedMealForEdit(null)}
      />

      {/* Meal Templates Modal */}
      <Modal
        visible={showTemplates}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTemplates(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right']}>
          <View style={styles.modalHeader}>
            <View style={{ width: 40 }} />
            <Text style={styles.modalTitle}>Meal Templates</Text>
            <CloseButton onPress={() => setShowTemplates(false)} />
          </View>
          <ScrollView style={styles.modalContent}>
            {loadingTemplates ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading templates...</Text>
              </View>
            ) : templates.length === 0 ? (
              <View style={styles.emptyContainer}>
                <SvgIcon name="restaurant" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No templates available</Text>
                <Text style={styles.emptySubtext}>Templates will appear here once created</Text>
              </View>
            ) : (
              templates.map((template) => (
                <TouchableOpacity
                  key={template.template_id}
                  style={styles.templateCard}
                  onPress={() => {
                    handleTemplateSelect(template);
                  }}
                >
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateDescription}>{template.description}</Text>
                    <View style={styles.templateMeta}>
                      <Text style={styles.templateMetaText}>
                        {template.nutrition?.calories || 0} cal • {template.servings} servings
                      </Text>
                    </View>
                  </View>
                  <SvgIcon name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Meal Library Modal */}
      <Modal
        visible={showLibrary}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLibrary(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#8b5cf6' }} edges={['top']}>
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {/* Header */}
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.libraryHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.libraryHeaderRow}>
                <View style={{ width: 40 }} />
                <CloseButton
                  onPress={() => setShowLibrary(false)}
                  iconColor="#fff"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                />
              </View>
              <Text style={styles.libraryTitle}>Meal Library</Text>
              <Text style={styles.librarySubtitle}>{libraryTotal} meals saved</Text>
            </LinearGradient>

            {/* Search Bar */}
            <View style={styles.librarySearchContainer}>
              <SvgIcon name="search" size={20} color="#9ca3af" />
              <TextInput
                style={styles.librarySearchInput}
                placeholder="Search meals..."
                value={librarySearchQuery}
                onChangeText={handleLibrarySearch}
                placeholderTextColor="#9ca3af"
              />
              {librarySearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleLibrarySearch('')}>
                  <SvgIcon name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Tags */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.libraryTagsScroll}
              contentContainerStyle={styles.libraryTagsContainer}
            >
              {libraryTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.libraryFilterTag,
                    libraryFilterTag === tag && styles.libraryFilterTagActive,
                  ]}
                  onPress={() => handleLibraryFilterByTag(tag)}
                >
                  <Text
                    style={[
                      styles.libraryFilterTagText,
                      libraryFilterTag === tag && styles.libraryFilterTagTextActive,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Meals Count & Add Button */}
            <View style={styles.libraryCountRow}>
              <Text style={styles.libraryCount}>
                {libraryMeals.length} {libraryMeals.length === 1 ? 'meal' : 'meals'}
              </Text>
              <TouchableOpacity
                style={styles.addMealButton}
                onPress={() => setShowLibrary(false)}
              >
                <SvgIcon name="add" size={18} color="#fff" />
                <Text style={styles.addMealButtonText}>Add Meal</Text>
              </TouchableOpacity>
            </View>

            {/* Meals List */}
            {loadingLibrary && libraryMeals.length === 0 ? (
              <View style={styles.libraryLoadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.libraryLoadingText}>Loading your meals...</Text>
              </View>
            ) : libraryMeals.length === 0 ? (
              <View style={styles.libraryEmptyState}>
                <SvgIcon name="restaurant-outline" size={64} color="#d1d5db" />
                <Text style={styles.libraryEmptyTitle}>No meals yet</Text>
                <Text style={styles.libraryEmptySubtitle}>
                  {librarySearchQuery || libraryFilterTag
                    ? 'Try a different search or filter'
                    : 'Create your first meal to get started'
                  }
                </Text>
              </View>
            ) : (
              <FlatList
                data={libraryMeals}
                renderItem={renderMealCard}
                keyExtractor={(item) => item.meal_id}
                contentContainerStyle={styles.mealsList}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMoreMeals}
                onEndReachedThreshold={0.5}
                refreshControl={
                  <RefreshControl
                    refreshing={loadingLibrary}
                    onRefresh={() => loadLibraryMeals(librarySearchQuery, libraryFilterTag || undefined, 0, false)}
                    tintColor="#8b5cf6"
                  />
                }
                ListFooterComponent={
                  libraryHasMore ? (
                    <View style={styles.loadMoreContainer}>
                      <ActivityIndicator size="small" color="#8b5cf6" />
                      <Text style={styles.loadMoreText}>Loading more...</Text>
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  modalContainer: {
    flex: 1,
    // backgroundColor: '#ffffff', // Now using theme.colors.surface dynamically
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  templateInfo: {
    flex: 1,
    gap: 4,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  templateDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  templateMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  templateMetaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // Meal Library Styles
  libraryHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  libraryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  libraryCloseButton: {
    padding: 4,
  },
  libraryTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  librarySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  librarySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#ffffff', // Now using theme.colors.surface dynamically
    margin: 16,
    marginTop: 0,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(64,60,67,0.35)',
        shadowOpacity: 0.35,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 3px 6px rgba(64,60,67,0.35)',
      },
    }),
  },
  librarySearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    outlineStyle: 'none' as any,
  },
  libraryTagsScroll: {
    maxHeight: 48,
    marginBottom: 8,
  },
  libraryTagsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  libraryFilterTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    // backgroundColor: '#ffffff', // Now using theme.colors.surface dynamically
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  libraryFilterTagActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  libraryFilterTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  libraryFilterTagTextActive: {
    color: '#ffffff',
  },
  libraryCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  libraryCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addMealButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  libraryLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  libraryLoadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  libraryEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  libraryEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  libraryEmptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  mealsList: {
    padding: 16,
    paddingTop: 0,
  },
  mealCard: {
    // backgroundColor: '#ffffff', // Now using theme.colors.surface dynamically
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealCardInfo: {
    flex: 1,
  },
  mealCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  mealCardMeta: {
    fontSize: 13,
    color: '#6b7280',
  },
  mealCardNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  mealCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  mealTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  mealTagText: {
    fontSize: 12,
    color: '#4b5563',
  },
  mealCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  logButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  logButtonText: {
    fontSize: 13,
    color: '#6b7280',
  },
  instacartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    marginLeft: 'auto',
  },
  instacartButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#16a34a',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
