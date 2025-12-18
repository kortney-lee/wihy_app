import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, BookOpen, ExternalLink } from 'lucide-react';
import Spinner from '../ui/Spinner';
import ExpandedResearchResult from './ExpandedResearchResult';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ResearchSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(initialQuery || '');

  // Modal state
  const [selectedStudy, setSelectedStudy] = useState<ResearchSearchResult | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Update currentQuery immediately when initialQuery changes
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setCurrentQuery(initialQuery.trim());
    }
  }, [initialQuery]);

  // Auto-run search whenever initialQuery changes
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      runSearch(initialQuery.trim());
    }
  }, [initialQuery]);

  /** ---- API CALLS ---- */

  const runSearch = async (keyword: string) => {
    setCurrentQuery(keyword);
    setLoading(true);
    setError(null);
    setSearchResults([]);
    setHasSearched(true);
    setSelectedStudy(null);
    
    try {
      const qs = buildQS({ keyword, limit: 20 });
      const res = await fetch(`${RESEARCH_API_BASE}/api/research/search?${qs}`);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data: ResearchSearchResponse = await res.json();
      
      // Check for actual results, not just the success flag
      const articles = data.articles || [];
      if (!data.success && articles.length === 0) {
        throw new Error('Search not successful');
      }
      
      setSearchResults(articles);
      console.log(`Search completed: ${articles.length} results found for "${keyword}"`);
    } catch (e: any) {
      setError(e?.message || 'Error searching research.');
    } finally {
      setLoading(false);
    }
  };



  const handleStudyClick = (study: ResearchSearchResult) => {
    setSelectedStudy(study);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudy(null);
  };

  // Remove internal search form handler - search comes from header now

  const isMobile = windowWidth < 1024;

  return (
    <div className="w-full h-full bg-[#f0f7ff] flex flex-col">
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

      {/* Grid Layout for Research Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Query summary */}
        {hasSearched && (
          <div className="mb-6">
            <div className="text-lg font-semibold text-gray-900 mb-2">
              {searchResults.length} results for "{initialQuery || currentQuery}"
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Spinner />
              <p className="mt-4 text-gray-600">Searching research...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        {/* Empty states */}
        {!loading && !hasSearched && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start your research</h3>
              <p className="text-gray-600">Use the search above to find scientific studies and evidence</p>
            </div>
          </div>
        )}

        {!loading && hasSearched && searchResults.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try different keywords or check your spelling</p>
            </div>
          </div>
        )}

        {/* Research Grid */}
        {searchResults.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {searchResults.map((study) => (
              <article 
                key={study.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => handleStudyClick(study)}
              >
                {/* Study Type Badge */}
                {study.studyType && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 rounded-full text-xs font-semibold">
                      {study.studyType.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h3 className="text-base font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors" 
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                  {study.title}
                </h3>

                {/* Abstract/Summary */}
                {study.abstract && (
                  <p className="text-sm text-gray-600 mb-4"
                     style={{
                       display: '-webkit-box',
                       WebkitLineClamp: 3,
                       WebkitBoxOrient: 'vertical',
                       overflow: 'hidden'
                     }}>
                    {study.abstract}
                  </p>
                )}

                {/* Meta Information */}
                <div className="space-y-2 mb-4">
                  {study.authors && (
                    <div className="text-xs text-gray-500 truncate">
                      <strong>Authors:</strong> {study.authors}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {study.journal && (
                      <span className="truncate">{study.journal}</span>
                    )}
                    {study.publicationYear && (
                      <span>{study.publicationYear}</span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {study.relevanceScore !== undefined && (
                    <span className="text-xs text-gray-500">
                      Relevance: {(study.relevanceScore * 100).toFixed(0)}%
                    </span>
                  )}
                  <div className="flex items-center text-xs text-blue-600 group-hover:text-blue-700">
                    <span>Read Study</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>


      {/* Expanded Research Result Modal */}
      <ExpandedResearchResult
        study={selectedStudy}
        isVisible={showModal}
        onClose={closeModal}
        onAskArticle={onAskArticle}
      />
    </div>
  );
};

export default ResearchPanel;
