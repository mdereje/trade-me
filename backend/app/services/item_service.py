from sqlalchemy.orm import Session
from app.models.item import Item, ItemCategory
from app.schemas.item import ItemCreate, ItemUpdate
from typing import List, Optional


class ItemService:
    def __init__(self, db: Session):
        self.db = db

    def get_categories(self) -> List[ItemCategory]:
        """Get all item categories"""
        return self.db.query(ItemCategory).all()

    def create_item(self, item_data: ItemCreate, owner_id: int) -> Item:
        """Create a new item"""
        db_item = Item(
            title=item_data.title,
            description=item_data.description,
            condition=item_data.condition,
            zip_code=item_data.zip_code,
            city=item_data.city,
            state=item_data.state,
            category_id=item_data.category_id,
            owner_id=owner_id
        )

        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def get_item(self, item_id: int) -> Optional[Item]:
        """Get item by ID"""
        return self.db.query(Item).filter(Item.id == item_id).first()

    def get_items(self, category_id: int = None, zip_code: str = None,
                  city: str = None, radius: float = None, latitude: float = None,
                  longitude: float = None, search_query: str = None,
                  limit: int = 20, offset: int = 0) -> List[Item]:
        """Get items with filters"""
        query = self.db.query(Item).filter(Item.is_visible == True)

        if category_id:
            query = query.filter(Item.category_id == category_id)

        if zip_code:
            query = query.filter(Item.zip_code == zip_code)

        if city:
            query = query.filter(Item.city.ilike(f"%{city}%"))

        if search_query:
            query = query.filter(
                Item.title.ilike(f"%{search_query}%") |
                Item.description.ilike(f"%{search_query}%")
            )

        return query.offset(offset).limit(limit).all()

    def update_item(self, item_id: int, item_update: ItemUpdate, user_id: int) -> Optional[Item]:
        """Update item"""
        item = self.get_item(item_id)
        if not item or item.owner_id != user_id:
            return None

        update_data = item_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)

        self.db.commit()
        self.db.refresh(item)
        return item

    def delete_item(self, item_id: int, user_id: int) -> bool:
        """Delete item"""
        item = self.get_item(item_id)
        if not item or item.owner_id != user_id:
            return False

        self.db.delete(item)
        self.db.commit()
        return True

    def get_user_items(self, user_id: int, limit: int = 20, offset: int = 0) -> List[Item]:
        """Get items by user"""
        return self.db.query(Item).filter(
            Item.owner_id == user_id
        ).offset(offset).limit(limit).all()

    def upload_photos(self, item_id: int, photos: List, user_id: int) -> bool:
        """Upload photos for an item"""
        item = self.get_item(item_id)
        if not item or item.owner_id != user_id:
            return False

        # TODO: Implement actual photo upload
        return True
