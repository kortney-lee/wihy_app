import React from 'react';
import { Bot, Calendar, Plus, ClipboardList, RefreshCw, ChevronRight } from 'lucide-react';

interface RecentMealPlan {
  id: string;
  name: string;
  startDate: string;
  duration: string;
  avgCalories?: number;
  totalMeals?: number;
}

export interface MealPlanningDashboardProps {
  userGoal?: string;
  dailyCalorieTarget?: number;
  recentPlans?: RecentMealPlan[];
  onAIMealPlan?: () => void;
  onAIPlanClick?: () => void;
  onViewCalendar?: () => void;
  onCalendarClick?: () => void;
  onCreateMeal?: () => void;
  onCreateMealClick?: () => void;
  onViewMyPlans?: () => void;
  onMyPlansClick?: () => void;
  onSelectPlanType: (type: 'weekly' | 'single' | 'recurring') => void;
  onSelectRecentPlan?: (planId: string) => void;
}

export const MealPlanningDashboard: React.FC<MealPlanningDashboardProps> = ({
  userGoal = 'Build Muscle',
  dailyCalorieTarget = 2200,
  recentPlans = [],
  onAIMealPlan,
  onAIPlanClick,
  onViewCalendar,
  onCalendarClick,
  onCreateMeal,
  onCreateMealClick,
  onViewMyPlans,
  onMyPlansClick,
  onSelectPlanType,
  onSelectRecentPlan
}) => {
  const quickActions = [
    {
      icon: <Bot className="w-5 h-5" />,
      label: 'AI Meal Plan',
      onClick: onAIMealPlan || onAIPlanClick,
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: 'View Calendar',
      onClick: onViewCalendar || onCalendarClick,
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: <Plus className="w-5 h-5" />,
      label: 'Create Meal',
      onClick: onCreateMeal || onCreateMealClick,
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      icon: <ClipboardList className="w-5 h-5" />,
      label: 'My Meal Plans',
      onClick: onViewMyPlans || onMyPlansClick,
      gradient: 'from-orange-500 to-amber-600'
    }
  ];

  const planTypes = [
    {
      id: 'weekly',
      icon: '📆',
      title: 'WEEKLY MEAL PLAN',
      description: 'Get 7 days of meals (breakfast, lunch, dinner, snacks)',
      subtitle: 'Perfect for meal prep!',
      highlight: true
    },
    {
      id: 'single',
      icon: '🥗',
      title: 'SINGLE MEAL',
      description: 'Create one custom meal from scratch or template',
      subtitle: undefined,
      highlight: false
    },
    {
      id: 'recurring',
      icon: '🔁',
      title: 'RECURRING FAVORITES',
      description: 'Schedule your favorite meals to repeat weekly',
      subtitle: undefined,
      highlight: false
    }
  ] as const;

  return (
    <div className="bg-[#f0f7ff] min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">🍽️ Meal Planning</h1>
          <p className="text-orange-100">
            Goal: <span className="font-semibold text-white">{userGoal}</span> | {dailyCalorieTarget.toLocaleString()} cal/day
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className={`flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200`}
              >
                <div className="p-2 bg-white/20 rounded-lg mb-2">
                  {action.icon}
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Create Meal Plan Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Create Meal Plan</h2>
          <p className="text-gray-500 mb-4">What type of plan do you need?</p>
          
          <div className="space-y-3">
            {planTypes.map(plan => (
              <button
                key={plan.id}
                onClick={() => onSelectPlanType(plan.id)}
                className={`w-full p-5 rounded-xl text-left transition-all duration-200 ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 hover:border-orange-400 shadow-md'
                    : 'bg-white border border-gray-200 hover:border-orange-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{plan.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{plan.title}</h3>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                    {plan.subtitle && (
                      <p className="text-sm text-orange-600 font-medium mt-1">{plan.subtitle}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Meal Plans */}
        {recentPlans.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Meal Plans</h2>
            <div className="space-y-3">
              {recentPlans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => onSelectRecentPlan?.(plan.id)}
                  className="w-full bg-white rounded-xl p-4 border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">
                        Started {plan.startDate} • {plan.duration}
                      </p>
                    </div>
                    <div className="text-right">
                      {plan.avgCalories && (
                        <p className="text-sm font-medium text-orange-600">{plan.avgCalories} cal avg</p>
                      )}
                      {plan.totalMeals && (
                        <p className="text-xs text-gray-500">{plan.totalMeals} meals</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {recentPlans.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <div className="text-5xl mb-4">🥗</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No meal plans yet</h3>
            <p className="text-gray-500 mb-4">Create your first meal plan to get started!</p>
            <button
              onClick={onAIMealPlan}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md"
            >
              <Bot className="w-5 h-5" />
              Generate AI Meal Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
