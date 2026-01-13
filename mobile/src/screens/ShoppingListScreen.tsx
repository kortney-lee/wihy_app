import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Animated,
  Share,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { createInstacartLinkFromMealPlan } from '../services/instacartService';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import mockShoppingListData from '../../mock-data-shopping-list.json';
import { GradientDashboardHeader } from '../components/shared';

type ShoppingListScreenRouteProp = RouteProp<RootStackParamList, 'ShoppingList'>;
type ShoppingListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ShoppingList'
>;

interface Props {
  route?: ShoppingListScreenRouteProp;
  navigation?: ShoppingListScreenNavigationProp;
  isDashboardMode?: boolean;
}

interface ShoppingItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  checked?: boolean;
  category?: string;
  notes?: string;
  brand?: string;
}

export default function ShoppingListScreen({ route, navigation, isDashboardMode = false }: Props) {
  // Support both navigation mode (with route params) and dashboard mode (with mock data)
  const mealPlanId: number = route?.params?.mealPlanId || 1;
  const shoppingListData = route?.params?.shoppingListData || {
    totalItems: mockShoppingListData.total_items,
    itemsByCategory: mockShoppingListData.items_by_category,
    estimatedCost: mockShoppingListData.estimated_cost,
  };
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [instacartUrl, setInstacartUrl] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['protein', 'produce', 'dairy'])
  );
  
  // Track checked items
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  
  // Animation for progress bar
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  const categories = Object.keys(shoppingListData.itemsByCategory || {});
  
  // Calculate totals
  const totalItems = shoppingListData.totalItems || 0;
  const checkedCount = checkedItems.size;
  const progressPercent = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  // Animate progress bar when items are checked
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progressPercent,
      tension: 40,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleItemChecked = (itemKey: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
  };

  const getItemKey = (category: string, index: number) => `${category}-${index}`;

  const handleCreateInstacartLink = async () => {
    setLoading(true);
    try {
      const response = await createInstacartLinkFromMealPlan(mealPlanId);
      setInstacartUrl(response.productsLinkUrl);
      Alert.alert(
        '🛒 Instacart Link Ready!',
        `${response.ingredientCount} ingredients ready to shop at your favorite store`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error creating Instacart link:', error);
      Alert.alert('Error', 'Failed to create Instacart shopping link');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInstacart = async () => {
    if (!instacartUrl) return;

    try {
      const supported = await Linking.canOpenURL(instacartUrl);
      if (supported) {
        await Linking.openURL(instacartUrl);
      } else {
        Alert.alert('Error', 'Cannot open Instacart link');
      }
    } catch (error) {
      console.error('Error opening Instacart:', error);
      Alert.alert('Error', 'Failed to open Instacart');
    }
  };

  const handleShareList = async () => {
    try {
      let listText = '🛒 Shopping List\n\n';
      
      categories.forEach((category) => {
        const items = shoppingListData.itemsByCategory[category] || [];
        if (items.length > 0) {
          listText += `${getCategoryIcon(category)} ${category.toUpperCase()}\n`;
          items.forEach((item: ShoppingItem) => {
            const checked = checkedItems.has(getItemKey(category, items.indexOf(item)));
            listText += `${checked ? '✓' : '○'} ${item.quantity} ${item.unit} ${item.name}\n`;
          });
          listText += '\n';
        }
      });

      await Share.share({
        message: listText,
        title: 'Shopping List',
      });
    } catch (error) {
      console.error('Error sharing list:', error);
    }
  };

  const handleClearChecked = () => {
    if (checkedItems.size === 0) return;
    
    Alert.alert(
      'Clear Checked Items?',
      `Remove ${checkedItems.size} checked items from view?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => setCheckedItems(new Set()),
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      protein: '🥩',
      produce: '🥬',
      dairy: '🥛',
      grains: '🌾',
      pantry: '🥫',
      snacks: '🍿',
      beverages: '🥤',
      frozen: '🧊',
      bakery: '🍞',
      condiments: '🧂',
      spices: '🌿',
      oils: '🫒',
      seafood: '🐟',
      meat: '🥩',
      vegetables: '🥕',
      fruits: '🍎',
      canned: '🥫',
      baking: '🧁',
    };
    return icons[category.toLowerCase()] || '🛒';
  };

  const getCategoryUncheckedCount = (category: string): number => {
    const items = shoppingListData.itemsByCategory[category] || [];
    let unchecked = 0;
    items.forEach((_: ShoppingItem, index: number) => {
      if (!checkedItems.has(getItemKey(category, index))) {
        unchecked++;
      }
    });
    return unchecked;
  };

  return (
    <>
      {/* Pattern B: Dual SafeAreaView - Stack Screen */}
      <SafeAreaView style={styles.topBox}>
        <GradientDashboardHeader
          title="Shopping List"
          gradient="shoppingList"
          showBackButton={!!navigation}
          onBackPress={() => navigation?.goBack()}
          rightAction={checkedItems.size > 0 ? {
            icon: 'checkmark-done-outline',
            onPress: handleClearChecked,
          } : undefined}
          style={styles.header}
        >
          {/* Progress Section inside header */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {checkedCount} of {totalItems} items
              </Text>
              <Text style={styles.progressPercent}>
                {Math.round(progressPercent)}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            {progressPercent === 100 && (
              <View style={styles.completeBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.completeBadgeText}>All done!</Text>
              </View>
            )}
          </View>
        </GradientDashboardHeader>
      </SafeAreaView>

      <SafeAreaView style={styles.scrollContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="grid-outline" size={20} color="#4cbb17" />
              <Text style={styles.statValue}>{categories.length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cart-outline" size={20} color="#4cbb17" />
              <Text style={styles.statValue}>{totalItems - checkedCount}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkbox-outline" size={20} color="#4cbb17" />
              <Text style={styles.statValue}>{checkedCount}</Text>
              <Text style={styles.statLabel}>Checked</Text>
            </View>
          </View>

          {/* Categories */}
          {categories.map((category) => {
            const items = shoppingListData.itemsByCategory[category] || [];
            const isExpanded = expandedCategories.has(category);
            const uncheckedCount = getCategoryUncheckedCount(category);
            const allChecked = uncheckedCount === 0;

            return (
              <View key={category} style={[styles.categoryCard, allChecked && styles.categoryCardComplete]}>
                <TouchableOpacity
                  onPress={() => toggleCategory(category)}
                  style={styles.categoryHeader}
                >
                  <View style={styles.categoryTitleRow}>
                    <Text style={styles.categoryIcon}>
                      {getCategoryIcon(category)}
                    </Text>
                    <Text style={[styles.categoryTitle, allChecked && styles.categoryTitleComplete]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                    <View style={[styles.categoryBadge, allChecked && styles.categoryBadgeComplete]}>
                      <Text style={[styles.categoryBadgeText, allChecked && styles.categoryBadgeTextComplete]}>
                        {allChecked ? '✓' : uncheckedCount}
                      </Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
                    size={20} 
                    color="#9ca3af" 
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.itemsList}>
                    {items.map((item: ShoppingItem, index: number) => {
                      const itemKey = getItemKey(category, index);
                      const isChecked = checkedItems.has(itemKey);
                      
                      return (
                        <TouchableOpacity 
                          key={itemKey} 
                          style={[styles.itemRow, isChecked && styles.itemRowChecked]}
                          onPress={() => toggleItemChecked(itemKey)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                            {isChecked && (
                              <Ionicons name="checkmark" size={14} color="#fff" />
                            )}
                          </View>
                          <View style={styles.itemContent}>
                            <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>
                              {item.name}
                            </Text>
                            <Text style={[styles.itemQuantity, isChecked && styles.itemQuantityChecked]}>
                              {item.quantity} {item.unit}
                            </Text>
                          </View>
                          {item.brand && (
                            <Text style={styles.itemBrand}>{item.brand}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          {/* Instacart Section */}
          <View style={styles.instacartSection}>
            <View style={styles.instacartHeader}>
              <Text style={styles.instacartTitle}>🛒 Shop Online</Text>
              <Text style={styles.instacartSubtitle}>
                Get groceries delivered from 58+ retailers
              </Text>
            </View>

            {!instacartUrl ? (
              <TouchableOpacity
                style={[styles.instacartButton, loading && styles.buttonDisabled]}
                onPress={handleCreateInstacartLink}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.instacartButtonContent}>
                    <View style={styles.instacartLogo}>
                      <Text style={styles.instacartLogoText}>🥕</Text>
                    </View>
                    <View style={styles.instacartButtonTextContainer}>
                      <Text style={styles.instacartButtonText}>
                        Create Instacart Link
                      </Text>
                      <Text style={styles.instacartButtonSubtext}>
                        Add all items to cart instantly
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.shopButton}
                onPress={handleOpenInstacart}
              >
                <View style={styles.instacartButtonContent}>
                  <View style={[styles.instacartLogo, { backgroundColor: '#fff' }]}>
                    <Text style={styles.instacartLogoText}>🥕</Text>
                  </View>
                  <View style={styles.instacartButtonTextContainer}>
                    <Text style={styles.shopButtonText}>
                      Shop on Instacart
                    </Text>
                    <Text style={styles.shopButtonSubtext}>
                      ALDI • Wegmans • Target • Costco
                    </Text>
                  </View>
                  <Ionicons name="open-outline" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Store Options */}
          <View style={styles.storeOptions}>
            <Text style={styles.storeOptionsTitle}>Available at</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storeLogos}
            >
              {['🟡 ALDI', '🔵 Walmart', '🔴 Target', '🟢 Costco', '🟣 Wegmans', '🟠 Kroger'].map((store) => (
                <View key={store} style={styles.storeLogo}>
                  <Text style={styles.storeLogoText}>{store}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  // Pattern B: Dual SafeAreaView
  topBox: {
    backgroundColor: '#4cbb17',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {},
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerActionButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  
  // Progress Section
  progressSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    color: '#d1fae5',
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  completeBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  
  // Category Card
  categoryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryCardComplete: {
    opacity: 0.7,
    backgroundColor: '#f9fafb',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  categoryTitleComplete: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  categoryBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryBadgeComplete: {
    backgroundColor: '#d1fae5',
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
  },
  categoryBadgeTextComplete: {
    color: '#059669',
  },
  
  // Items List
  itemsList: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  itemRowChecked: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#4cbb17',
    borderColor: '#4cbb17',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#6b7280',
  },
  itemQuantityChecked: {
    color: '#d1d5db',
  },
  itemBrand: {
    fontSize: 12,
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  
  // Instacart Section
  instacartSection: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instacartHeader: {
    marginBottom: 16,
  },
  instacartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  instacartSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  instacartButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  instacartButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  instacartLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instacartLogoText: {
    fontSize: 20,
  },
  instacartButtonTextContainer: {
    flex: 1,
  },
  instacartButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  instacartButtonSubtext: {
    fontSize: 12,
    color: '#d1fae5',
  },
  shopButton: {
    backgroundColor: '#4cbb17',
    borderRadius: 12,
    overflow: 'hidden',
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  shopButtonSubtext: {
    fontSize: 12,
    color: '#d1fae5',
  },
  
  // Store Options
  storeOptions: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  storeOptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    marginLeft: 4,
  },
  storeLogos: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 16,
  },
  storeLogo: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  storeLogoText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
  },
  
  bottomPadding: {
    height: 40,
  },
});
