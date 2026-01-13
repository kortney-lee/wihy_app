import React, { useState } from 'react';
import { Sparkles, Clock, Users, ChefHat, DollarSign, ShoppingBag, Loader2 } from 'lucide-react';
import { DietaryRestriction, MealPlanningPreferences } from '../../types/meals';

interface AIMealPlanGeneratorProps {
  onGenerate: (config: MealPlanConfig) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  familySize?: number;
  preferences?: MealPlanningPreferences;
}

export interface MealPlanConfig {
  description: string;
  durationDays: 7 | 14 | 30;
  mealsPerDay: ('breakfast' | 'lunch' | 'dinner' | 'morning-snack' | 'evening-snack')[];
  mealVariety: 'balanced' | 'family-friendly' | 'maximum-variety';
  preferredStores: string[];
  timePerMeal: 'quick' | 'moderate' | 'no-preference';
  cookingComplexity: 'easy' | 'moderate' | 'advanced';
  specialFocus: string[];
  familySize: number;
  advancedOptions?: {
    preferredStores: string[];
    timePerMeal: 'quick' | 'moderate' | 'no-preference';
    cookingComplexity: 'easy' | 'moderate' | 'advanced';
    specialFocus: string[];
  };
}

const quickTemplates = [
  { icon: '💡', text: '5 easy weeknight dinners' },
  { icon: '💡', text: 'Budget meals with store brands' },
  { icon: '💡', text: 'Kid-friendly lunches for school' },
  { icon: '💡', text: 'Quick breakfast meal prep' },
  { icon: '💡', text: 'High protein muscle building meals' },
  { icon: '💡', text: 'Vegetarian family dinners' }
];

const storeOptions = [
  'Costco', 'Trader Joe\'s', 'Whole Foods', 'Walmart', 'Kroger', 'Aldi', 'Target', 'Generic brands'
];

const specialFocusOptions = [
  { id: 'kid-friendly', label: 'Kid-friendly (no spicy, familiar)' },
  { id: 'high-protein', label: 'High protein' },
  { id: 'low-cost', label: 'Low cost per serving' },
  { id: 'meal-prep', label: 'Meal prep friendly' },
  { id: 'quick-cleanup', label: 'Quick cleanup' },
  { id: 'batch-cooking', label: 'Batch cooking friendly' }
];

