from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field


class SignupRequest(BaseModel):
    """Schema for user signup request payload."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


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