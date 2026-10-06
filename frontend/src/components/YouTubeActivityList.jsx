import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Play, Search, Video } from "lucide-react";

const PAGE_SIZE = 10;

export const YouTubeActivityList = ({ items = [], loading = false, totalWatchedFormatted = "0 mins" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = items
    .filter((item) =>
      item.video_title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.last_watched) - new Date(a.last_watched));

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredItems.length);
  const paginatedItems = filteredItems.slice(startIndex, startIndex + PAGE_SIZE);

  const getPageNumbers = () => {
    if (totalPages <= 4) {
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
    <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              background: "rgba(244, 63, 94, 0.15)",
              color: "#FB7185",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Video size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: "1.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              YouTube Learning Activity
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Watched tutorials, guides, and courses • Total: {totalWatchedFormatted}
            </p>
          </div>
        </div>

        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 12px",
            flexShrink: 0,
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input-satoshi"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "0.86rem",
              width: "120px",
              fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
              fontWeight: 500,
              letterSpacing: "-0.015em",
            }}
          />
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="skeleton" style={{ height: "40px" }} />
          <div className="skeleton" style={{ height: "40px" }} />
          <div className="skeleton" style={{ height: "40px" }} />
        </div>
      ) : filteredItems.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "0 6px",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr style={{ color: "var(--text-secondary)", textAlign: "left", fontSize: "0.8rem" }}>
                <th style={{ padding: "8px 12px", fontWeight: 600 }}>Watched Video</th>
                <th style={{ padding: "8px 12px", fontWeight: 600, width: "140px", textAlign: "right" }}>Sessions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((yt, idx) => (
                <tr
                  key={yt.video_id || idx}
                  style={{
                    background: "var(--bg-item-row)",
                    borderRadius: "var(--radius-sm)",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-item-row-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-item-row)")}
                >
                  <td style={{ padding: "10px 12px", borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: "rgba(244, 63, 94, 0.12)",
                          color: "#F43F5E",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Play size={14} fill="#F43F5E" />
                      </div>
                      <span
                        style={{
                          fontWeight: 500,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "300px",
                        }}
                        title={yt.video_title}
                      >
                        {yt.video_title}
                      </span>
                      <a
                        href={yt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", flexShrink: 0 }}
                        title="Open YouTube video"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      textAlign: "right",
                      borderTopRightRadius: "8px",
                      borderBottomRightRadius: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "14px" }}>
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          minWidth: "18px",
                          textAlign: "center",
                          fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 600,
                        }}
                      >
                        {yt.watch_count}
                      </span>
                      <span
                        style={{
                          color: "#FB7185",
                          fontWeight: 600,
                          fontSize: "0.82rem",
                          fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
                          fontVariantNumeric: "tabular-nums",
                          letterSpacing: "0.03em",
                          padding: "4px 10px",
                          background: "rgba(244, 63, 94, 0.1)",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid rgba(244, 63, 94, 0.2)",
                          minWidth: "60px",
                          textAlign: "center",
                        }}
                      >
                        {yt.watched_formatted}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
          {filteredItems.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "14px",
                paddingTop: "12px",
                borderTop: "1px solid var(--border-subtle)",
                fontSize: "0.82rem",
              }}
            >
              <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif" }}>
                Showing{" "}
                {filteredItems.length === 0 ? (
                  <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>0</span>
                ) : startIndex + 1 >= endIndex ? (
                  <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {endIndex}
                  </span>
                ) : (
                  <>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {startIndex + 1}
                    </span>
                    {"–"}
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {endIndex}
                    </span>
                  </>
                )}{" "}
                of{" "}
                <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {filteredItems.length}
                </span>{" "}
                watched videos
              </div>

              {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "5px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--border-subtle)",
                      color: safePage === 1 ? "var(--text-muted)" : "var(--text-primary)",
                      cursor: safePage === 1 ? "not-allowed" : "pointer",
                      opacity: safePage === 1 ? 0.45 : 1,
                      fontSize: "0.8rem",
                      transition: "all 0.2s ease",
                    }}
                    title="Previous page"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} />
                    <span>Prev</span>
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {getPageNumbers().map((num, idx) => {
                      if (num === "...") {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            style={{
                              padding: "0 4px",
                              color: "var(--text-muted)",
                              fontSize: "0.8rem",
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
                          style={{
                            minWidth: "28px",
                            height: "28px",
                            padding: "0 6px",
                            borderRadius: "var(--radius-sm)",
                            background: isCurrent ? "rgba(244, 63, 94, 0.2)" : "rgba(255, 255, 255, 0.04)",
                            border: isCurrent
                              ? "1px solid rgba(244, 63, 94, 0.5)"
                              : "1px solid var(--border-subtle)",
                            color: isCurrent ? "#FB7185" : "var(--text-secondary)",
                            fontWeight: isCurrent ? 600 : 500,
                            fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
                            fontVariantNumeric: "tabular-nums",
                            cursor: "pointer",
                            fontSize: "0.82rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "5px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--border-subtle)",
                      color: safePage === totalPages ? "var(--text-muted)" : "var(--text-primary)",
                      cursor: safePage === totalPages ? "not-allowed" : "pointer",
                      opacity: safePage === totalPages ? 0.45 : 1,
                      fontSize: "0.8rem",
                      transition: "all 0.2s ease",
                    }}
                    title="Next page"
                    aria-label="Next page"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "160px",
            textAlign: "center",
            padding: "32px 12px",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          {searchTerm ? "No matching YouTube videos found" : "No YouTube learning sessions recorded yet"}
        </div>
      )}
    </div>
  );
};