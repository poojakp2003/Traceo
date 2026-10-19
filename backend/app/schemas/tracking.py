"""Tracking ingestion and permission configuration Pydantic schemas.

This module defines request payloads, input normalization/sanitization hooks,
and response models for desktop app usage, browser page visits, YouTube watching sessions,
and user permission configurations.
"""

from datetime import datetime, timezone
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ==============================================================================
# Desktop Application Tracking Schemas
# ==============================================================================
class AppUsageCreate(BaseModel):
    """Schema for recording a desktop application usage event.

    Includes validators to sanitize window titles, enforce process name limits,
    and automatically compute session duration from start and end timestamps.
    """

    app_name: str = Field(default="Unknown Application", max_length=255)
    window_title: str | None = Field(default=None)
    start_time: datetime
    end_time: datetime
    duration_seconds: int | None = Field(default=None, ge=0)

    @field_validator("window_title", mode="before")
    @classmethod
    def sanitize_window_title(cls, v: object) -> str | None:
        """Strip and truncate window titles to a maximum of 512 characters."""
        if v is None:
            return None
        s = str(v).strip()
        return s[:512]

    @field_validator("app_name", mode="before")
    @classmethod
    def sanitize_app_name(cls, v: object) -> str:
        """Sanitize process/app name, defaulting to 'Unknown Application' if empty."""
        s = str(v or "").strip() or "Unknown Application"
        return s[:255]

    @model_validator(mode="after")
    def compute_duration(self) -> Self:
        """Automatically calculate duration_seconds from end_time - start_time if not provided."""
        if self.duration_seconds is None:
            diff = int((self.end_time - self.start_time).total_seconds())
            self.duration_seconds = max(diff, 0)
        return self


class AppUsageResponse(BaseModel):
    """Schema for returning tracked desktop application usage data."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    app_name: str
    window_title: str | None
    start_time: datetime
    end_time: datetime
    duration_seconds: int
    created_at: datetime


# ==============================================================================
# Web Browser Activity Tracking Schemas
# ==============================================================================
class BrowserActivityCreate(BaseModel):
    """Schema for recording a browser page visit.

    Includes sanitization for page titles, browser names, and defaults timestamps to UTC now.
    """

    browser: str = Field(default="Chrome", max_length=100)
    url: str = Field(min_length=1)
    title: str | None = Field(default=None)
    timestamp: datetime | None = None

    @field_validator("title", mode="before")
    @classmethod
    def sanitize_title(cls, v: object) -> str | None:
        """Strip and truncate document/tab title to 1024 characters."""
        if v is None:
            return None
        s = str(v).strip()
        return s[:1024]

    @field_validator("browser", mode="before")
    @classmethod
    def sanitize_browser(cls, v: object) -> str:
        """Sanitize browser name, defaulting to 'Chrome' if unspecified."""
        if not v:
            return "Chrome"
        s = str(v).strip()
        return s[:100] if s else "Chrome"

    @model_validator(mode="after")
    def default_timestamp(self) -> Self:
        """Ensure a UTC timestamp exists if none was supplied by the client."""
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)
        return self


class BrowserActivityResponse(BaseModel):
    """Schema for returning recorded browser activity data."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    browser: str
    url: str
    title: str | None
    timestamp: datetime
    created_at: datetime


# ==============================================================================
# YouTube Activity Tracking Schemas
# ==============================================================================
class YouTubeActivityCreate(BaseModel):
    """Schema for recording a YouTube video watching activity event."""

    video_id: str = Field(min_length=1, max_length=64)
    video_title: str = Field(min_length=1, max_length=512)
    url: str = Field(min_length=1)
    watched_time_seconds: int = Field(default=0, ge=0)
    timestamp: datetime | None = None

    @model_validator(mode="after")
    def default_timestamp(self) -> Self:
        """Default watch timestamp to current UTC time if omitted."""
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)
        return self


class YouTubeActivityResponse(BaseModel):
    """Schema for returning recorded YouTube activity data."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    video_id: str
    video_title: str
    url: str
    watched_time_seconds: int
    timestamp: datetime
    created_at: datetime


# ==============================================================================
# Tracking Permissions Schemas
# ==============================================================================
class PermissionResponse(BaseModel):
    """Schema for returning current user tracking permissions."""

    model_config = ConfigDict(from_attributes=True)

    app_tracking: bool
    browser_tracking: bool
    youtube_tracking: bool
    updated_at: datetime


class PermissionUpdate(BaseModel):
    """Schema for partially updating user tracking permissions."""

    app_tracking: bool | None = None
    browser_tracking: bool | None = None
    youtube_tracking: bool | None = None
