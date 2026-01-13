import React, { useState } from 'react';
import { Bot, FileText, Camera, Search, Plus, Trash2, Edit2, ShoppingCart, Calendar, AlertCircle, Check } from 'lucide-react';
import { MealType, NutritionInfo, MealIngredient, MealTemplate } from '../../types/meals';

interface CreateSingleMealProps {
  onSaveMeal: (meal: NewMealData) => void;
  onAddToCalendar: (meal: NewMealData, date: string) => void;
  onGenerateShoppingList: (ingredients: MealIngredient[]) => void;
  onUseTemplate: () => void;
  onScanRecipe: () => void;
  onAIGenerate: (prompt: string) => void;
  onSearchDatabase: (query: string) => void;
  templates?: MealTemplate[];
  isLoading?: boolean;
}

export interface NewMealData {
  name: string;
  mealType: MealType;
  servings: number;
  prepTime: number;
  cookTime: number;
  ingredients: MealIngredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  tags: string[];
  notes?: string;
}

const defaultNutrition: NutritionInfo = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0
};

const availableTags = [
  'High Protein', 'Low Carb', 'Meal Prep', 'Quick (<15 min)',
  'Vegetarian', 'Gluten-Free', 'Dairy-Free', 'Kid-Friendly',
  'Budget-Friendly', 'One Pot', 'Batch Cooking'
];

const unitOptions = ['oz', 'g', 'cup', 'tbsp', 'tsp', 'piece', 'lb', 'kg', 'ml', 'clove', 'slice'];

