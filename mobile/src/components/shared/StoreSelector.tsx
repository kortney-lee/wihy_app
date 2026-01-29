/**
 * StoreSelector Component
 * 
 * Displays available stores for the user to select for shopping integration.
 * Used in the progressive enhancement flow.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { AvailableStore } from '../../services/mealService';

interface StoreSelectorProps {
  stores: AvailableStore[];
  selectedStoreId?: string | null;
  onSelectStore: (store: AvailableStore) => void;
  loading?: boolean;
  title?: string;
  showEstimatedCost?: boolean;
  showDistance?: boolean;
}

const DEFAULT_STORE_LOGOS: Record<string, string> = {
  costco: '🏪',
  walmart: '🛒',
  kroger: '🛍️',
  safeway: '🥬',
  trader_joes: '🌻',
  whole_foods: '🥗',
  target: '🎯',
  publix: '🛒',
  aldis: '💰',
  default: '🏬',
};

export const StoreSelector: React.FC<StoreSelectorProps> = ({
  stores,
  selectedStoreId,
  onSelectStore,
  loading = false,
  title = 'Select a Store',
  showEstimatedCost = true,
  showDistance = true,
}) => {
  const { theme } = useTheme();
  const renderStore = ({ item: store }: { item: AvailableStore }) => {
    const isSelected = store.id === selectedStoreId;
    const logoEmoji = DEFAULT_STORE_LOGOS[store.id] || DEFAULT_STORE_LOGOS.default;

    return (
      <TouchableOpacity
        style={[
          styles.storeCard,
          isSelected && [styles.storeCardSelected, { backgroundColor: theme.colors.background }],
        ]}
        onPress={() => onSelectStore(store)}
        activeOpacity={0.7}
      >
        <View style={styles.storeLogoContainer}>
          {store.logo_url ? (
            <Image
              source={{ uri: store.logo_url }}
              style={styles.storeLogo}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.storeLogoEmoji}>{logoEmoji}</Text>
          )}
        </View>

        <View style={styles.storeInfo}>
          <Text style={[styles.storeName, isSelected && styles.storeNameSelected]}>
            {store.name}
          </Text>
          
          <View style={styles.storeDetails}>
            {showDistance && store.distance_mi && (
              <Text style={styles.storeDetail}>
                📍 {store.distance_mi.toFixed(1)} mi
              </Text>
            )}
            {store.supports_instacart && (
              <View style={styles.instacartBadge}>
                <Text style={styles.instacartBadgeText}>Instacart</Text>
              </View>
            )}
          </View>

          {showEstimatedCost && store.estimated_total_cost && (
            <Text style={styles.storeCost}>
              Est. total: {store.estimated_total_cost}
            </Text>
          )}
        </View>

        <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Finding stores near you...</Text>
      </View>
    );
  }

  if (!stores.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏬</Text>
        <Text style={styles.emptyTitle}>No stores found</Text>
        <Text style={styles.emptyDescription}>
          We couldn't find any stores with Instacart delivery in your area.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        Choose a store for accurate pricing and Instacart ordering
      </Text>
      
      <FlatList
        data={stores}
        renderItem={renderStore}
        keyExtractor={(store) => store.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  storeCardSelected: {
    borderColor: '#007AFF',
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  storeLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeLogo: {
    width: 36,
    height: 36,
  },
  storeLogoEmoji: {
    fontSize: 28,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  storeNameSelected: {
    color: '#007AFF',
  },
  storeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  storeDetail: {
    fontSize: 13,
    color: '#666',
  },
  instacartBadge: {
    backgroundColor: '#43B02A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  instacartBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  storeCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 4,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default StoreSelector;
