import React from 'react';
import { useRelationships } from '../../contexts/RelationshipContext';
import { useMealPlans } from '../../contexts/MealPlanContext';
import { useFitness } from '../../contexts/FitnessContext';

export const SystemIntegrationDemo: React.FC = () => {
  const { 
    myRole, 
    coachClients, 
    selectedClientId, 
    setSelectedClient 
  } = useRelationships();
  
  const { 
    activeNutritionPlanByUserId, 
    nutritionPlans 
  } = useMealPlans();
  
  const { 
    todayWorkoutByUserId, 
    wellnessByUserId 
  } = useFitness();

  const selectedClient = selectedClientId ? coachClients.find(c => c.id === selectedClientId) : null;

  return (
    <div className="min-h-screen bg-[#f0f7ff] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🎯 WiHY System Integration Demo</h1>
        
        {/* Role & Org Info */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">👤 Current Session</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Role:</span> {myRole === 'coach' ? '🧑‍🏫 Coach' : '💪 Client'}</p>
              <p><span className="font-medium">Total Clients:</span> {coachClients.length}</p>
            </div>
            <div>
              <p><span className="font-medium">Active Clients:</span> {coachClients.filter(c => c.status === 'active').length}</p>
              <p><span className="font-medium">Pending Clients:</span> {coachClients.filter(c => c.status === 'pending').length}</p>
            </div>
          </div>
        </div>

        {myRole === 'coach' && (
          <>
            {/* Client Selector */}
            <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">👥 Client Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coachClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client.id === selectedClientId ? null : client.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedClientId === client.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-800">{client.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        client.status === 'active' ? 'bg-green-100 text-green-700' :
                        client.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {client.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{client.email}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {client.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Client Dashboard */}
            {selectedClient && (
              <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  🎯 {selectedClient.name}'s Dashboard
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Nutrition Status */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                      🥗 Nutrition Plan
                    </h3>
                    {activeNutritionPlanByUserId[selectedClient.id] ? (
                      <div>
                        <p className="text-sm text-blue-700 font-medium">
                          {activeNutritionPlanByUserId[selectedClient.id].name}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Goals: {activeNutritionPlanByUserId[selectedClient.id].goals.join(', ')}
                        </p>
                        <p className="text-xs text-blue-600">
                          Meals: {activeNutritionPlanByUserId[selectedClient.id].mealPlan.meals.length}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-blue-600">No active nutrition plan</p>
                    )}
                  </div>

                  {/* Today's Workout */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-medium text-green-800 mb-3 flex items-center">
                      💪 Today's Workout
                    </h3>
                    {todayWorkoutByUserId[selectedClient.id] ? (
                      <div>
                        <p className="text-sm text-green-700 font-medium">
                          {todayWorkoutByUserId[selectedClient.id]?.name}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Status: {todayWorkoutByUserId[selectedClient.id]?.status}
                        </p>
                        <p className="text-xs text-green-600">
                          Duration: {todayWorkoutByUserId[selectedClient.id]?.totalDuration}min
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-green-600">No workout scheduled</p>
                    )}
                  </div>

                  {/* Wellness Score */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-medium text-purple-800 mb-3 flex items-center">
                      ⭐ Wellness Score
                    </h3>
                    {wellnessByUserId[selectedClient.id]?.[0] ? (
                      <div>
                        <p className="text-2xl font-bold text-purple-700">
                          {wellnessByUserId[selectedClient.id][0].overallScore}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          Energy: {wellnessByUserId[selectedClient.id][0].energy}/10
                        </p>
                        <p className="text-xs text-purple-600">
                          Sleep: {wellnessByUserId[selectedClient.id][0].sleep}hrs
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-purple-600">No wellness data</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* System Overview */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">🍽️ Nutrition Plans</h3>
              <p className="text-2xl font-bold text-orange-600">{nutritionPlans.length}</p>
              <p className="text-sm text-gray-600">Total plans</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">👥 Active Clients</h3>
              <p className="text-2xl font-bold text-green-600">{coachClients.filter(c => c.status === 'active').length}</p>
              <p className="text-sm text-gray-600">Ready to train</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">🎯 Selected Client</h3>
              <p className="text-sm font-medium text-gray-800">{selectedClient?.name || 'None selected'}</p>
              <p className="text-sm text-gray-600">{selectedClient ? 'Ready for coaching' : 'Select a client above'}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🚀 Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <a 
              href="/create-meals" 
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              🍽️ Create Meal Plan
            </a>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              💪 Create Workout
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              📊 View Progress
            </button>
            <button 
              onClick={() => setSelectedClient(selectedClientId ? null : coachClients[0]?.id)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              🔄 {selectedClient ? 'Deselect Client' : 'Select First Client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};