export const AIMealPlanGenerator: React.FC<AIMealPlanGeneratorProps> = ({
  onGenerate,
  onBack,
  isLoading = false,
  familySize = 4
}) => {
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState<7 | 14 | 30>(7);
  const [selectedMeals, setSelectedMeals] = useState<string[]>(['breakfast', 'lunch', 'dinner']);
  const [mealVariety, setMealVariety] = useState<'balanced' | 'family-friendly' | 'maximum-variety'>('family-friendly');
  const [selectedStores, setSelectedStores] = useState<string[]>(['Costco', 'Trader Joe\'s']);
  const [timePerMeal, setTimePerMeal] = useState<'quick' | 'moderate' | 'no-preference'>('quick');
  const [cookingComplexity, setCookingComplexity] = useState<'easy' | 'moderate' | 'advanced'>('easy');
  const [specialFocus, setSpecialFocus] = useState<string[]>(['kid-friendly']);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentFamilySize, setCurrentFamilySize] = useState(familySize);

  const toggleMeal = (meal: string) => {
    setSelectedMeals(prev =>
      prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal]
    );
  };

  const toggleStore = (store: string) => {
    setSelectedStores(prev =>
      prev.includes(store) ? prev.filter(s => s !== store) : [...prev, store]
    );
  };

  const toggleFocus = (focus: string) => {
    setSpecialFocus(prev =>
      prev.includes(focus) ? prev.filter(f => f !== focus) : [...prev, focus]
    );
  };

  const handleQuickTemplate = (template: string) => {
    setDescription(template);
  };

  const handleGenerate = () => {
    onGenerate({
      description,
      durationDays,
      mealsPerDay: selectedMeals as any,
      mealVariety,
      preferredStores: selectedStores,
      timePerMeal,
      cookingComplexity,
      specialFocus,
      familySize: currentFamilySize
    });
  };

  return (
    <div className="bg-[#f0f7ff] min-h-screen p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Meal Plan Generator</h1>
          </div>
        </div>

        {/* Description Input */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe Your Plan
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Easy family dinners for 4 using Costco ingredients, kid-friendly, under 30 minutes"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            rows={3}
          />
          
          {/* Quick Templates */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Quick Templates:</p>
            <div className="flex flex-wrap gap-2">
              {quickTemplates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickTemplate(template.text)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 text-sm rounded-full hover:bg-purple-100 transition-colors"
                >
                  {template.icon} {template.text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Basic Options */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Plan Options</h2>
          
          {/* Duration */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <div className="flex gap-2">
              {([7, 14, 30] as const).map(days => (
                <button
                  key={days}
                  onClick={() => setDurationDays(days)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    durationDays === days
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {days} days
                </button>
              ))}
            </div>
          </div>

          {/* Family Size */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4" /> Family Size
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentFamilySize(Math.max(1, currentFamilySize - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 font-bold hover:bg-gray-200"
              >-</button>
              <span className="text-2xl font-bold min-w-[3rem] text-center">{currentFamilySize}</span>
              <button
                onClick={() => setCurrentFamilySize(currentFamilySize + 1)}
                className="w-10 h-10 rounded-full bg-gray-100 font-bold hover:bg-gray-200"
              >+</button>
            </div>
          </div>

          {/* Meals per day */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Meals per day</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'breakfast', label: 'Breakfast', emoji: '🍳' },
                { id: 'lunch', label: 'Lunch', emoji: '🥗' },
                { id: 'dinner', label: 'Dinner', emoji: '🍽️' },
                { id: 'morning-snack', label: 'AM Snack', emoji: '🍎' },
                { id: 'evening-snack', label: 'PM Snack', emoji: '🥜' }
              ].map(meal => (
                <button
                  key={meal.id}
                  onClick={() => toggleMeal(meal.id)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    selectedMeals.includes(meal.id)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {meal.emoji} {meal.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Variety */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Meal variety</label>
            <div className="space-y-2">
              {[
                { id: 'balanced', label: 'Balanced mix' },
                { id: 'family-friendly', label: 'Family-friendly (repeat favorites)' },
                { id: 'maximum-variety', label: 'Maximum variety (different daily)' }
              ].map(option => (
                <label key={option.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    checked={mealVariety === option.id}
                    onChange={() => setMealVariety(option.id as any)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-left p-4 bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 flex items-center justify-between"
        >
          <span className="font-medium text-gray-700">Advanced Options</span>
          <span className="text-gray-400">{showAdvanced ? '▲' : '▼'}</span>
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6 space-y-6">
            {/* Preferred Stores */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <ShoppingBag className="w-4 h-4" /> Preferred stores/brands
              </label>
              <div className="flex flex-wrap gap-2">
                {storeOptions.map(store => (
                  <button
                    key={store}
                    onClick={() => toggleStore(store)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      selectedStores.includes(store)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedStores.includes(store) && '✓ '}{store}
                  </button>
                ))}
              </div>
            </div>

            {/* Time per meal */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4" /> Time per meal
              </label>
              <div className="space-y-2">
                {[
                  { id: 'quick', label: 'Quick (15-20 min)' },
                  { id: 'moderate', label: 'Moderate (20-40 min)' },
                  { id: 'no-preference', label: "Don't care about time" }
                ].map(option => (
                  <label key={option.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={timePerMeal === option.id}
                      onChange={() => setTimePerMeal(option.id as any)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-gray-900">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cooking Complexity */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <ChefHat className="w-4 h-4" /> Cooking complexity
              </label>
              <div className="space-y-2">
                {[
                  { id: 'easy', label: 'Easy (beginner-friendly)' },
                  { id: 'moderate', label: 'Moderate (some experience)' },
                  { id: 'advanced', label: 'Advanced (complex techniques)' }
                ].map(option => (
                  <label key={option.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={cookingComplexity === option.id}
                      onChange={() => setCookingComplexity(option.id as any)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-gray-900">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Special Focus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special focus</label>
              <div className="flex flex-wrap gap-2">
                {specialFocusOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => toggleFocus(option.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      specialFocus.includes(option.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {specialFocus.includes(option.id) && '✓ '}{option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Generating Your Plan...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              Generate Meal Plan
            </>
          )}
        </button>
      </div>
    </div>
  );
};
