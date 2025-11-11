import React from 'react';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

// Unified card styling
const cardChrome = {
  display: "flex",
  flexDirection: "column" as const,
  padding: 24,
  borderRadius: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  height: 420,
  overflow: "hidden" as const,
};

const titleStyle = {
  fontSize: 24,
  fontWeight: 600,
  color: "#9CA3AF",
  margin: 0,
  marginBottom: 20,
  textAlign: "center" as const,
};

const sectionGrow = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  gap: 8,
  overflow: "hidden" as const,
  minHeight: 0,
};

const footerRow = {
  display: "flex",
  justifyContent: "center",
  marginTop: 16,
  flexShrink: 0,
};

const CardShell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={cardChrome}>
    <h3 style={titleStyle}>{title}</h3>
    <div style={sectionGrow}>{children}</div>
  </section>
);

interface CaloriesCardProps {
  consumedCalories?: number;
  burnedCalories?: number;
  unit?: string;
}

const CaloriesCard: React.FC<CaloriesCardProps> = ({
  consumedCalories = 2100,
  burnedCalories = 2450,
  unit = 'kcal'
}) => {
  const netCalories = burnedCalories - consumedCalories;
  const maxCalories = Math.max(consumedCalories, burnedCalories);
  const consumedWidth = (consumedCalories / maxCalories) * 100;
  const burnedWidth = (burnedCalories / maxCalories) * 100;
  
  return (
    <CardShell title="Calories Today">

      {/* Main Value Display */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <div style={{ 
          fontSize: 24, 
          fontWeight: 400, 
          color: '#1f2937',
          lineHeight: 1.5,
          marginBottom: "2px"
        }}>
          {consumedCalories.toLocaleString()}
        </div>
        <div style={{
          fontSize: 14,
          color: '#9ca3af',
          fontWeight: 400
        }}>
          {unit} consumed
        </div>
      </div>

      {/* Simple Bar Display */}
      <div style={{ width: "100%", maxWidth: "200px", marginBottom: "16px" }}>
        {/* Consumed vs Burned Bars */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', textAlign: 'left' }}>
            Consumed
          </div>
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${consumedWidth}%`,
              height: '100%',
              background: '#3b82f6',
              borderRadius: '6px',
              transition: 'width 0.8s ease'
            }} />
          </div>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', textAlign: 'left' }}>
            Burned: {burnedCalories.toLocaleString()} {unit}
          </div>
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${burnedWidth}%`,
              height: '100%',
              background: '#10b981',
              borderRadius: '6px',
              transition: 'width 0.8s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Status Pill */}
      <div style={{ textAlign: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 9999,
            fontWeight: 600,
            fontSize: 14,
            color: netCalories > 0 ? '#059669' : '#dc2626',
            backgroundColor: netCalories > 0 ? '#05966920' : '#dc262620',
            border: `1px solid ${netCalories > 0 ? '#05966933' : '#dc262633'}`,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              background: "currentColor",
              opacity: 0.85,
            }}
          />
          Net: {netCalories > 0 ? '+' : ''}{netCalories} {unit}
        </span>
      </div>

      <div style={footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Calories: Consumed ${consumedCalories} ${unit}, Burned ${burnedCalories} ${unit}, Net ${netCalories} ${unit} ${netCalories > 0 ? 'deficit' : 'surplus'}`}
          userQuery="Analyze my calorie balance and metabolism"
        />
      </div>
    </CardShell>
  );
};

export default CaloriesCard;