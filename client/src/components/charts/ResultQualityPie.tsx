import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { UnifiedResponse } from '../../services/wihyAPI';
import '../../styles/Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ResultQualityPieProps {
  apiResponse?: UnifiedResponse | any;
  query?: string;
  results?: string;
  dataSource?: "error" | "openai" | "local" | "vnutrition" | "wihy";
  citations?: string[];
}

/* ====================== Evidence Confidence (Gated) ====================== */

type Verdict = 'GOOD' | 'REVIEW' | 'BAD';

/** Trusted domains for quick credibility checks. Tune anytime. */
const TRUSTED_DOMAINS: Record<string, number> = {
  'nih.gov': 1,
  'ncbi.nlm.nih.gov': 1,  // PubMed
  'who.int': 1,
  'cdc.gov': 1,
  'fda.gov': 1,
  'usda.gov': 1,
  'jamanetwork.com': 1,
  'nejm.org': 1,
  'thelancet.com': 1,
  'bmj.com': 1,
  'nature.com': 1,
  'science.org': 1,
  'mayoclinic.org': 1,
  'harvard.edu': 1,
  'stanford.edu': 1,
  'clevelandclinic.org': 1,
  'uptodate.com': 1,
};

const extractUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s)]+)(?=\)|\s|$)/g;
  return [...text.matchAll(urlRegex)].map(m => m[1]);
};

const domainKey = (url: string): string | null => {
  try {
    const u = new URL(url);
    const parts = u.hostname.split('.');
    return parts.slice(-2).join('.');
  } catch {
    return null;
  }
};

const hasStrongId = (text: string) =>
  /doi\.org\/10\./i.test(text) || /pubmed\.ncbi\.nlm\.nih\.gov\/\d+/i.test(text);

const hasSpecificNumbers = (lower: string) =>
  /\b\d+(\.\d+)?\s?(mg|g|mcg|iu|kcal|calories|%)\b/.test(lower) || /\b\d+(\.\d+)?%/.test(lower);

const hypeOrBS = (lower: string) =>
  /(miracle|cure-all|100% guaranteed|secret|instantly|revolutionary|breakthrough|detox scam|shocking)/i.test(lower);

const contradictionWithoutRefs = (lower: string) =>
  /(contradictory|no consensus|insufficient evidence)/i.test(lower) &&
  !hasStrongId(lower) &&
  extractUrls(lower).length === 0;

const recencyOK = (lower: string) => {
  const years = (lower.match(/\b(20\d{2}|19\d{2})\b/g) || []).map(y => parseInt(y, 10));
  if (years.length === 0) return true; // no year mentioned: don't punish
  const mostRecent = Math.max(...years);
  return new Date().getFullYear() - mostRecent <= 5;
};

const sourceGate = (text: string, dataSource: ResultQualityPieProps['dataSource']) => {
  // Database sources and WiHy count as trusted.
  if (dataSource === 'vnutrition' || dataSource === 'local' || dataSource === 'wihy') return true;

  // Otherwise require a strong id or a trusted domain link.
  if (hasStrongId(text)) return true;
  const urls = extractUrls(text);
  for (const u of urls) {
    const key = domainKey(u);
    if (key && TRUSTED_DOMAINS[key]) return true;
  }
  return false;
};

/* Legacy evaluation function removed - now using unified API response */

/* ====================== Component ====================== */

