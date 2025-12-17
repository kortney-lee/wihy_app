import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/shared/Header';
import FullScreenChat from '../components/ui/FullScreenChat';
import ImageUploadModal from '../components/ui/ImageUploadModal';
import VHealthSearch from '../components/search/VHealthSearch';
import NutritionFactsDemo from '../components/demo/NutritionFactsDemo';
import PredictiveDashboard from './PredictiveDashboard';
import { FeatureCard, MetricCard, HighlightCard } from '../components/shared/CardComponents';
import { CTAButton, NavLink } from '../components/shared/ButtonComponents';
import AboutPageHeader from '../components/layout/AboutPageHeader';
import ResearchQualityGauge from '../components/charts/cards/ResearchQualityGauge';
import StudyTypeDistributionChartDemo from '../components/charts/cards/StudyTypeDistributionChart';
import PublicationTimelineChartDemo from '../components/charts/cards/PublicationTimelineChart';
import { PlatformDetectionService } from '../services/shared/platformDetectionService';
import { LinkTrackingService } from '../components/tracking/LinkTracker';
import '../styles/AboutPage.css';
import '../styles/MobileAboutPage.css';

const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showWaitlistPopup, setShowWaitlistPopup] = useState(false);
  const [hasDismissedPopup, setHasDismissedPopup] = useState(false);
  const [hasUsedDemo, setHasUsedDemo] = useState(false);
  
  // Ref to monitor the chat container specifically
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  // Handle outbound click tracking (Kickstarter, Instagram, etc.)
  const handleKickstarterClick = () => {
    // Extract tracking ID from URL if present (e.g., ?ref=partner_john)
    const params = new URLSearchParams(location.search);
    const trackingId = params.get('ref') || 'direct_website';
    const campaign = params.get('campaign') || params.get('utm_campaign') || 'about_page';
    
    const kickstarterUrl = 'https://www.kickstarter.com/projects/wihy/wihy-a-new-way-to-explore-food-knowledge-and-choices';
    
    // Track the outbound click with full attribution chain
    LinkTrackingService.trackOutboundClick(trackingId, kickstarterUrl, campaign);
  };

  useEffect(() => {
    setIsLoaded(true);
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Add Android class to body for CSS adjustments
    if (PlatformDetectionService.isNative()) {
      document.body.classList.add('platform-android');
    }
    
    return () => {
      document.body.classList.remove('platform-android');
    };
  }, []); // Only run on mount, not when location.search changes

  // Simple automation: show popup after scroll or a short delay
  useEffect(() => {
    // Only prevent if manually dismissed, not if they used the demo
    if (hasDismissedPopup && !hasUsedDemo) return;

    const onScroll = () => {
      if (window.scrollY > 400) {
        setShowWaitlistPopup(true);
      } else {
        // Hide popup when scrolled back to top (near chat demo)
        setShowWaitlistPopup(false);
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
  }, [hasDismissedPopup, hasUsedDemo]);

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
    <div className="about-page-wrapper" style={{
      paddingTop: PlatformDetectionService.isNative() ? '48px' : undefined
    }}>
      {/* Fixed Navigation Header - Outside hero section */}
      <AboutPageHeader isNavOpen={isNavOpen} onToggleNav={() => setIsNavOpen(!isNavOpen)} />

      {/* Hero Header */}
      <header className="hero-header">
        {/* Main Title Block */}
        <div className="main-title-section">
          <h1 className={`main-page-title gradient-text ${isLoaded ? 'animate-in' : ''}`}>
            The World's Smartest Health Search Engine
          </h1>
        </div>

        <div className="hero-content">
          <div className="hero-container">
            <div className="hero-left">
              <div className={`hero-badge ${isLoaded ? 'animate-in' : ''}`}>
                <span>Health Search</span>
                <span>Nutrition Intelligence</span>
                <span>Evidence Based</span>
              </div>
              
              <div className="hero-content-block">
                <h2 className="main-page-subtitle">
                  Search food, health, and nutrition. Get clear answers backed by science.
                </h2>
                <p className="main-page-tagline">
                  Ask questions. Scan food. Understand what healthy really means.
                </p>
              </div>
              
              <div className="hero-content-block">
                <div className="main-page-benefits">
                  <p>Scan food and ingredients to see what you are actually eating.</p>
                  <p>Ask health and nutrition questions and get research-backed answers.</p>
                  <p>Turn complex studies into clear guidance you can use right away.</p>
                </div>
              </div>
              
              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  WIHY.ai brings together nutrition research, government health data, and real-world food information so anyone can search, understand, and act on health information with confidence.
                </p>
              </div>

              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  WIHY.ai connects the most important pieces of health understanding:
                </p>
                
                <div className={`hero-unification-points ${isLoaded ? 'animate-in delay-2' : ''}`}>
                  <ul>
                    <li>Nutrition and medical research</li>
                    <li>Government-verified food and health data</li>
                    <li>Real-time food and ingredient analysis</li>
                    <li>Personalized health insights based on patterns</li>
                  </ul>
                  <p>into a single platform designed to support personal, institutional, and population health decisions.</p>
                </div>
              </div>

              <div className={`hero-actions ${isLoaded ? 'animate-in delay-4' : ''}`}>
                <CTAButton 
                  href="https://www.kickstarter.com/projects/wihy/wihy-a-new-way-to-explore-food-knowledge-and-choices"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleKickstarterClick}
                  primary
                >
                  Join the WIHY Beta
                </CTAButton>
              </div>
            </div> {/* End hero-left */}

            <div className="hero-right" id="chat-demo-1">
              <div className="chat-frame">
                <div 
                  ref={chatContainerRef}
                  className={`chat-frame-container ${isLoaded ? 'animate-in delay-2' : ''}`}
                >
                  <div className="chat-frame-content">
                    {/* Embedded preview of the search experience */}
                    <VHealthSearch />
                  </div>
                </div>
              </div>
            </div> {/* End hero-right */}
          </div> {/* End hero-container */}
        </div> {/* End hero-content */}
      </header>

      {/* Hero Header - Copy 1 */}
      <header className="hero-header1" style={{ background: 'white' }}>
        <div className="hero-content">
          <div className="hero-container" style={{ background: 'white' }}>
            <div className="hero-right" id="chat-demo-2">
              <div className="chat-frame">
                <div 
                  ref={chatContainerRef}
                  className={`chat-frame-container ${isLoaded ? 'animate-in delay-2' : ''}`}
                >
                  <div className="chat-frame-content">
                    {/* Embedded preview of the image upload experience */}
                    <ImageUploadModal
                      isOpen={true}
                      onClose={() => {}}
                      onAnalysisComplete={(result) => console.log('Analysis:', result)}
                      title="Scan this food"
                      subtitle="Upload a barcode, photo, ingredient list, or receipt"
                      forceMobile={true}
                    />
                  </div>
                </div>
              </div>
            </div> {/* End hero-right */}

            <div className="hero-left">
              <div className={`hero-badge ${isLoaded ? 'animate-in' : ''}`}>
                <span>Universal Scanning</span>
              </div>
              
              <div className="hero-content-block">
                <h2 className="main-page-subtitle">
                  Universal Scanning
                </h2>
                <p className="main-page-tagline">
                  Instantly understand food and ingredients using scans, photos, and receipts.
                </p>
              </div>
              
              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  Universal Scanning lets you analyze food no matter how it shows up in your life.
                  Scan a barcode, take a photo, upload ingredients, or import a receipt and WIHY breaks it down into clear, understandable insights.
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  No manual tracking. No guessing. No marketing hype.
                </p>
              </div>
              
              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  <strong>How It Works</strong>
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  WIHY automatically identifies food and ingredients using multiple inputs:
                </p>
                <div className="main-page-benefits">
                  <p>Barcode decoding to recognize packaged products</p>
                  <p>Food photography to identify meals and whole foods</p>
                  <p>Ingredient OCR to read and analyze ingredient lists</p>
                  <p>Receipt parsing to understand what you actually purchased</p>
                  <p>Global product verification to match foods against trusted databases</p>
                </div>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  You do not need to tell WIHY what to look for. It detects, verifies, and analyzes automatically.
                </p>
              </div>

              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  <strong>What You Get</strong>
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  After a scan, WIHY shows you:
                </p>
                <div className="main-page-benefits">
                  <p>What the food is made of</p>
                  <p>How processed it is</p>
                  <p>Which ingredients matter and why</p>
                  <p>How it fits into a healthier pattern</p>
                  <p>What to change or keep doing next</p>
                </div>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  Everything is explained in plain language.
                </p>
              </div>

              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  Universal Scanning turns everyday food into clear health information you can actually use.
                </p>
              </div>

              <div className={`hero-actions ${isLoaded ? 'animate-in delay-4' : ''}`}>
                <CTAButton 
                  href="https://www.kickstarter.com/projects/wihy/wihy-a-new-way-to-explore-food-knowledge-and-choices"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleKickstarterClick}
                  primary
                >
                  Join the WIHY Beta
                </CTAButton>
              </div>
            </div> {/* End hero-left */}
          </div> {/* End hero-container */}
        </div> {/* End hero-content */}
      </header>

      {/* Hero Header - Copy 2 */}
      <header className="hero-header2">
        <div className="hero-content">
          <div className="hero-container">
            <div className="hero-left">
              <div className={`hero-badge ${isLoaded ? 'animate-in' : ''}`}>
                <span>Nutrition Analysis</span>
              </div>
              
              <div className="hero-content-block">
                <h2 className="main-page-subtitle">
                  Nutrition Analysis You Can Actually Understand
                </h2>
                <p className="main-page-tagline">
                  Turn scans and photos into clear nutrition insights, not confusing numbers.
                </p>
              </div>
              
              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  After you scan food with WIHY, the system automatically analyzes what you are eating and explains it in plain language.
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  This is where scanning becomes understanding.
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  WIHY does not just list calories or macros. It interprets the food in context and shows what matters for real health.
                </p>
              </div>
              
              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  <strong>What WIHY Analyzes</strong>
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  From a single scan or image, WIHY can analyze:
                </p>
                <div className="main-page-benefits">
                  <p>Macronutrients such as carbohydrates, protein, fats, and fiber</p>
                  <p>Micronutrients including vitamins and minerals</p>
                  <p>Added sugars, sweeteners, and additives</p>
                  <p>Processing level and ingredient quality</p>
                  <p>Portion impact, not just label serving sizes</p>
                  <p>How the food fits into your overall eating pattern</p>
                </div>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  All of this happens automatically after a scan or upload.
                </p>
              </div>

              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  <strong>Clear Answers, No Guesswork</strong>
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  Instead of asking "Is this good or bad?" or "How many calories is this?" WIHY shows:
                </p>
                <div className="main-page-benefits">
                  <p>What this food contributes</p>
                  <p>What it may be missing</p>
                  <p>What to balance next</p>
                  <p>Whether it supports your goal</p>
                </div>
              </div>

              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  Nutrition analysis should guide decisions, not overwhelm them.
                </p>
              </div>

              <div className={`hero-actions ${isLoaded ? 'animate-in delay-4' : ''}`}>
                <CTAButton 
                  href="https://www.kickstarter.com/projects/wihy/wihy-a-new-way-to-explore-food-knowledge-and-choices"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleKickstarterClick}
                  primary
                >
                  Join the WIHY Beta
                </CTAButton>
              </div>
            </div> {/* End hero-left */}

            <div className="hero-right" id="chat-demo-3">
              <div className="chat-frame">
                <div 
                  ref={chatContainerRef}
                  className={`chat-frame-container ${isLoaded ? 'animate-in delay-2' : ''}`}
                >
                  <div className="chat-frame-content">
                    {/* Embedded preview of the nutrition facts experience */}
                    <NutritionFactsDemo />
                  </div>
                </div>
              </div>
            </div> {/* End hero-right */}
          </div> {/* End hero-container */}
        </div> {/* End hero-content */}
      </header>

      {/* Hero Header - Copy 3 */}
      <header className="hero-header3" style={{ background: 'white' }}>
        <div className="hero-content">
          <div className="hero-container" style={{ background: 'white' }}>
            <div className="hero-right" id="chat-demo-4">
              <div className="chat-frame">
                <div 
                  ref={chatContainerRef}
                  className={`chat-frame-container ${isLoaded ? 'animate-in delay-2' : ''}`}
                >
                  <div className="chat-frame-content">
                    {/* Embedded preview of the predictive dashboard */}
                    <PredictiveDashboard />
                  </div>
                </div>
              </div>
            </div> {/* End hero-right */}

            <div className="hero-left">
              <div className={`hero-badge ${isLoaded ? 'animate-in' : ''}`}>
                <span>Predictive Insights</span>
              </div>
              
              <div className="hero-content-block">
                <h2 className="main-page-subtitle">
                  Understand Where Your Habits Are Leading
                </h2>
                <p className="main-page-tagline">
                  See patterns in eating, activity, and behavior before they turn into outcomes.
                </p>
              </div>
              
              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  WIHY looks at patterns across your food choices, activity, and consistency to help you understand what is likely to happen next if habits stay the same.
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  This is not about judging or predicting exact outcomes. It is about recognizing direction early.
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  WIHY helps you see whether behaviors are trending toward:
                </p>
                <div className="main-page-benefits">
                  <p>Intentional choices or automatic ones</p>
                  <p>Consistency or drop-off</p>
                  <p>Progress or stagnation</p>
                </div>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  So you can adjust with awareness instead of reacting later.
                </p>
              </div>
              
              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  <strong>What WIHY Can Detect</strong>
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  Over time, WIHY can surface insights such as:
                </p>
                <div className="main-page-benefits">
                  <p>Likelihood of eating out of routine versus hunger</p>
                  <p>Patterns that suggest motivation or avoidance</p>
                  <p>Consistency in movement and workouts</p>
                  <p>Shifts toward more or less calorie-dense foods</p>
                  <p>Habits that tend to lead toward weight gain or loss</p>
                  <p>Early signs of burnout, imbalance, or disengagement</p>
                </div>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  These insights are based on patterns, not single actions.
                </p>
              </div>

              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  <strong>Why This Matters</strong>
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  Most health setbacks do not happen suddenly. They happen slowly, through small repeated behaviors.
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  WIHY helps you:
                </p>
                <div className="main-page-benefits">
                  <p>Notice changes early</p>
                  <p>Understand why habits are forming</p>
                  <p>Course-correct without extreme plans</p>
                  <p>Make decisions that feel intentional, not forced</p>
                </div>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  Awareness is the intervention.
                </p>
              </div>

              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  Predictive insights help you change direction before outcomes are locked in.
                </p>
              </div>

              <div className={`hero-actions ${isLoaded ? 'animate-in delay-4' : ''}`}>
                <CTAButton 
                  href="https://www.kickstarter.com/projects/wihy/wihy-a-new-way-to-explore-food-knowledge-and-choices"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleKickstarterClick}
                  primary
                >
                  Join the WIHY Beta
                </CTAButton>
              </div>
            </div> {/* End hero-left */}
          </div> {/* End hero-container */}
        </div> {/* End hero-content */}
      </header>

      {/* Hero Header - Copy 4 */}
      <header className="hero-header4">
        <div className="hero-content">
          <div className="hero-container">
            <div className="hero-left">
              <div className={`hero-badge ${isLoaded ? 'animate-in' : ''}`}>
                <span>Fact Check</span>
                <span>Evidence Verification</span>
              </div>
              
              <div className="hero-content-block">
                <h2 className="main-page-subtitle">
                  Verify Health Claims With Real Evidence
                </h2>
                <p className="main-page-tagline">
                  Check what is proven, what is uncertain, and what is overstated.
                </p>
              </div>
              
              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  Health information is full of claims, headlines, and advice that sound convincing but lack real evidence.
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  WIHY lets you fact check health and nutrition claims by analyzing available research and grading the quality of the evidence behind them.
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  Instead of asking "Is this true?" and getting opinions, you get clarity.
                </p>
              </div>
              
              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  <strong>How Fact Checking Works</strong>
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  When you enter a claim, WIHY:
                </p>
                <div className="main-page-benefits">
                  <p>Identifies the exact health or nutrition statement</p>
                  <p>Searches relevant research and trusted data sources</p>
                  <p>Evaluates study type, consistency, and limitations</p>
                  <p>Separates correlation from causation</p>
                  <p>Explains what the evidence actually supports</p>
                </div>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  Claims are not labeled as simply true or false. They are explained with context.
                </p>
              </div>

              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  <strong>What You See</strong>
                </p>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  For each claim, WIHY shows:
                </p>
                <div className="main-page-benefits">
                  <p>Strength of evidence</p>
                  <p>Level of certainty</p>
                  <p>What research supports</p>
                  <p>What research does not support</p>
                  <p>Where common misunderstandings come from</p>
                </div>
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  This helps you make informed decisions without hype or fear.
                </p>
              </div>

              <div className="hero-content-block">
                <p className={`hero-subtitle ${isLoaded ? 'animate-in delay-1' : ''}`}>
                  Not all health claims are equal. WIHY helps you see the difference.
                </p>
              </div>

              <div className={`hero-actions ${isLoaded ? 'animate-in delay-4' : ''}`}>
                <CTAButton 
                  href="https://www.kickstarter.com/projects/wihy/wihy-a-new-way-to-explore-food-knowledge-and-choices"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleKickstarterClick}
                  primary
                >
                  Join the WIHY Beta
                </CTAButton>
              </div>
            </div> {/* End hero-left */}

            <div className="hero-right" id="chat-demo-5">
              <div className="chat-frame">
                <div 
                  ref={chatContainerRef}
                  className={`chat-frame-container ${isLoaded ? 'animate-in delay-2' : ''}`}
                >
                  <div className="chat-frame-content">
                    {/* Embedded preview of the chat experience */}
                    <FullScreenChat
                      isOpen={true}
                      onClose={() => {}}
                      initialQuery="Verify this health claim: Green tea prevents cancer."
                      initialResponse={`I can help verify that.

I will:
- analyze available research
- explain what studies suggest
- clarify limits of the evidence
- distinguish association from prevention claims

I will also show how strong the evidence actually is.`}
                    />
                  </div>
                </div>
              </div>
            </div> {/* End hero-right */}
          </div> {/* End hero-container */}
        </div> {/* End hero-content */}
      </header>

      {/* WIHY Health Intelligence Stack Section */}
      <section id="intelligence-stack" className="section-container">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Your Health, One Connected Platform</h2>
            <p className="section-subtitle">
              WIHY brings together progress tracking, nutrition, research, fitness, and coaching so health decisions are informed, intentional, and easier to sustain.
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
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  }
                  title="My Progress"
                  description="Track how your nutrition, activity, and habits change over time. WIHY aggregates fitness and lifestyle data and explains trends clearly so you understand what is improving, what is stalling, and why."
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
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  }
                  title="Consumption"
                  description="Track meals, groceries, and planning in one place. Scan food, upload receipts, generate meals with WIHY, or work with a nutritionist or dietitian to align eating and shopping with your goals."
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
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  }
                  title="Research"
                  description="Search nutrition and health research without reading hundreds of papers. WIHY summarizes findings, explains evidence quality, and helps you understand what the science actually supports."
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
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  }
                  title="Fitness"
                  description="Generate workout plans that fit your schedule, ability, and goals or work directly with a personal trainer. WIHY supports consistency, progression, and realistic routines."
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
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  }
                  title="Coach Portal"
                  description="Designed for wellness professionals to track clients, identify engagement patterns, and improve retention. Coaches spend less time managing data and more time delivering personalized guidance."
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
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  }
                  title="Parent Portal"
                  description="Gives parents and guardians visibility into children's intake and household consumption. Understand where grocery choices are going and support healthier habits without micromanaging."
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
              WIHY is in early access. Join the beta and be among the first to experience intelligent health search.
            </p>
          </div>
          
          <div className="demo-cta">
            <CTAButton 
              primary 
              href="https://www.kickstarter.com/projects/wihy/wihy-a-new-way-to-explore-food-knowledge-and-choices"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleKickstarterClick}
            >
              Join the WIHY Beta
            </CTAButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-left">
            <img src="/assets/wihylogo.png" alt="WIHY" className="footer-logo-img" />
          </div>

          <div className="footer-center">
            <div className="footer-copyright">© {currentYear} WIHY. All rights reserved.</div>
            <div className="footer-disclaimer">This page is for education and information only and is not a substitute for professional medical advice.</div>
            <div className="footer-links" style={{ marginTop: '12px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/privacy')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4cbb17',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  padding: 0
                }}
              >
                Privacy Policy
              </button>
              <button
                onClick={() => navigate('/terms')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4cbb17',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  padding: 0
                }}
              >
                Terms of Service
              </button>
            </div>
          </div>

          <div className="footer-right">
            <div className="footer-contact">
              <div className="contact-title">Contact</div>
              <a href="mailto:info@wihy.ai">info@wihy.ai</a>
              <a href="mailto:kortney@wihy.ai">kortney@wihy.ai</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating automation popup (desktop/tablet) */}
      {showWaitlistPopup && !hasDismissedPopup && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          maxWidth: '320px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          padding: '20px',
          zIndex: 1000,
          border: '1px solid rgba(0, 0, 0, 0.08)'
        }}>
          <button
            type="button"
            onClick={handleDismissPopup}
            aria-label="Close popup"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              lineHeight: 1,
              padding: '4px 8px'
            }}
          >
            ×
          </button>
          <div style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#1a1a1a',
            marginBottom: '12px',
            paddingRight: '24px'
          }}>
            Join the WIHY Beta
          </div>
          <p style={{
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.5',
            marginBottom: '16px'
          }}>
            Get early access through our Kickstarter and be among the first to explore food, nutrition, and health insights with WIHY.
          </p>
          <CTAButton
            primary
            href="https://www.kickstarter.com/projects/wihy/wihy-a-new-way-to-explore-food-knowledge-and-choices"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleKickstarterClick}
            style={{ width: '100%' }}
          >
            Join the WIHY Beta
          </CTAButton>
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