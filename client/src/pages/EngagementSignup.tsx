import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Target, Activity, BarChart3, Zap } from 'lucide-react';
import TrackingHeader from '../components/layout/TrackingHeader';

const EngagementSignup: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Implement actual signup API call
    setTimeout(() => {
      // For now, navigate to demo dashboard
      navigate('/engagement-dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
      <TrackingHeader />
      
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Track Your Impact
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Get your personalized engagement dashboard and see real-time results from your promotion efforts.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 p-3">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-slate-900">
              Real-Time Analytics
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Track clicks, conversions, and engagement as they happen with live dashboard updates.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 ring-1 ring-purple-100 p-3">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-slate-900">
              Campaign Tracking
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Monitor multiple campaigns and see which channels drive the most conversions.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600 ring-1 ring-green-100 p-3">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-slate-900">
              Performance Insights
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Understand your audience with detailed metrics on click-through and conversion rates.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-700 ring-1 ring-yellow-100 p-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-slate-900">
              Unique Tracking Links
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Get your own branded tracking link to share across all your platforms and channels.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 p-3">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-slate-900">
              Activity Timeline
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              See exactly when and where your audience engages with your shared content.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 p-3">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-slate-900">
              Instant Setup
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Start tracking in seconds. No technical setup or coding required.
            </p>
          </div>
        </div>

        {/* Signup Form */}
        <div className="mt-16 mx-auto max-w-2xl">
          <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900 text-center">
              Get Your Dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-600 text-center">
              Join influencers and partners tracking their impact with WIHY
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-2 block w-full rounded-xl border-0 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 block w-full rounded-xl border-0 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Creating Your Dashboard...' : 'Get Started Free'}
              </button>

              <p className="text-xs text-center text-slate-500">
                By signing up, you agree to receive tracking updates and performance insights.
              </p>
            </form>

            {/* Demo Link */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={() => navigate('/engagement-dashboard')}
                className="w-full text-center text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                View Demo Dashboard →
              </button>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-600">
            Trusted by partners, influencers, and content creators
          </p>
          <div className="mt-6 flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">500+</div>
              <div className="text-xs text-slate-600">Active Dashboards</div>
            </div>
            <div className="h-12 w-px bg-slate-300" />
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">1M+</div>
              <div className="text-xs text-slate-600">Clicks Tracked</div>
            </div>
            <div className="h-12 w-px bg-slate-300" />
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">98%</div>
              <div className="text-xs text-slate-600">Partner Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementSignup;
