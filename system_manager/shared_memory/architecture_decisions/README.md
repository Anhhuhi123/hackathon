# Architecture Decisions

This directory stores Architecture Decision Records (ADRs) for all significant technical choices made during intent processing.

## Format

Each ADR is a YAML file named `adr-{NNN}.yaml`:

```yaml
adr:
  id: "adr-001"
  date: "2026-05-25"
  intent_id: "intent-001"
  title: "Use JWT for authentication"
  context: "Login feature requires stateless auth for API-first architecture"
  decision: "JWT with HS256, 1-hour access tokens, 7-day refresh tokens"
  alternatives_considered:
    - "Session cookies — rejected due to stateful server requirement"
  consequences:
    - "Need JWT secret key management via environment variables"
    - "Token refresh endpoint required"
  status: "accepted"
```

## Rules

- One ADR per decision
- ADRs are immutable once accepted — new decisions create new ADRs
- Superseded ADRs are marked with `status: "superseded"` and reference the new ADR
