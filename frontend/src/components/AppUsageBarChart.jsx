import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Clock, Layers } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const BAR_COLORS = [
  "#06B6D4", // Cyan
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
];

// Custom Tooltip component for Dark Glassmorphism aesthetic
const CustomTooltip = ({ active, payload, isHoursMode }) => {
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
          minWidth: "160px",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "4px" }}>
          {data.app_name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#22D3EE", fontSize: "0.85rem", marginBottom: "2px" }}>
          <Clock size={14} />
          <span>
            {data.duration_formatted} ({data.displayValue} {isHoursMode ? "hrs" : "mins"})
          </span>
        </div>
        <div style={{ color: "#94A3B8", fontSize: "0.8rem" }}>
          {data.session_count} {data.session_count === 1 ? "session" : "sessions"} • {data.percentage}%
        </div>
      </div>
    );
  }
  return null;
};

export const AppUsageBarChart = ({ items = [], totalDurationFormatted = "0 mins" }) => {
  const { isDark } = useTheme();

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
        <Layers size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
        <span>No application usage data recorded for this period</span>
      </div>
    );
  }

  // Find top timed app duration
  const topAppDurationSeconds = Math.max(
    ...items.slice(0, 8).map((item) => item.duration_seconds || 0),
    0
  );

  // If top timed app reaches 1 hour (>= 3600 seconds), convert X-axis to hours; otherwise show in minutes
  const isHoursMode = topAppDurationSeconds >= 3600;

  const chartData = items.slice(0, 8).map((item) => {
    const sec = item.duration_seconds || 0;
    const displayValue = isHoursMode
      ? Number((sec / 3600).toFixed(2))
      : Number((sec / 60).toFixed(1));
    return {
      ...item,
      displayValue,
    };
  });

  const maxDisplayVal = Math.max(
    ...chartData.map((d) => d.displayValue || 0),
    0
  );

  // Compute clean whole number ticks (e.g. 0, 1, 2, 3...)
  const getWholeNumberTicks = (maxVal, isHours) => {
    if (isHours) {
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
      return ticks;
    } else {
      const ceiling = Math.max(5, Math.ceil(maxVal / 5) * 5);
      const step = ceiling > 30 ? 10 : 5;
      const ticks = [];
      for (let t = 0; t <= ceiling; t += step) {
        ticks.push(t);
      }
      return ticks;
    }
  };

  const xTicks = getWholeNumberTicks(maxDisplayVal, isHoursMode);
  const xDomain = [0, xTicks[xTicks.length - 1]];

  return (
    <div>
      <div style={{ height: 280, width: "100%", marginTop: "10px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 24, left: 8, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(8, 145, 178, 0.1)"}
            />
            <XAxis
              type="number"
              dataKey="displayValue"
              domain={xDomain}
              ticks={xTicks}
              allowDecimals={false}
              tickFormatter={(val) => (isHoursMode ? `${Math.round(val)}h` : `${Math.round(val)}m`)}
              stroke={isDark ? "rgba(6, 182, 212, 0.45)" : "rgba(8, 145, 178, 0.45)"}
              tick={{
                fill: isDark ? "#38BDF8" : "#0891B2",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
              }}
              tickLine={{ stroke: isDark ? "rgba(6, 182, 212, 0.35)" : "rgba(8, 145, 178, 0.35)" }}
              axisLine={{ stroke: isDark ? "rgba(6, 182, 212, 0.35)" : "rgba(8, 145, 178, 0.35)" }}
            />
            <YAxis
              dataKey="app_name"
              type="category"
              stroke={isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"}
              tick={{
                fill: isDark ? "#CBD5E1" : "#334155",
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
              }}
              tickLine={false}
              axisLine={{ stroke: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)" }}
              width={82}
              tickFormatter={(name) => (name && name.length > 12 ? `${name.slice(0, 11)}…` : name)}
            />
            <Tooltip
              content={<CustomTooltip isHoursMode={isHoursMode} />}
              cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
            />
            <Bar
              dataKey="displayValue"
              radius={[0, 6, 6, 0]}
              barSize={18}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick summary below bar chart */}
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
        <span>Top App: <strong style={{ color: "var(--text-primary)" }}>{items[0]?.app_name || "N/A"}</strong></span>
        <span>Total: <strong className="font-satoshi-num" style={{ color: "var(--primary)" }}>{totalDurationFormatted}</strong></span>
      </div>
    </div>
  );
};
