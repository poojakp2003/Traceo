"""Dashboard analytics and reporting Pydantic schemas.

This module defines data transfer schemas for summary statistics, application usage breakdowns,
browser domain summaries, YouTube viewing analytics, timeline charts, and browser visit history.
"""

from datetime import datetime
from pydantic import BaseModel


# ==============================================================================
# Duration Formatting Helper
# ==============================================================================
def format_duration(seconds: int) -> str:
    """Formats an integer duration in seconds into human-readable text.

    Examples:
        - 45 -> "45 secs"
        - 120 -> "2 mins"
        - 3665 -> "1 hr 1 min"
    """
    if seconds <= 0:
        return "0 mins"
    if seconds < 60:
        return f"{seconds} sec" if seconds == 1 else f"{seconds} secs"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    parts: list[str] = []
    if hours > 0:
        parts.append(f"{hours} hr" if hours == 1 else f"{hours} hrs")
    if minutes > 0 or not parts:
        parts.append(f"{minutes} min" if minutes == 1 else f"{minutes} mins")
    return " ".join(parts)


# ==============================================================================
# Overview Summary Metrics Schema
# ==============================================================================
class DashboardSummaryResponse(BaseModel):
    """Schema for top-level usage summary metrics across periods (today, 7d, 30d)."""

    today_seconds: int
    today_formatted: str
    week_seconds: int
    week_formatted: str
    month_seconds: int
    month_formatted: str
    total_app_sessions: int
    total_browser_visits: int
    total_videos_watched: int


# ==============================================================================
# Application Usage Schemas
# ==============================================================================
class AppUsageItem(BaseModel):
    """Schema representing aggregated usage metrics for a specific application."""

    app_name: str
    duration_seconds: int
    duration_formatted: str
    session_count: int
    percentage: float


class DashboardAppsResponse(BaseModel):
    """Schema for returning aggregated app usage analytics for a time range."""

    range: str
    total_duration_seconds: int
    total_duration_formatted: str
    items: list[AppUsageItem]


# ==============================================================================
# Browser Domain Schemas
# ==============================================================================
class BrowserDomainItem(BaseModel):
    """Schema representing aggregated visits for a specific domain."""

    domain: str
    visit_count: int
    last_visited: datetime
    percentage: float


class DashboardBrowserResponse(BaseModel):
    """Schema for returning domain-aggregated browser analytics for a time range."""

    range: str
    total_visits: int
    items: list[BrowserDomainItem]


# ==============================================================================
# YouTube Activity Schemas
# ==============================================================================
class YouTubeItem(BaseModel):
    """Schema representing aggregated watching stats for an individual YouTube video."""

    video_id: str
    video_title: str
    url: str
    watched_seconds: int
    watched_formatted: str
    watch_count: int
    last_watched: datetime


class DashboardYouTubeResponse(BaseModel):
    """Schema for returning aggregated YouTube analytics for a time range."""

    range: str
    total_watched_seconds: int
    total_watched_formatted: str
    items: list[YouTubeItem]


# ==============================================================================
# Timeline & Trend Chart Schemas
# ==============================================================================
class TimelinePoint(BaseModel):
    """Schema representing a single interval (hour or day) on the activity timeline."""

    date: str
    day: str
    hours: float
    duration_seconds: int
    duration_formatted: str
    session_count: int


class DashboardTimelineResponse(BaseModel):
    """Schema for returning multi-day or hourly timeline activity trends."""

    range: str
    total_hours: float
    total_duration_formatted: str
    items: list[TimelinePoint]


# ==============================================================================
# Detailed Browser History Schemas
# ==============================================================================
class BrowserHistoryItem(BaseModel):
    """Schema representing an individual browser history event."""

    id: int
    url: str
    domain: str
    title: str | None = None
    browser: str
    timestamp: datetime
    time_formatted: str


class DashboardBrowserHistoryResponse(BaseModel):
    """Schema for returning a paginated or filtered list of browser visits."""

    range: str
    total_count: int
    items: list[BrowserHistoryItem]
