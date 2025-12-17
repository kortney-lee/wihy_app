import React, { useState, useEffect } from 'react';
import DashboardCharts from '../charts/grids/DashboardCharts';
import { ChartType } from '../charts/chartTypes';
import Spinner from '../ui/Spinner';

/** ---- HELPER: Convert URLs to clickable links ---- */
const renderTextWithLinks = (text: string) => {
  // Match URLs but stop before capital letters or common punctuation
  const urlRegex = /(https?:\/\/[^\s]+?)(?=[A-Z]|[.!?,;:](?:\s|$)|$)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(/^https?:\/\//)) {
      // Check if we need spacing before the URL
      const prevPart = parts[index - 1];
      const needsSpaceBefore = prevPart && !prevPart.match(/[\s\n]$/);
      
      // Check if URL should be on new line (after sentence end or long paragraph)
      const afterSentenceEnd = prevPart && /[.!?]\s*$/.test(prevPart);
      const shouldBreakLine = afterSentenceEnd && prevPart.length > 100;
      
      return (
        <React.Fragment key={index}>
          {shouldBreakLine && <><br /><br /></>}
          {!shouldBreakLine && needsSpaceBefore && ' '}
          <a
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#2563eb',
              textDecoration: 'underline',
              wordBreak: 'break-all'
            }}
          >
            {part}
          </a>
        </React.Fragment>
      );
    }
    return part;
  });
};

/** ---- CONFIG ---- */
const RESEARCH_API_BASE =
  process.env.REACT_APP_RESEARCH_API_BASE_URL || 'https://services.wihy.ai';

type EvidenceLevel = 'high' | 'moderate' | 'low' | 'very_low';
type StudyType =
  | 'randomized_controlled_trial'
  | 'meta_analysis'
  | 'systematic_review'
  | 'observational_study'
  | 'case_control'
  | 'cohort_study'
  | 'cross_sectional'
  | 'case_report'
  | 'review';

type ResearchSearchResult = {
  id: string;
  pmcid: string;
  title: string;
  authors?: string;
  authorCount?: number;
  journal?: string;
  publishedDate?: string;
  publicationYear?: number;
  abstract?: string;
  studyType?: string;
  researchArea?: string;
  evidenceLevel?: string;
  relevanceScore?: number;
  rank?: number;
  fullTextAvailable?: boolean;
  links?: {
    pmcWebsite?: string;
    pubmedLink?: string;
    pdfDownload?: string | null;
    doi?: string;
  };
};

type ResearchSearchResponse = {
  success: boolean;
  keyword: string;
  originalQuery?: string;
  articles: ResearchSearchResult[];
  totalResearchCount?: number;
  returnedCount?: number;
  hasMoreResults?: boolean;
  qualityScore?: number;
  qualityLevel?: string;
  evidenceGrade?: string;
  confidence?: string;
  qualityAssessment?: {
    overallScore?: number;
    qualityLevel?: string;
    confidence?: string;
    evidenceGrade?: string;
    breakdown?: {
      evidenceStrength?: number;
      recency?: number;
      consensus?: number;
      sampleSize?: number;
      journalQuality?: number;
      accessibility?: number;
    };
    recommendations?: string[];
    researchSummary?: {
      totalAvailable?: number;
      analyzed?: number;
      recentStudies?: number;
      fullTextAccess?: number;
    };
    keyFindings?: string[];
    strengthsOfEvidence?: string[];
    limitations?: string[];
  };
  chart_data?: {
    evidence_grade?: string;
    research_quality_score?: number;
    study_count?: number;
    confidence_level?: string;
    publication_timeline?: Record<string, number>;
    study_type_distribution?: Record<string, number>;
    evidence_distribution?: Record<string, number>;
    research_coverage?: {
      earliest_year?: number;
      latest_year?: number;
      year_span?: number;
      sample_size_analyzed?: number;
      total_research_available?: number;
    };
  };
};

type TrendsResponse = {
  success: boolean;
  timeframe: string;
  trending_topics?: {
    topic: string;
    trend_score: number;
    new_studies?: number;
    total_citations?: number;
    key_developments?: string[];
    evidence_direction?: string;
    clinical_impact?: string;
  }[];
  emerging_research_areas?: string[];
};

