"""Application usage model module defining the schema for tracked desktop application sessions.

This module stores foreground window usage logs reported by desktop background monitoring agents,
including application names (e.g. Code.exe, chrome.exe), active window titles, start/end timestamps,
and total active session durations in seconds.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


# ==============================================================================
# Application Usage ORM Model
# ==============================================================================
class AppUsage(Base):
    """SQLAlchemy model representing tracked application sessions and duration.

    Records active foreground usage sessions for native desktop applications.
    """

    __tablename__ = "app_usage"

    # ==========================================================================
    # Primary Key & Foreign Keys
    # ==========================================================================
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    # ==========================================================================
    # Desktop Application Session Metrics
    # ==========================================================================
    app_name: Mapped[str] = mapped_column(String(255), index=True)         # Binary/Process name (e.g. Code, Figma)
    window_title: Mapped[str | None] = mapped_column(String(512), nullable=True) # Active window caption
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True) # Session start
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)   # Session end
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False) # Total duration in seconds
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # ==========================================================================
    # Relationships
    # ==========================================================================
    user: Mapped["User"] = relationship(back_populates="app_usages")
