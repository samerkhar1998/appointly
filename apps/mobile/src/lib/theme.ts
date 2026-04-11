/**
 * Design tokens — mirrors the web Tailwind config exactly.
 * Use these everywhere instead of raw hex values.
 */

export const colors = {
  // Brand palette (violet)
  brand: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed', // primary
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },

  // Semantic
  background: '#F9FAFB',
  foreground: '#111827',
  muted: '#6B7280',
  mutedForeground: '#9CA3AF',
  border: '#E5E7EB',

  // Surfaces
  surface: {
    base: '#FFFFFF',
    elevated: '#F9FAFB',
    floating: '#F3F4F6',
  },

  // Status
  success: '#10b981',
  successLight: '#d1fae5',
  successBorder: '#6ee7b7',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningBorder: '#fcd34d',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  dangerBorder: '#fca5a5',

  white: '#ffffff',
  black: '#000000',
} as const;

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 19,
  '2xl': 22,
  '3xl': 28,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/** Shadow tokens matching the web shadow-card / shadow-elevated / shadow-floating */
export const shadows = {
  card: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 5,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;
