/**
 * Reusable Button Components - Following established design patterns
 * Uses existing button.css classes and design system variables
 */

import React from 'react';

// Standard button interface
interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'analyze' | 'feeling-healthy';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  href,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  style = {}
}) => {
  // Build class names using existing CSS classes
  const baseClasses = ['search-button'];
  
  // Add variant classes
  switch (variant) {
    case 'analyze':
      baseClasses.push('analyze-btn');
      break;
    case 'feeling-healthy':
      baseClasses.push('feeling-healthy-btn');
      break;
    case 'secondary':
      baseClasses.push('btn-secondary');
      break;
    default:
      baseClasses.push('btn-primary');
  }

  // Add size classes
  switch (size) {
    case 'large':
      baseClasses.push('btn-large');
      break;
    case 'small':
      baseClasses.push('btn-small');
      break;
  }

  const finalClassName = `${baseClasses.join(' ')} ${className}`.trim();

  const buttonProps = {
    type,
    disabled: disabled || loading,
    className: finalClassName,
    style,
    onClick
  };

  if (href) {
    return (
      <a href={href} className={finalClassName} style={style}>
        {loading ? 'Loading...' : children}
      </a>
    );
  }

  return (
    <button {...buttonProps}>
      {loading ? 'Loading...' : children}
    </button>
  );
};

// CTA Button - styled for call-to-action sections
interface CTAButtonProps extends ButtonProps {
  primary?: boolean;
}

// Unified CTA button styling function - controls all styling in one place
const getCTAStyles = () => {
  const wrapperStyle: React.CSSProperties = {
    display: 'inline-block',
    flexShrink: 0,
    width: 'auto',
    border: '2px solid transparent',
    borderRadius: '35px',
    background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
    backgroundSize: '100% 100%, 200% 100%',
    animation: 'wiH-border-sweep 2.2s linear infinite'
  };

  const buttonStyle: React.CSSProperties = {
    background: '#ffffff',
    backgroundColor: '#ffffff',
    backgroundImage: 'none',
    border: 'none',
    borderRadius: '33px',
    padding: '16px 50px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#000000',
    boxShadow: 'none',
    textShadow: 'none',
    outline: 'none',
    transform: 'none',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
    textDecoration: 'none',
    minWidth: 'fit-content',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    appearance: 'none' as const
  };

  const cssStyles = `
    @keyframes wiH-border-sweep {
      0% { background-position: 0% 0%, 0% 0%; }
      100% { background-position: 0% 0%, 200% 0%; }
    }
    
    /* Universal CTA button styling - overrides everything */
    .cta-button-unified,
    .cta-button-unified:link,
    .cta-button-unified:visited,
    .cta-button-unified:hover,
    .cta-button-unified:active,
    .cta-button-unified:focus {
      background: #ffffff !important;
      background-color: #ffffff !important;
      background-image: none !important;
      color: #000000 !important;
      text-decoration: none !important;
      border: none !important;
      border-radius: 33px !important;
      outline: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
  `;

  return { wrapperStyle, buttonStyle, cssStyles };
};

export const CTAButton: React.FC<CTAButtonProps> = ({
  children,
  primary = true,
  className = '',
  style = {},
  href,
  onClick,
  disabled = false,
  ...props
}) => {
  if (primary) {
    const { wrapperStyle, buttonStyle, cssStyles } = getCTAStyles();

    if (href) {
      return (
        <>
          <style>{cssStyles}</style>
          <div style={wrapperStyle}>
            <a 
              href={href}
              className={`cta-button-unified ${className}`}
              style={{ ...buttonStyle, ...style }}
            >
              {children}
            </a>
          </div>
        </>
      );
    }

    return (
      <>
        <style>{cssStyles}</style>
        <div style={wrapperStyle}>
          <button
            className={`cta-button-unified ${className}`}
            style={{ ...buttonStyle, ...style }}
            onClick={onClick}
            disabled={disabled}
            type="button"
            {...props}
          >
            {children}
          </button>
        </div>
      </>
    );
  }

  // For non-primary buttons, use the regular Button component
  return (
    <Button
      {...props}
      href={href}
      onClick={onClick}
      disabled={disabled}
      className={`search-btn ${className}`}
      style={style}
    >
      {children}
    </Button>
  );
};

// Icon Button - for header-style icon buttons
interface IconButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  onClick,
  title,
  disabled = false,
  className = '',
  style = {}
}) => {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
};

// Navigation Link Button - for navigation sections
interface NavLinkProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export const NavLink: React.FC<NavLinkProps> = ({
  children,
  href,
  onClick,
  active = false,
  className = ''
}) => {
  const linkStyle: React.CSSProperties = {
    color: active ? 'var(--vh-accent)' : 'var(--vh-ink)',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color 0.2s ease',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    display: 'inline-block'
  };

  if (href) {
    return (
      <a
        href={href}
        className={`nav-link ${active ? 'active' : ''} ${className}`}
        style={linkStyle}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={`nav-link ${active ? 'active' : ''} ${className}`}
      style={{
        ...linkStyle,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default {
  Button,
  CTAButton,
  IconButton,
  NavLink
};