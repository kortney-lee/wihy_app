import React, { useState } from 'react';
import DashboardCharts from '../charts/grids/DashboardCharts';
import { ChartType } from '../charts/chartTypes';

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
  pmcid: string;
  title: string;
  authors?: string[];
  journal?: string;
  publication_date?: string;
  study_type?: StudyType | string;
  evidence_level?: EvidenceLevel | string;
  participants?: number;
  relevance_score?: number;
  doi?: string;
};

type ResearchSearchResponse = {
  success: boolean;
  query: string;
  results: ResearchSearchResult[];
  total_found?: number;
  count?: number;
  evidence_summary?: {
    high_quality_studies?: number;
    moderate_quality_studies?: number;
    low_quality_studies?: number;
    overall_evidence_strength?: string;
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

type TabKey = 'search' | 'article' | 'trends' | 'quality' | 'claim';

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
    useState<ResearchSearchResponse['evidence_summary'] | null>(null);

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

  /** ---- API CALLS ---- */

  const runSearch = async (options: {
    q: string;
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
    try {
      const qs = buildQS({
        q: options.q,
        limit: options.limit ?? 10,
        year_from: options.year_from,
        study_type: options.study_type,
        evidence_level: options.evidence_level
      });
      const res = await fetch(`${RESEARCH_API_BASE}/api/research/search?${qs}`);
      if (!res.ok) throw new Error(`Search failed: ${res.status} ${res.statusText}`);
      const data: ResearchSearchResponse = await res.json();
      if (!data.success) throw new Error('Search not successful');
      setSearchResults(data.results || []);
      setEvidenceSummary(data.evidence_summary || null);
    } catch (e: any) {
      setError(e?.message || 'Error searching research.');
    } finally {
      setLoading(false);
    }
  };

  const runTrends = async (
    timeframe: '1month' | '3months' | '6months' | '1year',
    category?: string
  ) => {
    setActiveTab('trends');
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
    setActiveTab('claim');
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
          q: 'obesity insulin resistance metabolic syndrome GLP-1',
          study_type: 'randomized_controlled_trial',
          evidence_level: 'high',
          year_from: 2015
        })
    },
    {
      label: 'Cardiovascular – Mediterranean diet',
      onClick: () =>
        runSearch({
          q: 'Mediterranean diet cardiovascular events',
          study_type: 'meta_analysis',
          evidence_level: 'high',
          year_from: 2010
        })
    },
    {
      label: 'Type 2 Diabetes – remission',
      onClick: () =>
        runSearch({
          q: 'type 2 diabetes remission diet exercise',
          study_type: 'randomized_controlled_trial',
          evidence_level: 'moderate',
          year_from: 2010
        })
    },
    {
      label: 'Ultra-processed foods & health outcomes',
      onClick: () =>
        runSearch({
          q: 'ultra-processed foods NOVA health outcomes',
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
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid #e5e7eb',
          padding: '4px 4px 0'
        }}
      >
        {([
          { key: 'search', label: 'Search' },
          { key: 'article', label: 'Article' },
          { key: 'trends', label: 'Trends' },
          { key: 'quality', label: 'Quality' },
          { key: 'claim', label: 'Claims' }
        ] as { key: TabKey; label: string }[]).map((tab) => (
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
        ))}
        {loading && (
          <div
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: '#6b7280',
              paddingRight: 4
            }}
          >
            Loading…
          </div>
        )}
      </div>

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
        {/* LEFT – context + controls vary slightly but we keep them visible across tabs */}
        <div
          style={{
            flex: windowWidth < 1024 ? '0 0 auto' : '0 0 420px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {/* Search presets always visible */}
          <section className="research-card">
            <h2>
              Quick Research Domains
            </h2>
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

          {/* Claim + Trends + Quality controls grouped logically */}
          <section className="research-card">
            <h2>Tools</h2>

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
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Trends</div>
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

          {/* Types of research – clearly listed for clinicians */}
          <section className="research-card">
            <h2>
              Types of Research Available
            </h2>
            <p>
              Matches <code>study_type</code> and <code>evidence_level</code> filters in
              the WIHY Research API.
            </p>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
              <div>
                <strong>Study types</strong>: randomized_controlled_trial, meta_analysis,
                systematic_review, observational_study, case_control, cohort_study,
                cross_sectional, case_report, review.
              </div>
              <div style={{ marginTop: 6 }}>
                <strong>Evidence levels</strong>:
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  <li>high – meta-analyses, large RCTs</li>
                  <li>moderate – individual RCTs, well-designed cohorts</li>
                  <li>low – case studies, expert opinion, preliminary research</li>
                  <li>very_low – very early or biased evidence</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT – content area switches by tab */}
        {activeTab !== 'quality' && (
          <div className="research-content-card">
            {/* SEARCH RESULTS TAB */}
            {activeTab === 'search' && (
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
              {evidenceSummary && (
                <div style={{ marginBottom: 8, color: '#4b5563', fontSize: 13 }}>
                  Evidence summary: {evidenceSummary.overall_evidence_strength || '—'} ·
                  high: {evidenceSummary.high_quality_studies ?? 0} · moderate:{' '}
                  {evidenceSummary.moderate_quality_studies ?? 0} · low:{' '}
                  {evidenceSummary.low_quality_studies ?? 0}
                </div>
              )}
              {searchResults.length === 0 && (
                <div style={{ color: '#6b7280' }}>
                  Run a preset query on the left to pull RCTs, meta-analyses, or cohort
                  studies. Click an article to open the full body.
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
                    <li
                      key={r.pmcid}
                      className="research-result-item"
                    >
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
                        {r.journal || 'Journal n/a'} ·{' '}
                        {r.publication_date
                          ? new Date(r.publication_date).getFullYear()
                          : 'Year n/a'}
                      </div>
                      <div style={{ color: '#6b7280', marginBottom: 4 }}>
                        {r.study_type && <span>{r.study_type} · </span>}
                        {r.evidence_level && <span>evidence: {r.evidence_level}</span>}
                        {r.relevance_score !== undefined && (
                          <span> · score: {r.relevance_score.toFixed(2)}</span>
                        )}
                      </div>
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
            </div>
          )}

          {/* ARTICLE TAB */}
          {activeTab === 'article' && (
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
                  Select an article from the Search tab to load full content via
                  <code> /api/research/pmc/:pmcId/content</code>.
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
          )}

          {/* TRENDS TAB */}
          {activeTab === 'trends' && (
            <div style={{ fontSize: 12, flex: 1, overflowY: 'auto' }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 6
                }}
              >
                Trending Topics
              </div>
              {!trends && (
                <div style={{ color: '#6b7280' }}>
                  Use the tools on the left to load trends (nutrition or lifestyle).
                </div>
              )}
              {trends?.trending_topics?.map((t) => (
                <div
                  key={t.topic}
                  style={{
                    padding: '6px 0',
                    borderBottom: '1px solid #e5e7eb'
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
                        color: '#374151'
                      }}
                    >
                      {t.key_developments.map((k) => (
                        <li key={k}>{k}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CLAIM TAB */}
          {activeTab === 'claim' && (
            <div style={{ fontSize: 12, flex: 1, overflowY: 'auto' }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 6
                }}
              >
                Claim Verification
              </div>
              {!claimResult && (
                <div style={{ color: '#6b7280' }}>
                  Enter a claim on the left and click &quot;Check claim&quot; to use{' '}
                  <code>/api/research/verify</code>.
                </div>
              )}
              {claimResult && (
                <div>
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
          )}
          </div>
        )}

        {/* QUALITY TAB - Show charts directly without card wrapper */}
        {activeTab === 'quality' && (
          <div style={{ flex: 1 }}>
            <DashboardCharts
              period="week"
              maxCards={4}
              showAllCharts={true}
              excludeChartTypes={Object.values(ChartType).filter(
                type =>
                  type !== ChartType.STUDY_TYPE_DISTRIBUTION &&
                  type !== ChartType.PUBLICATION_TIMELINE &&
                  type !== ChartType.RESULT_QUALITY_PIE &&
                  type !== ChartType.RESEARCH_QUALITY
              )}
              isResearchLayout={true}
              onAnalyze={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchPanel;
