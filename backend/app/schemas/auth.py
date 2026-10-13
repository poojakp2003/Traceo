from datetime import datetime
import re

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    computed_field,
    field_validator,
    model_validator,
)

# Common disposable/temporary email provider domains to block in real-world apps
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

# Common weak or default passwords to disallow
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

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def validate_strict_email(email_str: str) -> str:
    """Enforces strict RFC and real-world email constraints."""
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


def validate_strict_password(password: str, email: str | None = None) -> str:
    """Enforces enterprise/OWASP-grade password complexity rules."""
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


class SignupRequest(BaseModel):
    """Schema for user signup request payload with strict real-world validation."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: EmailStr) -> str:
        return validate_strict_email(str(v))

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        return validate_strict_password(v)


class LoginRequest(BaseModel):
    """Schema for user login request payload."""

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AcceptInstructionsRequest(BaseModel):
    """Schema for accepting instructions and tracking consent."""

    version: str = "1.0"


class UserResponse(BaseModel):
    """Schema for returning user account details."""

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
        return self.has_accepted_instructions

    @computed_field
    @property
    def acceptedAt(self) -> datetime | None:
        return self.instructions_accepted_at

    @computed_field
    @property
    def instructionsVersion(self) -> str | None:
        return self.instructions_version


class TokenResponse(BaseModel):
    """Schema for returning authentication JWT tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """Schema for exchanging a refresh token for a new token pair."""

    refresh_token: str = Field(min_length=1)


class ChangePasswordRequest(BaseModel):
    """Schema for changing the password of the logged-in user."""

    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        return validate_strict_password(v)