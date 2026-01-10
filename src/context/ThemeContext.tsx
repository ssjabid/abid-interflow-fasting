import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type ThemeMode = "dark" | "light";
export type ThemeAccent =
  | "default"
  | "emerald"
  | "blue"
  | "purple"
  | "amber"
  | "rose";

interface ThemeColors {
  bg: string;
  bgCard: string;
  bgHover: string;
  border: string;
  borderHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentMuted: string;
  success: string;
}

interface Theme {
  mode: ThemeMode;
  accent: ThemeAccent;
  colors: ThemeColors;
}

interface ThemeContextType {
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: ThemeAccent) => void;
}

const ACCENT_COLORS: Record<
  ThemeAccent,
  { main: string; hover: string; muted: string }
> = {
  default: {
    main: "#F5F5F5",
    hover: "#FFFFFF",
    muted: "rgba(245, 245, 245, 0.15)",
  },
  emerald: {
    main: "#10B981",
    hover: "#34D399",
    muted: "rgba(16, 185, 129, 0.15)",
  },
  blue: {
    main: "#3B82F6",
    hover: "#60A5FA",
    muted: "rgba(59, 130, 246, 0.15)",
  },
  purple: {
    main: "#8B5CF6",
    hover: "#A78BFA",
    muted: "rgba(139, 92, 246, 0.15)",
  },
  amber: {
    main: "#F59E0B",
    hover: "#FBBF24",
    muted: "rgba(245, 158, 11, 0.15)",
  },
  rose: { main: "#F43F5E", hover: "#FB7185", muted: "rgba(244, 63, 94, 0.15)" },
};

const getThemeColors = (mode: ThemeMode, accent: ThemeAccent): ThemeColors => {
  const accentColors = ACCENT_COLORS[accent];

  if (mode === "dark") {
    return {
      bg: "#0B0B0C",
      bgCard: "#101012",
      bgHover: "#1A1A1D",
      border: "#1F1F24",
      borderHover: "#2D2D32",
      text: "#F5F5F5",
      textSecondary: "#A0A0A4",
      textMuted: "#6B6B70",
      accent: accentColors.main,
      accentHover: accentColors.hover,
      accentMuted: accentColors.muted,
      success: "#4ADE80",
    };
  } else {
    // Light mode - clean, professional look
    return {
      bg: "#FAFAFA",
      bgCard: "#FFFFFF",
      bgHover: "#F3F4F6",
      border: "#E5E7EB",
      borderHover: "#D1D5DB",
      text: "#111827",
      textSecondary: "#4B5563",
      textMuted: "#9CA3AF",
      accent: accent === "default" ? "#111827" : accentColors.main,
      accentHover: accent === "default" ? "#374151" : accentColors.hover,
      accentMuted:
        accent === "default" ? "rgba(17, 24, 39, 0.08)" : accentColors.muted,
      success: "#22C55E",
    };
  }
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [accent, setAccentState] = useState<ThemeAccent>("default");

  useEffect(() => {
    const savedTheme = localStorage.getItem("interflow_theme");
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme);
      if (parsed.mode) setModeState(parsed.mode);
      if (parsed.accent) setAccentState(parsed.accent);
    }
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(
      "interflow_theme",
      JSON.stringify({ mode: newMode, accent })
    );
  };

  const setAccent = (newAccent: ThemeAccent) => {
    setAccentState(newAccent);
    localStorage.setItem(
      "interflow_theme",
      JSON.stringify({ mode, accent: newAccent })
    );
  };

  const theme: Theme = {
    mode,
    accent,
    colors: getThemeColors(mode, accent),
  };

  return (
    <ThemeContext.Provider value={{ theme, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export const THEME_ACCENTS: { id: ThemeAccent; name: string; color: string }[] =
  [
    { id: "default", name: "Monochrome", color: "#F5F5F5" },
    { id: "emerald", name: "Emerald", color: "#10B981" },
    { id: "blue", name: "Ocean", color: "#3B82F6" },
    { id: "purple", name: "Violet", color: "#8B5CF6" },
    { id: "amber", name: "Amber", color: "#F59E0B" },
    { id: "rose", name: "Rose", color: "#F43F5E" },
  ];
