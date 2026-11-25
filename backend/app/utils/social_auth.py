import logging
import os
from typing import Dict, Optional
import requests

logger = logging.getLogger(__name__)


def _mock_social_enabled() -> bool:
    return (
        os.getenv("ENV", "").lower() in ("development", "test")
        and os.getenv("ALLOW_MOCK_SOCIAL_AUTH", "").lower() == "true"
    )


def verify_google_token(token: str) -> Optional[Dict]:
    """Verify Google OAuth token and return user info."""
    try:
        if not os.getenv("GOOGLE_CLIENT_ID"):
            if _mock_social_enabled():
                return {
                    "id": "mock_google_id",
                    "email": "user@gmail.com",
                    "name": "Mock User",
                }
            logger.warning("Google OAuth attempted but GOOGLE_CLIENT_ID is not configured.")
            return None

        response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        logger.error("Error verifying Google token: %s", e)
        return None


def verify_facebook_token(token: str) -> Optional[Dict]:
    """Verify Facebook OAuth token and return user info."""
    try:
        if not os.getenv("FACEBOOK_CLIENT_ID"):
            if _mock_social_enabled():
                return {
                    "id": "mock_facebook_id",
                    "email": "user@facebook.com",
                    "name": "Mock User",
                }
            logger.warning("Facebook OAuth attempted but FACEBOOK_CLIENT_ID is not configured.")
            return None

        response = requests.get(
            "https://graph.facebook.com/me",
            params={"access_token": token, "fields": "id,name,email"},
            timeout=10,
        )
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        logger.error("Error verifying Facebook token: %s", e)
        return None


def verify_twitter_token(token: str) -> Optional[Dict]:
    """Verify Twitter OAuth token and return user info."""
    try:
        if not os.getenv("TWITTER_CLIENT_ID"):
            if _mock_social_enabled():
                return {
                    "id": "mock_twitter_id",
                    "email": "user@twitter.com",
                    "name": "Mock User",
                    "username": "mockuser",
                }
            logger.warning("Twitter OAuth attempted but TWITTER_CLIENT_ID is not configured.")
            return None

        # Production Twitter OAuth 2.0 user lookup is not yet implemented; fail closed.
        logger.warning("Twitter OAuth verification is not implemented in production.")
        return None
    except Exception as e:
        logger.error("Error verifying Twitter token: %s", e)
        return None
