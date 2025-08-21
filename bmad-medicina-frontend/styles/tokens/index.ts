/**
 * BMad - Design System Tokens
 * Complete token system for senior-friendly medication adherence UI
 */

export { colors, type ColorTokens } from './colors.ts';
export { typography, type TypographyTokens } from './typography.ts';
export { spacing, semanticSpacing, type SpacingTokens, type SemanticSpacingTokens } from './spacing.ts';
export { shadows, type ShadowTokens } from './shadows.ts';

// Combined design tokens interface
export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  semanticSpacing: SemanticSpacingTokens;
  shadows: ShadowTokens;
}

// Export complete token system
export const designTokens = {
  colors,
  typography,
  spacing,
  semanticSpacing,
  shadows,
} as const;

// Breakpoints for responsive design - mobile-first approach
export const breakpoints = {
  xs: '375px',  // Small phones
  sm: '640px',  // Large phones
  md: '768px',  // Tablets
  lg: '1024px', // Small laptops
  xl: '1280px', // Large laptops
  '2xl': '1536px', // Desktops
} as const;

// Animation durations - slower for seniors
export const animations = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

// Z-index scale for layering
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

export type Breakpoints = typeof breakpoints;
export type Animations = typeof animations;
export type ZIndex = typeof zIndex;