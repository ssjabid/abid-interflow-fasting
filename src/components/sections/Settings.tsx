import { useState, useEffect } from "react";
import { useTheme, THEME_ACCENTS } from "../../context/ThemeContext";
import { useFasts } from "../../context/FastContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import type { ThemeMode, ThemeAccent } from "../../context/ThemeContext";
import type { FastingSchedule } from "../../types";
import { PROTOCOLS } from "../../types";
import ShareModal from "../ShareModal";
import ProBadge from "../ui/ProBadge";
import ScheduleConfirmModal from "../ui/ScheduleConfirmModal";

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
  const { currentUser, updateUserEmail, updateUserPassword } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showScheduleConfirm, setShowScheduleConfirm] = useState(false);

  // Account state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountError, setAccountError] = useState("");
  const [accountSuccess, setAccountSuccess] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);

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
          profile.notifications.eatingWindowReminders ?? true,
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

  const saveSchedule = async (
    enabled: boolean,
    start: string,
    end: string,
    isNewSchedule: boolean = false,
  ) => {
    const stored = localStorage.getItem(`profile_${userId}`);
    if (stored) {
      const profile = JSON.parse(stored);

      // Calculate tomorrow's date for new schedules
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const schedule: FastingSchedule = {
        enabled,
        eatingWindowStart: start,
        eatingWindowEnd: end,
        fastingHours: 16,
        remindersBefore: 15,
        // Only set startDate when enabling a new schedule
        startDate: isNewSchedule
          ? tomorrow.toISOString()
          : profile.schedule?.startDate,
        lastAutoStartDate: profile.schedule?.lastAutoStartDate,
      };
      profile.schedule = schedule;

      // Save to localStorage
      localStorage.setItem(`profile_${userId}`, JSON.stringify(profile));

      // Also sync to Firebase for persistence across sessions
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        const { db } = await import("../../config/firebase");
        const profileRef = doc(db, "profiles", userId);
        await setDoc(profileRef, {
          ...profile,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error syncing schedule to Firebase:", error);
      }
    }
  };

  // Handle schedule confirmation
  const handleScheduleConfirm = () => {
    setScheduleEnabled(true);
    saveSchedule(true, eatingStart, eatingEnd, true); // true = new schedule
    setShowScheduleConfirm(false);
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
        showError("No Data", "No completed fasts to export.");
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
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
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
        `interflow-fasts-${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportLoading(false);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      showError("Export Failed", "Failed to export data. Please try again.");
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
        `interflow-backup-${new Date().toISOString().split("T")[0]}.json`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportLoading(false);
    } catch (error) {
      console.error("Error exporting JSON:", error);
      showError("Export Failed", "Failed to export data. Please try again.");
      setExportLoading(false);
    }
  };

  // Export to PDF (printable report)
  const exportToPDF = () => {
    setExportLoading(true);
    try {
      const completedFasts = fasts.filter((f) => f.status === "completed");

      if (completedFasts.length === 0) {
        showError("No Data", "No completed fasts to export.");
        setExportLoading(false);
        return;
      }

      const sortedFasts = completedFasts.sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
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
                    (p) => p.id === fast.protocol,
                  );
                  return `
                  <tr>
                    <td>${new Date(fast.startTime).toLocaleDateString()}</td>
                    <td>${(fast.duration / 60).toFixed(1)}h</td>
                    <td>${protocol?.name || fast.protocol || "-"}</td>
                    <td>${fast.mood ? moodLabels[fast.mood] : "-"}</td>
                    <td>${fast.energyLevel ? energyLabels[fast.energyLevel] : "-"}</td>
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
      showError("Export Failed", "Failed to export PDF. Please try again.");
      setExportLoading(false);
    }
  };

  const handleResetOnboarding = async () => {
    try {
      // Update localStorage
      const profile = localStorage.getItem(`profile_${userId}`);
      if (profile) {
        const parsed = JSON.parse(profile);
        parsed.onboardingComplete = false;
        localStorage.setItem(`profile_${userId}`, JSON.stringify(parsed));
      }

      // Also update Firebase
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../../config/firebase");
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { onboardingComplete: false });

      window.location.reload();
    } catch (error) {
      console.error("Error resetting onboarding:", error);
      // Still reload to try localStorage approach
      window.location.reload();
    }
  };

  const handleClearAllData = async () => {
    try {
      const success = await clearAllData();
      if (success) {
        showSuccess(
          "Data Cleared",
          "All your data has been cleared successfully. The page will now refresh.",
        );
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showError("Error", "Failed to clear data. Please try again.");
      }
    } catch (error) {
      console.error("Error clearing data:", error);
      showError("Error", "Failed to clear data. Please try again.");
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

      {/* Account Section */}
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
          Account
        </h3>

        {/* Current Email */}
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
              Email Address
            </div>
            <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
              {currentUser?.email || "No email set"}
            </div>
          </div>
          {currentUser?.providerData?.[0]?.providerId === "password" && (
            <button
              onClick={() => {
                setShowEmailModal(true);
                setAccountError("");
                setAccountSuccess("");
                setNewEmail("");
                setCurrentPassword("");
              }}
              style={{
                padding: "10px 16px",
                backgroundColor: "transparent",
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Change
            </button>
          )}
        </div>

        {/* Change Password */}
        {currentUser?.providerData?.[0]?.providerId === "password" && (
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
                Password
              </div>
              <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
                ••••••••
              </div>
            </div>
            <button
              onClick={() => {
                setShowPasswordModal(true);
                setAccountError("");
                setAccountSuccess("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              style={{
                padding: "10px 16px",
                backgroundColor: "transparent",
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Change
            </button>
          </div>
        )}

        {/* Auth Provider Info */}
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
              Sign-in Method
            </div>
            <div
              style={{
                fontSize: "13px",
                color: theme.colors.textMuted,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {currentUser?.providerData?.[0]?.providerId === "google.com" && (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </>
              )}
              {currentUser?.providerData?.[0]?.providerId === "twitter.com" && (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X (Twitter)
                </>
              )}
              {currentUser?.providerData?.[0]?.providerId === "password" && (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Email & Password
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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
                    "To disable notifications, please update your browser settings for this site.",
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
              Auto-start fasts based on your eating window
            </div>
          </div>
          <button
            onClick={() => {
              if (!scheduleEnabled) {
                // Show confirmation modal when enabling
                setShowScheduleConfirm(true);
              } else {
                // Disable immediately
                setScheduleEnabled(false);
                saveSchedule(false, eatingStart, eatingEnd);
              }
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

          {/* Export Data - Shows for all, locked for basic users */}
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
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                Export Data
                {!canAccessFeature("dataExport") && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 500,
                      color: theme.colors.textMuted,
                      backgroundColor: theme.colors.bgHover,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Pro
                  </span>
                )}
              </div>
              <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
                Download your fasting history
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => {
                  if (!canAccessFeature("dataExport")) {
                    promptUpgrade("dataExport");
                  } else {
                    exportToCSV();
                  }
                }}
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
                  padding: "10px 14px",
                  minWidth: "70px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: exportLoading ? "not-allowed" : "pointer",
                  opacity: exportLoading ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                {!canAccessFeature("dataExport") && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
                {canAccessFeature("dataExport") && (
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
                )}
                CSV
              </button>
              <button
                onClick={() => {
                  if (!canAccessFeature("dataExport")) {
                    promptUpgrade("dataExport");
                  } else {
                    exportToJSON();
                  }
                }}
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
                  padding: "10px 14px",
                  minWidth: "70px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: exportLoading ? "not-allowed" : "pointer",
                  opacity: exportLoading ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                {!canAccessFeature("dataExport") && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
                {canAccessFeature("dataExport") && (
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
                )}
                JSON
              </button>
              <button
                onClick={() => {
                  if (!canAccessFeature("dataExport")) {
                    promptUpgrade("dataExport");
                  } else {
                    exportToPDF();
                  }
                }}
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
                  padding: "10px 14px",
                  minWidth: "70px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: exportLoading ? "not-allowed" : "pointer",
                  opacity: exportLoading ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                {!canAccessFeature("dataExport") && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
                {canAccessFeature("dataExport") && (
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
                )}
                PDF
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

      {/* Change Email Modal */}
      {showEmailModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
          onClick={() => setShowEmailModal(false)}
        >
          <div
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              padding: "32px",
              maxWidth: "400px",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: theme.colors.text,
                marginBottom: "8px",
              }}
            >
              Change Email Address
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: theme.colors.textMuted,
                marginBottom: "24px",
              }}
            >
              Enter your current password and new email address.
            </p>

            {accountError && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#EF444420",
                  border: "1px solid #EF4444",
                  color: "#EF4444",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {accountError}
              </div>
            )}

            {accountSuccess && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#10B98120",
                  border: "1px solid #10B981",
                  color: "#10B981",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {accountSuccess}
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New email address"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newEmail || !currentPassword) {
                    setAccountError("Please fill in all fields");
                    return;
                  }
                  setAccountLoading(true);
                  setAccountError("");
                  try {
                    await updateUserEmail(newEmail, currentPassword);
                    setAccountSuccess("Email updated successfully!");
                    setTimeout(() => setShowEmailModal(false), 1500);
                  } catch (err: any) {
                    setAccountError(err.message || "Failed to update email");
                  }
                  setAccountLoading(false);
                }}
                disabled={accountLoading}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: theme.colors.text,
                  border: "none",
                  color: theme.colors.bg,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: accountLoading ? "not-allowed" : "pointer",
                  opacity: accountLoading ? 0.7 : 1,
                }}
              >
                {accountLoading ? "Updating..." : "Update Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              padding: "32px",
              maxWidth: "400px",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: theme.colors.text,
                marginBottom: "8px",
              }}
            >
              Change Password
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: theme.colors.textMuted,
                marginBottom: "24px",
              }}
            >
              Enter your current password and choose a new one.
            </p>

            {accountError && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#EF444420",
                  border: "1px solid #EF4444",
                  color: "#EF4444",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {accountError}
              </div>
            )}

            {accountSuccess && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#10B98120",
                  border: "1px solid #10B981",
                  color: "#10B981",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {accountSuccess}
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!currentPassword || !newPassword || !confirmPassword) {
                    setAccountError("Please fill in all fields");
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setAccountError("New passwords do not match");
                    return;
                  }
                  if (newPassword.length < 6) {
                    setAccountError("Password must be at least 6 characters");
                    return;
                  }
                  setAccountLoading(true);
                  setAccountError("");
                  try {
                    await updateUserPassword(currentPassword, newPassword);
                    setAccountSuccess("Password updated successfully!");
                    setTimeout(() => setShowPasswordModal(false), 1500);
                  } catch (err: any) {
                    setAccountError(err.message || "Failed to update password");
                  }
                  setAccountLoading(false);
                }}
                disabled={accountLoading}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: theme.colors.text,
                  border: "none",
                  color: theme.colors.bg,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: accountLoading ? "not-allowed" : "pointer",
                  opacity: accountLoading ? 0.7 : 1,
                }}
              >
                {accountLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Confirmation Modal */}
      <ScheduleConfirmModal
        isVisible={showScheduleConfirm}
        eatingWindowStart={eatingStart}
        eatingWindowEnd={eatingEnd}
        onConfirm={handleScheduleConfirm}
        onCancel={() => setShowScheduleConfirm(false)}
      />
    </div>
  );
}
