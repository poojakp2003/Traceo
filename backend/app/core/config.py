"""Application configuration management using Pydantic Settings.

This module resolves the root directory of the backend, locates the local `.env` file,
and automatically parses and validates environment variables (such as the database connection URL
and JWT secret key) into a strongly typed settings object.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# ==============================================================================
# Path Resolution
# ==============================================================================
# Locate the backend root directory (two levels up from this file: backend/app/core -> backend/)
# to reliably locate the .env configuration file regardless of the working directory.
BACKEND_DIR = Path(__file__).resolve().parents[2]


# ==============================================================================
# Settings Configuration Model
# ==============================================================================
class Settings(BaseSettings):
    """Application settings loaded from environment variables and `.env`.

    Attributes:
        database_url: PostgreSQL connection URI (e.g. postgresql://user:pass@host:port/dbname).
        secret_key: Cryptographic secret key used to sign and verify JSON Web Tokens (JWT).
    """

    # Model configuration specifying the source .env file and encoding
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Silently ignore unmapped environment variables
    )

    database_url: str
    secret_key: str


# ==============================================================================
# Singleton Settings Instance
# ==============================================================================
# Instantiate once on module import for use across the entire application
settings = Settings()
