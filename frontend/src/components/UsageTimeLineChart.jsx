import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Calendar, TrendingUp } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// Format Y-axis tick values: in minutes mode format as 0m, 15m, 30m, 45m, 60m; in hours mode as 0h, 1h, 2h...
const formatYTick = (value, isMinutesMode) => {
  if (isMinutesMode) {
    const mins = Math.round(value * 60);
    return `${mins}m`;
  }
  return `${Math.round(value)}h`;
};

// Helper to format date string into DD/MM format (e.g., "2026-10-07" -> "07/10")
const formatDateToDayMonth = (dateStr) => {
  if (!dateStr) return "";
  const match = String(dateStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const month = match[2].padStart(2, "0");
    const day = match[3].padStart(2, "0");
    return `${day}/${month}`;
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  }
  return String(dateStr);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: "rgba(18, 18, 21, 0.96)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(12px)",
          padding: "12px 16px",
          borderRadius: "10px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6)",
          color: "#F9FAFB",
          minWidth: "150px",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "4px" }}>
          {data.day ? `${data.day} (${data.displayLabel})` : data.displayLabel}
        </div>
        <div style={{ color: "#94A3B8", fontSize: "0.75rem", marginBottom: "6px" }}>
          {data.date}
        </div>
        <div style={{ color: "#A78BFA", fontSize: "0.9rem", fontWeight: 600 }}>
          {data.hours} hrs ({data.duration_formatted})
        </div>
        <div style={{ color: "#94A3B8", fontSize: "0.8rem", marginTop: "2px" }}>
          {data.session_count} {data.session_count === 1 ? "session" : "sessions"}
        </div>
      </div>
    );
  }
  return null;
};

export const UsageTimeLineChart = ({ items = [], totalHours = 0, range = "7d" }) => {
  const { isDark } = useTheme();

  // Determine the max value so we know the ceiling on the Y-axis
  const maxHours = items.length > 0 ? Math.max(...items.map((d) => d.hours || 0)) : 0;
  if (!items || items.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "280px",
          color: "var(--text-muted)",
          fontSize: "0.9rem",
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "var(--radius-md)",
          border: "1px dashed var(--border-subtle)",
        }}
      >
        <TrendingUp size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
        <span>No daily timeline activity recorded</span>
      </div>
    );
  }

  // When usage is within 1 hour, scale in minutes (0m, 15m, 30m, 45m, 60m); otherwise scale in hours (1h, 2h, 3h...)
  const isMinutesMode = maxHours <= 1.0;

  const getYAxisConfig = (maxVal, isMinutes) => {
    if (isMinutes) {
      return {
        ticks: [0, 0.25, 0.5, 0.75, 1.0],
        domain: [0, 1.0],
      };
    }

    const ceiling = Math.max(1, Math.ceil(maxVal));
    let step = 1;
    if (ceiling > 24) step = 4;
    else if (ceiling > 12) step = 2;
    else step = 1;

    const ticks = [];
    for (let t = 0; t <= ceiling; t += step) {
      ticks.push(t);
    }
    if (ticks[ticks.length - 1] < ceiling) {
      ticks.push(ticks[ticks.length - 1] + step);
    }
    return {
      ticks,
      domain: [0, ticks[ticks.length - 1]],
    };
  };

  const { ticks: yTicks, domain: yDomain } = getYAxisConfig(maxHours, isMinutesMode);

  // For "today" use the `day` field ("0h", "1h", …); for multi-day use the formatted date
  const isToday = range === "today";
  const chartData = items.map((point) => {
    const formattedDate = isToday ? point.day : formatDateToDayMonth(point.date);
    return {
      ...point,
      displayLabel: formattedDate || (point.day ? point.day.substring(0, 3) : ""),
    };
  });

  return (
    <div>
      <div style={{ height: 280, width: "100%", marginTop: "10px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 18, left: 6, bottom: 5 }}
          >
            <defs>
              <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(124, 58, 237, 0.1)"}
              vertical={false}
            />
            <XAxis
              dataKey="displayLabel"
              stroke={isDark ? "rgba(167, 139, 250, 0.3)" : "rgba(124, 58, 237, 0.3)"}
              tick={{
                fill: isDark ? "#CBD5E1" : "#334155",
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
              }}
              tickLine={{ stroke: isDark ? "rgba(167, 139, 250, 0.25)" : "rgba(124, 58, 237, 0.25)" }}
              axisLine={{ stroke: isDark ? "rgba(167, 139, 250, 0.25)" : "rgba(124, 58, 237, 0.25)" }}
              minTickGap={isToday ? 0 : 14}
              interval={isToday ? 2 : "preserveStartEnd"}
            />
            <YAxis
              domain={yDomain}
              ticks={yTicks}
              allowDecimals={isMinutesMode}
              tickFormatter={(v) => formatYTick(v, isMinutesMode)}
              stroke={isDark ? "rgba(167, 139, 250, 0.45)" : "rgba(124, 58, 237, 0.45)"}
              tick={{
                fill: isDark ? "#C4B5FD" : "#7C3AED",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
              }}
              tickLine={{ stroke: isDark ? "rgba(167, 139, 250, 0.35)" : "rgba(124, 58, 237, 0.35)" }}
              axisLine={{ stroke: isDark ? "rgba(167, 139, 250, 0.35)" : "rgba(124, 58, 237, 0.35)" }}
              width={48}
              tickMargin={6}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#8B5CF6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#usageGradient)"
              activeDot={{
                r: 6,
                fill: "#06B6D4",
                stroke: "#FFFFFF",
                strokeWidth: 2,
              }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick summary below line chart */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          paddingTop: "14px",
          marginTop: "12px",
          borderTop: "1px solid var(--border-subtle)",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={14} color="var(--accent-purple)" />
          <span>{isToday ? "Hourly usage trend (TODAY)" : `Active Trend (${range.toUpperCase()})`}</span>
        </span>
        <span>{isToday ? "Avg/Hr:" : "Avg/Day:"} <strong className="font-satoshi-num" style={{ color: "var(--accent-purple)" }}>
          {items.length > 0 ? (totalHours / items.length).toFixed(2) : 0} hrs
        </strong></span>
      </div>
    </div>
  );
};
