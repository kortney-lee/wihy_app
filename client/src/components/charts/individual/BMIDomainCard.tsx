import React, { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import AnalyzeWithWihyButton from "../shared/AnalyzeWithWihyButton";

/* ================= Unified card styling ================= */

const CARD_HEIGHT = 420; // consistent height to prevent scroll

const cardChrome: React.CSSProperties = {
  position: "relative",
  backgroundColor: "#ffffff", // pure white background
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 4px 20px rgba(26,115,232,0.08)",
  border: "1px solid #f3f4f6",
  display: "flex",
  flexDirection: "column",
  height: CARD_HEIGHT,
  overflow: "hidden", // ensures no scrollbars
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 12px 0",
  fontSize: 24,
  fontWeight: 600,
  color: "#9CA3AF",
};

const sectionGrow: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 20,
  flex: 1,
  minHeight: 0,
  paddingBottom: 8,
};

const footerRow: React.CSSProperties = {
  marginTop: "auto",
  textAlign: "center",
  paddingTop: 12,
  flexShrink: 0,
};

/* ================= Card shell ================= */

function CardShell({
  title = "",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={cardChrome}>
      <h3 style={titleStyle}>{title}</h3>
      <div style={sectionGrow}>{children}</div>
    </section>
  );
}

interface BMIDomainCardProps {
  data?: { bmi?: number; category?: string; healthScore?: number; goal?: number };
}

const BMIDomainCard: React.FC<BMIDomainCardProps> = ({ data }) => {
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

  const chartContainerStyle: React.CSSProperties = {
    position: 'relative',
    height: 80, // reduced from 180
    width: 80,  // reduced from 180
    flexShrink: 0,
    overflow: 'hidden'
  };

  const centerIndicatorStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)', // precise centering
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,  // constrained width instead of inset: 0
    height: 24, // constrained height instead of inset: 0
  };

  const centerIconStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12, // smaller font for smaller container
    backgroundColor: zone.bgColor
  };

  const bmiValueStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 4,
    color: zone.textColor
  };

  const statusTextStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16
  };

  const scaleContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#6b7280',
    paddingLeft: 8,
    paddingRight: 8
  };

  return (
    <CardShell title="BMI Domain Analysis">
      {/* Chart container */}
      <div style={chartContainerStyle}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={45} // reduced from 55
              outerRadius={70} // reduced from 85
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
        <div style={centerIndicatorStyle}>
          <div style={centerIconStyle}>+</div>
        </div>
      </div>

      {/* BMI Value and Status */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={bmiValueStyle}>{bmi} kg/m²</div>
        <p style={statusTextStyle}>
          {zone.label} · Health Score {healthScore}/100
        </p>

        <div style={scaleContainerStyle}>
          <span style={{ color: '#3b82f6' }}>&lt;18.5</span>
          <span style={{ color: '#10b981' }}>18.5–25</span>
          <span style={{ color: '#f59e0b' }}>25–30</span>
          <span style={{ color: '#ef4444' }}>&gt;30</span>
        </div>
      </div>

      <div style={footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`BMI Domain Analysis: Current BMI is ${bmi} kg/m² (${zone.label}), Health Score: ${healthScore}/100.`}
          userQuery="Analyze my BMI domain position and explain what this means for my health, fitness goals, and provide recommendations for improvement"
        />
      </div>
    </CardShell>
  );
};

export default BMIDomainCard;
