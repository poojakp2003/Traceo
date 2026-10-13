import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Globe,
  HelpCircle,
  Key,
  Laptop,
  Lock,
  LogOut,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Youtube,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth, CURRENT_INSTRUCTIONS_VERSION } from "../context/AuthContext";

export const InstructionsPage = () => {
  const { user, acceptInstructions, logout, hasAcceptedInstructions } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAccept = async () => {
    if (!agreed && !hasAcceptedInstructions) return;
    setError("");
    setSubmitting(true);

    try {
      await acceptInstructions(CURRENT_INSTRUCTIONS_VERSION);
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to accept instructions:", err);
      const detail =
        err.response?.data?.detail || "Failed to record acceptance. Please try again.";
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      await logout();
      navigate("/login?instructions_declined=true");
    } catch (err) {
      console.error("Error during decline logout:", err);
      navigate("/login?instructions_declined=true");
    } finally {
      setDeclining(false);
    }
  };

  const formattedAcceptedDate = user?.instructions_accepted_at || user?.acceptedAt
    ? new Date(user.instructions_accepted_at || user.acceptedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
      {hasAcceptedInstructions && <Navbar />}

      <div
        style={{
          padding: "clamp(20px, 4vw, 40px) clamp(16px, 4vw, 24px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "960px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Header Hero */}
        <div
          className="glass-card"
          style={{
            padding: "clamp(24px, 5vw, 36px)",
            borderRadius: "var(--radius-lg)",
            position: "relative",
            overflow: "hidden",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #06B6D4, #8B5CF6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 24px rgba(6, 182, 212, 0.4)",
                  flexShrink: 0,
                }}
              >
                <Activity size={28} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 700, margin: 0 }}>
                    Traceo Tracker Guidelines
                  </h1>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: "rgba(6, 182, 212, 0.15)",
                      color: "var(--primary)",
                      border: "1px solid rgba(6, 182, 212, 0.3)",
                    }}
                  >
                    Version {CURRENT_INSTRUCTIONS_VERSION}
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "0.95rem" }}>
                  Please review how tracking works, what data is collected, and how your privacy is protected.
                </p>
              </div>
            </div>

            {user?.email && (
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  background: "var(--bg-item-row)",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Logged in as: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{user.email}</span>
              </div>
            )}
          </div>

          {/* Acceptance Status Banner if already accepted */}
          {hasAcceptedInstructions && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px 18px",
                borderRadius: "var(--radius-md)",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckCircle2 size={20} color="#10B981" />
                <span style={{ fontSize: "0.9rem", color: "#34D399", fontWeight: 500 }}>
                  You have accepted guidelines version {user?.instructions_version || CURRENT_INSTRUCTIONS_VERSION}
                  {formattedAcceptedDate ? ` on ${formattedAcceptedDate}` : ""}.
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="btn btn-primary"
                style={{ fontSize: "0.85rem", padding: "6px 16px" }}
              >
                Return to Dashboard
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {!hasAcceptedInstructions && (
            <div
              style={{
                marginTop: "20px",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                background: "rgba(6, 182, 212, 0.1)",
                border: "1px solid rgba(6, 182, 212, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <ShieldCheck size={18} color="var(--primary)" />
              <span style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
                Explicit consent is required to access your Traceo dashboard and enable productivity analytics.
              </span>
            </div>
          )}
        </div>

        {/* Guidelines Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Card 1: What Traceo Does */}
          <div
            className="glass-card"
            style={{
              padding: "24px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "rgba(6, 182, 212, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                }}
              >
                <Activity size={20} />
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>What Traceo Does</h2>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Traceo is an intelligent activity tracker that monitors your computer and browsing workflow to provide
              actionable productivity analytics, time categorization, and focus trend diagnostics.
            </p>
            <ul
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                paddingLeft: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                lineHeight: 1.5,
              }}
            >
              <li>Calculates active work duration versus idle pauses</li>
              <li>Generates top application and domain usage charts</li>
              <li>Helps identify productivity leaks and focus drainers</li>
            </ul>
          </div>

          {/* Card 2: What Data is Collected */}
          <div
            className="glass-card"
            style={{
              padding: "24px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "rgba(139, 92, 246, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-purple)",
                }}
              >
                <Eye size={20} />
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>What Data is Collected</h2>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Telemetry is restricted specifically to productivity metrics:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "var(--text-secondary)" }}>
                <Laptop size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>
                  <strong>Desktop Apps:</strong> Process names, window titles, start/end timestamps, and duration.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "var(--text-secondary)" }}>
                <Globe size={16} color="var(--accent-purple)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>
                  <strong>Browser Activity:</strong> Visited URLs, web domain, page titles, and active tab time.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "var(--text-secondary)" }}>
                <Youtube size={16} color="#FB7185" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>
                  <strong>YouTube Tracking:</strong> Video titles, video IDs, URLs, and watched time.
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Permissions Needed */}
          <div
            className="glass-card"
            style={{
              padding: "24px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "rgba(245, 158, 11, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-amber)",
                }}
              >
                <Key size={20} />
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>Permissions Required</h2>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              The client components require specific operating system & browser permissions:
            </p>
            <ul
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                paddingLeft: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                lineHeight: 1.5,
              }}
            >
              <li>
                <strong>Window Accessibility:</strong> Detects which desktop window currently has user focus.
              </li>
              <li>
                <strong>Browser Tabs:</strong> Traceo Chrome extension inspects URL and title of active tab.
              </li>
              <li>
                <strong>Network Sync:</strong> Secure TLS transport to sync activity batch events with the server.
              </li>
            </ul>
          </div>

          {/* Card 4: How to Start/Stop */}
          <div
            className="glass-card"
            style={{
              padding: "24px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "rgba(16, 185, 129, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10B981",
                }}
              >
                <PlayCircle size={20} />
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>Starting & Stopping</h2>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              You maintain complete control over when and what is tracked at all times:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <PauseCircle size={15} color="#FBBF24" />
                <span>
                  <strong>Desktop Agent:</strong> Toggle tracking or pause from the system tray menu.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <Clock size={15} color="var(--primary)" />
                <span>
                  <strong>Extension:</strong> Enable or disable tracking from the extension icon popup.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <ShieldCheck size={15} color="#34D399" />
                <span>
                  <strong>Settings:</strong> Fine-tune individual category permissions anytime.
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: Privacy & What is NEVER collected */}
          <div
            className="glass-card"
            style={{
              padding: "24px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "rgba(244, 63, 94, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FB7185",
                }}
              >
                <Lock size={20} />
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>Privacy & Zero-Logging</h2>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Your private data is safeguarded with strict design boundaries:
            </p>
            <ul
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                paddingLeft: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                lineHeight: 1.5,
              }}
            >
              <li>
                <strong style={{ color: "var(--text-primary)" }}>NO Keystroke Logging:</strong> We never capture keyboard input, typing, or clipboard buffers.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>NO Password Capture:</strong> Form fields and credentials are never inspected.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>NO Screen Recording:</strong> Video, audio, or desktop screenshots are never recorded.
              </li>
            </ul>
          </div>

          {/* Card 6: Support & Assistance */}
          <div
            className="glass-card"
            style={{
              padding: "24px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "rgba(6, 182, 212, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                }}
              >
                <HelpCircle size={20} />
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>Support & Assistance</h2>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Have questions regarding data collection, privacy compliance, or need help setting up the desktop agent?
            </p>
            <div
              style={{
                marginTop: "auto",
                padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-item-row)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ color: "var(--text-secondary)", marginBottom: "6px" }}>Direct Support Desk:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <a
                  href="mailto:devbypooja@gmail.com"
                  style={{
                    color: "var(--primary)",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  devbypooja@gmail.com
                </a>
                <a
                  href="mailto:devbyneeraj@gmail.com"
                  style={{
                    color: "var(--primary)",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  devbyneeraj@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              borderRadius: "var(--radius-sm)",
              color: "#FB7185",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Consent & Acceptance Footer Card - Only shown for onboarding users who haven't accepted yet */}
        {!hasAcceptedInstructions && (
          <div
            className="glass-card"
            style={{
              padding: "clamp(20px, 4vw, 30px)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Agreement Checkbox */}
            <label
              htmlFor="agree-checkbox"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                id="agree-checkbox"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{
                  width: "20px",
                  height: "20px",
                  marginTop: "2px",
                  cursor: "pointer",
                  accentColor: "var(--primary)",
                }}
              />
              <span
                style={{
                  fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
                  fontWeight: 500,
                  color: agreed ? "var(--text-primary)" : "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                I have read, understood, and agree to the Traceo tracker instructions, guidelines, and telemetry data collection policies.
              </span>
            </label>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "18px",
              }}
            >
              <button
                type="button"
                onClick={handleDecline}
                disabled={declining || submitting}
                className="btn btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                }}
              >
                <LogOut size={16} />
                {declining ? "Logging out..." : "Decline & Sign Out"}
              </button>

              <button
                type="button"
                onClick={handleAccept}
                disabled={!agreed || submitting}
                className="btn btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 28px",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  opacity: agreed ? 1 : 0.45,
                  cursor: agreed ? "pointer" : "not-allowed",
                  boxShadow: agreed ? "0 0 20px rgba(6, 182, 212, 0.4)" : "none",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {submitting ? "Saving acceptance..." : "Accept & Continue"}
                {!submitting && <ArrowRight size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};
