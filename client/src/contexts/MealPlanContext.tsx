import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MealPlan, Meal, PrepBatch, ShoppingListItem, ShoppingCategory } from '../types/meals';

// ============================================================
// MEAL PLAN CONTEXT - Nutrition & Meal Planning
// ============================================================

export interface NutritionPlan {
  id: string;
  userId: string; // client or coach
  clientId?: string; // if coach is creating for client
  name: string;
  type: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'performance';
  status: 'draft' | 'active' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  goals: string[];
  restrictions: string[];
  mealPlan: MealPlan;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstacartOrder {
  id: string;
  mealPlanId: string;
  userId: string;
  items: ShoppingListItem[];
  instacartLink?: string;
  status: 'draft' | 'submitted' | 'delivered' | 'cancelled';
  totalEstimate?: number;
  createdAt: Date;
}

interface MealPlanContextType {
  // Current meal plan state
  draftMealProgram: MealPlan | null;
  shoppingList: ShoppingListItem[];
  instacartLink: string | null;
  
  // Nutrition plans by user
  activeNutritionPlanByUserId: Record<string, NutritionPlan>;
  nutritionPlans: NutritionPlan[];
  
  // Instacart orders
  instacartOrders: InstacartOrder[];
  
  // Actions for current meal plan
  setDraftMealProgram: (mealPlan: MealPlan) => void;
  updateMeals: (meals: Meal[]) => void;
  updatePrepBatches: (prepBatches: PrepBatch[]) => void;
  generateShoppingList: () => void;
  generateInstacartLink: () => Promise<string>;
  
  // Actions for nutrition plans
  createNutritionPlan: (plan: Omit<NutritionPlan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNutritionPlan: (planId: string, updates: Partial<NutritionPlan>) => void;
  setActivePlan: (userId: string, planId: string) => void;
  
  // Actions for clients (coach view)
  getClientMealPlan: (clientId: string) => MealPlan | null;
  createClientMealPlan: (clientId: string, mealPlan: MealPlan) => void;
  
  // Shopping/Instacart
  createInstacartOrder: (mealPlanId: string, userId: string) => Promise<InstacartOrder>;
}

const MealPlanContext = createContext<MealPlanContextType | undefined>(undefined);

// Mock nutrition plans
const mockNutritionPlans: NutritionPlan[] = [
  {
    id: 'plan1',
    userId: 'client1',
    name: 'Weight Loss Program',
    type: 'weight_loss',
    status: 'active',
    startDate: new Date('2024-12-01'),
    goals: ['High protein', 'Low sodium', 'Mediterranean'],
    restrictions: ['Gluten-free'],
    mealPlan: {
      id: 'meal-plan-1',
      name: 'Sarah\'s Weight Loss Plan',
      planType: 'This Week',
      goals: ['High protein', 'Low sodium', 'Mediterranean', 'Gluten-free'],
      meals: [
        {
          id: 'meal1',
          name: 'Grilled Chicken Salad',
          servings: 2,
          tags: ['Lunch'],
          ingredients: [
            { id: 'ing1', name: 'chicken breast', quantity: 6, unit: 'oz', optional: false },
            { id: 'ing2', name: 'mixed greens', quantity: 4, unit: 'cups', optional: false },
            { id: 'ing3', name: 'cherry tomatoes', quantity: 1, unit: 'cup', optional: false }
          ]
        },
        {
          id: 'meal2',
          name: 'Mediterranean Bowl',
          servings: 1,
          tags: ['Dinner'],
          ingredients: [
            { id: 'ing4', name: 'quinoa', quantity: 0.5, unit: 'cup', optional: false },
            { id: 'ing5', name: 'cucumber', quantity: 1, unit: 'medium', optional: false },
            { id: 'ing6', name: 'feta cheese', quantity: 2, unit: 'oz', optional: false }
          ]
        }
      ],
      prepBatches: [
        {
          id: 'prep1',
          name: 'Weekly Protein Prep',
          servings: 4,
          ingredients: [
            { id: 'ing7', name: 'chicken thighs', quantity: 2, unit: 'lbs', optional: false }
          ],
          usedBy: []
        }
      ]
    },
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-24')
  },
  {
    id: 'plan2',
    userId: 'client2',
    name: 'Muscle Building Program',
    type: 'muscle_gain',
    status: 'active',
    startDate: new Date('2024-11-15'),
    goals: ['High protein', 'Muscle gain'],
    restrictions: [],
    mealPlan: {
      id: 'meal-plan-2',
      name: 'Mike\'s Muscle Building Plan',
      planType: 'This Week',
      goals: ['High protein'],
      meals: [
        {
          id: 'meal3',
          name: 'Protein Power Bowl',
          servings: 2,
          tags: ['Dinner'],
          ingredients: [
            { id: 'ing8', name: 'ground beef', quantity: 8, unit: 'oz', optional: false },
            { id: 'ing9', name: 'brown rice', quantity: 1, unit: 'cup', optional: false },
            { id: 'ing10', name: 'broccoli', quantity: 2, unit: 'cups', optional: false }
          ]
        }
      ],
      prepBatches: []
    },
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-12-20')
  }
];

export const MealPlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [draftMealProgram, setDraftMealProgram] = useState<MealPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [instacartLink, setInstacartLink] = useState<string | null>(null);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>(mockNutritionPlans);
  const [instacartOrders, setInstacartOrders] = useState<InstacartOrder[]>([]);
  
  // Active plans by user
  const activeNutritionPlanByUserId = nutritionPlans.reduce((acc, plan) => {
    if (plan.status === 'active') {
      acc[plan.userId] = plan;
    }
    return acc;
  }, {} as Record<string, NutritionPlan>);

