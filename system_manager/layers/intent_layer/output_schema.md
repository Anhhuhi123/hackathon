# Intent Layer — Output Schema

## Purpose

Defines the exact structure of the `intent_decomposition` message that the intent layer sends to the architecture layer. This schema is non-negotiable — the architecture layer rejects any message that doesn't conform.

## Schema

```yaml
intent_decomposition:
  intent_id: string               # Required. The originating intent ID.
  raw_intent: string              # Required. The original human input, verbatim.
  confidence: float               # Required. 0.0 to 1.0. How confident the agent is in this decomposition.

  decomposed_features:            # Required. Minimum 1 feature.
    - feature_id: string          # Required. Format: "feat-{NNN}"
      name: string                # Required. snake_case identifier.
      description: string         # Required. One sentence, plain English.
      category: enum              # Required. One of:
                                  #   "authentication", "crud", "ui",
                                  #   "validation", "integration", "infrastructure"
      requires_api: boolean       # Required. Does this feature need a backend API?
      requires_ui: boolean        # Required. Does this feature need a frontend screen?
      requires_db: boolean        # Required. Does this feature need database changes?
      auth_required: boolean      # Required. Does this feature require authenticated access?

  inferred_dependencies:          # Required. List of infrastructure/cross-cutting needs.
    - string                      # Plain English description of each dependency.

  feature_dependencies:           # Required. Can be empty list.
    - dependent: string           # feature_id that depends on another
      depends_on: string | null   # feature_id it depends on, or null if independent
      reason: string              # Why this dependency exists

  ambiguities:                    # Optional. Present only if escalation needed.
    - question: string            # What needs clarification
      options:                    # Possible resolutions
        - option_id: string
          description: string
          impact: string          # How this choice affects the decomposition
```

## Validation Rules

1. `intent_id` must match an entry in `intent_registry/active_intents.yaml`
2. `confidence` below 0.7 triggers automatic escalation to human governor
3. Every `feature_id` must be unique within the decomposition
4. At least one feature must have `requires_api: true`
5. Every feature with `requires_db: true` must also have `requires_api: true`
6. If `ambiguities` is present and non-empty, the message is treated as an escalation — no downstream processing until resolved
7. `category` must be one of the defined enum values

## Example Output

```yaml
intent_decomposition:
  intent_id: "intent-001"
  raw_intent: "I want a login page"
  confidence: 0.92

  decomposed_features:
    - feature_id: "feat-001"
      name: "user_login"
      description: "Authenticate user with email and password, return auth token"
      category: "authentication"
      requires_api: true
      requires_ui: true
      requires_db: true
      auth_required: false

    - feature_id: "feat-002"
      name: "forgot_password"
      description: "Allow user to request password reset via email"
      category: "authentication"
      requires_api: true
      requires_ui: true
      requires_db: false
      auth_required: false

    - feature_id: "feat-003"
      name: "login_form_validation"
      description: "Client and server-side validation for login form inputs"
      category: "validation"
      requires_api: true
      requires_ui: true
      requires_db: false
      auth_required: false

    - feature_id: "feat-004"
      name: "user_registration"
      description: "Allow new users to create an account with email and password"
      category: "authentication"
      requires_api: true
      requires_ui: true
      requires_db: true
      auth_required: false

  inferred_dependencies:
    - "Persistent user storage with email and hashed password fields"
    - "Token-based stateless authentication mechanism"
    - "Email delivery service for password reset"

  feature_dependencies:
    - dependent: "feat-002"
      depends_on: "feat-001"
      reason: "Password reset requires existing user storage created by login feature"
    - dependent: "feat-003"
      depends_on: null
      reason: "Validation rules are defined independently"
    - dependent: "feat-004"
      depends_on: null
      reason: "Registration is independent but shares user storage with login"
```