const ResultQualityPie: React.FC<ResultQualityPieProps> = ({
  apiResponse,
  query,
  results,
  dataSource,
  citations
}) => {
  const [evaluation, setEvaluation] = useState<{
    score: number;
    verdict: Verdict;
    reasons: string[];
  }>({ score: 0.20, verdict: 'BAD', reasons: ['Loading...'] });

  // Debug logging to see what props are being received
  useEffect(() => {
    console.log('ResultQualityPie received props:', {
      apiResponse,
      query,
      results: results?.substring(0, 100) + '...',
      dataSource,
      citations,
      hasResults: !!results && results.trim() !== ''
    });
  }, [query, results, dataSource, citations, apiResponse]);

  // Evaluate when props change and we have valid data
  useEffect(() => {
    // Handle unified API response first
    if (apiResponse && apiResponse.success && apiResponse.data) {
      console.log('Using unified API response for quality evaluation...');
      
      // Use health_analysis if available
      if (apiResponse.data.health_analysis?.safety_score) {
        const safetyScore = apiResponse.data.health_analysis.safety_score / 100; // Convert to 0-1 scale
        const verdict: Verdict = safetyScore >= 0.8 ? 'GOOD' : safetyScore >= 0.6 ? 'REVIEW' : 'BAD';
        const reasons = [
          `Safety Score: ${apiResponse.data.health_analysis.safety_score}%`,
          `Processing Level: ${apiResponse.data.health_analysis.processing_level}`,
          ...(apiResponse.data.health_analysis.carcinogen_alerts?.map(alert => `⚠️ ${alert}`) || []),
          ...(apiResponse.data.health_analysis.toxic_additives?.map(additive => `⚠️ Toxic: ${additive}`) || [])
        ];
        
        setEvaluation({ score: safetyScore, verdict, reasons });
        return;
      }
      
      // Use nutrition nourish_score if available
      if (apiResponse.data.nutrition?.nourish_score?.score) {
        const nourish = apiResponse.data.nutrition.nourish_score;
        const score = nourish.score / 100; // Convert to 0-1 scale
        const verdict: Verdict = score >= 0.8 ? 'GOOD' : score >= 0.6 ? 'REVIEW' : 'BAD';
        const reasons = [
          `Nourish Score: ${nourish.score}% (${nourish.category})`,
          `Nutrient Density: ${nourish.breakdown?.nutrient_density || 'N/A'}%`,
          `Processing Level: ${nourish.breakdown?.processing_level || 'N/A'}%`,
          `Ingredient Quality: ${nourish.breakdown?.ingredient_quality || 'N/A'}%`
        ];
        
        setEvaluation({ score, verdict, reasons });
        return;
      }
    }
    
    // No API response available - set default evaluation
    console.log('No unified API response available for evaluation');
    setEvaluation({
      score: 0.20,
      verdict: 'BAD',
      reasons: ['Waiting for results...']
    });
  }, [query, results, dataSource, citations, apiResponse]);

  const { score, verdict, reasons } = evaluation;
  const percentage = Math.round(score * 100);
  const remaining = 100 - percentage;

  // Colors by verdict (lock to clear categories)
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
    <div className="chart-section-card" style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', height: '200px', width: '200px', margin: '0 auto' }}>
        <Doughnut data={data} options={options} />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div className="insight-value" style={{ fontSize: '2rem', marginBottom: '0' }}>
            {percentage}%
          </div>
          <div className="legend-text">
            Evidence
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}
        >
          <span
            style={{
              fontWeight: 500,
              color: ringColor,
              fontSize: '1rem'
            }}
          >
            {verdictLabel}
          </span>
        </div>

        <div className="chart-legends">
          <div className="chart-legend-item" style={{ justifyContent: 'center' }}>
            <div
              className="legend-color"
              style={{ backgroundColor: legendGoodColor }}
            />
            <span className="legend-text">Good: {percentage}%</span>
          </div>
          <div className="chart-legend-item" style={{ justifyContent: 'center' }}>
            <div
              className="legend-color"
              style={{ backgroundColor: legendBadColor }}
            />
            <span className="legend-text">Bad: {remaining}%</span>
          </div>
        </div>

        {/* Tiny rationale (first 1–2 reasons) */}
        {reasons.length > 0 && reasons[0] !== 'Loading...' && reasons[0] !== 'Waiting for results...' && (
          <div className="chart-description">
            {reasons.slice(0, 2).join(' • ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultQualityPie;