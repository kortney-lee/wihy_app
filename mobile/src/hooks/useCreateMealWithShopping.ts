import { useState, useCallback, useMemo } from 'react';
import { Alert, Linking } from 'react-native';
import { productSearchService, FoodProduct } from '../services/productSearchService';
import { mealService } from '../services/mealService';
import { mealCalendarService } from '../services/mealCalendarService';
import { createShoppingList, ShoppingListItem } from '../services/instacartService';

// Enhanced Ingredient with nutrition data
export interface EnhancedIngredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
  // Nutrition from product search
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  // Brand info for Instacart
  brand?: string;
  productId?: string;
}

export interface CalculatedNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function useCreateMealWithShopping(userId: string) {
  // Ingredient state
  const [ingredients, setIngredients] = useState<EnhancedIngredient[]>([]);
  
  // Status
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // AUTO-CALCULATED NUTRITION
  // ============================================================
  
  const calculatedNutrition = useMemo((): CalculatedNutrition => {
    return ingredients.reduce(
      (totals, ing) => {
        const amount = parseFloat(ing.amount) || 1;
        return {
          calories: totals.calories + ((ing.calories || 0) * amount),
          protein: totals.protein + ((ing.protein || 0) * amount),
          carbs: totals.carbs + ((ing.carbs || 0) * amount),
          fat: totals.fat + ((ing.fat || 0) * amount),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [ingredients]);

  const hasCalculatedNutrition = useMemo(() => {
    return ingredients.some(i => i.calories !== undefined);
  }, [ingredients]);

  // ============================================================
  // INGREDIENT MANAGEMENT
  // ============================================================

  const addIngredientFromProduct = useCallback(
    (product: FoodProduct, amount: string = '1', unit: string = '') => {
      const newIngredient: EnhancedIngredient = {
        id: `ing_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: product.name,
        amount: amount,
        unit: unit || product.servingSize || 'serving',
        // Nutrition from product
        calories: product.calories,
        protein: product.protein,
        carbs: product.carbs,
        fat: product.fat,
        // Brand for Instacart
        brand: product.brand,
        productId: product.id,
      };
      
      setIngredients((prev) => [...prev, newIngredient]);
    },
    []
  );

  const addIngredientManually = useCallback(
    (name: string, amount: string, unit: string) => {
      const newIngredient: EnhancedIngredient = {
        id: `ing_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name,
        amount,
        unit,
      };
      setIngredients((prev) => [...prev, newIngredient]);
    },
    []
  );

  const updateIngredient = useCallback(
    (id: string, field: keyof EnhancedIngredient, value: string) => {
      setIngredients((prev) =>
        prev.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
      );
    },
    []
  );

  const removeIngredient = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  }, []);

  const setIngredientsFromArray = useCallback((newIngredients: EnhancedIngredient[]) => {
    setIngredients(newIngredients);
  }, []);

  // ============================================================
  // SAVE MEAL
  // ============================================================

  const saveMeal = useCallback(
    async (
      mealName: string,
      mealType: string,
      servingSize: string,
      calories: string,
      protein: string,
      carbs: string,
      fat: string,
      tags: string[],
      notes: string
    ): Promise<string | null> => {
      if (!mealName.trim()) {
        setError('Meal name is required');
        return null;
      }

      setSaving(true);
      setError(null);

      try {
        const mealIngredients = ingredients
          .filter((ing) => ing.name.trim())
          .map((ing) => ({
            name: ing.name,
            amount: parseFloat(ing.amount) || 0,
            unit: ing.unit,
            // Include nutrition if available
            ...(ing.calories && { calories: ing.calories }),
            ...(ing.protein && { protein: ing.protein }),
            ...(ing.carbs && { carbs: ing.carbs }),
            ...(ing.fat && { fat: ing.fat }),
            ...(ing.brand && { brand: ing.brand }),
          }));

        // Use manual nutrition if provided, otherwise use calculated
        const useManualNutrition = calories || protein || carbs || fat;
        const nutrition = useManualNutrition
          ? {
              calories: parseInt(calories) || 0,
              protein: parseFloat(protein) || 0,
              carbs: parseFloat(carbs) || 0,
              fat: parseFloat(fat) || 0,
            }
          : hasCalculatedNutrition
          ? {
              calories: Math.round(calculatedNutrition.calories),
              protein: parseFloat(calculatedNutrition.protein.toFixed(1)),
              carbs: parseFloat(calculatedNutrition.carbs.toFixed(1)),
              fat: parseFloat(calculatedNutrition.fat.toFixed(1)),
            }
          : undefined;

        const mealData = {
          name: mealName.trim(),
          meal_type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
          ingredients: mealIngredients,
          nutrition,
          tags,
          notes: notes.trim() || undefined,
          serving_size: parseFloat(servingSize) || 1,
        };

        const result = await mealService.createMeal(userId, mealData);
        
        // Extract meal ID from response
        const mealId = result?.meal_id || result?.id || null;
        return mealId;
      } catch (err: any) {
        console.error('Error saving meal:', err);
        setError(err.message);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [userId, ingredients, calculatedNutrition, hasCalculatedNutrition]
  );

  // ============================================================
  // SHOPPING LIST & INSTACART
  // ============================================================

  const createShoppingListFromMeal = useCallback(
    async (mealName: string): Promise<string | null> => {
      if (ingredients.length === 0) {
        Alert.alert('No Ingredients', 'Add ingredients to create a shopping list');
        return null;
      }

      setSaving(true);
      setError(null);

      try {
        const shoppingItems: ShoppingListItem[] = ingredients
          .filter((ing) => ing.name.trim())
          .map((ing) => ({
            name: ing.name,
            quantity: parseFloat(ing.amount) || 1,
            unit: ing.unit,
            filters: ing.brand
              ? {
                  brand_filters: [ing.brand],
                }
              : undefined,
          }));

        const result = await createShoppingList(
          shoppingItems,
          `Shopping for: ${mealName}`
        );

        return result?.data?.productsLinkUrl || null;
      } catch (err: any) {
        console.error('Error creating shopping list:', err);
        setError(err.message);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [ingredients]
  );

  const saveAndShopOnInstacart = useCallback(
    async (
      mealName: string,
      mealType: string,
      servingSize: string,
      calories: string,
      protein: string,
      carbs: string,
      fat: string,
      tags: string[],
      notes: string
    ): Promise<{ mealId: string; instacartUrl: string } | null> => {
      // First save the meal
      const mealId = await saveMeal(
        mealName,
        mealType,
        servingSize,
        calories,
        protein,
        carbs,
        fat,
        tags,
        notes
      );

      if (!mealId) return null;

      // Then create Instacart shopping list
      const instacartUrl = await createShoppingListFromMeal(mealName);

      if (!instacartUrl) return null;

      return { mealId, instacartUrl };
    },
    [saveMeal, createShoppingListFromMeal]
  );

  // ============================================================
  // CALENDAR INTEGRATION
  // ============================================================

  const scheduleToCalendar = useCallback(
    async (
      mealId: string,
      mealName: string,
      date: string,
      mealType: string,
      nutrition: CalculatedNutrition,
      servings: number = 1
    ): Promise<boolean> => {
      try {
        await mealCalendarService.scheduleMeal(userId, {
          mealId,
          scheduledDate: date,
          mealSlot: mealType as any,
          servings,
        });
        return true;
      } catch (err: any) {
        console.error('Error scheduling meal:', err);
        setError(err.message);
        return false;
      }
    },
    [userId]
  );

  // ============================================================
  // RESET
  // ============================================================

  const reset = useCallback(() => {
    setIngredients([]);
    setError(null);
  }, []);

  // ============================================================
  // RETURN VALUES
  // ============================================================

  return {
    // Ingredients
    ingredients,
    addIngredientFromProduct,
    addIngredientManually,
    updateIngredient,
    removeIngredient,
    setIngredientsFromArray,

    // Nutrition
    calculatedNutrition,
    hasCalculatedNutrition,

    // Actions
    saveMeal,
    createShoppingListFromMeal,
    saveAndShopOnInstacart,
    scheduleToCalendar,

    // Status
    saving,
    error,
    setError,
    reset,
  };
}
