// Wihy Design Tokens - Source of Truth
export const tokens = {
  colors: {
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
    // Dark mode
    darkNavBg: '#374151', // gray-800
    darkBorder: '#4b5563', // gray-700
  },

  borderSweep: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff0000'],

  sizes: {
    inputMinHeight: 44,
    ctaHeight: 48,
    bottomNavHeight: 56,
    iconButton: 32,
    searchMaxWidth: 584,
  },

  spacing: {
    inputPaddingH: 16, // pl-4
    inputPaddingV: 10, // py-2.5
    inputPaddingRight: 128, // pr-[128px]
  },

  radii: {
    pill: 24,
    card: 12,
    icon: 999,
    searchBar: 24, // very round
  },

  shadows: {
    searchBar: {
      shadowColor: '#403c43',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.16,
      shadowRadius: 5,
      elevation: 5,
    },
    button: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    buttonPressed: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },

  typography: {
    input: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
    },
    navLabel: {
      fontSize: 11,
      fontWeight: '500',
    },
  },
};
