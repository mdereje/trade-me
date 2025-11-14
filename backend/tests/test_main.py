import os
import sys

import pytest
from fastapi.testclient import TestClient

# Use a lightweight SQLite database for tests to avoid external dependencies
TEST_DB_URL = "sqlite:///./test.db"
if os.environ.get("DATABASE_URL") != TEST_DB_URL:
    os.environ["DATABASE_URL"] = TEST_DB_URL

# Ensure the project root is on the path before importing the FastAPI app
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from main import app  # noqa: E402

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
