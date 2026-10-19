"""Database configuration and session management module using SQLAlchemy.

This module initializes the SQLAlchemy database engine using the configured connection URL,
defines the session factory for interacting with PostgreSQL, establishes the declarative base
class for all ORM models, and provides a FastAPI dependency for request-scoped database sessions.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# ==============================================================================
# Database Engine Initialization
# ==============================================================================
# The engine manages the pool of connections to the PostgreSQL database.
engine = create_engine(settings.database_url)


# ==============================================================================
# Session Factory
# ==============================================================================
# SessionLocal generates individual database sessions.
# autocommit=False ensures transactions are explicitly controlled with db.commit().
# autoflush=False prevents automatic premature flushes before commit.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ==============================================================================
# Declarative Base Class
# ==============================================================================
# Base class that all SQLAlchemy ORM models (User, AppUsage, BrowserActivity, etc.) inherit from.
class Base(DeclarativeBase):
    """Declarative base class for all SQLAlchemy ORM models."""

    pass


# ==============================================================================
# Database Session Dependency for FastAPI
# ==============================================================================
def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session with automatic cleanup.

    This generator creates a new database session per incoming HTTP request,
    yields it to the route handler, and guarantees the session is properly closed
    in the finally block when the request finishes, returning the connection to the pool.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
