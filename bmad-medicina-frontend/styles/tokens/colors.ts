/**
 * BMad - Color Tokens for Senior-Friendly UI
 * Optimized for high contrast and accessibility (WCAG 2.1 AA)
 * Target: Chilean seniors aged 60-85+
 */

export const colors = {
  // Primary palette - high contrast blues for trust
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe', 
    500: '#0369a1', // Main blue - medical trust
    600: '#0284c7',
    700: '#0369a1',
    900: '#0c4a6e',
  },

  // Success - clear green for positive actions
  success: {
    50: '#f0fdf4',
    500: '#22c55e', // High contrast green
    600: '#16a34a',
    700: '#15803d',
  },

  // Warning - amber for attention without alarm
  warning: {
    50: '#fffbeb',
    500: '#f59e0b', // Clear amber
    600: '#d97706',
    700: '#b45309',
  },

  // Error - clear red for important alerts
  error: {
    50: '#fef2f2',
    500: '#ef4444', // High contrast red
    600: '#dc2626', 
    700: '#b91c1c',
  },

  // Neutral grays - high contrast
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Semantic colors for medication management
  medication: {
    morning: '#fbbf24',   // Yellow for morning meds
    afternoon: '#f59e0b', // Orange for afternoon
    evening: '#7c3aed',   // Purple for evening
    night: '#1e40af',     // Blue for night
    taken: '#10b981',     // Green for taken
    missed: '#ef4444',    // Red for missed
    upcoming: '#3b82f6',  // Blue for upcoming
  },

  // Background and surface colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
  },

  // Text colors with high contrast ratios
  text: {
    primary: '#111827',   // AAA contrast on white
    secondary: '#374151', // AA contrast on white
    tertiary: '#6b7280',  // AA contrast for less important text
    inverse: '#ffffff',   // White text on dark backgrounds
  },

  // Border colors
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
  },
} as const;

export type ColorTokens = typeof colors;