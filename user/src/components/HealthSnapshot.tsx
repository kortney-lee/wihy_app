import React from 'react';
import MetricCard from './MetricCard';

const Icon = {
  Scale: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 3"/>
    </svg>
  ),
  Activity: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h4l2-7 4 14 2-7h4"/>
    </svg>
  ),
  Navigation: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="3 11 21 3 13 21 11 13 3 11"/>
    </svg>
  ),
  Moon: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Droplet: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.7C12 2.7 5 10 5 14a7 7 0 0 0 14 0c0-4-7-11.3-7-11.3z"/>
    </svg>
  )
};

const HealthSnapshot: React.FC = () => {
  return (
    <section className="snapshot-section">
      <h2 className="snapshot-heading">Your Health Snapshot</h2>
      
      <div className="snapshot-grid">
        <MetricCard
          title="Current Weight"
          value="68.5"
          unit="kg"
          goal="Goal: 65 kg"
          icon={<Icon.Scale />}
          iconColor="icon--blue"
          progress={85}
        />
        
        <MetricCard
          title="Calories"
          value="1,850"
          unit="kcal"
          goal="Burned: 2,100 kcal"
          icon={<Icon.Activity />}
          iconColor="icon--green"
          progress={88}
        />
        
        <MetricCard
          title="Steps Today"
          value="8,742"
          goal="Goal: 10,000"
          icon={<Icon.Navigation />}
          iconColor="icon--purple"
          progress={87}
        />
        
        <MetricCard
          title="Sleep Last Night"
          value="7.2"
          unit="hrs"
          goal="Quality: 82%"
          icon={<Icon.Moon />}
          iconColor="icon--indigo"
          progress={90}
        />
        
        <MetricCard
          title="Hydration Today"
          value="1.8"
          unit="L"
          goal="Goal: 2.5 L"
          icon={<Icon.Droplet />}
          iconColor="icon--cyan"
          progress={72}
        />
      </div>
    </section>
  );
};

export default HealthSnapshot;