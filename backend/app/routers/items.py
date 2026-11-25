from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.item import Item, ItemStatus
from app.models.subscription import Subscription
from app.schemas.item import (
    ItemCategoryResponse,
    ItemCreate,
    ItemPhotoResponse,
    ItemResponse,
    ItemUpdate,
)
from app.services.item_service import ItemService
from app.services.payment_service import FREE_ACTIVE_LISTING_LIMIT, is_subscription_active
from app.utils.auth import get_current_user

router = APIRouter()


@router.get("/categories", response_model=List[ItemCategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    """Get all item categories (public)."""
    item_service = ItemService(db)
    return item_service.get_categories()


@router.get("/my/listings", response_model=List[ItemResponse])
async def get_my_items(
    limit: int = 50,
    offset: int = 0,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all items listed by the authenticated user (active, traded, archived)."""
    item_service = ItemService(db)
    return item_service.get_user_items(
        current_user.id, include_all_statuses=True, limit=limit, offset=offset
    )


@router.post("/", response_model=ItemResponse)
async def create_item(
    item_data: ItemCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new item (first active item is free; additional items require membership)."""
    active_count = (
        db.query(Item)
        .filter(Item.owner_id == current_user.id, Item.status == ItemStatus.ACTIVE)
        .count()
    )
    if active_count >= FREE_ACTIVE_LISTING_LIMIT:
        sub = (
            db.query(Subscription)
            .filter(Subscription.user_id == current_user.id)
            .first()
        )
        if not is_subscription_active(sub):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "code": "SUBSCRIPTION_REQUIRED",
                    "message": "Free accounts can list 1 active item. Upgrade to Trade Me Membership ($0.99/month or $10/year) for unlimited listings and trading.",
                    "pricing_url": "/pricing",
                },
            )
    item_service = ItemService(db)
    return item_service.create_item(item_data, current_user.id)


@router.get("/", response_model=List[ItemResponse])
async def get_items(
    category_id: Optional[int] = None,
    zip_code: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    location: Optional[str] = None,
    radius: Optional[float] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    q: Optional[str] = None,
    sort: str = "newest",
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Browse active items with search, category, location, geo-radius, and sort filters (public)."""
    item_service = ItemService(db)
    return item_service.get_items(
        category_id=category_id,
        zip_code=zip_code,
        city=city,
        state=state,
        location=location,
        radius=radius,
        latitude=latitude,
        longitude=longitude,
        search_query=q,
        sort=sort,
        limit=limit,
        offset=offset,
    )


@router.get("/user/{user_id}", response_model=List[ItemResponse])
async def get_user_items(
    user_id: int,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Get public active items listed by a specific user."""
    item_service = ItemService(db)
    return item_service.get_user_items(user_id, include_all_statuses=False, limit=limit, offset=offset)


@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(item_id: int, db: Session = Depends(get_db)):
    """Get item details by ID (public)."""
    item_service = ItemService(db)
    item = item_service.get_item(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    return item


@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: int,
    item_update: ItemUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update item owned by current user."""
    item_service = ItemService(db)
    item = item_service.update_item(item_id, item_update, current_user.id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or not authorized",
        )
    return item


@router.delete("/{item_id}")
async def delete_item(
    item_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete item owned by current user."""
    item_service = ItemService(db)
    success = item_service.delete_item(item_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or not authorized",
        )
    return {"message": "Item deleted successfully"}


@router.post("/{item_id}/photos", response_model=List[ItemPhotoResponse])
async def upload_photos(
    item_id: int,
    photos: List[UploadFile] = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload one or more photos for an item."""
    item_service = ItemService(db)
    result = await item_service.upload_photos(item_id, photos, current_user.id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or not authorized",
        )
    return result
