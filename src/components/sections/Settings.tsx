import { useState, useEffect } from "react";
import { useTheme, THEME_ACCENTS } from "../../context/ThemeContext";
import { useFasts } from "../../context/FastContext";
import { useSubscription } from "../../context/SubscriptionContext";
import type { ThemeMode, ThemeAccent } from "../../context/ThemeContext";
import type { FastingSchedule } from "../../types";
import { PROTOCOLS } from "../../types";
import ShareModal from "../ShareModal";
import ProBadge from "../ui/ProBadge";

interface SettingsProps {
  userId: string;
  totalFasts: number;
  totalHours: number;
  currentStreak: number;
}

export default function Settings({
  userId,
  totalFasts,
  totalHours,
  currentStreak,
}: SettingsProps) {
  const { theme, setMode, setAccent } = useTheme();
  const { clearAllData, fasts } = useFasts();
  const { canAccessFeature, promptUpgrade } = useSubscription();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Schedule state
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [eatingStart, setEatingStart] = useState("12:00");
  const [eatingEnd, setEatingEnd] = useState("20:00");

  // Notification preferences state
  const [eatingWindowReminders, setEatingWindowReminders] = useState(true);
  const [dailyTips, setDailyTips] = useState(true);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] =
    useState(false);

  // Check if push notifications are already enabled
  useEffect(() => {
    if ("Notification" in window) {
      setPushNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  // Load settings from profile
  useEffect(() => {
    const stored = localStorage.getItem(`profile_${userId}`);
    if (stored) {
      const profile = JSON.parse(stored);
      if (profile.schedule) {
        setScheduleEnabled(profile.schedule.enabled || false);
        setEatingStart(profile.schedule.eatingWindowStart || "12:00");
        setEatingEnd(profile.schedule.eatingWindowEnd || "20:00");
      }
      // Load notification preferences
      if (profile.notifications !== undefined) {
        setEatingWindowReminders(
          profile.notifications.eatingWindowReminders ?? true
        );
        setDailyTips(profile.notifications.dailyTips ?? true);
      }
    }
  }, [userId]);

  // Save notification preferences
  const saveNotificationPrefs = (reminders: boolean, tips: boolean) => {
    const stored = localStorage.getItem(`profile_${userId}`);
    const profile = stored ? JSON.parse(stored) : {};
    profile.notifications = {
      eatingWindowReminders: reminders,
      dailyTips: tips,
    };
    localStorage.setItem(`profile_${userId}`, JSON.stringify(profile));
  };

  const saveSchedule = (enabled: boolean, start: string, end: string) => {
    const stored = localStorage.getItem(`profile_${userId}`);
    if (stored) {
      const profile = JSON.parse(stored);
      const schedule: FastingSchedule = {
        enabled,
        eatingWindowStart: start,
        eatingWindowEnd: end,
        fastingHours: 16,
        remindersBefore: 15,
      };
      profile.schedule = schedule;
      localStorage.setItem(`profile_${userId}`, JSON.stringify(profile));
    }
  };

  // Pending accent selection (before applying)
  const [pendingAccent, setPendingAccent] = useState<ThemeAccent | null>(null);
  const previewAccent = pendingAccent || theme.accent;
  const previewMode = theme.mode;
  // In light mode with default accent, use dark color for visibility
  const previewColor =
    previewMode === "light" && previewAccent === "default"
      ? "#111827"
      : THEME_ACCENTS.find((a) => a.id === previewAccent)?.color || "#F5F5F5";
  // Text color on primary buttons
  const previewTextColor =
    previewMode === "light"
      ? previewAccent === "default"
        ? "#FFFFFF"
        : "#FFFFFF"
      : previewAccent === "default"
      ? "#0B0B0C"
      : "#FFFFFF";

  const handleApplyAccent = () => {
    if (pendingAccent) {
      setAccent(pendingAccent);
      setPendingAccent(null);
    }
  };

  const handleCancelAccent = () => {
    setPendingAccent(null);
  };

  // Export to CSV
  const exportToCSV = () => {
    setExportLoading(true);
    try {
      const completedFasts = fasts.filter((f) => f.status === "completed");

      if (completedFasts.length === 0) {
        alert("No completed fasts to export.");
        setExportLoading(false);
        return;
      }

      // CSV headers
      const headers = [
        "Date",
        "Start Time",
        "End Time",
        "Duration (hours)",
        "Protocol",
        "Mood",
        "Energy",
        "Notes",
      ];

      // CSV rows
      const rows = completedFasts
        .sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )
        .map((fast) => {
          const startDate = new Date(fast.startTime);
          const endDate = fast.endTime ? new Date(fast.endTime) : null;
          const protocol = PROTOCOLS.find((p) => p.id === fast.protocol);
          const moodLabels = [
            "",
            "Struggling",
            "Difficult",
            "Neutral",
            "Good",
            "Great",
          ];
          const energyLabels = [
            "",
            "Very Low",
            "Low",
            "Normal",
            "High",
            "Very High",
          ];

          return [
            startDate.toLocaleDateString(),
            startDate.toLocaleTimeString(),
            endDate ? endDate.toLocaleTimeString() : "",
            (fast.duration / 60).toFixed(1),
            protocol?.name || fast.protocol || "",
            fast.mood ? moodLabels[fast.mood] : "",
            fast.energyLevel ? energyLabels[fast.energyLevel] : "",
            fast.notes ? `"${fast.notes.replace(/"/g, '""')}"` : "",
          ].join(",");
        });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `interflow-fasts-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportLoading(false);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export data. Please try again.");
      setExportLoading(false);
    }
  };

  // Export to JSON (for backup/restore)
  const exportToJSON = () => {
    setExportLoading(true);
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        stats: {
          totalFasts,
          totalHours,
          currentStreak,
        },
        fasts: fasts.map((fast) => ({
          ...fast,
          startTime:
            fast.startTime instanceof Date
              ? fast.startTime.toISOString()
              : fast.startTime,
          endTime:
            fast.endTime instanceof Date
              ? fast.endTime.toISOString()
              : fast.endTime,
        })),
        profile: JSON.parse(localStorage.getItem(`profile_${userId}`) || "{}"),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `interflow-backup-${new Date().toISOString().split("T")[0]}.json`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportLoading(false);
    } catch (error) {
      console.error("Error exporting JSON:", error);
      alert("Failed to export data. Please try again.");
      setExportLoading(false);
    }
  };

  // Export to PDF (printable report)
  const exportToPDF = () => {
    setExportLoading(true);
    try {
      const completedFasts = fasts.filter((f) => f.status === "completed");

      if (completedFasts.length === 0) {
        alert("No completed fasts to export.");
        setExportLoading(false);
        return;
      }

      const sortedFasts = completedFasts.sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      const moodLabels = [
        "",
        "Struggling",
        "Difficult",
        "Neutral",
        "Good",
        "Great",
      ];
      const energyLabels = [
        "",
        "Very Low",
        "Low",
        "Normal",
        "High",
        "Very High",
      ];

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Interflow - Fasting Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #111; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            .subtitle { color: #666; font-size: 14px; margin-bottom: 32px; }
            .stats { display: flex; gap: 32px; margin-bottom: 32px; padding: 20px; background: #f5f5f5; }
            .stat { text-align: center; }
            .stat-value { font-size: 28px; font-weight: 700; }
            .stat-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; font-size: 13px; }
            th { background: #f5f5f5; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
            .notes { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>Fasting Report</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString()} • Interflow</p>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${totalFasts}</div>
              <div class="stat-label">Total Fasts</div>
            </div>
            <div class="stat">
              <div class="stat-value">${Math.round(totalHours)}</div>
              <div class="stat-label">Total Hours</div>
            </div>
            <div class="stat">
              <div class="stat-value">${currentStreak}</div>
              <div class="stat-label">Current Streak</div>
            </div>
          </div>

          <h2 style="font-size: 16px; margin-bottom: 16px;">Fasting History</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Duration</th>
                <th>Protocol</th>
                <th>Mood</th>
                <th>Energy</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${sortedFasts
                .map((fast) => {
                  const protocol = PROTOCOLS.find(
                    (p) => p.id === fast.protocol
                  );
                  return `
                  <tr>
                    <td>${new Date(fast.startTime).toLocaleDateString()}</td>
                    <td>${(fast.duration / 60).toFixed(1)}h</td>
                    <td>${protocol?.name || fast.protocol || "-"}</td>
                    <td>${fast.mood ? moodLabels[fast.mood] : "-"}</td>
                    <td>${
                      fast.energyLevel ? energyLabels[fast.energyLevel] : "-"
                    }</td>
                    <td class="notes">${fast.notes || "-"}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }

      setExportLoading(false);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
      setExportLoading(false);
    }
  };

  const handleResetOnboarding = () => {
    const profile = localStorage.getItem(`profile_${userId}`);
    if (profile) {
      const parsed = JSON.parse(profile);
      parsed.onboardingComplete = false;
      localStorage.setItem(`profile_${userId}`, JSON.stringify(parsed));
      window.location.reload();
    }
  };

  const handleClearAllData = async () => {
    try {
      await clearAllData();
      window.location.reload();
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("Failed to clear data. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "8px",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: theme.colors.text,
          }}
        >
          Settings
        </h2>
        <ProBadge size="sm" />
      </div>
      <p
        style={{
          color: theme.colors.textMuted,
          fontSize: "14px",
          marginBottom: "32px",
        }}
      >
        Customize your Interflow experience.
      </p>

      {/* Appearance Section */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          padding: "24px",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: theme.colors.textMuted,
            marginBottom: "20px",
          }}
        >
          Appearance
        </h3>

        {/* Mode Toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            paddingBottom: "24px",
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: theme.colors.text,
                marginBottom: "4px",
              }}
            >
              Theme Mode
            </div>
            <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
              Switch between dark and light mode
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "4px",
              backgroundColor: theme.colors.bg,
              padding: "4px",
            }}
          >
            {(["dark", "light"] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setMode(mode)}
                style={{
                  padding: "10px 16px",
                  backgroundColor:
                    theme.mode === mode ? theme.colors.accent : "transparent",
                  border: "none",
                  color:
                    theme.mode === mode
                      ? theme.mode === "dark"
                        ? "#0B0B0C"
                        : "#FFFFFF"
                      : theme.colors.textMuted,
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.2s ease",
                }}
              >
                {mode === "dark" ? "🌙" : "☀️"} {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 500,
              color: theme.colors.text,
              marginBottom: "4px",
            }}
          >
            Accent Color
          </div>
          <div
            style={{
              fontSize: "13px",
              color: theme.colors.textMuted,
              marginBottom: "16px",
            }}
          >
            Choose your preferred accent color for buttons and highlights
          </div>

          {/* Color swatches */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            {THEME_ACCENTS.map((accentOption) => {
              const isSelected = previewAccent === accentOption.id;
              const isCurrent = theme.accent === accentOption.id;
              return (
                <button
                  key={accentOption.id}
                  onClick={() => setPendingAccent(accentOption.id)}
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: accentOption.color,
                    border: isSelected
                      ? `3px solid ${theme.colors.text}`
                      : `1px solid ${theme.colors.border}`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    position: "relative",
                  }}
                  title={accentOption.name}
                >
                  {isCurrent && !pendingAccent && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={
                        accentOption.id === "default" ? "#0B0B0C" : "#FFFFFF"
                      }
                      strokeWidth="3"
                    >
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                  {isSelected && pendingAccent && (
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor:
                          accentOption.id === "default" ? "#0B0B0C" : "#FFFFFF",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Preview Box */}
          <div
            style={{
              backgroundColor: theme.colors.bg,
              border: `1px solid ${theme.colors.border}`,
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: theme.colors.textMuted,
                marginBottom: "12px",
              }}
            >
              Preview
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                style={{
                  padding: "10px 20px",
                  backgroundColor: previewColor,
                  border: "none",
                  color: previewTextColor,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "default",
                }}
              >
                Primary Button
              </button>
              <button
                style={{
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  border: `1px solid ${previewColor}`,
                  color: previewColor,
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "default",
                }}
              >
                Secondary
              </button>
              <div
                style={{
                  width: "32px",
                  height: "4px",
                  backgroundColor: previewColor,
                }}
              />
            </div>
          </div>

          {/* Apply/Cancel buttons */}
          {pendingAccent && pendingAccent !== theme.accent && (
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleApplyAccent}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: previewColor,
                  border: "none",
                  color: previewTextColor,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Apply {THEME_ACCENTS.find((a) => a.id === pendingAccent)?.name}
              </button>
              <button
                onClick={handleCancelAccent}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Section */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          padding: "24px",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: theme.colors.textMuted,
            marginBottom: "20px",
          }}
        >
          Notifications
        </h3>

        {/* Push Notifications Toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "20px",
            borderBottom: `1px solid ${theme.colors.border}`,
            marginBottom: "20px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: theme.colors.text,
                marginBottom: "4px",
              }}
            >
              Push Notifications
            </div>
            <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
              Get reminders for your fasting schedule
            </div>
          </div>
          <button
            onClick={() => {
              if ("Notification" in window) {
                if (!pushNotificationsEnabled) {
                  Notification.requestPermission().then((permission) => {
                    if (permission === "granted") {
                      setPushNotificationsEnabled(true);
                      new Notification("Interflow", {
                        body: "Notifications enabled! You'll receive fasting reminders.",
                        icon: "/favicon.ico",
                      });
                    }
                  });
                } else {
                  // Can't programmatically disable, show message
                  alert(
                    "To disable notifications, please update your browser settings for this site."
                  );
                }
              }
            }}
            style={{
              width: "48px",
              height: "28px",
              backgroundColor: pushNotificationsEnabled
                ? theme.colors.accent
                : theme.colors.border,
              borderRadius: "14px",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: "#FFFFFF",
                borderRadius: "50%",
                position: "absolute",
                left: pushNotificationsEnabled ? "24px" : "4px",
                top: "4px",
                transition: "all 0.3s ease",
              }}
            />
          </button>
        </div>

        {/* Fasting Reminders */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "20px",
            borderBottom: `1px solid ${theme.colors.border}`,
            marginBottom: "20px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: theme.colors.text,
                marginBottom: "4px",
              }}
            >
              Eating Window Reminders
            </div>
            <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
              Notify when eating window opens/closes
            </div>
          </div>
          <button
            onClick={() => {
              const newValue = !eatingWindowReminders;
              setEatingWindowReminders(newValue);
              saveNotificationPrefs(newValue, dailyTips);
            }}
            style={{
              width: "48px",
              height: "28px",
              backgroundColor: eatingWindowReminders
                ? theme.colors.accent
                : theme.colors.border,
              borderRadius: "14px",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: "#FFFFFF",
                borderRadius: "50%",
                position: "absolute",
                left: eatingWindowReminders ? "24px" : "4px",
                top: "4px",
                transition: "all 0.3s ease",
              }}
            />
          </button>
        </div>

        {/* Daily Motivation */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: theme.colors.text,
                marginBottom: "4px",
              }}
            >
              Daily Fasting Tips
            </div>
            <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
              Receive daily tips and motivation
            </div>
          </div>
          <button
            onClick={() => {
              const newValue = !dailyTips;
              setDailyTips(newValue);
              saveNotificationPrefs(eatingWindowReminders, newValue);
            }}
            style={{
              width: "48px",
              height: "28px",
              backgroundColor: dailyTips
                ? theme.colors.accent
                : theme.colors.border,
              borderRadius: "14px",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: "#FFFFFF",
                borderRadius: "50%",
                position: "absolute",
                left: dailyTips ? "24px" : "4px",
                top: "4px",
                transition: "all 0.3s ease",
              }}
            />
          </button>
        </div>
      </div>

      {/* Fasting Schedule Section */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          padding: "24px",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: theme.colors.textMuted,
            marginBottom: "20px",
          }}
        >
          Fasting Schedule
        </h3>

        {/* Enable Schedule Toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "20px",
            borderBottom: `1px solid ${theme.colors.border}`,
            marginBottom: "20px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: theme.colors.text,
                marginBottom: "4px",
              }}
            >
              Enable Schedule
            </div>
            <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
              Show reminders based on your eating window
            </div>
          </div>
          <button
            onClick={() => {
              const newEnabled = !scheduleEnabled;
              setScheduleEnabled(newEnabled);
              saveSchedule(newEnabled, eatingStart, eatingEnd);
            }}
            style={{
              width: "48px",
              height: "28px",
              backgroundColor: scheduleEnabled
                ? theme.colors.accent
                : theme.colors.border,
              borderRadius: "14px",
              padding: "4px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
              position: "relative",
              border: "none",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: "#FFFFFF",
                borderRadius: "50%",
                position: "absolute",
                left: scheduleEnabled ? "24px" : "4px",
                top: "4px",
                transition: "all 0.3s ease",
              }}
            />
          </button>
        </div>

        {/* Eating Window Times */}
        {scheduleEnabled && (
          <div className="form-grid-2">
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: theme.colors.textMuted,
                  marginBottom: "8px",
                }}
              >
                Eating Window Start
              </label>
              <input
                type="time"
                value={eatingStart}
                onChange={(e) => {
                  setEatingStart(e.target.value);
                  saveSchedule(scheduleEnabled, e.target.value, eatingEnd);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: theme.colors.textMuted,
                  marginBottom: "8px",
                }}
              >
                Eating Window End
              </label>
              <input
                type="time"
                value={eatingEnd}
                onChange={(e) => {
                  setEatingEnd(e.target.value);
                  saveSchedule(scheduleEnabled, eatingStart, e.target.value);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Visual preview */}
            <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: theme.colors.textMuted,
                  marginBottom: "8px",
                }}
              >
                Your daily schedule
              </div>
              <div
                style={{
                  height: "32px",
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Fasting periods (before and after eating window) */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${
                      ((parseInt(eatingStart.split(":")[0]) * 60 +
                        parseInt(eatingStart.split(":")[1])) /
                        (24 * 60)) *
                      100
                    }%`,
                    backgroundColor: theme.colors.accent + "30",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: theme.colors.accent,
                      fontWeight: 600,
                    }}
                  >
                    FAST
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: `${
                      ((parseInt(eatingEnd.split(":")[0]) * 60 +
                        parseInt(eatingEnd.split(":")[1])) /
                        (24 * 60)) *
                      100
                    }%`,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    backgroundColor: theme.colors.accent + "30",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: theme.colors.accent,
                      fontWeight: 600,
                    }}
                  >
                    FAST
                  </span>
                </div>
                {/* Eating window */}
                <div
                  style={{
                    position: "absolute",
                    left: `${
                      ((parseInt(eatingStart.split(":")[0]) * 60 +
                        parseInt(eatingStart.split(":")[1])) /
                        (24 * 60)) *
                      100
                    }%`,
                    width: `${
                      ((parseInt(eatingEnd.split(":")[0]) * 60 +
                        parseInt(eatingEnd.split(":")[1]) -
                        (parseInt(eatingStart.split(":")[0]) * 60 +
                          parseInt(eatingStart.split(":")[1]))) /
                        (24 * 60)) *
                      100
                    }%`,
                    top: 0,
                    bottom: 0,
                    backgroundColor: theme.colors.success + "30",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: theme.colors.success,
                      fontWeight: 600,
                    }}
                  >
                    EAT
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  color: theme.colors.textMuted,
                  marginTop: "4px",
                }}
              >
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>12 AM</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Section */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          padding: "24px",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: theme.colors.textMuted,
            marginBottom: "20px",
          }}
        >
          Share Progress
        </h3>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: theme.colors.text,
                marginBottom: "4px",
              }}
            >
              Share Your Journey
            </div>
            <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
              {totalFasts} fasts completed • {Math.round(totalHours)}h total
            </div>
          </div>
          <button
            onClick={() => setShowShareModal(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bgHover;
              e.currentTarget.style.borderColor = theme.colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = theme.colors.border;
            }}
            style={{
              padding: "10px 16px",
              backgroundColor: "transparent",
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.text,
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share
          </button>
        </div>
      </div>

      {/* Data Section */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          padding: "24px",
        }}
      >
        <h3
          style={{
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: theme.colors.textMuted,
            marginBottom: "20px",
          }}
        >
          Data Management
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Restart Onboarding */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "16px",
              borderBottom: `1px solid ${theme.colors.border}`,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  color: theme.colors.text,
                  marginBottom: "4px",
                }}
              >
                Restart Onboarding
              </div>
              <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
                Go through the setup wizard again
              </div>
            </div>
            {showRestartConfirm ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleResetOnboarding}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: theme.colors.accent,
                    border: "none",
                    color: theme.accent === "default" ? "#0B0B0C" : "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowRestartConfirm(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      theme.colors.bgHover;
                    e.currentTarget.style.borderColor = theme.colors.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "transparent",
                    border: `1px solid ${theme.colors.border}`,
                    color: theme.colors.text,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowRestartConfirm(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.bgHover;
                  e.currentTarget.style.borderColor = theme.colors.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = theme.colors.border;
                }}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Restart
              </button>
            )}
          </div>

          {/* Export Data */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "20px",
              borderBottom: `1px solid ${theme.colors.border}`,
              marginBottom: "20px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 500,
                    color: theme.colors.text,
                  }}
                >
                  Export Data
                </span>
                {!canAccessFeature("dataExport") && (
                  <span
                    style={{
                      padding: "2px 6px",
                      backgroundColor: "#3B82F620",
                      border: "1px solid #3B82F650",
                      color: "#3B82F6",
                      fontSize: "9px",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                    }}
                  >
                    PRO
                  </span>
                )}
              </div>
              <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
                Download your fasting history
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() =>
                  canAccessFeature("dataExport")
                    ? exportToCSV()
                    : promptUpgrade("dataExport")
                }
                disabled={exportLoading}
                onMouseEnter={(e) => {
                  if (!exportLoading) {
                    e.currentTarget.style.backgroundColor =
                      theme.colors.bgHover;
                    e.currentTarget.style.borderColor = theme.colors.accent;
                    e.currentTarget.style.color = theme.colors.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.color = theme.colors.text;
                }}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: exportLoading ? "not-allowed" : "pointer",
                  opacity: exportLoading ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                CSV
              </button>
              <button
                onClick={() =>
                  canAccessFeature("dataExport")
                    ? exportToPDF()
                    : promptUpgrade("dataExport")
                }
                disabled={exportLoading}
                onMouseEnter={(e) => {
                  if (!exportLoading) {
                    e.currentTarget.style.backgroundColor =
                      theme.colors.bgHover;
                    e.currentTarget.style.borderColor = theme.colors.accent;
                    e.currentTarget.style.color = theme.colors.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.color = theme.colors.text;
                }}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: exportLoading ? "not-allowed" : "pointer",
                  opacity: exportLoading ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                PDF
              </button>
              <button
                onClick={exportToJSON}
                disabled={exportLoading}
                onMouseEnter={(e) => {
                  if (!exportLoading) {
                    e.currentTarget.style.backgroundColor =
                      theme.colors.bgHover;
                    e.currentTarget.style.borderColor = theme.colors.accent;
                    e.currentTarget.style.color = theme.colors.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.color = theme.colors.text;
                }}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: exportLoading ? "not-allowed" : "pointer",
                  opacity: exportLoading ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                JSON
              </button>
            </div>
          </div>

          {/* Clear All Data */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#EF4444",
                  marginBottom: "4px",
                }}
              >
                Clear All Data
              </div>
              <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
                Permanently delete all your fasting data
              </div>
            </div>
            {showResetConfirm ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleClearAllData}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#EF4444",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#DC2626";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#EF4444";
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      theme.colors.bgHover;
                    e.currentTarget.style.borderColor = theme.colors.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "transparent",
                    border: `1px solid ${theme.colors.border}`,
                    color: theme.colors.text,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#EF4444";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#EF4444";
                }}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "transparent",
                  border: "1px solid #EF4444",
                  color: "#EF4444",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Clear Data
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareData={{
          title: "My Fasting Progress",
          text: `I've been crushing my fasting goals with Interflow! 💪`,
          stats: {
            streak: currentStreak,
            totalHours: Math.round(totalHours),
          },
        }}
      />
    </div>
  );
}
