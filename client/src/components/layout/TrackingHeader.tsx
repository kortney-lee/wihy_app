import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MultiAuthLogin from '../shared/MultiAuthLogin';

const TrackingHeader: React.FC = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <img 
                src="/assets/wihylogo.png" 
                alt="WIHY.ai" 
                className="h-8"
              />
            </div>

            {/* Login Section */}
            <div>
              <MultiAuthLogin position="top-right" />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default TrackingHeader;
