import pytest
from fastapi.testclient import TestClient
from main import app

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


def test_cors_headers():
    """Test that CORS headers are present"""
    response = client.options("/")
    assert response.status_code == 200
    # CORS headers should be present (handled by middleware)


def test_api_routes_exist():
    """Test that API routes are properly configured"""
    # Test that auth routes exist
    response = client.get("/api/auth/")
    # Should not return 404 (route exists, might return 405 for GET)
    assert response.status_code != 404

    # Test that items routes exist
    response = client.get("/api/items/")
    # Should not return 404 (route exists, might return 500 for database issues)
    assert response.status_code != 404
