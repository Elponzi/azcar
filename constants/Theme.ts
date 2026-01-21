export const THEME = {
  dark: {
    background: "#0F172A",
    backgroundPattern: "#0F172A",
    cardBg: "rgba(30, 41, 59, 0.7)",
    textPrimary: "#F1F5F9",
    textSecondary: "#94A3B8",
    textDim: "#64748B",
    accent: "#D4AF37",
    accentGlow: "rgba(212, 175, 55, 0.3)",
    accentDim: "rgba(212, 175, 55, 0.1)",
    danger: "#EF4444",
    modalBg: "rgba(15, 23, 42, 0.95)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    // For backwards compatibility or mapping
    activeBg: "#0F172A", 
  },
  light: {
    background: "#F1F5F9",
    backgroundPattern: "#E2E8F0",
    cardBg: "rgba(255, 255, 255, 0.85)",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textDim: "#94A3B8",
    accent: "#0F766E",
    accentGlow: "rgba(15, 118, 110, 0.2)",
    accentDim: "rgba(15, 118, 110, 0.08)",
    danger: "#EF4444",
    modalBg: "rgba(248, 250, 252, 0.98)",
    borderColor: "rgba(0, 0, 0, 0.08)",
    // For backwards compatibility or mapping
    activeBg: "#F1F5F9",
  }
};

export type ThemeColors = typeof THEME.dark;