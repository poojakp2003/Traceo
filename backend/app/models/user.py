"""User model module defining the user account table and ORM relationships.

This module defines the SQLAlchemy schema for the `users` table, including authentication
credentials, onboarding instruction consent status, and bidirectional relationships to all
tracked activity models (app usage, browser visits, YouTube sessions, and permissions).
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Type checking import guards prevent circular imports during runtime execution
if TYPE_CHECKING:
    from app.models.app_usage import AppUsage
    from app.models.browser_activity import BrowserActivity
    from app.models.permission import Permission
    from app.models.youtube_activity import YouTubeActivity


# ==============================================================================
# User ORM Model
# ==============================================================================
class User(Base):
    """SQLAlchemy model representing an application user account.

    Stores authentication details, onboarding flags, and acts as the parent entity
    for all tracked activity and permission settings.
    """

    __tablename__ = "users"

    # ==========================================================================
    # Primary Key & Authentication Columns
    # ==========================================================================
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # ==========================================================================
    # Onboarding & Instructions Consent Tracking Columns
    # ==========================================================================
    has_accepted_instructions: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=func.false(),
        nullable=False,
    )
    instructions_accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    instructions_version: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    # ==========================================================================
    # Cascading ORM Relationships
    # ==========================================================================
    # 1-to-1 relationship with tracking permissions (cascade deletes on account removal)
    permission: Mapped["Permission"] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # 1-to-many relationship with desktop application usage sessions
    app_usages: Mapped[list["AppUsage"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # 1-to-many relationship with web browser domain and page visits
    browser_activities: Mapped[list["BrowserActivity"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # 1-to-many relationship with tracked YouTube video watch sessions
    youtube_activities: Mapped[list["YouTubeActivity"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
