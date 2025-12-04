import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { UnifiedResponse } from "../../../services/wihyAPI";
import AnalyzeWithWihyButton from "../shared/AnalyzeWithWihyButton";
import "../../../styles/charts.css";

ChartJS.register(ArcElement, Tooltip, Legend);

interface NovaChartProps {
  apiResponse?: UnifiedResponse | any;
  query?: string;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

type NovaDistribution = {
  nova1: number;
  nova2: number;
  nova3: number;
  nova4: number;
};

type PersonalNovaData = {
  sourceType: "personal_nova_chart" | "personal_nova" | "fallback";
  novaScore: number; // 1–4
  distribution: NovaDistribution;
  sampleCount?: number;
  description?: string;
};

// Helper: normalize distribution to ensure it sums to 100
const normalizeDistribution = (dist: NovaDistribution): NovaDistribution => {
  const total =
    (dist.nova1 || 0) +
    (dist.nova2 || 0) +
    (dist.nova3 || 0) +
    (dist.nova4 || 0);

  if (!total || total <= 0) {
    return {
      nova1: 25,
      nova2: 25,
      nova3: 25,
      nova4: 25,
    };
  }

  return {
    nova1: (dist.nova1 / total) * 100,
    nova2: (dist.nova2 / total) * 100,
    nova3: (dist.nova3 / total) * 100,
    nova4: (dist.nova4 / total) * 100,
  };
};

// Extract personal NOVA (daily) data from unified API response
const extractPersonalNovaData = (
  apiResponse?: UnifiedResponse | any
): PersonalNovaData => {
  console.log("=== EXTRACTING PERSONAL NOVA DATA FROM API ===");
  console.log("API Response:", apiResponse);

  if (apiResponse && apiResponse.success && apiResponse.data) {
    const data = apiResponse.data;

    // 1) charts_data.personal_nova_chart (preferred if present)
    if (data.charts_data?.personal_nova_chart) {
      const chart = data.charts_data.personal_nova_chart;

      const distribution: NovaDistribution = normalizeDistribution({
        nova1: chart.nova_distribution?.nova1 ?? chart.nova1 ?? 0,
        nova2: chart.nova_distribution?.nova2 ?? chart.nova2 ?? 0,
        nova3: chart.nova_distribution?.nova3 ?? chart.nova3 ?? 0,
        nova4: chart.nova_distribution?.nova4 ?? chart.nova4 ?? 0,
      });

      const extracted: PersonalNovaData = {
        sourceType: "personal_nova_chart",
        novaScore: chart.daily_nova_score ?? chart.nova_score ?? 3,
        distribution,
        sampleCount: chart.sample_count,
        description: chart.description,
      };

      console.log("Extracted from charts_data.personal_nova_chart:", extracted);
      return extracted;
    }

    // 2) data.personal_nova (more generic personal NOVA block)
    if (data.personal_nova) {
      const pn = data.personal_nova;

      const distribution: NovaDistribution = normalizeDistribution({
        nova1: pn.nova_distribution?.nova1 ?? 0,
        nova2: pn.nova_distribution?.nova2 ?? 0,
        nova3: pn.nova_distribution?.nova3 ?? 0,
        nova4: pn.nova_distribution?.nova4 ?? 0,
      });

      const extracted: PersonalNovaData = {
        sourceType: "personal_nova",
        novaScore: pn.daily_nova_score ?? pn.nova_score ?? 3,
        distribution,
        sampleCount: pn.sample_count,
        description: pn.description,
      };

      console.log("Extracted from data.personal_nova:", extracted);
      return extracted;
    }
  }

  // 3) Fallback sample data if nothing available
  console.log("No personal NOVA data available, using fallback sample data");
  return {
    sourceType: "fallback",
    novaScore: 3,
    distribution: normalizeDistribution({
      nova1: 20,
      nova2: 30,
      nova3: 30,
      nova4: 20,
    }),
    sampleCount: 10,
    description:
      "Sample data: a mixed day with a balance of minimally processed and ultra-processed foods.",
  };
};

// Generate a simple English summary based on score & distribution
const getNovaSummary = (novaScore: number, dist: NovaDistribution): string => {
  const upfShare = dist.nova4;
  const wholeShare = dist.nova1;

  if (novaScore <= 1.5 || wholeShare >= 60) {
    return "Your day was dominated by minimally processed, whole foods.";
  }

  if (novaScore <= 2.5 && upfShare < 25) {
    return "You had a generally balanced day with some processed foods but not many ultra-processed ones.";
  }

  if (novaScore <= 3.5 && upfShare >= 25 && upfShare < 50) {
    return "A significant portion of your day came from processed and ultra-processed foods.";
  }

  if (novaScore > 3.5 || upfShare >= 50) {
    return "Most of today's intake came from ultra-processed foods.";
  }

  return "Your daily NOVA profile shows a mix of whole, processed, and ultra-processed foods.";
};

const NovaChart: React.FC<NovaChartProps> = ({
  apiResponse,
  query,
  onAnalyze,
}) => {
  const personalNova = extractPersonalNovaData(apiResponse);

  const { novaScore, distribution, sampleCount, description } = personalNova;

  const novaColors = {
    1: "#10B981", // Green - Minimally processed
    2: "#F59E0B", // Yellow - Processed culinary ingredients
    3: "#F97316", // Orange - Processed foods
    4: "#EF4444", // Red - Ultra-processed foods
  };

  const doughnutData = {
    labels: ["NOVA 1", "NOVA 2", "NOVA 3", "NOVA 4"],
    datasets: [
      {
        data: [
          distribution.nova1,
          distribution.nova2,
          distribution.nova3,
          distribution.nova4,
        ],
        backgroundColor: [
          novaColors[1],
          novaColors[2],
          novaColors[3],
          novaColors[4],
        ],
        borderWidth: 0,
        cutout: "70%",
      },
    ],
  };

  const options = {
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
            const pct = value.toFixed(1);
            return `${label}: ${pct}%`;
          },
        },
      },
    },
  };

  const summary = getNovaSummary(novaScore, distribution);

  const groupLabels: Record<number, string> = {
    1: "Minimally processed foods",
    2: "Processed culinary ingredients",
    3: "Processed foods",
    4: "Ultra-processed foods",
  };

  const groupDistribution = [
    { id: 1, label: groupLabels[1], value: distribution.nova1 },
    { id: 2, label: groupLabels[2], value: distribution.nova2 },
    { id: 3, label: groupLabels[3], value: distribution.nova3 },
    { id: 4, label: groupLabels[4], value: distribution.nova4 },
  ];

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 h-[420px] overflow-hidden text-center">
      <h3 className="text-xl font-semibold text-gray-400 mb-1">
        Personal NOVA Score
      </h3>
      <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
        Your overall daily nutrition quality based on how processed your foods
        were (NOVA 1–4).
      </p>

      {/* Main content: horizontal layout with chart on left, legend on right */}
      <div className="flex flex-row items-center justify-center gap-6 flex-1 overflow-hidden min-h-0">
        {/* Chart on the left */}
        <div className="relative w-full h-full max-w-[240px] max-h-[240px] flex-shrink-0 overflow-hidden">
          <Doughnut data={doughnutData} options={options} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-3xl font-bold text-gray-800 leading-none overflow-hidden">
              {novaScore?.toFixed ? novaScore.toFixed(1) : novaScore}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">
              daily NOVA
            </div>
          </div>
        </div>

        {/* Legend / distribution on the right */}
        <div className="flex flex-col justify-center space-y-3">
          {typeof sampleCount === "number" && sampleCount > 0 && (
            <div className="text-xs text-gray-400 mb-1">
              Based on {sampleCount} logged items today.
            </div>
          )}

          <div className="space-y-2">
            {groupDistribution.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between text-sm gap-3"
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                    style={{ backgroundColor: novaColors[g.id as 1 | 2 | 3 | 4] }}
                  />
                  <span className="font-medium text-gray-700 whitespace-nowrap">
                    NOVA {g.id}
                  </span>
                  <span className="text-gray-500 ml-1">
                    — {g.label}
                  </span>
                </div>
                <span className="font-semibold text-gray-700 ml-4">
                  {g.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {/* Summary text */}
          <div className="mt-3">
            <p className="text-sm text-gray-700 italic mb-1">{summary}</p>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-4 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`
Personal NOVA Score Analysis:
- Daily NOVA Score: ${novaScore}
- Distribution: 
  • NOVA 1 (minimally processed): ${distribution.nova1.toFixed(1)}%
  • NOVA 2 (processed ingredients): ${distribution.nova2.toFixed(1)}%
  • NOVA 3 (processed foods): ${distribution.nova3.toFixed(1)}%
  • NOVA 4 (ultra-processed foods): ${distribution.nova4.toFixed(1)}%
- Logged items today: ${sampleCount ?? "Unknown"}
- Context query: ${query || "Not provided"}

Please explain what this daily Personal NOVA Score means for the user's overall nutrition quality, and give personalized, practical suggestions to improve the score over time.
          `.trim()}
          userQuery={`Analyze my Personal NOVA Score for today and how to improve it: ${query || "daily intake"}`}
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default NovaChart;