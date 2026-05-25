# Architecture Layer — Architecture Rules

## Purpose

The architecture layer receives decomposed features from the intent layer and generates **binding contracts** that all execution agents must follow. This file defines the rules governing how contracts are generated.

## Role

The architecture layer is the **single source of truth** for:
- API endpoint definitions (method, path, request/response schemas)
- Database table definitions (columns, types, constraints, indexes)
- Execution contracts (acceptance criteria, behavioral expectations)
- Cross-feature consistency (shared resources, naming, patterns)

## Contract Generation Rules

### Rule 1: One Contract Per Endpoint

Every API endpoint gets exactly one contract. No contract covers multiple endpoints.

```yaml
# Correct: one contract per endpoint
- endpoint: "POST /api/auth/login"
  ...
- endpoint: "POST /api/auth/register"
  ...

# Wrong: multiple endpoints in one contract
- endpoints: ["POST /api/auth/login", "POST /api/auth/register"]
```

### Rule 2: Complete Request/Response Schemas

Every contract must define the **full request and response schema**, including:
- All fields with types
- Required vs. optional markers
- Validation constraints (min_length, max_length, format, enum values)
- All HTTP status codes with their response bodies

No field may be left as "any" or "object" without further definition.

### Rule 3: Error Responses Are First-Class

Every endpoint contract must define at least:
- One success response (2xx)
- One client error response (4xx)
- Error responses use a consistent structure:

```yaml
error_response:
  error: string        # Human-readable message
  code: string         # Machine-readable error code (UPPER_SNAKE_CASE)
  details: object|null # Optional additional context
```

### Rule 4: Database Contracts Include Constraints

Database contracts are not just column lists. They must include:
- Primary keys
- Unique constraints
- NOT NULL constraints
- Foreign key relationships with cascade rules
- Default values
- Indexes for queried columns

### Rule 5: Naming Consistency

| Element | Convention | Example |
|---------|-----------|---------|
| API paths | kebab-case | `/api/auth/forgot-password` |
| JSON fields | snake_case | `access_token` |
| DB tables | plural snake_case | `users` |
| DB columns | snake_case | `created_at` |
| Error codes | UPPER_SNAKE_CASE | `INVALID_CREDENTIALS` |

### Rule 6: No Implicit Behavior

If the behavior isn't in the contract, agents must not implement it.

```yaml
# Contract says:
response:
  "200":
    access_token: string
    expires_in: integer

# Agent MUST NOT add fields not in contract:
# ❌ Adding "user_id" to the response
# ❌ Adding rate limiting headers
# ❌ Adding pagination metadata
```

### Rule 7: Shared Resources Get Single Contracts

If multiple features reference the same database table:
- One contract defines the table (owned by the feature that creates it)
- Other features reference the contract by ID
- Modifications to shared resources require a contract amendment

### Rule 8: Execution Contracts Are Behavioral

Execution contracts describe **what the code must do**, not how. They define:
- Acceptance criteria (testable conditions)
- Edge cases to handle
- Security constraints
- Performance expectations (if relevant for MVP)

```yaml
execution_contract:
  contract_id: "exec-001"
  feature_ref: "feat-001"
  description: "Login endpoint authenticates user and returns JWT"
  acceptance_criteria:
    - "Returns 200 with JWT on valid email+password"
    - "Returns 401 with INVALID_CREDENTIALS on wrong password"
    - "Returns 401 with INVALID_CREDENTIALS on non-existent email"
    - "Password is never logged or returned in any response"
    - "JWT contains user_id claim"
    - "JWT expires in 3600 seconds"
  security:
    - "Passwords are compared using constant-time comparison"
    - "Failed attempts do not reveal whether email exists"
```

## Contract Conflict Resolution

When two features require conflicting contracts:

1. Architecture layer detects the conflict
2. Emits an `escalation` message to human governor with:
   - Both conflicting contracts
   - The source features
   - Proposed resolution options
3. Execution halts for affected features until resolved
4. Human governor selects resolution
5. Architecture layer amends contracts accordingly

## Output

The architecture layer produces an `architecture_contract` message containing:
- `api_contracts[]` — All API endpoint definitions
- `db_contracts[]` — All database table definitions
- `execution_contracts[]` — All behavioral contracts

See `output_schema.md` for the complete schema.
