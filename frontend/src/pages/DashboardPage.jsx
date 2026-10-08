import React, { useEffect, useState } from "react";
import {
  Activity,
  Calendar,
  Clock,
  Flame,
  Globe,
  Layers,
  RefreshCw,
  TrendingUp,
  Video,
} from "lucide-react";
import {
  getDashboardApps,
  getDashboardBrowser,
  getDashboardBrowserHistory,
  getDashboardSummary,
  getDashboardTimeline,
  getDashboardYouTube,
} from "../api/dashboard";
import { AppUsageBarChart } from "../components/AppUsageBarChart";
import { BrowserActivityTable } from "../components/BrowserActivityTable";
import { Navbar } from "../components/Navbar";
import { RangeSelector } from "../components/RangeSelector";
import { StatCard } from "../components/StatCard";
import { UsageTimeLineChart } from "../components/UsageTimeLineChart";
import { YouTubeActivityList } from "../components/YouTubeActivityList";
import { TopVisitedDomains } from "../components/TopVisitedDomains";

export const DashboardPage = () => {
  const [range, setRange] = useState("today");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [appsData, setAppsData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [browserData, setBrowserData] = useState(null);
  const [browserHistory, setBrowserHistory] = useState(null);
  const [youtubeData, setYoutubeData] = useState(null);
  const [error, setError] = useState("");

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError("");
    const startTime = Date.now();

    try {
      const [
        summaryRes,
        appsRes,
        timelineRes,
        browserRes,
        historyRes,
        ytRes,
      ] = await Promise.all([
        getDashboardSummary(),
        getDashboardApps(range),
        getDashboardTimeline(range),
        getDashboardBrowser(range),
        getDashboardBrowserHistory(range, 100),
        getDashboardYouTube(range),
      ]);

      setSummary(summaryRes);
      setAppsData(appsRes);
      setTimelineData(timelineRes);
      setBrowserData(browserRes);
      setBrowserHistory(historyRes);
      setYoutubeData(ytRes);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
      setError("Failed to fetch dashboard data. Please ensure the backend is running.");
    } finally {
      setLoading(false);
      if (isManualRefresh) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 750) {
          await new Promise((resolve) => setTimeout(resolve, 750 - elapsed));
        }
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
      <Navbar />

      <main className="container animate-fade-in" style={{ paddingBottom: "60px" }}>
        {/* Top bar: Title & Range Selector */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)", marginBottom: "4px" }}>Activity Dashboard</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "clamp(0.85rem, 2vw, 0.9rem)" }}>
              Visual analytics for applications, daily usage trends, web browsing, and video learning
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <RangeSelector currentRange={range} onSelectRange={setRange} />
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className={`btn-reload ${refreshing ? "is-refreshing" : ""}`}
              aria-label="Refresh metrics"
            >
              <RefreshCw
                size={16}
                className={`reload-icon ${refreshing ? "spinning" : ""}`}
              />
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "14px 18px",
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              borderRadius: "var(--radius-md)",
              color: "#FB7185",
              fontSize: "0.9rem",
              marginBottom: "24px",
              wordBreak: "break-word",
            }}
          >
            {error}
          </div>
        )}

        {/* 1. Summary Metrics Cards */}
        <div className="dashboard-stats-grid">
          <StatCard
            title="Today"
            value={summary ? summary.today_formatted : "..."}
            subtitle="Active tracked duration"
            icon={Flame}
            color="#06B6D4"
          />
          <StatCard
            title="This Week (7d)"
            value={summary ? summary.week_formatted : "..."}
            subtitle="Aggregated time"
            icon={Calendar}
            color="#8B5CF6"
          />
          <StatCard
            title="This Month (30d)"
            value={summary ? summary.month_formatted : "..."}
            subtitle="Aggregated time"
            icon={Clock}
            color="#10B981"
          />
          <StatCard
            title="Total Sessions"
            value={summary ? `${summary.total_app_sessions} sessions` : "..."}
            subtitle={`${summary ? summary.total_browser_visits : 0} web visits`}
            icon={Activity}
            color="#F59E0B"
          />
        </div>

        {/* 2. Charts Using Recharts */}
        <div className="dashboard-charts-grid">
          {/* Bar Chart: Shows application usage */}
          <div className="glass-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: "rgba(6, 182, 212, 0.15)",
                    color: "#22D3EE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Layers size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.15rem" }}>Application Usage</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    Time spent on each application
                  </p>
                </div>
              </div>
              <span className="badge badge-cyan">{range.toUpperCase()}</span>
            </div>

            {loading ? (
              <div style={{ height: "280px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="skeleton" style={{ height: "240px", width: "100%" }} />
              </div>
            ) : (
              <AppUsageBarChart
                items={appsData?.items || []}
                totalDurationFormatted={appsData?.total_duration_formatted || "0 mins"}
              />
            )}
          </div>

          {/* Line Chart: Shows usage over time */}
          <div className="glass-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: "rgba(139, 92, 246, 0.15)",
                    color: "#A78BFA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.15rem" }}>Usage Over Time</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    Daily usage trend across days
                  </p>
                </div>
              </div>
              <span className="badge badge-purple">{range.toUpperCase()}</span>
            </div>

            {loading ? (
              <div style={{ height: "280px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="skeleton" style={{ height: "240px", width: "100%" }} />
              </div>
            ) : (
              <UsageTimeLineChart
                items={timelineData?.items || []}
                totalHours={timelineData?.total_hours || 0}
                range={range}
              />
            )}
          </div>
        </div>

        {/* 3. Browser History and YouTube List */}
        <div className="dashboard-activity-grid">
          {/* Browser Activity Table */}
          <BrowserActivityTable
            items={browserHistory?.items || []}
            loading={loading}
          />

          {/* YouTube Video List */}
          <YouTubeActivityList
            items={youtubeData?.items || []}
            loading={loading}
            totalWatchedFormatted={youtubeData?.total_watched_formatted || "0 mins"}
          />
        </div>

        {/* 4. Top Browser Domains Summary */}
        <TopVisitedDomains
          browserData={browserData}
          range={range}
        />
      </main>
    </div>
  );
};
