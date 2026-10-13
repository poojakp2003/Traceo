import React from "react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer-content">
        <div className="app-footer-left">
          <span className="app-footer-brand">Traceo</span>
          <span className="app-footer-desc">
            Smart Activity & Productivity Monitor
          </span>
        </div>

        <div className="app-footer-right">
          <span className="app-footer-copy">
            &copy; {currentYear} Traceo. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
