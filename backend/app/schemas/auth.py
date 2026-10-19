"""Authentication, account, and authorization Pydantic schemas.

This module defines request/response models and input validation rules for user registration,
login credentials, token exchanges, instruction consent acknowledgment, and password changes.
"""

from datetime import datetime
import re

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    computed_field,
    field_validator,
)

# ==============================================================================
# Security Filters: Disposable Emails & Weak Password Lists
# ==============================================================================
# Block disposable/throwaway email domains to ensure valid user account creation
DISPOSABLE_EMAIL_DOMAINS = {
    "mailinator.com",
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "yopmail.com",
    "trashmail.com",
    "sharklasers.com",
    "dispostable.com",
    "getairmail.com",
    "throwawaymail.com",
    "temp-mail.org",
    "fakeinbox.com",
    "generator.email",
    "mohmal.com",
    "crazymailing.com",
    "burnermail.io",
}

# Block trivial or default passwords that are vulnerable to dictionary attacks
COMMON_WEAK_PASSWORDS = {
    "password",
    "password123",
    "password123!",
    "admin123",
    "admin123!",
    "welcome123",
    "welcome123!",
    "12345678",
    "123456789",
    "qwerty123",
    "traceo123",
    "traceo123!",
    "letmein123!",
    "changeme123!",
}

# Regex pattern for structural email syntax checking
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


# ==============================================================================
# Validation Helpers
# ==============================================================================
def validate_strict_email(email_str: str) -> str:
    """Enforces strict RFC and real-world email constraints.

    Checks:
    - Length constraints (max 254 chars total, max 64 for username)
    - Consecutive periods and leading/trailing period prohibition
    - Valid domain and minimum 2-letter top-level domain (TLD)
    - Exclusion of disposable/temporary email provider domains
    """
    cleaned = email_str.strip().lower()
    if len(cleaned) > 254:
        raise ValueError("Email address cannot exceed 254 characters.")
    if ".." in cleaned:
        raise ValueError("Email address cannot contain consecutive periods.")
    if not EMAIL_REGEX.match(cleaned):
        raise ValueError("Please provide a valid email address.")

    parts = cleaned.split("@")
    if len(parts) != 2:
        raise ValueError("Please provide a valid email address.")

    local, domain = parts
    if len(local) > 64:
        raise ValueError("Email username cannot exceed 64 characters.")
    if local.startswith(".") or local.endswith("."):
        raise ValueError("Email username cannot start or end with a period.")

    domain_parts = domain.split(".")
    if len(domain_parts) < 2 or any(len(p) == 0 for p in domain_parts):
        raise ValueError("Email domain must be complete and valid.")

    tld = domain_parts[-1]
    if len(tld) < 2 or not tld.isalpha():
        raise ValueError("Email top-level domain must contain at least 2 letters (e.g. .com, .org).")

    if domain in DISPOSABLE_EMAIL_DOMAINS:
        raise ValueError("Disposable and temporary email addresses are not allowed. Please use a permanent email address.")

    return cleaned


def validate_strict_password(password: str) -> str:
    """Enforces enterprise/OWASP-grade password complexity rules.

    Requires:
    - 8 to 128 characters in length
    - At least one uppercase letter (A-Z)
    - At least one lowercase letter (a-z)
    - At least one digit (0-9)
    - At least one special symbol (!@#$%^&*...)
    - Not present in known common/default password list
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if len(password) > 128:
        raise ValueError("Password cannot exceed 128 characters.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter (A-Z).")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter (a-z).")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one number (0-9).")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~]", password):
        raise ValueError("Password must contain at least one special character (!@#$%^&*...).")

    normalized = password.lower().strip()
    if normalized in COMMON_WEAK_PASSWORDS:
        raise ValueError("Password is too common or easily guessed. Please choose a stronger password.")

    return password


# ==============================================================================
# Authentication Request Schemas
# ==============================================================================
class SignupRequest(BaseModel):
    """Schema for user signup request payload with strict real-world validation."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: EmailStr) -> str:
        """Validate email format and check against disposable domains."""
        return validate_strict_email(str(v))

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets complexity and strength criteria."""
        return validate_strict_password(v)


class LoginRequest(BaseModel):
    """Schema for user login request payload."""

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    """Schema for exchanging a refresh token for a new token pair."""

    refresh_token: str = Field(min_length=1)


class ChangePasswordRequest(BaseModel):
    """Schema for changing the password of the currently authenticated user."""

    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        """Validate that the new password meets complexity rules."""
        return validate_strict_password(v)


# ==============================================================================
# Onboarding & Consent Request Schemas
# ==============================================================================
class AcceptInstructionsRequest(BaseModel):
    """Schema for accepting instructions and tracking consent."""

    version: str = "1.0"


# ==============================================================================
# Response Schemas
# ==============================================================================
class UserResponse(BaseModel):
    """Schema for returning user account details to frontend clients.

    Includes camelCase computed properties for seamless JavaScript consumption.
    """

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    email: EmailStr
    created_at: datetime
    has_accepted_instructions: bool = False
    instructions_accepted_at: datetime | None = None
    instructions_version: str | None = None

    @computed_field
    @property
    def hasAcceptedInstructions(self) -> bool:
        """CamelCase alias for has_accepted_instructions."""
        return self.has_accepted_instructions

    @computed_field
    @property
    def acceptedAt(self) -> datetime | None:
        """CamelCase alias for instructions_accepted_at."""
        return self.instructions_accepted_at

    @computed_field
    @property
    def instructionsVersion(self) -> str | None:
        """CamelCase alias for instructions_version."""
        return self.instructions_version


class TokenResponse(BaseModel):
    """Schema for returning authentication JWT tokens to client applications."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"