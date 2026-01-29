import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  FlatList,
  Keyboard,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SvgIcon from './shared/SvgIcon';
import { SweepBorder } from './SweepBorder';
import { colors } from '../theme/design-tokens';
import { useTheme } from '../context/ThemeContext';

const isWeb = Platform.OS === 'web';

// Import CSS for web only
if (isWeb) {
  require('../styles/web-landing.css');
}
import { useCreateMealWithShopping } from '../hooks/useCreateMealWithShopping';
import { FoodProduct, productSearchService } from '../services/productSearchService';

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  productData?: FoodProduct;
}

// Meal to edit interface (from mealDiary)
interface MealToEdit {
  meal_id: string;
  name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout';
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients?: Array<{
    name: string;
    amount: number;
    unit: string;
  } | string>;
  tags?: string[];
  serving_size?: number;
  instructions?: string[];
}

interface ManualMealFormProps {
  userId: string;
  onBack: () => void;
  onShowProductSearch: () => void;
  onShowLibrary: () => void;
  onShowTemplates: () => void;
  onScanRecipe: () => void;
  onSavedMealId: (id: string) => void;
  scanning?: boolean;
  onLoadLibraryMeals?: () => void;
  /** Optional meal to load into the form for editing */
  mealToEdit?: MealToEdit | null;
  /** Callback when meal edit is cleared */
  onClearMealToEdit?: () => void;
}

const TAGS = [
  'High Protein', 'Low Carb', 'Vegetarian', 'Vegan', 'Gluten Free',
  'Dairy Free', 'Quick & Easy', 'Meal Prep', 'Budget Friendly',
];

