/**
 * Reusable Button Components - Now powered by Tailwind CSS
 * Modernized with utility-first approach while preserving unique designs
 */

import React from 'react';

// Tailwind CSS classes for button styling
export const buttonClasses = {
  // Base button styles
  base: "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  
  // Size variants
  small: "px-3 py-1.5 text-xs",
  medium: "px-4 py-2 text-sm",
  large: "px-6 py-3 text-base",
  
  // Style variants
  primary: "bg-vh-accent text-white border border-vh-accent hover:bg-blue-700 focus:ring-vh-accent rounded-lg",
  secondary: "bg-white text-vh-ink border border-gray-300 hover:bg-gray-50 focus:ring-gray-500 rounded-lg",
  analyze: "bg-gradient-to-r from-vh-accent to-blue-600 text-white border-0 hover:from-blue-700 hover:to-blue-700 focus:ring-vh-accent rounded-lg shadow-lg",
  feelingHealthy: "bg-gradient-to-r from-vh-accent-2 to-green-600 text-white border-0 hover:from-green-700 hover:to-green-700 focus:ring-vh-accent-2 rounded-lg shadow-lg",
  
  // Icon button
  icon: "p-2 text-vh-muted hover:text-vh-ink hover:bg-gray-100 rounded-lg transition-all duration-200",
  
  // Navigation link
  navLink: "px-4 py-2 text-vh-ink hover:text-vh-accent font-medium transition-colors duration-200 rounded-md",
  navLinkActive: "px-4 py-2 text-vh-accent font-medium bg-blue-50 rounded-md",
  
  // Loading state
  loading: "cursor-wait opacity-75"
};

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
  // Build Tailwind classes
  const variantClass = {
    primary: buttonClasses.primary,
    secondary: buttonClasses.secondary,
    analyze: buttonClasses.analyze,
    'feeling-healthy': buttonClasses.feelingHealthy
  }[variant] || buttonClasses.primary;
  
  const sizeClass = {
    small: buttonClasses.small,
    medium: buttonClasses.medium,
    large: buttonClasses.large
  }[size] || buttonClasses.medium;
  
  const finalClassName = `
    ${buttonClasses.base}
    ${sizeClass}
    ${variantClass}
    ${loading ? buttonClasses.loading : ''}
    ${className}
  `.replace(/\s+/g, ' ').trim();

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
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : children}
      </a>
    );
  }

  return (
    <button {...buttonProps}>
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};

// CTA Button - styled for call-to-action sections
interface CTAButtonProps extends ButtonProps {
  primary?: boolean;
  target?: string;
  rel?: string;
}

// CTA Button Tailwind classes - preserves the unique animated gradient border design
const ctaClasses = {
  wrapper: "inline-block flex-shrink-0 w-auto border-2 border-transparent rounded-full relative overflow-hidden",
  button: "bg-white text-black font-semibold px-12 py-4 text-sm rounded-full transition-all duration-200 whitespace-nowrap flex items-center justify-center min-w-fit appearance-none border-0 outline-none shadow-none",
  gradientBorder: "absolute inset-0 rounded-full opacity-100"
};

// Unified CTA button styling function - now with Tailwind + custom gradient
const getCTAStyles = () => {
  // Keep the complex gradient border as inline styles since it's unique
  const wrapperStyle: React.CSSProperties = {
    background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
    backgroundSize: '100% 100%, 200% 100%',
    animation: 'wiH-border-sweep 2.2s linear infinite'
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

  return { wrapperStyle, cssStyles };
};

export const CTAButton: React.FC<CTAButtonProps> = ({
  children,
  primary = true,
  className = '',
  style = {},
  href,
  onClick,
  disabled = false,
  target,
  rel,
  ...props
}) => {
  if (primary) {
    const { wrapperStyle, cssStyles } = getCTAStyles();

    if (href) {
      return (
        <>
          <style>{cssStyles}</style>
          <div className={ctaClasses.wrapper} style={wrapperStyle}>
            <a 
              href={href}
              className={`${ctaClasses.button} cta-button-unified ${className}`}
              style={style}
              target={target}
              rel={rel}
              onClick={(e) => {
                if (onClick) {
                  onClick(e as any);
                }
              }}
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
        <div className={ctaClasses.wrapper} style={wrapperStyle}>
          <button
            className={`${ctaClasses.button} cta-button-unified ${className}`}
            style={style}
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
      variant="secondary"
      className={className}
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
      className={`${buttonClasses.icon} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
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
  const linkClass = active ? buttonClasses.navLinkActive : buttonClasses.navLink;
  const finalClassName = `${linkClass} ${className}`.trim();

  if (href) {
    return (
      <a
        href={href}
        className={`${finalClassName} no-underline inline-block`}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={`${finalClassName} bg-transparent border-0 cursor-pointer`}
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