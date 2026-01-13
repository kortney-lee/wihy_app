import React, { useState } from 'react';
import { Clock, DollarSign, Users, ChevronDown, ChevronUp, ShoppingCart, Calendar, Edit, Star } from 'lucide-react';
import { GeneratedMealProgram, MealProgramDay, GeneratedMeal } from '../../types/meals';

export interface MealPlanPreviewProps {
  plan?: GeneratedMealProgram;
  mealProgram?: GeneratedMealProgram;
  onSave: () => void;
  onCustomize: () => void;
  onViewAllDays?: () => void;
  onGenerateShoppingList: () => void;
  onScheduleToCalendar?: () => void;
  onAddToCalendar?: () => void;
  isLoading?: boolean;
}

export const MealPlanPreview: React.FC<MealPlanPreviewProps> = ({
  plan,
  mealProgram,
  onSave,
  onCustomize,
  onViewAllDays,
  onGenerateShoppingList,
  onScheduleToCalendar,
  onAddToCalendar,
  isLoading = false
}) => {
  const programData = plan || mealProgram;
  
  if (!programData) {
    return (
      <div className="bg-[#f0f7ff] min-h-screen p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500">No meal plan to preview</p>
        </div>
      </div>
    );
  }
  
  const [expandedDays, setExpandedDays] = useState<number[]>([1, 2]); // First 2 days expanded by default

  const toggleDay = (dayNumber: number) => {
    setExpandedDays(prev =>
      prev.includes(dayNumber)
        ? prev.filter(d => d !== dayNumber)
        : [...prev, dayNumber]
    );
  };

  const getMealIcon = (mealType: string) => {
    const icons: Record<string, string> = {
      breakfast: '🍳',
      lunch: '🥗',
      dinner: '🍽️',
      snack: '🍎'
    };
    return icons[mealType] || '🍴';
  };

  return (
    <div className="bg-[#f0f7ff] min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">✨</span>
            <h1 className="text-2xl font-bold">{programData.name}</h1>
          </div>
          <p className="text-green-100 mb-4">{programData.description}</p>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{programData.durationDays}</div>
              <div className="text-sm text-green-100">days</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{programData.totalMeals}</div>
              <div className="text-sm text-green-100">meals</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{programData.familySize}</div>
              <div className="text-sm text-green-100">servings</div>
            </div>
            {programData.weeklyCost && (
              <div className="bg-white/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">${programData.weeklyCost.perMeal}</div>
                <div className="text-sm text-green-100">avg/meal</div>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Cost Summary */}
        {programData.weeklyCost && (
          <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="font-medium">Total week cost:</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  ~${programData.weeklyCost.total.toFixed(0)}
                </div>
                <div className="text-sm text-gray-500">
                  for family of {programData.familySize}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day Cards */}
        <div className="space-y-4 mb-6">
          {programData.days.slice(0, 3).map(day => (
            <DayCard
              key={day.dayNumber}
              day={day}
              isExpanded={expandedDays.includes(day.dayNumber)}
              onToggle={() => toggleDay(day.dayNumber)}
              getMealIcon={getMealIcon}
            />
          ))}

          {programData.days.length > 3 && (
            <button
              onClick={onViewAllDays}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              View All {programData.durationDays} Days →
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCustomize}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-gray-400 transition-colors"
            >
              <Edit className="w-5 h-5" />
              Customize
            </button>
            <button
              onClick={onSave}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Star className="w-5 h-5" />
              {isLoading ? 'Saving...' : 'Save Plan'}
            </button>
          </div>

          <button
            onClick={onScheduleToCalendar || onAddToCalendar}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Add to Calendar
          </button>

          <button
            onClick={onGenerateShoppingList}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg"
          >
            <ShoppingCart className="w-6 h-6" />
            Generate Shopping List for Week
          </button>
        </div>
      </div>
    </div>
  );
};

interface DayCardProps {
  day: MealProgramDay;
  isExpanded: boolean;
  onToggle: () => void;
  getMealIcon: (type: string) => string;
}

const DayCard: React.FC<DayCardProps> = ({ day, isExpanded, onToggle, getMealIcon }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Day Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">DAY {day.dayNumber}</span>
            <span className="text-gray-500">-</span>
            <span className="font-medium text-gray-700">{day.dayName}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {day.totalDailyCost && (
            <div className="text-right">
              <div className="text-sm font-medium text-green-600">
                ${day.totalDailyCost.toFixed(0)} total
              </div>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Meals */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {day.meals.map((meal, idx) => (
            <MealRow key={idx} meal={meal} getMealIcon={getMealIcon} />
          ))}

          {/* Daily Summary */}
          {day.dailyMacros && (
            <div className="bg-gray-50 px-4 py-3 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Daily Total:</span>
                <span className="font-medium text-gray-900">
                  {day.dailyMacros.calories} cal • P: {day.dailyMacros.protein}g • C: {day.dailyMacros.carbs}g • F: {day.dailyMacros.fat}g
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface MealRowProps {
  meal: GeneratedMeal;
  getMealIcon: (type: string) => string;
}

const MealRow: React.FC<MealRowProps> = ({ meal, getMealIcon }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getMealIcon(meal.mealType)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                {meal.mealType}
              </span>
              {meal.kidApproved && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  🌟 Kid-approved
                </span>
              )}
              {meal.usesLeftovers && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  ♻️ Uses leftovers
                </span>
              )}
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">{meal.mealName}</h4>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {meal.totalTime} min
              </span>
              <span>•</span>
              <span>{meal.servings} servings</span>
              {meal.costPerServing && (
                <>
                  <span>•</span>
                  <span className="text-green-600">${meal.costPerServing.toFixed(2)}/serving</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{meal.nutrition.calories}</div>
            <div className="text-xs text-gray-500">cal</div>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-4 pb-4 bg-gray-50">
          {/* Macros */}
          <div className="flex gap-4 mb-3 text-sm">
            <span className="text-blue-600 font-medium">P: {meal.nutrition.protein}g</span>
            <span className="text-orange-600 font-medium">C: {meal.nutrition.carbs}g</span>
            <span className="text-yellow-600 font-medium">F: {meal.nutrition.fat}g</span>
          </div>

          {/* Ingredients Preview */}
          <div className="mb-3">
            <h5 className="text-sm font-medium text-gray-700 mb-1">Ingredients:</h5>
            <p className="text-sm text-gray-600">
              {meal.ingredients.slice(0, 4).map(i => i.name).join(', ')}
              {meal.ingredients.length > 4 && ` +${meal.ingredients.length - 4} more`}
            </p>
          </div>

          {/* Tags */}
          {meal.tags && meal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {meal.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Leftover Plan */}
          {meal.leftoverPlan && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg text-sm text-blue-800">
              💡 {meal.leftoverPlan.amount} saves for {meal.leftoverPlan.savesFor}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
