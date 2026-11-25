import os
import sys

import pytest
from fastapi.testclient import TestClient

# Use a lightweight SQLite database for tests to avoid external dependencies
TEST_DB_URL = "sqlite:///./test.db"
os.environ["DATABASE_URL"] = TEST_DB_URL
os.environ["ENV"] = "test"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest"

# Ensure the project root is on the path before importing the FastAPI app
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from main import app  # noqa: E402
from app.utils.security import get_secret_key, INSECURE_DEFAULT_SECRET  # noqa: E402

client = TestClient(app)


def test_root_endpoint():
    """Test the root endpoint returns correct message"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Trade Me API is running!"}


def test_health_endpoint():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_cors_preflight():
    """Test that CORS preflight requests succeed"""
    response = client.options("/")
    assert response.status_code in (200, 204, 405)


def test_secret_key_fails_closed_in_production(monkeypatch):
    """Production must fail closed when SECRET_KEY is unset or insecure default"""
    monkeypatch.setenv("ENV", "production")
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    monkeypatch.delenv("SECRET_KEY", raising=False)
    with pytest.raises(RuntimeError):
        get_secret_key()

    monkeypatch.setenv("SECRET_KEY", INSECURE_DEFAULT_SECRET)
    with pytest.raises(RuntimeError):
        get_secret_key()


def test_social_auth_fails_closed_when_unconfigured(monkeypatch):
    """Social auth endpoints must reject tokens when provider creds are unset"""
    monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
    monkeypatch.delenv("FACEBOOK_CLIENT_ID", raising=False)
    monkeypatch.delenv("TWITTER_CLIENT_ID", raising=False)
    monkeypatch.delenv("ALLOW_MOCK_SOCIAL_AUTH", raising=False)

    assert client.post("/api/auth/google", params={"google_token": "fake"}).status_code == 401
    assert client.post("/api/auth/facebook", params={"facebook_token": "fake"}).status_code == 401
    assert client.post("/api/auth/twitter", params={"twitter_token": "fake"}).status_code == 401


def test_public_user_profile_strips_private_pii():
    """Public user profile endpoints must not expose email or phone_number"""
    reg = client.post(
        "/api/auth/register",
        json={
            "email": "privacycheck@example.com",
            "username": "privacycheck",
            "full_name": "Privacy Check",
            "password": "StrongPassword123!",
            "phone_number": "+15550001111",
            "city": "Austin",
            "state": "TX",
        },
    )
    assert reg.status_code == 200, reg.text
    user_id = reg.json()["user"]["id"]
    token = reg.json()["access_token"]

    # Public endpoint omits email & phone_number
    public_resp = client.get(f"/api/users/{user_id}")
    assert public_resp.status_code == 200
    public_body = public_resp.json()
    assert public_body["username"] == "privacycheck"
    assert "email" not in public_body
    assert "phone_number" not in public_body

    # Search endpoint omits email & phone_number
    search_resp = client.get("/api/users/", params={"q": "privacycheck"})
    assert search_resp.status_code == 200
    assert len(search_resp.json()) >= 1
    assert "email" not in search_resp.json()[0]
    assert "phone_number" not in search_resp.json()[0]

    # /me endpoint still returns private fields to authenticated owner
    me_resp = client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "privacycheck@example.com"
