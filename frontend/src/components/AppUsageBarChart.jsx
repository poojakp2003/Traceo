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
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(12px)",
          padding: "12px 16px",
          borderRadius: "10px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
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

  return (
    <div>
      <div style={{ height: 280, width: "100%", marginTop: "10px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="rgba(255, 255, 255, 0.06)"
            />
            <XAxis
              type="number"
              dataKey="displayValue"
              tickFormatter={(val) => (isHoursMode ? `${val}h` : `${val}m`)}
              stroke="#64748B"
              fontSize={11}
              fontFamily="var(--font-satoshi), 'Satoshi', sans-serif"
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
            />
            <YAxis
              dataKey="app_name"
              type="category"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
              width={76}
              tickFormatter={(name) => (name && name.length > 10 ? `${name.slice(0, 9)}…` : name)}
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
