import React, { useState, useEffect } from 'react';
import { Save, Copy, Lightbulb, X, FileText, FlaskConical, NotebookPen, ExternalLink, Info } from 'lucide-react';

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
                className="flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl hover:bg-white transition-all duration-300 border border-gray-200/50"
              >
                <Save className="w-4 h-4" />
                Save Study
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl hover:bg-white transition-all duration-300 border border-gray-200/50"
              >
                <Copy className="w-4 h-4" />
                Copy Citation
              </button>
              
              {/* Direct Access Links */}
              {(study.links?.pmcWebsite || articleContent?.links?.pmcWebsite) && (
                <a
                  href={study.links?.pmcWebsite || articleContent?.links?.pmcWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl hover:bg-white transition-all duration-300 border border-gray-200/50"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on PMC
                </a>
              )}
              {study.links?.pubmedLink && (
                <a
                  href={study.links.pubmedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl hover:bg-white transition-all duration-300 border border-gray-200/50"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on PubMed
                </a>
              )}
              {(study.links?.pdfDownload || articleContent?.links?.pdfDownload) && (
                <a
                  href={study.links?.pdfDownload || articleContent?.links?.pdfDownload}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl hover:bg-white transition-all duration-300 border border-gray-200/50"
                >
                  <ExternalLink className="w-4 h-4" />
                  Download PDF
                </a>
              )}
              
              <button
                type="button"
                onClick={() => {
                  setClaimText('');
                  setModalTab('evidence');
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm text-blue-700 rounded-2xl hover:from-blue-500/30 hover:to-indigo-500/30 transition-all duration-300 border border-blue-200/50"
              >
                <Lightbulb className="w-4 h-4" />
                Review Evidence
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content - Full Screen Wihy styled */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-12 pb-8">
          {/* Modal Tabs - Inside content area */}
          <div className="flex bg-white/60 backdrop-blur-xl border-0 rounded-2xl p-1.5 mt-6 mb-6 flex-shrink-0">
            <button
              type="button"
              onClick={() => setModalTab('overview')}
              className={`flex items-center gap-2 flex-1 px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl transition-all duration-300 ${
                modalTab === 'overview'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 bg-blue-50/40'
              }`}
            >
              <FileText className="w-4 h-4" />
              Overview
            </button>
            <button
              type="button"
              onClick={() => setModalTab('evidence')}
              className={`flex items-center gap-2 flex-1 px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl transition-all duration-300 ${
                modalTab === 'evidence'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/80 bg-emerald-50/40'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              Evidence Review
            </button>
            <button
              type="button"
              onClick={() => setModalTab('notes')}
              className={`flex items-center gap-2 flex-1 px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl transition-all duration-300 ${
                modalTab === 'notes'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50/80 bg-purple-50/40'
              }`}
            >
              <NotebookPen className="w-4 h-4" />
              Notes
            </button>
          </div>
          {/* Loading handled by custom overlay spinner */}

          {/* OVERVIEW TAB */}
          {modalTab === 'overview' && !loadingArticle && (
            <div className="max-w-none">
              {articleContent && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column (Wider) - Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* WIHY Summary - Enhanced glass design */}
                    <div 
                      className="bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-white/20 p-6"
                      style={{
                        borderRadius: '20px'
                      }}
                    >
                      <h4 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                        WIHY Summary
                      </h4>
                      <div className="text-base text-gray-800 leading-relaxed space-y-4">
                        {(articleContent.content?.abstract || study.abstract) ? (
                          (articleContent.content?.abstract || study.abstract)
                            .split('. ')
                            .reduce((acc, sentence, index, array) => {
                              if (index % 3 === 0) {
                                acc.push([sentence + (index < array.length - 1 ? '.' : '')]);
                              } else {
                                acc[acc.length - 1].push(sentence + (index < array.length - 1 ? '.' : ''));
                              }
                              return acc;
                            }, [])
                            .map((paragraph, idx) => (
                              <p key={idx}>{paragraph.join(' ')}</p>
                            ))
                        ) : (
                          <p>Summary not available.</p>
                        )}
                      </div>
                    </div>

                    {/* Body/Abstract Content */}
                    {articleContent.content?.bodyParagraphs && articleContent.content.bodyParagraphs.length > 0 && (
                      <div 
                        className="bg-white/60 backdrop-blur-xl border border-white/20 p-6"
                        style={{
                          borderRadius: '20px'
                        }}
                      >
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Article Content
                        </h4>
                        <div className="space-y-4 text-gray-700 leading-relaxed">
                          {articleContent.content.bodyParagraphs.slice(0, 3).map((paragraph, idx) => {
                            // Clean and format paragraph
                            let cleanParagraph = paragraph
                              .replace(/&#x[0-9a-fA-F]{2,4};/g, '') // Remove HTML entities
                              .replace(/\s+/g, ' ') // Normalize spaces
                              .trim();
                            
                            // If it's a metadata block, try to extract meaningful parts
                            if (cleanParagraph.includes('Frontiers') || cleanParagraph.includes('PMC') || cleanParagraph.length > 800) {
                              // Try to extract the title and author information
                              const titleMatch = cleanParagraph.match(/([A-Z][a-z\s]+(?:type\s2\s)?diabetes[^A-Z]*)/i);
                              const authorsMatch = cleanParagraph.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*(?:\s\d+\s?\*?\s?){1,3}(?:[A-Z][a-z]+\s?)+)/g);
                              
                              if (titleMatch || authorsMatch) {
                                return (
                                  <div key={idx} className="space-y-3 border-l-4 border-blue-200 pl-4 bg-blue-50/30 rounded-r-lg p-4">
                                    <h5 className="font-semibold text-gray-900">Study Information</h5>
                                    {titleMatch && (
                                      <p className="text-sm"><strong>Title:</strong> {titleMatch[1].trim()}</p>
                                    )}
                                    {authorsMatch && authorsMatch.length > 0 && (
                                      <p className="text-sm"><strong>Authors:</strong> {authorsMatch.slice(0, 3).join(', ')}...</p>
                                    )}
                                    <p className="text-xs text-gray-500 italic">
                                      Use the access links above to view the complete published study.
                                    </p>
                                  </div>
                                );
                              }
                            }
                            
                            // For regular content, split into readable chunks
                            if (cleanParagraph.length > 100 && cleanParagraph.includes('.')) {
                              const sentences = cleanParagraph.split(/(?<=[.!?])\s+/);
                              const chunks = [];
                              for (let i = 0; i < sentences.length; i += 2) {
                                chunks.push(sentences.slice(i, i + 2).join(' '));
                              }
                              
                              return (
                                <div key={idx} className="space-y-3">
                                  {chunks.map((chunk, chunkIdx) => (
                                    chunk.trim() && <p key={`${idx}-${chunkIdx}`} className="text-sm leading-relaxed">{chunk}</p>
                                  ))}
                                </div>
                              );
                            }
                            
                            // For shorter content, display as is
                            return cleanParagraph.length > 20 ? (
                              <p key={idx} className="text-sm leading-relaxed">{cleanParagraph}</p>
                            ) : null;
                          }).filter(Boolean)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column (Narrower) - Study Details & Links */}
                  <div className="space-y-6">
                    {/* Study Details - Compact card */}
                    <div 
                      className="bg-white/70 backdrop-blur-xl border border-white/20 p-4"
                      style={{
                        borderRadius: '16px'
                      }}
                    >
                      <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Study Details
                      </h4>
                      <div className="space-y-3">
                        {study.studyType && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-medium text-gray-900 capitalize">
                              {study.studyType.replace(/_/g, ' ')}
                            </span>
                          </div>
                        )}
                        {study.evidenceLevel && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Evidence Level:</span>
                            <span className="font-medium text-gray-900 capitalize">
                              {study.evidenceLevel.replace(/_/g, ' ')}
                            </span>
                          </div>
                        )}
                        {study.researchArea && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Area:</span>
                            <span className="font-medium text-gray-900">
                              {study.researchArea}
                            </span>
                          </div>
                        )}
                        {study.relevanceScore && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Relevance:</span>
                            <span className="font-medium text-gray-900">
                              {Math.round(study.relevanceScore * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Links - Compact card */}
                    {(study.links?.pmcWebsite || study.links?.pubmedLink || study.links?.pdfDownload || articleContent.links?.pmcWebsite || articleContent.links?.pdfDownload) && (
                      <div 
                        className="bg-white/70 backdrop-blur-xl border border-white/20 p-4"
                        style={{
                          borderRadius: '16px'
                        }}
                      >
                        <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Access
                        </h4>
                        <div className="space-y-2">
                          {(study.links?.pmcWebsite || articleContent.links?.pmcWebsite) && (
                            <a 
                              href={study.links?.pmcWebsite || articleContent.links?.pmcWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full p-2 text-sm bg-blue-50/80 text-blue-700 rounded-lg hover:bg-blue-100/80 transition-colors text-center"
                            >
                              View on PMC
                            </a>
                          )}
                          {study.links?.pubmedLink && (
                            <a 
                              href={study.links.pubmedLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full p-2 text-sm bg-green-50/80 text-green-700 rounded-lg hover:bg-green-100/80 transition-colors text-center"
                            >
                              View on PubMed
                            </a>
                          )}
                          {(study.links?.pdfDownload || articleContent.links?.pdfDownload) && (
                            <a 
                              href={study.links?.pdfDownload || articleContent.links?.pdfDownload}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full p-2 text-sm bg-purple-50/80 text-purple-700 rounded-lg hover:bg-purple-100/80 transition-colors text-center"
                            >
                              Download PDF
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                  borderRadius: '20px'
                }}
              >
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5" />
                  What does the evidence say?
                </h4>
                
                <textarea
                  value={claimText}
                  onChange={(e) => setClaimText(e.target.value)}
                  placeholder="Enter a claim you want to understand..."
                  rows={4}
                  className="w-full px-4 py-3 text-sm sm:text-base bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300"
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
                  className="w-full px-4 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm sm:text-base font-bold rounded-2xl hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loadingClaim ? 'Reviewing evidence...' : 'Review the evidence'}
                </button>
              </div>

              {/* Evidence Snapshot card - Enhanced design */}
              {claimResult && (
                <div 
                  className="bg-white/70 backdrop-blur-xl border border-white/20 p-4 sm:p-6 space-y-6"
                  style={{
                    borderRadius: '20px'
                  }}
                >
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Evidence Snapshot
                  </h4>
                  
                  {/* Evidence metrics grid - Glass cards */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-br from-blue-400/20 to-indigo-400/20 backdrop-blur-sm border border-blue-200/30 p-3 sm:p-4 rounded-2xl">
                      <div className="text-xs sm:text-sm font-medium text-blue-700 mb-2">Evidence strength</div>
                      <div className="text-sm sm:text-base font-bold text-blue-800">
                        {claimResult.verification_result?.evidence_strength || 'Not available'}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-400/20 to-emerald-400/20 backdrop-blur-sm border border-green-200/30 p-3 sm:p-4 rounded-2xl">
                      <div className="text-xs sm:text-sm font-medium text-green-700 mb-2">Certainty</div>
                      <div className="text-sm sm:text-base font-bold text-green-800">
                        {claimResult.verification_result?.confidence_level
                          ? `${(claimResult.verification_result.confidence_level * 100).toFixed(0)}%`
                          : 'Not available'}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-400/20 to-violet-400/20 backdrop-blur-sm border border-purple-200/30 p-3 sm:p-4 rounded-2xl">
                      <div className="text-xs sm:text-sm font-medium text-purple-700 mb-2">Study coverage</div>
                      <div className="text-sm sm:text-base font-bold text-purple-800">Not available</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-400/20 to-amber-400/20 backdrop-blur-sm border border-orange-200/30 p-3 sm:p-4 rounded-2xl">
                      <div className="text-xs sm:text-sm font-medium text-orange-700 mb-2">Consensus</div>
                      <div className="text-sm sm:text-base font-bold text-orange-800">Not available</div>
                    </div>
                  </div>

                  {/* Evidence details - Modern sections */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/30 p-4 rounded-2xl">
                      <h5 className="text-sm sm:text-base font-bold text-green-800 mb-3 flex items-center gap-2">
                        <span className="text-green-600">✓</span> What the evidence supports
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
                        <span className="text-yellow-600">!</span> What is uncertain / overstated
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
                        <span className="text-red-600">?</span> Why confusion happens
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 bg-red-100/80 backdrop-blur-sm text-red-700 rounded-xl text-xs sm:text-sm font-medium border border-red-200/50">
                          Correlation misread
                        </span>
                        <span className="px-3 py-1.5 bg-red-100/80 backdrop-blur-sm text-red-700 rounded-xl text-xs sm:text-sm font-medium border border-red-200/50">
                          Animal data over-applied
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
                  borderRadius: '20px'
                }}
              >
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <NotebookPen className="w-5 h-5" />
                  Your research notes
                </h4>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Add your insights, questions, and observations about this research..."
                  rows={12}
                  className="w-full px-4 py-3 text-sm sm:text-base bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex items-center gap-2 flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm sm:text-base font-bold rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                >
                  <Save className="w-4 h-4" />
                  Save notes
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 text-gray-700 text-sm sm:text-base font-medium rounded-2xl hover:bg-white/90 transition-all duration-300"
                >
                  <ExternalLink className="w-4 h-4" />
                  Export
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
              Reviewing Evidence...
            </h2>
            <p id="claim-spinner-subtitle" className="text-white/90 text-sm drop-shadow-sm">
              Analyzing claim against research data
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpandedResearchResult;