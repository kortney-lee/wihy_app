import React, { useState } from 'react';
import DashboardCharts from '../charts/grids/DashboardCharts';
import { ChartType } from '../charts/chartTypes';

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
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'shopping' | 'receipts'>('summary');
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>(period);

  // Temporary mock data – you'll swap this for real API data later
  const mockTotals = {
    day:   { calories: 2150, target: 2300, meals: 4, items: 18 },
    week:  { calories: 14800, target: 16100, meals: 26, items: 120 },
    month: { calories: 62000, target: 69000, meals: 104, items: 480 }
  }[timeframe];

  const mockShoppingList: ShoppingListItem[] = [
    { id: '1', name: 'Chicken breast', quantity: 2, unit: 'lb', store: 'Aldi', source: 'WIHY', status: 'PLANNED', estimatedCaloriesPerServing: 165 },
    { id: '2', name: 'Brown rice', quantity: 1, unit: 'bag', store: 'Walmart', source: 'COACH', status: 'PLANNED', estimatedCaloriesPerServing: 215 },
    { id: '3', name: 'Apples', quantity: 6, unit: 'ct', store: 'Aldi', source: 'USER', status: 'PURCHASED', estimatedCaloriesPerServing: 95 }
  ];

  const mockReceipts: ReceiptSummary[] = [
    { id: 'r1', date: '2025-11-30', store: "McDonald's", type: 'FAST_FOOD', itemsCount: 3, totalCalories: 1850, totalSpend: 18.75 },
    { id: 'r2', date: '2025-11-29', store: 'Walmart', type: 'GROCERY', itemsCount: 22, totalCalories: 5400, totalSpend: 96.40 }
  ];

  const handleAskWihyForList = () => {
    onAnalyze(
      'Generate a healthy shopping list based on my current goals.',
      'Opening WIHY to generate a smart shopping list using your health goals and recent intake.'
    );
  };

  const handleAnalyzeReceipts = () => {
    onAnalyze(
      'Analyze my recent food receipts and show total calories and fast-food vs grocery breakdown.',
      'Analyzing your recent receipts to calculate total calories and categorize your trips.'
    );
  };

  const renderTimeframeSelector = () => (
    <div className="flex gap-2 bg-gray-100 p-1 rounded-full">
      {(['day', 'week', 'month'] as const).map(tf => (
        <button
          key={tf}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
            timeframe === tf
              ? 'bg-white text-gray-900 shadow-sm'
              : 'bg-transparent text-gray-600 hover:text-gray-900'
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
        <div className="flex gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Total Calories</div>
            <div className="text-2xl font-semibold text-gray-900">
              {mockTotals.calories.toLocaleString()} <span className="text-sm font-normal text-gray-600">kcal</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Target {mockTotals.target.toLocaleString()} kcal
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Meals Logged</div>
            <div className="text-2xl font-semibold text-gray-900">{mockTotals.meals}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Items Logged</div>
            <div className="text-2xl font-semibold text-gray-900">{mockTotals.items}</div>
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
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Shopping List Manager</h2>
          <p className="text-sm text-gray-600">
            Combine WIHY AI, coach plans, and your own items into one unified list.
          </p>
        </div>
        <div className="flex gap-3">
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
              className="bg-white text-black font-semibold px-8 py-3 text-sm rounded-full transition-all duration-200 whitespace-nowrap" 
              onClick={handleAskWihyForList}
            >
              Ask WIHY to build my list
            </button>
          </div>
          <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-sm">
            Import coach plan items
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-sm">
            Add item
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Source:</span>
        <button className="px-3 py-1 text-sm rounded-full bg-gray-900 text-white">All</button>
        <button className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">WIHY</button>
        <button className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Coach</button>
        <button className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">My Items</button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Store</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Source</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Est. kcal / serving</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockShoppingList.map(item => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReceipts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Trips & Receipts</h2>
          <p className="text-sm text-gray-600">
            Track fast food runs and grocery trips, and convert receipts into logged intake.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-sm" onClick={onUploadReceipt}>
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
              className="bg-white text-black font-semibold px-8 py-3 text-sm rounded-full transition-all duration-200 whitespace-nowrap" 
              onClick={handleAnalyzeReceipts}
            >
              Analyze my receipts with WIHY
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
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

      <p className="text-sm text-gray-600 italic">
        You'll be able to tap into a receipt to see each item, match it with known products,
        and convert those into meals and total calories.
      </p>
    </div>
  );

  return (
    <div className="p-5 max-w-full overflow-x-hidden">
      <div className="flex flex-col items-center text-center gap-6 mb-6">
        {renderTimeframeSelector()}
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto overflow-y-hidden scrollbar-hide">
        <button
          className={`px-6 py-4 text-[15px] font-medium rounded-t-lg transition-all duration-200 relative leading-normal whitespace-nowrap ${
            activeSubTab === 'summary'
              ? 'bg-white text-gray-900 border border-gray-200 border-b-white -mb-px'
              : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          onClick={() => setActiveSubTab('summary')}
        >
          Intake summary
        </button>
        <button
          className={`px-6 py-4 text-[15px] font-medium rounded-t-lg transition-all duration-200 relative leading-normal whitespace-nowrap ${
            activeSubTab === 'shopping'
              ? 'bg-white text-gray-900 border border-gray-200 border-b-white -mb-px'
              : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          onClick={() => setActiveSubTab('shopping')}
        >
          Shopping list
        </button>
        <button
          className={`px-6 py-4 text-[15px] font-medium rounded-t-lg transition-all duration-200 relative leading-normal whitespace-nowrap ${
            activeSubTab === 'receipts'
              ? 'bg-white text-gray-900 border border-gray-200 border-b-white -mb-px'
              : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          onClick={() => setActiveSubTab('receipts')}
        >
          Trips & receipts
        </button>
      </div>

      <div className="mt-6">
        {activeSubTab === 'summary' && renderSummary()}
        {activeSubTab === 'shopping' && renderShoppingList()}
        {activeSubTab === 'receipts' && renderReceipts()}
      </div>
    </div>
  );
};

export default ConsumptionDashboard;
