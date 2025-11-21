import React, { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import AnalyzeWithWihyButton from "../shared/AnalyzeWithWihyButton";

/* ================= Card shell ================= */

function CardShell({
  title = "",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex flex-col h-[420px] overflow-hidden">
      <h3 className="m-0 mb-4 text-xl font-semibold text-gray-400">{title}</h3>
      <div className="flex flex-col items-center justify-center gap-3 flex-1 min-h-0 pb-2">{children}</div>
    </section>
  );
}

interface BMIDomainCardProps {
  data?: { bmi?: number; category?: string; healthScore?: number; goal?: number };
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const BMIDomainCard: React.FC<BMIDomainCardProps> = ({ data, onAnalyze }) => {
  const bmi = data?.bmi ?? 23.1;
  const healthScore = data?.healthScore ?? 85;

  const pieData = useMemo(
    () => [
      { name: "Underweight", value: 18.5, color: "#3b82f6" },
      { name: "Normal", value: 25 - 18.5, color: "#10b981" },
      { name: "Overweight", value: 30 - 25, color: "#f59e0b" },
      { name: "Obese", value: 10, color: "#ef4444" },
    ],
    []
  );

  const zone =
    bmi < 18.5
      ? { key: "under", label: "Underweight", textColor: "#3b82f6", bgColor: "#3b82f6" }
      : bmi < 25
      ? { key: "normal", label: "Normal Weight", textColor: "#10b981", bgColor: "#10b981" }
      : bmi < 30
      ? { key: "over", label: "Overweight", textColor: "#f59e0b", bgColor: "#f59e0b" }
      : { key: "obese", label: "Obese", textColor: "#ef4444", bgColor: "#ef4444" };



  return (
    <CardShell title="BMI Domain Analysis">
      {/* Chart container */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={45}
              startAngle={90}
              endAngle={450}
              paddingAngle={3}
              dataKey="value"
              isAnimationActive={false}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6">
          <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xs" style={{backgroundColor: zone.bgColor}}>+</div>
        </div>
      </div>

      {/* BMI Value and Status */}
      <div className="text-center flex-shrink-0">
        <div className="text-xl font-bold mb-1" style={{color: zone.textColor}}>{bmi} kg/m²</div>
        <p className="text-sm text-gray-500 mb-3">
          {zone.label} · Health Score {healthScore}/100
        </p>

        <div className="flex justify-between text-xs text-gray-500 px-2">
          <span className="text-blue-500">&lt;18.5</span>
          <span className="text-green-500">18.5–25</span>
          <span className="text-yellow-500">25–30</span>
          <span className="text-red-500">&gt;30</span>
        </div>
      </div>

      <div className="mt-auto text-center pt-2 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`BMI Domain Analysis: Current BMI is ${bmi} kg/m² (${zone.label}), Health Score: ${healthScore}/100.`}
          userQuery="Analyze my BMI domain position and explain what this means for my health, fitness goals, and provide recommendations for improvement"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default BMIDomainCard;
