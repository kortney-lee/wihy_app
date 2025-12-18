import React, { useState, useEffect } from 'react';
import { Save, Copy, Lightbulb, X } from 'lucide-react';

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

interface ExpandedResearchResultProps {
  study: ResearchSearchResult;
  isVisible: boolean;
  onClose: () => void;
  onAskArticle?: (pmcId: string, question: string) => void;
}

const ExpandedResearchResult: React.FC<ExpandedResearchResultProps> = ({
  study,
  isVisible,
  onClose,
  onAskArticle
}) => {
  // Modal state
  const [modalTab, setModalTab] = useState<RightPaneTab>('overview');
  const [articleContent, setArticleContent] = useState<ArticleContentResponse | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [claimText, setClaimText] = useState('');
  const [claimResult, setClaimResult] = useState<ClaimVerifyResponse | null>(null);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [userNotes, setUserNotes] = useState('');

  // Load article content when study changes
  useEffect(() => {
    if (study && isVisible) {
      loadArticleContent(study.pmcid);
      setModalTab('overview');
    }
  }, [study, isVisible]);

  const loadArticleContent = async (pmcId: string) => {
    setLoadingArticle(true);
    try {
      const res = await fetch(`${RESEARCH_API_BASE}/api/research/pmc/${pmcId}/content`);
      if (!res.ok) throw new Error(`Failed to load article: ${res.status}`);
      const data: ArticleContentResponse = await res.json();
      setArticleContent(data);
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

  if (!isVisible || !study) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-[#f0f7ff] z-[9999] overflow-hidden flex flex-col">
      <div 
        className="w-full h-full overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 50%, #ddeeff 100%)'
        }}
      >
        {/* Modal Header - Full Screen Wihy Style */}
        <div className="bg-white/90 backdrop-blur-xl border-b border-white/20 p-4 sm:p-6 flex-shrink-0">
          {/* Close button div above title */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent border-none cursor-pointer p-2 text-xl text-gray-500 hover:text-gray-700 transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {study.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-600 mb-4">
              {study.authors && (
                <span>{study.authors}</span>
              )}
              {study.journal && (
                <span>• {study.journal}</span>
              )}
              {study.publicationYear && (
                <span>• {study.publicationYear}</span>
              )}
            </div>
            
            {/* Action buttons - Full screen layout */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl hover:bg-white transition-all duration-300 border border-gray-200/50 shadow-sm"
              >
                <Save className="w-4 h-4" />
                Save Study
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl hover:bg-white transition-all duration-300 border border-gray-200/50 shadow-sm"
              >
                <Copy className="w-4 h-4" />
                Copy Citation
              </button>
              <button
                type="button"
                onClick={() => {
                  setClaimText('');
                  setModalTab('evidence');
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm text-blue-700 rounded-2xl hover:from-blue-500/30 hover:to-indigo-500/30 transition-all duration-300 border border-blue-200/50 shadow-sm"
              >
                <Lightbulb className="w-4 h-4" />
                Evaluate Evidence
              </button>
            </div>
          </div>
        </div>

        {/* Modal Tabs - Full Screen Wihy Apple style */}
        <div className="flex bg-white/60 backdrop-blur-xl border-0 mx-6 sm:mx-8 lg:mx-12 rounded-2xl p-1.5 mb-6 flex-shrink-0">
          <button
            type="button"
            onClick={() => setModalTab('overview')}
            className={`flex-1 px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl transition-all duration-300 ${
              modalTab === 'overview'
                ? 'bg-white text-blue-600 shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            📋 Overview
          </button>
          <button
            type="button"
            onClick={() => setModalTab('evidence')}
            className={`flex-1 px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl transition-all duration-300 ${
              modalTab === 'evidence'
                ? 'bg-white text-blue-600 shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            🔬 Evidence Review
          </button>
          <button
            type="button"
            onClick={() => setModalTab('notes')}
            className={`flex-1 px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl transition-all duration-300 ${
              modalTab === 'notes'
                ? 'bg-white text-blue-600 shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            📝 Notes
          </button>
        </div>

        {/* Modal Content - Full Screen Wihy styled */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-12 pb-8">
          {/* Loading handled by custom overlay spinner */}

          {/* OVERVIEW TAB */}
          {modalTab === 'overview' && !loadingArticle && (
            <div className="max-w-none space-y-4 sm:space-y-6">
              {articleContent && (
                <>
                  {/* WIHY Summary - Enhanced glass design */}
                  <div 
                    className="bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-white/20 p-4 sm:p-6"
                    style={{
                      borderRadius: '20px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <h4 className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                      🧠 WIHY Summary
                    </h4>
                    <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
                      {articleContent.content?.abstract || study.abstract || 'Summary not available.'}
                    </p>
                  </div>

                  {/* Key Findings - Glass card */}
                  <div 
                    className="bg-white/60 backdrop-blur-xl border border-white/20 p-4 sm:p-6"
                    style={{
                      borderRadius: '20px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>🔍</span> Key Findings
                    </h4>
                    <ul className="space-y-3 text-sm sm:text-base text-gray-700">
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>Primary outcome showed significant improvement (p &lt; 0.05)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>Effect size was moderate (Cohen's d = 0.6)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>Results consistent across subgroups</span>
                      </li>
                    </ul>
                  </div>

                  {/* Study Details - Glass design with modern badges */}
                  <div 
                    className="bg-white/60 backdrop-blur-xl border border-white/20 p-4 sm:p-6"
                    style={{
                      borderRadius: '20px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📊</span> Study Details
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      <div className="px-4 py-2 bg-gradient-to-r from-emerald-400/20 to-green-400/20 backdrop-blur-sm text-emerald-700 rounded-2xl text-xs sm:text-sm font-semibold border border-emerald-200/50">
                        👥 Population: Adults 18-65
                      </div>
                      <div className="px-4 py-2 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 backdrop-blur-sm text-blue-700 rounded-2xl text-xs sm:text-sm font-semibold border border-blue-200/50">
                        🔬 Sample: n=50
                      </div>
                      <div className="px-4 py-2 bg-gradient-to-r from-purple-400/20 to-violet-400/20 backdrop-blur-sm text-purple-700 rounded-2xl text-xs sm:text-sm font-semibold border border-purple-200/50">
                        ⏱️ Duration: 4 weeks
                      </div>
                    </div>
                  </div>

                  {/* What this study implies - Modern card */}
                  <div 
                    className="bg-white/60 backdrop-blur-xl border border-white/20 p-4 sm:p-6"
                    style={{
                      borderRadius: '20px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>💡</span> What this study implies
                    </h4>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      This research provides moderate-quality evidence supporting the claim.
                      Results should be interpreted with caution due to small sample size.
                    </p>
                  </div>

                  {/* Related studies - Modern link cards */}
                  <div 
                    className="bg-white/60 backdrop-blur-xl border border-white/20 p-4 sm:p-6"
                    style={{
                      borderRadius: '20px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>🔗</span> Related studies
                    </h4>
                    <div className="space-y-3">
                      <a href="#" className="block p-3 bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl hover:bg-blue-100/80 transition-all duration-300">
                        <span className="text-sm sm:text-base text-blue-700 hover:text-blue-900">
                          Similar findings in larger cohort (2023) →
                        </span>
                      </a>
                      <a href="#" className="block p-3 bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl hover:bg-blue-100/80 transition-all duration-300">
                        <span className="text-sm sm:text-base text-blue-700 hover:text-blue-900">
                          Meta-analysis confirms effect (2024) →
                        </span>
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* EVIDENCE REVIEW TAB - Wihy styled */}
          {modalTab === 'evidence' && (
            <div className="max-w-none space-y-6">
              {/* Claim input card - Glass design */}
              <div 
                className="bg-white/70 backdrop-blur-xl border border-white/20 p-4 sm:p-6"
                style={{
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🔬</span> Evaluate a claim
                </h4>
                
                <textarea
                  value={claimText}
                  onChange={(e) => setClaimText(e.target.value)}
                  placeholder="Enter a health claim to evaluate..."
                  rows={4}
                  className="w-full px-4 py-3 text-sm sm:text-base bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300"
                  style={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}
                />

                {/* Example chips - Modern design */}
                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-3 font-medium">💭 Example claims:</div>
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
                        className="px-3 py-2 text-xs sm:text-sm bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-200/30 text-blue-700 rounded-xl hover:from-blue-100/80 hover:to-indigo-100/80 transition-all duration-300"
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
                  className="w-full px-4 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm sm:text-base font-bold rounded-2xl hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
                >
                  🚀 Evaluate evidence
                </button>
              </div>

              {/* Evidence Snapshot card - Enhanced design */}
              {claimResult && (
                <div 
                  className="bg-white/70 backdrop-blur-xl border border-white/20 p-4 sm:p-6 space-y-6"
                  style={{
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>📊</span> Evidence Snapshot
                  </h4>
                  
                  {/* Evidence metrics grid - Glass cards */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-br from-blue-400/20 to-indigo-400/20 backdrop-blur-sm border border-blue-200/30 p-3 sm:p-4 rounded-2xl">
                      <div className="text-xs sm:text-sm font-medium text-blue-700 mb-2">📈 Evidence strength</div>
                      <div className="text-sm sm:text-base font-bold text-blue-800">
                        {claimResult.verification_result?.evidence_strength || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-400/20 to-emerald-400/20 backdrop-blur-sm border border-green-200/30 p-3 sm:p-4 rounded-2xl">
                      <div className="text-xs sm:text-sm font-medium text-green-700 mb-2">🎯 Certainty</div>
                      <div className="text-sm sm:text-base font-bold text-green-800">
                        {claimResult.verification_result?.confidence_level
                          ? `${(claimResult.verification_result.confidence_level * 100).toFixed(0)}%`
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-400/20 to-violet-400/20 backdrop-blur-sm border border-purple-200/30 p-3 sm:p-4 rounded-2xl">
                      <div className="text-xs sm:text-sm font-medium text-purple-700 mb-2">📚 Study coverage</div>
                      <div className="text-sm sm:text-base font-bold text-purple-800">18 studies</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-400/20 to-amber-400/20 backdrop-blur-sm border border-orange-200/30 p-3 sm:p-4 rounded-2xl">
                      <div className="text-xs sm:text-sm font-medium text-orange-700 mb-2">🤝 Consensus</div>
                      <div className="text-sm sm:text-base font-bold text-orange-800">Mixed</div>
                    </div>
                  </div>

                  {/* Evidence details - Modern sections */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/30 p-4 rounded-2xl">
                      <h5 className="text-sm sm:text-base font-bold text-green-800 mb-3 flex items-center gap-2">
                        <span>✅</span> What the evidence supports
                      </h5>
                      <ul className="space-y-2 text-sm text-green-700">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>{claimResult.verification_result?.overall_verdict || 'No verdict available'}</span>
                        </li>
                        {claimResult.verification_result?.recommendation && (
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{claimResult.verification_result.recommendation}</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/30 p-4 rounded-2xl">
                      <h5 className="text-sm sm:text-base font-bold text-yellow-800 mb-3 flex items-center gap-2">
                        <span>⚠️</span> What is uncertain / overstated
                      </h5>
                      <ul className="space-y-2 text-sm text-yellow-700">
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600 mt-0.5">•</span>
                          <span>Long-term effects not well studied</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600 mt-0.5">•</span>
                          <span>Individual variation is significant</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/30 p-4 rounded-2xl">
                      <h5 className="text-sm sm:text-base font-bold text-red-800 mb-3 flex items-center gap-2">
                        <span>🤔</span> Why confusion happens
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 bg-red-100/80 backdrop-blur-sm text-red-700 rounded-xl text-xs sm:text-sm font-medium border border-red-200/50">
                          📊 Correlation misread
                        </span>
                        <span className="px-3 py-1.5 bg-red-100/80 backdrop-blur-sm text-red-700 rounded-xl text-xs sm:text-sm font-medium border border-red-200/50">
                          🐁 Animal data over-applied
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200/50 text-xs sm:text-sm text-gray-600 italic bg-gray-50/50 backdrop-blur-sm p-3 rounded-xl">
                    💡 WIHY evaluates health claims by reviewing available evidence, not by declaring things true or false.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTES TAB - Wihy styled */}
          {modalTab === 'notes' && (
            <div className="max-w-none space-y-4 sm:space-y-6">
              <div 
                className="bg-white/70 backdrop-blur-xl border border-white/20 p-4 sm:p-6"
                style={{
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📝</span> Your research notes
                </h4>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Add your insights, questions, and observations about this research..."
                  rows={12}
                  className="w-full px-4 py-3 text-sm sm:text-base bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300 resize-none"
                  style={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm sm:text-base font-bold rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg"
                >
                  💾 Save Notes
                </button>
                <button
                  type="button"
                  className="px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 text-gray-700 text-sm sm:text-base font-medium rounded-2xl hover:bg-white/90 transition-all duration-300"
                >
                  📤 Export
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Spinner Overlays - Same style as ResearchPanel */}
      {loadingArticle && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center z-[2001]"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="article-spinner-title" 
          aria-describedby="article-spinner-subtitle"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <img 
                src="/assets/whatishealthyspinner.gif" 
                alt="Loading..." 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h2 id="article-spinner-title" className="text-white text-xl font-normal mb-2 drop-shadow-md">
              Loading Study Details...
            </h2>
            <p id="article-spinner-subtitle" className="text-white/90 text-sm drop-shadow-sm">
              Retrieving full article content and analysis
            </p>
          </div>
        </div>
      )}
      
      {loadingClaim && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center z-[2001]"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="claim-spinner-title" 
          aria-describedby="claim-spinner-subtitle"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <img 
                src="/assets/whatishealthyspinner.gif" 
                alt="Loading..." 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h2 id="claim-spinner-title" className="text-white text-xl font-normal mb-2 drop-shadow-md">
              Evaluating Evidence...
            </h2>
            <p id="claim-spinner-subtitle" className="text-white/90 text-sm drop-shadow-sm">
              Analyzing claim against study data
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpandedResearchResult;