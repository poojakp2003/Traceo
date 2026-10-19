"""Browser activity model module defining the database schema for visited web pages.

This module stores navigation history recorded by the Traceo browser extension,
including the URL, page title, browser type, timestamp, and association to the user.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


# ==============================================================================
# Browser Activity ORM Model
# ==============================================================================
class BrowserActivity(Base):
    """SQLAlchemy model representing visited websites and URLs.

    Each record corresponds to a distinct website page visit detected by the browser extension.
    """

    __tablename__ = "browser_activity"

    # ==========================================================================
    # Primary Key & Foreign Keys
    # ==========================================================================
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    # ==========================================================================
    # Tracking Data Fields
    # ==========================================================================
    browser: Mapped[str] = mapped_column(String(100), index=True)  # e.g., "Chrome", "Firefox", "Edge"
    url: Mapped[str] = mapped_column(Text, nullable=False)          # Full visited URL
    title: Mapped[str | None] = mapped_column(String(1024), nullable=True)  # Document/Tab title
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)  # Visit time
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # ==========================================================================
    # Relationships
    # ==========================================================================
    user: Mapped["User"] = relationship(back_populates="browser_activities")
