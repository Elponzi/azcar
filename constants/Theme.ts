export const THEME = {
  dark: {
    // Mobile
    mobileBg: '#050505',
    mobileCardBg: '#1A1A1A', // Used for track color in mobile
    // Desktop
    desktopBody: '#121212',
    desktopCard: '#1E1E1E',
    desktopControlBg: '#121212',
    // Common
    textPrimary: '#FFFFFF',
    textSecondary: '#888888',
    accent: '#34D399',
    accentDim: 'rgba(52, 211, 153, 0.2)',
    borderColor: '#333333',
    // Settings Specific (Derived or Explicit)
    modalBg: '#1E1E1E',
    activeBg: '#121212',
  },
  light: {
    // Mobile
    mobileBg: '#F3F4F6',
    mobileCardBg: '#FFFFFF',
    // Desktop
    desktopBody: '#E5E7EB',
    desktopCard: '#FFFFFF',
    desktopControlBg: '#E5E7EB',
    // Common
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    accent: '#059669',
    accentDim: 'rgba(5, 150, 105, 0.1)',
    borderColor: '#E5E7EB',
    // Settings Specific
    modalBg: '#FFFFFF',
    activeBg: '#F3F4F6',
  }
};

export type ThemeColors = typeof THEME.dark;
