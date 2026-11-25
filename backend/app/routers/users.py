from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.user import UserResponse, UserUpdate, UserProfile, PublicUserProfile
from app.services.user_service import UserService
from app.utils.auth import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    user_service = UserService(db)
    return user_service.get_user_profile(current_user.id)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    user_service = UserService(db)
    return user_service.update_user(current_user.id, user_update)


@router.get("/{user_id}", response_model=PublicUserProfile)
async def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get public user profile by ID (omits private email and phone)"""
    user_service = UserService(db)
    user = user_service.get_public_user_profile(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.get("/", response_model=List[PublicUserProfile])
async def search_users(
    q: str = None,
    city: str = None,
    state: str = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Search public user profiles by name, city, or state"""
    user_service = UserService(db)
    return user_service.search_users(q, city, state, limit, offset)
