import { useMemo } from "react";
import type { Fast } from "../../types";
import { useTheme } from "../../context/ThemeContext";

interface CalendarHeatmapProps {
  fasts: Fast[];
  months?: number;
}

export default function CalendarHeatmap({
  fasts,
  months = 6,
}: CalendarHeatmapProps) {
  const { theme } = useTheme();

  const heatmapData = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);

    // Create a map of date -> hours fasted
    const dateMap: Record<string, number> = {};

    fasts
      .filter((f) => f.status === "completed")
      .forEach((fast) => {
        const date = new Date(fast.startTime);
        const dateKey = date.toISOString().split("T")[0];
        dateMap[dateKey] = (dateMap[dateKey] || 0) + fast.duration / 60;
      });

    // Generate all days in the range
    const days: { date: Date; hours: number; dateKey: string }[] = [];
    const current = new Date(startDate);

    while (current <= now) {
      const dateKey = current.toISOString().split("T")[0];
      days.push({
        date: new Date(current),
        hours: dateMap[dateKey] || 0,
        dateKey,
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [fasts, months]);

  // Group by weeks for display
  const weeks = useMemo(() => {
    const result: (typeof heatmapData)[] = [];
    let currentWeek: typeof heatmapData = [];

    // Pad the first week with empty days
    const firstDayOfWeek = heatmapData[0]?.date.getDay() || 0;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: new Date(0), hours: -1, dateKey: "" });
    }

    heatmapData.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [heatmapData]);

  const getIntensity = (hours: number): number => {
    if (hours <= 0) return 0;
    if (hours < 8) return 1;
    if (hours < 16) return 2;
    if (hours < 20) return 3;
    return 4;
  };

  const getColor = (intensity: number): string => {
    if (intensity === 0) return theme.colors.bgCard;
    const baseColor = theme.colors.accent;
    const opacities = ["20", "40", "70", "FF"];
    return baseColor + opacities[intensity - 1];
  };

  const monthLabels = useMemo(() => {
    const labels: { month: string; index: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find((d) => d.hours >= 0);
      if (firstValidDay && firstValidDay.date.getMonth() !== lastMonth) {
        lastMonth = firstValidDay.date.getMonth();
        labels.push({
          month: firstValidDay.date.toLocaleDateString("en-US", {
            month: "short",
          }),
          index: weekIndex,
        });
      }
    });

    return labels;
  }, [weeks]);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const totalFastingDays = heatmapData.filter((d) => d.hours > 0).length;
  const totalHours = Math.round(
    heatmapData.reduce((sum, d) => sum + d.hours, 0)
  );

  return (
    <div
      style={{
        backgroundColor: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        padding: "24px",
      }}
    >
      {/* Header */}
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
            Fasting Activity
          </div>
          <div style={{ fontSize: "13px", color: theme.colors.textSecondary }}>
            {totalFastingDays} days • {totalHours} hours
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: theme.colors.textMuted }}>
            Less
          </span>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <div
              key={intensity}
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: getColor(intensity),
                border:
                  intensity === 0 ? `1px solid ${theme.colors.border}` : "none",
                borderRadius: "2px",
              }}
            />
          ))}
          <span style={{ fontSize: "11px", color: theme.colors.textMuted }}>
            More
          </span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div
        className="scrollbar-hide"
        style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
      >
        <div style={{ display: "flex", gap: "3px", minWidth: "fit-content" }}>
          {/* Day labels */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              marginRight: "8px",
              paddingTop: "20px",
            }}
          >
            {dayLabels.map((day, i) => (
              <div
                key={day}
                style={{
                  height: "12px",
                  fontSize: "9px",
                  color: theme.colors.textMuted,
                  display: i % 2 === 1 ? "flex" : "none",
                  alignItems: "center",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Month labels */}
            <div
              style={{ display: "flex", height: "16px", marginBottom: "4px" }}
            >
              {weeks.map((_, weekIndex) => {
                const label = monthLabels.find((l) => l.index === weekIndex);
                return (
                  <div
                    key={weekIndex}
                    style={{
                      width: "15px",
                      fontSize: "10px",
                      color: theme.colors.textMuted,
                      textAlign: "left",
                    }}
                  >
                    {label?.month || ""}
                  </div>
                );
              })}
            </div>

            {/* Days grid */}
            <div style={{ display: "flex", gap: "3px" }}>
              {weeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      title={
                        day.hours >= 0
                          ? `${day.date.toLocaleDateString()}: ${day.hours.toFixed(
                              1
                            )}h`
                          : ""
                      }
                      style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor:
                          day.hours < 0
                            ? "transparent"
                            : getColor(getIntensity(day.hours)),
                        border:
                          day.hours === 0
                            ? `1px solid ${theme.colors.border}`
                            : "none",
                        borderRadius: "2px",
                        cursor: day.hours >= 0 ? "pointer" : "default",
                        transition:
                          "transform 0.15s ease, box-shadow 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (day.hours >= 0) {
                          e.currentTarget.style.transform = "scale(1.3)";
                          e.currentTarget.style.boxShadow = `0 0 8px ${theme.colors.accent}50`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