type QualityMetricsResponse = {
  success: boolean;
  topic: string;
  quality_assessment?: {
    overall_evidence_grade?: string;
    study_quality_distribution?: {
      high_quality?: number;
      moderate_quality?: number;
      low_quality?: number;
      very_low_quality?: number;
    };
    research_maturity?: string;
    evidence_consistency?: string;
  };
};

type ClaimVerifyResponse = {
  success: boolean;
  claim: string;
  claim_specificity?: string;
  verification_result?: {
    overall_verdict?: string;
    evidence_strength?: string;
    confidence_level?: number;
    recommendation?: string;
  };
  claim_accuracy_rating?: {
    original_claim?: string;
    accurate_statement?: string;
    certainty_level?: string;
  };
};

type ArticleContentResponse = {
  success: boolean;
  pmcId: string;
  content?: {
    title?: string;
    authors?: { name: string; affiliation?: string }[];
    journal?: string;
    publicationYear?: number;
    abstract?: string;
    bodyParagraphs?: string[];
    keywords?: string[];
    fullTextAvailable?: boolean;
  };
  links?: {
    pmcWebsite?: string;
    pdfDownload?: string;
  };
  metadata?: {
    hasAbstract?: boolean;
    hasFullText?: boolean;
  };
  error?: string;
};

type TabKey = 'search' | 'claims' | 'article' | 'quality';

const buildQS = (params: Record<string, any>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
  });
  return q.toString();
};

interface ResearchPanelProps {
  windowWidth?: number;
  /**
   * Optional callback – lets you send "question about article X"
   * to WIHY AI / your chat backend with access to content.
   */
  onAskArticle?: (pmcId: string, question: string) => void;
}

