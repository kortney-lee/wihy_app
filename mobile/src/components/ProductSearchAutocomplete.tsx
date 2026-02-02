/**
 * ProductSearchAutocomplete Component
 * 
 * A Google-like autocomplete search component for products.
 * Shows trending searches when empty, suggestions as user types.
 * 
 * Usage:
 * <ProductSearchAutocomplete
 *   onSelectProduct={(product) => console.log('Selected:', product)}
 *   onSelectSuggestion={(text) => console.log('Suggestion:', text)}
 *   productType="food"
 *   placeholder="Search products..."
 * />
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from './shared';
import { productSearchService, FoodProduct, SuggestResponse } from '../services/productSearchService';

export interface ProductSearchAutocompleteProps {
  /** Called when user selects a product from search results */
  onSelectProduct?: (product: FoodProduct) => void;
  /** Called when user selects a suggestion or types custom text */
  onSelectSuggestion?: (text: string) => void;
  /** Called when search results are loaded */
  onSearchResults?: (products: FoodProduct[]) => void;
  /** Product type to search */
  productType?: 'food' | 'beauty' | 'petfood' | 'all';
  /** Placeholder text */
  placeholder?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Show product results inline (not just suggestions) */
  showProductResults?: boolean;
  /** Initial value */
  initialValue?: string;
  /** Limit number of suggestions */
  suggestLimit?: number;
  /** Limit number of search results */
  searchLimit?: number;
}

