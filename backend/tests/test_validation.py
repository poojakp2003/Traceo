import uuid
import pytest
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from app.models.user import User


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def cleanup_user_by_email(email: str):
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        if user:
            db.delete(user)
            db.commit()


def test_valid_signup(client: TestClient):
    email = f"valid_{uuid.uuid4().hex[:6]}@example.com"
    password = "StrongPassword99!"
    try:
        res = client.post("/auth/signup", json={"email": email, "password": password})
        assert res.status_code == 201
        data = res.json()
        assert data["email"] == email.lower()
    finally:
        cleanup_user_by_email(email)


def test_signup_disposable_email_rejected(client: TestClient):
    res = client.post(
        "/auth/signup",
        json={"email": "tester@tempmail.com", "password": "StrongPassword99!"},
    )
    assert res.status_code == 422
    assert "Disposable and temporary email addresses are not allowed" in str(res.json())


def test_signup_invalid_email_format(client: TestClient):
    invalid_emails = [
        "notanemail",
        "missingatsign.com",
        "user@nodomain",
        "user@domain.1",
        "user..name@example.com",
    ]
    for em in invalid_emails:
        res = client.post("/auth/signup", json={"email": em, "password": "StrongPassword99!"})
        assert res.status_code == 422, f"Expected 422 for invalid email: {em}"


def test_signup_password_too_short(client: TestClient):
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    res = client.post("/auth/signup", json={"email": email, "password": "Aa1!"})
    assert res.status_code == 422
    assert "at least 8 characters" in str(res.json())


def test_signup_password_missing_uppercase(client: TestClient):
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    res = client.post("/auth/signup", json={"email": email, "password": "lowercase123!"})
    assert res.status_code == 422
    assert "uppercase letter" in str(res.json())


def test_signup_password_missing_lowercase(client: TestClient):
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    res = client.post("/auth/signup", json={"email": email, "password": "UPPERCASE123!"})
    assert res.status_code == 422
    assert "lowercase letter" in str(res.json())


def test_signup_password_missing_number(client: TestClient):
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    res = client.post("/auth/signup", json={"email": email, "password": "NoNumberPass!"})
    assert res.status_code == 422
    assert "number" in str(res.json())


def test_signup_password_missing_special_char(client: TestClient):
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    res = client.post("/auth/signup", json={"email": email, "password": "NoSpecialChar123"})
    assert res.status_code == 422
    assert "special character" in str(res.json())


def test_signup_password_contains_email_username(client: TestClient):
    email = "johndoe@example.com"
    res = client.post("/auth/signup", json={"email": email, "password": "JohnDoePass123!"})
    assert res.status_code == 422
    assert "email username" in str(res.json())


def test_signup_common_weak_password_rejected(client: TestClient):
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    res = client.post("/auth/signup", json={"email": email, "password": "Password123!"})
    assert res.status_code == 422
    assert "too common" in str(res.json())
