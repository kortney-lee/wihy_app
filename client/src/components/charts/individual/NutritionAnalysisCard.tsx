import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

ChartJS.register(ArcElement, Tooltip, Legend);

/* ================= Converted to use Tailwind CSS ================= */

/* ================= Card shell ================= */

function CardShell({
  title = "",
  children,
  height,
}: {
  title?: string;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <section className={`flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md overflow-hidden ${height ? '' : 'h-[420px]'}`} style={height ? { height } : {}}>
      <h3 className="m-0 mb-5 text-xl font-semibold text-gray-400">{title}</h3>
      <div className="flex-1 overflow-hidden min-h-0">{children}</div>
    </section>
  );
}

interface NutritionAnalysisCardProps {
  data?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    goals?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
  };
  height?: number;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const NutritionAnalysisCard: React.FC<NutritionAnalysisCardProps> = ({ data, height, onAnalyze }) => {
  const nutrition = {
    calories: data?.calories || 1850,
    protein: data?.protein || 125,
    carbs: data?.carbs || 200,
    fat: data?.fat || 65,
    fiber: data?.fiber || 28,
    sugar: data?.sugar || 45,
    sodium: data?.sodium || 1800
  };

  const goals = {
    calories: data?.goals?.calories || 2000,
    protein: data?.goals?.protein || 150,
    carbs: data?.goals?.carbs || 250,
    fat: data?.goals?.fat || 67
  };

  // Calculate percentage of goals met
  const _getProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const macros = [
    {
      name: 'Calories',
      current: nutrition.calories,
      goal: goals.calories,
      unit: 'kcal',
      color: '#3b82f6'
    },
    {
      name: 'Protein',
      current: nutrition.protein,
      goal: goals.protein,
      unit: 'g',
      color: '#10b981'
    },
    {
      name: 'Carbs',
      current: nutrition.carbs,
      goal: goals.carbs,
      unit: 'g',
      color: '#f59e0b'
    },
    {
      name: 'Fat',
      current: nutrition.fat,
      goal: goals.fat,
      unit: 'g',
      color: '#ef4444'
    }
  ];

  const doughnutData = {
    labels: macros.map((m) => m.name),
    datasets: [
      {
        data: macros.map((m) => m.current),
        backgroundColor: macros.map((m) => m.color),
        borderWidth: 0,
        cutout: "70%",
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (ctx: any) => {
            const label = ctx.label || "";
            const value = ctx.parsed ?? 0;
            const macro = macros[ctx.dataIndex];
            const unit = macro?.unit ?? "";
            const goal = macro?.goal ?? 0;
            return `${label}: ${value}${unit} / ${goal}${unit}`;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 h-[420px] overflow-hidden text-center">
      <h3 className="text-xl font-semibold text-gray-400 mb-1">
        Nutrition Analysis
      </h3>
      <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
        Your daily macronutrient breakdown and progress toward nutritional goals.
      </p>

      {/* Main content: horizontal layout with chart on left, legend on right */}
      <div className="flex flex-row items-center justify-center gap-6 flex-1 overflow-hidden min-h-0">
        {/* Chart on the left */}
        <div className="relative w-full h-full max-w-[240px] max-h-[240px] flex-shrink-0 overflow-hidden">
          <Doughnut data={doughnutData} options={options} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-3xl font-bold text-gray-800 leading-none overflow-hidden">
              {nutrition.calories}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">
              kcal today
            </div>
          </div>
        </div>

        {/* Legend / details on the right */}
        <div className="flex flex-col justify-center space-y-3">
          {macros.map((macro, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm gap-3"
            >
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                  style={{ backgroundColor: macro.color }}
                />
                <span className="font-medium text-gray-700 whitespace-nowrap">
                  {macro.name}
                </span>
                <span className="text-gray-500 ml-1">
                  — {macro.current}{macro.unit}
                </span>
              </div>
              <span className="font-semibold text-gray-700 ml-4">
                {Math.round((macro.current / macro.goal) * 100)}%
              </span>
            </div>
          ))}

          {/* Additional nutrients summary */}
          <div className="pt-3 border-t border-gray-200 space-y-1 text-xs text-gray-600">
            <div>Fiber: {nutrition.fiber}g • Sugar: {nutrition.sugar}g</div>
            <div>Sodium: {nutrition.sodium}mg</div>
            <div className={`font-semibold ${goals.calories - nutrition.calories >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {goals.calories - nutrition.calories} kcal remaining
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-4 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Nutrition Analysis: Consumed ${nutrition.calories} kcal (goal: ${goals.calories}), Protein: ${nutrition.protein}g (goal: ${goals.protein}g), Carbs: ${nutrition.carbs}g (goal: ${goals.carbs}g), Fat: ${nutrition.fat}g (goal: ${goals.fat}g), Fiber: ${nutrition.fiber}g, Sugar: ${nutrition.sugar}g, Sodium: ${nutrition.sodium}mg. Calories remaining: ${goals.calories - nutrition.calories}. Protein percentage: ${Math.round((nutrition.protein * 4 / nutrition.calories) * 100)}%.`}
          userQuery="Analyze my detailed nutrition intake and provide insights about my macronutrient balance, goal progress, and dietary recommendations"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default NutritionAnalysisCard;