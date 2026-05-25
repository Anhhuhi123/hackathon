# Backend Agent — Output Schema

## Purpose

Defines the structure of the `implementation_artifact` message produced by the backend agent.

## Schema

```yaml
implementation_artifact:
  intent_id: string
  task_id: string
  agent: "backend_agent"
  completed_at: string           # ISO 8601

  artifact_type: enum            # "db_migration" | "api_implementation" | "unit_tests"

  files:
    - path: string               # Relative path: "src/routes/auth.py"
      language: string           # "python" | "sql"
      content: string            # Full file content
      purpose: string

  contract_ref: string           # Contract ID this implements

  endpoints_implemented:         # For api_implementation tasks
    - method: string
      path: string
      contract_ref: string
      status_codes_handled: [integer]

  models_created:                # For db_migration tasks
    - table: string
      contract_ref: string
      columns: [string]

  tests_written:                 # For unit_tests tasks
    - test_name: string
      acceptance_criterion: string  # Which criterion this tests
      test_type: string            # "positive" | "negative" | "edge_case"

  self_assessment:
    contract_compliance: boolean
    known_gaps: [string]
    security_checklist:
      no_plaintext_passwords: boolean
      constant_time_comparison: boolean
      env_var_secrets: boolean
      input_validation: boolean
      no_sql_concatenation: boolean
```

## Example

```yaml
implementation_artifact:
  intent_id: "intent-001"
  task_id: "task-be-002"
  agent: "backend_agent"
  completed_at: "2026-05-25T11:00:00Z"
  artifact_type: "api_implementation"

  files:
    - path: "src/routes/auth.py"
      language: "python"
      content: |
        from fastapi import APIRouter, HTTPException
        from src.schemas.auth_schemas import LoginRequest, LoginResponse
        from src.services.auth_service import AuthService

        router = APIRouter(prefix="/api/auth")

        @router.post("/login", response_model=LoginResponse)
        async def login(request: LoginRequest):
            result = await AuthService.login(request.email, request.password)
            if result is None:
                raise HTTPException(status_code=401, detail={"error": "Invalid credentials", "code": "INVALID_CREDENTIALS"})
            return result
      purpose: "Login route handler"

    - path: "src/services/auth_service.py"
      language: "python"
      content: |
        from src.repositories.user_repository import UserRepository
        from src.utils.password import verify_password
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
      purpose: "Login business logic"

  contract_ref: "api-001"

  endpoints_implemented:
    - method: "POST"
      path: "/api/auth/login"
      contract_ref: "api-001"
      status_codes_handled: [200, 400, 401]

  models_created: []

  tests_written: []

  self_assessment:
    contract_compliance: true
    known_gaps: []
    security_checklist:
      no_plaintext_passwords: true
      constant_time_comparison: true
      env_var_secrets: true
      input_validation: true
      no_sql_concatenation: true
```
