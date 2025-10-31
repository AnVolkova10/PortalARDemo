export const theme = {
  colors: {
    accent: "var(--color-accent)",
    background: "var(--color-bg)",
    text: "var(--color-text)",
    muted: "var(--color-muted)",
    surface: "var(--color-surface)"
  },
  typography: {
    fontFamily: "var(--font-family-base)",
    fontHeading: "var(--font-family-heading)",
    weightRegular: 400,
    weightMedium: 500,
    weightBold: 700
  },
  spacing: {
    xs: "var(--space-xs)",
    sm: "var(--space-sm)",
    md: "var(--space-md)",
    lg: "var(--space-lg)",
    xl: "var(--space-xl)"
  },
  radii: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    full: "var(--radius-full)"
  }
} as const;

export type Theme = typeof theme;
