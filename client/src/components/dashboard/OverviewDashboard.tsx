// src/components/dashboard/OverviewDashboard.tsx
import React, { useState } from "react";
import DashboardCharts from "../charts/grids/DashboardCharts";
import { ChartType, getChartTypesByTab } from "../charts/chartTypes";
import QuickInsights from "../charts/cards/QuickInsights";
import HealthRiskChart from "../charts/individual/HealthRiskChart";
import NutritionAnalysisCard from "../charts/individual/NutritionAnalysisCard";
import NovaChart from "../charts/cards/NovaChart";

interface OverviewDashboardProps {
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

type OverviewTab = "summary" | "insights" | "wellness" | "trends";

/**
 * Build an exclude list so DashboardCharts only shows charts
 * that belong to a given tabView ("insights" or "wellness").
 */
const buildExclusionsForTab = (
  tabKey: "insights" | "wellness"
): ChartType[] => {
  const configs = getChartTypesByTab(tabKey);
  const typesForTab = configs.map((c) => c.type);

  const excludes: ChartType[] = [ChartType.QUICK_INSIGHTS];

  (Object.values(ChartType) as ChartType[]).forEach((ct) => {
    if (!typesForTab.includes(ct) && ct !== ChartType.QUICK_INSIGHTS) {
      excludes.push(ct);
    }
  });

  return excludes;
};

// Precompute these once
const INSIGHTS_EXCLUDES = buildExclusionsForTab("insights");
const WELLNESS_EXCLUDES = buildExclusionsForTab("wellness");

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onAnalyze }) => {
  const [viewTab, setViewTab] = useState<OverviewTab>("summary");
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week");

  const renderViewTabs = () => (
    <div className="mt-3 flex gap-2 bg-gray-100 p-1 rounded-full">
      {(["summary", "insights", "wellness", "trends"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setViewTab(tab)}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
            viewTab === tab
              ? "bg-white text-gray-900 shadow-sm"
              : "bg-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          {tab === "summary"
            ? "Summary"
            : tab === "insights"
            ? "Insights"
            : tab === "wellness"
            ? "Wellness"
            : "Trends"}
        </button>
      ))}
    </div>
  );

  const renderTimeframeSelector = () => (
    <div className="flex gap-2 bg-gray-100 p-1 rounded-full">
      {(["day", "week", "month"] as const).map((tf) => (
        <button
          key={tf}
          className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 ${
            timeframe === tf
              ? "bg-white text-gray-900 shadow-sm"
              : "bg-transparent text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setTimeframe(tf)}
        >
          {tf === "day" ? "Today" : tf === "week" ? "This Week" : "This Month"}
        </button>
      ))}
    </div>
  );

  // For the general Trends tab only (health/activity trends)
  const periodExclusions =
    timeframe === "day"
      ? [
          ChartType.CALORIES_CHART,
          ChartType.NUTRITION_CHART,
          ChartType.HYDRATION_CHART,
        ]
      : [
          ChartType.CALORIES,
          ChartType.HYDRATION,
          ChartType.NUTRITION_GRADE_BADGE,
          ChartType.VITAMIN_CONTENT,
          ChartType.DAILY_VALUE_PROGRESS,
          ChartType.NUTRITION_TRACKING,
          ChartType.MACRONUTRIENTS,
        ];

  const renderSummary = () => (
    <section className="max-w-6xl mx-auto pt-4 pb-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: Quick Insights - displayed as a card */}
        <QuickInsights />

        {/* Right: Health Risk Assessment - Risk Factors chart */}
        <HealthRiskChart 
          period="week"
          chartType="risk-factors"
          title="Health Risk Assessment - Risk Factors"
          showLabels={true}
          onAnalyze={onAnalyze}
        />
      </div>
    </section>
  );

  const renderInsights = () => (
    <section className="max-w-6xl mx-auto pt-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 px-1">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Mind &amp; Behavior Insights
          </h2>
          <p className="text-[11px] text-gray-500">
            Patterns in habits, timing, triggers, and behavior over time.
          </p>
        </div>
        {renderTimeframeSelector()}
      </div>

      <DashboardCharts
        period={timeframe}
        maxCards={20}
        showAllCharts={true}
        excludeChartTypes={INSIGHTS_EXCLUDES}
        isInsightsLayout={true}
        onAnalyze={onAnalyze}
      />
    </section>
  );

  const renderWellness = () => (
    <section className="max-w-6xl mx-auto pt-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 px-1">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Wellness &amp; Recovery
          </h2>
          <p className="text-[11px] text-gray-500">
            Sleep, recovery, stress, and overall well-being trends.
          </p>
        </div>
        {renderTimeframeSelector()}
      </div>

      <DashboardCharts
        period={timeframe}
        maxCards={20}
        showAllCharts={true}
        excludeChartTypes={WELLNESS_EXCLUDES}
        onAnalyze={onAnalyze}
      />
    </section>
  );

  const renderTrends = () => (
    <section className="max-w-6xl mx-auto pt-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 px-1">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Health & Activity Trends
          </h2>
          <p className="text-[11px] text-gray-500">
            Long-term patterns in blood pressure, weight, BMI and body fat,
            steps and activity, heart rate, and sleep.
          </p>
        </div>
        {renderTimeframeSelector()}
      </div>

      {/* Nutrition Analysis and NOVA Score side by side */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <NutritionAnalysisCard onAnalyze={onAnalyze} />
        <NovaChart onAnalyze={onAnalyze} />
      </div>

      {/* Other trend charts */}
      <DashboardCharts
        period={timeframe}
        maxCards={20}
        showAllCharts={true}
        excludeChartTypes={[
          // Research-only visuals
          ChartType.MEMBERS_CARD,
          ChartType.RESEARCH_QUALITY,
          ChartType.PUBLICATION_TIMELINE,
          ChartType.STUDY_TYPE_DISTRIBUTION,
          ChartType.RESULT_QUALITY_PIE,
          ChartType.RESEARCH_EVIDENCE_QUALITY,
          ChartType.RESEARCH_STUDY_TYPE_DISTRIBUTION,
          ChartType.RESEARCH_PUBLICATION_TIMELINE,
          ChartType.QUICK_INSIGHTS,
          // Wellness-only cards
          ChartType.HEALTH_SCORE,
          ChartType.BMI_DOMAIN,
          ChartType.HEALTH_RISK,
          ChartType.CURRENT_WEIGHT,
          ChartType.EXERCISE,
          ChartType.STEPS_CHART,
          ChartType.STEPS,
          ChartType.ACTIVE_MINUTES,
          ChartType.SLEEP,
          // Insights/Consumption-only cards
          ChartType.NUTRITION_TRACKING,
          ChartType.NUTRITION_TRACKING_CHART,
          ChartType.MOOD_CHART,
          ChartType.DOPAMINE,
          ChartType.HEALTH_RISK_CHART,
          // Nutrition cards now rendered explicitly above
          ChartType.NUTRITION_ANALYSIS,
          ChartType.NUTRITION,
          ChartType.NOVA_SCORE,
          ...periodExclusions,
        ]}
        onAnalyze={onAnalyze}
      />

      <p className="mt-3 text-[11px] text-gray-500 px-1">
        Trend charts will appear where we have enough data from connected
        devices or manual tracking. Some users may not have all trend lines if
        mobile or wearable data is missing.
      </p>
    </section>
  );

  return (
    <div className="w-full bg-[#f0f7ff] min-h-[70vh] px-2 sm:px-4 pb-8 overflow-x-hidden">
      {/* Page header */}
      <header className="flex flex-col items-center text-center gap-2 pt-5 pb-3">
        {renderViewTabs()}
      </header>

      {viewTab === "summary" && renderSummary()}
      {viewTab === "insights" && renderInsights()}
      {viewTab === "wellness" && renderWellness()}
      {viewTab === "trends" && renderTrends()}
    </div>
  );
};

export default OverviewDashboard;
