import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AboutPageHeader from '../components/layout/AboutPageHeader';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <AboutPageHeader isNavOpen={isNavOpen} onToggleNav={() => setIsNavOpen(!isNavOpen)} />
      
      {/* Hero Section */}
      <section className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-28 pb-10 md:pb-12">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-600 uppercase mb-3">
            Legal & Terms
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 mb-3">
            Effective Date: <span className="font-medium text-slate-700">December 2, 2025</span>
          </p>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl">
            These Terms of Service govern your access to and use of the WIHY.ai website,
            platform, and related products and services. Please read them carefully.
          </p>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="border-b border-slate-200 bg-white bg-opacity-60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 mr-1">Jump to:</span>
          <a href="#section-1" className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 transition">
            1. Overview
          </a>
          <a href="#section-3" className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 transition">
            3. Health Disclaimer
          </a>
          <a href="#section-11" className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 transition">
            11. Prohibited Uses
          </a>
          <a href="#section-12" className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 transition">
            12. Limitation of Liability
          </a>
          <a href="#section-13" className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 transition">
            13. Cancellation & Refunds
          </a>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 sm:px-8 py-8">
            {/* Intro */}
            <section className="mb-10">
              <p className="text-sm text-slate-600 mb-3">
                This website, platform, and related services are operated by
                <span className="font-semibold"> WIHY.ai</span> ("WIHY.ai", "we", "us", "our").
                By accessing or using our website, apps, or services, you agree to be bound
                by these Terms of Service ("Terms").
              </p>
              <p className="text-sm text-slate-600">
                If you do not agree to these Terms, you may not use our services.
              </p>
            </section>

            {/* Section 1 */}
            <section id="section-1" className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                1. Acceptance of Terms
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                When these terms apply
              </p>
              <p className="text-sm text-slate-600 mb-2">
                By visiting our site, creating an account, or purchasing or using any
                product, subscription, or feature from WIHY.ai (the "Service"), you agree
                to be bound by these Terms, as well as any additional terms and policies
                referenced here or made available by hyperlink (including our Privacy
                Policy and any applicable Data Processing Addendum).
              </p>
              <p className="text-sm text-slate-600">
                We may update these Terms from time to time. If we do, we will post the
                updated version on this page with a new effective date. Your continued
                use of the Service following the posting of changes means you accept the
                updated Terms.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                2. Eligibility & Accounts
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                Who can use WIHY.ai
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                <li>
                  You represent that you are at least the age of majority in your state
                  or country of residence, or that you are the age of majority and have
                  given consent for any minor dependents to use the Service.
                </li>
                <li>
                  You agree to provide accurate, current, and complete account
                  information and to keep it up to date.
                </li>
                <li>
                  You are responsible for maintaining the confidentiality of your
                  password and account and for all activities that occur under your
                  account.
                </li>
              </ul>
            </section>

            {/* Section 3: Health Disclaimer */}
            <section id="section-3" className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                3. Health, Wellness, and AI Information Disclaimer
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                How to treat WIHY.ai insights
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-600 mb-1">
                  Medical Information Notice
                </p>
                <p className="text-sm text-slate-600">
                  WIHY.ai does <span className="font-semibold">not</span> provide medical care,
                  diagnosis, or treatment. All outputs, including AI-generated insights,
                  scores, and recommendations, are for informational and educational
                  purposes only and are not a substitute for professional medical advice.
                </p>
              </div>

              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                <li>
                  Always consult a qualified healthcare professional before making changes
                  to your diet, exercise, medications, or health routines.
                </li>
                <li>
                  If you believe you may be experiencing a medical emergency, call 911 or
                  your local emergency number immediately.
                </li>
                <li>
                  No doctor–patient or clinician–patient relationship is created by your
                  use of WIHY.ai.
                </li>
              </ul>
            </section>

            {/* Section 4: Service Description */}
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                4. Description of the Service
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                What WIHY.ai does
              </p>
              <p className="text-sm text-slate-600 mb-2">
                WIHY.ai is an AI-powered health information platform focused on food,
                nutrition, and related wellness data. The Service may include:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                <li>Ingredient and product analysis, including barcode and image scanning.</li>
                <li>Nutrition, research, and risk insights based on public and curated datasets.</li>
                <li>Dashboards for tracking consumption, habits, and trends over time.</li>
                <li>Educational content and tools for individuals, coaches, and organizations.</li>
              </ul>
            </section>

            {/* Section 5: Use of the Service */}
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                5. Use of the Service
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                Legal and responsible use
              </p>
              <p className="text-sm text-slate-600 mb-2">
                You agree to use the Service only for lawful purposes and in compliance
                with all applicable laws and regulations. You are responsible for any
                data, content, or information you submit or upload, including food logs,
                photos, and comments.
              </p>
              <p className="text-sm text-slate-600">
                We reserve the right to suspend or terminate access to the Service at
                our discretion if we believe your use violates these Terms or any
                applicable law.
              </p>
            </section>

            {/* Section 6: Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                6. Intellectual Property
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                Our rights and your limited license
              </p>
              <p className="text-sm text-slate-600 mb-2">
                All content and materials available through the Service, including
                software, text, graphics, logos, and AI models, are owned by or licensed
                to WIHY.ai and are protected by intellectual property laws.
              </p>
              <p className="text-sm text-slate-600">
                Subject to your compliance with these Terms, WIHY.ai grants you a
                limited, non-exclusive, non-transferable, revocable license to access and
                use the Service for your personal or authorized organizational use.
              </p>
            </section>

            {/* Section 7: User Content */}
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                7. User Content
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                What you submit to the platform
              </p>
              <p className="text-sm text-slate-600 mb-2">
                You retain ownership of any content you submit to WIHY.ai (such as
                logs, notes, or uploads), but you grant WIHY.ai a non-exclusive,
                worldwide, royalty-free license to use, store, and process that content
                for the purpose of operating, improving, and supporting the Service.
              </p>
              <p className="text-sm text-slate-600">
                We may use de-identified and aggregated data for analytics, research, and
                model improvement, but not in a way that identifies you personally.
              </p>
            </section>

            {/* Section 8: Third-Party Services */}
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                8. Third-Party Services and Links
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                When you leave WIHY.ai
              </p>
              <p className="text-sm text-slate-600">
                The Service may provide access to or integrate with third-party content,
                tools, or services. WIHY.ai is not responsible for the content, policies,
                or practices of any third-party websites or services. Your use of
                third-party resources is at your own risk and subject to their terms.
              </p>
            </section>

            {/* Section 9: Payments & Subscriptions */}
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                9. Payments and Subscriptions
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                Billing, renewals, and pricing
              </p>
              <p className="text-sm text-slate-600 mb-2">
                Certain features or services may require payment of fees. You agree to
                provide accurate billing information and authorize WIHY.ai or its
                payment processors to charge the applicable fees to your chosen payment
                method.
              </p>
              <p className="text-sm text-slate-600">
                Subscription plans may renew automatically unless canceled in accordance
                with our cancellation policy (see Section 13).
              </p>
            </section>

            {/* Section 10: Privacy */}
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                10. Privacy
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                How we handle your data
              </p>
              <p className="text-sm text-slate-600">
                Your use of the Service is also governed by our{' '}
                <button
                  onClick={() => navigate('/privacy')}
                  className="text-emerald-700 underline hover:text-emerald-800"
                >
                  Privacy Policy
                </button>, Data Processing Addendum (where applicable), and any HIPAA-aligned notices.
                These documents explain how we collect, use, and protect your data.
              </p>
            </section>

            {/* Section 11: Prohibited Uses */}
            <section id="section-11" className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                11. Prohibited Uses
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                Things you may not do
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                <li>Use the Service for any unlawful purpose.</li>
                <li>Violate any applicable laws or regulations.</li>
                <li>
                  Infringe upon or violate our intellectual property rights or the rights
                  of others.
                </li>
                <li>
                  Upload or transmit any malicious code or attempt to interfere with the
                  security or integrity of the Service.
                </li>
                <li>
                  Attempt to reverse engineer, decompile, or otherwise derive the
                  source code of our software or AI models.
                </li>
                <li>
                  Use the Service to generate or disseminate misinformation or harmful
                  content in violation of law.
                </li>
              </ul>
            </section>

            {/* Section 12: Disclaimer & Limitation */}
            <section id="section-12" className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                12. Disclaimer of Warranties & Limitation of Liability
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                What we are and aren't responsible for
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-600 mb-1">
                  Important Legal Notice
                </p>
                <p className="text-sm text-slate-600">
                  The Service is provided on an "as is" and "as available" basis,
                  without warranties of any kind, whether express or implied. WIHY.ai
                  does not guarantee that the Service will be uninterrupted, accurate,
                  secure, or error-free.
                </p>
              </div>

              <p className="text-sm text-slate-600 mb-2">
                To the maximum extent permitted by law, WIHY.ai and its affiliates,
                officers, employees, and partners shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages, or any loss of
                profits or data, arising out of or in connection with your use of the
                Service.
              </p>
              <p className="text-sm text-slate-600">
                In jurisdictions that do not allow certain limitations of liability, our
                liability shall be limited to the maximum extent permitted by law.
              </p>
            </section>

            {/* Section 13: Cancellation & Refunds */}
            <section id="section-13" className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                13. Cancellation and Refund Policy
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                Ending or changing your plan
              </p>
              <p className="text-sm text-slate-600 mb-2">
                You may request cancellation of an order or subscription by contacting us
                at <a href="mailto:kortney@wihy.ai" className="text-emerald-700 underline">kortney@wihy.ai</a>.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 mb-2">
                <li>
                  <span className="font-semibold">Products:</span> Physical or digital
                  products may typically be canceled within 24 hours of purchase, as
                  long as they have not already been shipped, delivered, or accessed.
                </li>
                <li>
                  <span className="font-semibold">Subscriptions:</span> You may cancel at
                  any time. Cancellation usually takes effect at the end of the current
                  billing period. Unless required by law or otherwise stated in a
                  promotion or separate agreement, refunds for partial billing periods
                  are not provided.
                </li>
              </ul>
              <p className="text-sm text-slate-600">
                We reserve the right to deny a cancellation or refund request if it
                conflicts with the terms of any promotion or agreement in place at the
                time of purchase.
              </p>
            </section>

            {/* Section 14: Governing Law & Disputes */}
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                14. Governing Law
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                Where disputes are handled
              </p>
              <p className="text-sm text-slate-600">
                These Terms shall be governed by and construed in accordance with the
                laws of the State of Missouri, United States, without regard to its
                conflict of laws principles. Any disputes arising out of or relating to
                these Terms or the Service will be subject to the exclusive jurisdiction
                of the state or federal courts located in Missouri, unless otherwise
                required by applicable law.
              </p>
            </section>

            {/* Section 15: Changes & Contact */}
            <section className="mb-2">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                15. Changes to These Terms & Contact
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                Staying informed
              </p>
              <p className="text-sm text-slate-600 mb-2">
                We may update these Terms from time to time. When we do, we will revise
                the "Effective Date" at the top of this page. We encourage you to review
                these Terms regularly to stay informed about your rights and
                responsibilities.
              </p>
              <p className="text-sm text-slate-600">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="text-sm text-slate-600 mt-2">
                <span className="font-semibold">WIHY.ai</span><br />
                Email:{' '}
                <a href="mailto:kortney@wihy.ai" className="text-emerald-700 underline">
                  kortney@wihy.ai
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="investor-footer">
        <div className="footer-container">
          <div className="footer-left">
            <img src="/assets/wihylogo.png" alt="WIHY" className="footer-logo-img" />
          </div>

          <div className="footer-center">
            <div className="footer-copyright">© {currentYear} WIHY. All rights reserved.</div>
            <div className="footer-disclaimer">This page is for education and information only and is not a substitute for professional medical advice.</div>
            <div className="footer-links" style={{ marginTop: '12px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/privacy')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4cbb17',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  padding: 0
                }}
              >
                Privacy Policy
              </button>
              <button
                onClick={() => navigate('/terms')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4cbb17',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  padding: 0
                }}
              >
                Terms of Service
              </button>
            </div>
          </div>

          <div className="footer-right">
            <div className="footer-contact">
              <div className="contact-title">Investor Relations</div>
              <a href="mailto:info@vowel.org">info@vowel.org</a>
              <a href="mailto:kortney@wihy.ai">kortney@wihy.ai</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
