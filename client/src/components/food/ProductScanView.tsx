// Yuka-style product overview component
// Displays nutrition facts, positives, negatives, and recommendations

import React from "react";
import { NutritionFactsData } from "../../types/nutritionFacts";

interface ProductScanViewProps {
  product: NutritionFactsData;
  onAskMore?: () => void;
}

const ProductScanView: React.FC<ProductScanViewProps> = ({
  product,
  onAskMore,
}) => {
  if (!product) return null;

  const {
    name,
    brand,
    imageUrl,
    healthScore,
    grade,
    novaScore,
    ultraProcessed,
    additives = [],
    calories,
    macros,
    servingSize,
    positives = [],
    negatives = [],
    recommendations = [],
  } = product;

  // Color-coded health score
  const getScoreColor = (score?: number) => {
    if (!score) return "bg-gray-400";
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div 
      className="flex flex-col"
      style={{
        backgroundColor: '#ffffff',
        color: '#1f2937',
        minHeight: '100vh',
        padding: '16px'
      }}
    >
      {/* Header Section */}
      <div className="flex items-start gap-4 mb-6">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name || "Product"}
            className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-white"
          />
        )}

        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 leading-tight">
            {name || "Food item"}
          </h2>
          {brand && (
            <p className="text-sm text-gray-600 mt-1">{brand}</p>
          )}

          {/* Health Score */}
          {typeof healthScore === "number" && (
            <div className="flex items-center gap-2 mt-3">
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${getScoreColor(
                  healthScore
                )}`}
              />
              <span className="text-base font-semibold text-gray-900">
                {healthScore}/100
              </span>
              {grade && (
                <span className="text-sm text-gray-600 ml-1">{grade}</span>
              )}
            </div>
          )}

          {/* NOVA Score */}
          {novaScore && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                NOVA {novaScore}
                {ultraProcessed && " · Ultra-processed"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nutrition Facts Summary */}
      {(calories || macros) && (
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Nutrition Facts
            {servingSize && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                per {servingSize}
              </span>
            )}
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-3">
              {calories && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Calories</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {calories}
                  </span>
                </div>
              )}
              {macros?.protein !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Protein</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {macros.protein}g
                  </span>
                </div>
              )}
              {macros?.carbs !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Carbs</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {macros.carbs}g
                  </span>
                </div>
              )}
              {macros?.fat !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fat</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {macros.fat}g
                  </span>
                </div>
              )}
              {macros?.fiber !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fiber</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {macros.fiber}g
                  </span>
                </div>
              )}
              {macros?.sugar !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sugar</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {macros.sugar}g
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Additives */}
      {additives.length > 0 && (
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Additives ({additives.length})
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {additives.map((additive, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-800">
                  {additive.name}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    additive.severity === "high"
                      ? "bg-red-100 text-red-700"
                      : additive.severity === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {additive.severity}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Negatives */}
      {negatives.length > 0 && (
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Areas of Concern
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {negatives.map((negative, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 px-4 py-3"
              >
                <span className="w-3 h-3 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {negative.label}
                  </p>
                  {negative.description && (
                    <p className="text-xs text-gray-600 mt-1">
                      {negative.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Positives */}
      {positives.length > 0 && (
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Positive Aspects
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {positives.map((positive, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 px-4 py-3"
              >
                <span className="w-3 h-3 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {positive.label}
                  </p>
                  {positive.description && (
                    <p className="text-xs text-gray-600 mt-1">
                      {positive.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">
              Better Alternatives
            </h3>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
              See all
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="min-w-[160px] max-w-[180px] bg-white rounded-xl border border-gray-200 p-3 flex-shrink-0 snap-start"
              >
                {rec.imageUrl && (
                  <img
                    src={rec.imageUrl}
                    alt={rec.name}
                    className="w-full h-24 object-contain mb-2 rounded-md"
                  />
                )}
                <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                  {rec.name}
                </p>
                {rec.brand && (
                  <p className="text-xs text-gray-500 mt-1">
                    {rec.brand}
                  </p>
                )}
                {typeof rec.score === "number" && (
                  <div className="flex items-center gap-1 mt-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${getScoreColor(
                        rec.score
                      )}`}
                    />
                    <span className="text-xs font-medium text-gray-900">
                      {rec.score}/100
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductScanView;
