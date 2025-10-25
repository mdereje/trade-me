from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import get_password_hash, verify_password, create_access_token
from app.utils.phone_verification import send_verification_sms, verify_sms_code
from app.utils.social_auth import verify_google_token, verify_facebook_token, verify_twitter_token
from typing import Optional
import os
from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user"""
        # Hash password if provided
        hashed_password = None
        if user_data.password:
            hashed_password = get_password_hash(user_data.password)

        # Create user
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            phone_number=user_data.phone_number,
            zip_code=user_data.zip_code,
            city=user_data.city,
            state=user_data.state,
            bio=user_data.bio,
            google_id=user_data.google_id,
            facebook_id=user_data.facebook_id,
            twitter_id=user_data.twitter_id
        )

        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def authenticate_user(self, email: str, password: str) -> Optional[str]:
        """Authenticate user with email and password"""
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.password_hash):
            return None

        # Update last login
        user.last_login = func.now()
        self.db.commit()

        return create_access_token(data={"sub": user.email})

    def authenticate_google(self, google_token: str) -> Optional[str]:
        """Authenticate user with Google token"""
        user_info = verify_google_token(google_token)
        if not user_info:
            return None

        # Find or create user
        user = self.db.query(User).filter(
            or_(User.google_id == user_info['id'],
                User.email == user_info['email'])
        ).first()

        if not user:
            # Create new user
            user = User(
                email=user_info['email'],
                username=user_info['email'].split('@')[0],
                full_name=user_info['name'],
                google_id=user_info['id']
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        else:
            # Update Google ID if not set
            if not user.google_id:
                user.google_id = user_info['id']
                self.db.commit()

        user.last_login = func.now()
        self.db.commit()

        return create_access_token(data={"sub": user.email})

    def authenticate_facebook(self, facebook_token: str) -> Optional[str]:
        """Authenticate user with Facebook token"""
        user_info = verify_facebook_token(facebook_token)
        if not user_info:
            return None

        # Find or create user
        user = self.db.query(User).filter(
            or_(User.facebook_id ==
                user_info['id'], User.email == user_info['email'])
        ).first()

        if not user:
            # Create new user
            user = User(
                email=user_info['email'],
                username=user_info['email'].split('@')[0],
                full_name=user_info['name'],
                facebook_id=user_info['id']
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        else:
            # Update Facebook ID if not set
            if not user.facebook_id:
                user.facebook_id = user_info['id']
                self.db.commit()

        user.last_login = func.now()
        self.db.commit()

        return create_access_token(data={"sub": user.email})

    def authenticate_twitter(self, twitter_token: str) -> Optional[str]:
        """Authenticate user with Twitter token"""
        user_info = verify_twitter_token(twitter_token)
        if not user_info:
            return None

        # Find or create user
        user = self.db.query(User).filter(
            or_(User.twitter_id == user_info['id'],
                User.email == user_info['email'])
        ).first()

        if not user:
            # Create new user
            user = User(
                email=user_info['email'],
                username=user_info['username'],
                full_name=user_info['name'],
                twitter_id=user_info['id']
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        else:
            # Update Twitter ID if not set
            if not user.twitter_id:
                user.twitter_id = user_info['id']
                self.db.commit()

        user.last_login = func.now()
        self.db.commit()

        return create_access_token(data={"sub": user.email})

    def send_phone_verification(self, phone_number: str) -> bool:
        """Send SMS verification code"""
        return send_verification_sms(phone_number)

    def verify_phone_number(self, phone_number: str, code: str) -> bool:
        """Verify phone number with SMS code"""
        if verify_sms_code(phone_number, code):
            # Update user's phone verification status
            user = self.db.query(User).filter(
                User.phone_number == phone_number).first()
            if user:
                user.phone_verified = True
                self.db.commit()
            return True
        return False


# get_current_user moved to app.utils.auth
