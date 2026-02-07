import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { productSearchService, FoodProduct } from '../services/productSearchService';
import SvgIcon from './shared/SvgIcon';
import { useTheme } from '../context/ThemeContext';

interface ProductSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectProduct: (product: FoodProduct) => void;
}

export function ProductSearchModal({
  visible,
  onClose,
  onSelectProduct,
}: ProductSearchModalProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Autocomplete state (Google-like)
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<FoodProduct[]>([]);
  const [suggestedBrands, setSuggestedBrands] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load trending on modal open
  useEffect(() => {
    if (visible) {
      loadTrending();
    } else {
      // Reset state on close
      setQuery('');
      setResults([]);
      setSearched(false);
      setSuggestions([]);
      setSuggestedProducts([]);
      setSuggestedBrands([]);
      setShowDropdown(false);
    }
  }, [visible]);

  const loadTrending = async () => {
    try {
      const data = await productSearchService.trending('food', 8);
      setTrendingSearches(data.trending || []);
    } catch (error) {
      console.warn('Failed to load trending:', error);
      setTrendingSearches(['chicken breast', 'rice', 'salmon', 'broccoli', 'eggs', 'avocado']);
    }
  };

  // Debounced autocomplete as user types
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setSuggestedProducts([]);
      setSuggestedBrands([]);
      setShowDropdown(query.length === 0 && trendingSearches.length > 0);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const data = await productSearchService.suggest(query, 'food', 8);
        setSuggestions(data.suggestions || []);
        // Map products to include required FoodProduct fields
        const mappedProducts = (data.products || []).map((p, index) => ({
          ...p,
          id: `suggest-${index}-${Date.now()}`,
          score: 1,
          type: 'food' as const,
        }));
        setSuggestedProducts(mappedProducts);
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
  }, [query, trendingSearches.length]);

  const handleSearch = useCallback(async (searchTerm?: string) => {
    const term = searchTerm || query;
    if (!term.trim()) return;

    setLoading(true);
    setSearched(true);
    setShowDropdown(false);
    setSuggestions([]);
    setSuggestedProducts([]);
    setSuggestedBrands([]);
    
    try {
      const data = await productSearchService.search(term, {
        type: 'food',
        limit: 30,
      });
      setResults(data.food);
    } catch (error) {
      console.error('Product search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleSelectProduct = (product: FoodProduct) => {
    onSelectProduct(product);
    setQuery('');
    setResults([]);
    setSearched(false);
    setShowDropdown(false);
    onClose();
  };

  const quickCategories = [
    'Chicken', 'Beef', 'Fish', 'Rice', 'Pasta', 
    'Cheese', 'Vegetables', 'Fruits'
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <SvgIcon name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Search Products</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <SvgIcon name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search for ingredients..."
            placeholderTextColor={theme.colors.textSecondary}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setSearched(false);
            }}
            onSubmitEditing={() => handleSearch()}
            onFocus={() => setShowDropdown(true)}
            returnKeyType="search"
            autoFocus
          />
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : query ? (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); setShowDropdown(true); }}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Autocomplete Dropdown (Google-like) */}
        {showDropdown && !searched && (
          <View style={[styles.autocompleteDropdown, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
              {query.length < 2 ? (
                // Trending searches
                <>
                  <Text style={[styles.dropdownSectionTitle, { color: theme.colors.textSecondary }]}>
                    🔥 Trending Searches
                  </Text>
                  {trendingSearches.map((term, index) => (
                    <TouchableOpacity
                      key={`trending-${index}`}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectSuggestion(term)}
                    >
                      <Ionicons name="trending-up" size={16} color="#f97316" />
                      <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>{term}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                // Autocomplete suggestions
                <>
                  {suggestions.length > 0 && (
                    <>
                      <Text style={[styles.dropdownSectionTitle, { color: theme.colors.textSecondary }]}>
                        🔍 Suggestions
                      </Text>
                      {suggestions.slice(0, 5).map((suggestion, index) => (
                        <TouchableOpacity
                          key={`suggestion-${index}`}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectSuggestion(suggestion)}
                        >
                          <Ionicons name="search" size={16} color={theme.colors.textSecondary} />
                          <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                  
                  {suggestedBrands.length > 0 && (
                    <>
                      <Text style={[styles.dropdownSectionTitle, { color: theme.colors.textSecondary, marginTop: 8 }]}>
                        🏷️ Brands
                      </Text>
                      {suggestedBrands.slice(0, 3).map((brand, index) => (
                        <TouchableOpacity
                          key={`brand-${index}`}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectSuggestion(brand)}
                        >
                          <Ionicons name="pricetag" size={16} color="#8b5cf6" />
                          <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>{brand}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}

                  {suggestedProducts.length > 0 && (
                    <>
                      <Text style={[styles.dropdownSectionTitle, { color: theme.colors.textSecondary, marginTop: 8 }]}>
                        📦 Quick Add
                      </Text>
                      {suggestedProducts.slice(0, 4).map((product, index) => (
                        <TouchableOpacity
                          key={`product-${index}`}
                          style={[styles.dropdownProductItem, { borderColor: theme.colors.border }]}
                          onPress={() => handleSelectProduct(product)}
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

        {/* Quick Categories (only when no search yet and dropdown hidden) */}
        {!searched && !showDropdown && (
          <View style={styles.categoriesContainer}>
            <Text style={styles.categoriesTitle}>Popular Categories</Text>
            <View style={styles.categoriesGrid}>
              {quickCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.categoryButton}
                  onPress={() => {
                    setQuery(category);
                    setTimeout(() => handleSearch(), 100);
                  }}
                >
                  <Text style={styles.categoryText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Results */}
        {searched && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsContainer}
            ListEmptyComponent={
              loading ? null : (
                <View style={styles.emptyState}>
                  <SvgIcon name="search" size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>
                    {query ? 'No products found' : 'Search to find products'}
                  </Text>
                </View>
              )
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => handleSelectProduct(item)}
              >
                <View style={styles.productInfo}>
                  <View>
                    <Text style={styles.productName}>{item.name}</Text>
                    {item.brand && (
                      <Text style={styles.productBrand}>{item.brand}</Text>
                    )}
                    {item.servingSize && (
                      <Text style={styles.productServing}>Serving: {item.servingSize}</Text>
                    )}
                  </View>

                  {/* Nutrition Summary */}
                  {item.calories !== undefined && (
                    <View style={styles.nutritionSummary}>
                      <View style={styles.nutritionBadge}>
                        <Text style={styles.nutritionLabel}>CAL</Text>
                        <Text style={styles.nutritionValue}>{item.calories}</Text>
                      </View>
                      {item.protein !== undefined && (
                        <View style={styles.nutritionBadge}>
                          <Text style={styles.nutritionLabel}>PRO</Text>
                          <Text style={styles.nutritionValue}>{item.protein}g</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <SvgIcon name="add-circle" size={24} color="#3b82f6" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#ffffff', // theme.colors.surface
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#ffffff', // theme.colors.surface
    margin: 16,
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    outlineStyle: 'none' as any,
  },
  categoriesContainer: {
    padding: 16,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    color: '#374151',
  },
  resultsContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  productBrand: {
    fontSize: 14,
    color: '#6b7280',
  },
  productServing: {
    fontSize: 12,
    color: '#9ca3af',
  },
  nutritionSummary: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  nutritionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
  },
  nutritionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3b82f6',
  },
  nutritionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  
  // Autocomplete Dropdown Styles (Google-like search)
  autocompleteDropdown: {
    marginHorizontal: 16,
    marginTop: -8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
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
});
