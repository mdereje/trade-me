from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models.review import Review
from app.models.trade import Trade, TradeStatus
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate
from app.schemas.user import UserSummary


class ReviewService:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self):
        return self.db.query(Review).options(
            joinedload(Review.reviewer),
            joinedload(Review.reviewee),
        )

    @staticmethod
    def _serialize(review: Review) -> ReviewResponse:
        return ReviewResponse(
            id=review.id,
            reviewer_id=None if review.is_anonymous else review.reviewer_id,
            reviewee_id=review.reviewee_id,
            trade_id=review.trade_id,
            rating=review.rating,
            title=review.title,
            comment=review.comment,
            is_public=review.is_public,
            is_anonymous=review.is_anonymous,
            created_at=review.created_at,
            updated_at=review.updated_at,
            reviewer=(
                None
                if review.is_anonymous
                else UserSummary.model_validate(review.reviewer)
            ),
            reviewee=UserSummary.model_validate(review.reviewee),
        )

    def create_review(self, review_data: ReviewCreate, reviewer_id: int) -> ReviewResponse:
        """Create a validated review for a completed trade."""
        trade = self.db.query(Trade).filter(Trade.id == review_data.trade_id).first()
        if not trade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trade not found.",
            )

        if trade.status != TradeStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reviews can only be left for completed trades.",
            )

        participants = {trade.user1_id, trade.user2_id}
        if reviewer_id not in participants:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only participants in a trade can review it.",
            )

        expected_reviewee = (
            trade.user2_id if reviewer_id == trade.user1_id else trade.user1_id
        )
        if review_data.reviewee_id != expected_reviewee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reviewee must be the other participant in the trade.",
            )

        existing = (
            self.db.query(Review)
            .filter(
                Review.trade_id == review_data.trade_id,
                Review.reviewer_id == reviewer_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed this trade.",
            )

        db_review = Review(
            reviewer_id=reviewer_id,
            reviewee_id=review_data.reviewee_id,
            trade_id=review_data.trade_id,
            rating=review_data.rating,
            title=review_data.title,
            comment=review_data.comment,
            is_public=review_data.is_public,
            is_anonymous=review_data.is_anonymous,
        )

        self.db.add(db_review)
        self.db.commit()
        loaded = self._base_query().filter(Review.id == db_review.id).first()
        return self._serialize(loaded)

    def get_review(self, review_id: int) -> Optional[ReviewResponse]:
        """Get a specific review."""
        review = self._base_query().filter(Review.id == review_id).first()
        return self._serialize(review) if review else None

    def get_user_reviews(
        self, user_id: int, limit: int = 20, offset: int = 0
    ) -> List[ReviewResponse]:
        """Get public reviews for a user."""
        reviews = (
            self._base_query()
            .filter(Review.reviewee_id == user_id, Review.is_public == True)
            .order_by(Review.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return [self._serialize(r) for r in reviews]

    def get_trade_reviews(self, trade_id: int) -> List[ReviewResponse]:
        """Get reviews for a specific trade."""
        reviews = self._base_query().filter(Review.trade_id == trade_id).all()
        return [self._serialize(r) for r in reviews]

    def update_review(
        self, review_id: int, review_update: ReviewUpdate, user_id: int
    ) -> Optional[ReviewResponse]:
        """Update a review authored by the caller."""
        review = self._base_query().filter(Review.id == review_id).first()
        if not review or review.reviewer_id != user_id:
            return None

        update_data = review_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(review, field, value)

        self.db.commit()
        self.db.refresh(review)
        return self._serialize(review)

    def delete_review(self, review_id: int, user_id: int) -> bool:
        """Delete a review authored by the caller."""
        review = self.db.query(Review).filter(Review.id == review_id).first()
        if not review or review.reviewer_id != user_id:
            return False

        self.db.delete(review)
        self.db.commit()
        return True
