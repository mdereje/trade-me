from sqlalchemy.orm import Session
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewUpdate
from typing import List, Optional


class ReviewService:
    def __init__(self, db: Session):
        self.db = db

    def create_review(self, review_data: ReviewCreate, reviewer_id: int) -> Review:
        """Create a review"""
        db_review = Review(
            reviewer_id=reviewer_id,
            reviewee_id=review_data.reviewee_id,
            trade_id=review_data.trade_id,
            rating=review_data.rating,
            title=review_data.title,
            comment=review_data.comment,
            is_public=review_data.is_public,
            is_anonymous=review_data.is_anonymous
        )

        self.db.add(db_review)
        self.db.commit()
        self.db.refresh(db_review)
        return db_review

    def get_review(self, review_id: int) -> Optional[Review]:
        """Get a specific review"""
        return self.db.query(Review).filter(Review.id == review_id).first()

    def get_user_reviews(self, user_id: int, limit: int = 20, offset: int = 0) -> List[Review]:
        """Get reviews for a user"""
        return self.db.query(Review).filter(
            Review.reviewee_id == user_id
        ).offset(offset).limit(limit).all()

    def get_trade_reviews(self, trade_id: int) -> List[Review]:
        """Get reviews for a specific trade"""
        return self.db.query(Review).filter(Review.trade_id == trade_id).all()

    def update_review(self, review_id: int, review_update: ReviewUpdate, user_id: int) -> Optional[Review]:
        """Update a review"""
        review = self.get_review(review_id)
        if not review or review.reviewer_id != user_id:
            return None

        update_data = review_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(review, field, value)

        self.db.commit()
        self.db.refresh(review)
        return review

    def delete_review(self, review_id: int, user_id: int) -> bool:
        """Delete a review"""
        review = self.get_review(review_id)
        if not review or review.reviewer_id != user_id:
            return False

        self.db.delete(review)
        self.db.commit()
        return True
