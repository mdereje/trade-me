from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User
from app.schemas.user import UserUpdate, UserProfile
from typing import List, Optional


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_profile(self, user_id: int) -> Optional[UserProfile]:
        """Get user profile with stats"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        # Mock stats - replace with actual queries
        return UserProfile(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            phone_number=user.phone_number,
            phone_verified=user.phone_verified,
            is_active=user.is_active,
            is_verified=user.is_verified,
            profile_picture=user.profile_picture,
            created_at=user.created_at,
            last_login=user.last_login,
            zip_code=user.zip_code,
            city=user.city,
            state=user.state,
            bio=user.bio,
            items_count=0,
            trades_completed=0,
            average_rating=0.0,
            reviews_count=0
        )

    def update_user(self, user_id: int, user_update: UserUpdate) -> Optional[User]:
        """Update user profile"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def search_users(self, q: str = None, city: str = None, state: str = None,
                     limit: int = 20, offset: int = 0) -> List[UserProfile]:
        """Search users"""
        query = self.db.query(User)

        if q:
            query = query.filter(
                or_(
                    User.full_name.ilike(f"%{q}%"),
                    User.username.ilike(f"%{q}%")
                )
            )

        if city:
            query = query.filter(User.city.ilike(f"%{city}%"))

        if state:
            query = query.filter(User.state.ilike(f"%{state}%"))

        users = query.offset(offset).limit(limit).all()
        return [self.get_user_profile(user.id) for user in users if user]
