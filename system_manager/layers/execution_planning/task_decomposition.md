# Execution Planning — Task Decomposition

## Purpose

This file defines how the execution planner breaks architecture contracts into executable tasks for FE and BE agents. Task decomposition is the bridge between **what to build** (contracts) and **who builds what** (agent assignments).

## Decomposition Process

```
Architecture Contract
       │
       ▼
┌─────────────────────┐
│ 1. Extract Tasks    │  Identify discrete work units from contracts
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Classify Tasks   │  Assign to FE or BE (or both)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Order Tasks      │  Determine execution order and parallelism
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Assign Tasks     │  Send task_assignment messages to agents
└─────────────────────┘
```

## Step 1: Extract Tasks

For each contract type, extract tasks using these rules:

### From API Contracts

Each API endpoint generates:

| Task | Agent | Description |
|------|-------|-------------|
| `api_implementation` | backend_agent | Implement the route, service, and validation logic |
| `api_client_integration` | frontend_agent | Create the API client function to call this endpoint |

### From DB Contracts

Each database table generates:

| Task | Agent | Description |
|------|-------|-------------|
| `db_migration` | backend_agent | Create the migration file and model definition |

### From Execution Contracts

Each execution contract generates:

| Task | Agent | Description |
|------|-------|-------------|
| `unit_tests` | backend_agent | Write tests covering all acceptance criteria |
| `integration_test` | validation_layer | Cross-agent consistency test |

### From Feature Context

Each feature with `requires_ui: true` generates:

| Task | Agent | Description |
|------|-------|-------------|
| `ui_implementation` | frontend_agent | Build the page/component for this feature |
| `ui_validation` | frontend_agent | Implement client-side form validation |

## Step 2: Classify Tasks

Every task is assigned exactly one agent:

```yaml
task_classification:
  backend_agent:
    - db_migration
    - api_implementation
    - unit_tests
  frontend_agent:
    - ui_implementation
    - ui_validation
    - api_client_integration
  validation_layer:
    - integration_test
    - contract_compliance_check
```

## Step 3: Order Tasks

### Dependency Rules

```yaml
execution_order:
  # Phase 1: Database (must complete before API)
  phase_1:
    - db_migration
    parallel: false
    reason: "Tables must exist before services can use them"

  # Phase 2: Backend API + Frontend UI (parallel)
  phase_2:
    - api_implementation    # BE works on real API
    - ui_implementation     # FE works against contract stubs
    - api_client_integration # FE builds API client from contract
    - ui_validation         # FE builds validation from contract
    parallel: true
    reason: "Both agents work against contracts, not against each other"

  # Phase 3: Unit Tests (after API is implemented)
  phase_3:
    - unit_tests
    parallel: false
    depends_on: phase_2
    reason: "Tests validate the actual implementation"

  # Phase 4: Integration Validation (after all implementation)
  phase_4:
    - integration_test
    - contract_compliance_check
    parallel: true
    depends_on: phase_3
    reason: "Cross-agent validation requires both FE and BE artifacts"
```

### Parallelization Principle

**FE and BE always execute in parallel.** This is possible because:

1. Both agents receive the same API contract
2. FE agent builds against the contract (mock/stub responses during dev)
3. BE agent implements the actual API
4. Validation layer checks that both sides match the contract

## Step 4: Assign Tasks

Each task becomes a `task_assignment` message:

```yaml
task_assignment:
  intent_id: "intent-001"
  task_id: "task-be-001"
  assigned_to: "backend_agent"
  task_type: "db_migration"
  phase: 1
  contract_ref: "db-001"
  inputs:
    db_contract:
      table: "users"
      columns: { ... }
      indexes: { ... }
  expected_output: "implementation_artifact"
  depends_on: []
```

## Full Decomposition Example

**Input:** Architecture contract for "I want a login page" (intent-001)

**Generated Task Tree:**

```yaml
tasks:
  # Phase 1: Database
  - task_id: "task-be-001"
    task_type: "db_migration"
    assigned_to: "backend_agent"
    phase: 1
    contract_ref: "db-001"
    description: "Create users table with email, password_hash, timestamps"
    depends_on: []

  # Phase 2: Parallel FE/BE
  - task_id: "task-be-002"
    task_type: "api_implementation"
    assigned_to: "backend_agent"
    phase: 2
    contract_ref: "api-001"
    description: "Implement POST /api/auth/login endpoint"
    depends_on: ["task-be-001"]

  - task_id: "task-be-003"
    task_type: "api_implementation"
    assigned_to: "backend_agent"
    phase: 2
    contract_ref: "api-002"
    description: "Implement POST /api/auth/register endpoint"
    depends_on: ["task-be-001"]

  - task_id: "task-be-004"
    task_type: "api_implementation"
    assigned_to: "backend_agent"
    phase: 2
    contract_ref: "api-003"
    description: "Implement POST /api/auth/forgot-password endpoint"
    depends_on: ["task-be-001"]

  - task_id: "task-fe-001"
    task_type: "ui_implementation"
    assigned_to: "frontend_agent"
    phase: 2
    contract_ref: "feat-001"
    description: "Build login page with email/password form"
    depends_on: []

  - task_id: "task-fe-002"
    task_type: "api_client_integration"
    assigned_to: "frontend_agent"
    phase: 2
    contract_ref: "api-001"
    description: "Create API client function for POST /api/auth/login"
    depends_on: []

  - task_id: "task-fe-003"
    task_type: "ui_implementation"
    assigned_to: "frontend_agent"
    phase: 2
    contract_ref: "feat-002"
    description: "Build forgot password page"
    depends_on: []

  - task_id: "task-fe-004"
    task_type: "ui_validation"
    assigned_to: "frontend_agent"
    phase: 2
    contract_ref: "feat-003"
    description: "Implement client-side login form validation"
    depends_on: []

  # Phase 3: Tests
  - task_id: "task-be-005"
    task_type: "unit_tests"
    assigned_to: "backend_agent"
    phase: 3
    contract_ref: "exec-001"
    description: "Write tests for login endpoint acceptance criteria"
    depends_on: ["task-be-002"]

  # Phase 4: Validation
  - task_id: "task-val-001"
    task_type: "integration_test"
    assigned_to: "validation_layer"
    phase: 4
    contract_ref: "intent-001"
    description: "Verify FE API calls match BE endpoint contracts"
    depends_on: ["task-be-002", "task-be-003", "task-be-004", "task-fe-001", "task-fe-002", "task-fe-003"]

  - task_id: "task-val-002"
    task_type: "contract_compliance_check"
    assigned_to: "validation_layer"
    phase: 4
    contract_ref: "intent-001"
    description: "Verify all implementations match their contracts"
    depends_on: ["task-be-002", "task-be-003", "task-be-004", "task-fe-001", "task-fe-002", "task-fe-003"]
```

## Task ID Convention

```
task-{agent_prefix}-{NNN}

Agent prefixes:
  be  = backend_agent
  fe  = frontend_agent
  val = validation_layer
```
