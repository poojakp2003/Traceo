"""User tracking permissions model module.

This module stores per-user privacy and consent toggles for tracking categories
(desktop app usage, web browser activity, and YouTube video tracking). When a user
disables a specific category, incoming logs for that category are rejected by the API.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


# ==============================================================================
# Permission ORM Model
# ==============================================================================
class Permission(Base):
    """SQLAlchemy model representing tracking permissions per user.

    Provides granular privacy controls allowing users to independently toggle
    monitoring for applications, browser URLs, and YouTube playback.
    """

    __tablename__ = "permissions"

    # ==========================================================================
    # Primary Key & 1-to-1 User Foreign Key
    # ==========================================================================
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )

    # ==========================================================================
    # Privacy & Tracking Feature Toggles
    # ==========================================================================
    app_tracking: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)        # Track desktop software
    browser_tracking: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)    # Track visited websites
    youtube_tracking: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)   # Track YouTube video playback

    # ==========================================================================
    # Timestamps
    # ==========================================================================
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # ==========================================================================
    # Bidirectional Relationship
    # ==========================================================================
    user: Mapped["User"] = relationship(back_populates="permission")
