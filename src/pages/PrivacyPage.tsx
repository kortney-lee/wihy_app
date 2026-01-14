import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AboutPageHeader from '../components/layout/AboutPageHeader';

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AboutPageHeader
        isNavOpen={isNavOpen}
        onToggleNav={() => setIsNavOpen(!isNavOpen)}
      />

      {/* Hero section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-28 pb-10 md:pb-12">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-600 uppercase mb-3">
            Legal & Privacy
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 mb-3">
            Effective Date: <span className="font-medium text-slate-700">December 2, 2025</span>
          </p>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl">
            This Privacy Policy explains how WIHY.ai collects, uses, discloses, and protects your
            information when you use our website, mobile apps, and AI-powered health and nutrition services.
          </p>
        </div>
      </section>

      {/* Quick nav */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 mr-1">Jump to:</span>
          <a href="#section-1" className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 transition">
            1. Overview
          </a>
          <a href="#section-2" className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 transition">
            2. Information We Collect
          </a>
          <a href="#section-4" className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 transition">
            4. How We Use Data
          </a>
          <a href="#section-7" className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 transition">
            7. Cookies
          </a>
          <a href="#section-10" className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 transition">
            10. Your Rights
          </a>
          <a href="#section-14" className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 transition">
            14. Contact
          </a>
        </div>
      </section>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 sm:px-8 py-8">
            {/* At-a-glance highlights */}
            <section className="grid gap-4 md:grid-cols-3 mb-10">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">We don't sell your data</h3>
                <p className="text-xs text-slate-600">
                  WIHY.ai does not sell your personal information or share it with advertisers or data brokers.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">You stay in control</h3>
                <p className="text-xs text-slate-600">
                  You can request access, correction, or deletion of your data and manage communication preferences.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">HIPAA-aligned safeguards</h3>
                <p className="text-xs text-slate-600">
                  We are not a HIPAA covered entity, but we align our security practices with HIPAA-style standards.
                </p>
              </div>
            </section>

            <div className="prose prose-slate max-w-3xl">
              <PrivacyPolicyContent />
            </div>
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
            <div className="footer-copyright">© {new Date().getFullYear()} WIHY. All rights reserved.</div>
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

const PrivacyPolicyContent: React.FC = () => (
  <>
    {/* Section 1 */}
    <section id="section-1">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        1. Overview
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        Who we are and what this policy covers
      </p>
      <p className="text-sm text-slate-600 mb-2">
        WIHY.ai ("WIHY.ai", "we", "us", "our") is an AI-powered health information platform
        focused on food, nutrition, and related wellness data. This Privacy Policy describes
        how we handle information when you:
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li>Visit our websites or landing pages.</li>
        <li>Use our web or mobile applications.</li>
        <li>Create an account, log food, upload images, or interact with our tools.</li>
        <li>Participate in programs with coaches, schools, employers, or organizations using WIHY.ai.</li>
      </ul>
      <p className="text-sm text-slate-600 mt-2">
        By using WIHY.ai, you agree to the collection and use of information in accordance with this Privacy Policy.
      </p>
    </section>

    {/* Section 2: Information We Collect */}
    <section id="section-2" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        2. Information We Collect
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        What we collect and from where
      </p>

      <h3 className="text-sm font-semibold text-slate-900 mt-4 mb-1">
        2.1 Information you provide directly
      </h3>
      <p className="text-sm text-slate-600 mb-1">
        This includes information you choose to share with us, such as:
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li>Contact details (e.g., name, email address).</li>
        <li>Account information (username, password).</li>
        <li>Profile details (e.g., age range, goals, dietary preferences).</li>
        <li>Wellness-related logs (e.g., foods eaten, movement, sleep, habits).</li>
        <li>Messages or comments you send to us or to coaches through the platform.</li>
        <li>Payment details (processed securely by third-party payment providers).</li>
      </ul>

      <h3 className="text-sm font-semibold text-slate-900 mt-4 mb-1">
        2.2 Uploaded content
      </h3>
      <p className="text-sm text-slate-600 mb-1">
        We may collect and process content you upload, including:
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li>Photos of food, barcodes, receipts, and ingredient labels.</li>
        <li>Images of pantry or grocery items.</li>
      </ul>
      <p className="text-sm text-slate-600">
        Uploaded content may include metadata (e.g., timestamps, device information) that can also be collected.
      </p>

      <h3 className="text-sm font-semibold text-slate-900 mt-4 mb-1">
        2.3 Information collected automatically
      </h3>
      <p className="text-sm text-slate-600 mb-1">
        When you use WIHY.ai, we automatically collect certain technical data, such as:
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li>IP address, browser type, and device type.</li>
        <li>Operating system and app version.</li>
        <li>Pages or screens viewed and time spent.</li>
        <li>Click, scroll, and interaction events.</li>
        <li>Error and crash logs.</li>
        <li>Cookies, local storage, and similar identifiers.</li>
      </ul>

      <h3 className="text-sm font-semibold text-slate-900 mt-4 mb-1">
        2.4 Data from public and third-party sources
      </h3>
      <p className="text-sm text-slate-600 mb-1">
        To power our insights, we integrate and process data from public or licensed databases, including:
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li>Nutrition and ingredient datasets (e.g., USDA, OpenFoodFacts).</li>
        <li>Safety and regulatory datasets (e.g., FDA or similar public sources).</li>
        <li>Scientific and medical research repositories (e.g., NIH / PubMed Central).</li>
      </ul>
      <p className="text-sm text-slate-600">
        We do not access your private medical records from hospitals, clinics, or insurers through these sources.
      </p>
    </section>

    {/* Section 3: Legal Bases / Use */}
    <section id="section-3" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        3. Legal Bases for Processing (GDPR/Similar)
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        Why we are allowed to use your data
      </p>
      <p className="text-sm text-slate-600 mb-1">
        Where applicable (e.g., in the EU/EEA, UK, or similar jurisdictions), WIHY.ai relies on one or more
        of the following legal bases to process personal data:
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li><span className="font-semibold">Consent</span>: You have given us permission to process specific data.</li>
        <li><span className="font-semibold">Contract</span>: Processing is necessary to provide the Service you requested.</li>
        <li><span className="font-semibold">Legitimate interests</span>: We process data to operate, secure, and improve the Service in ways that do not override your rights.</li>
        <li><span className="font-semibold">Legal obligation</span>: We may process data as required by law or regulation.</li>
      </ul>
    </section>

    {/* Section 4: How We Use Data */}
    <section id="section-4" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        4. How We Use Your Information
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        What we do with the data we collect
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li>Provide and operate the WIHY.ai platform and its features.</li>
        <li>Generate personalized nutrition and wellness insights and dashboards.</li>
        <li>Analyze food products, ingredients, and patterns from barcodes, images, and logs.</li>
        <li>Support coaches, schools, or organizations when you participate in their programs (if enabled).</li>
        <li>Improve our AI models, algorithms, and overall Service performance.</li>
        <li>Monitor and protect the security, integrity, and availability of the Service.</li>
        <li>Respond to support requests and communicate with you about your account.</li>
        <li>Send administrative messages, updates, and—with your consent—newsletters or product communications.</li>
        <li>Comply with legal obligations and enforce our Terms of Service.</li>
      </ul>
    </section>

    {/* Section 5: Sharing */}
    <section id="section-5" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        5. How We Share Your Information
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        When data leaves WIHY.ai
      </p>

      <h3 className="text-sm font-semibold text-slate-900 mt-3 mb-1">
        5.1 Service providers
      </h3>
      <p className="text-sm text-slate-600">
        We may share information with trusted third-party vendors who help us operate the Service, such as
        cloud hosting providers, analytics and logging services, customer support tools, communication
        services, and payment processors. These providers are contractually obligated to handle your data
        only as instructed and to protect it appropriately.
      </p>

      <h3 className="text-sm font-semibold text-slate-900 mt-3 mb-1">
        5.2 Coaches, schools, and organizations
      </h3>
      <p className="text-sm text-slate-600">
        If you join a program run by a coach, school, employer, or other organization using WIHY.ai, certain
        information and metrics may be shared with them—only as configured by the program and with your
        knowledge or consent.
      </p>

      <h3 className="text-sm font-semibold text-slate-900 mt-3 mb-1">
        5.3 Legal and safety
      </h3>
      <p className="text-sm text-slate-600">
        We may disclose information to third parties if we believe it is reasonably necessary to:
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li>Comply with applicable laws, regulations, or legal processes.</li>
        <li>Respond to lawful requests from public authorities.</li>
        <li>Protect the rights, safety, or property of WIHY.ai, our users, or others.</li>
      </ul>

      <h3 className="text-sm font-semibold text-slate-900 mt-3 mb-1">
        5.4 No sale of personal information
      </h3>
      <p className="text-sm text-slate-600">
        WIHY.ai does not sell your personal information, and we do not share it with third parties for their
        own advertising or marketing purposes.
      </p>
    </section>

    {/* Section 6: AI & Model Training */}
    <section id="section-6" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        6. AI, Analytics, and Model Improvement
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        How we use data to improve WIHY.ai
      </p>
      <p className="text-sm text-slate-600 mb-1">
        We may use anonymized, pseudonymized, or aggregated data to:
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li>Train and refine our AI models that interpret ingredients, nutrition, and patterns.</li>
        <li>Improve risk scoring, recommendations, and research matching.</li>
        <li>Monitor usage trends and platform performance.</li>
      </ul>
      <p className="text-sm text-slate-600 mt-1">
        We do not use your personally identifiable information to train public models or to build products for
        third parties that would identify you.
      </p>
    </section>

    {/* Section 7: Cookies */}
    <section id="section-7" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        7. Cookies and Similar Technologies
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        How we remember your session
      </p>
      <p className="text-sm text-slate-600 mb-1">
        We use cookies, local storage, and similar technologies to:
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li>Keep you signed in and maintain your session.</li>
        <li>Remember preferences and settings.</li>
        <li>Measure traffic and usage patterns.</li>
        <li>Improve stability and performance.</li>
      </ul>
      <p className="text-sm text-slate-600 mt-1">
        You can manage or disable cookies through your browser settings. However, some features of the Service
        may not function properly if cookies are disabled.
      </p>
    </section>

    {/* Section 8: Security */}
    <section id="section-8" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        8. Data Security
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        How we protect your information
      </p>
      <p className="text-sm text-slate-600 mb-1">
        We use technical and organizational measures designed to protect your information, including:
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li>Encryption in transit (HTTPS/TLS).</li>
        <li>Secure authentication and password hashing.</li>
        <li>Role-based access controls and least-privilege access.</li>
        <li>Monitoring, logging, and periodic security reviews.</li>
      </ul>
      <p className="text-sm text-slate-600 mt-1">
        No system can be guaranteed 100% secure, but we work to protect your information and continually
        improve our safeguards.
      </p>
    </section>

    {/* Section 9: Retention */}
    <section id="section-9" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        9. Data Retention
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        How long we keep your data
      </p>
      <p className="text-sm text-slate-600">
        We retain personal data only for as long as necessary to provide the Service, fulfill the purposes
        described in this policy, comply with legal obligations, resolve disputes, and enforce our agreements.
        You may request deletion of your data, as described below, and we will process such requests in
        accordance with applicable law.
      </p>
    </section>

    {/* Section 10: Your Rights */}
    <section id="section-10" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        10. Your Privacy Rights
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        Access, control, and choices
      </p>
      <p className="text-sm text-slate-600 mb-1">
        Depending on your location, you may have some or all of the following rights:
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li><span className="font-semibold">Access</span> – Request a copy of the personal data we hold about you.</li>
        <li><span className="font-semibold">Correction</span> – Request that we correct inaccurate or incomplete data.</li>
        <li><span className="font-semibold">Deletion</span> – Request that we delete your personal data, subject to legal obligations.</li>
        <li><span className="font-semibold">Restriction</span> – Request that we limit certain processing activities.</li>
        <li><span className="font-semibold">Portability</span> – Request to receive your data in a structured, machine-readable format.</li>
        <li><span className="font-semibold">Objection</span> – Object to certain processing, including direct marketing.</li>
        <li><span className="font-semibold">Withdraw consent</span> – Where processing is based on consent, you may withdraw it at any time.</li>
      </ul>
      <p className="text-sm text-slate-600 mt-2">
        To exercise these rights, contact us at:{' '}
        <a href="mailto:kortney@wihy.ai" className="text-emerald-700 underline">kortney@wihy.ai</a>.
        We may need to verify your identity before fulfilling your request.
      </p>
    </section>

    {/* Section 11: Children */}
    <section id="section-11" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        11. Children's Privacy
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        Users under the age of 13
      </p>
      <p className="text-sm text-slate-600">
        WIHY.ai is not directed to children under the age of 13, and we do not knowingly collect personal
        data from children under 13. If you believe that a child has provided us with personal information
        in violation of this policy, please contact us so we can take appropriate action.
      </p>
    </section>

    {/* Section 12: International Transfers */}
    <section id="section-12" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        12. International Data Transfers
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        Data moving across borders
      </p>
      <p className="text-sm text-slate-600">
        WIHY.ai is based in the United States and may process data in the U.S. and other countries. If you
        access the Service from outside the U.S., your information may be transferred to, stored, and processed
        in jurisdictions where data protection laws may differ from those in your country. Where required, we
        implement appropriate safeguards (such as standard contractual clauses) to protect personal data.
      </p>
    </section>

    {/* Section 13: Changes */}
    <section id="section-13" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        13. Changes to This Privacy Policy
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        When this policy may change
      </p>
      <p className="text-sm text-slate-600">
        We may update this Privacy Policy from time to time to reflect changes in our practices, technologies,
        legal requirements, or other factors. When we do, we will update the "Effective Date" at the top of
        this page. We encourage you to review this policy periodically to stay informed about how we protect
        your information.
      </p>
    </section>

    {/* Section 14: Contact */}
    <section id="section-14" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        14. Contact Us
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        Questions, requests, and complaints
      </p>
      <p className="text-sm text-slate-600 mb-2">
        If you have questions about this Privacy Policy or would like to exercise your privacy rights,
        please contact us at:
      </p>
      <p className="text-sm text-slate-600">
        <span className="font-semibold">WIHY.ai</span><br />
        Email:{' '}
        <a href="mailto:kortney@wihy.ai" className="text-emerald-700 underline">
          kortney@wihy.ai
        </a>
      </p>
    </section>

    {/* Section 15: Related policies */}
    <section id="section-15" className="mt-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
        15. Related Policies and Documents
      </h2>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
        Where to learn more
      </p>
      <p className="text-sm text-slate-600">
        This Privacy Policy works together with our other legal and compliance documents, including:
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li>Terms of Service.</li>
        <li>Data Processing Addendum (for organizations using WIHY.ai as a processor).</li>
        <li>HIPAA-Aligned Notice of Privacy Practices (for wellness and health-related data).</li>
      </ul>
      <p className="text-sm text-slate-600 mt-2">
        These documents may be made available on our website or provided to you as part of your organization's
        or program's onboarding.
      </p>
    </section>
  </>
);

export default PrivacyPage;
