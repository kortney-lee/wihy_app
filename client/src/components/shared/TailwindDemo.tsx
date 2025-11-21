/**
 * Tailwind CSS Demo Component - Shows the power of utility-first CSS
 * This demonstrates how Tailwind simplifies styling and responsive design
 */

import React from 'react';
import { cardClasses, CardShell } from './CardComponents';

interface TailwindDemoProps {
  className?: string;
}

export const TailwindDemo: React.FC<TailwindDemoProps> = ({ className = "" }) => {
  return (
    <div className={`space-y-8 p-6 ${className}`}>
      
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-vh-ink mb-2">
          🎨 Tailwind CSS Integration Demo
        </h2>
        <p className="text-vh-muted">
          Compare the old inline styles approach with modern Tailwind utilities
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Old Approach - Inline Styles */}
        <CardShell 
          title="❌ Old: Inline Styles" 
          useTailwind={false}
          className="h-auto"
        >
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-lg">
              <code className="text-red-600">
                {`style={{
  display: "flex",
  padding: 24,
  borderRadius: 16,
  background: "white",
  border: "1px solid #e5e7eb"
}}`}
              </code>
            </div>
            <div className="text-vh-muted">
              ❌ Verbose and repetitive<br/>
              ❌ No IntelliSense<br/>
              ❌ Hard to maintain<br/>
              ❌ No responsive design<br/>
            </div>
          </div>
        </CardShell>

        {/* New Approach - Tailwind */}
        <CardShell 
          title="✅ New: Tailwind Classes" 
          variant="primary"
          useTailwind={true}
          className="h-auto"
        >
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-green-50 rounded-lg">
              <code className="text-green-600">
                className="flex p-6 rounded-2xl bg-white border border-gray-200"
              </code>
            </div>
            <div className="text-vh-muted">
              ✅ Concise and readable<br/>
              ✅ Full IntelliSense support<br/>
              ✅ Design system built-in<br/>
              ✅ Responsive by default<br/>
            </div>
          </div>
        </CardShell>
      </div>

      {/* Responsive Design Demo */}
      <div className="bg-gradient-to-r from-vh-accent to-vh-accent-2 text-white p-6 rounded-2xl">
        <h3 className="text-xl font-semibold mb-4">📱 Responsive Design Made Easy</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/20 p-4 rounded-lg">
            <div className="text-lg font-medium">Mobile First</div>
            <div className="text-sm opacity-90">grid-cols-1</div>
          </div>
          <div className="bg-white/20 p-4 rounded-lg">
            <div className="text-lg font-medium">Tablet</div>
            <div className="text-sm opacity-90">sm:grid-cols-2</div>
          </div>
          <div className="bg-white/20 p-4 rounded-lg">
            <div className="text-lg font-medium">Desktop</div>
            <div className="text-sm opacity-90">lg:grid-cols-4</div>
          </div>
          <div className="bg-white/20 p-4 rounded-lg">
            <div className="text-lg font-medium">Auto-resize!</div>
            <div className="text-sm opacity-90">🎉</div>
          </div>
        </div>
      </div>

      {/* Color System Demo */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4 text-vh-ink">🎨 Your Design System in Tailwind</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-vh-accent rounded-lg mx-auto mb-2"></div>
            <div className="text-sm font-medium">vh-accent</div>
            <div className="text-xs text-vh-muted">#1a73e8</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-vh-accent-2 rounded-lg mx-auto mb-2"></div>
            <div className="text-sm font-medium">vh-accent-2</div>
            <div className="text-xs text-vh-muted">#34a853</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-vh-ink rounded-lg mx-auto mb-2"></div>
            <div className="text-sm font-medium">vh-ink</div>
            <div className="text-xs text-vh-muted">#202124</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-vh-surface border border-gray-200 rounded-lg mx-auto mb-2"></div>
            <div className="text-sm font-medium">vh-surface</div>
            <div className="text-xs text-vh-muted">#ffffff</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-vh-surface-2 rounded-lg mx-auto mb-2"></div>
            <div className="text-sm font-medium">vh-surface-2</div>
            <div className="text-xs text-vh-muted">#f8fbff</div>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4 text-vh-ink">🚀 Next Steps</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-vh-ink mb-2">Gradual Migration:</h4>
            <ul className="text-sm text-vh-muted space-y-1">
              <li>• Keep existing CSS for stability</li>
              <li>• Use Tailwind for new components</li>
              <li>• Mix both approaches as needed</li>
              <li>• Migrate one component at a time</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-vh-ink mb-2">Key Benefits:</h4>
            <ul className="text-sm text-vh-muted space-y-1">
              <li>• Faster development with utilities</li>
              <li>• Built-in responsive design</li>
              <li>• Your design tokens preserved</li>
              <li>• Smaller CSS bundle size</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailwindDemo;