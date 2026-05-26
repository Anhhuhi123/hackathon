import logging
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Tuple, Dict, Any

from src.repositories.user_repo import UserRepository
from src.utils.security import verify_password, generate_jwt_access_token, generate_refresh_token
from src.middleware.rate_limit import check_rate_limit, increment_rate_limit, reset_rate_limit, RateLimitExceeded

logger = logging.getLogger(__name__)

class AuthException(Exception):
    def __init__(self, status_code: int, error: str, message: str, fields: dict = None, extra: dict = None):
        self.status_code = status_code
        self.error = error
        self.message = message
        self.fields = fields
        self.extra = extra

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    async def login(self, identifier: str, password: str, remember_me: bool, ip_address: str) -> Tuple[str, str, int, dict]:
        """
        Executes the login flow.
        Returns (access_token, refresh_token, refresh_token_max_age, user_dict)
        Raises AuthException on errors.
        """
        # 1. Rate Limiting Check
        try:
            await check_rate_limit(ip_address, identifier)
        except RateLimitExceeded as e:
            logger.warning("rate_limit_exceeded", extra={"ip": ip_address, "identifier": identifier})
            raise AuthException(
                status_code=429,
                error="RATE_LIMIT_EXCEEDED",
                message="Quá nhiều lần thử. Vui lòng thử lại sau.",
                extra={"retry_after_seconds": e.retry_after}
            )

        # 2. User Lookup
        user = self.repo.get_user_by_identifier(identifier)

        # 3. Password Verification
        # To avoid timing attacks, we should technically run the hash check even if user doesn't exist
        # but the contract specifies checking password hash if user is found. 
        # bcrypt does have a timing footprint.
        is_valid = False
        if user:
            is_valid = verify_password(password, user.password_hash)

        # 4. Invalid Credentials (401)
        if not user or not is_valid:
            await increment_rate_limit(ip_address, identifier)
            # Log failed attempt securely
            logger.warning("login_failed", extra={"ip": ip_address, "identifier_exists": bool(user)})
            raise AuthException(
                status_code=401,
                error="INVALID_CREDENTIALS",
                message="Thông tin đăng nhập không chính xác."
            )

        # 5. Success (200)
        await reset_rate_limit(ip_address, identifier)
        
        # Log success
        logger.info("login_success", extra={"user_id": str(user.id), "ip": ip_address})

        access_token = generate_jwt_access_token(str(user.id), user.email)
        refresh_token, token_hash = generate_refresh_token()
        
        # Calculate expiration
        days = 30 if remember_me else 7
        expires_at = datetime.utcnow() + timedelta(days=days)
        max_age_seconds = days * 24 * 60 * 60

        try:
            # Transaction is implicitly started by SQLAlchemy when doing additions
            self.repo.create_refresh_token(user.id, token_hash, expires_at)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.error("db_commit_failed", extra={"error": str(e)})
            raise AuthException(
                status_code=500,
                error="INTERNAL_ERROR",
                message="Đã xảy ra lỗi nội bộ."
            )

        user_dict = {
            "id": str(user.id),
            "email": user.email,
            "username": user.username
        }

        return access_token, refresh_token, max_age_seconds, user_dict
