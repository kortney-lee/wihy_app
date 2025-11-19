/**
 * Reusable Card Components - Following established design patterns
 * Used throughout the application for consistent styling
 */

import React from 'react';

// Standard card styling from existing chart components
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

// Card Shell component (reusable)
interface CardShellProps {
  title?: string;
  children: React.ReactNode;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const CardShell: React.FC<CardShellProps> = ({
  title = "",
  children,
  height = 420,
  className = "",
  style = {}
}) => {
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
};

// Feature Card component (for About page sections)
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  metrics?: Array<{ label: string; value: string }>;
  className?: string;
  isPrimary?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  metrics = [],
  className = "",
  isPrimary = false
}) => {
  const cardStyle: React.CSSProperties = {
    ...cardChrome,
    height: 320,
    textAlign: 'center',
    background: isPrimary ? 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' : 'white',
    border: isPrimary ? '1px solid #e8f0fe' : '1px solid #e5e7eb'
  };

  if (isPrimary) {
    cardStyle.position = 'relative';
  }

  return (
    <div className={className} style={cardStyle}>
      {isPrimary && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #1a73e8, #4285f4, #34a853)'
        }} />
      )}
      
      <div style={{
        fontSize: '36px',
        marginBottom: '1.5rem'
      }}>
        {icon}
      </div>
      
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--vh-ink)',
        marginBottom: '1rem'
      }}>
        {title}
      </h3>
      
      <p style={{
        color: 'var(--vh-muted)',
        lineHeight: 1.6,
        marginBottom: metrics.length > 0 ? '1.5rem' : 0
      }}>
        {description}
      </p>
      
      {metrics.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          marginTop: 'auto'
        }}>
          {metrics.map((metric, index) => (
            <div key={index}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--vh-accent)'
              }}>
                {metric.value}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--vh-muted)'
              }}>
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      )}
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
  valueColor = 'var(--vh-accent)'
}) => {
  return (
    <div className={className} style={{
      ...cardChrome,
      height: 160,
      textAlign: 'center',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        color: valueColor,
        marginBottom: '0.5rem'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '1rem',
        color: 'var(--vh-muted)',
        marginBottom: growth ? '0.25rem' : 0
      }}>
        {label}
      </div>
      {growth && (
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--vh-accent-2)',
          fontWeight: 500
        }}>
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
  numberColor = 'var(--vh-accent)'
}) => {
  return (
    <div className={className} style={{
      ...cardChrome,
      height: 140,
      flexDirection: 'row',
      alignItems: 'center',
      gap: '1rem',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: numberColor,
        minWidth: '80px'
      }}>
        {number}
      </div>
      <div style={{
        fontSize: '1rem',
        color: 'var(--vh-ink)',
        lineHeight: 1.4
      }}>
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