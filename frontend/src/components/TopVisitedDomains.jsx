import React, { useState, useEffect } from "react";
import { Compass, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

const isProjectDomain = (domain = "") => {
  if (!domain) return false;
  const lower = domain.toLowerCase();
  return (
    lower.includes("localhost:5173") ||
    lower.includes("127.0.0.1:5173") ||
    lower.includes("localhost:8000") ||
    lower.includes("127.0.0.1:8000") ||
    lower.includes("localhost:3000") ||
    lower.includes("127.0.0.1:3000")
  );
};

export const TopVisitedDomains = ({ browserData = null, items = null, range = "today" }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const rawItems = items || browserData?.items || [];
  const validDomains = rawItems.filter((b) => !isProjectDomain(b.domain));

  // Keep the domains sorted by visit count in descending order across all pages
  const sortedDomains = [...validDomains].sort((a, b) => {
    const countA = Number(a.visit_count) || 0;
    const countB = Number(b.visit_count) || 0;
    if (countB !== countA) {
      return countB - countA;
    }
    return String(a.domain || "").localeCompare(String(b.domain || ""));
  });

  const totalPages = Math.max(1, Math.ceil(sortedDomains.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  // Reset to page 1 whenever the data or the time filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [range, browserData, items]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  if (!browserData && !items) return null;
  if (sortedDomains.length === 0) return null;

  const totalVisits = sortedDomains.reduce((acc, curr) => acc + (Number(curr.visit_count) || 0), 0);

  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, sortedDomains.length);
  const paginatedDomains = sortedDomains.slice(startIndex, startIndex + PAGE_SIZE);

  const firstItem = sortedDomains.length === 0 ? 0 : startIndex + 1;
  const lastItem = endIndex;
  const totalCount = sortedDomains.length;

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }
    if (safePage >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages];
  };

  return (
    <div className="glass-card">
      {/* Header */}
      <div className="card-header-responsive">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34D399",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Compass size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: "1.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Top Visited Domains</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Aggregate web traffic by host domain ({totalVisits} total visits)
            </p>
          </div>
        </div>
        <span className="badge badge-emerald">{range.toUpperCase()}</span>
      </div>

      {/* Grid of Domains */}
      <div className="top-domains-grid">
        {paginatedDomains.map((b, idx) => {
          const displayPercentage =
            b.percentage !== undefined && b.percentage !== null
              ? `${String(b.percentage).replace(/%$/, "")}%`
              : totalVisits > 0
              ? `${(((Number(b.visit_count) || 0) / totalVisits) * 100).toFixed(1)}%`
              : "0%";

          return (
            <div
              key={b.domain || idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                minWidth: 0,
                minHeight: "48px",
                padding: "10px 14px",
                background: "rgba(255, 255, 255, 0.025)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <span
                title={b.domain}
                style={{
                  fontWeight: 500,
                  fontSize: "0.88rem",
                  minWidth: 0,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {b.domain}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.82rem",
                    fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 500,
                  }}
                >
                  {b.visit_count}
                </span>
                <span
                  className="badge badge-emerald"
                  style={{
                    fontSize: "0.72rem",
                    fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {displayPercentage}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {sortedDomains.length > 0 && (
        <div className="pagination-container">
          <div
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
              fontSize: "0.8rem",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              minWidth: 0,
              flexShrink: 1,
            }}
          >
            Showing{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
              {firstItem}
            </span>
            -
            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
              {lastItem}
            </span>{" "}
            of{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
              {totalCount}
            </span>{" "}
            visited domains
          </div>

          <div className="pagination-controls-group">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="pagination-btn"
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft size={13} />
              <span>Prev</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              {getPageNumbers().map((num, idx) => {
                if (num === "...") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      style={{
                        padding: "0 2px",
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
                        userSelect: "none",
                      }}
                    >
                      ...
                    </span>
                  );
                }
                const isCurrent = num === safePage;
                return (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className="pagination-btn"
                    style={{
                      minWidth: "32px",
                      background: isCurrent ? "var(--pagination-emerald-bg)" : "var(--bg-item-row)",
                      border: isCurrent
                        ? "1px solid var(--pagination-emerald-border)"
                        : "1px solid var(--border-subtle)",
                      color: isCurrent ? "var(--pagination-emerald-color)" : "var(--text-secondary)",
                      fontWeight: isCurrent ? 600 : 500,
                    }}
                    aria-label={`Page ${num}`}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="pagination-btn"
              title="Next page"
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
