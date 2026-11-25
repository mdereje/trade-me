from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import bcrypt
from jose import JWTError, jwt

INSECURE_DEFAULT_SECRET = "your-secret-key-here"
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)


def _is_dev_or_test() -> bool:
    env = os.getenv("ENV", "").lower()
    return env in ("development", "test") or bool(os.getenv("PYTEST_CURRENT_TEST"))


def get_secret_key() -> str:
    """Return JWT signing key, failing closed outside dev/test environments."""
    secret = os.getenv("SECRET_KEY", "").strip()
    if not secret or secret == INSECURE_DEFAULT_SECRET:
        if _is_dev_or_test():
            return "dev-only-insecure-secret-key-do-not-use-in-prod"
        raise RuntimeError(
            "SECRET_KEY environment variable must be set to a strong secret in production."
        )
    return secret


def validate_security_config() -> None:
    """Validate required security settings at application startup."""
    get_secret_key()


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        get_secret_key(),
        algorithm=os.getenv("ALGORITHM", ALGORITHM),
    )


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token."""
    try:
        return jwt.decode(
            token,
            get_secret_key(),
            algorithms=[os.getenv("ALGORITHM", ALGORITHM)],
        )
    except JWTError:
        return None
