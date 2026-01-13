import React, { useState, useEffect, useCallback } from 'react';
import { MealProgramBuilder } from '../components/meals/MealProgramBuilder';
import { ShoppingOutputs } from '../components/meals/ShoppingOutputs';
import { MealPlanningDashboard } from '../components/meals/MealPlanningDashboard';
import { MealPlanningPreferences } from '../components/meals/MealPlanningPreferences';
import { AIMealPlanGenerator, MealPlanConfig } from '../components/meals/AIMealPlanGenerator';
import { MealPlanPreview } from '../components/meals/MealPlanPreview';
import { MealCalendarView } from '../components/meals/MealCalendarView';
import { CreateSingleMeal, NewMealData } from '../components/meals/CreateSingleMeal';
import { ShoppingListGenerator } from '../components/meals/ShoppingListGenerator';
import { 
  MealPlan, 
  Meal, 
  PrepBatch, 
  ShoppingListItem, 
  MealPlanningPreferences as MealPrefs,
  GeneratedMealProgram,
  CalendarDay,
  MealIngredient,
  InstacartCartResponse
} from '../types/meals';
import { PlatformDetectionService } from '../services/shared/platformDetectionService';
import Header from '../components/shared/Header';
import { useMealPlans } from '../contexts/MealPlanContext';
import { useRelationships } from '../contexts/RelationshipContext';
import { ArrowLeft, X } from 'lucide-react';

// Flow steps for the enhanced meal planning experience
type FlowStep = 
  | 'dashboard'
  | 'preferences'
  | 'ai-generator'
  | 'plan-preview'
  | 'calendar'
  | 'create-meal'
  | 'shopping-list'
  | 'legacy'; // Old UI for backward compatibility

const API_BASE_URL = 'https://services.wihy.ai/api';

const CreateMealsPage: React.FC = () => {
  const { 
    draftMealProgram, 
    shoppingList, 
    setDraftMealProgram, 
    updateMeals, 
    updatePrepBatches,
    generateInstacartLink,
    createClientMealPlan 
  } = useMealPlans();
  
  const { selectedClientId, coachClients, myRole } = useRelationships();
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // New flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>('dashboard');
  const [userPreferences, setUserPreferences] = useState<MealPrefs | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMealProgram | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [currentShoppingList, setCurrentShoppingList] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(
    localStorage.getItem('mealPlanningOnboardingComplete') === 'true'
  );

  // Get current client info if coach is working with a client
  const selectedClient = selectedClientId ? coachClients.find(c => c.id === selectedClientId) : null;
  const isCoachMode = myRole === 'coach';

  // Initialize or get current meal plan
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan>(
    draftMealProgram || {
      id: 'new-plan',
      name: selectedClient ? `${selectedClient.name}'s Meal Plan` : 'My Meal Plan',
      planType: 'This Week',
      goals: [],
      meals: [],
      prepBatches: []
    }
  );

  // Sync with context when draft changes
  useEffect(() => {
    if (draftMealProgram && draftMealProgram.id !== currentMealPlan.id) {
      setCurrentMealPlan(draftMealProgram);
    }
  }, [draftMealProgram]);

  // Update context when local meal plan changes
  useEffect(() => {
    setDraftMealProgram(currentMealPlan);
  }, [currentMealPlan, setDraftMealProgram]);

  // Available goal options
  const availableGoals = [
    'High protein',
    'Low sodium', 
    'Vegan',
    'Leviticus 11',
    'Keto',
    'Mediterranean',
    'Gluten-free',
    'Dairy-free'
  ];

  // Window width detection for responsive padding
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleGoal = (goal: string) => {
    setCurrentMealPlan(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) 
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleMealsChange = (meals: Meal[]) => {
    const updated = { ...currentMealPlan, meals };
    setCurrentMealPlan(updated);
    updateMeals(meals);
  };

  const handlePrepBatchesChange = (prepBatches: PrepBatch[]) => {
    const updated = { ...currentMealPlan, prepBatches };
    setCurrentMealPlan(updated);
    updatePrepBatches(prepBatches);
  };

  // =========================================
  // New Flow Handlers
  // =========================================
  
  // Handle preferences save
  const handleSavePreferences = async (prefs: MealPrefs) => {
    setUserPreferences(prefs);
    localStorage.setItem('mealPlanningOnboardingComplete', 'true');
    setHasCompletedOnboarding(true);
    
    // Save to API
    try {
      await fetch(`${API_BASE_URL}/meal-planning/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
    
    setCurrentStep('dashboard');
  };

  // Handle AI plan generation
  const handleGenerateAIPlan = async (config: MealPlanConfig) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/meal-planning/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: config.description,
          duration: config.durationDays,
          mealsPerDay: config.mealsPerDay,
          preferences: userPreferences,
          options: config.advancedOptions
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate meal plan');
      
      const plan: GeneratedMealProgram = await response.json();
      setGeneratedPlan(plan);
      setCurrentStep('plan-preview');
    } catch (error) {
      console.error('AI plan generation failed:', error);
      // Show error toast/modal
    } finally {
      setIsLoading(false);
    }
  };

  // Handle plan save from preview
  const handleSavePlanFromPreview = async () => {
    if (!generatedPlan) return;
    
    try {
      await fetch(`${API_BASE_URL}/meal-planning/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedPlan)
      });
      
      // Convert to calendar format and navigate
      const days = convertPlanToCalendarDays(generatedPlan);
      setCalendarDays(days);
      setCurrentStep('calendar');
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  // Convert generated plan to calendar format
  const convertPlanToCalendarDays = (plan: GeneratedMealProgram): CalendarDay[] => {
    const today = new Date();
    return plan.days.map((day, idx) => {
      const date = new Date(today);
      date.setDate(today.getDate() + idx);
      return {
        date: date.toISOString().split('T')[0],
        meals: day.meals.map(meal => ({
          id: `${day.dayNumber}-${meal.type}`,
          name: meal.name,
          type: meal.type,
          calories: meal.nutrition.calories,
          time: meal.type === 'breakfast' ? '8:00 AM' : meal.type === 'lunch' ? '12:00 PM' : meal.type === 'dinner' ? '6:00 PM' : '3:00 PM',
          isCompleted: false,
          image: meal.image
        })),
        totalCalories: day.meals.reduce((sum, m) => sum + m.nutrition.calories, 0),
        totalProtein: day.meals.reduce((sum, m) => sum + m.nutrition.protein, 0),
        totalCarbs: day.meals.reduce((sum, m) => sum + m.nutrition.carbs, 0),
        totalFat: day.meals.reduce((sum, m) => sum + m.nutrition.fat, 0)
      };
    });
  };

  // Handle generating shopping list from plan
  const handleGenerateShoppingList = async () => {
    if (!generatedPlan) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/meal-planning/shopping-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: generatedPlan.id })
      });
      
      if (!response.ok) throw new Error('Failed to generate shopping list');
      
      const items: ShoppingListItem[] = await response.json();
      setCurrentShoppingList(items);
      setCurrentStep('shopping-list');
    } catch (error) {
      console.error('Shopping list generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Instacart export
  const handleInstacartExport = async (): Promise<InstacartCartResponse | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/instacart/create-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: currentShoppingList })
      });
      
      if (!response.ok) throw new Error('Failed to create Instacart cart');
      
      return await response.json();
    } catch (error) {
      console.error('Instacart export failed:', error);
      return null;
    }
  };

  // Handle saving a single meal
  const handleSaveMeal = async (meal: NewMealData) => {
    try {
      await fetch(`${API_BASE_URL}/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meal)
      });
      
      // Navigate back to dashboard
      setCurrentStep('dashboard');
    } catch (error) {
      console.error('Failed to save meal:', error);
    }
  };

  // Handle adding meal to calendar
  const handleAddMealToCalendar = async (meal: NewMealData, date: string) => {
    try {
      await fetch(`${API_BASE_URL}/meal-planning/calendar/${date}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meal)
      });
      
      setCurrentStep('calendar');
    } catch (error) {
      console.error('Failed to add meal to calendar:', error);
    }
  };

  // Navigation handler for dashboard
  const handleDashboardAction = (action: string) => {
    switch (action) {
      case 'ai-plan':
        if (!hasCompletedOnboarding) {
          setCurrentStep('preferences');
        } else {
          setCurrentStep('ai-generator');
        }
        break;
      case 'calendar':
        setCurrentStep('calendar');
        break;
      case 'create-meal':
        setCurrentStep('create-meal');
        break;
      case 'legacy':
        setCurrentStep('legacy');
        break;
      default:
        break;
    }
  };

  // Back navigation
  const handleBack = () => {
    switch (currentStep) {
      case 'preferences':
      case 'ai-generator':
      case 'create-meal':
      case 'calendar':
      case 'legacy':
        setCurrentStep('dashboard');
        break;
      case 'plan-preview':
        setCurrentStep('ai-generator');
        break;
      case 'shopping-list':
        setCurrentStep(generatedPlan ? 'plan-preview' : 'calendar');
        break;
      default:
        setCurrentStep('dashboard');
    }
  };

  // =========================================
  // Legacy Handlers (Original functionality)
  // =========================================
  
  const handleSavePlan = () => {
    if (isCoachMode && selectedClientId) {
      // Coach saving plan for client
      createClientMealPlan(selectedClientId, currentMealPlan);
      console.log('Meal plan saved for client:', selectedClient?.name);
    } else {
      // Client saving own plan
      console.log('Saving meal plan:', currentMealPlan);
    }
    // TODO: Show success toast
  };

  const handlePublishToClient = () => {
    if (isCoachMode && selectedClientId) {
      console.log('Publishing to client:', selectedClient?.name, currentMealPlan);
      // TODO: API call to publish to client
    }
  };

  const handleGenerateInstacart = async () => {
    try {
      const link = await generateInstacartLink();
      console.log('Generated Instacart link:', link);
      // TODO: Show success toast with link
    } catch (error) {
      console.error('Failed to generate Instacart link:', error);
    }
  };

  // =========================================
  // Render Based on Current Step
  // =========================================
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'dashboard':
        return (
          <MealPlanningDashboard
            onAIPlanClick={() => handleDashboardAction('ai-plan')}
            onCalendarClick={() => handleDashboardAction('calendar')}
            onCreateMealClick={() => handleDashboardAction('create-meal')}
            onMyPlansClick={() => handleDashboardAction('legacy')}
            onSelectPlanType={(type) => {
              if (type === 'weekly') handleDashboardAction('ai-plan');
              else if (type === 'single') handleDashboardAction('create-meal');
              else handleDashboardAction('ai-plan');
            }}
            onSelectRecentPlan={(planId) => console.log('Selected plan:', planId)}
            recentPlans={[]}
          />
        );
        
      case 'preferences':
        return (
          <MealPlanningPreferences
            onSavePreferences={handleSavePreferences}
            onSkip={() => {
              setHasCompletedOnboarding(true);
              localStorage.setItem('mealPlanningOnboardingComplete', 'true');
              setCurrentStep('ai-generator');
            }}
            existingPreferences={userPreferences || undefined}
          />
        );
        
      case 'ai-generator':
        return (
          <AIMealPlanGenerator
            onGenerate={handleGenerateAIPlan}
            onBack={handleBack}
            preferences={userPreferences || undefined}
            isLoading={isLoading}
          />
        );
        
      case 'plan-preview':
        return generatedPlan ? (
          <MealPlanPreview
            plan={generatedPlan}
            onCustomize={() => setCurrentStep('ai-generator')}
            onSave={handleSavePlanFromPreview}
            onAddToCalendar={() => {
              handleSavePlanFromPreview();
            }}
            onGenerateShoppingList={handleGenerateShoppingList}
            isLoading={isLoading}
          />
        ) : null;
        
      case 'calendar':
        return (
          <MealCalendarView
            days={calendarDays}
            onDaySelect={(day) => console.log('Selected day:', day)}
            onMealClick={(mealId) => console.log('Clicked meal:', mealId)}
            onMarkMealComplete={(mealId) => {
              setCalendarDays(prev => prev.map(day => ({
                ...day,
                meals: day.meals.map(meal => 
                  meal.id === mealId ? { ...meal, isCompleted: !meal.isCompleted } : meal
                )
              })));
            }}
            onAddMeal={(date) => setCurrentStep('create-meal')}
            onGenerateShoppingList={handleGenerateShoppingList}
          />
        );
        
      case 'create-meal':
        return (
          <CreateSingleMeal
            onSaveMeal={handleSaveMeal}
            onAddToCalendar={handleAddMealToCalendar}
            onGenerateShoppingList={(ingredients) => {
              const items: ShoppingListItem[] = ingredients.map((ing, idx) => ({
                id: `item-${idx}`,
                name: ing.name,
                quantity: ing.amount,
                unit: ing.unit,
                category: 'Other',
                checked: false
              }));
              setCurrentShoppingList(items);
              setCurrentStep('shopping-list');
            }}
            onUseTemplate={() => console.log('Open template picker')}
            onScanRecipe={() => console.log('Open recipe scanner')}
            onAIGenerate={(prompt) => {
              console.log('AI generate meal:', prompt);
            }}
            onSearchDatabase={(query) => console.log('Search:', query)}
            isLoading={isLoading}
          />
        );
        
      case 'shopping-list':
        return (
          <ShoppingListGenerator
            items={currentShoppingList}
            totalCost={currentShoppingList.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0)}
            onExportToInstacart={handleInstacartExport}
            onEmailList={(email) => console.log('Email to:', email)}
            onShare={() => console.log('Share shopping list')}
            onPrint={() => window.print()}
            onUpdateItem={(itemId, updates) => {
              setCurrentShoppingList(prev => 
                prev.map(item => item.id === itemId ? { ...item, ...updates } : item)
              );
            }}
            onRemoveItem={(itemId) => {
              setCurrentShoppingList(prev => prev.filter(item => item.id !== itemId));
            }}
            preferredStores={userPreferences?.preferredStores}
            instacartConnected={false}
          />
        );
        
      case 'legacy':
      default:
        return renderLegacyUI();
    }
  };

  const renderLegacyUI = () => (
    <>
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 p-4 mb-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800 m-0">
              {isCoachMode && selectedClient ? `${selectedClient.name}'s Meal Plan` : 'Create Meals'}
            </h1>
            {isCoachMode && selectedClient && (
              <p className="text-sm text-gray-600 mt-1">{selectedClient.email}</p>
            )}
          </div>
          <div className="relative">
            <select 
              value={currentMealPlan.planType}
              onChange={(e) => setCurrentMealPlan(prev => ({ ...prev, planType: e.target.value as any }))}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm text-gray-800 cursor-pointer appearance-none focus:outline-none focus:border-orange-500 focus:ring-3 focus:ring-orange-100"
              style={{ 
                backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e\")", 
                backgroundRepeat: 'no-repeat', 
                backgroundPosition: 'right 8px center', 
                backgroundSize: '16px' 
              }}
            >
              <option value="This Week">This Week</option>
              <option value="Next 7 Days">Next 7 Days</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Goal chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {availableGoals.map(goal => (
            <button
              key={goal}
              onClick={() => toggleGoal(goal)}
              className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                currentMealPlan.goals.includes(goal) 
                  ? 'bg-orange-500 text-white border-orange-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>

        {/* Primary actions */}
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleSavePlan} 
            className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Save Plan
          </button>
          {isCoachMode && (
            <button 
              onClick={handlePublishToClient} 
              className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              Publish to Client
            </button>
          )}
          <button 
            onClick={handleGenerateInstacart} 
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
          >
            Generate Instacart Link
          </button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="">
          <MealProgramBuilder
            meals={currentMealPlan.meals}
            prepBatches={currentMealPlan.prepBatches}
            onMealsChange={handleMealsChange}
            onPrepBatchesChange={handlePrepBatchesChange}
          />
        </div>
        
        <div className="">
          <ShoppingOutputs 
            shoppingList={shoppingList}
            mealPlanId={currentMealPlan.id}
          />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Fixed Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-white ${PlatformDetectionService.isNative() ? 'pt-12' : ''}`}>
        <Header
          variant="results"
          showLogin={true}
          showSearchInput={true}
          onSearchSubmit={() => {}}
          onChatMessage={() => {}}
          isInChatMode={false}
          showProgressMenu={true}
          onProgressMenuClick={undefined}
        />
      </div>

      {/* Main Container */}
      <div 
        className="min-h-screen bg-[#f0f7ff] overflow-hidden"
        style={{ paddingTop: windowWidth < 768 ? '320px' : windowWidth < 1200 ? '300px' : '180px' }}
      >
        {/* Back Button for non-dashboard steps */}
        {currentStep !== 'dashboard' && (
          <div className="px-4 sm:px-6 py-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        <div 
          className="w-full min-h-screen bg-[#f0f7ff]"
          style={{
            padding: currentStep === 'legacy' 
              ? (windowWidth < 768 ? '5px 8px 0 8px' : '10px 20px')
              : '0',
            paddingTop: 0,
            maxWidth: '100%',
            overflowX: 'hidden'
          }}
        >
          {renderCurrentStep()}
        </div>
      </div>
    </>
  );
};

export default CreateMealsPage;