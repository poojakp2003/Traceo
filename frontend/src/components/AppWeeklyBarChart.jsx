import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Calendar } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { DateNavigator, isSameDay, formatDateISO } from "./DateNavigator";

export const AppWeeklyBarChart = ({
  selectedApp,
  selectedDate,
  onSelectDate,
  weeklyData = [],
  loading = false,
}) => {
  const { isDark } = useTheme();

  const appName = selectedApp?.name || "Application";
  const appColor = selectedApp?.color || "#8B5CF6";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compute Sunday of the week containing selectedDate
  const currentSelected = new Date(selectedDate);
  currentSelected.setHours(0, 0, 0, 0);
  const dayOfWeek = currentSelected.getDay(); // 0 is Sunday, 6 is Saturday
  const sunday = new Date(currentSelected);
  sunday.setDate(currentSelected.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build the 7 days (Sun - Sat)
  const chartData = [];
  let totalWeeklySeconds = 0;

  for (let i = 0; i < 7; i++) {
    const curDate = new Date(sunday);
    curDate.setDate(sunday.getDate() + i);
    curDate.setHours(0, 0, 0, 0);

    const dateStr = formatDateISO(curDate);
    const isCurrentDayToday = isSameDay(curDate, today);
    const isFuture = curDate.getTime() > today.getTime() && !isCurrentDayToday;
    const isSelected = isSameDay(curDate, currentSelected);

    // Find timeline point for this date if present
    const point = weeklyData.find((p) => p.date === dateStr);
    const duration_seconds = (!isFuture && point) ? (point.duration_seconds || 0) : 0;
    const hours = (!isFuture && point)
      ? (point.hours !== undefined ? point.hours : Number((duration_seconds / 3600).toFixed(2)))
      : 0;
    const duration_formatted = point?.duration_formatted || (duration_seconds > 0 ? `${Math.round(duration_seconds / 60)} mins` : "0 mins");

    if (!isFuture) {
      totalWeeklySeconds += duration_seconds;
    }

    const monthShort = curDate.toLocaleDateString("en-US", { month: "short" });
    const dayNum = curDate.getDate();
    const weekdayShort = DAY_NAMES[i];

    chartData.push({
      dateObj: curDate,
      dateStr,
      dayName: DAY_NAMES[i],
      tooltipDateLabel: `${weekdayShort}, ${monthShort} ${dayNum}`,
      duration_seconds,
      hours: isFuture ? 0 : hours,
      duration_formatted,
      isFuture,
      isSelected,
      isToday: isCurrentDayToday,
    });
  }

  // Find duration for the selected day
  const selectedDayItem = chartData.find((d) => d.isSelected);
  const selectedDayDurationFormatted = selectedDayItem ? selectedDayItem.duration_formatted : "0 mins";
  const isSelectedDayToday = isSameDay(currentSelected, today);

  // Auto-scale Y-axis ceiling: 0h, 1h, 2h...
  const maxHours = Math.max(...chartData.map((d) => (d.isFuture ? 0 : d.hours || 0)), 0);
  const ceiling = Math.max(2, Math.ceil(maxHours));
  let step = 1;
  if (ceiling > 12) step = 2;
  if (ceiling > 24) step = 4;

  const yTicks = [];
  for (let t = 0; t <= ceiling; t += step) {
    yTicks.push(t);
  }
  if (yTicks[yTicks.length - 1] < ceiling) {
    yTicks.push(yTicks[yTicks.length - 1] + step);
  }
  const yDomain = [0, yTicks[yTicks.length - 1]];

  // Average per day calculation across the 7 days of the week
  const avgHrsPerDay = (totalWeeklySeconds / 3600 / 7).toFixed(2);

  // Custom Bar Shape for rounded tops and flat placeholder for 0-duration days
  const renderCustomBar = (props) => {
    const { x, y, width, height, payload } = props;
    if (!payload || payload.isFuture) {
      return null; // Future days show no data
    }

    const isSelected = payload.isSelected;
    const opacity = isSelected ? 1.0 : 0.45;
    const barWidth = Math.min(width, 34);
    const barX = x + (width - barWidth) / 2;

    if (payload.duration_seconds <= 0) {
      // Days with no usage show a thin flat placeholder at baseline
      return (
        <rect
          x={barX}
          y={y - 2}
          width={barWidth}
          height={3}
          rx={1.5}
          ry={1.5}
          fill={appColor}
          fillOpacity={isSelected ? 0.9 : 0.4}
          style={{ cursor: "pointer" }}
        />
      );
    }

    const r = Math.min(5, barWidth / 2, Math.max(0, height));
    const path = `
      M ${barX},${y + r}
      Q ${barX},${y} ${barX + r},${y}
      L ${barX + barWidth - r},${y}
      Q ${barX + barWidth},${y} ${barX + barWidth},${y + r}
      L ${barX + barWidth},${y + height}
      L ${barX},${y + height}
      Z
    `;

    return (
      <path
        d={path}
        fill={appColor}
        fillOpacity={opacity}
        style={{
          cursor: "pointer",
          transition: "fill-opacity 0.2s ease",
        }}
      />
    );
  };

  // Custom Tooltip component matching dark theme
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.isFuture) return null;

      return (
        <div
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(12px)",
            padding: "10px 14px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
            color: "#F9FAFB",
            minWidth: "140px",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: "3px" }}>
            {data.tooltipDateLabel}
          </div>
          {data.duration_seconds > 0 ? (
            <div style={{ color: appColor, fontSize: "0.85rem", fontWeight: 600 }}>
              {data.duration_formatted} ({data.hours} hrs)
            </div>
          ) : (
            <div style={{ color: "#94A3B8", fontSize: "0.82rem" }}>
              No usage recorded
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card-content-fade" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* 1. Header row: app color swatch and name, then selected day's total time + 'Today' if today */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "10px",
          minHeight: "32px",
        }}
      >
        {/* Left: App color swatch and name */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "3px",
              backgroundColor: appColor,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {appName}
          </span>
        </div>

        {/* Right: selected day's total time with 'Today' beside it when today */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span
            className="font-satoshi-num"
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {selectedDayDurationFormatted}
          </span>
          {isSelectedDayToday && (
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Today
            </span>
          )}
        </div>
      </div>

      {/* 2. Bar chart: 7 bars (Sun to Sat), single color, rounded tops, right-oriented y-axis */}
      <div style={{ height: 200, width: "100%", position: "relative" }}>
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(2px)",
              zIndex: 10,
              borderRadius: "8px",
            }}
          >
            <div className="skeleton" style={{ width: "90%", height: "80%" }} />
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length) {
                const item = state.activePayload[0].payload;
                if (!item.isFuture && onSelectDate) {
                  onSelectDate(item.dateObj);
                }
              }
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}
            />
            <XAxis
              dataKey="dayName"
              stroke={isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"}
              tick={{
                fill: isDark ? "#CBD5E1" : "#334155",
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
              }}
              tickLine={false}
              axisLine={{ stroke: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)" }}
            />
            <YAxis
              orientation="right"
              domain={yDomain}
              ticks={yTicks}
              allowDecimals={false}
              tickFormatter={(v) => `${Math.round(v)}h`}
              stroke={isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"}
              tick={{
                fill: isDark ? "#94A3B8" : "#64748B",
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
              }}
              tickLine={false}
              axisLine={{ stroke: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)" }}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.03)" }} />
            <Bar
              dataKey="hours"
              shape={renderCustomBar}
              animationDuration={500}
              onClick={(item) => {
                if (item && !item.isFuture && onSelectDate) {
                  onSelectDate(item.dateObj);
                }
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Date navigator BELOW the graph, centered */}
      <DateNavigator selectedDate={selectedDate} onSelectDate={onSelectDate} />

      {/* 4. Footer: Active Trend (<app name>) and Avg/Day: <hrs> */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          paddingTop: "14px",
          marginTop: "8px",
          borderTop: "1px solid var(--border-subtle)",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={14} color={appColor} />
          <span>Active Trend ({appName})</span>
        </span>
        <span>
          Avg/Day:{" "}
          <strong className="font-satoshi-num" style={{ color: appColor }}>
            {avgHrsPerDay} hrs
          </strong>
        </span>
      </div>
    </div>
  );
};

