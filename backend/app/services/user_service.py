from typing import List, Optional
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.models.item import Item, ItemStatus
from app.models.review import Review
from app.models.trade import Trade, TradeStatus
from app.models.user import User
from app.schemas.user import PublicUserProfile, UserProfile, UserUpdate


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        return self.db.query(User).filter(User.username == username).first()

    def get_user_by_phone(self, phone_number: str) -> Optional[User]:
        """Get user by phone number."""
        return self.db.query(User).filter(User.phone_number == phone_number).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def _compute_stats(self, user_id: int):
        items_count = (
            self.db.query(func.count(Item.id))
            .filter(Item.owner_id == user_id, Item.status == ItemStatus.ACTIVE)
            .scalar()
            or 0
        )
        trades_completed = (
            self.db.query(func.count(Trade.id))
            .filter(
                or_(Trade.user1_id == user_id, Trade.user2_id == user_id),
                Trade.status == TradeStatus.COMPLETED,
            )
            .scalar()
            or 0
        )
        avg_rating, reviews_count = (
            self.db.query(func.avg(Review.rating), func.count(Review.id))
            .filter(Review.reviewee_id == user_id, Review.is_public == True)
            .first()
        )
        return (
            int(items_count),
            int(trades_completed),
            round(float(avg_rating), 2) if avg_rating is not None else None,
            int(reviews_count or 0),
        )

    def get_user_profile(self, user_id: int) -> Optional[UserProfile]:
        """Get full user profile with live aggregated stats."""
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        items_count, trades_completed, average_rating, reviews_count = self._compute_stats(user_id)

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
            items_count=items_count,
            trades_completed=trades_completed,
            average_rating=average_rating,
            reviews_count=reviews_count,
        )

    def get_public_user_profile(self, user_id: int) -> Optional[PublicUserProfile]:
        """Get public-safe user profile without private PII."""
        profile = self.get_user_profile(user_id)
        if not profile:
            return None
        return PublicUserProfile(
            id=profile.id,
            username=profile.username,
            full_name=profile.full_name,
            city=profile.city,
            state=profile.state,
            bio=profile.bio,
            profile_picture=profile.profile_picture,
            is_verified=profile.is_verified,
            created_at=profile.created_at,
            items_count=profile.items_count,
            trades_completed=profile.trades_completed,
            average_rating=profile.average_rating,
            reviews_count=profile.reviews_count,
        )

    def update_user(self, user_id: int, user_update: UserUpdate) -> Optional[User]:
        """Update user profile."""
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        update_data = user_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def search_users(
        self,
        q: str = None,
        city: str = None,
        state: str = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[PublicUserProfile]:
        """Search public user profiles."""
        query = self.db.query(User).filter(User.is_active == True)

        if q:
            query = query.filter(
                or_(
                    User.full_name.ilike(f"%{q}%"),
                    User.username.ilike(f"%{q}%"),
                )
            )

        if city:
            query = query.filter(User.city.ilike(f"%{city}%"))

        if state:
            query = query.filter(User.state.ilike(f"%{state}%"))

        users = query.offset(offset).limit(limit).all()
        profiles = [self.get_public_user_profile(user.id) for user in users if user]
        return [p for p in profiles if p is not None]
