# Execution Planning — Execution Schema

## Purpose

Defines the exact structure of the execution plan that the execution planner generates. This schema is consumed by FE/BE agents (as `task_assignment` messages) and by the runtime system (for tracking).

## Execution Plan Schema

```yaml
execution_plan:
  plan_id: string                  # Unique plan ID: "plan-{NNN}"
  intent_id: string                # The intent being executed
  created_at: string               # ISO 8601
  status: enum                     # "active" | "paused" | "completed" | "failed"
  total_tasks: integer
  completed_tasks: integer

  phases:
    - phase_id: integer            # Sequential phase number (1, 2, 3, ...)
      name: string                 # Human-readable phase name
      status: enum                 # "pending" | "in_progress" | "completed" | "blocked"
      tasks:
        - task_id: string          # Unique: "task-{agent}-{NNN}"
          task_type: enum          # See task types below
          assigned_to: enum        # "backend_agent" | "frontend_agent" | "validation_layer"
          contract_ref: string     # ID of the contract this task implements
          description: string      # One-line description
          status: enum             # "pending" | "assigned" | "in_progress" | "completed" | "failed" | "blocked" | "escalated"
          depends_on: [string]     # List of task_ids this depends on
          started_at: string|null
          completed_at: string|null
          retries: integer         # Number of retry attempts so far
          max_retries: integer     # Maximum allowed retries

          inputs:                  # Data the agent needs to execute
            contracts: [object]    # Relevant API/DB/execution contracts
            context: object|null   # Additional context (retry info, etc.)

          outputs:                 # What the agent produced (filled after completion)
            artifacts: [object]|null
            self_assessment: object|null
```

## Task Types

```yaml
task_types:
  - name: "db_migration"
    description: "Create database migration and model files"
    assigned_to: "backend_agent"
    inputs_required: ["db_contract"]
    expected_outputs: ["migration_file", "model_file"]

  - name: "api_implementation"
    description: "Implement API endpoint (route + service + validation)"
    assigned_to: "backend_agent"
    inputs_required: ["api_contract", "execution_contract", "db_contract"]
    expected_outputs: ["route_file", "service_file", "validation_file"]

  - name: "unit_tests"
    description: "Write test cases for acceptance criteria"
    assigned_to: "backend_agent"
    inputs_required: ["execution_contract", "api_contract"]
    expected_outputs: ["test_file"]

  - name: "ui_implementation"
    description: "Build frontend page or component"
    assigned_to: "frontend_agent"
    inputs_required: ["feature_description", "api_contract"]
    expected_outputs: ["component_files", "style_files"]

  - name: "ui_validation"
    description: "Implement client-side form validation"
    assigned_to: "frontend_agent"
    inputs_required: ["api_contract"]
    expected_outputs: ["validation_file"]

  - name: "api_client_integration"
    description: "Create frontend API client function"
    assigned_to: "frontend_agent"
    inputs_required: ["api_contract"]
    expected_outputs: ["api_client_file"]

  - name: "integration_test"
    description: "Verify FE and BE implementations are consistent"
    assigned_to: "validation_layer"
    inputs_required: ["fe_artifacts", "be_artifacts", "api_contracts"]
    expected_outputs: ["validation_report"]

  - name: "contract_compliance_check"
    description: "Verify implementation matches contract specifications"
    assigned_to: "validation_layer"
    inputs_required: ["implementation_artifacts", "contracts"]
    expected_outputs: ["compliance_report"]
```

## Task Assignment Message Schema

When the planner assigns a task, it sends this message:

```yaml
message:
  id: string
  timestamp: string
  intent_id: string
  source: "execution_planning"
  target: string                  # "backend_agent" | "frontend_agent"
  type: "task_assignment"
  priority: "normal"
  payload:
    task_id: string
    task_type: string
    phase: integer
    contract_ref: string
    description: string
    depends_on: [string]
    inputs:
      api_contract: object|null
      db_contract: object|null
      execution_contract: object|null
      feature_description: string|null
    expected_output: string
    retry_context: object|null    # Present only on retries
  correlation_id: null
```

## Full Example: Execution Plan

```yaml
execution_plan:
  plan_id: "plan-001"
  intent_id: "intent-001"
  created_at: "2026-05-25T10:25:00Z"
  status: "active"
  total_tasks: 10
  completed_tasks: 1

  phases:
    - phase_id: 1
      name: "Database Setup"
      status: "completed"
      tasks:
        - task_id: "task-be-001"
          task_type: "db_migration"
          assigned_to: "backend_agent"
          contract_ref: "db-001"
          description: "Create users table"
          status: "completed"
          depends_on: []
          started_at: "2026-05-25T10:28:00Z"
          completed_at: "2026-05-25T10:35:00Z"
          retries: 0
          max_retries: 2
          inputs:
            contracts: ["db-001"]
            context: null
          outputs:
            artifacts:
              - { path: "src/models/user.py", type: "code" }
              - { path: "migrations/001_create_users.sql", type: "migration" }
            self_assessment: { contract_compliance: true, known_gaps: [] }

    - phase_id: 2
      name: "Parallel FE/BE Implementation"
      status: "in_progress"
      tasks:
        - task_id: "task-be-002"
          task_type: "api_implementation"
          assigned_to: "backend_agent"
          contract_ref: "api-001"
          description: "Implement POST /api/auth/login"
          status: "in_progress"
          depends_on: ["task-be-001"]
          started_at: "2026-05-25T10:36:00Z"
          completed_at: null
          retries: 0
          max_retries: 2
          inputs:
            contracts: ["api-001", "db-001", "exec-001"]
            context: null
          outputs: null

        - task_id: "task-fe-001"
          task_type: "ui_implementation"
          assigned_to: "frontend_agent"
          contract_ref: "feat-001"
          description: "Build login page with email/password form"
          status: "in_progress"
          depends_on: []
          started_at: "2026-05-25T10:36:00Z"
          completed_at: null
          retries: 0
          max_retries: 2
          inputs:
            contracts: ["api-001"]
            context: { feature_description: "Login page with email and password form, error display, and link to forgot password" }
          outputs: null

    - phase_id: 3
      name: "Testing"
      status: "pending"
      tasks:
        - task_id: "task-be-005"
          task_type: "unit_tests"
          assigned_to: "backend_agent"
          contract_ref: "exec-001"
          description: "Write tests for login acceptance criteria"
          status: "pending"
          depends_on: ["task-be-002"]
          started_at: null
          completed_at: null
          retries: 0
          max_retries: 2
          inputs:
            contracts: ["exec-001", "api-001"]
            context: null
          outputs: null

    - phase_id: 4
      name: "Validation"
      status: "pending"
      tasks:
        - task_id: "task-val-001"
          task_type: "contract_compliance_check"
          assigned_to: "validation_layer"
          contract_ref: "intent-001"
          description: "Verify all implementations match contracts"
          status: "pending"
          depends_on: ["task-be-002", "task-fe-001", "task-be-005"]
          started_at: null
          completed_at: null
          retries: 0
          max_retries: 1
          inputs:
            contracts: ["api-001", "db-001", "exec-001"]
            context: null
          outputs: null
```
