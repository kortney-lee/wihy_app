import React, { useState, useEffect } from 'react';
import DashboardCharts from '../charts/grids/DashboardCharts';
import { ChartType } from '../charts/chartTypes';
import Spinner from '../ui/Spinner';

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

type TabKey = 'search' | 'article' | 'quality';

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
      {/* Tab bar – simplified: Search, Article, Quality */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid #e5e7eb',
          padding: '4px 4px 0'
        }}
      >
        {(() => {
          const tabs: { key: TabKey; label: string }[] = [
            { key: 'search', label: 'Search & Tools' },
            // Article tab only appears when user loads an article
            ...(selectedPmcId || articleContent
              ? [{ key: 'article' as TabKey, label: 'Article View' }]
              : []),
            { key: 'quality', label: 'Quality & Charts' }
          ];

          return tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                border: 'none',
                borderBottom:
                  activeTab === tab.key ? '2px solid #16a34a' : '2px solid transparent',
                background: 'transparent',
                padding: '6px 10px',
                fontSize: 12,
                cursor: 'pointer',
                color: activeTab === tab.key ? '#111827' : '#6b7280',
                fontWeight: activeTab === tab.key ? 600 : 500
              }}
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
            flex: windowWidth < 1024 ? '0 0 auto' : '0 0 420px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {/* Search presets */}
          <section className="research-card">
            <h2>Quick Research Domains</h2>
            <p>
              One-click searches on <code>/api/research/search</code> with study type and
              evidence filters.
            </p>
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
                  className="search-btn secondary"
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    fontSize: 14,
                    minWidth: 'unset',
                    width: '100%',
                    height: 'auto'
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </section>

          {/* Tools: Claim verify + Trends + Quality topic */}
          <section className="research-card">
            <h2>Tools</h2>

            {/* Quality Assessment from last search */}
            {evidenceSummary && (
              <div
                style={{
                  marginBottom: 14,
                  padding: 12,
                  background: '#f3f4f6',
                  borderRadius: 6
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                  Quality Assessment
                </div>
                <div
                  style={{
                    color: '#4b5563',
                    fontSize: 13,
                    marginBottom: 4
                  }}
                >
                  <strong>Grade:</strong> {evidenceSummary.evidenceGrade || '—'} ·{' '}
                  <strong>Quality:</strong> {evidenceSummary.qualityLevel || '—'} ·{' '}
                  <strong>Confidence:</strong> {evidenceSummary.confidence || '—'}
                </div>
                {evidenceSummary.researchSummary && (
                  <div
                    style={{
                      color: '#6b7280',
                      fontSize: 12,
                      marginBottom: 4
                    }}
                  >
                    Total Available:{' '}
                    {evidenceSummary.researchSummary.totalAvailable?.toLocaleString() ||
                      0}{' '}
                    · Analyzed: {evidenceSummary.researchSummary.analyzed || 0} · Full
                    Text: {evidenceSummary.researchSummary.fullTextAccess || 0}
                  </div>
                )}
                {evidenceSummary.keyFindings &&
                  evidenceSummary.keyFindings.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 12 }}>
                      <strong>Key Findings:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                        {evidenceSummary.keyFindings.map((finding, idx) => (
                          <li key={idx}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {/* Claim verify */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Verify a health claim
              </div>
              <textarea
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                rows={3}
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
                onClick={runClaimVerify}
                className="search-btn primary"
                style={{
                  fontSize: 13,
                  padding: '8px 14px',
                  minWidth: 'unset'
                }}
              >
                Check claim (verify API)
              </button>
            </div>

            {/* Trends */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Trends
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => runTrends('3months', 'nutrition')}
                  className="search-btn secondary"
                  style={{
                    fontSize: 13,
                    padding: '8px 14px',
                    minWidth: 'unset'
                  }}
                >
                  3-month nutrition
                </button>
                <button
                  type="button"
                  onClick={() => runTrends('6months', 'lifestyle')}
                  className="search-btn secondary"
                  style={{
                    fontSize: 13,
                    padding: '8px 14px',
                    minWidth: 'unset'
                  }}
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
                className="search-btn secondary"
                style={{
                  fontSize: 13,
                  padding: '8px 14px',
                  minWidth: 'unset'
                }}
              >
                Get quality metrics
              </button>
            </div>
          </section>
        </div>

        {/* RIGHT – main content by tab */}
        {activeTab === 'search' && (
          <div className="research-content-card">
            {/* SEARCH RESULTS */}
            <div style={{ fontSize: 13, flex: 1, overflowY: 'auto' }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 8
                }}
              >
                Search Results
              </div>

              {searchResults.length === 0 && (
                <div style={{ color: '#6b7280', marginBottom: 12 }}>
                  Use the presets on the left to pull RCTs, meta-analyses, or cohort
                  studies. Click an article to open the full body with{' '}
                  <code>/pmc/:pmcId/content</code>.
                </div>
              )}

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
                    <li key={r.pmcid} className="research-result-item">
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          marginBottom: 4
                        }}
                      >
                        {r.title}
                      </div>
                      <div style={{ color: '#4b5563', marginBottom: 2 }}>
                        {r.authors && (
                          <div style={{ fontSize: 12, marginBottom: 2 }}>
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
                              fontSize: 13,
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
                                fontSize: 13,
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
                                fontSize: 13
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
                        className="search-btn primary"
                        style={{
                          fontSize: 13,
                          padding: '8px 14px',
                          minWidth: 'unset'
                        }}
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
                      fontSize: 14,
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
                        className="search-btn secondary"
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          padding: '4px 10px',
                          minWidth: 'unset'
                        }}
                      >
                        View studies on this topic
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* CLAIM SECTION – inline under Search */}
              {claimResult && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid #e5e7eb'
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 6
                    }}
                  >
                    Claim Verification
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Claim:</strong> {claimResult.claim}
                  </div>
                  {claimResult.claim_specificity && (
                    <div style={{ marginBottom: 4 }}>
                      <strong>Specificity:</strong> {claimResult.claim_specificity}
                    </div>
                  )}
                  {claimResult.verification_result && (
                    <div style={{ marginBottom: 4 }}>
                      <strong>Verdict:</strong>{' '}
                      {claimResult.verification_result.overall_verdict} (
                      {claimResult.verification_result.evidence_strength}) · confidence:{' '}
                      {claimResult.verification_result.confidence_level
                        ? (
                            claimResult.verification_result.confidence_level * 100
                          ).toFixed(0) + '%'
                        : '—'}
                      <div style={{ marginTop: 2 }}>
                        {claimResult.verification_result.recommendation}
                      </div>
                    </div>
                  )}
                  {claimResult.claim_accuracy_rating && (
                    <div>
                      <strong>Better wording:</strong>{' '}
                      {claimResult.claim_accuracy_rating.accurate_statement}
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        certainty: {claimResult.claim_accuracy_rating.certainty_level}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'article' && (
          <div className="research-content-card">
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
                        marginBottom: 8,
                        padding: '6px 8px',
                        borderRadius: 8,
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 3
                        }}
                      >
                        Abstract
                      </div>
                      <div style={{ fontSize: 12, color: '#374151' }}>
                        {articleContent.content.abstract}
                      </div>
                    </div>
                  )}

                  {/* mini search within article */}
                  <div
                    style={{
                      marginBottom: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      Search within this article
                    </div>
                    <input
                      type="text"
                      value={articleSearchTerm}
                      onChange={(e) => setArticleSearchTerm(e.target.value)}
                      placeholder="e.g. stroke, HbA1c, mortality"
                      style={{
                        width: '100%',
                        fontSize: 12,
                        padding: 6,
                        borderRadius: 6,
                        border: '1px solid #d1d5db'
                      }}
                    />
                  </div>

                  {/* article body */}
                  {filteredParagraphs && filteredParagraphs.length > 0 && (
                    <div
                      style={{
                        padding: '6px 0',
                        borderTop: '1px solid #e5e7eb',
                        marginTop: 4
                      }}
                    >
                      {filteredParagraphs.map((p, i) => (
                        <p
                          key={i}
                          style={{
                            margin: '4px 0',
                            lineHeight: 1.4,
                            fontSize: 12,
                            color: '#111827'
                          }}
                        >
                          {p}
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
                    <button
                      type="button"
                      onClick={handleAskArticleSubmit}
                      disabled={!onAskArticle || !articleQuestion.trim()}
                      className="search-btn primary"
                      style={{
                        fontSize: 12,
                        padding: '4px 9px',
                        minWidth: 'unset',
                        opacity: !onAskArticle || !articleQuestion.trim() ? 0.5 : 1,
                        cursor:
                          !onAskArticle || !articleQuestion.trim()
                            ? 'not-allowed'
                            : 'pointer'
                      }}
                    >
                      {onAskArticle
                        ? 'Ask WIHY about this article'
                        : 'Connect onAskArticle to enable'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Quality metrics from /quality-metrics */}
            <div className="research-content-card" style={{ flex: '0 0 auto' }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 6
                }}
              >
                Evidence Quality Overview
              </div>
              {!quality && (
                <div style={{ color: '#6b7280' }}>
                  Enter a topic on the left (e.g. <code>intermittent_fasting</code>) and
                  click &quot;Get quality metrics&quot; to see structured evidence
                  grading.
                </div>
              )}
              {quality && (
                <div style={{ fontSize: 13 }}>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Topic:</strong> {quality.topic}
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Overall grade:</strong>{' '}
                    {quality.quality_assessment?.overall_evidence_grade || '—'}
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Study quality distribution:</strong>
                    <div>
                      high:{' '}
                      {quality.quality_assessment?.study_quality_distribution
                        ?.high_quality ?? 0}{' '}
                      · moderate:{' '}
                      {quality.quality_assessment?.study_quality_distribution
                        ?.moderate_quality ?? 0}{' '}
                      · low:{' '}
                      {quality.quality_assessment?.study_quality_distribution
                        ?.low_quality ?? 0}{' '}
                      · very low:{' '}
                      {quality.quality_assessment?.study_quality_distribution
                        ?.very_low_quality ?? 0}
                    </div>
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Research maturity:</strong>{' '}
                    {quality.quality_assessment?.research_maturity || '—'}
                  </div>
                  <div>
                    <strong>Evidence consistency:</strong>{' '}
                    {quality.quality_assessment?.evidence_consistency || '—'}
                  </div>
                </div>
              )}
            </div>

            {/* Charts from /search quality chart_data */}
            <div style={{ flex: 1 }}>
              {!chartData && (
                <div
                  className="research-content-card"
                  style={{ color: '#6b7280', padding: 20 }}
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
