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

        {/* Centered Main Title */}
        <div className="main-title-section">
          <h1 className={`main-page-title ${isLoaded ? 'animate-in' : ''}`}>
            <span className="gradient-text">The Future of Health Intelligence</span>
          </h1>
          <p className="main-page-kicker">
            Scan food. Decode research. Turn confusing health data into clear actions.
          </p>
        </div>

        <div className="hero-content">
          <div className="hero-container">
            <div className="hero-left">
              <div className={`hero-badge ${isLoaded ? 'animate-in' : ''}`}>
                <span>Series Seed</span>
                <span>Health Tech</span>
                <span>AI Platform</span>
              </div>
              
              <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                WIHY.ai transforms how people understand food, health, and nutrition through advanced AI,
                real-time scanning, and personalized intelligence. We are building the definitive platform
                where "What Is Healthy?" gets a clear, evidence-based answer.
              </p>

              <div className={`hero-stats ${isLoaded ? 'animate-in delay-3' : ''}`}>
                <div className="stat">
                  <div className="stat-number">$2.1B</div>
                  <div className="stat-label">Health AI Market Size</div>
                </div>
                <div className="stat">
                  <div className="stat-number">95%</div>
                  <div className="stat-label">User Retention Rate</div>
                </div>
                <div className="stat">
                  <div className="stat-number">24/7</div>
                  <div className="stat-label">AI Availability</div>
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

      {/* Platform Overview */}
      <section id="platform" className="platform-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Revolutionary Health Intelligence Platform</h2>
            <p className="section-subtitle">
              WIHY.ai combines cutting-edge AI, real-time scanning, and comprehensive health analytics
              to create a nutrition intelligence layer that sits on top of everyday decisions.
            </p>
          </div>

          <div className="platform-grid">
            <FeatureCard
              iconComponent={
                <img 
                  src="/assets/Advanced_AI_Engine.gif" 
                  alt="AI Engine Analysis Demo"
                  style={{
                    width: '180px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
              }
              title="Advanced AI Engine"
              description="Health-focused LLM tuned on nutrition science, medical research, and real-world food data. Provides contextual answers backed by evidence."
              metrics={[
                { label: 'Accuracy', value: '99.7%' },
                { label: 'Data Points', value: '2.1M+' }
              ]}
            />

            <FeatureCard
              iconComponent={
                <img 
                  src="/assets/Universal_Scanning.gif" 
                  alt="Universal Scanning Demo"
                  style={{
                    width: '180px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
              }
              title="Universal Scanning"
              description="Barcode, image, and ingredient analysis in real time. Instantly decode any product or plate with a full breakdown and health score."
              metrics={[
                { label: 'Products', value: '500K+' },
                { label: 'Scan Time', value: '0.3s' }
              ]}
            />

            <FeatureCard
              iconComponent={
                <img 
                  src="/assets/Predictive_Analytics.gif" 
                  alt="Predictive Analytics Dashboard"
                  style={{
                    width: '180px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
              }
              title="Predictive Analytics"
              description="Dashboards that connect food, sleep, movement, and mood. See patterns, projections, and recommended next actions."
              metrics={[
                { label: 'Health Metrics', value: '15+' },
                { label: 'Updates', value: 'Real-time' }
              ]}
            />

            <FeatureCard
              iconComponent={
                <img 
                  src="/assets/Research_Integration.gif" 
                  alt="Research Integration Network"
                  style={{
                    width: '180px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
              }
              title="Research Integration"
              description="Continuously synced with current nutrition research, clinical guidelines, and public health data so answers stay current."
              metrics={[
                { label: 'Studies', value: '10K+' },
                { label: 'Updates', value: 'Daily' }
              ]}
            />
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="tech-section">
        <div className="section-container">
          <div className="tech-content">
            <div className="tech-left">
              <h2 className="tech-title">Built for Scale and Intelligence</h2>
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
                    <span>Custom LLM</span>
                    <span>Computer Vision</span>
                    <span>NLP Engine</span>
                    <span>Predictive Models</span>
                  </div>
                </div>

                <div className="stack-category">
                  <h4>Infrastructure</h4>
                  <div className="stack-items">
                    <span>Azure Cloud</span>
                    <span>Auto-scaling</span>
                    <span>Edge APIs</span>
                    <span>Observability</span>
                  </div>
                </div>

                <div className="stack-category">
                  <h4>Data</h4>
                  <div className="stack-items">
                    <span>Nutrition Graph</span>
                    <span>Research Engine</span>
                    <span>User Analytics</span>
                    <span>Health Metrics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Demo Section */}
      <section id="demo" className="demo-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Experience WIHY.ai in Action</h2>
            <p className="section-subtitle">
              Live charts, NOVA scores, and research timelines show how WIHY turns noisy data into clear guidance.
            </p>
          </div>

          <div className="demo-grid">
            <MacronutrientPieChart
              data={{ protein: 25, carbohydrates: 45, fat: 30 }}
              title="Macronutrient Analysis"
              displayMode="percentage"
            />
            <NovaChart query="Sample Food Item" />
            <PublicationTimelineChart timeRange="decade" title="Research Timeline" />
          </div>

          <div className="demo-cta">
            <CTAButton primary href="/" size="large">
              Try WIHY.ai Now – Free
            </CTAButton>
          </div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section id="market" className="market-section">
        <div className="section-container">
          <div className="market-header">
            <h2 className="section-title">Massive Market Opportunity</h2>
            <p className="section-subtitle">
              Health awareness, AI, and digital care are converging into a multi-trillion-dollar landscape.
            </p>
          </div>

          <div className="market-stats">
            <MetricCard
              value="$4.2T"
              label="Global Wellness Market"
              growth="+7.8% CAGR"
              valueColor="#4cbb17"
            />
            <MetricCard
              value="$127B"
              label="Digital Health Market"
              growth="+25% CAGR"
              valueColor="#4cbb17"
            />
            <MetricCard
              value="$2.1B"
              label="AI Nutrition Market"
              growth="+42% CAGR"
              valueColor="#4cbb17"
            />
          </div>

          <div className="market-trends">
            <HighlightCard number="89%" text="of consumers want personalized nutrition advice." numberColor="#4cbb17" />
            <HighlightCard number="73%" text="struggle to understand food labels today." numberColor="#4cbb17" />
            <HighlightCard number="65%" text="use mobile apps when making health decisions." numberColor="#4cbb17" />
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section id="founder" className="leadership-section">
        <div className="section-container">
          <div className="leadership-header">
            <h2 className="section-title">Visionary Leadership</h2>
            <p className="section-subtitle">
              Led by operators who live at the intersection of health, systems design, and community.
            </p>
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
              <h3 className="founder-name">Kortney O. Lee</h3>
              <div className="founder-title">Founder and CEO</div>

              <div className="founder-credentials">
                <div className="credential">
                  <span className="credential-icon">🎓</span>
                  MBA • History Degree • Licensed Contractor
                </div>
                <div className="credential">
                  <span className="credential-icon">📚</span>
                  Author: "What Is Healthy? And Why Is It So Hard to Achieve?"
                </div>
                <div className="credential">
                  <span className="credential-icon">🏗️</span>
                  Systems and Operations Architect • Community Health Advocate
                </div>
              </div>

              <div className="founder-vision">
                <h4>Mission-Driven Vision</h4>
                <p>
                  "WIHY.ai came from the same question I kept hearing in homes, schools, and clinics:
                  what is actually healthy, and why is it so hard to live that way? We are building
                  the engine that finally answers that question with clarity and data."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Opportunity */}
      <section id="investment" className="investment-section">
        <div className="section-container">
          <div className="investment-content">
            <div className="investment-left">
              <h2 className="investment-title">Investment Opportunity</h2>
              <p className="investment-subtitle">
                WIHY.ai is positioned as the intelligence layer for food and everyday health decisions,
                with a path into employers, schools, and clinical partners.
              </p>

              <div className="investment-highlights">
                <div className="highlight">
                  <div className="highlight-icon">🎯</div>
                  <div className="highlight-content">
                    <h4>Seed Round</h4>
                    <p>Scaling the core platform, expanding the team, and deepening data integrations.</p>
                  </div>
                </div>

                <div className="highlight">
                  <div className="highlight-icon">🚀</div>
                  <div className="highlight-content">
                    <h4>Product Traction</h4>
                    <p>High engagement across scanning, chat, and dashboards in early pilots.</p>
                  </div>
                </div>

                <div className="highlight">
                  <div className="highlight-icon">🌟</div>
                  <div className="highlight-content">
                    <h4>Scalable Technology</h4>
                    <p>Modular architecture ready to support consumer, enterprise, and health system use cases.</p>
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
        </div>
      </section>

      {/* Footer */}
      <footer className="investor-footer">
        <div className="footer-container">
          <div className="footer-left">
            <div className="footer-logo">
              <img src="/assets/wihylogo.png" alt="WIHY.ai" className="footer-logo-img" />
              <div className="footer-logo-text">
                <span className="footer-brand">WIHY.ai</span>
                <span className="footer-tagline">Health Intelligence Platform</span>
              </div>
            </div>
            <p className="footer-disclaimer">
              © {currentYear} WIHY.ai. All rights reserved. This page is for education and information only
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
          <div className="floating-popup-header">See WIHY.ai explain your last meal</div>
          <p className="floating-popup-text">
            Open a live demo and ask WIHY to analyze what you ate today. Watch the intelligence engine work in real time.
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