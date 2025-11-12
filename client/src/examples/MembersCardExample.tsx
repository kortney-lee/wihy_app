import React from 'react';
import MembersCard, { MemberCardType } from '../components/charts/individual/MembersCard';

/**
 * Example usage of MembersCard component
 * Shows how to display different member badge types
 */
const MembersCardExample: React.FC = () => {
  // Example member data
  const memberExamples: Array<{
    memberCardType: MemberCardType;
    memberName: string;
  }> = [
    { memberCardType: 'bronze', memberName: 'Sarah Johnson' },
    { memberCardType: 'silver', memberName: 'Mike Chen' },
    { memberCardType: 'gold', memberName: 'Emma Williams' },
    { memberCardType: 'platinum', memberName: 'David Rodriguez' },
    { memberCardType: 'green', memberName: 'Alex Thompson' }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Members Card Examples</h1>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginTop: '20px'
      }}>
        {memberExamples.map((member, index) => (
          <MembersCard
            key={index}
            memberCardType={member.memberCardType}
            memberName={member.memberName}
            hasAnyAwards={true}
          />
        ))}
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>Usage</h2>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '20px', 
          borderRadius: '8px',
          overflow: 'auto'
        }}>
{`// Basic usage - flexible for awards and membership
<MembersCard 
  memberCardType="gold"
  memberName="John Doe"
  hasAnyAwards={true}
/>

// Available member card types:
- bronze: Bronze Member (Health Explorer)
- silver: Silver Member (Health Enthusiast)  
- gold: Gold Member (Health Champion)
- platinum: Platinum Member (Health Elite)
- green: Green Member (Eco Health Warrior)

// Badge images are loaded from:
/assets/WihyBadgesBronze_1.png
/assets/WihyBadgesSilver_2.png
/assets/WihyBadgesGold_3.png
/assets/WihyBadgesPlatinum__4.png
/assets/WihyBadgesGreen_5.png

// Now supports future awards expansion with Award interface`}
        </pre>
      </div>
    </div>
  );
};

export default MembersCardExample;