import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Activity, AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check query parameters
  const queryParams = new URLSearchParams(location.search);
  const sessionExpired = queryParams.get("session_expired");
  const instructionsDeclined = queryParams.get("instructions_declined");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Invalid email or password. Please try again.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "clamp(16px, 4vw, 24px)",
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: "100%",
        maxWidth: "420px",
        padding: "clamp(24px, 6vw, 36px) clamp(18px, 5vw, 32px)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #06B6D4, #8B5CF6)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)",
            marginBottom: "16px",
          }}>
            <Activity size={26} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 1.75rem)", marginBottom: "6px" }}>Welcome back</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Sign in to access your activity analytics
          </p>
        </div>

        {/* Notifications */}
        {instructionsDeclined && (
          <div style={{
            padding: "10px 14px",
            background: "rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: "var(--radius-sm)",
            color: "#FB7185",
            fontSize: "0.85rem",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            wordBreak: "break-word",
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>You declined the tracker guidelines. Acceptance is required to access Traceo.</span>
          </div>
        )}

        {sessionExpired && (
          <div style={{
            padding: "10px 14px",
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "var(--radius-sm)",
            color: "#FBBF24",
            fontSize: "0.85rem",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            wordBreak: "break-word",
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>Your session has expired. Please sign in again.</span>
          </div>
        )}

        {error && (
          <div style={{
            padding: "10px 14px",
            background: "rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: "var(--radius-sm)",
            color: "#FB7185",
            fontSize: "0.85rem",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            wordBreak: "break-word",
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "15px" }} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                className="input-field"
                style={{ paddingLeft: "42px" }}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "15px" }} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="input-field"
                style={{ paddingLeft: "42px", paddingRight: "42px" }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "13px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "10px", minHeight: "44px" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ fontWeight: 600, padding: "4px" }}>Create account</Link>
        </div>
      </div>
    </div>
  );
};
