import React from "react";
import { Loader2, Moon, Sun } from "lucide-react";

/**
 * CapsuleSwitch
 * A high-polish modern capsule toggle switch with smooth left/right sliding thumb animation.
 *
 * @param {boolean} checked - True when the knob points to the right, false when it points to the left
 * @param {function} onChange - Callback when toggled
 * @param {boolean} disabled - Whether the toggle is disabled
 * @param {boolean} loading - Whether the toggle is in a loading/saving state
 * @param {'tracking' | 'theme'} variant - Visual color styling
 * @param {string} ariaLabel - Accessibility label
 */
export const CapsuleSwitch = ({
  checked = false,
  onChange,
  disabled = false,
  loading = false,
  variant = "tracking",
  ariaLabel = "Toggle switch",
}) => {
  const handleClick = (e) => {
    e.preventDefault();
    if (disabled || loading) return;
    if (onChange) onChange(!checked);
  };

  const handleKeyDown = (e) => {
    if (disabled || loading) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (onChange) onChange(!checked);
    }
  };

  const isTheme = variant === "theme";

  // Build classes based on variant & checked state
  const trackClasses = [
    "capsule-switch",
    isTheme ? "theme-switch-capsule" : "tracking-switch-capsule",
    isTheme
      ? checked
        ? "theme-dark" // Pointing right: Default Dark
        : "theme-light" // Pointing left: White Theme
      : checked
      ? "tracking-on" // Pointing right: ON
      : "tracking-off", // Pointing left: OFF
    loading ? "is-loading" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="capsule-switch-wrapper"
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      aria-checked={checked}
      style={{
        display: "inline-flex",
        alignItems: "center",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        userSelect: "none",
      }}
    >
      {/* The Capsule Track */}
      <div className={trackClasses}>
        {/* Sliding Thumb Knob */}
        <div className="capsule-knob">
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : isTheme ? (
            checked ? (
              <Moon size={12} strokeWidth={2.4} />
            ) : (
              <Sun size={13} strokeWidth={2.4} />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CapsuleSwitch;
