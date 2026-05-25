# Architecture Layer — Output Schema

## Purpose

Defines the exact structure of the `architecture_contract` message that the architecture layer produces. This message is consumed by the execution planning layer.

## Schema

```yaml
architecture_contract:
  intent_id: string                # Required. Must match active intent.
  generated_at: string             # Required. ISO 8601 timestamp.
  version: integer                 # Required. Starts at 1, increments on amendments.
  status: enum                     # Required. "draft" | "review" | "active" | "amended"

  api_contracts:                   # Required. Minimum 1.
    - contract_id: string          # Format: "api-{NNN}"
      intent_id: string
      feature_ref: string          # Which feature this serves
      endpoint:
        method: enum               # GET | POST | PUT | PATCH | DELETE
        path: string
        description: string
        auth_required: boolean
      request:
        headers:
          - name: string
            required: boolean
            description: string
        path_params:
          - name: string
            type: string
            description: string
        query_params:
          - name: string
            type: string
            required: boolean
            default: any | null
            description: string
        body:
          content_type: string
          schema:
            "[field_name]":
              type: string
              required: boolean
              constraints: object
              description: string
      responses:
        - status: integer
          description: string
          schema:
            "[field_name]":
              type: string
              nullable: boolean
              description: string

  db_contracts:                    # Required. Can be empty list.
    - contract_id: string          # Format: "db-{NNN}"
      intent_id: string
      feature_ref: string
      table: string                # Table name (plural snake_case)
      columns:
        "[column_name]":
          type: string             # SQL type
          primary: boolean
          unique: boolean
          not_null: boolean
          default: string | null
          foreign_key: string | null  # "table.column" format
          cascade: string | null      # "CASCADE" | "SET NULL" | "RESTRICT"
      indexes:
        - columns: [string]
          unique: boolean
          name: string

  execution_contracts:             # Required. Minimum 1.
    - contract_id: string          # Format: "exec-{NNN}"
      intent_id: string
      feature_ref: string
      description: string
      acceptance_criteria:
        - string                   # Each criterion is a testable statement
      security_constraints:
        - string
      edge_cases:
        - string
```

## Validation Rules

1. `intent_id` must exist in `intent_registry/active_intents.yaml`
2. Every `feature_ref` must exist in the originating `intent_decomposition`
3. Every API contract must have at least one success and one error response
4. Every DB contract column must have an explicit `type`
5. Every execution contract must have at least 2 acceptance criteria
6. `contract_id` values must be globally unique across all contract types
7. If `status` is "draft", it cannot be used by execution agents
8. Foreign key references must point to tables defined in this or previous contracts

## Example Output

```yaml
architecture_contract:
  intent_id: "intent-001"
  generated_at: "2026-05-25T10:15:00Z"
  version: 1
  status: "draft"

  api_contracts:
    - contract_id: "api-001"
      intent_id: "intent-001"
      feature_ref: "feat-001"
      endpoint:
        method: "POST"
        path: "/api/auth/login"
        description: "Authenticate user with email and password"
        auth_required: false
      request:
        headers: []
        path_params: []
        query_params: []
        body:
          content_type: "application/json"
          schema:
            email:
              type: "string"
              required: true
              constraints: { format: "email", max_length: 255 }
              description: "User's email address"
            password:
              type: "string"
              required: true
              constraints: { min_length: 8, max_length: 128 }
              description: "User's password"
      responses:
        - status: 200
          description: "Login successful"
          schema:
            access_token: { type: "string", nullable: false, description: "JWT access token" }
            refresh_token: { type: "string", nullable: false, description: "JWT refresh token" }
            expires_in: { type: "integer", nullable: false, description: "Token lifetime in seconds" }
        - status: 401
          description: "Invalid credentials"
          schema:
            error: { type: "string", nullable: false, description: "Error message" }
            code: { type: "string", nullable: false, description: "INVALID_CREDENTIALS" }

  db_contracts:
    - contract_id: "db-001"
      intent_id: "intent-001"
      feature_ref: "feat-001"
      table: "users"
      columns:
        id: { type: "uuid", primary: true, unique: true, not_null: true, default: "gen_random_uuid()", foreign_key: null, cascade: null }
        email: { type: "varchar(255)", primary: false, unique: true, not_null: true, default: null, foreign_key: null, cascade: null }
        password_hash: { type: "varchar(255)", primary: false, unique: false, not_null: true, default: null, foreign_key: null, cascade: null }
        created_at: { type: "timestamptz", primary: false, unique: false, not_null: true, default: "now()", foreign_key: null, cascade: null }
        updated_at: { type: "timestamptz", primary: false, unique: false, not_null: true, default: "now()", foreign_key: null, cascade: null }
      indexes:
        - columns: ["email"]
          unique: true
          name: "idx_users_email"

  execution_contracts:
    - contract_id: "exec-001"
      intent_id: "intent-001"
      feature_ref: "feat-001"
      description: "Login endpoint authenticates user and returns JWT"
      acceptance_criteria:
        - "Returns 200 with valid JWT when email and password are correct"
        - "Returns 401 with INVALID_CREDENTIALS when password is wrong"
        - "Returns 401 with INVALID_CREDENTIALS when email does not exist"
        - "Returns 400 with VALIDATION_ERROR when email format is invalid"
        - "Returns 400 with VALIDATION_ERROR when password is shorter than 8 characters"
        - "JWT access_token contains user ID in sub claim"
        - "JWT expires_in matches the expires_in field in response"
      security_constraints:
        - "Password is compared using constant-time hash comparison"
        - "Error response does not reveal whether email exists or password is wrong"
        - "Password value is never logged or included in any response"
      edge_cases:
        - "Email with leading/trailing whitespace is trimmed before lookup"
        - "Email comparison is case-insensitive"
```
