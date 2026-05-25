# Backend Agent — Security Rules

## Purpose

Mandatory security practices for all backend implementations.

## Password Handling

- **Never** store passwords in plaintext. Use bcrypt (work factor ≥ 12).
- Use constant-time comparison (passlib or equivalent). Never use `==`.
- Never return password or password_hash in any API response.
- Never log password values.
- Error messages must not reveal whether email exists or password is wrong.

```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)
```

## JWT Authentication

- JWT secrets loaded from environment variables — **never hardcoded**
- Access tokens expire in 3600 seconds
- Tokens contain `sub` (user ID), `iat`, `exp` claims
- Verify signature, expiration, and required claims
- Return 401 for invalid/expired tokens

```python
import jwt, os
from datetime import datetime, timedelta

SECRET_KEY = os.environ["JWT_SECRET_KEY"]
ALGORITHM = "HS256"

def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(seconds=3600),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
```

## Input Validation

- All inputs are untrusted — validate with Pydantic schemas
- Trim whitespace, enforce length limits
- Reject unexpected fields (`extra = "forbid"`)
- Use parameterized queries only (SQLAlchemy) — no string concatenation
- Normalize emails: trim + lowercase

## HTTP Security Headers

```python
headers = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
}
```

## Rate Limiting (MVP)

| Endpoint | Limit |
|---------|-------|
| POST /api/auth/login | 5/min per IP |
| POST /api/auth/forgot-password | 3/min per IP |
| POST /api/auth/register | 10/min per IP |

## Error Response Security

- No stack traces in production responses
- No database column names or internal paths in errors
- Generic message for all 500 errors
- Contract-defined codes for 4xx errors

```python
@app.exception_handler(Exception)
async def generic_error_handler(request, exc):
    logger.error(f"Unhandled: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"error": "Internal server error", "code": "INTERNAL_ERROR"})
```

## Security Checklist

Before submitting any backend artifact:

- [ ] No plaintext passwords in storage or logs
- [ ] Constant-time password comparison
- [ ] JWT secret from environment variable
- [ ] All inputs validated with Pydantic
- [ ] No SQL string concatenation
- [ ] Error messages don't leak internals
- [ ] Auth endpoints have rate limiting
- [ ] No hardcoded secrets
