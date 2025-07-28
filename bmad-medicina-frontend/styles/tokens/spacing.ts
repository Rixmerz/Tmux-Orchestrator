/**
 * BMad - Spacing Tokens for Senior-Friendly UI
 * Generous spacing for better touch targets and visual breathing room
 * Optimized for accessibility and ease of use
 */

export const spacing = {
  // Base unit: 4px
  px: '1px',
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',
} as const;

// Semantic spacing for specific use cases
export const semanticSpacing = {
  // Touch targets - minimum 44px for accessibility
  touchTarget: {
    minimum: '44px',    // WCAG minimum
    comfortable: '56px', // More comfortable for seniors
    large: '64px',      // Large touch targets
  },

  // Component spacing
  component: {
    xs: '4px',    // Tight internal spacing
    sm: '8px',    // Small internal spacing
    md: '16px',   // Default internal spacing
    lg: '24px',   // Large internal spacing
    xl: '32px',   // Extra large internal spacing
  },

  // Layout spacing
  layout: {
    xs: '16px',   // Tight layout spacing
    sm: '24px',   // Small layout spacing
    md: '32px',   // Default layout spacing
    lg: '48px',   // Large layout spacing
    xl: '64px',   // Extra large layout spacing
    '2xl': '96px', // Section spacing
  },

  // Content spacing
  content: {
    paragraph: '20px',      // Space between paragraphs
    section: '48px',        // Space between sections
    heading: '32px',        // Space before headings
    list: '12px',          // Space between list items
    card: '24px',          // Internal card padding
    cardGap: '20px',       // Gap between cards
  },

  // Form spacing
  form: {
    field: '20px',         // Space between form fields
    fieldGroup: '32px',    // Space between field groups
    label: '8px',          // Space between label and input
    button: '24px',        // Space around buttons
    section: '40px',       // Space between form sections
  },

  // Navigation spacing
  navigation: {
    item: '16px',          // Padding inside nav items
    gap: '8px',            // Gap between nav items
    section: '32px',       // Space between nav sections
  },
} as const;

export type SpacingTokens = typeof spacing;
export type SemanticSpacingTokens = typeof semanticSpacing;