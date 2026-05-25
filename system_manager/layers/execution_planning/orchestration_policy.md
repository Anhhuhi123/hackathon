# Execution Planning — Orchestration Policy

## Purpose

Defines how the execution planner manages task lifecycle, handles failures, and coordinates between agents during execution.

## Task Lifecycle

```
pending → assigned → in_progress → completed → validated
                         │
                         ├── failed → retry (max 2) → escalated
                         │
                         └── blocked → unblocked → in_progress
```

### State Definitions

| State | Meaning |
|-------|---------|
| `pending` | Task created but not yet assigned |
| `assigned` | Task sent to agent via `task_assignment` message |
| `in_progress` | Agent acknowledged and started work |
| `completed` | Agent submitted `implementation_artifact` |
| `validated` | Validation layer confirmed contract compliance |
| `failed` | Agent could not complete the task |
| `blocked` | Task is waiting on a dependency |
| `escalated` | Failed after max retries, requires human intervention |

## Orchestration Rules

### Rule 1: Phase Gating

Tasks in Phase N+1 do not start until all Phase N tasks are `completed` or `validated`.

**Exception:** If a Phase N task is `blocked` by an external dependency (not a task in the same phase), Phase N+1 tasks that don't depend on the blocked task may proceed.

### Rule 2: Parallel Dispatch Within Phases

All tasks within the same phase that have no inter-task dependencies are dispatched simultaneously.

```yaml
# Phase 2 dispatch: all four tasks sent at the same time
dispatch:
  - task-be-002  # Login API
  - task-be-003  # Register API
  - task-fe-001  # Login UI
  - task-fe-002  # API client
```

### Rule 3: Retry Policy

| Failure Type | Max Retries | Backoff |
|-------------|-------------|---------|
| Implementation error (agent code bug) | 2 | None — immediate retry with error context |
| Contract misunderstanding | 1 | Include clarification in retry message |
| Infrastructure failure | 2 | 30-second delay |
| Ambiguity (agent can't decide) | 0 | Immediate escalation |

On retry, the planner sends a new `task_assignment` with:
```yaml
retry_context:
  attempt: 2
  previous_error: "Import error: module 'bcrypt' not found"
  guidance: "Use hashlib with pbkdf2_hmac instead of bcrypt"
```

### Rule 4: Dependency Monitoring

The planner continuously checks:
1. Are any `in_progress` tasks past their expected duration? → Emit warning
2. Are any `blocked` tasks unblockable? → Escalate
3. Are any `completed` tasks' outputs inconsistent? → Route to validation

### Rule 5: Completion Criteria

An intent's execution is complete when:
- All tasks are in `completed` or `validated` state
- No tasks are in `failed` or `escalated` state
- Validation layer has emitted a passing `validation_result` for the intent

### Rule 6: Cross-Agent Communication

FE and BE agents **never communicate directly**. All coordination happens through:
1. Shared contracts (both read the same API contract)
2. The execution planner (routes messages and manages state)
3. The validation layer (checks consistency after both complete)

## Monitoring

The execution planner updates `intent_registry/execution_state.yaml` after every state change:

```yaml
state_update:
  intent_id: "intent-001"
  task_id: "task-be-002"
  old_status: "in_progress"
  new_status: "completed"
  timestamp: "2026-05-25T10:45:00Z"
  artifacts_count: 2
```

## Escalation Triggers

The planner escalates to human governor when:

1. A task fails after maximum retries
2. Two agents produce conflicting outputs for the same contract
3. A blocking dependency cannot be resolved
4. Total execution time exceeds 3x the estimated duration
5. An agent reports an ambiguity it cannot resolve

Escalation message format:
```yaml
escalation:
  intent_id: "intent-001"
  source: "execution_planning"
  reason: "task_max_retries_exceeded"
  task_id: "task-be-002"
  description: "Backend agent failed to implement POST /api/auth/login after 2 retries"
  last_error: "Service layer cannot hash password — missing crypto dependency"
  suggested_action: "Add bcrypt to project dependencies or switch to built-in hashlib"
  blocking: true
```
