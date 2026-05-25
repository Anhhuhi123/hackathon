# Intent Layer — Inference Rules

## Purpose

These rules define how the intent layer infers implicit requirements from raw human intent. The goal is deterministic, consistent decomposition: the same intent should produce the same decomposition every time.

## Rule 1: Authentication Inference

**Trigger:** Intent contains any of: "login", "sign in", "authentication", "user account"

**Infer:**
- `user_login` — Email/password authentication
- `user_registration` — Account creation (unless intent explicitly says "login only")
- `forgot_password` — Password recovery
- `input_validation` — Email format, password strength
- `persistent_user_storage` — Database requirement for users

**Example:**
```
"I want a login page" →
  [user_login, user_registration, forgot_password, input_validation]
```

## Rule 2: CRUD Inference

**Trigger:** Intent describes managing a resource (e.g., "manage products", "add/edit/delete items")

**Infer:**
- `list_{resource}` — Paginated list view
- `create_{resource}` — Creation form + API
- `view_{resource}` — Detail/read view
- `update_{resource}` — Edit form + API
- `delete_{resource}` — Delete confirmation + API
- `{resource}_validation` — Input validation for create/update

**Example:**
```
"I want to manage products" →
  [list_products, create_product, view_product, update_product, delete_product, product_validation]
```

## Rule 3: Dashboard Inference

**Trigger:** Intent contains "dashboard", "overview", "analytics", "metrics"

**Infer:**
- `data_aggregation_api` — Backend aggregation endpoint
- `dashboard_ui` — Chart/metric display components
- `date_range_filter` — Time period selection
- `data_refresh` — Mechanism to update displayed data

**Example:**
```
"Show me a revenue dashboard" →
  [data_aggregation_api, dashboard_ui, date_range_filter, data_refresh]
```

## Rule 4: List/Table Inference

**Trigger:** Intent describes displaying multiple items of the same type

**Infer:**
- `list_api` — Paginated API endpoint
- `list_ui` — Table or card list component
- `search_filter` — Text search or filter controls (if more than trivial data)
- `pagination` — Page navigation controls

## Rule 5: Form Inference

**Trigger:** Intent involves user input (create, edit, submit)

**Infer:**
- `form_ui` — Form component with labeled fields
- `client_validation` — Frontend validation before submission
- `server_validation` — Backend validation on the API
- `error_display` — Show validation errors to user
- `success_feedback` — Confirmation after successful submission

## Rule 6: Implicit Security

**Trigger:** Any feature that creates, modifies, or deletes data

**Infer:**
- `authentication_required` — Endpoint requires auth token
- `authorization_check` — User must own or have permission for the resource

This rule generates a flag on the feature, not a separate feature.

## Rule 7: Ambiguity Escalation

**Trigger:** Intent matches multiple interpretations with different implementation paths

**Action:** Do NOT pick one. Escalate with structured options.

**Example:**
```
"I want social login" →
  ESCALATE:
    - Option A: Google OAuth only
    - Option B: Google + GitHub OAuth
    - Option C: Google + GitHub + Apple OAuth
    Question: "Which social login providers do you want to support?"
```

## Rule Application Order

1. Apply trigger matching (Rules 1-5)
2. Apply security inference (Rule 6) to each generated feature
3. Check for ambiguity (Rule 7)
4. If ambiguity exists, stop and escalate
5. If no ambiguity, compile features and declare dependencies
