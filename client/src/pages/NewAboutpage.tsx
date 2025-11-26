import React, { useState, useEffect, useRef } from 'react';
import FullScreenChat from '../components/ui/FullScreenChat';
import { FeatureCard, MetricCard, HighlightCard } from '../components/shared/CardComponents';
import { CTAButton, NavLink } from '../components/shared/ButtonComponents';
import MacronutrientPieChart from '../components/charts/cards/MacronutrientPieChart';
import NovaChart from '../components/charts/cards/NovaChart';
import PublicationTimelineChart from '../components/charts/cards/PublicationTimelineChart';
import '../styles/AboutPage.css';

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

  // Prevent embedded chat from scrolling the page
  useEffect(() => {
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function(options) {
      const isInsideChatContainer = this.closest('.chat-frame-content, .about-page-wrapper .chat-frame-content, .search-input');
      
      if (isInsideChatContainer) {
        const isLikelyMessagesEndRef = (
          this.tagName === 'DIV' && 
          !this.className && 
          !this.textContent?.trim() &&
          this.previousElementSibling
        );
        
        if (isLikelyMessagesEndRef) {
          const scrollableContainer = this.closest('.chat-messages, .message-list, .messages-container, [class*="messages"], [class*="chat-content"]');
          
          if (scrollableContainer && scrollableContainer.scrollTop !== undefined) {
            scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
            return;
          }
          
          let parent = this.parentElement;
          while (parent && isInsideChatContainer) {
            const style = window.getComputedStyle(parent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll' || parent.scrollHeight > parent.clientHeight) {
              parent.scrollTop = parent.scrollHeight;
              return;
            }
            parent = parent.parentElement;
          }
        }
        
        return;
      }
      
      return originalScrollIntoView.call(this, options);
    };

    return () => {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white m-0 p-0 font-sans">
      {/* Hero Header */}
      <header className="relative bg-transparent pt-0">
        {/* Top Navigation - Fixed */}
        <nav className="fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-[10px] z-[9999] border-b border-black/10">
          <div className="flex justify-between items-center max-w-[1200px] mx-auto px-6 py-3">
            {/* Logo */}
            <div className="flex items-center z-[1000] relative">
              <img src="/assets/wihylogo.png" alt="WIHY.ai" className="h-10 w-auto" />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden flex flex-col justify-center items-center min-w-[44px] min-h-[44px] p-0 bg-transparent border-none cursor-pointer z-[1002] relative"
              onClick={() => setIsNavOpen(!isNavOpen)}
              aria-label="Toggle navigation"
            >
              <span className="w-6 h-0.5 bg-gray-900 rounded-full my-0.5"></span>
              <span className="w-6 h-0.5 bg-gray-900 rounded-full my-0.5"></span>
              <span className="w-6 h-0.5 bg-gray-900 rounded-full my-0.5"></span>
            </button>

            {/* Desktop Navigation Links */}
            <div className={`${isNavOpen ? 'flex' : 'hidden'} lg:flex gap-5 items-center list-none m-0 p-0`}>
              <a href="#platform" className="text-gray-700 hover:text-[#4cbb17] font-medium transition-colors no-underline">
                Platform
              </a>
              <a href="#technology" className="text-gray-700 hover:text-[#4cbb17] font-medium transition-colors no-underline">
                Technology
              </a>
              <a href="#market" className="text-gray-700 hover:text-[#4cbb17] font-medium transition-colors no-underline">
                Market
              </a>
              <a href="#founder" className="text-gray-700 hover:text-[#4cbb17] font-medium transition-colors no-underline">
                Leadership
              </a>
              <a href="#investment" className="text-gray-700 hover:text-[#4cbb17] font-medium transition-colors no-underline">
                Investment
              </a>
              <CTAButton href="/" primary>
                Launch Platform
              </CTAButton>
            </div>
          </div>
        </nav>

        {/* Main Title Section */}
        <div className="pt-32 pb-8 text-center px-4">
          <h1 
            className="text-6xl lg:text-7xl font-bold mb-4 gradient-text"
            style={{ 
              opacity: isLoaded ? 1 : 0, 
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)', 
              transition: 'all 0.6s ease'
            }}
          >
            The Health Intelligence Platform
          </h1>
        </div>

        {/* Hero Content */}
        <div className="hero-content">
          <div className="hero-container">
            {/* Hero Left */}
            <div className="hero-left">
              {/* Badges */}
              <div className={`hero-badge ${isLoaded ? 'animate-in' : ''}`}>
                <span>Series Seed</span>
                <span>Health Tech</span>
                <span>AI Platform</span>
              </div>

              <div className="hero-content-block">
                <h2 className="main-page-subtitle">
                  The Future of Health Intelligence
                </h2>
                <p className="main-page-tagline">
                  Ask. Seek. Get answers.
                </p>
              </div>
              
              <div className="hero-content-block">
                <div className="main-page-benefits">
                  <p>Scan food. No more manual tracking or calorie counting.</p>
                  <p>Decode research. Understand the science behind every health decision.</p>
                  <p>Translate 35 million peer-reviewed studies into clear, personalized guidance.</p>
                </div>
              </div>

              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  WIHY.ai unifies global medical research, government-verified health data, real-time food intelligence, and predictive analytics into one system for consumers, enterprises, and healthcare organizations.
                </p>
              </div>

              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  WIHY.ai is the first health intelligence system to combine:
                </p>
                
                <div className={`hero-unification-points ${isLoaded ? 'animate-in delay-2' : ''}`}>
                  <ul>
                    <li>Global medical and nutrition research</li>
                    <li>Government-verified health data</li>
                    <li>Real-time food and ingredient intelligence</li>
                    <li>Predictive analytics</li>
                  </ul>
                  <p>into a single platform designed to support personal, institutional, and population health decisions.</p>
                </div>
              </div>

              <div className={`hero-actions ${isLoaded ? 'animate-in delay-4' : ''}`}>
                <CTAButton href="#investment" primary>
                  View Investment Opportunity
                </CTAButton>
              </div>
            </div>

            {/* Hero Right - Embedded Chat */}
            <div className="hero-right">
              <div 
                ref={chatContainerRef}
                className={`chat-frame-container ${isLoaded ? 'animate-in delay-2' : ''}`}
              >
                <div className="chat-frame-content">
                  <FullScreenChat
                    isOpen={true}
                    onClose={() => {}}
                    initialQuery="What can you help me with?"
                    initialResponse={`Hey there, I am WIHY – your health intelligence engine connected to 30+ million research articles.

Tell me what you are eating, how you are sleeping, or what you are worried about.

I will translate complex health and nutrition science into simple steps you can act on today.`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Key Metrics Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-600 delay-900 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2" style={{ color: '#4cbb17' }}>$4.2T</div>
              <div className="text-gray-600 font-medium">Global Wellness Market</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2" style={{ color: '#4cbb17' }}>35M+</div>
              <div className="text-gray-600 font-medium">Research Studies</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2" style={{ color: '#4cbb17' }}>99.9%</div>
              <div className="text-gray-600 font-medium">System Uptime</div>
            </div>
          </div>
        </div>
      </section>

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
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-auto">
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

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-auto">
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
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-auto">
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

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-auto">
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

      {/* Market Opportunity Section */}
      <section id="market" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-600 mb-6">
              Market Opportunity
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              WIHY sits at the convergence of three rapidly expanding markets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="text-5xl font-bold text-green-600 mb-4">$4.2T</div>
              <div className="text-xl font-semibold text-gray-900 mb-2">Global Wellness Market</div>
              <div className="text-green-600 font-medium">7.8% CAGR</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="text-5xl font-bold text-green-600 mb-4">$127B</div>
              <div className="text-xl font-semibold text-gray-900 mb-2">Digital Health Market</div>
              <div className="text-green-600 font-medium">25% CAGR</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="text-5xl font-bold text-green-600 mb-4">$2.1B</div>
              <div className="text-xl font-semibold text-gray-900 mb-2">AI Nutrition Market</div>
              <div className="text-green-600 font-medium">42% CAGR</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Market Reality</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-3">89%</div>
                <p className="text-gray-700 font-medium">want personalized nutrition guidance</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-3">73%</div>
                <p className="text-gray-700 font-medium">struggle to interpret food labels</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-3">65%</div>
                <p className="text-gray-700 font-medium">use mobile health applications</p>
              </div>
            </div>
            <p className="text-xl text-center text-gray-900 font-semibold">
              WIHY becomes the intelligence backbone for all of them.
            </p>
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

      {/* Investment Opportunity Section */}
      <section id="investment" className="py-20 bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-600 mb-6">
              Investment Opportunity
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              WIHY is positioned as the intelligence backbone for food and health decisions, with clear paths into enterprise, education, and clinical markets.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Scalable Revenue Model</h3>
              <p className="text-gray-600 leading-relaxed">
                B2C subscriptions, B2B enterprise licensing, and API partnerships across healthcare, insurance, and consumer wellness sectors.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Defensible Technology</h3>
              <p className="text-gray-600 leading-relaxed">
                Proprietary data curation pipeline, custom-trained health LLMs, and continuously updated knowledge graph create significant barriers to entry.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Massive Addressable Market</h3>
              <p className="text-gray-600 leading-relaxed">
                Targeting $4.2T global wellness market, $127B digital health sector, and $2.1B AI nutrition space with a platform that serves all three.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                WIHY — Where Science Meets Understanding
              </h3>
              <p className="text-xl text-gray-600">
                Transforming health from reactive care to proactive intelligence.
              </p>
              <p className="text-lg text-gray-500 mt-4">
                Proven outcomes based on internal testing, prototype feedback, and designed capabilities.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CTAButton href="mailto:investors@wihy.ai" primary>
                Request Investment Deck
              </CTAButton>
              <CTAButton href="mailto:support@wihy.ai" primary>
                Schedule Meeting
              </CTAButton>
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