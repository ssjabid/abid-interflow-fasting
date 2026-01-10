import { useTheme } from "../context/ThemeContext";

type View =
  | "dashboard"
  | "history"
  | "statistics"
  | "goals"
  | "leaderboard"
  | "settings";

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export default function Navigation({
  currentView,
  onViewChange,
}: NavigationProps) {
  const { theme } = useTheme();

  const tabs: { id: View; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "history", label: "History" },
    { id: "statistics", label: "Stats" },
    { id: "goals", label: "Goals" },
    { id: "leaderboard", label: "Ranks" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div
      style={{
        borderBottom: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.bg,
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 16px",
        }}
      >
        <div
          className="nav-tabs scrollbar-hide"
          style={{
            display: "flex",
            gap: "4px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              style={{
                padding: "16px 20px",
                background: "none",
                border: "none",
                borderBottom:
                  currentView === tab.id
                    ? `2px solid ${theme.colors.accent}`
                    : "2px solid transparent",
                color:
                  currentView === tab.id
                    ? theme.colors.accent
                    : theme.colors.textMuted,
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.02em",
                cursor: "pointer",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (currentView !== tab.id) {
                  e.currentTarget.style.color = theme.colors.textSecondary;
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== tab.id) {
                  e.currentTarget.style.color = theme.colors.textMuted;
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
