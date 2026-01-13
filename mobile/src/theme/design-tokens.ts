export const colors = {
  primary: '#4285f4',
  primaryPressed: '#3367d6',
  surface: '#ffffff',
  text: '#1f2937',
  textMuted: '#6b7280',
  placeholder: '#9ca3af',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  buttonSecondary: '#f8f9fa',
  buttonSecondaryPressed: '#f1f3f4',
  buttonSecondaryBorder: '#f0f0f0',
  buttonSecondaryBorderPressed: '#dadce0',
  micActiveBg: '#ef4444',
  borderSweep: ['#fa5f06', '#ffffff', '#C0C0C0', '#4cbb17', '#fa5f06'] as const,
};

export const sizes = {
  inputMinHeight: 44,
  ctaHeight: 48,
  bottomNavHeight: 56,
  iconButton: 32,
  searchMaxWidth: 584,
  // Icon sizes for different contexts
  icons: {
    xs: 12,      // Small decorative icons
    sm: 16,      // Input field icons, small buttons
    md: 20,      // Standard icons (profile, navigation)
    lg: 24,      // Header icons, important actions
    xl: 32,      // Large feature icons
    xxl: 40,     // Profile pictures, main feature icons
  },
};

export const radii = {
  pill: 24,
  card: 12,
  button: 8,
  icon: 999,
  searchBar: 24,
};

// Design pattern: ROUNDED CORNERS (preferred across the app)
// Use these for consistency - all cards, buttons, and containers use rounded corners
export const borderRadius = {
  none: 0,
  sm: 8,           // Small elements (badges, small buttons)
  md: 12,          // Medium elements (cards, inputs, standard buttons)
  lg: 16,          // Large elements (dashboard cards, sections)
  xl: 20,          // Extra large (hero sections, large cards)
  pill: 24,        // Pills (search bars, full-rounded buttons)
  full: 999,       // Fully rounded (avatars, circular icons)
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  searchBar: {
    shadowColor: 'rgba(64,60,67,0.16)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
  },
  button: {
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPressed: {
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  inputPaddingH: 16,
  inputPaddingV: 10,
  inputPaddingRight: 128,
};

export const typography = {
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  input: {
    fontSize: 16,
    fontFamily: 'System',
    lineHeight: 24,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
};

export const tokens = {
  colors,
  sizes,
  radii,
  shadows,
  spacing,
  typography,
};
