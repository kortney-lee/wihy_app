import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Animated,
  Share,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { createShoppingList, ShoppingListItem as InstacartItem } from '../services/instacartService';
import { shoppingService, ShoppingList } from '../services/shoppingService';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '../components/shared';
import ProductSearchAutocomplete from '../components/ProductSearchAutocomplete';
import { FoodProduct } from '../services/productSearchService';
// Note: Mock data removed to expose real API issues

type ShoppingListScreenRouteProp = RouteProp<RootStackParamList, 'ShoppingList'>;
type ShoppingListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ShoppingList'
>;

interface Props {
  route?: ShoppingListScreenRouteProp;
  navigation?: ShoppingListScreenNavigationProp;
  isDashboardMode?: boolean;
  onBack?: () => void;
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

export default function ShoppingListScreen({ route, navigation, isDashboardMode = false, onBack }: Props) {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  
  // Data loading states
  const [loading, setLoading] = useState(isDashboardMode);
  const [userLists, setUserLists] = useState<ShoppingList[]>([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  
  // Support both Stack navigation (route params) and dashboard mode (load from API)
  const mealPlanId: number = route?.params?.mealPlanId || 0;
  const routeShoppingData = route?.params?.shoppingListData;
  const fromMealPlan = route?.params?.fromMealPlan || false;
  
  // Compute shopping list data from either route params or active list
  const shoppingListData = routeShoppingData || {
    totalItems: activeList?.total_items || 0,
    itemsByCategory: activeList?.items_by_category || {},
    estimatedCost: { min: 0, max: activeList?.estimated_total_cost || 0 },
  };
  
  const [instacartUrl, setInstacartUrl] = useState<string | null>(activeList?.instacart_url || null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['protein', 'produce', 'dairy'])
  );
  
  // Track checked items
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  
  // Manual entry states
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('item');
  const [newItemCategory, setNewItemCategory] = useState<string>('Other');
  const [newItemBrand, setNewItemBrand] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  
  // Animation for progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  
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
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // Load user's shopping lists in dashboard mode
  useEffect(() => {
    if (isDashboardMode && user?.id) {
      loadUserShoppingLists();
    }
  }, [isDashboardMode, user?.id]);

  // Auto-create Instacart link when coming from meal plan save
  useEffect(() => {
    if (fromMealPlan && routeShoppingData && !instacartUrl) {
      // Auto-trigger Instacart link creation and open
      const autoCreateInstacartLink = async () => {
        const allItems: InstacartItem[] = [];
        
        const cats = Object.keys(routeShoppingData.itemsByCategory || {});
        cats.forEach((category) => {
          const items = routeShoppingData.itemsByCategory[category] || [];
          items.forEach((item: ShoppingItem) => {
            if (item.name) {
              allItems.push({
                name: item.name,
                quantity: item.quantity || 1,
                unit: item.unit || 'item',
              });
            }
          });
        });
        
        if (allItems.length === 0) return;
        
        setLoading(true);
        try {
          console.log('[ShoppingList] Auto-creating Instacart link with', allItems.length, 'items');
          const response = await createShoppingList(allItems, 'WIHY Meal Plan');
          
          if (response?.success && response?.data?.productsLinkUrl) {
            const url = response.data.productsLinkUrl;
            setInstacartUrl(url);
            
            // Auto-open Instacart
            try {
              await Linking.openURL(url);
            } catch (linkError) {
              console.warn('Failed to auto-open Instacart:', linkError);
            }
          }
        } catch (error) {
          console.error('Error auto-creating Instacart link:', error);
        } finally {
          setLoading(false);
        }
      };
      
      autoCreateInstacartLink();
    }
  }, [fromMealPlan, routeShoppingData]);

  const loadUserShoppingLists = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const lists = await shoppingService.getUserLists(user.id, { status: 'active', limit: 10 });
      setUserLists(lists);
      
      // Set the most recent active list as default
      if (lists.length > 0) {
        setActiveList(lists[0]);
        setInstacartUrl(lists[0].instacart_url || null);
      }
    } catch (error) {
      console.error('Error loading shopping lists:', error);
      // Don't show alert in dashboard mode - just log the error
    } finally {
      setLoading(false);
    }
  };

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
    // Extract all items from the shopping list data
    const allItems: InstacartItem[] = [];
    
