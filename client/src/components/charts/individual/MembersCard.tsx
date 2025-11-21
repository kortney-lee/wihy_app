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

interface Award {
  type: 'membership' | 'achievement' | 'milestone' | 'special';
  id: string;
  title: string;
  image: string;
  color: string;
  dateEarned?: string;
  description?: string;
}

interface MembersCardProps {
  memberCardType?: MemberCardType;
  memberName?: string;
  awards?: Award[];
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
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
  memberCardType = 'bronze', // Default to bronze badge to ensure display
  memberName = 'Health Enthusiast',
  awards = [],
  onAnalyze
}) => {
  // Determine primary display (membership card or first award)
  const primaryAward = memberCardType ? {
    type: 'membership' as const,
    id: memberCardType,
    title: badgeConfig[memberCardType].title,
    image: badgeConfig[memberCardType].image,
    color: badgeConfig[memberCardType].color,
    description: badgeConfig[memberCardType].description
  } : awards[0];

  // Fallback to bronze if nothing is provided
  const displayAward = primaryAward || {
    type: 'membership' as const,
    id: 'bronze',
    title: badgeConfig.bronze.title,
    image: badgeConfig.bronze.image,
    color: badgeConfig.bronze.color,
    description: badgeConfig.bronze.description
  };

  const totalAwardsCount = (memberCardType ? 1 : 0) + awards.length;

  return (
    <CardShell title="Awards & Achievements">
      <img 
        src={displayAward.image} 
        alt={displayAward.title}
        style={{
          width: '100px',
          height: '100px',
          objectFit: 'contain'
        }}
        onError={(e) => {
          console.warn(`Failed to load award image: ${displayAward.image}`);
          e.currentTarget.style.display = 'none';
        }}
      />
      
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: displayAward.color }}>
          {displayAward.title}
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          {memberName}
        </div>
        {totalAwardsCount > 1 && (
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
            +{totalAwardsCount - 1} more award{totalAwardsCount > 2 ? 's' : ''}
          </div>
        )}
      </div>

      <div style={footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Awards: ${displayAward.title}. Total awards: ${totalAwardsCount}. Member: ${memberName}.`}
          userQuery="Show me all my awards and achievements"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default MembersCard;