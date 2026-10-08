import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, LayoutDashboard, LogOut, Menu, Settings, User as UserIcon, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate("/login");
  };

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  return (
    <header className="navbar" ref={menuRef}>
      <div className="navbar-left">
        <Link to="/dashboard" className="nav-brand" onClick={() => setMobileMenuOpen(false)}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #06B6D4, #8B5CF6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 12px rgba(6, 182, 212, 0.4)",
            flexShrink: 0,
          }}>
            <Activity size={18} color="#FFFFFF" />
          </div>
          <span>Trac<span className="nav-brand-gradient">eo</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-only-nav">
          <Link
            to="/dashboard"
            className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/settings"
            className={`nav-link ${location.pathname === "/settings" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Settings size={16} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* Desktop User Info & Sign Out */}
      <div className="navbar-right desktop-only-nav">
        {user && (
          <div className="nav-user-pill">
            <UserIcon size={14} color="var(--primary)" />
            <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ padding: "8px 14px", fontSize: "0.85rem", minHeight: "38px" }}
          title="Sign out"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>

      {/* Mobile Hamburger Toggle Button */}
      <button
        type="button"
        className="navbar-hamburger-btn mobile-only-nav"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Collapsible Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="navbar-mobile-backdrop mobile-only-nav"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="navbar-mobile-drawer animate-fade-in mobile-only-nav">
            <nav className="navbar-mobile-links">
              <Link
                to="/dashboard"
                className={`navbar-mobile-link ${location.pathname === "/dashboard" ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/settings"
                className={`navbar-mobile-link ${location.pathname === "/settings" ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings size={18} />
                <span>Settings</span>
              </Link>
            </nav>

            <div className="navbar-mobile-footer">
              {user && (
                <div className="nav-user-pill" style={{ width: "100%", justifyContent: "center" }}>
                  <UserIcon size={15} color="var(--primary)" />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.email}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ width: "100%", minHeight: "44px" }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