const ResearchPanel: React.FC<ResearchPanelProps> = ({
  windowWidth = 1200,
  onAskArticle
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchResults, setSearchResults] = useState<ResearchSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [evidenceSummary, setEvidenceSummary] =
    useState<ResearchSearchResponse['qualityAssessment'] | null>(null);
  const [chartData, setChartData] =
    useState<ResearchSearchResponse['chart_data'] | null>(null);

  // Trends & Quality
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [quality, setQuality] = useState<QualityMetricsResponse | null>(null);
  const [topicForQuality, setTopicForQuality] =
    useState<string>('intermittent_fasting');

  // Claim verification
  const [claimText, setClaimText] = useState<string>('Green tea prevents cancer');
  const [claimResult, setClaimResult] = useState<ClaimVerifyResponse | null>(null);

  // Article content
  const [selectedPmcId, setSelectedPmcId] = useState<string | null>(null);
  const [articleContent, setArticleContent] = useState<ArticleContentResponse | null>(
    null
  );
  const [articleQuestion, setArticleQuestion] = useState<string>('');
  const [articleSearchTerm, setArticleSearchTerm] = useState<string>('');

  // Safety: if on Article tab but no article loaded, redirect to Search
  useEffect(() => {
    if (activeTab === 'article' && !selectedPmcId && !articleContent) {
      setActiveTab('search');
    }
  }, [activeTab, selectedPmcId, articleContent]);

  // Safety: if on Quality tab but no chart data, redirect to Search
  useEffect(() => {
    if (activeTab === 'quality' && !chartData) {
      setActiveTab('search');
    }
  }, [activeTab, chartData]);

  /** ---- API CALLS ---- */

  const runSearch = async (options: {
    keyword: string;
    limit?: number;
    year_from?: number;
    study_type?: StudyType;
    evidence_level?: EvidenceLevel;
  }) => {
    setActiveTab('search');
    setLoading(true);
    setError(null);
    setSearchResults([]);
    setHasSearched(true);
    setEvidenceSummary(null);
    setChartData(null);
    setTrends(null);
    setClaimResult(null);
    try {
      const qs = buildQS({
        keyword: options.keyword,
        limit: options.limit ?? 10,
        year_from: options.year_from,
        study_type: options.study_type,
        evidence_level: options.evidence_level
      });
      const res = await fetch(`${RESEARCH_API_BASE}/api/research/search?${qs}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Search API error:', res.status, errorText);
        throw new Error(`Search failed: ${res.status} ${res.statusText}. ${errorText}`);
      }
      const data: ResearchSearchResponse = await res.json();
      if (!data.success) throw new Error('Search not successful');
      setSearchResults(data.articles || []);
      setEvidenceSummary(data.qualityAssessment || null);
      setChartData(data.chart_data || null);
    } catch (e: any) {
      console.error('Search error:', e);
      setError(e?.message || 'Error searching research.');
    } finally {
      setLoading(false);
    }
  };

  const runTrends = async (
    timeframe: '1month' | '3months' | '6months' | '1year',
    category?: string
  ) => {
    // Trends are supportive context under Search
    setActiveTab('search');
    setLoading(true);
    setError(null);
    setTrends(null);
    try {
      const qs = buildQS({ timeframe, category });
      const res = await fetch(`${RESEARCH_API_BASE}/api/research/trends?${qs}`);
      if (!res.ok) throw new Error(`Trends failed: ${res.status} ${res.statusText}`);
      const data: TrendsResponse = await res.json();
      if (!data.success) throw new Error('Trends not successful');
      setTrends(data);
    } catch (e: any) {
      setError(e?.message || 'Error loading trends.');
    } finally {
      setLoading(false);
    }
  };

  const runQuality = async () => {
    if (!topicForQuality.trim()) return;
    setActiveTab('quality');
    setLoading(true);
    setError(null);
    setQuality(null);
    try {
      const qs = buildQS({ topic: topicForQuality.trim() });
      const res = await fetch(
        `${RESEARCH_API_BASE}/api/research/quality-metrics?${qs}`
      );
      if (!res.ok)
        throw new Error(`Quality metrics failed: ${res.status} ${res.statusText}`);
      const data: QualityMetricsResponse = await res.json();
      if (!data.success) throw new Error('Quality metrics not successful');
      setQuality(data);
    } catch (e: any) {
      setError(e?.message || 'Error loading quality metrics.');
    } finally {
      setLoading(false);
    }
  };

  const runClaimVerify = async () => {
    if (!claimText.trim()) return;
    // Results live under Search rather than a separate tab
    setActiveTab('search');
    setLoading(true);
    setError(null);
    setClaimResult(null);
    try {
      const res = await fetch(`${RESEARCH_API_BASE}/api/research/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim: claimText.trim(),
          evidence_threshold: 'moderate'
        })
      });
      if (!res.ok)
        throw new Error(`Claim verify failed: ${res.status} ${res.statusText}`);
      const data: ClaimVerifyResponse = await res.json();
      if (!data.success) throw new Error('Claim verification not successful');
      setClaimResult(data);
    } catch (e: any) {
      setError(e?.message || 'Error verifying claim.');
    } finally {
      setLoading(false);
    }
  };

  const loadArticleContent = async (pmcId: string) => {
    setSelectedPmcId(pmcId);
    setActiveTab('article');
    setLoading(true);
    setError(null);
    setArticleContent(null);
    setArticleQuestion('');
    setArticleSearchTerm('');
    try {
      const res = await fetch(
        `${RESEARCH_API_BASE}/api/research/pmc/${encodeURIComponent(pmcId)}/content`
      );
      if (!res.ok)
        throw new Error(`Content load failed: ${res.status} ${res.statusText}`);
      const data: ArticleContentResponse = await res.json();
      if (!data.success) throw new Error(data.error || 'Content not available');
      setArticleContent(data);
    } catch (e: any) {
      setError(e?.message || 'Error loading article content.');
    } finally {
      setLoading(false);
    }
  };

  /** ---- PRESET BUTTON HANDLERS ---- */

  const presetButtons = [
    {
      label: 'Obesity & Metabolic (high-quality RCTs)',
      onClick: () =>
        runSearch({
          keyword: 'obesity insulin resistance metabolic syndrome GLP-1',
          study_type: 'randomized_controlled_trial',
          evidence_level: 'high',
          year_from: 2015
        })
    },
    {
      label: 'Cardiovascular – Mediterranean diet',
      onClick: () =>
        runSearch({
          keyword: 'Mediterranean diet cardiovascular events',
          study_type: 'meta_analysis',
          evidence_level: 'high',
          year_from: 2010
        })
    },
    {
      label: 'Type 2 Diabetes – remission',
      onClick: () =>
        runSearch({
          keyword: 'type 2 diabetes remission diet exercise',
          study_type: 'randomized_controlled_trial',
          evidence_level: 'moderate',
          year_from: 2010
        })
    },
    {
      label: 'Ultra-processed foods & health outcomes',
      onClick: () =>
        runSearch({
          keyword: 'ultra-processed foods NOVA health outcomes',
          study_type: 'observational_study',
          evidence_level: 'moderate',
          year_from: 2018
        })
    }
  ];

  /** ---- ARTICLE HELPERS ---- */

  const filteredParagraphs =
    articleContent?.content?.bodyParagraphs && articleSearchTerm.trim()
      ? articleContent.content.bodyParagraphs.filter((p) =>
          p.toLowerCase().includes(articleSearchTerm.toLowerCase())
        )
      : articleContent?.content?.bodyParagraphs || [];

  const handleAskArticleSubmit = () => {
    if (!selectedPmcId || !articleQuestion.trim() || !onAskArticle) return;
    onAskArticle(selectedPmcId, articleQuestion.trim());
    setArticleQuestion('');
  };

  /** ---- RENDER ---- */

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
    >
      {/* Tab bar – simplified: Search, Claims, Article, Quality */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto overflow-y-hidden scrollbar-hide">
        {(() => {
          const tabs: { key: TabKey; label: string }[] = [
            { key: 'search', label: 'Search & Evidence' },
            { key: 'claims', label: 'Claims' },
            // Article tab only appears when user loads an article
            ...(selectedPmcId || articleContent
              ? [{ key: 'article' as TabKey, label: 'Article View' }]
              : []),
            // Quality tab only appears when there's chart data from a search
            ...(chartData
              ? [{ key: 'quality' as TabKey, label: 'Quality & Charts' }]
              : [])
          ];

          return tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-4 text-[15px] font-medium rounded-t-lg transition-all duration-200 relative leading-normal whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 border border-gray-200 border-b-white -mb-px'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ));
        })()}
      </div>

      {loading && (
        <Spinner
          overlay={true}
          title="Loading research data..."
          subtitle="Please wait"
        />
      )}

      {error && (
        <div
          style={{
            fontSize: 12,
            color: '#b91c1c',
            padding: '4px 6px'
          }}
        >
          {error}
        </div>
      )}

      {/* MAIN LAYOUT: left controls, right content */}
      <div
        style={{
          display: 'flex',
          flexDirection: windowWidth < 1024 ? 'column' : 'row',
          gap: 20
        }}
      >
        {/* LEFT – always shows presets + tools, regardless of tab */}
        <div
          style={{
            flex: windowWidth < 1024 ? '0 0 auto' : hasSearched ? '0 0 420px' : '1',
            display: 'flex',
            flexDirection: hasSearched ? 'column' : 'row',
            gap: 16,
            maxWidth: hasSearched ? undefined : '1200px',
            margin: hasSearched ? undefined : '0 auto',
            flexWrap: hasSearched ? undefined : 'wrap'
          }}
        >
          {/* Search presets */}
          <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm" style={{
            flex: hasSearched ? undefined : '1',
            minWidth: hasSearched ? undefined : '400px'
          }}>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Quick Research Domains</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  windowWidth < 480 ? '1fr' : windowWidth < 1024 ? '1fr 1fr' : '1fr',
                gap: 10
              }}
            >
              {presetButtons.map((b) => (
                <button
                  key={b.label}
                  onClick={b.onClick}
                  type="button"
                  className="px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-sm text-center w-full"
                >
                  {b.label}
                </button>
              ))}
            </div>
          </section>

          {/* Research Insights: Trends + Quality topic */}
          <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm" style={{
            flex: hasSearched ? undefined : '1',
            minWidth: hasSearched ? undefined : '400px'
          }}>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Research Insights</h2>

            {/* Trends */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Trends
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => runTrends('3months', 'nutrition')}
                  className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  3-month nutrition
                </button>
                <button
                  type="button"
                  onClick={() => runTrends('6months', 'lifestyle')}
                  className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  6-month lifestyle
                </button>
              </div>
            </div>

            {/* Quality topic */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Evidence quality topic
              </div>
              <input
                type="text"
                value={topicForQuality}
                onChange={(e) => setTopicForQuality(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: 13,
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  marginBottom: 6
                }}
              />
              <button
                type="button"
                onClick={runQuality}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Get quality metrics
              </button>
            </div>
          </section>
        </div>

        {/* RIGHT – main content by tab */}
        {activeTab === 'search' && hasSearched && (
          <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 p-4 max-h-[640px] flex flex-col">
            {/* SEARCH RESULTS */}
            <div style={{ fontSize: 15, flex: 1, overflowY: 'auto' }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 8
                }}
              >
                Search Results
              </div>

              {searchResults.length > 0 && (
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  {searchResults.map((r) => (
                    <li key={r.pmcid} className="p-2.5 rounded-lg border border-gray-200 bg-gray-50">
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 16,
                          marginBottom: 4
                        }}
                      >
                        {r.title}
                      </div>
                      <div style={{ color: '#4b5563', marginBottom: 2 }}>
                        {r.authors && (
                          <div style={{ fontSize: 14, marginBottom: 2 }}>
                            {r.authors}
                          </div>
                        )}
                        {r.journal || 'Journal n/a'} ·{' '}
                        {r.publicationYear ||
                          (r.publishedDate
                            ? new Date(r.publishedDate).getFullYear()
                            : 'Year n/a')}
                      </div>
                      <div style={{ color: '#6b7280', marginBottom: 4 }}>
                        {r.studyType && <span>{r.studyType} · </span>}
                        {r.evidenceLevel && (
                          <span>evidence: {r.evidenceLevel}</span>
                        )}
                        {r.relevanceScore !== undefined && (
                          <span> · score: {r.relevanceScore}</span>
                        )}
                      </div>
                      {r.links?.pmcWebsite && (
                        <div style={{ marginBottom: 6 }}>
                          <a
                            href={r.links.pmcWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#2563eb',
                              textDecoration: 'none',
                              fontSize: 14,
                              marginRight: 12
                            }}
                          >
                            PMC Article ↗
                          </a>
                          {r.links.pdfDownload && (
                            <a
                              href={r.links.pdfDownload}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#2563eb',
                                textDecoration: 'none',
                                fontSize: 14,
                                marginRight: 12
                              }}
                            >
                              PDF ↗
                            </a>
                          )}
                          {r.links.doi && (
                            <a
                              href={r.links.doi}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#2563eb',
                                textDecoration: 'none',
                                fontSize: 14
                              }}
                            >
                              DOI ↗
                            </a>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => loadArticleContent(r.pmcid)}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium"
                        style={{ fontSize: 14 }}
                      >
                        View full article
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* TRENDS SECTION – inline under Search */}
              {trends && trends.trending_topics && trends.trending_topics.length > 0 && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid #e5e7eb'
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      marginBottom: 6
                    }}
                  >
                    Trending Topics ({trends.timeframe})
                  </div>
                  {trends.trending_topics.map((t) => (
                    <div
                      key={t.topic}
                      style={{
                        padding: '6px 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.topic}</div>
                      <div style={{ color: '#6b7280', marginBottom: 2 }}>
                        Trend score: {t.trend_score} · new studies: {t.new_studies ?? '—'}
                      </div>
                      {t.key_developments && (
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: 16,
                            color: '#374151',
                            fontSize: 12
                          }}
                        >
                          {t.key_developments.map((k) => (
                            <li key={k}>{k}</li>
                          ))}
                        </ul>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          runSearch({
                            keyword: t.topic,
                            limit: 10
                          })
                        }
                        className="px-3 py-1 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-xs mt-1"
                      >
                        View studies on this topic
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 p-4 max-h-[640px] flex flex-col">
            {/* CLAIMS TAB */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 12
                }}
              >
                What does the evidence say?
              </div>
              
              {/* Claim input */}
              <div style={{ marginBottom: 16 }}>
                <textarea
                  value={claimText}
                  onChange={(e) => setClaimText(e.target.value)}
                  placeholder="Enter a health claim to evaluate..."
                  rows={3}
                  style={{
                    width: '100%',
                    fontSize: 14,
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    marginBottom: 8
                  }}
                />
                <div className="inline-block border-2 border-transparent rounded-full relative overflow-hidden" style={{
                  background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
                  backgroundSize: '100% 100%, 200% 100%',
                  animation: 'wiH-border-sweep 2.2s linear infinite'
                }}>
                  <style>{`
                    @keyframes wiH-border-sweep {
                      0% { background-position: 0% 0%, 0% 0%; }
                      100% { background-position: 0% 0%, 200% 0%; }
                    }
                  `}</style>
                  <button
                    type="button"
                    onClick={runClaimVerify}
                    className="bg-white text-black font-semibold px-6 py-3 text-sm rounded-full transition-all duration-200 whitespace-nowrap"
                  >
                    Evaluate evidence
                  </button>
                </div>
              </div>

              {/* Evidence Review Results */}
              {claimResult && (
                <div
                  style={{
                    backgroundColor: '#f9fafb',
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      marginBottom: 12,
                      color: '#111827'
                    }}
                  >
                    Evidence Review
                  </div>
                  
                  {/* Claim */}
                  <div style={{ marginBottom: 12 }}>
                    <strong style={{ color: '#374151' }}>Claim:</strong>{' '}
                    <span style={{ color: '#1f2937' }}>{claimResult.claim}</span>
                  </div>
                  
                  {/* Evidence Snapshot */}
                  {claimResult.verification_result && (
                    <div style={{ 
                      backgroundColor: '#ffffff',
                      padding: 12,
                      borderRadius: 6,
                      border: '1px solid #e5e7eb',
                      marginBottom: 12
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
                        Evidence Snapshot
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                        <div>
                          <strong style={{ color: '#374151' }}>Evidence strength:</strong>{' '}
                          <span style={{ color: '#1f2937' }}>
                            {claimResult.verification_result.evidence_strength || '—'}
                          </span>
                        </div>
                        <div>
                          <strong style={{ color: '#374151' }}>Confidence level:</strong>{' '}
                          <span style={{ color: '#1f2937' }}>
                            {claimResult.verification_result.confidence_level
                              ? (claimResult.verification_result.confidence_level * 100).toFixed(0) + '%'
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <strong style={{ color: '#374151' }}>Evidence assessment:</strong>{' '}
                          <span style={{ color: '#1f2937' }}>
                            {claimResult.verification_result.overall_verdict || '—'}
                          </span>
                        </div>
                        {claimResult.verification_result.recommendation && (
                          <div>
                            <strong style={{ color: '#374151' }}>Recommendation:</strong>{' '}
                            <span style={{ color: '#1f2937' }}>
                              {claimResult.verification_result.recommendation}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Claim specificity */}
                  {claimResult.claim_specificity && (
                    <div style={{ marginBottom: 8, fontSize: 13 }}>
                      <strong style={{ color: '#374151' }}>Claim specificity:</strong>{' '}
                      <span style={{ color: '#6b7280' }}>{claimResult.claim_specificity}</span>
                    </div>
                  )}
                  
                  {/* Accurate statement */}
                  {claimResult.claim_accuracy_rating?.accurate_statement && (
                    <div style={{ fontSize: 13 }}>
                      <strong style={{ color: '#374151' }}>More accurate statement:</strong>{' '}
                      <span style={{ color: '#1f2937' }}>
                        {claimResult.claim_accuracy_rating.accurate_statement}
                      </span>
                    </div>
                  )}
                  
                  {/* Explanation note */}
                  <div style={{ 
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid #e5e7eb',
                    fontSize: 12,
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    WIHY evaluates health claims by reviewing available evidence, not by declaring things true or false.
                  </div>
                </div>
              )}

              {!claimResult && (
                <div style={{ 
                  color: '#6b7280',
                  fontSize: 14,
                  textAlign: 'center',
                  padding: '40px 20px'
                }}>
                  Enter a health claim above and click "Evaluate evidence" to see the research-backed review.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'article' && (
          <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 p-4 max-h-[640px] flex flex-col">
            {/* ARTICLE TAB */}
            <div style={{ fontSize: 12, flex: 1, overflowY: 'auto' }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 6
                }}
              >
                Article
              </div>
              {!selectedPmcId && (
                <div style={{ color: '#6b7280' }}>
                  Select an article from the Search tab to view full content.
                </div>
              )}
              {selectedPmcId && !articleContent && !loading && (
                <div style={{ color: '#6b7280' }}>
                  No content loaded yet for {selectedPmcId}.
                </div>
              )}
              {articleContent && (
                <>
                  <div style={{ marginBottom: 6 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        marginBottom: 2
                      }}
                    >
                      {articleContent.content?.title || `PMC ${articleContent.pmcId}`}
                    </div>
                    <div style={{ color: '#4b5563', marginBottom: 2 }}>
                      {articleContent.content?.journal || 'Journal n/a'} ·{' '}
                      {articleContent.content?.publicationYear || 'Year n/a'}
                    </div>
                    {articleContent.links?.pmcWebsite && (
                      <a
                        href={articleContent.links.pmcWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 11,
                          color: '#2563eb',
                          textDecoration: 'none'
                        }}
                      >
                        Open on PubMed Central
                      </a>
                    )}
                  </div>

                  {articleContent.content?.keywords &&
                    articleContent.content.keywords.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 4,
                          marginBottom: 6
                        }}
                      >
                        {articleContent.content.keywords.map((kw) => (
                          <span
                            key={kw}
                            style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 999,
                              border: '1px solid #e5e7eb',
                              background: '#f3f4f6'
                            }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                  {articleContent.content?.abstract && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: '12px 16px',
                        borderRadius: 8,
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          marginBottom: 8
                        }}
                      >
                        Abstract
                      </div>
                      <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {renderTextWithLinks(articleContent.content.abstract)}
                      </div>
                    </div>
                  )}

                  {/* mini search within article */}
                  <div
                    style={{
                      marginBottom: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      Search within this article
                    </div>
                    <input
                      type="text"
                      value={articleSearchTerm}
                      onChange={(e) => setArticleSearchTerm(e.target.value)}
                      placeholder="e.g. stroke, HbA1c, mortality"
                      style={{
                        width: '100%',
                        fontSize: 14,
                        padding: 8,
                        borderRadius: 6,
                        border: '1px solid #d1d5db'
                      }}
                    />
                  </div>

                  {/* article body */}
                  {filteredParagraphs && filteredParagraphs.length > 0 && (
                    <div
                      style={{
                        padding: '12px 0',
                        borderTop: '1px solid #e5e7eb',
                        marginTop: 8
                      }}
                    >
                      {filteredParagraphs.map((p, i) => (
                        <p
                          key={i}
                          style={{
                            margin: '12px 0',
                            lineHeight: 1.7,
                            fontSize: 15,
                            color: '#111827',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {renderTextWithLinks(p)}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* mini ask box */}
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 6,
                      borderTop: '1px dashed #e5e7eb'
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      Ask WIHY about this article
                    </div>
                    <p
                      style={{
                        fontSize: 11,
                        margin: '0 0 4px',
                        color: '#6b7280'
                      }}
                    >
                      This sends the PMC ID and your question to your backend so WIHY can
                      use <code>/pmc/:pmcId/content</code> as context.
                    </p>
                    <textarea
                      value={articleQuestion}
                      onChange={(e) => setArticleQuestion(e.target.value)}
                      rows={2}
                      placeholder="e.g. How does this apply to a 55-year-old with hypertension?"
                      style={{
                        width: '100%',
                        fontSize: 12,
                        padding: 6,
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        marginBottom: 4
                      }}
                    />
                    <div className="inline-block border-2 border-transparent rounded-full relative overflow-hidden" style={{
                      background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
                      backgroundSize: '100% 100%, 200% 100%',
                      animation: 'wiH-border-sweep 2.2s linear infinite'
                    }}>
                      <style>{`
                        @keyframes wiH-border-sweep {
                          0% { background-position: 0% 0%, 0% 0%; }
                          100% { background-position: 0% 0%, 200% 0%; }
                        }
                      `}</style>
                      <button
                        type="button"
                        onClick={handleAskArticleSubmit}
                        disabled={!onAskArticle || !articleQuestion.trim()}
                        className="bg-white text-black font-semibold px-5 py-1.5 text-xs rounded-full transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {onAskArticle
                          ? 'Ask WIHY about this article'
                          : 'Connect onAskArticle to enable'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Charts from /search quality chart_data */}
            <div style={{ flex: 1 }}>
              {!chartData && (
                <div
                  className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 p-5 text-gray-600"
                >
                  Run a search query to populate research quality charts and study-type
                  distributions.
                </div>
              )}
              {chartData && (
                <DashboardCharts
                  period="week"
                  maxCards={4}
                  showAllCharts={true}
                  excludeChartTypes={Object.values(ChartType).filter(
                    (type) =>
                      type !== ChartType.RESEARCH_STUDY_TYPE_DISTRIBUTION &&
                      type !== ChartType.RESEARCH_PUBLICATION_TIMELINE &&
                      type !== ChartType.RESEARCH_EVIDENCE_QUALITY &&
                      type !== ChartType.RESEARCH_QUALITY
                  )}
                  isResearchLayout={true}
                  researchChartData={chartData}
                  onAnalyze={() => {}}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchPanel;
