import React, { useState } from 'react';
import DashboardCharts from '../charts/grids/DashboardCharts';
import { ChartType } from '../charts/chartTypes';
import '../../styles/consumption.css';

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
    <div className="consumption-timeframe-toggle">
      {(['day', 'week', 'month'] as const).map(tf => (
        <button
          key={tf}
          className={`consumption-timeframe-btn ${timeframe === tf ? 'active' : ''}`}
          onClick={() => setTimeframe(tf)}
        >
          {tf === 'day' ? 'Today' : tf === 'week' ? 'This Week' : 'This Month'}
        </button>
      ))}
    </div>
  );

  const renderSummary = () => (
    <div className="consumption-summary-grid">
      {/* Totals strip */}
      <div className="consumption-summary-strip">
        <div className="summary-card">
          <div className="summary-label">Total Calories</div>
          <div className="summary-value">
            {mockTotals.calories.toLocaleString()} <span className="summary-unit">kcal</span>
          </div>
          <div className="summary-sub">
            Target {mockTotals.target.toLocaleString()} kcal
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Meals Logged</div>
          <div className="summary-value">{mockTotals.meals}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Items Logged</div>
          <div className="summary-value">{mockTotals.items}</div>
        </div>
      </div>

      {/* Charts – reuse existing nutrition layout */}
      <div className="consumption-charts-section">
        <DashboardCharts
          period={timeframe}
          maxCards={8}
          showAllCharts={true}
          // In the chartTypes config, you can make sure these are all nutrition/consumption related
          excludeChartTypes={[ChartType.QUICK_INSIGHTS]}
          isNutritionLayout={true}
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );

  const renderShoppingList = () => (
    <div className="consumption-shopping-layout">
      <div className="consumption-shopping-header">
        <div>
          <h2>Shopping List Manager</h2>
          <p className="consumption-subtext">
            Combine WIHY AI, coach plans, and your own items into one unified list.
          </p>
        </div>
        <div className="consumption-shopping-actions">
          <button className="search-btn primary" onClick={handleAskWihyForList}>
            Ask WIHY to build my list
          </button>
          <button className="search-btn secondary">
            Import coach plan items
          </button>
          <button className="search-btn secondary">
            Add item
          </button>
        </div>
      </div>

      <div className="consumption-shopping-filters">
        <span className="filter-label">Source:</span>
        <button className="chip chip-active">All</button>
        <button className="chip">WIHY</button>
        <button className="chip">Coach</button>
        <button className="chip">My Items</button>
      </div>

      <div className="consumption-table-wrapper">
        <table className="consumption-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Store</th>
              <th>Source</th>
              <th>Est. kcal / serving</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockShoppingList.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantity} {item.unit}</td>
                <td>{item.store || '—'}</td>
                <td>
                  <span className={`badge badge-${item.source.toLowerCase()}`}>
                    {item.source === 'WIHY' ? 'WIHY AI' :
                     item.source === 'COACH' ? 'Coach' : 'User'}
                  </span>
                </td>
                <td>{item.estimatedCaloriesPerServing ?? '—'}</td>
                <td>
                  <span className={`status-pill status-${item.status.toLowerCase()}`}>
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
    <div className="consumption-receipts-layout">
      <div className="consumption-receipts-header">
        <div>
          <h2>Trips & Receipts</h2>
          <p className="consumption-subtext">
            Track fast food runs and grocery trips, and convert receipts into logged intake.
          </p>
        </div>
        <div className="consumption-receipts-actions">
          <button className="search-btn primary" onClick={onUploadReceipt}>
            Upload receipt
          </button>
          <button className="search-btn secondary" onClick={handleAnalyzeReceipts}>
            Analyze my receipts with WIHY
          </button>
        </div>
      </div>

      <div className="consumption-table-wrapper">
        <table className="consumption-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Store</th>
              <th>Type</th>
              <th>Items</th>
              <th>Total kcal</th>
              <th>Total spend</th>
            </tr>
          </thead>
          <tbody>
            {mockReceipts.map(r => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>{r.store}</td>
                <td>{r.type === 'FAST_FOOD' ? 'Fast food' : 'Grocery'}</td>
                <td>{r.itemsCount}</td>
                <td>{r.totalCalories?.toLocaleString() ?? '—'}</td>
                <td>{r.totalSpend != null ? `$${r.totalSpend.toFixed(2)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="consumption-hint">
        You'll be able to tap into a receipt to see each item, match it with known products,
        and convert those into meals and total calories.
      </p>
    </div>
  );

  return (
    <div className="consumption-dashboard">
      <div className="consumption-dashboard-header">
        <div>
          <h1>Consumption & Shopping</h1>
          <p className="consumption-subtext">
            See how much you actually eat, where it comes from, and keep your shopping organized.
          </p>
        </div>
        {renderTimeframeSelector()}
      </div>

      <div className="consumption-subtabs">
        <button
          className={`subtab-btn ${activeSubTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('summary')}
        >
          Intake summary
        </button>
        <button
          className={`subtab-btn ${activeSubTab === 'shopping' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('shopping')}
        >
          Shopping list
        </button>
        <button
          className={`subtab-btn ${activeSubTab === 'receipts' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('receipts')}
        >
          Trips & receipts
        </button>
      </div>

      <div className="consumption-content">
        {activeSubTab === 'summary' && renderSummary()}
        {activeSubTab === 'shopping' && renderShoppingList()}
        {activeSubTab === 'receipts' && renderReceipts()}
      </div>
    </div>
  );
};

export default ConsumptionDashboard;
