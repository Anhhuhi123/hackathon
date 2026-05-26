# Frontend Agent — Rules & Coding Conventions

## Core Principle: Contract Adherence > Code Elegance

Your job is to implement the contract correctly. Elegant code that breaks the contract is a failure. Simple code that fulfills the contract is a success.

---

## Absolute Prohibitions

```
❌ RULE-FE-001: DO NOT store access tokens in localStorage or sessionStorage
❌ RULE-FE-002: DO NOT communicate directly with BE team or BE source
❌ RULE-FE-003: DO NOT modify backend source code
❌ RULE-FE-004: DO NOT modify contract files (*.md, *.yaml in system_manager)
❌ RULE-FE-005: DO NOT call APIs not listed in frontend_task.md
❌ RULE-FE-006: DO NOT hardcode API base URLs (use environment variables)
❌ RULE-FE-007: DO NOT swallow errors silently (every error must be handled visibly or logged)
❌ RULE-FE-008: DO NOT allow forms to submit twice (double-submit prevention required)
```

## Mandatory Rules

```
✅ RULE-FE-101: MUST handle ALL error status codes defined in frontend_task.md
✅ RULE-FE-102: MUST implement auto token refresh before access token expires
✅ RULE-FE-103: MUST use credentials: 'include' on all API calls
✅ RULE-FE-104: MUST show loading state on every async operation
✅ RULE-FE-105: MUST implement protected routes (redirect unauthenticated users)
✅ RULE-FE-106: MUST preserve redirect URL before sending to /login
✅ RULE-FE-107: MUST validate forms client-side before API call
```

---

## UI/UX Conventions

### Component Hierarchy
```
pages/          ← Route-level components (one per URL path)
components/     ← Reusable UI components
  auth/         ← Auth-specific components
  common/       ← Shared components (Button, Input, Spinner, etc.)
stores/         ← State management
hooks/          ← Custom hooks
lib/            ← Utilities (apiClient, tokenManager, etc.)
```

### Loading State Pattern
```jsx
// Standard pattern for async actions:
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async () => {
  setIsLoading(true)
  try {
    await apiCall()
    // handle success
  } catch (error) {
    // handle error
  } finally {
    setIsLoading(false)  // ALWAYS reset, even on error
  }
}

// Button implementation:
<button disabled={isLoading}>
  {isLoading ? <Spinner /> : 'Submit'}
</button>
```

### Error Display Pattern
```
Field-level error (validation):
  <input />
  <span class="field-error">{error}</span>

Form-level error (API error):
  <div class="form-error">
    <ErrorIcon />
    <span>{errorMessage}</span>
  </div>
  ... (form fields below)

Toast notification (success only):
  Toast.success("Saved successfully")
```

### Error Code → User Message Mapping
```javascript
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
  EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng.",
  RATE_LIMIT_EXCEEDED: "Quá nhiều lần thử. Vui lòng thử lại sau.",
  REFRESH_TOKEN_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  INVALID_OR_EXPIRED_TOKEN: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
  // Default fallback:
  DEFAULT: "Đã xảy ra lỗi. Vui lòng thử lại."
}
```

---

## Code Quality Standards

### Accessibility
- All form inputs must have associated `<label>` elements
- Errors must be announced to screen readers (aria-live or aria-describedby)
- Interactive elements must be keyboard-navigable

### Responsive Design
- All pages must work on mobile (≥320px), tablet (≥768px), desktop (≥1024px)
- Test critical flows on mobile viewport

### Environment Variables
```
NEXT_PUBLIC_API_URL=   or   VITE_API_URL=
```
Never hardcode: `http://localhost:8000` in source code.

---

## Contract Deviation Protocol

If you discover that the API does not match `architecture.md`:
1. **Do NOT change your implementation to match the broken API**
2. Document the discrepancy in a comment: `// CONTRACT MISMATCH: expected X, got Y`
3. Update `intents.yaml` notes field: `"FE: API deviation found at POST /api/v1/auth/login"`
4. Validation Layer will catch this and route it appropriately
