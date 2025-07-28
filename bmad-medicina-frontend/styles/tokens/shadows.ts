/**
 * BMad - Shadow Tokens for Senior-Friendly UI
 * Subtle shadows for depth and visual hierarchy
 * High contrast mode considerations
 */

export const shadows = {
  // Base shadow sizes
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  // Semantic shadows for components
  card: {
    resting: '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
    hover: '0 4px 8px 0 rgba(0, 0, 0, 0.12)',
    active: '0 1px 2px 0 rgba(0, 0, 0, 0.08)',
  },

  button: {
    resting: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    hover: '0 2px 4px 0 rgba(0, 0, 0, 0.12)',
    active: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
    focus: '0 0 0 3px rgba(59, 130, 246, 0.15)', // Blue focus ring
  },

  modal: {
    backdrop: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
    content: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
  },

  tooltip: {
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.15)',
  },

  // High contrast alternatives for accessibility
  highContrast: {
    card: '0 0 0 1px rgba(0, 0, 0, 0.1)',
    button: '0 0 0 2px rgba(0, 0, 0, 0.2)',
    focus: '0 0 0 3px rgba(0, 0, 0, 0.5)',
  },

  // Color-specific shadows for medication status
  medication: {
    taken: '0 2px 4px 0 rgba(16, 185, 129, 0.15)',      // Green shadow
    missed: '0 2px 4px 0 rgba(239, 68, 68, 0.15)',      // Red shadow
    upcoming: '0 2px 4px 0 rgba(59, 130, 246, 0.15)',   // Blue shadow
    warning: '0 2px 4px 0 rgba(245, 158, 11, 0.15)',    // Amber shadow
  },
} as const;

export type ShadowTokens = typeof shadows;