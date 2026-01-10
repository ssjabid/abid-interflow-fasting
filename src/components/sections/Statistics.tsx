import { useState, useEffect, useMemo } from "react";
import type { Fast, WeightEntry } from "../../types";
import { PROTOCOLS } from "../../types";
import { useTheme } from "../../context/ThemeContext";
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
} from "recharts";

interface StatisticsProps {
  fasts: Fast[];
}

type DateRange = "7d" | "14d" | "30d" | "90d" | "6m" | "1y" | "all";

const DATE_RANGES: { id: DateRange; label: string; days: number | null }[] = [
  { id: "7d", label: "7 Days", days: 7 },
  { id: "14d", label: "14 Days", days: 14 },
  { id: "30d", label: "30 Days", days: 30 },
  { id: "90d", label: "90 Days", days: 90 },
  { id: "6m", label: "6 Months", days: 180 },
  { id: "1y", label: "1 Year", days: 365 },
  { id: "all", label: "All Time", days: null },
];

export default function Statistics({ fasts }: StatisticsProps) {
  const { theme } = useTheme();
  const accentTextColor = theme.accent === "default" ? "#0B0B0C" : "#FFFFFF";
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

  // Calculate statistics based on filtered fasts
  const totalHours = Math.floor(
    filteredFasts.reduce((sum, f) => sum + f.duration, 0) / 60
  );
  const totalFasts = filteredFasts.length;
  const avgDuration = totalFasts > 0 ? Math.floor(totalHours / totalFasts) : 0;
  const longestFast =
    filteredFasts.length > 0
      ? Math.max(...filteredFasts.map((f) => f.duration))
      : 0;

  // Streak calculation
  const calculateStreak = () => {
    const allCompleted = fasts.filter((f) => f.status === "completed");
    if (allCompleted.length === 0) return { current: 0, best: 0 };
    const sortedFasts = [...allCompleted].sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    let currentStreak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const fast of sortedFasts) {
      const fastDate = new Date(fast.startTime);
      fastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (currentDate.getTime() - fastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 1) {
        currentStreak++;
        currentDate = fastDate;
      } else break;
    }
    return { current: currentStreak, best: currentStreak };
  };

  const streaks = calculateStreak();

  // Chart data based on date range
  const getChartData = () => {
    const now = new Date();
    const data: { label: string; hours: number }[] = [];
    const range = DATE_RANGES.find((r) => r.id === dateRange);
    const days = range?.days || 365;

    if (days <= 14) {
      // Daily view
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        const dayFasts = filteredFasts.filter((f) => {
          const fd = new Date(f.startTime);
          return fd >= date && fd < nextDate;
        });
        const totalMins = dayFasts.reduce((sum, f) => sum + f.duration, 0);
        data.push({
          label: date.toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
          }),
          hours: Math.round((totalMins / 60) * 10) / 10,
        });
      }
    } else if (days <= 90) {
      // Weekly view
      const weeks = Math.ceil(days / 7);
      for (let i = weeks - 1; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 7);

        const weekFasts = filteredFasts.filter((f) => {
          const fd = new Date(f.startTime);
          return fd >= weekStart && fd < weekEnd;
        });
        const totalMins = weekFasts.reduce((sum, f) => sum + f.duration, 0);
        data.push({
          label: `W${weeks - i}`,
          hours: Math.round(totalMins / 60),
        });
      }
    } else {
      // Monthly view
      const months = Math.min(Math.ceil(days / 30), 12);
      for (let i = months - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const monthFasts = filteredFasts.filter((f) => {
          const fd = new Date(f.startTime);
          return fd >= monthStart && fd < monthEnd;
        });
        const totalMins = monthFasts.reduce((sum, f) => sum + f.duration, 0);
        data.push({
          label: monthStart.toLocaleDateString("en-US", { month: "short" }),
          hours: Math.round(totalMins / 60),
        });
      }
    }
    return data;
  };

  const getProtocolData = () => {
    const protocolCounts: Record<string, number> = {};
    filteredFasts.forEach((fast) => {
      const protocol = fast.protocol || "other";
      protocolCounts[protocol] = (protocolCounts[protocol] || 0) + 1;
    });
    return Object.entries(protocolCounts).map(([id, value]) => ({
      name: PROTOCOLS.find((p) => p.id === id)?.name || id,
      value,
    }));
  };

  const chartData = getChartData();
  const protocolData = getProtocolData();
  const PIE_COLORS = [
    theme.colors.accent,
    "#60A5FA",
    "#F59E0B",
    "#10B981",
    "#8B5CF6",
    "#EF4444",
  ];

  const filteredWeightEntries = useMemo(() => {
    const range = DATE_RANGES.find((r) => r.id === dateRange);
    if (!range || range.days === null) return weightEntries;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - range.days);

    return weightEntries.filter((e) => new Date(e.date) >= cutoffDate);
  }, [weightEntries, dateRange]);

  const weightData = filteredWeightEntries.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    weight: entry.weight,
  }));

  const startingWeight =
    filteredWeightEntries.length > 0 ? filteredWeightEntries[0].weight : 0;
  const currentWeight =
    filteredWeightEntries.length > 0
      ? filteredWeightEntries[filteredWeightEntries.length - 1].weight
      : 0;
  const weightChange = currentWeight - startingWeight;

  const currentRangeLabel =
    DATE_RANGES.find((r) => r.id === dateRange)?.label || "30 Days";

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header with Date Range Selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
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
          <p style={{ fontSize: "13px", color: theme.colors.textMuted }}>
            {totalFasts} fasts • {totalHours} hours in selected period
          </p>
        </div>

        {/* Date Range Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 16px",
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.text,
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = theme.colors.accent)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = showDateDropdown
                ? theme.colors.accent
                : theme.colors.border)
            }
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.textMuted}
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {currentRangeLabel}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.textMuted}
              strokeWidth="2"
              style={{
                transform: showDateDropdown ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showDateDropdown && (
            <>
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 10,
                }}
                onClick={() => setShowDateDropdown(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "4px",
                  backgroundColor: theme.colors.bgCard,
                  border: `1px solid ${theme.colors.border}`,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                  zIndex: 20,
                  minWidth: "160px",
                  overflow: "hidden",
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
                      padding: "12px 16px",
                      backgroundColor:
                        dateRange === range.id
                          ? theme.colors.accent + "15"
                          : "transparent",
                      border: "none",
                      borderLeft:
                        dateRange === range.id
                          ? `2px solid ${theme.colors.accent}`
                          : "2px solid transparent",
                      color:
                        dateRange === range.id
                          ? theme.colors.accent
                          : theme.colors.text,
                      fontSize: "13px",
                      fontWeight: dateRange === range.id ? 600 : 400,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (dateRange !== range.id) {
                        e.currentTarget.style.backgroundColor = theme.colors.bg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (dateRange !== range.id) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Stats */}
      <div
        className="top-stats-grid"
        style={{ backgroundColor: theme.colors.border, marginBottom: "32px" }}
      >
        {[
          { label: "Total Fasts", value: totalFasts.toString() },
          { label: "Total Hours", value: totalHours.toString() },
          { label: "Average", value: `${avgDuration}h` },
          { label: "Longest", value: `${Math.floor(longestFast / 60)}h` },
          { label: "Current Streak", value: `${streaks.current}d` },
          { label: "Best Streak", value: `${streaks.best}d` },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              backgroundColor: theme.colors.bg,
              padding: "20px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: theme.colors.textMuted,
                marginBottom: "6px",
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: theme.colors.accent,
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-grid" style={{ marginBottom: "32px" }}>
        {/* Fasting Hours Chart */}
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
            Fasting Hours
          </div>
          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme.colors.border}
                />
                <XAxis
                  dataKey="label"
                  stroke={theme.colors.textMuted}
                  fontSize={10}
                />
                <YAxis stroke={theme.colors.textMuted} fontSize={10} />
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
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Distribution */}
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
            Protocol Usage
          </div>
          <div style={{ height: "200px" }}>
            {protocolData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={protocolData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={35}
                    dataKey="value"
                    stroke="none"
                  >
                    {protocolData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const total = protocolData.reduce(
                          (sum, d) => sum + d.value,
                          0
                        );
                        const percent = ((data.value / total) * 100).toFixed(0);
                        return (
                          <div
                            style={{
                              backgroundColor: theme.colors.bgCard,
                              border: `1px solid ${theme.colors.border}`,
                              padding: "12px 16px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: theme.colors.text,
                                marginBottom: "4px",
                              }}
                            >
                              {data.name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: theme.colors.textMuted,
                              }}
                            >
                              {data.value} fasts • {percent}%
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
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
                No data yet
              </div>
            )}
          </div>
          {/* Legend */}
          {protocolData.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "16px",
                justifyContent: "center",
              }}
            >
              {protocolData.map((item, index) => (
                <div
                  key={item.name}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                      borderRadius: "2px",
                    }}
                  />
                  <span
                    style={{ fontSize: "12px", color: theme.colors.textMuted }}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div style={{ marginBottom: "32px" }}>
        <CalendarHeatmap
          fasts={fasts}
          months={
            dateRange === "all"
              ? 12
              : dateRange === "1y"
              ? 12
              : dateRange === "6m"
              ? 6
              : dateRange === "90d"
              ? 3
              : 2
          }
        />
      </div>

      {/* Weight Tracking */}
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
              <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
                {startingWeight} → {currentWeight} {weightUnit} (
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
              onChange={(e) => setWeightUnit(e.target.value as "kg" | "lbs")}
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
        <div style={{ height: "200px" }}>
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
                  dot={{ fill: theme.colors.accent, strokeWidth: 0, r: 3 }}
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
              Log your first weight to see your progress
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
