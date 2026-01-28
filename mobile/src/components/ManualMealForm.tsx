import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SvgIcon from './shared/SvgIcon';
import { useCreateMealWithShopping } from '../hooks/useCreateMealWithShopping';
import { FoodProduct } from '../services/productSearchService';

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
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
}) => {
  // Form state
  const [mealName, setMealName] = useState('');
  const [servingSize, setServingSize] = useState('1');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [saving, setSaving] = useState(false);
  const [showQuickStartTooltip, setShowQuickStartTooltip] = useState(false);

  // Shopping hook
  const mealShoppingHook = useCreateMealWithShopping(userId);

  // Ingredient management
  const addIngredient = () => {
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: '',
      amount: '',
      unit: 'cups',
    };
    setIngredients([...ingredients, newIngredient]);
    mealShoppingHook.addIngredientManually('', '', 'cups');
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
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setMealType('lunch');
    setSelectedTags([]);
    setNotes('');
    setIngredients([]);
    mealShoppingHook.reset();
  };

  return (
    <View style={styles.formContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          style={styles.formHeaderGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity 
            style={styles.headerBackButtonWhite}
            onPress={onBack}
          >
            <SvgIcon name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.formHeaderTitleWhite}>Create Meal</Text>
          <Text style={styles.formHeaderSubtitle}>Search 4M+ products or add ingredients manually</Text>
        </LinearGradient>

        {/* Quick Start Tooltip Button */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => setShowQuickStartTooltip(!showQuickStartTooltip)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: '#eff6ff',
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#bfdbfe',
            }}
          >
            <SvgIcon name="help-circle" size={18} color="#3b82f6" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#3b82f6' }}>
              Quick Start Guide
            </Text>
            <SvgIcon 
              name={showQuickStartTooltip ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#3b82f6" 
            />
          </TouchableOpacity>

          {/* Expandable Quick Start Content */}
          {showQuickStartTooltip && (
            <View style={{ 
              backgroundColor: '#eff6ff', 
              borderRadius: 12, 
              padding: 16, 
              marginTop: 8,
              borderLeftWidth: 4, 
              borderLeftColor: '#3b82f6',
            }}>
              <Text style={{ fontSize: 13, color: '#1e40af', lineHeight: 20 }}>
                1. Add ingredients using <Text style={{ fontWeight: '600' }}>Search</Text> for nutrition data or <Text style={{ fontWeight: '600' }}>Manual</Text> entry{'\n'}
                2. Nutrition auto-calculates from products{'\n'}
                3. Choose <Text style={{ fontWeight: '600' }}>Save & Shop</Text> to create Instacart list or <Text style={{ fontWeight: '600' }}>Save Only</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.card}>
            <Text style={styles.label}>Meal Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Grilled Chicken Salad"
              value={mealName}
              onChangeText={setMealName}
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Serving Size</Text>
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
          </View>
        </View>

        {/* Nutrition Facts */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Nutrition Facts (per serving)</Text>
            {mealShoppingHook.hasCalculatedNutrition && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <SvgIcon name="checkmark-circle" size={16} color="#10b981" />
                <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '600' }}>Auto-calculated</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Values auto-calculate from products or enter manually</Text>
          
          <View style={styles.card}>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.label}>Calories</Text>
                <TextInput
                  style={styles.input}
                  placeholder={mealShoppingHook.hasCalculatedNutrition ? Math.round(mealShoppingHook.calculatedNutrition.calories).toString() : "0"}
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                  placeholderTextColor={mealShoppingHook.hasCalculatedNutrition ? "#10b981" : "#9ca3af"}
                />
              </View>

              <View style={styles.nutritionItem}>
                <Text style={styles.label}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={mealShoppingHook.hasCalculatedNutrition ? mealShoppingHook.calculatedNutrition.protein.toFixed(1) : "0"}
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="numeric"
                  placeholderTextColor={mealShoppingHook.hasCalculatedNutrition ? "#10b981" : "#9ca3af"}
                />
              </View>

              <View style={styles.nutritionItem}>
                <Text style={styles.label}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={mealShoppingHook.hasCalculatedNutrition ? mealShoppingHook.calculatedNutrition.carbs.toFixed(1) : "0"}
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="numeric"
                  placeholderTextColor={mealShoppingHook.hasCalculatedNutrition ? "#10b981" : "#9ca3af"}
                />
              </View>

              <View style={styles.nutritionItem}>
                <Text style={styles.label}>Fat (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={mealShoppingHook.hasCalculatedNutrition ? mealShoppingHook.calculatedNutrition.fat.toFixed(1) : "0"}
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="numeric"
                  placeholderTextColor={mealShoppingHook.hasCalculatedNutrition ? "#10b981" : "#9ca3af"}
                />
              </View>
            </View>

            {(calories || protein || carbs || fat || mealShoppingHook.hasCalculatedNutrition) && (
              <View style={styles.nutritionSummary}>
                <SvgIcon name="information-circle" size={20} color="#3b82f6" />
                <Text style={styles.summaryText}>
                  {mealShoppingHook.hasCalculatedNutrition && !calories && !protein && !carbs && !fat ? (
                    `Auto-calculated: ${Math.round(mealShoppingHook.calculatedNutrition.calories)} cal • ${mealShoppingHook.calculatedNutrition.protein.toFixed(1)}g protein`
                  ) : (
                    `Total Macros: ${protein || mealShoppingHook.calculatedNutrition.protein.toFixed(1)}g protein • ${carbs || mealShoppingHook.calculatedNutrition.carbs.toFixed(1)}g carbs • ${fat || mealShoppingHook.calculatedNutrition.fat.toFixed(1)}g fat`
                  )}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable 
                onPress={onShowProductSearch} 
                style={[styles.addButton, { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }]}
              >
                <SvgIcon name="search" size={18} color="#3b82f6" />
                <Text style={[styles.addButtonText, { color: '#3b82f6' }]}>Search</Text>
              </Pressable>
              <Pressable onPress={addIngredient} style={styles.addButton}>
                <SvgIcon name="add-circle" size={20} color="#3b82f6" />
                <Text style={styles.addButtonText}>Manual</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            {ingredients.length === 0 ? (
              <View style={styles.emptyState}>
                <SvgIcon name="search" size={32} color="#d1d5db" />
                <Text style={styles.emptyText}>Search for products or add manually</Text>
              </View>
            ) : (
              ingredients.map((ingredient) => (
                <View key={ingredient.id} style={styles.ingredientRow}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[styles.input, styles.ingredientName]}
                      placeholder="Ingredient name"
                      value={ingredient.name}
                      onChangeText={(value) => updateIngredient(ingredient.id, 'name', value)}
                      placeholderTextColor="#9ca3af"
                    />
                    {/* Show nutrition info if available from product search */}
                    {mealShoppingHook.ingredients.find(i => i.id === ingredient.id)?.calories && (
                      <Text style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>
                        {Math.round((mealShoppingHook.ingredients.find(i => i.id === ingredient.id)?.calories || 0) * parseFloat(ingredient.amount || '1'))} cal • 
                        {Math.round((mealShoppingHook.ingredients.find(i => i.id === ingredient.id)?.protein || 0) * parseFloat(ingredient.amount || '1'))}g protein
                      </Text>
                    )}
                  </View>
                  <TextInput
                    style={[styles.input, styles.ingredientAmount]}
                    placeholder="0"
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
              ))
            )}
          </View>

          {/* Auto-calculated nutrition badge */}
          {mealShoppingHook.hasCalculatedNutrition && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 8, 
              marginTop: 12, 
              padding: 12, 
              backgroundColor: '#ecfdf5', 
              borderRadius: 8 
            }}>
              <SvgIcon name="checkmark-circle" size={16} color="#10b981" />
              <Text style={{ fontSize: 13, color: '#10b981', flex: 1 }}>
                Nutrition auto-calculated from {mealShoppingHook.ingredients.filter(i => i.calories).length} products
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
                mealName, mealType, servingSize, calories, protein, carbs, fat, selectedTags, notes
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
                  mealName, mealType, servingSize, calories, protein, carbs, fat, selectedTags, notes
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
                  mealName, mealType, servingSize, calories, protein, carbs, fat, selectedTags, notes
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
    backgroundColor: '#f3f4f6',
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
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '45%',
  },
  nutritionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
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
