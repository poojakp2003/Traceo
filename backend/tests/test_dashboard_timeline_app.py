"""Unit tests for /dashboard/timeline with optional app filtering and custom date range."""

from collections import namedtuple
from datetime import datetime, timezone
from unittest.mock import MagicMock
import pytest

from app.models.user import User
from app.routers.dashboard import get_dashboard_timeline

Record = namedtuple("Record", ["start_time", "duration_seconds"])


def test_timeline_default_query():
    """Verify that default timeline works without breaking existing contracts."""
    user = User(id=1, email="test@example.com")
    db = MagicMock()
    db.execute.return_value.all.return_value = []

    res = get_dashboard_timeline(
        time_range="7d",
        current_user=user,
        db=db,
    )
    assert len(res.items) == 7
    assert res.total_hours == 0.0


def test_timeline_with_app_and_custom_week_range():
    """Verify that timeline returns weekly breakdown for a specific app across Sun-Sat."""
    user = User(id=1, email="test@example.com")
    db = MagicMock()
    # Wednesday 2026-10-28 26 mins (1560 seconds)
    db.execute.return_value.all.return_value = [
        Record(
            start_time=datetime(2026, 10, 28, 14, 0, tzinfo=timezone.utc),
            duration_seconds=1560,
        )
    ]

    res = get_dashboard_timeline(
        time_range="7d",
        app="Google Chrome",
        start_date="2026-10-25",
        end_date="2026-10-31",
        current_user=user,
        db=db,
    )

    assert len(res.items) == 7
    wednesday_item = next((item for item in res.items if item.date == "2026-10-28"), None)
    assert wednesday_item is not None
    assert wednesday_item.duration_seconds == 1560
    assert wednesday_item.duration_formatted == "26 mins"
    assert wednesday_item.hours == 0.43

