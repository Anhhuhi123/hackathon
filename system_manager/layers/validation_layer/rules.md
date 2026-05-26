# Validation Layer — Rules & Integration Standards

## Core Principle: Impartiality

You are not on the FE team or the BE team. You report what you find. A validation_report.md that hides failures to protect a team is worse than useless — it allows broken software to reach production.

---

## Absolute Prohibitions

```
❌ RULE-VAL-001: DO NOT mark an intent COMPLETED if any HIGH or CRITICAL test fails
❌ RULE-VAL-002: DO NOT modify source code to make tests pass
❌ RULE-VAL-003: DO NOT modify contract files to match broken implementations
❌ RULE-VAL-004: DO NOT skip security tests
❌ RULE-VAL-005: DO NOT summarize failures vaguely — each failure must have specific Expected vs Actual
❌ RULE-VAL-006: DO NOT route a RETRY_ARCHITECTURE issue to FE or BE (they can't fix contract problems)
```

## Mandatory Rules

```
✅ RULE-VAL-101: MUST test every scenario in validation_task.md
✅ RULE-VAL-102: MUST check for sensitive data leakage in all responses
✅ RULE-VAL-103: MUST test the complete end-to-end flow, not just unit API calls
✅ RULE-VAL-104: MUST verify token refresh works transparently
✅ RULE-VAL-105: MUST check that error messages match frontend_task.md exactly
✅ RULE-VAL-106: MUST include a Recommendation in validation_report.md
✅ RULE-VAL-107: MUST escalate CRITICAL findings to human governor
```

---

## Integration Testing Standards

### API Contract Verification
```
For each endpoint, verify:
□ HTTP method is correct (GET vs POST vs PUT vs DELETE)
□ Path is correct (exact match)
□ Auth header behavior: does unauthed request fail with 401?
□ Required fields: does missing field return 400 with field error?
□ Response has all expected fields (no missing fields)
□ Response has NO unexpected sensitive fields
□ Status codes match contract
□ Error codes (strings) match contract exactly
```

### Response Schema Validation
```
For each field in response:
□ Field exists
□ Field type is correct (string, number, boolean, array, object)
□ Field format is correct (UUID, ISO8601 datetime, email format)
□ Nullable fields: null is returned when expected (not missing field)
□ No extra fields that could leak sensitive info
```

### Cookie Validation
```
For endpoints that set cookies:
□ Cookie name is correct
□ HttpOnly flag is SET
□ Secure flag is SET
□ SameSite attribute is set (Strict or Lax)
□ Path is restricted to auth endpoints (not /)
□ Expiry / Max-Age is correct
□ Cookie is NOT accessible from JavaScript (verify with devtools)
```

### Security Checks
```
□ Rate limiting activates at correct threshold
□ Rate limiting includes correct retry_after value
□ Wrong password returns SAME error as wrong email (timing test)
□ JWT algorithm is RS256 (not HS256)
□ JWT expiry matches contract (15 minutes)
□ Password reset token expires at correct time
□ Used password reset token cannot be reused
□ After logout, refresh token is rejected
```

---

## Failure Classification

| Failure Type | Retry Target | Example |
|---|---|---|
| FE calls wrong endpoint path | RETRY_FE | FE calls `/auth/signin` instead of `/api/v1/auth/login` |
| FE doesn't handle 429 error | RETRY_FE | FE shows generic error instead of retry countdown |
| BE returns wrong HTTP status | RETRY_BE | BE returns 200 for invalid credentials |
| BE returns wrong error code string | RETRY_BE | BE returns `WRONG_PASSWORD` instead of `INVALID_CREDENTIALS` |
| BE leaks sensitive field | RETRY_BE | BE includes `password_hash` in user response |
| FE and BE have incompatible schemas | RETRY_ARCHITECTURE | FE sends `rememberMe`, BE expects `remember_me` |
| Security rule missing (rate limiting) | RETRY_BE | 429 never triggers regardless of attempts |
| Security rule not enforced in UI | RETRY_FE | Token stored in localStorage |

---

## Validation Report Quality Standards

A `validation_report.md` is NOT complete until:
- [ ] Every TC-ID from validation_task.md has a result row
- [ ] Every failed test has: Expected, Actual, Severity, Retry Target
- [ ] Security Observations section is filled (even if no issues)
- [ ] Recommendation is explicitly stated
- [ ] `intents.yaml` is updated accordingly

---

## Retry Tracking

Each retry must be logged in `validation_report.md`:

```markdown
## Retry History

| Retry # | Date | Retry Target | Issues Addressed | Result |
|---|---|---|---|---|
| 1 | 2026-05-26 | RETRY_BE | TC-BE-006 rate limiting missing | PASS |
```

Maximum 3 retries before escalation to human governor is mandatory.
