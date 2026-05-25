# Communication Protocol

## Purpose

This file defines how every agent in the organization communicates. All inter-agent communication is structured, typed, and validated. There is **no free-form messaging** between agents.

## Message Envelope

Every message between agents uses this envelope:

```yaml
message:
  id: string           # Unique message ID (UUID v4)
  timestamp: string    # ISO 8601 timestamp
  intent_id: string    # The intent this message belongs to
  source: string       # Sending agent layer name
  target: string       # Receiving agent layer name
  type: string         # Message type (see below)
  priority: string     # "critical" | "normal" | "low"
  payload: object      # Type-specific structured data
  correlation_id: string | null  # ID of the message this responds to
```

## Message Types

### 1. `intent_decomposition`

**Source:** intent_layer → **Target:** architecture_layer

Carries the decomposed requirements from a raw human intent.

```yaml
type: intent_decomposition
payload:
  intent_id: "intent-001"
  raw_intent: "I want a login page"
  decomposed_features:
    - feature_id: "feat-001"
      name: "user_login"
      description: "Email/password authentication with JWT tokens"
      category: "authentication"
      requires_api: true
      requires_ui: true
      requires_db: true
    - feature_id: "feat-002"
      name: "forgot_password"
      description: "Password reset flow via email link"
      category: "authentication"
      requires_api: true
      requires_ui: true
      requires_db: false
    - feature_id: "feat-003"
      name: "input_validation"
      description: "Client and server-side validation for auth forms"
      category: "validation"
      requires_api: true
      requires_ui: true
      requires_db: false
  inferred_dependencies:
    - "user table with email and hashed password"
    - "JWT signing key configuration"
    - "email service for password reset"
```

### 2. `architecture_contract`

**Source:** architecture_layer → **Target:** execution_planning

Contains the generated API, DB, and execution contracts.

```yaml
type: architecture_contract
payload:
  intent_id: "intent-001"
  api_contracts:
    - endpoint: "POST /api/auth/login"
      method: "POST"
      request_schema:
        body:
          email: { type: "string", required: true, format: "email" }
          password: { type: "string", required: true, min_length: 8 }
      response_schema:
        "200":
          access_token: { type: "string" }
          refresh_token: { type: "string" }
          expires_in: { type: "integer" }
        "401":
          error: { type: "string" }
          code: { type: "string", enum: ["INVALID_CREDENTIALS"] }
    - endpoint: "POST /api/auth/forgot-password"
      method: "POST"
      request_schema:
        body:
          email: { type: "string", required: true, format: "email" }
      response_schema:
        "200":
          message: { type: "string" }
        "404":
          error: { type: "string" }
          code: { type: "string", enum: ["USER_NOT_FOUND"] }
  db_contracts:
    - table: "users"
      columns:
        id: { type: "uuid", primary: true }
        email: { type: "varchar(255)", unique: true, not_null: true }
        password_hash: { type: "varchar(255)", not_null: true }
        created_at: { type: "timestamp", default: "now()" }
        updated_at: { type: "timestamp", default: "now()" }
  execution_contracts:
    - contract_id: "exec-001"
      description: "Login endpoint must verify password hash and return JWT"
      acceptance_criteria:
        - "Returns 200 with valid JWT on correct credentials"
        - "Returns 401 on wrong password"
        - "Returns 401 on non-existent email"
        - "JWT expires in 3600 seconds"
```

### 3. `task_assignment`

**Source:** execution_planning → **Target:** frontend_agent | backend_agent

```yaml
type: task_assignment
payload:
  intent_id: "intent-001"
  task_id: "task-be-001"
  assigned_to: "backend_agent"
  task_type: "api_implementation"
  contract_ref: "POST /api/auth/login"
  inputs:
    api_contract: { ... }   # Full contract object
    db_contract: { ... }    # Relevant DB contract
  expected_output: "implementation_artifact"
  deadline_relative: "after db_migration"
```

### 4. `implementation_artifact`

**Source:** frontend_agent | backend_agent → **Target:** validation_layer

```yaml
type: implementation_artifact
payload:
  intent_id: "intent-001"
  task_id: "task-be-001"
  agent: "backend_agent"
  artifact_type: "code"
  files:
    - path: "src/routes/auth.py"
      content: "..."
      language: "python"
    - path: "src/models/user.py"
      content: "..."
      language: "python"
  contract_ref: "POST /api/auth/login"
  self_assessment:
    contract_compliance: true
    known_gaps: []
```

### 5. `validation_result`

**Source:** validation_layer → **Target:** execution_planning

```yaml
type: validation_result
payload:
  intent_id: "intent-001"
  task_id: "task-be-001"
  status: "pass" | "fail" | "partial"
  checks:
    - check: "contract_compliance"
      status: "pass"
      details: "All response fields match contract schema"
    - check: "cross_agent_consistency"
      status: "pass"
      details: "FE request format matches BE expected input"
    - check: "test_coverage"
      status: "fail"
      details: "Missing test for 401 on non-existent email"
  required_actions:
    - target: "backend_agent"
      action: "Add test case for non-existent email login attempt"
      severity: "required"
```

### 6. `escalation`

**Source:** any_agent → **Target:** human_governor

```yaml
type: escalation
payload:
  intent_id: "intent-001"
  source: "architecture_layer"
  reason: "ambiguous_requirement"
  description: "Intent mentions 'login' but does not specify OAuth vs email/password. Both require different contracts."
  options:
    - option_id: "opt-1"
      description: "Email/password only"
      impact: "Simpler, 2 endpoints"
    - option_id: "opt-2"
      description: "Email/password + Google OAuth"
      impact: "4 endpoints, OAuth client setup required"
  blocking: true
```

### 7. `state_update`

**Source:** any_agent → **Target:** intent_registry

```yaml
type: state_update
payload:
  intent_id: "intent-001"
  field: "status"
  old_value: "architecture_in_progress"
  new_value: "execution_in_progress"
  reason: "All contracts generated and approved"
```

## Communication Rules

1. **No direct agent-to-agent calls** — All messages route through the message envelope
2. **Every message references an intent** — Orphan messages are rejected
3. **Responses use correlation_id** — To link response messages to their originating request
4. **Agents must validate incoming payloads** — Reject malformed messages with a structured error
5. **Escalation is mandatory on ambiguity** — Agents never guess; they escalate to human governor
6. **Message ordering** — Messages within an intent are processed in timestamp order

## Communication Flow Diagram

```
Human Intent
     │
     ▼
┌─────────────┐  intent_decomposition   ┌──────────────────┐
│ Intent Layer │ ────────────────────▶   │ Architecture     │
└─────────────┘                         │ Layer            │
                                        └────────┬─────────┘
                                                 │ architecture_contract
                                                 ▼
                                        ┌──────────────────┐
                                        │ Execution        │
                                        │ Planning         │
                                        └──┬───────────┬───┘
                              task_assign  │           │  task_assignment
                                           ▼           ▼
                                   ┌──────────┐ ┌──────────┐
                                   │ FE Agent │ │ BE Agent │
                                   └────┬─────┘ └────┬─────┘
                        artifact        │             │  artifact
                                        ▼             ▼
                                   ┌──────────────────────┐
                                   │ Validation Layer     │
                                   └──────────┬───────────┘
                                              │ validation_result
                                              ▼
                                   ┌──────────────────────┐
                                   │ Intent Registry      │
                                   │ (state_update)       │
                                   └──────────────────────┘
```
