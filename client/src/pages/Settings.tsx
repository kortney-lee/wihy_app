/**
 * User Settings Page
 * Comprehensive account management for WIHY
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService, User } from '../services/authService';
import '../styles/Settings.css';

type TabKey = 'profile' | 'preferences' | 'notifications' | 'privacy' | 'integrations' | 'security' | 'billing';

const tabs: { key: TabKey; label: string; desc: string }[] = [
  { key: 'profile', label: 'Profile', desc: 'Identity and contact details' },
  { key: 'preferences', label: 'Preferences', desc: 'Units, goals, and defaults' },
  { key: 'notifications', label: 'Notifications', desc: 'Email and push settings' },
  { key: 'privacy', label: 'Privacy & Data', desc: 'Control data sharing and exports' },
  { key: 'integrations', label: 'Integrations', desc: 'Connect apps and providers' },
  { key: 'security', label: 'Security', desc: 'Password, sessions, and 2FA' },
  { key: 'billing', label: 'Billing', desc: 'Plan, invoices, and payment methods' },
];

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>((searchParams.get('tab') as TabKey) || 'profile');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferences state
  const [units, setUnits] = useState<'us' | 'metric'>('us');
  const [timezone, setTimezone] = useState('America/Chicago');
  const [goal, setGoal] = useState('fat_loss');
  const [diet, setDiet] = useState('none');

  // Notifications state
  const [weekly, setWeekly] = useState(true);
  const [coachMsgs, setCoachMsgs] = useState(true);
  const [researchUpdates, setResearchUpdates] = useState(false);

  // Privacy state
  const [shareWithCoach, setShareWithCoach] = useState(true);
  const [consent, setConsent] = useState(true);

  // Integrations state
  const [appleConnected, setAppleConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    const authState = authService.getState();
    if (!authState.isAuthenticated) {
      navigate('/');
      return;
    }
    setUser(authState.user);

    // Check for success message from OAuth callback
    if (searchParams.get('connected') === '1') {
      setMessage({ type: 'success', text: 'Integration connected successfully!' });
      // Clear the connected param
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('connected');
      setSearchParams(newParams, { replace: true });
    }

    // Subscribe to auth changes
    const unsubscribe = authService.subscribe((state) => {
      if (!state.isAuthenticated) {
        navigate('/');
      } else {
        setUser(state.user);
      }
    });

    return () => unsubscribe();
  }, [navigate, searchParams, setSearchParams]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    try {
      const result = await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result.success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Password change failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleSignOut = async () => {
    await authService.logout();
    navigate('/');
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#5f6368] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-[#dadce0]">
          <button 
            onClick={() => navigate('/')}
            className="absolute left-4 top-4 text-[#5f6368] hover:text-[#202124] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-2xl font-normal text-[#202124] text-center">Settings</h1>
          <p className="text-sm text-[#5f6368] text-center mt-1 italic">(pronounced "why") BETA — Your AI-powered nutrition assistant.</p>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-[#e6f4ea] text-[#137333]' 
              : 'bg-[#fce8e6] text-[#c5221f]'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-[#dadce0] overflow-x-auto">
          <div className="flex px-2 min-w-max">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === t.key
                    ? 'text-[#1a73e8] border-[#1a73e8]'
                    : 'text-[#5f6368] border-transparent hover:text-[#202124]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">

            {/* Profile Section */}
            {activeTab === 'profile' && (
              <div>
                <p className="text-sm text-[#5f6368] mb-4 text-center">Basic account details used across WIHY.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#202124] mb-1.5">Full name</label>
                    <input 
                      type="text" 
                      defaultValue={user.name} 
                      className="w-full px-3 py-2 border border-[#dadce0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#202124] mb-1.5">Email</label>
                    <input 
                      type="email" 
                      defaultValue={user.email} 
                      className="w-full px-3 py-2 border border-[#dadce0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#202124] mb-1.5">Phone (optional)</label>
                    <input 
                      type="tel" 
                      placeholder="(555) 555-5555" 
                      className="w-full px-3 py-2 border border-[#dadce0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#202124] mb-1.5">Username (public)</label>
                    <input 
                      type="text" 
                      placeholder="kortney" 
                      className="w-full px-3 py-2 border border-[#dadce0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button className="w-full mt-6 px-6 py-3 bg-[#202124] text-white rounded-full text-sm font-medium hover:bg-[#3c4043] transition-colors">
                  Save changes
                </button>
              </div>
            )}

            {/* Preferences Section */}
            {activeTab === 'preferences' && (
              <div>
                <p className="text-sm text-[#5f6368] mb-4 text-center">These preferences shape dashboards and coaching recommendations.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Measurement system</label>
                    <select 
                      value={units} 
                      onChange={(e) => setUnits(e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="us">US (lb, ft/in, oz)</option>
                      <option value="metric">Metric (kg, cm, g)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
                    <select 
                      value={timezone} 
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="America/Chicago">America/Chicago</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary goal</label>
                    <select 
                      value={goal} 
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="fat_loss">Fat loss</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="muscle_gain">Muscle gain</option>
                      <option value="performance">Performance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Diet preference (optional)</label>
                    <select 
                      value={diet} 
                      onChange={(e) => setDiet(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="none">No label</option>
                      <option value="whole_food">Whole food focused</option>
                      <option value="med">Mediterranean</option>
                      <option value="low_carb">Lower carb</option>
                      <option value="plant_forward">Plant-forward</option>
                    </select>
                  </div>
                </div>

                <button className="w-full mt-6 px-6 py-3 bg-[#202124] text-white rounded-full text-sm font-medium hover:bg-[#3c4043] transition-colors">
                  Save preferences
                </button>
              </div>
            )}

            {/* Notifications Section */}
            {activeTab === 'notifications' && (
              <div>
                <p className="text-sm text-[#5f6368] mb-4 text-center">Control what WIHY sends you and when.</p>

                <div className="divide-y divide-[#dadce0]">
                  <Toggle
                    checked={weekly}
                    onChange={setWeekly}
                    label="Weekly summary"
                    description="Progress, trends, NOVA score, and key insights."
                  />
                  <Toggle
                    checked={coachMsgs}
                    onChange={setCoachMsgs}
                    label="Coach messages"
                    description="Notifications from trainers, dietitians, and your care team."
                  />
                  <Toggle
                    checked={researchUpdates}
                    onChange={setResearchUpdates}
                    label="Evidence updates"
                    description="When a tracked claim changes based on new research."
                  />
                </div>

                <button className="w-full mt-6 px-6 py-3 bg-[#202124] text-white rounded-full text-sm font-medium hover:bg-[#3c4043] transition-colors">
                  Save notification settings
                </button>
              </div>
            )}

            {/* Privacy Section */}
            {activeTab === 'privacy' && (
              <>
                <div className="mb-6">
                  <p className="text-sm text-[#5f6368] mb-4 text-center">You control how your data is used and shared.</p>

                  <div className="divide-y divide-[#dadce0]">
                    <Toggle
                      checked={shareWithCoach}
                      onChange={setShareWithCoach}
                      label="Share dashboards with assigned coach"
                      description="If enabled, coaches can see your trends and logs."
                    />
                    <Toggle
                      checked={consent}
                      onChange={setConsent}
                      label="Allow personalized insights"
                      description="Use your activity + nutrition logs to tailor recommendations."
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#dadce0]">
                  <p className="text-sm text-[#5f6368] mb-4 text-center">Export or delete your account data.</p>

                  <div className="flex gap-3">
                    <button className="flex-1 px-5 py-2.5 bg-transparent text-[#1a73e8] border border-[#dadce0] rounded-full text-sm font-medium hover:bg-[#f1f3f4] transition-colors">
                      Export my data
                    </button>
                    <button className="flex-1 px-5 py-2.5 bg-transparent text-[#c5221f] border border-[#f4c7c3] rounded-full text-sm font-medium hover:bg-[#fce8e6] transition-colors">
                      Delete account
                    </button>
                  </div>
                  <p className="text-xs text-[#5f6368] text-center mt-3">
                    Deleting your account requires confirmation and re-authentication.
                  </p>
                </div>
              </>
            )}

            {/* Integrations Section */}
            {activeTab === 'integrations' && (
              <div>
                <p className="text-sm text-[#5f6368] mb-4 text-center">Link providers to import data and unlock automation.</p>

                <div className="space-y-3">
                  <IntegrationRow
                    name="Apple Health"
                    desc="Steps, workouts, heart rate, sleep"
                    connected={appleConnected}
                    onConnect={() => window.location.href = '/api/oauth/apple/start'}
                    onDisconnect={() => setAppleConnected(false)}
                  />
                  <IntegrationRow
                    name="Google Fit"
                    desc="Activity and fitness history"
                    connected={googleConnected}
                    onConnect={() => window.location.href = '/api/oauth/google/start'}
                    onDisconnect={() => setGoogleConnected(false)}
                  />
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeTab === 'security' && (
              <>
                {user.provider === 'local' ? (
                  <div className="mb-6">
                    <p className="text-sm text-[#5f6368] mb-4 text-center">Recommended: enforce re-auth to change password.</p>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <button type="submit" className="w-full mt-6 px-6 py-3 bg-[#202124] text-white rounded-full text-sm font-medium hover:bg-[#3c4043] transition-colors">
                        Update password
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="mb-6">
                    <p className="text-sm text-[#5f6368] text-center">Password management is handled by your {user.provider} account.</p>
                  </div>
                )}

                <div className="pt-6 border-t border-[#dadce0]">
                  <p className="text-xs text-[#5f6368] font-mono text-center mb-2">
                    Session Token: {authService.getSessionToken()?.substring(0, 20)}...
                  </p>
                  <p className="text-xs text-[#5f6368] text-center mt-4 italic">
                    Two-factor authentication coming soon.
                  </p>
                </div>
              </>
            )}

            {/* Billing Section */}
            {activeTab === 'billing' && (
              <div>
                <p className="text-sm text-[#5f6368] mb-4 text-center">
                  Manage your WIHY plan, invoices, and payment method.
                </p>

                <div className="bg-[#f8f9fa] rounded-lg p-4 mb-6 border border-[#dadce0]">
                  <div className="text-xs text-[#5f6368] mb-1">Current Plan</div>
                  <div className="text-lg font-medium text-[#202124]">Beta Access</div>
                  <div className="text-sm text-[#5f6368] mt-1">Free during beta period</div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 px-5 py-2.5 bg-transparent text-[#1a73e8] border border-[#dadce0] rounded-full text-sm font-medium hover:bg-[#f1f3f4] transition-colors">
                    View invoices
                  </button>
                  <button className="flex-1 px-5 py-2.5 bg-[#1a73e8] text-white rounded-full text-sm font-medium hover:bg-[#1765cc] transition-colors">
                    Manage subscription
                  </button>
                </div>

                <p className="text-xs text-[#5f6368] text-center mt-6 italic">
                  Smarter insights start here.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#f8f9fa] border-t border-[#dadce0] text-center">
            <div className="text-xs text-[#5f6368] mb-1">Signed in as</div>
            <div className="text-sm font-medium text-[#202124]">{user.name}</div>
            <div className="text-xs text-[#5f6368]">{user.email}</div>
            <button 
              onClick={handleSignOut}
              className="mt-3 text-xs text-[#1a73e8] hover:underline"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
  );
};

// Toggle Component
const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}> = ({ checked, onChange, label, description }) => {
  return (
    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
      <div className="flex-1 mr-4">
        <div className="text-sm font-medium text-[#202124]">{label}</div>
        {description && <div className="text-xs text-[#5f6368] mt-1">{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2 ${
          checked ? 'bg-[#1a73e8]' : 'bg-[#dadce0]'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

// Integration Row Component
const IntegrationRow: React.FC<{
  name: string;
  desc: string;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}> = ({ name, desc, connected, onConnect, onDisconnect }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-[#f8f9fa] rounded-lg border border-[#dadce0] gap-3">
      <div className="flex-1">
        <div className="text-sm font-medium text-[#202124]">{name}</div>
        <div className="text-xs text-[#5f6368] mt-1">{desc}</div>
      </div>

      <div className="flex items-center gap-3 md:flex-shrink-0">
        <span className={`px-3 py-1 rounded-md text-xs font-medium ${
          connected 
            ? 'bg-[#e6f4ea] text-[#137333]' 
            : 'bg-[#f1f3f4] text-[#5f6368]'
        }`}>
          {connected ? 'Connected' : 'Not connected'}
        </span>

        {connected ? (
          <button 
            onClick={onDisconnect} 
            className="px-4 py-2 bg-transparent text-[#1a73e8] border border-[#dadce0] rounded-md text-sm font-medium hover:bg-[#f1f3f4] transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <button 
            onClick={onConnect} 
            className="px-4 py-2 bg-[#1a73e8] text-white rounded-md text-sm font-medium hover:bg-[#1765cc] transition-colors"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

export default Settings;
