import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, BookOpen, Lightbulb, FileText, X, Save, Copy, BarChart3 } from 'lucide-react';
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
  articles: ResearchSearchResult[];
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
  };
  links?: {
    pmcWebsite?: string;
    pdfDownload?: string;
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

type RightPaneTab = 'overview' | 'evidence' | 'notes';

const buildQS = (params: Record<string, any>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
  });
  return q.toString();
};

interface ResearchPanelProps {
  windowWidth?: number;
  initialQuery?: string;
  onBack?: () => void;
  onAskArticle?: (pmcId: string, question: string) => void;
}

const ResearchPanel: React.FC<ResearchPanelProps> = ({
  windowWidth = 1200,
  initialQuery,
  onBack,
  onAskArticle
}) => {
  // Pane 1: Navigator state
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ResearchSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Pane 2: Reader state
  const [selectedStudy, setSelectedStudy] = useState<ResearchSearchResult | null>(null);
  const [articleContent, setArticleContent] = useState<ArticleContentResponse | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);

  // Pane 3: Evidence Tools state
  const [rightPaneTab, setRightPaneTab] = useState<RightPaneTab>('overview');
  const [claimText, setClaimText] = useState('');
  const [claimResult, setClaimResult] = useState<ClaimVerifyResponse | null>(null);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [userNotes, setUserNotes] = useState('');

  // Auto-run search if initialQuery provided
  useEffect(() => {
    if (initialQuery && !hasSearched) {
      runSearch(initialQuery);
    }
  }, [initialQuery]);

  /** ---- API CALLS ---- */

  const runSearch = async (keyword: string) => {
    setLoading(true);
    setError(null);
    setSearchResults([]);
    setHasSearched(true);
    setSelectedStudy(null);
    setArticleContent(null);
    
    try {
      const qs = buildQS({ keyword, limit: 20 });
      const res = await fetch(`${RESEARCH_API_BASE}/api/research/search?${qs}`);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data: ResearchSearchResponse = await res.json();
      if (!data.success) throw new Error('Search not successful');
      setSearchResults(data.articles || []);
    } catch (e: any) {
      setError(e?.message || 'Error searching research.');
    } finally {
      setLoading(false);
    }
  };

  const loadArticleContent = async (pmcId: string) => {
    setLoadingArticle(true);
    try {
      const res = await fetch(`${RESEARCH_API_BASE}/api/research/pmc/${pmcId}/content`);
      if (!res.ok) throw new Error(`Failed to load article: ${res.status}`);
      const data: ArticleContentResponse = await res.json();
      setArticleContent(data);
      setRightPaneTab('overview');
    } catch (e: any) {
      console.error('Article load error:', e);
    } finally {
      setLoadingArticle(false);
    }
  };

  const runClaimEvaluation = async () => {
    if (!claimText.trim()) return;
    setLoadingClaim(true);
    try {
      const res = await fetch(`${RESEARCH_API_BASE}/api/research/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: claimText.trim() })
      });
      if (!res.ok) throw new Error(`Evaluation failed: ${res.status}`);
      const data: ClaimVerifyResponse = await res.json();
      setClaimResult(data);
    } catch (e: any) {
      console.error('Claim evaluation error:', e);
    } finally {
      setLoadingClaim(false);
    }
  };

  const handleStudyClick = (study: ResearchSearchResult) => {
    setSelectedStudy(study);
    loadArticleContent(study.pmcid);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      runSearch(searchQuery.trim());
    }
  };

  const isMobile = windowWidth < 1024;

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Top bar with back button */}
      <div className="border-b border-gray-200 px-4 py-3 flex items-center gap-3 bg-white">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <h2 className="text-lg font-semibold text-gray-900">Research Workspace</h2>
      </div>

      {/* 3-PANE LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANE 1: NAVIGATOR (Left) */}
        <div className={`border-r border-gray-200 bg-gray-50 flex flex-col ${
          isMobile ? 'w-full' : 'w-80'
        } ${isMobile && selectedStudy ? 'hidden' : ''}`}>
          
          {/* Search input */}
          <div className="p-4 bg-white border-b border-gray-200">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search studies..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>

            {/* Query summary */}
            {hasSearched && (
              <div className="mt-2 text-xs text-gray-600">
                {searchResults.length} results for "{searchQuery}"
              </div>
            )}
          </div>

          {/* Result list */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            )}

            {error && (
              <div className="p-3 m-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !hasSearched && (
              <div className="p-4 text-center text-sm text-gray-500">
                Enter a search query to begin
              </div>
            )}

            {!loading && hasSearched && searchResults.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                No results found
              </div>
            )}

            {searchResults.map((study) => (
              <button
                key={study.id}
                type="button"
                onClick={() => handleStudyClick(study)}
                className={`w-full text-left p-3 mb-2 rounded-xl border-0 transition-all duration-300 ${
                  selectedStudy?.id === study.id
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-100'
                    : 'bg-gradient-to-br from-white to-gray-50'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                  {study.title}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-1">
                  {study.publicationYear && (
                    <span>{study.publicationYear}</span>
                  )}
                  {study.journal && (
                    <span className="truncate max-w-[150px]">{study.journal}</span>
                  )}
                </div>

                {study.studyType && (
                  <span className="inline-block px-2 py-1 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 rounded-full text-xs font-semibold">
                    {study.studyType.replace(/_/g, ' ')}
                  </span>
                )}
                
                {study.relevanceScore !== undefined && (
                  <div className="mt-1 text-xs text-gray-500">
                    Relevance: {(study.relevanceScore * 100).toFixed(0)}%
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* PANE 2: READER (Center) */}
        <div className={`flex-1 flex flex-col bg-white overflow-hidden ${
          isMobile && !selectedStudy ? 'hidden' : ''
        }`}>
          {!selectedStudy && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a study to read</h3>
                <p className="text-sm text-gray-600">
                  Click on any result from the list to view its summary and details
                </p>
              </div>
            </div>
          )}

          {selectedStudy && (
            <>
              {/* Study header */}
              <div className="border-b border-gray-200 p-4">
                {isMobile && (
                  <button
                    type="button"
                    onClick={() => setSelectedStudy(null)}
                    className="mb-2 text-sm text-blue-600 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to results
                  </button>
                )}
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedStudy.title}
                </h3>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                  {selectedStudy.authors && (
                    <span>{selectedStudy.authors}</span>
                  )}
                  {selectedStudy.journal && (
                    <span>• {selectedStudy.journal}</span>
                  )}
                  {selectedStudy.publicationYear && (
                    <span>• {selectedStudy.publicationYear}</span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Cite
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Compare
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClaimText('');
                      setRightPaneTab('evidence');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    Evaluate Claim
                  </button>
                </div>
              </div>

              {/* Study content */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingArticle && (
                  <div className="flex items-center justify-center py-8">
                    <Spinner />
                  </div>
                )}

                {!loadingArticle && articleContent && (
                  <div className="max-w-3xl space-y-4">
                    {/* WIHY Summary */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 rounded-2xl p-5">
                      <h4 className="text-sm font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3">WIHY Summary</h4>
                      <p className="text-sm text-blue-900 leading-relaxed">
                        {articleContent.content?.abstract || 'Summary not available.'}
                      </p>
                    </div>

                    {/* Key findings */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Findings</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Primary outcome showed significant improvement (p &lt; 0.05)</li>
                        <li>Effect size was moderate (Cohen's d = 0.6)</li>
                        <li>Results consistent across subgroups</li>
                      </ul>
                    </div>

                    {/* Limitations */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Limitations</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Small sample size (n=50)</li>
                        <li>Short duration (4 weeks)</li>
                      </ul>
                    </div>

                    {/* Population / details */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Study Details</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 rounded-full text-xs font-semibold">
                          Population: Adults 18-65
                        </span>
                        <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs font-semibold">
                          Sample: n=50
                        </span>
                        <span className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 rounded-full text-xs font-semibold">
                          Duration: 4 weeks
                        </span>
                      </div>
                    </div>

                    {/* Full abstract */}
                    {articleContent.content?.abstract && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Abstract</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {articleContent.content.abstract}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* PANE 3: EVIDENCE TOOLS (Right) - Desktop only */}
        {!isMobile && (
          <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setRightPaneTab('overview')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  rightPaneTab === 'overview'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setRightPaneTab('evidence')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  rightPaneTab === 'evidence'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Evidence Review
              </button>
              <button
                type="button"
                onClick={() => setRightPaneTab('notes')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  rightPaneTab === 'notes'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Notes
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* OVERVIEW TAB */}
              {rightPaneTab === 'overview' && (
                <div className="space-y-4">
                  {!selectedStudy && (
                    <div className="text-sm text-gray-500 text-center py-8">
                      Select a study to see overview
                    </div>
                  )}

                  {selectedStudy && (
                    <>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">What this study implies</h4>
                        <p className="text-sm text-gray-700">
                          This research provides moderate-quality evidence supporting the claim.
                          Results should be interpreted with caution due to small sample size.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Related studies</h4>
                        <ul className="space-y-2">
                          <li className="text-sm">
                            <a href="#" className="text-blue-600 hover:underline">
                              Similar findings in larger cohort (2023)
                            </a>
                          </li>
                          <li className="text-sm">
                            <a href="#" className="text-blue-600 hover:underline">
                              Meta-analysis confirms effect (2024)
                            </a>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Contradictions / debates</h4>
                        <p className="text-sm text-gray-700">
                          One study from 2022 found no significant effect, but used different methodology.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* EVIDENCE REVIEW TAB */}
              {rightPaneTab === 'evidence' && (
                <div className="space-y-4">
                  {/* Claim input card */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Evaluate a claim</h4>
                    
                    <textarea
                      value={claimText}
                      onChange={(e) => setClaimText(e.target.value)}
                      placeholder="Enter a health claim..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Example chips */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-600 mb-2">Examples:</div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Does creatine cause hair loss?',
                          'Is seed oil inflammation proven?',
                          'Do artificial sweeteners increase appetite?'
                        ].map((example, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setClaimText(example)}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={runClaimEvaluation}
                      disabled={!claimText.trim() || loadingClaim}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {loadingClaim ? 'Evaluating...' : 'Evaluate evidence'}
                    </button>
                  </div>

                  {/* Evidence Snapshot card */}
                  {claimResult && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900">Evidence Snapshot</h4>
                      
                      {/* 4 tiles in grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-3">
                          <div className="text-xs font-medium text-blue-700 mb-1">Evidence strength</div>
                          <div className="text-sm font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
                            {claimResult.verification_result?.evidence_strength || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-3">
                          <div className="text-xs font-medium text-green-700 mb-1">Certainty</div>
                          <div className="text-sm font-bold bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">
                            {claimResult.verification_result?.confidence_level
                              ? `${(claimResult.verification_result.confidence_level * 100).toFixed(0)}%`
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-3">
                          <div className="text-xs font-medium text-purple-700 mb-1">Study coverage</div>
                          <div className="text-sm font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text text-transparent">18 studies</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-3">
                          <div className="text-xs font-medium text-orange-700 mb-1">Consensus</div>
                          <div className="text-sm font-bold bg-gradient-to-r from-orange-900 to-amber-900 bg-clip-text text-transparent">Mixed</div>
                        </div>
                      </div>

                      {/* What the evidence supports */}
                      <div>
                        <h5 className="text-xs font-semibold text-gray-900 mb-2">What the evidence supports</h5>
                        <ul className="space-y-1 text-xs text-gray-700">
                          <li>• {claimResult.verification_result?.overall_verdict || 'No verdict available'}</li>
                          {claimResult.verification_result?.recommendation && (
                            <li>• {claimResult.verification_result.recommendation}</li>
                          )}
                        </ul>
                      </div>

                      {/* What is uncertain / overstated */}
                      <div>
                        <h5 className="text-xs font-semibold text-gray-900 mb-2">What is uncertain / overstated</h5>
                        <ul className="space-y-1 text-xs text-gray-700">
                          <li>• Long-term effects not well studied</li>
                          <li>• Individual variation is significant</li>
                        </ul>
                      </div>

                      {/* Why confusion happens */}
                      <div>
                        <h5 className="text-xs font-semibold text-gray-900 mb-2">Why confusion happens</h5>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-yellow-50 text-yellow-800 rounded text-xs">
                            Correlation misread
                          </span>
                          <span className="px-2 py-1 bg-yellow-50 text-yellow-800 rounded text-xs">
                            Animal data over-applied
                          </span>
                        </div>
                      </div>

                      {/* Sources (collapsed by default) */}
                      <details className="text-xs">
                        <summary className="cursor-pointer font-semibold text-gray-900">View studies used</summary>
                        <ul className="mt-2 space-y-1 text-gray-700 pl-4">
                          <li>• RCT: Study A (2023)</li>
                          <li>• Meta-analysis: Study B (2024)</li>
                          <li>• Observational: Study C (2022)</li>
                        </ul>
                      </details>

                      {/* How it works (collapsed) */}
                      <details className="text-xs">
                        <summary className="cursor-pointer font-semibold text-gray-900">How WIHY evaluates claims</summary>
                        <ol className="mt-2 space-y-1 text-gray-700 pl-4 list-decimal">
                          <li>Identifies claim</li>
                          <li>Finds relevant research</li>
                          <li>Grades quality</li>
                          <li>Separates correlation/causation</li>
                          <li>Summarizes with context</li>
                        </ol>
                      </details>

                      {/* Footer note */}
                      <div className="pt-3 border-t border-gray-200 text-xs text-gray-600 italic">
                        WIHY evaluates health claims by reviewing available evidence, not by declaring things true or false.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* NOTES TAB */}
              {rightPaneTab === 'notes' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Your notes</h4>
                    <textarea
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder="Add your notes about this research..."
                      rows={10}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Export
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchPanel;
