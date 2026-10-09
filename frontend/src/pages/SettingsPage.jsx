import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AppWindow,
  CheckCircle2,
  Globe,
  Palette,
  RefreshCw,
  Sun,
  Moon,
  Youtube,
  Zap,
} from "lucide-react";
import { getPermissions, updatePermissions } from "../api/permissions";
import { Navbar } from "../components/Navbar";
import { CapsuleSwitch } from "../components/CapsuleSwitch";
import { useTheme } from "../context/ThemeContext";

export const SettingsPage = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingField, setUpdatingField] = useState(null);
  const [toast, setToast] = useState(null); // { message: string, type: 'on' | 'off', exiting?: boolean }
  const [errorMsg, setErrorMsg] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toastTimerRef = useRef(null);
  const dismissTimerRef = useRef(null);

  const dismissToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setToast((prev) => (prev ? { ...prev, exiting: true } : null));
    dismissTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 650);
  };

  const showToast = (message, type) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setToast({ message, type, exiting: false });

    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, exiting: true } : null));
      dismissTimerRef.current = setTimeout(() => {
        setToast(null);
      }, 650);
    }, 3200);
  };

  const loadPermissions = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    setErrorMsg("");
    try {
      // React -> GET /permissions -> FastAPI -> Database
      const data = await getPermissions();
      setPermissions(data);
    } catch (err) {
      console.error("Failed to load permissions:", err);
      setErrorMsg("Failed to retrieve tracking permissions from server. Please retry.");
    } finally {
      setLoading(false);
      if (showRefreshIndicator) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  };

  useEffect(() => {
    loadPermissions();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const handleToggle = async (field, currentVal, label) => {
    if (updatingField) return;

    setUpdatingField(field);
    setErrorMsg("");

    const newValue = !currentVal;

    try {
      // React -> PUT /permissions -> FastAPI -> PostgreSQL
      const updated = await updatePermissions({ [field]: newValue });
      setPermissions(updated);

      // Short message like "App tracking on" or "App tracking off"
      const shortPrefix = label.replace(/\s*Tracking/i, "");
      const shortText = `${shortPrefix} tracking ${newValue ? "on" : "off"}`;

      showToast(shortText, newValue ? "on" : "off");
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
      setErrorMsg(`Failed to update ${label}. Please try again.`);
    } finally {
      setUpdatingField(null);
    }
  };

  const trackingOptions = [
    {
      id: "app_tracking",
      title: "App Tracking",
      description:
        "Monitors desktop applications in use and session durations (e.g. IDEs, terminal, productivity tools).",
      icon: AppWindow,
      color: "var(--primary)",
      colorBg: "rgba(6, 182, 212, 0.12)",
    },
    {
      id: "browser_tracking",
      title: "Browser Tracking",
      description:
        "Logs visited websites and active domain navigation via the browser extension watcher.",
      icon: Globe,
      color: "var(--accent-purple)",
      colorBg: "rgba(139, 92, 246, 0.12)",
    },
    {
      id: "youtube_tracking",
      title: "YouTube Tracking",
      description:
        "Analyzes YouTube video titles, video IDs, and playback time metrics for video consumption.",
      icon: Youtube,
      color: "var(--accent-rose)",
      colorBg: "rgba(244, 63, 94, 0.12)",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
      <Navbar />

      {/* Top-Right Small Box Toast Notification (positioned directly below email and Logout) */}
      {toast && (
        <div
          className={`toast-small-box ${toast.type === "on" ? "toast-on" : "toast-off"} ${
            toast.exiting ? "toast-exiting" : ""
          }`}
          onClick={dismissToast}
          title="Click to dismiss"
        >
          {toast.type === "on" ? (
            <CheckCircle2 size={16} strokeWidth={2.5} color="#FFFFFF" />
          ) : (
            <AlertCircle size={16} strokeWidth={2.5} color="#FFFFFF" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <main className="container animate-fade-in" style={{ maxWidth: "860px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" }}>
              <h1 style={{ fontSize: "clamp(1.4rem, 3.5vw, 1.65rem)" }}>Settings</h1>
              <span className="badge badge-cyan" style={{ fontSize: "0.7rem" }}>
                Live Control
              </span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              Manage automated data collection permissions, visual theme, and agent ingestion policies.
            </p>
          </div>

          <button
            onClick={() => loadPermissions(true)}
            disabled={loading || isRefreshing}
            className="btn btn-secondary"
            style={{ fontSize: "0.82rem", padding: "6px 12px", minHeight: "38px", display: "flex", alignItems: "center", gap: "6px" }}
            title="Reload current permissions from database"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin-slow" : ""} />
            <span>Sync</span>
          </button>
        </div>

        {errorMsg && (
          <div className="toast-banner toast-error" style={{ marginBottom: "14px", padding: "10px 14px", wordBreak: "break-word" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: "0.85rem" }}>{errorMsg}</span>
            </div>
            <button
              onClick={() => loadPermissions()}
              style={{
                background: "transparent",
                border: "none",
                color: "#FB7185",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "0.8rem",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Theme & Appearance Card */}
        <div className="glass-card" style={{ padding: "clamp(14px, 3vw, 22px)", marginBottom: "16px" }}>
          {/* Section Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
              paddingBottom: "8px",
              borderBottom: "1px solid var(--border-subtle)",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                <Palette size={18} color="var(--primary)" />
                <h2 style={{ fontSize: "1.15rem" }}>Appearance & Theme</h2>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                Customize interface colors between dark space aesthetic and crisp white theme view.
              </p>
            </div>
          </div>

          {/* White Theme Capsule Switch Row */}
          <div className="settings-row-card">
            {/* Left: Icon and Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  backgroundColor: isDark ? "rgba(6, 182, 212, 0.12)" : "rgba(245, 158, 11, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background-color 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {isDark ? (
                  <Moon size={18} color="var(--primary)" />
                ) : (
                  <Sun size={18} color="var(--accent-amber)" />
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    White Theme View
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: "1.3" }}>
                  Toggle between the default dark space theme (pointing right) and the clean white theme view (pointing left).
                </p>
              </div>
            </div>

            {/* Right: Small Capsule Switch for Theme */}
            <CapsuleSwitch
              checked={isDark}
              onChange={toggleTheme}
              variant="theme"
              ariaLabel="Toggle White Theme View"
            />
          </div>
        </div>

        {/* 2. Tracking Settings Main Card */}
        <div className="glass-card" style={{ padding: "clamp(14px, 3vw, 22px)", marginBottom: "0px" }}>
          {/* Section Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
              paddingBottom: "8px",
              borderBottom: "1px solid var(--border-subtle)",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                <Zap size={18} color="var(--primary)" />
                <h2 style={{ fontSize: "1.15rem" }}>Tracking Settings</h2>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                Real-time switches for desktop agent, browser extension, and YouTube tracking.
              </p>
            </div>
          </div>

          {/* Settings Items */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div className="skeleton" style={{ height: "54px" }} />
              <div className="skeleton" style={{ height: "54px" }} />
              <div className="skeleton" style={{ height: "54px" }} />
            </div>
          ) : permissions ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {trackingOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isEnabled = Boolean(permissions[opt.id]);
                const isUpdating = updatingField === opt.id;

                return (
                  <div key={opt.id} className="settings-row-card">
                    {/* Left: Icon and Labels */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor: opt.colorBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <IconComponent size={18} color={opt.color} />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                            {opt.title}
                          </span>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: "1.3" }}>
                          {opt.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Same Capsule Switch for good looking ON and OFF toggle */}
                    <CapsuleSwitch
                      checked={isEnabled}
                      onChange={() => handleToggle(opt.id, isEnabled, opt.title)}
                      disabled={isUpdating}
                      loading={isUpdating}
                      variant="tracking"
                      ariaLabel={`Toggle ${opt.title}`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              No permission record found. Click Refresh to initialize.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
