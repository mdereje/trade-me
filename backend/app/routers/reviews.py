from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate
from app.services.review_service import ReviewService
from app.utils.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=ReviewResponse)
async def create_review(
    review_data: ReviewCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a review for a completed trade"""
    review_service = ReviewService(db)
    return review_service.create_review(review_data, current_user.id)


@router.get("/user/{user_id}", response_model=List[ReviewResponse])
async def get_user_reviews(
    user_id: int,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get reviews for a user"""
    review_service = ReviewService(db)
    return review_service.get_user_reviews(user_id, limit, offset)


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific review"""
    review_service = ReviewService(db)
    review = review_service.get_review(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    return review


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    review_update: ReviewUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a review"""
    review_service = ReviewService(db)
    review = review_service.update_review(
        review_id, review_update, current_user.id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found or not authorized"
        )
    return review


@router.delete("/{review_id}")
async def delete_review(
    review_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a review"""
    review_service = ReviewService(db)
    success = review_service.delete_review(review_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found or not authorized"
        )
    return {"message": "Review deleted successfully"}


@router.get("/trade/{trade_id}", response_model=List[ReviewResponse])
async def get_trade_reviews(
    trade_id: int,
    db: Session = Depends(get_db)
):
    """Get reviews for a specific trade"""
    review_service = ReviewService(db)
    return review_service.get_trade_reviews(trade_id)
