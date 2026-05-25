# Validation Layer — Validation Schema

## Purpose

Defines the exact structure of the `validation_result` message produced by the validation layer.

## Schema

```yaml
validation_result:
  intent_id: string
  validated_at: string           # ISO 8601
  status: enum                   # "pass" | "fail" | "partial"
  validation_cycle: integer      # Which validation attempt (1, 2, or 3)

  summary:
    total_checks: integer
    passed: integer
    failed: integer
    warnings: integer

  checks:
    - check_id: string           # "chk-{NNN}"
      category: enum             # "contract_compliance" | "cross_agent_consistency" | "acceptance_criteria" | "structural_integrity"
      target_task: string        # Task ID being validated
      target_agent: string       # Agent that produced the artifact
      status: enum               # "pass" | "fail" | "warning"
      description: string        # What was checked
      details: string            # Result details
      contract_ref: string|null  # Related contract

  required_actions:              # Present only when status is "fail" or "partial"
    - action_id: string
      target: string             # Agent to fix this
      task_ref: string           # Original task ID
      action: string             # What needs to be done
      severity: enum             # "required" | "recommended"
      contract_ref: string
      criterion: string|null     # Acceptance criterion if applicable
```

## Example: Passing Validation

```yaml
validation_result:
  intent_id: "intent-001"
  validated_at: "2026-05-25T12:00:00Z"
  status: "pass"
  validation_cycle: 1
  summary:
    total_checks: 8
    passed: 8
    failed: 0
    warnings: 0
  checks:
    - check_id: "chk-001"
      category: "contract_compliance"
      target_task: "task-be-002"
      target_agent: "backend_agent"
      status: "pass"
      description: "POST /api/auth/login matches api-001 contract"
      details: "Method, path, request schema, response schema, and error codes all match"
      contract_ref: "api-001"
    - check_id: "chk-002"
      category: "cross_agent_consistency"
      target_task: "task-fe-001"
      target_agent: "frontend_agent"
      status: "pass"
      description: "FE login form sends fields matching BE expectation"
      details: "Request fields [email, password] match. Response fields [access_token] used correctly."
      contract_ref: "api-001"
    - check_id: "chk-003"
      category: "acceptance_criteria"
      target_task: "task-be-005"
      target_agent: "backend_agent"
      status: "pass"
      description: "All acceptance criteria for exec-001 have tests"
      details: "7/7 criteria covered by test cases"
      contract_ref: "exec-001"
  required_actions: []
```

## Example: Failing Validation

```yaml
validation_result:
  intent_id: "intent-001"
  validated_at: "2026-05-25T12:00:00Z"
  status: "fail"
  validation_cycle: 1
  summary:
    total_checks: 8
    passed: 6
    failed: 2
    warnings: 0
  checks:
    - check_id: "chk-001"
      category: "contract_compliance"
      target_task: "task-be-002"
      target_agent: "backend_agent"
      status: "pass"
      description: "POST /api/auth/login matches api-001"
      details: "All fields match"
      contract_ref: "api-001"
    - check_id: "chk-004"
      category: "acceptance_criteria"
      target_task: "task-be-005"
      target_agent: "backend_agent"
      status: "fail"
      description: "Missing test for acceptance criterion"
      details: "No test covers: 'Returns 401 on non-existent email'"
      contract_ref: "exec-001"
    - check_id: "chk-005"
      category: "cross_agent_consistency"
      target_task: "task-fe-001"
      target_agent: "frontend_agent"
      status: "fail"
      description: "FE missing error handler for 409 CONFLICT"
      details: "BE register endpoint returns 409, FE has no handler"
      contract_ref: "api-002"
  required_actions:
    - action_id: "act-001"
      target: "backend_agent"
      task_ref: "task-be-005"
      action: "Add test case for login with non-existent email"
      severity: "required"
      contract_ref: "exec-001"
      criterion: "Returns 401 on non-existent email"
    - action_id: "act-002"
      target: "frontend_agent"
      task_ref: "task-fe-001"
      action: "Add error handling for 409 CONFLICT on register"
      severity: "required"
      contract_ref: "api-002"
      criterion: null
```
