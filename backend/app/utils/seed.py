from sqlalchemy.orm import Session
from app.models.item import ItemCategory

DEFAULT_CATEGORIES = [
    {"name": "Electronics", "description": "Phones, laptops, audio, gaming, and gadgets", "icon": "📱"},
    {"name": "Furniture", "description": "Chairs, tables, desks, shelves, and home furnishings", "icon": "🪑"},
    {"name": "Books", "description": "Fiction, non-fiction, textbooks, and comics", "icon": "📚"},
    {"name": "Clothing", "description": "Apparel, jackets, shoes, and accessories", "icon": "👕"},
    {"name": "Tools", "description": "Hand tools, power tools, and workshop gear", "icon": "🔧"},
    {"name": "Sports", "description": "Bikes, fitness gear, camping, and outdoor equipment", "icon": "⚽"},
    {"name": "Home & Garden", "description": "Kitchen appliances, plants, decor, and lawn care", "icon": "🏡"},
    {"name": "Toys & Games", "description": "Board games, puzzles, collectibles, and kids toys", "icon": "🎲"},
    {"name": "Musical Instruments", "description": "Guitars, keyboards, drums, and studio equipment", "icon": "🎸"},
    {"name": "Other", "description": "Everyday items that do not fit another category", "icon": "📦"},
]


def seed_default_categories(db: Session) -> int:
    """Ensure default item categories exist (idempotent). Returns count inserted."""
    existing_names = {row[0] for row in db.query(ItemCategory.name).all()}
    inserted = 0
    for cat in DEFAULT_CATEGORIES:
        if cat["name"] not in existing_names:
            db.add(ItemCategory(**cat))
            inserted += 1
    if inserted:
        db.commit()
    return inserted
