import React from 'react';
import { Button, CTAButton, IconButton, NavLink } from './shared/ButtonComponents';

const ButtonDemo: React.FC = () => {
  const handleClick = () => {
    console.log('Button clicked!');
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-vh-ink mb-8">Button Components Demo</h1>
      
      {/* Regular Buttons */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-vh-ink mb-6">Regular Buttons</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <Button variant="primary" onClick={handleClick}>
            Primary Button
          </Button>
          <Button variant="secondary" onClick={handleClick}>
            Secondary Button
          </Button>
          <Button variant="analyze" onClick={handleClick}>
            Analyze Button
          </Button>
          <Button variant="feeling-healthy" onClick={handleClick}>
            Feeling Healthy
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <Button variant="primary" size="small" onClick={handleClick}>
            Small Primary
          </Button>
          <Button variant="secondary" size="large" onClick={handleClick}>
            Large Secondary
          </Button>
          <Button variant="analyze" disabled onClick={handleClick}>
            Disabled Button
          </Button>
        </div>
      </section>

      {/* CTA Buttons */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-vh-ink mb-6">CTA Buttons (Animated Gradient)</h2>
        <div className="flex flex-wrap gap-6 mb-6">
          <CTAButton primary onClick={handleClick}>
            Get Started Now
          </CTAButton>
          <CTAButton primary href="/signup">
            Sign Up Today
          </CTAButton>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <CTAButton onClick={handleClick}>
            Secondary CTA
          </CTAButton>
          <CTAButton disabled onClick={handleClick}>
            Disabled CTA
          </CTAButton>
        </div>
      </section>

      {/* Icon Buttons */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-vh-ink mb-6">Icon Buttons</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <IconButton 
            title="Copy to clipboard"
            onClick={handleClick}
          >
            📋 Copy
          </IconButton>
          <IconButton 
            title="Refresh data"
            onClick={handleClick}
          >
            🔄 Refresh
          </IconButton>
          <IconButton 
            title="Open settings"
            onClick={handleClick}
          >
            ⚙️ Settings
          </IconButton>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <IconButton 
            title="Save changes"
            onClick={handleClick}
          >
            💾 Save
          </IconButton>
          <IconButton 
            title="Delete item"
            onClick={handleClick}
          >
            🗑️ Delete
          </IconButton>
          <IconButton 
            title="Disabled action"
            disabled
            onClick={handleClick}
          >
            🚫 Disabled
          </IconButton>
        </div>
      </section>

      {/* Navigation Links */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-vh-ink mb-6">Navigation Links</h2>
        <div className="flex flex-wrap gap-6 mb-6">
          <NavLink href="/dashboard" active>
            Dashboard
          </NavLink>
          <NavLink href="/analytics">
            Analytics
          </NavLink>
          <NavLink href="/reports">
            Reports
          </NavLink>
          <NavLink onClick={() => console.log('Settings clicked')}>
            Settings (Button)
          </NavLink>
        </div>
        
        <div className="flex flex-col gap-2 max-w-xs">
          <NavLink href="/profile">
            👤 My Profile
          </NavLink>
          <NavLink href="/notifications">
            🔔 Notifications
          </NavLink>
          <NavLink href="/help">
            ❓ Help Center
          </NavLink>
        </div>
      </section>

      {/* Custom Styled Examples */}
      <section>
        <h2 className="text-2xl font-semibold text-vh-ink mb-6">Custom Styling Examples</h2>
        <div className="flex flex-wrap gap-4">
          <Button 
            variant="primary" 
            className="rounded-full px-8"
            onClick={handleClick}
          >
            Rounded Button
          </Button>
          <Button 
            variant="secondary" 
            className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            onClick={handleClick}
          >
            Custom Colors
          </Button>
          <CTAButton 
            primary 
            className="text-lg px-12 py-4"
            onClick={handleClick}
          >
            Large CTA
          </CTAButton>
        </div>
      </section>
    </div>
  );
};

export default ButtonDemo;