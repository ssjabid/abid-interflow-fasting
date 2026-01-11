import { useState } from "react";
import type { Fast } from "../../types";
import { PROTOCOLS } from "../../types";
import { useTheme } from "../../context/ThemeContext";
import {
  useSubscription,
  FREE_TIER_LIMITS,
} from "../../context/SubscriptionContext";

interface HistoryProps {
  fasts: Fast[];
  onDeleteFast: (fastId: string) => void;
}

// Mood and Energy level definitions
const MOOD_LEVELS = [
  { value: 1, label: "Struggling" },
  { value: 2, label: "Difficult" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Good" },
  { value: 5, label: "Great" },
];

const ENERGY_LEVELS = [
  { value: 1, label: "Very Low" },
  { value: 2, label: "Low" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "High" },
  { value: 5, label: "Energized" },
];

// SVG mood icons
const MoodIcon = ({ value, color }: { value: number; color: string }) => {
  const mouthPaths: Record<number, string> = {
    1: "M8 15s1.5-2 4-2 4 2 4 2", // Frown
    2: "M9 15s0.5-1 3-1 3 1 3 1", // Slight frown
    3: "M8 15h8", // Neutral
    4: "M8 14s1.5 2 4 2 4-2 4-2", // Smile
    5: "M8 13s1.5 3 4 3 4-3 4-3", // Big smile
  };

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <path d={mouthPaths[value] || mouthPaths[3]} />
      <line
        x1="9"
        y1="9"
        x2="9.01"
        y2="9"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="15"
        y1="9"
        x2="15.01"
        y2="9"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default function History({ fasts, onDeleteFast }: HistoryProps) {
  const { theme } = useTheme();
  const { canAccessFeature, promptUpgrade } = useSubscription();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filter to completed fasts
  const allCompletedFasts = fasts
    .filter((fast) => fast.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

  // Limit to 7 days for free users
  const hasUnlimitedHistory = canAccessFeature("unlimitedHistory");
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - FREE_TIER_LIMITS.historyDays);

  const completedFasts = hasUnlimitedHistory
    ? allCompletedFasts
    : allCompletedFasts.filter(
        (fast) => new Date(fast.startTime) >= cutoffDate
      );

  const hiddenFastsCount = allCompletedFasts.length - completedFasts.length;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProtocolName = (protocolId: string) => {
    return PROTOCOLS.find((p) => p.id === protocolId)?.name || protocolId;
  };

  const getMoodInfo = (value: number) =>
    MOOD_LEVELS.find((m) => m.value === value);
  const getEnergyInfo = (value: number) =>
    ENERGY_LEVELS.find((e) => e.value === value);

  // Group fasts by date
  const groupedFasts: Record<string, Fast[]> = {};
  completedFasts.forEach((fast) => {
    const dateKey = new Date(fast.startTime).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!groupedFasts[dateKey]) {
      groupedFasts[dateKey] = [];
    }
    groupedFasts[dateKey].push(fast);
  });

  const handleDelete = (fastId: string) => {
    if (deleteConfirm === fastId) {
      onDeleteFast(fastId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(fastId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (completedFasts.length === 0) {
    return (
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          textAlign: "center",
          padding: "80px 24px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 24px auto",
            backgroundColor: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.textMuted}
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        </div>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: theme.colors.text,
            marginBottom: "8px",
          }}
        >
          No fasting history yet
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: theme.colors.textMuted,
          }}
        >
          Complete your first fast to see it here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: theme.colors.text,
              marginBottom: "4px",
            }}
          >
            Fasting History
          </h2>
          <p style={{ fontSize: "14px", color: theme.colors.textMuted }}>
            {completedFasts.length} fasts completed
            {!hasUnlimitedHistory &&
              ` (last ${FREE_TIER_LIMITS.historyDays} days)`}
          </p>
        </div>
        <span
          style={{
            fontSize: "14px",
            color: theme.colors.accent,
            fontWeight: 600,
          }}
        >
          {Math.floor(
            completedFasts.reduce((sum, f) => sum + f.duration, 0) / 60
          )}{" "}
          total hours
        </span>
      </div>

      {/* Hidden fasts banner for free users */}
      {hiddenFastsCount > 0 && (
        <div
          style={{
            backgroundColor: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.textMuted}
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: theme.colors.text,
                }}
              >
                {hiddenFastsCount} older fast{hiddenFastsCount > 1 ? "s" : ""}{" "}
                hidden
              </div>
              <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>
                Upgrade to view your complete history
              </div>
            </div>
          </div>
          <button
            onClick={() => promptUpgrade("unlimitedHistory")}
            style={{
              padding: "8px 16px",
              backgroundColor: theme.colors.text,
              border: "none",
              color: theme.colors.bg,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Unlock All
          </button>
        </div>
      )}

      {/* Grouped Fasts */}
      {Object.entries(groupedFasts).map(([date, dateFasts]) => (
        <div key={date} style={{ marginBottom: "32px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: theme.colors.textMuted,
              marginBottom: "12px",
            }}
          >
            {date}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {dateFasts.map((fast) => {
              const moodInfo = fast.mood ? getMoodInfo(fast.mood) : null;
              const energyInfo = fast.energyLevel
                ? getEnergyInfo(fast.energyLevel)
                : null;

              return (
                <div
                  key={fast.id}
                  style={{
                    backgroundColor: theme.colors.bgCard,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "20px 24px",
                    transition: "border-color 0.3s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor =
                      theme.colors.accent + "60")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = theme.colors.border)
                  }
                >
                  {/* Top Row: Duration and Protocol */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "28px",
                          fontWeight: 600,
                          letterSpacing: "-0.02em",
                          color: theme.colors.accent,
                        }}
                      >
                        {formatDuration(fast.duration)}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: theme.colors.textMuted,
                          marginTop: "4px",
                        }}
                      >
                        {formatTime(fast.startTime)} →{" "}
                        {fast.endTime && formatTime(fast.endTime)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {fast.protocol && (
                        <span
                          style={{
                            padding: "6px 12px",
                            backgroundColor: theme.colors.accent + "15",
                            border: `1px solid ${theme.colors.accent}30`,
                            color: theme.colors.accent,
                            fontSize: "12px",
                            fontWeight: 600,
                            letterSpacing: "0.02em",
                          }}
                        >
                          {getProtocolName(fast.protocol)}
                        </span>
                      )}

                      <button
                        onClick={() => handleDelete(fast.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color:
                            deleteConfirm === fast.id
                              ? "#ef4444"
                              : theme.colors.textMuted,
                          fontSize: "18px",
                          cursor: "pointer",
                          padding: "4px 8px",
                          transition: "color 0.3s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#ef4444")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color =
                            deleteConfirm === fast.id
                              ? "#ef4444"
                              : theme.colors.textMuted)
                        }
                        title={
                          deleteConfirm === fast.id
                            ? "Click again to confirm"
                            : "Delete fast"
                        }
                      >
                        {deleteConfirm === fast.id ? "✓" : "×"}
                      </button>
                    </div>
                  </div>

                  {/* Mood & Energy Row */}
                  {(moodInfo || energyInfo) && (
                    <div
                      style={{
                        display: "flex",
                        gap: "16px",
                        paddingTop: "12px",
                        borderTop: `1px solid ${theme.colors.border}`,
                        marginBottom: fast.notes ? "12px" : "0",
                      }}
                    >
                      {moodInfo && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: theme.colors.accent + "20",
                              borderRadius: "4px",
                            }}
                          >
                            <MoodIcon
                              value={fast.mood || 3}
                              color={theme.colors.accent}
                            />
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: theme.colors.textMuted,
                                letterSpacing: "0.05em",
                              }}
                            >
                              MOOD
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                color: theme.colors.text,
                                fontWeight: 500,
                              }}
                            >
                              {moodInfo.label}
                            </div>
                          </div>
                        </div>
                      )}
                      {energyInfo && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: theme.colors.accent + "20",
                              borderRadius: "4px",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={theme.colors.accent}
                              strokeWidth="2"
                            >
                              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                            </svg>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: theme.colors.textMuted,
                                letterSpacing: "0.05em",
                              }}
                            >
                              ENERGY
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                color: theme.colors.text,
                                fontWeight: 500,
                              }}
                            >
                              {energyInfo.label}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {fast.notes && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: theme.colors.textSecondary,
                        fontStyle: "italic",
                        paddingTop: moodInfo || energyInfo ? "0" : "12px",
                        borderTop:
                          moodInfo || energyInfo
                            ? "none"
                            : `1px solid ${theme.colors.border}`,
                      }}
                    >
                      "{fast.notes}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
