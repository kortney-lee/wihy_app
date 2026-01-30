import React, { useState, useCallback } from 'react';
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
} from 'react-native';
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

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await productSearchService.search(query, {
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

  const handleSelectProduct = (product: FoodProduct) => {
    onSelectProduct(product);
    setQuery('');
    setResults([]);
    setSearched(false);
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
            <SvgIcon name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Products</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SvgIcon name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for ingredients..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {loading && <ActivityIndicator size="small" />}
        </View>

        {/* Quick Categories */}
        {!searched && (
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
});
