// Dashboard theme for React Native

export const dashboardTheme = {
  colors: {
    primary: '#4285f4',
    secondary: '#34a853',
    background: '#e0f2fe', // Using the established light blue background
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    accent: '#8b5cf6',
    orange: '#fa5f06',
  },

  // Standard header padding - use these for all screen headers
  // paddingTop clears the camera/notch, paddingBottom provides spacing below content
  header: {
    paddingTop: 70,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  typography: {
    headerLarge: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: '#1f2937',
    },
    header: {
      fontSize: 24,
      fontWeight: '600' as const,
      color: '#1f2937',
    },
    title: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: '#1f2937',
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      color: '#374151',
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: '#6b7280',
    },
  },

  fonts: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },

  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

export type DashboardTheme = typeof dashboardTheme;