const ProductSearchAutocomplete: React.FC<ProductSearchAutocompleteProps> = ({
  onSelectProduct,
  onSelectSuggestion,
  onSearchResults,
  productType = 'food',
  placeholder = 'Search products...',
  autoFocus = false,
  showProductResults = true,
  initialValue = '',
  suggestLimit = 8,
  searchLimit = 20,
}) => {
  const { theme } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestResponse | null>(null);
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch trending on mount
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const response = await productSearchService.trending(productType, 10);
        if (response.success) {
          setTrending(response.trending);
        }
      } catch (error) {
        console.error('Failed to load trending:', error);
      }
    };
    loadTrending();
  }, [productType]);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setSuggestions(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await productSearchService.suggest(query, productType, suggestLimit);
        setSuggestions(response);
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, productType, suggestLimit]);

  // Handle selection of a suggestion
  const handleSelectSuggestion = useCallback(async (text: string) => {
    setQuery(text);
    setShowDropdown(false);
    Keyboard.dismiss();
    onSelectSuggestion?.(text);

    if (showProductResults) {
      setLoading(true);
      try {
        const results = await productSearchService.search(text, {
          type: productType === 'all' ? undefined : productType,
          limit: searchLimit,
        });
        const productList = productType === 'food' || productType === 'all' 
          ? results.food 
          : productType === 'beauty' 
            ? results.beauty as unknown as FoodProduct[]
            : results.petfood as unknown as FoodProduct[];
        setProducts(productList);
        onSearchResults?.(productList);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [productType, searchLimit, showProductResults, onSelectSuggestion, onSearchResults]);

  // Handle product selection
  const handleSelectProduct = useCallback((product: FoodProduct) => {
    setQuery(product.name);
    setShowDropdown(false);
    setProducts([]);
    Keyboard.dismiss();
    onSelectProduct?.(product);
  }, [onSelectProduct]);

  // Handle submit (Enter key)
  const handleSubmit = useCallback(() => {
    if (query.length >= 2) {
      handleSelectSuggestion(query);
    }
  }, [query, handleSelectSuggestion]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowDropdown(true);
  }, []);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay hiding dropdown to allow click events
    setTimeout(() => setShowDropdown(false), 200);
  }, []);

  // Clear input
  const handleClear = useCallback(() => {
    setQuery('');
    setSuggestions(null);
    setProducts([]);
    inputRef.current?.focus();
  }, []);

  // Determine what to show in dropdown
  const showTrending = query.length < 2 && trending.length > 0;
  const showSuggestions = query.length >= 2 && suggestions && suggestions.suggestions.length > 0;
  const hasDropdownContent = showTrending || showSuggestions;

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={[
        styles.inputContainer,
        { 
          backgroundColor: theme.colors.background,
          borderColor: isFocused ? '#4cbb17' : theme.colors.border,
        }
      ]}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={isFocused ? '#4cbb17' : theme.colors.textSecondary} 
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.colors.text }]}
          value={query}
          onChangeText={setQuery}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && (
          <ActivityIndicator size="small" color="#4cbb17" style={styles.loader} />
        )}
        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown */}
      {showDropdown && hasDropdownContent && (
        <View style={[
          styles.dropdown,
          { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          }
        ]}>
          <ScrollView 
            keyboardShouldPersistTaps="handled"
            style={styles.dropdownScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Trending Searches */}
            {showTrending && (
              <>
                <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
                  <Ionicons name="trending-up" size={14} color="#4cbb17" />
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                    Trending Searches
                  </Text>
                </View>
                {trending.map((item, index) => (
                  <TouchableOpacity
                    key={`trending-${index}`}
                    style={[styles.dropdownItem, { borderBottomColor: theme.colors.border }]}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <Text style={styles.trendingIcon}>🔥</Text>
                    <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Suggestions */}
            {showSuggestions && (
              <>
                <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
                  <Ionicons name="search" size={14} color="#4cbb17" />
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                    Suggestions
                  </Text>
                  {suggestions?.fromCache && (
                    <Text style={styles.cacheIndicator}>⚡</Text>
                  )}
                </View>
                {suggestions?.suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`suggestion-${index}`}
                    style={[styles.dropdownItem, { borderBottomColor: theme.colors.border }]}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <Ionicons name="search-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Brand suggestions */}
                {suggestions?.brands && suggestions.brands.length > 0 && (
                  <>
                    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
                      <Ionicons name="pricetag-outline" size={14} color="#4cbb17" />
                      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                        Brands
                      </Text>
                    </View>
                    {suggestions.brands.slice(0, 4).map((brand, index) => (
                      <TouchableOpacity
                        key={`brand-${index}`}
                        style={[styles.dropdownItem, { borderBottomColor: theme.colors.border }]}
                        onPress={() => handleSelectSuggestion(brand)}
                      >
                        <Ionicons name="pricetag" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>
                          {brand}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      )}

      {/* Product Results */}
      {showProductResults && products.length > 0 && !showDropdown && (
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
            {products.length} Products Found
          </Text>
          <ScrollView style={styles.resultsScroll} showsVerticalScrollIndicator={false}>
            {products.map((product, index) => (
              <TouchableOpacity
                key={product.id || `product-${index}`}
                style={[styles.productCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => handleSelectProduct(product)}
              >
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={2}>
                    {product.name}
                  </Text>
                  {product.brand && (
                    <Text style={[styles.productBrand, { color: theme.colors.textSecondary }]}>
                      {product.brand}
                    </Text>
                  )}
                  {(product.nutrition?.calories || product.calories) && (
                    <View style={styles.nutritionRow}>
                      <Text style={[styles.nutritionText, { color: theme.colors.textSecondary }]}>
                        {product.nutrition?.calories || product.calories} cal
                      </Text>
                      {(product.nutrition?.protein || product.protein) && (
                        <Text style={[styles.nutritionText, { color: theme.colors.textSecondary }]}>
                          • {product.nutrition?.protein || product.protein}g protein
                        </Text>
                      )}
                    </View>
                  )}
                </View>
                <View style={styles.productAction}>
                  <Ionicons name="add-circle" size={28} color="#4cbb17" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  loader: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    zIndex: 1001,
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cacheIndicator: {
    fontSize: 10,
    marginLeft: 'auto',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  dropdownItemText: {
    fontSize: 15,
    flex: 1,
  },
  trendingIcon: {
    fontSize: 14,
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultsScroll: {
    maxHeight: 400,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 13,
    marginBottom: 4,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 4,
  },
  nutritionText: {
    fontSize: 12,
  },
  productAction: {
    marginLeft: 12,
  },
});

export default ProductSearchAutocomplete;
