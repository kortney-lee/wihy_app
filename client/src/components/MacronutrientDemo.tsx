import React from 'react';
import MacronutrientPieChart from './charts/cards/MacronutrientPieChart';

const MacronutrientDemo: React.FC = () => {
  const handleAnalyze = (userMessage: string, assistantMessage: string) => {
    console.log('Analysis requested:', { userMessage, assistantMessage });
  };

  // Sample macronutrient data sets
  const sampleData = {
    balanced: {
      protein: 25,
      carbohydrates: 45, 
      fat: 30
    },
    highProtein: {
      protein: 40,
      carbohydrates: 30,
      fat: 30
    },
    lowCarb: {
      protein: 35,
      carbohydrates: 15,
      fat: 50
    },
    lowFat: {
      protein: 30,
      carbohydrates: 60,
      fat: 10
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-vh-ink mb-8">Macronutrient Pie Chart Demo</h1>
      
      {/* Different Display Modes */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-vh-ink mb-6">Display Modes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MacronutrientPieChart
            data={sampleData.balanced}
            displayMode="percentage"
            title="Percentage View"
            onAnalyze={handleAnalyze}
          />
          <MacronutrientPieChart
            data={{ protein: 120, carbohydrates: 200, fat: 80 }}
            displayMode="grams"
            title="Grams View"
            onAnalyze={handleAnalyze}
          />
          <MacronutrientPieChart
            data={{ protein: 30, carbohydrates: 50, fat: 20 }}
            displayMode="calories"
            title="Calories View"
            onAnalyze={handleAnalyze}
          />
        </div>
      </section>

      {/* Different Sizes */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-vh-ink mb-6">Chart Sizes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MacronutrientPieChart
            data={sampleData.balanced}
            size="small"
            title="Small Chart"
            onAnalyze={handleAnalyze}
          />
          <MacronutrientPieChart
            data={sampleData.balanced}
            size="medium"
            title="Medium Chart"
            onAnalyze={handleAnalyze}
          />
          <MacronutrientPieChart
            data={sampleData.balanced}
            size="large"
            title="Large Chart"
            onAnalyze={handleAnalyze}
          />
        </div>
      </section>

      {/* Different Diet Types */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-vh-ink mb-6">Diet Type Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MacronutrientPieChart
            data={sampleData.balanced}
            title="Balanced Diet"
            onAnalyze={handleAnalyze}
          />
          <MacronutrientPieChart
            data={sampleData.highProtein}
            title="High Protein"
            onAnalyze={handleAnalyze}
          />
          <MacronutrientPieChart
            data={sampleData.lowCarb}
            title="Low Carb/Keto"
            onAnalyze={handleAnalyze}
          />
          <MacronutrientPieChart
            data={sampleData.lowFat}
            title="Low Fat"
            onAnalyze={handleAnalyze}
          />
        </div>
      </section>

      {/* Configuration Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-vh-ink mb-6">Configuration Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MacronutrientPieChart
            data={sampleData.balanced}
            title="No Legend"
            showLegend={false}
            onAnalyze={handleAnalyze}
          />
          <MacronutrientPieChart
            data={{ protein: 150, carbohydrates: 300, fat: 100 }}
            displayMode="grams"
            title="No Center Display"
            showCenter={false}
            onAnalyze={handleAnalyze}
          />
        </div>
      </section>

      {/* Real-world Examples */}
      <section>
        <h2 className="text-2xl font-semibold text-vh-ink mb-6">Real-world Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MacronutrientPieChart
            data={{ protein: 180, carbohydrates: 250, fat: 90 }}
            displayMode="grams"
            title="Athletic Training Day"
            size="medium"
            onAnalyze={handleAnalyze}
          />
          <MacronutrientPieChart
            data={{ protein: 95, carbohydrates: 130, fat: 65 }}
            displayMode="grams"
            title="Weight Loss Plan"
            size="medium"
            onAnalyze={handleAnalyze}
          />
          <MacronutrientPieChart
            data={{ protein: 120, carbohydrates: 80, fat: 140 }}
            displayMode="grams"
            title="Ketogenic Diet"
            size="medium"
            onAnalyze={handleAnalyze}
          />
        </div>
      </section>
    </div>
  );
};

export default MacronutrientDemo;