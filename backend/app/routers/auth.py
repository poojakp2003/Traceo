"""User authentication and authorization router.

This module provides endpoints for account registration, credential verification (login),
token refreshing, current user profile retrieval, password modification, and logout handling.
"""

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
    UserResponse,
)

# ==============================================================================
# Router & OAuth2 Scheme Setup
# ==============================================================================
router = APIRouter(prefix="/auth", tags=["auth"])

# OAuth2 password bearer extracts Bearer tokens from the 'Authorization' HTTP header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ==============================================================================
# Dependency: Resolve Current Authenticated User
# ==============================================================================
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validate JWT bearer token from request header and resolve user from database.

    Flow:
    1. Extracts and decodes the JWT access token using the system secret key.
    2. Parses the subject claim ('sub') into the integer user ID.
    3. Looks up the user record in PostgreSQL.
    4. Raises HTTP 401 Unauthorized if the token is invalid, expired, or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id = int(decode_access_token(token))
    except (jwt.InvalidTokenError, ValueError):
        raise credentials_exception from None

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user


# ==============================================================================
# User Registration Endpoint
# ==============================================================================
@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> User:
    """Register a new user account with unique email and hashed password.

    Flow:
    1. Normalizes email to lowercase and checks for existing account collision.
    2. Hashes plaintext password securely using Argon2 / bcrypt.
    3. Persists user row in database with transaction commit and handles integrity errors.
    4. Returns created User representation.
    """
    email = str(payload.email).lower()

    # Block: Check for existing account collision
    existing = db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Block: Create user with salted password hash
    user = User(email=email, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from None
    db.refresh(user)
    return user


# ==============================================================================
# User Login Endpoint
# ==============================================================================
@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Authenticate user credentials and issue access and refresh JWT tokens.

    Flow:
    1. Locates user by normalized email address.
    2. Verifies submitted plaintext password against the stored password hash.
    3. If valid, generates a short-lived access token and long-lived refresh token.
    4. Returns token pair to caller.
    """
    email = str(payload.email).lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


# ==============================================================================
# Token Refresh Endpoint
# ==============================================================================
@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Exchange a valid refresh token for a new access and refresh token pair.

    Flow:
    1. Validates cryptographic signature and expiration of the refresh token.
    2. Extracts user ID from subject claim and verifies user still exists in DB.
    3. Issues a fresh pair of access and refresh tokens.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id = int(decode_refresh_token(payload.refresh_token))
    except (jwt.InvalidTokenError, ValueError):
        raise credentials_exception from None

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


# ==============================================================================
# Current User Profile Endpoint
# ==============================================================================
@router.get("/me", response_model=UserResponse)
def read_me(current_user: User = Depends(get_current_user)) -> User:
    """Retrieve profile and onboarding consent status for the currently authenticated user."""
    return current_user


# ==============================================================================
# Change Password Endpoint
# ==============================================================================
@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Change the password of the currently authenticated user.

    Flow:
    1. Validates current password against stored hash (returns 400 Bad Request if incorrect).
    2. Checks that new password is not identical to current password.
    3. Hashes new password and updates user record in PostgreSQL.
    """
    if not verify_password(payload.current_password, current_user.password_hash):
        # Return 400 rather than 401 to prevent dashboard token refresh/logout triggers
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current one",
        )

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated"}


# ==============================================================================
# Logout Endpoint
# ==============================================================================
@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(current_user: User = Depends(get_current_user)) -> dict[str, str]:
    """Stateless logout acknowledgment endpoint.

    Because authentication relies on stateless JWTs, the client simply discards tokens.
    """
    return {"message": "Logged out successfully"}
