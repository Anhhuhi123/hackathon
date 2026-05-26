import uuid
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Optional

from src.utils.database import get_db
from src.utils.security import decode_jwt_access_token
from src.models.user import User
from src.models.betting import (
    Wallet, Match, Market, Selection, BetQuote, BetQuoteSelection, Bet, BetSelection, IdempotencyKey
)

router = APIRouter()

# Dependency to get current user from Bearer Token
def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization.split(" ")[1]
    try:
        payload = decode_jwt_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập đã hết hạn")

# Auto-seed helper
def seed_mock_data_if_empty(db: Session):
    if db.query(Match).count() == 0:
        # Create matches
        matches_data = [
            {
                "home_team": "Manchester United",
                "away_team": "Liverpool",
                "league": "Premier League",
                "is_featured": True,
                "starts_in_hours": 2,
                "selections": [
                    {"name": "Manchester United", "odds": 2.45},
                    {"name": "Draw", "odds": 3.40},
                    {"name": "Liverpool", "odds": 2.80}
                ]
            },
            {
                "home_team": "Real Madrid",
                "away_team": "Barcelona",
                "league": "La Liga",
                "is_featured": True,
                "starts_in_hours": 5,
                "selections": [
                    {"name": "Real Madrid", "odds": 2.10},
                    {"name": "Draw", "odds": 3.60},
                    {"name": "Barcelona", "odds": 3.10}
                ]
            },
            {
                "home_team": "Arsenal",
                "away_team": "Chelsea",
                "league": "Premier League",
                "is_featured": False,
                "starts_in_hours": 24,
                "selections": [
                    {"name": "Arsenal", "odds": 1.85},
                    {"name": "Draw", "odds": 3.75},
                    {"name": "Chelsea", "odds": 4.20}
                ]
            },
            {
                "home_team": "Bayern Munich",
                "away_team": "Borussia Dortmund",
                "league": "Bundesliga",
                "is_featured": False,
                "starts_in_hours": 12,
                "selections": [
                    {"name": "Bayern Munich", "odds": 1.65},
                    {"name": "Draw", "odds": 4.10},
                    {"name": "Borussia Dortmund", "odds": 5.00}
                ]
            }
        ]

        for m_data in matches_data:
            match = Match(
                home_team=m_data["home_team"],
                away_team=m_data["away_team"],
                league=m_data["league"],
                status="OPEN",
                is_featured=m_data["is_featured"],
                starts_at=datetime.utcnow() + timedelta(hours=m_data["starts_in_hours"])
            )
            db.add(match)
            db.flush()  # to get match.id

            market = Market(
                match_id=match.id,
                name="Kết quả cả trận (Full Time Result)",
                code="1X2",
                status="OPEN"
            )
            db.add(market)
            db.flush()

            for sel in m_data["selections"]:
                selection = Selection(
                    market_id=market.id,
                    name=sel["name"],
                    odds=sel["odds"],
                    status="OPEN"
                )
                db.add(selection)

        db.commit()

# Helper to load or create user wallet
def get_or_create_wallet(user_id: uuid.UUID, db: Session) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, available_credit=10000, reserved_credit=0, currency_code="PTS")
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

# Match response schema helpers
def serialize_match(match: Match):
    return {
        "id": str(match.id),
        "home_team": match.home_team,
        "away_team": match.away_team,
        "league": match.league,
        "status": match.status,
        "starts_at": match.starts_at.isoformat(),
        "is_featured": match.is_featured,
        "markets": [
            {
                "id": str(market.id),
                "name": market.name,
                "code": market.code,
                "status": market.status,
                "selections": [
                    {
                        "id": str(sel.id),
                        "name": sel.name,
                        "odds": sel.odds,
                        "status": sel.status
                    } for sel in market.selections
                ]
            } for market in match.markets
        ]
    }

# 1. GET /api/v1/dashboard/bootstrap
@router.get("/dashboard/bootstrap")
async def bootstrap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seed_mock_data_if_empty(db)
    wallet = get_or_create_wallet(current_user.id, db)

    featured = db.query(Match).filter(Match.is_featured == True).all()
    recent_bets = db.query(Bet).filter(Bet.user_id == current_user.id).order_by(Bet.created_at.desc()).limit(10).all()

    return {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "username": current_user.username,
            "full_name": current_user.username
        },
        "wallet": {
            "id": str(wallet.id),
            "user_id": str(wallet.user_id),
            "available_credit": wallet.available_credit,
            "reserved_credit": wallet.reserved_credit,
            "currency_code": wallet.currency_code,
            "updated_at": wallet.updated_at.isoformat()
        },
        "featured_matches": [serialize_match(m) for m in featured],
        "recent_bets": [
            {
                "id": str(bet.id),
                "stake_amount": bet.stake_amount,
                "total_odds": bet.total_odds,
                "potential_payout": bet.potential_payout,
                "status": bet.status,
                "created_at": bet.created_at.isoformat()
            } for bet in recent_bets
        ],
        "server_time": datetime.utcnow().isoformat()
    }

