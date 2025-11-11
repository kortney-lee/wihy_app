import React from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardNavigationProps {
  currentPath?: string;
  className?: string;
}

const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
  currentPath = '',
  className = ''
}) => {
  const navigate = useNavigate();

  const navigationItems = [
    {
      path: '/',
      label: 'Health Search',
      icon: '🔍',
      description: 'Search for health information and nutrition data'
    },
    {
      path: '/health-dashboard',
      label: 'Health Dashboard',
      icon: '📊',
      description: 'Comprehensive view of all your health metrics'
    },
    {
      path: '/test',
      label: 'Chart Tests',
      icon: '🧪',
      description: 'Individual chart testing and development'
    }
  ];

  return (
    <nav className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h3>
      <div className="space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3 ${
              currentPath === item.path
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <div>
              <div className="font-medium text-gray-900">{item.label}</div>
              <div className="text-sm text-gray-600 mt-1">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">✨ New Feature</h4>
        <p className="text-sm text-blue-800">
          The Health Dashboard now includes ALL available charts organized by category and priority!
        </p>
      </div>
    </nav>
  );
};

export default DashboardNavigation;