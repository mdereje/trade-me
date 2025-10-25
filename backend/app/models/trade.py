from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class TradeStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TradeOfferStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COUNTERED = "countered"
    WITHDRAWN = "withdrawn"


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(TradeStatus), default=TradeStatus.PENDING)

    # Items being traded
    item1_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    item2_id = Column(Integer, ForeignKey("items.id"), nullable=False)

    # Users involved
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Trade details
    notes = Column(Text)
    meeting_location = Column(String)
    meeting_time = Column(DateTime(timezone=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))

    # Relationships
    item1 = relationship("Item", foreign_keys=[item1_id])
    item2 = relationship("Item", foreign_keys=[item2_id])
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])


class TradeOffer(Base):
    __tablename__ = "trade_offers"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(TradeOfferStatus), default=TradeOfferStatus.PENDING)

    # The item being offered for trade
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    item_owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # The user making the offer
    offerer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # The item being offered in exchange
    offered_item_id = Column(Integer, ForeignKey("items.id"), nullable=False)

    # Offer details
    message = Column(Text)
    is_counter_offer = Column(Boolean, default=False)
    parent_offer_id = Column(Integer, ForeignKey("trade_offers.id"))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    responded_at = Column(DateTime(timezone=True))

    # Relationships
    item = relationship("Item", foreign_keys=[
                        item_id], back_populates="trade_offers")
    item_owner = relationship("User", foreign_keys=[
                              item_owner_id], back_populates="trade_offers_received")
    offerer = relationship("User", foreign_keys=[
                           offerer_id], back_populates="trade_offers_made")
    offered_item = relationship("Item", foreign_keys=[offered_item_id])
    parent_offer = relationship("TradeOffer", remote_side=[id])
    counter_offers = relationship("TradeOffer", back_populates="parent_offer")
