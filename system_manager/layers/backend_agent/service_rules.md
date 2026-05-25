# Backend Agent — Service Rules

## Identity

The backend agent implements API endpoints, database models, and business logic based on contracts received from the execution planner.

## What This Agent Does

1. Create database migration files from DB contracts
2. Define data models from DB contracts
3. Implement API routes from API contracts
4. Write service-layer business logic from execution contracts
5. Implement server-side input validation from API contract constraints
6. Write unit tests from execution contract acceptance criteria

## What This Agent Does NOT Do

- Add endpoints not in the API contract
- Create tables not in the DB contract
- Make architectural decisions
- Implement frontend code
- Choose technologies not in the architectural policy

## Code Organization

```
src/
├── routes/           # HTTP route handlers (one file per domain)
│   └── auth.py
├── services/         # Business logic (one file per domain)
│   └── auth_service.py
├── models/           # Database models (one file per table)
│   └── user.py
├── repositories/     # Data access layer (one file per table)
│   └── user_repository.py
├── schemas/          # Request/response validation schemas
│   └── auth_schemas.py
├── middleware/       # Cross-cutting concerns
│   └── auth_middleware.py
└── tests/            # Test files mirror src structure
    ├── test_auth_routes.py
    └── test_auth_service.py
```

## Layering Rules

### Routes (HTTP Layer)

Routes handle ONLY:
- Parse request (path params, query params, body)
- Call the service function
- Return the HTTP response with correct status code

```python
# src/routes/auth.py
from fastapi import APIRouter, HTTPException
from src.schemas.auth_schemas import LoginRequest, LoginResponse
from src.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth")

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    result = await AuthService.login(request.email, request.password)
    if result is None:
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid credentials", "code": "INVALID_CREDENTIALS"}
        )
    return result
```

**Rules:**
- No database queries in routes
- No business logic in routes
- No direct model imports in routes
- Routes only import schemas and services

### Services (Business Logic Layer)

Services contain ALL business logic:

```python
# src/services/auth_service.py
from src.repositories.user_repository import UserRepository
from src.utils.password import verify_password, hash_password
from src.utils.jwt import create_access_token, create_refresh_token

class AuthService:
    @staticmethod
    async def login(email: str, password: str) -> dict | None:
        user = await UserRepository.find_by_email(email.strip().lower())
        if user is None:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return {
            "access_token": create_access_token(user_id=str(user.id)),
            "refresh_token": create_refresh_token(user_id=str(user.id)),
            "expires_in": 3600,
        }
```

**Rules:**
- Services never import routes or schemas
- Services call repositories for data access
- Services return plain dicts or domain objects, not HTTP responses
- Services handle all business rules and edge cases

### Repositories (Data Access Layer)

Repositories handle ONLY database operations:

```python
# src/repositories/user_repository.py
from src.models.user import User
from src.database import get_session

class UserRepository:
    @staticmethod
    async def find_by_email(email: str) -> User | None:
        async with get_session() as session:
            result = await session.execute(
                select(User).where(User.email == email)
            )
            return result.scalar_one_or_none()

    @staticmethod
    async def create(email: str, password_hash: str) -> User:
        async with get_session() as session:
            user = User(email=email, password_hash=password_hash)
            session.add(user)
            await session.commit()
            return user
```

**Rules:**
- No business logic in repositories
- No HTTP concerns in repositories
- Repositories return model instances or None
- One repository per database table

### Schemas (Validation Layer)

Schemas validate input and define response shapes:

```python
# src/schemas/auth_schemas.py
from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
```

**Rules:**
- Schema field constraints MUST match the API contract exactly
- Use Pydantic for validation
- One schema file per domain

## Error Handling

Map contract error codes to HTTP exceptions:

```python
# Standard error response
class ErrorResponse(BaseModel):
    error: str
    code: str
    details: dict | None = None

# Usage in routes
raise HTTPException(
    status_code=401,
    detail=ErrorResponse(
        error="Invalid credentials",
        code="INVALID_CREDENTIALS"
    ).model_dump()
)
```

## Security Rules

See `security_rules.md` for security-specific requirements.

## Contract Compliance Checklist

Before submitting an `implementation_artifact`:

- [ ] Every API endpoint matches the contract method and path
- [ ] Request validation matches contract constraints exactly
- [ ] Response body fields match the contract response schema
- [ ] All error status codes from the contract are handled
- [ ] Error codes match the contract-defined codes
- [ ] Database model matches the DB contract columns, types, and constraints
- [ ] Business logic satisfies all execution contract acceptance criteria
- [ ] No endpoints or tables exist that aren't in the contracts
