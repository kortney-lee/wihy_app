import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface HistoryNavProps {
  /** optional: if your pages still want to control open/close, you can wire these in later */
}

const HistoryNav: React.FC<HistoryNavProps> = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const navigationItems = [
    { path: '/', label: 'Home', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
    { path: '/dashboard', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
    { path: '/overview', label: 'Overview', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' },
    { path: '/myprogress', label: 'My Progress', icon: 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z' },
    { path: '/intake', label: 'Intake & Consumption', icon: 'M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-9.83-3.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.13 0-.25-.11-.25-.25z' },
    { path: '/fitness', label: 'Fitness', icon: 'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z' },
    { path: '/coach', label: 'Coach Portal', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' },
    { path: '/parent', label: 'Parent Dashboard', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { path: '/research', label: 'Research', icon: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' }
  ];

  const additionalItems = [
    { path: '/about', label: 'About', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      {/* Navigation trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="settings-menu-button w-10 h-10 rounded-xl bg-gray-100/60 flex items-center justify-center text-gray-700 backdrop-blur-sm"
        aria-label="Navigation menu"
        title="Menu"
        type="button"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Navigation drawer - matches UserPreference styling */}
      {open && (
        <div className="fixed inset-0 z-[1001]">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside className="absolute left-0 top-0 h-full w-[480px] bg-white shadow-2xl flex flex-col" style={{ backgroundColor: '#f0f7ff' }}>
            {/* Drawer header */}
            <div className="px-6 py-5 border-b border-blue-200 bg-white/80 backdrop-blur-sm flex items-center justify-between">
              <div className="text-lg font-semibold text-vh-ink">Navigation</div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl hover:bg-blue-50 text-vh-muted hover:text-vh-ink transition-all duration-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Navigation content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-3">
                {/* Main navigation items */}
                {navigationItems.map((item, index) => (
                  <div key={item.path} className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className="w-full text-left px-6 py-4 bg-gradient-to-r from-white/90 to-blue-50/50 hover:from-blue-50 hover:to-blue-100/50 flex items-center justify-between transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                          <path d={item.icon} />
                        </svg>
                        <span className="font-medium text-vh-ink">{item.label}</span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-vh-muted">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Separator */}
                <div className="border-t border-blue-200/50 my-6"></div>

                {/* Additional items */}
                {additionalItems.map((item) => (
                  <div key={item.path} className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className="w-full text-left px-6 py-4 bg-gradient-to-r from-white/90 to-blue-50/50 hover:from-blue-50 hover:to-blue-100/50 flex items-center justify-between transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                          <path d={item.icon} />
                        </svg>
                        <span className="font-medium text-vh-ink">{item.label}</span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-vh-muted">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default HistoryNav;