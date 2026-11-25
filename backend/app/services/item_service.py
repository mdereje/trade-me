import math
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from app.models.item import Item, ItemCategory, ItemPhoto, ItemStatus
from app.schemas.item import ItemCreate, ItemUpdate
from app.utils.storage import upload_item_photo

MAX_PHOTOS_PER_ITEM = 5


def _haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in miles between two coordinates."""
    earth_radius_miles = 3958.8
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return 2 * earth_radius_miles * math.asin(math.sqrt(a))


class ItemService:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self):
        return self.db.query(Item).options(
            joinedload(Item.photos),
            joinedload(Item.category),
            joinedload(Item.owner),
        )

    def get_categories(self) -> List[ItemCategory]:
        """Get all item categories ordered by ID."""
        return self.db.query(ItemCategory).order_by(ItemCategory.id.asc()).all()

    def create_item(self, item_data: ItemCreate, owner_id: int) -> Item:
        """Create a new item and any initial photo records."""
        category = (
            self.db.query(ItemCategory)
            .filter(ItemCategory.id == item_data.category_id)
            .first()
        )
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category_id.",
            )

        db_item = Item(
            title=item_data.title,
            description=item_data.description,
            condition=item_data.condition,
            zip_code=item_data.zip_code,
            city=item_data.city,
            state=item_data.state,
            latitude=item_data.latitude,
            longitude=item_data.longitude,
            category_id=item_data.category_id,
            owner_id=owner_id,
            status=ItemStatus.ACTIVE,
            is_visible=True,
        )

        self.db.add(db_item)
        self.db.flush()

        for idx, photo in enumerate(item_data.photos[:MAX_PHOTOS_PER_ITEM]):
            self.db.add(
                ItemPhoto(
                    item_id=db_item.id,
                    photo_url=photo.photo_url,
                    is_primary=photo.is_primary or idx == 0,
                    order_index=photo.order_index if photo.order_index else idx,
                )
            )

        self.db.commit()
        return self.get_item(db_item.id)

    def get_item(self, item_id: int) -> Optional[Item]:
        """Get item by ID with eager-loaded relations."""
        return self._base_query().filter(Item.id == item_id).first()

    def get_items(
        self,
        category_id: Optional[int] = None,
        zip_code: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        location: Optional[str] = None,
        radius: Optional[float] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        search_query: Optional[str] = None,
        sort: str = "newest",
        limit: int = 20,
        offset: int = 0,
    ) -> List[Item]:
        """Get active, visible items with search, category, location, radius, and sort filters."""
        query = self._base_query().filter(
            Item.is_visible == True,
            Item.status == ItemStatus.ACTIVE,
        )

        if category_id:
            query = query.filter(Item.category_id == category_id)

        if zip_code:
            query = query.filter(Item.zip_code == zip_code)

        if city:
            query = query.filter(Item.city.ilike(f"%{city}%"))

        if state:
            query = query.filter(Item.state.ilike(f"%{state}%"))

        if location:
            loc = location.strip()
            query = query.filter(
                or_(
                    Item.zip_code.ilike(f"{loc}%"),
                    Item.city.ilike(f"%{loc}%"),
                    Item.state.ilike(f"%{loc}%"),
                )
            )

        if search_query:
            q = search_query.strip()
            query = query.filter(
                or_(
                    Item.title.ilike(f"%{q}%"),
                    Item.description.ilike(f"%{q}%"),
                )
            )

        if sort == "oldest":
            query = query.order_by(Item.created_at.asc())
        elif sort == "category":
            query = query.order_by(Item.category_id.asc(), Item.created_at.desc())
        else:
            query = query.order_by(Item.created_at.desc())

        # If geo-radius filtering is requested, apply Haversine distance filter in Python
        if radius is not None and latitude is not None and longitude is not None:
            candidates = query.filter(
                Item.latitude.isnot(None),
                Item.longitude.isnot(None),
            ).all()
            filtered = [
                (
                    _haversine_miles(latitude, longitude, item.latitude, item.longitude),
                    item,
                )
                for item in candidates
            ]
            within = [pair for pair in filtered if pair[0] <= radius]
            if sort == "distance":
                within.sort(key=lambda pair: pair[0])
            return [item for _, item in within[offset : offset + limit]]

        return query.offset(offset).limit(limit).all()

    def update_item(
        self, item_id: int, item_update: ItemUpdate, user_id: int
    ) -> Optional[Item]:
        """Update item owned by user."""
        item = self.get_item(item_id)
        if not item or item.owner_id != user_id:
            return None

        update_data = item_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)

        self.db.commit()
        return self.get_item(item_id)

    def delete_item(self, item_id: int, user_id: int) -> bool:
        """Delete item owned by user."""
        item = self.get_item(item_id)
        if not item or item.owner_id != user_id:
            return False

        self.db.delete(item)
        self.db.commit()
        return True

    def get_user_items(
        self, user_id: int, include_all_statuses: bool = False, limit: int = 50, offset: int = 0
    ) -> List[Item]:
        """Get items owned by a user."""
        query = self._base_query().filter(Item.owner_id == user_id)
        if not include_all_statuses:
            query = query.filter(
                Item.is_visible == True,
                Item.status == ItemStatus.ACTIVE,
            )
        return query.order_by(Item.created_at.desc()).offset(offset).limit(limit).all()

    async def upload_photos(
        self, item_id: int, photos: List[UploadFile], user_id: int
    ) -> Optional[List[ItemPhoto]]:
        """Validate, store, and attach uploaded photos to an item."""
        item = self.get_item(item_id)
        if not item or item.owner_id != user_id:
            return None

        existing_count = len(item.photos)
        if existing_count + len(photos) > MAX_PHOTOS_PER_ITEM:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An item can have at most {MAX_PHOTOS_PER_ITEM} photos.",
            )

        has_primary = any(p.is_primary for p in item.photos)
        created_photos: List[ItemPhoto] = []

        for idx, upload in enumerate(photos):
            photo_url = await upload_item_photo(upload, item_id)
            is_primary = (not has_primary) and (idx == 0)
            record = ItemPhoto(
                item_id=item_id,
                photo_url=photo_url,
                is_primary=is_primary,
                order_index=existing_count + idx,
            )
            self.db.add(record)
            created_photos.append(record)

        self.db.commit()
        for record in created_photos:
            self.db.refresh(record)
        return created_photos
