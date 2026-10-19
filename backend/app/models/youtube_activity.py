"""YouTube activity model module defining the database schema for video tracking.

This module stores YouTube video playback sessions captured by the browser extension,
including the unique video ID, video title, watched duration in seconds, and visit timestamp.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


# ==============================================================================
# YouTube Activity ORM Model
# ==============================================================================
class YouTubeActivity(Base):
    """SQLAlchemy model representing watched YouTube videos and watch duration.

    Records playback duration and metadata for individual YouTube videos watched by the user.
    """

    __tablename__ = "youtube_activity"

    # ==========================================================================
    # Primary Key & Foreign Keys
    # ==========================================================================
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    # ==========================================================================
    # YouTube Video Details & Watch Metrics
    # ==========================================================================
    video_id: Mapped[str] = mapped_column(String(64), index=True)         # YouTube 11-char video ID
    video_title: Mapped[str] = mapped_column(String(512), nullable=False) # Title of the video
    url: Mapped[str] = mapped_column(Text, nullable=False)                 # Complete video URL
    watched_time_seconds: Mapped[int] = mapped_column(                    # Total playback duration
        Integer,
        nullable=False,
        default=0,
    )
    timestamp: Mapped[datetime] = mapped_column(                          # Watch session time
        DateTime(timezone=True),
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # ==========================================================================
    # Relationships
    # ==========================================================================
    user: Mapped["User"] = relationship(back_populates="youtube_activities")
