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
      <header className="hero-header">
        <nav className="top-nav">
          <div className="nav-container">
            <div className="nav-brand">
              <img src="/assets/wihylogo.png" alt="WIHY.ai" className="nav-logo" />
            </div>

            <button
              className="mobile-nav-toggle"
              onClick={() => setIsNavOpen(open => !open)}
              aria-label="Toggle navigation"
            >
              <span />
              <span />
              <span />
            </button>

            <div className={`nav-links ${isNavOpen ? 'open' : ''}`}>
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
        <div className="main-title-section">
          <h1 className={`main-page-title gradient-text ${isLoaded ? 'animate-in' : ''}`}>
            The Health Intelligence Platform
          </h1>
        </div>

        <div className="hero-content">
          <div className="hero-container">
            <div className="hero-left">
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
            </div> {/* End hero-left */}

            <div className="hero-right">
              <div 
                ref={chatContainerRef}
                className={`chat-frame-container ${isLoaded ? 'animate-in delay-2' : ''}`}
              >
                <div className="chat-frame-content">
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
      <section className="metrics-section">
        <div className="section-container">
          <div className={`hero-stats ${isLoaded ? 'animate-in delay-3' : ''}`}>
            <div className="stat">
              <div className="stat-number">$4.2T</div>
              <div className="stat-label">Global Wellness Market</div>
            </div>
            <div className="stat">
              <div className="stat-number">35M+</div>
              <div className="stat-label">Research Studies</div>
            </div>
            <div className="stat">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">System Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section id="platform" className="platform-section">
        <div className="section-container-gradient">
          <div className="section-header">
            <h2 className="section-title">Revolutionary Health Intelligence Platform</h2>
            <p className="section-subtitle">
              WIHY.ai combines real-time research translation, precision nutrition, and personal health insights into a unified intelligence layer that clarifies food, lifestyle, and clinical decisions.
            </p>
            <h3 className="section-subsection-title">Core Capabilities</h3>
          </div>

          <div className="platform-grid">
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
      </section>

      {/* Technology Section */}
      <section id="technology" className="tech-section">
        <div className="section-container">
          {/* Technical Architecture Title - Centered */}
          <div className="tech-architecture-title">
            <h3 className="section-title centered">Technical Architecture</h3>
            <p className="section-subtitle centered">
              A distributed, modular architecture designed for precision, scale, and explainable AI.
            </p>
          </div>

          <div className="tech-content">
            <div className="tech-left">
              <h2 className="tech-title">Built for Scale and Intelligence</h2>
              <p className="tech-subtitle">WIHY.ai is engineered to deliver fast, reliable, and verifiable insights for enterprise, clinical, and consumer use.</p>
              <div className="tech-features">
                <div className="tech-feature">
                  <div className="tech-icon">⚡</div>
                  <div className="tech-info">
                    <h4>Lightning Fast Processing</h4>
                    <p>Cloud-native architecture handling thousands of queries per second with sub-300ms responses.</p>
                  </div>
                </div>

                <div className="tech-feature">
                  <div className="tech-icon">🛡️</div>
                  <div className="tech-info">
                    <h4>Enterprise-Grade Security</h4>
                    <p>SOC 2 aligned design, end-to-end encryption, and HIPAA-ready pathways for healthcare partners.</p>
                  </div>
                </div>

                <div className="tech-feature">
                  <div className="tech-icon">🌐</div>
                  <div className="tech-info">
                    <h4>Global Reach</h4>
                    <p>Regional nutrition databases and culturally aware recommendations tuned for real communities.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="tech-right">
              <div className="tech-stack">
                <div className="stack-category">
                  <h4>AI and ML</h4>
                  <div className="stack-items">
                    <span className="highlighted-item">Custom LLMs for health reasoning</span>
                    <span className="highlighted-item">Nutrition and ingredient scoring models</span>
                    <span className="highlighted-item">FDA pharmacology interpretation</span>
                    <span className="highlighted-item">Computer vision models for food identification</span>
                  </div>
                </div>

                <div className="stack-category">
                  <h4>Infrastructure</h4>
                  <div className="stack-items">
                    <span className="highlighted-item">Azure cloud deployment</span>
                    <span className="highlighted-item">Auto-scaling containers</span>
                    <span className="highlighted-item">Edge APIs for low-latency inference</span>
                    <span className="highlighted-item">Full observability and monitoring</span>
                  </div>
                </div>

                <div className="stack-category">
                  <h4>Data</h4>
                  <div className="stack-items">
                    <span className="highlighted-item">Nutrition knowledge graph</span>
                    <span className="highlighted-item">Research ingestion engine</span>
                    <span className="highlighted-item">User analytics</span>
                    <span className="highlighted-item">Health metric processing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Technical Architecture Section */}
          <div className="tech-architecture-detailed">
            <div className="tech-stack-overview">
              <h4>WIHY Health Intelligence Stack</h4>
              <p className="tech-stack-subtitle">
                A comprehensive architecture powering real-time health intelligence through advanced AI and data processing.
              </p>
              
              <div className="tech-stack-cards">
                <FeatureCard
                  title="1. Research Harvesting Layer"
                  description="Automated ingestion from PubMed, PMC, FDA, USDA, NIH, NASS, and CDC with real-time delta updates and multi-language ingestion across 195+ countries."
                  metrics={[
                    { label: 'Sources', value: '7+' },
                    { label: 'Countries', value: '195+' }
                  ]}
                />

                <FeatureCard
                  title="2. Quality Curation Pipeline"
                  description="AI-based credibility scoring, evaluation of study design, sample size, and effect strength with evidence grading from low to high confidence and removal of commercial bias."
                  metrics={[
                    { label: 'AI Scoring', value: 'Auto' },
                    { label: 'Bias', value: 'Removed' }
                  ]}
                />

                <FeatureCard
                  title="3. Data Normalization and Nutrition Graph"
                  description="Unified mapping of ingredients, nutrients, additives, allergens, and contaminants with links connecting foods to symptoms, conditions, and research. 4.1M+ food products tied to verified sources."
                  metrics={[
                    { label: 'Products', value: '4.1M+' },
                    { label: 'Verified', value: '100%' }
                  ]}
                />

                <FeatureCard
                  title="4. Domain-Specific Model Training"
                  description="Custom LLMs trained on curated biomedical datasets, nutrition scoring and risk interpretation models, and vision models for ingredient-level detection."
                  metrics={[
                    { label: 'Custom LLMs', value: 'Multi' },
                    { label: 'Datasets', value: 'Curated' }
                  ]}
                />

                <FeatureCard
                  title="5. Prediction and Reasoning Engine"
                  description="Behavioral pattern detection, forecasting for metabolic markers and dietary impact, and multi-source fusion for holistic risk scoring."
                  metrics={[
                    { label: 'Patterns', value: 'Real-time' },
                    { label: 'Markers', value: 'Multi' }
                  ]}
                />

                <FeatureCard
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

      {/* Live Intelligence Demonstrations */}
      <section id="demo" className="demo-section">
        <div className="section-container-gradient">
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

      {/* Experience WIHY Intelligence */}
      <section id="experience-wihy" className="experience-section">
        <div className="section-container">
          <div className="analyze-with-wihy">
            <h3>Experience WIHY Intelligence</h3>
            <p>Upload food photos. Scan barcodes. Share research links. WIHY delivers instant science.</p>
            
            <div className="demo-cta">
              <CTAButton primary href="/">
                Try WIHY.ai Now – Free
              </CTAButton>
            </div>
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

      {/* Investment Opportunity */}
      <section id="investment" className="investment-section">
        <div className="section-container-gradient">
          <div className="investment-content">
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

              <div className="investment-cta">
                <CTAButton href="mailto:investors@wihy.ai" primary>
                  Request Investment Deck
                </CTAButton>
                <CTAButton href="mailto:support@wihy.ai" primary={false}>
                  Schedule Meeting
                </CTAButton>
              </div>
            </div>

            <div className="investment-right">
              <div className="investment-metrics">
                <h4>Key Metrics</h4>
                
                <div className="metric-item">
                  <div className="metric-label">User Growth</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '78%' }}></div>
                  </div>
                  <div className="metric-value">+78% MoM</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">User Engagement</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '92%' }}></div>
                  </div>
                  <div className="metric-value">92% Active</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Platform Accuracy</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '97%' }}></div>
                  </div>
                  <div className="metric-value">97.3%</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Market Penetration</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: '15%' }}></div>
                  </div>
                  <div className="metric-value">Early Stage</div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Detailed Outcomes Section */}
          <div className="proven-outcomes-detailed">
            <h3>Proven Outcomes</h3>
            
            <div className="outcomes-grid">
              <div className="outcomes-section">
                <h4>System Performance</h4>
                <ul>
                  <li>99.9% uptime</li>
                  <li>95% research translation accuracy</li>
                  <li>Under 30 seconds for complex analysis</li>
                </ul>
              </div>

              <div className="outcomes-section">
                <h4>User Outcomes</h4>
                <ul>
                  <li>78% improvement in nutrition literacy</li>
                  <li>65% improvement in food decisions</li>
                  <li>43% reduction in health confusion</li>
                  <li>92% satisfaction</li>
                </ul>
              </div>

              <div className="outcomes-section">
                <h4>Healthcare Outcomes</h4>
                <ul>
                  <li>125+ organizations</li>
                  <li>67% fewer nutrition questions per visit</li>
                  <li>34% improved dietary compliance</li>
                  <li>Multiple IRB-approved studies</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="final-message">
            <h2>WIHY — Where Science Meets Understanding</h2>
            <p>Transforming health from reactive care to proactive intelligence.</p>
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