import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    available_credit = Column(Integer, default=10000, nullable=False)
    reserved_credit = Column(Integer, default=0, nullable=False)
    currency_code = Column(String(10), default="PTS", nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class Match(Base):
    __tablename__ = "matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    home_team = Column(String(255), nullable=False)
    away_team = Column(String(255), nullable=False)
    league = Column(String(255), nullable=False)
    status = Column(String(50), default="OPEN", nullable=False) # OPEN, CLOSED, FINISHED
    starts_at = Column(DateTime(timezone=True), nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    markets = relationship("Market", back_populates="match", cascade="all, delete-orphan", lazy="joined")

class Market(Base):
    __tablename__ = "markets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(UUID(as_uuid=True), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False) # e.g. "Full Time Result"
    code = Column(String(50), default="1X2", nullable=False) # 1X2
    status = Column(String(50), default="OPEN", nullable=False) # OPEN, CLOSED
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    match = relationship("Match", back_populates="markets")
    selections = relationship("Selection", back_populates="market", cascade="all, delete-orphan", lazy="joined")

class Selection(Base):
    __tablename__ = "selections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    market_id = Column(UUID(as_uuid=True), ForeignKey("markets.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False) # Home, Draw, Away
    odds = Column(Float, nullable=False)
    status = Column(String(50), default="OPEN", nullable=False) # OPEN, CLOSED, WON, LOST
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    market = relationship("Market", back_populates="selections")

class BetQuote(Base):
    __tablename__ = "bet_quotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    stake_amount = Column(Integer, nullable=False)
    total_odds = Column(Float, nullable=False)
    potential_payout = Column(Integer, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    status = Column(String(50), default="QUOTED", nullable=False) # QUOTED, CONSUMED, EXPIRED

    selections = relationship("BetQuoteSelection", cascade="all, delete-orphan", lazy="joined")

class BetQuoteSelection(Base):
    __tablename__ = "bet_quote_selections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("bet_quotes.id", ondelete="CASCADE"), nullable=False)
    selection_id = Column(UUID(as_uuid=True), ForeignKey("selections.id", ondelete="CASCADE"), nullable=False)
    odds = Column(Float, nullable=False)

    selection = relationship("Selection")

class Bet(Base):
    __tablename__ = "bets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("bet_quotes.id", ondelete="SET NULL"), nullable=True)
    stake_amount = Column(Integer, nullable=False)
    total_odds = Column(Float, nullable=False)
    potential_payout = Column(Integer, nullable=False)
    status = Column(String(50), default="PLACED", nullable=False) # PLACED, WON, LOST, CANCELLED
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    selections = relationship("BetSelection", cascade="all, delete-orphan", lazy="joined")

class BetSelection(Base):
    __tablename__ = "bet_selections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bet_id = Column(UUID(as_uuid=True), ForeignKey("bets.id", ondelete="CASCADE"), nullable=False)
    selection_id = Column(UUID(as_uuid=True), ForeignKey("selections.id", ondelete="CASCADE"), nullable=False)
    odds = Column(Float, nullable=False)

    selection = relationship("Selection")

class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"

    key = Column(String(255), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    response_body = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
