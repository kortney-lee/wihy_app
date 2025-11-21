/**
 * Card Components Demo - Showcases the new Tailwind-powered card components
 * Demonstrates how the converted cards look and behave with Tailwind CSS
 */

import React from 'react';
import { 
  CardShell, 
  FeatureCard, 
  MetricCard, 
  HighlightCard, 
  cardClasses 
} from './CardComponents';

const CardDemo: React.FC = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-vh-ink mb-4">
            🎨 Card Components - Tailwind Edition
          </h1>
          <p className="text-vh-muted text-lg max-w-2xl mx-auto">
            Your card components have been converted to use Tailwind CSS while maintaining 
            all the original functionality and design aesthetic.
          </p>
        </div>

        {/* CardShell Examples */}
        <section>
          <h2 className="text-2xl font-semibold text-vh-ink mb-6">CardShell Components</h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            <CardShell title="Default Card" variant="default" useTailwind={true}>
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-vh-muted">
                  Clean, minimal card design with your established styling patterns.
                </p>
              </div>
            </CardShell>

            <CardShell title="Elevated Card" variant="elevated" useTailwind={true}>
              <div className="text-center">
                <div className="text-6xl mb-4">⭐</div>
                <p className="text-vh-muted">
                  Enhanced shadow with smooth hover transitions for interactive elements.
                </p>
              </div>
            </CardShell>

            <CardShell title="Primary Card" variant="primary" useTailwind={true}>
              <div className="text-center">
                <div className="text-6xl mb-4">🚀</div>
                <p className="text-vh-muted">
                  Gradient background for highlighting important content and features.
                </p>
              </div>
            </CardShell>
          </div>
        </section>

        {/* FeatureCard Examples */}
        <section>
          <h2 className="text-2xl font-semibold text-vh-ink mb-6">Feature Cards</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            
            <FeatureCard
              icon="🏥"
              title="Health Monitoring"
              description="Track your vital signs, medication schedules, and health metrics with our comprehensive monitoring system."
              metrics={[
                { label: "Active Users", value: "10K+" },
                { label: "Accuracy", value: "99.5%" }
              ]}
            />

            <FeatureCard
              icon="📱"
              title="Mobile App"
              description="Access your health data anywhere with our responsive mobile application designed for healthcare professionals."
              isPrimary={true}
              metrics={[
                { label: "Downloads", value: "50K+" },
                { label: "Rating", value: "4.9★" }
              ]}
            />

            <FeatureCard
              icon="🔒"
              title="Secure & Private"
              description="Your health data is protected with enterprise-grade security and full HIPAA compliance standards."
              metrics={[
                { label: "Encryption", value: "AES-256" },
                { label: "Compliance", value: "HIPAA" }
              ]}
            />
          </div>
        </section>

        {/* MetricCard Examples */}
        <section>
          <h2 className="text-2xl font-semibold text-vh-ink mb-6">Metric Cards</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <MetricCard
              value="1,247"
              label="Total Patients"
              growth="+12% this month"
            />

            <MetricCard
              value="94.2%"
              label="Satisfaction Rate"
              growth="+2.1% from last quarter"
              valueColor="text-vh-accent-2"
            />

            <MetricCard
              value="$2.4M"
              label="Cost Savings"
              growth="+15% YoY"
              valueColor="text-green-600"
            />

            <MetricCard
              value="24/7"
              label="Monitoring"
              valueColor="text-blue-600"
            />
          </div>
        </section>

        {/* HighlightCard Examples */}
        <section>
          <h2 className="text-2xl font-semibold text-vh-ink mb-6">Highlight Cards</h2>
          <div className="grid md:grid-cols-2 gap-4">
            
            <HighlightCard
              number="01"
              text="Real-time health monitoring with instant alerts for critical changes in patient vitals."
            />

            <HighlightCard
              number="02"
              text="AI-powered analytics that help predict health trends and prevent complications."
              numberColor="text-vh-accent-2"
            />

            <HighlightCard
              number="03"
              text="Seamless integration with existing hospital systems and electronic health records."
              numberColor="text-purple-600"
            />

            <HighlightCard
              number="04"
              text="Comprehensive reporting tools for healthcare administrators and medical teams."
              numberColor="text-orange-600"
            />
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-white rounded-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-semibold text-vh-ink mb-6">✨ Tailwind Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-vh-ink mb-3">Development Speed</h3>
              <ul className="space-y-2 text-vh-muted">
                <li>• Utility-first approach eliminates custom CSS writing</li>
                <li>• Built-in responsive design with breakpoint prefixes</li>
                <li>• Consistent spacing and sizing system</li>
                <li>• Hover, focus, and other state variants included</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-vh-ink mb-3">Maintainability</h3>
              <ul className="space-y-2 text-vh-muted">
                <li>• Your design tokens integrated into Tailwind config</li>
                <li>• Atomic classes prevent style conflicts</li>
                <li>• IntelliSense support for better developer experience</li>
                <li>• Automatic purging removes unused styles</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="bg-gradient-to-r from-vh-accent to-vh-accent-2 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-semibold mb-6">🔧 Usage Examples</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-medium mb-3">New Tailwind Approach:</h3>
              <pre className="text-sm overflow-x-auto">
{`<FeatureCard
  icon="🏥"
  title="Health Monitoring"
  description="Track vitals..."
  isPrimary={true}
  metrics={metrics}
/>`}
              </pre>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-medium mb-3">Responsive Grid Layout:</h3>
              <pre className="text-sm overflow-x-auto">
{`<div className="grid grid-cols-1 
              md:grid-cols-2 
              lg:grid-cols-3 
              gap-6">
  <FeatureCard ... />
</div>`}
              </pre>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default CardDemo;