# 2. GET /api/v1/matches
@router.get("/matches")
async def get_matches(
    league: Optional[str] = None,
    status: Optional[str] = "OPEN",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seed_mock_data_if_empty(db)
    query = db.query(Match)
    if league:
        query = query.filter(Match.league == league)
    if status:
        query = query.filter(Match.status == status)

    matches = query.order_by(Match.starts_at.asc()).all()

    return {
        "items": [serialize_match(m) for m in matches],
        "total": len(matches),
        "cursor": None,
        "limit": 20
    }

# 3. GET /api/v1/matches/{match_id}
@router.get("/matches/{match_id}")
async def get_match_detail(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        m_uuid = uuid.UUID(match_id)
    except ValueError:
        return JSONResponse(status_code=404, content={"error": "MATCH_NOT_FOUND", "message": "Không tìm thấy trận đấu"})

    match = db.query(Match).filter(Match.id == m_uuid).first()
    if not match:
        return JSONResponse(status_code=404, content={"error": "MATCH_NOT_FOUND", "message": "Không tìm thấy trận đấu"})

    return serialize_match(match)

# Pydantic schemas for Quotes and Bets
class SelectionRef(BaseModel):
    selection_id: str

class QuoteRequest(BaseModel):
    stake_amount: int = Field(..., gt=0)
    selections: List[SelectionRef]

# 4. POST /api/v1/bet-quotes
@router.post("/bet-quotes")
async def create_bet_quote(
    payload: QuoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wallet = get_or_create_wallet(current_user.id, db)

    if payload.stake_amount > wallet.available_credit:
        return JSONResponse(
            status_code=409,
            content={"error": "INSUFFICIENT_CREDIT", "message": "Số dư credit khả dụng không đủ"}
        )

    if not (1 <= len(payload.selections) <= 10):
        return JSONResponse(
            status_code=400,
            content={"error": "VALIDATION_ERROR", "message": "Số lượng lựa chọn cược phải từ 1 đến 10"}
        )

    # Fetch selection data
    sel_ids = []
    for s_ref in payload.selections:
        try:
            sel_ids.append(uuid.UUID(s_ref.selection_id))
        except ValueError:
            return JSONResponse(
                status_code=400,
                content={"error": "VALIDATION_ERROR", "message": f"ID lựa chọn không hợp lệ: {s_ref.selection_id}"}
            )

    # De-duplicate
    if len(sel_ids) != len(set(sel_ids)):
        return JSONResponse(
            status_code=400,
            content={"error": "VALIDATION_ERROR", "message": "Không được có các lựa chọn trùng lặp"}
        )

    selections = db.query(Selection).filter(Selection.id.in_(sel_ids)).all()
    if len(selections) != len(sel_ids):
        return JSONResponse(
            status_code=400,
            content={"error": "VALIDATION_ERROR", "message": "Một hoặc nhiều lựa chọn cược không tìm thấy"}
        )

    # Calculate odds
    total_odds = 1.0
    for sel in selections:
        if sel.status != "OPEN":
            return JSONResponse(
                status_code=409,
                content={"error": "ODDS_STALE", "message": f"Kèo cược '{sel.name}' đã đóng hoặc thay đổi"}
            )
        total_odds *= sel.odds

    potential_payout = int(payload.stake_amount * total_odds)

    # Create quote
    quote = BetQuote(
        user_id=current_user.id,
        stake_amount=payload.stake_amount,
        total_odds=round(total_odds, 2),
        potential_payout=potential_payout,
        expires_at=datetime.utcnow() + timedelta(seconds=120),
        status="QUOTED"
    )
    db.add(quote)
    db.flush()

    # Add selections reference
    for sel in selections:
        q_sel = BetQuoteSelection(
            quote_id=quote.id,
            selection_id=sel.id,
            odds=sel.odds
        )
        db.add(q_sel)

    db.commit()

    return {
        "id": str(quote.id),
        "stake_amount": quote.stake_amount,
        "total_odds": quote.total_odds,
        "potential_payout": quote.potential_payout,
        "expires_at": quote.expires_at.isoformat(),
        "created_at": quote.created_at.isoformat(),
        "server_time": datetime.utcnow().isoformat(),
        "selections": [
            {
                "selection_id": str(sel.id),
                "name": sel.name,
                "odds": sel.odds
            } for sel in selections
        ]
    }

class PlaceBetRequest(BaseModel):
    quote_id: str

# 5. POST /api/v1/bets
@router.post("/bets")
async def place_bet(
    payload: PlaceBetRequest,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check Idempotency Key
    idem = db.query(IdempotencyKey).filter(IdempotencyKey.key == idempotency_key).first()
    if idem:
        return JSONResponse(status_code=200, content=json.loads(idem.response_body))

    try:
        q_uuid = uuid.UUID(payload.quote_id)
    except ValueError:
        return JSONResponse(status_code=400, content={"error": "VALIDATION_ERROR", "message": "Quote ID không hợp lệ"})

    quote = db.query(BetQuote).filter(BetQuote.id == q_uuid, BetQuote.user_id == current_user.id).first()
    if not quote:
        return JSONResponse(status_code=404, content={"error": "QUOTE_NOT_FOUND", "message": "Không tìm thấy Quote hoặc Quote đã hết hạn"})

    if quote.status != "QUOTED":
        return JSONResponse(status_code=409, content={"error": "QUOTE_CONSUMED", "message": "Quote này đã được sử dụng"})

    if quote.expires_at.replace(tzinfo=None) < datetime.utcnow():
        quote.status = "EXPIRED"
        db.commit()
        return JSONResponse(status_code=409, content={"error": "QUOTE_EXPIRED", "message": "Quote cược đã quá hạn 120s, vui lòng tạo lại"})

    wallet = get_or_create_wallet(current_user.id, db)
    if wallet.available_credit < quote.stake_amount:
        return JSONResponse(status_code=409, content={"error": "INSUFFICIENT_CREDIT", "message": "Số dư không đủ để đặt cược"})

    # Perform placing bet and updating wallet in a transaction
    try:
        bet = Bet(
            user_id=current_user.id,
            quote_id=quote.id,
            stake_amount=quote.stake_amount,
            total_odds=quote.total_odds,
            potential_payout=quote.potential_payout,
            status="PLACED"
        )
        db.add(bet)
        db.flush()

        for q_sel in quote.selections:
            b_sel = BetSelection(
                bet_id=bet.id,
                selection_id=q_sel.selection_id,
                odds=q_sel.odds
            )
            db.add(b_sel)

        # Deduct wallet
        wallet.available_credit -= quote.stake_amount
        wallet.updated_at = datetime.utcnow()

        # Update quote
        quote.status = "CONSUMED"

        response_payload = {
            "id": str(bet.id),
            "stake_amount": bet.stake_amount,
            "total_odds": bet.total_odds,
            "potential_payout": bet.potential_payout,
            "status": bet.status,
            "created_at": bet.created_at.isoformat()
        }

        # Save Idempotency
        idem = IdempotencyKey(
            key=idempotency_key,
            user_id=current_user.id,
            response_body=json.dumps(response_payload)
        )
        db.add(idem)

        db.commit()
        return JSONResponse(status_code=201, content=response_payload)

    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"error": "TRANSACTION_FAILED", "message": f"Đặt cược thất bại: {str(e)}"})

# 6. GET /api/v1/bets
@router.get("/bets")
async def get_bets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bets = db.query(Bet).filter(Bet.user_id == current_user.id).order_by(Bet.created_at.desc()).all()
    return {
        "items": [
            {
                "id": str(bet.id),
                "stake_amount": bet.stake_amount,
                "total_odds": bet.total_odds,
                "potential_payout": bet.potential_payout,
                "status": bet.status,
                "created_at": bet.created_at.isoformat()
            } for bet in bets
        ],
        "total": len(bets)
    }

# 7. GET /api/v1/wallet/summary
@router.get("/wallet/summary")
async def wallet_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wallet = get_or_create_wallet(current_user.id, db)
    return {
        "id": str(wallet.id),
        "user_id": str(wallet.user_id),
        "available_credit": wallet.available_credit,
        "reserved_credit": wallet.reserved_credit,
        "currency_code": wallet.currency_code,
        "updated_at": wallet.updated_at.isoformat()
    }
