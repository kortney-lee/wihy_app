import React, { useEffect, useMemo, useState } from 'react';
import { authService, User } from '../../services/authService';

type SectionKey =
  | 'profile'
  | 'preferences'
  | 'notifications'
  | 'privacy'
  | 'integrations'
  | 'security'
  | 'billing';

const SECTIONS: Array<{ key: SectionKey; label: string; desc: string }> = [
  { key: 'profile', label: 'Profile', desc: 'Identity and contact details' },
  { key: 'preferences', label: 'Preferences', desc: 'Units, goals, and defaults' },
  { key: 'notifications', label: 'Notifications', desc: 'Email and push settings' },
  { key: 'privacy', label: 'Privacy & Data', desc: 'Control data sharing and exports' },
  { key: 'integrations', label: 'Integrations', desc: 'Connect apps and providers' },
  { key: 'security', label: 'Security', desc: 'Password, sessions, and 2FA' },
  { key: 'billing', label: 'Billing', desc: 'Plan, invoices, and payment methods' },
];

interface UserPreferenceProps {
  /** optional: if your pages still want to control open/close, you can wire these in later */
}

const UserPreference: React.FC<UserPreferenceProps> = () => {
  const [open, setOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const isAuthed = authService.getState().isAuthenticated;

  // message banner
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // expanded sections (accordion)
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>(() => ({
    profile: true,
    preferences: false,
    notifications: false,
    privacy: false,
    integrations: false,
    security: false,
    billing: false,
  }));

  // Password change state (from Settings.tsx)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Preferences state (from Settings.tsx)
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
    const state = authService.getState();
    if (!state.isAuthenticated) {
      setUser(null);
      setOpen(false);
      return;
    }
    setUser(state.user);

    const unsubscribe = authService.subscribe((s) => {
      if (!s.isAuthenticated) {
        setUser(null);
        setOpen(false);
      } else {
        setUser(s.user);
      }
    });

    return () => unsubscribe();
  }, []);

  const initials = useMemo(() => {
    const u = user;
    return (u?.name?.[0] || u?.email?.[0] || 'U').toUpperCase();
  }, [user]);

  const toggleSection = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const signOut = async () => {
    await authService.logout();
    setOpen(false);
  };

  // Signed out: show user icon (your MultiAuthLogin already handles this in Header)
  // Signed in: show green avatar for identity
  if (!isAuthed) return null;

  return (
    <>
      {/* Green Avatar Identity Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200"
        title="Account Settings"
        type="button"
      >
        {user?.picture ? (
          <img 
            src={user.picture} 
            alt="Profile" 
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <svg 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-6 h-6 text-emerald-600"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-[1001]">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute right-0 top-0 h-full w-[480px] bg-white shadow-2xl flex flex-col" style={{ backgroundColor: '#f0f7ff' }}>
            {/* Drawer header */}
            <div className="px-6 py-5 border-b border-blue-200 bg-white/80 backdrop-blur-sm flex items-center justify-between">
              <div className="text-lg font-semibold text-vh-ink">Account</div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl hover:bg-blue-50 text-vh-muted hover:text-vh-ink transition-all duration-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* user silhouette */}
            <div className="px-6 py-5 border-b border-blue-200 bg-white/60 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center shadow-sm">
                  {user?.picture ? (
                    <img 
                      src={user.picture} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-8 h-8 text-emerald-600"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-vh-ink truncate">{user?.name || 'Account'}</div>
                  <div className="text-sm text-vh-muted truncate">{user?.email || ''}</div>
                </div>
              </div>
            </div>

            {/* message banner */}
            {message && (
              <div className={`mx-6 mt-4 px-4 py-3 rounded-xl text-sm font-medium shadow-sm ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {SECTIONS.map((s) => {
                const getHoverColors = (key: SectionKey) => {
                  const colorMap = {
                    profile: 'hover:from-blue-50 hover:to-cyan-50',
                    preferences: 'hover:from-purple-50 hover:to-violet-50', 
                    notifications: 'hover:from-yellow-50 hover:to-amber-50',
                    privacy: 'hover:from-green-50 hover:to-emerald-50',
                    integrations: 'hover:from-orange-50 hover:to-red-50',
                    security: 'hover:from-red-50 hover:to-pink-50',
                    billing: 'hover:from-indigo-50 hover:to-blue-50'
                  };
                  return colorMap[key] || 'hover:from-gray-50 hover:to-slate-50';
                };

                return (
                <div key={s.key} className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                  <button
                    onClick={() => toggleSection(s.key)}
                    className={`w-full text-left px-6 py-4 bg-gradient-to-r from-white/90 to-blue-50/50 ${getHoverColors(s.key)} flex items-center justify-between transition-all duration-200`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-vh-ink">{s.label}</div>
                      <div className="text-xs text-vh-muted mt-0.5">{s.desc}</div>
                    </div>
                    <div className="text-vh-muted text-lg">{expanded[s.key] ? '−' : '+'}</div>
                  </button>

                  {expanded[s.key] && (
                    <div className="p-6 bg-white/95 backdrop-blur-sm border-t border-blue-100">
                      {s.key === 'profile' && (
                        <div className="space-y-3">
                          <Field label="Full name">
                            <Input defaultValue={user?.name || ''} />
                          </Field>
                          <Field label="Email">
                            <Input type="email" defaultValue={user?.email || ''} />
                          </Field>
                          <Field label="Phone (optional)">
                            <Input type="tel" placeholder="(555) 555-5555" />
                          </Field>
                          <Field label="Username (public)">
                            <Input placeholder="kortney" />
                          </Field>
                          <PrimaryButton>Save changes</PrimaryButton>
                        </div>
                      )}

                      {s.key === 'preferences' && (
                        <div className="space-y-3">
                          <Field label="Measurement system">
                            <Select value={units} onChange={(e) => setUnits(e.target.value as any)}>
                              <option value="us">US (lb, ft/in, oz)</option>
                              <option value="metric">Metric (kg, cm, g)</option>
                            </Select>
                          </Field>

                          <Field label="Timezone">
                            <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                              <option value="America/Chicago">America/Chicago</option>
                              <option value="America/New_York">America/New_York</option>
                              <option value="America/Los_Angeles">America/Los_Angeles</option>
                            </Select>
                          </Field>

                          <Field label="Primary goal">
                            <Select value={goal} onChange={(e) => setGoal(e.target.value)}>
                              <option value="fat_loss">Fat loss</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="muscle_gain">Muscle gain</option>
                              <option value="performance">Performance</option>
                            </Select>
                          </Field>

                          <Field label="Diet preference (optional)">
                            <Select value={diet} onChange={(e) => setDiet(e.target.value)}>
                              <option value="none">No label</option>
                              <option value="whole_food">Whole food focused</option>
                              <option value="med">Mediterranean</option>
                              <option value="low_carb">Lower carb</option>
                              <option value="plant_forward">Plant-forward</option>
                            </Select>
                          </Field>

                          <PrimaryButton>Save preferences</PrimaryButton>
                        </div>
                      )}

                      {s.key === 'notifications' && (
                        <div className="space-y-3">
                          <Toggle checked={weekly} onChange={setWeekly} label="Weekly summary" />
                          <Toggle checked={coachMsgs} onChange={setCoachMsgs} label="Coach messages" />
                          <Toggle checked={researchUpdates} onChange={setResearchUpdates} label="Evidence updates" />
                          <PrimaryButton>Save notification settings</PrimaryButton>
                        </div>
                      )}

                      {s.key === 'privacy' && (
                        <div className="space-y-3">
                          <Toggle checked={shareWithCoach} onChange={setShareWithCoach} label="Share dashboards with assigned coach" />
                          <Toggle checked={consent} onChange={setConsent} label="Allow personalized insights" />

                          <div className="pt-4 border-t border-gray-200 flex gap-2">
                            <button className="flex-1 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium">
                              Export my data
                            </button>
                            <button className="flex-1 px-4 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-sm font-medium text-red-700">
                              Delete account
                            </button>
                          </div>
                        </div>
                      )}

                      {s.key === 'integrations' && (
                        <div className="space-y-3">
                          <IntegrationRow
                            name="Apple Health"
                            desc="Steps, workouts, heart rate, sleep"
                            connected={appleConnected}
                            onConnect={() => (window.location.href = '/api/oauth/apple/start')}
                            onDisconnect={() => setAppleConnected(false)}
                          />
                          <IntegrationRow
                            name="Google Fit"
                            desc="Activity and fitness history"
                            connected={googleConnected}
                            onConnect={() => (window.location.href = '/api/oauth/google/start')}
                            onDisconnect={() => setGoogleConnected(false)}
                          />
                        </div>
                      )}

                      {s.key === 'security' && (
                        <div className="space-y-4">
                          {user?.provider === 'local' ? (
                            <form onSubmit={handlePasswordChange} className="space-y-3">
                              <Field label="Current password">
                                <Input
                                  type="password"
                                  value={passwordData.currentPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                  required
                                />
                              </Field>
                              <Field label="New password">
                                <Input
                                  type="password"
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                  required
                                />
                              </Field>
                              <Field label="Confirm new password">
                                <Input
                                  type="password"
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                  required
                                />
                              </Field>

                              <PrimaryButton type="submit">Update password</PrimaryButton>
                            </form>
                          ) : (
                            <div className="text-sm text-gray-600">
                              Password management is handled by your {user?.provider} account.
                            </div>
                          )}

                          <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
                            Session Token: {authService.getSessionToken()?.substring(0, 20)}...
                          </div>

                          <div className="text-xs text-gray-500 italic">Two-factor authentication coming soon.</div>
                        </div>
                      )}

                      {s.key === 'billing' && (
                        <div className="space-y-3">
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <div className="text-xs text-gray-500">Current Plan</div>
                            <div className="text-sm font-semibold text-gray-900">Beta Access</div>
                            <div className="text-xs text-gray-500 mt-1">Free during beta period</div>
                          </div>

                          <div className="flex gap-2">
                            <button className="flex-1 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium">
                              View invoices
                            </button>
                            <button className="flex-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
                              Manage subscription
                            </button>
                          </div>

                          <div className="text-xs text-gray-500 italic text-center">Smarter insights start here.</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </div>

            {/* footer actions */}
            <div className="p-6 border-t border-blue-200 bg-white/60 backdrop-blur-sm">
              <button
                onClick={signOut}
                className="w-full px-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-blue-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-sm font-semibold text-vh-ink transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default UserPreference;

/* UI helpers */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-gray-800">{label}</div>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/80 backdrop-blur-sm text-vh-ink placeholder:text-vh-muted transition-all duration-200"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/80 backdrop-blur-sm text-vh-ink transition-all duration-200"
    />
  );
}

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', ...rest } = props;
  return (
    <button
      {...rest}
      className={`w-full mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-vh-accent to-blue-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-4 rounded-xl border border-blue-200 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200">
      <div className="text-sm font-medium text-vh-ink">{label}</div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-all duration-200 ${
          checked ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-300'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function IntegrationRow({
  name,
  desc,
  connected,
  onConnect,
  onDisconnect,
}: {
  name: string;
  desc: string;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-blue-200 bg-gradient-to-br from-white/90 to-blue-50/30 backdrop-blur-sm hover:from-white hover:to-blue-50/50 transition-all duration-200">
      <div>
        <div className="text-sm font-semibold text-vh-ink">{name}</div>
        <div className="text-xs text-vh-muted mt-0.5">{desc}</div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            connected ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
        >
          {connected ? 'Connected' : 'Not connected'}
        </span>

        {connected ? (
          <button
            onClick={onDisconnect}
            className="px-4 py-2 rounded-xl border border-red-200 bg-white/80 hover:bg-red-50 text-sm font-semibold text-red-700 transition-all duration-200"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}