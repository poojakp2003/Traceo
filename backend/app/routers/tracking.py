"""Activity tracking ingestion and data logging router.

This module accepts incoming telemetry data from client agents:
- Desktop window/application usage tracking
- Browser navigation and page visit logging
- YouTube playback and watch duration monitoring
- User tracking permission queries and updates

Also implements permission validation checks and URL sanitization filters to discard internal project origins.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.app_usage import AppUsage
from app.models.browser_activity import BrowserActivity
from app.models.permission import Permission
from app.models.user import User
from app.models.youtube_activity import YouTubeActivity
from app.routers.auth import get_current_user
from app.schemas.tracking import (
    AppUsageCreate,
    AppUsageResponse,
    BrowserActivityCreate,
    BrowserActivityResponse,
    PermissionResponse,
    PermissionUpdate,
    YouTubeActivityCreate,
    YouTubeActivityResponse,
)

# ==============================================================================
# Router Configuration
# ==============================================================================
router = APIRouter(prefix="/track", tags=["tracking"])


# ==============================================================================
# User Permissions Helper Function
# ==============================================================================
def get_or_create_user_permission(db: Session, user_id: int) -> Permission:
    """Ensure a user has a permissions record, creating default if missing.

    Args:
        db: Active database session.
        user_id: Target user ID.

    Returns:
        The existing or newly initialized Permission ORM model instance.
    """
    perm = db.scalar(select(Permission).where(Permission.user_id == user_id))
    if perm is None:
        perm = Permission(
            user_id=user_id,
            app_tracking=True,
            browser_tracking=True,
            youtube_tracking=True,
        )
        db.add(perm)
        db.commit()
        db.refresh(perm)
    return perm


def normalize_app_name(name: str) -> str:
    """Normalize common process or application names to human-friendly titles."""
    if not name:
        return name
    lower = name.strip().lower()
    if lower in ("whatsapp.root", "whatsapp.root.exe", "whatsapp.exe"):
        return "WhatsApp"
    return name


# ==============================================================================
# Desktop Application Usage Ingestion Endpoints
# ==============================================================================
@router.post(
    "/app-usage",
    response_model=AppUsageResponse | list[AppUsageResponse],
    status_code=status.HTTP_201_CREATED,
)
def track_app_usage(
    payload: AppUsageCreate | list[AppUsageCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AppUsage | list[AppUsage]:
    """Record application usage session(s) if app tracking permission is enabled.

    Flow:
    1. Verifies that the user has not disabled app_tracking in their permissions.
    2. Supports both single session payloads and batch list payloads.
    3. Persists records to the app_usage PostgreSQL table.
    """
    permission = get_or_create_user_permission(db, current_user.id)
    if not permission.app_tracking:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="App tracking is disabled in user settings",
        )

    # Block: Handle list/batch ingestion of application usage items
    if isinstance(payload, list):
        if not payload:
            return []
        records = [
            AppUsage(
                user_id=current_user.id,
                app_name=normalize_app_name(item.app_name),
                window_title=item.window_title,
                start_time=item.start_time,
                end_time=item.end_time,
                duration_seconds=item.duration_seconds,
            )
            for item in payload
        ]
        db.add_all(records)
        db.commit()
        for r in records:
            db.refresh(r)
        return records

    # Block: Handle single application usage item ingestion
    record = AppUsage(
        user_id=current_user.id,
        app_name=normalize_app_name(payload.app_name),
        window_title=payload.window_title,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration_seconds=payload.duration_seconds,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post(
    "/app-usage/batch",
    response_model=list[AppUsageResponse],
    status_code=status.HTTP_201_CREATED,
)
def track_app_usage_batch(
    payload: list[AppUsageCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AppUsage]:
    """Record a batch of application usage sessions submitted by a background worker."""
    result = track_app_usage(payload, current_user, db)
    return result if isinstance(result, list) else [result]


# ==============================================================================
# Internal URL Filtering Utilities
# ==============================================================================
# Local origins and development ports that should not be tracked as user web history
IGNORED_HOSTS = [
    "localhost:5173",
    "127.0.0.1:5173",
    "localhost:8000",
    "127.0.0.1:8000",
    "localhost:3000",
    "127.0.0.1:3000",
]


def is_project_url(url: str | None) -> bool:
    """Check if URL points to the local project frontend or backend services.

    Prevents self-monitoring loop when the user browses the Traceo web dashboard itself.
    """
    if not url:
        return False
    cleaned = url.strip().lower()
    for host in IGNORED_HOSTS:
        if host in cleaned:
            return True
    try:
        from urllib.parse import urlparse
        target = cleaned if cleaned.startswith(("http://", "https://")) else "https://" + cleaned
        parsed = urlparse(target)
        hostname = (parsed.hostname or "").lower()
        port = parsed.port
        if hostname in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
            if port in (5173, 8000, 3000) or not port:
                return True
    except Exception:
        pass
    return False


# ==============================================================================
# Browser Activity Ingestion Endpoints
# ==============================================================================
@router.post(
    "/browser-activity",
    response_model=BrowserActivityResponse | list[BrowserActivityResponse],
    status_code=status.HTTP_201_CREATED,
)
def track_browser_activity(
    payload: BrowserActivityCreate | list[BrowserActivityCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BrowserActivity | list[BrowserActivity]:
    """Record browser activity session(s) if browser tracking permission is enabled.

    Flow:
    1. Checks browser_tracking permission flag.
    2. Filters out self-referencing development URLs (e.g. localhost:5173).
    3. Stores external website visits in PostgreSQL.
    """
    permission = get_or_create_user_permission(db, current_user.id)
    if not permission.browser_tracking:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Browser tracking is disabled in user settings",
        )

    # Block: Handle batch submission of browser navigation events
    if isinstance(payload, list):
        if not payload:
            return []
        valid_items = [item for item in payload if not is_project_url(item.url)]
        if not valid_items:
            return []
        records = [
            BrowserActivity(
                user_id=current_user.id,
                browser=item.browser,
                url=item.url,
                title=item.title,
                timestamp=item.timestamp,
            )
            for item in valid_items
        ]
        db.add_all(records)
        db.commit()
        for r in records:
            db.refresh(r)
        return records

    # Block: Filter out self-referential project URL visits without saving to DB
    if is_project_url(payload.url):
        return BrowserActivity(
            id=0,
            user_id=current_user.id,
            browser=payload.browser,
            url=payload.url,
            title=payload.title,
            timestamp=payload.timestamp,
        )

    # Block: Handle single browser activity record persistence
    record = BrowserActivity(
        user_id=current_user.id,
        browser=payload.browser,
        url=payload.url,
        title=payload.title,
        timestamp=payload.timestamp,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post(
    "/browser-activity/batch",
    response_model=list[BrowserActivityResponse],
    status_code=status.HTTP_201_CREATED,
)
def track_browser_activity_batch(
    payload: list[BrowserActivityCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[BrowserActivity]:
    """Record a batch of browser activity events submitted by the browser extension."""
    result = track_browser_activity(payload, current_user, db)
    return result if isinstance(result, list) else [result]


# ==============================================================================
# YouTube Activity Ingestion Endpoint
# ==============================================================================
@router.post(
    "/youtube-activity",
    response_model=YouTubeActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
def track_youtube_activity(
    payload: YouTubeActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> YouTubeActivity:
    """Record YouTube viewing activity if YouTube tracking permission is enabled.

    Flow:
    1. Verifies that the user has opted into YouTube tracking.
    2. Creates YouTubeActivity record with video title, ID, URL, and watched duration.
    3. Saves record to database and returns the logged activity.
    """
    permission = get_or_create_user_permission(db, current_user.id)
    if not permission.youtube_tracking:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="YouTube tracking is disabled in user settings",
        )

    record = YouTubeActivity(
        user_id=current_user.id,
        video_id=payload.video_id,
        video_title=payload.video_title,
        url=payload.url,
        watched_time_seconds=payload.watched_time_seconds,
        timestamp=payload.timestamp,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ==============================================================================
# Tracking Permissions Endpoints
# ==============================================================================
@router.get(
    "/permissions",
    response_model=PermissionResponse,
    status_code=status.HTTP_200_OK,
)
def get_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Permission:
    """Retrieve tracking permission flags for the currently authenticated user."""
    return get_or_create_user_permission(db, current_user.id)


@router.put(
    "/permissions",
    response_model=PermissionResponse,
    status_code=status.HTTP_200_OK,
)
def update_permissions(
    payload: PermissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Permission:
    """Update tracking permission flags (app_tracking, browser_tracking, youtube_tracking)."""
    perm = get_or_create_user_permission(db, current_user.id)

    if payload.app_tracking is not None:
        perm.app_tracking = payload.app_tracking
    if payload.browser_tracking is not None:
        perm.browser_tracking = payload.browser_tracking
    if payload.youtube_tracking is not None:
        perm.youtube_tracking = payload.youtube_tracking

    db.commit()
    db.refresh(perm)
    return perm
