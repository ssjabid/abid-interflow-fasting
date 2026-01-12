import { useState, useEffect, useMemo } from "react";
import type { Fast, WeightEntry } from "../../types";
import { PROTOCOLS } from "../../types";
import { useTheme } from "../../context/ThemeContext";
import { useSubscription } from "../../context/SubscriptionContext";
import CalendarHeatmap from "../ui/CalendarHeatmap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

interface StatisticsProps {
  fasts: Fast[];
}

type DateRange = "7d" | "14d" | "30d" | "90d" | "6m" | "1y" | "all";
type StatsTab = "overview" | "trends" | "patterns" | "body" | "insights";

const DATE_RANGES: { id: DateRange; label: string; days: number | null }[] = [
  { id: "7d", label: "7 Days", days: 7 },
  { id: "14d", label: "14 Days", days: 14 },
  { id: "30d", label: "30 Days", days: 30 },
  { id: "90d", label: "90 Days", days: 90 },
  { id: "6m", label: "6 Months", days: 180 },
  { id: "1y", label: "1 Year", days: 365 },
  { id: "all", label: "All Time", days: null },
];

const TABS: { id: StatsTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "trends", label: "Trends" },
  { id: "patterns", label: "Patterns" },
  { id: "body", label: "Body" },
  { id: "insights", label: "Insights" },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Statistics({ fasts }: StatisticsProps) {
  const { theme } = useTheme();
  const { canAccessFeature, promptUpgrade } = useSubscription();
  const accentTextColor =
    theme.mode === "light"
      ? theme.accent === "default"
        ? "#FFFFFF"
        : "#FFFFFF"
      : theme.accent === "default"
      ? "#0B0B0C"
      : "#FFFFFF";

  const [activeTab, setActiveTab] = useState<StatsTab>("overview");
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("weight_entries");
    if (stored) setWeightEntries(JSON.parse(stored));
  }, []);

  const addWeightEntry = () => {
    if (!newWeight) return;
    const entry: WeightEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      weight: parseFloat(newWeight),
      unit: weightUnit,
    };
    const updated = [...weightEntries, entry];
    setWeightEntries(updated);
    localStorage.setItem("weight_entries", JSON.stringify(updated));
    setNewWeight("");
  };

  // Filter fasts by date range
  const filteredFasts = useMemo(() => {
    const range = DATE_RANGES.find((r) => r.id === dateRange);
    if (!range || range.days === null) {
      return fasts.filter((f) => f.status === "completed");
    }
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - range.days);
    return fasts.filter(
      (f) => f.status === "completed" && new Date(f.startTime) >= cutoffDate
    );
  }, [fasts, dateRange]);

  // Core statistics
  const totalMinutes = filteredFasts.reduce((sum, f) => sum + f.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalFasts = filteredFasts.length;
  const avgDuration =
    totalFasts > 0 ? Math.floor(totalMinutes / totalFasts) : 0;
  const avgDurationHours = Math.floor(avgDuration / 60);
  const avgDurationMins = avgDuration % 60;
  const longestFast =
    filteredFasts.length > 0
      ? Math.max(...filteredFasts.map((f) => f.duration))
      : 0;
  const longestFastHours = Math.floor(longestFast / 60);
  const longestFastMins = longestFast % 60;

  // Streak calculation
  const currentStreak = useMemo(() => {
    const completedFasts = fasts.filter((f) => f.status === "completed");
    if (completedFasts.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);

      const hasFast = completedFasts.some((fast) => {
        const fastDate = new Date(fast.startTime);
        return fastDate.toDateString() === checkDate.toDateString();
      });

      if (hasFast) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [fasts]);

  // Completion rate
  const completionRate = useMemo(() => {
    const range = DATE_RANGES.find((r) => r.id === dateRange);
    let allFastsInRange = fasts;

    if (range && range.days !== null) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - range.days);
      allFastsInRange = fasts.filter(
        (f) => new Date(f.startTime) >= cutoffDate
      );
    }

    if (allFastsInRange.length === 0) return 0;
    const completed = allFastsInRange.filter(
      (f) => f.status === "completed"
    ).length;
    return Math.round((completed / allFastsInRange.length) * 100);
  }, [fasts, dateRange]);

  // Protocol breakdown
  const protocolBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredFasts.forEach((fast) => {
      const protocol = fast.protocol || "16:8";
      breakdown[protocol] = (breakdown[protocol] || 0) + 1;
    });
    return Object.entries(breakdown)
      .map(([name, count]) => ({
        name: PROTOCOLS.find((p) => p.id === name)?.name || name,
        value: count,
        percentage:
          filteredFasts.length > 0
            ? Math.round((count / filteredFasts.length) * 100)
            : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredFasts]);

  // Daily chart data
  const dailyData = useMemo(() => {
    const range = DATE_RANGES.find((r) => r.id === dateRange);
    const days = Math.min(range?.days || 30, 14);
    const data: { date: string; hours: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const dayFasts = filteredFasts.filter((f) => {
        const fastDate = new Date(f.startTime);
        return fastDate.toDateString() === date.toDateString();
      });

      const hours = dayFasts.reduce((sum, f) => sum + f.duration, 0) / 60;
      data.push({ date: dateStr, hours: Math.round(hours * 10) / 10 });
    }
    return data;
  }, [filteredFasts, dateRange]);

  // Weekly trend data
  const weeklyTrendData = useMemo(() => {
    const range = DATE_RANGES.find((r) => r.id === dateRange);
    const numWeeks = Math.min(Math.ceil((range?.days || 30) / 7), 8);
    const weeks: { week: string; hours: number; fasts: number }[] = [];

    for (let i = numWeeks - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekFasts = filteredFasts.filter((f) => {
        const fastDate = new Date(f.startTime);
        return fastDate >= weekStart && fastDate < weekEnd;
      });

      weeks.push({
        week: `W${numWeeks - i}`,
        hours: Math.round(
          weekFasts.reduce((sum, f) => sum + f.duration, 0) / 60
        ),
        fasts: weekFasts.length,
      });
    }
    return weeks;
  }, [filteredFasts, dateRange]);

  // Day of week analysis
  const dayOfWeekData = useMemo(() => {
    const days = DAYS_OF_WEEK.map((day) => ({ day, hours: 0, fasts: 0 }));
    filteredFasts.forEach((fast) => {
      const dayIndex = new Date(fast.startTime).getDay();
      days[dayIndex].hours += fast.duration / 60;
      days[dayIndex].fasts += 1;
    });
    return days.map((d) => ({
      ...d,
      hours: Math.round(d.hours),
      avgHours: d.fasts > 0 ? Math.round(d.hours / d.fasts) : 0,
    }));
  }, [filteredFasts]);

  const bestDay = useMemo(() => {
    return dayOfWeekData.reduce(
      (best, day) => (day.hours > best.hours ? day : best),
      dayOfWeekData[0]
    );
  }, [dayOfWeekData]);

  // Time of day analysis
  const timeOfDayData = useMemo(() => {
    const periods = [
      { name: "Morning", range: "5am-12pm", fasts: 0 },
      { name: "Afternoon", range: "12pm-5pm", fasts: 0 },
      { name: "Evening", range: "5pm-9pm", fasts: 0 },
      { name: "Night", range: "9pm-5am", fasts: 0 },
    ];

    filteredFasts.forEach((fast) => {
      const hour = new Date(fast.startTime).getHours();
      if (hour >= 5 && hour < 12) periods[0].fasts++;
      else if (hour >= 12 && hour < 17) periods[1].fasts++;
      else if (hour >= 17 && hour < 21) periods[2].fasts++;
      else periods[3].fasts++;
    });
    return periods;
  }, [filteredFasts]);

  // Consistency score
  const consistencyScore = useMemo(() => {
    if (filteredFasts.length < 2) return 0;
    const range = DATE_RANGES.find((r) => r.id === dateRange);
    const days = range?.days || 30;
    const daysWithFasts = new Set(
      filteredFasts.map((f) => new Date(f.startTime).toDateString())
    ).size;
    const frequencyScore = Math.min((daysWithFasts / days) * 100, 100) * 0.4;
    const streakScore = Math.min((currentStreak / 7) * 100, 100) * 0.3;
    const completionScore = completionRate * 0.3;
    return Math.round(frequencyScore + streakScore + completionScore);
  }, [filteredFasts, dateRange, currentStreak, completionRate]);

  // Insights
  const insights = useMemo(() => {
    const result: {
      title: string;
      description: string;
      type: "positive" | "neutral" | "suggestion";
    }[] = [];

    if (totalFasts === 0) {
      result.push({
        title: "Start Your Journey",
        description: "Complete your first fast to see insights.",
        type: "neutral",
      });
      return result;
    }

    if (currentStreak >= 7) {
      result.push({
        title: "Amazing Streak!",
        description: `${currentStreak} days in a row. Keep it up!`,
        type: "positive",
      });
    } else if (currentStreak >= 3) {
      result.push({
        title: "Building Momentum",
        description: `${currentStreak} day streak! Great habit forming.`,
        type: "positive",
      });
    }

    if (bestDay.fasts > 0) {
      result.push({
        title: `${bestDay.day} is Your Day`,
        description: `You fast most on ${bestDay.day}s with ${bestDay.hours}h total.`,
        type: "neutral",
      });
    }

    if (completionRate >= 90) {
      result.push({
        title: "High Achiever",
        description: `${completionRate}% completion rate - excellent discipline!`,
        type: "positive",
      });
    } else if (completionRate < 70 && totalFasts > 3) {
      result.push({
        title: "Room for Improvement",
        description: `Try shorter fasts to improve your ${completionRate}% completion rate.`,
        type: "suggestion",
      });
    }

    if (avgDuration >= 18 * 60) {
      result.push({
        title: "Extended Faster",
        description: `${avgDurationHours}h average puts you in deep fasting territory.`,
        type: "positive",
      });
    }

    if (protocolBreakdown.length > 0) {
      const top = protocolBreakdown[0];
      result.push({
        title: "Favorite Protocol",
        description: `${top.name} is your go-to (${top.percentage}% of fasts).`,
        type: "neutral",
      });
    }

    const favoriteTime = timeOfDayData.reduce(
      (best, p) => (p.fasts > best.fasts ? p : best),
      timeOfDayData[0]
    );
    if (favoriteTime.fasts > 0) {
      result.push({
        title: `${favoriteTime.name} Starter`,
        description: `You prefer starting fasts in the ${favoriteTime.name.toLowerCase()}.`,
        type: "neutral",
      });
    }

    if (totalHours >= 100) {
      result.push({
        title: "Century Club",
        description: `${totalHours}+ hours fasted! Significant autophagy achieved.`,
        type: "positive",
      });
    }

    return result.slice(0, 5);
  }, [
    totalFasts,
    currentStreak,
    bestDay,
    completionRate,
    avgDuration,
    avgDurationHours,
    protocolBreakdown,
    timeOfDayData,
    totalHours,
  ]);

  // Weight data
  const filteredWeightEntries = useMemo(() => {
    const range = DATE_RANGES.find((r) => r.id === dateRange);
    if (!range || range.days === null) return weightEntries;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - range.days);
    return weightEntries.filter((e) => new Date(e.date) >= cutoffDate);
  }, [weightEntries, dateRange]);

  const weightData = filteredWeightEntries.map((e) => ({
    date: new Date(e.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    weight: e.weight,
  }));

  const startingWeight =
    filteredWeightEntries.length > 0 ? filteredWeightEntries[0].weight : 0;
  const currentWeightValue =
    filteredWeightEntries.length > 0
      ? filteredWeightEntries[filteredWeightEntries.length - 1].weight
      : 0;
  const weightChange = currentWeightValue - startingWeight;

  const COLORS = [
    theme.colors.accent,
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
  ];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
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
            Statistics
          </h2>
          <p style={{ fontSize: "14px", color: theme.colors.textMuted }}>
            Track your fasting progress and patterns
          </p>
        </div>

        {/* Date Range Selector */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            style={{
              padding: "10px 16px",
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.text,
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {DATE_RANGES.find((r) => r.id === dateRange)?.label}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showDateDropdown && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "4px",
                backgroundColor: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                zIndex: 10,
                minWidth: "120px",
              }}
            >
              {DATE_RANGES.map((range) => (
                <button
                  key={range.id}
                  onClick={() => {
                    setDateRange(range.id);
                    setShowDateDropdown(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    backgroundColor:
                      dateRange === range.id
                        ? theme.colors.bgHover
                        : "transparent",
                    border: "none",
                    color: theme.colors.text,
                    fontSize: "13px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "24px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 20px",
              backgroundColor:
                activeTab === tab.id
                  ? theme.colors.accent
                  : theme.colors.bgCard,
              border: `1px solid ${
                activeTab === tab.id ? theme.colors.accent : theme.colors.border
              }`,
              color:
                activeTab === tab.id ? accentTextColor : theme.colors.textMuted,
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div>
          {/* Key Metrics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            {[
              {
                label: "Total Hours",
                value: `${totalHours}h`,
                color: theme.colors.accent,
              },
              {
                label: "Total Fasts",
                value: totalFasts,
                color: theme.colors.text,
              },
              {
                label: "Current Streak",
                value: `${currentStreak}d`,
                color:
                  currentStreak > 0
                    ? theme.colors.success
                    : theme.colors.textMuted,
              },
              {
                label: "Avg Duration",
                value: `${avgDurationHours}h ${avgDurationMins}m`,
                color: theme.colors.text,
              },
              {
                label: "Longest Fast",
                value: `${longestFastHours}h ${longestFastMins}m`,
                color: theme.colors.accent,
              },
              {
                label: "Completion",
                value: `${completionRate}%`,
                color:
                  completionRate >= 80
                    ? theme.colors.success
                    : theme.colors.text,
              },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: theme.colors.bgCard,
                  border: `1px solid ${theme.colors.border}`,
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: theme.colors.textMuted,
                    marginBottom: "8px",
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 600,
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Consistency Score */}
          <div
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: theme.colors.textMuted,
                    marginBottom: "4px",
                  }}
                >
                  Consistency Score
                </div>
                <div
                  style={{ fontSize: "13px", color: theme.colors.textMuted }}
                >
                  Based on frequency, streak, and completion
                </div>
              </div>
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: 700,
                  color:
                    consistencyScore >= 70
                      ? theme.colors.success
                      : consistencyScore >= 40
                      ? theme.colors.accent
                      : theme.colors.textMuted,
                }}
              >
                {consistencyScore}
              </div>
            </div>
            <div
              style={{
                height: "8px",
                backgroundColor: theme.colors.bg,
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${consistencyScore}%`,
                  height: "100%",
                  backgroundColor:
                    consistencyScore >= 70
                      ? theme.colors.success
                      : consistencyScore >= 40
                      ? theme.colors.accent
                      : theme.colors.textMuted,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>

          {/* Protocol Breakdown */}
          {protocolBreakdown.length > 0 && (
            <div
              style={{
                backgroundColor: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                padding: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: theme.colors.textMuted,
                  marginBottom: "20px",
                }}
              >
                Protocol Breakdown
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "24px",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div style={{ width: "120px", height: "120px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={protocolBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
                        paddingAngle={2}
                      >
                        {protocolBreakdown.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  {protocolBreakdown.map((protocol, i) => (
                    <div
                      key={protocol.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "2px",
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                      <div
                        style={{
                          flex: 1,
                          fontSize: "14px",
                          color: theme.colors.text,
                        }}
                      >
                        {protocol.name}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: theme.colors.text,
                        }}
                      >
                        {protocol.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRENDS TAB */}
      {activeTab === "trends" && (
        <div>
          {/* Daily Hours Chart */}
          <div
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: theme.colors.textMuted,
                marginBottom: "20px",
              }}
            >
              Daily Fasting Hours
            </div>
            <div style={{ height: "250px" }}>
              {dailyData.some((d) => d.hours > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.colors.border}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={theme.colors.textMuted}
                      fontSize={11}
                    />
                    <YAxis stroke={theme.colors.textMuted} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.colors.bgCard,
                        border: `1px solid ${theme.colors.border}`,
                        color: theme.colors.text,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke={theme.colors.accent}
                      fill={theme.colors.accent}
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.colors.textMuted,
                    fontSize: "13px",
                  }}
                >
                  No data for selected period
                </div>
              )}
            </div>
          </div>

          {/* Weekly Progress */}
          <div
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: theme.colors.textMuted,
                marginBottom: "20px",
              }}
            >
              Weekly Progress
            </div>
            <div style={{ height: "200px" }}>
              {weeklyTrendData.some((d) => d.hours > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.colors.border}
                    />
                    <XAxis
                      dataKey="week"
                      stroke={theme.colors.textMuted}
                      fontSize={11}
                    />
                    <YAxis stroke={theme.colors.textMuted} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.colors.bgCard,
                        border: `1px solid ${theme.colors.border}`,
                        color: theme.colors.text,
                      }}
                    />
                    <Bar
                      dataKey="hours"
                      fill={theme.colors.accent}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.colors.textMuted,
                    fontSize: "13px",
                  }}
                >
                  No data for selected period
                </div>
              )}
            </div>
          </div>

          {/* Calendar Heatmap */}
          <CalendarHeatmap
            fasts={fasts}
            months={
              dateRange === "all" || dateRange === "1y"
                ? 12
                : dateRange === "6m"
                ? 6
                : dateRange === "90d"
                ? 3
                : 2
            }
          />
        </div>
      )}

      {/* PATTERNS TAB */}
      {activeTab === "patterns" && (
        <div>
          {/* Day of Week */}
          <div
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: theme.colors.textMuted,
                marginBottom: "20px",
              }}
            >
              Fasting by Day of Week
            </div>
            <div style={{ height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.colors.border}
                  />
                  <XAxis
                    dataKey="day"
                    stroke={theme.colors.textMuted}
                    fontSize={11}
                  />
                  <YAxis stroke={theme.colors.textMuted} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.colors.bgCard,
                      border: `1px solid ${theme.colors.border}`,
                      color: theme.colors.text,
                    }}
                    formatter={(value) => [`${value}h`, "Total Hours"]}
                  />
                  <Bar
                    dataKey="hours"
                    fill={theme.colors.accent}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {bestDay.fasts > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  backgroundColor: theme.colors.bg,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: theme.colors.accent + "20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: theme.colors.text,
                    }}
                  >
                    Best Day: {bestDay.day}
                  </div>
                  <div
                    style={{ fontSize: "12px", color: theme.colors.textMuted }}
                  >
                    {bestDay.fasts} fasts, {bestDay.hours} total hours
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Time of Day */}
          <div
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: theme.colors.textMuted,
                marginBottom: "20px",
              }}
            >
              Preferred Start Time
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "12px",
              }}
            >
              {timeOfDayData.map((period) => {
                const isMax =
                  period.fasts ===
                    Math.max(...timeOfDayData.map((p) => p.fasts)) &&
                  period.fasts > 0;
                return (
                  <div
                    key={period.name}
                    style={{
                      padding: "16px",
                      backgroundColor: isMax
                        ? theme.colors.accent + "10"
                        : theme.colors.bg,
                      border: `1px solid ${
                        isMax ? theme.colors.accent : theme.colors.border
                      }`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: theme.colors.text,
                        marginBottom: "4px",
                      }}
                    >
                      {period.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: theme.colors.textMuted,
                        marginBottom: "8px",
                      }}
                    >
                      {period.range}
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: 600,
                        color: isMax ? theme.colors.accent : theme.colors.text,
                      }}
                    >
                      {period.fasts} fasts
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Frequency Stats */}
          <div
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              padding: "24px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: theme.colors.textMuted,
                marginBottom: "20px",
              }}
            >
              Fasting Frequency
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
                textAlign: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 600,
                    color: theme.colors.text,
                  }}
                >
                  {totalFasts > 0
                    ? (
                        totalFasts /
                        ((DATE_RANGES.find((r) => r.id === dateRange)?.days ||
                          30) /
                          7)
                      ).toFixed(1)
                    : "0"}
                </div>
                <div
                  style={{ fontSize: "12px", color: theme.colors.textMuted }}
                >
                  Fasts/Week
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 600,
                    color: theme.colors.text,
                  }}
                >
                  {totalFasts > 1
                    ? `${Math.round(
                        (DATE_RANGES.find((r) => r.id === dateRange)?.days ||
                          30) / totalFasts
                      )}d`
                    : "—"}
                </div>
                <div
                  style={{ fontSize: "12px", color: theme.colors.textMuted }}
                >
                  Avg Gap
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 600,
                    color: theme.colors.text,
                  }}
                >
                  {
                    new Set(
                      filteredFasts.map((f) =>
                        new Date(f.startTime).toDateString()
                      )
                    ).size
                  }
                </div>
                <div
                  style={{ fontSize: "12px", color: theme.colors.textMuted }}
                >
                  Days Active
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BODY TAB */}
      {activeTab === "body" && (
        <div>
          {canAccessFeature("weightTracking") ? (
            <div
              style={{
                backgroundColor: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: theme.colors.textMuted,
                      marginBottom: "4px",
                    }}
                  >
                    Weight Progress
                  </div>
                  {filteredWeightEntries.length >= 2 && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: theme.colors.textMuted,
                      }}
                    >
                      {startingWeight} → {currentWeightValue} {weightUnit} (
                      <span
                        style={{
                          color:
                            weightChange < 0
                              ? theme.colors.success
                              : theme.colors.text,
                        }}
                      >
                        {weightChange > 0 ? "+" : ""}
                        {weightChange.toFixed(1)}
                      </span>
                      )
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="Weight"
                    style={{
                      width: "80px",
                      backgroundColor: theme.colors.bg,
                      border: `1px solid ${theme.colors.border}`,
                      padding: "10px 12px",
                      color: theme.colors.text,
                      fontSize: "14px",
                    }}
                  />
                  <select
                    value={weightUnit}
                    onChange={(e) =>
                      setWeightUnit(e.target.value as "kg" | "lbs")
                    }
                    style={{
                      backgroundColor: theme.colors.bg,
                      border: `1px solid ${theme.colors.border}`,
                      padding: "10px 12px",
                      color: theme.colors.text,
                      fontSize: "14px",
                    }}
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                  <button
                    onClick={addWeightEntry}
                    style={{
                      padding: "10px 16px",
                      backgroundColor: theme.colors.accent,
                      border: "none",
                      color: accentTextColor,
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Log
                  </button>
                </div>
              </div>
              <div style={{ height: "250px" }}>
                {weightData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme.colors.border}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={theme.colors.textMuted}
                        fontSize={11}
                      />
                      <YAxis
                        stroke={theme.colors.textMuted}
                        fontSize={11}
                        domain={["dataMin - 2", "dataMax + 2"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.colors.bgCard,
                          border: `1px solid ${theme.colors.border}`,
                          color: theme.colors.text,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke={theme.colors.accent}
                        strokeWidth={2}
                        dot={{
                          fill: theme.colors.accent,
                          strokeWidth: 0,
                          r: 4,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: theme.colors.textMuted,
                      fontSize: "13px",
                    }}
                  >
                    Log your first weight to see progress
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                padding: "60px 40px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
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
                  stroke={theme.colors.textMuted}
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
                Body Tracking is a Pro Feature
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: theme.colors.textMuted,
                  marginBottom: "24px",
                  maxWidth: "300px",
                  margin: "0 auto 24px",
                  lineHeight: 1.5,
                }}
              >
                Track your weight over time and see how fasting affects your
                body.
              </p>
              <button
                onClick={() => promptUpgrade("weightTracking")}
                style={{
                  padding: "14px 28px",
                  backgroundColor: theme.colors.text,
                  border: "none",
                  color: theme.colors.bg,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      )}

      {/* INSIGHTS TAB */}
      {activeTab === "insights" && (
        <div>
          {insights.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {insights.map((insight, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: theme.colors.bgCard,
                    border: `1px solid ${
                      insight.type === "positive"
                        ? theme.colors.success + "50"
                        : insight.type === "suggestion"
                        ? "#F59E0B50"
                        : theme.colors.border
                    }`,
                    padding: "20px",
                    display: "flex",
                    gap: "16px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor:
                        insight.type === "positive"
                          ? theme.colors.success + "20"
                          : insight.type === "suggestion"
                          ? "#F59E0B20"
                          : theme.colors.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {insight.type === "positive" ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={theme.colors.success}
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : insight.type === "suggestion" ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={theme.colors.textMuted}
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: theme.colors.text,
                        marginBottom: "4px",
                      }}
                    >
                      {insight.title}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: theme.colors.textMuted,
                        lineHeight: 1.5,
                      }}
                    >
                      {insight.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                padding: "60px 40px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: theme.colors.bg,
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
                  stroke={theme.colors.textMuted}
                  strokeWidth="2"
                >
                  <line x1="9" y1="18" x2="15" y2="18" />
                  <line x1="10" y1="22" x2="14" y2="22" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
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
                No Insights Yet
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: theme.colors.textMuted,
                  maxWidth: "300px",
                  margin: "0 auto",
                  lineHeight: 1.5,
                }}
              >
                Complete more fasts to unlock personalized insights about your
                fasting patterns.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
