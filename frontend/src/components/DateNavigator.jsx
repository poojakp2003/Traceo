import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const formatDateISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const formatDateNavigator = (date, isToday) => {
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  if (isToday) {
    return `Today, ${month} ${day}`;
  }
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday}, ${month} ${day}`;
};

export const DateNavigator = ({ selectedDate, onSelectDate }) => {
  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const handlePrevDay = (e) => {
    e.stopPropagation();
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onSelectDate(prev);
  };

  const handleNextDay = (e) => {
    e.stopPropagation();
    if (isToday) return;
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onSelectDate(next);
  };

  const formattedText = formatDateNavigator(selectedDate, isToday);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        marginTop: "10px",
        marginBottom: "6px",
      }}
    >
      <button
        type="button"
        onClick={handlePrevDay}
        aria-label="Previous day"
        title="Previous day"
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "6px",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
          transition: "all 0.15s ease",
          outline: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.22)";
        }}
      >
        <ChevronLeft size={15} color="#FFFFFF" />
      </button>

      <span
        style={{
          fontSize: "0.95rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "0.01em",
          userSelect: "none",
          minWidth: "115px",
          textAlign: "center",
        }}
      >
        {formattedText}
      </span>

      <button
        type="button"
        onClick={handleNextDay}
        disabled={isToday}
        aria-label="Next day"
        title={isToday ? "Cannot navigate into future" : "Next day"}
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "6px",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isToday ? "not-allowed" : "pointer",
          opacity: isToday ? 0.3 : 1,
          padding: 0,
          transition: "all 0.15s ease",
          outline: "none",
        }}
        onMouseEnter={(e) => {
          if (!isToday) {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isToday) {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.22)";
          }
        }}
      >
        <ChevronRight size={15} color="#FFFFFF" />
      </button>
    </div>
  );
};

