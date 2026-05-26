# Architecture Layer — Governance Rules

## Core Principle: Contract-First

The contract is more valuable than the code. A perfect implementation of a wrong contract is worthless. A perfect contract with an imperfect implementation can be fixed. An absent or ambiguous contract causes entire teams to build in the wrong direction.

---

## Absolute Prohibitions

```
❌ RULE-ARCH-001: DO NOT write application source code
❌ RULE-ARCH-002: DO NOT modify intent.md
❌ RULE-ARCH-003: DO NOT modify validation_report.md
❌ RULE-ARCH-004: DO NOT break existing API contracts without explicit version bump
❌ RULE-ARCH-005: DO NOT design endpoints without fully reading intent.md first
❌ RULE-ARCH-006: DO NOT allow FE and BE to have different understandings of the same contract
```

## Mandatory Rules

```
✅ RULE-ARCH-101: MUST generate architecture.md BEFORE frontend_task.md or backend_task.md
✅ RULE-ARCH-102: MUST define ALL error response schemas (not just happy path)
✅ RULE-ARCH-103: MUST define exact HTTP status codes for every scenario
✅ RULE-ARCH-104: MUST define authentication requirements per endpoint
✅ RULE-ARCH-105: MUST update dependency_graph.yaml
✅ RULE-ARCH-106: MUST generate validation_task.md (cannot be skipped)
✅ RULE-ARCH-107: MUST mark architecture.md with version number and LOCKED status
```

---

## API Consistency Standards

### URL Conventions
```
✅ Use kebab-case for multi-word paths: /password-reset NOT /passwordReset
✅ Use plural nouns for collections: /users NOT /user
✅ Use versioned base: /api/v1/{resource}
✅ Use nested paths for relationships: /users/{id}/sessions
❌ DO NOT use verbs in URLs (except auth: /auth/login is acceptable)
```

### Request/Response Standards
```
✅ All request bodies: application/json
✅ All responses: application/json
✅ All datetimes: ISO8601 (YYYY-MM-DDTHH:MM:SSZ)
✅ All IDs: UUID v4
✅ Error codes: CAPS_SNAKE_CASE
✅ Error format always: { error: "CODE", message: "...", fields?: {} }
❌ DO NOT return 200 for errors
❌ DO NOT return raw strings (always JSON)
❌ DO NOT include sensitive fields in responses (passwords, hashes, internal IDs)
```

---

## Schema Consistency Rules

All schemas across all intents must use consistent field naming:

| Concept | Field Name |
|---|---|
| Primary identifier | `id` (UUID) |
| Creation timestamp | `created_at` |
| Update timestamp | `updated_at` |
| User identifier | `user_id` |
| Pagination cursor | `cursor` |
| Page size | `limit` |
| Total count | `total` |

---

## Backward Compatibility

When modifying an existing API contract:

| Change Type | Rule |
|---|---|
| Adding optional field to response | ✅ Non-breaking — allowed |
| Adding optional field to request | ✅ Non-breaking — allowed |
| Removing field from response | ❌ Breaking — bump to v2 |
| Changing field type | ❌ Breaking — bump to v2 |
| Changing error codes | ❌ Breaking — update all affected frontend_task.md |
| Changing HTTP status codes | ❌ Breaking — update all affected frontend_task.md |

---

## Completeness Checklist

`architecture.md` is NOT complete until:
- [ ] Every endpoint has: method, path, auth requirement
- [ ] Every endpoint has: full request schema
- [ ] Every endpoint has: response schema for EVERY status code (200, 400, 401, 403, 409, 429, 500)
- [ ] Database tables are defined with column types and constraints
- [ ] Security strategy is explicitly stated (algorithm, token type, storage)
- [ ] Environment variables are listed

`frontend_task.md` is NOT complete until:
- [ ] Code examples for request format
- [ ] Handler code for every response case (success, each error type)
- [ ] All loading states described
- [ ] All validation rules listed
- [ ] All pages/components listed
- [ ] State management shape defined

`backend_task.md` is NOT complete until:
- [ ] Step-by-step business logic for each endpoint
- [ ] Security rule per endpoint
- [ ] All environment variables listed

`validation_task.md` is NOT complete until:
- [ ] At least 1 test per endpoint (happy path)
- [ ] At least 1 test per error scenario
- [ ] At least 1 integration test (FE + BE together)
- [ ] Security-specific tests (at minimum: auth, rate limiting, sensitive data)
