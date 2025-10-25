from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, index=True)
    phone_verified = Column(Boolean, default=False)

    # Location
    zip_code = Column(String)
    city = Column(String)
    state = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)

    # Social auth
    google_id = Column(String, unique=True)
    facebook_id = Column(String, unique=True)
    twitter_id = Column(String, unique=True)

    # Profile
    bio = Column(Text)
    profile_picture = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))

    # Relationships
    items = relationship("Item", back_populates="owner")
    trade_offers_made = relationship(
        "TradeOffer", foreign_keys="TradeOffer.offerer_id", back_populates="offerer")
    trade_offers_received = relationship(
        "TradeOffer", foreign_keys="TradeOffer.item_owner_id", back_populates="item_owner")
    reviews_given = relationship(
        "Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    reviews_received = relationship(
        "Review", foreign_keys="Review.reviewee_id", back_populates="reviewee")
    subscription = relationship(
        "Subscription", back_populates="user", uselist=False)
