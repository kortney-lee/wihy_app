import React from 'react';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

/* ================= Unified card styling ================= */

const cardChrome: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: 24,
  borderRadius: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  height: 420,
  overflow: "hidden",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 20px 0",
  fontSize: 24,
  fontWeight: 600,
  color: "#9CA3AF",
};

const sectionGrow: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  overflow: "hidden",
  minHeight: 0,
};

const footerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginTop: 16,
  flexShrink: 0,
};

/* ================= Card shell ================= */

function CardShell({
  title = "",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={cardChrome}>
      <h3 style={titleStyle}>{title}</h3>
      <div style={sectionGrow}>{children}</div>
    </section>
  );
}

/* ================= Member Card Types ================= */

export type MemberCardType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'green';

interface MembersCardProps {
  memberCardType?: MemberCardType;
  memberName?: string;
  data?: any;
}

// Badge configuration mapping
const badgeConfig = {
  bronze: {
    image: '/assets/WihyBadgesBronze_1.png',
    title: 'Bronze Member',
    description: 'Health Explorer',
    color: '#CD7F32',
    benefits: ['Basic health tracking', 'Weekly insights', 'Community access']
  },
  silver: {
    image: '/assets/WihyBadgesSilver_2.png',
    title: 'Silver Member',
    description: 'Health Enthusiast',
    color: '#C0C0C0',
    benefits: ['Advanced tracking', 'Daily insights', 'Priority support']
  },
  gold: {
    image: '/assets/WihyBadgesGold_3.png',
    title: 'Gold Member',
    description: 'Health Champion',
    color: '#FFD700',
    benefits: ['Premium features', 'Real-time analytics', '24/7 support']
  },
  platinum: {
    image: '/assets/WihyBadgesPlatinum__4.png',
    title: 'Platinum Member',
    description: 'Health Elite',
    color: '#E5E4E2',
    benefits: ['All premium features', 'Personal coach', 'Exclusive content']
  },
  green: {
    image: '/assets/WihyBadgesGreen_5.png',
    title: 'Green Member',
    description: 'Eco Health Warrior',
    color: '#50C878',
    benefits: ['Eco-friendly tracking', 'Sustainability insights', 'Green rewards']
  }
};

const MembersCard: React.FC<MembersCardProps> = ({ 
  memberCardType = 'bronze', 
  memberName = 'Health Enthusiast',
  data 
}) => {
  const badge = badgeConfig[memberCardType];

  const badgeImageStyle: React.CSSProperties = {
    width: '180px',
    height: '180px',
    objectFit: 'contain',
    marginBottom: '16px',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  };

  const memberTitleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    color: badge.color,
    margin: '0 0 8px 0',
    textAlign: 'center',
  };

  const memberDescriptionStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 16px 0',
    textAlign: 'center',
  };

  const memberNameStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 500,
    color: '#374151',
    margin: '0 0 12px 0',
    textAlign: 'center',
  };

  const benefitsStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 1.4,
  };

  return (
    <CardShell title="Membership Status">
      <img 
        src={badge.image} 
        alt={badge.title}
        style={badgeImageStyle}
        onError={(e) => {
          console.warn(`Failed to load badge image: ${badge.image}`);
          // Fallback to a placeholder or hide the image
          e.currentTarget.style.display = 'none';
        }}
      />
      
      <div style={memberNameStyle}>{memberName}</div>
      <div style={memberTitleStyle}>{badge.title}</div>
      <div style={memberDescriptionStyle}>{badge.description}</div>
      
      <div style={benefitsStyle}>
        {badge.benefits.join(' • ')}
      </div>

      <div style={footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Member Status: ${badge.title} (${badge.description}). Member: ${memberName}. Benefits: ${badge.benefits.join(', ')}.`}
          userQuery="Tell me more about my membership benefits and how to make the most of my health tracking journey"
        />
      </div>
    </CardShell>
  );
};

export default MembersCard;