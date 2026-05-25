# Architectural Policy

## Purpose

This policy governs how architectural decisions are made, recorded, and enforced across the organization. The architecture layer is the **single source of truth** for all technical contracts.

## Decision Authority

| Decision Type | Authority | Override |
|--------------|-----------|----------|
| API contract structure | Architecture Layer (AI) | Human Governor |
| Database schema design | Architecture Layer (AI) | Human Governor |
| Technology stack choices | Human Governor | — |
| Security requirements | Human Governor + Architecture Layer | Human Governor |
| Naming conventions | Architecture Layer (AI) | Human Governor |
| Dependency additions | Architecture Layer (AI) | Human Governor |

## Architectural Constraints

### API Design

- All APIs are RESTful with JSON request/response bodies
- URL paths use kebab-case: `/api/auth/forgot-password`
- Response bodies use snake_case for field names
- Every endpoint has defined response schemas for success AND error cases
- Pagination uses `offset` + `limit` pattern
- Authentication uses Bearer JWT tokens in Authorization header

### Database Design

- Primary keys are UUIDs
- Table names are plural snake_case: `users`, `auth_tokens`
- Every table has `created_at` and `updated_at` timestamps
- Foreign keys are explicitly defined with cascade rules
- Indexes are declared in the contract for any column used in WHERE clauses

### Frontend Architecture

- Component-based architecture (React or equivalent)
- State management through props and local state for MVP
- API calls through a centralized API client module
- Form validation mirrors backend validation rules from the contract
- Error states map to contract-defined error codes

### Backend Architecture

- Route → Service → Repository layering
- Business logic lives in the Service layer only
- Routes handle HTTP concerns (parsing, status codes)
- Repository handles data access only
- No business logic in routes or repositories

## Contract Lifecycle

```
1. Architecture Layer generates contract (status: draft)
2. Human Governor reviews (status: review)
3. Human approves or requests changes
4. Contract becomes active (status: active)
5. Execution agents implement against active contracts
6. Contract is frozen during execution (no modifications)
7. Post-validation, contract moves to (status: completed)
```

## Contract Modification Rules

- **Active contracts cannot be modified** during execution
- If a contract needs changes, execution must pause
- The architecture layer generates a **contract amendment** with:
  - What changed
  - Why it changed
  - Impact on existing implementation
  - Which tasks need re-execution
- Human governor must approve amendments

## Architecture Decision Records (ADRs)

Every significant architectural choice is recorded in `shared_memory/architecture_decisions/` using this format:

```yaml
adr:
  id: "adr-001"
  date: "2026-05-25"
  intent_id: "intent-001"
  title: "Use JWT for authentication instead of session cookies"
  context: "Login feature requires stateless auth for API-first architecture"
  decision: "JWT with RS256 signing, 1-hour access tokens, 7-day refresh tokens"
  alternatives_considered:
    - "Session cookies — rejected due to stateful server requirement"
    - "API keys — rejected, not suitable for user-facing auth"
  consequences:
    - "Need JWT signing key management"
    - "Token refresh endpoint required"
    - "Frontend must store tokens securely"
```

## Technology Stack (MVP)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + TypeScript | Component model, type safety |
| Backend | Python (FastAPI) | Async support, auto-docs, type hints |
| Database | PostgreSQL | Relational, JSON support, mature |
| Auth | JWT (RS256) | Stateless, API-friendly |
| API Format | REST + JSON | Simple, well-understood |

Human governors may override these choices per-intent if justified.
