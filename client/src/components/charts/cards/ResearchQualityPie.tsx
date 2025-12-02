import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ResearchQualityPieProps {
  researchData?: {
    evidence_distribution?: Record<string, number>;
    research_quality_score?: number;
    study_count?: number;
  };
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

type Verdict = 'GOOD' | 'REVIEW' | 'BAD';

/**
 * ResearchQualityPie - Dedicated component for displaying research evidence quality
 * Shows distribution of evidence levels (Level I, II, III, etc.) in a doughnut chart
 * Used exclusively in research context (HealthDashboardGrid)
 */
const ResearchQualityPie: React.FC<ResearchQualityPieProps> = ({
  researchData,
  onAnalyze
}) => {
  const [evaluation, setEvaluation] = useState<{
    score: number;
    verdict: Verdict;
    reasons: string[];
  }>({ score: 0.20, verdict: 'BAD', reasons: ['Waiting for results...'] });

  useEffect(() => {
    // Only handle research data with evidence distribution
    if (researchData?.evidence_distribution) {
      const distribution = researchData.evidence_distribution;
      const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
      
      if (total === 0) {
        setEvaluation({
          score: 0,
          verdict: 'BAD',
          reasons: ['No evidence available']
        });
        return;
      }
      
      // Use research_quality_score if available, otherwise calculate from distribution
      let score: number;
      if (researchData.research_quality_score !== undefined) {
        // Use the API-provided score (0-100) and convert to 0-1 scale
        score = researchData.research_quality_score / 100;
      } else {
        // Calculate score based on evidence level distribution
        // Level I and Level II are high-quality evidence
        const highEvidence = (distribution['Level I'] || 0) + (distribution['Level II'] || 0);
        score = highEvidence / total;
      }
      
      const verdict: Verdict = score >= 0.7 ? 'GOOD' : score >= 0.4 ? 'REVIEW' : 'BAD';
      
      const reasons = Object.entries(distribution)
        .filter(([_, count]) => count > 0)
        .map(([level, count]) => `${level}: ${count} studies (${Math.round((count / total) * 100)}%)`);
      
      setEvaluation({ score, verdict, reasons });
      return;
    }
    
    // No data available
    setEvaluation({
      score: 0.20,
      verdict: 'BAD',
      reasons: ['Waiting for research results...']
    });
  }, [researchData]);

  const { score, verdict, reasons } = evaluation;
  const percentage = Math.round(score * 100);
  const remaining = 100 - percentage;

  // Colors by verdict
  const colorByVerdict = (v: Verdict) =>
    v === 'GOOD' ? '#10B981' : v === 'REVIEW' ? '#F59E0B' : '#EF4444';

  const labelByVerdict = (v: Verdict) =>
    v === 'GOOD' ? 'Good' : v === 'REVIEW' ? 'Needs review' : 'Poor';

  const ringColor = colorByVerdict(verdict);
  const verdictLabel = labelByVerdict(verdict);

  const data = {
    datasets: [
      {
        data: [percentage, remaining],
        backgroundColor: [ringColor, '#E5E7EB'],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  const legendGoodColor = verdict === 'BAD' ? '#E5E7EB' : '#10B981';
  const legendBadColor = verdict === 'BAD' ? '#EF4444' : '#E5E7EB';

  return (
    <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-lg h-[500px] flex flex-col text-center overflow-hidden">
      <h3 className="text-xl font-semibold text-vh-muted mb-3">
        Research Evidence Quality
      </h3>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="relative h-36 w-36 mx-auto">
          <Doughnut data={data} options={options} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-2xl mb-0 font-bold text-gray-700">
              {percentage}%
            </div>
            <div className="text-xs text-gray-500">
              High Quality
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-center mb-2">
            <span 
              className="font-medium text-base"
              style={{ color: ringColor }}
            >
              {verdictLabel}
            </span>
          </div>

          <div className="flex justify-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: legendGoodColor }}
              />
              <span className="text-xs text-gray-500">High Quality: {percentage}%</span>
            </div>
            <div className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: legendBadColor }}
              />
              <span className="text-xs text-gray-500">Lower Quality: {remaining}%</span>
            </div>
          </div>

          {/* Evidence distribution breakdown */}
          {reasons.length > 0 && reasons[0] !== 'Waiting for research results...' && reasons[0] !== 'No evidence available' && (
            <div className="text-xs text-gray-500 mb-3">
              {reasons.slice(0, 2).join(' • ')}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center mt-2 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Research evidence quality: ${percentage}% high-quality studies (Level I & II), ${remaining}% lower-quality evidence. Distribution: ${reasons.filter(r => !r.startsWith('Waiting') && !r.startsWith('No')).join(', ')}.`}
          userQuery="Explain the importance of evidence levels in research and how study quality affects the reliability of health recommendations"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default ResearchQualityPie;
