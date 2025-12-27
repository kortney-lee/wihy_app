import React, { useState } from 'react';
import { Plus, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Meal, PrepBatch, Ingredient, MealTag } from '../../types/meals';

interface MealProgramBuilderProps {
  meals: Meal[];
  prepBatches: PrepBatch[];
  onMealsChange: (meals: Meal[]) => void;
  onPrepBatchesChange: (prepBatches: PrepBatch[]) => void;
}

export const MealProgramBuilder: React.FC<MealProgramBuilderProps> = ({
  meals,
  prepBatches,
  onMealsChange,
  onPrepBatchesChange
}) => {
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const mealTags: MealTag[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const unitOptions = ['cup', 'tsp', 'tbsp', 'oz', 'lb', 'g', 'kg', 'piece', 'clove', 'slice'];

  // Meal functions
  const addMeal = () => {
    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      name: 'New Meal',
      servings: 2,
      tags: [],
      ingredients: [createEmptyIngredient()],
      notes: ''
    };
    onMealsChange([...meals, newMeal]);
    setExpandedMeal(newMeal.id);
  };

  const updateMeal = (mealId: string, updates: Partial<Meal>) => {
    const updatedMeals = meals.map(meal =>
      meal.id === mealId ? { ...meal, ...updates } : meal
    );
    onMealsChange(updatedMeals);
  };

  const deleteMeal = (mealId: string) => {
    onMealsChange(meals.filter(meal => meal.id !== mealId));
  };

  const duplicateMeal = (meal: Meal) => {
    const duplicated: Meal = {
      ...meal,
      id: `meal-${Date.now()}`,
      name: `${meal.name} (Copy)`
    };
    onMealsChange([...meals, duplicated]);
  };

  // Prep batch functions
  const addPrepBatch = () => {
    const newBatch: PrepBatch = {
      id: `batch-${Date.now()}`,
      name: 'New Prep Batch',
      servings: 4,
      ingredients: [createEmptyIngredient()],
      notes: '',
      usedBy: []
    };
    onPrepBatchesChange([...prepBatches, newBatch]);
    setExpandedBatch(newBatch.id);
  };

  const updatePrepBatch = (batchId: string, updates: Partial<PrepBatch>) => {
    const updatedBatches = prepBatches.map(batch =>
      batch.id === batchId ? { ...batch, ...updates } : batch
    );
    onPrepBatchesChange(updatedBatches);
  };

  const deletePrepBatch = (batchId: string) => {
    onPrepBatchesChange(prepBatches.filter(batch => batch.id !== batchId));
  };

  // Ingredient functions
  const createEmptyIngredient = (): Ingredient => ({
    id: `ingredient-${Date.now()}`,
    name: '',
    quantity: 0,
    unit: 'cup',
    optional: false,
    notes: ''
  });

  const addIngredient = (mealId?: string, batchId?: string) => {
    const newIngredient = createEmptyIngredient();
    
    if (mealId) {
      const meal = meals.find(m => m.id === mealId);
      if (meal) {
        updateMeal(mealId, {
          ingredients: [...meal.ingredients, newIngredient]
        });
      }
    } else if (batchId) {
      const batch = prepBatches.find(b => b.id === batchId);
      if (batch) {
        updatePrepBatch(batchId, {
          ingredients: [...batch.ingredients, newIngredient]
        });
      }
    }
  };

  const updateIngredient = (ingredientId: string, updates: Partial<Ingredient>, mealId?: string, batchId?: string) => {
    if (mealId) {
      const meal = meals.find(m => m.id === mealId);
      if (meal) {
        const updatedIngredients = meal.ingredients.map(ing =>
          ing.id === ingredientId ? { ...ing, ...updates } : ing
        );
        updateMeal(mealId, { ingredients: updatedIngredients });
      }
    } else if (batchId) {
      const batch = prepBatches.find(b => b.id === batchId);
      if (batch) {
        const updatedIngredients = batch.ingredients.map(ing =>
          ing.id === ingredientId ? { ...ing, ...updates } : ing
        );
        updatePrepBatch(batchId, { ingredients: updatedIngredients });
      }
    }
  };

  const removeIngredient = (ingredientId: string, mealId?: string, batchId?: string) => {
    if (mealId) {
      const meal = meals.find(m => m.id === mealId);
      if (meal) {
        updateMeal(mealId, {
          ingredients: meal.ingredients.filter(ing => ing.id !== ingredientId)
        });
      }
    } else if (batchId) {
      const batch = prepBatches.find(b => b.id === batchId);
      if (batch) {
        updatePrepBatch(batchId, {
          ingredients: batch.ingredients.filter(ing => ing.id !== ingredientId)
        });
      }
    }
  };

  const parseSmartInput = (input: string) => {
    // Smart parsing: "chicken breast 2 lb" → name: "chicken breast", quantity: 2, unit: "lb"
    const match = input.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s+(\w+)$/);
    if (match) {
      return {
        name: match[1].trim(),
        quantity: parseFloat(match[2]),
        unit: match[3]
      };
    }
    return { name: input, quantity: 0, unit: 'cup' };
  };

  return (
    <div className="space-y-6">
      {/* Section A: Meals */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Meals</h2>
          <button 
            onClick={addMeal} 
            className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} />
            Add Meal
          </button>
        </div>

        <div className="space-y-3">
          {meals.map(meal => (
            <div key={meal.id} className="bg-gray-50 border border-gray-200 rounded-lg">
              <div 
                className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
              >
                <input
                  type="text"
                  value={meal.name}
                  onChange={(e) => updateMeal(meal.id, { name: e.target.value })}
                  className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-gray-800 mr-4"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{meal.servings} servings</span>
                  <span className="text-gray-400">
                    {expandedMeal === meal.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {expandedMeal === meal.id && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Servings:</label>
                      <input
                        type="number"
                        value={meal.servings}
                        onChange={(e) => updateMeal(meal.id, { servings: parseInt(e.target.value) || 1 })}
                        min="1"
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Tags:</label>
                      <div className="flex flex-wrap gap-1">
                        {mealTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              const newTags = meal.tags.includes(tag)
                                ? meal.tags.filter(t => t !== tag)
                                : [...meal.tags, tag];
                              updateMeal(meal.id, { tags: newTags });
                            }}
                            className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                              meal.tags.includes(tag)
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-orange-500'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Prep batch selector */}
                  {prepBatches.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Uses prep batch:</label>
                      <select
                        value={meal.prepBatchUsage?.batchId || ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            const batch = prepBatches.find(b => b.id === e.target.value);
                            updateMeal(meal.id, {
                              prepBatchUsage: {
                                batchId: e.target.value,
                                batchName: batch?.name || '',
                                servingsUsed: 1
                              }
                            });
                          } else {
                            updateMeal(meal.id, { prepBatchUsage: undefined });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">None</option>
                        {prepBatches.map(batch => (
                          <option key={batch.id} value={batch.id}>
                            {batch.name} ({batch.servings} servings available)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Ingredients */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Ingredients:</label>
                      <button onClick={() => addIngredient(meal.id)} className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs transition-colors">
                        <Plus size={14} />
                        Add Ingredient
                      </button>
                    </div>

                    {meal.ingredients.map(ingredient => (
                      <div key={ingredient.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <input
                          type="text"
                          placeholder="chicken breast 2 lb"
                          value={ingredient.name}
                          onChange={(e) => {
                            const parsed = parseSmartInput(e.target.value);
                            updateIngredient(ingredient.id, parsed, meal.id);
                          }}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        />
                        <input
                          type="number"
                          value={ingredient.quantity}
                          onChange={(e) => updateIngredient(ingredient.id, { quantity: parseFloat(e.target.value) || 0 }, meal.id)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          step="0.1"
                        />
                        <select
                          value={ingredient.unit}
                          onChange={(e) => updateIngredient(ingredient.id, { unit: e.target.value }, meal.id)}
                          className="w-16 px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        >
                          {unitOptions.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={ingredient.optional}
                            onChange={(e) => updateIngredient(ingredient.id, { optional: e.target.checked }, meal.id)}
                            className="w-3 h-3"
                          />
                          Optional
                        </label>
                        <button
                          onClick={() => removeIngredient(ingredient.id, meal.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Notes:</label>
                    <textarea
                      value={meal.notes || ''}
                      onChange={(e) => updateMeal(meal.id, { notes: e.target.value })}
                      placeholder="Special instructions, brand preferences, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button onClick={() => duplicateMeal(meal)} className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs transition-colors">
                      <Copy size={14} />
                      Duplicate
                    </button>
                    <button onClick={() => deleteMeal(meal.id)} className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-xs transition-colors">
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section B: Prep Batches */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Prep Batches</h2>
          <button onClick={addPrepBatch} className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
            <Plus size={16} />
            Add Prep Batch
          </button>
        </div>

        <div className="space-y-3">
          {prepBatches.map(batch => (
            <div key={batch.id} className="bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}>
                <input
                  type="text"
                  value={batch.name}
                  onChange={(e) => updatePrepBatch(batch.id, { name: e.target.value })}
                  className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-gray-800 mr-4"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Makes {batch.servings}</span>
                  <span className="text-gray-400">
                    {expandedBatch === batch.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {expandedBatch === batch.id && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Makes (servings):</label>
                    <input
                      type="number"
                      value={batch.servings}
                      onChange={(e) => updatePrepBatch(batch.id, { servings: parseInt(e.target.value) || 1 })}
                      min="1"
                      className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  {/* Ingredients */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Ingredients:</label>
                      <button onClick={() => addIngredient(undefined, batch.id)} className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs transition-colors">
                        <Plus size={14} />
                        Add Ingredient
                      </button>
                    </div>

                    {batch.ingredients.map(ingredient => (
                      <div key={ingredient.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <input
                          type="text"
                          placeholder="chicken breast 2 lb"
                          value={ingredient.name}
                          onChange={(e) => {
                            const parsed = parseSmartInput(e.target.value);
                            updateIngredient(ingredient.id, parsed, undefined, batch.id);
                          }}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        />
                        <input
                          type="number"
                          value={ingredient.quantity}
                          onChange={(e) => updateIngredient(ingredient.id, { quantity: parseFloat(e.target.value) || 0 }, undefined, batch.id)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          step="0.1"
                        />
                        <select
                          value={ingredient.unit}
                          onChange={(e) => updateIngredient(ingredient.id, { unit: e.target.value }, undefined, batch.id)}
                          className="w-16 px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        >
                          {unitOptions.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeIngredient(ingredient.id, undefined, batch.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Used by */}
                  {batch.usedBy.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Used by:</label>
                      <div className="flex flex-wrap gap-1">
                        {batch.usedBy.map(mealId => {
                          const meal = meals.find(m => m.id === mealId);
                          return meal ? <span key={mealId} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">{meal.name}</span> : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Notes:</label>
                    <textarea
                      value={batch.notes || ''}
                      onChange={(e) => updatePrepBatch(batch.id, { notes: e.target.value })}
                      placeholder="Prep instructions, storage notes, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button onClick={() => deletePrepBatch(batch.id)} className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-xs transition-colors">
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};