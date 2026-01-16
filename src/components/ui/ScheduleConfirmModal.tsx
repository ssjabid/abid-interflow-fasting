import { useTheme } from "../../context/ThemeContext";

interface ScheduleConfirmModalProps {
  isVisible: boolean;
  eatingWindowStart: string;
  eatingWindowEnd: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ScheduleConfirmModal({
  isVisible,
  eatingWindowStart,
  eatingWindowEnd,
  onConfirm,
  onCancel,
}: ScheduleConfirmModalProps) {
  const { theme } = useTheme();

  if (!isVisible) return null;

  // Format time for display (e.g., "12:00" -> "12:00 PM")
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "24px",
        animation: "fadeIn 0.3s ease",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          padding: "32px",
          maxWidth: "420px",
          width: "100%",
          animation: "slideUp 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: theme.colors.bgHover,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.accent}
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: theme.colors.text,
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          Enable Fasting Schedule
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: "14px",
            color: theme.colors.textMuted,
            textAlign: "center",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          Your scheduled fasts will automatically start beginning{" "}
          <strong style={{ color: theme.colors.text }}>{tomorrowStr}</strong>.
        </p>

        {/* Schedule Summary */}
        <div
          style={{
            backgroundColor: theme.colors.bg,
            border: `1px solid ${theme.colors.border}`,
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "13px", color: theme.colors.textMuted }}>
              Eating Window
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: theme.colors.text,
              }}
            >
              {formatTime(eatingWindowStart)} – {formatTime(eatingWindowEnd)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "13px", color: theme.colors.textMuted }}>
              Fast Starts
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: theme.colors.accent,
              }}
            >
              Daily at {formatTime(eatingWindowEnd)}
            </span>
          </div>
        </div>

        {/* Info Note */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            backgroundColor: `${theme.colors.accent}10`,
            padding: "12px",
            marginBottom: "24px",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.accent}
            strokeWidth="2"
            style={{ flexShrink: 0, marginTop: "1px" }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p
            style={{
              fontSize: "12px",
              color: theme.colors.textMuted,
              lineHeight: 1.5,
            }}
          >
            A fast will automatically start at the end of your eating window
            each day. You can edit completed fasts to add notes, mood, and
            energy levels.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "14px",
              backgroundColor: "transparent",
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.text,
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "14px",
              backgroundColor: theme.colors.accent,
              border: "none",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            Enable Schedule
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
