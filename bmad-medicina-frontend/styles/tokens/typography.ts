/**
 * BMad - Typography Tokens for Senior-Friendly UI
 * Optimized for readability and accessibility
 * Minimum 18px base font size for seniors
 */

export const typography = {
  // Font families - system fonts for better performance
  fontFamily: {
    sans: [
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ],
    mono: [
      'ui-monospace',
      'SFMono-Regular',
      '"SF Mono"',
      'Consolas',
      '"Liberation Mono"',
      'Menlo',
      'monospace',
    ],
  },

  // Font sizes - minimum 18px for seniors
  fontSize: {
    xs: ['14px', { lineHeight: '20px' }],    // Only for labels/metadata
    sm: ['16px', { lineHeight: '24px' }],    // Small text
    base: ['18px', { lineHeight: '28px' }],  // Default body text
    lg: ['20px', { lineHeight: '30px' }],    // Large body text
    xl: ['24px', { lineHeight: '32px' }],    // Headings
    '2xl': ['30px', { lineHeight: '36px' }], // Large headings
    '3xl': ['36px', { lineHeight: '44px' }], // Display headings
    '4xl': ['48px', { lineHeight: '56px' }], // Hero text
    '5xl': ['64px', { lineHeight: '72px' }], // Extra large display
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Letter spacing for better readability
  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
  },

  // Line height for senior-friendly reading
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Text styles for specific use cases
  textStyles: {
    // Main content text - optimized for reading
    body: {
      fontSize: '18px',
      lineHeight: '1.6',
      fontWeight: '400',
      letterSpacing: '0.01em',
    },
    
    // Large body text for important content
    bodyLarge: {
      fontSize: '20px',
      lineHeight: '1.6',
      fontWeight: '400',
      letterSpacing: '0.01em',
    },
    
    // Headings
    h1: {
      fontSize: '48px',
      lineHeight: '1.2',
      fontWeight: '700',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '36px',
      lineHeight: '1.3',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '30px',
      lineHeight: '1.3',
      fontWeight: '600',
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '24px',
      lineHeight: '1.4',
      fontWeight: '600',
      letterSpacing: '0em',
    },
    h5: {
      fontSize: '20px',
      lineHeight: '1.4',
      fontWeight: '500',
      letterSpacing: '0em',
    },
    
    // Button text - clear and bold
    button: {
      fontSize: '18px',
      lineHeight: '1.4',
      fontWeight: '600',
      letterSpacing: '0.025em',
    },
    
    // Button text large for primary actions
    buttonLarge: {
      fontSize: '20px',
      lineHeight: '1.4',
      fontWeight: '600',
      letterSpacing: '0.025em',
    },
    
    // Labels and metadata
    label: {
      fontSize: '16px',
      lineHeight: '1.5',
      fontWeight: '500',
      letterSpacing: '0.025em',
    },
    
    // Captions and small text
    caption: {
      fontSize: '14px',
      lineHeight: '1.5',
      fontWeight: '400',
      letterSpacing: '0.025em',
    },
  },
} as const;

export type TypographyTokens = typeof typography;