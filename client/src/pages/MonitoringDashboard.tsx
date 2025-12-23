import React, { useState, useEffect, useRef } from 'react';
import { Activity, Brain, AlertTriangle, Play, Square, Download, Package, TrendingUp, RefreshCw, X, MessageSquare, BookOpen, Lightbulb, BarChart3 } from 'lucide-react';
import TrackingHeader from '../components/layout/TrackingHeader';

interface SummaryMetrics {
  total_conversations: number;
  total_messages: number;
  total_questions_logged: number;
  total_errors_detected: number;
}

interface LearningStatus {
  is_running: boolean;
  sessions_completed: number;
  total_conversations: number;
  total_questions: number;
}

interface Conversation {
  session_id: string;
  user_id?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  response_time_ms?: number;
}

interface LearningEntry {
  id: number;
  question: string;
  category?: string;
  quality_score?: number;
  timestamp: string;
}

interface ErrorSummary {
  slow_responses?: number;
  low_confidence?: number;
}

interface ErrorData {
  total_errors: number;
  summary?: ErrorSummary;
  errors: Record<string, any[]>;
}

interface InsightsData {
  top_topics?: string[];
  knowledge_gaps?: string[];
  recommendations?: string[];
}

const API_BASE = 'https://ml.wihy.ai';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function IconTile({
  tone = "blue",
  children,
}: {
  tone?: "blue" | "purple" | "yellow" | "green" | "emerald" | "orange";
  children: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    purple: "bg-purple-50 text-purple-600 ring-purple-100",
    yellow: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    green: "bg-green-50 text-green-600 ring-green-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    orange: "bg-orange-50 text-orange-600 ring-orange-100",
  };

  return (
    <div
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-2xl ring-1 p-3",
        toneMap[tone]
      )}
    >
      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  tone,
  icon,
  isGood,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  tone: "blue" | "purple" | "yellow" | "green" | "emerald" | "orange";
  icon: React.ReactNode;
  isGood?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div className="overflow-hidden">
          <div className="text-sm font-medium text-slate-500">{title}</div>
          <div className={cn(
            "mt-2 text-4xl font-semibold tracking-tight overflow-hidden",
            isGood === true ? "text-emerald-600" : isGood === false ? "text-rose-600" : "text-slate-900"
          )}>
            {value}
          </div>
          {subtitle && (
            <div className="mt-2 text-sm text-slate-500">{subtitle}</div>
          )}
        </div>
        <IconTile tone={tone}>{icon}</IconTile>
      </div>
    </div>
  );
}

const MonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('conversations');
  const [summaryStats, setSummaryStats] = useState<SummaryMetrics | null>(null);
  const [learningStatus, setLearningStatus] = useState<LearningStatus | null>(null);
  const [errorData, setErrorData] = useState<ErrorData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [learningHistory, setLearningHistory] = useState<LearningEntry[]>([]);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [showRunSessionModal, setShowRunSessionModal] = useState(false);
  const [sessionResult, setSessionResult] = useState<string>('');
  const [numConversations, setNumConversations] = useState(10);
  const [turnsPerConversation, setTurnsPerConversation] = useState(3);
  const [loading, setLoading] = useState({ summary: true, status: true, errors: true });
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    init();
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, []);

  const init = async () => {
    await loadSummary();
    await loadStatus();
    await loadErrors();
    await loadConversations();

    // Auto-refresh every 30 seconds
    autoRefreshInterval.current = setInterval(async () => {
      await loadStatus();
      await loadSummary();
    }, 30000) as any;
  };

  const loadSummary = async () => {
    try {
      setLoading(prev => ({ ...prev, summary: true }));
      const response = await fetch(`${API_BASE}/dashboard/summary?days_back=7`);
      const data = await response.json();
      
      const metrics = data.metrics || {
        total_conversations: 0,
        total_messages: 0,
        total_questions_logged: 0,
        total_errors_detected: 0
      };
      
      // If no conversations but questions exist, treat questions as conversations
      if (metrics.total_conversations === 0 && metrics.total_questions_logged > 0) {
        metrics.total_conversations = metrics.total_questions_logged;
        metrics.total_messages = metrics.total_questions_logged * 2; // Each Q&A = 2 messages
      }
      
      setSummaryStats(metrics);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(prev => ({ ...prev, summary: false }));
    }
  };

  const loadStatus = async () => {
    try {
      setLoading(prev => ({ ...prev, status: true }));
      const response = await fetch(`${API_BASE}/self-learning/status`);
      const data = await response.json();
      setLearningStatus(data);
    } catch (error) {
      console.error('Error loading status:', error);
    } finally {
      setLoading(prev => ({ ...prev, status: false }));
    }
  };

  const loadErrors = async () => {
    try {
      setLoading(prev => ({ ...prev, errors: true }));
      const response = await fetch(`${API_BASE}/dashboard/errors?days_back=7`);
      const data = await response.json();
      setErrorData(data);
    } catch (error) {
      console.error('Error loading errors:', error);
    } finally {
      setLoading(prev => ({ ...prev, errors: false }));
    }
  };

  const loadConversations = async () => {
    try {
      // Try the conversations endpoint first
      let response = await fetch(`${API_BASE}/dashboard/conversations?days_back=30&include_messages=false`);
      let data = await response.json();
      
      // If no conversations found, try to get questions and convert them
      if (!data.conversations || data.conversations.length === 0) {
        try {
          response = await fetch(`${API_BASE}/dashboard/questions?days_back=30`);
          data = await response.json();
          
          if (data.questions && data.questions.length > 0) {
            // Convert questions to conversation format
            const conversationsFromQuestions = data.questions.map((q: any) => ({
              session_id: q.id,
              user_id: 'guest', // Default user since questions don't have user context
              message_count: 2, // Question + answer = 2 messages
              created_at: q.timestamp,
              updated_at: q.timestamp,
              messages: [
                { role: 'user', content: q.question },
                { role: 'assistant', content: q.answer }
              ]
            }));
            
            setConversations(conversationsFromQuestions);
            return;
          }
        } catch (questionError) {
          console.log('Questions endpoint also failed:', questionError);
        }
      }
      
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadLearningHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/dashboard/learning-history?days_back=30&limit=100`);
      const data = await response.json();
      setLearningHistory(data.entries || []);
    } catch (error) {
      console.error('Error loading learning history:', error);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await fetch(`${API_BASE}/dashboard/insights?days_back=30`);
      const data = await response.json();
      setInsights(data.insights || {});
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const viewConversation = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE}/dashboard/conversation/${sessionId}`);
      const data = await response.json();
      if (data.conversation) {
        setSelectedConversation(data.conversation);
        setShowConversationModal(true);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      alert('Error loading conversation details');
    }
  };

  const runSession = async () => {
    setSessionResult('loading');
    try {
      const response = await fetch(`${API_BASE}/self-learning/run-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          num_conversations: numConversations,
          turns_per_conversation: turnsPerConversation
        })
      });
      const data = await response.json();
      setSessionResult(JSON.stringify(data.metrics || {}, null, 2));
      await loadStatus();
      await loadSummary();
    } catch (error) {
      console.error('Error running session:', error);
      setSessionResult('Error running session');
    }
  };

  const startContinuous = async () => {
    if (!window.confirm('Start continuous learning? This will run in the background every hour.')) return;
    try {
      await fetch(`${API_BASE}/self-learning/start-continuous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interval_minutes: 60,
          conversations_per_session: 20,
          turns_per_conversation: 4
        })
      });
      alert('Continuous learning started!');
      await loadStatus();
    } catch (error) {
      console.error('Error starting continuous learning:', error);
      alert('Error starting continuous learning');
    }
  };

  const stopContinuous = async () => {
    if (!window.confirm('Stop continuous learning?')) return;
    try {
      await fetch(`${API_BASE}/self-learning/stop-continuous`, { method: 'POST' });
      alert('Continuous learning stopped!');
      await loadStatus();
    } catch (error) {
      console.error('Error stopping continuous learning:', error);
      alert('Error stopping continuous learning');
    }
  };

  const prepareTrainingData = async () => {
    try {
      const response = await fetch(`${API_BASE}/self-learning/prepare-training-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          min_quality_score: 0.7,
          days_back: 30
        })
      });
      const data = await response.json();
      alert(`Training data prepared!\nExamples: ${data.num_examples}\nDate range: ${data.date_range}`);
    } catch (error) {
      console.error('Error preparing training data:', error);
      alert('Error preparing training data');
    }
  };

  const exportTrainingData = async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const response = await fetch(`${API_BASE}/self-learning/export-training-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output_file: `data/training_export_${timestamp}.jsonl`,
          min_quality_score: 0.7,
          days_back: 30
        })
      });
      const data = await response.json();
      alert(`Training data exported!\nFile: ${data.file}\nExamples: ${data.num_examples}`);
    } catch (error) {
      console.error('Error exporting training data:', error);
      alert('Error exporting training data');
    }
  };

  const switchTab = (tabName: string) => {
    setActiveTab(tabName);
    if (tabName === 'learning' && learningHistory.length === 0) loadLearningHistory();
    if (tabName === 'insights' && !insights) loadInsights();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <TrackingHeader />
      
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Brain className="h-8 w-8 text-orange-600" />
            WIHY ML Analytics
          </h1>
          <p className="mt-2 text-slate-600">Conversation Analytics & Self-Learning System</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Conversations"
            value={loading.summary ? "..." : summaryStats?.total_conversations || 0}
            subtitle="Last 7 days"
            tone="blue"
            icon={<MessageSquare className="h-6 w-6" />}
          />
          <StatCard
            title="Learning Status"
            value={loading.status ? "..." : learningStatus?.is_running ? "Running" : "Stopped"}
            subtitle={`${learningStatus?.total_questions || 0} questions logged`}
            tone="purple"
            icon={<Brain className="h-6 w-6" />}
            isGood={learningStatus?.is_running ? true : undefined}
          />
          <StatCard
            title="Total Messages"
            value={loading.summary ? "..." : summaryStats?.total_messages || 0}
            subtitle={`${summaryStats?.total_questions_logged || 0} questions`}
            tone="emerald"
            icon={<Activity className="h-6 w-6" />}
          />
          <StatCard
            title="Recent Errors"
            value={loading.errors ? "..." : errorData?.total_errors || 0}
            subtitle={`${errorData?.summary?.slow_responses || 0} slow responses`}
            tone={errorData && errorData.total_errors > 10 ? "orange" : "green"}
            icon={<AlertTriangle className="h-6 w-6" />}
            isGood={errorData && errorData.total_errors === 0 ? true : errorData && errorData.total_errors > 10 ? false : undefined}
          />
        </div>

        {/* Controls */}
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Self-Learning Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowRunSessionModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
            >
              <Play className="h-4 w-4" />
              Run Learning Session
            </button>
            <button
              onClick={startContinuous}
              disabled={learningStatus?.is_running}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="h-4 w-4" />
              Start Continuous
            </button>
            <button
              onClick={stopContinuous}
              disabled={!learningStatus?.is_running}
              className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="h-4 w-4" />
              Stop Continuous
            </button>
            <button
              onClick={prepareTrainingData}
              className="inline-flex items-center gap-2 rounded-full bg-slate-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-500 transition"
            >
              <Package className="h-4 w-4" />
              Prepare Data
            </button>
            <button
              onClick={exportTrainingData}
              className="inline-flex items-center gap-2 rounded-full bg-slate-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-500 transition"
            >
              <Download className="h-4 w-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 inline-flex rounded-full bg-slate-100 p-1 ring-1 ring-slate-200">
          {['conversations', 'learning', 'errors', 'insights'].map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition capitalize inline-flex items-center gap-2",
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {tab === 'conversations' && <MessageSquare className="h-4 w-4" />}
              {tab === 'learning' && <BookOpen className="h-4 w-4" />}
              {tab === 'errors' && <AlertTriangle className="h-4 w-4" />}
              {tab === 'insights' && <Lightbulb className="h-4 w-4" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'conversations' && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Conversations</h2>
              <button
                onClick={loadConversations}
                className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-orange-600 transition"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-left text-sm font-semibold text-slate-600">Session ID</th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-600">User</th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-600">Messages</th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-600">Started</th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-600">Last Activity</th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-500">No conversations found</td></tr>
                  ) : (
                    conversations.map(conv => (
                      <tr 
                        key={conv.session_id} 
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                        onClick={() => viewConversation(conv.session_id)}
                      >
                        <td className="py-3 text-sm text-slate-900">{conv.session_id.substring(0, 8)}...</td>
                        <td className="py-3 text-sm text-slate-600">{conv.user_id || 'Anonymous'}</td>
                        <td className="py-3 text-sm text-slate-900 font-medium">{conv.message_count || 0}</td>
                        <td className="py-3 text-sm text-slate-600">{new Date(conv.created_at).toLocaleString()}</td>
                        <td className="py-3 text-sm text-slate-600">{new Date(conv.updated_at).toLocaleString()}</td>
                        <td className="py-3">
                          <button className="rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-500 transition">
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'learning' && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Learning History</h2>
              <button
                onClick={loadLearningHistory}
                className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-orange-600 transition"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-left text-sm font-semibold text-slate-600">Question</th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-600">Category</th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-600">Quality Score</th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-600">Timestamp</th>
                    <th className="pb-3 text-left text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {learningHistory.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">No learning entries found</td></tr>
                  ) : (
                    learningHistory.map(entry => {
                      const qualityColor = entry.quality_score && entry.quality_score > 0.7 ? 'text-emerald-600' : 
                                         entry.quality_score && entry.quality_score > 0.5 ? 'text-yellow-600' : 'text-rose-600';
                      return (
                        <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="py-3 text-sm text-slate-900">{entry.question.substring(0, 80)}{entry.question.length > 80 ? '...' : ''}</td>
                          <td className="py-3 text-sm text-slate-600">{entry.category || 'N/A'}</td>
                          <td className="py-3 text-sm">
                            <span className={cn("font-semibold", qualityColor)}>
                              {entry.quality_score?.toFixed(3) || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-slate-600">{new Date(entry.timestamp).toLocaleString()}</td>
                          <td className="py-3">
                            <button className="rounded-full bg-slate-600 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-500 transition">
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Error Analysis</h2>
              <button
                onClick={loadErrors}
                className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-orange-600 transition"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            {!errorData || errorData.total_errors === 0 ? (
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700 border border-emerald-200">
                ✅ No errors detected in the last 7 days!
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-slate-900">Error Summary</h3>
                {Object.entries(errorData.errors || {}).map(([errorType, errors]) => (
                  errors && errors.length > 0 && (
                    <div key={errorType}>
                      <h4 className="mb-2 text-sm font-semibold text-slate-700 uppercase">
                        {errorType.replace(/_/g, ' ')} ({errors.length})
                      </h4>
                      {errors.slice(0, 5).map((error: any, idx: number) => (
                        <div key={idx} className="mb-2 rounded-2xl bg-rose-50 p-4 border-l-4 border-rose-500">
                          <div className="text-sm font-semibold text-rose-700">{errorType}</div>
                          <div className="mt-1 text-sm text-slate-600">
                            {error.question && `Question: ${error.question.substring(0, 100)}...`}
                            {error.response_time_ms && <><br />Response time: {error.response_time_ms}ms</>}
                            {error.confidence && <><br />Confidence: {error.confidence.toFixed(3)}</>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Learning Insights</h2>
              <button
                onClick={loadInsights}
                className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-orange-600 transition"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6">
              {insights?.top_topics && insights.top_topics.length > 0 && (
                <div>
                  <h3 className="mb-3 text-base font-semibold text-slate-900">🔥 Top Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {insights.top_topics.slice(0, 20).map((topic, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-orange-50 hover:ring-orange-200 hover:text-orange-700 transition cursor-pointer"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {insights?.knowledge_gaps && insights.knowledge_gaps.length > 0 && (
                <div>
                  <h3 className="mb-3 text-base font-semibold text-slate-900">🎓 Knowledge Gaps</h3>
                  {insights.knowledge_gaps.map((gap, idx) => (
                    <div key={idx} className="mb-2 rounded-2xl bg-blue-50 p-4 text-sm text-slate-700 border-l-4 border-blue-500">
                      {gap}
                    </div>
                  ))}
                </div>
              )}
              {insights?.recommendations && insights.recommendations.length > 0 && (
                <div>
                  <h3 className="mb-3 text-base font-semibold text-slate-900">📝 Recommendations</h3>
                  {insights.recommendations.map((rec, idx) => (
                    <div key={idx} className="mb-2 rounded-2xl bg-orange-50 p-4 text-sm text-slate-700 border-l-4 border-orange-500">
                      💡 {rec}
                    </div>
                  ))}
                </div>
              )}
              {!insights && <p className="text-slate-500">No insights available yet</p>}
            </div>
          </div>
        )}
      </div>

      {/* Conversation Detail Modal */}
      {showConversationModal && selectedConversation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowConversationModal(false)}
        >
          <div 
            className="relative w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowConversationModal(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
            
            <h2 className="mb-4 text-2xl font-bold text-slate-900">Conversation Details</h2>
            
            <div className="mb-6 space-y-2">
              <p className="text-sm"><span className="font-semibold text-slate-700">Session:</span> <span className="text-slate-600">{selectedConversation.session_id}</span></p>
              <p className="text-sm"><span className="font-semibold text-slate-700">User:</span> <span className="text-slate-600">{selectedConversation.user_id || 'Anonymous'}</span></p>
              <p className="text-sm"><span className="font-semibold text-slate-700">Started:</span> <span className="text-slate-600">{new Date(selectedConversation.created_at).toLocaleString()}</span></p>
              <p className="text-sm"><span className="font-semibold text-slate-700">Messages:</span> <span className="text-slate-600">{selectedConversation.messages?.length || 0}</span></p>
            </div>
            
            <div className="space-y-3">
              {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                selectedConversation.messages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "rounded-2xl p-4 border-l-4",
                      msg.role === 'user' 
                        ? "bg-blue-50 border-blue-500" 
                        : "bg-emerald-50 border-emerald-500"
                    )}
                  >
                    <div className="mb-1 text-xs font-semibold uppercase text-slate-500">{msg.role}</div>
                    <div className="text-sm text-slate-700 leading-relaxed">{msg.content}</div>
                    {msg.response_time_ms && (
                      <div className="mt-2 text-xs text-slate-400">Response time: {msg.response_time_ms}ms</div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500">No messages in this conversation</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Run Session Dialog */}
      {showRunSessionModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowRunSessionModal(false)}
        >
          <div 
            className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowRunSessionModal(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
            
            <h2 className="mb-6 text-2xl font-bold text-slate-900">Run Learning Session</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Number of Conversations:
                </label>
                <input 
                  type="number" 
                  value={numConversations}
                  onChange={(e) => setNumConversations(parseInt(e.target.value))}
                  min="1" 
                  max="100"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Turns per Conversation:
                </label>
                <input 
                  type="number" 
                  value={turnsPerConversation}
                  onChange={(e) => setTurnsPerConversation(parseInt(e.target.value))}
                  min="1" 
                  max="10"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
              
              <button 
                onClick={runSession}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
              >
                <Play className="h-4 w-4" />
                Run Session
              </button>
            </div>
            
            {sessionResult && (
              <div className="mt-6">
                {sessionResult === 'loading' ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-600"></div>
                    <p className="text-sm text-slate-600">Running session...</p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-emerald-50 p-4 border-l-4 border-emerald-500">
                    <h3 className="mb-2 text-base font-semibold text-emerald-700">✅ Session Complete!</h3>
                    <pre className="text-xs text-slate-600 overflow-x-auto">{sessionResult}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;
