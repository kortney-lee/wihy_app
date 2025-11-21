/**
 * Reusable Card Components - Now powered by Tailwind CSS
 * Demonstrates modern utility-first approach with your existing design tokens
 */

import React from 'react';

// Tailwind CSS classes for reusable card styling
export const cardClasses = {
  // Base card variants
  base: "flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-card overflow-hidden",
  elevated: "flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-card-hover overflow-hidden hover:shadow-lg transition-all duration-300",
  primary: "flex flex-col p-6 rounded-2xl bg-gradient-to-br from-white to-vh-surface-2 border border-blue-100 shadow-card-hover overflow-hidden",
  
  // Feature card variants
  feature: "flex flex-col rounded-2xl bg-white border border-gray-200 shadow-card-hover overflow-hidden min-w-[380px] h-[520px] text-center transition-all duration-300",
  featurePrimary: "flex flex-col rounded-2xl bg-gradient-to-br from-white to-vh-surface-2 border border-blue-100 shadow-card-hover overflow-hidden min-w-[380px] h-[520px] text-center relative transition-all duration-300",
  
  // Metric card
  metric: "flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-card overflow-hidden h-40 text-center transition-all duration-300 hover:shadow-card-hover",
  
  // Highlight card
  highlight: "flex flex-row items-center gap-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-card overflow-hidden h-36 transition-all duration-300 hover:shadow-card-hover",
  
  // Typography
  title: "mb-5 text-2xl font-semibold text-gray-400",
  featureTitle: "text-xl font-semibold text-vh-ink mb-4",
  featureDescription: "text-vh-muted leading-relaxed",
  metricValue: "text-4xl font-bold mb-2",
  metricLabel: "text-base text-vh-muted",
  metricGrowth: "text-sm text-vh-accent-2 font-medium",
  highlightNumber: "text-2xl font-bold min-w-[80px]",
  highlightText: "text-base text-vh-ink leading-relaxed",
  
  // Layout
  content: "flex flex-col items-center justify-center flex-1 overflow-hidden min-h-0",
  footer: "flex justify-center mt-4 flex-shrink-0",
  featureContent: "p-8 flex-1 flex flex-col",
  featureContentWithIcon: "p-6 flex-1 flex flex-col",
  featureIcon: "flex items-center justify-center text-4xl mb-8",
  featureIconComponent: "w-full h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative mb-4",
  metricsGrid: "grid grid-cols-2 gap-4 mt-auto",
  
  // Primary card accent
  primaryAccent: "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vh-accent via-blue-400 to-vh-accent-2"
};

// Legacy inline styles (kept for backward compatibility)
export const cardChrome: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: 24,
  borderRadius: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  overflow: "hidden",
};

export const titleStyle: React.CSSProperties = {
  margin: "0 0 20px 0",
  fontSize: 24,
  fontWeight: 600,
  color: "#9CA3AF",
};

export const sectionGrow: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  overflow: "hidden",
  minHeight: 0,
};

export const footerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginTop: 16,
  flexShrink: 0,
};

// Card Shell component (reusable) - Now with Tailwind support
interface CardShellProps {
  title?: string;
  children: React.ReactNode;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'elevated' | 'primary';
  useTailwind?: boolean; // Toggle between Tailwind and inline styles
}

export const CardShell: React.FC<CardShellProps> = ({
  title = "",
  children,
  height = 420,
  className = "",
  style = {},
  variant = 'default',
  useTailwind = true // Default to Tailwind for new components
}) => {
  if (useTailwind) {
    // Modern Tailwind approach
    const cardVariantClass = variant === 'elevated' ? cardClasses.elevated :
                           variant === 'primary' ? cardClasses.primary :
                           cardClasses.base;
    
    const heightStyle = height ? { height } : {};
    
    return (
      <section 
        className={`${cardVariantClass} ${className}`}
        style={{ ...heightStyle, ...style }}
      >
        {title && <h3 className={cardClasses.title}>{title}</h3>}
        <div className={cardClasses.content}>{children}</div>
      </section>
    );
  } else {
    // Legacy inline styles approach (for backward compatibility)
    const dynamicCardChrome = {
      ...cardChrome,
      ...(height && { height }),
      ...style
    };

    return (
      <section className={className} style={dynamicCardChrome}>
        {title && <h3 style={titleStyle}>{title}</h3>}
        <div style={sectionGrow}>{children}</div>
      </section>
    );
  }
};

// Feature Card component (for About page sections)
interface FeatureCardProps {
  icon?: string;
  iconComponent?: React.ReactNode;
  title: string;
  description: string;
  metrics?: Array<{ label: string; value: string }>;
  className?: string;
  isPrimary?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  iconComponent,
  title,
  description,
  metrics = [],
  className = "",
  isPrimary = false
}) => {
  const cardClass = isPrimary ? cardClasses.featurePrimary : cardClasses.feature;
  const contentClass = iconComponent ? cardClasses.featureContentWithIcon : cardClasses.featureContent;

  return (
    <div className={`${cardClass} ${className}`}>
      {isPrimary && (
        <div className={cardClasses.primaryAccent} />
      )}
      
      {iconComponent ? (
        <div className={cardClasses.featureIconComponent}>
          {iconComponent}
        </div>
      ) : icon ? (
        <div className={cardClasses.featureIcon}>
          {icon}
        </div>
      ) : null}
      
      <div className={contentClass}>
        <h3 className={cardClasses.featureTitle}>
          {title}
        </h3>
        
        <p className={`${cardClasses.featureDescription} ${metrics.length > 0 ? 'mb-6' : ''}`}>
          {description}
        </p>
        
        {metrics.length > 0 && (
          <div className={cardClasses.metricsGrid}>
            {metrics.map((metric, index) => (
              <div key={index}>
                <div className="text-2xl font-bold text-vh-accent-2">
                  {metric.value}
                </div>
                <div className="text-sm text-vh-ink">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Metric Card component (for statistics)
interface MetricCardProps {
  value: string;
  label: string;
  growth?: string;
  className?: string;
  valueColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  value,
  label,
  growth,
  className = "",
  valueColor = 'text-vh-accent'
}) => {
  // Convert CSS color to Tailwind class if it's a CSS custom property
  const valueColorClass = valueColor.startsWith('var(') ? 'text-vh-accent' : valueColor;
  
  return (
    <div className={`${cardClasses.metric} ${className}`}>
      <div className={`${cardClasses.metricValue} ${valueColorClass}`}>
        {value}
      </div>
      <div className={`${cardClasses.metricLabel} ${growth ? 'mb-1' : ''}`}>
        {label}
      </div>
      {growth && (
        <div className={cardClasses.metricGrowth}>
          {growth}
        </div>
      )}
    </div>
  );
};

// Highlight Card component (for investment/trend items)
interface HighlightCardProps {
  number: string;
  text: string;
  className?: string;
  numberColor?: string;
}

export const HighlightCard: React.FC<HighlightCardProps> = ({
  number,
  text,
  className = "",
  numberColor = 'text-vh-accent'
}) => {
  // Convert CSS color to Tailwind class if it's a CSS custom property
  const numberColorClass = numberColor.startsWith('var(') ? 'text-vh-accent' : numberColor;
  
  return (
    <div className={`${cardClasses.highlight} ${className}`}>
      <div className={`${cardClasses.highlightNumber} ${numberColorClass}`}>
        {number}
      </div>
      <div className={cardClasses.highlightText}>
        {text}
      </div>
    </div>
  );
};

export default {
  CardShell,
  FeatureCard,
  MetricCard,
  HighlightCard,
  cardChrome,
  titleStyle,
  sectionGrow,
  footerRow
};