from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)

    # Users involved
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Trade being reviewed
    trade_id = Column(Integer, ForeignKey("trades.id"), nullable=False)

    # Review content
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String, nullable=False)
    comment = Column(Text)

    # Review visibility
    is_public = Column(Boolean, default=True)
    is_anonymous = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    reviewer = relationship("User", foreign_keys=[
                            reviewer_id], back_populates="reviews_given")
    reviewee = relationship("User", foreign_keys=[
                            reviewee_id], back_populates="reviews_received")
    trade = relationship("Trade")