  const updateMeals = (meals: Meal[]) => {
    if (draftMealProgram) {
      const updated = { ...draftMealProgram, meals };
      setDraftMealProgram(updated);
      generateShoppingListFromMealPlan(updated);
    }
  };

  const updatePrepBatches = (prepBatches: PrepBatch[]) => {
    if (draftMealProgram) {
      const updated = { ...draftMealProgram, prepBatches };
      setDraftMealProgram(updated);
      generateShoppingListFromMealPlan(updated);
    }
  };

  const generateShoppingListFromMealPlan = (mealPlan: MealPlan) => {
    const itemMap = new Map<string, ShoppingListItem>();

    // Helper function to categorize ingredients
    const categorizeIngredient = (name: string): ShoppingCategory => {
      const lowerName = name.toLowerCase();
      
      if (lowerName.match(/(chicken|beef|pork|fish|salmon|tuna|turkey|lamb|shrimp|tofu|eggs)/)) {
        return 'Protein';
      }
      
      if (lowerName.match(/(lettuce|spinach|kale|tomato|cucumber|carrot|pepper|onion|garlic|broccoli|cauliflower|zucchini|mushroom|avocado|apple|banana|berry|orange|lemon)/)) {
        return 'Produce';
      }
      
      if (lowerName.match(/(milk|cheese|yogurt|butter|cream)/)) {
        return 'Dairy';
      }
      
      if (lowerName.match(/(frozen|ice cream)/)) {
        return 'Frozen';
      }
      
      if (lowerName.match(/(rice|pasta|bread|flour|oil|salt|pepper|spice|sauce|vinegar|can|jar|quinoa)/)) {
        return 'Pantry';
      }
      
      return 'Other';
    };

    // Add ingredients from meals
    mealPlan.meals.forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        const key = `${ingredient.name}-${ingredient.unit}`;
        const existing = itemMap.get(key);
        
        if (existing) {
          existing.quantity += ingredient.quantity * meal.servings;
          existing.sources.push(meal.name);
        } else {
          itemMap.set(key, {
            name: ingredient.name,
            quantity: ingredient.quantity * meal.servings,
            unit: ingredient.unit,
            category: categorizeIngredient(ingredient.name),
            sources: [meal.name],
            needsReview: false
          });
        }
      });
    });

    // Add ingredients from prep batches
    mealPlan.prepBatches.forEach(batch => {
      batch.ingredients.forEach(ingredient => {
        const key = `${ingredient.name}-${ingredient.unit}`;
        const existing = itemMap.get(key);
        
        if (existing) {
          existing.quantity += ingredient.quantity;
          existing.sources.push(`Prep: ${batch.name}`);
        } else {
          itemMap.set(key, {
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            category: categorizeIngredient(ingredient.name),
            sources: [`Prep: ${batch.name}`],
            needsReview: false
          });
        }
      });
    });

    setShoppingList(Array.from(itemMap.values()));
  };

  const generateShoppingList = () => {
    if (draftMealProgram) {
      generateShoppingListFromMealPlan(draftMealProgram);
    }
  };

  const generateInstacartLink = async (): Promise<string> => {
    // Mock Instacart link generation
    const mockLink = `https://instacart.com/store/lists/${Date.now()}`;
    setInstacartLink(mockLink);
    return mockLink;
  };

  const createNutritionPlan = (planData: Omit<NutritionPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPlan: NutritionPlan = {
      ...planData,
      id: `plan_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setNutritionPlans(prev => [...prev, newPlan]);
  };

  const updateNutritionPlan = (planId: string, updates: Partial<NutritionPlan>) => {
    setNutritionPlans(prev => 
      prev.map(plan => 
        plan.id === planId 
          ? { ...plan, ...updates, updatedAt: new Date() }
          : plan
      )
    );
  };

  const setActivePlan = (userId: string, planId: string) => {
    // Set plan as active, deactivate others for this user
    setNutritionPlans(prev => 
      prev.map(plan => ({
        ...plan,
        status: plan.userId === userId 
          ? (plan.id === planId ? 'active' : 'paused')
          : plan.status
      }))
    );
  };

  const getClientMealPlan = (clientId: string): MealPlan | null => {
    const plan = activeNutritionPlanByUserId[clientId];
    return plan?.mealPlan || null;
  };

  const createClientMealPlan = (clientId: string, mealPlan: MealPlan) => {
    createNutritionPlan({
      userId: clientId,
      clientId,
      name: mealPlan.name || 'New Nutrition Plan',
      type: 'maintenance',
      status: 'draft',
      startDate: new Date(),
      goals: mealPlan.goals,
      restrictions: [],
      mealPlan
    });
  };

  const createInstacartOrder = async (mealPlanId: string, userId: string): Promise<InstacartOrder> => {
    const order: InstacartOrder = {
      id: `order_${Date.now()}`,
      mealPlanId,
      userId,
      items: shoppingList,
      status: 'draft',
      createdAt: new Date()
    };
    
    setInstacartOrders(prev => [...prev, order]);
    return order;
  };

  return (
    <MealPlanContext.Provider value={{
      draftMealProgram,
      shoppingList,
      instacartLink,
      activeNutritionPlanByUserId,
      nutritionPlans,
      instacartOrders,
      setDraftMealProgram,
      updateMeals,
      updatePrepBatches,
      generateShoppingList,
      generateInstacartLink,
      createNutritionPlan,
      updateNutritionPlan,
      setActivePlan,
      getClientMealPlan,
      createClientMealPlan,
      createInstacartOrder
    }}>
      {children}
    </MealPlanContext.Provider>
  );
};

export const useMealPlans = () => {
  const context = useContext(MealPlanContext);
  if (context === undefined) {
    throw new Error('useMealPlans must be used within a MealPlanProvider');
  }
  return context;
};