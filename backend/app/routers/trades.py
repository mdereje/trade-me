from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.trade import TradeOfferCreate, TradeOfferResponse, TradeResponse
from app.services.trade_service import TradeService
from app.services.auth_service import get_current_user

router = APIRouter()


@router.post("/offers", response_model=TradeOfferResponse)
async def create_trade_offer(
    offer_data: TradeOfferCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a trade offer"""
    trade_service = TradeService(db)
    return trade_service.create_trade_offer(offer_data, current_user.id)


@router.get("/offers/received", response_model=List[TradeOfferResponse])
async def get_received_offers(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get trade offers received by current user"""
    trade_service = TradeService(db)
    return trade_service.get_received_offers(current_user.id)


@router.get("/offers/made", response_model=List[TradeOfferResponse])
async def get_made_offers(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get trade offers made by current user"""
    trade_service = TradeService(db)
    return trade_service.get_made_offers(current_user.id)


@router.post("/offers/{offer_id}/accept", response_model=TradeResponse)
async def accept_trade_offer(
    offer_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a trade offer"""
    trade_service = TradeService(db)
    trade = trade_service.accept_trade_offer(offer_id, current_user.id)
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade offer not found or not authorized"
        )
    return trade


@router.post("/offers/{offer_id}/reject")
async def reject_trade_offer(
    offer_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject a trade offer"""
    trade_service = TradeService(db)
    success = trade_service.reject_trade_offer(offer_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade offer not found or not authorized"
        )
    return {"message": "Trade offer rejected"}


@router.post("/offers/{offer_id}/counter", response_model=TradeOfferResponse)
async def counter_trade_offer(
    offer_id: int,
    counter_offer: TradeOfferCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a counter offer"""
    trade_service = TradeService(db)
    return trade_service.create_counter_offer(offer_id, counter_offer, current_user.id)


@router.get("/offers/{offer_id}/counters", response_model=List[TradeOfferResponse])
async def get_counter_offers(
    offer_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get counter offers for a trade offer"""
    trade_service = TradeService(db)
    return trade_service.get_counter_offers(offer_id, current_user.id)


@router.get("/active", response_model=List[TradeResponse])
async def get_active_trades(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get active trades for current user"""
    trade_service = TradeService(db)
    return trade_service.get_active_trades(current_user.id)


@router.post("/{trade_id}/complete")
async def complete_trade(
    trade_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a trade as completed"""
    trade_service = TradeService(db)
    success = trade_service.complete_trade(trade_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found or not authorized"
        )
    return {"message": "Trade completed successfully"}


@router.post("/{trade_id}/cancel")
async def cancel_trade(
    trade_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a trade"""
    trade_service = TradeService(db)
    success = trade_service.cancel_trade(trade_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found or not authorized"
        )
    return {"message": "Trade cancelled successfully"}
