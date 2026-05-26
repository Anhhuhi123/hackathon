from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from src.models.user import User
from src.models.session import RefreshToken
from datetime import datetime

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_identifier(self, identifier: str) -> Optional[User]:
        return self.db.query(User).filter(
            or_(User.email == identifier, User.username == identifier)
        ).first()

    def create_refresh_token(self, user_id: str, token_hash: str, expires_at: datetime) -> RefreshToken:
        refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        self.db.add(refresh_token)
        # Flush is not used since we manage transaction in the service layer
        return refresh_token
