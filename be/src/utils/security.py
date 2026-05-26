import os
import bcrypt
import jwt
from datetime import datetime, timedelta
import secrets
import hashlib

# Minimum rounds for bcrypt is 12 according to rules
BCRYPT_ROUNDS = 12

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False

def generate_jwt_access_token(user_id: str, email: str) -> str:
    private_key = os.getenv("JWT_PRIVATE_KEY", "").replace("\\n", "\n")
    if not private_key:
        raise ValueError("JWT_PRIVATE_KEY is not configured")
        
    now = datetime.utcnow()
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": now,
        "exp": now + timedelta(minutes=15),
        "type": "access"
    }
    
    return jwt.encode(payload, private_key, algorithm="RS256")

def generate_refresh_token() -> tuple[str, str]:
    """Generates a secure random refresh token and its hash for DB storage"""
    token = secrets.token_urlsafe(64)
    # Fast hash for refresh token DB lookup (SHA-256 is fine here as it's a high entropy random string)
    token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    return token, token_hash
