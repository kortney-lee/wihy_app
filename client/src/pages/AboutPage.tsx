import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/shared/Header';
import FullScreenChat from '../components/ui/FullScreenChat';
import { FeatureCard, MetricCard, HighlightCard } from '../components/shared/CardComponents';
import { CTAButton, NavLink } from '../components/shared/ButtonComponents';
import MacronutrientPieChart from '../components/charts/cards/MacronutrientPieChart';
import NovaChart from '../components/charts/cards/NovaChart';
import PublicationTimelineChart from '../components/charts/cards/PublicationTimelineChart';
import '../styles/AboutPage.css';
import '../styles/MobileAboutPage.css';
import '../styles/InvestorSections.css';

const AboutPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showWaitlistPopup, setShowWaitlistPopup] = useState(false);
  const [hasDismissedPopup, setHasDismissedPopup] = useState(false);
  
  // Ref to monitor the chat container specifically
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  // Simple automation: show popup after scroll or a short delay
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
    }, 10000); // 10s

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, [hasDismissedPopup]);

  const handleDismissPopup = () => {
    setShowWaitlistPopup(false);
    setHasDismissedPopup(true);
  };

  // Prevent embedded chat from scrolling the page while allowing internal chat scrolling
  useEffect(() => {
    // Override scrollIntoView to prevent chat from scrolling the page
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function(options) {
      // Check if this element or any parent has chat-related classes
      const isInsideChatContainer = this.closest('.chat-frame-container, .about-page-wrapper .chat-frame-content, .search-input');
      
      if (isInsideChatContainer) {
        // Check if this is likely the messagesEndRef (empty div at end of messages)
        const isLikelyMessagesEndRef = (
          this.tagName === 'DIV' && 
          !this.className && 
          !this.textContent?.trim() &&
          this.previousElementSibling // Has previous elements (messages)
        );
        
        if (isLikelyMessagesEndRef) {
          // Find the scrollable chat container and scroll within it
          const scrollableContainer = this.closest('.chat-messages, .message-list, .messages-container, [class*="messages"], [class*="chat-content"]');
          
          if (scrollableContainer && scrollableContainer.scrollTop !== undefined) {
            // Scroll within chat container instead of page
            scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
            return;
          }
          
          // Fallback: try to find any scrollable parent within chat
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
        
        return; // Block the scroll call for chat elements
      }
      
      // Allow normal scrollIntoView for non-chat elements
      return originalScrollIntoView.call(this, options);
    };

    return () => {
      // Restore original scrollIntoView function
      Element.prototype.scrollIntoView = originalScrollIntoView;
    };
  }, []);

  return (
    <div className="about-page-wrapper">
      {/* Hero Header */}
      <header className="bg-transparent relative pt-8">
        <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-black/10">
          <div className="flex justify-between items-center max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center">
              <img src="/assets/wihylogo.png" alt="WIHY.ai" className="h-10 w-auto" />
            </div>

            <button
              className="hidden flex-col gap-1 border-0 bg-transparent p-1 cursor-pointer md:flex"
              onClick={() => setIsNavOpen(open => !open)}
              aria-label="Toggle navigation"
            >
              <span className="w-5 h-0.5 bg-vh-ink rounded-full" />
              <span className="w-5 h-0.5 bg-vh-ink rounded-full" />
              <span className="w-5 h-0.5 bg-vh-ink rounded-full" />
            </button>

            <div className={`flex gap-5 items-center list-none m-0 p-0 ${isNavOpen ? 'open' : ''}`}>
              <NavLink href="#platform">Platform</NavLink>
              <NavLink href="#technology">Technology</NavLink>
              <NavLink href="#market">Market</NavLink>
              <NavLink href="#founder">Leadership</NavLink>
              <NavLink href="#investment">Investment</NavLink>
              <CTAButton href="/" primary>
                Launch Platform
              </CTAButton>
            </div>
          </div>
        </nav>

        {/* Main Title Block */}
        <div className="text-center py-20 px-16 mx-auto bg-transparent max-w-6xl">
          <h1 className={`text-6xl font-bold m-0 p-4 opacity-0 translate-y-8 transition-all duration-700 ease-out text-wihy-green ${isLoaded ? 'opacity-100 translate-y-0' : ''}`}>
            The Health Intelligence Platform
          </h1>
        </div>

        <div className="py-8">
          <div className="max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start min-h-[700px] bg-hero-gradient">
            <div className="flex flex-col justify-start">
              <div className={`flex items-center justify-center gap-2 bg-transparent p-0 mx-auto mb-8 opacity-0 translate-y-5 transition-all duration-500 ease-out w-full relative z-10 ${isLoaded ? 'opacity-100 translate-y-0' : ''}`}>
                <span className="py-1.5 px-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-500 shadow-sm">Series Seed</span>
                <span className="py-1.5 px-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-500 shadow-sm">Health Tech</span>
                <span className="py-1.5 px-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-500 shadow-sm">AI Platform</span>
              </div>
              
              <div className="mb-8">
                <h2 className="text-5xl font-bold text-black text-left mb-6 leading-tight">
                  The Future of Health Intelligence
                </h2>
                <p className="text-xl text-gray-700 leading-relaxed">
                  Ask. Seek. Get answers.
                </p>
              </div>
              
              <div className="mb-8">
                <div className="text-left space-y-3">
                  <p className="text-lg text-gray-700 leading-relaxed">Scan food. No more manual tracking or calorie counting.</p>
                  <p className="text-lg text-gray-700 leading-relaxed">Decode research. Understand the science behind every health decision.</p>
                  <p className="text-lg text-gray-700 leading-relaxed">Translate 35 million peer-reviewed studies into clear, personalized guidance.</p>
                </div>
              </div>
              
              <div className="mb-8">
                <p className={`font-bold text-black text-lg leading-relaxed mb-8 opacity-0 translate-y-5 transition-all duration-500 ease-out delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : ''}`}>
                  WIHY.ai unifies global medical research, government-verified health data, real-time food intelligence, and predictive analytics into one system for consumers, enterprises, and healthcare organizations.
                </p>
              </div>

              <div className="mb-8">
                <p className={`font-bold text-black text-lg leading-relaxed mb-8 opacity-0 translate-y-5 transition-all duration-500 ease-out delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : ''}`}>
                  WIHY.ai is the first health intelligence system to combine:
                </p>
                
                <div className={`text-left opacity-0 translate-y-5 transition-all duration-500 ease-out delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : ''}`}>
                  <ul className="list-disc list-outside pl-6 my-4 space-y-2">
                    <li className="mb-2 leading-relaxed text-gray-700">Global medical and nutrition research</li>
                    <li className="mb-2 leading-relaxed text-gray-700">Government-verified health data</li>
                    <li className="mb-2 leading-relaxed text-gray-700">Real-time food and ingredient intelligence</li>
                    <li className="mb-2 leading-relaxed text-gray-700">Predictive analytics</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed text-center">into a single platform designed to support personal, institutional, and population health decisions.</p>
                </div>
              </div>

              <div className={`flex gap-4 mt-12 opacity-0 translate-y-5 transition-all duration-500 ease-out delay-700 justify-center ${isLoaded ? 'opacity-100 translate-y-0' : ''}`}>
                <CTAButton href="#investment" primary>
                  View Investment Opportunity
                </CTAButton>
              </div>
            </div> {/* End hero-left */}

            <div className="relative rounded-3xl p-4 shadow-wihy transition-all duration-300 transform hover:-translate-y-2 hover:shadow-wihy-hover">
              <div 
                ref={chatContainerRef}
                className={`max-w-md mx-auto relative ${isLoaded ? 'opacity-100 translate-y-0 transition-all duration-500 delay-500' : 'opacity-0 translate-y-8'}`}
              >
                <div className="w-full h-full p-0 m-0">
                  {/* Embedded preview of the chat experience */}
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
            </div> {/* End hero-right */}
          </div> {/* End hero-container */}
        </div> {/* End hero-content */}
      </header>

      {/* Key Metrics Section */}
      <section className="bg-wihy-surface-2 py-0">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className={`flex justify-center items-center gap-16 mx-auto px-8 py-16 opacity-0 translate-y-5 transition-all duration-500 ease-out delay-500 max-w-7xl w-full flex-wrap ${isLoaded ? 'opacity-100 translate-y-0' : ''}`}>
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl border border-gray-100 p-8 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-w-[280px] flex-1 max-w-xs relative">
              <div className="text-4xl font-bold text-wihy-green mb-2">$4.2T</div>
              <div className="text-base text-gray-600 font-medium">Global Wellness Market</div>
            </div>
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl border border-gray-100 p-8 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-w-[280px] flex-1 max-w-xs relative">
              <div className="text-4xl font-bold text-wihy-green mb-2">35M+</div>
              <div className="text-base text-gray-600 font-medium">Research Studies</div>
            </div>
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl border border-gray-100 p-8 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-w-[280px] flex-1 max-w-xs relative">
              <div className="text-4xl font-bold text-wihy-green mb-2">99.9%</div>
              <div className="text-base text-gray-600 font-medium">System Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section id="platform" className="bg-wihy-surface-2 py-0">
        <div className="bg-section-gradient py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-wihy-green text-center mb-6">Revolutionary Health Intelligence Platform</h2>
            <p className="text-xl text-gray-600 text-center max-w-4xl mx-auto leading-relaxed">
              WIHY.ai combines real-time research translation, precision nutrition, and personal health insights into a unified intelligence layer that clarifies food, lifestyle, and clinical decisions.
            </p>
            <h3 className="text-2xl font-semibold text-gray-900 text-center mt-8 mb-8">Core Capabilities</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 max-w-6xl mx-auto px-8">
            <div className="p-4">
              <FeatureCard
                iconComponent={
                  <img 
                    src="/assets/Advanced_AI_Engine.gif" 
                    alt="AI Engine Analysis Demo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                }
                title="Advanced AI Engine"
                description="A health-specialized LLM trained on nutrition science, biomedical research, and verified government datasets. Built for accuracy, transparency, and clinical relevance."
                metrics={[
                  { label: 'indexed studies', value: '35M+' },
                  { label: 'Evidence graded for', value: 'quality' }
                ]}
              />
            </div>

            <div className="p-4">
              <FeatureCard
                iconComponent={
                  <img 
                    src="/assets/Unviersal_Scanning.gif" 
                    alt="Universal Scanning Demo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                }
                title="Universal Scanning"
                description="Instant analysis of food and ingredients using barcode decoding, food photography, ingredient OCR, receipt parsing, and global product verification."
                metrics={[
                  { label: 'products', value: '4.1M+' },
                  { label: 'countries', value: '200+' }
                ]}
              />
            </div>

            <div className="p-4">
              <FeatureCard
                iconComponent={
                  <img 
                    src="/assets/Predictive_Analytics.gif" 
                    alt="Predictive Analytics Dashboard"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                }
                title="Predictive Analytics"
                description="Connects food, sleep, activity, hydration, symptoms, and biomarkers. Identifies patterns, forecasts risk, and generates personalized recommendations."
                metrics={[
                  { label: 'health metrics', value: '15+' },
                  { label: 'Real-time', value: 'modeling' }
                ]}
              />
            </div>

            <div className="p-4">
              <FeatureCard
                iconComponent={
                  <img 
                    src="/assets/Research_Integration.gif" 
                    alt="Research Integration Network"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                }
                title="Research Integration"
                description="Continuous synchronization with global nutrition and health sources including PubMed, FDA, USDA, OpenFoodFacts, and CDC surveillance datasets."
                metrics={[
                  { label: 'daily updates', value: '10K+' },
                  { label: 'Global data', value: 'coverage' }
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="bg-white py-0">
        <div className="max-w-7xl mx-auto px-8 py-16">
          {/* Technical Architecture Title - Centered */}
          <div className="text-center mb-12">
            <h3 className="text-4xl lg:text-5xl font-bold text-wihy-green text-center mb-4">Technical Architecture</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              A distributed, modular architecture designed for precision, scale, and explainable AI.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Built for Scale and Intelligence</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">WIHY.ai is engineered to deliver fast, reliable, and verifiable insights for enterprise, clinical, and consumer use.</p>
              <div className="space-y-8">
                <div className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="text-3xl flex-shrink-0">⚡</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast Processing</h4>
                    <p className="text-gray-600 leading-relaxed">Cloud-native architecture handling thousands of queries per second with sub-300ms responses.</p>
                  </div>
                </div>

                <div className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="text-3xl flex-shrink-0">🛡️</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Enterprise-Grade Security</h4>
                    <p className="text-gray-600 leading-relaxed">SOC 2 aligned design, end-to-end encryption, and HIPAA-ready pathways for healthcare partners.</p>
                  </div>
                </div>

                <div className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="text-3xl flex-shrink-0">🌐</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Global Reach</h4>
                    <p className="text-gray-600 leading-relaxed">Regional nutrition databases and culturally aware recommendations tuned for real communities.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-3xl border border-gray-200 shadow-lg space-y-8">
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-wihy-green mb-4">AI and ML</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-wihy-blue-light text-vh-accent px-3 py-1 rounded-xl text-sm font-medium border border-gray-200">Custom LLMs for health reasoning</span>
                    <span className="bg-wihy-blue-light text-vh-accent px-3 py-1 rounded-xl text-sm font-medium border border-gray-200">Nutrition and ingredient scoring models</span>
                    <span className="bg-wihy-blue-light text-vh-accent px-3 py-1 rounded-xl text-sm font-medium border border-gray-200">FDA pharmacology interpretation</span>
                    <span className="bg-wihy-blue-light text-vh-accent px-3 py-1 rounded-xl text-sm font-medium border border-gray-200">Computer vision models for food identification</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-wihy-green mb-4">Infrastructure</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-wihy-blue-light text-vh-accent px-3 py-1 rounded-xl text-sm font-medium border border-gray-200">Azure cloud deployment</span>
                    <span className="bg-wihy-blue-light text-vh-accent px-3 py-1 rounded-xl text-sm font-medium border border-gray-200">Auto-scaling containers</span>
                    <span className="bg-wihy-blue-light text-vh-accent px-3 py-1 rounded-xl text-sm font-medium border border-gray-200">Edge APIs for low-latency inference</span>
                    <span className="bg-wihy-blue-light text-vh-accent px-3 py-1 rounded-xl text-sm font-medium border border-gray-200">Full observability and monitoring</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-wihy-green mb-4">Data</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-wihy-blue-light text-vh-accent px-3 py-1 rounded-xl text-sm font-medium border border-gray-200">Nutrition knowledge graph</span>
                    <span className="bg-wihy-blue-light text-vh-accent px-3 py-1 rounded-xl text-sm font-medium border border-gray-200">Research ingestion engine</span>
                    <span className="bg-wihy-blue-light text-vh-accent px-3 py-1 rounded-xl text-sm font-medium border border-gray-200">User analytics</span>
                    <span className="bg-wihy-blue-light text-vh-accent px-3 py-1 rounded-xl text-sm font-medium border border-gray-200">Health metric processing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Live Intelligence Demonstrations */}
      <section id="demo" className="demo-section">
        <div className="section-container-gradient-inner">
          <div className="section-header">
            <h2 className="section-title">See WIHY Live</h2>
            <p className="section-subtitle">
              Experience real-time analysis powered by verified data and continuous research integration.
            </p>
          </div>

          <div className="demo-grid">
            <div className="demo-card">
              <MacronutrientPieChart
                data={{ protein: 25, carbohydrates: 45, fat: 30 }}
                title="Macronutrient Analysis"
                displayMode="percentage"
              />
              <p className="demo-description">Instant nutrient breakdowns powered by verified data.</p>
            </div>

            <div className="demo-card">
              <NovaChart query="Sample Food Item" />
              <p className="demo-description">Precise classification through ingredient-level analysis.</p>
            </div>

            <div className="demo-card">
              <PublicationTimelineChart timeRange="decade" title="Research Timeline" />
              <p className="demo-description">Research timelines across decades, updated in real-time.</p>
            </div>
          </div>

        </div>
      </section>

      {/* WIHY Health Intelligence Stack Section */}
      <section id="intelligence-stack" className="section-container">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">WIHY Health Intelligence Stack</h2>
            <p className="section-subtitle">
              A comprehensive architecture powering real-time health intelligence through advanced AI and data processing.
            </p>
          </div>
          
          <div className="tech-stack-overview">
            <div className="tech-stack-cards">
              <div className="tech-card-wrapper">
                <FeatureCard
                  iconComponent={
                    <img 
                      src="/assets/Research_Harvesting_Layer.png" 
                      alt="Research Harvesting Layer Architecture"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  }
                  title="1. Research Harvesting Layer"
                  description="Automated ingestion from PubMed, PMC, FDA, USDA, NIH, NASS, and CDC with real-time delta updates and multi-language ingestion across 195+ countries."
                  metrics={[
                    { label: 'Sources', value: '7+' },
                    { label: 'Countries', value: '195+' }
                  ]}
                />
              </div>

              <div className="tech-card-wrapper">
                <FeatureCard
                  iconComponent={
                    <img 
                      src="/assets/Curation_Pipeline.png" 
                      alt="Quality Curation Pipeline"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  }
                  title="2. Quality Curation Pipeline"
                  description="AI-based credibility scoring, evaluation of study design, sample size, and effect strength with evidence grading from low to high confidence and removal of commercial bias."
                  metrics={[
                    { label: 'AI Scoring', value: 'Auto' },
                    { label: 'Bias', value: 'Removed' }
                  ]}
                />
              </div>

              <div className="tech-card-wrapper">
                <FeatureCard
                  iconComponent={
                    <img 
                      src="/assets/Nutrition_Graph.png" 
                      alt="Data Normalization and Nutrition Graph"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  }
                  title="3. Data Normalization and Nutrition Graph"
                  description="Unified mapping of ingredients, nutrients, additives, allergens, and contaminants with links connecting foods to symptoms, conditions, and research. 4.1M+ food products tied to verified sources."
                  metrics={[
                    { label: 'Products', value: '4.1M+' },
                    { label: 'Verified', value: '100%' }
                  ]}
                />
              </div>

              <div className="tech-card-wrapper">
                <FeatureCard
                  iconComponent={
                    <img 
                      src="/assets/Model_Training.png" 
                      alt="Domain-Specific Model Training"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  }
                  title="4. Domain-Specific Model Training"
                  description="Custom LLMs trained on curated biomedical datasets, nutrition scoring and risk interpretation models, and vision models for ingredient-level detection."
                  metrics={[
                    { label: 'Custom LLMs', value: 'Multi' },
                    { label: 'Datasets', value: 'Curated' }
                  ]}
                />
              </div>

              <div className="tech-card-wrapper">
                <FeatureCard
                  iconComponent={
                    <img 
                      src="/assets/Prediction_Reasoning.png" 
                      alt="Prediction and Reasoning Engine"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  }
                  title="5. Prediction and Reasoning Engine"
                  description="Behavioral pattern detection, forecasting for metabolic markers and dietary impact, and multi-source fusion for holistic risk scoring."
                  metrics={[
                    { label: 'Patterns', value: 'Real-time' },
                    { label: 'Markers', value: 'Multi' }
                  ]}
                />
              </div>

              <div className="tech-card-wrapper">
                <FeatureCard
                  iconComponent={
                    <img 
                      src="/assets/Development_ops.png" 
                      alt="Deployment and Operations"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  }
                  title="6. Deployment and Operations"
                  description="Azure ML for distributed training, automated versioning and rollback, SOC 2 aligned design, 99.9 percent uptime, and sub-300ms inference latency."
                  metrics={[
                    { label: 'Uptime', value: '99.9%' },
                    { label: 'Latency', value: '<300ms' }
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience WIHY Intelligence */}
      <section id="experience-wihy" className="section-container-gradient">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Experience WIHY Intelligence</h2>
            <p className="section-subtitle">
              Upload food photos. Scan barcodes. Share research links. WIHY delivers instant science.
            </p>
          </div>
          
          <div className="demo-cta">
            <CTAButton primary href="/">
              Try WIHY.ai Now – Free
            </CTAButton>
          </div>
        </div>
      </section>

      {/* Market Opportunity and Strategic Positioning */}
      <section id="market" className="market-section">
        <div className="section-container">
          <div className="market-header">
            <h2 className="section-title">Market Opportunity</h2>
            <p className="section-subtitle">
              WIHY sits at the convergence of three rapidly expanding markets.
            </p>
          </div>

          <div className="market-stats">
            <MetricCard
              value="$4.2T"
              label="Global Wellness Market"
              growth="7.8% CAGR"
              valueColor="#4cbb17"
            />
            <MetricCard
              value="$127B"
              label="Digital Health Market"
              growth="25% CAGR"
              valueColor="#4cbb17"
            />
            <MetricCard
              value="$2.1B"
              label="AI Nutrition Market"
              growth="42% CAGR"
              valueColor="#4cbb17"
            />
          </div>

          <div className="consumer-demand">
            <h3>Market Reality</h3>
            <div className="market-trends">
              <HighlightCard number="89%" text="want personalized nutrition guidance" numberColor="#4cbb17" />
              <HighlightCard number="73%" text="struggle to interpret food labels" numberColor="#4cbb17" />
              <HighlightCard number="65%" text="use mobile health applications" numberColor="#4cbb17" />
            </div>
            <p className="market-conclusion">WIHY becomes the intelligence backbone for all of them.</p>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section id="founder" className="leadership-section">
        <div className="section-container">
          <div className="leadership-header">
            <h2 className="section-title">Leadership</h2>
          </div>

          <div className="founder-spotlight">
            <div className="founder-image">
              <div className="founder-photo">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80"
                  alt="Kortney O. Lee, Founder and CEO"
                  className="founder-photo-img"
                />
              </div>
            </div>

            <div className="founder-details">
              <h3 className="founder-name">Kortney O. Lee — Founder & CEO</h3>
              
              <div className="founder-credentials">
                <div className="credential">
                  <span className="credential-icon">🎓</span>
                  MBA • Historian • Systems Designer
                </div>
                <div className="credential">
                  <span className="credential-icon">📚</span>
                  Author: "What Is Healthy? And Why Is It So Hard to Achieve?"
                </div>
                <div className="credential">
                  <span className="credential-icon">🏗️</span>
                  Community Health Advocate
                </div>
              </div>

              <div className="founder-vision">
                <blockquote>
                  "We built WIHY to answer the hardest question in health: clarity, truth, and evidence."
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Grid Section */}
      <section id="metrics-grid" className="metrics-grid-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Performance Metrics & Outcomes</h2>
            <p className="section-subtitle">
              Comprehensive performance indicators across key areas of platform capability and expected outcomes.
            </p>
          </div>
          
          <div className="platform-grid">
            {/* Key Metrics */}
            <div className="platform-card-wrapper">
              <div className="metrics-card">
              <div className="metrics-card-header">
                <h3 className="metrics-card-title">Key Metrics (Projected and Capability-Based)</h3>
                <p className="metrics-card-subtitle">
                  Performance indicators based on market benchmarks, prototype testing, and controlled evaluations.
                </p>
              </div>
              <div className="metrics-content">
                <div className="metric-item">
                  <div className="metric-label">Projected User Growth: +78% MoM potential based on market benchmarks</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '78%' }}></div>
                  </div>
                  <div className="metric-value">+78% MoM</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Projected Engagement: Expected 92% activity rate based on prototype testing</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '92%' }}></div>
                  </div>
                  <div className="metric-value">92% Active</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Platform Accuracy: 97.3% model accuracy in controlled evaluations</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '97%' }}></div>
                  </div>
                  <div className="metric-value">97.3%</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Market Penetration: Early stage with planned rollout across key verticals</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '15%' }}></div>
                  </div>
                  <div className="metric-value">Early Stage</div>
                </div>
              </div>
            </div>
            </div>

            {/* System Performance */}
            <div className="platform-card-wrapper">
              <div className="metrics-card">
              <div className="metrics-card-header">
                <h3 className="metrics-card-title">System Performance</h3>
                <p className="metrics-card-subtitle">
                  Real-world performance metrics from internal testing and controlled evaluations.
                </p>
              </div>
              <div className="metrics-content">
                <div className="metric-item">
                  <div className="metric-label">System Uptime: 99.9% uptime during internal testing</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '99%' }}></div>
                  </div>
                  <div className="metric-value">99.9%</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Research Translation: 95% accuracy in controlled evaluations</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '95%' }}></div>
                  </div>
                  <div className="metric-value">95%</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Analysis Speed: Under 30 seconds for complex multi-source analysis</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '85%' }}></div>
                  </div>
                  <div className="metric-value">&lt;30s</div>
                </div>
              </div>
            </div>
            </div>

            {/* User Outcomes */}
            <div className="platform-card-wrapper">
              <div className="metrics-card">
              <div className="metrics-card-header">
                <h3 className="metrics-card-title">User Outcomes (Projected, Not Actual Users)</h3>
                <p className="metrics-card-subtitle">
                  Modeled improvements based on structured guidance and prototype feedback.
                </p>
              </div>
              <div className="metrics-content">
                <div className="metric-item">
                  <div className="metric-label">Nutrition Literacy: Modeled 78% improvement based on structured guidance</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '78%' }}></div>
                  </div>
                  <div className="metric-value">+78%</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Food Choice Quality: Modeled 65% improvement in decision making</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '65%' }}></div>
                  </div>
                  <div className="metric-value">+65%</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Confusion Reduction: 43% reduction in conflicting health advice confusion</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '43%' }}></div>
                  </div>
                  <div className="metric-value">-43%</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Satisfaction Rating: Estimated 92% based on prototype feedback</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '92%' }}></div>
                  </div>
                  <div className="metric-value">92%</div>
                </div>
              </div>
            </div>
            </div>

            {/* Healthcare Outcomes */}
            <div className="platform-card-wrapper">
              <div className="metrics-card">
              <div className="metrics-card-header">
                <h3 className="metrics-card-title">Healthcare Outcomes (Designed For)</h3>
                <p className="metrics-card-subtitle">
                  Expected improvements and deployment capabilities for healthcare organizations.
                </p>
              </div>
              <div className="metrics-content">
                <div className="metric-item">
                  <div className="metric-label">Organization Deployment: Designed for 125+ organizations</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '100%' }}></div>
                  </div>
                  <div className="metric-value">125+</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Clinician Efficiency: Expected 67% reduction in repetitive nutrition questions</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '67%' }}></div>
                  </div>
                  <div className="metric-value">-67%</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Dietary Compliance: Expected 34% improvement with guided pathways</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '34%' }}></div>
                  </div>
                  <div className="metric-value">+34%</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Clinical Studies: IRB-ready architecture for multi-site studies</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '100%' }}></div>
                  </div>
                  <div className="metric-value">Ready</div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Opportunity */}
      <section id="investment" className="investment-section">
        <div className="section-container-gradient-inner">
          <div className="investment-left">
            <h2 className="investment-title">Investment Opportunity</h2>
            <p className="investment-subtitle">
              WIHY is positioned as the intelligence backbone for food and health decisions,
              with clear paths into enterprise, education, and clinical markets.
            </p>

            <div className="investment-highlights">
              <div className="highlight">
                <div className="highlight-icon">🎯</div>
                <div className="highlight-content">
                  <h4>Seed Funding</h4>
                  <p>Accelerate model expansion, data integration, enterprise partnerships, clinical validation, and national deployments.</p>
                </div>
              </div>

              <div className="highlight">
                <div className="highlight-icon">🚀</div>
                <div className="highlight-content">
                  <h4>Market Traction</h4>
                  <p>Strong user engagement across scanning and chat features. Growing enterprise and education pipeline.</p>
                </div>
              </div>

              <div className="highlight">
                <div className="highlight-icon">🌟</div>
                <div className="highlight-content">
                  <h4>Proven Architecture</h4>
                  <p>Modular platform ready for consumer, enterprise, and healthcare integration.</p>
                </div>
              </div>
            </div>

            <div className="investment-cta-centered">
              <CTAButton href="mailto:investors@wihy.ai" primary>
                Request Investment Deck
              </CTAButton>
              <CTAButton href="mailto:support@wihy.ai" primary>
                Schedule Meeting
              </CTAButton>
            </div>
          </div>
          <div className="final-message">
            <h2>WIHY — Where Science Meets Understanding</h2>
            <p>Transforming health from reactive care to proactive intelligence.</p>
            <p className="investment-outcomes-intro">
              Proven outcomes based on internal testing, prototype feedback, and designed capabilities.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="investor-footer">
        <div className="footer-container">
          <div className="footer-left">
            <div className="footer-logo">
              <img src="/assets/wihylogo.png" alt="WIHY" className="footer-logo-img" />
              <div className="footer-logo-text">
                <span className="footer-brand">WIHY</span>
                <span className="footer-tagline">Health Intelligence Platform</span>
              </div>
            </div>
            <p className="footer-disclaimer">
              © {currentYear} WIHY. All rights reserved. This page is for education and information only
              and is not a substitute for professional medical advice.
            </p>
          </div>

          <div className="footer-right">
            <div className="footer-contact">
              <h4>Investor Relations</h4>
              <a href="mailto:investors@wihy.ai">investors@wihy.ai</a>
              <a href="mailto:support@wihy.ai">support@wihy.ai</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating automation popup (desktop/tablet) */}
      {showWaitlistPopup && !hasDismissedPopup && (
        <div className="floating-popup">
          <button
            type="button"
            className="floating-popup-close"
            onClick={handleDismissPopup}
            aria-label="Close popup"
          >
            ×
          </button>
          <div className="floating-popup-header">See WIHY explain your last meal</div>
          <p className="floating-popup-text">
            Open a live demo and ask WIHY to analyze what you ate today. Watch the intelligence engine work in real-time.
          </p>
          <button
            type="button"
            className="floating-popup-cta"
            onClick={() => {
              setIsChatOpen(true);
              setShowWaitlistPopup(false);
            }}
          >
            Start a 30-second demo
          </button>
        </div>
      )}

      {/* Mobile sticky CTA */}
      <div className="mobile-sticky-cta">
        <button
          type="button"
          className="mobile-sticky-cta-btn"
          onClick={() => setIsChatOpen(true)}
        >
          Ask WIHY about my food
        </button>
      </div>

      {/* Full-screen chat trigger */}
      <FullScreenChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialQuery="Tell me about healthy nutrition choices."
        initialResponse="I am here to help you turn what you eat, how you sleep, and how you move into a simple plan you can follow. Tell me what you are doing today and I will walk you through the next best step."
      />
    </div>
  );
};

export default AboutPage;