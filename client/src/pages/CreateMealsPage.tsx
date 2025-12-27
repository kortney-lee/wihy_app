import React, { useState, useEffect } from 'react';
import { MealProgramBuilder } from '../components/meals/MealProgramBuilder';
import { ShoppingOutputs } from '../components/meals/ShoppingOutputs';
import { MealPlan, Meal, PrepBatch, ShoppingListItem } from '../types/meals';
import { PlatformDetectionService } from '../services/shared/platformDetectionService';
import Header from '../components/shared/Header';
import { useMealPlans } from '../contexts/MealPlanContext';
import { useRelationships } from '../contexts/RelationshipContext';

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
        {/* Dashboard Content */}
        <div 
          className="w-full min-h-screen bg-[#f0f7ff]"
          style={{
            padding: windowWidth < 768 ? '5px 8px 0 8px' : '10px 20px',
            paddingTop: 0,
            maxWidth: '100%',
            overflowX: 'hidden'
          }}
        >
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
        </div>
      </div>
    </>
  );
};

export default CreateMealsPage;