import React from 'react';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

/* ================= Unified card styling ================= */

const cardChrome: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: 24,
  borderRadius: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  height: 420,
  overflow: "hidden",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 20px 0",
  fontSize: 24,
  fontWeight: 600,
  color: "#9CA3AF",
};

const sectionGrow: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  overflow: "hidden",
  minHeight: 0,
};

const footerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginTop: 16,
  flexShrink: 0,
};

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
  const dynamicCardChrome = {
    ...cardChrome,
    ...(height && { height })
  };
  
  return (
    <section style={dynamicCardChrome}>
      <h3 style={titleStyle}>{title}</h3>
      <div style={sectionGrow}>{children}</div>
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

  return (
    <CardShell title="Nutrition Analysis" height={height}>

      {/* Macronutrients Visual Representation */}
      <div className="mb-4" style={{ height: '200px', width: '100%' }}>
        {/* Custom CSS Pie Chart as fallback */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '160px' }}>
          <div style={{ 
            width: '140px', 
            height: '140px', 
            borderRadius: '50%',
            background: `conic-gradient(
              ${macros[0].color} 0deg ${(macros[0].current / (macros[0].current + macros[1].current + macros[2].current + macros[3].current)) * 360}deg,
              ${macros[1].color} ${(macros[0].current / (macros[0].current + macros[1].current + macros[2].current + macros[3].current)) * 360}deg ${((macros[0].current + macros[1].current) / (macros[0].current + macros[1].current + macros[2].current + macros[3].current)) * 360}deg,
              ${macros[2].color} ${((macros[0].current + macros[1].current) / (macros[0].current + macros[1].current + macros[2].current + macros[3].current)) * 360}deg ${((macros[0].current + macros[1].current + macros[2].current) / (macros[0].current + macros[1].current + macros[2].current + macros[3].current)) * 360}deg,
              ${macros[3].color} ${((macros[0].current + macros[1].current + macros[2].current) / (macros[0].current + macros[1].current + macros[2].current + macros[3].current)) * 360}deg 360deg
            )`,
            position: 'relative'
          }}>
            {/* Inner circle to create donut effect */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '70px',
              height: '70px',
              backgroundColor: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#666'
            }}>
              Nutrition
            </div>
          </div>
        </div>
        
        {/* Complete Nutrition Info */}
        <div style={{ marginTop: '12px' }}>
          {/* Macronutrient Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
            {macros.map((macro, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: macro.color,
                  borderRadius: '50%',
                  marginRight: '6px'
                }}></div>
                <span>{macro.name}: {macro.current}{macro.unit}</span>
              </div>
            ))}
          </div>
          
          {/* Additional Nutrients */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb' }}>{nutrition.fiber}g</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Fiber</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ea580c' }}>{nutrition.sugar}g</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Sugar</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc2626' }}>{nutrition.sodium}mg</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Sodium</div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Remaining:</span>
              <span style={{ 
                fontWeight: '500', 
                color: goals.calories - nutrition.calories >= 0 ? '#059669' : '#dc2626' 
              }}>
                {goals.calories - nutrition.calories} kcal
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Protein %:</span>
              <span style={{ fontWeight: '500', color: '#2563eb' }}>
                {Math.round((nutrition.protein * 4 / nutrition.calories) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Nutrition Analysis: Consumed ${nutrition.calories} kcal (goal: ${goals.calories}), Protein: ${nutrition.protein}g (goal: ${goals.protein}g), Carbs: ${nutrition.carbs}g (goal: ${goals.carbs}g), Fat: ${nutrition.fat}g (goal: ${goals.fat}g), Fiber: ${nutrition.fiber}g, Sugar: ${nutrition.sugar}g, Sodium: ${nutrition.sodium}mg. Calories remaining: ${goals.calories - nutrition.calories}. Protein percentage: ${Math.round((nutrition.protein * 4 / nutrition.calories) * 100)}%.`}
          userQuery="Analyze my detailed nutrition intake and provide insights about my macronutrient balance, goal progress, and dietary recommendations"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default NutritionAnalysisCard;