import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CTAButton, NavLink } from '../shared/ButtonComponents';
import { PlatformDetectionService } from '../../services/shared/platformDetectionService';

interface AboutPageHeaderProps {
  isNavOpen: boolean;
  onToggleNav: () => void;
}

const AboutPageHeader: React.FC<AboutPageHeaderProps> = ({ isNavOpen, onToggleNav }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (hash: string) => {
    // If we're not on the about page, navigate to it first
    if (location.pathname !== '/about') {
      navigate(`/about${hash}`);
    } else {
      // If we're already on about page, just scroll
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="top-nav" style={{
      paddingTop: PlatformDetectionService.isNative() ? '48px' : undefined
    }}>
      <div className="nav-container">
        <div className="nav-brand" onClick={() => navigate('/about')} style={{ cursor: 'pointer' }}>
          <img src="/assets/wihylogo.png" alt="WIHY.ai" className="nav-logo" />
        </div>

        <button
          className="mobile-nav-toggle"
          onClick={onToggleNav}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-links ${isNavOpen ? 'open' : ''}`}>
          <a href="#platform" onClick={(e) => { e.preventDefault(); handleNavClick('#platform'); }} className="nav-link">
            Platform
          </a>
          <a href="#technology" onClick={(e) => { e.preventDefault(); handleNavClick('#technology'); }} className="nav-link">
            Technology
          </a>
          <a href="/investors" onClick={(e) => { e.preventDefault(); navigate('/investors'); }} className="nav-link">
            Investment
          </a>
          <CTAButton href="/" primary>
            Launch Platform
          </CTAButton>
        </div>
      </div>
    </nav>
  );
};

export default AboutPageHeader;
