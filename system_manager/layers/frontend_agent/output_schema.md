# Frontend Agent — Output Schema

## Purpose

Defines the exact structure of the `implementation_artifact` message that the frontend agent produces after completing a task.

## Schema

```yaml
implementation_artifact:
  intent_id: string              # Required
  task_id: string                # Required. The task_id from the assignment.
  agent: "frontend_agent"        # Fixed value
  completed_at: string           # ISO 8601

  artifact_type: enum            # "ui_component" | "api_client" | "validation" | "types"

  files:                         # Required. Minimum 1 file.
    - path: string               # Relative path from project root (e.g., "src/pages/LoginPage.tsx")
      language: string           # "typescript" | "css" | "html"
      content: string            # Full file content
      purpose: string            # Brief description of what this file does

  contract_ref: string           # Contract ID this task implements

  derived_types:                 # Types generated from contracts
    - type_name: string          # e.g., "LoginRequest"
      source_contract: string    # Contract ID this type derives from
      fields:
        - name: string
          type: string
          required: boolean

  api_calls_made:                # All API calls this code makes
    - endpoint: string           # e.g., "POST /api/auth/login"
      contract_ref: string       # Must match an existing API contract
      request_fields: [string]   # Fields sent in the request
      response_fields_used: [string]  # Response fields the UI reads

  validation_rules_applied:      # Client-side validation implemented
    - field: string
      rules:
        - rule: string           # e.g., "required", "min_length:8", "format:email"
          source: string         # Contract field reference

  self_assessment:
    contract_compliance: boolean  # Does the implementation match the contract?
    known_gaps: [string]          # Anything the agent couldn't implement
    ui_states_handled:            # Which states the UI covers
      - "idle"
      - "submitting"
      - "success"
      - "error"
      - "validation_error"
```

## Example Output

```yaml
implementation_artifact:
  intent_id: "intent-001"
  task_id: "task-fe-001"
  agent: "frontend_agent"
  completed_at: "2026-05-25T11:15:00Z"

  artifact_type: "ui_component"

  files:
    - path: "src/pages/LoginPage.tsx"
      language: "typescript"
      content: |
        import React, { useState } from 'react';
        import { login } from '../api/auth';
        import { validateLoginForm } from '../validation/authValidation';
        import { LoginRequest } from '../types/auth';
        import './LoginPage.css';

        export function LoginPage() {
          const [form, setForm] = useState<LoginRequest>({ email: '', password: '' });
          const [errors, setErrors] = useState<Record<string, string>>({});
          const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
          const [apiError, setApiError] = useState('');

          const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            const validationErrors = validateLoginForm(form);
            if (Object.keys(validationErrors).length > 0) {
              setErrors(validationErrors);
              return;
            }
            setStatus('submitting');
            try {
              const response = await login(form);
              localStorage.setItem('access_token', response.access_token);
              setStatus('success');
            } catch (err: any) {
              setApiError(err.error || 'Something went wrong');
              setStatus('error');
            }
          };

          return (
            <div className="login-page">
              <form onSubmit={handleSubmit}>
                <h1>Sign In</h1>
                {apiError && <div className="error-banner">{apiError}</div>}
                <div className="form-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
                <div className="form-field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                  />
                  {errors.password && <span className="field-error">{errors.password}</span>}
                </div>
                <button type="submit" disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Signing in...' : 'Sign In'}
                </button>
                <a href="/forgot-password">Forgot password?</a>
              </form>
            </div>
          );
        }
      purpose: "Login page with email/password form, validation, and error handling"

    - path: "src/pages/LoginPage.css"
      language: "css"
      content: |
        .login-page { max-width: 400px; margin: 80px auto; padding: 2rem; }
        .form-field { margin-bottom: 1rem; }
        .form-field label { display: block; margin-bottom: 0.25rem; font-weight: 600; }
        .form-field input { width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
        .field-error { color: #dc2626; font-size: 0.875rem; }
        .error-banner { background: #fef2f2; border: 1px solid #dc2626; padding: 0.75rem; border-radius: 4px; color: #dc2626; margin-bottom: 1rem; }
        button { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
      purpose: "Styles for login page"

  contract_ref: "api-001"

  derived_types:
    - type_name: "LoginRequest"
      source_contract: "api-001"
      fields:
        - { name: "email", type: "string", required: true }
        - { name: "password", type: "string", required: true }
    - type_name: "LoginResponse"
      source_contract: "api-001"
      fields:
        - { name: "access_token", type: "string", required: true }
        - { name: "refresh_token", type: "string", required: true }
        - { name: "expires_in", type: "number", required: true }

  api_calls_made:
    - endpoint: "POST /api/auth/login"
      contract_ref: "api-001"
      request_fields: ["email", "password"]
      response_fields_used: ["access_token"]

  validation_rules_applied:
    - field: "email"
      rules:
        - { rule: "required", source: "api-001.request.body.email.required" }
        - { rule: "format:email", source: "api-001.request.body.email.constraints.format" }
        - { rule: "max_length:255", source: "api-001.request.body.email.constraints.max_length" }
    - field: "password"
      rules:
        - { rule: "required", source: "api-001.request.body.password.required" }
        - { rule: "min_length:8", source: "api-001.request.body.password.constraints.min_length" }
        - { rule: "max_length:128", source: "api-001.request.body.password.constraints.max_length" }

  self_assessment:
    contract_compliance: true
    known_gaps: []
    ui_states_handled:
      - "idle"
      - "submitting"
      - "success"
      - "error"
      - "validation_error"
```
