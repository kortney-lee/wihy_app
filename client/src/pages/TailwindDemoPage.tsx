import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonDemo from '../components/ButtonDemo';
import CardDemo from '../components/shared/CardDemo';
import MacronutrientDemo from '../components/MacronutrientDemo';

const TailwindDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'buttons' | 'cards' | 'charts'>('buttons');

  const tabs = [
    { id: 'buttons' as const, label: 'Button Components', component: <ButtonDemo /> },
    { id: 'cards' as const, label: 'Card Components', component: <CardDemo /> },
    { id: 'charts' as const, label: 'Chart Components', component: <MacronutrientDemo /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="text-vh-accent hover:text-vh-accent-2 font-medium transition-colors duration-200"
              >
                ← Back to V-Health
              </button>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-vh-ink">
                  Tailwind CSS Component Demos
                </h1>
                <p className="text-vh-muted text-sm">
                  Showcasing converted components with utility-first CSS
                </p>
              </div>
            </div>
            <div className="text-sm text-vh-muted">
              {process.env.NODE_ENV === 'development' ? '🚧 Development Mode' : '✅ Production Ready'}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-vh-accent text-vh-accent'
                    : 'border-transparent text-vh-muted hover:text-vh-ink hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Demo Content */}
      <main className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm mx-4 my-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-vh-ink">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h2>
            <p className="text-vh-muted text-sm mt-1">
              {activeTab === 'buttons' && 'Interactive button components with various styles and states'}
              {activeTab === 'cards' && 'Reusable card layouts for different content types'}
              {activeTab === 'charts' && 'Data visualization components with Chart.js integration'}
            </p>
          </div>
          
          <div className="p-0">
            {tabs.find(tab => tab.id === activeTab)?.component}
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-vh-ink mb-3">🎨 Design System</h3>
              <ul className="space-y-2 text-sm text-vh-muted">
                <li>• Tailwind CSS v3.4.0</li>
                <li>• Custom design tokens</li>
                <li>• Responsive utilities</li>
                <li>• Consistent spacing</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-vh-ink mb-3">⚡ Performance</h3>
              <ul className="space-y-2 text-sm text-vh-muted">
                <li>• Tree-shaking optimized</li>
                <li>• Utility-first approach</li>
                <li>• No runtime CSS generation</li>
                <li>• Production ready builds</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-vh-ink mb-3">🔧 Architecture</h3>
              <ul className="space-y-2 text-sm text-vh-muted">
                <li>• CSS Lock System removed</li>
                <li>• PostCSS configuration</li>
                <li>• TypeScript compatible</li>
                <li>• React integration</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-vh-muted text-sm">
            <p>Tailwind CSS integration complete • V-Health UI modernized • Ready for production 🚀</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TailwindDemoPage;