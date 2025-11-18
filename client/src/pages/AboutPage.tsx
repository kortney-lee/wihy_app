import React, { useState, useEffect } from 'react';
import '../styles/AboutPage.css';
import '../styles/MobileAboutPage.css';
import '../styles/InvestorSections.css';
import FullScreenChat from '../components/ui/FullScreenChat';

const AboutPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="about-page-wrapper">
      {/* Hero Header */}
      <header className="hero-header">
        <nav className="top-nav">
          <div className="nav-container">
            <div className="logo-section">
              <img src="/assets/wihylogo.png" alt="WIHY.ai" className="main-logo" />
            </div>
            
            <div className="nav-links">
              <a href="#platform" className="nav-link">Platform</a>
              <a href="#technology" className="nav-link">Technology</a>
              <a href="#market" className="nav-link">Market</a>
              <a href="#founder" className="nav-link">Leadership</a>
              <a href="#investment" className="nav-link">Investment</a>
              <a href="/" className="cta-nav">Launch Platform</a>
            </div>
          </div>
        </nav>

        {/* Centered Main Title */}
        <div className="main-title-section">
          <h1 className={`main-page-title ${isLoaded ? 'animate-in' : ''}`}>
            <span className="gradient-text">The Future of Health Intelligence</span>
          </h1>
        </div>

        <div className="hero-content">
          <div className="hero-container">
            <div className="hero-left">
              <div className={`hero-badge ${isLoaded ? 'animate-in' : ''}`}>
                <span className="badge-dot"></span>
                Series Seed • Health Tech • AI Platform
              </div>
              
              <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                WIHY.ai transforms how people understand food, health, and nutrition through advanced AI, 
                real-time scanning, and personalized intelligence. We're building the definitive platform 
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
                <a href="#investment" className="btn-primary-large">
                  View Investment Opportunity
                </a>
                <a href="#platform" className="btn-secondary-large">
                  Explore Platform
                </a>
              </div> {/* End hero-actions */}
            </div> {/* End hero-left */}

            <div className="hero-right">
              <div className={`chat-frame-container ${isLoaded ? 'animate-in delay-2' : ''}`}>
                <div className="chat-frame-header">
                  <div className="frame-controls">
                    <span className="control red"></span>
                    <span className="control yellow"></span>
                    <span className="control green"></span>
                  </div>
                  <div className="frame-title">
                    <span className="frame-icon">💬</span>
                    Live WIHY AI Demo
                  </div>
                </div>
                
                <div className="chat-frame-content">
                  <div className="chat-iframe-container">
                    {/* Embedded FullScreenChat */}
                    <div className="embedded-chat" style={{
                      pointerEvents: isDemoActive ? 'auto' : 'none',
                      opacity: isDemoActive ? 1 : 0.8
                    }}>
                      <FullScreenChat
                        isOpen={true}
                        onClose={() => {}}
                        initialQuery="Tell me about healthy nutrition choices"
                        initialResponse="I'm here to help you make informed health decisions! Ask me about nutrition, food analysis, exercise, or any health-related questions you have."
                      />
                    </div>
                    
                    {/* Clickable overlay with chat icon - only show when demo is not active */}
                    {!isDemoActive && (
                      <div className="chat-overlay" onClick={() => setIsDemoActive(true)}>
                        <div className="overlay-content">
                          <div className="chat-icon">💬</div>
                          <div className="overlay-text">Click to Demo</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Demo control - show when active */}
                    {isDemoActive && (
                      <div className="demo-controls">
                        <button 
                          className="demo-close-btn" 
                          onClick={() => setIsDemoActive(false)}
                          title="Close Demo"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div> {/* End chat-frame-content */}
              </div> {/* End chat-frame-container */}
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
              WIHY.ai combines cutting-edge AI, real-time scanning technology, and comprehensive health analytics 
              to create the world's most advanced nutrition intelligence platform.
            </p>
          </div>

          <div className="platform-grid">
            <div className="platform-card primary">
              <div className="card-icon">�</div>
              <h3 className="card-title">Advanced AI Engine</h3>
              <p className="card-description">
                Proprietary health-focused LLM trained on nutrition science, medical research, and real-world dietary data. 
                Provides contextual, personalized responses backed by evidence.
              </p>
              <div className="card-metrics">
                <span className="metric">99.7% Accuracy</span>
                <span className="metric">2.1M+ Data Points</span>
              </div>
            </div>

            <div className="platform-card">
              <div className="card-icon">📱</div>
              <h3 className="card-title">Universal Scanning</h3>
              <p className="card-description">
                Real-time barcode scanning, image recognition, and ingredient analysis. 
                Instantly decode any food product or meal with comprehensive nutritional breakdown.
              </p>
              <div className="card-metrics">
                <span className="metric">500K+ Products</span>
                <span className="metric">0.3s Scan Time</span>
              </div>
            </div>

            <div className="platform-card">
              <div className="card-icon">📊</div>
              <h3 className="card-title">Predictive Analytics</h3>
              <p className="card-description">
                Personal health dashboards with predictive modeling, trend analysis, and 
                actionable insights based on individual dietary patterns and health goals.
              </p>
              <div className="card-metrics">
                <span className="metric">15+ Health Metrics</span>
                <span className="metric">Real-time Updates</span>
              </div>
            </div>

            <div className="platform-card">
              <div className="card-icon">�</div>
              <h3 className="card-title">Research Integration</h3>
              <p className="card-description">
                Continuous integration with latest nutrition research, clinical studies, and 
                health guidelines from leading medical institutions worldwide.
              </p>
              <div className="card-metrics">
                <span className="metric">10K+ Studies</span>
                <span className="metric">Daily Updates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="tech-section">
        <div className="section-container">
          <div className="tech-content">
            <div className="tech-left">
              <h2 className="tech-title">Built for Scale & Intelligence</h2>
              <div className="tech-features">
                <div className="tech-feature">
                  <div className="tech-icon">⚡</div>
                  <div className="tech-info">
                    <h4>Lightning Fast Processing</h4>
                    <p>Cloud-native architecture processing 10K+ queries per second with sub-300ms response times</p>
                  </div>
                </div>
                
                <div className="tech-feature">
                  <div className="tech-icon">�</div>
                  <div className="tech-info">
                    <h4>Enterprise Security</h4>
                    <p>SOC 2 compliant with end-to-end encryption, HIPAA ready for healthcare integrations</p>
                  </div>
                </div>
                
                <div className="tech-feature">
                  <div className="tech-icon">🌐</div>
                  <div className="tech-info">
                    <h4>Global Reach</h4>
                    <p>Multi-language support, regional nutrition databases, and culturally aware recommendations</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="tech-right">
              <div className="tech-stack">
                <div className="stack-category">
                  <h4>AI & ML</h4>
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
                    <span>Cloud Native</span>
                    <span>Auto-scaling</span>
                    <span>Edge Computing</span>
                    <span>Real-time APIs</span>
                  </div>
                </div>
                
                <div className="stack-category">
                  <h4>Data</h4>
                  <div className="stack-items">
                    <span>Nutrition DB</span>
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

      {/* Market Opportunity */}
      <section id="market" className="market-section">
        <div className="section-container">
          <div className="market-header">
            <h2 className="section-title">Massive Market Opportunity</h2>
            <p className="section-subtitle">
              The convergence of health awareness, AI advancement, and digital transformation creates 
              an unprecedented opportunity in the $4.2T global wellness market.
            </p>
          </div>

          <div className="market-stats">
            <div className="market-stat">
              <div className="stat-large">$4.2T</div>
              <div className="stat-desc">Global Wellness Market</div>
              <div className="stat-growth">+7.8% CAGR</div>
            </div>
            <div className="market-stat">
              <div className="stat-large">$127B</div>
              <div className="stat-desc">Digital Health Market</div>
              <div className="stat-growth">+25% CAGR</div>
            </div>
            <div className="market-stat">
              <div className="stat-large">$2.1B</div>
              <div className="stat-desc">AI Nutrition Market</div>
              <div className="stat-growth">+42% CAGR</div>
            </div>
          </div>

          <div className="market-trends">
            <div className="trend-item">
              <div className="trend-number">89%</div>
              <div className="trend-text">of consumers want personalized nutrition advice</div>
            </div>
            <div className="trend-item">
              <div className="trend-number">73%</div>
              <div className="trend-text">struggle to understand food labels</div>
            </div>
            <div className="trend-item">
              <div className="trend-number">65%</div>
              <div className="trend-text">use mobile apps for health decisions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section id="founder" className="leadership-section">
        <div className="section-container">
          <div className="leadership-header">
            <h2 className="section-title">Visionary Leadership</h2>
            <p className="section-subtitle">
              Led by experienced entrepreneurs and health technology experts with proven track records 
              in scaling consumer health platforms.
            </p>
          </div>

          <div className="founder-spotlight">
            <div className="founder-image">
              <div className="founder-photo">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80" 
                     alt="Kortney O. Lee, Founder & CEO" 
                     className="founder-photo-img" />
              </div>
            </div>
            
            <div className="founder-details">
              <h3 className="founder-name">Kortney O. Lee</h3>
              <div className="founder-title">Founder & CEO</div>
              
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
                  Systems & Operations Expert • Community Health Advocate
                </div>
              </div>

              <div className="founder-vision">
                <h4>Mission-Driven Vision</h4>
                <p>
                  "WIHY.ai emerged from a fundamental question I encountered repeatedly in real kitchens, 
                  classrooms, and communities: 'What is healthy, really, and why is it so hard to achieve 
                  every day?' We're building the definitive answer to that question."
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
                Join us in revolutionizing how the world understands health and nutrition. 
                WIHY.ai is positioned to capture significant market share in the rapidly growing 
                health technology sector.
              </p>

              <div className="investment-highlights">
                <div className="highlight">
                  <div className="highlight-icon">🎯</div>
                  <div className="highlight-content">
                    <h4>Series Seed Round</h4>
                    <p>Scaling platform, expanding team, accelerating growth</p>
                  </div>
                </div>
                
                <div className="highlight">
                  <div className="highlight-icon">🚀</div>
                  <div className="highlight-content">
                    <h4>Proven Traction</h4>
                    <p>Growing user base, strong engagement metrics, positive feedback</p>
                  </div>
                </div>
                
                <div className="highlight">
                  <div className="highlight-icon">🌟</div>
                  <div className="highlight-content">
                    <h4>Scalable Technology</h4>
                    <p>Cloud-native platform ready for global expansion</p>
                  </div>
                </div>
              </div>

              <div className="investment-cta">
                <a href="mailto:investors@wihy.ai" className="btn-investment">
                  Request Investment Deck
                </a>
                <a href="mailto:support@wihy.ai" className="btn-contact">
                  Schedule Meeting
                </a>
              </div>
            </div>

            <div className="investment-right">
              <div className="investment-metrics">
                <h4>Key Metrics</h4>
                
                <div className="metric-item">
                  <div className="metric-label">User Growth</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{width: '78%'}}></div>
                  </div>
                  <div className="metric-value">+78% MoM</div>
                </div>
                
                <div className="metric-item">
                  <div className="metric-label">User Engagement</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{width: '92%'}}></div>
                  </div>
                  <div className="metric-value">92% Active</div>
                </div>
                
                <div className="metric-item">
                  <div className="metric-label">Platform Accuracy</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{width: '97%'}}></div>
                  </div>
                  <div className="metric-value">97.3%</div>
                </div>
                
                <div className="metric-item">
                  <div className="metric-label">Market Penetration</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{width: '15%'}}></div>
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
              © {currentYear} WIHY.ai. All rights reserved. This presentation contains forward-looking statements. 
              For education and information only. Not a substitute for professional medical advice.
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

      {/* Embedded Chat Component */}
      <FullScreenChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialQuery="Tell me about healthy nutrition choices"
        initialResponse="I'm here to help you make informed health decisions! Ask me about nutrition, food analysis, exercise, or any health-related questions you have."
      />
    </div>
  );
};

export default AboutPage;