export const CreateSingleMeal: React.FC<CreateSingleMealProps> = ({
  onSaveMeal,
  onAddToCalendar,
  onGenerateShoppingList,
  onUseTemplate,
  onScanRecipe,
  onAIGenerate,
  onSearchDatabase,
  templates = [],
  isLoading = false
}) => {
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [servings, setServings] = useState(1);
  const [prepTime, setPrepTime] = useState(10);
  const [cookTime, setCookTime] = useState(15);
  const [ingredients, setIngredients] = useState<MealIngredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [nutrition, setNutrition] = useState<NutritionInfo>(defaultNutrition);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add ingredient
  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: '', amount: 1, unit: 'cup' }
    ]);
  };

  // Update ingredient
  const updateIngredient = (index: number, updates: Partial<MealIngredient>) => {
    setIngredients(prev =>
      prev.map((ing, i) => i === index ? { ...ing, ...updates } : ing)
    );
  };

  // Remove ingredient
  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  // Add instruction step
  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  // Update instruction
  const updateInstruction = (index: number, value: string) => {
    setInstructions(prev =>
      prev.map((inst, i) => i === index ? value : inst)
    );
  };

  // Remove instruction
  const removeInstruction = (index: number) => {
    setInstructions(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle tag
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Calculate if meal meets protein goal
  const meetsProteinGoal = nutrition.protein >= 40;
  const lowFatWarning = nutrition.fat < 15 && nutrition.calories > 300;

  // Build meal data
  const getMealData = (): NewMealData => ({
    name: mealName,
    mealType,
    servings,
    prepTime,
    cookTime,
    ingredients,
    instructions: instructions.filter(i => i.trim()),
    nutrition,
    tags: selectedTags,
    notes
  });

  const handleSave = () => {
    if (!mealName.trim() || ingredients.length === 0) {
      alert('Please enter a meal name and at least one ingredient');
      return;
    }
    onSaveMeal(getMealData());
  };

  return (
    <div className="bg-[#f0f7ff] min-h-screen p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">➕ Create New Meal</h1>
        </div>

        {/* Quick Start Options */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">Quick Start Options</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setShowAIModal(true)}
              className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 transition-colors"
            >
              <Bot className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">AI Generate</span>
            </button>
            <button
              onClick={onUseTemplate}
              className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <FileText className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Use Template</span>
            </button>
            <button
              onClick={onScanRecipe}
              className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors"
            >
              <Camera className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-green-700">Scan Recipe</span>
            </button>
            <button
              onClick={() => onSearchDatabase(searchQuery)}
              className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors"
            >
              <Search className="w-6 h-6 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Search Database</span>
            </button>
          </div>
        </div>

        {/* AI Generate Modal */}
        {showAIModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">🤖 AI Meal Generator</h3>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the meal you want, e.g., 'High protein chicken bowl with rice and vegetables, around 500 calories'"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none mb-4"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAIModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onAIGenerate(aiPrompt);
                    setShowAIModal(false);
                  }}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
          <div className="space-y-4">
            {/* Meal Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Name</label>
              <input
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="e.g., Grilled Chicken Bowl"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Meal Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
              <div className="flex gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`flex-1 py-2 rounded-xl font-medium capitalize transition-colors ${
                      mealType === type
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'breakfast' && '🍳 '}
                    {type === 'lunch' && '🥗 '}
                    {type === 'dinner' && '🍽️ '}
                    {type === 'snack' && '🍎 '}
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Servings and Times */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
                <input
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prep (min)</label>
                <input
                  type="number"
                  min="0"
                  value={prepTime}
                  onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cook (min)</label>
                <input
                  type="number"
                  min="0"
                  value={cookTime}
                  onChange={(e) => setCookTime(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Ingredients</h2>
            <button
              onClick={addIngredient}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {ingredients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">🥗</div>
              <p>No ingredients yet. Click "Add" to start.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ingredients.map((ingredient, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <span className="text-lg">🥬</span>
                  <input
                    type="text"
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(idx, { name: e.target.value })}
                    placeholder="Ingredient name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={ingredient.amount}
                    onChange={(e) => updateIngredient(idx, { amount: parseFloat(e.target.value) || 0 })}
                    className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center"
                  />
                  <select
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(idx, { unit: e.target.value })}
                    className="px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {unitOptions.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nutrition Summary */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nutrition Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Calories', key: 'calories', suffix: '' },
              { label: 'Protein', key: 'protein', suffix: 'g' },
              { label: 'Carbs', key: 'carbs', suffix: 'g' },
              { label: 'Fat', key: 'fat', suffix: 'g' },
              { label: 'Fiber', key: 'fiber', suffix: 'g' }
            ].map(({ label, key, suffix }) => (
              <div key={key} className="bg-gray-50 rounded-xl p-3 text-center">
                <input
                  type="number"
                  min="0"
                  value={(nutrition as any)[key]}
                  onChange={(e) => setNutrition(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                  className="w-full text-2xl font-bold text-center bg-transparent border-none focus:outline-none"
                />
                <div className="text-xs text-gray-500">{label}{suffix && ` (${suffix})`}</div>
              </div>
            ))}
          </div>

          {/* Goal Indicators */}
          <div className="mt-4 space-y-2">
            {meetsProteinGoal && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Check className="w-4 h-4" />
                Meets protein goal (40g+)
              </div>
            )}
            {lowFatWarning && (
              <div className="flex items-center gap-2 text-yellow-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                Low in healthy fats
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedTags.includes(tag) && '✓ '}{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Cooking Instructions */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Cooking Instructions</h2>
            <button
              onClick={addInstruction}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>

          <div className="space-y-3">
            {instructions.map((instruction, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {idx + 1}
                </div>
                <textarea
                  value={instruction}
                  onChange={(e) => updateInstruction(idx, e.target.value)}
                  placeholder={`Step ${idx + 1}...`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl resize-none"
                  rows={2}
                />
                <button
                  onClick={() => removeInstruction(idx)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSave}
              disabled={!mealName.trim() || ingredients.length === 0}
              className="py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Meal
            </button>
            <button
              onClick={() => onAddToCalendar(getMealData(), new Date().toISOString().split('T')[0])}
              disabled={!mealName.trim()}
              className="py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Add to Calendar
            </button>
          </div>

          {ingredients.length > 0 && (
            <button
              onClick={() => onGenerateShoppingList(ingredients)}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Generate Shopping List
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
