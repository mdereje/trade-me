from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService
from app.utils.auth import get_current_user
from app.services.user_service import UserService

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    auth_service = AuthService(db)
    user_service = UserService(db)

    # Check if user already exists
    existing_user = user_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    user = auth_service.create_user(user_data)
    return user


@router.post("/login")
async def login(email: str, password: str, db: Session = Depends(get_db)):
    """Login with email and password"""
    auth_service = AuthService(db)
    token = auth_service.authenticate_user(email, password)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    return {"access_token": token, "token_type": "bearer"}


@router.post("/google")
async def google_auth(google_token: str, db: Session = Depends(get_db)):
    """Authenticate with Google"""
    auth_service = AuthService(db)
    user = auth_service.authenticate_google(google_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    return {"access_token": user, "token_type": "bearer"}


@router.post("/facebook")
async def facebook_auth(facebook_token: str, db: Session = Depends(get_db)):
    """Authenticate with Facebook"""
    auth_service = AuthService(db)
    user = auth_service.authenticate_facebook(facebook_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Facebook token"
        )
    return {"access_token": user, "token_type": "bearer"}


@router.post("/twitter")
async def twitter_auth(twitter_token: str, db: Session = Depends(get_db)):
    """Authenticate with Twitter"""
    auth_service = AuthService(db)
    user = auth_service.authenticate_twitter(twitter_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Twitter token"
        )
    return {"access_token": user, "token_type": "bearer"}


@router.post("/verify-phone")
async def verify_phone(phone_number: str, verification_code: str, db: Session = Depends(get_db)):
    """Verify phone number with SMS code"""
    auth_service = AuthService(db)
    result = auth_service.verify_phone_number(phone_number, verification_code)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    return {"message": "Phone number verified successfully"}


@router.post("/send-verification")
async def send_verification(phone_number: str, db: Session = Depends(get_db)):
    """Send SMS verification code"""
    auth_service = AuthService(db)
    result = auth_service.send_phone_verification(phone_number)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to send verification code"
        )
    return {"message": "Verification code sent"}
