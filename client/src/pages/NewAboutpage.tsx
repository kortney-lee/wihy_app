import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/shared/Header';
import FullScreenChat from '../components/ui/FullScreenChat';
import { FeatureCard, MetricCard, HighlightCard } from '../components/shared/CardComponents';
import { CTAButton, NavLink } from '../components/shared/ButtonComponents';
import MacronutrientPieChart from '../components/charts/cards/MacronutrientPieChart';
import NovaChart from '../components/charts/cards/NovaChart';
import PublicationTimelineChart from '../components/charts/cards/PublicationTimelineChart';

const NewAboutpage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showWaitlistPopup, setShowWaitlistPopup] = useState(false);
  const [hasDismissedPopup, setHasDismissedPopup] = useState(false);
  
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (hasDismissedPopup) return;

    const onScroll = () => {
      if (window.scrollY > 400) {
        setShowWaitlistPopup(true);
      }
    };

    window.addEventListener('scroll', onScroll);

    const timer = window.setTimeout(() => {
      setShowWaitlistPopup(true);
    }, 10000);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, [hasDismissedPopup]);

  const handleDismissPopup = () => {
    setShowWaitlistPopup(false);
    setHasDismissedPopup(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 font-sf-pro">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 px-8 py-16 min-h-screen">
          {/* Hero Left */}
          <div className="flex flex-col justify-center space-y-8 animate-fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold text-green-600 leading-tight">
              WIHY — Where Science Meets Understanding
            </h1>
            <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed">
              Transforming health from reactive care to proactive intelligence.
            </p>
            <p className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl">
              Proven outcomes based on internal testing, prototype feedback, and designed capabilities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <CTAButton 
                onClick={() => setShowWaitlistPopup(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Join Waitlist
              </CTAButton>
              <button 
                onClick={() => setIsChatOpen(true)}
                className="bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                Try Demo
              </button>
            </div>
          </div>

          {/* Hero Right */}
          <div className="flex items-center justify-center animate-fade-in animation-delay-300">
            <div className="w-full max-w-lg">
              <img 
                src="/assets/whatishealthyspinner.gif" 
                alt="WIHY Health Intelligence" 
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Bar */}
      <nav className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-center space-x-8 py-4">
            <NavLink href="#platform" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              Platform
            </NavLink>
            <NavLink href="#technology" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              Technology
            </NavLink>
            <NavLink href="#founder" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              Leadership
            </NavLink>
            <NavLink href="#metrics-grid" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              Metrics
            </NavLink>
            <NavLink href="#charts-gallery" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              Charts
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Platform Overview Section */}
      <section id="platform" className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-600 mb-6">
              The WIHY Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              A comprehensive health intelligence ecosystem that transforms how we understand, access, and apply health information.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            {/* Platform Cards */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">Intelligent Analysis</h3>
              </div>
              <p className="text-gray-600 leading-relaxed text-lg">
                AI-powered analysis of health research, providing evidence-based insights and personalized recommendations.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">Real-time Processing</h3>
              </div>
              <p className="text-gray-600 leading-relaxed text-lg">
                Instant processing of health queries with access to the latest research and clinical guidelines.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.168 18.477 18.582 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">Evidence-Based</h3>
              </div>
              <p className="text-gray-600 leading-relaxed text-lg">
                Built on peer-reviewed research and clinical evidence, ensuring accurate and reliable health information.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">Community Driven</h3>
              </div>
              <p className="text-gray-600 leading-relaxed text-lg">
                Collaborative platform where healthcare professionals and researchers contribute to collective knowledge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section id="technology" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-600 mb-6">
              Technology Stack
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Cutting-edge AI and machine learning technologies powering intelligent health insights.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16">
            {/* Tech Stack Cards with Images */}
            <div className="space-y-8">
              <div className="wihy-card h-auto">
                <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src="/assets/Research_Harvesting_Layer.png" 
                    alt="Research Harvesting Layer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Research Harvesting Layer</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Automated collection and processing of health research from global databases, journals, and clinical trials.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">2M+</div>
                    <div className="text-sm text-gray-500">Research Papers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">500K+</div>
                    <div className="text-sm text-gray-500">Clinical Trials</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">10K+</div>
                    <div className="text-sm text-gray-500">Medical Journals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">1000+</div>
                    <div className="text-sm text-gray-500">Updates Daily</div>
                  </div>
                </div>
              </div>

              <div className="wihy-card h-auto">
                <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src="/assets/Curation_Pipeline.png" 
                    alt="Quality Curation Pipeline"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Quality Curation Pipeline</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  AI-based credibility scoring, evaluation of study design, sample size, and effect strength with evidence grading from low to high confidence and removal of commercial bias.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">94%</div>
                    <div className="text-sm text-gray-500">Accuracy Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">98%</div>
                    <div className="text-sm text-gray-500">Bias Detection</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">15+</div>
                    <div className="text-sm text-gray-500">Quality Metrics</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">5</div>
                    <div className="text-sm text-gray-500">Evidence Levels</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="wihy-card h-auto">
                <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src="/assets/Advanced_AI_Engine.gif" 
                    alt="Advanced AI Engine"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Advanced AI Engine</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Natural language processing, machine learning algorithms, and deep neural networks for intelligent health analysis.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">&lt;2s</div>
                    <div className="text-sm text-gray-500">Processing Speed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">25+</div>
                    <div className="text-sm text-gray-500">Languages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">50+</div>
                    <div className="text-sm text-gray-500">AI Models</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">96%</div>
                    <div className="text-sm text-gray-500">Accuracy</div>
                  </div>
                </div>
              </div>

              <div className="wihy-card h-auto">
                <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src="/assets/Predictive_Analytics.gif" 
                    alt="Predictive Analytics"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">4. Predictive Analytics</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Advanced forecasting and trend analysis for personalized health recommendations and risk assessment.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">100+</div>
                    <div className="text-sm text-gray-500">Prediction Models</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">500+</div>
                    <div className="text-sm text-gray-500">Risk Factors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">92%</div>
                    <div className="text-sm text-gray-500">Accuracy Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">10M+</div>
                    <div className="text-sm text-gray-500">Data Points</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section id="founder" className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-600 mb-6">
              Leadership
            </h2>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Leader Photo */}
              <div className="flex items-center justify-center p-8 lg:p-12 bg-gray-50">
                <div className="w-64 h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
                  <img
                    src="/assets/Leaderphoto.jpg"
                    alt="Kortney O. Lee, Founder and CEO"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Leader Details */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Kortney O. Lee — Founder & CEO
                </h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-gray-700">
                    <span className="text-2xl mr-3">🎓</span>
                    <span className="text-lg">MBA • Historian • Systems Designer</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <span className="text-2xl mr-3">📚</span>
                    <span className="text-lg">Author: "What Is Healthy? And Why Is It So Hard to Achieve?"</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <span className="text-2xl mr-3">🏗️</span>
                    <span className="text-lg">Community Health Advocate</span>
                  </div>
                </div>

                <blockquote className="text-xl text-gray-800 font-medium italic border-l-4 border-green-600 pl-6">
                  "We built WIHY to answer the hardest question in health: clarity, truth, and evidence."
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Logo */}
            <div className="flex justify-center lg:justify-start">
              <img src="/assets/wihylogo.png" alt="WIHY" className="h-10 w-auto" />
            </div>

            {/* Copyright and Disclaimer */}
            <div className="text-center space-y-2">
              <div className="text-sm text-gray-300">
                © {currentYear} WIHY. All rights reserved.
              </div>
              <div className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                This page is for education and information only and is not a substitute for professional medical advice.
              </div>
            </div>

            {/* Contact */}
            <div className="text-center lg:text-right space-y-2">
              <div className="text-sm font-medium text-gray-300">Investor Relations</div>
              <div className="space-y-1">
                <a href="mailto:info@vowel.org" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  info@vowel.org
                </a>
                <a href="mailto:kortney@wihy.ai" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  kortney@wihy.ai
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Interface */}
      <div ref={chatContainerRef}>
        <FullScreenChat 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />
      </div>

      {/* Waitlist Popup */}
      {showWaitlistPopup && !hasDismissedPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in">
            <button 
              onClick={handleDismissPopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Join the WIHY Waitlist
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to experience intelligent health insights when we launch.
              </p>
              <CTAButton 
                onClick={handleDismissPopup}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Join Waitlist
              </CTAButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewAboutpage;