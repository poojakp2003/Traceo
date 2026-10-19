"""User account and onboarding instructions router.

This module exposes user-centric endpoints, specifically handling user consent and acknowledgment
of tracking terms and instructions during onboarding.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.auth import AcceptInstructionsRequest, UserResponse

# ==============================================================================
# Router Configuration
# ==============================================================================
router = APIRouter(prefix="/api/users", tags=["users"])


# ==============================================================================
# Instructions Acceptance Endpoint
# ==============================================================================
@router.post("/accept-instructions", response_model=UserResponse)
def accept_instructions(
    payload: AcceptInstructionsRequest | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Record user consent and acceptance of tracking instructions and guidelines.

    Flow:
    1. Authenticates the current user via JWT bearer token.
    2. Extracts the instructions version (defaults to "1.0").
    3. Updates user fields (has_accepted_instructions, timestamp, version).
    4. Commits changes to PostgreSQL and returns the updated User model.
    """
    version = payload.version if payload and payload.version else "1.0"
    current_user.has_accepted_instructions = True
    current_user.instructions_accepted_at = datetime.now(timezone.utc)
    current_user.instructions_version = version
    db.commit()
    db.refresh(current_user)
    return current_user
