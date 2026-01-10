import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import type { FastingSchedule } from "../../types";

interface ScheduleReminderProps {
  schedule: FastingSchedule;
  onStartFast: () => void;
  isActiveFast: boolean;
}

export default function ScheduleReminder({
  schedule,
  onStartFast,
  isActiveFast,
}: ScheduleReminderProps) {
  const { theme } = useTheme();
  const accentTextColor =
    theme.mode === "light"
      ? theme.accent === "default"
        ? "#FFFFFF"
        : "#FFFFFF"
      : theme.accent === "default"
      ? "#0B0B0C"
      : "#FFFFFF";
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!schedule.enabled || isActiveFast || dismissed) return null;

  // Parse schedule times
  const [startHour, startMin] = schedule.eatingWindowStart
    .split(":")
    .map(Number);
  const [endHour, endMin] = schedule.eatingWindowEnd.split(":").map(Number);

  const now = currentTime;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const eatingStartMinutes = startHour * 60 + startMin;
  const eatingEndMinutes = endHour * 60 + endMin;

  // Determine current state
  const isEatingWindow =
    currentMinutes >= eatingStartMinutes && currentMinutes < eatingEndMinutes;
  const isFastingWindow = !isEatingWindow;

  // Calculate time until next state change
  let minutesUntilChange: number;
  let nextState: string;

  if (isEatingWindow) {
    minutesUntilChange = eatingEndMinutes - currentMinutes;
    nextState = "fasting";
  } else if (currentMinutes < eatingStartMinutes) {
    minutesUntilChange = eatingStartMinutes - currentMinutes;
    nextState = "eating";
  } else {
    minutesUntilChange = 24 * 60 - currentMinutes + eatingStartMinutes;
    nextState = "eating";
  }

  const hoursUntil = Math.floor(minutesUntilChange / 60);
  const minsUntil = minutesUntilChange % 60;

  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <div
      style={{
        backgroundColor: theme.colors.bgCard,
        border: `1px solid ${
          isFastingWindow ? theme.colors.accent + "40" : theme.colors.border
        }`,
        padding: "16px 20px",
        marginBottom: "24px",
        position: "relative",
      }}
    >
      {/* Dismiss button - moved to top left */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: "none",
          border: "none",
          color: theme.colors.textMuted,
          fontSize: "16px",
          cursor: "pointer",
          padding: "4px 8px",
          lineHeight: 1,
          opacity: 0.5,
        }}
      >
        ×
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingRight: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Status icon */}
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: isFastingWindow
                ? theme.colors.accent + "15"
                : theme.colors.bg,
              border: `1px solid ${
                isFastingWindow
                  ? theme.colors.accent + "40"
                  : theme.colors.border
              }`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isFastingWindow ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.colors.accent}
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.colors.textMuted}
                strokeWidth="1.5"
              >
                <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
              </svg>
            )}
          </div>

          {/* Info */}
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: isFastingWindow
                  ? theme.colors.accent
                  : theme.colors.textMuted,
                marginBottom: "2px",
              }}
            >
              {isFastingWindow ? "Fasting Window" : "Eating Window"}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: theme.colors.text,
                fontWeight: 500,
              }}
            >
              {nextState === "eating" ? "Eating" : "Fasting"} starts in{" "}
              <span style={{ color: theme.colors.accent }}>
                {hoursUntil}h {minsUntil}m
              </span>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: theme.colors.textMuted,
                marginTop: "2px",
              }}
            >
              {formatTime(schedule.eatingWindowStart)} –{" "}
              {formatTime(schedule.eatingWindowEnd)}
            </div>
          </div>
        </div>

        {/* Action button */}
        {isFastingWindow && (
          <button
            onClick={onStartFast}
            style={{
              padding: "10px 16px",
              backgroundColor: "transparent",
              border: `1px solid ${theme.colors.accent}`,
              color: theme.colors.accent,
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.accent;
              e.currentTarget.style.color = accentTextColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = theme.colors.accent;
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Start Fast
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          marginTop: "12px",
          height: "2px",
          backgroundColor: theme.colors.border,
          position: "relative",
        }}
      >
        {/* Eating window */}
        <div
          style={{
            position: "absolute",
            left: `${(eatingStartMinutes / (24 * 60)) * 100}%`,
            width: `${
              ((eatingEndMinutes - eatingStartMinutes) / (24 * 60)) * 100
            }%`,
            height: "100%",
            backgroundColor: theme.colors.textMuted + "40",
          }}
        />
        {/* Current time */}
        <div
          style={{
            position: "absolute",
            left: `${(currentMinutes / (24 * 60)) * 100}%`,
            width: "4px",
            height: "8px",
            top: "-3px",
            backgroundColor: theme.colors.accent,
            borderRadius: "2px",
            transform: "translateX(-50%)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "9px",
          color: theme.colors.textMuted,
          marginTop: "4px",
          opacity: 0.6,
        }}
      >
        <span>12AM</span>
        <span>6AM</span>
        <span>12PM</span>
        <span>6PM</span>
        <span>12AM</span>
      </div>
    </div>
  );
}
