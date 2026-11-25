from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models.item import Item, ItemStatus
from app.models.trade import Trade, TradeOffer, TradeOfferStatus, TradeStatus
from app.schemas.trade import TradeOfferCreate


class TradeService:
    def __init__(self, db: Session):
        self.db = db

    def _offer_query(self):
        return self.db.query(TradeOffer).options(
            joinedload(TradeOffer.item).joinedload(Item.photos),
            joinedload(TradeOffer.offered_item).joinedload(Item.photos),
            joinedload(TradeOffer.offerer),
            joinedload(TradeOffer.item_owner),
            joinedload(TradeOffer.counter_offers),
        )

    def _trade_query(self):
        return self.db.query(Trade).options(
            joinedload(Trade.item1).joinedload(Item.photos),
            joinedload(Trade.item2).joinedload(Item.photos),
            joinedload(Trade.user1),
            joinedload(Trade.user2),
        )

    def create_trade_offer(self, offer_data: TradeOfferCreate, user_id: int) -> TradeOffer:
        """Create a validated trade offer."""
        target_item = self.db.query(Item).filter(Item.id == offer_data.item_id).first()
        if not target_item or target_item.status != ItemStatus.ACTIVE or not target_item.is_visible:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target item not found or is no longer available for trade.",
            )

        offered_item = self.db.query(Item).filter(Item.id == offer_data.offered_item_id).first()
        if not offered_item or offered_item.status != ItemStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offered item not found or is not active.",
            )

        if offered_item.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only offer items that you own.",
            )

        if target_item.owner_id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot make a trade offer on your own item.",
            )

        db_offer = TradeOffer(
            item_id=target_item.id,
            item_owner_id=target_item.owner_id,
            offerer_id=user_id,
            offered_item_id=offered_item.id,
            message=offer_data.message,
            is_counter_offer=offer_data.is_counter_offer,
            parent_offer_id=offer_data.parent_offer_id,
            status=TradeOfferStatus.PENDING,
        )

        self.db.add(db_offer)
        self.db.commit()
        return self._offer_query().filter(TradeOffer.id == db_offer.id).first()

    def get_received_offers(self, user_id: int) -> List[TradeOffer]:
        """Get trade offers received by user."""
        return (
            self._offer_query()
            .filter(TradeOffer.item_owner_id == user_id)
            .order_by(TradeOffer.created_at.desc())
            .all()
        )

    def get_made_offers(self, user_id: int) -> List[TradeOffer]:
        """Get trade offers made by user."""
        return (
            self._offer_query()
            .filter(TradeOffer.offerer_id == user_id)
            .order_by(TradeOffer.created_at.desc())
            .all()
        )

    def accept_trade_offer(self, offer_id: int, user_id: int) -> Optional[Trade]:
        """Accept a pending trade offer and create an active trade."""
        offer = self.db.query(TradeOffer).filter(TradeOffer.id == offer_id).first()
        if not offer or offer.item_owner_id != user_id:
            return None

        if offer.status != TradeOfferStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot accept an offer with status '{offer.status.value}'.",
            )

        trade = Trade(
            item1_id=offer.item_id,
            item2_id=offer.offered_item_id,
            user1_id=offer.item_owner_id,
            user2_id=offer.offerer_id,
            status=TradeStatus.ACCEPTED,
        )

        self.db.add(trade)
        offer.status = TradeOfferStatus.ACCEPTED
        offer.responded_at = func.now()
        self.db.commit()
        return self._trade_query().filter(Trade.id == trade.id).first()

    def reject_trade_offer(self, offer_id: int, user_id: int) -> bool:
        """Reject a pending trade offer."""
        offer = self.db.query(TradeOffer).filter(TradeOffer.id == offer_id).first()
        if not offer or offer.item_owner_id != user_id:
            return False

        if offer.status != TradeOfferStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reject an offer with status '{offer.status.value}'.",
            )

        offer.status = TradeOfferStatus.REJECTED
        offer.responded_at = func.now()
        self.db.commit()
        return True

    def create_counter_offer(
        self, offer_id: int, counter_offer: TradeOfferCreate, user_id: int
    ) -> TradeOffer:
        """Create a counter offer referencing an existing offer."""
        parent = self.db.query(TradeOffer).filter(TradeOffer.id == offer_id).first()
        if not parent or user_id not in (parent.item_owner_id, parent.offerer_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent trade offer not found or not authorized.",
            )

        parent.status = TradeOfferStatus.COUNTERED
        parent.responded_at = func.now()
        counter_offer.is_counter_offer = True
        counter_offer.parent_offer_id = offer_id
        return self.create_trade_offer(counter_offer, user_id)

    def get_counter_offers(self, offer_id: int, user_id: int) -> List[TradeOffer]:
        """Get counter offers for a trade offer if caller is a participant."""
        parent = self.db.query(TradeOffer).filter(TradeOffer.id == offer_id).first()
        if not parent or user_id not in (parent.item_owner_id, parent.offerer_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trade offer not found or not authorized.",
            )
        return (
            self._offer_query()
            .filter(TradeOffer.parent_offer_id == offer_id)
            .order_by(TradeOffer.created_at.asc())
            .all()
        )

    def get_active_trades(self, user_id: int) -> List[Trade]:
        """Get pending and accepted trades for a user."""
        return (
            self._trade_query()
            .filter((Trade.user1_id == user_id) | (Trade.user2_id == user_id))
            .filter(Trade.status.in_([TradeStatus.PENDING, TradeStatus.ACCEPTED]))
            .order_by(Trade.created_at.desc())
            .all()
        )

    def get_trade_history(self, user_id: int) -> List[Trade]:
        """Get all trades (including completed and cancelled) for a user."""
        return (
            self._trade_query()
            .filter((Trade.user1_id == user_id) | (Trade.user2_id == user_id))
            .order_by(Trade.created_at.desc())
            .all()
        )

    def complete_trade(self, trade_id: int, user_id: int) -> bool:
        """Mark an active trade as completed and transition both items to TRADED."""
        trade = self.db.query(Trade).filter(Trade.id == trade_id).first()
        if not trade or user_id not in (trade.user1_id, trade.user2_id):
            return False

        if trade.status != TradeStatus.ACCEPTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot complete a trade with status '{trade.status.value}'.",
            )

        trade.status = TradeStatus.COMPLETED
        trade.completed_at = func.now()

        item1 = self.db.query(Item).filter(Item.id == trade.item1_id).first()
        item2 = self.db.query(Item).filter(Item.id == trade.item2_id).first()
        if item1:
            item1.status = ItemStatus.TRADED
        if item2:
            item2.status = ItemStatus.TRADED

        self.db.commit()
        return True

    def cancel_trade(self, trade_id: int, user_id: int) -> bool:
        """Cancel an active trade."""
        trade = self.db.query(Trade).filter(Trade.id == trade_id).first()
        if not trade or user_id not in (trade.user1_id, trade.user2_id):
            return False

        if trade.status in (TradeStatus.COMPLETED, TradeStatus.CANCELLED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel a trade with status '{trade.status.value}'.",
            )

        trade.status = TradeStatus.CANCELLED
        self.db.commit()
        return True
