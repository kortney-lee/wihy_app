import DashboardCharts from '../charts/grids/DashboardCharts';
import { ChartType } from '../charts/chartTypes';

import React, { useState } from 'react';
import { useMealPlans } from '../../contexts/MealPlanContext';
import { useRelationships } from '../../contexts/RelationshipContext';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  store?: string;
  source: 'WIHY' | 'COACH' | 'USER';
  status: 'PLANNED' | 'PURCHASED';
  estimatedCaloriesPerServing?: number;
}

export interface ReceiptSummary {
  id: string;
  date: string;       // ISO or friendly
  store: string;
  type: 'FAST_FOOD' | 'GROCERY';
  itemsCount: number;
  totalCalories?: number;
  totalSpend?: number;
}

interface ConsumptionDashboardProps {
  period: 'day' | 'week' | 'month';
  onAnalyze: (userMessage: string, assistantMessage: string) => void;
  onUploadReceipt: () => void;
}

const ConsumptionDashboard: React.FC<ConsumptionDashboardProps> = ({
  period,
  onAnalyze,
  onUploadReceipt
}) => {
  const { shoppingList } = useMealPlans();
  const { selectedClientId, coachClients, myRole } = useRelationships();
  
  // Mock functions for properties that don't exist in context yet
  const updateShoppingItem = (id: string, updates: any) => console.log('Update item:', id, updates);
  const addShoppingItem = (item: any) => console.log('Add item:', item);
  const removeShoppingItem = (id: string) => console.log('Remove item:', id);
  
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'shopping' | 'receipts'>('summary');
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>(period);
  
  // Shopping list state filters and UI
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'WIHY' | 'COACH' | 'USER'>('ALL');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: '',
    store: '',
    estimatedCaloriesPerServing: ''
  });

  // Temporary mock data – you'll swap this for real API data later
  const mockTotals = {
    day:   { calories: 2150, target: 2300, meals: 4, items: 18 },
    week:  { calories: 14800, target: 16100, meals: 26, items: 120 },
    month: { calories: 62000, target: 69000, meals: 104, items: 480 }
  }[timeframe];

  // Filter shopping list by source (using mock data structure)
  const filteredShoppingList = (shoppingList || []).map(item => ({
    ...item,
    id: `${item.name}-${Math.random()}`,
    source: item.sources?.[0] || 'USER',
    status: 'PLANNED',
    store: 'Local Store',
    estimatedCaloriesPerServing: 100
  })).filter(item => 
    sourceFilter === 'ALL' || item.source === sourceFilter
  );

  const mockReceipts: ReceiptSummary[] = [
    { id: 'r1', date: '2025-11-30', store: "McDonald's", type: 'FAST_FOOD', itemsCount: 3, totalCalories: 1850, totalSpend: 18.75 },
    { id: 'r2', date: '2025-11-29', store: 'Walmart', type: 'GROCERY', itemsCount: 22, totalCalories: 5400, totalSpend: 96.40 }
  ];

  const handleAskWihyForList = () => {
    // Add WIHY generated items
    const wihyItems = [
      { name: 'Greek yogurt', quantity: 2, unit: 'containers', store: 'Kroger', source: 'WIHY' as const, status: 'PLANNED' as const, estimatedCaloriesPerServing: 150 },
      { name: 'Quinoa', quantity: 1, unit: 'bag', store: 'Whole Foods', source: 'WIHY' as const, status: 'PLANNED' as const, estimatedCaloriesPerServing: 220 },
      { name: 'Spinach', quantity: 1, unit: 'bunch', store: 'Kroger', source: 'WIHY' as const, status: 'PLANNED' as const, estimatedCaloriesPerServing: 25 }
    ];
    
    wihyItems.forEach(item => addShoppingItem(item));
    
    onAnalyze(
      'Generate a healthy shopping list based on my current goals.',
      'Generated personalized shopping suggestions based on your health goals and nutritional needs.'
    );
  };
  
  const handleImportCoachItems = () => {
    if (myRole === 'client' && selectedClientId) {
      const coachItems = [
        { name: 'Salmon fillet', quantity: 1, unit: 'lb', store: 'Fresh Market', source: 'COACH' as const, status: 'PLANNED' as const, estimatedCaloriesPerServing: 206 },
        { name: 'Sweet potato', quantity: 3, unit: 'pieces', store: 'Walmart', source: 'COACH' as const, status: 'PLANNED' as const, estimatedCaloriesPerServing: 112 }
      ];
      
      coachItems.forEach(item => addShoppingItem(item));
    }
  };
  
  const handleAddItem = () => {
    if (!newItem.name.trim()) return;
    
    const item = {
      name: newItem.name.trim(),
      quantity: newItem.quantity,
      unit: newItem.unit.trim() || undefined,
      store: newItem.store.trim() || undefined,
      source: 'USER' as const,
      status: 'PLANNED' as const,
      estimatedCaloriesPerServing: newItem.estimatedCaloriesPerServing ? parseInt(newItem.estimatedCaloriesPerServing) : undefined
    };
    
    addShoppingItem(item);
    setNewItem({ name: '', quantity: 1, unit: '', store: '', estimatedCaloriesPerServing: '' });
    setShowAddItemForm(false);
  };
  
  const handleToggleItemStatus = (id: string) => {
    // Since ShoppingListItem doesn't have id, this is a mock function
    console.log('Toggle item status for:', id);
  };
  
  const handleRemoveItem = (id: string) => {
    console.log('Remove item:', id);
    removeShoppingItem(id);
  };

  const handleAnalyzeReceipts = () => {
    onAnalyze(
      'Analyze my recent food receipts and show total calories and fast-food vs grocery breakdown.',
      'Analyzing your recent receipts to calculate total calories and categorize your trips.'
    );
  };

  const renderTimeframeSelector = () => (
    <div className="flex gap-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
      {(['day', 'week', 'month'] as const).map(tf => (
        <button
          key={tf}
          className={`px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-[15px] font-medium rounded-t-xl transition-all duration-200 relative leading-normal whitespace-nowrap min-h-[44px] touch-manipulation ${
            timeframe === tf
              ? 'bg-white text-gray-900 border border-gray-200 border-b-white -mb-px shadow-sm'
              : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          onClick={() => setTimeframe(tf)}
        >
          {tf === 'day' ? 'Today' : tf === 'week' ? 'This Week' : 'This Month'}
        </button>
      ))}
    </div>
  );

  const renderSummary = () => {
    // When showing trends (week/month), exclude card summaries - only show charts
    // When showing "Today", exclude trend charts - only show card summaries
    const periodExclusions = timeframe === 'day' 
      ? [
          ChartType.CALORIES_CHART,
          ChartType.NUTRITION_CHART,
          ChartType.HYDRATION_CHART
        ]
      : [
          ChartType.CALORIES,
          ChartType.HYDRATION,
          ChartType.NUTRITION_ANALYSIS,
          ChartType.NUTRITION_GRADE_BADGE,
          ChartType.VITAMIN_CONTENT,
          ChartType.DAILY_VALUE_PROGRESS,
          ChartType.NOVA_SCORE,
          ChartType.NUTRITION_TRACKING,
          ChartType.MACRONUTRIENTS
        ];

    return (
      <div className="flex flex-col gap-6">
        {/* Totals strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border-0 p-4 sm:p-5 shadow-sm transition-all duration-300 cursor-pointer">
            <div className="text-sm font-medium text-blue-800 mb-1">Total Calories</div>
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
              {mockTotals.calories.toLocaleString()} <span className="text-sm font-normal text-blue-600">kcal</span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Target {mockTotals.target.toLocaleString()} kcal
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border-0 p-4 sm:p-5 shadow-sm transition-all duration-300 cursor-pointer">
            <div className="text-sm font-medium text-green-800 mb-1">Meals Logged</div>
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">{mockTotals.meals}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl border-0 p-4 sm:p-5 shadow-sm transition-all duration-300 cursor-pointer">
            <div className="text-sm font-medium text-purple-800 mb-1">Items Logged</div>
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text text-transparent">{mockTotals.items}</div>
          </div>
        </div>

        {/* Charts – reuse existing nutrition layout */}
        <div>
          <DashboardCharts
            period={timeframe}
            maxCards={8}
            showAllCharts={true}
            excludeChartTypes={[
              ChartType.QUICK_INSIGHTS,
              ChartType.MEMBERS_CARD,
              ChartType.BMI_DOMAIN,
              ChartType.HEALTH_RISK,
              ChartType.HEALTH_SCORE,
              ChartType.CURRENT_WEIGHT,
              ChartType.WEIGHT_TREND,
              ChartType.ACTIVITY,
              ChartType.STEPS,
              ChartType.STEPS_CHART,
              ChartType.ACTIVE_MINUTES,
              ChartType.SLEEP,
              ChartType.BLOOD_PRESSURE,
              ChartType.HEART_RATE,
              ChartType.EXERCISE,
              ChartType.DOPAMINE,
              ChartType.MOOD_CHART,
              ChartType.RESEARCH_QUALITY,
              ChartType.PUBLICATION_TIMELINE,
              ChartType.STUDY_TYPE_DISTRIBUTION,
              ChartType.RESULT_QUALITY_PIE,
              ChartType.RESEARCH_EVIDENCE_QUALITY,
              ChartType.RESEARCH_STUDY_TYPE_DISTRIBUTION,
              ChartType.RESEARCH_PUBLICATION_TIMELINE,
              ChartType.BMI_BODY_FAT,
              ChartType.SLEEP_CHART,
              ChartType.HEALTH_RISK_CHART,
              ChartType.NUTRITION_TRACKING_CHART,
              ChartType.NUTRITION,
              ...periodExclusions
            ]}
            onAnalyze={onAnalyze}
          />
        </div>
      </div>
    );
  };

  const renderShoppingList = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 lg:gap-6">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">Meal & Grocery Planning</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Combine WIHY suggestions, coach plans, and your own items into one smart list.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="inline-block border-2 border-transparent rounded-full relative overflow-hidden" style={{
            background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
            backgroundSize: '100% 100%, 200% 100%',
            animation: 'wiH-border-sweep 2.2s linear infinite'
          }}>
            <style>{`
              @keyframes wiH-border-sweep {
                0% { background-position: 0% 0%, 0% 0%; }
                100% { background-position: 0% 0%, 200% 0%; }
              }
            `}</style>
            <button 
              className="bg-white text-black font-semibold px-6 sm:px-8 py-3 text-sm rounded-full transition-all duration-200 whitespace-nowrap min-h-[44px] touch-manipulation" 
              onClick={handleAskWihyForList}
            >
              Build my shopping list
            </button>
          </div>
          <button 
            onClick={handleImportCoachItems}
            className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-white to-gray-50 text-gray-700 border border-gray-300 rounded-full hover:from-gray-50 hover:to-gray-100 transition-all duration-200 font-medium text-sm min-h-[44px] touch-manipulation"
          >
            Import coach plan items
          </button>
          <button 
            onClick={() => setShowAddItemForm(true)}
            className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-white to-gray-50 text-gray-700 border border-gray-300 rounded-full hover:from-gray-50 hover:to-gray-100 transition-all duration-200 font-medium text-sm min-h-[44px] touch-manipulation"
          >
            Add item
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-sm font-medium text-gray-700">Source:</span>
        <button 
          onClick={() => setSourceFilter('ALL')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 min-h-[44px] touch-manipulation ${
            sourceFilter === 'ALL' 
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button 
          onClick={() => setSourceFilter('WIHY')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 min-h-[44px] touch-manipulation ${
            sourceFilter === 'WIHY'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          WIHY
        </button>
        <button 
          onClick={() => setSourceFilter('COACH')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 min-h-[44px] touch-manipulation ${
            sourceFilter === 'COACH'
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          Coach
        </button>
        <button 
          onClick={() => setSourceFilter('USER')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 min-h-[44px] touch-manipulation ${
            sourceFilter === 'USER'
              ? 'bg-gray-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          My Items
        </button>
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Store</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Source</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Est. kcal / serving</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredShoppingList.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {sourceFilter === 'ALL' 
                    ? 'No items in your shopping list yet. Add some items to get started!' 
                    : `No ${sourceFilter.toLowerCase()} items found.`}
                </td>
              </tr>
            ) : (
              filteredShoppingList.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.quantity} {item.unit}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.store || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.source === 'WIHY' ? 'bg-blue-100 text-blue-800' :
                    item.source === 'COACH' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.source === 'WIHY' ? 'WIHY AI' :
                     item.source === 'COACH' ? 'Coach' : 'User'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.estimatedCaloriesPerServing ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.status === 'PLANNED' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.status === 'PLANNED' ? 'Planned' : 'Purchased'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleItemStatus(item.id)}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                        item.status === 'PLANNED'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      {item.status === 'PLANNED' ? 'Mark Purchased' : 'Mark Planned'}
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
      
      {/* Add Item Modal */}
      {showAddItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Item</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter item name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="lb, oz, ct, etc."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                <input
                  type="text"
                  value={newItem.store}
                  onChange={(e) => setNewItem(prev => ({ ...prev, store: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Walmart, Kroger, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Est. Calories per Serving</label>
                <input
                  type="number"
                  min="0"
                  value={newItem.estimatedCaloriesPerServing}
                  onChange={(e) => setNewItem(prev => ({ ...prev, estimatedCaloriesPerServing: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddItemForm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderReceipts = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 lg:gap-6">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">Food Purchases & Receipts</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Track grocery and fast-food purchases and convert receipts into intake.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-white to-gray-50 text-gray-700 border border-gray-300 rounded-full hover:from-gray-50 hover:to-gray-100 transition-all duration-200 font-medium text-sm min-h-[44px] touch-manipulation" onClick={onUploadReceipt}>
            Upload receipt
          </button>
          <div className="inline-block border-2 border-transparent rounded-full relative overflow-hidden" style={{
            background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
            backgroundSize: '100% 100%, 200% 100%',
            animation: 'wiH-border-sweep 2.2s linear infinite'
          }}>
            <style>{`
              @keyframes wiH-border-sweep {
                0% { background-position: 0% 0%, 0% 0%; }
                100% { background-position: 0% 0%, 200% 0%; }
              }
            `}</style>
            <button 
              className="bg-white text-black font-semibold px-6 sm:px-8 py-3 text-sm rounded-full transition-all duration-200 whitespace-nowrap min-h-[44px] touch-manipulation" 
              onClick={handleAnalyzeReceipts}
            >
              Analyze my purchases
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Store</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Items</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total kcal</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockReceipts.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">{r.date}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.store}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.type === 'FAST_FOOD' ? 'Fast food' : 'Grocery'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.itemsCount}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.totalCalories?.toLocaleString() ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.totalSpend != null ? `$${r.totalSpend.toFixed(2)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <p className="text-sm sm:text-base text-gray-600 italic">
        You'll be able to tap into a receipt to see each item, match it with known products,
        and convert those into meals and total calories.
      </p>
    </div>
  );

  return (
    <div className="w-full h-full bg-[#f0f7ff] overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 border-b border-gray-200 pb-0">
            <div className="flex gap-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
            <button
              className={`px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-[15px] font-medium rounded-t-xl transition-all duration-200 relative leading-normal whitespace-nowrap min-h-[44px] touch-manipulation ${
                activeSubTab === 'summary'
                  ? 'bg-white text-gray-900 border border-gray-200 border-b-white -mb-px shadow-sm'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveSubTab('summary')}
            >
              Daily Intake
            </button>
            <button
              className={`px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-[15px] font-medium rounded-t-xl transition-all duration-200 relative leading-normal whitespace-nowrap min-h-[44px] touch-manipulation ${
                activeSubTab === 'shopping'
                  ? 'bg-white text-gray-900 border border-gray-200 border-b-white -mb-px shadow-sm'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveSubTab('shopping')}
            >
              Meal & Grocery Planning
            </button>
            <button
              className={`px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-[15px] font-medium rounded-t-xl transition-all duration-200 relative leading-normal whitespace-nowrap min-h-[44px] touch-manipulation ${
                activeSubTab === 'receipts'
                  ? 'bg-white text-gray-900 border border-gray-200 border-b-white -mb-px shadow-sm'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveSubTab('receipts')}
            >
              Purchases & Receipts
            </button>
          </div>
          
          <div className="flex-shrink-0">
            {renderTimeframeSelector()}
          </div>
        </div>

          <div className="mt-3 sm:mt-4">
            {activeSubTab === 'summary' && renderSummary()}
            {activeSubTab === 'shopping' && renderShoppingList()}
            {activeSubTab === 'receipts' && renderReceipts()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsumptionDashboard;
