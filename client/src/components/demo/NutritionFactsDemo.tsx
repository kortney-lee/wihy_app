// Demo wrapper for NutritionFactsPage - for use in About page and other non-production demos
// This component renders the nutrition facts display without navigation dependencies

import React from 'react';
import { NutritionFactsData } from '../../types/nutritionFacts';

interface NutritionFactsDemoProps {
  data?: NutritionFactsData;
}

const NutritionFactsDemo: React.FC<NutritionFactsDemoProps> = ({ data }) => {
  // Default demo data if none provided
  const demoData: NutritionFactsData = data || {
    source: "barcode",
    name: "Organic Quinoa & Brown Rice Bowl",
    brand: "Healthy Harvest",
    healthScore: 87,
    grade: "A",
    novaScore: 1,
    ultraProcessed: false,
    calories: 320,
    servingSize: "1 cup (240g)",
    macros: {
      protein: 12,
      carbs: 58,
      fat: 5,
      fiber: 8,
      sugar: 3
    },
    ingredientsText: "Organic Quinoa, Organic Brown Rice, Organic Vegetables (Carrots, Peas, Corn), Sea Salt, Organic Herbs & Spices",
    positives: [
      { label: "High in fiber (8g per serving)" },
      { label: "Complete protein source" },
      { label: "Rich in essential minerals" },
      { label: "Minimal processing (NOVA 1)" },
      { label: "Low in added sugars" }
    ],
    negatives: [
      { label: "Moderate calorie density" },
      { label: "May contain traces of allergens" }
    ],
    additives: {}
  };

  const product = demoData;

  const getScoreColor = (score?: number) => {
    if (!score) return "bg-gray-400";
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-yellow-500"; 
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen overflow-y-auto" style={{ backgroundColor: '#f0f7ff', height: '100%' }}>
      <div className="py-8">
        <div className="max-w-3xl mx-auto p-6 space-y-8">
          {/* Product Header */}
          <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform">
            <div className="flex items-start gap-6">
              {product.imageUrl && (
                <div className="relative group">
                  <img
                    src={product.imageUrl}
                    alt={product.name || "Product"}
                    className="w-32 h-32 object-contain rounded-2xl border-0 bg-gradient-to-br from-white to-gray-50 shadow-lg group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              )}
              <div className="flex-1 space-y-3">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {product.name || "Food item"}
                </h1>
                {product.brand && (
                  <p className="text-base text-gray-600 font-medium">{product.brand}</p>
                )}
                {typeof product.healthScore === "number" && (
                  <div className="flex items-center gap-3 mt-4">
                    <div className="relative hover:-translate-y-1 transition-transform duration-200 cursor-pointer">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${getScoreColor(product.healthScore)} shadow-lg`} />
                      <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      {product.healthScore}<span className="text-sm text-gray-500">/100</span>
                    </span>
                    {product.grade && (
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold rounded-full shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer transform active:scale-95">{product.grade}</span>
                    )}
                  </div>
                )}
                {product.novaScore && (
                  <div className="mt-3">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg gap-2 hover:-translate-y-1 transition-all duration-200 cursor-pointer transform active:scale-95">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      NOVA {product.novaScore}
                      {product.ultraProcessed && " · Ultra-processed"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nutrition Facts */}
          {(product.calories || product.macros) && (
            <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
                <span className="text-gray-900">Nutrition Facts</span>
                {product.servingSize && (
                  <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    per {product.servingSize}
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.calories && (
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-l-4 border-orange-400 hover:bg-gradient-to-r hover:from-orange-100 hover:to-red-100 transition-all duration-200 cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                      </svg>
                      Calories
                    </span>
                    <span className="text-lg font-bold text-orange-600">{product.calories}</span>
                  </div>
                )}
                {product.macros?.protein !== undefined && (
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Protein
                    </span>
                    <span className="text-lg font-bold text-blue-600">{product.macros.protein}g</span>
                  </div>
                )}
                {product.macros?.carbs !== undefined && (
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-l-4 border-yellow-400 hover:bg-gradient-to-r hover:from-yellow-100 hover:to-amber-100 transition-all duration-200 cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v3l-1-.75L9 7V4zm9 16H6V4h1v6l2.5-1.5L12 10V4h6v16z"/>
                      </svg>
                      Carbs
                    </span>
                    <span className="text-lg font-bold text-yellow-600">{product.macros.carbs}g</span>
                  </div>
                )}
                {product.macros?.fat !== undefined && (
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-400 hover:bg-gradient-to-r hover:from-purple-100 hover:to-violet-100 transition-all duration-200 cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Fat
                    </span>
                    <span className="text-lg font-bold text-purple-600">{product.macros.fat}g</span>
                  </div>
                )}
                {product.macros?.fiber !== undefined && (
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-400 hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 transition-all duration-200 cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66C7.84 17.17 9.64 12.65 17 11.24V17l7-7-7-7v5.76z"/>
                      </svg>
                      Fiber
                    </span>
                    <span className="text-lg font-bold text-green-600">{product.macros.fiber}g</span>
                  </div>
                )}
                {product.macros?.sugar !== undefined && (
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border-l-4 border-pink-400 hover:bg-gradient-to-r hover:from-pink-100 hover:to-rose-100 transition-all duration-200 cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM7.34 9.66L4.66 12l2.68 2.34L10 12l-2.66-2.34zm9.32 4.68L14 12l2.66-2.34L19.34 12l-2.68 2.34z"/>
                      </svg>
                      Sugar
                    </span>
                    <span className="text-lg font-bold text-pink-600">{product.macros.sugar}g</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ingredients */}
          {product.ingredientsText && (
            <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <span className="text-gray-900">Ingredients</span>
              </h2>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-400">
                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                  {product.ingredientsText}
                </p>
              </div>
            </div>
          )}

          {/* Positives and Negatives */}
          {(product.positives && product.positives.length > 0) || (product.negatives && product.negatives.length > 0) ? (
            <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis</h2>
              
              {product.positives && product.positives.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Positives
                  </h3>
                  <ul className="space-y-2">
                    {product.positives.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.negatives && product.negatives.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-orange-700 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                    Things to Note
                  </h3>
                  <ul className="space-y-2">
                    {product.negatives.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-orange-500 mt-1">⚠</span>
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default NutritionFactsDemo;
