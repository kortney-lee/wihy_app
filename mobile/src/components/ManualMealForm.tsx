import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import SvgIcon from './shared/SvgIcon';
import { SweepBorder } from './SweepBorder';
import { colors } from '../theme/design-tokens';
import { useTheme } from '../context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const isWeb = Platform.OS === 'web';

// Import CSS for web only
if (isWeb) {
  require('../styles/web-landing.css');
}
import { useCreateMealWithShopping } from '../hooks/useCreateMealWithShopping';
import { shoppingService, ShoppingListItem } from '../services/shoppingService';
import type { RootStackParamList } from '../types/navigation';
import { FoodProduct, productSearchService, SuggestResponse } from '../services/productSearchService';

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
  /** Navigation prop for navigating to shopping list */
  navigation?: NavigationProp<RootStackParamList>;
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
  navigation,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Collapsing header animation - CRITICAL: 180px per design patterns
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 180;
  const HEADER_MIN_HEIGHT = 0;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  
  // Form state
  const [mealName, setMealName] = useState('');
  const [servingSize, setServingSize] = useState('1');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Inline search state - Google-like autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(true); // Always show search by default
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Autocomplete state (like Google search)
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Array<{
    name: string;
    brand?: string;
    type?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    servingSize?: string;
  }>>([]); // Suggest API returns nutrition data
  const [suggestedBrands, setSuggestedBrands] = useState<string[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Collapsible section state
  const [expandedSection, setExpandedSection] = useState<'suggestions' | 'brands' | 'products' | null>('suggestions');

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

  // Load trending searches on mount (like Google showing popular searches)
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const data = await productSearchService.trending('food', 8);
        setTrendingSearches(data.trending || []);
      } catch (error) {
        console.warn('Failed to load trending searches:', error);
        // Fallback to static trending
        setTrendingSearches(['chicken breast', 'rice', 'salmon', 'broccoli', 'eggs', 'avocado']);
      }
    };
    loadTrending();
  }, []);

  // Debounced autocomplete as user types (like Google search)
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Need at least 2 characters for autocomplete
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setSuggestedProducts([]);
      setSuggestedBrands([]);
      return;
    }

    // Debounce 150ms (fast like Google)
    debounceTimer.current = setTimeout(async () => {
      try {
        const data = await productSearchService.suggest(searchQuery, 'food', 8);
        setSuggestions(data.suggestions || []);
        setSuggestedProducts(data.products || []);
        setSuggestedBrands(data.brands || []);
        setShowDropdown(true);
      } catch (error) {
        console.warn('Autocomplete error:', error);
      }
    }, 150);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Quick search categories
  const quickCategories = [
    { name: 'Chicken', icon: 'restaurant' },
    { name: 'Beef', icon: 'restaurant' },
    { name: 'Fish', icon: 'restaurant' },
    { name: 'Rice', icon: 'nutrition' },
    { name: 'Pasta', icon: 'nutrition' },
    { name: 'Vegetables', icon: 'leaf' },
  ];

  // Handle selecting a suggestion (autocomplete)
  const handleSelectSuggestion = useCallback(async (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowDropdown(false);
    setSuggestions([]);
    setSuggestedProducts([]);
    setSuggestedBrands([]);
    
    // Perform full search with the suggestion
    setSearchLoading(true);
    Keyboard.dismiss();
    try {
      const data = await productSearchService.search(suggestion, {
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
  }, []);

  // Handle selecting a product from suggestions - add directly (suggest API includes nutrition)
  const handleSelectSuggestedProduct = useCallback((product: {
    name: string;
    brand?: string;
    type?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    servingSize?: string;
  }) => {
    setShowDropdown(false);
    setSuggestions([]);
    setSuggestedProducts([]);
    setSuggestedBrands([]);
    setSearchQuery('');
    
    // Create ingredient directly from suggest API product (it has nutrition data)
    console.log('[ManualMealForm] Adding product from suggest:', {
      name: product.name,
      calories: product.calories,
      protein: product.protein,
      carbs: product.carbs,
      fat: product.fat,
    });
    
    const newIngredient: Ingredient = {
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: product.name || 'Unknown Product',
      amount: '1',
      unit: product.servingSize || 'serving',
      calories: product.calories || 0,
      protein: product.protein || 0,
      carbs: product.carbs || 0,
      fat: product.fat || 0,
      productData: product as any, // Mark as product data for display purposes
    };
    
    console.log('[ManualMealForm] Created ingredient:', newIngredient);
    
    setIngredients(prev => [...prev, newIngredient]);
    
    // Also add to shopping hook
    mealShoppingHook.addIngredientFromProduct(product as any);
  }, [ingredients, mealShoppingHook]);

  // Inline product search (full search on submit)
  const handleSearch = useCallback(async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setShowDropdown(false);
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
    // Extract nutrition - API may return at top level OR in nutrition object
    const calories = product.calories || product.nutrition?.calories || 0;
    const protein = product.protein || product.nutrition?.protein || 0;
    const carbs = product.carbs || product.nutrition?.carbs || 0;
    const fat = product.fat || product.nutrition?.fat || 0;
    
    const newIngredient: Ingredient = {
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: product.name || 'Unknown Product',
      amount: '1',
      unit: product.servingSize || product.serving_size || 'serving',
      calories,
      protein,
      carbs,
      fat,
      productData: product,
    };
    
    setIngredients([...ingredients, newIngredient]);
    
    // Also add to shopping hook for cart functionality - pass the product directly
    // The hook expects FoodProduct with direct properties (calories, protein, etc.)
    mealShoppingHook.addIngredientFromProduct(product);
    
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
      {/* Status bar area - Always blue to match header */}
      <View style={{ height: insets.top, backgroundColor: '#3b82f6' }} />
      
      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          style={styles.formHeaderGradient}
        >
          <Animated.View 
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              opacity: headerOpacity, 
              transform: [{ scale: titleScale }]
            }}
          >
            <View style={styles.headerContent}>
              <Text style={styles.formHeaderTitleWhite}>Plan Your Meal</Text>
              <Text style={styles.formHeaderSubtitle}>Search products, track nutrition, and build your shopping list</Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >

        {/* Meal Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Meal Details</Text>
          
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Meal Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.text + '20' }]}
              placeholder="e.g., Grilled Chicken Salad"
              value={mealName}
              onChangeText={setMealName}
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>Meal Type *</Text>
            <View style={styles.mealTypeContainer}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.mealTypeButton,
                    { backgroundColor: theme.colors.background, borderColor: theme.colors.text + '20' },
                    mealType === type && styles.mealTypeButtonSelected,
                  ]}
                  onPress={() => setMealType(type)}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      { color: theme.colors.textSecondary },
                      mealType === type && styles.mealTypeTextSelected,
                    ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.colors.text }]}>Servings</Text>
            <View style={styles.servingContainer}>
              <TextInput
                style={[styles.input, styles.servingInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.text + '20' }]}
                placeholder="1"
                value={servingSize}
                onChangeText={setServingSize}
                keyboardType="numeric"
                placeholderTextColor={theme.colors.textSecondary}
              />
              <Text style={[styles.servingUnit, { color: theme.colors.textSecondary }]}>serving(s)</Text>
            </View>
          </View>
        </View>

        {/* Ingredients with Inline Search */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Add Ingredients</Text>
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
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    returnKeyType="search"
                    placeholderTextColor="#9ca3af"
                  />
                  {searchLoading ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  ) : searchQuery ? (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); }}>
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
                <View style={[styles.inlineSearchBar, { backgroundColor: theme.colors.surface }]}>
                  <SvgIcon name="search" size={20} color={theme.colors.textSecondary} />
                  <TextInput
                    style={[styles.inlineSearchInput, { color: theme.colors.text }]}
                    placeholder="Search 4M+ products (e.g., chicken breast, rice)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => handleSearch()}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    returnKeyType="search"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoComplete="off"
                    autoCorrect={false}
                    spellCheck={false}
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

            {/* Autocomplete Dropdown - Google-like suggestions with collapsible sections */}
            {(showDropdown || (isFocused && searchQuery.length < 2 && trendingSearches.length > 0)) && (
              <View style={[styles.autocompleteDropdown, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <ScrollView 
                  style={{ maxHeight: 300 }} 
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {/* Show trending when empty, suggestions when typing */}
                  {searchQuery.length < 2 ? (
                    // Trending searches (like Google showing popular searches)
                    <>
                      <Text style={[styles.dropdownSectionTitle, { color: theme.colors.textSecondary }]}>
                        TRENDING SEARCHES
                      </Text>
                      {trendingSearches.map((term, index) => (
                        <TouchableOpacity
                          key={`trending-${index}`}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectSuggestion(term)}
                        >
                          <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>{term}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : (
                    // Autocomplete suggestions - with collapsible sections
                    <>
                      {/* SUGGESTIONS Section - Collapsible */}
                      {suggestions.length > 0 && (
                        <>
                          <TouchableOpacity 
                            style={styles.collapsibleHeader}
                            onPress={() => setExpandedSection(expandedSection === 'suggestions' ? null : 'suggestions')}
                          >
                            <View style={styles.collapsibleHeaderLeft}>
                              <Ionicons name="search" size={14} color="#4cbb17" />
                              <Text style={[styles.dropdownSectionTitle, { color: theme.colors.textSecondary, marginBottom: 0, paddingVertical: 0 }]}>
                                Suggestions
                              </Text>
                              <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{suggestions.length}</Text>
                              </View>
                            </View>
                            <Ionicons 
                              name={expandedSection === 'suggestions' ? 'chevron-up' : 'chevron-down'} 
                              size={18} 
                              color={theme.colors.textSecondary} 
                            />
                          </TouchableOpacity>
                          {expandedSection === 'suggestions' && suggestions.slice(0, 5).map((suggestion, index) => (
                            <TouchableOpacity
                              key={`suggestion-${index}`}
                              style={styles.dropdownItem}
                              onPress={() => handleSelectSuggestion(suggestion)}
                            >
                              <Ionicons name="search-outline" size={16} color={theme.colors.textSecondary} />
                              <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>{suggestion}</Text>
                            </TouchableOpacity>
                          ))}
                        </>
                      )}
                      
                      {/* BRANDS Section - Collapsible */}
                      {suggestedBrands.length > 0 && (
                        <>
                          <TouchableOpacity 
                            style={styles.collapsibleHeader}
                            onPress={() => setExpandedSection(expandedSection === 'brands' ? null : 'brands')}
                          >
                            <View style={styles.collapsibleHeaderLeft}>
                              <Ionicons name="pricetag" size={14} color="#8b5cf6" />
                              <Text style={[styles.dropdownSectionTitle, { color: theme.colors.textSecondary, marginBottom: 0, paddingVertical: 0 }]}>
                                Brands
                              </Text>
                              <View style={[styles.countBadge, { backgroundColor: '#f3e8ff' }]}>
                                <Text style={[styles.countBadgeText, { color: '#8b5cf6' }]}>{suggestedBrands.length}</Text>
                              </View>
                            </View>
                            <Ionicons 
                              name={expandedSection === 'brands' ? 'chevron-up' : 'chevron-down'} 
                              size={18} 
                              color={theme.colors.textSecondary} 
                            />
                          </TouchableOpacity>
                          {expandedSection === 'brands' && suggestedBrands.slice(0, 5).map((brand, index) => (
                            <TouchableOpacity
                              key={`brand-${index}`}
                              style={styles.dropdownItem}
                              onPress={() => handleSelectSuggestion(brand)}
                            >
                              <Ionicons name="pricetag-outline" size={16} color="#8b5cf6" />
                              <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>{brand}</Text>
                            </TouchableOpacity>
                          ))}
                        </>
                      )}

                      {/* PRODUCTS Section - Collapsible */}
                      {suggestedProducts.length > 0 && (
                        <>
                          <TouchableOpacity 
                            style={styles.collapsibleHeader}
                            onPress={() => setExpandedSection(expandedSection === 'products' ? null : 'products')}
                          >
                            <View style={styles.collapsibleHeaderLeft}>
                              <Ionicons name="cube" size={14} color="#22c55e" />
                              <Text style={[styles.dropdownSectionTitle, { color: theme.colors.textSecondary, marginBottom: 0, paddingVertical: 0 }]}>
                                Products
                              </Text>
                              <View style={[styles.countBadge, { backgroundColor: '#dcfce7' }]}>
                                <Text style={[styles.countBadgeText, { color: '#22c55e' }]}>{suggestedProducts.length}</Text>
                              </View>
                            </View>
                            <Ionicons 
                              name={expandedSection === 'products' ? 'chevron-up' : 'chevron-down'} 
                              size={18} 
                              color={theme.colors.textSecondary} 
                            />
                          </TouchableOpacity>
                          {expandedSection === 'products' && suggestedProducts.slice(0, 6).map((product, index) => (
                            <TouchableOpacity
                              key={`product-${index}`}
                              style={[styles.dropdownProductItem, { borderColor: theme.colors.border }]}
                              onPress={() => handleSelectSuggestedProduct(product)}
                            >
                              <View style={styles.dropdownProductInfo}>
                                <Text style={[styles.dropdownProductName, { color: theme.colors.text }]} numberOfLines={1}>
                                  {product.name}
                                </Text>
                                {product.brand && (
                                  <Text style={[styles.dropdownProductBrand, { color: theme.colors.textSecondary }]}>
                                    {product.brand}
                                  </Text>
                                )}
                              </View>
                              <Ionicons name="add-circle" size={24} color="#22c55e" />
                            </TouchableOpacity>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </ScrollView>
              </View>
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
                  style={[styles.categoryPill, { backgroundColor: theme.colors.surface }]}
                  onPress={addIngredient}
                >
                  <SvgIcon name="add-circle" size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.categoryPillText, { color: theme.colors.textSecondary }]}>Manual Entry</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* Search Results - Inline display */}
          {searchResults.length > 0 && (
            <View style={[styles.searchResultsContainer, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.searchResultsHeader}>
                <Text style={[styles.searchResultsTitle, { color: theme.colors.text }]}>
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
                scrollEnabled={true}
                style={{ maxHeight: 400 }}
                nestedScrollEnabled
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.searchResultCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.text + '20' }]}
                    onPress={() => handleAddProduct(item)}
                  >
                    <View style={styles.searchResultInfo}>
                      <Text style={[styles.searchResultName, { color: theme.colors.text }]} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {item.brand && (
                        <Text style={[styles.searchResultBrand, { color: theme.colors.textSecondary }]}>{item.brand}</Text>
                      )}
                      {/* Nutrition badges - check both top-level and nutrition object */}
                      <View style={styles.searchResultNutrition}>
                        {((item.calories || item.nutrition?.calories) ?? 0) > 0 && (
                          <View style={styles.nutrientBadge}>
                            <Text style={styles.nutrientValue}>
                              {Math.round(item.calories || item.nutrition?.calories || 0)}
                            </Text>
                            <Text style={styles.nutrientLabel}>cal</Text>
                          </View>
                        )}
                        {((item.protein || item.nutrition?.protein) ?? 0) > 0 && (
                          <View style={styles.nutrientBadge}>
                            <Text style={styles.nutrientValue}>
                              {Math.round(item.protein || item.nutrition?.protein || 0)}g
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
              <Text style={[styles.myIngredientsTitle, { color: theme.colors.text }]}>
                My Ingredients ({ingredients.length})
              </Text>
              <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                {ingredients.map((ingredient) => (
                  <View key={ingredient.id} style={styles.ingredientRow}>
                    <View style={{ flex: 1 }}>
                      {ingredient.productData ? (
                        // Product from search - show name and nutrition
                        <View>
                          <Text style={[styles.ingredientNameText, { color: theme.colors.text }]}>{ingredient.name}</Text>
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                            {(ingredient.calories !== undefined && ingredient.calories > 0) && (
                              <View style={styles.miniNutritionBadge}>
                                <SvgIcon name="flame" size={10} color="#f59e0b" />
                                <Text style={styles.miniNutritionText}>
                                  {Math.round(ingredient.calories * parseFloat(ingredient.amount || '1'))} cal
                                </Text>
                              </View>
                            )}
                            {(ingredient.protein !== undefined && ingredient.protein > 0) && (
                              <View style={styles.miniNutritionBadge}>
                                <SvgIcon name="fitness" size={10} color="#10b981" />
                                <Text style={styles.miniNutritionText}>
                                  {Math.round(ingredient.protein * parseFloat(ingredient.amount || '1'))}g protein
                                </Text>
                              </View>
                            )}
                            {(ingredient.carbs !== undefined && ingredient.carbs > 0) && (
                              <View style={styles.miniNutritionBadge}>
                                <Text style={styles.miniNutritionText}>
                                  {Math.round(ingredient.carbs * parseFloat(ingredient.amount || '1'))}g carbs
                                </Text>
                              </View>
                            )}
                            {(ingredient.fat !== undefined && ingredient.fat > 0) && (
                              <View style={styles.miniNutritionBadge}>
                                <Text style={styles.miniNutritionText}>
                                  {Math.round(ingredient.fat * parseFloat(ingredient.amount || '1'))}g fat
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ) : (
                        // Manual entry - show input
                        <TextInput
                          style={[styles.input, styles.ingredientName, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.text + '20' }]}
                          placeholder="Ingredient name"
                          value={ingredient.name}
                          onChangeText={(value) => updateIngredient(ingredient.id, 'name', value)}
                          placeholderTextColor={theme.colors.textSecondary}
                        />
                      )}
                    </View>
                    <TextInput
                      style={[styles.input, styles.ingredientAmount, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.text + '20' }]}
                      placeholder="1"
                      value={ingredient.amount}
                      onChangeText={(value) => updateIngredient(ingredient.id, 'amount', value)}
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, styles.ingredientUnit, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.text + '20' }]}
                      placeholder="cups"
                      value={ingredient.unit}
                      onChangeText={(value) => updateIngredient(ingredient.id, 'unit', value)}
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                    <Pressable onPress={() => removeIngredient(ingredient.id)}>
                      <SvgIcon name="close-circle" size={24} color="#ef4444" />
                    </Pressable>
                  </View>
                ))}
              </View>

              {/* Nutrition Summary - Always visible when ingredients exist */}
              <View style={[styles.nutritionSummaryCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.nutritionSummaryHeader}>
                  <SvgIcon name="checkmark-circle" size={18} color="#10b981" />
                  <Text style={[styles.nutritionSummaryTitle, { color: theme.colors.text }]}>Total Meal Nutrition</Text>
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
            <View style={[styles.emptyStateCard, { backgroundColor: theme.colors.surface }]}>
              <SvgIcon name="search" size={40} color="#3b82f6" />
              <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>Search for ingredients</Text>
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                Type a product name above or tap a category to get started
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tags</Text>
          
          <View style={styles.tagsContainer}>
            {TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  style={[
                    styles.tag,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.text + '20' },
                    selectedTags.includes(tag) && styles.tagSelected,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: theme.colors.textSecondary },
                      selectedTags.includes(tag) && styles.tagTextSelected,
                    ]}>
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notes & Instructions</Text>
          
          <TextInput
            style={[styles.input, styles.notesInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.text + '20' }]}
              placeholder="Add preparation instructions, tips, or special notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        {/* Multiple Save Options */}
        <View style={styles.section}>
          {/* Primary: Save & Shop on Instacart */}
          <Pressable 
            style={[styles.saveButton, (saving || ingredients.length === 0) && styles.saveButtonDisabled]} 
            onPress={async () => {
              if (ingredients.length === 0) {
                Alert.alert('No Items', 'Please add at least one ingredient to your meal');
                return;
              }
              
              // Auto-generate meal name if not provided
              const finalMealName = mealName.trim() || `My ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} - ${new Date().toLocaleDateString()}`;
              
              setSaving(true);
              const result = await mealShoppingHook.saveAndShopOnInstacart(
                finalMealName, mealType, servingSize, '', '', '', '', selectedTags, notes
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
            disabled={saving || ingredients.length === 0}
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
              style={[styles.secondaryButton, (saving || ingredients.length === 0) && styles.saveButtonDisabled]}
              onPress={async () => {
                if (ingredients.length === 0) {
                  Alert.alert('No Items', 'Please add at least one ingredient to create a shopping list');
                  return;
                }
                
                // Auto-generate meal name if not provided
                const finalMealName = mealName.trim() || `My ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} - ${new Date().toLocaleDateString()}`;
                
                setSaving(true);
                try {
                  // 1. Save the meal first
                  const mealId = await mealShoppingHook.saveMeal(
                    finalMealName, mealType, servingSize, '', '', '', '', selectedTags, notes
                  );
                  
                  if (mealId) {
                    onSavedMealId(mealId);
                    
                    // 2. Calculate total nutrition
                    const totalCalories = ingredients.reduce((sum, ing) => sum + ((ing.calories || 0) * parseFloat(ing.amount || '1')), 0);
                    const totalProtein = ingredients.reduce((sum, ing) => sum + ((ing.protein || 0) * parseFloat(ing.amount || '1')), 0);
                    
                    // 3. Create shopping list items with proper format
                    const shoppingItems: ShoppingListItem[] = ingredients
                      .filter(ing => ing.name.trim())
                      .map(ing => ({
                        name: ing.name,
                        quantity: parseFloat(ing.amount) || 1,
                        unit: ing.unit || 'item',
                        category: 'Other' as const,
                        checked: false,
                        estimated_price: 0,
                        notes: ing.productData?.brand ? `Brand: ${ing.productData.brand}` : undefined,
                      }));
                    
                    // 4. Create manual shopping list via API (POST /api/shopping-lists/manual)
                    const listResult = await shoppingService.createManualList(userId, {
                      name: `Shopping for: ${finalMealName}`,
                    });
                    
                    const listId = listResult?.list_id || listResult?.id;
                    
                    // 5. Add items to the list (POST /api/shopping-lists/:listId/items)
                    if (listId && shoppingItems.length > 0) {
                      await shoppingService.addItemsToList(listId, shoppingItems);
                    }
                    
                    // 6. Build shopping list data for navigation
                    const itemsByCategory: Record<string, any[]> = {};
                    shoppingItems.forEach(item => {
                      const cat = item.category || 'Other';
                      if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
                      itemsByCategory[cat].push({
                        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: item.name,
                        quantity: item.quantity,
                        unit: item.unit,
                        checked: false,
                      });
                    });
                    
                    const shoppingListData = {
                      listId,
                      listName: `Shopping for: ${finalMealName}`,
                      totalItems: shoppingItems.length,
                      itemsByCategory,
                      estimatedCost: { min: 0, max: 0 },
                      mealInfo: {
                        name: finalMealName,
                        servings: parseInt(servingSize) || 1,
                        calories: Math.round(totalCalories),
                        protein: Math.round(totalProtein),
                      },
                    };
                    
                    // 6. Navigate to ShoppingListScreen (Save for Later - no Instacart auto-open)
                    if (navigation) {
                      navigation.navigate('ShoppingList', {
                        shoppingListData,
                        fromMealPlan: false, // Don't auto-open Instacart - this is Save for Later
                      });
                    } else {
                      // Fallback: show alert with option to view list
                      Alert.alert(
                        'Saved to Shopping List! 🛒',
                        `${shoppingItems.length} items saved for later.\n\nMeal: ${finalMealName}\nServings: ${servingSize}\nCalories: ${Math.round(totalCalories)} kcal`,
                        [
                          { text: 'OK', style: 'default', onPress: resetForm }
                        ]
                      );
                    }
                  }
                } catch (error) {
                  console.error('Error creating shopping list:', error);
                  Alert.alert('Error', 'Failed to create shopping list. Please try again.');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || ingredients.length === 0}
            >
              <SvgIcon name="list" size={18} color="#3b82f6" />
              <Text style={styles.secondaryButtonText}>Save for Later</Text>
            </Pressable>

            <Pressable 
              style={[styles.secondaryButton, (saving || ingredients.length === 0) && styles.saveButtonDisabled]}
              onPress={async () => {
                if (ingredients.length === 0) {
                  Alert.alert('No Items', 'Please add at least one ingredient to save your meal');
                  return;
                }
                
                // Auto-generate meal name if not provided
                const finalMealName = mealName.trim() || `My ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} - ${new Date().toLocaleDateString()}`;
                
                setSaving(true);
                const mealId = await mealShoppingHook.saveMeal(
                  finalMealName, mealType, servingSize, '', '', '', '', selectedTags, notes
                );
                setSaving(false);
                
                if (mealId) {
                  onSavedMealId(mealId);
                  Alert.alert(
                    'Meal Saved! 🎉',
                    `${finalMealName} has been added to your meal library!`,
                    [
                      { text: 'Create Another', onPress: resetForm },
                      { text: 'Done', style: 'cancel' }
                    ]
                  );
                }
              }}
              disabled={saving || ingredients.length === 0}
            >
              <SvgIcon name="bookmark" size={18} color="#3b82f6" />
              <Text style={styles.secondaryButtonText}>Save Only</Text>
            </Pressable>
          </View>
        </View>

        {/* Templates Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Start</Text>
          <View style={styles.templatesContainer}>
            <Pressable 
              style={[styles.templateCard, { backgroundColor: theme.colors.surface }]}
              onPress={onShowTemplates}
            >
              <SvgIcon name="fast-food" size={24} color="#3b82f6" />
              <Text style={[styles.templateTitle, { color: theme.colors.text }]}>Use Template</Text>
              <Text style={[styles.templateSubtitle, { color: theme.colors.textSecondary }]}>Start from preset</Text>
            </Pressable>
            <Pressable 
              style={[styles.templateCard, { backgroundColor: theme.colors.surface }]}
              onPress={onScanRecipe}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator color="#10b981" />
              ) : (
                <SvgIcon name="camera" size={24} color="#10b981" />
              )}
              <Text style={[styles.templateTitle, { color: theme.colors.text }]}>Scan Recipe</Text>
              <Text style={[styles.templateSubtitle, { color: theme.colors.textSecondary }]}>From image</Text>
            </Pressable>
            <Pressable 
              style={[styles.templateCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => {
                onLoadLibraryMeals?.();
                onShowLibrary();
              }}
            >
              <SvgIcon name="book" size={24} color="#8b5cf6" />
              <Text style={[styles.templateTitle, { color: theme.colors.text }]}>My Meals</Text>
              <Text style={[styles.templateSubtitle, { color: theme.colors.textSecondary }]}>Saved recipes</Text>
            </Pressable>
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  collapsibleHeader: {
    backgroundColor: '#3b82f6',  // Brand color - DO NOT theme per dark mode rules
    overflow: 'hidden',
  },
  formHeaderGradient: {
    flex: 1,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    // color: applied via inline { color: theme.colors.text }
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  card: {
    // backgroundColor: '#ffffff', // theme.colors.surface
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
    // color: applied via inline { color: theme.colors.text }
    marginBottom: 8,
  },
  input: {
    // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    // color: applied via inline { color: theme.colors.text }
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
    // color: applied via inline { color: theme.colors.textSecondary }
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
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    borderWidth: 2,
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
    // color: applied via inline { color: theme.colors.textSecondary }
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
    // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 6,
  },
  miniNutritionText: {
    fontSize: 11,
    fontWeight: '600',
    // color: applied via inline { color: theme.colors.text }
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
    // color: applied via inline { color: theme.colors.textSecondary }
    marginTop: 8,
  },
  // Inline Search Styles
  inlineSearchContainer: {
    marginBottom: 16,
  },
  inlineSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 18,
    height: 52,
    gap: 12,
  },
  inlineSearchInput: {
    flex: 1,
    fontSize: 16,
    // color: applied via inline { color: theme.colors.text }
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
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  searchResultsContainer: {
    // backgroundColor: '#ffffff', // theme.colors.surface
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
    // color: applied via inline { color: theme.colors.text }
  },
  clearResultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    // color: applied via inline { color: theme.colors.text }
    marginBottom: 2,
  },
  searchResultBrand: {
    fontSize: 13,
    // color: applied via inline { color: theme.colors.textSecondary }
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
    // backgroundColor: '#ffffff', // theme.colors.surface
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  nutrientValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  nutrientLabel: {
    fontSize: 11,
    // color: applied via inline { color: theme.colors.textSecondary }
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
    // color: applied via inline { color: theme.colors.text }
    marginBottom: 12,
  },
  ingredientNameText: {
    fontSize: 15,
    fontWeight: '600',
    // color: applied via inline { color: theme.colors.text }
  },
  emptyStateCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
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
    // color: applied via inline { color: theme.colors.text }
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    // color: applied via inline { color: theme.colors.textSecondary }
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
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  tagSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  tagText: {
    fontSize: 13,
    // color: applied via inline { color: theme.colors.textSecondary }
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
    borderWidth: 2,
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
    // backgroundColor: '#ffffff', // theme.colors.surface
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
    // color: applied via inline { color: theme.colors.text }
    marginTop: 8,
  },
  templateSubtitle: {
    fontSize: 11,
    // color: applied via inline { color: theme.colors.textSecondary }
    marginTop: 2,
  },
  
  // Autocomplete Dropdown Styles (Google-like search)
  autocompleteDropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    maxHeight: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  dropdownItemText: {
    fontSize: 15,
    flex: 1,
  },
  dropdownProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownProductInfo: {
    flex: 1,
  },
  dropdownProductName: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownProductBrand: {
    fontSize: 12,
    marginTop: 2,
  },
  // Collapsible section styles
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
});
