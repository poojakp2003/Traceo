import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Common disposable/temporary email provider domains to block on frontend
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "dispostable.com",
  "getairmail.com",
  "throwawaymail.com",
  "temp-mail.org",
  "fakeinbox.com",
  "generator.email",
  "mohmal.com",
  "crazymailing.com",
  "burnermail.io",
]);

const COMMON_WEAK_PASSWORDS = new Set([
  "password",
  "password123",
  "password123!",
  "admin123",
  "admin123!",
  "welcome123",
  "welcome123!",
  "12345678",
  "123456789",
  "qwerty123",
  "traceo123",
  "traceo123!",
  "letmein123!",
  "changeme123!",
]);

const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

export const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signup } = useAuth();
  const navigate = useNavigate();

  // Email Validation Logic
  const emailValidation = useMemo(() => {
    const trimmed = email.trim();
    if (!trimmed) {
      return { isValid: false, message: "Email is required." };
    }
    if (trimmed.length > 254) {
      return { isValid: false, message: "Email cannot exceed 254 characters." };
    }
    if (trimmed.includes("..")) {
      return { isValid: false, message: "Email cannot contain consecutive dots." };
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      return { isValid: false, message: "Please enter a valid email address (e.g. name@domain.com)." };
    }

    const parts = trimmed.split("@");
    if (parts.length !== 2) {
      return { isValid: false, message: "Invalid email format." };
    }

    const [local, domain] = parts;
    if (local.length > 64) {
      return { isValid: false, message: "Email username cannot exceed 64 characters." };
    }
    if (local.startsWith(".") || local.endsWith(".")) {
      return { isValid: false, message: "Email username cannot start or end with a dot." };
    }

    const domainParts = domain.split(".");
    if (domainParts.length < 2 || domainParts.some((p) => p.length === 0)) {
      return { isValid: false, message: "Email domain must be complete and valid." };
    }

    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
      return { isValid: false, message: "Email must end with a valid domain extension (e.g. .com, .org)." };
    }

    if (DISPOSABLE_EMAIL_DOMAINS.has(domain.toLowerCase())) {
      return {
        isValid: false,
        message: "Disposable or temporary email addresses are not allowed.",
      };
    }

    return { isValid: true, message: "" };
  }, [email]);

  // Password Rules Checklist
  const passwordRules = useMemo(() => {
    const hasMinLength = password.length >= 8 && password.length <= 128;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);
    const isCommonWeak = COMMON_WEAK_PASSWORDS.has(password.toLowerCase().trim());

    const allPassed =
      hasMinLength &&
      hasUpper &&
      hasLower &&
      hasNumber &&
      hasSpecial &&
      !isCommonWeak;

    return {
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isCommonWeak,
      allPassed,
    };
  }, [password]);

  // Password Strength Calculation (0 to 4)
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "None", color: "var(--text-muted)" };

    let passedCount = 0;
    if (passwordRules.hasMinLength) passedCount++;
    if (passwordRules.hasUpper) passedCount++;
    if (passwordRules.hasLower) passedCount++;
    if (passwordRules.hasNumber) passedCount++;
    if (passwordRules.hasSpecial) passedCount++;

    if (password.length >= 12 && passedCount === 5 && !passwordRules.isCommonWeak) {
      return { score: 4, label: "Very Strong", color: "#10B981" };
    }
    if (passedCount >= 5 && !passwordRules.isCommonWeak) {
      return { score: 4, label: "Strong", color: "#10B981" };
    }
    if (passedCount >= 4) {
      return { score: 3, label: "Good", color: "#06B6D4" };
    }
    if (passedCount >= 3) {
      return { score: 2, label: "Fair", color: "#F59E0B" };
    }
    return { score: 1, label: "Weak", color: "#F43F5E" };
  }, [password, passwordRules]);

  // Confirm Password Check
  const confirmValidation = useMemo(() => {
    if (!confirmPassword) {
      return { isValid: false, message: "Please confirm your password." };
    }
    if (confirmPassword !== password) {
      return { isValid: false, message: "Passwords do not match." };
    }
    return { isValid: true, message: "" };
  }, [confirmPassword, password]);

  const isFormValid =
    emailValidation.isValid && passwordRules.allPassed && confirmValidation.isValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmTouched(true);

    if (!emailValidation.isValid) {
      setError(emailValidation.message);
      return;
    }

    if (!passwordRules.allPassed) {
      if (passwordRules.containsEmailLocal) {
        setError("Password cannot contain your email username or personal identifier.");
      } else if (passwordRules.isCommonWeak) {
        setError("This password is too common or easily guessed. Please choose a stronger one.");
      } else {
        setError("Please ensure your password meets all complexity requirements.");
      }
      return;
    }

    if (!confirmValidation.isValid) {
      setError(confirmValidation.message);
      return;
    }

    setLoading(true);

    try {
      await signup(email.trim().toLowerCase(), password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      const rawDetail = err.response?.data?.detail;
      let detailMsg = "Registration failed. Please check your details and try again.";

      if (typeof rawDetail === "string") {
        detailMsg = rawDetail;
      } else if (Array.isArray(rawDetail) && rawDetail.length > 0) {
        detailMsg = rawDetail
          .map((item) => (item.msg ? item.msg.replace(/^Value error, /, "") : JSON.stringify(item)))
          .join(" • ");
      }

      setError(detailMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(20px, 4vw, 36px) 16px",
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "clamp(24px, 5vw, 36px) clamp(20px, 5vw, 32px)",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 24px rgba(139, 92, 246, 0.45)",
              marginBottom: "16px",
            }}
          >
            <Activity size={26} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 1.75rem)", marginBottom: "6px" }}>
            Create your account
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Sign up with enterprise-grade security and activity tracking
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              padding: "12px 14px",
              background: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.35)",
              borderRadius: "var(--radius-sm)",
              color: "#FB7185",
              fontSize: "0.85rem",
              marginBottom: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              lineHeight: 1.45,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
            <span style={{ wordBreak: "break-word" }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Address */}
          <div className="input-group" style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="input-label" htmlFor="email">
                Work or Personal Email
              </label>
              {emailTouched && email && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: emailValidation.isValid ? "#10B981" : "#FB7185",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {emailValidation.isValid ? (
                    <>
                      <Check size={12} /> Valid format
                    </>
                  ) : null}
                </span>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                color={
                  emailTouched && !emailValidation.isValid
                    ? "#FB7185"
                    : emailTouched && emailValidation.isValid
                    ? "#10B981"
                    : "var(--text-muted)"
                }
                style={{ position: "absolute", left: "14px", top: "15px" }}
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                className="input-field"
                style={{
                  paddingLeft: "42px",
                  paddingRight: "14px",
                  borderColor:
                    emailTouched && !emailValidation.isValid
                      ? "rgba(244, 63, 94, 0.6)"
                      : emailTouched && emailValidation.isValid
                      ? "rgba(16, 185, 129, 0.6)"
                      : undefined,
                }}
                placeholder="you@company.com"
                value={email}
                onBlur={() => setEmailTouched(true)}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
              />
            </div>
            {emailTouched && !emailValidation.isValid && (
              <p
                style={{
                  color: "#FB7185",
                  fontSize: "0.78rem",
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <AlertCircle size={13} />
                <span>{emailValidation.message}</span>
              </p>
            )}
          </div>

          {/* Password */}
          <div className="input-group" style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="input-label" htmlFor="password">
                Password
              </label>
              {password && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: passwordStrength.color,
                  }}
                >
                  {passwordStrength.label}
                </span>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                color={
                  passwordTouched && !passwordRules.allPassed
                    ? "#F59E0B"
                    : passwordTouched && passwordRules.allPassed
                    ? "#10B981"
                    : "var(--text-muted)"
                }
                style={{ position: "absolute", left: "14px", top: "15px" }}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="input-field"
                style={{
                  paddingLeft: "42px",
                  paddingRight: "44px",
                  borderColor:
                    passwordTouched && !passwordRules.allPassed
                      ? "rgba(245, 158, 11, 0.5)"
                      : passwordTouched && passwordRules.allPassed
                      ? "rgba(16, 185, 129, 0.6)"
                      : undefined,
                }}
                placeholder="Create a strong password"
                value={password}
                onFocus={() => setPasswordTouched(true)}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
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
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Dynamic Password Strength Progress Bar */}
            {password.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "5px",
                    height: "4px",
                  }}
                >
                  {[1, 2, 3, 4].map((step) => {
                    const isActive = passwordStrength.score >= step;
                    return (
                      <div
                        key={step}
                        style={{
                          height: "100%",
                          borderRadius: "2px",
                          backgroundColor: isActive
                            ? passwordStrength.color
                            : "rgba(255, 255, 255, 0.1)",
                          transition: "background-color 0.25s ease",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interactive Requirements Checklist */}
            <div
              style={{
                marginTop: "12px",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.78rem",
              }}
            >
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ShieldCheck size={14} color="var(--primary)" />
                <span>Password Requirements:</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 12px",
                }}
              >
                <RequirementItem
                  met={passwordRules.hasMinLength}
                  label="8+ characters (max 128)"
                />
                <RequirementItem
                  met={passwordRules.hasUpper}
                  label="1 uppercase letter (A-Z)"
                />
                <RequirementItem
                  met={passwordRules.hasLower}
                  label="1 lowercase letter (a-z)"
                />
                <RequirementItem
                  met={passwordRules.hasNumber}
                  label="1 numeric digit (0-9)"
                />
                <RequirementItem
                  met={passwordRules.hasSpecial}
                  label="1 special symbol (!@#$...)"
                />
                <RequirementItem
                  met={!passwordRules.isCommonWeak}
                  label="Not a common weak word"
                />
              </div>

              {passwordRules.isCommonWeak && (
                <p style={{ color: "#FB7185", fontSize: "0.75rem", marginTop: "8px" }}>
                  ⚠️ Password is too common or easily guessed.
                </p>
              )}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="input-group" style={{ marginBottom: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="input-label" htmlFor="confirm-password">
                Confirm Password
              </label>
              {confirmTouched && confirmPassword && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: confirmValidation.isValid ? "#10B981" : "#FB7185",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {confirmValidation.isValid ? (
                    <>
                      <Check size={12} /> Passwords match
                    </>
                  ) : (
                    <>
                      <X size={12} /> Do not match
                    </>
                  )}
                </span>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                color={
                  confirmTouched && !confirmValidation.isValid
                    ? "#FB7185"
                    : confirmTouched && confirmValidation.isValid
                    ? "#10B981"
                    : "var(--text-muted)"
                }
                style={{ position: "absolute", left: "14px", top: "15px" }}
              />
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="input-field"
                style={{
                  paddingLeft: "42px",
                  paddingRight: "44px",
                  borderColor:
                    confirmTouched && !confirmValidation.isValid
                      ? "rgba(244, 63, 94, 0.6)"
                      : confirmTouched && confirmValidation.isValid
                      ? "rgba(16, 185, 129, 0.6)"
                      : undefined,
                }}
                placeholder="Repeat your password"
                value={confirmPassword}
                onBlur={() => setConfirmTouched(true)}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "13px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmTouched && !confirmValidation.isValid && confirmPassword.length > 0 && (
              <p
                style={{
                  color: "#FB7185",
                  fontSize: "0.78rem",
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <AlertCircle size={13} />
                <span>{confirmValidation.message}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: "100%",
              marginTop: "4px",
              minHeight: "46px",
              opacity: loading ? 0.75 : 1,
              cursor: loading ? "wait" : "pointer",
              boxShadow: isFormValid ? "0 0 20px rgba(6, 182, 212, 0.35)" : undefined,
            }}
          >
            {loading ? "Creating secure account..." : "Sign Up"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              fontWeight: 600,
              color: "var(--primary)",
              textDecoration: "none",
              padding: "4px",
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

/**
 * Clean inline requirement indicator item with instant visual transition
 */
const RequirementItem = ({ met, label }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      color: met ? "#10B981" : "var(--text-muted)",
      transition: "color 0.2s ease",
    }}
  >
    {met ? (
      <Check size={13} color="#10B981" style={{ flexShrink: 0 }} />
    ) : (
      <div
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          border: "1px solid var(--text-muted)",
          flexShrink: 0,
        }}
      />
    )}
    <span
      style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {label}
    </span>
  </div>
);
