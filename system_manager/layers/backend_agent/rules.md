# Backend Agent — Rules & Security Conventions

## Core Principle: Contracts Are Law

The response schemas in `architecture.md` are the law. Any deviation — even a "better" design — is a contract violation that will break the frontend.

---

## Absolute Prohibitions

```
❌ RULE-BE-001: DO NOT modify frontend source code
❌ RULE-BE-002: DO NOT modify contract files (system_manager/*.md)
❌ RULE-BE-003: DO NOT use HTTP 200 for error responses
❌ RULE-BE-004: DO NOT return password_hash, raw tokens, or internal data in responses
❌ RULE-BE-005: DO NOT log passwords, tokens, or PII in plaintext
❌ RULE-BE-006: DO NOT store passwords without bcrypt hashing
❌ RULE-BE-007: DO NOT use HS256 for JWT (RS256 only)
❌ RULE-BE-008: DO NOT skip input validation because "FE already validates"
❌ RULE-BE-009: DO NOT reveal whether an email exists in error messages
❌ RULE-BE-010: DO NOT store refresh tokens in plaintext in DB
```

## Mandatory Rules

```
✅ RULE-BE-101: MUST validate ALL inputs server-side
✅ RULE-BE-102: MUST use bcrypt (cost ≥ 12) for all password hashing
✅ RULE-BE-103: MUST implement rate limiting for auth endpoints
✅ RULE-BE-104: MUST implement refresh token rotation
✅ RULE-BE-105: MUST use parameterized queries (never string concatenation in SQL)
✅ RULE-BE-106: MUST use database transactions for multi-step operations
✅ RULE-BE-107: MUST log all auth events (login, logout, failed attempts) — WITHOUT sensitive data
✅ RULE-BE-108: MUST document all environment variables in .env.example
```

---

## Security Standards

### Password Security
```python
# ✅ REQUIRED configuration
BCRYPT_ROUNDS = 12  # Minimum — never lower
# Expected hash time: ~300ms per verification (acceptable tradeoff for security)

# ✅ Timing-safe comparison (bcrypt handles this)
bcrypt.checkpw(candidate.encode(), stored_hash.encode())

# ❌ NEVER do timing-unsafe comparison
candidate_hash == stored_hash  # Vulnerable to timing attacks
```

### JWT Standards
```
Algorithm:   RS256 (asymmetric key pair)
Expiry:      Access = 15 minutes | Refresh = 7 days
Payload:     { sub, email, iat, exp, type }
Storage:     Private key in secret manager, NOT in repo
Validation:  exp, iat, alg MUST be verified on every request
```

### Rate Limiting Implementation
```
Strategy: Token bucket or sliding window
Storage:  Redis (not in-memory — must survive restarts)
Key:      rate:login:{ip}:{email}  (combine both for finer control)
Limit:    5 attempts per 15 minutes
Action:   Return 429 with retry_after_seconds
```

### Input Validation Standards
```python
# Every API endpoint must validate:
# 1. Required fields present
# 2. Field types correct
# 3. Field length constraints
# 4. Format constraints (email regex, etc.)
# 5. Business rules (uniqueness, existence)

# ✅ Return validation errors as a structured map:
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input",
  "fields": {
    "email": "Must be a valid email address",
    "password": "Must be at least 8 characters"
  }
}
```

---

## Database Conventions

### Migrations
- Always use migration files (Alembic, Flyway, etc.) — NEVER modify DB schema manually
- Each migration must be reversible (have downgrade path)
- Name migrations descriptively: `20260526_add_refresh_tokens_table.py`

### Query Safety
```python
# ✅ SAFE: Parameterized query
db.execute("SELECT * FROM users WHERE email = %s", [email])

# ❌ UNSAFE: String concatenation
db.execute(f"SELECT * FROM users WHERE email = '{email}'")  # SQL INJECTION
```

### Transactions
```python
# ✅ Use transactions for multi-step operations
with db.transaction():
    user = create_user(email, password_hash)
    create_default_profile(user.id)
    send_welcome_email(user.email)
# If any step fails → all steps roll back
```

---

## Logging Standards

```python
# ✅ LOG: auth events
logger.info("login_success", extra={"user_id": user.id, "ip": request.ip})
logger.warning("login_failed", extra={"email_hash": hash(email), "ip": request.ip})
logger.warning("rate_limit_exceeded", extra={"ip": request.ip})

# ❌ NEVER LOG:
logger.info("login attempt", email=email, password=password)  # NEVER log passwords
logger.info("token issued", token=access_token)               # NEVER log tokens
```

---

## HTTP Status Code Reference

| Situation | Status |
|---|---|
| Created successfully | 201 |
| Action completed, no content to return | 204 |
| Validation / malformed request | 400 |
| Auth required / credentials invalid | 401 |
| Valid auth but insufficient permissions | 403 |
| Resource not found | 404 |
| Conflict (duplicate resource) | 409 |
| Rate limited | 429 |
| Internal server error | 500 |

**NEVER return 200 for any error condition.**

---

## Contract Deviation Protocol

If `backend_task.md` contains something technically impossible or contradictory:
1. Do NOT silently implement a different behavior
2. Add a comment in your code: `# CONTRACT DEVIATION: task says X but implemented Y because Z`
3. Update `intents.yaml` notes: `"BE: deviation at POST /api/v1/auth/login — reason: ..."`
4. Validation Layer will catch and escalate to Architecture Layer for contract update