    categories.forEach((category) => {
      const items = shoppingListData.itemsByCategory[category] || [];
      items.forEach((item: ShoppingItem) => {
        if (item.name) {
          allItems.push({
            name: item.name,
            quantity: item.quantity || 1,
            unit: item.unit || 'item',
          });
        }
      });
    });
    
    if (allItems.length === 0) {
      Alert.alert('No Items', 'Add items to your shopping list first');
      return;
    }
    
    setLoading(true);
    try {
      console.log('[ShoppingList] Creating Instacart link with', allItems.length, 'items');
      const response = await createShoppingList(allItems, 'WIHY Shopping List');
      
      if (response?.success && response?.data?.productsLinkUrl) {
        setInstacartUrl(response.data.productsLinkUrl);
        Alert.alert(
          '🛒 Instacart Link Ready!',
          `${allItems.length} items ready to shop at your favorite store`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Invalid response from Instacart service');
      }
    } catch (error) {
      console.error('Error creating Instacart link:', error);
      Alert.alert('Error', 'Failed to create Instacart shopping link. Please try again.');
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
        message: listText + '\n📱 Created with WIHY AI - https://wihy.ai',
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

  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemQuantity.trim()) {
      Alert.alert('Missing Information', 'Please enter item name and quantity');
      return;
    }

    if (!user?.id) {
      Alert.alert('Not Signed In', 'Please sign in to create shopping lists');
      return;
    }

    try {
      setLoading(true);
      
      // Create list if none exists
      let listId = activeList?.list_id;
      if (!listId) {
        const newList = await shoppingService.createManualList(user.id, {
          name: `Shopping List - ${new Date().toLocaleDateString()}`,
          budget: 150,
        });
        listId = newList.list_id!;
        setActiveList(newList);
      }
      
      // Add item to list with nutrition data if from product search
      const newItem: any = {
        name: newItemName,
        quantity: parseFloat(newItemQuantity) || 1,
        unit: newItemUnit,
        category: newItemCategory,
        brand: newItemBrand || selectedProduct?.brand,
        ...(selectedProduct && {
          product_id: selectedProduct.id,
          calories: selectedProduct.nutrition?.calories || selectedProduct.calories,
          protein: selectedProduct.nutrition?.protein || selectedProduct.protein,
          carbs: selectedProduct.nutrition?.carbs || selectedProduct.carbs,
          fat: selectedProduct.nutrition?.fat || selectedProduct.fat,
        }),
      };
      
      await shoppingService.addItemsToList(listId, [newItem]);
      await loadUserShoppingLists();
      
      // Reset form
      setNewItemName('');
      setNewItemQuantity('1');
      setNewItemUnit('item');
      setNewItemCategory('Other');
      setNewItemBrand('');
      setSelectedProduct(null);
      setShowAddItemModal(false);
      
      Alert.alert('Success', 'Item added to shopping list');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle product selection from autocomplete
  const handleProductSelect = (product: FoodProduct) => {
    setSelectedProduct(product);
    setNewItemName(product.name);
    setNewItemBrand(product.brand || '');
    // Auto-detect category from product categories
    if (product.categories) {
      const categories = product.categories.toLowerCase();
      if (categories.includes('meat') || categories.includes('protein') || categories.includes('chicken') || categories.includes('beef')) {
        setNewItemCategory('Proteins');
      } else if (categories.includes('vegetable') || categories.includes('fruit') || categories.includes('produce')) {
        setNewItemCategory('Produce');
      } else if (categories.includes('dairy') || categories.includes('milk') || categories.includes('cheese') || categories.includes('yogurt')) {
        setNewItemCategory('Dairy');
      } else if (categories.includes('grain') || categories.includes('bread') || categories.includes('pasta') || categories.includes('rice')) {
        setNewItemCategory('Grains');
      } else if (categories.includes('snack') || categories.includes('chip') || categories.includes('cookie')) {
        setNewItemCategory('Pantry');
      }
    }
  };

  // Handle suggestion selection (custom text entry)
  const handleSuggestionSelect = (text: string) => {
    setNewItemName(text);
    setSelectedProduct(null);
  };

  const handleBack = () => {
    if (isDashboardMode && onBack) {
      onBack();
    } else if (navigation) {
      navigation.goBack();
    }
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {loading && !routeShoppingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4cbb17" />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading shopping lists...</Text>
        </View>
      ) : (
        <>
          {/* Status bar area - Always green */}
          <View style={{ height: insets.top, backgroundColor: '#4cbb17' }} />
          
          {/* Collapsing Header */}
          <Animated.View style={[styles.collapsibleHeader, { height: headerHeight, backgroundColor: '#4cbb17' }]}>
            <Animated.View 
              style={[
                styles.headerContent,
                { 
                  opacity: headerOpacity,
                  transform: [{ scale: titleScale }]
                }
              ]}
            >
              <Text style={styles.collapsibleHeaderTitle}>Shopping List</Text>
              <Text style={styles.collapsibleHeaderSubtitle}>
                {checkedCount} of {totalItems} items • {Math.round(progressPercent)}% complete
              </Text>
              {progressPercent === 100 && (
                <View style={styles.progressBadge}>
                  <Text style={styles.progressBadgeText}>✓ All done!</Text>
                </View>
              )}
            </Animated.View>
          </Animated.View>

          {/* Fixed Action Bar - Below collapsing header */}
          <View style={[styles.actionBar, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <TouchableOpacity onPress={handleBack} style={styles.actionButton}>
              <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
            </TouchableOpacity>
            
            <View style={styles.progressBarMini}>
              <Animated.View
                style={[
                  styles.progressBarMiniFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            
            <View style={styles.actionButtonsRight}>
              {isDashboardMode && (
                <TouchableOpacity
                  onPress={() => setShowAddItemModal(true)}
                  style={styles.actionButton}
                >
                  <Ionicons name="add-circle-outline" size={22} color="#4cbb17" />
                </TouchableOpacity>
              )}
              {checkedItems.size > 0 && (
                <TouchableOpacity
                  onPress={handleClearChecked}
                  style={styles.actionButton}
                >
                  <Ionicons name="checkmark-done-outline" size={22} color="#4cbb17" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleShareList} style={styles.actionButton}>
                <Ionicons name="share-outline" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <Animated.ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
          >
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Ionicons name="grid-outline" size={20} color="#4cbb17" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{categories.length}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Categories</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Ionicons name="cart-outline" size={20} color="#4cbb17" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{totalItems - checkedCount}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Remaining</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Ionicons name="checkbox-outline" size={20} color="#4cbb17" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{checkedCount}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Checked</Text>
            </View>
          </View>

          {/* Categories */}
          {categories.map((category) => {
            const items = shoppingListData.itemsByCategory[category] || [];
            const isExpanded = expandedCategories.has(category);
            const uncheckedCount = getCategoryUncheckedCount(category);
            const allChecked = uncheckedCount === 0;

            return (
              <View key={category} style={[styles.categoryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, allChecked && styles.categoryCardComplete]}>
                <TouchableOpacity
                  onPress={() => toggleCategory(category)}
                  style={[styles.categoryHeader, { backgroundColor: theme.colors.card }]}
                >
                  <View style={styles.categoryTitleRow}>
                    <Text style={styles.categoryIcon}>
                      {getCategoryIcon(category)}
                    </Text>
                    <Text style={[styles.categoryTitle, { color: theme.colors.text }, allChecked && styles.categoryTitleComplete]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                    <View style={[styles.categoryBadge, { backgroundColor: theme.colors.background }, allChecked && styles.categoryBadgeComplete]}>
                      <Text style={[styles.categoryBadgeText, { color: theme.colors.textSecondary }, allChecked && styles.categoryBadgeTextComplete]}>
                        {allChecked ? '✓' : uncheckedCount}
                      </Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
                    size={20} 
                    color={theme.colors.textSecondary} 
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.itemsList, { borderTopColor: theme.colors.border }]}>
                    {items.map((item: ShoppingItem, index: number) => {
                      const itemKey = getItemKey(category, index);
                      const isChecked = checkedItems.has(itemKey);
                      
                      return (
                        <TouchableOpacity 
                          key={itemKey} 
                          style={[styles.itemRow, { borderBottomColor: theme.colors.border }, isChecked && styles.itemRowChecked]}
                          onPress={() => toggleItemChecked(itemKey)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.checkbox, { borderColor: theme.colors.border }, isChecked && styles.checkboxChecked]}>
                            {isChecked && (
                              <Ionicons name="checkmark" size={14} color="#fff" />
                            )}
                          </View>
                          <View style={styles.itemContent}>
                            <Text style={[styles.itemName, { color: theme.colors.text }, isChecked && styles.itemNameChecked]}>
                              {item.name}
                            </Text>
                            <Text style={[styles.itemQuantity, { color: theme.colors.textSecondary }, isChecked && styles.itemQuantityChecked]}>
                              {item.quantity} {item.unit}
                            </Text>
                          </View>
                          {item.brand && (
                            <Text style={[styles.itemBrand, { backgroundColor: theme.colors.background, color: theme.colors.textSecondary }]}>{item.brand}</Text>
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
          <View style={[styles.instacartSection, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.instacartHeader}>
              <Text style={[styles.instacartTitle, { color: theme.colors.text }]}>🛒 Shop Online</Text>
              <Text style={[styles.instacartSubtitle, { color: theme.colors.textSecondary }]}>
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

          <View style={styles.bottomPadding} />
          </Animated.ScrollView>
        </>
      )}

      {/* Manual Item Entry Modal */}
      <Modal
        visible={showAddItemModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddItemModal(false);
          setSelectedProduct(null);
          setNewItemName('');
          setNewItemBrand('');
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Item</Text>
              <TouchableOpacity onPress={() => {
                setShowAddItemModal(false);
                setSelectedProduct(null);
                setNewItemName('');
                setNewItemBrand('');
              }}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
              <View style={styles.modalForm}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Search Product</Text>
                <ProductSearchAutocomplete
                  onSelectProduct={handleProductSelect}
                  onSelectSuggestion={handleSuggestionSelect}
                  productType="food"
                  placeholder="Search foods, brands..."
                  autoFocus
                />

                {/* Selected Product Info */}
                {selectedProduct && (
                  <View style={[styles.selectedProductInfo, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <View style={styles.selectedProductHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.selectedProductName, { color: theme.colors.text }]}>
                          {selectedProduct.name}
                        </Text>
                        {selectedProduct.brand && (
                          <Text style={[styles.selectedProductBrand, { color: theme.colors.textSecondary }]}>
                            {selectedProduct.brand}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity 
                        onPress={() => {
                          setSelectedProduct(null);
                          setNewItemName('');
                          setNewItemBrand('');
                        }}
                        style={styles.clearProductButton}
                      >
                        <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    {selectedProduct.nutrition && (
                      <View style={styles.nutritionGrid}>
                        <View style={styles.nutritionItem}>
                          <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>
                            {selectedProduct.nutrition.calories || 0}
                          </Text>
                          <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>cal</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={[styles.nutritionValue, { color: '#4CAF50' }]}>
                            {selectedProduct.nutrition.protein || 0}g
                          </Text>
                          <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>protein</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={[styles.nutritionValue, { color: '#FF9800' }]}>
                            {selectedProduct.nutrition.carbs || 0}g
                          </Text>
                          <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>carbs</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={[styles.nutritionValue, { color: '#9C27B0' }]}>
                            {selectedProduct.nutrition.fat || 0}g
                          </Text>
                          <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>fat</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Manual entry fallback */}
                {!selectedProduct && newItemName && (
                  <View style={[styles.manualEntryNote, { backgroundColor: theme.colors.background }]}>
                    <Ionicons name="create-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.manualEntryText, { color: theme.colors.textSecondary }]}>
                      Adding "{newItemName}" as custom item
                    </Text>
                  </View>
                )}

                <Text style={[styles.inputLabel, { color: theme.colors.text, marginTop: 16 }]}>Quantity</Text>
                <View style={styles.quantityRow}>
                  <TextInput
                    style={[styles.quantityInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                    value={newItemQuantity}
                    onChangeText={setNewItemQuantity}
                    placeholder="1.5"
                    keyboardType="decimal-pad"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.unitInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                    value={newItemUnit}
                    onChangeText={setNewItemUnit}
                    placeholder="lbs"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>

                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                  {['Proteins', 'Produce', 'Dairy', 'Grains', 'Pantry', 'Other'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setNewItemCategory(cat)}
                      style={[
                        styles.categoryChip,
                        { borderColor: theme.colors.border },
                        newItemCategory === cat && styles.categoryChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: theme.colors.text },
                          newItemCategory === cat && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.addButton, (!newItemName.trim() || !newItemQuantity.trim()) && styles.addButtonDisabled]}
                  onPress={handleAddItem}
                  disabled={!newItemName.trim() || !newItemQuantity.trim()}
                >
                  <Text style={styles.addButtonText}>
                    {selectedProduct ? 'Add Product' : 'Add Custom Item'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pattern A: Simple View + ScrollView
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for bottom tab navigation
  },
  
  // Collapsing Header
  collapsibleHeader: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  collapsibleHeaderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  collapsibleHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  progressBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Action Bar (fixed below collapsing header)
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  actionButton: {
    padding: 6,
  },
  actionButtonsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarMini: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(76, 187, 23, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarMiniFill: {
    height: '100%',
    backgroundColor: '#4cbb17',
    borderRadius: 2,
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
    // backgroundColor: theme.colors.card
    borderRadius: 12,
    borderWidth: 2,
    // borderColor: theme.colors.border
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    // color: theme.colors.text
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    // color: theme.colors.textSecondary
    marginTop: 2,
  },
  
  // Category Card
  categoryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    // backgroundColor: theme.colors.card
    borderRadius: 12,
    borderWidth: 2,
    // borderColor: theme.colors.border
    overflow: 'hidden',
  },
  categoryCardComplete: {
    opacity: 0.7,
    // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    // backgroundColor: theme.colors.card
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
    // color: theme.colors.text
    flex: 1,
  },
  categoryTitleComplete: {
    textDecorationLine: 'line-through',
    // color: theme.colors.textSecondary
  },
  categoryBadge: {
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
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
    // color: theme.colors.textSecondary
  },
  categoryBadgeTextComplete: {
    color: '#059669',
  },
  
  // Items List
  itemsList: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderTopWidth: 2,
    // borderTopColor: theme.colors.border
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    // borderBottomColor: theme.colors.border
  },
  itemRowChecked: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    // borderColor: theme.colors.border
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
    // color: theme.colors.text
    marginBottom: 2,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    // color: theme.colors.textSecondary
  },
  itemQuantity: {
    fontSize: 13,
    // color: theme.colors.textSecondary
  },
  itemQuantityChecked: {
    // Uses opacity from itemRowChecked instead of hardcoded color
  },
  itemBrand: {
    fontSize: 12,
    // color and backgroundColor applied inline with theme
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  
  // Instacart Section
  instacartSection: {
    marginHorizontal: 16,
    marginTop: 24,
    // backgroundColor: theme.colors.card
    borderRadius: 16,
    borderWidth: 2,
    // borderColor: theme.colors.border
    padding: 20,
  },
  instacartHeader: {
    marginBottom: 16,
  },
  instacartTitle: {
    fontSize: 18,
    fontWeight: '700',
    // color: theme.colors.text
    marginBottom: 4,
  },
  instacartSubtitle: {
    fontSize: 14,
    // color: theme.colors.textSecondary
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
    // color: theme.colors.textSecondary
    marginBottom: 12,
    marginLeft: 4,
  },
  storeLogos: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 16,
  },
  storeLogo: {
    // backgroundColor: theme.colors.card
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    // borderColor: theme.colors.border
  },
  storeLogoText: {
    fontSize: 13,
    // color: theme.colors.text
    fontWeight: '500',
  },
  
  bottomPadding: {
    height: 40,
  },
  
  // Manual Item Entry Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  modalForm: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityInput: {
    flex: 2,
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  unitInput: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  categoryPicker: {
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  categoryChipSelected: {
    backgroundColor: '#4cbb17',
    borderColor: '#4cbb17',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#4cbb17',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  
  // Product Search Modal Additions
  modalScrollContent: {
    flexGrow: 1,
  },
  selectedProductInfo: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  selectedProductHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedProductBrand: {
    fontSize: 13,
    marginTop: 2,
  },
  clearProductButton: {
    padding: 4,
    marginLeft: 8,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  nutritionLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  manualEntryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  manualEntryText: {
    fontSize: 13,
    flex: 1,
  },
});
