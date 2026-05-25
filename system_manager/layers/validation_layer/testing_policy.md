# Validation Layer — Testing Policy

## Purpose

The validation layer is the final checkpoint before an intent is marked as completed. It verifies that all implementations conform to their contracts and that FE/BE outputs are mutually consistent.

## Validation Types

### 1. Contract Compliance Check

Verify each implementation artifact against its source contract.

**For backend artifacts:**
- Route method and path match the API contract
- Request schema validation matches contract constraints
- Response body fields match contract response schema
- All contract-defined status codes are handled
- Error codes match contract-defined codes
- DB model matches DB contract columns and types

**For frontend artifacts:**
- API client calls use correct method, path, and request body
- Response fields used in UI exist in the contract response schema
- Client-side validation constraints match contract constraints
- All contract error codes have user-facing handling

### 2. Cross-Agent Consistency Check

Verify that FE and BE implementations are compatible:

| Check | Description |
|-------|-------------|
| Request shape match | FE sends the same fields that BE expects |
| Response shape match | FE reads the same fields that BE returns |
| Error code alignment | FE handles all error codes that BE can return |
| Validation alignment | FE client validation matches BE server validation |
| Auth alignment | FE sends Bearer token where BE requires auth |

### 3. Acceptance Criteria Verification

For each execution contract, verify that:
- Every acceptance criterion has a corresponding test
- Tests cover positive, negative, and edge cases
- No acceptance criterion is untested

### 4. Structural Integrity

- No orphan files (every file traces to a task)
- No missing imports between generated files
- File paths follow the coding rules conventions
- No duplicate route definitions

## Validation Process

```
1. Collect all implementation_artifacts for the intent
2. Load all contracts for the intent
3. Run Contract Compliance Check on each artifact
4. Run Cross-Agent Consistency Check
5. Run Acceptance Criteria Verification
6. Run Structural Integrity checks
7. Produce validation_result message
```

## Pass/Fail Criteria

**Pass:** All checks pass. Intent moves to `completed`.

**Partial:** Non-critical issues found. Intent can proceed with warnings.
- Missing CSS styles (non-functional)
- Suboptimal but correct code patterns

**Fail:** Critical issues found. Intent cycles back. Examples:
- FE sends a field that BE doesn't expect
- BE returns a field that FE doesn't handle
- Missing test for an acceptance criterion
- Contract constraint not enforced in validation
- Security checklist item unchecked

## Feedback Loop

When validation fails, the validation layer sends a `validation_result` message with `required_actions` that route back through the execution planner:

```yaml
required_actions:
  - target: "backend_agent"
    task_ref: "task-be-002"
    action: "Add handling for empty email in login request"
    severity: "required"
    contract_ref: "exec-001"
    criterion: "Returns 400 with VALIDATION_ERROR when email is empty"

  - target: "frontend_agent"
    task_ref: "task-fe-001"
    action: "Add error display for 409 CONFLICT status code"
    severity: "required"
    contract_ref: "api-002"
    criterion: "UI handles all contract-defined error codes"
```

The execution planner creates new tasks from these actions and assigns them back to the respective agents.

## Validation Frequency

- Validation runs **after all Phase 3 (testing) tasks complete**
- Validation can be triggered **manually by human governor** at any time
- Re-validation runs after fix tasks are completed
- Maximum 3 validation cycles per intent before escalation to human
