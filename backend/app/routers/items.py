from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse, ItemCategoryResponse
from app.services.item_service import ItemService
from app.utils.auth import get_current_user

router = APIRouter()


@router.get("/categories", response_model=List[ItemCategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    """Get all item categories"""
    item_service = ItemService(db)
    return item_service.get_categories()


@router.post("/", response_model=ItemResponse)
async def create_item(
    item_data: ItemCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new item"""
    item_service = ItemService(db)
    return item_service.create_item(item_data, current_user.id)


@router.get("/", response_model=List[ItemResponse])
async def get_items(
    category_id: Optional[int] = None,
    zip_code: Optional[str] = None,
    city: Optional[str] = None,
    radius: Optional[float] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    q: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get items with filters"""
    item_service = ItemService(db)
    return item_service.get_items(
        category_id=category_id,
        zip_code=zip_code,
        city=city,
        radius=radius,
        latitude=latitude,
        longitude=longitude,
        search_query=q,
        limit=limit,
        offset=offset
    )


@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    """Get item by ID"""
    item_service = ItemService(db)
    item = item_service.get_item(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    return item


@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: int,
    item_update: ItemUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update item"""
    item_service = ItemService(db)
    item = item_service.update_item(item_id, item_update, current_user.id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or not authorized"
        )
    return item


@router.delete("/{item_id}")
async def delete_item(
    item_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete item"""
    item_service = ItemService(db)
    success = item_service.delete_item(item_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or not authorized"
        )
    return {"message": "Item deleted successfully"}


@router.post("/{item_id}/photos")
async def upload_photos(
    item_id: int,
    photos: List[UploadFile] = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload photos for an item"""
    item_service = ItemService(db)
    result = item_service.upload_photos(item_id, photos, current_user.id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or not authorized"
        )
    return {"message": "Photos uploaded successfully"}


@router.get("/user/{user_id}", response_model=List[ItemResponse])
async def get_user_items(
    user_id: int,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get items by user"""
    item_service = ItemService(db)
    return item_service.get_user_items(user_id, limit, offset)
