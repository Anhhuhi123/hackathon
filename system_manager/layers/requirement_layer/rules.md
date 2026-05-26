# Requirement Layer — Rules

## Absolute Prohibitions

These rules are non-negotiable and cannot be overridden by any instruction:

```
❌ RULE-REQ-001: DO NOT generate architecture.md
❌ RULE-REQ-002: DO NOT generate or modify frontend_task.md
❌ RULE-REQ-003: DO NOT generate or modify backend_task.md
❌ RULE-REQ-004: DO NOT generate or modify validation_task.md
❌ RULE-REQ-005: DO NOT write or suggest any source code
❌ RULE-REQ-006: DO NOT make API design decisions
❌ RULE-REQ-007: DO NOT make database schema decisions
❌ RULE-REQ-008: DO NOT modify files of any other intent
```

## Mandatory Rules

```
✅ RULE-REQ-101: MUST generate intent.md before signaling completion
✅ RULE-REQ-102: MUST update intents.yaml status fields
✅ RULE-REQ-103: MUST infer implicit requirements (not just state the obvious)
✅ RULE-REQ-104: MUST explicitly define Out of Scope section
✅ RULE-REQ-105: MUST define security expectations as business requirements (not implementation)
✅ RULE-REQ-106: MUST assign a new intent_id following the naming convention
```

## Intent ID Naming Convention

Format: `{DOMAIN}_{NUMBER}`

Examples:
- `AUTH_001` — First authentication intent
- `AUTH_002` — Second authentication intent
- `USER_001` — First user management intent
- `DASHBOARD_001` — First dashboard intent
- `PAYMENT_001` — First payment intent

The number is sequential within the domain. Check `intents.yaml` for existing IDs before assigning.

## Quality Standards

**intent.md is considered COMPLETE only when:**
- [ ] Business objective is stated in non-technical language
- [ ] All inferred requirements are listed (not just explicit ones)
- [ ] Edge cases table has at least 5 entries for any non-trivial feature
- [ ] Security expectations are stated as requirements, not implementation details
- [ ] Out of Scope section explicitly lists at least 3 things
- [ ] UX expectations describe all 3 states: success, error, loading

## Escalation Rule

If any requirement is fundamentally ambiguous and cannot be inferred with high confidence:
- Document the ambiguity clearly in `intent.md` under a `## Open Questions` section
- DO NOT make up an answer
- Flag for human governor review by setting a comment in `intents.yaml`:
  ```yaml
  notes: "HUMAN REVIEW NEEDED: [describe the ambiguity]"
  ```
