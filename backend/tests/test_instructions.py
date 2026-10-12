from collections.abc import Generator
import uuid
import pytest
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from app.models.user import User


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    """Provide a TestClient instance for API tests."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def user_session(client: TestClient) -> Generator[tuple[dict[str, str], int], None, None]:
    """Create a temporary test user and yield Authorization headers and user id."""
    test_email = f"instruct_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "SecurePassword123!"

    # Signup
    signup_res = client.post("/auth/signup", json={"email": test_email, "password": test_password})
    assert signup_res.status_code == 201
    user_id = signup_res.json()["id"]

    # Login
    login_res = client.post("/auth/login", json={"email": test_email, "password": test_password})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    yield headers, user_id

    # Teardown
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if user:
            db.delete(user)
            db.commit()


def test_unauthorized_accept_instructions_rejected(client: TestClient) -> None:
    """Ensure unauthorized requests cannot accept instructions."""
    res = client.post("/api/users/accept-instructions", json={"version": "1.0"})
    assert res.status_code == 401


def test_new_user_has_not_accepted_instructions(client: TestClient, user_session: tuple[dict[str, str], int]) -> None:
    """New user starts with instructions unaccepted."""
    headers, _ = user_session
    res = client.get("/auth/me", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["has_accepted_instructions"] is False
    assert data["instructions_accepted_at"] is None
    assert data["instructions_version"] is None
    assert data.get("hasAcceptedInstructions") is False


def test_accept_instructions_success(client: TestClient, user_session: tuple[dict[str, str], int]) -> None:
    """Accepting instructions records acceptance, version, and timestamp."""
    headers, _ = user_session
    res = client.post("/api/users/accept-instructions", json={"version": "1.0"}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["has_accepted_instructions"] is True
    assert data["instructions_version"] == "1.0"
    assert data["instructions_accepted_at"] is not None
    assert data.get("hasAcceptedInstructions") is True

    # Verify /auth/me reflects the updated state
    me_res = client.get("/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["has_accepted_instructions"] is True
    assert me_data["instructions_version"] == "1.0"
    assert me_data["instructions_accepted_at"] is not None


def test_accept_instructions_version_bump(client: TestClient, user_session: tuple[dict[str, str], int]) -> None:
    """Accepting a bumped version updates the version string."""
    headers, _ = user_session
    res = client.post("/auth/accept-instructions", json={"version": "2.0"}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["has_accepted_instructions"] is True
    assert data["instructions_version"] == "2.0"
