from sqlalchemy.orm import Session
from app.models.trade import Trade, TradeOffer
from app.schemas.trade import TradeOfferCreate
from typing import List, Optional


class TradeService:
    def __init__(self, db: Session):
        self.db = db

    def create_trade_offer(self, offer_data: TradeOfferCreate, user_id: int) -> TradeOffer:
        """Create a trade offer"""
        db_offer = TradeOffer(
            item_id=offer_data.item_id,
            item_owner_id=offer_data.item_id,  # This should be the item owner
            offerer_id=user_id,
            offered_item_id=offer_data.offered_item_id,
            message=offer_data.message,
            is_counter_offer=offer_data.is_counter_offer,
            parent_offer_id=offer_data.parent_offer_id
        )

        self.db.add(db_offer)
        self.db.commit()
        self.db.refresh(db_offer)
        return db_offer

    def get_received_offers(self, user_id: int) -> List[TradeOffer]:
        """Get trade offers received by user"""
        return self.db.query(TradeOffer).filter(
            TradeOffer.item_owner_id == user_id
        ).all()

    def get_made_offers(self, user_id: int) -> List[TradeOffer]:
        """Get trade offers made by user"""
        return self.db.query(TradeOffer).filter(
            TradeOffer.offerer_id == user_id
        ).all()

    def accept_trade_offer(self, offer_id: int, user_id: int) -> Optional[Trade]:
        """Accept a trade offer"""
        offer = self.db.query(TradeOffer).filter(
            TradeOffer.id == offer_id).first()
        if not offer or offer.item_owner_id != user_id:
            return None

        # Create trade
        trade = Trade(
            item1_id=offer.item_id,
            item2_id=offer.offered_item_id,
            user1_id=offer.item_owner_id,
            user2_id=offer.offerer_id,
            status="accepted"
        )

        self.db.add(trade)
        offer.status = "accepted"
        self.db.commit()
        self.db.refresh(trade)
        return trade

    def reject_trade_offer(self, offer_id: int, user_id: int) -> bool:
        """Reject a trade offer"""
        offer = self.db.query(TradeOffer).filter(
            TradeOffer.id == offer_id).first()
        if not offer or offer.item_owner_id != user_id:
            return False

        offer.status = "rejected"
        self.db.commit()
        return True

    def create_counter_offer(self, offer_id: int, counter_offer: TradeOfferCreate, user_id: int) -> TradeOffer:
        """Create a counter offer"""
        counter_offer.is_counter_offer = True
        counter_offer.parent_offer_id = offer_id
        return self.create_trade_offer(counter_offer, user_id)

    def get_counter_offers(self, offer_id: int, user_id: int) -> List[TradeOffer]:
        """Get counter offers for a trade offer"""
        return self.db.query(TradeOffer).filter(
            TradeOffer.parent_offer_id == offer_id
        ).all()

    def get_active_trades(self, user_id: int) -> List[Trade]:
        """Get active trades for user"""
        return self.db.query(Trade).filter(
            (Trade.user1_id == user_id) | (Trade.user2_id == user_id)
        ).filter(Trade.status.in_(["pending", "accepted"])).all()

    def complete_trade(self, trade_id: int, user_id: int) -> bool:
        """Mark a trade as completed"""
        trade = self.db.query(Trade).filter(Trade.id == trade_id).first()
        if not trade or (trade.user1_id != user_id and trade.user2_id != user_id):
            return False

        trade.status = "completed"
        self.db.commit()
        return True

    def cancel_trade(self, trade_id: int, user_id: int) -> bool:
        """Cancel a trade"""
        trade = self.db.query(Trade).filter(Trade.id == trade_id).first()
        if not trade or (trade.user1_id != user_id and trade.user2_id != user_id):
            return False

        trade.status = "cancelled"
        self.db.commit()
        return True
