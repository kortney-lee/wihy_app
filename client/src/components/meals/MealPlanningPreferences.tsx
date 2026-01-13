import React, { useState } from 'react';
import { Users, Clock, DollarSign, Dumbbell, Check } from 'lucide-react';
import { 
  MealPlanningPreferences as Preferences, 
  PlanningGoal, 
  CookingSkill, 
  DietaryRestriction 
} from '../../types/meals';

export interface MealPlanningPreferencesProps {
  onSavePreferences: (preferences: Preferences) => void;
  onSkip: () => void;
  initialPreferences?: Partial<Preferences>;
  existingPreferences?: Preferences;
}

export const MealPlanningPreferences: React.FC<MealPlanningPreferencesProps> = ({
  onSavePreferences,
  onSkip,
  initialPreferences,
  existingPreferences
}) => {
  const prefs = existingPreferences || initialPreferences;
  const [selectedGoal, setSelectedGoal] = useState<PlanningGoal | null>(
    prefs?.planningGoal || null
  );
  const [dietaryNeeds, setDietaryNeeds] = useState<DietaryRestriction[]>(
    prefs?.dietaryRestrictions || []
  );
  const [preferredBrands, setPreferredBrands] = useState<string>(
    prefs?.preferredStores?.join(', ') || ''
  );
  const [cookingSkill, setCookingSkill] = useState<CookingSkill>(
    prefs?.cookingSkill || 'beginner'
  );
  const [familySize, setFamilySize] = useState<number>(
    prefs?.familySize || 2
  );

  const planningGoals: { id: PlanningGoal; icon: React.ReactNode; title: string; features: string[] }[] = [
    {
      id: 'family-meals',
      icon: <Users className="w-6 h-6" />,
      title: 'FAMILY MEALS',
      features: ['Easy recipes everyone loves', 'Kid-friendly options', 'Batch cooking & leftovers']
    },
    {
      id: 'quick-easy',
      icon: <Clock className="w-6 h-6" />,
      title: 'QUICK & EASY',
      features: ['Under 30 minutes', 'Simple ingredients', 'Minimal cleanup']
    },
    {
      id: 'budget-friendly',
      icon: <DollarSign className="w-6 h-6" />,
      title: 'BUDGET-FRIENDLY',
      features: ['Affordable ingredients', 'Store brand options', 'Meal prep to save money']
    },
    {
      id: 'health-fitness',
      icon: <Dumbbell className="w-6 h-6" />,
      title: 'HEALTH & FITNESS',
      features: ['High protein, balanced macros', 'Weight management focus', 'Calorie tracking']
    }
  ];

  const dietaryOptions: { id: DietaryRestriction; label: string }[] = [
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'gluten-free', label: 'Gluten-Free' },
    { id: 'dairy-free', label: 'Dairy-Free' },
    { id: 'nut-allergy', label: 'Nut Allergy' },
    { id: 'kid-friendly', label: 'Kid-Friendly' },
    { id: 'low-carb', label: 'Low Carb' },
    { id: 'diabetic-friendly', label: 'Diabetic-Friendly' }
  ];

  const toggleDietaryNeed = (restriction: DietaryRestriction) => {
    setDietaryNeeds(prev =>
      prev.includes(restriction)
        ? prev.filter(d => d !== restriction)
        : [...prev, restriction]
    );
  };

  const handleSave = () => {
    if (!selectedGoal) return;
    
    onSavePreferences({
      planningGoal: selectedGoal,
      dietaryRestrictions: dietaryNeeds,
      preferredStores: preferredBrands.split(',').map(s => s.trim()).filter(Boolean),
      cookingSkill,
      familySize
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            🍽️ Let's Personalize Your Meals
          </h1>
          <p className="text-gray-600">
            Tell us what matters most to you
          </p>
        </div>

        {/* Planning Goal Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            I'm Planning Meals For
          </label>
          <div className="space-y-3">
            {planningGoals.map(goal => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  selectedGoal === goal.id
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    selectedGoal === goal.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {goal.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{goal.title}</h3>
                    <ul className="text-sm text-gray-600 space-y-0.5">
                      {goal.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-orange-500">•</span> {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {selectedGoal === goal.id && (
                    <Check className="w-6 h-6 text-orange-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Needs */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Dietary Needs
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {dietaryOptions.map(option => (
              <button
                key={option.id}
                onClick={() => toggleDietaryNeed(option.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  dietaryNeeds.includes(option.id)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dietaryNeeds.includes(option.id) && <span className="mr-1">✓</span>}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Family Size */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Family/Household Size
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFamilySize(Math.max(1, familySize - 1))}
              className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
            >
              -
            </button>
            <span className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">
              {familySize}
            </span>
            <button
              onClick={() => setFamilySize(familySize + 1)}
              className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
            >
              +
            </button>
            <span className="text-gray-500">people</span>
          </div>
        </div>

        {/* Preferred Brands/Stores */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred Brands/Stores (Optional)
          </label>
          <input
            type="text"
            value={preferredBrands}
            onChange={(e) => setPreferredBrands(e.target.value)}
            placeholder="e.g., Costco, Trader Joe's, Organic brands"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">Separate multiple entries with commas</p>
        </div>

        {/* Cooking Skill Level */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Cooking Skill Level
          </label>
          <div className="space-y-2">
            {(['beginner', 'intermediate', 'advanced'] as CookingSkill[]).map(skill => (
              <label
                key={skill}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name="cookingSkill"
                  checked={cookingSkill === skill}
                  onChange={() => setCookingSkill(skill)}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="font-medium text-gray-900 capitalize">{skill}</span>
                <span className="text-sm text-gray-500">
                  {skill === 'beginner' && '(Simple recipes)'}
                  {skill === 'intermediate' && '(Some experience)'}
                  {skill === 'advanced' && '(Complex cooking)'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Skip Notice */}
        <p className="text-sm text-gray-500 text-center mb-6">
          💡 Skip this - you can set preferences later or just start creating meals
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={!selectedGoal}
            className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
              selectedGoal
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Save & Continue
          </button>
          <button
            onClick={onSkip}
            className="flex-1 py-4 px-6 rounded-xl font-medium text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-400 transition-all duration-200"
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
};
