from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class ItemStatus(enum.Enum):
    ACTIVE = "active"
    TRADED = "traded"
    ARCHIVED = "archived"


class ItemCategory(Base):
    __tablename__ = "item_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    icon = Column(String)  # Icon name or URL
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    # New, Like New, Good, Fair, Poor
    condition = Column(String, nullable=False)

    # Location
    zip_code = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)

    # Status and visibility
    status = Column(Enum(ItemStatus), default=ItemStatus.ACTIVE)
    is_visible = Column(Boolean, default=True)

    # Relationships
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey(
        "item_categories.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="items")
    category = relationship("ItemCategory")
    photos = relationship("ItemPhoto", back_populates="item",
                          cascade="all, delete-orphan")
    trade_offers = relationship(
        "TradeOffer", foreign_keys="TradeOffer.item_id", back_populates="item")


class ItemPhoto(Base):
    __tablename__ = "item_photos"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    photo_url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    item = relationship("Item", back_populates="photos")
