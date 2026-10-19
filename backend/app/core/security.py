"""Security utilities for password hashing and JSON Web Token (JWT) management.

This module provides enterprise-standard password hashing using `pwdlib` (Argon2 / bcrypt),
and JWT token creation, encoding, verification, and decoding for user authentication sessions.
"""

from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError

from app.core.config import settings

# ==============================================================================
# Password Hashing Engine & Token Constants
# ==============================================================================
# Initialize the recommended password hasher (Argon2id/Bcrypt based on system capabilities)
password_hash = PasswordHash.recommended()

# JWT signing algorithm (HMAC SHA-256)
ALGORITHM = "HS256"

# Lifespan constants for generated tokens
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Short-lived token for authorizing API requests
REFRESH_TOKEN_EXPIRE_DAYS = 30    # Long-lived token for refreshing expired access tokens


# ==============================================================================
# Password Operations
# ==============================================================================
def hash_password(password: str) -> str:
    """Hash a plaintext password using the recommended password hasher.

    Args:
        password: The plaintext user password.

    Returns:
        Secure salted password hash string ready for storage in PostgreSQL.
    """
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored password hash.

    Args:
        password: The plaintext password entered by the user.
        hashed_password: The existing hash stored in the database.

    Returns:
        True if the password matches the hash, False otherwise.
    """
    try:
        return password_hash.verify(password, hashed_password)
    except UnknownHashError:
        # Handles legacy or corrupted hashes safely without crashing
        return False


# ==============================================================================
# Internal Token Generator
# ==============================================================================
def _create_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    """Internal helper to construct and cryptographically sign a JWT payload.

    Args:
        subject: The subject identifier (typically the user ID string).
        token_type: Token classification ("access" or "refresh").
        expires_delta: Duration until the token expires.

    Returns:
        Encoded and signed JWT string.
    """
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {"sub": subject, "type": token_type, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


# ==============================================================================
# Public Token Creation Functions
# ==============================================================================
def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    """Create a short-lived access token used for authorising API requests.

    Args:
        subject: The user ID to encode into the token.
        expires_delta: Optional custom expiration timedelta; defaults to 60 minutes.

    Returns:
        Encoded JWT access token.
    """
    return _create_token(
        subject,
        "access",
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(subject: str) -> str:
    """Create a long-lived refresh token used to obtain a new access token.

    Args:
        subject: The user ID to encode into the token.

    Returns:
        Encoded JWT refresh token.
    """
    return _create_token(subject, "refresh", timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))


# ==============================================================================
# Internal Token Decoder & Validator
# ==============================================================================
def _decode_token(token: str, expected_type: str) -> str:
    """Validate token signature, verify expiration, ensure token type, and extract subject.

    Args:
        token: The raw JWT string from the request.
        expected_type: The expected token type ("access" or "refresh").

    Returns:
        The extracted subject (user ID) string.

    Raises:
        jwt.InvalidTokenError: If token is expired, invalid, tampered, or wrong type.
    """
    payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(f"Expected {expected_type} token")
    subject = payload.get("sub")
    if subject is None:
        raise jwt.InvalidTokenError("Token missing subject")
    return str(subject)


# ==============================================================================
# Public Token Decoding Functions
# ==============================================================================
def decode_access_token(token: str) -> str:
    """Validate an access token and return its subject (user ID).

    Args:
        token: The JWT access token string from HTTP Authorization header.

    Returns:
        The validated user ID.
    """
    return _decode_token(token, "access")


def decode_refresh_token(token: str) -> str:
    """Validate a refresh token and return its subject (user ID).

    Args:
        token: The JWT refresh token string from refresh request payload.

    Returns:
        The validated user ID.
    """
    return _decode_token(token, "refresh")