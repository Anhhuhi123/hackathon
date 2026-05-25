# Engineering Principles

## 1. Contract-First Development

Every feature begins with a contract, not with code.

- API endpoints are defined as contracts before any implementation
- Database schemas are defined as contracts before any migration
- Frontend components receive typed props derived from API contracts
- No agent writes code that contradicts an active contract

**Example:**

```yaml
# This contract exists BEFORE any code is written
endpoint: POST /api/auth/login
request:
  body:
    email: string (required, format: email)
    password: string (required, min: 8)
response:
  200:
    access_token: string (JWT)
    refresh_token: string
    expires_in: integer (seconds)
  401:
    error: string
    code: "INVALID_CREDENTIALS"
```

## 2. Intent Isolation

Each intent is processed independently. Agents do not carry state between intents unless explicitly stored in shared memory.

- Intent A's execution does not leak into Intent B
- Shared dependencies are tracked in `intent_registry/dependency_graph.yaml`
- If Intent B depends on Intent A, the dependency is declared explicitly

## 3. Parallel by Default

Frontend and backend work execute in parallel whenever possible.

- Architecture layer produces contracts that decouple FE and BE work
- FE agent works against API contract stubs
- BE agent implements the actual API
- Validation layer verifies both sides match

## 4. Deterministic Communication

All inter-agent messages follow strict schemas. No free-form text exchange between agents during execution.

- Every message has a `type`, `source`, `target`, and `payload`
- Payloads conform to the output schema of the sending agent
- Receiving agents reject messages that fail schema validation

## 5. Fail Fast, Record Always

When an agent encounters an ambiguity or conflict:

1. Stop execution immediately
2. Emit a structured error message
3. Record the failure in `shared_memory/learned_failures/`
4. Escalate to human governor if unresolvable

**Never guess. Never assume. Never silently skip.**

## 6. Minimal Viable Implementation

Agents produce the simplest correct implementation that satisfies the contract.

- No premature optimization
- No speculative features
- No patterns beyond what the contract requires
- If the contract says "return a list", return a list — not a paginated, cached, rate-limited list

## 7. Architecture as Law

The architecture layer's output is authoritative. Execution agents cannot:

- Add endpoints not in the API contract
- Create database tables not in the DB contract
- Introduce dependencies not approved in the architecture decision
- Modify contracts (only architecture layer can do this)

## 8. Human Override at Any Point

Humans can:

- Reject any contract and request regeneration
- Pause execution at any layer
- Modify architectural decisions directly
- Override agent outputs

Agent outputs are proposals. Human approval makes them authoritative.
