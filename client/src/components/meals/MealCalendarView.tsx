import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Eye, Check, ShoppingCart } from 'lucide-react';
import { CalendarDay, CalendarMeal, MealType } from '../../types/meals';

export interface MealCalendarViewProps {
  days?: CalendarDay[];
  calendarDays?: CalendarDay[];
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
  onSelectDay?: (date: string) => void;
  onDaySelect?: (day: CalendarDay) => void;
  onViewRecipe?: (recipeId: string) => void;
  onMarkAsEaten?: (mealId: string) => void;
  onMealClick?: (mealId: string) => void;
  onMarkMealComplete?: (mealId: string) => void;
  onAddMeal?: (date: string) => void;
  onGenerateShoppingList?: (startDate?: string, endDate?: string) => void;
  selectedDate?: string;
}

export const MealCalendarView: React.FC<MealCalendarViewProps> = ({
  days,
  calendarDays,
  currentMonth: initialMonth,
  onMonthChange,
  onSelectDay,
  onDaySelect,
  onViewRecipe,
  onMarkAsEaten,
  onMealClick,
  onMarkMealComplete,
  onAddMeal,
  onGenerateShoppingList,
  selectedDate
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentMonth, setCurrentMonth] = useState(initialMonth || new Date());
  
  const calendarData = days || calendarDays || [];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getMealIcon = (mealType?: MealType) => {
    if (!mealType) return '🍴';
    const icons: Record<MealType, string> = {
      breakfast: '🍳',
      lunch: '🥗',
      dinner: '🍽️',
      snack: '🍎'
    };
    return icons[mealType] || '🍴';
  };

  const getCalorieColor = (calories: number) => {
    if (calories < 1400) return 'bg-blue-500';
    if (calories < 1800) return 'bg-green-500';
    return 'bg-orange-500';
  };

  // Get current week's days
  const getWeekDays = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date.toISOString().split('T')[0];
    });
  };

  const currentWeekDates = getWeekDays();

  // Get calendar data for a specific date
  const getCalendarDay = (date: string) => {
    return calendarData.find(d => d.date === date);
  };

  // Selected day data
  const selectedDayData = selectedDate ? getCalendarDay(selectedDate) : null;

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
    onMonthChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
    onMonthChange?.(newDate);
  };
  
  const handleSelectDay = (date: string) => {
    const dayData = getCalendarDay(date);
    onSelectDay?.(date);
    if (dayData) {
      onDaySelect?.(dayData);
    }
  };
  
  const handleMealAction = (mealId: string) => {
    onMealClick?.(mealId);
    onMarkMealComplete?.(mealId);
    onMarkAsEaten?.(mealId);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-[#f0f7ff] min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 sm:p-6 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              📅 {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'week' ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'month' ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1">
              {weekDays.map(day => (
                <div key={day} className="w-12 sm:w-14 text-center text-sm font-medium text-blue-100">
                  {day}
                </div>
              ))}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid - Week View */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {currentWeekDates.map(date => {
              const dayData = getCalendarDay(date);
              const isToday = date === today;
              const isSelected = date === selectedDate;
              const dateObj = new Date(date);

              return (
                <button
                  key={date}
                  onClick={() => handleSelectDay(date)}
                  className={`bg-white p-2 sm:p-3 text-center min-h-[80px] sm:min-h-[100px] transition-colors hover:bg-blue-50 ${
                    isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isToday ? 'w-7 h-7 mx-auto rounded-full bg-orange-500 text-white flex items-center justify-center' : 'text-gray-900'
                  }`}>
                    {dateObj.getDate()}
                  </div>

                  {dayData && (
                    <>
                      {/* Meal Icons */}
                      <div className="flex justify-center gap-0.5 mb-1">
                        {dayData.hasBreakfast && <span className="text-xs">🍳</span>}
                        {dayData.hasLunch && <span className="text-xs">🥗</span>}
                        {dayData.hasDinner && <span className="text-xs">🍽️</span>}
                        {dayData.hasSnacks && <span className="text-xs">🍎</span>}
                      </div>

                      {/* Calorie Indicator */}
                      <div className={`w-2 h-2 rounded-full mx-auto ${getCalorieColor(dayData.totalCalories)}`} />
                      <div className="text-xs text-gray-500 mt-1">
                        {dayData.totalCalories}
                      </div>
                    </>
                  )}

                  {!dayData && (
                    <div className="text-xs text-gray-400 mt-2">No meals</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-sm">
          <div className="flex items-center gap-1.5">
            <span>🍳</span> <span className="text-gray-600">Breakfast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🥗</span> <span className="text-gray-600">Lunch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🍽️</span> <span className="text-gray-600">Dinner</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🍎</span> <span className="text-gray-600">Snacks</span>
          </div>
          <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-300">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-600">&lt;1400</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600">1400-1800</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-gray-600">&gt;1800</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDayData ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {selectedDayData.dayName || ''} - {new Date(selectedDate!).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>

            {/* Daily Macros Summary */}
            <div className="grid grid-cols-4 gap-3 mb-6 bg-gray-50 rounded-xl p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{selectedDayData.totalCalories}</div>
                <div className="text-xs text-gray-500">Calories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{selectedDayData.totalProtein}g</div>
                <div className="text-xs text-gray-500">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{selectedDayData.totalCarbs}g</div>
                <div className="text-xs text-gray-500">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{selectedDayData.totalFat}g</div>
                <div className="text-xs text-gray-500">Fat</div>
              </div>
            </div>

            {/* Meals List */}
            <h3 className="font-semibold text-gray-700 mb-3">Today's Meals</h3>
            <div className="space-y-3">
              {selectedDayData.meals.map((meal, idx) => (
                <MealCard
                  key={idx}
                  meal={meal}
                  getMealIcon={getMealIcon}
                  onViewRecipe={onViewRecipe}
                  onMarkAsEaten={handleMealAction}
                />
              ))}
            </div>

            {/* Generate Shopping List for Week */}
            <button
              onClick={() => {
                const weekStart = currentWeekDates[0];
                const weekEnd = currentWeekDates[6];
                onGenerateShoppingList?.(weekStart, weekEnd);
              }}
              className="w-full mt-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Generate Shopping List for Week
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Day</h3>
            <p className="text-gray-500">Tap on any day to see meal details</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface MealCardProps {
  meal: CalendarMeal;
  getMealIcon: (type?: MealType) => string;
  onViewRecipe?: (recipeId: string) => void;
  onMarkAsEaten?: (mealId: string) => void;
}

const MealCard: React.FC<MealCardProps> = ({ meal, getMealIcon, onViewRecipe, onMarkAsEaten }) => {
  const mealType = meal.mealType || meal.type;
  const mealName = meal.mealName || meal.name || 'Meal';
  const mealId = meal.mealId || meal.id || '';
  
  const mealTimes: Record<MealType, string> = {
    breakfast: '8:00 AM',
    lunch: '12:30 PM',
    dinner: '7:00 PM',
    snack: '3:00 PM'
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{getMealIcon(mealType)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">
              {mealType}
            </span>
            {mealType && <span className="text-xs text-gray-400">- {mealTimes[mealType] || meal.time}</span>}
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">{mealName}</h4>
          <div className="text-sm text-gray-600">
            {meal.calories} cal {meal.protein ? `• P: ${meal.protein}g` : ''} {meal.carbs ? `• C: ${meal.carbs}g` : ''} {meal.fat ? `• F: ${meal.fat}g` : ''}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {meal.recipeId && onViewRecipe && (
          <button
            onClick={() => onViewRecipe(meal.recipeId!)}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Recipe
          </button>
        )}
        <button
          onClick={() => onMarkAsEaten?.(mealId)}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
            meal.isCompleted 
              ? 'bg-gray-200 text-gray-600' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          <Check className="w-4 h-4" />
          {meal.isCompleted ? 'Eaten ✓' : 'Mark as Eaten'}
        </button>
      </div>
    </div>
  );
};
