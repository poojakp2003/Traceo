"""Tracking permissions router for user privacy and monitoring controls.

This module provides REST endpoints for reading and modifying user tracking permissions
(application tracking, browser history tracking, and YouTube activity tracking) from the frontend dashboard.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.permission import Permission
from app.models.user import User
from app.routers.auth import get_current_user
from app.routers.tracking import get_or_create_user_permission
from app.schemas.tracking import PermissionResponse, PermissionUpdate

# ==============================================================================
# Router Configuration
# ==============================================================================
router = APIRouter(prefix="/permissions", tags=["permissions"])


# ==============================================================================
# Get Permissions Endpoint
# ==============================================================================
@router.get(
    "",
    response_model=PermissionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user tracking permissions",
)
def get_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Permission:
    """Retrieve tracking permissions for the authenticated user from the database.

    Flow:
    1. Validates the current user's session token.
    2. Queries the database for existing permissions; if none exist, initializes defaults.
    3. Returns the permission flags (app_tracking, browser_tracking, youtube_tracking).
    """
    return get_or_create_user_permission(db, current_user.id)


# ==============================================================================
# Update Permissions Endpoint
# ==============================================================================
@router.put(
    "",
    response_model=PermissionResponse,
    status_code=status.HTTP_200_OK,
    summary="Update user tracking permissions",
)
def update_permissions(
    payload: PermissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Permission:
    """Update tracking permissions in PostgreSQL for the authenticated user.

    Flow:
    1. Loads the existing permissions row (or creates default if absent).
    2. Modifies any non-null fields provided in the payload (app, browser, YouTube).
    3. Commits transaction to PostgreSQL, refreshes instance, and returns updated record.
    """
    perm = get_or_create_user_permission(db, current_user.id)

    # Block: Apply selective field updates based on payload content
    if payload.app_tracking is not None:
        perm.app_tracking = payload.app_tracking
    if payload.browser_tracking is not None:
        perm.browser_tracking = payload.browser_tracking
    if payload.youtube_tracking is not None:
        perm.youtube_tracking = payload.youtube_tracking

    db.commit()
    db.refresh(perm)
    return perm
