"""FastAPI application entry point for the Traceo activity tracking service.

This module initializes the FastAPI app, manages application lifespan events (startup cleanup
and database migrations), configures CORS middleware for frontend communication, and registers
all modular API routers.
"""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_, text
from sqlalchemy.orm import Session

# Core database dependencies and session factory
from app.core.database import SessionLocal, get_db

# Modular API routers for each domain of the tracking application
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.permissions import router as permissions_router
from app.routers.tracking import router as tracking_router
from app.routers.users import router as users_router


# ==============================================================================
# Application Lifespan Handler (Startup and Shutdown Lifecycle)
# ==============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifespan handler.

    Executes startup maintenance tasks before incoming requests are accepted:
    1. Purges legacy internal development project URLs from the browser activity log
       to ensure dashboard statistics reflect only external browsing.
    2. Performs idempotent schema updates (adding missing instruction-acceptance columns
       to the users table) to guarantee backward compatibility without requiring manual SQL.
    """
    try:
        from app.models.browser_activity import BrowserActivity

        # List of internal dev origins that should not be tracked as user web activity
        ignored_hosts = [
            "localhost:5173",
            "127.0.0.1:5173",
            "localhost:8000",
            "127.0.0.1:8000",
            "localhost:3000",
            "127.0.0.1:3000",
        ]
        with SessionLocal() as db:
            # Block: Purge legacy internal dev URLs from the tracking database
            cond = or_(*(BrowserActivity.url.ilike(f"%{h}%") for h in ignored_hosts))
            deleted = db.query(BrowserActivity).filter(cond).delete(synchronize_session=False)
            if deleted:
                print(f"[Tracker API] Purged {deleted} legacy internal project URL records.")

            # Block: Apply non-destructive database migrations for onboarding/instruction acceptance
            try:
                db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS has_accepted_instructions BOOLEAN DEFAULT FALSE NOT NULL"))
                db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS instructions_accepted_at TIMESTAMP WITH TIME ZONE"))
                db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS instructions_version VARCHAR(50)"))
                db.commit()
            except Exception as e:
                # Rollback if an error occurs so the session remains clean
                db.rollback()
                print(f"[Tracker API] Column check notice: {e}")
    except Exception as exc:
        print(f"[Tracker API] Startup cleanup notice: {exc}")

    # Yield control to the application while it runs
    yield

    # Shutdown logic can be placed here if needed (e.g. closing connection pools)


# ==============================================================================
# FastAPI App Initialization
# ==============================================================================
app = FastAPI(title="Tracker API", version="1.0.0", lifespan=lifespan)


# ==============================================================================
# Cross-Origin Resource Sharing (CORS) Middleware
# ==============================================================================
# Allow the Vite frontend development servers to communicate with this backend API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# Router Registrations
# ==============================================================================
# Mount all API endpoints under their respective path prefixes
app.include_router(auth_router)         # Authentication & token endpoints (/auth)
app.include_router(users_router)        # User profile & instructions endpoints (/api/users)
app.include_router(permissions_router)  # Tracking permission preferences (/permissions)
app.include_router(tracking_router)     # Activity ingestion for apps, browser, & YouTube (/track)
app.include_router(dashboard_router)    # Aggregated metrics, charts & history (/dashboard)


# ==============================================================================
# Root & Health Check Endpoints
# ==============================================================================
@app.get("/")
def root() -> dict[str, str]:
    """Default endpoint returning service name and version."""
    return {"name": "Traceo", "version": "1.0.0"}


@app.get("/health")
def health() -> dict[str, str]:
    """Basic health check endpoint returning server availability status."""
    return {"status": "ok"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)) -> dict[str, str]:
    """Database connectivity health check verifying database ping."""
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
