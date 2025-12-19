import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, Bookmark, TrendingUp, FileText, Lightbulb, X } from 'lucide-react';
import Header from '../shared/Header';
import ResearchPanel from './ResearchPanel';

interface ResearchDashboardProps {
  period: 'day' | 'week' | 'month';
  onAnalyze: (userMessage: string, assistantMessage: string) => void;
  onSearch: (prompt: string) => void;
  windowWidth: number;
}

const ResearchDashboard: React.FC<ResearchDashboardProps> = ({
  period,
  onAnalyze,
  onSearch,
  windowWidth
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [searchFromHeader, setSearchFromHeader] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState(() => {
    // Load recent searches from localStorage or use defaults
    const stored = localStorage.getItem('wihy_recent_searches');
    return stored ? JSON.parse(stored) : ['intermittent fasting', 'omega-3 benefits', 'creatine safety'];
  });
  const [savedCollections] = useState(['Heart Health', 'Brain Function', 'Muscle Building']);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Debug: Track recentSearches changes
  useEffect(() => {
    console.log('🔄 recentSearches state updated:', recentSearches);
  }, [recentSearches]);
  
  const commonQueries = [
    'Latest nutrition research',
    'Clinical trials 2024',
    'Meta-analyses on supplements',
    'Longevity interventions'
  ];

  const handleHeaderSearch = (query: string) => {
    if (query.trim()) {
      const trimmedQuery = query.trim();
      
      // Cache the search in localStorage
      const cacheKey = `research_cache_${trimmedQuery.toLowerCase().replace(/\s+/g, '_')}`;
      const timestamp = Date.now();
      const cacheData = { query: trimmedQuery, timestamp, results: null };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Update recent searches - add to front, remove if already exists, limit to 5
      const updatedRecentSearches = [
        trimmedQuery,
        ...recentSearches.filter(search => search !== trimmedQuery)
      ].slice(0, 5);
      setRecentSearches(updatedRecentSearches);
      localStorage.setItem('wihy_recent_searches', JSON.stringify(updatedRecentSearches));
      
      // Update navigation history
      const newHistory = navigationHistory.slice(0, historyIndex + 1);
      newHistory.push(trimmedQuery);
      setNavigationHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      setSearchFromHeader(trimmedQuery);
      setActiveWorkspace(trimmedQuery);
      console.log('Setting searchFromHeader to:', trimmedQuery); // Debug log
    }
  };

  const handleBackNavigation = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousQuery = navigationHistory[newIndex];
      setHistoryIndex(newIndex);
      setActiveWorkspace(previousQuery);
      setSearchFromHeader(previousQuery);
    } else {
      setActiveWorkspace(null);
      setSearchFromHeader(null);
      setHistoryIndex(-1);
    }
  };

  const clearRecentSearches = () => {
    console.log('🔥 Clear button clicked!'); // Debug log
    console.log('🔍 Before clear - recentSearches:', recentSearches); // Debug log
    console.log('🔍 Before clear - localStorage:', localStorage.getItem('wihy_recent_searches')); // Debug log
    
    // Clear the state
    setRecentSearches([]);
    
    // Clear from localStorage
    localStorage.removeItem('wihy_recent_searches');
    
    // Also clear search cache entries
    let clearedCount = 0;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('research_cache_')) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    }
    
    console.log('✅ State cleared, localStorage removed'); // Debug log
    console.log(`✅ Cleared ${clearedCount} cache entries from localStorage`); // Debug log
    
    // Force a re-render check
    setTimeout(() => {
      console.log('⏰ After timeout - recentSearches:', recentSearches);
      console.log('⏰ After timeout - localStorage:', localStorage.getItem('wihy_recent_searches'));
    }, 100);
  };

  const handleForwardNavigation = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const nextQuery = navigationHistory[newIndex];
      setHistoryIndex(newIndex);
      setActiveWorkspace(nextQuery);
      setSearchFromHeader(nextQuery);
    }
  };

  const canGoBack = historyIndex > -1;
  const canGoForward = historyIndex < navigationHistory.length - 1;

  // ResearchPanel will be shown within the dashboard layout below

  // Dashboard view
  return (
    <div className="w-full h-full bg-[#f0f7ff] overflow-hidden flex flex-col">
      {/* Use Header component */}
      <Header
        searchQuery={(() => {
          const query = searchFromHeader || activeWorkspace || '';
          console.log('Passing searchQuery to Header:', query); // Debug log
          return query;
        })()}
        onSearchSubmit={handleHeaderSearch}
        showSearchInput={true}
        variant="results"
        showLogin={true}
      />
      
      {/* Main content area */}
      <div className="flex-1 overflow-auto" style={{ paddingTop: '200px' }}>

        {/* Search filters section */}
        {showFilters && (
          <div className="bg-[#f0f7ff] px-6 py-4 border-b border-gray-200">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Date Range</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Any time</option>
                      <option>Last year</option>
                      <option>Last 5 years</option>
                      <option>Last 10 years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Study Type</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>All types</option>
                      <option>RCT</option>
                      <option>Meta-analysis</option>
                      <option>Observational</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Population</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>All populations</option>
                      <option>Adults</option>
                      <option>Elderly</option>
                      <option>Athletes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Evidence Level</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Any level</option>
                      <option>High</option>
                      <option>Moderate</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Close Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Secondary header with title and actions */}
        <div className="bg-[#f0f7ff] px-6 py-4 border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Forward/Back Navigation - conditionally shown */}
              <div className="flex items-center gap-2">
                {canGoBack && (
                  <button
                    type="button"
                    onClick={handleBackNavigation}
                    className="flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                )}
                {canGoForward && (
                  <button
                    type="button"
                    onClick={handleForwardNavigation}
                    className="flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeWorkspace ? 'Research Workspace' : 'Research Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">Saved</span>
              </button>
            </div>
          </div>
        </div>

{/* MAIN CONTENT - Either Dashboard or ResearchPanel */}
        {activeWorkspace ? (
          // Show ResearchPanel within the dashboard layout
          <div className="flex-1 bg-[#f0f7ff]">
            <ResearchPanel
              windowWidth={windowWidth}
              initialQuery={searchFromHeader || activeWorkspace}
              onBack={() => {
                setActiveWorkspace(null);
                setSearchFromHeader(null);
              }}
              onAskArticle={(pmcId, question) => {
                onAnalyze(
                  `Question about article ${pmcId}: ${question}`,
                  'Use /api/research/pmc/:pmcId/content as context for this answer.'
                );
              }}
            />
          </div>
        ) : (
          // Show Dashboard content
          <div className="bg-[#f0f7ff]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
              {/* KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border-0 p-5 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-800">Recent Evidence</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">12 new papers</div>
                      <div className="text-xs text-blue-600">this month</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border-0 p-5 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-800">Saved Reviews</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">5 reviews</div>
                      <div className="text-xs text-green-600">ready to read</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl border-0 p-5 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-purple-800">Top Topics</div>
                      <div className="text-sm font-bold text-purple-900">Ultra-processed food</div>
                      <div className="text-xs text-purple-600">seed oils, protein</div>
                    </div>
                  </div>
                </div>
              </div>

        {/* C. MAIN CONTENT (TWO-COLUMN) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT COLUMN (narrow) */}
          <div className="lg:col-span-1 space-y-4">
            {/* Recent searches */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3 overflow-hidden">
                <h3 className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Recent Searches</h3>
                {recentSearches.length > 0 && (
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="flex items-center justify-center min-w-[44px] h-[44px] bg-gradient-to-r from-pink-100 to-pink-200 text-pink-600 rounded-2xl shadow-sm transition-all duration-300 transform active:scale-95"
                    title="Clear recent search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {recentSearches.length > 0 ? (
                  recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleHeaderSearch(search)}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200"
                    >
                      {search}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">No recent searches</p>
                )}
              </div>
            </div>

            {/* Saved collections */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-4">
              <h3 className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">Saved Collections</h3>
              <div className="space-y-2">
                {savedCollections.map((collection, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {}}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 rounded-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <Bookmark className="w-4 h-4 text-purple-500" />
                    {collection}
                  </button>
                ))}
              </div>
            </div>

            {/* Common queries */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-4">
              <h3 className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">Common Queries</h3>
              <div className="flex flex-wrap gap-2">
                {commonQueries.map((query, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleHeaderSearch(query)}
                    className="px-3 py-1.5 text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (wide) */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 min-h-[400px] flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">Start with a search</h2>
                <p className="text-gray-600 mb-6">
                  Enter a topic, ingredient, or health claim to explore the evidence.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Creatine', 'Vitamin D', 'Intermittent fasting', 'Seed oils'].map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleHeaderSearch(topic)}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-sm font-semibold"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchDashboard;
