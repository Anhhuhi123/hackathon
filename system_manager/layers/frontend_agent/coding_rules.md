# Frontend Agent — Coding Rules

## Identity

The frontend agent implements user-facing interfaces based on contracts and feature descriptions received from the execution planner.

## What This Agent Does

1. Build UI pages and components from feature descriptions
2. Implement client-side form validation from API contract constraints
3. Create API client functions from API contracts
4. Handle loading, error, and empty states
5. Follow accessibility and responsive design basics

## What This Agent Does NOT Do

- Make architectural decisions
- Add endpoints or API calls not in the contract
- Implement business logic (that belongs in the backend)
- Choose libraries or frameworks (use what's defined in architectural policy)

## Coding Standards

### Component Structure

```
src/
├── pages/           # Full page components (one per feature UI)
│   ├── LoginPage.tsx
│   └── ForgotPasswordPage.tsx
├── components/      # Reusable UI components
│   ├── FormInput.tsx
│   └── ErrorMessage.tsx
├── api/             # API client functions (one per endpoint)
│   └── auth.ts
├── validation/      # Client-side validation rules
│   └── authValidation.ts
└── types/           # TypeScript types derived from contracts
    └── auth.ts
```

### File Naming

- Pages: `{FeatureName}Page.tsx` (PascalCase)
- Components: `{ComponentName}.tsx` (PascalCase)
- API clients: `{domain}.ts` (camelCase)
- Types: `{domain}.ts` (camelCase)
- Styles: `{ComponentName}.css` (PascalCase, co-located)

### Type Derivation from Contracts

Every API contract becomes TypeScript types:

```typescript
// From API contract for POST /api/auth/login
// Request type
interface LoginRequest {
  email: string;
  password: string;
}

// Success response type
interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Error response type
interface ApiError {
  error: string;
  code: string;
  details?: Record<string, string>;
}
```

### API Client Pattern

```typescript
// src/api/auth.ts
const API_BASE = '/api';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw error;
  }

  return response.json();
}
```

### Validation Rules

Client-side validation must mirror the contract constraints exactly:

```typescript
// From contract: email { format: "email", max_length: 255 }
// From contract: password { min_length: 8, max_length: 128 }

export function validateLoginForm(data: LoginRequest): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  } else if (data.email.length > 255) {
    errors.email = 'Email must be 255 characters or less';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (data.password.length > 128) {
    errors.password = 'Password must be 128 characters or less';
  }

  return errors;
}
```

### UI State Management

Every form/page must handle these states:

| State | UI Behavior |
|-------|------------|
| `idle` | Form is ready for input |
| `submitting` | Submit button disabled, show loading indicator |
| `success` | Show success message or redirect |
| `error` | Show error message from API response |
| `validation_error` | Show field-level validation errors |

### Error Handling

Map contract error codes to user-facing messages:

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  'INVALID_CREDENTIALS': 'Incorrect email or password. Please try again.',
  'VALIDATION_ERROR': 'Please fix the errors below.',
  'CONFLICT': 'An account with this email already exists.',
  'INTERNAL_ERROR': 'Something went wrong. Please try again later.',
};
```

## Contract Compliance Checklist

Before submitting an `implementation_artifact`, the frontend agent verifies:

- [ ] All API calls match the contract method, path, and request body
- [ ] All response fields used in the UI match the contract response schema
- [ ] Client-side validation constraints match the contract constraints
- [ ] All error codes from the contract have user-facing messages
- [ ] Form handles all defined response status codes
- [ ] Types are derived directly from the contract (no ad-hoc types)
- [ ] No API calls to endpoints not in the contract
