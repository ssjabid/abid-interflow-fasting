import { useState, useEffect } from "react";
import type { Fast, FastingSchedule } from "../../types";
import { useTheme } from "../../context/ThemeContext";
import FastLogger from "./FastLogger";
import ScheduleReminder from "../ui/ScheduleReminder";

interface DashboardProps {
  fasts: Fast[];
  activeFast: Fast | null;
  onStartFast: (fast: Fast) => Promise<void>;
  onEndFast: (
    fastId: string,
    mood?: number,
    energyLevel?: number
  ) => Promise<void>;
  userId: string;
}

export default function Dashboard({
  fasts,
  activeFast,
  onStartFast,
  onEndFast,
  userId,
}: DashboardProps) {
  const { theme } = useTheme();
  const [dailyGoal, setDailyGoal] = useState(16);
  const [weeklyGoal, setWeeklyGoal] = useState(112);
  const [schedule, setSchedule] = useState<FastingSchedule | null>(null);
  const [preferredProtocol, setPreferredProtocol] = useState("16:8");

  useEffect(() => {
    const stored = localStorage.getItem(`profile_${userId}`);
    if (stored) {
      const profile = JSON.parse(stored);
      setDailyGoal(profile.dailyGoal || 16);
      setWeeklyGoal(profile.weeklyGoal || 112);
      setSchedule(profile.schedule || null);
      setPreferredProtocol(profile.preferredProtocol || "16:8");
    }
  }, [userId]);

  const handleScheduledStart = () => {
    // Start fast with preferred protocol
    const newFast: Fast = {
      id: Date.now().toString(),
      startTime: new Date(),
      endTime: null,
      duration: 0,
      status: "active",
      protocol: preferredProtocol,
    };
    onStartFast(newFast);
  };

  const completedFasts = fasts.filter((f) => f.status === "completed");
  const totalFasts = completedFasts.length;
  const totalMinutes = completedFasts.reduce(
    (sum, fast) => sum + fast.duration,
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const thisWeekFasts = completedFasts.filter((fast) => {
    const fastDate = new Date(fast.startTime);
    return fastDate >= weekStart;
  });
  const thisWeekMinutes = thisWeekFasts.reduce(
    (sum, fast) => sum + fast.duration,
    0
  );
  const thisWeekHours = Math.floor(thisWeekMinutes / 60);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayFasts = completedFasts.filter((fast) => {
    const fastDate = new Date(fast.startTime);
    return fastDate >= todayStart;
  });
  const todayMinutes = todayFasts.reduce((sum, fast) => sum + fast.duration, 0);
  const todayHours = Math.floor(todayMinutes / 60);

  const calculateStreak = () => {
    if (completedFasts.length === 0) return 0;

    const sortedFasts = [...completedFasts].sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const fast of sortedFasts) {
      const fastDate = new Date(fast.startTime);
      fastDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - fastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 1) {
        streak++;
        currentDate = fastDate;
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();
  const dailyProgress = Math.min((todayHours / dailyGoal) * 100, 100);
  const weeklyProgress = Math.min((thisWeekHours / weeklyGoal) * 100, 100);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Schedule Reminder */}
      {schedule && schedule.enabled && (
        <ScheduleReminder
          schedule={schedule}
          onStartFast={handleScheduledStart}
          isActiveFast={!!activeFast}
        />
      )}

      {/* Stats Row */}
      <div
        className="stats-grid"
        style={{
          backgroundColor: theme.colors.border,
          marginBottom: "32px",
        }}
      >
        {[
          {
            label: "Current Streak",
            value: currentStreak,
            unit: "days",
            highlight: currentStreak > 0,
          },
          {
            label: "Total Fasts",
            value: totalFasts,
            unit: "",
            highlight: false,
          },
          {
            label: "This Week",
            value: thisWeekHours,
            unit: "hrs",
            highlight: thisWeekHours >= Math.floor(weeklyGoal / 7),
          },
          {
            label: "All Time",
            value: totalHours,
            unit: "hrs",
            highlight: false,
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              backgroundColor: theme.colors.bg,
              padding: "24px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: theme.colors.textMuted,
                marginBottom: "8px",
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: stat.highlight ? theme.colors.accent : theme.colors.text,
              }}
            >
              {stat.value}
              {stat.unit && (
                <span
                  style={{
                    fontSize: "14px",
                    color: theme.colors.textMuted,
                    marginLeft: "4px",
                  }}
                >
                  {stat.unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bars */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {/* Daily Progress */}
        <div
          style={{
            backgroundColor: theme.colors.bgCard,
            border: `1px solid ${
              dailyProgress >= 100
                ? theme.colors.accent + "40"
                : theme.colors.border
            }`,
            padding: "20px 24px",
            transition: "border-color 0.3s ease",
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
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: theme.colors.textMuted,
              }}
            >
              Today
            </span>
            <span
              style={{
                fontSize: "13px",
                color:
                  dailyProgress >= 100
                    ? theme.colors.accent
                    : theme.colors.text,
                fontWeight: 600,
              }}
            >
              {todayHours}h / {dailyGoal}h
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "4px",
              backgroundColor: theme.colors.border,
            }}
          >
            <div
              style={{
                width: `${dailyProgress}%`,
                height: "100%",
                backgroundColor: theme.colors.accent,
                transition: "width 0.5s ease",
              }}
            />
          </div>
          {dailyProgress >= 100 && (
            <div
              style={{
                fontSize: "11px",
                color: theme.colors.accent,
                marginTop: "8px",
                fontWeight: 500,
              }}
            >
              ✓ Goal reached!
            </div>
          )}
        </div>

        {/* Weekly Progress */}
        <div
          style={{
            backgroundColor: theme.colors.bgCard,
            border: `1px solid ${
              weeklyProgress >= 100
                ? theme.colors.accent + "40"
                : theme.colors.border
            }`,
            padding: "20px 24px",
            transition: "border-color 0.3s ease",
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
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: theme.colors.textMuted,
              }}
            >
              This Week
            </span>
            <span
              style={{
                fontSize: "13px",
                color:
                  weeklyProgress >= 100
                    ? theme.colors.accent
                    : theme.colors.text,
                fontWeight: 600,
              }}
            >
              {thisWeekHours}h / {weeklyGoal}h
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "4px",
              backgroundColor: theme.colors.border,
            }}
          >
            <div
              style={{
                width: `${weeklyProgress}%`,
                height: "100%",
                backgroundColor: theme.colors.accent,
                transition: "width 0.5s ease",
              }}
            />
          </div>
          {weeklyProgress >= 100 && (
            <div
              style={{
                fontSize: "11px",
                color: theme.colors.accent,
                marginTop: "8px",
                fontWeight: 500,
              }}
            >
              ✓ Goal reached!
            </div>
          )}
        </div>
      </div>

      {/* Fast Logger */}
      <FastLogger
        activeFast={activeFast}
        onStartFast={onStartFast}
        onEndFast={onEndFast}
        userId={userId}
      />
    </div>
  );
}
