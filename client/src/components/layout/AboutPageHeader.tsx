import React from 'react';
import { CTAButton, NavLink } from '../shared/ButtonComponents';
import { PlatformDetectionService } from '../../services/shared/platformDetectionService';

interface AboutPageHeaderProps {
  isNavOpen: boolean;
  onToggleNav: () => void;
}

const AboutPageHeader: React.FC<AboutPageHeaderProps> = ({ isNavOpen, onToggleNav }) => {
  return (
    <nav className="top-nav" style={{
      paddingTop: PlatformDetectionService.isNative() ? '48px' : undefined
    }}>
      <div className="nav-container">
        <div className="nav-brand">
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
  );
};

export default AboutPageHeader;