export const ManualMealForm: React.FC<ManualMealFormProps> = ({
  userId,
  onBack,
  onShowProductSearch,
  onShowLibrary,
  onShowTemplates,
  onScanRecipe,
  onSavedMealId,
  scanning = false,
  onLoadLibraryMeals,
  mealToEdit,
  onClearMealToEdit,
}) => {
  const { theme } = useTheme();
  // Form state
  const [mealName, setMealName] = useState('');
  const [servingSize, setServingSize] = useState('1');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Inline search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(true); // Always show search by default

  // Shopping hook
  const mealShoppingHook = useCreateMealWithShopping(userId);

  // Load meal to edit when provided
  useEffect(() => {
    if (mealToEdit) {
      setMealName(mealToEdit.name || '');
      setServingSize(String(mealToEdit.serving_size || 1));
      
      // Map meal type
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
      const mealTypeValue = mealToEdit.meal_type?.toLowerCase() || 'lunch';
      setMealType(validMealTypes.includes(mealTypeValue as any) ? mealTypeValue as any : 'lunch');
      
      // Map tags
      setSelectedTags(mealToEdit.tags || []);
      
      // Map ingredients
      if (mealToEdit.ingredients && mealToEdit.ingredients.length > 0) {
        const mappedIngredients: Ingredient[] = mealToEdit.ingredients.map((ing, index) => {
          if (typeof ing === 'string') {
            return {
              id: `edit-${index}-${Date.now()}`,
              name: ing,
              amount: '1',
              unit: 'item',
            };
          }
          return {
            id: `edit-${index}-${Date.now()}`,
            name: ing.name,
            amount: String(ing.amount || 1),
            unit: ing.unit || 'item',
          };
        });
        setIngredients(mappedIngredients);
      }
    }
  }, [mealToEdit]);

  // Quick search categories
  const quickCategories = [
    { name: 'Chicken', icon: 'restaurant' },
    { name: 'Beef', icon: 'restaurant' },
    { name: 'Fish', icon: 'restaurant' },
    { name: 'Rice', icon: 'nutrition' },
    { name: 'Pasta', icon: 'nutrition' },
    { name: 'Vegetables', icon: 'leaf' },
  ];

  // Inline product search
  const handleSearch = useCallback(async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setSearchLoading(true);
    Keyboard.dismiss();
    try {
      const data = await productSearchService.search(searchTerm, {
        type: 'food',
        limit: 20,
      });
      setSearchResults(data.food || []);
    } catch (error) {
      console.error('Product search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  // Add product from search results
  const handleAddProduct = (product: FoodProduct) => {
    const newIngredient: Ingredient = {
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: product.name || 'Unknown Product',
      amount: '1',
      unit: product.servingSize || 'serving',
      calories: product.calories || 0,
      protein: product.protein || 0,
      carbs: product.carbs || 0,
      fat: product.fat || 0,
      productData: product,
    };
    
    setIngredients([...ingredients, newIngredient]);
    
    // Also add to shopping hook for cart functionality
    mealShoppingHook.addIngredientFromProduct({
      id: product.id || newIngredient.id,
      name: product.name,
      brands: product.brand,
      nutriments: {
        energy_kcal: product.calories || 0,
        proteins: product.protein || 0,
        carbohydrates: product.carbs || 0,
        fat: product.fat || 0,
      },
      image_url: product.imageUrl,
    } as any);
    
    // Clear search after adding
    setSearchQuery('');
    setSearchResults([]);
  };

  // Ingredient management
  const addIngredient = () => {
    const newIngredient: Ingredient = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      amount: '1',
      unit: 'cups',
    };
    setIngredients([...ingredients, newIngredient]);
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(ingredients.map(ing =>
      ing.id === id ? { ...ing, [field]: value } : ing
    ));
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const resetForm = () => {
    setMealName('');
    setServingSize('1');
    setMealType('lunch');
    setSelectedTags([]);
    setNotes('');
    setIngredients([]);
    mealShoppingHook.reset();
  };

  return (
    <View style={[styles.formContainer, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          style={styles.formHeaderGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.formHeaderTitleWhite}>Plan Your Meal</Text>
          <Text style={styles.formHeaderSubtitle}>Build your ingredient list and create shopping cart</Text>
        </LinearGradient>

        {/* Meal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Details</Text>
          
          <View style={styles.card}>
            <Text style={styles.label}>Meal Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Grilled Chicken Salad"
              value={mealName}
              onChangeText={setMealName}
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Meal Type *</Text>
            <View style={styles.mealTypeContainer}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.mealTypeButton,
                    mealType === type && styles.mealTypeButtonSelected,
                  ]}
                  onPress={() => setMealType(type)}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      mealType === type && styles.mealTypeTextSelected,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Servings</Text>
            <View style={styles.servingContainer}>
              <TextInput
                style={[styles.input, styles.servingInput]}
                placeholder="1"
                value={servingSize}
                onChangeText={setServingSize}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.servingUnit}>serving(s)</Text>
            </View>
          </View>
        </View>

        {/* Ingredients with Inline Search */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add Ingredients</Text>
          </View>

          {/* Inline Search Bar - Always visible like WiHY home */}
          <View style={styles.inlineSearchContainer}>
            {isWeb ? (
              <div className="web-search-input-container" style={{ width: '100%' }}>
                <View style={styles.inlineSearchBar}>
                  <SvgIcon name="search" size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.inlineSearchInput}
                    placeholder="Search 4M+ products (e.g., chicken breast, rice)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => handleSearch()}
                    returnKeyType="search"
                    placeholderTextColor="#9ca3af"
                  />
                  {searchLoading ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  ) : searchQuery ? (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                      <SvgIcon name="close-circle" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </div>
            ) : (
              <SweepBorder
                borderWidth={2}
                radius={28}
                durationMs={2500}
                colors={colors.borderSweep}
              >
                <View style={styles.inlineSearchBar}>
                  <SvgIcon name="search" size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.inlineSearchInput}
                    placeholder="Search 4M+ products (e.g., chicken breast, rice)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => handleSearch()}
                    returnKeyType="search"
                    placeholderTextColor="#9ca3af"
                  />
                  {searchLoading ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  ) : searchQuery ? (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                      <SvgIcon name="close-circle" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </SweepBorder>
            )}
            
            {/* Quick Category Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickCategoriesScroll}>
              <View style={styles.quickCategories}>
                {quickCategories.map((category) => (
                  <TouchableOpacity
                    key={category.name}
                    style={styles.categoryPill}
                    onPress={() => {
                      setSearchQuery(category.name);
                      handleSearch(category.name);
                    }}
                  >
                    <SvgIcon name={category.icon as any} size={14} color="#3b82f6" />
                    <Text style={styles.categoryPillText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.categoryPill, { backgroundColor: '#f3f4f6' }]}
                  onPress={addIngredient}
                >
                  <SvgIcon name="add-circle" size={14} color="#6b7280" />
                  <Text style={[styles.categoryPillText, { color: '#6b7280' }]}>Manual Entry</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* Search Results - Inline display */}
          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <View style={styles.searchResultsHeader}>
                <Text style={styles.searchResultsTitle}>
                  {searchResults.length} products found
                </Text>
                <TouchableOpacity onPress={() => setSearchResults([])}>
                  <Text style={styles.clearResultsText}>Clear</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id || Math.random().toString()}
                horizontal={false}
                numColumns={1}
                scrollEnabled={false}
                style={{ maxHeight: 300 }}
                nestedScrollEnabled
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultCard}
                    onPress={() => handleAddProduct(item)}
                  >
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {item.brand && (
                        <Text style={styles.searchResultBrand}>{item.brand}</Text>
                      )}
                      {/* Nutrition badges */}
                      <View style={styles.searchResultNutrition}>
                        {item.calories && (
                          <View style={styles.nutrientBadge}>
                            <Text style={styles.nutrientValue}>
                              {Math.round(item.calories)}
                            </Text>
                            <Text style={styles.nutrientLabel}>cal</Text>
                          </View>
                        )}
                        {item.protein && (
                          <View style={styles.nutrientBadge}>
                            <Text style={styles.nutrientValue}>
                              {Math.round(item.protein)}g
                            </Text>
                            <Text style={styles.nutrientLabel}>protein</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.addProductButton}>
                      <SvgIcon name="add-circle" size={28} color="#3b82f6" />
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* My Ingredients List */}
          {ingredients.length > 0 && (
            <View style={styles.myIngredientsSection}>
              <Text style={styles.myIngredientsTitle}>
                My Ingredients ({ingredients.length})
              </Text>
              <View style={styles.card}>
                {ingredients.map((ingredient) => (
                  <View key={ingredient.id} style={styles.ingredientRow}>
                    <View style={{ flex: 1 }}>
                      {ingredient.productData ? (
                        // Product from search - show name and nutrition
                        <View>
                          <Text style={styles.ingredientNameText}>{ingredient.name}</Text>
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                            {ingredient.calories && (
                              <View style={styles.miniNutritionBadge}>
                                <SvgIcon name="flame" size={10} color="#f59e0b" />
                                <Text style={styles.miniNutritionText}>
                                  {Math.round(ingredient.calories * parseFloat(ingredient.amount || '1'))} cal
                                </Text>
                              </View>
                            )}
                            {ingredient.protein && (
                              <View style={styles.miniNutritionBadge}>
                                <SvgIcon name="fitness" size={10} color="#10b981" />
                                <Text style={styles.miniNutritionText}>
                                  {Math.round(ingredient.protein * parseFloat(ingredient.amount || '1'))}g protein
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ) : (
                        // Manual entry - show input
                        <TextInput
                          style={[styles.input, styles.ingredientName]}
                          placeholder="Ingredient name"
                          value={ingredient.name}
                          onChangeText={(value) => updateIngredient(ingredient.id, 'name', value)}
                          placeholderTextColor="#9ca3af"
                        />
                      )}
                    </View>
                    <TextInput
                      style={[styles.input, styles.ingredientAmount]}
                      placeholder="1"
                      value={ingredient.amount}
                      onChangeText={(value) => updateIngredient(ingredient.id, 'amount', value)}
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                    />
                    <TextInput
                      style={[styles.input, styles.ingredientUnit]}
                      placeholder="cups"
                      value={ingredient.unit}
                      onChangeText={(value) => updateIngredient(ingredient.id, 'unit', value)}
                      placeholderTextColor="#9ca3af"
                    />
                    <Pressable onPress={() => removeIngredient(ingredient.id)}>
                      <SvgIcon name="close-circle" size={24} color="#ef4444" />
                    </Pressable>
                  </View>
                ))}
              </View>

              {/* Nutrition Summary - Always visible when ingredients exist */}
              <View style={styles.nutritionSummaryCard}>
                <View style={styles.nutritionSummaryHeader}>
                  <SvgIcon name="checkmark-circle" size={18} color="#10b981" />
                  <Text style={styles.nutritionSummaryTitle}>Total Meal Nutrition</Text>
                </View>
                <View style={styles.nutritionSummaryRow}>
                  <View style={styles.nutritionSummaryItem}>
                    <SvgIcon name="flame" size={16} color="#f59e0b" />
                    <Text style={styles.nutritionSummaryValue}>
                      {Math.round(ingredients.reduce((sum, ing) => 
                        sum + ((ing.calories || 0) * parseFloat(ing.amount || '1')), 0
                      ))}
                    </Text>
                    <Text style={styles.nutritionSummaryLabel}>calories</Text>
                  </View>
                  <View style={styles.nutritionSummaryItem}>
                    <SvgIcon name="fitness" size={16} color="#10b981" />
                    <Text style={styles.nutritionSummaryValue}>
                      {Math.round(ingredients.reduce((sum, ing) => 
                        sum + ((ing.protein || 0) * parseFloat(ing.amount || '1')), 0
                      ))}
                    </Text>
                    <Text style={styles.nutritionSummaryLabel}>g protein</Text>
                  </View>
                  <View style={styles.nutritionSummaryItem}>
                    <Text style={styles.nutritionSummaryValue}>
                      {Math.round(ingredients.reduce((sum, ing) => 
                        sum + ((ing.carbs || 0) * parseFloat(ing.amount || '1')), 0
                      ))}
                    </Text>
                    <Text style={styles.nutritionSummaryLabel}>g carbs</Text>
                  </View>
                  <View style={styles.nutritionSummaryItem}>
                    <Text style={styles.nutritionSummaryValue}>
                      {Math.round(ingredients.reduce((sum, ing) => 
                        sum + ((ing.fat || 0) * parseFloat(ing.amount || '1')), 0
                      ))}
                    </Text>
                    <Text style={styles.nutritionSummaryLabel}>g fat</Text>
                  </View>
                </View>
                <Text style={styles.nutritionSummaryFooter}>
                  Calculated from {ingredients.filter(i => i.calories).length} products with nutrition data
                </Text>
              </View>
            </View>
          )}

          {/* Empty state when no ingredients */}
          {ingredients.length === 0 && searchResults.length === 0 && !searchLoading && (
            <View style={styles.emptyStateCard}>
              <SvgIcon name="search" size={40} color="#3b82f6" />
              <Text style={styles.emptyStateTitle}>Search for ingredients</Text>
              <Text style={styles.emptyStateText}>
                Type a product name above or tap a category to get started
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          
          <View style={styles.card}>
            <View style={styles.tagsContainer}>
              {TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag) && styles.tagSelected,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedTags.includes(tag) && styles.tagTextSelected,
                    ]}
                  >
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes & Instructions</Text>
          
          <View style={styles.card}>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add preparation instructions, tips, or special notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Multiple Save Options */}
        <View style={styles.section}>
          {/* Primary: Save & Shop on Instacart */}
          <Pressable 
            style={[styles.saveButton, (saving || !mealName.trim()) && styles.saveButtonDisabled]} 
            onPress={async () => {
              if (!mealName.trim()) {
                Alert.alert('Missing Information', 'Please enter a meal name');
                return;
              }
              
              setSaving(true);
              const result = await mealShoppingHook.saveAndShopOnInstacart(
                mealName, mealType, servingSize, '', '', '', '', selectedTags, notes
              );
              setSaving(false);
              
              if (result) {
                onSavedMealId(result.mealId);
                Alert.alert(
                  'Meal Saved! 🎉',
                  'What would you like to do?',
                  [
                    { text: 'Open Instacart', onPress: () => Linking.openURL(result.instacartUrl) },
                    { text: 'Done', style: 'cancel', onPress: resetForm }
                  ]
                );
              }
            }}
            disabled={saving || !mealName.trim()}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <SvgIcon name="cart" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save & Shop on Instacart</Text>
              </>
            )}
          </Pressable>

          {/* Secondary Actions */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <Pressable 
              style={[styles.secondaryButton, saving && styles.saveButtonDisabled]}
              onPress={async () => {
                if (!mealName.trim()) {
                  Alert.alert('Missing Information', 'Please enter a meal name');
                  return;
                }
                
                setSaving(true);
                const mealId = await mealShoppingHook.saveMeal(
                  mealName, mealType, servingSize, '', '', '', '', selectedTags, notes
                );
                setSaving(false);
                
                if (mealId) {
                  onSavedMealId(mealId);
                  const instacartUrl = await mealShoppingHook.createShoppingListFromMeal(mealName);
                  if (instacartUrl) {
                    Alert.alert(
                      'Shopping List Created! 🛒',
                      'Your Instacart shopping list is ready',
                      [
                        { text: 'Open List', onPress: () => Linking.openURL(instacartUrl) },
                        { text: 'Done', style: 'cancel' }
                      ]
                    );
                  }
                }
              }}
              disabled={saving}
            >
              <SvgIcon name="list" size={18} color="#3b82f6" />
              <Text style={styles.secondaryButtonText}>Shopping List</Text>
            </Pressable>

            <Pressable 
              style={[styles.secondaryButton, saving && styles.saveButtonDisabled]}
              onPress={async () => {
                if (!mealName.trim()) {
                  Alert.alert('Missing Information', 'Please enter a meal name');
                  return;
                }
                
                setSaving(true);
                const mealId = await mealShoppingHook.saveMeal(
                  mealName, mealType, servingSize, '', '', '', '', selectedTags, notes
                );
                setSaving(false);
                
                if (mealId) {
                  onSavedMealId(mealId);
                  Alert.alert(
                    'Meal Saved! 🎉',
                    `${mealName} has been added to your meal library!`,
                    [
                      { text: 'Create Another', onPress: resetForm },
                      { text: 'Done', style: 'cancel' }
                    ]
                  );
                }
              }}
              disabled={saving}
            >
              <SvgIcon name="bookmark" size={18} color="#3b82f6" />
              <Text style={styles.secondaryButtonText}>Save Only</Text>
            </Pressable>
          </View>
        </View>

        {/* Templates Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <View style={styles.templatesContainer}>
            <Pressable 
              style={styles.templateCard}
              onPress={onShowTemplates}
            >
              <SvgIcon name="fast-food" size={24} color="#3b82f6" />
              <Text style={styles.templateTitle}>Use Template</Text>
              <Text style={styles.templateSubtitle}>Start from preset</Text>
            </Pressable>
            <Pressable 
              style={styles.templateCard}
              onPress={onScanRecipe}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator color="#10b981" />
              ) : (
                <SvgIcon name="camera" size={24} color="#10b981" />
              )}
              <Text style={styles.templateTitle}>Scan Recipe</Text>
              <Text style={styles.templateSubtitle}>From image</Text>
            </Pressable>
            <Pressable 
              style={styles.templateCard}
              onPress={() => {
                onLoadLibraryMeals?.();
                onShowLibrary();
              }}
            >
              <SvgIcon name="book" size={24} color="#8b5cf6" />
              <Text style={styles.templateTitle}>My Meals</Text>
              <Text style={styles.templateSubtitle}>Saved recipes</Text>
            </Pressable>
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  formHeaderGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    position: 'relative',
  },
  headerBackButtonWhite: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formHeaderTitleWhite: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  formHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    marginBottom: 16,
    outlineStyle: 'none' as any,
  },
  servingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  servingInput: {
    flex: 1,
    marginBottom: 0,
  },
  servingUnit: {
    fontSize: 15,
    color: '#6b7280',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  mealTypeButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  mealTypeTextSelected: {
    color: '#ffffff',
  },
  miniNutritionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  miniNutritionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  nutritionSummaryCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  nutritionSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  nutritionSummaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#047857',
  },
  nutritionSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  nutritionSummaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  nutritionSummaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#047857',
  },
  nutritionSummaryLabel: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
  },
  nutritionSummaryFooter: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  // Inline Search Styles
  inlineSearchContainer: {
    marginBottom: 16,
  },
  inlineSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
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
  inlineSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    outlineStyle: 'none' as any,
  },
  quickCategoriesScroll: {
    marginTop: 12,
  },
  quickCategories: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  searchResultsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  clearResultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  searchResultBrand: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  searchResultNutrition: {
    flexDirection: 'row',
    gap: 8,
  },
  nutrientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  nutrientValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  nutrientLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  addProductButton: {
    padding: 4,
  },
  myIngredientsSection: {
    marginTop: 8,
  },
  myIngredientsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  ingredientNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  ingredientName: {
    flex: 1,
    marginBottom: 0,
  },
  ingredientAmount: {
    width: 60,
    marginBottom: 0,
  },
  ingredientUnit: {
    width: 80,
    marginBottom: 0,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tagSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  tagText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    outlineStyle: 'none' as any,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  templatesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  templateCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  templateTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
  },
  templateSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
});
