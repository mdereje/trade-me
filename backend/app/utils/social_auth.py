import requests
import os
from typing import Optional, Dict


def verify_google_token(token: str) -> Optional[Dict]:
    """Verify Google OAuth token and return user info"""
    try:
        # For development, return mock data
        if not os.getenv("GOOGLE_CLIENT_ID"):
            return {
                "id": "mock_google_id",
                "email": "user@gmail.com",
                "name": "Mock User"
            }

        # In production, verify with Google API
        response = requests.get(
            f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={token}"
        )
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"Error verifying Google token: {e}")
        return None


def verify_facebook_token(token: str) -> Optional[Dict]:
    """Verify Facebook OAuth token and return user info"""
    try:
        # For development, return mock data
        if not os.getenv("FACEBOOK_CLIENT_ID"):
            return {
                "id": "mock_facebook_id",
                "email": "user@facebook.com",
                "name": "Mock User"
            }

        # In production, verify with Facebook API
        response = requests.get(
            f"https://graph.facebook.com/me?access_token={token}&fields=id,name,email"
        )
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"Error verifying Facebook token: {e}")
        return None


def verify_twitter_token(token: str) -> Optional[Dict]:
    """Verify Twitter OAuth token and return user info"""
    try:
        # For development, return mock data
        if not os.getenv("TWITTER_CLIENT_ID"):
            return {
                "id": "mock_twitter_id",
                "email": "user@twitter.com",
                "name": "Mock User",
                "username": "mockuser"
            }

        # In production, verify with Twitter API
        # This would require more complex OAuth 2.0 implementation
        return None
    except Exception as e:
        print(f"Error verifying Twitter token: {e}")
        return None
