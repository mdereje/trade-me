from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import (
    LoginRequest,
    PhoneNumberRequest,
    PhoneVerifyRequest,
    SocialTokenRequest,
    UserCreate,
    UserResponse,
)
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.utils.security import create_access_token

router = APIRouter()


@router.post("/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    auth_service = AuthService(db)
    user_service = UserService(db)

    if user_service.get_user_by_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    if user_service.get_user_by_username(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    if user_data.phone_number and user_service.get_user_by_phone(user_data.phone_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )

    if not user_data.password and not any(
        [user_data.google_id, user_data.facebook_id, user_data.twitter_id]
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required for email registration.",
        )

    user = auth_service.create_user(user_data)
    token = create_access_token(data={"sub": user.email})
    user_response = UserResponse.model_validate(user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_response.model_dump(),
    }


@router.post("/login")
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password JSON payload."""
    auth_service = AuthService(db)
    result = auth_service.authenticate_user(credentials.email, credentials.password)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token, user = result
    user_response = UserResponse.model_validate(user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_response.model_dump(),
    }


@router.post("/google")
async def google_auth(payload: SocialTokenRequest, db: Session = Depends(get_db)):
    """Authenticate with Google OAuth token."""
    auth_service = AuthService(db)
    result = auth_service.authenticate_google(payload.token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )
    token, user = result
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump(),
    }


@router.post("/facebook")
async def facebook_auth(payload: SocialTokenRequest, db: Session = Depends(get_db)):
    """Authenticate with Facebook OAuth token."""
    auth_service = AuthService(db)
    result = auth_service.authenticate_facebook(payload.token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Facebook token",
        )
    token, user = result
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump(),
    }


@router.post("/twitter")
async def twitter_auth(payload: SocialTokenRequest, db: Session = Depends(get_db)):
    """Authenticate with Twitter OAuth token."""
    auth_service = AuthService(db)
    result = auth_service.authenticate_twitter(payload.token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Twitter token",
        )
    token, user = result
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump(),
    }


@router.post("/verify-phone")
async def verify_phone(payload: PhoneVerifyRequest, db: Session = Depends(get_db)):
    """Verify phone number with SMS code."""
    auth_service = AuthService(db)
    result = auth_service.verify_phone_number(
        payload.phone_number, payload.verification_code
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code",
        )
    return {"message": "Phone number verified successfully"}


@router.post("/send-verification")
async def send_verification(payload: PhoneNumberRequest, db: Session = Depends(get_db)):
    """Send SMS verification code."""
    auth_service = AuthService(db)
    result = auth_service.send_phone_verification(payload.phone_number)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to send verification code",
        )
    return {"message": "Verification code sent"}
